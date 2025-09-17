import React, { useState } from 'react';
import { ArrowLeft, Save, X } from 'lucide-react';

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

interface EmployeeFormProps {
  employee?: Employee | null;
  onSubmit: (employee: Omit<Employee, 'id'>) => void;
  onCancel: () => void;
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({ employee, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: employee?.name || '',
    email: employee?.email || '',
    role: employee?.role || '',
    joiningDate: employee?.joiningDate || '',
    salary: employee?.salary || 0,
    bankAccount: employee?.bankAccount || '',
    ifscCode: employee?.ifscCode || '',
    phone: employee?.phone || '',
    address: employee?.address || '',
    status: employee?.status || 'active' as 'active' | 'inactive',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.role.trim()) newErrors.role = 'Role is required';
    if (!formData.joiningDate) newErrors.joiningDate = 'Joining date is required';
    if (formData.salary <= 0) newErrors.salary = 'Salary must be greater than 0';
    if (!formData.bankAccount.trim()) newErrors.bankAccount = 'Bank account is required';
    if (!formData.ifscCode.trim()) newErrors.ifscCode = 'IFSC code is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'salary' ? Number(value) : value,
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onCancel}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {employee ? 'Edit Employee' : 'Add New Employee'}
            </h1>
            <p className="text-gray-600 mt-1">
              {employee ? 'Update employee information' : 'Enter employee details to add to the system'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter full name"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter email address"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.phone ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter phone number"
              />
              {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status *
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                Address *
              </label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.address ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter complete address"
              />
              {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Employment Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                Job Role *
              </label>
              <input
                type="text"
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.role ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter job role"
              />
              {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role}</p>}
            </div>

            <div>
              <label htmlFor="joiningDate" className="block text-sm font-medium text-gray-700 mb-2">
                Joining Date *
              </label>
              <input
                type="date"
                id="joiningDate"
                name="joiningDate"
                value={formData.joiningDate}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.joiningDate ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.joiningDate && <p className="mt-1 text-sm text-red-600">{errors.joiningDate}</p>}
            </div>

            <div>
              <label htmlFor="salary" className="block text-sm font-medium text-gray-700 mb-2">
                Monthly Salary (₹) *
              </label>
              <input
                type="number"
                id="salary"
                name="salary"
                value={formData.salary}
                onChange={handleChange}
                min="0"
                step="1"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.salary ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter monthly salary"
              />
              {errors.salary && <p className="mt-1 text-sm text-red-600">{errors.salary}</p>}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Bank Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="bankAccount" className="block text-sm font-medium text-gray-700 mb-2">
                Bank Account Number *
              </label>
              <input
                type="text"
                id="bankAccount"
                name="bankAccount"
                value={formData.bankAccount}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.bankAccount ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter bank account number"
              />
              {errors.bankAccount && <p className="mt-1 text-sm text-red-600">{errors.bankAccount}</p>}
            </div>

            <div>
              <label htmlFor="ifscCode" className="block text-sm font-medium text-gray-700 mb-2">
                IFSC Code *
              </label>
              <input
                type="text"
                id="ifscCode"
                name="ifscCode"
                value={formData.ifscCode}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.ifscCode ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter IFSC code"
              />
              {errors.ifscCode && <p className="mt-1 text-sm text-red-600">{errors.ifscCode}</p>}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </button>
          <button
            type="submit"
            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Save className="h-4 w-4 mr-2" />
            {employee ? 'Update Employee' : 'Add Employee'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmployeeForm;