import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Plus, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';

const SessionScheduler = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    attendees: '',
    sessionType: 'meeting'
  });

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'sessions'), orderBy('date', 'asc'), orderBy('startTime', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSessions(sessionsData);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.date || !formData.startTime || !formData.endTime) return;

    try {
      const sessionData = {
        ...formData,
        date: Timestamp.fromDate(new Date(formData.date)),
        attendees: formData.attendees ? formData.attendees.split(',').map(a => a.trim()) : [],
        createdAt: Timestamp.now(),
        createdBy: user.email
      };

      if (editingSession) {
        await updateDoc(doc(db, 'sessions', editingSession.id), sessionData);
        setEditingSession(null);
      } else {
        await addDoc(collection(db, 'sessions'), sessionData);
      }

      resetForm();
      setShowAddForm(false);
    } catch (error) {
      console.error('Error saving session:', error);
      alert('Failed to save session. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      date: '',
      startTime: '',
      endTime: '',
      attendees: '',
      sessionType: 'meeting'
    });
  };

  const handleEdit = (session) => {
    setEditingSession(session);
    setFormData({
      title: session.title,
      description: session.description || '',
      date: session.date.toDate().toISOString().split('T')[0],
      startTime: session.startTime,
      endTime: session.endTime,
      attendees: session.attendees ? session.attendees.join(', ') : '',
      sessionType: session.sessionType || 'meeting'
    });
    setShowAddForm(true);
  };

  const handleDelete = async (sessionId) => {
    if (!confirm('Are you sure you want to delete this session?')) return;

    try {
      await deleteDoc(doc(db, 'sessions', sessionId));
    } catch (error) {
      console.error('Error deleting session:', error);
      alert('Failed to delete session. Please try again.');
    }
  };

  const getSessionTypeColor = (type) => {
    switch (type) {
      case 'meeting': return 'bg-blue-100 text-blue-800';
      case 'work-session': return 'bg-green-100 text-green-800';
      case 'review': return 'bg-purple-100 text-purple-800';
      case 'planning': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const getUpcomingSessions = () => {
    const now = new Date();
    return sessions.filter(session => {
      const sessionDate = session.date.toDate();
      const sessionDateTime = new Date(sessionDate);
      const [hours, minutes] = session.endTime.split(':');
      sessionDateTime.setHours(parseInt(hours), parseInt(minutes));
      return sessionDateTime >= now;
    });
  };

  const getTodaysSessions = () => {
    const today = new Date().toDateString();
    return sessions.filter(session => {
      if (!session.date) return false;
      return session.date.toDate().toDateString() === today;
    });
  };

  const upcomingSessions = getUpcomingSessions();
  const todaysSessions = getTodaysSessions();

  if (loading) {
    return (
      <div className="card">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Calendar className="h-5 w-5 text-gray-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Session Scheduler</h3>
        </div>
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            if (showAddForm) {
              setEditingSession(null);
              resetForm();
            }
          }}
          className="btn-primary text-sm flex items-center"
        >
          <Plus className="h-4 w-4 mr-1" />
          {showAddForm ? 'Cancel' : 'Add Session'}
        </button>
      </div>

      {/* Today's Summary */}
      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Clock className="h-4 w-4 text-gray-500 mr-1" />
            <span className="text-sm font-medium text-gray-700">Today</span>
          </div>
          <span className="text-sm font-semibold text-gray-900">
            {todaysSessions.length} {todaysSessions.length === 1 ? 'session' : 'sessions'}
          </span>
        </div>
      </div>

      {/* Add/Edit Session Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="input-field"
                placeholder="Enter session title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Session Type
              </label>
              <select
                value={formData.sessionType}
                onChange={(e) => setFormData({...formData, sessionType: e.target.value})}
                className="select-field"
              >
                <option value="meeting">Meeting</option>
                <option value="work-session">Work Session</option>
                <option value="review">Code Review</option>
                <option value="planning">Planning</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time *
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                  className="input-field"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time *
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Attendees
                </label>
                <input
                  type="text"
                  value={formData.attendees}
                  onChange={(e) => setFormData({...formData, attendees: e.target.value})}
                  className="input-field"
                  placeholder="Comma separated names"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="input-field resize-none"
                rows={2}
                placeholder="Enter session description (optional)"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingSession(null);
                  resetForm();
                }}
                className="btn-secondary text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary text-sm"
              >
                {editingSession ? 'Update' : 'Add'} Session
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Sessions List */}
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {sessions.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <div className="text-sm">No sessions scheduled yet</div>
          </div>
        ) : (
          sessions.map((session) => (
            <div key={session.id} className="border border-gray-200 rounded-lg p-3">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-medium text-gray-900">{session.title}</h4>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getSessionTypeColor(session.sessionType)}`}>
                      {session.sessionType}
                    </span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600 space-x-4">
                    <span>{formatDate(session.date)}</span>
                    <span>{session.startTime} - {session.endTime}</span>
                    {session.attendees && session.attendees.length > 0 && (
                      <div className="flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        <span>{session.attendees.length}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex space-x-1 ml-2">
                  <button
                    onClick={() => handleEdit(session)}
                    className="text-blue-600 hover:text-blue-800 p-1"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(session.id)}
                    className="text-red-600 hover:text-red-800 p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {session.description && (
                <p className="text-sm text-gray-600 mb-2">{session.description}</p>
              )}

              {session.attendees && session.attendees.length > 0 && (
                <div className="text-xs text-gray-500">
                  Attendees: {session.attendees.join(', ')}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Quick Stats */}
      {sessions.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-gray-900">{sessions.length}</div>
              <div className="text-xs text-gray-600">Total</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900">{upcomingSessions.length}</div>
              <div className="text-xs text-gray-600">Upcoming</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900">{todaysSessions.length}</div>
              <div className="text-xs text-gray-600">Today</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionScheduler;
