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
  GraduationCap,
  HelpCircle,
  BookOpen,
  User
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
// import chatbotQuestionsData from '../../src/data/pertanyaan-chatbots.json'; // Will be removed


interface StrapiChatbotQuestion { // Ensuring flat structure based on API response
  id: number;
  teksPertanyaan: string;
  urutan?: number;
  documentId?: string; // As per your sample response
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

interface UploadedLink {
  id: string;         // for React key
  nama: string;       // document name
  link: string;       // URL
  kategori: 'umum' | 'mahasiswa';
  jenis: string;      // e.g. "Dokumen_Administrasi"
  deskripsi: string;  // maybe empty string if none
  filename: string;
  diunggah: string;   // the exact filename (with extension) for DELETE
}



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
  // Removed unused state variables
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '', role: 3 }); // Added role, default to Mahasiswa IT (ID 3)
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [users, setUsers] = useState<any[]>([]); // State for users
  const [loadingUsers, setLoadingUsers] = useState(true); // Loading state for users
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false); // State for history modal
  const [historyModalContent, setHistoryModalContent] = useState({ title: '', text: '' }); // State for modal content
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null); // To store user being edited
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const [chatbotQuestions, setChatbotQuestions] = useState<StrapiChatbotQuestion[]>([]);
  const [isAddQuestionModalOpen, setIsAddQuestionModalOpen] = useState(false);
  const [isEditQuestionModalOpen, setIsEditQuestionModalOpen] = useState(false);
  const [newQuestionText, setNewQuestionText] = useState(''); // Renamed from newQuestion
  const [editingQuestion, setEditingQuestion] = useState<StrapiChatbotQuestion | null>(null); // Will store the whole question object
  const [currentQuestionText, setCurrentQuestionText] = useState(''); // For the edit input field
  const [loadingChatbotQuestions, setLoadingChatbotQuestions] = useState(true);

  // 1) Add this state just below your other useState hooks:
  interface EditUserForm {
    id: number;
    username: string;
    email: string;
    role: number;
    currentPassword?: string;
    password?: string;
  }
  const [editUserForm, setEditUserForm] = useState<EditUserForm>({
    id: 0,
    username: '',
    email: '',
    role: 0,
    currentPassword: '',
    password: '',
  });

  // 2) Immediately below that, add the generic input‐change handler:
  const handleUpdateUserInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setEditUserForm(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Removed unused function


  // State for Link Upload
  const [linkForm, setLinkForm] = useState({
    nama: '',
    kategori: 'umum', // 'umum' or 'mahasiswa'
    jenis: 'Dokumen_Administrasi', // 'Dokumen_Administrasi' or 'Dokumen_Akademik'
    deskripsi: '',
    link: '',
  });
  const [uploadedLinks, setUploadedLinks] = useState<UploadedLink[]>([]);
  // Define a proper interface later
  const [isSubmittingLink, setIsSubmittingLink] = useState(false);
  // Removed unused state variable
  const [waIframeKey, setWaIframeKey] = useState(0); // State to force reload WhatsApp Bot iframe

  const fetchChatbotQuestions = async () => {
    setLoadingChatbotQuestions(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get<{ data: StrapiChatbotQuestion[] }>(`${API_BASE_URL}/api/pertanyaan-chatbots`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChatbotQuestions(response.data.data || []);
    } catch (error) {
      console.error('Error fetching chatbot questions:', error);
      toast({
        title: "Gagal Memuat Pertanyaan Chatbot",
        description: "Terjadi kesalahan saat mengambil data pertanyaan dari server.",
        variant: "destructive",
      });
      setChatbotQuestions([]); // Set to empty array on error
    } finally {
      setLoadingChatbotQuestions(false);
    }
  };


  const handleAddQuestion = async () => {
    if (!newQuestionText.trim()) {
      toast({ title: "Error", description: "Pertanyaan tidak boleh kosong.", variant: "destructive" });
      return;
    }
    const token = localStorage.getItem('token');
    try {
      await axios.post(`${API_BASE_URL}/api/pertanyaan-chatbots`,
        { data: { teksPertanyaan: newQuestionText.trim() } },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewQuestionText('');
      setIsAddQuestionModalOpen(false);
      fetchChatbotQuestions(); // Refresh list
      toast({ title: "Sukses", description: "Pertanyaan berhasil ditambahkan." });
    } catch (error) {
      toast({ title: "Error", description: "Gagal menyimpan pertanyaan.", variant: "destructive" });
      console.error("Failed to save new question:", error);
    }
  };

  const handleEditQuestion = async () => {
    if (!editingQuestion || !currentQuestionText.trim()) {
      toast({ title: "Error", description: "Pertanyaan tidak boleh kosong.", variant: "destructive" });
      return;
    }
    const token = localStorage.getItem('token');
    // Assume 'en' is the locale being edited. Adjust if your logic supports multiple locales.
    // This should ideally match the locale of the 'editingQuestion' if it has one,
    // or your application's current/default editing locale.
    const localeToEdit = "en"; // <<< IMPORTANT: Confirm and set your actual target locale

    if (!editingQuestion.documentId) {
      toast({ title: "Error", description: "Informasi pertanyaan tidak lengkap untuk pembaruan (documentId hilang).", variant: "destructive" });
      console.error("Cannot edit question, documentId is missing:", editingQuestion);
      return;
    }

    try {
      await axios.put(`${API_BASE_URL}/api/pertanyaan-chatbots/${editingQuestion.documentId}?locale=${localeToEdit}`,
        { data: { teksPertanyaan: currentQuestionText.trim() } },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsEditQuestionModalOpen(false);
      setEditingQuestion(null);
      setCurrentQuestionText('');
      fetchChatbotQuestions(); // Refresh list
      toast({ title: "Sukses", description: "Pertanyaan berhasil diperbarui." });
    } catch (error) {
      toast({ title: "Error", description: "Gagal memperbarui pertanyaan.", variant: "destructive" });
      console.error("Failed to save edited question:", error);
    }
  };

  const handleDeleteQuestion = async (questionToDelete: StrapiChatbotQuestion) => { // Now accepts the full question object
    if (!questionToDelete || !questionToDelete.documentId) {
      toast({ title: "Error", description: "Informasi pertanyaan tidak lengkap untuk penghapusan (documentId hilang).", variant: "destructive" });
      console.error("Cannot delete question, documentId is missing:", questionToDelete);
      return;
    }


    const localeToDelete = "en";

    if (window.confirm(`Yakin ingin menghapus pertanyaan: "${questionToDelete.teksPertanyaan}" (Dokumen ID: ${questionToDelete.documentId}, Locale: ${localeToDelete})?`)) {
      const token = localStorage.getItem('token');
      try {
        // Using documentId in the path and locale as a query parameter
        await axios.delete(`${API_BASE_URL}/api/pertanyaan-chatbots/${questionToDelete.documentId}?locale=${localeToDelete}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchChatbotQuestions(); // Refresh list
        toast({ title: "Sukses", description: "Pertanyaan berhasil dihapus." });
      } catch (error) {
        toast({ title: "Error", description: "Gagal menghapus pertanyaan.", variant: "destructive" });
        console.error("Failed to delete question:", error);
      }
    }
  };

  useEffect(() => {
    fetchFlaskDocuments();
    fetchHistories();
    fetchUsers();
    fetchChatbotQuestions(); // Fetch questions from Strapi
    fetchLinkList(); // Fetch uploaded links
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
      const flaskCategories: ('umum' | 'mahasiswa')[] = ['umum', 'mahasiswa'];
      let allFlaskDocs: FlaskDocument[] = [];

      for (const category of flaskCategories) {
        const res = await axios.get<FilesResponse>(
          `${FLASK_API_BASE_URL}/api/files?category=${category}`,
          { headers: { 'X-Requested-With': 'XMLHttpRequest' } }
        );

        if (res.data?.files_by_type) {
          for (const [ext, info] of Object.entries(res.data.files_by_type)) {
            if (Array.isArray(info.files)) {
              for (const fileObj of info.files) {
                // fileObj is { filename, link, original_name }
                const filename = fileObj.filename as string;
                const original_name = fileObj.original_name as string;
                const uuid = filename.split('_').pop()?.split('.')[0];
                const uploaded_timestamp = fileObj.uploaded as string; // Capture timestamp
                if (!uuid) {
                  console.warn(`Cannot extract UUID from ${filename}`);
                  continue;
                }

                try {
                  // encrypt to get secure token
                  const tokenRes = await axios.post(
                    `${FLASK_API_BASE_URL}/api/encrypt`,
                    { uuid },
                    {
                      headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                      }
                    }
                  );

                  const fileUrl = `${FLASK_API_BASE_URL}/get-file/${tokenRes.data.token}`;
                  const nameToShow = original_name || filename;
                  const filenameNoExt = filename.replace(/\.[^/.]+$/, '');

                  allFlaskDocs.push({
                    key: filename,
                    namaDokumen: nameToShow,
                    jenisDokumenDisplay:
                      category === 'umum' ? 'Dokumen Umum' : 'Dokumen Mahasiswa',
                    flaskCategory: category,
                    fileUrl,
                    filenameForDelete: filenameNoExt,
                    fileExtension: ext.replace(/^\./, ''),
                    createdAt: uploaded_timestamp || new Date().toISOString()
                  });
                } catch (e) {
                  console.error(`Failed to encrypt UUID ${uuid}:`, e);
                }
              }
            }
          }
        }
      }

      setFlaskDocuments(allFlaskDocs);
    } catch (e) {
      console.error('Error fetching Flask documents:', e);
      setFlaskDocuments([]);
    } finally {
      setLoading(false);
    }
  };


  const fetchHistories = async () => {
    try {

      const token = localStorage.getItem('token');


      const response = await axios.get<StrapiResponse<StrapiHistoryItem>>(`${API_BASE_URL}/api/histories?populate=users_permissions_user`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });



      if (response.data && Array.isArray(response.data.data)) {
        const transformedHistories = response.data.data.map(item => {
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
    const { namaDokumen, jenisDokumen } = documentForm;

    if (files.length === 0 || !namaDokumen || !jenisDokumen) {
      toast({
        title: "Input Tidak Lengkap",
        description: "Nama Dokumen, Jenis Dokumen, dan File wajib diisi!",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    toast({
      title: "Proses Unggah Dokumen",
      description: "Dokumen sedang diunggah...",
    });

    const formData = new FormData();
    formData.append("file", files[0]);
    formData.append("jenisDokumen", jenisDokumen);
    formData.append("namaDokumen", namaDokumen);

    const isPDF = files[0].name.toLowerCase().endsWith('.pdf');
    const endpoint = `${FLASK_API_BASE_URL}${isPDF ? "/api/convert" : "/api/upload"}`;

    console.log(`Mengunggah ke ${endpoint}:`, files[0].name);

    try {
      const response = await axios({
        method: 'post',
        url: endpoint,
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

      if (response.status === 202) {
        // Document is being processed
        const docId = response.data.doc_id;
        toast({
          title: "Memproses Dokumen",
          description: "Dokumen sedang diproses...",
        });

        // Start polling for document processing status
        const checkProcessingStatus = async () => {
          try {
            const statusResponse = await axios.get(`${FLASK_API_BASE_URL}/api/process-status/${docId}`, {
              headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });

            if (statusResponse.data.status === 'completed') {
              toast({
                title: "Berhasil!",
                description: "Dokumen berhasil diunggah dan diproses!",
                variant: "success",
              });
              setDocumentForm({ namaDokumen: "", jenisDokumen: "Dokumen_Umum" });
              setFiles([]);
              setRefreshKey(prev => prev + 1);
              return true;
            } else if (statusResponse.data.status === 'failed') {
              throw new Error(statusResponse.data.error || "Pemrosesan dokumen gagal");
            }
            // Continue polling if still processing
            return false;
          } catch (error) {
            console.error("Error checking processing status:", error);
            throw error;
          }
        };

        // Poll every 2 seconds until processing is complete or fails
        const pollInterval = setInterval(async () => {
          try {
            const isComplete = await checkProcessingStatus();
            if (isComplete) {
              clearInterval(pollInterval);
            }
          } catch (error) {
            clearInterval(pollInterval);
            throw error;
          }
        }, 2000);

      } else if (response.status === 200 || response.status === 201) {
        // Document was processed immediately
        toast({
          title: "Berhasil!",
          description: response.data.message || "Dokumen berhasil diunggah!",
          variant: "success",
        });
        setDocumentForm({ namaDokumen: "", jenisDokumen: "Dokumen_Umum" });
        setFiles([]);
        setRefreshKey(prev => prev + 1);
      } else {
        throw new Error(response.data.error || `Status ${response.status}`);
      }
    } catch (error: any) {
      console.error("Gagal upload dokumen:", error);
      toast({
        title: "Gagal Upload Dokumen",
        description: error.response?.data?.message || error.message || "Upload dokumen gagal. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLinkInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLinkForm(prev => ({ ...prev, [name]: value }));
  };

  const handleLinkKategoriChange = (value: string) => {
    setLinkForm(prev => ({ ...prev, kategori: value }));
  };

  const handleLinkJenisChange = (value: string) => {
    setLinkForm(prev => ({ ...prev, jenis: value }));
  };

  const handleUploadLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { nama, kategori, jenis, deskripsi, link } = linkForm;

    if (!nama || !jenis || !link || !kategori) {
      toast({
        title: "Input Tidak Lengkap",
        description: "Nama, Kategori, Jenis, dan Link Dokumen wajib diisi!",
        variant: "destructive",
      });
      return;
    }
    setIsSubmittingLink(true);
    toast({ title: "Proses Unggah Link", description: "Link sedang diunggah..." });

    const formData = new FormData();
    formData.append("nama", nama);
    formData.append("jenis", jenis);
    formData.append("deskripsi", deskripsi);
    formData.append("link", link);
    formData.append("category", kategori); // 'category' as per your example JS

    try {
      const response = await axios.post(`${FLASK_API_BASE_URL}/api/link`, formData, {
        headers: {
          "X-Requested-With": "XMLHttpRequest",
          // 'Content-Type': 'multipart/form-data' // Axios sets this automatically for FormData
        }
      });

      if (response.status !== 200 && response.status !== 201) {
        throw new Error(response.data.error || `Status ${response.status}`);
      }

      toast({
        title: "Berhasil!",
        description: response.data.message || "Link berhasil diunggah!",
        variant: "success",
      });
      setLinkForm({ nama: '', kategori: 'umum', jenis: 'Dokumen_Administrasi', deskripsi: '', link: '' });
      fetchLinkList(); // Refresh list
    } catch (error: any) {
      console.error("Gagal upload link:", error);
      toast({
        title: "Gagal Upload Link",
        description: error.response?.data?.message || error.message || "Upload link gagal. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingLink(false);
    }
  };

  const fetchLinkList = async () => {
    setLoading(true);
    try {
      const categories: ('umum' | 'mahasiswa')[] = ['umum', 'mahasiswa'];
      const allLinks: UploadedLink[] = [];

      for (const cat of categories) {
        const res = await axios.get<{
          links: Array<{
            nama: string;
            link: string;
            filename: string;
            jenis?: string;
            deskripsi?: string;
          }>;
        }>(
          `${FLASK_API_BASE_URL}/api/link?category=${cat}`,
          { headers: { 'X-Requested-With': 'XMLHttpRequest' } }
        );

        (res.data.links || []).forEach(item => {
          allLinks.push({
            id: item.filename,
            nama: item.nama,
            link: item.link,
            kategori: cat,
            jenis: item.jenis || '',
            deskripsi: item.deskripsi || '',
            filename: item.filename,
            diunggah: item.diunggah || ''
          });
        });
      }

      setUploadedLinks(allLinks);
    } catch (err) {
      console.error('Error fetching link list:', err);
      setUploadedLinks([]);
    } finally {
      setLoading(false);
    }
  };



  const handleDeleteLink = async (filename: string, group: string) => {
    if (window.confirm(`Yakin ingin menghapus link dokumen: ${filename} dari kategori ${group}?`)) {
      toast({ title: "Proses Hapus Link", description: `Menghapus link ${filename}...` });
      try {
        const response = await axios.delete(`${FLASK_API_BASE_URL}/api/link/${filename}?category=${group}`, {
          headers: { "X-Requested-With": "XMLHttpRequest" }
        });

        if (response.status !== 200) {
          throw new Error(response.data.error || `Status ${response.status}`);
        }
        toast({
          title: "Berhasil!",
          description: "Link berhasil dihapus.",
          variant: "success",
        });
        fetchLinkList(); // Refresh list
      } catch (error: any) {
        console.error('Error deleting link:', error);
        toast({
          title: "Gagal Hapus Link",
          description: error.response?.data?.message || error.message || 'Penghapusan link gagal.',
          variant: "destructive",
        });
      }
    }
  };


  const handleDeleteDocument = async (filenameToDelete: string, flaskCat: 'umum' | 'mahasiswa') => {
    if (window.confirm(`Yakin ingin menghapus dokumen: ${filenameToDelete} dari kategori ${flaskCat}?`)) {
      toast({
        title: "Proses Hapus Dokumen",
        description: `Menghapus dokumen ${filenameToDelete}...`,
      });
      try {
        const response = await axios.delete(
          `${FLASK_API_BASE_URL}/api/files/${filenameToDelete}?category=${flaskCat}`,
          {
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
          }
        );

        if (response.status !== 200) {
          throw new Error(response.data.error || `Status ${response.status}`);
        }

        toast({
          title: "Berhasil!",
          description: "Dokumen berhasil dihapus.",
          variant: "success",
        });
        setRefreshKey(prev => prev + 1);
      } catch (error: any) {
        console.error('Error deleting document:', error);
        toast({
          title: "Gagal Hapus Dokumen",
          description: error.response?.data?.message || error.message || 'Penghapusan dokumen gagal.',
          variant: "destructive",
        });
      }
    }
  };

  // --- START: User Management Handlers ---
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/users?populate=role`, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

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

  const handleNewUserRoleChange = (value: string) => {
    setNewUser(prev => ({ ...prev, role: parseInt(value, 10) }));
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingUser(true);
    const token = localStorage.getItem('token');
    // Role ID is now taken from newUser.role state

    if (!token) {
      toast({
        title: "Error Autentikasi",
        description: "Admin token not found. Please log in again.",
        variant: "destructive",
      });
      setIsCreatingUser(false);
      return;
    }
    if (!newUser.username || !newUser.email || !newUser.password) {
      toast({
        title: "Input Tidak Lengkap",
        description: "Isi semua kolom untuk menambahkan user.",
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
          role: newUser.role, // Use the role from state
          confirmed: true, // Automatically confirm the user
          blocked: false,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast({
        title: "Berhasil!",
        description: "User Mahasiswa berhasil ditambahkan!",
        variant: "success",
      });
      setNewUser({ username: '', email: '', password: '', role: 3 }); // Reset with default role
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

  const handleDeleteUser = async (userId: number) => {
    if (window.confirm(`Are you sure you want to delete user with ID: ${userId}? This action cannot be undone.`)) {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Admin token not found. Please log in again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Processing",
        description: `Deleting user ${userId}...`,
      });

      try {
        await axios.delete(`${API_BASE_URL}/api/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        toast({
          title: "Success!",
          description: `User ${userId} has been deleted.`,
          variant: "success",
        });
        fetchUsers(); // Refresh the user list
      } catch (error: any) {
        console.error('Error deleting user:', error);
        const errorMessage = error.response?.data?.error?.message || 'Failed to delete user. Please try again.';
        toast({
          title: "Deletion Failed",
          description: `Error: ${errorMessage}`,
          variant: "destructive",
        });
      }
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setIsUpdatingUser(true);
    const token = localStorage.getItem('token');
    if (!token) {
      toast({ title: "Auth Error", description: "Please log in again.", variant: "destructive" });
      setIsUpdatingUser(false);
      return;
    }

    // 1) Update username, email, role:
    try {
      await axios.put(
        `${API_BASE_URL}/api/users/${editingUser.id}`,
        {
          data: {
            username: editingUser.username,
            email: editingUser.email,
            role: editingUser.role,       // must be just the role ID
          }
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      // 2) (Optional) Change password via change-password endpoint
      if (editingUser.password?.trim()) {
        await axios.put(
          `${API_BASE_URL}/api/auth/change-password`,
          {
            data: {
              currentPassword: editingUser.currentPassword,  // if you collect old PW
              password: editingUser.password,
              passwordConfirmation: editingUser.password,
            }
          },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
      }

      toast({ title: "Success", description: "User updated.", variant: "success" });
      setIsEditUserModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      console.error("Error updating user:", err.response?.data || err);
      toast({
        title: "Update Failed",
        description: err.response?.data?.error?.message || err.message,
        variant: "destructive"
      });
    } finally {
      setIsUpdatingUser(false);
    }
  };


  const formatFileSize = (bytes: number | undefined) => {
    if (typeof bytes !== 'number') return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const handleDownloadFile = (flaskFileUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = flaskFileUrl; // flaskFileUrl is already the absolute URL
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredHistories = histories.sort((a, b) => {
    const dateA = new Date(a.timestamp || a.createdAt || 0).getTime();
    const dateB = new Date(b.timestamp || b.createdAt || 0).getTime();
    return dateB - dateA; // Sort by newest first
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

            <Tabs defaultValue="documents" value={activeTab} onValueChange={setActiveTab} className="bg-transparent">
              <TabsList className="mb-8 text-black border border-slate-200 p-1 rounded-lg">
                <TabsTrigger
                  value="documents"
                  className="rounded-md py-2 px-3"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Dokumen
                </TabsTrigger>
                <TabsTrigger
                  value="upload"
                  className="rounded-md py-2 px-3"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Unggah
                </TabsTrigger>
                <TabsTrigger value="stats" className="rounded-md py-2 px-3">
                  <BarChart className="h-4 w-4 mr-2" />
                  Pertanyaan Chatbot
                </TabsTrigger>
                <TabsTrigger value="users" className="rounded-md py-2 px-3">
                  <Users className="h-4 w-4 mr-2" />
                  Pengguna
                </TabsTrigger>
                <TabsTrigger value="history" className="rounded-md py-2 px-3">
                  <FileText className="h-4 w-4 mr-2" />
                  Chat History
                </TabsTrigger>
                <TabsTrigger value="wa-bot" className="rounded-md py-2 px-3">
                  <span role="img" aria-label="whatsapp">💬</span>
                  WhatsApp Bot
                </TabsTrigger>
              </TabsList>

              <TabsContent value="documents" className="space-y-6">
                <Tabs defaultValue="fileDokumen" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="fileDokumen">File Dokumen</TabsTrigger>
                    <TabsTrigger value="linkDokumen">Link Dokumen</TabsTrigger>
                  </TabsList>
                  <TabsContent value="fileDokumen">
                    <Card className="p-6 border border-slate-200">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                        <h2 className="text-xl font-bold text-slate-800">Daftar File Dokumen</h2>
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
                                <TableHead>Diunggah</TableHead>
                                <TableHead>File</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredFlaskDocuments.map(doc => (
                                <TableRow key={doc.key} className="hover:bg-slate-50/80">
                                  <TableCell className="font-medium">{doc.namaDokumen}</TableCell>
                                  <TableCell>
                                    <Badge className={`${doc.jenisDokumenDisplay === 'Dokumen Umum'
                                      ? 'bg-blue-100 text-blue-800 hover:bg-blue-100'
                                      : 'bg-green-100 text-green-800 hover:bg-green-100'
                                      }`}>
                                      {doc.jenisDokumenDisplay}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-sm text-slate-600">{doc.createdAt}</TableCell>
                                  <TableCell>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-blue-600 border-blue-300 hover:bg-blue-50 hover:border-blue-400 flex items-center"
                                      onClick={() => setPreviewDocument(doc)}
                                    >
                                      <Eye className="h-4 w-4 mr-2" />
                                      <span className="text-sm">Lihat Info</span>
                                    </Button>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end space-x-2">
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
                  </TabsContent>
                  <TabsContent value="linkDokumen">
                    <Card className="p-6 border border-slate-200">
                      <h3 className="text-lg font-medium text-slate-700 mb-4">Daftar Link Dokumen Tersimpan</h3>
                      {loading ? (
                        <div className="py-4 text-center">
                          <RefreshCw className="h-8 w-8 mx-auto text-slate-400 animate-spin" />
                          <p className="mt-2 text-slate-500">Memuat daftar link...</p>
                        </div>
                      ) : uploadedLinks.length === 0 ? (
                        <div className="py-8 text-center">
                          <FileText className="h-12 w-12 mx-auto text-slate-400 mb-2" />
                          <p className="text-slate-600">Belum ada link dokumen yang diunggah.</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto rounded-lg border border-slate-200">
                          <Table>
                            <TableHeader className="bg-slate-50">
                              <TableRow>
                                <TableHead>Nama Dokumen</TableHead>
                                <TableHead>Diunggah</TableHead>
                                <TableHead>Link</TableHead>
                                <TableHead>Kategori</TableHead>
                                <TableHead>Jenis</TableHead>
                                <TableHead>Deskripsi</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {uploadedLinks.map(linkItem => (
                                <TableRow key={linkItem.id} className="hover:bg-slate-50/80">
                                  <TableCell className="font-medium">{linkItem.nama}</TableCell>
                                  <TableCell className="text-sm text-slate-600">{linkItem.diunggah}</TableCell>
                                  <TableCell>
                                    <a
                                      href={linkItem.link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline break-all"
                                    >
                                      {linkItem.link}
                                    </a>
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      className={
                                        linkItem.kategori === 'umum'
                                          ? 'bg-blue-100 text-blue-800'
                                          : 'bg-green-100 text-green-800'
                                      }
                                    >
                                      {linkItem.kategori === 'umum' ? 'Dok. Umum' : 'Dok. Mahasiswa'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>{linkItem.jenis.replace(/_/g, ' ')}</TableCell>
                                  <TableCell className="text-sm text-slate-600 max-w-xs">
                                    <CollapsibleMessage
                                      text={linkItem.deskripsi || '-'}
                                      maxLength={100}
                                    />
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-8 w-8 p-0 border-red-200 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                                      onClick={() =>
                                        handleDeleteLink(linkItem.filename, linkItem.kategori)
                                      }
                                    >
                                      <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>

                          </Table>
                        </div>
                      )}
                    </Card>
                  </TabsContent>
                </Tabs>
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
                            <Badge className={`ml-2 ${previewDocument.jenisDokumenDisplay === 'Dokumen Umum'
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
                  <h2 className="text-xl font-bold text-slate-800 mb-6">Unggah Konten Baru</h2>
                  <Tabs defaultValue="unggahDokumen" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                      <TabsTrigger value="unggahDokumen">Unggah Dokumen</TabsTrigger>
                      <TabsTrigger value="unggahLink">Unggah Link Dokumen</TabsTrigger>
                    </TabsList>
                    <TabsContent value="unggahDokumen">
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
                    </TabsContent>
                    <TabsContent value="unggahLink">
                      <Card className="p-6">
                        <h3 className="text-lg font-medium text-slate-700 mb-4">Unggah Link Dokumen</h3>
                        <form onSubmit={handleUploadLinkSubmit} className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <Label htmlFor="nama-link" className="text-sm font-medium">Nama Dokumen</Label>
                              <Input
                                id="nama-link"
                                name="nama"
                                placeholder="Masukkan nama dokumen"
                                value={linkForm.nama}
                                onChange={handleLinkInputChange}
                                className="border-slate-300 focus:border-blue-500"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="kategori-link" className="text-sm font-medium">Kategori Dokumen</Label>
                              <Select value={linkForm.kategori} onValueChange={handleLinkKategoriChange}>
                                <SelectTrigger id="kategori-link" className="border-slate-300 focus:border-blue-500">
                                  <SelectValue placeholder="Pilih kategori dokumen" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="umum">Dokumen Umum</SelectItem>
                                  <SelectItem value="mahasiswa">Dokumen Mahasiswa</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="jenis-link" className="text-sm font-medium">Jenis Dokumen</Label>
                            <Select value={linkForm.jenis} onValueChange={handleLinkJenisChange}>
                              <SelectTrigger id="jenis-link" className="border-slate-300 focus:border-blue-500">
                                <SelectValue placeholder="Pilih jenis dokumen" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Dokumen_Administrasi">Dokumen Administrasi</SelectItem>
                                <SelectItem value="Dokumen_Akademik">Dokumen Akademik</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="deskripsi-link" className="text-sm font-medium">Deskripsi</Label>
                            <Input
                              id="deskripsi-link"
                              name="deskripsi"
                              placeholder="Masukkan deskripsi dokumen (opsional)"
                              value={linkForm.deskripsi}
                              onChange={handleLinkInputChange}
                              className="border-slate-300 focus:border-blue-500"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="dokumen-link" className="text-sm font-medium">Link Dokumen</Label>
                            <Input
                              id="dokumen-link"
                              name="link"
                              type="url"
                              placeholder="https://example.com/dokumen.pdf"
                              value={linkForm.link}
                              onChange={handleLinkInputChange}
                              className="border-slate-300 focus:border-blue-500"
                              required
                            />
                          </div>

                          <div className="flex justify-end pt-4 border-t border-slate-200">
                            <Button
                              type="submit"
                              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white shadow-md hover:shadow-lg transition-all"
                              disabled={isSubmittingLink}
                            >
                              {isSubmittingLink ? (
                                <>
                                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                  Mengunggah Link...
                                </>
                              ) : (
                                <>
                                  <Upload className="h-4 w-4 mr-2" />
                                  Unggah Link
                                </>
                              )}
                            </Button>
                          </div>
                        </form>
                      </Card>
                      {/* The "Daftar Link Dokumen" Card is now moved to the "Dokumen" tab */}
                    </TabsContent>
                  </Tabs>
                </Card>
              </TabsContent>

              <TabsContent value="stats">
                <Card className="p-6 border border-slate-200">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-800">Pertanyaan Chatbot</h2>
                    <div className="flex justify-end">
                      <Button onClick={() => setIsAddQuestionModalOpen(true)} className='bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700'>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Tambah Pertanyaan
                      </Button>
                    </div>
                  </div>
                  {/* Chatbot Questions Management UI */}
                  <div className="space-y-4">

                    {loadingChatbotQuestions ? (
                      <div className="text-center py-8 text-slate-500">
                        <RefreshCw className="h-8 w-8 mx-auto text-slate-400 animate-spin" />
                        <p className="mt-2">Memuat pertanyaan chatbot...</p>
                      </div>
                    ) : chatbotQuestions.length === 0 ? (
                      <div className="text-center py-8 text-slate-500">
                        <HelpCircle className="h-12 w-12 mx-auto text-slate-400 mb-2" />
                        Belum ada pertanyaan template.
                      </div>
                    ) : (
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>No.</TableHead>
                              <TableHead>Pertanyaan</TableHead>
                              <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {chatbotQuestions.map((question, index) => (
                              <TableRow key={question.id}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell className="whitespace-pre-wrap">{question.teksPertanyaan}</TableCell> {/* Use flat access */}
                                <TableCell className="text-right space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setEditingQuestion(question);
                                      setCurrentQuestionText(question.teksPertanyaan); // Use flat access
                                      setIsEditQuestionModalOpen(true);
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDeleteQuestion(question)} // Pass the whole question object
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                </Card>
              </TabsContent>

              {/* Add Question Modal */}
              <Dialog open={isAddQuestionModalOpen} onOpenChange={(isOpen) => {
                setIsAddQuestionModalOpen(isOpen);
                if (!isOpen) setNewQuestionText(''); // Reset on close
              }}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Pertanyaan Template</DialogTitle>
                    <DialogDescription>
                      Ubah pertanyaan template: "{editingQuestion?.teksPertanyaan}" {/* Use flat access */}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4 space-y-2">
                    <Label htmlFor="newQuestionText">Pertanyaan</Label>
                    <Input
                      id="newQuestionText"
                      value={newQuestionText}
                      onChange={(e) => setNewQuestionText(e.target.value)}
                      placeholder="Ketik pertanyaan baru..."
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => {
                      setIsAddQuestionModalOpen(false);
                      setNewQuestionText('');
                    }}>Batal</Button>
                    <Button onClick={handleAddQuestion}>Simpan</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Edit Question Modal */}
              <Dialog open={isEditQuestionModalOpen} onOpenChange={(isOpen) => {
                setIsEditQuestionModalOpen(isOpen);
                if (!isOpen) {
                  setEditingQuestion(null);
                  setCurrentQuestionText('');
                }
              }}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Pertanyaan Template</DialogTitle>
                    <DialogDescription>
                      Ubah pertanyaan template: "{editingQuestion?.teksPertanyaan}" {/* Changed to editingQuestion?.teksPertanyaan */}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4 space-y-2">
                    <Label htmlFor="editQuestionText">Pertanyaan</Label>
                    <Input
                      id="editQuestionText"
                      value={currentQuestionText}
                      onChange={(e) => setCurrentQuestionText(e.target.value)}
                      placeholder="Ketik pertanyaan..."
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => {
                      setIsEditQuestionModalOpen(false);
                      setEditingQuestion(null);
                      setCurrentQuestionText('');
                    }}>Batal</Button>
                    <Button onClick={handleEditQuestion}>Simpan Perubahan</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

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
                            Masukkan detail untuk pengguna mahasiswa/admin baru.
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
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="role" className="text-right">
                                Role
                              </Label>
                              <Select
                                value={newUser.role.toString()}
                                onValueChange={handleNewUserRoleChange}
                              >
                                <SelectTrigger className="col-span-3">
                                  <SelectValue placeholder="Pilih role" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="3">Mahasiswa IT</SelectItem>
                                  <SelectItem value="4">Admin IT</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button className='bg-red-500 text-white hover:bg-red-300' type="button" variant="outline" onClick={() => setIsAddUserModalOpen(false)}>
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
                            {/* <TableHead>Status</TableHead> */}
                            <TableHead className="text-right">Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {users.map(user => (
                            <TableRow key={user.id} className="hover:bg-slate-50/80">
                              <TableCell className="font-medium">{user.username}</TableCell>
                              <TableCell>{user.email}</TableCell>
                              <TableCell>
                                <Badge className={`${user.role?.type === 'mahasiswa_it'
                                  ? 'bg-green-100 text-green-800 hover:bg-green-100'
                                  : user.role?.type === 'admin_it'
                                    ? 'bg-blue-100 text-blue-800 hover:bg-blue-100'
                                    : 'bg-slate-100 text-slate-800 hover:bg-slate-100'
                                  }`}>
                                  {user.role?.name || 'No Role'}
                                </Badge>
                              </TableCell>
                              {/* <TableCell>
                                <Badge className={`${user.confirmed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                  }`}>
                                  {user.confirmed ? 'Confirmed' : 'Unconfirmed'}
                                </Badge>
                                <Badge className={`ml-2 ${user.blocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                  }`}>
                                  {user.blocked ? 'Blocked' : 'Active'}
                                </Badge>
                              </TableCell> */}
                              <TableCell className="text-right">
                                <div className="flex justify-end space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => {
                                      setEditingUser(user);
                                      setIsEditUserModalOpen(true);
                                    }}
                                    disabled={isUpdatingUser}
                                    title="Edit User"
                                    aria-label="Edit User"
                                    aria-describedby="edit-user"
                                    aria-labelledby="edit-user"
                                    data-tooltip-id="edit-user"
                                    data-tooltip-content="Edit User"
                                    data-tooltip-place="top"
                                    data-tooltip-type="info"
                                    data-tooltip-delay-show={500}
                                    data-tooltip-delay-hide={1000}
                                    data-tooltip-interaction="true"
                                    data-tooltip-variant="info"
                                    data-tooltip-arrow="true"
                                    data-tooltip-arrow-size={5}
                                    data-tooltip-arrow-color="currentColor"
                                    data-tooltip-arrow-offset={5}
                                    data-tooltip-arrow-placement="top"
                                    data-tooltip-arrow-rotate={0}
                                  >
                                    <Edit className="h-4 w-4 text-slate-400" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0 border-red-200 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                                    onClick={() => handleDeleteUser(user.id)}
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
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${history.userType === 'mahasiswa'
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

              <TabsContent value="wa-bot">
                <Card className="p-6 border border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-slate-800">WhatsApp Bot Login</h2>
                    <Button
                      variant="outline"
                      onClick={() => setWaIframeKey(prev => prev + 1)}
                      className="ml-4 border-blue-300 hover:border-blue-400 hover:bg-blue-50"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh QR
                    </Button>
                  </div>
                  <div className="w-full" style={{ height: '80vh' }}>
                    <iframe
                      key={waIframeKey}
                      src={`http://localhost:5001/wa?refresh=${waIframeKey}`}
                      title="WhatsApp Bot"
                      width="100%"
                      height="100%"
                      style={{ border: '1px solid #e5e7eb', borderRadius: '8px', minHeight: '600px' }}
                    />
                  </div>
                  <p className="mt-2 text-slate-500 text-sm">Scan QR tersebut dengan menggunakan fitur add device pada aplikasi Whatsapp</p>
                </Card>
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

      {/* Edit User Modal */}
      {/* Edit User Modal */}
      {editingUser && (
        <Dialog open={isEditUserModalOpen} onOpenChange={setIsEditUserModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit User: {editUserForm.username}</DialogTitle>
              <DialogDescription>
                Update the user's details below. Password field is optional.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateUser}>
              <div className="grid gap-4 py-4">
                {/* Username */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-username" className="text-right">
                    Username
                  </Label>
                  <Input
                    id="edit-username"
                    name="username"
                    value={editUserForm.username}
                    onChange={handleUpdateUserInputChange}
                    className="col-span-3"
                    required
                    minLength={3}
                  />
                </div>

                {/* Email */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-email" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="edit-email"
                    name="email"
                    type="email"
                    value={editUserForm.email}
                    onChange={handleUpdateUserInputChange}
                    className="col-span-3"
                    required
                  />
                </div>

                {/* Password */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-password" className="text-right">
                    Password
                  </Label>
                  <Input
                    id="edit-password"
                    name="password"
                    type="password"
                    placeholder="Leave blank to keep current"
                    value={editUserForm.password}
                    onChange={handleUpdateUserInputChange}
                    className="col-span-3"
                    minLength={6}
                  />
                </div>

                {/* Role */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-role" className="text-right">
                    Role
                  </Label>
                  <Select
                    name="role"
                    value={String(editUserForm.role)}
                    onValueChange={val =>
                      handleUpdateUserInputChange({
                        target: { name: 'role', value: val }
                      } as any)
                    }
                  >
                    <SelectTrigger id="edit-role" className="col-span-3">
                      <SelectValue placeholder="Pilih role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">Mahasiswa IT</SelectItem>
                      <SelectItem value="4">Admin IT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  className="bg-red-500 text-white hover:bg-red-300"
                  onClick={() => {
                    setIsEditUserModalOpen(false);
                    setEditingUser(null);
                  }}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isUpdatingUser}
                  className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700"
                >
                  {isUpdatingUser ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan Perubahan'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}


      <Footer />
    </div>
  );
};

export default AdminDashboard;
