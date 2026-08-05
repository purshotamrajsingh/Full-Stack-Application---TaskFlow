import { useEffect, useState } from 'react';
import api from '../api/client';

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  async function load() {
    const { data } = await api.get('/users');
    setUsers(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id) {
    if (!confirm('Delete this user?')) return;
    try {
      await api.delete(`/users/${id}`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete user');
    }
  }

  return (
    <div className="page">
      <h1>Admin: User Management</h1>
      {error && <div className="alert-error">{error}</div>}
      <table className="task-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Joined</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u._id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>
                <span className={`badge badge-${u.role === 'admin' ? 'high' : 'low'}`}>{u.role}</span>
              </td>
              <td>{new Date(u.createdAt).toLocaleDateString()}</td>
              <td>
                <button className="danger" onClick={() => handleDelete(u._id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
