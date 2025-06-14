import axios from 'axios';
import { API_BASE_URL } from '../config'; // Import the base URL from config

// Fungsi untuk mendapatkan url lengkap dari gambar Strapi
export const getStrapiMedia = (url: string | null | undefined): string => {
  if (!url) return '';
  // If the URL is absolute, return it directly
  if (url.startsWith('http') || url.startsWith('//')) {
    return url;
  }
  // Otherwise, prepend the API base URL
  return `${API_BASE_URL}${url}`;
};

// Instance axios dengan konfigurasi dasar
export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`, // Use the imported base URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// Tambahkan interceptor untuk menyertakan token JWT di header Authorization
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interface untuk data berita dari Strapi yang telah disesuaikan
export interface NewsItem {
  id: number;
  documentId: string;
  title: string;
  description: string;
  publishedAt: string;
  releasedOn: string;
  image: {
    id: number;
    documentId: string;
    name: string;
    url?: string;
  } | null;
}

// Interface untuk response Strapi
export interface StrapiResponse {
  data: NewsItem[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

// Fungsi untuk mendapatkan berita
export const getNews = async (): Promise<StrapiResponse> => {
  try {
    // Mengambil berita dari API
    const response = await api.get('/newses?populate=*');
    console.log('Raw Strapi response:', response.data);
    
    // Cek apakah data adalah array langsung
    if (Array.isArray(response.data)) {
      console.log('Menggunakan data array langsung');
      
      const formattedData = response.data.map((item: any) => ({
        id: item.id,
        documentId: item.documentId || item.id.toString(),
        title: item.title || 'Tanpa Judul',
        description: item.description || 'Tidak ada deskripsi',
        publishedAt: item.publishedAt || new Date().toISOString(),
        releasedOn: item.releasedOn || item.publishedAt || new Date().toISOString(),
        image: item.image ? {
          id: item.image.id || 0,
          documentId: item.image.documentId || item.image.id?.toString() || '0',
          name: item.image.name || '',
          url: item.image.url || ''
        } : null
      }));
      
      return {
        data: formattedData,
        meta: { pagination: { page: 1, pageSize: formattedData.length, pageCount: 1, total: formattedData.length } }
      };
    }
    
    // Cek jika ada struktur data Strapi standar
    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      console.log('Menggunakan struktur data Strapi standar');
      
      const formattedData = response.data.data.map((item: any) => {
        if (item.attributes) {
          const attrs = item.attributes;
          return {
            id: item.id,
            documentId: item.id.toString(),
            title: attrs.title || 'Tanpa Judul',
            description: attrs.description || 'Tidak ada deskripsi',
            publishedAt: attrs.publishedAt || new Date().toISOString(),
            releasedOn: attrs.releasedOn || attrs.publishedAt || new Date().toISOString(),
            image: attrs.image?.data ? {
              id: attrs.image.data.id,
              documentId: attrs.image.data.id.toString(),
              name: attrs.image.data.attributes?.name || '',
              url: attrs.image.data.attributes?.url || ''
            } : null
          };
        } else {
          return {
            id: item.id,
            documentId: item.id.toString(),
            title: item.title || 'Tanpa Judul',
            description: item.description || 'Tidak ada deskripsi',
            publishedAt: item.publishedAt || new Date().toISOString(),
            releasedOn: item.releasedOn || item.publishedAt || new Date().toISOString(),
            image: item.image ? {
              id: item.image.id || 0,
              documentId: item.image.id?.toString() || '0',
              name: item.image.name || '',
              url: item.image.url || ''
            } : null
          };
        }
      }).filter(Boolean);
      
      return {
        data: formattedData,
        meta: response.data.meta || { pagination: { page: 1, pageSize: formattedData.length, pageCount: 1, total: formattedData.length } }
      };
    }
    
    // Jika data ada di root level tapi bukan array
    if (response.data && typeof response.data === 'object') {
      console.log('Data berada pada level root tetapi bukan array, mencoba menggunakan data dari root');
      
      if (Array.isArray(response.data.items)) {
        const items = response.data.items;
        const formattedData = items.map((item: any) => ({
          id: item.id,
          documentId: item.id.toString(),
          title: item.title || 'Tanpa Judul',
          description: item.description || 'Tidak ada deskripsi',
          publishedAt: item.publishedAt || new Date().toISOString(),
          releasedOn: item.releasedOn || item.publishedAt || new Date().toISOString(),
          image: item.image ? {
            id: item.image.id || 0,
            documentId: item.image.id?.toString() || '0',
            name: item.image.name || '',
            url: item.image.url || ''
          } : null
        }));
        
        return {
          data: formattedData,
          meta: { pagination: { page: 1, pageSize: formattedData.length, pageCount: 1, total: formattedData.length } }
        };
      }
    }
    
    // Jika tidak ada struktur yang dikenali, return array kosong
    console.error('Struktur data tidak dikenal:', response.data);
    return { data: [], meta: { pagination: { page: 1, pageSize: 25, pageCount: 0, total: 0 } } };
  } catch (error) {
    console.error('Error fetching news:', error);
    return { data: [], meta: { pagination: { page: 1, pageSize: 25, pageCount: 0, total: 0 } } };
  }
};

// Fungsi untuk mendapatkan detail user yang sedang login
export const getAuthenticatedUser = async (): Promise<any | null> => {
  try {
    // The interceptor will automatically add the JWT from localStorage
    const response = await api.get('/users/me?populate=role');
    return response.data;
  } catch (error) {
    console.error('Error fetching authenticated user:', error);
    return null;
  }
};


// Fungsi untuk autentikasi pengguna
export const loginUser = async (
  nrp: string,
  password: string
): Promise<{ user: any; jwt: string } | null> => {
  try {
    const response = await api.post('/auth/local', {
      identifier: nrp,
      password: password,
    });
    return response.data;
  } catch (error) {
    console.error('Error during login:', error);
    return null;
  }
};
