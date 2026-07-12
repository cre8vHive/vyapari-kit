import React, { useState } from 'react';
import { AuthUser } from '../services/api';
import AdminCourseManagement from './AdminCourseManagement';
import AdminUserManagement from './AdminUserManagement';

interface AdminDashboardProps {
  user: AuthUser | null;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'courses' | 'users'>('courses');

  if (!user) {
    return (
      <section className="admin-shell admin-state">
        <h1>Admin Dashboard</h1>
        <p>Sign in with an admin account to manage the platform.</p>
        <a className="admin-primary-link" href="/login">Go to login</a>
      </section>
    );
  }

  if (user.role !== 'admin') {
    return (
      <section className="admin-shell admin-state">
        <h1>Access restricted</h1>
        <p>Your account does not have admin permissions.</p>
      </section>
    );
  }

  return (
    <div className="admin-dashboard-container">
      <div className="admin-tabs-wrapper">
        <div className="admin-tabs">
          <button 
            className={`admin-tab ${activeTab === 'courses' ? 'active' : ''}`}
            onClick={() => setActiveTab('courses')}
          >
            Course Management
          </button>
          <button 
            className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            User Management
          </button>
        </div>
      </div>

      <div className="admin-tab-content">
        {activeTab === 'courses' && <AdminCourseManagement user={user} />}
        {activeTab === 'users' && <AdminUserManagement user={user} />}
      </div>
    </div>
  );
};

export default AdminDashboard;
