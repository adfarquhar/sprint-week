import React, { useState, useEffect } from 'react';
import { UserX, UserCheck, Calendar, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';

const ExcuseTracker = () => {
  const { user } = useAuth();
  const [excuses, setExcuses] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    personName: '',
    excuse: '',
    meetingType: 'standup',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'excuses'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const excusesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setExcuses(excusesData);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.personName.trim() || !formData.excuse.trim()) return;

    try {
      await addDoc(collection(db, 'excuses'), {
        ...formData,
        date: Timestamp.fromDate(new Date(formData.date)),
        createdAt: Timestamp.now(),
        createdBy: user.email
      });

      setFormData({
        personName: '',
        excuse: '',
        meetingType: 'standup',
        date: new Date().toISOString().split('T')[0]
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding excuse:', error);
      alert('Failed to add excuse. Please try again.');
    }
  };

  const getMeetingTypeColor = (type) => {
    switch (type) {
      case 'standup': return 'bg-blue-100 text-blue-800';
      case 'retrospective': return 'bg-green-100 text-green-800';
      case 'planning': return 'bg-purple-100 text-purple-800';
      case 'demo': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    return timestamp.toDate().toLocaleDateString();
  };

  const getTodaysExcuses = () => {
    const today = new Date().toDateString();
    return excuses.filter(excuse => {
      if (!excuse.date) return false;
      return excuse.date.toDate().toDateString() === today;
    });
  };

  const todaysExcuses = getTodaysExcuses();

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
          <UserX className="h-5 w-5 text-gray-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Excuse Tracker</h3>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary text-sm"
        >
          {showAddForm ? 'Cancel' : 'Add Excuse'}
        </button>
      </div>

      {/* Today's Summary */}
      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 text-gray-500 mr-1" />
            <span className="text-sm font-medium text-gray-700">Today</span>
          </div>
          <span className="text-sm font-semibold text-gray-900">
            {todaysExcuses.length} {todaysExcuses.length === 1 ? 'excuse' : 'excuses'}
          </span>
        </div>
      </div>

      {/* Add Excuse Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Person Name *
              </label>
              <input
                type="text"
                value={formData.personName}
                onChange={(e) => setFormData({...formData, personName: e.target.value})}
                className="input-field"
                placeholder="Enter name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meeting Type
              </label>
              <select
                value={formData.meetingType}
                onChange={(e) => setFormData({...formData, meetingType: e.target.value})}
                className="select-field"
              >
                <option value="standup">Daily Standup</option>
                <option value="retrospective">Retrospective</option>
                <option value="planning">Sprint Planning</option>
                <option value="demo">Demo</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
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
                Excuse *
              </label>
              <textarea
                value={formData.excuse}
                onChange={(e) => setFormData({...formData, excuse: e.target.value})}
                className="input-field resize-none"
                rows={3}
                placeholder="Enter excuse or reason for absence"
                required
              />
            </div>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="btn-secondary text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary text-sm"
              >
                Add Excuse
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Excuses List */}
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {excuses.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <UserCheck className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <div className="text-sm">No excuses recorded yet</div>
          </div>
        ) : (
          excuses.map((excuse) => (
            <div key={excuse.id} className="border border-gray-200 rounded-lg p-3">
              <div className="flex justify-between items-start mb-2">
                <div className="font-medium text-gray-900">{excuse.personName}</div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getMeetingTypeColor(excuse.meetingType)}`}>
                  {excuse.meetingType}
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-2">{excuse.excuse}</p>

              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>{formatDate(excuse.date)}</span>
                <span>By: {excuse.createdBy}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick Stats */}
      {excuses.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-gray-900">{excuses.length}</div>
              <div className="text-xs text-gray-600">Total</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900">{todaysExcuses.length}</div>
              <div className="text-xs text-gray-600">Today</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900">
                {new Set(excuses.map(e => e.personName)).size}
              </div>
              <div className="text-xs text-gray-600">Unique</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExcuseTracker;
