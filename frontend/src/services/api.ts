import axios from 'axios';

// Create central Axios instance
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
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

export default apiClient;
