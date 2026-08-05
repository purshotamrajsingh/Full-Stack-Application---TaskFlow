import { useEffect, useState, useCallback } from 'react';
import api from '../api/client';

const emptyForm = { title: '', description: '', project: '', status: 'todo', priority: 'medium', dueDate: '' };

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');

  const loadTasks = useCallback(async () => {
    const params = { sortBy, order };
    if (search) params.search = search;
    if (status) params.status = status;
    if (priority) params.priority = priority;
    const { data } = await api.get('/tasks', { params });
    setTasks(data.tasks);
  }, [search, status, priority, sortBy, order]);

  useEffect(() => {
    api.get('/projects').then(({ data }) => setProjects(data));
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/tasks', form);
      setForm(emptyForm);
      loadTasks();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create task');
    }
  }

  async function handleStatusChange(task, newStatus) {
    await api.put(`/tasks/${task._id}`, { status: newStatus });
    loadTasks();
  }

  async function handleDelete(id) {
    if (!confirm('Delete this task?')) return;
    await api.delete(`/tasks/${id}`);
    loadTasks();
  }

  return (
    <div className="page">
      <h1>Tasks</h1>

      <form className="inline-form" onSubmit={handleCreate}>
        <input
          placeholder="Task title"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          required
        />
        <select
          value={form.project}
          onChange={(e) => setForm((f) => ({ ...f, project: e.target.value }))}
          required
        >
          <option value="">Select project</option>
          {projects.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </select>
        <select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <input
          type="date"
          value={form.dueDate}
          onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
        />
        <button type="submit">Add task</button>
      </form>
      {error && <div className="alert-error">{error}</div>}

      <div className="filter-bar">
        <input
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="todo">To do</option>
          <option value="in_progress">In progress</option>
          <option value="done">Done</option>
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="">All priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="createdAt">Sort: Created</option>
          <option value="dueDate">Sort: Due date</option>
          <option value="priority">Sort: Priority</option>
          <option value="title">Sort: Title</option>
        </select>
        <select value={order} onChange={(e) => setOrder(e.target.value)}>
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>
      </div>

      <table className="task-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Project</th>
            <th>Assignee</th>
            <th>Priority</th>
            <th>Due date</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((t) => (
            <tr key={t._id}>
              <td>{t.title}</td>
              <td>{t.project?.name}</td>
              <td>{t.assignee?.name || '-'}</td>
              <td>
                <span className={`badge badge-${t.priority}`}>{t.priority}</span>
              </td>
              <td>{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '-'}</td>
              <td>
                <select value={t.status} onChange={(e) => handleStatusChange(t, e.target.value)}>
                  <option value="todo">To do</option>
                  <option value="in_progress">In progress</option>
                  <option value="done">Done</option>
                </select>
              </td>
              <td>
                <button className="danger" onClick={() => handleDelete(t._id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {tasks.length === 0 && (
            <tr>
              <td colSpan={7}>No tasks match your filters.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
