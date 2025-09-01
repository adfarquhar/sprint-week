import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import TaskBoard from '../components/TaskBoard';
import PomodoroTimer from '../components/PomodoroTimer';
import StandupTimer from '../components/StandupTimer';
import ProgressMeter from '../components/ProgressMeter';
import ExcuseTracker from '../components/ExcuseTracker';
import SessionScheduler from '../components/SessionScheduler';
import VelocityChart from '../components/VelocityChart';

const Dashboard = () => {
  const { user, userRole, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} userRole={userRole} onLogout={logout} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Task Board - Takes up 3 columns on large screens */}
          <div className="lg:col-span-3">
            <TaskBoard />
          </div>

          {/* Sidebar - Takes up 1 column on large screens */}
          <div className="space-y-6">
            <PomodoroTimer />
            <StandupTimer />
            <ProgressMeter />
            <VelocityChart />
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ExcuseTracker />
          <SessionScheduler />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
