import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, Download, Filter } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkIn: string;
  checkOut: string;
  workingHours: number;
  status: 'present' | 'absent' | 'late' | 'half-day';
  notes?: string;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
}

const AttendanceManagement: React.FC = () => {
  const [employees] = useLocalStorage<Employee[]>('employees', []);
  const [attendance, setAttendance] = useLocalStorage<AttendanceRecord[]>('attendance', []);
  const [settings] = useLocalStorage('settings', {
    workingHours: 8,
    lateThreshold: 30, // minutes
    halfDayThreshold: 4, // hours
  });

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [checkInEmployee, setCheckInEmployee] = useState<Employee | null>(null);
  const [checkInTime, setCheckInTime] = useState('');
  const [checkOutTime, setCheckOutTime] = useState('');

  const generateAttendanceId = (): string => {
    return `ATT${Date.now()}`;
  };

  const calculateWorkingHours = (checkIn: string, checkOut: string): number => {
    if (!checkIn || !checkOut) return 0;
    const checkInTime = new Date(`2000-01-01T${checkIn}`);
    const checkOutTime = new Date(`2000-01-01T${checkOut}`);
    const diffMs = checkOutTime.getTime() - checkInTime.getTime();
    return Math.max(0, diffMs / (1000 * 60 * 60));
  };

  const determineStatus = (checkIn: string, workingHours: number): 'present' | 'late' | 'half-day' => {
    const checkInTime = new Date(`2000-01-01T${checkIn}`);
    const standardStart = new Date(`2000-01-01T09:00`);
    const lateThresholdMs = settings.lateThreshold * 60 * 1000;
    
    const isLate = checkInTime.getTime() > (standardStart.getTime() + lateThresholdMs);
    const isHalfDay = workingHours < settings.halfDayThreshold;
    
    if (isHalfDay) return 'half-day';
    if (isLate) return 'late';
    return 'present';
  };

  const handleCheckIn = (employee: Employee) => {
    setCheckInEmployee(employee);
    setCheckInTime(new Date().toTimeString().slice(0, 5));
    setCheckOutTime('');
    setShowCheckInModal(true);
  };

  const handleSaveAttendance = () => {
    if (!checkInEmployee || !checkInTime) return;

    const workingHours = checkOutTime ? calculateWorkingHours(checkInTime, checkOutTime) : 0;
    const status = checkOutTime ? determineStatus(checkInTime, workingHours) : 'present';

    const newRecord: AttendanceRecord = {
      id: generateAttendanceId(),
      employeeId: checkInEmployee.id,
      employeeName: checkInEmployee.name,
      date: selectedDate,
      checkIn: checkInTime,
      checkOut: checkOutTime,
      workingHours,
      status,
    };

    // Remove existing record for same employee and date
    const filteredAttendance = attendance.filter(
      record => !(record.employeeId === checkInEmployee.id && record.date === selectedDate)
    );

    setAttendance([...filteredAttendance, newRecord]);
    setShowCheckInModal(false);
    setCheckInEmployee(null);
  };

  const markAbsent = (employee: Employee) => {
    const existingRecord = attendance.find(
      record => record.employeeId === employee.id && record.date === selectedDate
    );

    if (existingRecord) {
      const updatedAttendance = attendance.map(record =>
        record.id === existingRecord.id
          ? { ...record, status: 'absent' as const, checkIn: '', checkOut: '', workingHours: 0 }
          : record
      );
      setAttendance(updatedAttendance);
    } else {
      const newRecord: AttendanceRecord = {
        id: generateAttendanceId(),
        employeeId: employee.id,
        employeeName: employee.name,
        date: selectedDate,
        checkIn: '',
        checkOut: '',
        workingHours: 0,
        status: 'absent',
      };
      setAttendance([...attendance, newRecord]);
    }
  };

  const getTodayAttendance = () => {
    return attendance.filter(record => record.date === selectedDate);
  };

  const getEmployeeAttendance = (employeeId: string) => {
    return attendance.find(record => record.employeeId === employeeId && record.date === selectedDate);
  };

  const getMonthlyStats = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyRecords = attendance.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
    });

    const totalPresent = monthlyRecords.filter(r => r.status === 'present').length;
    const totalLate = monthlyRecords.filter(r => r.status === 'late').length;
    const totalAbsent = monthlyRecords.filter(r => r.status === 'absent').length;
    const totalHalfDay = monthlyRecords.filter(r => r.status === 'half-day').length;

    return { totalPresent, totalLate, totalAbsent, totalHalfDay };
  };

  const monthlyStats = getMonthlyStats();
  const todayAttendance = getTodayAttendance();

  const filteredEmployees = selectedEmployee === 'all' 
    ? employees 
    : employees.filter(emp => emp.id === selectedEmployee);

  const exportAttendance = () => {
    alert('Attendance export functionality would be implemented here');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance Management</h1>
          <p className="text-gray-600 mt-1">Track and manage employee attendance</p>
        </div>
        <button
          onClick={exportAttendance}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Present (Month)</p>
              <p className="text-2xl font-bold text-green-600">{monthlyStats.totalPresent}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Late (Month)</p>
              <p className="text-2xl font-bold text-orange-600">{monthlyStats.totalLate}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-orange-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Absent (Month)</p>
              <p className="text-2xl font-bold text-red-600">{monthlyStats.totalAbsent}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Half Day (Month)</p>
              <p className="text-2xl font-bold text-blue-600">{monthlyStats.totalHalfDay}</p>
            </div>
            <Clock className="h-8 w-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Employees</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Employee Attendance Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Daily Attendance - {new Date(selectedDate).toLocaleDateString()}
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
                  Check In
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check Out
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Working Hours
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
              {filteredEmployees.map((employee) => {
                const attendanceRecord = getEmployeeAttendance(employee.id);
                
                return (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                        <div className="text-sm text-gray-500">{employee.id}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {attendanceRecord?.checkIn || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {attendanceRecord?.checkOut || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {attendanceRecord?.workingHours?.toFixed(1) || '0.0'} hrs
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {attendanceRecord ? (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          attendanceRecord.status === 'present' ? 'bg-green-100 text-green-800' :
                          attendanceRecord.status === 'late' ? 'bg-orange-100 text-orange-800' :
                          attendanceRecord.status === 'half-day' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {attendanceRecord.status}
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          Not marked
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {!attendanceRecord || attendanceRecord.status !== 'absent' ? (
                          <button
                            onClick={() => handleCheckIn(employee)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            {attendanceRecord ? 'Edit' : 'Check In'}
                          </button>
                        ) : null}
                        <button
                          onClick={() => markAbsent(employee)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Mark Absent
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Check In Modal */}
      {showCheckInModal && checkInEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Mark Attendance - {checkInEmployee.name}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Check In Time
                </label>
                <input
                  type="time"
                  value={checkInTime}
                  onChange={(e) => setCheckInTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Check Out Time (Optional)
                </label>
                <input
                  type="time"
                  value={checkOutTime}
                  onChange={(e) => setCheckOutTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {checkInTime && checkOutTime && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Working Hours: {calculateWorkingHours(checkInTime, checkOutTime).toFixed(1)} hrs
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCheckInModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAttendance}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Attendance
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceManagement;