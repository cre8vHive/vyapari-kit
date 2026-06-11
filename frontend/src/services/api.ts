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

export const authApi = {
  register: async (payload: { name: string; email: string; password: string }): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/register', payload);
    return response.data;
  },
  login: async (payload: { email: string; password: string }): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', payload);
    return response.data;
  },
  me: async (): Promise<{ user: AuthUser }> => {
    const response = await apiClient.get<{ user: AuthUser }>('/auth/me');
    return response.data;
  },
};

export default apiClient;
