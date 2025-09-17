const express = require('express');
const moment = require('moment');
const db = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Generate attendance ID
function generateAttendanceId() {
  return `ATT${Date.now()}`;
}

// Calculate working hours
function calculateWorkingHours(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  
  const checkInTime = moment(`2000-01-01 ${checkIn}`);
  const checkOutTime = moment(`2000-01-01 ${checkOut}`);
  
  return Math.max(0, checkOutTime.diff(checkInTime, 'hours', true));
}

// Determine attendance status
async function determineStatus(checkIn, workingHours) {
  // Get settings
  const [settings] = await db.execute(
    'SELECT setting_value FROM settings WHERE setting_key IN (?, ?)',
    ['late_threshold', 'half_day_threshold']
  );
  
  const lateThreshold = parseInt(settings.find(s => s.setting_key === 'late_threshold')?.setting_value || 30);
  const halfDayThreshold = parseFloat(settings.find(s => s.setting_key === 'half_day_threshold')?.setting_value || 4);
  
  const checkInTime = moment(`2000-01-01 ${checkIn}`);
  const standardStart = moment('2000-01-01 09:00');
  const lateThresholdMs = lateThreshold * 60 * 1000;
  
  const isLate = checkInTime.valueOf() > (standardStart.valueOf() + lateThresholdMs);
  const isHalfDay = workingHours < halfDayThreshold;
  
  if (isHalfDay) return 'half-day';
  if (isLate) return 'late';
  return 'present';
}

// Get attendance records
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      employee_id, 
      date, 
      month, 
      status, 
      limit = 50, 
      offset = 0 
    } = req.query;
    
    let query = `
      SELECT a.*, e.name as employee_name 
      FROM attendance a 
      JOIN employees e ON a.employee_id = e.id 
      WHERE 1=1
    `;
    const params = [];

    if (employee_id && employee_id !== 'all') {
      query += ' AND a.employee_id = ?';
      params.push(employee_id);
    }

    if (date) {
      query += ' AND a.date = ?';
      params.push(date);
    }

    if (month) {
      query += ' AND DATE_FORMAT(a.date, "%Y-%m") = ?';
      params.push(month);
    }

    if (status && status !== 'all') {
      query += ' AND a.status = ?';
      params.push(status);
    }

    query += ' ORDER BY a.date DESC, e.name ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [attendance] = await db.execute(query, params);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM attendance a 
      JOIN employees e ON a.employee_id = e.id 
      WHERE 1=1
    `;
    const countParams = [];

    if (employee_id && employee_id !== 'all') {
      countQuery += ' AND a.employee_id = ?';
      countParams.push(employee_id);
    }

    if (date) {
      countQuery += ' AND a.date = ?';
      countParams.push(date);
    }

    if (month) {
      countQuery += ' AND DATE_FORMAT(a.date, "%Y-%m") = ?';
      countParams.push(month);
    }

    if (status && status !== 'all') {
      countQuery += ' AND a.status = ?';
      countParams.push(status);
    }

    const [countResult] = await db.execute(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      attendance,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < total
      }
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get attendance by employee and date
router.get('/:employeeId/:date', authenticateToken, async (req, res) => {
  try {
    const { employeeId, date } = req.params;

    const [attendance] = await db.execute(
      'SELECT * FROM attendance WHERE employee_id = ? AND date = ?',
      [employeeId, date]
    );

    if (attendance.length === 0) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }

    res.json(attendance[0]);
  } catch (error) {
    console.error('Get attendance by employee error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark attendance
router.post('/', authenticateToken, requireRole(['admin', 'hr']), async (req, res) => {
  try {
    const { employee_id, date, check_in, check_out, notes } = req.body;

    if (!employee_id || !date || !check_in) {
      return res.status(400).json({ 
        error: 'Employee ID, date, and check-in time are required' 
      });
    }

    // Check if employee exists
    const [employees] = await db.execute(
      'SELECT name FROM employees WHERE id = ?',
      [employee_id]
    );

    if (employees.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const workingHours = check_out ? calculateWorkingHours(check_in, check_out) : 0;
    const status = check_out ? await determineStatus(check_in, workingHours) : 'present';

    // Check if attendance already exists for this employee and date
    const [existingAttendance] = await db.execute(
      'SELECT id FROM attendance WHERE employee_id = ? AND date = ?',
      [employee_id, date]
    );

    if (existingAttendance.length > 0) {
      // Update existing record
      await db.execute(`
        UPDATE attendance SET 
          check_in = ?, check_out = ?, working_hours = ?, 
          status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
        WHERE employee_id = ? AND date = ?
      `, [check_in, check_out, workingHours, status, notes, employee_id, date]);

      const [updatedRecord] = await db.execute(
        'SELECT * FROM attendance WHERE employee_id = ? AND date = ?',
        [employee_id, date]
      );

      res.json({
        message: 'Attendance updated successfully',
        attendance: updatedRecord[0]
      });
    } else {
      // Create new record
      const attendanceId = generateAttendanceId();

      await db.execute(`
        INSERT INTO attendance (
          id, employee_id, date, check_in, check_out, 
          working_hours, status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        attendanceId, employee_id, date, check_in, check_out,
        workingHours, status, notes
      ]);

      const [newRecord] = await db.execute(
        'SELECT * FROM attendance WHERE id = ?',
        [attendanceId]
      );

      res.status(201).json({
        message: 'Attendance marked successfully',
        attendance: newRecord[0]
      });
    }
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark absent
router.post('/absent', authenticateToken, requireRole(['admin', 'hr']), async (req, res) => {
  try {
    const { employee_id, date, notes } = req.body;

    if (!employee_id || !date) {
      return res.status(400).json({ 
        error: 'Employee ID and date are required' 
      });
    }

    // Check if employee exists
    const [employees] = await db.execute(
      'SELECT name FROM employees WHERE id = ?',
      [employee_id]
    );

    if (employees.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Check if attendance already exists
    const [existingAttendance] = await db.execute(
      'SELECT id FROM attendance WHERE employee_id = ? AND date = ?',
      [employee_id, date]
    );

    if (existingAttendance.length > 0) {
      // Update existing record
      await db.execute(`
        UPDATE attendance SET 
          check_in = NULL, check_out = NULL, working_hours = 0,
          status = 'absent', notes = ?, updated_at = CURRENT_TIMESTAMP
        WHERE employee_id = ? AND date = ?
      `, [notes, employee_id, date]);
    } else {
      // Create new absent record
      const attendanceId = generateAttendanceId();

      await db.execute(`
        INSERT INTO attendance (
          id, employee_id, date, check_in, check_out,
          working_hours, status, notes
        ) VALUES (?, ?, ?, NULL, NULL, 0, 'absent', ?)
      `, [attendanceId, employee_id, date, notes]);
    }

    res.json({ message: 'Employee marked as absent successfully' });
  } catch (error) {
    console.error('Mark absent error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get monthly attendance summary
router.get('/summary/:month', authenticateToken, async (req, res) => {
  try {
    const { month } = req.params; // Format: YYYY-MM

    const [summary] = await db.execute(`
      SELECT 
        status,
        COUNT(*) as count
      FROM attendance 
      WHERE DATE_FORMAT(date, '%Y-%m') = ?
      GROUP BY status
    `, [month]);

    const [employeeStats] = await db.execute(`
      SELECT 
        e.id,
        e.name,
        COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_days,
        COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_days,
        COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_days,
        COUNT(CASE WHEN a.status = 'half-day' THEN 1 END) as half_days,
        SUM(a.working_hours) as total_hours
      FROM employees e
      LEFT JOIN attendance a ON e.id = a.employee_id 
        AND DATE_FORMAT(a.date, '%Y-%m') = ?
      WHERE e.status = 'active'
      GROUP BY e.id, e.name
      ORDER BY e.name
    `, [month]);

    res.json({
      summary,
      employeeStats
    });
  } catch (error) {
    console.error('Get attendance summary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete attendance record
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const attendanceId = req.params.id;

    const [result] = await db.execute(
      'DELETE FROM attendance WHERE id = ?',
      [attendanceId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }

    res.json({ message: 'Attendance record deleted successfully' });
  } catch (error) {
    console.error('Delete attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;