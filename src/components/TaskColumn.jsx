import React from 'react';
import { useDrop } from 'react-dnd';
import { User, Clock, AlertTriangle } from 'lucide-react';

const TaskItem = ({ task, onMoveTask }) => {
  const handleStatusChange = (newStatus) => {
    onMoveTask(task.id, newStatus);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'todo': return 'bg-gray-100 border-gray-300';
      case 'inprogress': return 'bg-blue-100 border-blue-300';
      case 'blocked': return 'bg-red-100 border-red-300';
      case 'done': return 'bg-green-100 border-green-300';
      default: return 'bg-gray-100 border-gray-300';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className={`p-4 rounded-lg border-2 ${getStatusColor(task.status)} mb-3 transition-all duration-200 hover:shadow-md`}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-gray-900 text-sm">{task.title}</h3>
        {task.priority && (
          <span className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>
            {task.priority.toUpperCase()}
          </span>
        )}
      </div>

      {task.description && (
        <p className="text-sm text-gray-600 mb-3">{task.description}</p>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
        <div className="flex items-center">
          <User className="h-3 w-3 mr-1" />
          <span>{task.assignedTo}</span>
        </div>
        <div className="flex items-center">
          <Clock className="h-3 w-3 mr-1" />
          <span>{task.timeEstimate}h</span>
        </div>
      </div>

      {task.status === 'blocked' && task.blockReason && (
        <div className="flex items-center text-xs text-red-600 mb-3">
          <AlertTriangle className="h-3 w-3 mr-1" />
          <span>{task.blockReason}</span>
        </div>
      )}

      <div className="flex gap-1">
        {task.status !== 'todo' && (
          <button
            onClick={() => handleStatusChange('todo')}
            className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded transition-colors"
          >
            To Do
          </button>
        )}
        {task.status !== 'inprogress' && (
          <button
            onClick={() => handleStatusChange('inprogress')}
            className="px-2 py-1 text-xs bg-blue-200 hover:bg-blue-300 rounded transition-colors"
          >
            In Progress
          </button>
        )}
        {task.status !== 'blocked' && (
          <button
            onClick={() => handleStatusChange('blocked')}
            className="px-2 py-1 text-xs bg-red-200 hover:bg-red-300 rounded transition-colors"
          >
            Blocked
          </button>
        )}
        {task.status !== 'done' && (
          <button
            onClick={() => handleStatusChange('done')}
            className="px-2 py-1 text-xs bg-green-200 hover:bg-green-300 rounded transition-colors"
          >
            Done
          </button>
        )}
      </div>

      {task.createdDate && (
        <div className="mt-2 text-xs text-gray-400">
          Created: {task.createdDate.toDate().toLocaleDateString()}
        </div>
      )}
    </div>
  );
};

const TaskColumn = ({ title, status, tasks, onMoveTask }) => {
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
            />
          ))
        )}
      </div>
    </div>
  );
};

export default TaskColumn;
