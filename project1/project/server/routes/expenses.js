const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const db = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Configure multer for receipt uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/receipts');
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'receipt-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and PDF files are allowed'));
    }
  }
});

// Generate expense ID
function generateExpenseId() {
  return `EXP${Date.now()}`;
}

// Generate revenue ID
function generateRevenueId() {
  return `REV${Date.now()}`;
}

// Get expenses
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      category, 
      status, 
      month, 
      search, 
      limit = 50, 
      offset = 0 
    } = req.query;
    
    let query = 'SELECT * FROM expenses WHERE 1=1';
    const params = [];

    if (category && category !== 'all') {
      query += ' AND category = ?';
      params.push(category);
    }

    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }

    if (month) {
      query += ' AND DATE_FORMAT(date, "%Y-%m") = ?';
      params.push(month);
    }

    if (search) {
      query += ' AND (vendor LIKE ? OR description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    query += ' ORDER BY date DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [expenses] = await db.execute(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM expenses WHERE 1=1';
    const countParams = [];

    if (category && category !== 'all') {
      countQuery += ' AND category = ?';
      countParams.push(category);
    }

    if (status && status !== 'all') {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }

    if (month) {
      countQuery += ' AND DATE_FORMAT(date, "%Y-%m") = ?';
      countParams.push(month);
    }

    if (search) {
      countQuery += ' AND (vendor LIKE ? OR description LIKE ?)';
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm);
    }

    const [countResult] = await db.execute(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      expenses,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < total
      }
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create expense
router.post('/', authenticateToken, requireRole(['admin', 'hr']), upload.single('receipt'), async (req, res) => {
  try {
    const { vendor, category, amount, date, description, status = 'pending' } = req.body;

    if (!vendor || !category || !amount || !date) {
      return res.status(400).json({ 
        error: 'Vendor, category, amount, and date are required' 
      });
    }

    const expenseId = generateExpenseId();
    const receiptPath = req.file ? `/uploads/receipts/${req.file.filename}` : null;

    await db.execute(`
      INSERT INTO expenses (
        id, vendor, category, amount, date, description, status, receipt_path
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [expenseId, vendor, category, amount, date, description, status, receiptPath]);

    const [newExpense] = await db.execute(
      'SELECT * FROM expenses WHERE id = ?',
      [expenseId]
    );

    res.status(201).json({
      message: 'Expense created successfully',
      expense: newExpense[0]
    });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update expense
router.put('/:id', authenticateToken, requireRole(['admin', 'hr']), upload.single('receipt'), async (req, res) => {
  try {
    const expenseId = req.params.id;
    const { vendor, category, amount, date, description, status } = req.body;

    // Check if expense exists
    const [existingExpenses] = await db.execute(
      'SELECT receipt_path FROM expenses WHERE id = ?',
      [expenseId]
    );

    if (existingExpenses.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    const receiptPath = req.file 
      ? `/uploads/receipts/${req.file.filename}` 
      : existingExpenses[0].receipt_path;

    await db.execute(`
      UPDATE expenses SET 
        vendor = ?, category = ?, amount = ?, date = ?, 
        description = ?, status = ?, receipt_path = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [vendor, category, amount, date, description, status, receiptPath, expenseId]);

    const [updatedExpense] = await db.execute(
      'SELECT * FROM expenses WHERE id = ?',
      [expenseId]
    );

    res.json({
      message: 'Expense updated successfully',
      expense: updatedExpense[0]
    });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Approve/Reject expense
router.put('/:id/status', authenticateToken, requireRole(['admin', 'hr']), async (req, res) => {
  try {
    const expenseId = req.params.id;
    const { status } = req.body;

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const approvedBy = status === 'approved' ? req.user.id : null;
    const approvedAt = status === 'approved' ? new Date() : null;

    const [result] = await db.execute(
      'UPDATE expenses SET status = ?, approved_by = ?, approved_at = ? WHERE id = ?',
      [status, approvedBy, approvedAt, expenseId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json({ message: 'Expense status updated successfully' });
  } catch (error) {
    console.error('Update expense status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete expense
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const expenseId = req.params.id;

    // Get expense with receipt path
    const [expenses] = await db.execute(
      'SELECT receipt_path FROM expenses WHERE id = ?',
      [expenseId]
    );

    if (expenses.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // Delete expense
    await db.execute('DELETE FROM expenses WHERE id = ?', [expenseId]);

    // Delete receipt file if exists
    if (expenses[0].receipt_path) {
      try {
        const receiptPath = path.join(__dirname, '..', expenses[0].receipt_path);
        await fs.unlink(receiptPath);
      } catch (fileError) {
        console.warn('Could not delete receipt file:', fileError.message);
      }
    }

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get revenue records
router.get('/revenue', authenticateToken, async (req, res) => {
  try {
    const { month, search, limit = 50, offset = 0 } = req.query;
    
    let query = 'SELECT * FROM revenue WHERE 1=1';
    const params = [];

    if (month) {
      query += ' AND DATE_FORMAT(date, "%Y-%m") = ?';
      params.push(month);
    }

    if (search) {
      query += ' AND (source LIKE ? OR description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    query += ' ORDER BY date DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [revenue] = await db.execute(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM revenue WHERE 1=1';
    const countParams = [];

    if (month) {
      countQuery += ' AND DATE_FORMAT(date, "%Y-%m") = ?';
      countParams.push(month);
    }

    if (search) {
      countQuery += ' AND (source LIKE ? OR description LIKE ?)';
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm);
    }

    const [countResult] = await db.execute(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      revenue,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < total
      }
    });
  } catch (error) {
    console.error('Get revenue error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create revenue
router.post('/revenue', authenticateToken, requireRole(['admin', 'hr']), async (req, res) => {
  try {
    const { source, amount, date, description } = req.body;

    if (!source || !amount || !date) {
      return res.status(400).json({ 
        error: 'Source, amount, and date are required' 
      });
    }

    const revenueId = generateRevenueId();

    await db.execute(`
      INSERT INTO revenue (id, source, amount, date, description) 
      VALUES (?, ?, ?, ?, ?)
    `, [revenueId, source, amount, date, description]);

    const [newRevenue] = await db.execute(
      'SELECT * FROM revenue WHERE id = ?',
      [revenueId]
    );

    res.status(201).json({
      message: 'Revenue created successfully',
      revenue: newRevenue[0]
    });
  } catch (error) {
    console.error('Create revenue error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update revenue
router.put('/revenue/:id', authenticateToken, requireRole(['admin', 'hr']), async (req, res) => {
  try {
    const revenueId = req.params.id;
    const { source, amount, date, description } = req.body;

    const [result] = await db.execute(`
      UPDATE revenue SET 
        source = ?, amount = ?, date = ?, description = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [source, amount, date, description, revenueId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Revenue record not found' });
    }

    const [updatedRevenue] = await db.execute(
      'SELECT * FROM revenue WHERE id = ?',
      [revenueId]
    );

    res.json({
      message: 'Revenue updated successfully',
      revenue: updatedRevenue[0]
    });
  } catch (error) {
    console.error('Update revenue error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete revenue
router.delete('/revenue/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const revenueId = req.params.id;

    const [result] = await db.execute(
      'DELETE FROM revenue WHERE id = ?',
      [revenueId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Revenue record not found' });
    }

    res.json({ message: 'Revenue deleted successfully' });
  } catch (error) {
    console.error('Delete revenue error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get financial summary
router.get('/summary/:month', authenticateToken, async (req, res) => {
  try {
    const { month } = req.params; // Format: YYYY-MM

    // Get expenses summary
    const [expenseSummary] = await db.execute(`
      SELECT 
        SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END) as total_expenses,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count
      FROM expenses 
      WHERE DATE_FORMAT(date, '%Y-%m') = ?
    `, [month]);

    // Get revenue summary
    const [revenueSummary] = await db.execute(`
      SELECT 
        SUM(amount) as total_revenue,
        COUNT(*) as revenue_count
      FROM revenue 
      WHERE DATE_FORMAT(date, '%Y-%m') = ?
    `, [month]);

    // Get expense categories
    const [categoryBreakdown] = await db.execute(`
      SELECT 
        category,
        SUM(amount) as total,
        COUNT(*) as count
      FROM expenses 
      WHERE DATE_FORMAT(date, '%Y-%m') = ? AND status = 'approved'
      GROUP BY category
      ORDER BY total DESC
    `, [month]);

    const totalExpenses = parseFloat(expenseSummary[0]?.total_expenses || 0);
    const totalRevenue = parseFloat(revenueSummary[0]?.total_revenue || 0);
    const netProfit = totalRevenue - totalExpenses;

    res.json({
      totalExpenses,
      totalRevenue,
      netProfit,
      expenseStats: expenseSummary[0],
      revenueStats: revenueSummary[0],
      categoryBreakdown
    });
  } catch (error) {
    console.error('Get financial summary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;