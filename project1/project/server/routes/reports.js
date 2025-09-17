const express = require('express');
const ExcelJS = require('exceljs');
const moment = require('moment');
const db = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { generatePayrollReportPDF } = require('../utils/pdfGenerator');

const router = express.Router();

// Generate payroll report (Excel)
router.get('/payroll/excel/:month', authenticateToken, requireRole(['admin', 'hr']), async (req, res) => {
  try {
    const { month } = req.params; // Format: YYYY-MM

    // Get payroll data
    const [payrollData] = await db.execute(`
      SELECT 
        p.*,
        e.name as employee_name,
        e.email as employee_email,
        e.role,
        e.joining_date
      FROM payroll p
      JOIN employees e ON p.employee_id = e.id
      WHERE DATE_FORMAT(p.month, '%Y-%m') = ?
      ORDER BY e.name
    `, [month]);

    if (payrollData.length === 0) {
      return res.status(404).json({ error: 'No payroll data found for this month' });
    }

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Payroll Report');

    // Add headers
    worksheet.columns = [
      { header: 'Employee ID', key: 'employee_id', width: 15 },
      { header: 'Employee Name', key: 'employee_name', width: 25 },
      { header: 'Role', key: 'role', width: 20 },
      { header: 'Basic Salary', key: 'basic_salary', width: 15 },
      { header: 'Allowances', key: 'allowances', width: 15 },
      { header: 'Gross Salary', key: 'gross_salary', width: 15 },
      { header: 'PF', key: 'pf', width: 10 },
      { header: 'ESI', key: 'esi', width: 10 },
      { header: 'LOP', key: 'lop', width: 10 },
      { header: 'Other Deductions', key: 'other_deductions', width: 15 },
      { header: 'Total Deductions', key: 'deductions', width: 15 },
      { header: 'Bonus', key: 'bonus', width: 10 },
      { header: 'Net Salary', key: 'net_salary', width: 15 },
      { header: 'Status', key: 'status', width: 10 }
    ];

    // Style headers
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Add data
    payrollData.forEach(record => {
      const grossSalary = parseFloat(record.basic_salary) + parseFloat(record.allowances);
      const otherDeductions = parseFloat(record.deductions) - parseFloat(record.pf) - parseFloat(record.esi) - parseFloat(record.lop);
      
      worksheet.addRow({
        employee_id: record.employee_id,
        employee_name: record.employee_name,
        role: record.role,
        basic_salary: parseFloat(record.basic_salary),
        allowances: parseFloat(record.allowances),
        gross_salary: grossSalary,
        pf: parseFloat(record.pf),
        esi: parseFloat(record.esi),
        lop: parseFloat(record.lop),
        other_deductions: otherDeductions,
        deductions: parseFloat(record.deductions),
        bonus: parseFloat(record.bonus),
        net_salary: parseFloat(record.net_salary),
        status: record.status
      });
    });

    // Add totals row
    const totalRow = worksheet.addRow({
      employee_name: 'TOTAL',
      basic_salary: { formula: `SUM(D2:D${payrollData.length + 1})` },
      allowances: { formula: `SUM(E2:E${payrollData.length + 1})` },
      gross_salary: { formula: `SUM(F2:F${payrollData.length + 1})` },
      pf: { formula: `SUM(G2:G${payrollData.length + 1})` },
      esi: { formula: `SUM(H2:H${payrollData.length + 1})` },
      lop: { formula: `SUM(I2:I${payrollData.length + 1})` },
      other_deductions: { formula: `SUM(J2:J${payrollData.length + 1})` },
      deductions: { formula: `SUM(K2:K${payrollData.length + 1})` },
      bonus: { formula: `SUM(L2:L${payrollData.length + 1})` },
      net_salary: { formula: `SUM(M2:M${payrollData.length + 1})` }
    });

    totalRow.font = { bold: true };
    totalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFD700' }
    };

    // Format currency columns
    ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'].forEach(col => {
      worksheet.getColumn(col).numFmt = '₹#,##0.00';
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="payroll-report-${month}.xlsx"`);

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Generate payroll Excel error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate attendance report (Excel)
router.get('/attendance/excel/:month', authenticateToken, requireRole(['admin', 'hr']), async (req, res) => {
  try {
    const { month } = req.params; // Format: YYYY-MM

    // Get attendance data
    const [attendanceData] = await db.execute(`
      SELECT 
        e.id as employee_id,
        e.name as employee_name,
        e.role,
        COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_days,
        COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_days,
        COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_days,
        COUNT(CASE WHEN a.status = 'half-day' THEN 1 END) as half_days,
        SUM(a.working_hours) as total_hours,
        AVG(a.working_hours) as avg_hours
      FROM employees e
      LEFT JOIN attendance a ON e.id = a.employee_id 
        AND DATE_FORMAT(a.date, '%Y-%m') = ?
      WHERE e.status = 'active'
      GROUP BY e.id, e.name, e.role
      ORDER BY e.name
    `, [month]);

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Attendance Report');

    // Add headers
    worksheet.columns = [
      { header: 'Employee ID', key: 'employee_id', width: 15 },
      { header: 'Employee Name', key: 'employee_name', width: 25 },
      { header: 'Role', key: 'role', width: 20 },
      { header: 'Present Days', key: 'present_days', width: 15 },
      { header: 'Late Days', key: 'late_days', width: 15 },
      { header: 'Absent Days', key: 'absent_days', width: 15 },
      { header: 'Half Days', key: 'half_days', width: 15 },
      { header: 'Total Hours', key: 'total_hours', width: 15 },
      { header: 'Average Hours/Day', key: 'avg_hours', width: 18 },
      { header: 'Attendance %', key: 'attendance_percentage', width: 15 }
    ];

    // Style headers
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Get working days for the month
    const daysInMonth = moment(month, 'YYYY-MM').daysInMonth();
    const workingDays = Math.floor(daysInMonth * 26 / 30); // Approximate working days

    // Add data
    attendanceData.forEach(record => {
      const totalDays = parseInt(record.present_days) + parseInt(record.late_days) + (parseInt(record.half_days) * 0.5);
      const attendancePercentage = workingDays > 0 ? (totalDays / workingDays * 100) : 0;
      
      worksheet.addRow({
        employee_id: record.employee_id,
        employee_name: record.employee_name,
        role: record.role,
        present_days: parseInt(record.present_days),
        late_days: parseInt(record.late_days),
        absent_days: parseInt(record.absent_days),
        half_days: parseInt(record.half_days),
        total_hours: parseFloat(record.total_hours || 0),
        avg_hours: parseFloat(record.avg_hours || 0),
        attendance_percentage: attendancePercentage
      });
    });

    // Format number columns
    worksheet.getColumn('H').numFmt = '0.00';
    worksheet.getColumn('I').numFmt = '0.00';
    worksheet.getColumn('J').numFmt = '0.00%';

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="attendance-report-${month}.xlsx"`);

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Generate attendance Excel error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate expense report (Excel)
router.get('/expenses/excel/:month', authenticateToken, requireRole(['admin', 'hr']), async (req, res) => {
  try {
    const { month } = req.params; // Format: YYYY-MM

    // Get expense data
    const [expenseData] = await db.execute(`
      SELECT 
        e.*,
        u.username as approved_by_name
      FROM expenses e
      LEFT JOIN users u ON e.approved_by = u.id
      WHERE DATE_FORMAT(e.date, '%Y-%m') = ?
      ORDER BY e.date DESC, e.category
    `, [month]);

    // Get revenue data
    const [revenueData] = await db.execute(`
      SELECT * FROM revenue
      WHERE DATE_FORMAT(date, '%Y-%m') = ?
      ORDER BY date DESC
    `, [month]);

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    
    // Expenses worksheet
    const expenseSheet = workbook.addWorksheet('Expenses');
    expenseSheet.columns = [
      { header: 'Date', key: 'date', width: 12 },
      { header: 'Vendor', key: 'vendor', width: 25 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Amount', key: 'amount', width: 15 },
      { header: 'Description', key: 'description', width: 30 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Approved By', key: 'approved_by_name', width: 20 }
    ];

    // Style headers
    expenseSheet.getRow(1).font = { bold: true };
    expenseSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Add expense data
    expenseData.forEach(record => {
      expenseSheet.addRow({
        date: moment(record.date).format('YYYY-MM-DD'),
        vendor: record.vendor,
        category: record.category,
        amount: parseFloat(record.amount),
        description: record.description,
        status: record.status,
        approved_by_name: record.approved_by_name || ''
      });
    });

    // Format amount column
    expenseSheet.getColumn('D').numFmt = '₹#,##0.00';

    // Revenue worksheet
    const revenueSheet = workbook.addWorksheet('Revenue');
    revenueSheet.columns = [
      { header: 'Date', key: 'date', width: 12 },
      { header: 'Source', key: 'source', width: 25 },
      { header: 'Amount', key: 'amount', width: 15 },
      { header: 'Description', key: 'description', width: 30 }
    ];

    // Style headers
    revenueSheet.getRow(1).font = { bold: true };
    revenueSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Add revenue data
    revenueData.forEach(record => {
      revenueSheet.addRow({
        date: moment(record.date).format('YYYY-MM-DD'),
        source: record.source,
        amount: parseFloat(record.amount),
        description: record.description
      });
    });

    // Format amount column
    revenueSheet.getColumn('C').numFmt = '₹#,##0.00';

    // Summary worksheet
    const summarySheet = workbook.addWorksheet('Summary');
    
    const totalExpenses = expenseData
      .filter(e => e.status === 'approved')
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);
    
    const totalRevenue = revenueData
      .reduce((sum, r) => sum + parseFloat(r.amount), 0);
    
    const netProfit = totalRevenue - totalExpenses;

    summarySheet.addRow(['Financial Summary for ' + month]);
    summarySheet.addRow([]);
    summarySheet.addRow(['Total Revenue', totalRevenue]);
    summarySheet.addRow(['Total Expenses', totalExpenses]);
    summarySheet.addRow(['Net Profit/Loss', netProfit]);

    // Format summary
    summarySheet.getCell('A1').font = { bold: true, size: 14 };
    summarySheet.getColumn('B').numFmt = '₹#,##0.00';

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="financial-report-${month}.xlsx"`);

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Generate expense Excel error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate comprehensive monthly report (PDF)
router.get('/monthly/pdf/:month', authenticateToken, requireRole(['admin', 'hr']), async (req, res) => {
  try {
    const { month } = req.params; // Format: YYYY-MM

    // Get all data for the month
    const [payrollData] = await db.execute(`
      SELECT p.*, e.name as employee_name
      FROM payroll p
      JOIN employees e ON p.employee_id = e.id
      WHERE DATE_FORMAT(p.month, '%Y-%m') = ?
    `, [month]);

    const [attendanceData] = await db.execute(`
      SELECT 
        COUNT(CASE WHEN status = 'present' THEN 1 END) as present,
        COUNT(CASE WHEN status = 'late' THEN 1 END) as late,
        COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent,
        COUNT(CASE WHEN status = 'half-day' THEN 1 END) as half_day
      FROM attendance 
      WHERE DATE_FORMAT(date, '%Y-%m') = ?
    `, [month]);

    const [expenseData] = await db.execute(`
      SELECT 
        SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END) as total_expenses,
        COUNT(*) as total_count
      FROM expenses 
      WHERE DATE_FORMAT(date, '%Y-%m') = ?
    `, [month]);

    const [revenueData] = await db.execute(`
      SELECT SUM(amount) as total_revenue
      FROM revenue 
      WHERE DATE_FORMAT(date, '%Y-%m') = ?
    `, [month]);

    const reportData = {
      month,
      payroll: {
        records: payrollData,
        totalPayroll: payrollData.reduce((sum, p) => sum + parseFloat(p.net_salary), 0),
        paidCount: payrollData.filter(p => p.status === 'paid').length,
        unpaidCount: payrollData.filter(p => p.status === 'unpaid').length
      },
      attendance: attendanceData[0] || { present: 0, late: 0, absent: 0, half_day: 0 },
      expenses: {
        total: parseFloat(expenseData[0]?.total_expenses || 0),
        count: parseInt(expenseData[0]?.total_count || 0)
      },
      revenue: {
        total: parseFloat(revenueData[0]?.total_revenue || 0)
      }
    };

    reportData.netProfit = reportData.revenue.total - reportData.expenses.total;

    // Generate PDF
    const pdfBuffer = await generatePayrollReportPDF(reportData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="monthly-report-${month}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Generate monthly PDF error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;