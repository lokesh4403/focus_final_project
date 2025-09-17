const express = require('express');
const nodemailer = require('nodemailer');
require('dotenv').config();

const router = express.Router();

router.get('/send-test-email', async (req, res) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"PayrollPro" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER,
      subject: '✅ Test Email from Payroll System',
      text: 'This is a test email sent from the Payroll system using Gmail SMTP.',
    });

    res.send('✅ Test email sent successfully!');
  } catch (error) {
    console.error('❌ Email send error:', error);
    res.status(500).send('❌ Failed to send test email.');
  }
});

module.exports = router;
