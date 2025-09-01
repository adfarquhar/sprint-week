import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { db } from '../firebase';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  where,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import TaskColumn from './TaskColumn';
import AddTaskModal from './AddTaskModal';
import ConfirmModal from './ConfirmModal';
import { Plus, Archive, Download, CheckSquare, Square, Trash2, Search, Filter } from 'lucide-react';

const TaskBoard = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [tasks, setTasks] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTasks, setSelectedTasks] = useState(new Set());
  const [bulkActionMode, setBulkActionMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'tasks'),
      where('userId', '==', user.uid),
      orderBy('createdDate', 'desc')
    );
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

  const handleAddTask = async (taskData) => {
    try {
      await addDoc(collection(db, 'tasks'), {
        ...taskData,
        userId: user.uid,
        status: 'todo',
        createdDate: Timestamp.now(),
        completedDate: null
      });
      setShowAddModal(false);
      success('Task added successfully!');
    } catch (error) {
      console.error('Error adding task:', error);
      error('Failed to add task. Please try again.');
    }
  };

  const handleMoveTask = async (taskId, newStatus) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, {
        status: newStatus,
        completedDate: newStatus === 'done' ? Timestamp.now() : null
      });
    } catch (error) {
      console.error('Error updating task:', error);
      error('Failed to move task. Please try again.');
    }
  };

  const handleTaskSelect = (taskId) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedTasks.size === filteredTasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(filteredTasks.map(task => task.id)));
    }
  };

  const handleBulkStatusChange = async (newStatus) => {
    if (selectedTasks.size === 0) return;

    try {
      const batch = writeBatch(db);
      selectedTasks.forEach(taskId => {
        const taskRef = doc(db, 'tasks', taskId);
        batch.update(taskRef, {
          status: newStatus,
          completedDate: newStatus === 'done' ? Timestamp.now() : null
        });
      });
      await batch.commit();
      success(`Updated ${selectedTasks.size} tasks to ${newStatus}`);
      setSelectedTasks(new Set());
      setBulkActionMode(false);
    } catch (error) {
      console.error('Error updating tasks:', error);
      error('Failed to update tasks. Please try again.');
    }
  };

  const handleBulkDelete = () => {
    if (selectedTasks.size === 0) return;

    setConfirmAction(() => async () => {
      try {
        const batch = writeBatch(db);
        selectedTasks.forEach(taskId => {
          const taskRef = doc(db, 'tasks', taskId);
          batch.delete(taskRef);
        });
        await batch.commit();
        success(`Deleted ${selectedTasks.size} tasks`);
        setSelectedTasks(new Set());
        setBulkActionMode(false);
      } catch (error) {
        console.error('Error deleting tasks:', error);
        error('Failed to delete tasks. Please try again.');
      }
    });

    setShowConfirmModal(true);
  };

  // Filter tasks based on search and filter criteria
  const getFilteredTasks = () => {
    return tasks.filter(task => {
      // Text search
      const matchesSearch = !searchQuery ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.assignedTo.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;

      // Priority filter
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;

      // Assignee filter
      const matchesAssignee = assigneeFilter === 'all' || task.assignedTo === assigneeFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesAssignee;
    });
  };

  // Get unique assignees for filter dropdown
  const getUniqueAssignees = () => {
    const assignees = new Set(tasks.map(task => task.assignedTo));
    return Array.from(assignees).sort();
  };

  const filteredTasks = getFilteredTasks();
  const uniqueAssignees = getUniqueAssignees();

  const handleDailyReset = () => {
    const completedTasks = tasks.filter(task => task.status === 'done');
    if (completedTasks.length === 0) {
      error('No completed tasks to archive.');
      return;
    }

    setConfirmAction(() => async () => {
      try {
        const batch = writeBatch(db);
        const today = Timestamp.now();

        completedTasks.forEach(task => {
          const archivedRef = doc(collection(db, 'daily_archive'));
          batch.set(archivedRef, { ...task, archivedDate: today, userId: user.uid });
          const taskRef = doc(db, 'tasks', task.id);
          batch.delete(taskRef);
        });

        await batch.commit();
        success('Daily reset complete! Completed tasks archived.');
      } catch (error) {
        console.error('Error during daily reset:', error);
        error('Failed to reset. Please try again.');
      }
    });

    setShowConfirmModal(true);
  };

  const handleExport = (format = 'text', period = 'today') => {
    let tasksToExport = [];
    let periodLabel = '';

    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    switch (period) {
      case 'today':
        tasksToExport = tasks.filter(task => {
          if (task.status === 'done' && task.completedDate) {
            const completedDate = task.completedDate.toDate();
            return completedDate >= today;
          }
          return false;
        });
        periodLabel = `Today (${new Date().toLocaleDateString()})`;
        break;
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        tasksToExport = tasks.filter(task => {
          if (task.completedDate) {
            const completedDate = task.completedDate.toDate();
            return completedDate >= weekStart;
          }
          return false;
        });
        periodLabel = `This Week (${weekStart.toLocaleDateString()} - ${now.toLocaleDateString()})`;
        break;
      case 'all':
        tasksToExport = tasks.filter(task => task.status === 'done');
        periodLabel = 'All Time';
        break;
      default:
        tasksToExport = tasks.filter(task => task.status === 'done');
        periodLabel = 'All Completed Tasks';
    }

    if (tasksToExport.length === 0) {
      error(`No tasks found for the selected period to export.`);
      return;
    }

    if (format === 'csv') {
      exportAsCSV(tasksToExport, periodLabel);
    } else {
      exportAsText(tasksToExport, periodLabel);
    }
  };

  const exportAsText = (tasksToExport, periodLabel) => {
    let summary = `📊 Sprint Task Tracker - ${periodLabel}\n`;
    summary += `Generated: ${new Date().toLocaleString()}\n`;
    summary += `Total Tasks: ${tasksToExport.length}\n`;
    summary += `Total Hours: ${tasksToExport.reduce((sum, task) => sum + (task.timeEstimate || 0), 0).toFixed(1)}h\n\n`;

    // Group by status
    const byStatus = tasksToExport.reduce((acc, task) => {
      if (!acc[task.status]) acc[task.status] = [];
      acc[task.status].push(task);
      return acc;
    }, {});

    Object.entries(byStatus).forEach(([status, statusTasks]) => {
      const statusLabel = status === 'done' ? '✅ Completed' :
                         status === 'inprogress' ? '🔄 In Progress' :
                         status === 'todo' ? '📋 To Do' : '🚫 Blocked';
      summary += `${statusLabel} (${statusTasks.length}):\n`;

      statusTasks.forEach(task => {
        const priority = task.priority ? `[${task.priority.toUpperCase()}] ` : '';
        const assignee = task.assignedTo ? ` - ${task.assignedTo}` : '';
        const estimate = task.timeEstimate ? ` (${task.timeEstimate}h)` : '';
        const completed = task.completedDate ? ` - ${task.completedDate.toDate().toLocaleDateString()}` : '';

        summary += `  ${priority}${task.title}${assignee}${estimate}${completed}\n`;

        if (task.description) {
          summary += `    ${task.description}\n`;
        }
      });
      summary += '\n';
    });

    navigator.clipboard.writeText(summary).then(() => {
      success(`Exported ${tasksToExport.length} tasks to clipboard!`);
    }).catch(err => {
      console.error('Could not copy text:', err);
      error('Failed to copy to clipboard.');
    });
  };

  const exportAsCSV = (tasksToExport, periodLabel) => {
    const headers = ['Title', 'Description', 'Assignee', 'Priority', 'Status', 'Time Estimate', 'Due Date', 'Completed Date', 'Created Date'];

    const csvContent = [
      headers.join(','),
      ...tasksToExport.map(task => [
        `"${task.title.replace(/"/g, '""')}"`,
        `"${(task.description || '').replace(/"/g, '""')}"`,
        `"${task.assignedTo}"`,
        `"${task.priority || ''}"`,
        `"${task.status}"`,
        `"${task.timeEstimate || 0}"`,
        `"${task.dueDate || ''}"`,
        `"${task.completedDate ? task.completedDate.toDate().toISOString() : ''}"`,
        `"${task.createdDate ? task.createdDate.toDate().toISOString() : ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `sprint-tasks-${periodLabel.replace(/[^a-zA-Z0-9]/g, '-')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      success(`Exported ${tasksToExport.length} tasks as CSV!`);
    } else {
      error('CSV export is not supported in this browser.');
    }
  };

  const columns = [
    { id: 'todo', title: 'To Do Today', status: 'todo' },
    { id: 'inprogress', title: 'In Progress', status: 'inprogress' },
    { id: 'blocked', title: 'Blocked', status: 'blocked' },
    { id: 'done', title: 'Done', status: 'done' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-6">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center justify-center sm:justify-start"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </button>
          <button
            onClick={handleDailyReset}
            className="btn-secondary flex items-center justify-center sm:justify-start"
          >
            <Archive className="h-4 w-4 mr-2" />
            Daily Reset
          </button>
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="btn-secondary flex items-center justify-center sm:justify-start"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
              <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-4">
                  <div className="space-y-3">
                    {/* Text Export Options */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Text Export</label>
                      <div className="space-y-1">
                        <button
                          onClick={() => { handleExport('text', 'today'); setShowExportMenu(false); }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded"
                        >
                          📝 Today's Summary
                        </button>
                        <button
                          onClick={() => { handleExport('text', 'week'); setShowExportMenu(false); }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded"
                        >
                          📊 This Week's Summary
                        </button>
                        <button
                          onClick={() => { handleExport('text', 'all'); setShowExportMenu(false); }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded"
                        >
                          📈 All Time Summary
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">CSV Export</label>
                      <div className="space-y-1">
                        <button
                          onClick={() => { handleExport('csv', 'today'); setShowExportMenu(false); }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded"
                        >
                          📊 Today's Data (CSV)
                        </button>
                        <button
                          onClick={() => { handleExport('csv', 'week'); setShowExportMenu(false); }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded"
                        >
                          📈 This Week's Data (CSV)
                        </button>
                        <button
                          onClick={() => { handleExport('csv', 'all'); setShowExportMenu(false); }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded"
                        >
                          📊 All Data (CSV)
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => setBulkActionMode(!bulkActionMode)}
            className={`flex items-center justify-center sm:justify-start px-4 py-2 rounded-lg font-medium transition-colors ${
              bulkActionMode
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
          >
            {bulkActionMode ? <CheckSquare className="h-4 w-4 mr-2" /> : <Square className="h-4 w-4 mr-2" />}
            Bulk Actions
          </button>
        </div>

        {/* Bulk Action Toolbar */}
        {bulkActionMode && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleSelectAll}
                  className="flex items-center px-3 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50"
                >
                  {selectedTasks.size === filteredTasks.length ? (
                    <CheckSquare className="h-4 w-4 mr-1" />
                  ) : (
                    <Square className="h-4 w-4 mr-1" />
                  )}
                  {selectedTasks.size === filteredTasks.length ? 'Deselect All' : 'Select All'}
                </button>
                <span className="text-sm text-gray-600">
                  {selectedTasks.size} of {filteredTasks.length} tasks selected
                </span>
              </div>

              {selectedTasks.size > 0 && (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleBulkStatusChange('todo')}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm"
                  >
                    Move to To Do
                  </button>
                  <button
                    onClick={() => handleBulkStatusChange('inprogress')}
                    className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-sm"
                  >
                    Move to In Progress
                  </button>
                  <button
                    onClick={() => handleBulkStatusChange('done')}
                    className="px-3 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded text-sm"
                  >
                    Mark Done
                  </button>
                  <button
                    onClick={() => handleBulkStatusChange('blocked')}
                    className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-sm"
                  >
                    Mark Blocked
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Search and Filter Controls */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tasks, descriptions, or assignees..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center px-4 py-2 border rounded-md transition-colors ${
                showFilters
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="todo">To Do</option>
                    <option value="inprogress">In Progress</option>
                    <option value="blocked">Blocked</option>
                    <option value="done">Done</option>
                  </select>
                </div>

                {/* Priority Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Priorities</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                {/* Assignee Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assignee
                  </label>
                  <select
                    value={assigneeFilter}
                    onChange={(e) => setAssigneeFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Assignees</option>
                    {uniqueAssignees.map(assignee => (
                      <option key={assignee} value={assignee}>{assignee}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Filter Actions */}
              <div className="mt-4 flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Showing {filteredTasks.length} of {tasks.length} tasks
                </div>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setPriorityFilter('all');
                    setAssigneeFilter('all');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear all filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Task Board */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {columns.map(column => (
            <TaskColumn
              key={column.id}
              title={column.title}
              status={column.status}
              tasks={filteredTasks.filter(task => task.status === column.status)}
              onMoveTask={handleMoveTask}
              bulkActionMode={bulkActionMode}
              selectedTasks={selectedTasks}
              onTaskSelect={handleTaskSelect}
            />
          ))}
        </div>

        {/* Add Task Modal */}
        {showAddModal && (
          <AddTaskModal
            onClose={() => setShowAddModal(false)}
            onSubmit={handleAddTask}
          />
        )}

        {/* Confirm Modal */}
        <ConfirmModal
          isOpen={showConfirmModal}
          title="Daily Reset"
          message="Are you sure you want to reset for the day? Completed tasks will be archived."
          onConfirm={async () => {
            if (confirmAction) {
              await confirmAction();
            }
            setShowConfirmModal(false);
            setConfirmAction(null);
          }}
          onCancel={() => {
            setShowConfirmModal(false);
            setConfirmAction(null);
          }}
        />
      </div>
    </DndProvider>
  );
};

export default TaskBoard;
