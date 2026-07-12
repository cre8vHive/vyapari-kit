import React, { useEffect, useMemo, useState } from 'react';
import { adminApi, AuthUser } from '../services/api';

interface AdminUserManagementProps {
  user: AuthUser | null;
}

export const AdminUserManagement: React.FC<AdminUserManagementProps> = ({ user: adminUser }) => {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [filters, setFilters] = useState({ search: '', role: '', status: '' });
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  const selectedUser = useMemo(
    () => users.find((u) => u.id === selectedUserId) || null,
    [users, selectedUserId]
  );

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminApi.getUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const search = filters.search.toLowerCase();
    return users.filter(u => {
      const matchesSearch = !search || u.name.toLowerCase().includes(search) || u.email.toLowerCase().includes(search);
      const matchesRole = !filters.role || u.role === filters.role;
      let matchesStatus = true;
      if (filters.status === 'locked') matchesStatus = !!u.lockedUntil && new Date(u.lockedUntil) > new Date();
      if (filters.status === 'deleted') matchesStatus = !!u.isDeleted;
      if (filters.status === 'active') matchesStatus = !u.isDeleted && (!u.lockedUntil || new Date(u.lockedUntil) <= new Date());
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, filters]);

  const activeUsers = users.filter(u => !u.isDeleted && (!u.lockedUntil || new Date(u.lockedUntil) <= new Date())).length;
  const adminCount = users.filter(u => u.role === 'admin' && !u.isDeleted).length;
  const blockedCount = users.filter(u => !!u.lockedUntil && new Date(u.lockedUntil) > new Date()).length;

  const handleBlockUser = async () => {
    if (!selectedUserId || !window.confirm('Are you sure you want to block this user?')) return;
    try {
      const { user } = await adminApi.blockUser(selectedUserId);
      setUsers(current => current.map(u => u.id === user.id ? user : u));
      setMessage(`User ${user.name} blocked successfully.`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to block user.');
    }
  };

  const handleUnblockUser = async () => {
    if (!selectedUserId) return;
    try {
      const { user } = await adminApi.unblockUser(selectedUserId);
      setUsers(current => current.map(u => u.id === user.id ? user : u));
      setMessage(`User ${user.name} unblocked successfully.`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to unblock user.');
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUserId || !window.confirm('Are you sure you want to delete this user?')) return;
    try {
      const { user } = await adminApi.deleteUser(selectedUserId);
      setUsers(current => current.map(u => u.id === user.id ? user : u));
      setMessage(`User ${user.name} deleted successfully.`);
      setSelectedUserId('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to delete user.');
    }
  };

  const handleTriggerReset = async () => {
    if (!selectedUserId) return;
    try {
      const { message } = await adminApi.triggerPasswordReset(selectedUserId);
      setMessage(message);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to trigger reset.');
    }
  };

  const handleRoleChange = async (newRole: string) => {
    if (!selectedUserId || !selectedUser) return;
    if (!window.confirm(`Change role to ${newRole}?`)) return;
    try {
      const { user } = await adminApi.updateUser(selectedUserId, { name: selectedUser.name, role: newRole });
      setUsers(current => current.map(u => u.id === user.id ? user : u));
      setMessage(`User role updated successfully.`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to update role.');
    }
  };

  if (loading) {
    return (
      <section className="admin-shell admin-state">
        <p>Loading users...</p>
      </section>
    );
  }

  return (
    <section className="admin-shell">
      <div className="admin-metrics" aria-label="User metrics">
        <div><strong>{users.length}</strong><span>Total Users</span></div>
        <div><strong>{activeUsers}</strong><span>Active</span></div>
        <div><strong>{adminCount}</strong><span>Admins</span></div>
        <div><strong>{blockedCount}</strong><span>Blocked</span></div>
      </div>

      {(message || error) && (
        <div className={`admin-alert ${error ? 'admin-alert-error' : ''}`} role="status">
          {error || message}
        </div>
      )}

      <div className="admin-layout">
        <aside className="admin-course-list admin-user-list" aria-label="Users">
          <div className="admin-panel-heading">
            <h2>Users</h2>
            <span>{filteredUsers.length} / {users.length}</span>
          </div>
          <div className="admin-course-filters" aria-label="Filter users">
            <input
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              placeholder="Search users"
              type="search"
            />
            <select
              value={filters.role}
              onChange={(event) => setFilters((current) => ({ ...current, role: event.target.value }))}
            >
              <option value="">All Roles</option>
              <option value="student">Student</option>
              <option value="admin">Admin</option>
            </select>
            <select
              value={filters.status}
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="locked">Blocked/Locked</option>
              <option value="deleted">Deleted</option>
            </select>
          </div>
          <div className="admin-course-items">
            {filteredUsers.map((u) => {
              const isLocked = !!u.lockedUntil && new Date(u.lockedUntil) > new Date();
              return (
                <button
                  key={u.id}
                  className={`admin-course-item ${selectedUserId === u.id ? 'active' : ''}`}
                  type="button"
                  onClick={() => { setSelectedUserId(u.id); setMessage(''); setError(''); }}
                >
                  <span>{u.name}</span>
                  <small>
                    {u.role} - {u.isDeleted ? 'Deleted' : isLocked ? 'Blocked' : 'Active'}
                  </small>
                </button>
              );
            })}
            {users.length > 0 && filteredUsers.length === 0 && <p className="admin-empty">No users match.</p>}
          </div>
        </aside>

        <div className="admin-course-form admin-user-detail">
          <div className="admin-panel-heading">
            <h2>User Details</h2>
          </div>

          {selectedUser ? (
            <div className="admin-user-info-grid">
              <div className="admin-field-group">
                <h3>Profile</h3>
                <p><strong>Name:</strong> {selectedUser.name}</p>
                <p><strong>Email:</strong> {selectedUser.email}</p>
                <p>
                  <strong>Role:</strong>{' '}
                  {selectedUser.isDeleted ? (
                    selectedUser.role
                  ) : (
                    <select
                      value={selectedUser.role}
                      onChange={(e) => handleRoleChange(e.target.value)}
                      style={{ padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                    >
                      <option value="student">Student</option>
                      <option value="admin">Admin</option>
                    </select>
                  )}
                </p>
                <p><strong>Status:</strong> {selectedUser.isDeleted ? 'Deleted' : (selectedUser.lockedUntil && new Date(selectedUser.lockedUntil) > new Date()) ? 'Blocked' : 'Active'}</p>
              </div>

              <div className="admin-field-group">
                <h3>Security & Activity</h3>
                <p><strong>Email Verified:</strong> {selectedUser.isEmailVerified ? 'Yes' : 'No'}</p>
                <p><strong>Failed Logins:</strong> {selectedUser.failedLoginAttempts || 0}</p>
                <p><strong>Last Activity:</strong> {selectedUser.lastHeartbeat ? new Date(selectedUser.lastHeartbeat).toLocaleString() : 'N/A'}</p>
                <p><strong>Created At:</strong> {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString() : 'N/A'}</p>
              </div>

              <div className="admin-form-actions" style={{ marginTop: '20px' }}>
                {!selectedUser.isDeleted && (!selectedUser.lockedUntil || new Date(selectedUser.lockedUntil) <= new Date()) && (
                  <button className="admin-secondary-btn" onClick={handleBlockUser}>Block User</button>
                )}
                {!selectedUser.isDeleted && (selectedUser.lockedUntil && new Date(selectedUser.lockedUntil) > new Date()) && (
                  <button className="admin-primary-btn" onClick={handleUnblockUser}>Unblock User</button>
                )}
                {!selectedUser.isDeleted && (
                  <button className="admin-secondary-btn" onClick={handleTriggerReset}>Send Password Reset</button>
                )}
                {!selectedUser.isDeleted && (
                  <button className="admin-danger-btn" onClick={handleDeleteUser}>Soft Delete</button>
                )}
              </div>
            </div>
          ) : (
            <p className="admin-empty">Select a user to view details.</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default AdminUserManagement;
