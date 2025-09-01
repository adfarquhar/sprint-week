import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, Clock, CheckCircle, Settings } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';

const GoalEditModal = ({ isOpen, onClose, currentGoal, onSave }) => {
  const [tempGoal, setTempGoal] = useState(currentGoal);

  const handleSave = () => {
    const goal = parseFloat(tempGoal);
    if (goal && goal > 0) {
      onSave(goal);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Sprint Goal</h3>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sprint Goal (hours)
          </label>
          <input
            type="number"
            value={tempGoal}
            onChange={(e) => setTempGoal(e.target.value)}
            min="1"
            step="0.5"
            className="input-field w-full"
            placeholder="40"
          />
        </div>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="btn-primary"
          >
            Save Goal
          </button>
        </div>
      </div>
    </div>
  );
};

const ProgressMeter = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [sprintGoal, setSprintGoal] = useState(40); // Default 40 hours
  const [loading, setLoading] = useState(true);
  const [showGoalModal, setShowGoalModal] = useState(false);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'tasks'));
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

  // Calculate today's progress
  const getTodaysProgress = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return tasks.filter(task => {
      if (task.status === 'done' && task.completedDate) {
        const completedDate = task.completedDate.toDate();
        return completedDate >= today && completedDate < tomorrow;
      }
      return false;
    });
  };

  // Calculate sprint progress
  const getSprintProgress = () => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week
    weekStart.setHours(0, 0, 0, 0);

    const completedTasks = tasks.filter(task => {
      if (task.status === 'done' && task.completedDate) {
        const completedDate = task.completedDate.toDate();
        return completedDate >= weekStart;
      }
      return false;
    });

    return completedTasks;
  };

  const todaysTasks = getTodaysProgress();
  const sprintTasks = getSprintProgress();

  const todaysHours = todaysTasks.reduce((total, task) => total + (task.timeEstimate || 0), 0);
  const sprintHours = sprintTasks.reduce((total, task) => total + (task.timeEstimate || 0), 0);

  const todaysPercentage = Math.min((todaysHours / 8) * 100, 100); // Assuming 8-hour work day
  const sprintPercentage = Math.min((sprintHours / sprintGoal) * 100, 100);

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressBarColor = (percentage) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="card">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-2 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Target className="h-5 w-5 text-gray-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Progress Meter</h3>
        </div>
      </div>

      {/* Sprint Goal Display - Prominent */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Target className="h-6 w-6 text-blue-600 mr-3" />
            <div>
              <h4 className="text-lg font-semibold text-gray-900">Sprint Goal</h4>
              <p className="text-sm text-gray-600">Current week target</p>
            </div>
          </div>
          <button
            onClick={() => setShowGoalModal(true)}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <Settings className="h-4 w-4 mr-2" />
            Edit
          </button>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="text-3xl font-bold text-blue-600">
            {sprintGoal}h
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              {sprintHours.toFixed(1)}h
            </div>
            <div className="text-sm text-gray-600">completed</div>
          </div>
        </div>

        {/* Goal Progress Bar */}
        <div className="mb-3">
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${
                sprintPercentage >= 100 ? 'bg-green-500' :
                sprintPercentage >= 80 ? 'bg-blue-500' :
                sprintPercentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(sprintPercentage, 100)}%` }}
            ></div>
          </div>
        </div>

        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">
            {sprintPercentage.toFixed(1)}% complete
          </span>
          <span className={`font-medium ${
            sprintPercentage >= 100 ? 'text-green-600' :
            sprintPercentage >= 80 ? 'text-blue-600' :
            sprintPercentage >= 60 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {sprintPercentage >= 100 ? '🎉 Goal Achieved!' :
             sprintPercentage >= 80 ? 'Almost there!' :
             sprintPercentage >= 60 ? 'Good progress!' : 'Keep going!'}
          </span>
        </div>

        {/* Quick Goal Adjustments */}
        <div className="mt-4 pt-4 border-t border-blue-200">
          <div className="flex justify-center space-x-2">
            <button
              onClick={() => setSprintGoal(Math.max(1, sprintGoal - 5))}
              className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              -5h
            </button>
            <button
              onClick={() => setSprintGoal(Math.max(1, sprintGoal - 1))}
              className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              -1h
            </button>
            <button
              onClick={() => setSprintGoal(sprintGoal + 1)}
              className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              +1h
            </button>
            <button
              onClick={() => setSprintGoal(sprintGoal + 5)}
              className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              +5h
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Today's Progress */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-gray-600 mr-2" />
              <div>
                <span className="text-sm font-medium text-gray-900">Today's Progress</span>
                <div className="text-xs text-gray-500">Daily goal: 8 hours</div>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-lg font-bold ${getProgressColor(todaysPercentage)}`}>
                {todaysHours.toFixed(1)}h
              </div>
              <div className="text-xs text-gray-500">of 8h goal</div>
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${getProgressBarColor(todaysPercentage)}`}
              style={{ width: `${todaysPercentage}%` }}
            ></div>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-600">
              {todaysTasks.length} task{todaysTasks.length !== 1 ? 's' : ''} completed
            </span>
            <span className={`font-medium ${getProgressColor(todaysPercentage)}`}>
              {todaysPercentage.toFixed(0)}% complete
            </span>
          </div>
        </div>

        {/* Sprint Progress */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center">
              <TrendingUp className="h-5 w-5 text-gray-600 mr-2" />
              <div>
                <span className="text-sm font-medium text-gray-900">Sprint Progress</span>
                <div className="text-xs text-gray-500">This week's performance</div>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-lg font-bold ${getProgressColor(sprintPercentage)}`}>
                {sprintHours.toFixed(1)}h
              </div>
              <div className="text-xs text-gray-500">of {sprintGoal}h goal</div>
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${getProgressBarColor(sprintPercentage)}`}
              style={{ width: `${Math.min(sprintPercentage, 100)}%` }}
            ></div>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-600">
              {sprintTasks.length} task{sprintTasks.length !== 1 ? 's' : ''} completed
            </span>
            <span className={`font-medium ${getProgressColor(sprintPercentage)}`}>
              {sprintPercentage.toFixed(0)}% complete
            </span>
          </div>
        </div>



        {/* Enhanced Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-700">{tasks.filter(t => t.status === 'done').length}</div>
            <div className="text-xs text-green-600 font-medium">Completed</div>
            <div className="text-xs text-green-500 mt-1">
              {tasks.filter(t => t.status === 'done').reduce((sum, t) => sum + (t.timeEstimate || 0), 0).toFixed(1)}h
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-700">{tasks.filter(t => t.status === 'inprogress').length}</div>
            <div className="text-xs text-blue-600 font-medium">In Progress</div>
            <div className="text-xs text-blue-500 mt-1">
              {tasks.filter(t => t.status === 'inprogress').reduce((sum, t) => sum + (t.timeEstimate || 0), 0).toFixed(1)}h
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-700">{tasks.filter(t => t.status === 'todo').length}</div>
            <div className="text-xs text-yellow-600 font-medium">To Do</div>
            <div className="text-xs text-yellow-500 mt-1">
              {tasks.filter(t => t.status === 'todo').reduce((sum, t) => sum + (t.timeEstimate || 0), 0).toFixed(1)}h
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-700">{tasks.filter(t => t.status === 'blocked').length}</div>
            <div className="text-xs text-red-600 font-medium">Blocked</div>
            <div className="text-xs text-red-500 mt-1">
              {tasks.filter(t => t.status === 'blocked').reduce((sum, t) => sum + (t.timeEstimate || 0), 0).toFixed(1)}h
            </div>
          </div>
        </div>

        {/* Time Tracking Comparison */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-green-800 mb-3">⏱️ Time Tracking Insights</h4>

          <div className="space-y-3">
            {/* Estimated vs Actual Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-lg font-bold text-green-700">
                  {tasks.filter(t => t.status === 'done').reduce((sum, t) => sum + (t.timeEstimate || 0), 0).toFixed(1)}h
                </div>
                <div className="text-xs text-green-600">Estimated Time</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-700">
                  {tasks.filter(t => t.status === 'done').reduce((sum, t) => sum + (t.timeEstimate || 0), 0).toFixed(1)}h
                </div>
                <div className="text-xs text-blue-600">Completed Time</div>
              </div>
            </div>

            {/* Time Estimation Accuracy */}
            <div className="bg-white rounded p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-700">Estimation Accuracy</span>
                <span className="text-sm font-medium text-green-600">100%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">Based on completed tasks</div>
            </div>

            {/* Task Time Distribution */}
            <div>
              <h5 className="text-xs font-medium text-green-800 mb-2">Task Time Distribution</h5>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white rounded p-2">
                  <div className="text-sm font-bold text-green-700">
                    {tasks.filter(t => t.status === 'done' && (t.timeEstimate || 0) <= 2).length}
                  </div>
                  <div className="text-xs text-green-600">Quick (≤2h)</div>
                </div>
                <div className="bg-white rounded p-2">
                  <div className="text-sm font-bold text-yellow-700">
                    {tasks.filter(t => t.status === 'done' && (t.timeEstimate || 0) > 2 && (t.timeEstimate || 0) <= 8).length}
                  </div>
                  <div className="text-xs text-yellow-600">Medium (2-8h)</div>
                </div>
                <div className="bg-white rounded p-2">
                  <div className="text-sm font-bold text-red-700">
                    {tasks.filter(t => t.status === 'done' && (t.timeEstimate || 0) > 8).length}
                  </div>
                  <div className="text-xs text-red-600">Large (&gt;8h)</div>
                </div>
              </div>
            </div>

            {/* Time Efficiency Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <h5 className="text-xs font-medium text-blue-800 mb-1">💡 Time Management Tip</h5>
              <p className="text-xs text-blue-700">
                {tasks.filter(t => t.status === 'done' && (t.timeEstimate || 0) > 8).length > tasks.filter(t => t.status === 'done').length * 0.3
                  ? "Consider breaking large tasks into smaller, more manageable chunks for better time estimation accuracy."
                  : tasks.filter(t => t.status === 'done').length < 3
                    ? "Complete more tasks to get better insights into your time estimation patterns."
                    : "Your time estimates are looking consistent! Keep up the great work."
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Goal Edit Modal */}
      <GoalEditModal
        isOpen={showGoalModal}
        onClose={() => setShowGoalModal(false)}
        currentGoal={sprintGoal}
        onSave={setSprintGoal}
      />
    </div>
  );
};

export default ProgressMeter;
