import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Settings } from 'lucide-react';

const PomodoroTimer = () => {
  const [time, setTime] = useState(25 * 60); // 25 minutes in seconds
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [workDuration, setWorkDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [showSettings, setShowSettings] = useState(false);
  const [cycles, setCycles] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    const handleTimerComplete = () => {
      setIsActive(false);
      if (!isBreak) {
        // Work session completed, start break
        setIsBreak(true);
        setTime(breakDuration * 60);
        setCycles(prev => prev + 1);
        // Browser notification
        if (Notification.permission === 'granted') {
          new Notification('Pomodoro Timer', {
            body: 'Time for a break! 🎉',
            icon: '/vite.svg'
          });
        }
      } else {
        // Break completed, start work
        setIsBreak(false);
        setTime(workDuration * 60);
        // Browser notification
        if (Notification.permission === 'granted') {
          new Notification('Pomodoro Timer', {
            body: 'Break time over! Back to work 💪',
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



  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTime((isBreak ? breakDuration : workDuration) * 60);
  };

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
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="text-gray-500 hover:text-gray-700 p-1"
        >
          <Settings className="h-4 w-4" />
        </button>
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
          <div className="text-center mb-6">
            <div className={`text-4xl font-mono font-bold mb-2 ${
              isBreak ? 'text-green-600' : 'text-blue-600'
            }`}>
              {formatTime(time)}
            </div>
            <div className="text-sm text-gray-600">
              {isBreak ? 'Break Time' : 'Work Session'}
            </div>
          </div>

          <div className="flex justify-center space-x-2 mb-4">
            <button
              onClick={toggleTimer}
              className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                isActive
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {isActive ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              {isActive ? 'Pause' : 'Start'}
            </button>
            <button
              onClick={resetTimer}
              className="flex items-center px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </button>
          </div>

          <div className="text-center text-sm text-gray-600">
            Completed cycles: {cycles}
          </div>
        </>
      )}
    </div>
  );
};

export default PomodoroTimer;
