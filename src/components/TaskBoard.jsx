import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useAuth } from '../contexts/AuthContext';
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
import { Plus, Archive, Download } from 'lucide-react';

const TaskBoard = () => {
  const { user, userRole } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

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
    } catch (error) {
      console.error('Error adding task:', error);
      alert('Failed to add task. Please try again.');
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
      alert('Failed to move task. Please try again.');
    }
  };

  const handleDailyReset = async () => {
    if (!confirm('Are you sure you want to reset for the day? Completed tasks will be archived.')) {
      return;
    }

    const completedTasks = tasks.filter(task => task.status === 'done');
    if (completedTasks.length === 0) {
      alert('No completed tasks to archive.');
      return;
    }

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
      alert('Daily reset complete! Completed tasks archived.');
    } catch (error) {
      console.error('Error during daily reset:', error);
      alert('Failed to reset. Please try again.');
    }
  };

  const handleExport = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const completedToday = tasks.filter(task => {
      if (task.status === 'done' && task.completedDate) {
        const completedDate = task.completedDate.toDate();
        return completedDate >= today;
      }
      return false;
    });

    if (completedToday.length === 0) {
      alert('No tasks completed today to export.');
      return;
    }

    let summary = `Daily Accomplishments (${new Date().toLocaleDateString()}):\n\n`;
    completedToday.forEach(task => {
      summary += `- ${task.title} (Assigned: ${task.assignedTo}, Estimate: ${task.timeEstimate}h)\n`;
    });

    navigator.clipboard.writeText(summary).then(() => {
      alert('Today\'s accomplishments copied to clipboard!');
    }).catch(err => {
      console.error('Could not copy text:', err);
      alert('Failed to copy to clipboard.');
    });
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
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </button>
          <button
            onClick={handleDailyReset}
            className="btn-secondary flex items-center"
          >
            <Archive className="h-4 w-4 mr-2" />
            Daily Reset
          </button>
          <button
            onClick={handleExport}
            className="btn-secondary flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Summary
          </button>
        </div>

        {/* Task Board */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {columns.map(column => (
            <TaskColumn
              key={column.id}
              title={column.title}
              status={column.status}
              tasks={tasks.filter(task => task.status === column.status)}
              onMoveTask={handleMoveTask}
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
      </div>
    </DndProvider>
  );
};

export default TaskBoard;
