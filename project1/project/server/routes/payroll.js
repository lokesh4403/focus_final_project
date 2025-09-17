const express = require('express');
const router = express.Router();
const db = require('../config/database');
const sendEmail = require('../utils/sendEmail'); // ✅ Common email utility

// ✅ Route: POST /api/payroll/generate
// Generate payroll entry and send email (no PDF)
router.post('/generate', async (req, res) => {
  const { employeeId, salary, month, year } = req.body;

  try {
    // 1. Fetch employee info
    const [employeeRows] = await db.query(
      'SELECT name, email FROM employees WHERE id = ?',
      [employeeId]
    );

    if (employeeRows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const { name, email } = employeeRows[0];

    // 2. Save payroll to DB
    await db.query(
      'INSERT INTO payrolls (employee_id, salary, month, year) VALUES (?, ?, ?, ?)',
      [employeeId, salary, month, year]
    );

    // 3. Send payslip email (simple text)
    await sendEmail({
      to: email,
      subject: `Payslip for ${month} ${year}`,
      text: `Hi ${name},\n\nYour payslip for ${month} ${year} has been generated.\n\n💰 Salary: ₹${salary}\n\nThank you,\nPayrollPro Team`
    });

    return res.json({ success: true, message: 'Payroll generated and payslip sent.' });

  } catch (error) {
    console.error('❌ Error generating payroll:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ✅ Route: POST /api/payroll/email-payslip
// Send payslip email with PDF attachment (optional, assumes PDF already exists)
router.post('/email-payslip', async (req, res) => {
  const { employeeId, month } = req.body;

  try {
    // 1. Fetch employee info
    const [rows] = await db.query('SELECT * FROM employees WHERE id = ?', [employeeId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Employee not found' });

    const employee = rows[0];

    // 2. Define path to payslip PDF
    const payslipPath = `./payslips/${employeeId}_${month}.pdf`; // Make sure file exists!

    // 3. Send email with PDF
    await sendEmail({
      to: employee.email,
      subject: `Payslip for ${month}`,
      text: `Dear ${employee.name},\n\nPlease find your payslip for ${month} attached.`,
      attachments: [
        {
          filename: `Payslip_${month}.pdf`,
          path: payslipPath
        }
      ]
    });

    return res.json({ message: 'Payslip with PDF sent successfully.' });

  } catch (error) {
    console.error('❌ Error sending payslip email with PDF:', error);
    return res.status(500).json({ error: 'Email sending failed' });
  }
});

module.exports = router;
