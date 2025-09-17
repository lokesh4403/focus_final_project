const jsPDF = require('jspdf');
const moment = require('moment');

// Generate payslip PDF
async function generatePayslipPDF(payrollData) {
  const doc = new jsPDF();
  
  // Company header
  doc.setFontSize(20);
  doc.setFont(undefined, 'bold');
  doc.text('PayrollPro Company', 20, 20);
  
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  doc.text('123 Business Street, City, State - 12345', 20, 30);
  doc.text('Email: admin@payrollpro.com | Phone: +1-234-567-8900', 20, 40);
  
  // Title
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text('PAYSLIP', 20, 60);
  
  // Employee details
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  const monthYear = moment(payrollData.month).format('MMMM YYYY');
  doc.text(`For the month of: ${monthYear}`, 20, 75);
  
  doc.text(`Employee Name: ${payrollData.employee_name}`, 20, 90);
  doc.text(`Employee ID: ${payrollData.employee_id}`, 20, 100);
  doc.text(`Role: ${payrollData.role}`, 20, 110);
  doc.text(`Joining Date: ${moment(payrollData.joining_date).format('DD/MM/YYYY')}`, 20, 120);
  
  // Earnings section
  doc.setFont(undefined, 'bold');
  doc.text('EARNINGS', 20, 140);
  doc.line(20, 145, 190, 145);
  
  doc.setFont(undefined, 'normal');
  let yPos = 155;
  doc.text('Basic Salary', 20, yPos);
  doc.text(`₹${parseFloat(payrollData.basic_salary).toLocaleString()}`, 150, yPos);
  
  yPos += 10;
  doc.text('Allowances', 20, yPos);
  doc.text(`₹${parseFloat(payrollData.allowances).toLocaleString()}`, 150, yPos);
  
  yPos += 10;
  doc.text('Bonus', 20, yPos);
  doc.text(`₹${parseFloat(payrollData.bonus).toLocaleString()}`, 150, yPos);
  
  yPos += 15;
  const grossSalary = parseFloat(payrollData.basic_salary) + parseFloat(payrollData.allowances) + parseFloat(payrollData.bonus);
  doc.setFont(undefined, 'bold');
  doc.text('Gross Salary', 20, yPos);
  doc.text(`₹${grossSalary.toLocaleString()}`, 150, yPos);
  doc.line(20, yPos + 5, 190, yPos + 5);
  
  // Deductions section
  yPos += 20;
  doc.text('DEDUCTIONS', 20, yPos);
  doc.line(20, yPos + 5, 190, yPos + 5);
  
  doc.setFont(undefined, 'normal');
  yPos += 15;
  doc.text('Provident Fund (PF)', 20, yPos);
  doc.text(`₹${parseFloat(payrollData.pf).toLocaleString()}`, 150, yPos);
  
  yPos += 10;
  doc.text('Employee State Insurance (ESI)', 20, yPos);
  doc.text(`₹${parseFloat(payrollData.esi).toLocaleString()}`, 150, yPos);
  
  yPos += 10;
  doc.text('Loss of Pay (LOP)', 20, yPos);
  doc.text(`₹${parseFloat(payrollData.lop).toLocaleString()}`, 150, yPos);
  
  const otherDeductions = parseFloat(payrollData.deductions) - parseFloat(payrollData.pf) - parseFloat(payrollData.esi) - parseFloat(payrollData.lop);
  if (otherDeductions > 0) {
    yPos += 10;
    doc.text('Other Deductions', 20, yPos);
    doc.text(`₹${otherDeductions.toLocaleString()}`, 150, yPos);
  }
  
  yPos += 15;
  doc.setFont(undefined, 'bold');
  doc.text('Total Deductions', 20, yPos);
  doc.text(`₹${parseFloat(payrollData.deductions).toLocaleString()}`, 150, yPos);
  doc.line(20, yPos + 5, 190, yPos + 5);
  
  // Net salary
  yPos += 20;
  doc.setFontSize(14);
  doc.text('NET SALARY', 20, yPos);
  doc.text(`₹${parseFloat(payrollData.net_salary).toLocaleString()}`, 150, yPos);
  doc.rect(15, yPos - 10, 180, 20);
  
  // Footer
  yPos += 30;
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text('This is a computer-generated payslip and does not require a signature.', 20, yPos);
  doc.text(`Generated on: ${moment().format('DD/MM/YYYY HH:mm')}`, 20, yPos + 10);
  
  return doc.output('arraybuffer');
}

// Generate comprehensive report PDF
async function generatePayrollReportPDF(reportData) {
  const doc = new jsPDF();
  
  // Company header
  doc.setFontSize(20);
  doc.setFont(undefined, 'bold');
  doc.text('PayrollPro Company', 20, 20);
  
  doc.setFontSize(16);
  doc.text('Monthly Report', 20, 35);
  
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  const monthYear = moment(reportData.month + '-01').format('MMMM YYYY');
  doc.text(`Report for: ${monthYear}`, 20, 50);
  doc.text(`Generated on: ${moment().format('DD/MM/YYYY HH:mm')}`, 20, 60);
  
  // Summary section
  let yPos = 80;
  doc.setFont(undefined, 'bold');
  doc.text('EXECUTIVE SUMMARY', 20, yPos);
  doc.line(20, yPos + 5, 190, yPos + 5);
  
  doc.setFont(undefined, 'normal');
  yPos += 20;
  doc.text(`Total Employees: ${reportData.payroll.records.length}`, 20, yPos);
  doc.text(`Total Payroll: ₹${reportData.payroll.totalPayroll.toLocaleString()}`, 20, yPos + 10);
  doc.text(`Total Revenue: ₹${reportData.revenue.total.toLocaleString()}`, 20, yPos + 20);
  doc.text(`Total Expenses: ₹${reportData.expenses.total.toLocaleString()}`, 20, yPos + 30);
  
  const profitColor = reportData.netProfit >= 0 ? [0, 128, 0] : [255, 0, 0];
  doc.setTextColor(...profitColor);
  doc.text(`Net Profit/Loss: ₹${Math.abs(reportData.netProfit).toLocaleString()}`, 20, yPos + 40);
  doc.setTextColor(0, 0, 0);
  
  // Attendance summary
  yPos += 60;
  doc.setFont(undefined, 'bold');
  doc.text('ATTENDANCE SUMMARY', 20, yPos);
  doc.line(20, yPos + 5, 190, yPos + 5);
  
  doc.setFont(undefined, 'normal');
  yPos += 20;
  doc.text(`Present: ${reportData.attendance.present}`, 20, yPos);
  doc.text(`Late: ${reportData.attendance.late}`, 70, yPos);
  doc.text(`Absent: ${reportData.attendance.absent}`, 120, yPos);
  doc.text(`Half Day: ${reportData.attendance.half_day}`, 170, yPos);
  
  // Payroll summary
  yPos += 30;
  doc.setFont(undefined, 'bold');
  doc.text('PAYROLL SUMMARY', 20, yPos);
  doc.line(20, yPos + 5, 190, yPos + 5);
  
  doc.setFont(undefined, 'normal');
  yPos += 20;
  doc.text(`Employees Paid: ${reportData.payroll.paidCount}`, 20, yPos);
  doc.text(`Employees Unpaid: ${reportData.payroll.unpaidCount}`, 120, yPos);
  
  return doc.output('arraybuffer');
}

module.exports = {
  generatePayslipPDF,
  generatePayrollReportPDF
};