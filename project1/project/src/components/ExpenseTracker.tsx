import React, { useState } from 'react';
import { Plus, Search, Filter, Download, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface Expense {
  id: string;
  vendor: string;
  category: string;
  amount: number;
  date: string;
  description: string;
  status: 'approved' | 'pending' | 'rejected';
}

interface Revenue {
  id: string;
  source: string;
  amount: number;
  date: string;
  description: string;
}

const ExpenseTracker: React.FC = () => {
  const [expenses, setExpenses] = useLocalStorage<Expense[]>('expenses', []);
  const [revenue, setRevenue] = useLocalStorage<Revenue[]>('revenue', []);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showRevenueForm, setShowRevenueForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const [expenseForm, setExpenseForm] = useState({
    vendor: '',
    category: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    description: '',
    status: 'pending' as const,
  });

  const [revenueForm, setRevenueForm] = useState({
    source: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    description: '',
  });

  const categories = [
    'Office Supplies', 'Equipment', 'Software', 'Marketing', 'Travel',
    'Utilities', 'Rent', 'Professional Services', 'Training', 'Other'
  ];

  const generateId = (): string => {
    return Date.now().toString();
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.vendor || !expenseForm.category || expenseForm.amount <= 0) return;

    const newExpense: Expense = {
      id: generateId(),
      ...expenseForm,
    };

    setExpenses([...expenses, newExpense]);
    setExpenseForm({
      vendor: '',
      category: '',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      description: '',
      status: 'pending',
    });
    setShowExpenseForm(false);
  };

  const handleAddRevenue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revenueForm.source || revenueForm.amount <= 0) return;

    const newRevenue: Revenue = {
      id: generateId(),
      ...revenueForm,
    };

    setRevenue([...revenue, newRevenue]);
    setRevenueForm({
      source: '',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      description: '',
    });
    setShowRevenueForm(false);
  };

  const updateExpenseStatus = (id: string, status: 'approved' | 'pending' | 'rejected') => {
    const updatedExpenses = expenses.map(expense =>
      expense.id === id ? { ...expense, status } : expense
    );
    setExpenses(updatedExpenses);
  };

  const getMonthlyData = () => {
    const monthStart = new Date(selectedMonth + '-01');
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);

    const monthlyExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= monthStart && expenseDate <= monthEnd && expense.status === 'approved';
    });

    const monthlyRevenue = revenue.filter(rev => {
      const revDate = new Date(rev.date);
      return revDate >= monthStart && revDate <= monthEnd;
    });

    const totalExpenses = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalRevenue = monthlyRevenue.reduce((sum, rev) => sum + rev.amount, 0);
    const netProfit = totalRevenue - totalExpenses;

    return {
      totalExpenses,
      totalRevenue,
      netProfit,
      monthlyExpenses,
      monthlyRevenue,
    };
  };

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || expense.category === filterCategory;
    const matchesMonth = expense.date.startsWith(selectedMonth);

    return matchesSearch && matchesCategory && matchesMonth;
  });

  const monthlyData = getMonthlyData();

  const exportData = () => {
    alert('Export functionality would generate CSV/Excel files with expense and revenue data');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Expense & Revenue Tracker</h1>
          <p className="text-gray-600 mt-1">Manage company finances and track profitability</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={exportData}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button
            onClick={() => setShowRevenueForm(true)}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Revenue
          </button>
          <button
            onClick={() => setShowExpenseForm(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </button>
        </div>
      </div>

      {/* Monthly Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
              <p className="text-2xl font-bold text-green-600">₹{monthlyData.totalRevenue.toLocaleString()}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Expenses</p>
              <p className="text-2xl font-bold text-red-600">₹{monthlyData.totalExpenses.toLocaleString()}</p>
            </div>
            <TrendingDown className="h-8 w-8 text-red-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Net Profit/Loss</p>
              <p className={`text-2xl font-bold ${
                monthlyData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                ₹{Math.abs(monthlyData.netProfit).toLocaleString()}
              </p>
            </div>
            <DollarSign className={`h-8 w-8 ${
              monthlyData.netProfit >= 0 ? 'text-green-500' : 'text-red-500'
            }`} />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Profit Margin</p>
              <p className={`text-2xl font-bold ${
                monthlyData.totalRevenue > 0 && monthlyData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {monthlyData.totalRevenue > 0 
                  ? ((monthlyData.netProfit / monthlyData.totalRevenue) * 100).toFixed(1)
                  : '0.0'
                }%
              </p>
            </div>
            <div className="text-2xl">📊</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search expenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <div className="sm:w-48">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Expenses</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
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
              {filteredExpenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(expense.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{expense.vendor}</div>
                    <div className="text-sm text-gray-500">{expense.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {expense.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ₹{expense.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      expense.status === 'approved' ? 'bg-green-100 text-green-800' :
                      expense.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {expense.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {expense.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateExpenseStatus(expense.id, 'approved')}
                            className="text-green-600 hover:text-green-900"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => updateExpenseStatus(expense.id, 'rejected')}
                            className="text-red-600 hover:text-red-900"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredExpenses.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No expenses found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {showExpenseForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Expense</h3>
            
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vendor</label>
                <input
                  type="text"
                  required
                  value={expenseForm.vendor}
                  onChange={(e) => setExpenseForm({...expenseForm, vendor: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter vendor name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  required
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({...expenseForm, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({...expenseForm, amount: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter amount"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  required
                  value={expenseForm.date}
                  onChange={(e) => setExpenseForm({...expenseForm, date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter description (optional)"
                />
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowExpenseForm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Revenue Modal */}
      {showRevenueForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Revenue</h3>
            
            <form onSubmit={handleAddRevenue} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Source</label>
                <input
                  type="text"
                  required
                  value={revenueForm.source}
                  onChange={(e) => setRevenueForm({...revenueForm, source: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter revenue source"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={revenueForm.amount}
                  onChange={(e) => setRevenueForm({...revenueForm, amount: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter amount"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  required
                  value={revenueForm.date}
                  onChange={(e) => setRevenueForm({...revenueForm, date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={revenueForm.description}
                  onChange={(e) => setRevenueForm({...revenueForm, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter description (optional)"
                />
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowRevenueForm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Add Revenue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseTracker;