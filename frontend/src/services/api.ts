import axios from 'axios';

// Create central Axios instance
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('upskill_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: detect session-expired (403 SESSION_EXPIRED) ──
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 403 &&
      error.response?.data?.code === 'SESSION_EXPIRED'
    ) {
      localStorage.removeItem('upskill_auth_user');
      localStorage.removeItem('upskill_auth_token');
      window.dispatchEvent(new CustomEvent('session-expired'));
    }
    return Promise.reject(error);
  }
);

export interface PageResponse {
  title: string;
  slug: string;
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    noIndex: boolean;
  };
  sections: Array<{
    type: string;
    order: number;
    config: any;
  }>;
}

export const cmsApi = {
  getPage: async (slug: string): Promise<PageResponse> => {
    const response = await apiClient.get<PageResponse>(`/pages/${slug}`);
    return response.data;
  },
  getCategories: async (): Promise<any[]> => {
    const response = await apiClient.get('/categories');
    return response.data;
  },
  getCourses: async (params?: Record<string, any>): Promise<any[]> => {
    const response = await apiClient.get('/courses', { params });
    return response.data;
  },
  getTestimonials: async (): Promise<any[]> => {
    const response = await apiClient.get('/testimonials');
    return response.data;
  },
};

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

export interface CourseSummary {
  id: string;
  slug: string;
  title: string;
  instructorName: string;
  categoryName: string;
  difficulty: string;
  price: number;
  oldPrice?: number;
  rating: number;
  imageUrl: string;
  isPublished: boolean;
  hasPdf: boolean;
}

export interface PdfViewerManifest {
  course: CourseSummary;
  pdf: {
    filename: string;
    fileSize?: number;
    streamUrl: string;
  };
  watermark: {
    name: string;
    email: string;
    userId: string;
    courseName: string;
    issuedAt: string;
  };
}

export interface AdminCourse extends CourseSummary {
  pdf: null | {
    id: string;
    filename: string;
    storageType: 'database' | 'external';
    fileSize?: number;
    updatedAt?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  iconUrl: string;
}

export interface CourseSavePayload {
  title: string;
  instructorName: string;
  categoryName: string;
  difficulty: string;
  price: number;
  oldPrice?: number | '';
  rating: number;
  imageUrl: string;
  isPublished: boolean;
  pdf?: {
    filename?: string;
    pdfBase64?: string;
    pdfUrl?: string;
  };
}

export interface PdfAccessLogItem {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  courseId: string;
  courseTitle: string;
  ipAddress: string;
  userAgent?: string;
  event: 'manifest' | 'stream' | 'page-view';
  pageNumber?: number;
  createdAt: string;
}

export interface PdfAccessLogFilters {
  courseId?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}

export const authApi = {
  register: async (payload: { name: string; email: string; password: string }): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/register', payload);
    return response.data;
  },
  login: async (payload: { email: string; password: string }): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', payload);
    return response.data;
  },
  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },
  heartbeat: async (): Promise<void> => {
    await apiClient.post('/auth/heartbeat');
  },
  me: async (): Promise<{ user: AuthUser }> => {
    const response = await apiClient.get<{ user: AuthUser }>('/auth/me');
    return response.data;
  },
};

export const coursePdfApi = {
  getManifest: async (courseId: string): Promise<PdfViewerManifest> => {
    const response = await apiClient.get<PdfViewerManifest>(`/courses/${courseId}/pdf/manifest`);
    return response.data;
  },
  logPageView: async (courseId: string, pageNumber: number): Promise<void> => {
    await apiClient.post(`/courses/${courseId}/pdf/access-log`, { pageNumber });
  },
};

export const adminApi = {
  getCourses: async (): Promise<AdminCourse[]> => {
    const response = await apiClient.get<AdminCourse[]>('/admin/courses');
    return response.data;
  },
  createCourse: async (payload: CourseSavePayload): Promise<{ course: AdminCourse }> => {
    const response = await apiClient.post<{ course: AdminCourse }>('/admin/courses', payload);
    return response.data;
  },
  updateCourse: async (courseId: string, payload: CourseSavePayload): Promise<{ course: AdminCourse }> => {
    const response = await apiClient.put<{ course: AdminCourse }>(`/admin/courses/${courseId}`, payload);
    return response.data;
  },
  deleteCourse: async (courseId: string): Promise<void> => {
    await apiClient.delete(`/admin/courses/${courseId}`);
  },
  getUsers: async (): Promise<AuthUser[]> => {
    const response = await apiClient.get<AuthUser[]>('/admin/users');
    return response.data;
  },
  getPdfAccessLogs: async (filters?: PdfAccessLogFilters): Promise<PdfAccessLogItem[]> => {
    const response = await apiClient.get<PdfAccessLogItem[]>('/admin/pdf-access-logs', { params: filters });
    return response.data;
  },
  getCategories: async (): Promise<AdminCategory[]> => {
    const response = await apiClient.get<AdminCategory[]>('/admin/categories');
    return response.data;
  },
  createCategory: async (payload: { name: string; iconUrl: string }): Promise<{ category: AdminCategory }> => {
    const response = await apiClient.post<{ category: AdminCategory }>('/admin/categories', payload);
    return response.data;
  },
  enrollUser: async (courseId: string, userId: string): Promise<void> => {
    await apiClient.post(`/admin/courses/${courseId}/enrollments`, { userId });
  },
};

export const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('upskill_auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default apiClient;
