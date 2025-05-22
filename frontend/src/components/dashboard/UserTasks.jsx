// src/components/dashboard/UserTasks.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getUserTasksApi, createTaskApi, updateTaskApi, deleteTaskApi } from '../../services/taskService';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom'; // For linking tasks to content

const LoadingSpinner = () => <div className="text-xs text-center p-2">Loading tasks...</div>;
const ErrorMessage = ({ msg }) => <p className="text-xs text-red-500 p-1">{msg}</p>;

const TaskItem = ({ task, onToggleComplete, onDelete, onEdit }) => (
    <li className={`flex items-center justify-between p-2.5 border-b border-[var(--color-border)] last:border-b-0 ${task.completed ? 'opacity-60' : ''}`}>
        <div className="flex items-center">
            <input
                type="checkbox"
                className="form-checkbox-default mr-3"
                checked={task.completed}
                onChange={() => onToggleComplete(task._id, !task.completed)}
                aria-labelledby={`task-title-${task._id}`}
            />
            <div>
                <span id={`task-title-${task._id}`} className={`text-sm ${task.completed ? 'line-through text-[var(--color-text-secondary)]' : 'text-[var(--color-text-primary)]'}`}>
                    {task.title}
                </span>
                {task.relatedContentTopic && (
                    <Link to={`/content/${task.relatedContentTopic}`} className="ml-1 text-xs text-[var(--color-link)] hover:underline">(Topic)</Link>
                )}
                {task.dueDate && (
                    <p className="text-xs text-[var(--color-text-secondary)]">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                    </p>
                )}
            </div>
        </div>
        <div className="space-x-2">
            <button onClick={() => onEdit(task)} className="text-xs text-blue-500 hover:underline">Edit</button>
            <button onClick={() => onDelete(task._id)} className="text-xs text-red-500 hover:underline">Del</button>
        </div>
    </li>
);


const UserTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInput, setShowInput] = useState(false);
  // const [editingTask, setEditingTask] = useState(null); // For a modal edit later

  const { user } = useAuth();

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    setLoading(true); setError(null);
    try {
      const userTasks = await getUserTasksApi({ sortBy: 'completed:asc,dueDate:asc,createdAt:desc' });
      setTasks(userTasks);
    } catch (err) {
      setError('Failed to load tasks.');
      toast.error('Failed to load tasks.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    try {
      const createdTask = await createTaskApi({ title: newTaskTitle });
      setTasks(prevTasks => [createdTask, ...prevTasks.sort((a,b) => a.completed - b.completed)]); // Add to top, keep completed at bottom
      setNewTaskTitle('');
      setShowInput(false);
      toast.success('Task added!');
    } catch (err) {
      toast.error('Failed to add task.');
    }
  };

  const handleToggleComplete = async (taskId, completed) => {
    try {
      const updatedTask = await updateTaskApi(taskId, { completed });
      setTasks(prevTasks =>
        prevTasks.map(t => (t._id === taskId ? updatedTask : t)).sort((a,b) => a.completed - b.completed)
      );
      toast.info(`Task marked as ${completed ? 'complete' : 'incomplete'}.`);
    } catch (err) {
      toast.error('Failed to update task status.');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      await deleteTaskApi(taskId);
      setTasks(prevTasks => prevTasks.filter(t => t._id !== taskId));
      toast.success('Task deleted.');
    } catch (err) {
      toast.error('Failed to delete task.');
    }
  };

  const handleEditTask = (task) => {
    // For now, prompt. Later, a modal.
    const newTitle = prompt("Edit task title:", task.title);
    if (newTitle && newTitle.trim() !== task.title) {
        updateTaskApi(task._id, { title: newTitle.trim() })
            .then(updated => {
                setTasks(prev => prev.map(t => t._id === updated._id ? updated : t));
                toast.success("Task title updated.");
            })
            .catch(() => toast.error("Failed to update task title."));
    }
  }

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-3">My Tasks</h2>
      {loading && <LoadingSpinner />}
      {error && <ErrorMessage msg={error} />}
      {!loading && !error && (
        <>
          {tasks.length === 0 && !showInput && (
            <p className="text-sm text-center text-[var(--color-text-secondary)] py-3">No tasks yet. Add one!</p>
          )}
          <ul className="mb-3 max-h-60 overflow-y-auto custom-scrollbar divide-y divide-[var(--color-border)]">
            {tasks.map(task => (
              <TaskItem
                key={task._id}
                task={task}
                onToggleComplete={handleToggleComplete}
                onDelete={handleDeleteTask}
                onEdit={handleEditTask}
              />
            ))}
          </ul>
          {showInput ? (
            <form onSubmit={handleAddTask} className="flex gap-2">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Enter new task title..."
                className="form-input-default flex-grow text-sm"
                autoFocus
              />
              <button type="submit" className="button-primary text-sm !py-1.5">Add</button>
              <button type="button" onClick={() => setShowInput(false)} className="button-secondary text-sm !py-1.5">Cancel</button>
            </form>
          ) : (
             <button onClick={() => setShowInput(true)} className="button-secondary text-sm w-full mt-2">
                + Add New Task
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default UserTasks;