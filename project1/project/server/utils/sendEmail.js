const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendEmail({ to, subject, text }) {
  const mailOptions = {
    from: `"PayrollPro" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log('📨 Email sent:', info.messageId);
}

module.exports = sendEmail;
