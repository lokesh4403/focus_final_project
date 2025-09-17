const express = require('express');
const db = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Generate ID for allowances/deductions
function generateId(prefix) {
  return `${prefix}${Date.now()}`;
}

// Get all settings
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [settings] = await db.execute(
      'SELECT setting_key, setting_value, description FROM settings ORDER BY setting_key'
    );

    const settingsObj = {};
    settings.forEach(setting => {
      settingsObj[setting.setting_key] = setting.setting_value;
    });

    res.json(settingsObj);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update settings
router.put('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const settings = req.body;

    // Update each setting
    for (const [key, value] of Object.entries(settings)) {
      await db.execute(
        'UPDATE settings SET setting_value = ? WHERE setting_key = ?',
        [value.toString(), key]
      );
    }

    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get custom allowances
router.get('/allowances', authenticateToken, async (req, res) => {
  try {
    const [allowances] = await db.execute(
      'SELECT * FROM custom_allowances ORDER BY name'
    );

    res.json(allowances);
  } catch (error) {
    console.error('Get allowances error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create custom allowance
router.post('/allowances', authenticateToken, requireRole(['admin', 'hr']), async (req, res) => {
  try {
    const { name, type, value } = req.body;

    if (!name || !type || value === undefined) {
      return res.status(400).json({ 
        error: 'Name, type, and value are required' 
      });
    }

    if (!['fixed', 'percentage'].includes(type)) {
      return res.status(400).json({ error: 'Type must be fixed or percentage' });
    }

    const allowanceId = generateId('ALL');

    await db.execute(
      'INSERT INTO custom_allowances (id, name, type, value) VALUES (?, ?, ?, ?)',
      [allowanceId, name, type, value]
    );

    const [newAllowance] = await db.execute(
      'SELECT * FROM custom_allowances WHERE id = ?',
      [allowanceId]
    );

    res.status(201).json({
      message: 'Allowance created successfully',
      allowance: newAllowance[0]
    });
  } catch (error) {
    console.error('Create allowance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update custom allowance
router.put('/allowances/:id', authenticateToken, requireRole(['admin', 'hr']), async (req, res) => {
  try {
    const allowanceId = req.params.id;
    const { name, type, value, is_active } = req.body;

    const [result] = await db.execute(`
      UPDATE custom_allowances 
      SET name = ?, type = ?, value = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [name, type, value, is_active, allowanceId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Allowance not found' });
    }

    const [updatedAllowance] = await db.execute(
      'SELECT * FROM custom_allowances WHERE id = ?',
      [allowanceId]
    );

    res.json({
      message: 'Allowance updated successfully',
      allowance: updatedAllowance[0]
    });
  } catch (error) {
    console.error('Update allowance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete custom allowance
router.delete('/allowances/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const allowanceId = req.params.id;

    const [result] = await db.execute(
      'DELETE FROM custom_allowances WHERE id = ?',
      [allowanceId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Allowance not found' });
    }

    res.json({ message: 'Allowance deleted successfully' });
  } catch (error) {
    console.error('Delete allowance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get custom deductions
router.get('/deductions', authenticateToken, async (req, res) => {
  try {
    const [deductions] = await db.execute(
      'SELECT * FROM custom_deductions ORDER BY name'
    );

    res.json(deductions);
  } catch (error) {
    console.error('Get deductions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create custom deduction
router.post('/deductions', authenticateToken, requireRole(['admin', 'hr']), async (req, res) => {
  try {
    const { name, type, value } = req.body;

    if (!name || !type || value === undefined) {
      return res.status(400).json({ 
        error: 'Name, type, and value are required' 
      });
    }

    if (!['fixed', 'percentage'].includes(type)) {
      return res.status(400).json({ error: 'Type must be fixed or percentage' });
    }

    const deductionId = generateId('DED');

    await db.execute(
      'INSERT INTO custom_deductions (id, name, type, value) VALUES (?, ?, ?, ?)',
      [deductionId, name, type, value]
    );

    const [newDeduction] = await db.execute(
      'SELECT * FROM custom_deductions WHERE id = ?',
      [deductionId]
    );

    res.status(201).json({
      message: 'Deduction created successfully',
      deduction: newDeduction[0]
    });
  } catch (error) {
    console.error('Create deduction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update custom deduction
router.put('/deductions/:id', authenticateToken, requireRole(['admin', 'hr']), async (req, res) => {
  try {
    const deductionId = req.params.id;
    const { name, type, value, is_active } = req.body;

    const [result] = await db.execute(`
      UPDATE custom_deductions 
      SET name = ?, type = ?, value = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [name, type, value, is_active, deductionId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Deduction not found' });
    }

    const [updatedDeduction] = await db.execute(
      'SELECT * FROM custom_deductions WHERE id = ?',
      [deductionId]
    );

    res.json({
      message: 'Deduction updated successfully',
      deduction: updatedDeduction[0]
    });
  } catch (error) {
    console.error('Update deduction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete custom deduction
router.delete('/deductions/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const deductionId = req.params.id;

    const [result] = await db.execute(
      'DELETE FROM custom_deductions WHERE id = ?',
      [deductionId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Deduction not found' });
    }

    res.json({ message: 'Deduction deleted successfully' });
  } catch (error) {
    console.error('Delete deduction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Toggle allowance/deduction status
router.put('/allowances/:id/toggle', authenticateToken, requireRole(['admin', 'hr']), async (req, res) => {
  try {
    const allowanceId = req.params.id;

    const [result] = await db.execute(
      'UPDATE custom_allowances SET is_active = NOT is_active WHERE id = ?',
      [allowanceId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Allowance not found' });
    }

    res.json({ message: 'Allowance status toggled successfully' });
  } catch (error) {
    console.error('Toggle allowance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/deductions/:id/toggle', authenticateToken, requireRole(['admin', 'hr']), async (req, res) => {
  try {
    const deductionId = req.params.id;

    const [result] = await db.execute(
      'UPDATE custom_deductions SET is_active = NOT is_active WHERE id = ?',
      [deductionId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Deduction not found' });
    }

    res.json({ message: 'Deduction status toggled successfully' });
  } catch (error) {
    console.error('Toggle deduction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;