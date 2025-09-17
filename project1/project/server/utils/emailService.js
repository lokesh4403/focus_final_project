const nodemailer = require('nodemailer');
const moment = require('moment');
const db = require('../config/database');

// Create email transporter
const createTransporter = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('SMTP configuration missing in .env');
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: false, // true for port 465
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Log email activity
async function logEmail(recipient, subject, type, status, errorMessage = null) {
  try {
    await db.execute(
      `INSERT INTO email_logs (recipient, subject, type, status, error_message, sent_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        recipient,
        subject,
        type,
        status,
        errorMessage,
        status === 'sent' ? new Date() : null,
      ]
    );
  } catch (error) {
    console.error('Error logging email:', error);
  }
}

// Send payslip email
async function sendPayslipEmail(payrollData, pdfBuffer) {
  const transporter = createTransporter();
  const monthYear = moment(payrollData.month).format('MMMM YYYY');
  const subject = `Payslip for ${monthYear} - ${payrollData.employee_name}`;

  const htmlContent = `
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header, .footer { background-color: #f8f9fa; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .highlight { background-color: #e3f2fd; padding: 10px; border-radius: 5px; margin: 10px 0; }
        </style>
    </head>
    <body>
        <div class="header"><h2>${process.env.COMPANY_NAME}</h2><p>Payslip for ${monthYear}</p></div>
        <div class="content">
            <p>Dear ${payrollData.employee_name},</p>
            <p>Please find attached your payslip for ${monthYear}.</p>
            <div class="highlight">
                <strong>Salary Summary:</strong><br>
                Gross Salary: ₹${(parseFloat(payrollData.basic_salary) + parseFloat(payrollData.allowances)).toLocaleString()}<br>
                Total Deductions: ₹${parseFloat(payrollData.deductions).toLocaleString()}<br>
                <strong>Net Salary: ₹${parseFloat(payrollData.net_salary).toLocaleString()}</strong>
            </div>
            <p>For questions, contact HR.</p>
            <p>Best regards,<br>HR Department<br>${process.env.COMPANY_NAME}</p>
        </div>
        <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
            <p>© ${new Date().getFullYear()} ${process.env.COMPANY_NAME}</p>
        </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"${process.env.COMPANY_NAME} HR" <${process.env.SMTP_USER}>`,
    to: payrollData.employee_email,
    subject,
    html: htmlContent,
    attachments: [
      {
        filename: `payslip-${payrollData.employee_name}-${moment(payrollData.month).format('YYYY-MM')}.pdf`,
        content: Buffer.from(pdfBuffer),
        contentType: 'application/pdf',
      },
    ],
  };

  try {
    await transporter.sendMail(mailOptions);
    await logEmail(payrollData.employee_email, subject, 'payslip', 'sent');
    console.log(`Payslip sent to ${payrollData.employee_email}`);
  } catch (error) {
    await logEmail(payrollData.employee_email, subject, 'payslip', 'failed', error.message);
    console.error('Error sending email:', error.message);
    throw error;
  }
}

// Send notification email
async function sendNotificationEmail(to, subject, message, type = 'notification') {
  const transporter = createTransporter();

  const htmlContent = `
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header, .footer { background-color: #f8f9fa; padding: 20px; text-align: center; }
            .content { padding: 20px; }
        </style>
    </head>
    <body>
        <div class="header"><h2>${process.env.COMPANY_NAME}</h2><p>Notification</p></div>
        <div class="content">
            <p>${message}</p>
            <p>Best regards,<br>${process.env.COMPANY_NAME} Team</p>
        </div>
        <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
            <p>© ${new Date().getFullYear()} ${process.env.COMPANY_NAME}</p>
        </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"${process.env.COMPANY_NAME} System" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html: htmlContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    await logEmail(to, subject, type, 'sent');
    console.log(`Notification sent to ${to}`);
  } catch (error) {
    await logEmail(to, subject, type, 'failed', error.message);
    console.error('Error sending email:', error.message);
    throw error;
  }
}

// Send bulk payslips
async function sendBulkPayslips(payrollRecords, pdfBuffers) {
  const results = [];

  for (let i = 0; i < payrollRecords.length; i++) {
    try {
      await sendPayslipEmail(payrollRecords[i], pdfBuffers[i]);
      results.push({ employee: payrollRecords[i].employee_name, status: 'sent' });
    } catch (error) {
      results.push({ employee: payrollRecords[i].employee_name, status: 'failed', error: error.message });
    }
  }

  return results;
}

module.exports = {
  sendPayslipEmail,
  sendNotificationEmail,
  sendBulkPayslips,
};
