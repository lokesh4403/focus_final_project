const express = require('express');
const moment = require('moment');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get dashboard statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const currentMonth = moment().format('YYYY-MM');
    const today = moment().format('YYYY-MM-DD');

    // Get total employees
    const [employeeCount] = await db.execute(
      'SELECT COUNT(*) as total FROM employees WHERE status = "active"'
    );

    // Get today's attendance
    const [todayAttendance] = await db.execute(
      'SELECT COUNT(*) as present FROM attendance WHERE date = ? AND status IN ("present", "late")',
      [today]
    );

    // Get monthly payroll
    const [monthlyPayroll] = await db.execute(
      'SELECT SUM(net_salary) as total FROM payroll WHERE DATE_FORMAT(month, "%Y-%m") = ?',
      [currentMonth]
    );

    // Get monthly expenses
    const [monthlyExpenses] = await db.execute(
      'SELECT SUM(amount) as total FROM expenses WHERE DATE_FORMAT(date, "%Y-%m") = ? AND status = "approved"',
      [currentMonth]
    );

    // Get monthly revenue
    const [monthlyRevenue] = await db.execute(
      'SELECT SUM(amount) as total FROM revenue WHERE DATE_FORMAT(date, "%Y-%m") = ?',
      [currentMonth]
    );

    const totalEmployees = employeeCount[0].total;
    const presentToday = todayAttendance[0].present;
    const totalPayroll = parseFloat(monthlyPayroll[0].total || 0);
    const totalExpenses = parseFloat(monthlyExpenses[0].total || 0);
    const totalRevenue = parseFloat(monthlyRevenue[0].total || 0);
    const netProfit = totalRevenue - totalPayroll - totalExpenses;

    res.json({
      totalEmployees,
      presentToday,
      totalPayroll,
      totalExpenses,
      totalRevenue,
      netProfit
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get recent activities
router.get('/activities', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Get recent employee additions
    const [recentEmployees] = await db.execute(
      'SELECT name, created_at, "employee_added" as type FROM employees ORDER BY created_at DESC LIMIT ?',
      [Math.floor(limit / 3)]
    );

    // Get recent payroll generations
    const [recentPayroll] = await db.execute(`
      SELECT 
        CONCAT("Payroll generated for ", e.name) as name,
        p.generated_date as created_at,
        "payroll_generated" as type
      FROM payroll p
      JOIN employees e ON p.employee_id = e.id
      ORDER BY p.generated_date DESC 
      LIMIT ?
    `, [Math.floor(limit / 3)]);

    // Get recent expense approvals
    const [recentExpenses] = await db.execute(`
      SELECT 
        CONCAT("Expense approved: ", vendor) as name,
        approved_at as created_at,
        "expense_approved" as type
      FROM expenses 
      WHERE status = "approved" AND approved_at IS NOT NULL
      ORDER BY approved_at DESC 
      LIMIT ?
    `, [Math.floor(limit / 3)]);

    // Combine and sort activities
    const activities = [
      ...recentEmployees.map(e => ({
        ...e,
        created_at: moment(e.created_at).fromNow()
      })),
      ...recentPayroll.map(p => ({
        ...p,
        created_at: moment(p.created_at).fromNow()
      })),
      ...recentExpenses.map(e => ({
        ...e,
        created_at: moment(e.created_at).fromNow()
      }))
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, limit);

    res.json(activities);
  } catch (error) {
    console.error('Get dashboard activities error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get monthly trends
router.get('/trends', authenticateToken, async (req, res) => {
  try {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      months.push(moment().subtract(i, 'months').format('YYYY-MM'));
    }

    const trends = [];

    for (const month of months) {
      // Get payroll for the month
      const [payroll] = await db.execute(
        'SELECT SUM(net_salary) as total FROM payroll WHERE DATE_FORMAT(month, "%Y-%m") = ?',
        [month]
      );

      // Get expenses for the month
      const [expenses] = await db.execute(
        'SELECT SUM(amount) as total FROM expenses WHERE DATE_FORMAT(date, "%Y-%m") = ? AND status = "approved"',
        [month]
      );

      // Get revenue for the month
      const [revenue] = await db.execute(
        'SELECT SUM(amount) as total FROM revenue WHERE DATE_FORMAT(date, "%Y-%m") = ?',
        [month]
      );

      // Get employee count at end of month
      const [employeeCount] = await db.execute(
        'SELECT COUNT(*) as total FROM employees WHERE status = "active" AND joining_date <= ?',
        [moment(month).endOf('month').format('YYYY-MM-DD')]
      );

      trends.push({
        month: moment(month).format('MMM YYYY'),
        payroll: parseFloat(payroll[0].total || 0),
        expenses: parseFloat(expenses[0].total || 0),
        revenue: parseFloat(revenue[0].total || 0),
        employees: employeeCount[0].total
      });
    }

    res.json(trends);
  } catch (error) {
    console.error('Get dashboard trends error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get attendance summary
router.get('/attendance-summary', authenticateToken, async (req, res) => {
  try {
    const currentMonth = moment().format('YYYY-MM');

    const [attendanceSummary] = await db.execute(`
      SELECT 
        status,
        COUNT(*) as count
      FROM attendance 
      WHERE DATE_FORMAT(date, '%Y-%m') = ?
      GROUP BY status
    `, [currentMonth]);

    const summary = {
      present: 0,
      late: 0,
      absent: 0,
      'half-day': 0
    };

    attendanceSummary.forEach(item => {
      summary[item.status] = item.count;
    });

    res.json(summary);
  } catch (error) {
    console.error('Get attendance summary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get top expenses by category
router.get('/top-expenses', authenticateToken, async (req, res) => {
  try {
    const currentMonth = moment().format('YYYY-MM');

    const [topExpenses] = await db.execute(`
      SELECT 
        category,
        SUM(amount) as total,
        COUNT(*) as count
      FROM expenses 
      WHERE DATE_FORMAT(date, '%Y-%m') = ? AND status = 'approved'
      GROUP BY category
      ORDER BY total DESC
      LIMIT 5
    `, [currentMonth]);

    res.json(topExpenses);
  } catch (error) {
    console.error('Get top expenses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;