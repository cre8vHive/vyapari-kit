import React, { useEffect, useState } from 'react';
import { adminApi, ComplaintData } from '../services/api';

export const AdminComplaints: React.FC = () => {
  const [complaints, setComplaints] = useState<ComplaintData[]>([]);
  const [selectedComplaintId, setSelectedComplaintId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getComplaints();
      setComplaints(data);
    } catch (err: any) {
      console.error('Failed to load complaints:', err);
      setError(err.response?.data?.message || 'Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleResolve = async (id: string) => {
    try {
      const { isResolved } = await adminApi.toggleComplaintResolve(id);
      setComplaints((prev) => 
        prev.map((c) => c.id === id ? { ...c, isResolved } : c)
      );
    } catch (err) {
      console.error('Failed to toggle resolve status:', err);
      alert('Failed to update complaint status.');
    }
  };

  if (loading) {
    return (
      <section className="admin-shell">
        <p>Loading complaints...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="admin-shell">
        <p className="admin-error">{error}</p>
        <button onClick={fetchComplaints} className="admin-primary-btn">Retry</button>
      </section>
    );
  }

  const selectedComplaint = complaints.find(c => c.id === selectedComplaintId);

  const filteredComplaints = complaints.filter(c => {
    if (statusFilter === 'pending' && c.isResolved) return false;
    if (statusFilter === 'resolved' && !c.isResolved) return false;
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        c.subject.toLowerCase().includes(q) ||
        c.firstName.toLowerCase().includes(q) ||
        c.lastName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.message.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <section className="admin-shell">
      <div className="admin-layout">
        <aside className="admin-sidebar">
          <div className="admin-panel-heading">
            <h2>Grievances</h2>
          </div>
          <div className="admin-filters">
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
          <div className="admin-course-items">
            {filteredComplaints.map((c) => (
              <button
                key={c.id}
                className={`admin-course-item ${selectedComplaintId === c.id ? 'active' : ''}`}
                type="button"
                onClick={() => setSelectedComplaintId(c.id)}
              >
                <span>{c.subject}</span>
                <small>
                  {c.firstName} {c.lastName} - <span style={{ color: c.isResolved ? 'var(--color-success, green)' : 'var(--color-error, red)' }}>{c.isResolved ? 'Resolved' : 'Pending'}</span>
                </small>
              </button>
            ))}
            {complaints.length > 0 && filteredComplaints.length === 0 && <p className="admin-empty">No complaints match filters.</p>}
            {complaints.length === 0 && <p className="admin-empty">No complaints found.</p>}
          </div>
        </aside>

        <div className="admin-course-form admin-user-detail">
          <div className="admin-panel-heading">
            <h2>Complaint Details</h2>
          </div>

          {selectedComplaint ? (
            <div className="admin-user-info-grid">
              <div className="admin-field-group">
                <h3>Contact Info</h3>
                <p><strong>Name:</strong> {selectedComplaint.firstName} {selectedComplaint.lastName}</p>
                <p><strong>Email:</strong> <a href={`mailto:${selectedComplaint.email}`}>{selectedComplaint.email}</a></p>
                <p><strong>Phone:</strong> <a href={`tel:${selectedComplaint.phone}`}>{selectedComplaint.phone}</a></p>
                <p><strong>Date:</strong> {new Date(selectedComplaint.createdAt).toLocaleString()}</p>
              </div>

              <div className="admin-field-group">
                <h3>Message</h3>
                <p><strong>Subject:</strong> {selectedComplaint.subject}</p>
                <div style={{ marginTop: '0.5rem', padding: '1rem', background: 'var(--color-background-alt)', borderRadius: '6px', border: '1px solid var(--color-border)', whiteSpace: 'pre-wrap' }}>
                  {selectedComplaint.message}
                </div>
              </div>

              <div className="admin-form-actions" style={{ marginTop: '20px' }}>
                <p style={{ marginBottom: '1rem' }}>
                  <strong>Status:</strong>{' '}
                  <span style={{ fontWeight: 'bold', color: selectedComplaint.isResolved ? 'var(--color-success, green)' : 'var(--color-error, red)' }}>
                    {selectedComplaint.isResolved ? 'Resolved' : 'Pending'}
                  </span>
                </p>
                {selectedComplaint.isResolved ? (
                  <button className="admin-secondary-btn" onClick={() => handleToggleResolve(selectedComplaint.id)}>Mark as Pending</button>
                ) : (
                  <button className="admin-primary-btn" onClick={() => handleToggleResolve(selectedComplaint.id)}>Mark as Resolved</button>
                )}
              </div>
            </div>
          ) : (
            <p className="admin-empty">Select a complaint to view details.</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default AdminComplaints;
