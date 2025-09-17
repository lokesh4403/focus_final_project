import React from 'react';
import { DivideIcon as LucideIcon, Building } from 'lucide-react';

interface Tab {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface SidebarProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg border-r border-gray-200 z-30">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Building className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">PayrollPro</h1>
            <p className="text-sm text-gray-500">Management System</p>
          </div>
        </div>
      </div>
      
      <nav className="mt-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`w-full flex items-center px-6 py-3 text-left transition-colors duration-200 ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className={`h-5 w-5 mr-3 ${isActive ? 'text-blue-700' : 'text-gray-400'}`} />
              <span className="font-medium">{tab.label}</span>
            </button>
          );
        })}
      </nav>
      
      <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200">
        <div className="text-center">
          <p className="text-sm text-gray-500">© 2025 PayrollPro</p>
          <p className="text-xs text-gray-400">Version 1.0.0</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;