import React, { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
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

interface BulkCourseRowProps {
  course: AdminCourse;
  isSelected: boolean;
  onToggle: (id: string) => void;
  onEdit: (course: AdminCourse) => void;
}

const BulkCourseRow = React.memo<BulkCourseRowProps>(({ course, isSelected, onToggle, onEdit }) => {
  return (
    <tr className={isSelected ? 'is-selected' : ''}>
      <td style={{ textAlign: 'center' }}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggle(course.id)}
          aria-label={`Select ${course.title}`}
        />
      </td>
      <td className="admin-bulk-title-col">
        <span className="admin-bulk-title-text" title={course.title}>
          {course.title}
        </span>
        {course.subtitle && (
          <span className="admin-bulk-subtitle-text" title={course.subtitle}>
            {course.subtitle}
          </span>
        )}
      </td>
      <td>
        <span className={`admin-badge-type ${course.packageType || 'business-plans'}`}>
          {course.packageType ? course.packageType.replace(/-/g, ' ') : 'business plans'}
        </span>
      </td>
      <td>
        <span className="admin-badge-cat">
          {course.categoryName || 'General'}
        </span>
      </td>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <strong style={{ color: '#0f172a' }}>₹{course.price}</strong>
          {course.oldPrice && (
            <del style={{ color: '#94a3b8', fontSize: '11px' }}>₹{course.oldPrice}</del>
          )}
        </div>
      </td>
      <td>
        <span className={`admin-badge-status ${course.isPublished ? 'is-published' : 'is-draft'}`}>
          {course.isPublished ? '● Published' : '○ Draft'}
        </span>
      </td>
      <td style={{ color: '#64748b', fontSize: '12px' }}>
        {course.instructorName || 'VyapaarKit Team'}
      </td>
      <td style={{ textAlign: 'right' }}>
        <div className="admin-bulk-row-actions" style={{ justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="admin-bulk-quick-btn"
            onClick={() => onEdit(course)}
            title="Open in Single Editor"
          >
            ✏️ Edit
          </button>
        </div>
      </td>
    </tr>
  );
});
BulkCourseRow.displayName = 'BulkCourseRow';

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
  const [isPopularPanelOpen, setIsPopularPanelOpen] = useState(false);

  // Top-level View Tab: 'single' (Course Editor) or 'bulk' (Bulk Update Studio)
  const [adminTab, setAdminTab] = useState<'single' | 'bulk'>('single');

  // Bulk Selection and Filter State
  const [bulkFilters, setBulkFilters] = useState({
    search: '',
    category: '',
    packageType: '',
    isPublished: 'all', // 'all' | 'published' | 'draft'
  });
  const [selectedBulkCourseIds, setSelectedBulkCourseIds] = useState<string[]>([]);
  const [bulkStudioTab, setBulkStudioTab] = useState<'multi' | 'rule' | 'delete'>('multi');

  // Unified Multi-Field Bulk Update State
  const [bulkFields, setBulkFields] = useState({
    title: '',
    subtitle: '',
    editionNote: '',
    packageType: '',
    categoryName: '',
    price: '',
    oldPrice: '',
    clearOldPrice: false,
    rating: '4.9',
    difficulty: 'Beginner',
    instructorName: '',
    isPublished: true,
    language: '',
    duration: '',
    imageUrl: '',
    thumbnail: '',
    bannerImage: '',
    boxImageUrl: '',
    syncThumbnailFromGallery: false,
    includes: '',
    learningHighlights: '',
    skills: '',
    requirements: '',
    audience: '',
    description: '',
  });

  const [bulkEnabled, setBulkEnabled] = useState<Record<string, boolean>>({
    title: false,
    subtitle: false,
    editionNote: false,
    packageType: false,
    categoryName: false,
    price: false,
    oldPrice: false,
    rating: false,
    difficulty: false,
    instructorName: false,
    isPublished: false,
    language: false,
    duration: false,
    imageUrl: false,
    thumbnail: false,
    bannerImage: false,
    boxImageUrl: false,
    syncThumbnailFromGallery: false,
    includes: false,
    learningHighlights: false,
    skills: false,
    requirements: false,
    audience: false,
    description: false,
  });

  const [bulkProcessing, setBulkProcessing] = useState<boolean>(false);
  const [bulkPage, setBulkPage] = useState<number>(1);
  const [bulkPageSize, setBulkPageSize] = useState<number>(25);

  useEffect(() => {
    setBulkPage(1);
  }, [bulkFilters]);

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

  const allCategoryNames = useMemo(() => {
    const set = new Set<string>();
    categories.forEach((cat) => cat.name && set.add(cat.name));
    courses.forEach((c) => c.categoryName && set.add(c.categoryName));
    return Array.from(set).sort();
  }, [categories, courses]);

  const filteredBulkCourses = useMemo(() => {
    const search = bulkFilters.search.trim().toLowerCase();
    const category = bulkFilters.category.trim().toLowerCase();
    const type = bulkFilters.packageType.trim().toLowerCase();
    const status = bulkFilters.isPublished;

    return courses.filter((course) => {
      const matchesSearch =
        !search ||
        course.title.toLowerCase().includes(search) ||
        (course.instructorName && course.instructorName.toLowerCase().includes(search)) ||
        (course.categoryName && course.categoryName.toLowerCase().includes(search));

      const matchesCategory = !category || (course.categoryName && course.categoryName.toLowerCase() === category);
      const matchesType = !type || (course.packageType && course.packageType.toLowerCase() === type);
      const matchesStatus =
        status === 'all' ||
        (status === 'published' && course.isPublished) ||
        (status === 'draft' && !course.isPublished);

      return matchesSearch && matchesCategory && matchesType && matchesStatus;
    });
  }, [bulkFilters, courses]);

  const selectedBulkCourseIdsSet = useMemo(() => new Set(selectedBulkCourseIds), [selectedBulkCourseIds]);

  const isAllFilteredSelected = useMemo(
    () =>
      filteredBulkCourses.length > 0 &&
      filteredBulkCourses.every((c) => selectedBulkCourseIdsSet.has(c.id)),
    [filteredBulkCourses, selectedBulkCourseIdsSet]
  );

  const toggleSelectAllFiltered = useCallback(() => {
    if (isAllFilteredSelected) {
      const filteredIdSet = new Set(filteredBulkCourses.map((c) => c.id));
      setSelectedBulkCourseIds((prev) => prev.filter((id) => !filteredIdSet.has(id)));
    } else {
      const newIds = new Set([...selectedBulkCourseIds, ...filteredBulkCourses.map((c) => c.id)]);
      setSelectedBulkCourseIds(Array.from(newIds));
    }
  }, [isAllFilteredSelected, filteredBulkCourses, selectedBulkCourseIds]);

  const toggleCourseSelection = useCallback((id: string) => {
    setSelectedBulkCourseIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const totalBulkPages = Math.max(1, Math.ceil(filteredBulkCourses.length / bulkPageSize));
  const paginatedBulkCourses = useMemo(() => {
    if (bulkPageSize >= filteredBulkCourses.length) return filteredBulkCourses;
    const start = (bulkPage - 1) * bulkPageSize;
    return filteredBulkCourses.slice(start, start + bulkPageSize);
  }, [filteredBulkCourses, bulkPage, bulkPageSize]);

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
      const [courseData, userData, categoryData, popularData] = await Promise.all([
        adminApi.getCourses(),
        adminApi.getUsers(),
        adminApi.getCategories(),
        adminApi.getPopularCourses().catch(() => ({ courseIds: [], courses: [] })),
      ]);
      setCourses(courseData);
      setUsers(userData);
      setCategories(categoryData);
      setAccessLogs([]);
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

  const selectCourse = useCallback((course: AdminCourse) => {
    setSelectedCourseId(course.id);
    setForm(courseToForm(course));
    setMessage('');
    setError('');
  }, []);

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
      setCourses((prevCourses) =>
        prevCourses.map((c) => {
          if (bulkPriceType && c.packageType !== bulkPriceType) return c;
          const next = { ...c, price: Number(bulkPrice) };
          if (bulkOldPrice !== '') {
            next.oldPrice = Number(bulkOldPrice);
          }
          return next;
        })
      );
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

  const updateBulkField = useCallback((field: string, value: any) => {
    setBulkFields((prev) => ({ ...prev, [field]: value }));
    const enableKey = field === 'clearOldPrice' ? 'oldPrice' : field;
    setBulkEnabled((prev) => {
      if (prev[enableKey]) return prev;
      return { ...prev, [enableKey]: true };
    });
  }, []);

  const toggleBulkFieldEnabled = useCallback((field: string) => {
    setBulkEnabled((prev) => ({ ...prev, [field]: !prev[field] }));
  }, []);

  const toggleAllBulkFields = useCallback((enable: boolean) => {
    setBulkEnabled((prev) => {
      const next: Record<string, boolean> = {};
      Object.keys(prev).forEach((k) => {
        next[k] = enable;
      });
      return next;
    });
  }, []);

  const enabledFieldKeys = Object.keys(bulkEnabled).filter((k) => bulkEnabled[k]);

  const handleApplyAllBulkFields = async () => {
    if (selectedBulkCourseIds.length === 0) {
      setError('Please select at least one course from the table below.');
      return;
    }
    if (enabledFieldKeys.length === 0) {
      setError('Please enable at least one field to update.');
      return;
    }

    setBulkProcessing(true);
    setMessage('');
    setError('');

    try {
      const updates: Record<string, any> = {};

      if (bulkEnabled.title && bulkFields.title.trim()) updates.title = bulkFields.title.trim();
      if (bulkEnabled.subtitle) updates.subtitle = bulkFields.subtitle.trim();
      if (bulkEnabled.editionNote) updates.editionNote = bulkFields.editionNote.trim();
      if (bulkEnabled.packageType && bulkFields.packageType) updates.packageType = bulkFields.packageType;
      if (bulkEnabled.categoryName && bulkFields.categoryName.trim()) updates.categoryName = bulkFields.categoryName.trim();

      if (bulkEnabled.price && bulkFields.price !== '') {
        updates.price = Number(bulkFields.price);
      }

      if (bulkEnabled.oldPrice) {
        if (bulkFields.clearOldPrice) {
          updates.oldPrice = null;
        } else if (bulkFields.oldPrice !== '') {
          updates.oldPrice = Number(bulkFields.oldPrice);
        }
      }

      if (bulkEnabled.rating && bulkFields.rating !== '') {
        updates.rating = Number(bulkFields.rating);
      }

      if (bulkEnabled.difficulty && bulkFields.difficulty) updates.difficulty = bulkFields.difficulty;
      if (bulkEnabled.instructorName && bulkFields.instructorName.trim()) updates.instructorName = bulkFields.instructorName.trim();
      if (bulkEnabled.isPublished) updates.isPublished = bulkFields.isPublished;
      if (bulkEnabled.language && bulkFields.language.trim()) updates.language = bulkFields.language.trim();
      if (bulkEnabled.duration && bulkFields.duration.trim()) updates.duration = bulkFields.duration.trim();
      if (bulkEnabled.imageUrl && bulkFields.imageUrl.trim()) updates.imageUrl = bulkFields.imageUrl.trim();
      if (bulkEnabled.thumbnail) updates.thumbnail = bulkFields.thumbnail.trim();
      if (bulkEnabled.bannerImage) updates.bannerImage = bulkFields.bannerImage.trim();
      if (bulkEnabled.boxImageUrl) updates.boxImageUrl = bulkFields.boxImageUrl.trim();
      if (bulkEnabled.syncThumbnailFromGallery) updates.syncThumbnailFromGallery = bulkFields.syncThumbnailFromGallery;

      if (bulkEnabled.includes) {
        updates.includes = bulkFields.includes.split('\n').map((s) => s.trim()).filter(Boolean);
      }
      if (bulkEnabled.learningHighlights) {
        updates.learningHighlights = bulkFields.learningHighlights.split('\n').map((s) => s.trim()).filter(Boolean);
      }
      if (bulkEnabled.skills) {
        updates.skills = bulkFields.skills.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
      }
      if (bulkEnabled.requirements) {
        updates.requirements = bulkFields.requirements.split('\n').map((s) => s.trim()).filter(Boolean);
      }
      if (bulkEnabled.audience) {
        updates.audience = bulkFields.audience.split('\n').map((s) => s.trim()).filter(Boolean);
      }
      if (bulkEnabled.description) {
        updates.description = bulkFields.description.split('\n\n').map((s) => s.trim()).filter(Boolean);
      }

      const res = await adminApi.bulkUpdateCourses(selectedBulkCourseIds, updates);
      const selectedSet = new Set(selectedBulkCourseIds);
      setCourses((prevCourses) =>
        prevCourses.map((c) => {
          if (!selectedSet.has(c.id)) return c;
          const next = { ...c, ...updates };
          if (updates.oldPrice === null) {
            delete (next as any).oldPrice;
          }
          return next;
        })
      );
      setMessage(res.message || `Successfully updated ${enabledFieldKeys.length} field(s) across ${res.modifiedCount} course(s)!`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to apply bulk field updates.');
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleBulkDeleteSelected = async () => {
    if (selectedBulkCourseIds.length === 0) {
      setError('Please select at least one course to delete.');
      return;
    }
    if (!window.confirm(`⚠️ WARNING: Are you sure you want to delete ${selectedBulkCourseIds.length} course(s)? This action cannot be undone.`)) return;

    setBulkProcessing(true);
    setMessage('');
    setError('');

    try {
      const res = await adminApi.bulkDeleteCourses(selectedBulkCourseIds);
      const deletedSet = new Set(selectedBulkCourseIds);
      setCourses((prevCourses) => prevCourses.filter((c) => !deletedSet.has(c.id)));
      setSelectedBulkCourseIds([]);
      setMessage(res.message || `Successfully deleted ${res.deletedCount} courses.`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to bulk delete courses.');
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleExportCsv = () => {
    const listToExport = selectedBulkCourseIds.length > 0
      ? courses.filter((c) => selectedBulkCourseIds.includes(c.id))
      : filteredBulkCourses;

    if (listToExport.length === 0) {
      setError('No courses available to export.');
      return;
    }

    const headers = ['ID', 'Title', 'Package Type', 'Category', 'Price', 'Old Price', 'Status', 'Instructor', 'Difficulty', 'Rating', 'Image URL'];
    const rows = listToExport.map((c) => [
      `"${c.id}"`,
      `"${(c.title || '').replace(/"/g, '""')}"`,
      `"${(c.packageType || '').replace(/"/g, '""')}"`,
      `"${(c.categoryName || '').replace(/"/g, '""')}"`,
      c.price,
      c.oldPrice || '',
      c.isPublished ? 'Published' : 'Draft',
      `"${(c.instructorName || '').replace(/"/g, '""')}"`,
      `"${(c.difficulty || '').replace(/"/g, '""')}"`,
      c.rating,
      `"${(c.imageUrl || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `courses_catalog_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setMessage(`Exported ${listToExport.length} courses to CSV.`);
  };

  const handleEditCourseInSingleEditor = useCallback((course: AdminCourse) => {
    selectCourse(course);
    setAdminTab('single');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectCourse]);

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

      {/* Admin Tab Switcher */}
      <div className="admin-nav-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={adminTab === 'single'}
          className={`admin-tab-btn ${adminTab === 'single' ? 'active' : ''}`}
          onClick={() => setAdminTab('single')}
        >
          <span>📝 Single Course Editor</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={adminTab === 'bulk'}
          className={`admin-tab-btn ${adminTab === 'bulk' ? 'active' : ''}`}
          onClick={() => setAdminTab('bulk')}
        >
          <span>⚡ Bulk Update & Operations</span>
          {selectedBulkCourseIds.length > 0 && (
            <span className="admin-tab-badge">{selectedBulkCourseIds.length}</span>
          )}
        </button>
      </div>

      {adminTab === 'bulk' ? (
        <div className="admin-bulk-wrapper">
          {/* Operations Card */}
          <div className="admin-bulk-card">
            <div className="admin-bulk-card-header">
              <h2>
                <span>⚡</span>
                <span>Bulk Course Operations</span>
              </h2>
              <div className="admin-bulk-pills" role="tablist">
                <button
                  type="button"
                  className={`admin-bulk-pill-btn ${bulkStudioTab === 'multi' ? 'active' : ''}`}
                  onClick={() => setBulkStudioTab('multi')}
                >
                  🚀 Multi-Field Editor (Update Any Field at Once)
                </button>
                <button
                  type="button"
                  className={`admin-bulk-pill-btn ${bulkStudioTab === 'rule' ? 'active' : ''}`}
                  onClick={() => setBulkStudioTab('rule')}
                >
                  📊 Category Rule Fast Price
                </button>
                <button
                  type="button"
                  className={`admin-bulk-pill-btn ${bulkStudioTab === 'delete' ? 'active' : ''}`}
                  onClick={() => setBulkStudioTab('delete')}
                  style={{ color: bulkStudioTab === 'delete' ? '#fff' : '#ef4444' }}
                >
                  🗑️ Bulk Delete Selected
                </button>
              </div>
            </div>

            <div className="admin-bulk-action-form">
              {bulkStudioTab === 'multi' && (
                <div className="admin-bulk-sections-container">
                  {/* Top Bar with Enable/Disable helpers & Counter */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: '13px', color: '#1e293b' }}>
                        Selected Courses: <strong style={{ color: '#0b7cff' }}>{selectedBulkCourseIds.length}</strong> | Fields Enabled: <strong style={{ color: '#0b7cff' }}>{enabledFieldKeys.length}</strong>
                      </span>
                      <div className="admin-bulk-badge-list">
                        {enabledFieldKeys.length === 0 ? (
                          <span style={{ color: '#94a3b8', fontSize: '12px' }}>
                            (Type into any field below or check its box to enable it for bulk update)
                          </span>
                        ) : (
                          enabledFieldKeys.map((key) => (
                            <span key={key} className="admin-bulk-active-tag">
                              {key}
                              <button type="button" onClick={() => toggleBulkFieldEnabled(key)} title="Remove field">✕</button>
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        className="admin-bulk-quick-btn"
                        onClick={() => toggleAllBulkFields(true)}
                      >
                        Enable All
                      </button>
                      <button
                        type="button"
                        className="admin-bulk-quick-btn"
                        onClick={() => toggleAllBulkFields(false)}
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  {/* Section 1: Pricing & Commerce */}
                  <div className="admin-bulk-section-card">
                    <h3 className="admin-bulk-section-title">💰 Pricing, Discount & Ratings</h3>
                    <div className="admin-bulk-grid-fields">
                      <div className={`admin-bulk-field ${bulkEnabled.price ? 'is-enabled' : ''}`}>
                        <div className="admin-bulk-field-header">
                          <label>Price (₹)</label>
                          <span className="admin-bulk-field-toggle" onClick={() => toggleBulkFieldEnabled('price')}>
                            <input type="checkbox" checked={bulkEnabled.price} onChange={() => toggleBulkFieldEnabled('price')} />
                            <span>Update</span>
                          </span>
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="e.g. 499"
                          value={bulkFields.price}
                          onChange={(e) => updateBulkField('price', e.target.value)}
                        />
                      </div>

                      <div className={`admin-bulk-field ${bulkEnabled.oldPrice ? 'is-enabled' : ''}`}>
                        <div className="admin-bulk-field-header">
                          <label>Old / Original Price (₹)</label>
                          <span className="admin-bulk-field-toggle" onClick={() => toggleBulkFieldEnabled('oldPrice')}>
                            <input type="checkbox" checked={bulkEnabled.oldPrice} onChange={() => toggleBulkFieldEnabled('oldPrice')} />
                            <span>Update</span>
                          </span>
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="e.g. 999"
                          value={bulkFields.oldPrice}
                          disabled={bulkFields.clearOldPrice}
                          onChange={(e) => updateBulkField('oldPrice', e.target.value)}
                        />
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', marginTop: '4px', cursor: 'pointer', color: '#64748b' }}>
                          <input
                            type="checkbox"
                            checked={bulkFields.clearOldPrice}
                            onChange={(e) => updateBulkField('clearOldPrice', e.target.checked)}
                          />
                          <span>Remove / Clear Old Price</span>
                        </label>
                      </div>

                      <div className={`admin-bulk-field ${bulkEnabled.rating ? 'is-enabled' : ''}`}>
                        <div className="admin-bulk-field-header">
                          <label>Rating (0.0 to 5.0)</label>
                          <span className="admin-bulk-field-toggle" onClick={() => toggleBulkFieldEnabled('rating')}>
                            <input type="checkbox" checked={bulkEnabled.rating} onChange={() => toggleBulkFieldEnabled('rating')} />
                            <span>Update</span>
                          </span>
                        </div>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="5"
                          placeholder="e.g. 4.9"
                          value={bulkFields.rating}
                          onChange={(e) => updateBulkField('rating', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Hierarchy, Classification & Publishing */}
                  <div className="admin-bulk-section-card">
                    <h3 className="admin-bulk-section-title">🏷️ Classification, Instructor & Publishing</h3>
                    <div className="admin-bulk-grid-fields">
                      <div className={`admin-bulk-field ${bulkEnabled.packageType ? 'is-enabled' : ''}`}>
                        <div className="admin-bulk-field-header">
                          <label>Package Type</label>
                          <span className="admin-bulk-field-toggle" onClick={() => toggleBulkFieldEnabled('packageType')}>
                            <input type="checkbox" checked={bulkEnabled.packageType} onChange={() => toggleBulkFieldEnabled('packageType')} />
                            <span>Update</span>
                          </span>
                        </div>
                        <select
                          value={bulkFields.packageType}
                          onChange={(e) => updateBulkField('packageType', e.target.value)}
                        >
                          <option value="">-- Choose Type --</option>
                          <option value="business-plans">Business Plans</option>
                          <option value="business-tools">Business Tools</option>
                          <option value="business-in-the-box">Business in the Box</option>
                        </select>
                      </div>

                      <div className={`admin-bulk-field ${bulkEnabled.categoryName ? 'is-enabled' : ''}`}>
                        <div className="admin-bulk-field-header">
                          <label>Category</label>
                          <span className="admin-bulk-field-toggle" onClick={() => toggleBulkFieldEnabled('categoryName')}>
                            <input type="checkbox" checked={bulkEnabled.categoryName} onChange={() => toggleBulkFieldEnabled('categoryName')} />
                            <span>Update</span>
                          </span>
                        </div>
                        <input
                          list="bulk-category-datalist-all"
                          placeholder="Select or enter category..."
                          value={bulkFields.categoryName}
                          onChange={(e) => updateBulkField('categoryName', e.target.value)}
                        />
                        <datalist id="bulk-category-datalist-all">
                          {allCategoryNames.map((cat) => (
                            <option key={cat} value={cat} />
                          ))}
                        </datalist>
                      </div>

                      <div className={`admin-bulk-field ${bulkEnabled.difficulty ? 'is-enabled' : ''}`}>
                        <div className="admin-bulk-field-header">
                          <label>Difficulty</label>
                          <span className="admin-bulk-field-toggle" onClick={() => toggleBulkFieldEnabled('difficulty')}>
                            <input type="checkbox" checked={bulkEnabled.difficulty} onChange={() => toggleBulkFieldEnabled('difficulty')} />
                            <span>Update</span>
                          </span>
                        </div>
                        <select
                          value={bulkFields.difficulty}
                          onChange={(e) => updateBulkField('difficulty', e.target.value)}
                        >
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                        </select>
                      </div>

                      <div className={`admin-bulk-field ${bulkEnabled.instructorName ? 'is-enabled' : ''}`}>
                        <div className="admin-bulk-field-header">
                          <label>Instructor Name</label>
                          <span className="admin-bulk-field-toggle" onClick={() => toggleBulkFieldEnabled('instructorName')}>
                            <input type="checkbox" checked={bulkEnabled.instructorName} onChange={() => toggleBulkFieldEnabled('instructorName')} />
                            <span>Update</span>
                          </span>
                        </div>
                        <input
                          type="text"
                          placeholder="e.g. VyapaarKit Team"
                          value={bulkFields.instructorName}
                          onChange={(e) => updateBulkField('instructorName', e.target.value)}
                        />
                      </div>

                      <div className={`admin-bulk-field ${bulkEnabled.isPublished ? 'is-enabled' : ''}`}>
                        <div className="admin-bulk-field-header">
                          <label>Store Visibility</label>
                          <span className="admin-bulk-field-toggle" onClick={() => toggleBulkFieldEnabled('isPublished')}>
                            <input type="checkbox" checked={bulkEnabled.isPublished} onChange={() => toggleBulkFieldEnabled('isPublished')} />
                            <span>Update</span>
                          </span>
                        </div>
                        <select
                          value={bulkFields.isPublished ? 'true' : 'false'}
                          onChange={(e) => updateBulkField('isPublished', e.target.value === 'true')}
                        >
                          <option value="true">Published (Visible in Store)</option>
                          <option value="false">Unpublished (Draft / Hidden)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: General Information */}
                  <div className="admin-bulk-section-card">
                    <h3 className="admin-bulk-section-title">📝 Course Information & Meta</h3>
                    <div className="admin-bulk-grid-fields">
                      <div className={`admin-bulk-field ${bulkEnabled.title ? 'is-enabled' : ''}`}>
                        <div className="admin-bulk-field-header">
                          <label>Title (Override for all)</label>
                          <span className="admin-bulk-field-toggle" onClick={() => toggleBulkFieldEnabled('title')}>
                            <input type="checkbox" checked={bulkEnabled.title} onChange={() => toggleBulkFieldEnabled('title')} />
                            <span>Update</span>
                          </span>
                        </div>
                        <input
                          type="text"
                          placeholder="Enter title override"
                          value={bulkFields.title}
                          onChange={(e) => updateBulkField('title', e.target.value)}
                        />
                      </div>

                      <div className={`admin-bulk-field ${bulkEnabled.subtitle ? 'is-enabled' : ''}`}>
                        <div className="admin-bulk-field-header">
                          <label>Subtitle / Tagline</label>
                          <span className="admin-bulk-field-toggle" onClick={() => toggleBulkFieldEnabled('subtitle')}>
                            <input type="checkbox" checked={bulkEnabled.subtitle} onChange={() => toggleBulkFieldEnabled('subtitle')} />
                            <span>Update</span>
                          </span>
                        </div>
                        <input
                          type="text"
                          placeholder="Catchy tagline or subtitle"
                          value={bulkFields.subtitle}
                          onChange={(e) => updateBulkField('subtitle', e.target.value)}
                        />
                      </div>

                      <div className={`admin-bulk-field ${bulkEnabled.editionNote ? 'is-enabled' : ''}`}>
                        <div className="admin-bulk-field-header">
                          <label>Edition Note</label>
                          <span className="admin-bulk-field-toggle" onClick={() => toggleBulkFieldEnabled('editionNote')}>
                            <input type="checkbox" checked={bulkEnabled.editionNote} onChange={() => toggleBulkFieldEnabled('editionNote')} />
                            <span>Update</span>
                          </span>
                        </div>
                        <input
                          type="text"
                          placeholder="e.g. 2025 Comprehensive Edition"
                          value={bulkFields.editionNote}
                          onChange={(e) => updateBulkField('editionNote', e.target.value)}
                        />
                      </div>

                      <div className={`admin-bulk-field ${bulkEnabled.language ? 'is-enabled' : ''}`}>
                        <div className="admin-bulk-field-header">
                          <label>Language</label>
                          <span className="admin-bulk-field-toggle" onClick={() => toggleBulkFieldEnabled('language')}>
                            <input type="checkbox" checked={bulkEnabled.language} onChange={() => toggleBulkFieldEnabled('language')} />
                            <span>Update</span>
                          </span>
                        </div>
                        <input
                          type="text"
                          placeholder="e.g. English / Hindi"
                          value={bulkFields.language}
                          onChange={(e) => updateBulkField('language', e.target.value)}
                        />
                      </div>

                      <div className={`admin-bulk-field ${bulkEnabled.duration ? 'is-enabled' : ''}`}>
                        <div className="admin-bulk-field-header">
                          <label>Duration / Pacing</label>
                          <span className="admin-bulk-field-toggle" onClick={() => toggleBulkFieldEnabled('duration')}>
                            <input type="checkbox" checked={bulkEnabled.duration} onChange={() => toggleBulkFieldEnabled('duration')} />
                            <span>Update</span>
                          </span>
                        </div>
                        <input
                          type="text"
                          placeholder="e.g. Self-Paced / 4 Weeks"
                          value={bulkFields.duration}
                          onChange={(e) => updateBulkField('duration', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 4: Media, Thumbnails & Gallery */}
                  <div className="admin-bulk-section-card">
                    <h3 className="admin-bulk-section-title">🖼️ Media, Thumbnails & Banners</h3>
                    <div className="admin-bulk-grid-fields">
                      <div className={`admin-bulk-field ${bulkEnabled.imageUrl ? 'is-enabled' : ''}`}>
                        <div className="admin-bulk-field-header">
                          <label>Primary Image URL</label>
                          <span className="admin-bulk-field-toggle" onClick={() => toggleBulkFieldEnabled('imageUrl')}>
                            <input type="checkbox" checked={bulkEnabled.imageUrl} onChange={() => toggleBulkFieldEnabled('imageUrl')} />
                            <span>Update</span>
                          </span>
                        </div>
                        <input
                          type="url"
                          placeholder="https://..."
                          value={bulkFields.imageUrl}
                          onChange={(e) => updateBulkField('imageUrl', e.target.value)}
                        />
                      </div>

                      <div className={`admin-bulk-field ${bulkEnabled.bannerImage ? 'is-enabled' : ''}`}>
                        <div className="admin-bulk-field-header">
                          <label>Banner Image URL</label>
                          <span className="admin-bulk-field-toggle" onClick={() => toggleBulkFieldEnabled('bannerImage')}>
                            <input type="checkbox" checked={bulkEnabled.bannerImage} onChange={() => toggleBulkFieldEnabled('bannerImage')} />
                            <span>Update</span>
                          </span>
                        </div>
                        <input
                          type="url"
                          placeholder="https://..."
                          value={bulkFields.bannerImage}
                          onChange={(e) => updateBulkField('bannerImage', e.target.value)}
                        />
                      </div>

                      <div className={`admin-bulk-field ${bulkEnabled.thumbnail ? 'is-enabled' : ''}`}>
                        <div className="admin-bulk-field-header">
                          <label>Thumbnail URL</label>
                          <span className="admin-bulk-field-toggle" onClick={() => toggleBulkFieldEnabled('thumbnail')}>
                            <input type="checkbox" checked={bulkEnabled.thumbnail} onChange={() => toggleBulkFieldEnabled('thumbnail')} />
                            <span>Update</span>
                          </span>
                        </div>
                        <input
                          type="url"
                          placeholder="https://..."
                          value={bulkFields.thumbnail}
                          onChange={(e) => updateBulkField('thumbnail', e.target.value)}
                        />
                      </div>

                      <div className={`admin-bulk-field ${bulkEnabled.boxImageUrl ? 'is-enabled' : ''}`}>
                        <div className="admin-bulk-field-header">
                          <label>Box Bundle Image URL</label>
                          <span className="admin-bulk-field-toggle" onClick={() => toggleBulkFieldEnabled('boxImageUrl')}>
                            <input type="checkbox" checked={bulkEnabled.boxImageUrl} onChange={() => toggleBulkFieldEnabled('boxImageUrl')} />
                            <span>Update</span>
                          </span>
                        </div>
                        <input
                          type="url"
                          placeholder="https://..."
                          value={bulkFields.boxImageUrl}
                          onChange={(e) => updateBulkField('boxImageUrl', e.target.value)}
                        />
                      </div>

                      <div className={`admin-bulk-field ${bulkEnabled.syncThumbnailFromGallery ? 'is-enabled' : ''}`} style={{ justifyContent: 'center' }}>
                        <div className="admin-bulk-field-header">
                          <label>Auto-Sync from Gallery</label>
                          <span className="admin-bulk-field-toggle" onClick={() => toggleBulkFieldEnabled('syncThumbnailFromGallery')}>
                            <input type="checkbox" checked={bulkEnabled.syncThumbnailFromGallery} onChange={() => toggleBulkFieldEnabled('syncThumbnailFromGallery')} />
                            <span>Update</span>
                          </span>
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', color: '#334155' }}>
                          <input
                            type="checkbox"
                            checked={bulkFields.syncThumbnailFromGallery}
                            onChange={(e) => updateBulkField('syncThumbnailFromGallery', e.target.checked)}
                          />
                          <span>Set Primary, Banner & Thumbnail from 1st Gallery Photo</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Section 5: Lists & Content */}
                  <div className="admin-bulk-section-card">
                    <h3 className="admin-bulk-section-title">📋 Curriculum, Highlights & Content Lists</h3>
                    <div className="admin-bulk-grid-fields">
                      <div className={`admin-bulk-field ${bulkEnabled.includes ? 'is-enabled' : ''}`}>
                        <div className="admin-bulk-field-header">
                          <label>Includes / Deliverables (1 per line)</label>
                          <span className="admin-bulk-field-toggle" onClick={() => toggleBulkFieldEnabled('includes')}>
                            <input type="checkbox" checked={bulkEnabled.includes} onChange={() => toggleBulkFieldEnabled('includes')} />
                            <span>Update</span>
                          </span>
                        </div>
                        <textarea
                          rows={3}
                          placeholder="Comprehensive Business Plan&#10;Financial Model (.xlsx)&#10;Marketing Roadmap"
                          value={bulkFields.includes}
                          onChange={(e) => updateBulkField('includes', e.target.value)}
                        />
                      </div>

                      <div className={`admin-bulk-field ${bulkEnabled.learningHighlights ? 'is-enabled' : ''}`}>
                        <div className="admin-bulk-field-header">
                          <label>Learning Highlights (1 per line)</label>
                          <span className="admin-bulk-field-toggle" onClick={() => toggleBulkFieldEnabled('learningHighlights')}>
                            <input type="checkbox" checked={bulkEnabled.learningHighlights} onChange={() => toggleBulkFieldEnabled('learningHighlights')} />
                            <span>Update</span>
                          </span>
                        </div>
                        <textarea
                          rows={3}
                          placeholder="Master financial projections&#10;Understand legal requirements"
                          value={bulkFields.learningHighlights}
                          onChange={(e) => updateBulkField('learningHighlights', e.target.value)}
                        />
                      </div>

                      <div className={`admin-bulk-field ${bulkEnabled.skills ? 'is-enabled' : ''}`}>
                        <div className="admin-bulk-field-header">
                          <label>Skills / Tags (comma or 1 per line)</label>
                          <span className="admin-bulk-field-toggle" onClick={() => toggleBulkFieldEnabled('skills')}>
                            <input type="checkbox" checked={bulkEnabled.skills} onChange={() => toggleBulkFieldEnabled('skills')} />
                            <span>Update</span>
                          </span>
                        </div>
                        <textarea
                          rows={3}
                          placeholder="Budgeting, Strategy, Marketing, Sales"
                          value={bulkFields.skills}
                          onChange={(e) => updateBulkField('skills', e.target.value)}
                        />
                      </div>

                      <div className={`admin-bulk-field ${bulkEnabled.requirements ? 'is-enabled' : ''}`}>
                        <div className="admin-bulk-field-header">
                          <label>Requirements (1 per line)</label>
                          <span className="admin-bulk-field-toggle" onClick={() => toggleBulkFieldEnabled('requirements')}>
                            <input type="checkbox" checked={bulkEnabled.requirements} onChange={() => toggleBulkFieldEnabled('requirements')} />
                            <span>Update</span>
                          </span>
                        </div>
                        <textarea
                          rows={3}
                          placeholder="Basic computer skills&#10;Desire to start a business"
                          value={bulkFields.requirements}
                          onChange={(e) => updateBulkField('requirements', e.target.value)}
                        />
                      </div>

                      <div className={`admin-bulk-field ${bulkEnabled.audience ? 'is-enabled' : ''}`}>
                        <div className="admin-bulk-field-header">
                          <label>Target Audience (1 per line)</label>
                          <span className="admin-bulk-field-toggle" onClick={() => toggleBulkFieldEnabled('audience')}>
                            <input type="checkbox" checked={bulkEnabled.audience} onChange={() => toggleBulkFieldEnabled('audience')} />
                            <span>Update</span>
                          </span>
                        </div>
                        <textarea
                          rows={3}
                          placeholder="Aspiring entrepreneurs&#10;Small business owners"
                          value={bulkFields.audience}
                          onChange={(e) => updateBulkField('audience', e.target.value)}
                        />
                      </div>

                      <div className={`admin-bulk-field ${bulkEnabled.description ? 'is-enabled' : ''}`}>
                        <div className="admin-bulk-field-header">
                          <label>Description (Paragraphs)</label>
                          <span className="admin-bulk-field-toggle" onClick={() => toggleBulkFieldEnabled('description')}>
                            <input type="checkbox" checked={bulkEnabled.description} onChange={() => toggleBulkFieldEnabled('description')} />
                            <span>Update</span>
                          </span>
                        </div>
                        <textarea
                          rows={3}
                          placeholder="Double newline between paragraphs"
                          value={bulkFields.description}
                          onChange={(e) => updateBulkField('description', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sticky Apply Action Bar */}
                  <div className="admin-bulk-sticky-action">
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '15px', color: '#0f172a' }}>
                        Ready to Apply Changes
                      </div>
                      <small style={{ color: '#64748b' }}>
                        Targeting <strong>{selectedBulkCourseIds.length}</strong> selected courses with <strong>{enabledFieldKeys.length}</strong> active field update(s).
                      </small>
                    </div>
                    <button
                      type="button"
                      className="admin-primary-btn"
                      onClick={handleApplyAllBulkFields}
                      disabled={bulkProcessing || selectedBulkCourseIds.length === 0 || enabledFieldKeys.length === 0}
                      style={{ padding: '12px 28px', fontSize: '15px', fontWeight: 800 }}
                    >
                      {bulkProcessing ? 'Applying Changes...' : `🚀 Apply All Changes (${enabledFieldKeys.length} fields on ${selectedBulkCourseIds.length} courses)`}
                    </button>
                  </div>
                </div>
              )}

              {bulkStudioTab === 'rule' && (
                <>
                  <div style={{ color: '#475569', fontSize: '14px', marginBottom: '8px' }}>
                    <p style={{ margin: 0 }}>
                      <strong>Rule-Based Quick Price Updater:</strong> Update all courses matching a package type across the whole catalog without having to check individual rows.
                    </p>
                  </div>
                  <form onSubmit={handleBulkUpdatePrice} style={{ display: 'grid', gap: '14px' }}>
                    <div className="admin-bulk-grid-fields">
                      <div className="admin-bulk-field">
                        <label>Target Package Type</label>
                        <select value={bulkPriceType} onChange={(e) => setBulkPriceType(e.target.value)}>
                          <option value="">ALL Package Types</option>
                          <option value="business-plans">Business Plans</option>
                          <option value="business-tools">Business Tools</option>
                          <option value="business-in-the-box">Business in the Box</option>
                        </select>
                      </div>
                      <div className="admin-bulk-field">
                        <label>New Price (₹)</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          placeholder="e.g. 49"
                          value={bulkPrice}
                          onChange={(e) => setBulkPrice(e.target.value)}
                        />
                      </div>
                      <div className="admin-bulk-field">
                        <label>New Old Price (Optional ₹)</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="e.g. 99"
                          value={bulkOldPrice}
                          onChange={(e) => setBulkOldPrice(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="admin-bulk-action-footer">
                      <span className="admin-bulk-selected-summary">
                        Will update: <strong>{bulkPriceType ? bulkPriceType.toUpperCase().replace(/-/g, ' ') : 'ALL'}</strong> courses in catalog
                      </span>
                      <button type="submit" className="admin-primary-btn" disabled={saving}>
                        {saving ? 'Updating...' : 'Execute Rule-Based Price Update'}
                      </button>
                    </div>
                  </form>
                </>
              )}

              {bulkStudioTab === 'delete' && (
                <>
                  <div style={{ color: '#b91c1c', fontSize: '14px', lineHeight: 1.6 }}>
                    <p style={{ margin: '0 0 6px 0', fontWeight: 700 }}>
                      ⚠️ Danger Zone: Bulk Course Deletion
                    </p>
                    <p style={{ margin: 0 }}>
                      This will soft-delete the <strong>{selectedBulkCourseIds.length}</strong> selected course(s). They will no longer appear in the store or admin listings.
                    </p>
                  </div>
                  <div className="admin-bulk-action-footer">
                    <span className="admin-bulk-selected-summary" style={{ color: '#ef4444' }}>
                      Selected for Deletion: <strong>{selectedBulkCourseIds.length}</strong> courses
                    </span>
                    <button
                      type="button"
                      className="admin-danger-btn"
                      onClick={handleBulkDeleteSelected}
                      disabled={bulkProcessing || selectedBulkCourseIds.length === 0}
                    >
                      {bulkProcessing ? 'Deleting...' : `Delete Selected (${selectedBulkCourseIds.length})`}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Filters and Search Toolbar */}
          <div className="admin-bulk-filter-toolbar">
            <div className="admin-bulk-search-group">
              <input
                type="search"
                className="admin-bulk-search-input"
                placeholder="Search by title, instructor, category..."
                value={bulkFilters.search}
                onChange={(e) => setBulkFilters((prev) => ({ ...prev, search: e.target.value }))}
              />
              <select
                className="admin-bulk-filter-select"
                value={bulkFilters.packageType}
                onChange={(e) => setBulkFilters((prev) => ({ ...prev, packageType: e.target.value }))}
              >
                <option value="">All Package Types</option>
                <option value="business-plans">Business Plans</option>
                <option value="business-tools">Business Tools</option>
                <option value="business-in-the-box">Business in the Box</option>
              </select>
              <select
                className="admin-bulk-filter-select"
                value={bulkFilters.category}
                onChange={(e) => setBulkFilters((prev) => ({ ...prev, category: e.target.value }))}
              >
                <option value="">All Categories</option>
                {allCategoryNames.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <select
                className="admin-bulk-filter-select"
                value={bulkFilters.isPublished}
                onChange={(e) => setBulkFilters((prev) => ({ ...prev, isPublished: e.target.value }))}
              >
                <option value="all">All Statuses</option>
                <option value="published">Published Only</option>
                <option value="draft">Drafts Only</option>
              </select>
            </div>

            <div className="admin-bulk-btn-group">
              <button
                type="button"
                className="admin-bulk-quick-btn"
                onClick={toggleSelectAllFiltered}
              >
                {isAllFilteredSelected ? 'Deselect Filtered' : `Select Filtered (${filteredBulkCourses.length})`}
              </button>
              {selectedBulkCourseIds.length > 0 && (
                <button
                  type="button"
                  className="admin-bulk-quick-btn"
                  onClick={() => setSelectedBulkCourseIds([])}
                >
                  Clear Selection
                </button>
              )}
              <button
                type="button"
                className="admin-secondary-btn"
                onClick={handleExportCsv}
                style={{ padding: '8px 14px', fontSize: '13px' }}
              >
                📥 Export CSV
              </button>
            </div>
          </div>

          {/* Courses Data Table */}
          <div className="admin-bulk-table-card">
            <div className="admin-bulk-table-header-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>
                  Showing {filteredBulkCourses.length} of {courses.length} courses
                </span>
                <span className="admin-tab-badge">
                  {selectedBulkCourseIds.length} Selected
                </span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Per page:
                  <select
                    value={bulkPageSize}
                    onChange={(e) => {
                      setBulkPageSize(Number(e.target.value));
                      setBulkPage(1);
                    }}
                    style={{ padding: '3px 8px', fontSize: '12px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#fff' }}
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={9999}>All</option>
                  </select>
                </label>
                {totalBulkPages > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      className="admin-bulk-quick-btn"
                      disabled={bulkPage <= 1}
                      onClick={() => setBulkPage((p) => Math.max(1, p - 1))}
                      style={{ padding: '3px 8px', fontSize: '12px' }}
                    >
                      ‹ Prev
                    </button>
                    <span style={{ fontSize: '12px', color: '#475569', fontWeight: 600 }}>
                      {bulkPage} / {totalBulkPages}
                    </span>
                    <button
                      type="button"
                      className="admin-bulk-quick-btn"
                      disabled={bulkPage >= totalBulkPages}
                      onClick={() => setBulkPage((p) => Math.min(totalBulkPages, p + 1))}
                      style={{ padding: '3px 8px', fontSize: '12px' }}
                    >
                      Next ›
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="admin-bulk-table-container">
              <table className="admin-bulk-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={isAllFilteredSelected}
                        onChange={toggleSelectAllFiltered}
                        aria-label="Select all filtered courses"
                      />
                    </th>
                    <th>Course Title</th>
                    <th>Package Type</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Instructor</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBulkCourses.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                        No courses found matching current filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedBulkCourses.map((course) => (
                      <BulkCourseRow
                        key={course.id}
                        course={course}
                        isSelected={selectedBulkCourseIdsSet.has(course.id)}
                        onToggle={toggleCourseSelection}
                        onEdit={handleEditCourseInSingleEditor}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalBulkPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>
                  Showing {(bulkPage - 1) * bulkPageSize + 1} to {Math.min(bulkPage * bulkPageSize, filteredBulkCourses.length)} of {filteredBulkCourses.length} courses
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    className="admin-bulk-quick-btn"
                    disabled={bulkPage <= 1}
                    onClick={() => setBulkPage((p) => Math.max(1, p - 1))}
                  >
                    ‹ Prev Page
                  </button>
                  <span style={{ fontSize: '12px', color: '#475569', fontWeight: 600, padding: '0 8px' }}>
                    Page {bulkPage} of {totalBulkPages}
                  </span>
                  <button
                    type="button"
                    className="admin-bulk-quick-btn"
                    disabled={bulkPage >= totalBulkPages}
                    onClick={() => setBulkPage((p) => Math.min(totalBulkPages, p + 1))}
                  >
                    Next Page ›
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
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
                      loading="lazy"
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
            {accessLogs.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px 12px' }}>
                <p className="admin-empty" style={{ margin: '0 0 10px 0' }}>PDF access logs not loaded yet.</p>
                <button className="admin-secondary-btn" type="button" onClick={refreshAccessLogs} style={{ padding: '6px 14px', fontSize: '13px' }}>
                  📥 Load PDF Access Logs
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
        </>
      )}
    </section>
  );
};

export default AdminCourseManagement;
