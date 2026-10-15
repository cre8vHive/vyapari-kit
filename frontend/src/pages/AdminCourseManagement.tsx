import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { adminApi, AdminCategory, AdminCourse, AuthUser, CourseSavePayload, PdfAccessLogItem, uploadApi } from '../services/api';

interface AdminCourseManagementProps {
  user: AuthUser | null;
}

interface CourseFormState {
  title: string;
  instructorName: string;
  categoryName: string;
  packageType: 'business-plans' | 'business-tools' | 'business-in-the-box' | string;
  difficulty: string;
  price: string;
  oldPrice: string;
  rating: string;
  imageUrl: string;
  imageFile: File | null;
  isPublished: boolean;
  pdfUrl: string;
  pdfFile: File | null;
  subtitle: string;
  editionNote: string;
  language: string;
  includes: string;
  learningHighlights: string;
  description: string;
  skills: string;
  requirements: string;
  audience: string;
  faqs: { question: string; answer: string }[];
}

const emptyCourseForm: CourseFormState = {
  title: '',
  instructorName: '',
  categoryName: '',
  packageType: 'business-plans',
  difficulty: 'Beginner',
  price: '0',
  oldPrice: '',
  rating: '0',
  imageUrl: '',
  imageFile: null,
  isPublished: true,
  pdfUrl: '',
  pdfFile: null,
  subtitle: '',
  editionNote: '',
  language: '',
  includes: '',
  learningHighlights: '',
  description: '',
  skills: '',
  requirements: '',
  audience: '',
  faqs: [],
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
    packageType: course.packageType || 'business-plans',
    difficulty: course.difficulty,
    price: String(course.price),
    oldPrice: course.oldPrice === undefined ? '' : String(course.oldPrice),
    rating: String(course.rating),
    imageUrl: course.imageUrl,
    imageFile: null,
    isPublished: course.isPublished,
    pdfUrl: '',
    pdfFile: null,
    subtitle: course.subtitle || '',
    editionNote: course.editionNote || '',
    language: course.language || '',
    includes: course.includes?.join('\\n') || '',
    learningHighlights: course.learningHighlights?.join('\\n') || '',
    description: Array.isArray(course.description) ? course.description.join('\\n\\n') : course.description || '',
    skills: course.skills?.join(', ') || '',
    requirements: course.requirements?.join('\\n') || '',
    audience: course.audience?.join('\\n') || '',
    faqs: course.faqs || [],
  };
}

const UNIFIED_ADMIN_SUBCATEGORIES = [
  { label: 'All Subcategories', value: '' },
  { label: 'Agriculture', value: 'Agriculture' },
  { label: 'Commerce', value: 'Commerce' },
  { label: 'Digital', value: 'Digital' },
  { label: 'F&B', value: 'F&B' },
  { label: 'Manufacturing', value: 'Manufacturing' },
  { label: 'Services', value: 'Services' },
];

const BULK_TYPE_CATEGORIES: Record<string, { label: string; value: string }[]> = {
  'business-tools': UNIFIED_ADMIN_SUBCATEGORIES,
  'business-plans': UNIFIED_ADMIN_SUBCATEGORIES,
  'business-in-the-box': UNIFIED_ADMIN_SUBCATEGORIES,
};

export const AdminCourseManagement: React.FC<AdminCourseManagementProps> = ({ user }) => {
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [accessLogs, setAccessLogs] = useState<PdfAccessLogItem[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [form, setForm] = useState<CourseFormState>(emptyCourseForm);
  const [categoryForm, setCategoryForm] = useState({ name: '', iconUrl: '' });
  const [enrollUserId, setEnrollUserId] = useState('');
  const [logFilters, setLogFilters] = useState({ courseId: '', userId: '', dateFrom: '', dateTo: '' });
  const [courseFilters, setCourseFilters] = useState({ search: '', category: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [bulkPrice, setBulkPrice] = useState('');
  const [bulkOldPrice, setBulkOldPrice] = useState('');
  const [bulkPriceType, setBulkPriceType] = useState('');

  // Bulk Upload for Single Type State
  const [bulkUploadType, setBulkUploadType] = useState<'business-tools' | 'business-plans' | 'business-in-the-box'>('business-tools');
  const [bulkUploadCategory, setBulkUploadCategory] = useState('');
  const [bulkUploadDefaultPrice, setBulkUploadDefaultPrice] = useState('49.99');
  const [bulkUploadDefaultOldPrice, setBulkUploadDefaultOldPrice] = useState('99.99');
  const [bulkUploadDefaultInstructor, setBulkUploadDefaultInstructor] = useState('VyapaarKit Team');
  const [bulkUploadInputMode, setBulkUploadInputMode] = useState<'json' | 'titles'>('titles');
  const [bulkUploadText, setBulkUploadText] = useState('');
  const [bulkUploading, setBulkUploading] = useState(false);

  // Popular Showcase State (Max 6 courses)
  const [popularCourseIds, setPopularCourseIds] = useState<string[]>([]);
  const [popularAddSelect, setPopularAddSelect] = useState<string>('');
  const [savingPopular, setSavingPopular] = useState(false);
  const [isPopularPanelOpen, setIsPopularPanelOpen] = useState(true);

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === selectedCourseId) || null,
    [courses, selectedCourseId]
  );

  const availableCoursesToAdd = useMemo(() => {
    return courses.filter((c) => !popularCourseIds.includes(c.id));
  }, [courses, popularCourseIds]);

  const popularSelectedCourses = useMemo(() => {
    const map = new Map(courses.map((c) => [c.id, c]));
    return popularCourseIds.map((id) => map.get(id)).filter(Boolean) as AdminCourse[];
  }, [courses, popularCourseIds]);

  const publishedCount = courses.filter((course) => course.isPublished).length;
  const protectedCount = courses.filter((course) => course.hasPdf).length;
  const filteredCourses = useMemo(() => {
    const search = courseFilters.search.trim().toLowerCase();
    const category = courseFilters.category.trim().toLowerCase();

    return courses.filter((course) => {
      const matchesSearch = !search ||
        course.title.toLowerCase().includes(search) ||
        course.instructorName.toLowerCase().includes(search) ||
        course.categoryName.toLowerCase().includes(search);
      const matchesCategory = !category || course.categoryName.toLowerCase() === category;

      return matchesSearch && matchesCategory;
    });
  }, [courseFilters, courses]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError('');
      const [courseData, userData, categoryData, logData, popularData] = await Promise.all([
        adminApi.getCourses(),
        adminApi.getUsers(),
        adminApi.getCategories(),
        adminApi.getPdfAccessLogs(),
        adminApi.getPopularCourses().catch(() => ({ courseIds: [], courses: [] })),
      ]);
      setCourses(courseData);
      setUsers(userData);
      setCategories(categoryData);
      setAccessLogs(logData);
      if (popularData && Array.isArray(popularData.courseIds) && popularData.courseIds.length > 0) {
        setPopularCourseIds(popularData.courseIds);
      } else {
        const flagged = courseData.filter((c) => c.isPopular).sort((a, b) => (a.popularOrder || 0) - (b.popularOrder || 0));
        if (flagged.length > 0) {
          setPopularCourseIds(flagged.map((c) => c.id).slice(0, 6));
        } else {
          setPopularCourseIds(courseData.slice(0, 3).map((c) => c.id));
        }
      }
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
      packageType: form.packageType || 'business-plans',
      difficulty: form.difficulty,
      price: Number(form.price || 0),
      oldPrice: form.oldPrice === '' ? '' : Number(form.oldPrice),
      rating: Number(form.rating || 0),
      imageUrl: form.imageUrl,
      isPublished: form.isPublished,
      subtitle: form.subtitle,
      editionNote: form.editionNote?.trim() || '',
      language: form.language,
      includes: form.includes.split('\\n').map(s => s.trim()).filter(Boolean),
      learningHighlights: form.learningHighlights.split('\\n').map(s => s.trim()).filter(Boolean),
      description: form.description.split('\\n\\n').map(s => s.trim()).filter(Boolean),
      skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
      requirements: form.requirements.split('\\n').map(s => s.trim()).filter(Boolean),
      audience: form.audience.split('\\n').map(s => s.trim()).filter(Boolean),
      faqs: form.faqs.filter(f => f.question.trim() && f.answer.trim()),
    };

    if (form.imageFile) {
      setMessage('Uploading Course Image to Cloudflare R2...');
      const { uploadUrl, fileUrl } = await uploadApi.getPresignedUrl(form.imageFile.name, 'image/png', 'images');
      
      await fetch(uploadUrl, {
        method: 'PUT',
        body: form.imageFile,
        headers: { 'Content-Type': 'image/png' },
      });

      payload.imageUrl = fileUrl;
    }

    if (form.pdfFile) {
      setMessage('Uploading PDF to Cloudflare R2...');
      const { uploadUrl, fileUrl } = await uploadApi.getPresignedUrl(form.pdfFile.name, 'application/pdf', 'pdfs');
      
      await fetch(uploadUrl, {
        method: 'PUT',
        body: form.pdfFile,
        headers: { 'Content-Type': 'application/pdf' },
      });

      payload.pdf = {
        filename: form.pdfFile.name,
        pdfUrl: fileUrl,
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
      setPopularCourseIds((prev) => prev.filter((id) => id !== selectedCourseId));
      resetForm();
      setMessage('Course deleted.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to delete course.');
    }
  };

  const handleAddPopularCourse = (courseIdToAdd?: string) => {
    const id = courseIdToAdd || popularAddSelect;
    if (!id) return;
    if (popularCourseIds.includes(id)) {
      setMessage('This business solution is already in Popular Business Solutions.');
      return;
    }
    if (popularCourseIds.length >= 6) {
      setError('Maximum 6 courses allowed for Popular Business Solutions. Please remove one first.');
      return;
    }
    setPopularCourseIds((prev) => [...prev, id]);
    setPopularAddSelect('');
    setMessage('');
    setError('');
  };

  const handleRemovePopularCourse = (idToRemove: string) => {
    setPopularCourseIds((prev) => prev.filter((id) => id !== idToRemove));
    setMessage('');
    setError('');
  };

  const handleMovePopularCourse = (index: number, direction: 'up' | 'down') => {
    setPopularCourseIds((prev) => {
      const next = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= next.length) return prev;
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
  };

  const handleSavePopularCourses = async () => {
    try {
      setSavingPopular(true);
      setError('');
      setMessage('Saving Popular Business Solutions...');
      const res = await adminApi.updatePopularCourses(popularCourseIds);
      setMessage(res.message || `Successfully saved ${popularCourseIds.length} popular business solutions!`);
      setCourses((prev) =>
        prev.map((c) => ({
          ...c,
          isPopular: popularCourseIds.includes(c.id),
          popularOrder: popularCourseIds.indexOf(c.id),
        }))
      );
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update Popular Business Solutions.');
    } finally {
      setSavingPopular(false);
    }
  };

  const handleBulkUpdatePrice = async (event: FormEvent) => {
    event.preventDefault();
    const targetText = bulkPriceType ? bulkPriceType.toUpperCase().replace(/-/g, ' ') : 'ALL';
    if (!window.confirm(`Are you sure you want to update the price for ${targetText} courses?`)) return;
    
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const response = await adminApi.bulkUpdatePrice({
        price: Number(bulkPrice),
        oldPrice: bulkOldPrice === '' ? '' : Number(bulkOldPrice),
        type: bulkPriceType,
      });
      const courseData = await adminApi.getCourses();
      setCourses(courseData);
      setMessage(response.message || `Prices updated for ${response.modifiedCount} courses.`);
      setBulkPrice('');
      setBulkOldPrice('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to update bulk prices.');
    } finally {
      setSaving(false);
    }
  };

  const handleInsertSampleJson = () => {
    const typeLabel = bulkUploadType === 'business-tools' ? 'Business Playbooks' : (bulkUploadType === 'business-plans' ? 'Business Plan' : 'Business in the Box');
    const sample = [
      {
        title: `Sample ${typeLabel} Course 1`,
        subtitle: `Actionable playbook and system for ${typeLabel}`,
        price: Number(bulkUploadDefaultPrice || 49.99),
        oldPrice: Number(bulkUploadDefaultOldPrice || 99.99),
        instructorName: bulkUploadDefaultInstructor || 'VyapaarKit Team',
        difficulty: 'Beginner',
        pdfUrl: 'https://example.com/sample-guide.pdf'
      },
      {
        title: `Sample ${typeLabel} Course 2`,
        subtitle: `Complete framework and execution checklist`,
        price: Number(bulkUploadDefaultPrice || 49.99),
        oldPrice: Number(bulkUploadDefaultOldPrice || 99.99),
        instructorName: bulkUploadDefaultInstructor || 'VyapaarKit Team',
        difficulty: 'Intermediate'
      }
    ];
    setBulkUploadText(JSON.stringify(sample, null, 2));
    setBulkUploadInputMode('json');
  };

  const handleBulkUploadSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!bulkUploadText.trim()) {
      setError('Please provide course titles or JSON content for bulk upload.');
      return;
    }

    setBulkUploading(true);
    setMessage('');
    setError('');

    try {
      let parsedCourses: any[] = [];

      if (bulkUploadInputMode === 'json') {
        try {
          parsedCourses = JSON.parse(bulkUploadText.trim());
          if (!Array.isArray(parsedCourses)) {
            throw new Error('JSON input must be an array of course objects.');
          }
        } catch (jsonErr: any) {
          setError(`Invalid JSON: ${jsonErr.message}`);
          setBulkUploading(false);
          return;
        }
      } else {
        const lines = bulkUploadText.split('\n').map((l) => l.trim()).filter(Boolean);
        parsedCourses = lines.map((title) => ({ title }));
      }

      const response = await adminApi.bulkCreateCourses({
        type: bulkUploadType,
        category: bulkUploadCategory,
        defaultPrice: Number(bulkUploadDefaultPrice || 0),
        defaultOldPrice: bulkUploadDefaultOldPrice === '' ? '' : Number(bulkUploadDefaultOldPrice),
        defaultInstructor: bulkUploadDefaultInstructor || 'VyapaarKit Team',
        courses: parsedCourses,
      });

      const updated = await adminApi.getCourses();
      setCourses(updated);
      setMessage(response.message || `Successfully created ${response.createdCount} courses!`);
      setBulkUploadText('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to perform bulk course upload.');
    } finally {
      setBulkUploading(false);
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

      {/* Popular Business Solutions Showcase Management Panel */}
      <section className="admin-showcase-card">
        <div 
          className="admin-showcase-header"
          onClick={() => setIsPopularPanelOpen(!isPopularPanelOpen)}
          style={{ cursor: 'pointer' }}
        >
          <div className="admin-showcase-title-group">
            <div className="admin-showcase-icon">🌟</div>
            <div>
              <div className="admin-showcase-heading-row">
                <h3>Popular Business Solutions (Home Showcase)</h3>
                <span className={`admin-showcase-badge ${popularCourseIds.length >= 6 ? 'is-full' : ''}`}>
                  {popularCourseIds.length} / 6 Selected
                </span>
              </div>
              <p className="admin-showcase-desc">
                Choose up to 6 courses to display in "Popular Business Solutions" on the homepage. Arrange order with arrows.
              </p>
            </div>
          </div>

          <div className="admin-showcase-actions" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="admin-primary-btn"
              onClick={handleSavePopularCourses}
              disabled={savingPopular}
              style={{ padding: '8px 18px', fontSize: '13px', fontWeight: 600 }}
            >
              {savingPopular ? 'Saving...' : 'Save Popular Showcase'}
            </button>
            <button
              type="button"
              className="admin-secondary-btn"
              onClick={() => setIsPopularPanelOpen(!isPopularPanelOpen)}
              style={{ padding: '8px 14px', fontSize: '13px' }}
            >
              {isPopularPanelOpen ? '▲ Hide' : '▼ Manage'}
            </button>
          </div>
        </div>

        {isPopularPanelOpen && (
          <div className="admin-showcase-body">
            {/* Selected Popular Courses Grid */}
            <div className="admin-showcase-subheading">
              <span>
                Featured Solutions in Showcase (Display Order #1 to #{popularSelectedCourses.length}):
              </span>
              {popularCourseIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Clear all solutions from Popular Showcase?')) {
                      setPopularCourseIds([]);
                    }
                  }}
                  style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px', textDecoration: 'underline' }}
                >
                  Clear All
                </button>
              )}
            </div>

            {popularSelectedCourses.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', color: '#64748b', marginBottom: '18px' }}>
                <p style={{ margin: 0, fontWeight: 600 }}>No business solutions selected for the homepage showcase.</p>
                <small style={{ color: '#94a3b8' }}>Select up to 6 courses below to display them on the homepage.</small>
              </div>
            ) : (
              <div className="admin-showcase-grid">
                {popularSelectedCourses.map((c, index) => (
                  <div key={c.id} className="admin-showcase-item">
                    <div className="admin-showcase-order">
                      #{index + 1}
                    </div>

                    <img
                      src={c.imageUrl}
                      alt={c.title}
                      className="admin-showcase-thumb"
                    />

                    <div className="admin-showcase-info">
                      <div className="admin-showcase-title" title={c.title}>
                        {c.title}
                      </div>
                      <div className="admin-showcase-meta">
                        <span className="admin-showcase-cat">{c.categoryName}</span>
                        <span className="admin-showcase-price">₹{c.price}</span>
                      </div>
                    </div>

                    <div className="admin-showcase-btns">
                      <button
                        type="button"
                        className="admin-showcase-btn-icon"
                        onClick={() => handleMovePopularCourse(index, 'up')}
                        disabled={index === 0}
                        title="Move earlier"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="admin-showcase-btn-icon"
                        onClick={() => handleMovePopularCourse(index, 'down')}
                        disabled={index === popularSelectedCourses.length - 1}
                        title="Move later"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className="admin-showcase-btn-del"
                        onClick={() => handleRemovePopularCourse(c.id)}
                        title="Remove from showcase"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Course Selector */}
            <div className="admin-showcase-add-bar">
              <label className="admin-showcase-add-label">
                Add Course to Showcase:
              </label>
              <div className="admin-showcase-add-row">
                <select
                  value={popularAddSelect}
                  onChange={(e) => setPopularAddSelect(e.target.value)}
                  disabled={popularCourseIds.length >= 6}
                  className="admin-showcase-add-select"
                >
                  <option value="">-- Choose a business solution to add ({availableCoursesToAdd.length} available) --</option>
                  {availableCoursesToAdd.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title} ({course.categoryName} - ₹{course.price})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  className="admin-primary-btn"
                  onClick={() => handleAddPopularCourse()}
                  disabled={!popularAddSelect || popularCourseIds.length >= 6}
                  style={{
                    padding: '8px 18px',
                    fontSize: '13px',
                    whiteSpace: 'nowrap',
                    opacity: (!popularAddSelect || popularCourseIds.length >= 6) ? 0.6 : 1,
                    cursor: (!popularAddSelect || popularCourseIds.length >= 6) ? 'not-allowed' : 'pointer'
                  }}
                >
                  + Add to Showcase
                </button>
              </div>

              {popularCourseIds.length >= 6 && (
                <div>
                  <span className="admin-showcase-limit-notice">
                    ⚠️ Maximum limit of 6 solutions reached. Remove one above to add another.
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      <div className="admin-layout">
        <aside className="admin-course-list" aria-label="Business Solutions">
          <div className="admin-panel-heading">
            <h2>Business Solutions</h2>
            <span>{filteredCourses.length} / {courses.length}</span>
          </div>
          <div className="admin-course-filters" aria-label="Filter business solutions">
            <input
              value={courseFilters.search}
              onChange={(event) => setCourseFilters((current) => ({ ...current, search: event.target.value }))}
              placeholder="Search business solutions"
              type="search"
            />
            <select
              value={courseFilters.category}
              onChange={(event) => setCourseFilters((current) => ({ ...current, category: event.target.value }))}
              aria-label="Filter solutions by category"
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.name}>{category.name}</option>
              ))}
            </select>
          </div>
          <div className="admin-course-items">
            {filteredCourses.map((course) => {
              const isPopular = popularCourseIds.includes(course.id);
              const popularIndex = popularCourseIds.indexOf(course.id);
              return (
                <button
                  key={course.id}
                  className={`admin-course-item ${selectedCourseId === course.id ? 'active' : ''}`}
                  type="button"
                  onClick={() => selectCourse(course)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                    <span style={{ textAlign: 'left', fontWeight: 600 }}>{course.title}</span>
                    {isPopular && (
                      <span style={{
                        background: '#fef3c7',
                        color: '#b45309',
                        border: '1px solid #fde68a',
                        borderRadius: '4px',
                        padding: '1px 5px',
                        fontSize: '10px',
                        fontWeight: 700,
                        whiteSpace: 'nowrap'
                      }}>
                        ★ Popular #{popularIndex + 1}
                      </span>
                    )}
                  </div>
                  <small>
                    {course.isPublished ? 'Published' : 'Draft'} - {course.hasPdf ? 'PDF attached' : 'No PDF'}
                  </small>
                </button>
              );
            })}
            {courses.length === 0 && <p className="admin-empty">No business solutions yet.</p>}
            {courses.length > 0 && filteredCourses.length === 0 && <p className="admin-empty">No business solutions match this filter.</p>}
          </div>
        </aside>

        <form className="admin-course-form" onSubmit={handleSaveCourse}>
          <div className="admin-panel-heading">
            <h2>{selectedCourse ? 'Edit Business Solution' : 'Create Business Solution'}</h2>
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
              Package Type
              <select value={form.packageType} onChange={(event) => updateForm('packageType', event.target.value)}>
                <option value="business-plans">Business Plans</option>
                <option value="business-tools">Business Playbooks</option>
                <option value="business-in-the-box">Business in a Box</option>
              </select>
            </label>
            <label>
              Category
              <select value={form.categoryName} onChange={(event) => updateForm('categoryName', event.target.value)} required>
                <option value="">Select Category</option>
                <option value="Agriculture">Agriculture</option>
                <option value="Commerce">Commerce</option>
                <option value="Digital">Digital</option>
                <option value="F&B">F&B</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Services">Services</option>
              </select>
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
            {selectedCourseId && (
              <label className="admin-switch" title="Toggle showcase on homepage under Popular Business Solutions (max 6)">
                <input
                  type="checkbox"
                  checked={popularCourseIds.includes(selectedCourseId)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      handleAddPopularCourse(selectedCourseId);
                    } else {
                      handleRemovePopularCourse(selectedCourseId);
                    }
                  }}
                />
                <span>
                  Popular Showcase {popularCourseIds.includes(selectedCourseId) ? `(#${popularCourseIds.indexOf(selectedCourseId) + 1})` : `(${popularCourseIds.length}/6)`}
                </span>
              </label>
            )}
          </div>

          <label className="admin-full-field">
            Solution Image (upload only png)
            <input 
              type="file" 
              accept=".png" 
              onChange={(event) => updateForm('imageFile', event.target.files?.[0] || null)} 
            />
            {form.imageUrl && !form.imageFile && <small>Current Image: {form.imageUrl}</small>}
          </label>

          <label className="admin-full-field">
            Subtitle
            <input value={form.subtitle} onChange={(event) => updateForm('subtitle', event.target.value)} />
          </label>
          <label className="admin-full-field">
            Edition Note / Badge (e.g. "Latest Edition")
            <input 
              value={form.editionNote} 
              onChange={(event) => updateForm('editionNote', event.target.value)} 
              placeholder="e.g. Latest Edition"
            />
            <small style={{ color: 'var(--color-muted)', display: 'block', marginTop: '4px' }}>
              Displayed on the course/kit sales page and thumbnail. Leave empty to hide.
            </small>
          </label>
          <label className="admin-full-field">
            Language
            <input value={form.language} onChange={(event) => updateForm('language', event.target.value)} />
          </label>
          <label className="admin-full-field">
            Description (Paragraphs separated by newlines)
            <textarea rows={5} value={form.description} onChange={(event) => updateForm('description', event.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text)' }} />
          </label>
          <label className="admin-full-field">
            What you will learn (Separated by newlines)
            <textarea rows={4} value={form.learningHighlights} onChange={(event) => updateForm('learningHighlights', event.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text)' }} />
          </label>
          <label className="admin-full-field">
            Course Includes (Separated by newlines)
            <textarea rows={3} value={form.includes} onChange={(event) => updateForm('includes', event.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text)' }} />
          </label>
          <label className="admin-full-field">
            Skills you will gain (Comma separated)
            <input value={form.skills} onChange={(event) => updateForm('skills', event.target.value)} />
          </label>
          <label className="admin-full-field">
            Requirements (Separated by newlines)
            <textarea rows={3} value={form.requirements} onChange={(event) => updateForm('requirements', event.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text)' }} />
          </label>
          <label className="admin-full-field">
            Who this course is for (Separated by newlines)
            <textarea rows={3} value={form.audience} onChange={(event) => updateForm('audience', event.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text)' }} />
          </label>

          <div className="admin-full-field">
            <strong>FAQs</strong>
            {form.faqs.map((faq, index) => (
              <div key={index} style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <input placeholder="Question" value={faq.question} onChange={(e) => {
                  const newFaqs = [...form.faqs];
                  newFaqs[index].question = e.target.value;
                  updateForm('faqs', newFaqs as any);
                }} style={{ flex: 1 }} />
                <input placeholder="Answer" value={faq.answer} onChange={(e) => {
                  const newFaqs = [...form.faqs];
                  newFaqs[index].answer = e.target.value;
                  updateForm('faqs', newFaqs as any);
                }} style={{ flex: 2 }} />
                <button type="button" onClick={() => {
                  const newFaqs = form.faqs.filter((_, i) => i !== index);
                  updateForm('faqs', newFaqs as any);
                }} className="admin-danger-btn" style={{ padding: '0 10px' }}>X</button>
              </div>
            ))}
            <button type="button" onClick={() => {
              updateForm('faqs', [...form.faqs, { question: '', answer: '' }] as any);
            }} className="admin-secondary-btn" style={{ marginTop: '10px' }}>+ Add FAQ</button>
          </div>


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
              {saving ? 'Saving...' : selectedCourse ? 'Update Solution' : 'Create Business Solution'}
            </button>
            {selectedCourse && (
              <button className="admin-danger-btn" type="button" onClick={handleDeleteCourse}>Delete</button>
            )}
          </div>
        </form>

        <aside className="admin-side-tools">
<div className="admin-tool-panel" style={{ marginBottom: '20px' }}>
            <h2>Bulk Price Update</h2>
            <form onSubmit={handleBulkUpdatePrice} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label>
                Target Type Filter
                <select
                  value={bulkPriceType}
                  onChange={(e) => setBulkPriceType(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                >
                  <option value="">All Solution Types</option>
                  <option value="business-plans">Business Plans Only</option>
                  <option value="business-tools">Business Playbooks Only</option>
                  <option value="business-in-the-box">Business in the Box Only</option>
                </select>
              </label>
              <label>
                New Price
                <input type="number" step="0.01" value={bulkPrice} onChange={(e) => setBulkPrice(e.target.value)} required />
              </label>
              <label>
                New Old Price (Optional)
                <input type="number" step="0.01" value={bulkOldPrice} onChange={(e) => setBulkOldPrice(e.target.value)} />
              </label>
              <button className="admin-primary-btn" type="submit" disabled={saving} style={{ marginTop: '10px' }}>
                {saving ? 'Updating...' : `Update Prices (${bulkPriceType ? bulkPriceType.toUpperCase().replace(/-/g, ' ') : 'ALL'})`}
              </button>
            </form>
          </div>

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

export default AdminCourseManagement;
