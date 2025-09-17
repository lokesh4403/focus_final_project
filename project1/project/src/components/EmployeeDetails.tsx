import React from 'react';
import { ArrowLeft, Edit2, Mail, Phone, Calendar, DollarSign, CreditCard } from 'lucide-react';

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

interface EmployeeDetailsProps {
  employee: Employee;
  onBack: () => void;
  onEdit: () => void;
}

const EmployeeDetails: React.FC<EmployeeDetailsProps> = ({ employee, onBack, onEdit }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Employee Details</h1>
            <p className="text-gray-600 mt-1">Complete information for {employee.name}</p>
          </div>
        </div>
        <button
          onClick={onEdit}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Edit2 className="h-4 w-4 mr-2" />
          Edit Employee
        </button>
      </div>

      {/* Employee Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-6">
          <div className="h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-blue-600">
              {employee.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{employee.name}</h2>
            <p className="text-lg text-gray-600">{employee.role}</p>
            <p className="text-sm text-gray-500">Employee ID: {employee.id}</p>
            <div className="mt-2">
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                employee.status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium text-gray-900">{employee.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Phone className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-medium text-gray-900">{employee.phone}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="h-5 w-5 text-gray-400 mt-0.5">📍</div>
              <div>
                <p className="text-sm text-gray-600">Address</p>
                <p className="font-medium text-gray-900">{employee.address}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Employment Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Employment Information</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Joining Date</p>
                <p className="font-medium text-gray-900">
                  {new Date(employee.joiningDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <DollarSign className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Monthly Salary</p>
                <p className="font-medium text-gray-900">₹{employee.salary.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="h-5 w-5 text-gray-400">📅</div>
              <div>
                <p className="text-sm text-gray-600">Years of Service</p>
                <p className="font-medium text-gray-900">
                  {Math.floor((new Date().getTime() - new Date(employee.joiningDate).getTime()) / (1000 * 60 * 60 * 24 * 365))} years
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Bank Details</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <CreditCard className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Account Number</p>
                <p className="font-medium text-gray-900">{employee.bankAccount}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="h-5 w-5 text-gray-400">🏦</div>
              <div>
                <p className="text-sm text-gray-600">IFSC Code</p>
                <p className="font-medium text-gray-900">{employee.ifscCode}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Annual Salary</span>
              <span className="font-medium text-gray-900">₹{(employee.salary * 12).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Employee Type</span>
              <span className="font-medium text-gray-900">Full-time</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Department</span>
              <span className="font-medium text-gray-900">General</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <h4 className="font-medium text-gray-900">Generate Payslip</h4>
            <p className="text-sm text-gray-600 mt-1">Create payslip for current month</p>
          </button>
          <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <h4 className="font-medium text-gray-900">View Attendance</h4>
            <p className="text-sm text-gray-600 mt-1">Check attendance records</p>
          </button>
          <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <h4 className="font-medium text-gray-900">Send Email</h4>
            <p className="text-sm text-gray-600 mt-1">Send notification to employee</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetails;