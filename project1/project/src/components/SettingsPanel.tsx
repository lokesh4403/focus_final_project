import React, { useState } from 'react';
import { Save, Plus, X, Settings } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface SystemSettings {
  workingHours: number;
  lateThreshold: number; // minutes
  halfDayThreshold: number; // hours
  workingDaysPerMonth: number;
  pfRate: number;
  esiRate: number;
  companyName: string;
  companyAddress: string;
  taxId: string;
}

interface CustomAllowance {
  id: string;
  name: string;
  type: 'fixed' | 'percentage';
  value: number;
  isActive: boolean;
}

interface CustomDeduction {
  id: string;
  name: string;
  type: 'fixed' | 'percentage';
  value: number;
  isActive: boolean;
}

const SettingsPanel: React.FC = () => {
  const [settings, setSettings] = useLocalStorage<SystemSettings>('settings', {
    workingHours: 8,
    lateThreshold: 30,
    halfDayThreshold: 4,
    workingDaysPerMonth: 26,
    pfRate: 12,
    esiRate: 1.75,
    companyName: 'PayrollPro Company',
    companyAddress: '123 Business Street, City, State - 12345',
    taxId: 'GST123456789',
  });

  const [allowances, setAllowances] = useLocalStorage<CustomAllowance[]>('customAllowances', [
    { id: '1', name: 'House Rent Allowance', type: 'percentage', value: 40, isActive: true },
    { id: '2', name: 'Transport Allowance', type: 'fixed', value: 2000, isActive: true },
    { id: '3', name: 'Medical Allowance', type: 'fixed', value: 1500, isActive: true },
  ]);

  const [deductions, setDeductions] = useLocalStorage<CustomDeduction[]>('customDeductions', [
    { id: '1', name: 'Professional Tax', type: 'fixed', value: 200, isActive: true },
    { id: '2', name: 'Income Tax', type: 'percentage', value: 10, isActive: true },
  ]);

  const [newAllowance, setNewAllowance] = useState({ name: '', type: 'fixed' as const, value: 0 });
  const [newDeduction, setNewDeduction] = useState({ name: '', type: 'fixed' as const, value: 0 });
  const [showAllowanceForm, setShowAllowanceForm] = useState(false);
  const [showDeductionForm, setShowDeductionForm] = useState(false);

  const handleSettingsChange = (field: keyof SystemSettings, value: string | number) => {
    setSettings(prev => ({
      ...prev,
      [field]: typeof value === 'string' ? value : Number(value),
    }));
  };

  const handleSaveSettings = () => {
    // Settings are automatically saved via useLocalStorage hook
    alert('Settings saved successfully!');
  };

  const addAllowance = () => {
    if (!newAllowance.name || newAllowance.value <= 0) return;

    const allowance: CustomAllowance = {
      id: Date.now().toString(),
      ...newAllowance,
      isActive: true,
    };

    setAllowances([...allowances, allowance]);
    setNewAllowance({ name: '', type: 'fixed', value: 0 });
    setShowAllowanceForm(false);
  };

  const addDeduction = () => {
    if (!newDeduction.name || newDeduction.value <= 0) return;

    const deduction: CustomDeduction = {
      id: Date.now().toString(),
      ...newDeduction,
      isActive: true,
    };

    setDeductions([...deductions, deduction]);
    setNewDeduction({ name: '', type: 'fixed', value: 0 });
    setShowDeductionForm(false);
  };

  const toggleAllowance = (id: string) => {
    setAllowances(allowances.map(allowance =>
      allowance.id === id ? { ...allowance, isActive: !allowance.isActive } : allowance
    ));
  };

  const toggleDeduction = (id: string) => {
    setDeductions(deductions.map(deduction =>
      deduction.id === id ? { ...deduction, isActive: !deduction.isActive } : deduction
    ));
  };

  const removeAllowance = (id: string) => {
    setAllowances(allowances.filter(allowance => allowance.id !== id));
  };

  const removeDeduction = (id: string) => {
    setDeductions(deductions.filter(deduction => deduction.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600 mt-1">Configure your payroll system preferences</p>
        </div>
        <button
          onClick={handleSaveSettings}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Settings
        </button>
      </div>

      {/* Company Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
            <input
              type="text"
              value={settings.companyName}
              onChange={(e) => handleSettingsChange('companyName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tax ID</label>
            <input
              type="text"
              value={settings.taxId}
              onChange={(e) => handleSettingsChange('taxId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Company Address</label>
            <textarea
              value={settings.companyAddress}
              onChange={(e) => handleSettingsChange('companyAddress', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Attendance Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Working Hours per Day</label>
            <input
              type="number"
              min="1"
              max="24"
              value={settings.workingHours}
              onChange={(e) => handleSettingsChange('workingHours', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Late Threshold (minutes)</label>
            <input
              type="number"
              min="0"
              value={settings.lateThreshold}
              onChange={(e) => handleSettingsChange('lateThreshold', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Half Day Threshold (hours)</label>
            <input
              type="number"
              min="0"
              max="24"
              step="0.5"
              value={settings.halfDayThreshold}
              onChange={(e) => handleSettingsChange('halfDayThreshold', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Working Days per Month</label>
            <input
              type="number"
              min="1"
              max="31"
              value={settings.workingDaysPerMonth}
              onChange={(e) => handleSettingsChange('workingDaysPerMonth', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Payroll Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payroll Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">PF Rate (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={settings.pfRate}
              onChange={(e) => handleSettingsChange('pfRate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ESI Rate (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={settings.esiRate}
              onChange={(e) => handleSettingsChange('esiRate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Custom Allowances */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Custom Allowances</h3>
          <button
            onClick={() => setShowAllowanceForm(true)}
            className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Allowance
          </button>
        </div>

        <div className="space-y-3">
          {allowances.map((allowance) => (
            <div key={allowance.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={allowance.isActive}
                  onChange={() => toggleAllowance(allowance.id)}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <div>
                  <span className="font-medium text-gray-900">{allowance.name}</span>
                  <span className="ml-2 text-sm text-gray-500">
                    ({allowance.type === 'fixed' ? `₹${allowance.value}` : `${allowance.value}%`})
                  </span>
                </div>
              </div>
              <button
                onClick={() => removeAllowance(allowance.id)}
                className="text-red-600 hover:text-red-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {showAllowanceForm && (
          <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <h4 className="font-medium text-gray-900 mb-3">Add New Allowance</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Allowance name"
                value={newAllowance.name}
                onChange={(e) => setNewAllowance({...newAllowance, name: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <select
                value={newAllowance.type}
                onChange={(e) => setNewAllowance({...newAllowance, type: e.target.value as 'fixed' | 'percentage'})}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="fixed">Fixed Amount</option>
                <option value="percentage">Percentage</option>
              </select>
              <input
                type="number"
                placeholder={newAllowance.type === 'fixed' ? 'Amount' : 'Percentage'}
                value={newAllowance.value}
                onChange={(e) => setNewAllowance({...newAllowance, value: Number(e.target.value)})}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex justify-end space-x-2 mt-3">
              <button
                onClick={() => setShowAllowanceForm(false)}
                className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addAllowance}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Custom Deductions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Custom Deductions</h3>
          <button
            onClick={() => setShowDeductionForm(true)}
            className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Deduction
          </button>
        </div>

        <div className="space-y-3">
          {deductions.map((deduction) => (
            <div key={deduction.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={deduction.isActive}
                  onChange={() => toggleDeduction(deduction.id)}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <div>
                  <span className="font-medium text-gray-900">{deduction.name}</span>
                  <span className="ml-2 text-sm text-gray-500">
                    ({deduction.type === 'fixed' ? `₹${deduction.value}` : `${deduction.value}%`})
                  </span>
                </div>
              </div>
              <button
                onClick={() => removeDeduction(deduction.id)}
                className="text-red-600 hover:text-red-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {showDeductionForm && (
          <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <h4 className="font-medium text-gray-900 mb-3">Add New Deduction</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Deduction name"
                value={newDeduction.name}
                onChange={(e) => setNewDeduction({...newDeduction, name: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <select
                value={newDeduction.type}
                onChange={(e) => setNewDeduction({...newDeduction, type: e.target.value as 'fixed' | 'percentage'})}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="fixed">Fixed Amount</option>
                <option value="percentage">Percentage</option>
              </select>
              <input
                type="number"
                placeholder={newDeduction.type === 'fixed' ? 'Amount' : 'Percentage'}
                value={newDeduction.value}
                onChange={(e) => setNewDeduction({...newDeduction, value: Number(e.target.value)})}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex justify-end space-x-2 mt-3">
              <button
                onClick={() => setShowDeductionForm(false)}
                className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addDeduction}
                className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPanel;