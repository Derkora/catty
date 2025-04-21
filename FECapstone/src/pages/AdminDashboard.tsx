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
  LayoutDashboard,
  Settings,
  BookOpen,
  GraduationCap,
  CalendarDays,
  LogOut,
  X
} from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import axios from 'axios';
import { Badge } from '../components/ui/badge';
import { Link } from 'react-router-dom';
import { API_TOKEN, API_BASE_URL } from '../config';

interface Document {
  id: number;
  documentId: string;
  namaDokumen: string;
  jenisDokumen: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  fileDokumen: Array<{
    id: number;
    documentId: string;
    name: string;
    alternativeText: string | null;
    caption: string | null;
    width: number;
    height: number;
    formats: {
      thumbnail?: {
        name: string;
        hash: string;
        ext: string;
        mime: string;
        path: string | null;
        width: number;
        height: number;
        size: number;
        sizeInBytes: number;
        url: string;
      };
      medium?: {
        url: string;
      };
      small?: {
        url: string;
      };
      large?: {
        url: string;
      };
    };
    hash: string;
    ext: string;
    mime: string;
    size: number;
    url: string;
    previewUrl: string | null;
    provider: string;
    provider_metadata: any;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
  }>;
}

const AdminDashboard: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('documents');
  const [formData, setFormData] = useState({
    namaDokumen: '',
    jenisDokumen: 'Dokumen_Administrasi',
  });
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, [refreshKey]);

  useEffect(() => {
    if (documents.length > 0) {
      let filtered = [...documents];
      
      // Filter by search term
      if (searchTerm) {
        filtered = filtered.filter(doc => 
          doc?.namaDokumen?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      // Filter by document type
      if (filterType !== 'all') {
        filtered = filtered.filter(doc => 
          doc?.jenisDokumen === filterType
        );
      }
      
      setFilteredDocuments(filtered);
    } else {
      setFilteredDocuments([]);
    }
  }, [documents, searchTerm, filterType]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      console.log('Attempting to fetch documents from Strapi...');
      const response = await axios.get(`${API_BASE_URL}/api/dokumens?populate=*`, {
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
        }
      });
      console.log('Strapi response:', response);
      console.log('Strapi data structure:', JSON.stringify(response.data, null, 2));
      
      if (response.data && Array.isArray(response.data.data)) {
        setDocuments(response.data.data);
      } else {
        console.error('Unexpected data structure from Strapi API:', response.data);
        setDocuments([]);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, jenisDokumen: value }));
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

    try {
      console.log('Starting document upload process...');
      
      // First, upload the files
      const formDataFiles = new FormData();
      files.forEach(file => {
        formDataFiles.append('files', file);
      });

      console.log('Uploading files...');
      const uploadResponse = await axios.post(
        `${API_BASE_URL}/api/upload`, 
        formDataFiles,
        {
          headers: {
            Authorization: `Bearer ${API_TOKEN}`,
            'Content-Type': 'multipart/form-data',
          }
        }
      );
      console.log('File upload response:', uploadResponse);
      
      const fileIds = uploadResponse.data.map((file: any) => file.id);
      console.log('File IDs obtained:', fileIds);

      // Then create the document with references to the uploaded files
      console.log('Creating document with data:', { ...formData, fileDokumen: fileIds });
      const createResponse = await axios.post(
        `${API_BASE_URL}/api/dokumens`, 
        {
          data: {
            ...formData,
            fileDokumen: fileIds
          }
        },
        {
          headers: {
            Authorization: `Bearer ${API_TOKEN}`,
          }
        }
      );
      console.log('Document creation response:', createResponse);

      // Reset form and refresh documents
      setFormData({ namaDokumen: '', jenisDokumen: 'Dokumen_Administrasi' });
      setFiles([]);
      setRefreshKey(prev => prev + 1);
      
      alert('Dokumen berhasil diunggah!');
    } catch (error) {
      console.error('Error submitting document:', error);
      alert('Gagal mengunggah dokumen. Silakan periksa konsol untuk detail.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDocument = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await axios.delete(`${API_BASE_URL}/api/dokumens/${id}`, {
          headers: {
            Authorization: `Bearer ${API_TOKEN}`,
          }
        });
        setRefreshKey(prev => prev + 1);
      } catch (error) {
        console.error('Error deleting document:', error);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const handleDownloadFile = (url: string, filename: string) => {
    const fullUrl = `${API_BASE_URL}${url}`;
    const link = document.createElement('a');
    link.href = fullUrl;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && documents.length === 0) {
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
      
      <div className="pt-16 flex-grow flex">
        {/* Sidebar */}
        <div className="hidden md:block min-h-[calc(100vh-64px)] w-64 bg-white border-r border-slate-200 pt-5 pb-10 overflow-y-auto">
          <div className="px-6 mb-6">
            <h3 className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Admin Panel
            </h3>
            <div className="mt-2 -mx-3">
              <Button 
                variant="ghost" 
                className="w-full justify-start text-sm font-medium mb-1 bg-blue-50 text-blue-700"
              >
                <LayoutDashboard className="h-4 w-4 mr-3" />
                Dashboard
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-sm font-medium mb-1"
              >
                <GraduationCap className="h-4 w-4 mr-3" />
                Mahasiswa
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-sm font-medium mb-1"
              >
                <BookOpen className="h-4 w-4 mr-3" />
                Mata Kuliah
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-sm font-medium mb-1"
              >
                <FileText className="h-4 w-4 mr-3" />
                Dokumen
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-sm font-medium mb-1"
              >
                <CalendarDays className="h-4 w-4 mr-3" />
                Jadwal
              </Button>
            </div>
          </div>

          <div className="px-6 mb-6">
            <h3 className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Pengaturan
            </h3>
            <div className="mt-2 -mx-3">
              <Button 
                variant="ghost" 
                className="w-full justify-start text-sm font-medium mb-1"
              >
                <Settings className="h-4 w-4 mr-3" />
                Pengaturan Akun
              </Button>
              <Link to="/">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-sm font-medium mb-1"
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  Kembali ke Situs
                </Button>
              </Link>
            </div>
          </div>

          <div className="px-6">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
              <h4 className="text-sm font-medium text-blue-800">Admin System</h4>
              <p className="text-xs text-blue-600 mt-1">Versi 1.0.0</p>
              <p className="text-xs text-blue-600 mt-3">Departemen Teknologi Informasi ITS</p>
            </div>
          </div>
        </div>
        
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
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">{documents.length}</h3>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </Card>
              
              <Card className="p-6 border-l-4 border-l-violet-500 hover:shadow-md transition-all">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Dokumen Administrasi</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">
                      {documents.filter(d => d?.jenisDokumen === 'Dokumen_Administrasi').length}
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
                    <p className="text-sm font-medium text-slate-500">Dokumen Mata Kuliah</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">
                      {documents.filter(d => d?.jenisDokumen === 'Dokumen_MataKuliah').length}
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
                        value={filterType}
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
                          <SelectItem value="Dokumen_Administrasi">Administrasi</SelectItem>
                          <SelectItem value="Dokumen_MataKuliah">Mata Kuliah</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {loading ? (
                    <div className="py-4 text-center">
                      <RefreshCw className="h-8 w-8 mx-auto text-slate-400 animate-spin" />
                      <p className="mt-2 text-slate-500">Memuat data dokumen...</p>
                    </div>
                  ) : filteredDocuments.length === 0 ? (
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
                            <TableHead>Tanggal Dibuat</TableHead>
                            <TableHead>File</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredDocuments.map(doc => (
                            <TableRow key={doc.id} className="hover:bg-slate-50/80">
                              <TableCell className="font-medium">{doc?.namaDokumen || 'Unnamed Document'}</TableCell>
                              <TableCell>
                                <Badge className={`${
                                  doc?.jenisDokumen === 'Dokumen_Administrasi' 
                                    ? 'bg-blue-100 text-blue-800 hover:bg-blue-100' 
                                    : 'bg-green-100 text-green-800 hover:bg-green-100'
                                }`}>
                                  {doc?.jenisDokumen === 'Dokumen_Administrasi' ? 'Administrasi' : 'Mata Kuliah'}
                                </Badge>
                              </TableCell>
                              <TableCell>{doc?.createdAt ? formatDate(doc.createdAt) : 'Unknown'}</TableCell>
                              <TableCell>
                                {doc?.fileDokumen?.length ? (
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-xs font-normal"
                                    onClick={() => setPreviewDocument(doc)}
                                  >
                                    <span className="text-sm">{doc.fileDokumen.length} file</span>
                                    <ChevronDown className="h-4 w-4 ml-1" />
                                  </Button>
                                ) : (
                                  <span className="text-sm text-slate-500">Tidak ada file</span>
                                )}
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
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                  >
                                    <Edit className="h-4 w-4 text-slate-600" />
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="h-8 w-8 p-0 border-red-200 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                                    onClick={() => handleDeleteDocument(doc.id)}
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

                {/* Document Preview Modal */}
                {previewDocument && (
                  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden">
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
                        <div className="flex flex-col space-y-2 mb-4">
                          <div className="flex items-center">
                            <span className="font-medium">Jenis Dokumen:</span>{' '}
                            <Badge className={`ml-2 ${
                              previewDocument.jenisDokumen === 'Dokumen_Administrasi' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {previewDocument.jenisDokumen === 'Dokumen_Administrasi' ? 'Administrasi' : 'Mata Kuliah'}
                            </Badge>
                          </div>
                          <div>
                            <span className="font-medium">ID Dokumen:</span>{' '}
                            <span className="text-slate-700">{previewDocument.documentId}</span>
                          </div>
                          <div>
                            <span className="font-medium">Tanggal Dibuat:</span>{' '}
                            <span className="text-slate-700">{formatDate(previewDocument.createdAt)}</span>
                          </div>
                          <div>
                            <span className="font-medium">Terakhir Diperbarui:</span>{' '}
                            <span className="text-slate-700">{formatDate(previewDocument.updatedAt)}</span>
                          </div>
                        </div>

                        <h4 className="font-bold text-lg mb-4 border-b pb-2">File</h4>
                        <div className="space-y-4">
                          {previewDocument.fileDokumen?.length ? (
                            previewDocument.fileDokumen.map(file => (
                              <div key={file.id} className="flex items-center p-3 border rounded-lg hover:bg-slate-50">
                                <div className="mr-4">
                                  {file.formats && file.formats.thumbnail && file.formats.thumbnail.url ? (
                                    <img 
                                      src={`${API_BASE_URL}${file.formats.thumbnail.url}`} 
                                      alt={file.name}
                                      className="w-14 h-14 object-cover rounded border border-slate-200"
                                    />
                                  ) : (
                                    <div className="w-14 h-14 flex items-center justify-center bg-slate-100 rounded border border-slate-200">
                                      <FileText className="h-8 w-8 text-slate-400" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium text-slate-800">{file.name}</p>
                                  <div className="flex items-center text-xs text-slate-500 mt-1">
                                    <span>{file.mime}</span>
                                    <span className="mx-2">•</span>
                                    <span>{formatFileSize(file.size)}</span>
                                  </div>
                                </div>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="ml-4"
                                  onClick={() => handleDownloadFile(file.url, file.name)}
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </Button>
                              </div>
                            ))
                          ) : (
                            <p className="text-slate-500 text-center py-4">Tidak ada file terlampir</p>
                          )}
                        </div>
                      </div>
                      <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setPreviewDocument(null)}>
                          Tutup
                        </Button>
                        <Button className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Dokumen
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
                          value={formData.namaDokumen}
                          onChange={handleInputChange}
                          className="border-slate-300 focus:border-blue-500"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="jenisDokumen" className="text-sm font-medium">Jenis Dokumen</Label>
                        <Select 
                          value={formData.jenisDokumen} 
                          onValueChange={handleSelectChange}
                        >
                          <SelectTrigger id="jenisDokumen" className="border-slate-300 focus:border-blue-500">
                            <SelectValue placeholder="Pilih jenis dokumen" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Dokumen_Administrasi">Dokumen Administrasi</SelectItem>
                            <SelectItem value="Dokumen_MataKuliah">Dokumen Mata Kuliah</SelectItem>
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
                            multiple
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {files.map((file, index) => (
                                <div key={index} className="flex items-center border rounded-lg p-3 bg-white">
                                  <FileText className="h-5 w-5 mr-3 text-blue-500" />
                                  <div className="overflow-hidden">
                                    <p className="truncate text-sm font-medium">{file.name}</p>
                                    <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                                  </div>
                                </div>
                              ))}
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
                    <h2 className="text-xl font-bold text-slate-800">Pengelolaan Pengguna</h2>
                    <Button className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700">
                      <Users className="h-4 w-4 mr-2" />
                      Tambah Pengguna
                    </Button>
                  </div>
                  <div className="h-80 flex items-center justify-center border rounded-lg bg-slate-50">
                    <div className="text-center">
                      <Users className="h-12 w-12 mx-auto text-slate-300" />
                      <p className="mt-2 text-slate-600">Fitur pengelolaan pengguna sedang dalam pengembangan</p>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default AdminDashboard; 