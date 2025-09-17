import React, { useState, useEffect } from 'react';
import { DollarSign, FileText, Download, Eye, Plus, Calculator } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  pf: number;
  esi: number;
  lop: number;
  bonus: number;
  netSalary: number;
  status: 'paid' | 'unpaid';
  generatedDate: string;
}

interface Employee {
  id: string;
  name: string;
  salary: number;
}

const PayrollManagement: React.FC = () => {
  const [employees] = useLocalStorage<Employee[]>('employees', []);
  const [payroll, setPayroll] = useLocalStorage<PayrollRecord[]>('payroll', []);
  const [attendance] = useLocalStorage('attendance', []);
  const [settings] = useLocalStorage('settings', {
    pfRate: 12, // 12%
    esiRate: 1.75, // 1.75%
    workingDaysPerMonth: 26,
    
  });
const handleEmailPayslip = async (employeeId: string, month: string) => {
    try {
      const response = await fetch('http://localhost:5000/api/email-payslip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId, month }),
      });
  
      const data = await response.json();
      if (response.ok) {
        alert('Payslip emailed successfully!');
      } else {
        alert('Failed: ' + data.error);
      }
    } catch (err) {
      alert('Error sending email: ' + err.message);
    }
  };
  

  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<PayrollRecord | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  const generatePayrollId = (): string => {
    return `PAY${Date.now()}`;
  };

  const calculateLOP = (employeeId: string, month: string): number => {
    const monthStart = new Date(month + '-01');
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
    
    const monthlyAttendance = attendance.filter((record: any) => {
      const recordDate = new Date(record.date);
      return record.employeeId === employeeId && 
             recordDate >= monthStart && 
             recordDate <= monthEnd;
    });

    const presentDays = monthlyAttendance.filter((record: any) => 
      ['present', 'late'].includes(record.status)
    ).length;

    const halfDays = monthlyAttendance.filter((record: any) => 
      record.status === 'half-day'
    ).length;

    const effectivePresentDays = presentDays + (halfDays * 0.5);
    const lopDays = Math.max(0, settings.workingDaysPerMonth - effectivePresentDays);
    
    return lopDays;
  };

  const calculatePayroll = (employee: Employee, month: string): Omit<PayrollRecord, 'id' | 'generatedDate'> => {
    const basicSalary = employee.salary;
    const allowances = basicSalary * 0.4; // 40% of basic as allowances
    const grossSalary = basicSalary + allowances;
    
    const pf = (basicSalary * settings.pfRate) / 100;
    const esi = (grossSalary * settings.esiRate) / 100;
    
    const lopDays = calculateLOP(employee.id, month);
    const lopAmount = (basicSalary / settings.workingDaysPerMonth) * lopDays;
    
    const deductions = pf + esi + lopAmount;
    const bonus = 0; // Can be set based on performance
    
    const netSalary = grossSalary - deductions + bonus;

    return {
      employeeId: employee.id,
      employeeName: employee.name,
      month,
      basicSalary,
      allowances,
      deductions,
      pf,
      esi,
      lop: lopAmount,
      bonus,
      netSalary: Math.max(0, netSalary),
      status: 'unpaid',
    };
  };

  const generatePayrollForMonth = () => {
    const existingPayrolls = payroll.filter(p => p.month === selectedMonth);
    const existingEmployeeIds = existingPayrolls.map(p => p.employeeId);
    
    const newPayrolls = employees
      .filter(emp => !existingEmployeeIds.includes(emp.id))
      .map(employee => ({
        id: generatePayrollId(),
        ...calculatePayroll(employee, selectedMonth),
        generatedDate: new Date().toISOString(),
      }));

    setPayroll([...payroll, ...newPayrolls]);
    setShowGenerateModal(false);
  };

  const togglePaymentStatus = (payrollId: string) => {
    const updatedPayroll = payroll.map(record =>
      record.id === payrollId
        ? { ...record, status: record.status === 'paid' ? 'unpaid' : 'paid' as const }
        : record
    );
    setPayroll(updatedPayroll);
  };

  const getMonthlyPayroll = () => {
    return payroll.filter(record => record.month === selectedMonth);
  };

  const getPayrollStats = () => {
    const monthlyRecords = getMonthlyPayroll();
    const totalPayroll = monthlyRecords.reduce((sum, record) => sum + record.netSalary, 0);
    const paidAmount = monthlyRecords
      .filter(record => record.status === 'paid')
      .reduce((sum, record) => sum + record.netSalary, 0);
    const unpaidAmount = totalPayroll - paidAmount;
    const paidCount = monthlyRecords.filter(record => record.status === 'paid').length;

    return { totalPayroll, paidAmount, unpaidAmount, paidCount, totalCount: monthlyRecords.length };
  };

  const monthlyPayroll = getMonthlyPayroll();
  const stats = getPayrollStats();

  const exportPayroll = () => {
    alert('Payroll export functionality would be implemented here');
  };

  const sendPayslipEmail = (payrollRecord: PayrollRecord) => {
    alert(`Email payslip functionality would send payslip to ${payrollRecord.employeeName}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payroll Management</h1>
          <p className="text-gray-600 mt-1">Manage employee salaries and payslips</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={exportPayroll}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Calculator className="h-4 w-4 mr-2" />
            Generate Payroll
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Payroll</p>
              <p className="text-2xl font-bold text-blue-600">₹{stats.totalPayroll.toLocaleString()}</p>
            </div>
            <DollarSign className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Paid Amount</p>
              <p className="text-2xl font-bold text-green-600">₹{stats.paidAmount.toLocaleString()}</p>
            </div>
            <div className="h-8 w-8 text-green-500">✓</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Unpaid Amount</p>
              <p className="text-2xl font-bold text-orange-600">₹{stats.unpaidAmount.toLocaleString()}</p>
            </div>
            <div className="h-8 w-8 text-orange-500">⏳</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Employees Paid</p>
              <p className="text-2xl font-bold text-purple-600">{stats.paidCount}/{stats.totalCount}</p>
            </div>
            <div className="h-8 w-8 text-purple-500">👥</div>
          </div>
        </div>
      </div>

      {/* Month Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Select Month:</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Payroll for {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Basic Salary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Allowances
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deductions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Net Salary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {monthlyPayroll.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{record.employeeName}</div>
                    <div className="text-sm text-gray-500">{record.employeeId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{record.basicSalary.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{record.allowances.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{record.deductions.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ₹{record.netSalary.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => togglePaymentStatus(record.id)}
                      className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                        record.status === 'paid'
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                      }`}
                    >
                      {record.status}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedPayslip(record);
                          setShowPayslipModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => sendPayslipEmail(record)}
                        className="text-green-600 hover:text-green-900"
                      >
                        <FileText className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {monthlyPayroll.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No payroll records found for this month.</p>
            <button
              onClick={() => setShowGenerateModal(true)}
              className="mt-4 flex items-center mx-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Generate Payroll
            </button>
          </div>
        )}
      </div>

      {/* Generate Payroll Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Generate Payroll
            </h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Month: {selectedMonth}</p>
                <p className="text-sm text-gray-600">
                  This will generate payroll for {employees.length} employees.
                </p>
              </div>
              
              <div className="bg-yellow-50 p-3 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ Payroll will be calculated based on attendance records and current settings.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowGenerateModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={generatePayrollForMonth}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Generate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payslip Modal */}
      {showPayslipModal && selectedPayslip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Payslip</h3>
                <button
                  onClick={() => setShowPayslipModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Header */}
                <div className="text-center border-b pb-4">
                  <h2 className="text-2xl font-bold text-gray-900">PayrollPro</h2>
                  <p className="text-gray-600">Payslip for {new Date(selectedPayslip.month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                </div>
                
                {/* Employee Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Employee Name</p>
                    <p className="font-medium">{selectedPayslip.employeeName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Employee ID</p>
                    <p className="font-medium">{selectedPayslip.employeeId}</p>
                  </div>
                </div>
                
                {/* Salary Breakdown */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Salary Breakdown</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Basic Salary</span>
                      <span>₹{selectedPayslip.basicSalary.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Allowances</span>
                      <span>₹{selectedPayslip.allowances.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bonus</span>
                      <span>₹{selectedPayslip.bonus.toLocaleString()}</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-medium">
                        <span>Gross Salary</span>
                        <span>₹{(selectedPayslip.basicSalary + selectedPayslip.allowances + selectedPayslip.bonus).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Deductions */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Deductions</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">PF ({settings.pfRate}%)</span>
                      <span>₹{selectedPayslip.pf.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">ESI ({settings.esiRate}%)</span>
                      <span>₹{selectedPayslip.esi.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">LOP</span>
                      <span>₹{selectedPayslip.lop.toLocaleString()}</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-medium">
                        <span>Total Deductions</span>
                        <span>₹{selectedPayslip.deductions.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Net Salary */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-blue-900">Net Salary</span>
                    <span className="text-2xl font-bold text-blue-900">₹{selectedPayslip.netSalary.toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => sendPayslipEmail(selectedPayslip)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Email Payslip
                  </button>
                  <button
                    onClick={() => alert('PDF download would be implemented here')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Download PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollManagement;