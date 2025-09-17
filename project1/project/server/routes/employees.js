const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const db = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/employees');
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and documents are allowed'));
    }
  }
});

// Generate employee ID
function generateEmployeeId() {
  const prefix = 'EMP';
  const timestamp = Date.now().toString().slice(-6);
  return `${prefix}${timestamp}`;
}

// Get all employees
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, search, limit = 50, offset = 0 } = req.query;
    
    let query = 'SELECT * FROM employees WHERE 1=1';
    const params = [];

    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (name LIKE ? OR email LIKE ? OR id LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [employees] = await db.execute(query, params);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM employees WHERE 1=1';
    const countParams = [];

    if (status && status !== 'all') {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }

    if (search) {
      countQuery += ' AND (name LIKE ? OR email LIKE ? OR id LIKE ?)';
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }

    const [countResult] = await db.execute(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      employees,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < total
      }
    });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get employee by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [employees] = await db.execute(
      'SELECT * FROM employees WHERE id = ?',
      [req.params.id]
    );

    if (employees.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json(employees[0]);
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create employee
router.post('/', authenticateToken, requireRole(['admin', 'hr']), upload.single('profileImage'), async (req, res) => {
  try {
    const {
      name, email, phone, address, role, joining_date,
      salary, bank_account, ifsc_code, status = 'active'
    } = req.body;

    // Validate required fields
    if (!name || !email || !role || !joining_date || !salary) {
      return res.status(400).json({ 
        error: 'Name, email, role, joining date, and salary are required' 
      });
    }

    // Check if email already exists
    const [existingEmployees] = await db.execute(
      'SELECT id FROM employees WHERE email = ?',
      [email]
    );

    if (existingEmployees.length > 0) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    const employeeId = generateEmployeeId();
    const profileImage = req.file ? `/uploads/employees/${req.file.filename}` : null;

    const [result] = await db.execute(`
      INSERT INTO employees (
        id, name, email, phone, address, role, joining_date,
        salary, bank_account, ifsc_code, status, profile_image
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      employeeId, name, email, phone, address, role, joining_date,
      salary, bank_account, ifsc_code, status, profileImage
    ]);

    // Get the created employee
    const [newEmployee] = await db.execute(
      'SELECT * FROM employees WHERE id = ?',
      [employeeId]
    );

    res.status(201).json({
      message: 'Employee created successfully',
      employee: newEmployee[0]
    });
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update employee
router.put('/:id', authenticateToken, requireRole(['admin', 'hr']), upload.single('profileImage'), async (req, res) => {
  try {
    const employeeId = req.params.id;
    const {
      name, email, phone, address, role, joining_date,
      salary, bank_account, ifsc_code, status
    } = req.body;

    // Check if employee exists
    const [existingEmployees] = await db.execute(
      'SELECT * FROM employees WHERE id = ?',
      [employeeId]
    );

    if (existingEmployees.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Check if email is being changed and if it already exists
    if (email && email !== existingEmployees[0].email) {
      const [emailCheck] = await db.execute(
        'SELECT id FROM employees WHERE email = ? AND id != ?',
        [email, employeeId]
      );

      if (emailCheck.length > 0) {
        return res.status(409).json({ error: 'Email already exists' });
      }
    }

    const profileImage = req.file 
      ? `/uploads/employees/${req.file.filename}` 
      : existingEmployees[0].profile_image;

    await db.execute(`
      UPDATE employees SET 
        name = ?, email = ?, phone = ?, address = ?, role = ?,
        joining_date = ?, salary = ?, bank_account = ?, ifsc_code = ?,
        status = ?, profile_image = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      name, email, phone, address, role, joining_date,
      salary, bank_account, ifsc_code, status, profileImage, employeeId
    ]);

    // Get updated employee
    const [updatedEmployee] = await db.execute(
      'SELECT * FROM employees WHERE id = ?',
      [employeeId]
    );

    res.json({
      message: 'Employee updated successfully',
      employee: updatedEmployee[0]
    });
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete employee
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const employeeId = req.params.id;

    // Check if employee exists
    const [existingEmployees] = await db.execute(
      'SELECT profile_image FROM employees WHERE id = ?',
      [employeeId]
    );

    if (existingEmployees.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Delete employee (CASCADE will handle related records)
    await db.execute('DELETE FROM employees WHERE id = ?', [employeeId]);

    // Delete profile image file if exists
    if (existingEmployees[0].profile_image) {
      try {
        const imagePath = path.join(__dirname, '..', existingEmployees[0].profile_image);
        await fs.unlink(imagePath);
      } catch (fileError) {
        console.warn('Could not delete profile image:', fileError.message);
      }
    }

    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload employee documents
router.post('/:id/documents', authenticateToken, requireRole(['admin', 'hr']), upload.array('documents', 5), async (req, res) => {
  try {
    const employeeId = req.params.id;

    // Check if employee exists
    const [employees] = await db.execute(
      'SELECT documents FROM employees WHERE id = ?',
      [employeeId]
    );

    if (employees.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const existingDocuments = employees[0].documents ? JSON.parse(employees[0].documents) : [];
    const newDocuments = req.files.map(file => ({
      name: file.originalname,
      path: `/uploads/employees/${file.filename}`,
      uploadedAt: new Date().toISOString()
    }));

    const allDocuments = [...existingDocuments, ...newDocuments];

    await db.execute(
      'UPDATE employees SET documents = ? WHERE id = ?',
      [JSON.stringify(allDocuments), employeeId]
    );

    res.json({
      message: 'Documents uploaded successfully',
      documents: allDocuments
    });
  } catch (error) {
    console.error('Upload documents error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;