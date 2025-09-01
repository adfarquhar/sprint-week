import React, { useState, useEffect } from 'react';
import { TrendingUp, BarChart3, Target, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';

const VelocityChart = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'tasks'), orderBy('completedDate', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTasks(tasksData);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const getVelocityData = () => {
    const now = new Date();
    let periods = [];

    switch (selectedPeriod) {
      case 'week':
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          periods.push({
            date: date.toISOString().split('T')[0],
            label: date.toLocaleDateString('en-US', { weekday: 'short' }),
            hours: 0,
            tasks: 0
          });
        }
        break;
      case 'month':
        for (let i = 29; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          periods.push({
            date: date.toISOString().split('T')[0],
            label: date.getDate().toString(),
            hours: 0,
            tasks: 0
          });
        }
        break;
      case 'quarter':
        for (let i = 11; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - (i * 7));
          periods.push({
            date: date.toISOString().split('T')[0],
            label: `Week ${12 - i}`,
            hours: 0,
            tasks: 0
          });
        }
        break;
    }

    // Calculate data for each period
    const completedTasks = tasks.filter(task => task.status === 'done' && task.completedDate);

    periods.forEach(period => {
      const periodTasks = completedTasks.filter(task => {
        const taskDate = task.completedDate.toDate().toISOString().split('T')[0];
        return taskDate === period.date;
      });

      period.tasks = periodTasks.length;
      period.hours = periodTasks.reduce((total, task) => total + (task.timeEstimate || 0), 0);
    });

    return periods;
  };

  const getOverallStats = () => {
    const completedTasks = tasks.filter(task => task.status === 'done' && task.completedDate);
    const totalHours = completedTasks.reduce((total, task) => total + (task.timeEstimate || 0), 0);
    const totalTasks = completedTasks.length;

    // Calculate average velocity
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const recentTasks = completedTasks.filter(task => {
      return task.completedDate.toDate() >= weekAgo;
    });

    const recentHours = recentTasks.reduce((total, task) => total + (task.timeEstimate || 0), 0);
    const averageVelocity = recentHours / 7; // hours per day

    return {
      totalHours,
      totalTasks,
      averageVelocity: averageVelocity.toFixed(1),
      recentTasks: recentTasks.length
    };
  };

  const velocityData = getVelocityData();
  const stats = getOverallStats();

  const maxHours = Math.max(...velocityData.map(d => d.hours), 1);
  const maxTasks = Math.max(...velocityData.map(d => d.tasks), 1);

  if (loading) {
    return (
      <div className="card">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <BarChart3 className="h-5 w-5 text-gray-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Velocity Chart</h3>
        </div>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="select-field text-sm"
        >
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
          <option value="quarter">Last 12 Weeks</option>
        </select>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-center">
            <Target className="h-4 w-4 text-blue-600 mr-2" />
            <span className="text-sm text-blue-800">Total Hours</span>
          </div>
          <div className="text-2xl font-bold text-blue-900 mt-1">{stats.totalHours.toFixed(1)}</div>
        </div>
        <div className="bg-green-50 rounded-lg p-3">
          <div className="flex items-center">
            <TrendingUp className="h-4 w-4 text-green-600 mr-2" />
            <span className="text-sm text-green-800">Avg Velocity</span>
          </div>
          <div className="text-2xl font-bold text-green-900 mt-1">{stats.averageVelocity}h/day</div>
        </div>
      </div>

      {/* Hours Chart */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Hours Completed</h4>
        <div className="flex items-end space-x-1 h-32">
          {velocityData.map((data, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div
                className="bg-blue-500 rounded-t w-full transition-all duration-300 hover:bg-blue-600"
                style={{
                  height: `${(data.hours / maxHours) * 100}%`,
                  minHeight: data.hours > 0 ? '4px' : '0px'
                }}
              ></div>
              <div className="text-xs text-gray-600 mt-2 transform -rotate-45 origin-top">
                {data.label}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {data.hours.toFixed(1)}h
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tasks Chart */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Tasks Completed</h4>
        <div className="flex items-end space-x-1 h-24">
          {velocityData.map((data, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div
                className="bg-green-500 rounded-t w-full transition-all duration-300 hover:bg-green-600"
                style={{
                  height: `${(data.tasks / maxTasks) * 100}%`,
                  minHeight: data.tasks > 0 ? '4px' : '0px'
                }}
              ></div>
              <div className="text-xs text-gray-600 mt-2 transform -rotate-45 origin-top">
                {data.label}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {data.tasks}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="border-t border-gray-200 pt-4">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-gray-900">{stats.totalTasks}</div>
            <div className="text-xs text-gray-600">Tasks Completed</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900">
              {stats.totalTasks > 0 ? (stats.totalHours / stats.totalTasks).toFixed(1) : '0.0'}
            </div>
            <div className="text-xs text-gray-600">Avg Hours/Task</div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
          <Calendar className="h-4 w-4 mr-1" />
          Recent Activity (7 days)
        </h4>
        <div className="text-sm text-gray-600">
          {stats.recentTasks} tasks completed • {stats.totalHours.toFixed(1)} total hours
        </div>
      </div>
    </div>
  );
};

export default VelocityChart;
