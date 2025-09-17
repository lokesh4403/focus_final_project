import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Eye, Download } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import EmployeeForm from './EmployeeForm';
import EmployeeDetails from './EmployeeDetails';

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  joiningDate: string;
  salary: number;
  bankAccount: string;
  ifscCode: string;
  phone: string;
  address: string;
  status: 'active' | 'inactive';
}

const EmployeeManagement: React.FC = () => {
  const [employees, setEmployees] = useLocalStorage<Employee[]>('employees', []);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  const generateEmployeeId = (): string => {
    const prefix = 'EMP';
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}${timestamp}`;
  };

  const handleAddEmployee = (employeeData: Omit<Employee, 'id'>) => {
    const newEmployee: Employee = {
      ...employeeData,
      id: generateEmployeeId(),
    };
    setEmployees([...employees, newEmployee]);
    setShowForm(false);
  };

  const handleEditEmployee = (employeeData: Omit<Employee, 'id'>) => {
    if (editingEmployee) {
      const updatedEmployees = employees.map(emp =>
        emp.id === editingEmployee.id
          ? { ...employeeData, id: editingEmployee.id }
          : emp
      );
      setEmployees(updatedEmployees);
      setEditingEmployee(null);
      setShowForm(false);
    }
  };

  const handleDeleteEmployee = (id: string) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      setEmployees(employees.filter(emp => emp.id !== id));
    }
  };

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || employee.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const exportEmployees = () => {
    // In a real application, this would export to CSV/Excel
    alert('Employee export functionality would be implemented here');
  };

  if (showForm) {
    return (
      <EmployeeForm
        employee={editingEmployee}
        onSubmit={editingEmployee ? handleEditEmployee : handleAddEmployee}
        onCancel={() => {
          setShowForm(false);
          setEditingEmployee(null);
        }}
      />
    );
  }

  if (viewingEmployee) {
    return (
      <EmployeeDetails
        employee={viewingEmployee}
        onBack={() => setViewingEmployee(null)}
        onEdit={() => {
          setEditingEmployee(viewingEmployee);
          setViewingEmployee(null);
          setShowForm(true);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employee Management</h1>
          <p className="text-gray-600 mt-1">Manage your company's workforce</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={exportEmployees}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Employee
          </button>
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
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Employee Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joining Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Salary
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
              {filteredEmployees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                      <div className="text-sm text-gray-500">{employee.id}</div>
                      <div className="text-sm text-gray-500">{employee.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {employee.role}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(employee.joiningDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{employee.salary.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      employee.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {employee.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setViewingEmployee(employee)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingEmployee(employee);
                          setShowForm(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteEmployee(employee.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredEmployees.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No employees found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{employees.length}</div>
            <div className="text-sm text-gray-600">Total Employees</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {employees.filter(emp => emp.status === 'active').length}
            </div>
            <div className="text-sm text-gray-600">Active Employees</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              ₹{employees.reduce((sum, emp) => sum + emp.salary, 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total Monthly Salary</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeManagement;