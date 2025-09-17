import { useState, useEffect } from 'react';
import LoginForm from './components/LoginForm';
import { Users, Clock, DollarSign, Receipt, BarChart3, Settings } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import EmployeeManagement from './components/EmployeeManagement';
import AttendanceManagement from './components/AttendanceManagement';
import PayrollManagement from './components/PayrollManagement';
import ExpenseTracker from './components/ExpenseTracker';
import SettingsPanel from './components/SettingsPanel';

import { ref, set, onValue } from 'firebase/database';
import { db } from './firebase';

type TabType = 'dashboard' | 'employees' | 'attendance' | 'payroll' | 'expenses' | 'settings';

const tabs = [
  { id: 'dashboard' as TabType, label: 'Dashboard', icon: BarChart3 },
  { id: 'employees' as TabType, label: 'Employees', icon: Users },
  { id: 'attendance' as TabType, label: 'Attendance', icon: Clock },
  { id: 'payroll' as TabType, label: 'Payroll', icon: DollarSign },
  { id: 'expenses' as TabType, label: 'Expenses', icon: Receipt },
  { id: 'settings' as TabType, label: 'Settings', icon: Settings },
];

type UserType = {
  username: string;
  [key: string]: any;
};

function App() {
  const [user, setUser] = useState<UserType | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  const handleLogin = (userData: UserType) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('auth_token');
  };

  const handleFirebaseWrite = () => {
    set(ref(db, 'demo/message'), {
      sender: user?.username || 'Anonymous',
      content: 'Hello from your React dashboard!',
    })
      .then(() => alert('✅ Data written to Firebase!'))
      .catch((err) => alert('❌ Failed to write: ' + err.message));
  };

  // ✅ Read from Firebase when component mounts
  useEffect(() => {
    const userRef = ref(db, 'users/user1'); // Adjust this path as needed

    const unsubscribe = onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      console.log('🔥 User Data from Firebase:', data);
    });

    return () => unsubscribe(); // Cleanup
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Logout
              </button>
            </div>
            <Dashboard />
            <button
              className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={handleFirebaseWrite}
            >
              Write to Firebase
            </button>
          </div>
        );
      case 'employees':
        return <EmployeeManagement />;
      case 'attendance':
        return <AttendanceManagement />;
      case 'payroll':
        return <PayrollManagement />;
      case 'expenses':
        return <ExpenseTracker />;
      case 'settings':
        return <SettingsPanel />;
      default:
        return <Dashboard />;
    }
  };

  if (!user) return <LoginForm onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tab: string) => setActiveTab(tab as TabType)}
      />
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto">{renderContent()}</div>
      </main>
    </div>
  );
}

export default App;
