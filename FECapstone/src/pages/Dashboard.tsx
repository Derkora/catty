import React, { useState, useEffect } from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { FileText, Download, RefreshCw, Search, BookOpen, Calendar, Clock, FileArchive, ExternalLink, ChevronRight, Tag, FileImage, File, Sparkles } from 'lucide-react';
import axios from 'axios';
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

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortOption, setSortOption] = useState('newest');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    
    // Fetch documents
    fetchDocuments();
    
    return () => clearTimeout(timer);
  }, []);

  // Apply filtering and sorting whenever documents, searchTerm, or filterType changes
  useEffect(() => {
    let filtered = [...documents];
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(doc => 
        doc.namaDokumen.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by document type
    if (filterType !== 'all') {
      filtered = filtered.filter(doc => 
        doc.jenisDokumen === filterType
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      if (sortOption === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortOption === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortOption === 'name_asc') {
        return a.namaDokumen.localeCompare(b.namaDokumen);
      } else { // name_desc
        return b.namaDokumen.localeCompare(a.namaDokumen);
      }
    });
    
    setFilteredDocuments(filtered);
  }, [documents, searchTerm, filterType, sortOption]);

  const fetchDocuments = async () => {
    setLoadingDocuments(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/dokumens?populate=*`, {
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
        }
      });
      setDocuments(response.data.data);
      setFilteredDocuments(response.data.data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoadingDocuments(false);
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

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <FileImage className="h-10 w-10 text-purple-500" />;
    } else if (mimeType.includes('pdf')) {
      return <File className="h-10 w-10 text-red-500" />;
    } else if (mimeType.includes('word') || mimeType.includes('doc')) {
      return <File className="h-10 w-10 text-blue-500" />;
    } else if (mimeType.includes('sheet') || mimeType.includes('excel') || mimeType.includes('xls')) {
      return <File className="h-10 w-10 text-green-500" />;
    } else if (mimeType.includes('zip') || mimeType.includes('compressed')) {
      return <FileArchive className="h-10 w-10 text-amber-500" />;
    } else {
      return <FileText className="h-10 w-10 text-gray-500" />;
    }
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

  const openDocumentDetail = (doc: Document) => {
    setSelectedDocument(doc);
  };

  const closeDocumentDetail = () => {
    setSelectedDocument(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="h-24 w-24 relative">
            <div className="absolute inset-0 rounded-full border-t-4 border-b-4 border-blue-500 animate-spin"></div>
            <div className="absolute inset-[6px] rounded-full border-r-4 border-l-4 border-indigo-500 animate-spin animate-reverse"></div>
            <div className="absolute inset-[12px] rounded-full border-t-4 border-purple-500 animate-spin animate-delay-150"></div>
          </div>
          <p className="mt-6 text-lg font-medium text-blue-600 animate-pulse">Memuat Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />
      
      <main className="pt-24 pb-16 px-4 md:px-8 relative">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-1/3 h-96 bg-gradient-to-bl from-blue-500/10 to-purple-500/10 rounded-bl-full -z-10"></div>
        <div className="absolute bottom-0 left-0 w-1/4 h-64 bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 rounded-tr-full -z-10"></div>
        <div className="absolute top-1/4 left-1/3 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
        <div className="absolute top-1/2 right-1/4 w-3 h-3 bg-purple-400 rounded-full animate-pulse delay-300"></div>
        <div className="absolute bottom-1/4 left-1/4 w-2 h-2 bg-indigo-400 rounded-full animate-pulse delay-700"></div>
        
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10">
            <div>
              <div className="flex items-center">
                <span className="inline-block w-2 h-10 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full mr-3"></span>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Pusat Dokumen</h1>
                <Sparkles className="h-6 w-6 ml-2 text-amber-500" />
              </div>
              <p className="text-slate-600 mt-2 ml-5 text-lg">Akses dan kelola dokumen akademik Anda</p>
            </div>
            <div className="mt-4 md:mt-0">
              <Button 
                onClick={fetchDocuments}
                className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white shadow-md transition-all hover:shadow-lg hover:scale-105 rounded-xl"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md border border-slate-200/50 p-6 mb-10 transform hover:shadow-lg transition-all">
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
              <div className="relative flex-grow">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari dokumen..."
                  className="pl-12 pr-4 py-3 w-full border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all bg-white/70"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  className="px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm appearance-none bg-white/70 bg-no-repeat bg-[right_1rem_center] bg-[length:1em] transition-all pr-10"
                  style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")"}}
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="all">Semua Jenis</option>
                  <option value="Dokumen_Administrasi">Administrasi</option>
                  <option value="Dokumen_MataKuliah">Mata Kuliah</option>
                </select>
                <select
                  className="px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm appearance-none bg-white/70 bg-no-repeat bg-[right_1rem_center] bg-[length:1em] transition-all pr-10"
                  style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")"}}
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                >
                  <option value="newest">Terbaru</option>
                  <option value="oldest">Terlama</option>
                  <option value="name_asc">Nama (A-Z)</option>
                  <option value="name_desc">Nama (Z-A)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Document Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <Card className="p-6 border-none overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1 rounded-2xl">
              <div className="flex items-center">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-xl mr-5 shadow-lg">
                  <FileText className="h-7 w-7 text-white" />
                </div>
                <div>
                  <p className="text-sm text-blue-900/80 font-medium">Total Dokumen</p>
                  <p className="text-2xl font-bold text-blue-900">{documents.length}</p>
                </div>
              </div>
            </Card>
            <Card className="p-6 border-none overflow-hidden bg-gradient-to-br from-amber-50 to-amber-100 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1 rounded-2xl">
              <div className="flex items-center">
                <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-4 rounded-xl mr-5 shadow-lg">
                  <BookOpen className="h-7 w-7 text-white" />
                </div>
                <div>
                  <p className="text-sm text-amber-900/80 font-medium">Dokumen Mata Kuliah</p>
                  <p className="text-2xl font-bold text-amber-900">
                    {documents.filter(d => d.jenisDokumen === 'Dokumen_MataKuliah').length}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-6 border-none overflow-hidden bg-gradient-to-br from-purple-50 to-purple-100 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1 rounded-2xl">
              <div className="flex items-center">
                <div className="bg-gradient-to-br from-purple-500 to-fuchsia-600 p-4 rounded-xl mr-5 shadow-lg">
                  <Clock className="h-7 w-7 text-white" />
                </div>
                <div>
                  <p className="text-sm text-purple-900/80 font-medium">Pembaruan Terakhir</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {documents.length > 0
                      ? formatDate(
                          documents.sort(
                            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                          )[0].updatedAt
                        )
                      : '-'}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Document List */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 p-6 md:p-8">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent inline-block mb-6">Dokumen Saya</h2>
            
            {loadingDocuments ? (
              <div className="py-16 text-center">
                <div className="h-16 w-16 mx-auto relative">
                  <div className="absolute inset-0 rounded-full border-t-4 border-blue-500 animate-spin"></div>
                  <div className="absolute inset-[4px] rounded-full border-r-4 border-indigo-500 animate-spin animate-reverse"></div>
                </div>
                <p className="mt-6 text-lg font-medium text-slate-600 animate-pulse">Memuat dokumen...</p>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-24 h-24 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <FileText className="h-12 w-12 text-slate-300" />
                </div>
                <h3 className="text-xl font-medium text-slate-700 mb-2">Tidak ada dokumen ditemukan</h3>
                <p className="text-slate-500 max-w-md mx-auto">Coba dengan kata kunci atau filter yang berbeda, atau tunggu hingga dokumen baru diunggah.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {filteredDocuments.map(doc => (
                  <Card 
                    key={doc.id} 
                    className="border-none overflow-hidden bg-gradient-to-r from-slate-50 to-slate-100 hover:from-white hover:to-blue-50 shadow-md hover:shadow-lg transition-all duration-300 rounded-xl cursor-pointer group"
                    onClick={() => openDocumentDetail(doc)}
                  >
                    <div className="p-5 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex items-start space-x-4">
                        <div className={`rounded-xl p-4 transition-all duration-300 shadow-md group-hover:shadow-lg ${
                          doc.jenisDokumen === 'Dokumen_Administrasi'
                            ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                            : 'bg-gradient-to-br from-amber-500 to-orange-600'
                        }`}>
                          <FileText className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center mb-1">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                              doc.jenisDokumen === 'Dokumen_Administrasi' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              <Tag className="h-3 w-3 inline mr-1" />
                              {doc.jenisDokumen === 'Dokumen_Administrasi' ? 'Administrasi' : 'Mata Kuliah'}
                            </span>
                          </div>
                          <h3 className="font-semibold text-slate-800 text-xl mb-1 group-hover:text-blue-700 transition-colors">{doc.namaDokumen}</h3>
                          <div className="flex items-center text-xs text-slate-500">
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {formatDate(doc.createdAt)}
                            </div>
                            <span className="mx-2 text-slate-300">•</span>
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatDate(doc.updatedAt)}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex ml-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-lg border-blue-200 text-blue-700 hover:bg-blue-50 group-hover:bg-blue-100 group-hover:border-blue-300 transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDocumentDetail(doc);
                          }}
                        >
                          <span>Lihat Detail</span>
                          <ChevronRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
                        </Button>
                      </div>
                    </div>

                    {doc.fileDokumen?.length > 0 && (
                      <div className="p-4 bg-slate-100/50 border-t border-slate-200">
                        <div className="flex flex-wrap gap-2">
                          {doc.fileDokumen.slice(0, 3).map(file => (
                            <div
                              key={file.id}
                              className="flex items-center space-x-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm hover:shadow transition-all"
                            >
                              {file.mime.startsWith('image/') && file.formats && file.formats.thumbnail && file.formats.thumbnail.url ? (
                                <img
                                  src={`${API_BASE_URL}${file.formats.thumbnail.url}`}
                                  alt={file.name}
                                  className="w-9 h-9 object-cover rounded-lg shadow-sm"
                                />
                              ) : (
                                <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-50">
                                  {getFileIcon(file.mime)}
                                </div>
                              )}
                              <span className="text-xs font-medium truncate max-w-[120px]">{file.name}</span>
                            </div>
                          ))}

                          {doc.fileDokumen.length > 3 && (
                            <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm hover:shadow transition-all">
                              <span className="text-xs font-medium">+{doc.fileDokumen.length - 3} file lainnya</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Document Detail Modal */}
      {selectedDocument && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-scale-in border border-slate-100">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-gradient-to-r from-blue-50 to-violet-50">
              <h3 className="text-xl font-bold text-slate-800">{selectedDocument.namaDokumen}</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-9 w-9 p-0 rounded-full hover:bg-slate-200/70 transition-colors"
                onClick={closeDocumentDetail}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </Button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="flex items-center mb-6">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                  selectedDocument.jenisDokumen === 'Dokumen_Administrasi' 
                    ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}>
                  <Tag className="h-3 w-3 inline mr-1" />
                  {selectedDocument.jenisDokumen === 'Dokumen_Administrasi' ? 'Administrasi' : 'Mata Kuliah'}
                </span>
              </div>
              
              <div className="bg-slate-50 rounded-xl p-5 mb-8 border border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <span className="font-medium w-36 text-slate-500">ID Dokumen:</span>
                      <span className="text-slate-800 font-mono bg-slate-100 px-2 py-1 rounded text-sm">{selectedDocument.documentId}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium w-36 text-slate-500">Tanggal Dibuat:</span>
                      <span className="text-slate-800 flex items-center">
                        <Calendar className="h-4 w-4 mr-1 text-blue-500" />
                        {formatDate(selectedDocument.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium w-36 text-slate-500">Terakhir Diperbarui:</span>
                      <span className="text-slate-800 flex items-center">
                        <Clock className="h-4 w-4 mr-1 text-purple-500" />
                        {formatDate(selectedDocument.updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <h4 className="font-bold text-xl mb-6 pb-2 border-b border-slate-200 text-slate-800 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-blue-600" />
                File Dokumen
              </h4>
              <div className="space-y-4">
                {selectedDocument.fileDokumen?.length ? (
                  selectedDocument.fileDokumen.map(file => (
                    <div key={file.id} className="flex flex-col sm:flex-row sm:items-center p-5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm hover:shadow gap-4">
                      <div className="flex-shrink-0 flex items-center">
                        <div className="mr-4 bg-slate-100 p-3 rounded-lg shadow-sm">
                          {file.formats && file.formats.thumbnail && file.formats.thumbnail.url ? (
                            <img 
                              src={`${API_BASE_URL}${file.formats.thumbnail.url}`} 
                              alt={file.name}
                              className="w-16 h-16 object-cover rounded-lg shadow-sm"
                            />
                          ) : (
                            <div className="w-16 h-16 flex items-center justify-center rounded-lg">
                              {getFileIcon(file.mime)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-800 mb-1">{file.name}</p>
                          <div className="flex items-center text-xs text-slate-500">
                            <span className="px-2 py-1 bg-slate-100 rounded-full">{file.mime.split('/')[1]}</span>
                            <span className="mx-2">•</span>
                            <span>{formatFileSize(file.size)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-3 ml-auto mt-4 sm:mt-0">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className={`rounded-lg ${file.mime.startsWith('image/') || file.mime.includes('pdf') ? 'text-blue-600 border-blue-200 hover:bg-blue-50' : 'text-slate-400 border-slate-200 cursor-not-allowed opacity-70'}`}
                          onClick={() => {
                            if (file.mime.startsWith('image/') || file.mime.includes('pdf')) {
                              window.open(`${API_BASE_URL}${file.url}`, '_blank');
                            }
                          }}
                          disabled={!file.mime.startsWith('image/') && !file.mime.includes('pdf')}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Preview
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="rounded-lg text-green-600 border-green-200 hover:bg-green-50"
                          onClick={() => handleDownloadFile(file.url, file.name)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <FileText className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-600 font-medium">Tidak ada file terlampir</p>
                    <p className="text-slate-500 text-sm mt-1">Dokumen ini tidak memiliki file yang dapat diunduh</p>
                  </div>
                )}
              </div>
            </div>
            <div className="p-5 border-t border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50 flex justify-end">
              <Button 
                variant="outline" 
                onClick={closeDocumentDetail}
                className="rounded-lg border-slate-300 hover:bg-white/50 transition-colors"
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}

      <Footer />

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes scale-in {
            0% { transform: scale(0.95); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes animate-reverse {
            from { transform: rotate(0deg); }
            to { transform: rotate(-360deg); }
          }
          .animate-scale-in {
            animation: scale-in 0.2s ease-out;
          }
          .animate-reverse {
            animation-direction: reverse;
          }
          .animate-delay-150 {
            animation-delay: 150ms;
          }
        `
      }} />
    </div>
  );
};

export default Dashboard;
