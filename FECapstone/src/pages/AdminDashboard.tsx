import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  FileUp, 
  Trash2, 
  Edit, 
  RefreshCw, 
  ChevronDown, 
  Upload, 
  FileText, 
  BarChart, 
  Users, 
  Search, 
  Filter, 
  Eye, 
  Download,
  PlusCircle,
  X,
  User,
  BookOpen,
  GraduationCap
} from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import axios from 'axios';
import { Badge } from '../components/ui/badge';
import { API_BASE_URL, FLASK_API_BASE_URL } from '../config'; // Import Flask URL
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { useToast } from "../lib/hooks/use-toast";


interface FlaskDocument {
  key: string; 
  namaDokumen: string;
  jenisDokumenDisplay: 'Dokumen Umum' | 'Dokumen Mahasiswa';
  flaskCategory: 'umum' | 'mahasiswa'; 
  fileUrl: string; 
  filenameForDelete: string; 
  fileExtension: string;
  createdAt: string;
}


interface StrapiHistoryItem {
  id: number;
  message: string;
  response: string;
  userType: 'public' | 'mahasiswa';
  sessionId: string;
  responseTime: number;
  timestamp: string;
  createdAt: string;
  users_permissions_user: {
    id: number;
    username: string;
    email: string;
  } | null;
}

interface History {
  id: number;
  message: string;
  response: string;
  userType: 'public' | 'mahasiswa';
  sessionId: string;
  responseTime: number;
  timestamp: string;
  createdAt: string;
  user?: {
    id: number;
    username: string;
    email: string;
  };
}

interface StrapiResponse<T> {
  data: T[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
  
}
interface FilesResponse {
  files_by_type: {
    [key: string]: {
      files: string[];
      count: number;
    };
  };
}
interface FileInfo {
  files: string[];
  count: number;
}

interface CollapsibleMessageProps {
  text: string;
  maxLength?: number;
  onClick?: (fullText: string) => void; // Add onClick prop
}

const CollapsibleMessage = ({ text, maxLength = 200, onClick }: CollapsibleMessageProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  if (!text) return null; // Handle null or undefined text
  const shouldTruncate = text.length > maxLength;

  const handleClick = () => {
    if (onClick) {
      onClick(text);
    } else if (shouldTruncate) {
      setIsExpanded(!isExpanded);
    }
  };

  if (!shouldTruncate && !onClick) {
    return <div className="whitespace-pre-wrap">{text}</div>;
  }

  return (
    <div className="space-y-2">
      <div
        className={`whitespace-pre-wrap ${shouldTruncate && !isExpanded ? 'line-clamp-3' : ''} ${onClick ? 'cursor-pointer hover:underline' : ''}`}
        onClick={handleClick}
      >
        {text}
      </div>
      {shouldTruncate && !onClick && (
        <button
          onClick={handleClick}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
        >
          {isExpanded ? (
            <>
              <span>Show less</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
            </>
          ) : (
            <>
              <span>Show more</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </>
          )}
        </button>
      )}
    </div>
  );
};

const AdminDashboard: React.FC = () => {
  const { toast } = useToast();
  const [flaskDocuments, setFlaskDocuments] = useState<FlaskDocument[]>([]);
  const [filteredFlaskDocuments, setFilteredFlaskDocuments] = useState<FlaskDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('documents');
  const [documentForm, setDocumentForm] = useState({
    namaDokumen: '',
    jenisDokumen: 'Dokumen_Umum', // This is used for the form select
  });
  const [files, setFiles] = useState<File[]>([]); // For file input
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // "all", "Dokumen_Umum", "Dokumen_Mahasiswa"
  const [previewDocument, setPreviewDocument] = useState<FlaskDocument | null>(null); // Changed to FlaskDocument
  const [histories, setHistories] = useState<History[]>([]);
  const [historyFilter, setHistoryFilter] = useState('all'); // 'all', 'public', 'mahasiswa'
  const [historySort, setHistorySort] = useState('newest'); // 'newest', 'oldest'
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '' });
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [users, setUsers] = useState<any[]>([]); // State for users
  const [loadingUsers, setLoadingUsers] = useState(true); // Loading state for users
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false); // State for history modal
  const [historyModalContent, setHistoryModalContent] = useState({ title: '', text: '' }); // State for modal content

  useEffect(() => {
    fetchFlaskDocuments(); // Changed from fetchDocuments
    fetchHistories();
    fetchUsers(); // Fetch users on mount
  }, [refreshKey]);

  useEffect(() => {
    if (flaskDocuments.length > 0) {
      let filtered = [...flaskDocuments];
      
      // Filter by search term
      if (searchTerm) {
        filtered = filtered.filter(doc => 
          doc.namaDokumen.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      // Filter by document type (using jenisDokumenDisplay)
      if (filterType !== 'all') {
        filtered = filtered.filter(doc => 
          doc.jenisDokumenDisplay === filterType
        );
      }
      
      setFilteredFlaskDocuments(filtered);
    } else {
      setFilteredFlaskDocuments([]);
    }
  }, [flaskDocuments, searchTerm, filterType]);

  const fetchFlaskDocuments = async () => {
    setLoading(true);
    try {
      const flaskCategories: ('umum' | 'mahasiswa')[] = ["umum", "mahasiswa"];
      let allFlaskDocs: FlaskDocument[] = [];
      
      for (const category of flaskCategories) {
        const response = await axios.get<FilesResponse>(`${FLASK_API_BASE_URL}/api/files?category=${category}`, {
          headers: { "X-Requested-With": "XMLHttpRequest" }
        });
        
        if (response.data && response.data.files_by_type) {
          for (const [ext, info] of Object.entries<FileInfo>(response.data.files_by_type)) {
            if (info.files && Array.isArray(info.files)) {
              for (const filename of info.files) { // filename is like "MyDoc_uuid.pdf"
                const uuidPart = filename.split('_').pop()?.split('.')[0];
                if (!uuidPart) {
                  console.warn(`Could not extract UUID from filename: ${filename}`);
                  continue;
                }

                try {
                  const tokenResponse = await axios.post(
                    `${FLASK_API_BASE_URL}/api/encrypt`,
                    { uuid: uuidPart }, // Send as JSON
                    {
                      headers: {
                        "Content-Type": "application/json",
                        "X-Requested-With": "XMLHttpRequest"
                      },
                    }
                  );

                  const token = tokenResponse.data.token;
                  const fileUrl = `${FLASK_API_BASE_URL}/get-file/${token}`;
                  const filenameWithoutExt = filename.substring(0, filename.lastIndexOf('.')) || filename;
                  
                  const doc: FlaskDocument = {
                    key: filename, // Use full filename as key
                    namaDokumen: filename,
                    jenisDokumenDisplay: category === "umum" ? "Dokumen Umum" : "Dokumen Mahasiswa",
                    flaskCategory: category,
                    fileUrl: fileUrl,
                    filenameForDelete: filenameWithoutExt, // e.g., "MyDoc_uuid"
                    fileExtension: ext.startsWith('.') ? ext.substring(1) : ext,
                    createdAt: new Date().toISOString(), // Flask doesn't provide this, fake it
                  };
                  allFlaskDocs.push(doc);
                } catch (err) {
                  console.error(`Gagal mengenkripsi UUID untuk file ${filename}:`, err);
                }
              }
            }
          }
        }
      }
      setFlaskDocuments(allFlaskDocs);
    } catch (error) {
      console.error('Error fetching Flask documents:', error);
      setFlaskDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistories = async () => {
    try {
      console.log('Attempting to fetch histories from Strapi...');
      const token = localStorage.getItem('token');
      console.log('Using token:', token);

      const response = await axios.get<StrapiResponse<StrapiHistoryItem>>(`${API_BASE_URL}/api/histories?populate=users_permissions_user`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log('Histories response:', response);
      console.log('Histories data:', response.data);
      console.log('Histories data structure:', JSON.stringify(response.data, null, 2));

      if (response.data && Array.isArray(response.data.data)) {
        const transformedHistories = response.data.data.map(item => {
          console.log('Processing history item:', item);
          const userType = item.userType === 'mahasiswa' ? 'mahasiswa' : 'public';
          return {
            id: item.id,
            message: item.message || '',
            response: item.response || '',
            userType,
            sessionId: item.sessionId || '',
            responseTime: item.responseTime || 0,
            timestamp: item.timestamp || item.createdAt,
            createdAt: item.createdAt,
            user: item.users_permissions_user ? {
              id: item.users_permissions_user.id,
              username: item.users_permissions_user.username,
              email: item.users_permissions_user.email
            } : undefined
          } as History;
        });

        console.log('Transformed histories:', transformedHistories);
        setHistories(transformedHistories);
      } else {
        console.error('Invalid data structure received from Strapi');
        setHistories([]);
      }
    } catch (error) {
      console.error('Error fetching histories:', error);
      setHistories([]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDocumentForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setDocumentForm(prev => ({ ...prev, jenisDokumen: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileList = Array.from(e.target.files);
      setFiles(fileList);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // shadcn/ui toast doesn't have a persistent loading toast by ID in the same way
    // We'll show a "processing" toast and then success/error.
    toast({
      title: "Proses Unggah",
      description: "Dokumen sedang diunggah...",
    });

    try {
      if (files.length === 0) {
        toast({
          title: "Input Tidak Lengkap",
          description: "Isi nama dokumen dan pilih file terlebih dahulu!",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const formData = new FormData();
      formData.append("file", files[0]);
      formData.append("jenisDokumen", documentForm.jenisDokumen);
      formData.append("namaDokumen", documentForm.namaDokumen);

      const isPDF = files[0].name.toLowerCase().endsWith('.pdf');
      const endpoint = `${FLASK_API_BASE_URL}${isPDF ? "/api/convert" : "/api/upload"}`;

      console.log(`Mengunggah ke ${endpoint}:`, files[0].name);

      const response = await axios({
        method: 'post',
        url: endpoint,
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

      if (response.status !== 200) {
        throw new Error(response.data.error || "Terjadi kesalahan");
      }

      toast({
        title: "Berhasil!",
        description: response.data.message || "Upload berhasil!",
        variant: "success",
      });
      setDocumentForm({ namaDokumen: "", jenisDokumen: "Dokumen_Umum" });
      setFiles([]);
      setRefreshKey(prev => prev + 1);
    } catch (error: any) {
      console.error("Gagal upload:", error);
      toast({
        title: "Gagal Upload",
        description: error.response?.data?.error || "Upload gagal. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDocument = async (filenameToDelete: string, flaskCat: 'umum' | 'mahasiswa') => {
    // For shadcn/ui, confirmation is typically handled by a Dialog component.
    // We'll use a simple window.confirm for now, then show a toast.
    // For a more integrated look, you'd replace window.confirm with a Dialog.
    if (window.confirm(`Yakin ingin menghapus dokumen: ${filenameToDelete}?`)) {
      toast({
        title: "Proses Hapus",
        description: `Menghapus dokumen ${filenameToDelete}...`,
      });
      try {
        const response = await axios.delete(
          `${FLASK_API_BASE_URL}/api/files/${filenameToDelete}?category=${flaskCat}`,
          {
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
          }
        );
        
        if (response.status === 200 && response.data.message === "Berhasil dihapus") {
          toast({
            title: "Berhasil!",
            description: "Dokumen berhasil dihapus.",
            variant: "success",
          });
          setRefreshKey(prev => prev + 1);
        } else {
          throw new Error(response.data.error || 'Operasi hapus gagal');
        }
      } catch (error: any) {
        console.error('Error deleting document:', error);
        toast({
          title: "Gagal Hapus",
          description: error.response?.data?.error || error.message || 'Penghapusan gagal. Silakan coba lagi.',
          variant: "destructive",
        });
      }
    }
  };

  // --- START: User Management Handlers ---
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      console.log('Attempting to fetch users from Strapi...');
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/users?populate=role`, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      console.log('Strapi users response:', response);

      if (response.data && Array.isArray(response.data)) {
        setUsers(response.data);
      } else {
        console.error('Unexpected data structure from Strapi Users API:', response.data);
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleNewUserInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewUser(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingUser(true);
    const token = localStorage.getItem('token');
    // IMPORTANT: Replace 'MAHASISWA_ROLE_ID' with the actual ID of the 'mahasiswa' role in your Strapi setup.
    // You can find this ID in the Strapi Admin Panel (Settings -> Roles -> Mahasiswa).
    const MAHASISWA_ROLE_ID = 3; // Replace with actual ID

    if (!token) {
      toast({
        title: "Error Autentikasi",
        description: "Admin token not found. Please log in again.",
        variant: "destructive",
      });
      setIsCreatingUser(false);
      return;
    }

    if (!MAHASISWA_ROLE_ID) {
      toast({
        title: "Error Konfigurasi",
        description: "Mahasiswa Role ID is not set. Please configure it in the code.",
        variant: "destructive",
      });
      setIsCreatingUser(false);
      return;
    }

    toast({
      title: "Proses",
      description: "Menambahkan user mahasiswa...",
    });
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/users`,
        {
          username: newUser.username,
          email: newUser.email,
          password: newUser.password,
          role: MAHASISWA_ROLE_ID, // Assign the 'mahasiswa' role
          confirmed: true, // Automatically confirm the user
          blocked: false,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('User created:', response.data);
      toast({
        title: "Berhasil!",
        description: "User Mahasiswa berhasil ditambahkan!",
        variant: "success",
      });
      setNewUser({ username: '', email: '', password: '' });
      setIsAddUserModalOpen(false);
      fetchUsers(); // Refresh user list
    } catch (error: any) {
      console.error('Error creating user:', error);
      const errorMessage = error.response?.data?.error?.message || 'Gagal menambahkan user. Periksa kembali data atau hubungi administrator.';
      toast({
        title: "Gagal Membuat User",
        description: `Error: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsCreatingUser(false);
    }
  };


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Simplified formatFileSize as Flask API doesn't provide size directly in /api/files
  const formatFileSize = (bytes: number | undefined) => {
    if (typeof bytes !== 'number') return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  // Updated to handle direct Flask URL
  const handleDownloadFile = (flaskFileUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = flaskFileUrl; // flaskFileUrl is already the absolute URL
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredHistories = histories.filter(history => {
    if (historyFilter === 'all') return true;
    return history.userType === historyFilter;
  }).sort((a, b) => {
    const dateA = new Date(a.timestamp || a.createdAt || 0).getTime();
    const dateB = new Date(b.timestamp || b.createdAt || 0).getTime();
    return historySort === 'newest' ? dateB - dateA : dateA - dateB;
  });

  if (loading && flaskDocuments.length === 0) { // Check flaskDocuments
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="h-16 w-16 relative">
            <div className="absolute inset-0 rounded-full border-t-4 border-blue-500 animate-spin"></div>
          </div>
          <p className="mt-4 text-slate-600 animate-pulse">Memuat Dashboard Admin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Toaster component from shadcn/ui is usually placed in App.tsx or a root layout component */}
      {/* For this example, I'm assuming it's already globally available. */}
      {/* If not, you would need to add <ToastProvider><ToastViewport /></ToastProvider> or <Toaster /> here or in App.tsx */}
      <Header />
      
      <div className="pt-16 flex-grow">
        
        {/* Main content */}
        <main className="flex-grow p-6">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
              <div>
                <div className="flex items-center">
                  <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Dashboard Admin</h1>
                  <Badge className="ml-3 bg-gradient-to-r from-blue-600 to-violet-600">Admin</Badge>
                </div>
                <p className="text-slate-500 mt-1">Kelola dokumen dan informasi mahasiswa</p>
              </div>
              <div className="mt-4 md:mt-0 flex space-x-2">
                <Button
                  onClick={() => setRefreshKey(prev => prev + 1)}
                  className="bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-sm"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Data
                </Button>
                <Button className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white shadow-md transition-all hover:shadow-lg">
                  <Upload className="h-4 w-4 mr-2" />
                  Tambah Baru
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <Card className="p-6 border-l-4 border-l-blue-500 hover:shadow-md transition-all">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Total Dokumen</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">{flaskDocuments.length}</h3>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </Card>
              
              <Card className="p-6 border-l-4 border-l-violet-500 hover:shadow-md transition-all">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Dokumen Umum</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">
                      {flaskDocuments.filter(d => d.jenisDokumenDisplay === 'Dokumen Umum').length}
                    </h3>
                  </div>
                  <div className="bg-violet-100 p-3 rounded-full">
                    <BookOpen className="h-6 w-6 text-violet-600" />
                  </div>
                </div>
              </Card>
              
              <Card className="p-6 border-l-4 border-l-green-500 hover:shadow-md transition-all">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Dokumen Mahasiswa</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">
                      {flaskDocuments.filter(d => d.jenisDokumenDisplay === 'Dokumen Mahasiswa').length}
                    </h3>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <GraduationCap className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </Card>
            </div>

            <Tabs defaultValue="documents" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-8 bg-white border border-slate-200 p-1 rounded-lg">
                <TabsTrigger value="documents" className="rounded-md py-2 px-3">
                  <FileText className="h-4 w-4 mr-2" />
                  Dokumen
                </TabsTrigger>
                <TabsTrigger value="upload" className="rounded-md py-2 px-3">
                  <Upload className="h-4 w-4 mr-2" />
                  Unggah
                </TabsTrigger>
                <TabsTrigger value="stats" className="rounded-md py-2 px-3">
                  <BarChart className="h-4 w-4 mr-2" />
                  Statistik
                </TabsTrigger>
                <TabsTrigger value="users" className="rounded-md py-2 px-3">
                  <Users className="h-4 w-4 mr-2" />
                  Pengguna
                </TabsTrigger>
                <TabsTrigger value="history" className="rounded-md py-2 px-3">
                  <FileText className="h-4 w-4 mr-2" />
                  Chat History
                </TabsTrigger>
              </TabsList>

              <TabsContent value="documents" className="space-y-6">
                <Card className="p-6 border border-slate-200">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-800">Daftar Dokumen</h2>
                    <div className="mt-3 sm:mt-0 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                      <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input 
                          placeholder="Cari dokumen..." 
                          className="pl-9"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                      <Select
                        value={filterType} // "all", "Dokumen_Umum", "Dokumen_Mahasiswa"
                        onValueChange={setFilterType}
                      >
                        <SelectTrigger className="w-full sm:w-48">
                          <div className="flex items-center">
                            <Filter className="h-4 w-4 mr-2 text-slate-400" />
                            <SelectValue placeholder="Filter" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Dokumen</SelectItem>
                          <SelectItem value="Dokumen Umum">Umum</SelectItem>
                          <SelectItem value="Dokumen Mahasiswa">Mahasiswa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {loading ? (
                    <div className="py-4 text-center">
                      <RefreshCw className="h-8 w-8 mx-auto text-slate-400 animate-spin" />
                      <p className="mt-2 text-slate-500">Memuat data dokumen...</p>
                    </div>
                  ) : filteredFlaskDocuments.length === 0 ? (
                    <div className="py-8 text-center">
                      <FileText className="h-12 w-12 mx-auto text-slate-400 mb-2" />
                      <p className="text-slate-600">Belum ada dokumen tersedia</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                      <Table>
                        <TableHeader className="bg-slate-50">
                          <TableRow>
                            <TableHead>Nama Dokumen</TableHead>
                            <TableHead>Jenis</TableHead>
                            <TableHead>Tanggal Dibuat (Mock)</TableHead>
                            <TableHead>File</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredFlaskDocuments.map(doc => (
                            <TableRow key={doc.key} className="hover:bg-slate-50/80">
                              <TableCell className="font-medium">{doc.namaDokumen}</TableCell>
                              <TableCell>
                                <Badge className={`${
                                  doc.jenisDokumenDisplay === 'Dokumen Umum' 
                                    ? 'bg-blue-100 text-blue-800 hover:bg-blue-100' 
                                    : 'bg-green-100 text-green-800 hover:bg-green-100'
                                }`}>
                                  {doc.jenisDokumenDisplay}
                                </Badge>
                              </TableCell>
                              <TableCell>{formatDate(doc.createdAt)}</TableCell>
                              <TableCell>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-xs font-normal"
                                  onClick={() => setPreviewDocument(doc)}
                                >
                                  <span className="text-sm">Lihat Info</span>
                                  <ChevronDown className="h-4 w-4 ml-1" />
                                </Button>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end space-x-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => setPreviewDocument(doc)}
                                  >
                                    <Eye className="h-4 w-4 text-blue-600" />
                                  </Button>
                                  {/* Edit for Flask documents might require more thought, disabled for now */}
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    disabled 
                                  >
                                    <Edit className="h-4 w-4 text-slate-400" />
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="h-8 w-8 p-0 border-red-200 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                                    onClick={() => handleDeleteDocument(doc.filenameForDelete, doc.flaskCategory)}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </Card>

                {/* Simplified Document Preview Modal for FlaskDocument */}
                {previewDocument && (
                  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg max-w-xl w-full max-h-[90vh] overflow-hidden">
                      <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                        <h3 className="text-xl font-bold">{previewDocument.namaDokumen}</h3>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => setPreviewDocument(null)}
                        >
                          <X className="h-5 w-5" />
                        </Button>
                      </div>
                      <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                        <div className="space-y-2 mb-4">
                           <div>
                            <span className="font-medium">Nama File:</span>{' '}
                            <span className="text-slate-700">{previewDocument.namaDokumen}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="font-medium">Jenis Dokumen:</span>{' '}
                            <Badge className={`ml-2 ${
                              previewDocument.jenisDokumenDisplay === 'Dokumen Umum' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {previewDocument.jenisDokumenDisplay}
                            </Badge>
                          </div>
                           <div>
                            <span className="font-medium">Ekstensi File:</span>{' '}
                            <span className="text-slate-700 uppercase">{previewDocument.fileExtension}</span>
                          </div>
                          <div>
                            <span className="font-medium">URL File:</span>{' '}
                            <a href={previewDocument.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                              {previewDocument.fileUrl}
                            </a>
                          </div>
                        </div>
                        
                        <div className="mt-6 flex justify-center">
                          <Button 
                            variant="outline" 
                            size="lg"
                            className="border-blue-500 text-blue-600 hover:bg-blue-50"
                            onClick={() => handleDownloadFile(previewDocument.fileUrl, previewDocument.namaDokumen)}
                          >
                            <Download className="h-5 w-5 mr-2" />
                            Download File
                          </Button>
                        </div>
                      </div>
                      <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setPreviewDocument(null)}>
                          Tutup
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="upload" className="space-y-6">
                <Card className="p-6 border border-slate-200">
                  <h2 className="text-xl font-bold text-slate-800 mb-6">Unggah Dokumen Baru</h2>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="namaDokumen" className="text-sm font-medium">Nama Dokumen</Label>
                        <Input
                          id="namaDokumen"
                          name="namaDokumen"
                          placeholder="Masukkan nama dokumen"
                          value={documentForm.namaDokumen}
                          onChange={handleInputChange}
                          className="border-slate-300 focus:border-blue-500"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="jenisDokumen" className="text-sm font-medium">Jenis Dokumen</Label>
                        <Select 
                          value={documentForm.jenisDokumen} 
                          onValueChange={handleSelectChange}
                        >
                          <SelectTrigger id="jenisDokumen" className="border-slate-300 focus:border-blue-500">
                            <SelectValue placeholder="Pilih jenis dokumen" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Dokumen_Umum">Dokumen Umum</SelectItem>
                            <SelectItem value="Dokumen_Mahasiswa">Dokumen Mahasiswa</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="fileDokumen" className="text-sm font-medium">File Dokumen</Label>
                      <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 hover:bg-slate-50 transition-all">
                        <div className="flex flex-col items-center text-center">
                          <FileUp className="h-12 w-12 text-slate-400 mb-3" />
                          <p className="text-base text-slate-600 mb-1">Seret file kesini atau klik untuk memilih</p>
                          <p className="text-sm text-slate-500 mb-6">Mendukung PDF, gambar, dan dokumen lainnya</p>
                          <Input
                            id="fileDokumen"
                            type="file"
                            className="hidden"
                            onChange={handleFileChange}
                            required
                          />
                          <Button
                            type="button"
                            variant="outline"
                            className="border-blue-300 hover:border-blue-400 hover:bg-blue-50"
                            onClick={() => document.getElementById('fileDokumen')?.click()}
                          >
                            <Upload className="h-4 w-4 mr-2 text-blue-600" />
                            Pilih File
                          </Button>
                        </div>
                        {files.length > 0 && (
                          <div className="mt-6 space-y-2 border-t border-slate-200 pt-4">
                            <p className="text-sm font-medium text-slate-700">File terpilih:</p>
                            <div className="grid grid-cols-1 gap-3">
                              <div className="flex items-center border rounded-lg p-3 bg-white">
                                <FileText className="h-5 w-5 mr-3 text-blue-500" />
                                <div className="overflow-hidden">
                                  <p className="truncate text-sm font-medium">{files[0].name}</p>
                                  <p className="text-xs text-slate-500">{formatFileSize(files[0].size)}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-200">
                      <Button
                        type="submit"
                        className="px-6 py-2 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white shadow-md hover:shadow-lg transition-all"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Mengunggah...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Unggah Dokumen
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Card>
              </TabsContent>

              <TabsContent value="stats">
                <Card className="p-6 border border-slate-200">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-800">Statistik</h2>
                    <div className="flex items-center space-x-2">
                      <Select defaultValue="month">
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Pilih periode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="week">Minggu Ini</SelectItem>
                          <SelectItem value="month">Bulan Ini</SelectItem>
                          <SelectItem value="year">Tahun Ini</SelectItem>
                          <SelectItem value="all">Semua Waktu</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="h-80 flex items-center justify-center border rounded-lg bg-slate-50">
                    <div className="text-center">
                      <BarChart className="h-12 w-12 mx-auto text-slate-300" />
                      <p className="mt-2 text-slate-600">Fitur statistik sedang dalam pengembangan</p>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="users">
                <Card className="p-6 border border-slate-200">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-800">Pengelolaan Pengguna Mahasiswa</h2>
                    <Dialog open={isAddUserModalOpen} onOpenChange={setIsAddUserModalOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700">
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Tambah Mahasiswa
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Tambah Pengguna Mahasiswa Baru</DialogTitle>
                          <DialogDescription>
                            Masukkan detail untuk pengguna mahasiswa baru. Pastikan role 'Mahasiswa IT' sudah ada di Strapi.
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateUser}>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="username" className="text-right">
                                Username
                              </Label>
                              <Input
                                id="username"
                                name="username"
                                value={newUser.username}
                                onChange={handleNewUserInputChange}
                                className="col-span-3"
                                required
                                minLength={3}
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="email" className="text-right">
                                Email
                              </Label>
                              <Input
                                id="email"
                                name="email"
                                type="email"
                                value={newUser.email}
                                onChange={handleNewUserInputChange}
                                className="col-span-3"
                                required
                                minLength={6}
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="password" className="text-right">
                                Password
                              </Label>
                              <Input
                                id="password"
                                name="password"
                                type="password"
                                value={newUser.password}
                                onChange={handleNewUserInputChange}
                                className="col-span-3"
                                required
                                minLength={6}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsAddUserModalOpen(false)}>
                              Batal
                            </Button>
                            <Button type="submit" disabled={isCreatingUser} className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700">
                              {isCreatingUser ? (
                                <>
                                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                  Menyimpan...
                                </>
                              ) : (
                                'Simpan Pengguna'
                              )}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  {loadingUsers ? (
                    <div className="py-4 text-center">
                      <RefreshCw className="h-8 w-8 mx-auto text-slate-400 animate-spin" />
                      <p className="mt-2 text-slate-500">Memuat data pengguna...</p>
                    </div>
                  ) : users.length === 0 ? (
                    <div className="py-8 text-center">
                      <Users className="h-12 w-12 mx-auto text-slate-400 mb-2" />
                      <p className="text-slate-600">Belum ada pengguna tersedia</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                      <Table>
                        <TableHeader className="bg-slate-50">
                          <TableRow>
                            <TableHead>Username</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {users.map(user => (
                            <TableRow key={user.id} className="hover:bg-slate-50/80">
                              <TableCell className="font-medium">{user.username}</TableCell>
                              <TableCell>{user.email}</TableCell>
                              <TableCell>
                                <Badge className={`${
                                  user.role?.type === 'mahasiswa_it'
                                    ? 'bg-green-100 text-green-800 hover:bg-green-100'
                                    : user.role?.type === 'admin_it'
                                      ? 'bg-blue-100 text-blue-800 hover:bg-blue-100'
                                      : 'bg-slate-100 text-slate-800 hover:bg-slate-100'
                                }`}>
                                  {user.role?.name || 'No Role'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge className={`${
                                  user.confirmed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {user.confirmed ? 'Confirmed' : 'Unconfirmed'}
                                </Badge>
                                <Badge className={`ml-2 ${
                                  user.blocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                }`}>
                                  {user.blocked ? 'Blocked' : 'Active'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end space-x-2">
                                  {/* Add user action buttons here (e.g., Edit, Delete) */}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    // onClick={() => handleEditUser(user.id)} // Implement edit handler
                                  >
                                    <Edit className="h-4 w-4 text-slate-600" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0 border-red-200 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                                    // onClick={() => handleDeleteUser(user.id)} // Implement delete handler
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="history">
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-900">Chat History</h2>
                    <div className="flex gap-4">
                      <select
                        value={userTypeFilter}
                        onChange={(e) => setUserTypeFilter(e.target.value)}
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">All Users</option>
                        <option value="public">Public</option>
                        <option value="mahasiswa">Mahasiswa</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">Message</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">Response</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">Time</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">Response Time</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredHistories.map((history) => (
                            <tr key={history.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                    <User className="h-6 w-6 text-blue-600" />
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">
                                      {history.user?.username || 'Anonymous'}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {history.user?.email || 'No email'}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  history.userType === 'mahasiswa' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {history.userType}
                                </span>
                              </td>
                              <td className="px-4 py-2 align-top">
                                <div className="max-w-md">
                                  <CollapsibleMessage
                                    text={history.message}
                                    onClick={(text) => {
                                      setHistoryModalContent({ title: 'User Message', text });
                                      setIsHistoryModalOpen(true);
                                    }}
                                  />
                                </div>
                              </td>
                              <td className="px-4 py-2 align-top">
                                <div className="max-w-md">
                                  <CollapsibleMessage
                                    text={history.response}
                                    onClick={(text) => {
                                      setHistoryModalContent({ title: 'Chatbot Response', text });
                                      setIsHistoryModalOpen(true);
                                    }}
                                  />
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 align-top">
                                {new Date(history.timestamp).toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 align-top">
                                {history.responseTime}ms
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      {/* History Detail Modal */}
      <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{historyModalContent.title}</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-grow p-4 border rounded-md bg-slate-50">
            <p className="whitespace-pre-wrap text-sm text-slate-700">{historyModalContent.text}</p>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsHistoryModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default AdminDashboard;
