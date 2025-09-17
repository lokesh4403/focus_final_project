const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth methods
  async login(credentials: { username: string; password: string }) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    if (response.token) {
      this.token = response.token;
      localStorage.setItem('auth_token', response.token);
    }
    
    return response;
  }

  async logout() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // Employee methods
  async getEmployees(params: any = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/employees?${queryString}`);
  }

  async getEmployee(id: string) {
    return this.request(`/employees/${id}`);
  }

  async createEmployee(employeeData: any) {
    return this.request('/employees', {
      method: 'POST',
      body: JSON.stringify(employeeData),
    });
  }

  async updateEmployee(id: string, employeeData: any) {
    return this.request(`/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(employeeData),
    });
  }

  async deleteEmployee(id: string) {
    return this.request(`/employees/${id}`, {
      method: 'DELETE',
    });
  }

  // Attendance methods
  async getAttendance(params: any = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/attendance?${queryString}`);
  }

  async markAttendance(attendanceData: any) {
    return this.request('/attendance', {
      method: 'POST',
      body: JSON.stringify(attendanceData),
    });
  }

  async markAbsent(data: { employee_id: string; date: string; notes?: string }) {
    return this.request('/attendance/absent', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAttendanceSummary(month: string) {
    return this.request(`/attendance/summary/${month}`);
  }

  // Payroll methods
  async getPayroll(params: any = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/payroll?${queryString}`);
  }

  async generatePayroll(data: { month: string }) {
    return this.request('/payroll/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePayrollStatus(id: string, status: string) {
    return this.request(`/payroll/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async getPayslip(id: string) {
    const response = await fetch(`${API_BASE_URL}/payroll/${id}/payslip`, {
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate payslip');
    }
    
    return response.blob();
  }

  async emailPayslip(id: string) {
    return this.request(`/payroll/${id}/email`, {
      method: 'POST',
    });
  }

  async getPayrollStats(month: string) {
    return this.request(`/payroll/stats/${month}`);
  }

  // Expense methods
  async getExpenses(params: any = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/expenses?${queryString}`);
  }

  async createExpense(expenseData: any) {
    return this.request('/expenses', {
      method: 'POST',
      body: JSON.stringify(expenseData),
    });
  }

  async updateExpenseStatus(id: string, status: string) {
    return this.request(`/expenses/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async getRevenue(params: any = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/expenses/revenue?${queryString}`);
  }

  async createRevenue(revenueData: any) {
    return this.request('/expenses/revenue', {
      method: 'POST',
      body: JSON.stringify(revenueData),
    });
  }

  async getFinancialSummary(month: string) {
    return this.request(`/expenses/summary/${month}`);
  }

  // Settings methods
  async getSettings() {
    return this.request('/settings');
  }

  async updateSettings(settings: any) {
    return this.request('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async getAllowances() {
    return this.request('/settings/allowances');
  }

  async createAllowance(allowanceData: any) {
    return this.request('/settings/allowances', {
      method: 'POST',
      body: JSON.stringify(allowanceData),
    });
  }

  async getDeductions() {
    return this.request('/settings/deductions');
  }

  async createDeduction(deductionData: any) {
    return this.request('/settings/deductions', {
      method: 'POST',
      body: JSON.stringify(deductionData),
    });
  }

  // Dashboard methods
  async getDashboardStats() {
    return this.request('/dashboard/stats');
  }

  async getDashboardActivities() {
    return this.request('/dashboard/activities');
  }

  async getDashboardTrends() {
    return this.request('/dashboard/trends');
  }

  // Reports methods
  async downloadPayrollReport(month: string, format: 'excel' | 'pdf' = 'excel') {
    const response = await fetch(`${API_BASE_URL}/reports/payroll/${format}/${month}`, {
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate report');
    }
    
    return response.blob();
  }

  async downloadAttendanceReport(month: string) {
    const response = await fetch(`${API_BASE_URL}/reports/attendance/excel/${month}`, {
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate attendance report');
    }
    
    return response.blob();
  }

  async downloadExpenseReport(month: string) {
    const response = await fetch(`${API_BASE_URL}/reports/expenses/excel/${month}`, {
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate expense report');
    }
    
    return response.blob();
  }
}

export const apiService = new ApiService();