import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import Header from '../components/Header';
import TaskBoard from '../components/TaskBoard';
import PomodoroTimer from '../components/PomodoroTimer';
import StandupTimer from '../components/StandupTimer';
import ProgressMeter from '../components/ProgressMeter';
import ExcuseTracker from '../components/ExcuseTracker';
import SessionScheduler from '../components/SessionScheduler';
import VelocityChart from '../components/VelocityChart';
import { ClipboardList, Timer, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  const { user, userRole, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('tasks');

  const tabs = [
    { id: 'tasks', label: 'Tasks & Planning', icon: ClipboardList },
    { id: 'time', label: 'Time Management', icon: Timer },
    { id: 'progress', label: 'Progress & Analytics', icon: TrendingUp }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'tasks':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <TaskBoard />
            </div>
            <div className="space-y-6">
              <ProgressMeter />
            </div>
          </div>
        );
      case 'time':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="md:col-span-2 lg:col-span-1">
              <PomodoroTimer />
            </div>
            <StandupTimer />
            <SessionScheduler />
          </div>
        );
      case 'progress':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <VelocityChart />
            <ExcuseTracker />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} userRole={userRole} onLogout={logout} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {renderTabContent()}
      </main>
    </div>
  );
};

export default Dashboard;
