import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Users, Timer } from 'lucide-react';

const StandupTimer = () => {
  const [time, setTime] = useState(2 * 60); // 2 minutes in seconds
  const [isActive, setIsActive] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState('');
  const [speakerDuration, setSpeakerDuration] = useState(2);
  const [speakers, setSpeakers] = useState([]);
  const [currentSpeakerIndex, setCurrentSpeakerIndex] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    const handleTimerComplete = () => {
      setIsActive(false);

      // Move to next speaker
      if (currentSpeakerIndex < speakers.length - 1) {
        const nextIndex = currentSpeakerIndex + 1;
        setCurrentSpeakerIndex(nextIndex);
        setCurrentSpeaker(speakers[nextIndex]);
        setTime(speakerDuration * 60);

        // Browser notification
        if (Notification.permission === 'granted') {
          new Notification('Standup Timer', {
            body: `${speakers[nextIndex]}'s turn! ⏰`,
            icon: '/vite.svg'
          });
        }
      } else {
        // All speakers done
        if (Notification.permission === 'granted') {
          new Notification('Standup Timer', {
            body: 'Standup meeting completed! 🎉',
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
  }, [isActive, time, currentSpeakerIndex, speakers, speakerDuration]);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTime(speakerDuration * 60);
  };

  const addSpeaker = () => {
    if (currentSpeaker.trim() && !speakers.includes(currentSpeaker.trim())) {
      setSpeakers([...speakers, currentSpeaker.trim()]);
      setCurrentSpeaker('');
    }
  };

  const removeSpeaker = (index) => {
    const newSpeakers = speakers.filter((_, i) => i !== index);
    setSpeakers(newSpeakers);

    // Adjust current speaker index if necessary
    if (index <= currentSpeakerIndex && currentSpeakerIndex > 0) {
      setCurrentSpeakerIndex(currentSpeakerIndex - 1);
      if (newSpeakers.length > 0) {
        setCurrentSpeaker(newSpeakers[Math.min(currentSpeakerIndex - 1, newSpeakers.length - 1)]);
      } else {
        setCurrentSpeaker('');
      }
    }
  };

  const startStandup = () => {
    if (speakers.length > 0) {
      setCurrentSpeakerIndex(0);
      setCurrentSpeaker(speakers[0]);
      setTime(speakerDuration * 60);
      setIsActive(true);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <div className="card">
      <div className="flex items-center mb-4">
        <Users className="h-5 w-5 text-gray-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">Standup Timer</h3>
      </div>

      <div className="space-y-4">
        {/* Add Speaker */}
        <div className="flex space-x-2">
          <input
            type="text"
            value={currentSpeaker}
            onChange={(e) => setCurrentSpeaker(e.target.value)}
            placeholder="Enter speaker name"
            className="input-field flex-1"
            onKeyPress={(e) => e.key === 'Enter' && addSpeaker()}
          />
          <button
            onClick={addSpeaker}
            className="btn-primary px-4"
          >
            Add
          </button>
        </div>

        {/* Speaker Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Speaker Duration (minutes)
          </label>
          <input
            type="number"
            value={speakerDuration}
            onChange={(e) => setSpeakerDuration(parseInt(e.target.value) || 1)}
            min="1"
            max="10"
            className="input-field"
          />
        </div>

        {/* Speaker List */}
        {speakers.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Speakers ({speakers.length})</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {speakers.map((speaker, index) => (
                <div
                  key={index}
                  className={`flex justify-between items-center p-2 rounded ${
                    index === currentSpeakerIndex
                      ? 'bg-blue-100 border border-blue-300'
                      : 'bg-gray-50'
                  }`}
                >
                  <span className="text-sm">{speaker}</span>
                  <button
                    onClick={() => removeSpeaker(index)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timer */}
        {speakers.length > 0 && (
          <div className="text-center border-t pt-4">
            <div className="text-3xl font-mono font-bold text-blue-600 mb-2">
              {formatTime(time)}
            </div>
            <div className="text-sm text-gray-600 mb-4">
              Current: {currentSpeaker || 'No speaker'}
            </div>

            <div className="flex justify-center space-x-2">
              {!isActive && currentSpeakerIndex === 0 && !currentSpeaker && (
                <button
                  onClick={startStandup}
                  className="flex items-center px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Standup
                </button>
              )}

              {isActive && (
                <button
                  onClick={toggleTimer}
                  className="flex items-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </button>
              )}

              <button
                onClick={resetTimer}
                className="flex items-center px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StandupTimer;
