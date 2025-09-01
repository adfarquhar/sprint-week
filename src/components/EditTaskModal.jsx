import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const EditTaskModal = ({ task, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    timeEstimate: '',
    priority: 'medium',
    dueDate: '',
    blockReason: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Helper function to safely convert Firestore Timestamp to date string
  const safeToDateString = (dateField) => {
    if (!dateField) return '';
    if (typeof dateField.toDate === 'function') {
      return dateField.toDate().toISOString().split('T')[0];
    }
    if (dateField instanceof Date) {
      return dateField.toISOString().split('T')[0];
    }
    if (typeof dateField === 'string') {
      return new Date(dateField).toISOString().split('T')[0];
    }
    return '';
  };

  // Initialize form with task data
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        assignedTo: task.assignedTo || '',
        timeEstimate: task.timeEstimate || '',
        priority: task.priority || 'medium',
        dueDate: safeToDateString(task.dueDate),
        blockReason: task.blockReason || ''
      });
    }
  }, [task]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.assignedTo.trim()) {
      newErrors.assignedTo = 'Assignee is required';
    }

    if (!formData.timeEstimate || formData.timeEstimate <= 0) {
      newErrors.timeEstimate = 'Time estimate must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit(task.id, {
        ...formData,
        timeEstimate: parseFloat(formData.timeEstimate)
      });
      onClose();
    } catch (error) {
      console.error('Error updating task:', error);
      // Error is already handled in TaskBoard component
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Edit Task</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`input-field ${errors.title ? 'border-red-500' : ''}`}
              placeholder="Enter task title"
              required
              aria-required="true"
              aria-describedby={errors.title ? "title-error" : undefined}
              aria-invalid={errors.title ? "true" : "false"}
            />
            {errors.title && (
              <p id="title-error" className="text-red-500 text-xs mt-1" role="alert">{errors.title}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="input-field resize-none"
              placeholder="Enter task description (optional)"
            />
          </div>

          <div>
            <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 mb-1">
              Assigned To *
            </label>
            <input
              type="text"
              id="assignedTo"
              name="assignedTo"
              value={formData.assignedTo}
              onChange={handleChange}
              className={`input-field ${errors.assignedTo ? 'border-red-500' : ''}`}
              placeholder="Enter assignee name"
              required
            />
            {errors.assignedTo && (
              <p className="text-red-500 text-xs mt-1">{errors.assignedTo}</p>
            )}
          </div>

          <div>
            <label htmlFor="timeEstimate" className="block text-sm font-medium text-gray-700 mb-1">
              Time Estimate (hours) *
            </label>
            <input
              type="number"
              id="timeEstimate"
              name="timeEstimate"
              value={formData.timeEstimate}
              onChange={handleChange}
              min="0.1"
              step="0.1"
              className={`input-field ${errors.timeEstimate ? 'border-red-500' : ''}`}
              placeholder="Enter estimated hours"
              required
            />
            {errors.timeEstimate && (
              <p className="text-red-500 text-xs mt-1">{errors.timeEstimate}</p>
            )}
          </div>

          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="select-field"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
              Due Date (Optional)
            </label>
            <input
              type="date"
              id="dueDate"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]}
              className="input-field"
            />
          </div>

          <div>
            <label htmlFor="blockReason" className="block text-sm font-medium text-gray-700 mb-1">
              Block Reason (Optional)
            </label>
            <input
              type="text"
              id="blockReason"
              name="blockReason"
              value={formData.blockReason}
              onChange={handleChange}
              className="input-field"
              placeholder="Why is this task blocked?"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTaskModal;
