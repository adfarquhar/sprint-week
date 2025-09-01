import React from 'react';
import { useDrop, useDrag } from 'react-dnd';
import { User, Clock, AlertTriangle, Calendar, Flag, CheckCircle } from 'lucide-react';

const TaskItem = ({ task, onMoveTask, bulkActionMode, isSelected, onTaskSelect }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'task',
    item: { id: task.id, status: task.status },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const handleStatusChange = (newStatus) => {
    onMoveTask(task.id, newStatus);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'todo': return 'bg-gray-50 border-gray-200 hover:border-gray-300';
      case 'inprogress': return 'bg-blue-50 border-blue-200 hover:border-blue-300';
      case 'blocked': return 'bg-red-50 border-red-200 hover:border-red-300';
      case 'done': return 'bg-green-50 border-green-200 hover:border-green-300';
      default: return 'bg-gray-50 border-gray-200 hover:border-gray-300';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'todo': return { text: 'To Do', bg: 'bg-gray-100', textColor: 'text-gray-700' };
      case 'inprogress': return { text: 'In Progress', bg: 'bg-blue-100', textColor: 'text-blue-700' };
      case 'blocked': return { text: 'Blocked', bg: 'bg-red-100', textColor: 'text-red-700' };
      case 'done': return { text: 'Done', bg: 'bg-green-100', textColor: 'text-green-700' };
      default: return { text: 'To Do', bg: 'bg-gray-100', textColor: 'text-gray-700' };
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return { bg: 'bg-red-100', text: 'text-red-700', icon: 'text-red-500' };
      case 'medium': return { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: 'text-yellow-500' };
      case 'low': return { bg: 'bg-green-100', text: 'text-green-700', icon: 'text-green-500' };
      default: return { bg: 'bg-gray-100', text: 'text-gray-700', icon: 'text-gray-500' };
    }
  };

  // Check if task is overdue
  const isOverdue = task.dueDate && task.dueDate.toDate() < new Date() && task.status !== 'done';

  const statusBadge = getStatusBadge(task.status);
  const priorityStyle = getPriorityColor(task.priority);

  return (
    <div
      ref={drag}
      className={`relative p-4 rounded-lg border-2 ${getStatusColor(task.status)} mb-3 transition-all duration-200 hover:shadow-lg ${
        isDragging ? 'opacity-50 rotate-2 scale-105' : ''
      } cursor-move ${isOverdue ? 'ring-2 ring-red-400 ring-opacity-50' : ''}`}
    >
      {/* Bulk Selection Checkbox */}
      {bulkActionMode && (
        <div className="absolute top-2 right-2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onTaskSelect(task.id)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          />
        </div>
      )}

      {/* Status and Priority Badges */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusBadge.bg} ${statusBadge.textColor}`}>
            {statusBadge.text}
          </span>
          {task.status === 'done' && (
            <CheckCircle className="h-4 w-4 text-green-500" />
          )}
        </div>
        {task.priority && (
          <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${priorityStyle.bg} ${priorityStyle.text}`}>
            <Flag className={`h-3 w-3 mr-1 ${priorityStyle.icon}`} />
            {task.priority.toUpperCase()}
          </div>
        )}
      </div>

      {/* Task Title */}
      <h3 className={`font-semibold text-gray-900 mb-2 ${isOverdue ? 'text-red-700' : ''}`}>
        {task.title}
      </h3>

      {/* Task Description */}
      {task.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>
      )}

      {/* Task Metadata */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center">
            <User className="h-3 w-3 mr-1" />
            <span>{task.assignedTo}</span>
          </div>
          <div className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            <span>{task.timeEstimate}h estimated</span>
          </div>
        </div>

        {/* Due Date Indicator */}
        {task.dueDate && (
          <div className={`flex items-center text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
            <Calendar className="h-3 w-3 mr-1" />
            <span>Due: {task.dueDate.toDate().toLocaleDateString()}</span>
            {isOverdue && <span className="ml-2 text-red-500">⚠️ OVERDUE</span>}
          </div>
        )}

        {/* Blocked Reason */}
        {task.status === 'blocked' && task.blockReason && (
          <div className="flex items-start text-xs text-red-600 bg-red-50 p-2 rounded">
            <AlertTriangle className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
            <span className="font-medium">{task.blockReason}</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-1 pt-3 border-t border-gray-200">
        {task.status !== 'todo' && (
          <button
            onClick={() => handleStatusChange('todo')}
            className="px-2 py-1 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-all duration-200"
          >
            To Do
          </button>
        )}
        {task.status !== 'inprogress' && (
          <button
            onClick={() => handleStatusChange('inprogress')}
            className="px-2 py-1 text-xs font-medium bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-all duration-200"
          >
            Start
          </button>
        )}
        {task.status !== 'blocked' && (
          <button
            onClick={() => handleStatusChange('blocked')}
            className="px-2 py-1 text-xs font-medium bg-red-100 hover:bg-red-200 text-red-700 rounded transition-all duration-200"
          >
            Block
          </button>
        )}
        {task.status !== 'done' && (
          <button
            onClick={() => handleStatusChange('done')}
            className="px-2 py-1 text-xs font-medium bg-green-100 hover:bg-green-200 text-green-700 rounded transition-all duration-200"
          >
            Done
          </button>
        )}
      </div>

      {/* Creation Date */}
      {task.createdDate && (
        <div className="mt-2 text-xs text-gray-400">
          Created: {task.createdDate.toDate().toLocaleDateString()}
        </div>
      )}
    </div>
  );
};

const TaskColumn = ({ title, status, tasks, onMoveTask, bulkActionMode, selectedTasks, onTaskSelect }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'task',
    drop: (item) => {
      if (item.status !== status) {
        onMoveTask(item.id, status);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  return (
    <div
      ref={drop}
      className={`bg-white rounded-lg border-2 min-h-[400px] transition-colors ${
        isOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
      }`}
    >
      <div className="p-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-900 text-lg">{title}</h2>
        <p className="text-sm text-gray-600 mt-1">
          {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
        </p>
      </div>

      <div className="p-4 space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <div className="text-sm">No tasks in {title.toLowerCase()}</div>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onMoveTask={onMoveTask}
              bulkActionMode={bulkActionMode}
              isSelected={selectedTasks.has(task.id)}
              onTaskSelect={onTaskSelect}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default TaskColumn;
