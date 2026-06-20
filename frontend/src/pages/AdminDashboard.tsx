import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { adminApi, AdminCategory, AdminCourse, AuthUser, CourseSavePayload, PdfAccessLogItem } from '../services/api';

interface AdminDashboardProps {
  user: AuthUser | null;
}

interface CourseFormState {
  title: string;
  instructorName: string;
  categoryName: string;
  difficulty: string;
  price: string;
  oldPrice: string;
  rating: string;
  imageUrl: string;
  isPublished: boolean;
  pdfUrl: string;
  pdfFile: File | null;
}

const emptyCourseForm: CourseFormState = {
  title: '',
  instructorName: '',
  categoryName: '',
  difficulty: 'Beginner',
  price: '0',
  oldPrice: '',
  rating: '0',
  imageUrl: '',
  isPublished: true,
  pdfUrl: '',
  pdfFile: null,
};

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Unable to read PDF file'));
    reader.readAsDataURL(file);
  });
}

function courseToForm(course: AdminCourse): CourseFormState {
  return {
    title: course.title,
    instructorName: course.instructorName,
    categoryName: course.categoryName,
    difficulty: course.difficulty,
    price: String(course.price),
    oldPrice: course.oldPrice === undefined ? '' : String(course.oldPrice),
    rating: String(course.rating),
    imageUrl: course.imageUrl,
    isPublished: course.isPublished,
    pdfUrl: '',
    pdfFile: null,
  };
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [accessLogs, setAccessLogs] = useState<PdfAccessLogItem[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [form, setForm] = useState<CourseFormState>(emptyCourseForm);
  const [categoryForm, setCategoryForm] = useState({ name: '', iconUrl: '' });
  const [enrollUserId, setEnrollUserId] = useState('');
  const [logFilters, setLogFilters] = useState({ courseId: '', userId: '', dateFrom: '', dateTo: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === selectedCourseId) || null,
    [courses, selectedCourseId]
  );

  const publishedCount = courses.filter((course) => course.isPublished).length;
  const protectedCount = courses.filter((course) => course.hasPdf).length;

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError('');
      const [courseData, userData, categoryData, logData] = await Promise.all([
        adminApi.getCourses(),
        adminApi.getUsers(),
        adminApi.getCategories(),
        adminApi.getPdfAccessLogs(),
      ]);
      setCourses(courseData);
      setUsers(userData);
      setCategories(categoryData);
      setAccessLogs(logData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to load admin dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      void loadDashboard();
    } else {
      setLoading(false);
    }
  }, [user?.role]);

  const updateForm = (field: keyof CourseFormState, value: string | boolean | File | null) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const resetForm = () => {
    setSelectedCourseId('');
    setForm(emptyCourseForm);
    setMessage('');
    setError('');
  };

  const selectCourse = (course: AdminCourse) => {
    setSelectedCourseId(course.id);
    setForm(courseToForm(course));
    setMessage('');
    setError('');
  };

  const buildPayload = async (): Promise<CourseSavePayload> => {
    const payload: CourseSavePayload = {
      title: form.title,
      instructorName: form.instructorName,
      categoryName: form.categoryName,
      difficulty: form.difficulty,
      price: Number(form.price || 0),
      oldPrice: form.oldPrice === '' ? '' : Number(form.oldPrice),
      rating: Number(form.rating || 0),
      imageUrl: form.imageUrl,
      isPublished: form.isPublished,
    };

    if (form.pdfFile) {
      payload.pdf = {
        filename: form.pdfFile.name,
        pdfBase64: await fileToDataUrl(form.pdfFile),
      };
    } else if (form.pdfUrl.trim()) {
      payload.pdf = {
        filename: `${form.title || 'course'}-material.pdf`,
        pdfUrl: form.pdfUrl.trim(),
      };
    }

    return payload;
  };

  const handleSaveCourse = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const payload = await buildPayload();
      const response = selectedCourseId
        ? await adminApi.updateCourse(selectedCourseId, payload)
        : await adminApi.createCourse(payload);

      const savedCourse = response.course;
      setCourses((current) => {
        const exists = current.some((course) => course.id === savedCourse.id);
        return exists
          ? current.map((course) => course.id === savedCourse.id ? savedCourse : course)
          : [savedCourse, ...current];
      });
      setSelectedCourseId(savedCourse.id);
      setForm(courseToForm(savedCourse));
      setMessage(selectedCourseId ? 'Course updated.' : 'Course created.');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Unable to save course.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!selectedCourseId || !window.confirm('Delete this course from the catalog?')) return;

    try {
      await adminApi.deleteCourse(selectedCourseId);
      setCourses((current) => current.filter((course) => course.id !== selectedCourseId));
      resetForm();
      setMessage('Course deleted.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to delete course.');
    }
  };

  const handleCreateCategory = async (event: FormEvent) => {
    event.preventDefault();
    setMessage('');
    setError('');

    try {
      const response = await adminApi.createCategory(categoryForm);
      setCategories((current) => [...current, response.category].sort((a, b) => a.name.localeCompare(b.name)));
      setCategoryForm({ name: '', iconUrl: '' });
      setMessage('Category created.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to create category.');
    }
  };

  const handleEnrollUser = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedCourseId || !enrollUserId) return;

    try {
      await adminApi.enrollUser(selectedCourseId, enrollUserId);
      setEnrollUserId('');
      setMessage('User enrolled in course.');
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to enroll user.');
    }
  };

  const refreshAccessLogs = async () => {
    try {
      const logData = await adminApi.getPdfAccessLogs({
        courseId: logFilters.courseId || undefined,
        userId: logFilters.userId || undefined,
        dateFrom: logFilters.dateFrom || undefined,
        dateTo: logFilters.dateTo || undefined,
      });
      setAccessLogs(logData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to refresh PDF access logs.');
    }
  };

  const resetAccessLogFilters = async () => {
    setLogFilters({ courseId: '', userId: '', dateFrom: '', dateTo: '' });
    try {
      const logData = await adminApi.getPdfAccessLogs();
      setAccessLogs(logData);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to refresh PDF access logs.');
    }
  };

  if (!user) {
    return (
      <section className="admin-shell admin-state">
        <h1>Admin Dashboard</h1>
        <p>Sign in with an admin account to manage courses.</p>
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

  if (loading) {
    return (
      <section className="admin-shell admin-state">
        <h1>Admin Dashboard</h1>
        <p>Loading management tools...</p>
      </section>
    );
  }

  return (
    <section className="admin-shell">
      <header className="admin-header">
        <div>
          <span className="admin-kicker">Course operations</span>
          <h1>Admin Dashboard</h1>
        </div>
        <button className="admin-secondary-btn" type="button" onClick={resetForm}>New Course</button>
      </header>

      <div className="admin-metrics" aria-label="Course metrics">
        <div><strong>{courses.length}</strong><span>Total courses</span></div>
        <div><strong>{publishedCount}</strong><span>Published</span></div>
        <div><strong>{protectedCount}</strong><span>Protected PDFs</span></div>
        <div><strong>{users.length}</strong><span>Users</span></div>
      </div>

      {(message || error) && (
        <div className={`admin-alert ${error ? 'admin-alert-error' : ''}`} role="status">
          {error || message}
        </div>
      )}

      <div className="admin-layout">
        <aside className="admin-course-list" aria-label="Courses">
          <div className="admin-panel-heading">
            <h2>Courses</h2>
            <span>{courses.length}</span>
          </div>
          <div className="admin-course-items">
            {courses.map((course) => (
              <button
                key={course.id}
                className={`admin-course-item ${selectedCourseId === course.id ? 'active' : ''}`}
                type="button"
                onClick={() => selectCourse(course)}
              >
                <span>{course.title}</span>
                <small>
                  {course.isPublished ? 'Published' : 'Draft'} - {course.hasPdf ? 'PDF attached' : 'No PDF'}
                </small>
              </button>
            ))}
            {courses.length === 0 && <p className="admin-empty">No courses yet.</p>}
          </div>
        </aside>

        <form className="admin-course-form" onSubmit={handleSaveCourse}>
          <div className="admin-panel-heading">
            <h2>{selectedCourse ? 'Edit Course' : 'Create Course'}</h2>
            {selectedCourse?.pdf && <span>{selectedCourse.pdf.filename}</span>}
          </div>

          <div className="admin-field-grid">
            <label>
              Title
              <input value={form.title} onChange={(event) => updateForm('title', event.target.value)} required />
            </label>
            <label>
              Instructor
              <input value={form.instructorName} onChange={(event) => updateForm('instructorName', event.target.value)} required />
            </label>
            <label>
              Category
              <input list="admin-categories" value={form.categoryName} onChange={(event) => updateForm('categoryName', event.target.value)} required />
              <datalist id="admin-categories">
                {categories.map((category) => <option key={category.id} value={category.name} />)}
              </datalist>
            </label>
            <label>
              Difficulty
              <select value={form.difficulty} onChange={(event) => updateForm('difficulty', event.target.value)}>
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </label>
            <label>
              Price
              <input type="number" min="0" step="0.01" value={form.price} onChange={(event) => updateForm('price', event.target.value)} required />
            </label>
            <label>
              Old Price
              <input type="number" min="0" step="0.01" value={form.oldPrice} onChange={(event) => updateForm('oldPrice', event.target.value)} />
            </label>
            <label>
              Rating
              <input type="number" min="0" max="5" step="0.1" value={form.rating} onChange={(event) => updateForm('rating', event.target.value)} />
            </label>
            <label className="admin-switch">
              <input type="checkbox" checked={form.isPublished} onChange={(event) => updateForm('isPublished', event.target.checked)} />
              <span>Published</span>
            </label>
          </div>

          <label className="admin-full-field">
            Image URL
            <input value={form.imageUrl} onChange={(event) => updateForm('imageUrl', event.target.value)} required />
          </label>

          <div className="admin-pdf-box">
            <h3>Protected PDF</h3>
            <div className="admin-field-grid">
              <label>
                Upload PDF
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(event) => updateForm('pdfFile', event.target.files?.[0] || null)}
                />
              </label>
              <label>
                Secure PDF URL
                <input value={form.pdfUrl} onChange={(event) => updateForm('pdfUrl', event.target.value)} placeholder="https://secure-storage.example/file.pdf" />
              </label>
            </div>
          </div>

          <div className="admin-form-actions">
            <button className="admin-primary-btn" type="submit" disabled={saving}>
              {saving ? 'Saving...' : selectedCourse ? 'Update Course' : 'Create Course'}
            </button>
            {selectedCourse && (
              <button className="admin-danger-btn" type="button" onClick={handleDeleteCourse}>Delete</button>
            )}
          </div>
        </form>

        <aside className="admin-side-tools">
          <form className="admin-tool-panel" onSubmit={handleEnrollUser}>
            <h2>Enroll User</h2>
            <p>{selectedCourse ? selectedCourse.title : 'Select a course first.'}</p>
            <select value={enrollUserId} onChange={(event) => setEnrollUserId(event.target.value)} disabled={!selectedCourseId}>
              <option value="">Choose user</option>
              {users.map((nextUser) => (
                <option key={nextUser.id} value={nextUser.id}>{nextUser.name} - {nextUser.email}</option>
              ))}
            </select>
            <button className="admin-primary-btn" type="submit" disabled={!selectedCourseId || !enrollUserId}>Enroll</button>
          </form>

          <form className="admin-tool-panel" onSubmit={handleCreateCategory}>
            <h2>Add Category</h2>
            <input placeholder="Category name" value={categoryForm.name} onChange={(event) => setCategoryForm((current) => ({ ...current, name: event.target.value }))} required />
            <input placeholder="Icon image URL" value={categoryForm.iconUrl} onChange={(event) => setCategoryForm((current) => ({ ...current, iconUrl: event.target.value }))} required />
            <button className="admin-secondary-btn" type="submit">Create Category</button>
          </form>
        </aside>

        <section className="admin-tool-panel admin-log-panel">
          <div className="admin-log-heading">
            <h2>PDF Access Logs</h2>
            <button className="admin-secondary-btn" type="button" onClick={refreshAccessLogs}>Apply</button>
          </div>
          <div className="admin-log-filters">
            <select
              value={logFilters.courseId}
              onChange={(event) => setLogFilters((current) => ({ ...current, courseId: event.target.value }))}
              aria-label="Filter logs by course"
            >
              <option value="">All courses</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </select>
            <select
              value={logFilters.userId}
              onChange={(event) => setLogFilters((current) => ({ ...current, userId: event.target.value }))}
              aria-label="Filter logs by user"
            >
              <option value="">All users</option>
              {users.map((nextUser) => (
                <option key={nextUser.id} value={nextUser.id}>{nextUser.name} - {nextUser.email}</option>
              ))}
            </select>
            <label>
              From
              <input
                type="datetime-local"
                value={logFilters.dateFrom}
                onChange={(event) => setLogFilters((current) => ({ ...current, dateFrom: event.target.value }))}
              />
            </label>
            <label>
              To
              <input
                type="datetime-local"
                value={logFilters.dateTo}
                onChange={(event) => setLogFilters((current) => ({ ...current, dateTo: event.target.value }))}
              />
            </label>
            <button className="admin-secondary-btn" type="button" onClick={resetAccessLogFilters}>Reset</button>
          </div>
          <div className="admin-log-list">
            {accessLogs.map((log) => (
              <article className="admin-log-item" key={log.id}>
                <div>
                  <strong>{log.courseTitle}</strong>
                  <span>{log.event === 'page-view' ? `Page ${log.pageNumber}` : log.event}</span>
                </div>
                <p>{log.userName} {log.userEmail && `(${log.userEmail})`}</p>
                <small>{log.userId} - {log.ipAddress}</small>
                <time dateTime={log.createdAt}>{new Date(log.createdAt).toLocaleString()}</time>
              </article>
            ))}
            {accessLogs.length === 0 && <p className="admin-empty">No PDF access logs yet.</p>}
          </div>
        </section>
      </div>
    </section>
  );
};

export default AdminDashboard;
