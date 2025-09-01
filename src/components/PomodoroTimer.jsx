import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Settings, History, X } from 'lucide-react';

const PomodoroTimer = () => {
  const [time, setTime] = useState(25 * 60); // 25 minutes in seconds
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [workDuration, setWorkDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [showSettings, setShowSettings] = useState(false);
  const [cycles, setCycles] = useState(0);
  const [showBreakModal, setShowBreakModal] = useState(false);
  const [breakActivity, setBreakActivity] = useState('');
  const [sessionHistory, setSessionHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const intervalRef = useRef(null);
  const lastSavedTimeRef = useRef(null);

  // Load timer state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('pomodoroTimerState');
    if (savedState) {
      try {
        const {
          time: savedTime,
          isActive: savedIsActive,
          isBreak: savedIsBreak,
          workDuration: savedWorkDuration,
          breakDuration: savedBreakDuration,
          cycles: savedCycles,
          lastSaved
        } = JSON.parse(savedState);

        const timeDiff = Math.floor((Date.now() - lastSaved) / 1000); // seconds passed

        setWorkDuration(savedWorkDuration || 25);
        setBreakDuration(savedBreakDuration || 5);
        setCycles(savedCycles || 0);
        setIsBreak(savedIsBreak || false);

        if (savedIsActive && timeDiff > 0) {
          // Timer was running, calculate remaining time
          const remainingTime = Math.max(0, savedTime - timeDiff);
          setTime(remainingTime);
          setIsActive(remainingTime > 0); // Stop if time ran out

          if (remainingTime === 0) {
            // Timer completed while browser was closed
            if (!savedIsBreak) {
              setIsBreak(true);
              setTime((savedBreakDuration || 5) * 60);
              setCycles(prev => prev + 1);
            } else {
              setIsBreak(false);
              setTime((savedWorkDuration || 25) * 60);
            }
          }
        } else {
          setTime(savedTime || 25 * 60);
          setIsActive(false);
        }
      } catch (error) {
        console.error('Error loading timer state:', error);
        // Fall back to default values
      }
    }

    // Load session history
    const savedHistory = localStorage.getItem('pomodoroSessionHistory');
    if (savedHistory) {
      try {
        const history = JSON.parse(savedHistory);
        // Only keep today's sessions and recent ones
        const today = new Date().toDateString();
        const filteredHistory = history.filter(session => {
          const sessionDate = new Date(session.completedAt).toDateString();
          return sessionDate === today || (new Date() - new Date(session.completedAt)) < (7 * 24 * 60 * 60 * 1000); // Last 7 days
        });
        setSessionHistory(filteredHistory);
      } catch (error) {
        console.error('Error loading session history:', error);
      }
    }
  }, []);

  // Save timer state to localStorage whenever it changes
  useEffect(() => {
    const timerState = {
      time,
      isActive,
      isBreak,
      workDuration,
      breakDuration,
      cycles,
      lastSaved: Date.now()
    };
    localStorage.setItem('pomodoroTimerState', JSON.stringify(timerState));
  }, [time, isActive, isBreak, workDuration, breakDuration, cycles]);

  // Save before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      lastSavedTimeRef.current = Date.now();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);



  useEffect(() => {
    const handleTimerComplete = () => {
      setIsActive(false);
      if (!isBreak) {
        // Work session completed, start break
        setIsBreak(true);
        setTime(breakDuration * 60);
        setCycles(prev => prev + 1);

        // Save completed session to history
        const completedSession = {
          id: Date.now(),
          type: 'work',
          duration: workDuration,
          completedAt: new Date().toISOString(),
          date: new Date().toDateString()
        };

        setSessionHistory(prev => {
          const updated = [completedSession, ...prev].slice(0, 50); // Keep last 50 sessions
          localStorage.setItem('pomodoroSessionHistory', JSON.stringify(updated));
          return updated;
        });

        // Random break activity suggestion
        const breakActivities = [
          'Take a short walk around your workspace',
          'Do some gentle stretching exercises',
          'Practice deep breathing or meditation',
          'Have a healthy snack or drink water',
          'Look away from your screen at something distant',
          'Do some quick desk exercises',
          'Listen to a favorite song',
          'Write down three things you\'re grateful for',
          'Call a friend or family member',
          'Organize your workspace'
        ];
        const randomActivity = breakActivities[Math.floor(Math.random() * breakActivities.length)];
        setBreakActivity(randomActivity);

        // Show break modal and notification
        setShowBreakModal(true);
        if (Notification.permission === 'granted') {
          new Notification('Pomodoro Timer', {
            body: 'Time for a break! Take care of yourself 🎉',
            icon: '/vite.svg',
            requireInteraction: true
          });
        }
      } else {
        // Break completed, start work
        setIsBreak(false);
        setTime(workDuration * 60);
        setShowBreakModal(false);

        if (Notification.permission === 'granted') {
          new Notification('Pomodoro Timer', {
            body: 'Break time over! Ready to crush it 💪',
            icon: '/vite.svg'
          });
        }
      }
    };

    if (isActive && time > 0) {
      intervalRef.current = setInterval(() => {
        setTime((time) => time - 1);
      }, 1000);
    } else if (time === 0) {
      handleTimerComplete();
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isActive, time, isBreak, breakDuration, workDuration]);



  const toggleTimer = useCallback(() => {
    setIsActive(!isActive);
  }, [isActive]);

  const resetTimer = useCallback(() => {
    setIsActive(false);
    setTime((isBreak ? breakDuration : workDuration) * 60);
  }, [isBreak, breakDuration, workDuration]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const updateSettings = () => {
    setTime(workDuration * 60);
    setIsBreak(false);
    setIsActive(false);
    setShowSettings(false);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Only handle shortcuts when not typing in inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          toggleTimer();
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          resetTimer();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isActive, workDuration, breakDuration, isBreak, resetTimer, toggleTimer]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Pomodoro Timer</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-gray-500 hover:text-gray-700 p-1"
            title="View session history"
          >
            <History className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="text-gray-500 hover:text-gray-700 p-1"
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {showSettings ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Work Duration (minutes)
            </label>
            <input
              type="number"
              value={workDuration}
              onChange={(e) => setWorkDuration(parseInt(e.target.value) || 1)}
              min="1"
              max="60"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Break Duration (minutes)
            </label>
            <input
              type="number"
              value={breakDuration}
              onChange={(e) => setBreakDuration(parseInt(e.target.value) || 1)}
              min="1"
              max="30"
              className="input-field"
            />
          </div>
          <button
            onClick={updateSettings}
            className="btn-primary w-full"
          >
            Update Settings
          </button>
        </div>
      ) : (
        <>
          {/* Enhanced Timer Display */}
          <div className="text-center mb-6">
            {/* Progress Ring */}
            <div className="relative inline-block mb-4">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                {/* Background circle */}
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                />
                {/* Progress circle */}
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke={isBreak ? '#10b981' : '#3b82f6'}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 54}`}
                  strokeDashoffset={`${
                    2 * Math.PI * 54 * (1 - (time / ((isBreak ? breakDuration : workDuration) * 60)))
                  }`}
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>
              {/* Timer Text Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={`text-3xl font-mono font-bold ${
                  isBreak ? 'text-green-600' : 'text-blue-600'
                }`}>
                  {formatTime(time)}
                </div>
              </div>
            </div>

            {/* Status and Progress Info */}
            <div className="space-y-2">
              <div className={`text-lg font-semibold ${
                isBreak ? 'text-green-600' : 'text-blue-600'
              }`}>
                {isBreak ? 'Break Time' : 'Work Session'}
              </div>
              <div className="text-sm text-gray-600">
                Completed cycles: {cycles}
              </div>
              {isActive && (
                <div className="text-xs text-gray-500">
                  {isBreak ? 'Enjoy your break!' : 'Stay focused!'}
                </div>
              )}
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex justify-center space-x-2 mb-4">
            <button
              onClick={toggleTimer}
              className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 ${
                isActive
                  ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg'
                  : 'bg-green-500 hover:bg-green-600 text-white shadow-lg'
              }`}
            >
              {isActive ? <Pause className="h-5 w-5 mr-2" /> : <Play className="h-5 w-5 mr-2" />}
              {isActive ? 'Pause' : 'Start'}
            </button>
            <button
              onClick={resetTimer}
              className="flex items-center px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <RotateCcw className="h-5 w-5 mr-2" />
              Reset
            </button>
          </div>

          {/* Keyboard Shortcuts Hint */}
          <div className="text-center text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
            💡 <strong>Keyboard shortcuts:</strong> Space to start/stop • R to reset
          </div>
        </>
      )}

      {/* Break Reminder Modal */}
      {showBreakModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 text-center">
            <div className="mb-4">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Break Time!</h2>
              <p className="text-gray-600 mb-4">
                Great work! You've completed a focused work session.
                Time to recharge and take care of yourself.
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-green-800 mb-2">💡 Break Activity Suggestion:</h3>
              <p className="text-green-700">{breakActivity}</p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowBreakModal(false)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Start My Break
              </button>
              <button
                onClick={() => {
                  setShowBreakModal(false);
                  setIsBreak(false);
                  setTime(workDuration * 60);
                  setIsActive(true);
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Skip & Continue
              </button>
            </div>

            <div className="mt-4 text-xs text-gray-500">
              Completed {cycles} work session{cycles !== 1 ? 's' : ''} today
            </div>
          </div>
        </div>
      )}

      {/* Session History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Session History</h2>
              <button
                onClick={() => setShowHistory(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {sessionHistory.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No sessions completed yet</p>
                  <p className="text-sm mt-1">Complete your first pomodoro session to see it here!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Today's Summary */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-800 mb-2">Today's Progress</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-blue-600 font-medium">
                          {sessionHistory.filter(s => s.date === new Date().toDateString()).length}
                        </span>
                        <span className="text-blue-700"> sessions today</span>
                      </div>
                      <div>
                        <span className="text-blue-600 font-medium">
                          {sessionHistory.filter(s => s.date === new Date().toDateString()).reduce((sum, s) => sum + s.duration, 0)}
                        </span>
                        <span className="text-blue-700"> minutes focused</span>
                      </div>
                    </div>
                  </div>

                  {/* Session List */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-700">Recent Sessions</h4>
                    {sessionHistory.slice(0, 20).map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {session.duration} minute session
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(session.completedAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(session.completedAt).toLocaleDateString() === new Date().toLocaleDateString()
                            ? 'Today'
                            : new Date(session.completedAt).toLocaleDateString()
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PomodoroTimer;
