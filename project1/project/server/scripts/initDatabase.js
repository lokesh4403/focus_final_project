const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 3306
};

async function initializeDatabase() {
  let connection;

  try {
    const dbName = process.env.DB_NAME || 'payroll_system';

    // Step 1: Connect without DB to create it
    connection = await mysql.createConnection(dbConfig);
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log('✅ Database created/verified');

    // Step 2: Reconnect using the newly created DB
    await connection.end();
    connection = await mysql.createConnection({ ...dbConfig, database: dbName });

    // Step 3: Create tables
    await createTables(connection);

    // Step 4: Insert default data
    await insertDefaultData(connection);

    console.log('🎉 Database initialization completed successfully!');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function createTables(connection) {
  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('admin', 'hr', 'employee') DEFAULT 'admin',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS employees (
      id VARCHAR(20) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      phone VARCHAR(20),
      address TEXT,
      role VARCHAR(50) NOT NULL,
      joining_date DATE NOT NULL,
      salary DECIMAL(10,2) NOT NULL,
      bank_account VARCHAR(50),
      ifsc_code VARCHAR(20),
      status ENUM('active', 'inactive') DEFAULT 'active',
      profile_image VARCHAR(255),
      documents JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS attendance (
      id VARCHAR(20) PRIMARY KEY,
      employee_id VARCHAR(20) NOT NULL,
      date DATE NOT NULL,
      check_in TIME,
      check_out TIME,
      working_hours DECIMAL(4,2) DEFAULT 0,
      status ENUM('present', 'absent', 'late', 'half-day') NOT NULL,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
      UNIQUE KEY unique_employee_date (employee_id, date)
    )`,
    `CREATE TABLE IF NOT EXISTS payroll (
      id VARCHAR(20) PRIMARY KEY,
      employee_id VARCHAR(20) NOT NULL,
      month DATE NOT NULL,
      basic_salary DECIMAL(10,2) NOT NULL,
      allowances DECIMAL(10,2) DEFAULT 0,
      deductions DECIMAL(10,2) DEFAULT 0,
      pf DECIMAL(10,2) DEFAULT 0,
      esi DECIMAL(10,2) DEFAULT 0,
      lop DECIMAL(10,2) DEFAULT 0,
      bonus DECIMAL(10,2) DEFAULT 0,
      net_salary DECIMAL(10,2) NOT NULL,
      status ENUM('paid', 'unpaid') DEFAULT 'unpaid',
      generated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      paid_date TIMESTAMP NULL,
      payslip_path VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
      UNIQUE KEY unique_employee_month (employee_id, month)
    )`,
    `CREATE TABLE IF NOT EXISTS expenses (
      id VARCHAR(20) PRIMARY KEY,
      vendor VARCHAR(100) NOT NULL,
      category VARCHAR(50) NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      date DATE NOT NULL,
      description TEXT,
      status ENUM('approved', 'pending', 'rejected') DEFAULT 'pending',
      receipt_path VARCHAR(255),
      approved_by INT,
      approved_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
    )`,
    `CREATE TABLE IF NOT EXISTS revenue (
      id VARCHAR(20) PRIMARY KEY,
      source VARCHAR(100) NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      date DATE NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS settings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      setting_key VARCHAR(50) UNIQUE NOT NULL,
      setting_value TEXT NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS custom_allowances (
      id VARCHAR(20) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      type ENUM('fixed', 'percentage') NOT NULL,
      value DECIMAL(10,2) NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS custom_deductions (
      id VARCHAR(20) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      type ENUM('fixed', 'percentage') NOT NULL,
      value DECIMAL(10,2) NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS email_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      recipient VARCHAR(100) NOT NULL,
      subject VARCHAR(255) NOT NULL,
      type ENUM('payslip', 'notification', 'report') NOT NULL,
      status ENUM('sent', 'failed', 'pending') DEFAULT 'pending',
      error_message TEXT,
      sent_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  for (const table of tables) {
    await connection.execute(table);
  }

  console.log('✅ All tables created successfully');
}

async function insertDefaultData(connection) {
  const bcrypt = require('bcryptjs');
  const hashedPassword = await bcrypt.hash('admin123', 10);

  await connection.execute(`
    INSERT IGNORE INTO users (username, email, password, role)
    VALUES ('admin', 'admin@payrollpro.com', ?, 'admin')
  `, [hashedPassword]);

  const defaultSettings = [
    ['company_name', 'PayrollPro Company', 'Company name'],
    ['company_address', '123 Business Street, City, State - 12345', 'Company address'],
    ['company_email', 'admin@payrollpro.com', 'Company email'],
    ['company_phone', '+1-234-567-8900', 'Company phone'],
    ['working_hours', '8', 'Standard working hours per day'],
    ['late_threshold', '30', 'Late threshold in minutes'],
    ['half_day_threshold', '4', 'Half day threshold in hours'],
    ['working_days_per_month', '26', 'Working days per month'],
    ['pf_rate', '12', 'PF rate percentage'],
    ['esi_rate', '1.75', 'ESI rate percentage'],
    ['tax_id', 'GST123456789', 'Company tax ID']
  ];

  for (const [key, value, description] of defaultSettings) {
    await connection.execute(`
      INSERT IGNORE INTO settings (setting_key, setting_value, description)
      VALUES (?, ?, ?)
    `, [key, value, description]);
  }

  const defaultAllowances = [
    ['HRA001', 'House Rent Allowance', 'percentage', 40],
    ['TA001', 'Transport Allowance', 'fixed', 2000],
    ['MA001', 'Medical Allowance', 'fixed', 1500]
  ];

  for (const [id, name, type, value] of defaultAllowances) {
    await connection.execute(`
      INSERT IGNORE INTO custom_allowances (id, name, type, value)
      VALUES (?, ?, ?, ?)
    `, [id, name, type, value]);
  }

  const defaultDeductions = [
    ['PT001', 'Professional Tax', 'fixed', 200],
    ['IT001', 'Income Tax', 'percentage', 10]
  ];

  for (const [id, name, type, value] of defaultDeductions) {
    await connection.execute(`
      INSERT IGNORE INTO custom_deductions (id, name, type, value)
      VALUES (?, ?, ?, ?)
    `, [id, name, type, value]);
  }

  console.log('✅ Default data inserted successfully');
}

// Start DB initialization
initializeDatabase();
