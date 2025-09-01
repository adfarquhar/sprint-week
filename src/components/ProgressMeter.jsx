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
      <div className="flex items-center mb-4">
        <Target className="h-5 w-5 text-gray-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">Progress Meter</h3>
      </div>

      <div className="space-y-6">
        {/* Today's Progress */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-gray-500 mr-1" />
              <span className="text-sm font-medium text-gray-700">Today</span>
            </div>
            <span className={`text-sm font-semibold ${getProgressColor(todaysPercentage)}`}>
              {todaysHours.toFixed(1)}h / 8h
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${getProgressBarColor(todaysPercentage)}`}
              style={{ width: `${todaysPercentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{todaysTasks.length} tasks completed</span>
            <span>{todaysPercentage.toFixed(0)}% of daily goal</span>
          </div>
        </div>

        {/* Sprint Progress */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 text-gray-500 mr-1" />
              <span className="text-sm font-medium text-gray-700">This Sprint</span>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-sm font-semibold ${getProgressColor(sprintPercentage)}`}>
                {sprintHours.toFixed(1)}h / {sprintGoal}h
              </span>
              <button
                onClick={() => setShowGoalModal(true)}
                className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                title="Edit sprint goal"
              >
                <Settings className="h-3 w-3 mr-1" />
                Edit Goal
              </button>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${getProgressBarColor(sprintPercentage)}`}
              style={{ width: `${sprintPercentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{sprintTasks.length} tasks completed</span>
            <span>{sprintPercentage.toFixed(0)}% of sprint goal</span>
          </div>
        </div>



        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-gray-900">{tasks.filter(t => t.status === 'done').length}</div>
            <div className="text-xs text-gray-600">Total Completed</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-gray-900">{tasks.filter(t => t.status === 'inprogress').length}</div>
            <div className="text-xs text-gray-600">In Progress</div>
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
