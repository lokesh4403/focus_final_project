import React, { useState, useEffect } from 'react';
import {
  Users,
  Clock,
  DollarSign,
  Receipt,
  TrendingUp,
  TrendingDown,
  Download,
  FileText,
} from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { exportToCSV } from '../utils/export-to-csv.js';
import { exportToPDF } from '../utils/export-to-pdf.js';

interface DashboardStats {
  totalEmployees: number;
  presentToday: number;
  totalPayroll: number;
  totalExpenses: number;
  netProfit: number;
}

const Dashboard: React.FC = () => {
  const [employees] = useLocalStorage('employees', []);
  const [attendance] = useLocalStorage('attendance', []);
  const [payroll] = useLocalStorage('payroll', []);
  const [expenses] = useLocalStorage('expenses', []);
  const [revenue] = useLocalStorage('revenue', []);

  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    presentToday: 0,
    totalPayroll: 0,
    totalExpenses: 0,
    netProfit: 0,
  });

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const presentToday = attendance.filter(
      (record: any) => record.date === today && record.status === 'present'
    ).length;

    const monthlyPayroll = payroll
      .filter((record: any) => {
        const recordDate = new Date(record.month);
        return (
          recordDate.getMonth() === currentMonth &&
          recordDate.getFullYear() === currentYear
        );
      })
      .reduce((sum: number, record: any) => sum + record.netSalary, 0);

    const monthlyExpenses = expenses
      .filter((expense: any) => {
        const expenseDate = new Date(expense.date);
        return (
          expenseDate.getMonth() === currentMonth &&
          expenseDate.getFullYear() === currentYear
        );
      })
      .reduce((sum: number, expense: any) => sum + expense.amount, 0);

    const monthlyRevenue = revenue
      .filter((rev: any) => {
        const revDate = new Date(rev.date);
        return (
          revDate.getMonth() === currentMonth &&
          revDate.getFullYear() === currentYear
        );
      })
      .reduce((sum: number, rev: any) => sum + rev.amount, 0);

    setStats({
      totalEmployees: employees.length,
      presentToday,
      totalPayroll: monthlyPayroll,
      totalExpenses: monthlyExpenses,
      netProfit: monthlyRevenue - monthlyPayroll - monthlyExpenses,
    });
  }, [employees, attendance, payroll, expenses, revenue]);

  const statCards = [
    {
      title: 'Total Employees',
      value: stats.totalEmployees.toString(),
      icon: Users,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      title: 'Present Today',
      value: stats.presentToday.toString(),
      icon: Clock,
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      title: 'Monthly Payroll',
      value: `₹${stats.totalPayroll.toLocaleString()}`,
      icon: DollarSign,
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      title: 'Monthly Expenses',
      value: `₹${stats.totalExpenses.toLocaleString()}`,
      icon: Receipt,
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
    },
  ];

  // ✅ Actual export logic
  const exportReport = (type: 'pdf' | 'csv') => {
    const data = employees; // use the data you want to export
    if (!data || data.length === 0) {
      alert('No data to export.');
      return;
    }

    if (type === 'csv') {
      exportToCSV(data, 'employees-report.csv');
    } else if (type === 'pdf') {
      exportToPDF(data, 'employees-report.pdf');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Focus Technologies</h1>
          <p className="text-gray-600 mt-1">
            Welcome to your payroll management overview
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => exportReport('pdf')}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </button>
          <button
            onClick={() => exportReport('csv')}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {card.value}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${card.bgColor}`}>
                  <Icon className={`h-6 w-6 ${card.textColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Profit/Loss Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Monthly Net Profit/Loss
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Current month performance
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {stats.netProfit >= 0 ? (
              <TrendingUp className="h-5 w-5 text-green-500" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-500" />
            )}
            <span
              className={`text-2xl font-bold ${
                stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              ₹{Math.abs(stats.netProfit).toLocaleString()}
            </span>
          </div>
        </div>
        <div className="mt-4">
          <div
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              stats.netProfit >= 0
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {stats.netProfit >= 0 ? 'Profit' : 'Loss'}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50">
            <h4 className="font-medium text-gray-900">Generate Payslips</h4>
            <p className="text-sm text-gray-600 mt-1">
              Create monthly payslips for all employees
            </p>
          </button>
          <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50">
            <h4 className="font-medium text-gray-900">Attendance Report</h4>
            <p className="text-sm text-gray-600 mt-1">
              View detailed attendance analytics
            </p>
          </button>
          <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50">
            <h4 className="font-medium text-gray-900">Expense Summary</h4>
            <p className="text-sm text-gray-600 mt-1">
              Review monthly expense breakdown
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
