import React, { useState, useEffect } from 'react';
import { TrendingUp, BarChart3, Target, Calendar } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';

const VelocityChart = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [selectedBar, setSelectedBar] = useState(null);

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
            fullDate: date.toLocaleDateString(),
            hours: 0,
            tasks: 0,
            tooltip: null
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
            fullDate: date.toLocaleDateString(),
            hours: 0,
            tasks: 0,
            tooltip: null
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
            fullDate: `${date.toLocaleDateString()} - ${new Date(date.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString()}`,
            hours: 0,
            tasks: 0,
            tooltip: null
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

      // Create tooltip data
      if (periodTasks.length > 0) {
        period.tooltip = {
          date: period.fullDate,
          tasks: periodTasks.length,
          hours: period.hours.toFixed(1),
          taskList: periodTasks.slice(0, 3).map(task => task.title)
        };
      }
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

  // Calculate trend line
  const calculateTrend = (data, key) => {
    const values = data.map(d => d[key]);
    const n = values.length;
    if (n < 2) return [];

    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, i) => sum + val * i, 0);
    const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return data.map((_, i) => slope * i + intercept);
  };

  const hoursTrend = calculateTrend(velocityData, 'hours');
  const tasksTrend = calculateTrend(velocityData, 'tasks');

  // Calculate moving average (3-day)
  const calculateMovingAverage = (data, window = 3) => {
    return data.map((_, index) => {
      const start = Math.max(0, index - window + 1);
      const end = index + 1;
      const slice = data.slice(start, end);
      return slice.reduce((sum, val) => sum + val, 0) / slice.length;
    });
  };

  const hoursMovingAvg = calculateMovingAverage(velocityData.map(d => d.hours));
  const tasksMovingAvg = calculateMovingAverage(velocityData.map(d => d.tasks));

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

      {/* Enhanced Overall Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <Target className="h-5 w-5 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-blue-800">Total Hours</span>
          </div>
          <div className="text-2xl font-bold text-blue-900">{stats.totalHours.toFixed(1)}</div>
          <div className="text-xs text-blue-600 mt-1">All time</div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-sm font-medium text-green-800">Avg Velocity</span>
          </div>
          <div className="text-2xl font-bold text-green-900">{stats.averageVelocity}</div>
          <div className="text-xs text-green-600 mt-1">Hours/day</div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <BarChart3 className="h-5 w-5 text-purple-600 mr-2" />
            <span className="text-sm font-medium text-purple-800">Total Tasks</span>
          </div>
          <div className="text-2xl font-bold text-purple-900">{stats.totalTasks}</div>
          <div className="text-xs text-purple-600 mt-1">Completed</div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <Calendar className="h-5 w-5 text-orange-600 mr-2" />
            <span className="text-sm font-medium text-orange-800">This Week</span>
          </div>
          <div className="text-2xl font-bold text-orange-900">{stats.recentTasks}</div>
          <div className="text-xs text-orange-600 mt-1">Tasks done</div>
        </div>
      </div>

      {/* Hours Chart */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-sm font-medium text-gray-700">Hours Completed</h4>
          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded mr-1"></div>
              <span>Actual</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-0.5 bg-red-400 border-t-2 border-dashed mr-1"></div>
              <span>Trend</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-0.5 bg-green-400 mr-1"></div>
              <span>Avg</span>
            </div>
          </div>
        </div>
        <div className="relative">
          <div className="flex items-end space-x-1 h-32">
            {velocityData.map((data, index) => (
              <div key={index} className="flex-1 flex flex-col items-center group relative">
                {/* Trend line */}
                {hoursTrend[index] && (
                  <div
                    className="absolute bottom-0 left-1/2 w-0.5 bg-red-400 opacity-60"
                    style={{
                      height: `${Math.max(0, (hoursTrend[index] / maxHours) * 100)}%`,
                      transform: 'translateX(-50%)',
                      borderTop: index > 0 ? '1px dashed #f87171' : 'none'
                    }}
                  ></div>
                )}
                {/* Moving average line */}
                {hoursMovingAvg[index] && (
                  <div
                    className="absolute bottom-0 left-1/2 w-0.5 bg-green-400 opacity-60"
                    style={{
                      height: `${Math.max(0, (hoursMovingAvg[index] / maxHours) * 100)}%`,
                      transform: 'translateX(-50%)'
                    }}
                  ></div>
                )}
                {/* Bar */}
                <div
                  className="bg-blue-500 rounded-t w-full transition-all duration-300 hover:bg-blue-600 cursor-pointer relative"
                  style={{
                    height: `${(data.hours / maxHours) * 100}%`,
                    minHeight: data.hours > 0 ? '4px' : '0px'
                  }}
                  onClick={() => data.tooltip && setSelectedBar({ ...data.tooltip, type: 'hours' })}
                >
                  {/* Value label on bar */}
                  {data.hours > 0 && (
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-blue-700 bg-white px-1 rounded shadow-sm">
                      {data.hours.toFixed(1)}
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-600 mt-2 transform -rotate-45 origin-top">
                  {data.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tasks Chart */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-sm font-medium text-gray-700">Tasks Completed</h4>
          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded mr-1"></div>
              <span>Actual</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-0.5 bg-red-400 border-t-2 border-dashed mr-1"></div>
              <span>Trend</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-0.5 bg-purple-400 mr-1"></div>
              <span>Avg</span>
            </div>
          </div>
        </div>
        <div className="relative">
          <div className="flex items-end space-x-1 h-24">
            {velocityData.map((data, index) => (
              <div key={index} className="flex-1 flex flex-col items-center group relative">
                {/* Trend line */}
                {tasksTrend[index] && (
                  <div
                    className="absolute bottom-0 left-1/2 w-0.5 bg-red-400 opacity-60"
                    style={{
                      height: `${Math.max(0, (tasksTrend[index] / maxTasks) * 100)}%`,
                      transform: 'translateX(-50%)',
                      borderTop: index > 0 ? '1px dashed #f87171' : 'none'
                    }}
                  ></div>
                )}
                {/* Moving average line */}
                {tasksMovingAvg[index] && (
                  <div
                    className="absolute bottom-0 left-1/2 w-0.5 bg-purple-400 opacity-60"
                    style={{
                      height: `${Math.max(0, (tasksMovingAvg[index] / maxTasks) * 100)}%`,
                      transform: 'translateX(-50%)'
                    }}
                  ></div>
                )}
                {/* Bar */}
                <div
                  className="bg-green-500 rounded-t w-full transition-all duration-300 hover:bg-green-600 cursor-pointer relative"
                  style={{
                    height: `${(data.tasks / maxTasks) * 100}%`,
                    minHeight: data.tasks > 0 ? '4px' : '0px'
                  }}
                  onClick={() => data.tooltip && setSelectedBar({ ...data.tooltip, type: 'tasks' })}
                >
                  {/* Value label on bar */}
                  {data.tasks > 0 && (
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-green-700 bg-white px-1 rounded shadow-sm">
                      {data.tasks}
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-600 mt-2 transform -rotate-45 origin-top">
                  {data.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {selectedBar && (
        <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                {selectedBar.date}
              </h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex items-center">
                  <span className={`inline-block w-3 h-3 rounded mr-2 ${selectedBar.type === 'hours' ? 'bg-blue-500' : 'bg-green-500'}`}></span>
                  {selectedBar.tasks} task{selectedBar.tasks !== 1 ? 's' : ''} completed
                </div>
                <div className="flex items-center">
                  <span className="inline-block w-3 h-3 bg-blue-500 rounded mr-2"></span>
                  {selectedBar.hours} hours worked
                </div>
              </div>
              {selectedBar.taskList && selectedBar.taskList.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs font-medium text-gray-700 mb-1">Recent tasks:</div>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {selectedBar.taskList.map((task, index) => (
                      <li key={index} className="truncate">• {task}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <button
              onClick={() => setSelectedBar(null)}
              className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            >
              ×
            </button>
          </div>
        </div>
      )}

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
