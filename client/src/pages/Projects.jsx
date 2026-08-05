import { useEffect, useState } from 'react';
import api from '../api/client';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');

  async function load() {
    const { data } = await api.get('/projects');
    setProjects(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/projects', form);
      setForm({ name: '', description: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create project');
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this project and all its tasks reference?')) return;
    await api.delete(`/projects/${id}`);
    load();
  }

  return (
    <div className="page">
      <h1>Projects</h1>

      <form className="inline-form" onSubmit={handleCreate}>
        <input
          placeholder="Project name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          required
        />
        <input
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        />
        <button type="submit">Add project</button>
      </form>
      {error && <div className="alert-error">{error}</div>}

      <div className="card-grid">
        {projects.map((p) => (
          <div key={p._id} className="card">
            <h3>{p.name}</h3>
            <p>{p.description}</p>
            <p className="muted">Owner: {p.owner?.name}</p>
            <p className="muted">Members: {p.members?.map((m) => m.name).join(', ') || 'None'}</p>
            <button className="danger" onClick={() => handleDelete(p._id)}>
              Delete
            </button>
          </div>
        ))}
        {projects.length === 0 && <p>No projects yet. Create one above.</p>}
      </div>
    </div>
  );
}
