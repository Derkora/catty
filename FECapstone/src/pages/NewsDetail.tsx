import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Toaster } from '../components/ui/toaster';
import { useToast } from '../lib/hooks/use-toast';
import axios from 'axios';
import { getNews, NewsItem, getStrapiMedia } from '../api/strapiApi';

interface NewsDetailData {
  id: string;
  title: string;
  description: string;
  content: string;
  date: string;
  imageUrl?: string;
  author?: string;
  category?: string;
  source?: string;
}

const NewsDetail: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [news, setNews] = useState<NewsDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);
  const [relatedNews, setRelatedNews] = useState<{id: string, title: string}[]>([]);

  useEffect(() => {
    setLoading(true);
    
    const fetchNewsDetail = async () => {
      try {
        console.log("Mencari berita dengan documentId:", documentId);
        const response = await getNews();
        
        if (response && response.data && response.data.length > 0) {
          const foundNews = response.data.find(
            (item: NewsItem) => (item.documentId || item.id.toString()) === documentId
          );
          
          if (foundNews) {
            setNews({
              id: foundNews.id.toString(),
              title: foundNews.title,
              description: foundNews.description,
              content: foundNews.description,
              date: foundNews.publishedAt,
              imageUrl: getStrapiMedia(foundNews.image?.url),
              author: 'Admin Departemen',
              category: 'Berita',
              source: 'Tim IT Jurnalistik'
            });
            
            setRelatedNews(
              response.data
                .filter((item: NewsItem) => 
                  (item.documentId || item.id.toString()) !== documentId
                )
                .map((item: NewsItem) => ({
                  id: item.documentId || item.id.toString(),
                  title: item.title
                }))
                .slice(0, 3)
            );
          } else {
            console.error("Berita tidak ditemukan dengan documentId:", documentId);
            toast({
              title: "Berita tidak ditemukan",
              description: "Maaf, berita yang Anda cari tidak ditemukan.",
              variant: "destructive",
            });
            setNews(null);
          }
        } else {
          console.error("Tidak ada data berita yang diterima dari API");
          toast({
            title: "Tidak ada berita",
            description: "Tidak ada berita yang tersedia saat ini.",
            variant: "destructive",
          });
          setNews(null);
        }
      } catch (error) {
        console.error('Error fetching news detail:', error);
        toast({
          title: "Terjadi kesalahan",
          description: "Gagal memuat berita. Silakan coba lagi nanti.",
          variant: "destructive",
        });
        setNews(null);
      } finally {
        setLoading(false);
      }
    };
    
    const timer = setTimeout(() => {
      fetchNewsDetail();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [documentId, toast]);

  const handleImageError = () => {
    console.log(`Image error for: "${news?.title}", URL: ${news?.imageUrl}`);
    setImgError(true);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    
    try {
      const options: Intl.DateTimeFormatOptions = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      };
      return new Date(dateString).toLocaleDateString('id-ID', options);
    } catch (e) {
      return dateString;
    }
  };

  const formatContentToParagraphs = (content?: string) => {
    if (!content) return null;
    
    if (content.includes('<p>') || content.includes('<div>')) {
      return <div dangerouslySetInnerHTML={{ __html: content }} />;
    }
    
    return content.split('\n').map((paragraph, index) => (
      paragraph.trim() !== '' ? <p key={index} className="mb-4">{paragraph}</p> : null
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!news) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
        <h1 className="text-2xl font-bold">Berita Tidak Ditemukan</h1>
        <p className="text-muted-foreground text-center max-w-md">
          Maaf, berita yang Anda cari tidak tersedia atau telah dihapus.
        </p>
        <Button onClick={() => navigate(-1)}>Kembali</Button>
        <Toaster />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm p-4 flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          ← Kembali
        </Button>
        <Button 
          variant="ghost" 
          onClick={() => navigator.clipboard.writeText(window.location.href)}
        >
          Bagikan
        </Button>
      </header>
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <article>
          <div className="mb-8">
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge variant="primary">{news.category || 'Berita'}</Badge>
              <span className="text-sm text-muted-foreground">{formatDate(news.date)}</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{news.title}</h1>
            <p className="text-xl text-muted-foreground mb-4">{news.description}</p>
            
            <div className="flex items-center text-sm text-muted-foreground">
              <span className="mr-4">Penulis: <span className="font-medium">{news.author || 'Admin'}</span></span>
              {news.source && <span>Sumber: <span className="font-medium">{news.source}</span></span>}
            </div>
          </div>
          
          {news.imageUrl && (
            <div className="w-full h-[300px] md:h-[400px] mb-8 rounded-lg overflow-hidden bg-slate-100">
              <img
                src={imgError ? '/images/news-placeholder.jpg' : news.imageUrl}
                alt={news.title}
                className="w-full h-full object-cover"
                onError={handleImageError}
              />
            </div>
          )}
          
          <div className="prose max-w-none">
            {formatContentToParagraphs(news.content)}
          </div>
        </article>
      </main>
      
      <footer className="bg-slate-50 p-6 border-t">
        <div className="container mx-auto max-w-4xl">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div>
              <h3 className="font-bold mb-2">Artikel Terkait</h3>
              {relatedNews.length > 0 ? (
                <ul className="space-y-2">
                  {relatedNews.map(item => (
                    <li key={item.id}>
                      <a 
                        href={`/news/${item.id}`} 
                        className="text-blue-600 hover:underline"
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(`/news/${item.id}`);
                        }}
                      >
                        {item.title}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">Tidak ada artikel terkait</p>
              )}
            </div>
            <div>
              <Button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                Kembali ke Atas
              </Button>
            </div>
          </div>
        </div>
      </footer>
      
      <Toaster />
    </div>
  );
};

export default NewsDetail; 