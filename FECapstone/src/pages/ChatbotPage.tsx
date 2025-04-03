import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Toaster } from '../components/ui/toaster';
import { useToast } from '../lib/hooks/use-toast';
import { Bot, User, Send, Brain, Zap, Sparkles, Wand2, LucideIcon, X, Maximize, Minimize } from 'lucide-react';

// Custom styles for animations
const customStyles = `
  @keyframes gradient-shift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  
  @keyframes pulse-subtle {
    0% { opacity: 0.7; }
    50% { opacity: 1; }
    100% { opacity: 0.7; }
  }
  
  @keyframes typing-dot {
    0% { opacity: 0.2; transform: scale(0.8); }
    50% { opacity: 1; transform: scale(1); }
    100% { opacity: 0.2; transform: scale(0.8); }
  }
  
  @keyframes float {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
    100% { transform: translateY(0px); }
  }
  
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  
  .bg-grid-pattern {
    background-image: 
      linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px);
    background-size: 30px 30px;
  }
  
  .shimmer {
    background: linear-gradient(90deg, 
      rgba(255,255,255,0) 0%, 
      rgba(255,255,255,0.08) 50%, 
      rgba(255,255,255,0) 100%);
    background-size: 200% 100%;
    animation: shimmer 3s infinite;
  }
  
  .typing-dot:nth-child(1) { animation-delay: 0s; }
  .typing-dot:nth-child(2) { animation-delay: 0.2s; }
  .typing-dot:nth-child(3) { animation-delay: 0.4s; }
`;

// Types for our messages
interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

// Features section component
const FeatureCard: React.FC<{
  title: string;
  description: string;
  icon: LucideIcon;
}> = ({ title, description, icon: Icon }) => {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-5 transition-all duration-300 hover:transform hover:translate-y-[-5px] hover:shadow-lg border border-white/10">
      <div className="flex items-start">
        <div className="p-3 rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-white mr-4">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-white font-bold text-lg">{title}</h3>
          <p className="text-blue-100/80 text-sm mt-1">{description}</p>
        </div>
      </div>
    </div>
  );
};

// Helper function to format markdown-like text to HTML
function formatMarkdown(text: string): string {
  // Basic markdown formatting
  let formatted = text
    // Headers
    .replace(/^### (.*$)/gim, '<h3 class="text-md font-bold mt-2 mb-1">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-lg font-bold mt-2 mb-1">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-xl font-bold mt-2 mb-2">$1</h1>')
    
    // Bold and italic
    .replace(/\*\*(.*)\*\*/gim, '<strong class="font-bold">$1</strong>')
    .replace(/\*(.*)\*/gim, '<em class="italic">$1</em>')
    
    // Lists
    .replace(/^\d+\. (.*$)/gim, '<li class="ml-5 my-1">$1</li>')
    .replace(/^- (.*$)/gim, '<li class="ml-5 my-1 list-disc">$1</li>')
    
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" class="text-blue-600 hover:underline">$1</a>')

  // Process lists
  if (formatted.includes('<li')) {
    formatted = formatted
      .replace(/<li class="ml-5 my-1">/g, '<ol class="list-decimal pl-5 my-2"><li class="ml-2 my-1">')
      .replace(/<li class="ml-5 my-1 list-disc">/g, '<ul class="list-disc pl-5 my-2"><li class="ml-2 my-1">')
      .replace(/<\/li>\s*<li class="ml-5 my-1">/g, '</li><li class="ml-2 my-1">')
      .replace(/<\/li>\s*<li class="ml-5 my-1 list-disc">/g, '</li><li class="ml-2 my-1 list-disc">')
      .replace(/<\/li>(?!\s*<li)/g, '</li></ol>')
      .replace(/<\/li>\s*<\/ol>\s*<ul/g, '</li></ol><ul')
      .replace(/<\/li>\s*<\/ol>\s*<ol/g, '</li></ol><ol')
      .replace(/<\/li>\s*<\/ul>\s*<ul/g, '</li></ul><ul')
      .replace(/<\/li>\s*<\/ul>\s*<ol/g, '</li></ul><ol')
  }

  // Convert newlines to paragraphs
  formatted = '<p>' + formatted.replace(/\n\s*\n/g, '</p><p>') + '</p>';
  
  // Clean up empty paragraphs
  formatted = formatted.replace(/<p>\s*<\/p>/g, '');
  
  return formatted;
}

const ChatbotPage: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'bot',
      text: 'Halo! Saya adalah asisten virtual Program Studi Teknologi Informasi ITS. Apa yang ingin kamu ketahui tentang jurusan kami?',
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [role, setRole] = useState<'general' | 'mahasigma'>('general');
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleRoleChange = (newRole: 'general' | 'mahasigma') => {
    setRole(newRole);
    toast({
      title: "Mode Chatbot Berubah",
      description: newRole === 'general' 
        ? "Mode umum aktif untuk semua pengunjung" 
        : "Mode mahasiswa aktif dengan akses informasi khusus",
      variant: "default",
    });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputMessage,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);
    
    try {
      // Using proxied endpoint to avoid CORS issues
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: inputMessage,
          role: role,
        })
      });
      
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Add bot response
      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            sender: 'bot',
            text: data.reply.replace(/<think>[\s\S]*?<\/think>/g, ''), // Remove thinking process
            timestamp: new Date(),
          },
        ]);
      }, 700); // Add a small delay for natural feel
      
    } catch (error) {
      console.error('Error:', error);
      setIsTyping(false);
      toast({
        title: "Terjadi Kesalahan",
        description: "Gagal terhubung ke server chatbot. Pastikan server chatbot berjalan.",
        variant: "destructive",
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="flex flex-col min-h-screen w-full overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      <Header />
      
      <main className="flex-grow w-full mt-16">
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden bg-gradient-to-br from-blue-900 via-indigo-900 to-violet-900">
          <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-600 rounded-full filter blur-[100px] opacity-30 mix-blend-multiply"></div>
          <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-violet-600 rounded-full filter blur-[80px] opacity-30 mix-blend-multiply"></div>
          
          <div className="container-content relative z-10 mx-auto px-4">
            <div className="text-center mb-16">
              <div className="inline-block mb-4">
                <Badge variant="outline" className="rounded-full bg-white/10 text-blue-100 border-blue-500/30 px-4 py-1 text-sm backdrop-blur-sm">
                  <Sparkles className="h-3.5 w-3.5 mr-2 text-blue-300" />
                  Powered by AI
                </Badge>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                TANYA<span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-violet-400 text-transparent bg-clip-text">BOT</span> ITS
              </h1>
              <p className="text-xl text-blue-100/90 max-w-3xl mx-auto">
                Asisten virtual berbasis AI untuk menjelajahi segala hal tentang Departemen Teknologi Informasi ITS
              </p>
            </div>
          </div>
          
          {/* Bottom Wave */}
          <div className="absolute -bottom-1 left-0 right-0">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 200">
              <path fill="#f8fafc" fillOpacity="1" d="M0,128L60,117.3C120,107,240,85,360,90.7C480,96,600,128,720,138.7C840,149,960,139,1080,122.7C1200,107,1320,85,1380,74.7L1440,64L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"></path>
            </svg>
          </div>
        </section>
        
        {/* Chatbot Interface Section */}
        <section className="py-12 bg-slate-50 relative">
          <div className="container-content mx-auto px-4">
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              {/* Features Column */}
              <div className="lg:w-1/3 space-y-6">
                <h2 className="text-2xl font-bold text-slate-900">Fitur Tanyabot ITS</h2>
                <p className="text-slate-600">Asisten pintar yang dirancang khusus untuk membantu calon mahasiswa dan pengunjung mengetahui lebih banyak tentang Departemen Teknologi Informasi ITS.</p>
                
                <div className="space-y-4 mt-6">
                  <FeatureCard 
                    title="Informasi Program Studi" 
                    description="Tanyakan tentang kurikulum, mata kuliah, dan spesialisasi di Teknologi Informasi ITS."
                    icon={Brain} 
                  />
                  
                  <FeatureCard 
                    title="Fasilitas & Laboratorium" 
                    description="Ketahui lebih lanjut tentang fasilitas modern dan lab penelitian yang tersedia."
                    icon={Zap} 
                  />
                  
                  <FeatureCard 
                    title="Prestasi & Keunggulan" 
                    description="Pelajari prestasi mahasiswa dan keunggulan departemen di tingkat nasional dan internasional."
                    icon={Wand2} 
                  />
                </div>
                
                <div className="p-5 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100 mt-8">
                  <h3 className="font-semibold text-blue-800 mb-2">Cara Menggunakan</h3>
                  <ul className="text-slate-700 text-sm space-y-2">
                    <li className="flex items-start">
                      <span className="bg-blue-100 text-blue-600 rounded-full w-5 h-5 inline-flex items-center justify-center text-xs mr-2 mt-0.5">1</span>
                      <span>Ketik pertanyaan tentang Departemen Teknologi Informasi ITS</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-blue-100 text-blue-600 rounded-full w-5 h-5 inline-flex items-center justify-center text-xs mr-2 mt-0.5">2</span>
                      <span>Tekan tombol kirim atau tekan Enter</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-blue-100 text-blue-600 rounded-full w-5 h-5 inline-flex items-center justify-center text-xs mr-2 mt-0.5">3</span>
                      <span>Dapatkan jawaban langsung dari AI yang terlatih dengan pengetahuan departemen</span>
                    </li>
                  </ul>
                </div>
              </div>
              
              {/* Chatbot Interface */}
              <div className={`lg:w-2/3 ${isExpanded ? 'fixed inset-4 z-50' : ''}`}>
                <div className="bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden h-[600px] flex flex-col transition-all duration-300 transform hover:shadow-2xl hover:border-blue-200 relative">
                  {/* Chatbot Header */}
                  <div className="bg-gradient-to-r from-blue-600 to-violet-600 p-4 text-white flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center mr-3">
                        <Bot className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-bold">Tanyabot ITS</h3>
                        <p className="text-xs text-blue-100">Asisten Virtual Departemen Teknologi Informasi</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex space-x-2">
                        <Button 
                          onClick={() => handleRoleChange('general')} 
                          size="sm" 
                          variant={role === 'general' ? 'default' : 'outline'} 
                          className={`rounded-full text-xs ${role === 'general' ? 'bg-white text-blue-700' : 'bg-white/10 text-white border-white/30'}`}
                        >
                          Mode Umum
                        </Button>
                        <Button 
                          onClick={() => handleRoleChange('mahasigma')} 
                          size="sm" 
                          variant={role === 'mahasigma' ? 'default' : 'outline'} 
                          className={`rounded-full text-xs ${role === 'mahasigma' ? 'bg-white text-violet-700' : 'bg-white/10 text-white border-white/30'}`}
                        >
                          Mode Mahasiswa
                        </Button>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={toggleExpand}
                        className="bg-white/10 text-white hover:bg-white/20 rounded-full h-8 w-8"
                      >
                        {isExpanded ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Chatbot Messages */}
                  <div className="flex-grow overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-slate-50 to-white">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] ${
                            message.sender === 'user'
                              ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-2xl rounded-tr-none'
                              : 'bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-tl-none shadow-sm'
                          } p-4`}
                        >
                          <div className="flex items-center mb-1">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${
                                message.sender === 'user'
                                  ? 'bg-white/20'
                                  : 'bg-blue-100'
                              }`}
                            >
                              {message.sender === 'user' ? (
                                <User className="h-3 w-3 text-white" />
                              ) : (
                                <Bot className="h-3 w-3 text-blue-600" />
                              )}
                            </div>
                            <span
                              className={`text-xs ${
                                message.sender === 'user' ? 'text-blue-100' : 'text-slate-500'
                              }`}
                            >
                              {message.sender === 'user' ? 'Kamu' : 'Tanyabot ITS'}
                            </span>
                          </div>
                          <div className="whitespace-pre-wrap">
                            {message.sender === 'bot' ? (
                              <div 
                                className="prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{
                                  __html: formatMarkdown(message.text)
                                }}
                              />
                            ) : (
                              message.text
                            )}
                          </div>
                          <div
                            className={`text-xs mt-2 text-right ${
                              message.sender === 'user' ? 'text-blue-100/70' : 'text-slate-400'
                            }`}
                          >
                            {message.timestamp.toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-white border border-slate-200 text-slate-500 rounded-2xl rounded-tl-none p-4 shadow-sm max-w-[85%]">
                          <div className="flex items-center mb-1">
                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                              <Bot className="h-3 w-3 text-blue-600" />
                            </div>
                            <span className="text-xs text-slate-500">Tanyabot ITS</span>
                          </div>
                          <div className="flex space-x-2">
                            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse typing-dot"></div>
                            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse typing-dot"></div>
                            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse typing-dot"></div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef}></div>
                  </div>
                  
                  {/* Chatbot Input */}
                  <div className="p-4 border-t border-slate-200 bg-white">
                    <div className="flex gap-3">
                      <Input
                        type="text"
                        placeholder="Tanyakan tentang Departemen Teknologi Informasi ITS..."
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-grow border-slate-300 focus:border-blue-500 rounded-full py-6"
                      />
                      <Button
                        onClick={handleSendMessage}
                        className="bg-gradient-to-r from-blue-600 to-violet-600 text-white px-4 rounded-full hover:shadow-lg transition-all hover:opacity-90"
                        disabled={isTyping || !inputMessage.trim()}
                      >
                        <Send className="h-5 w-5" />
                      </Button>
                    </div>
                    <div className="mt-2 text-xs text-slate-500 text-center">
                      <span>Tanyabot akan menjawab pertanyaan tentang Departemen Teknologi Informasi ITS</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Technology & Capabilities Section */}
        <section className="py-20 bg-gradient-to-br from-slate-800 to-slate-900 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full filter blur-[120px]"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/20 rounded-full filter blur-[120px]"></div>
          
          <div className="container-content relative z-10 mx-auto px-4">
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <Badge variant="outline" className="rounded-full bg-white/10 text-blue-200 border-blue-500/30 px-4 py-1 text-sm mb-6 backdrop-blur-sm">
                Teknologi Terdepan
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Didukung oleh <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">Teknologi AI Terbaru</span>
              </h2>
              <p className="text-blue-100/80">
                Tanyabot memanfaatkan model bahasa terkini yang diintegrasikan dengan basis pengetahuan khusus tentang Departemen Teknologi Informasi ITS
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 transition-all duration-300 hover:bg-white/10">
                <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl w-12 h-12 flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Basis Pengetahuan Khusus</h3>
                <p className="text-blue-100/70">
                  Dilatih dengan data khusus tentang kurikulum, fasilitas, prestasi, dan keunggulan Departemen Teknologi Informasi ITS.
                </p>
              </div>
              
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 transition-all duration-300 hover:bg-white/10">
                <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl w-12 h-12 flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Pemahaman Konteks Akademik</h3>
                <p className="text-blue-100/70">
                  Mampu memahami dan menjawab pertanyaan kompleks seputar perkuliahan, penelitian, dan kegiatan kemahasiswaan.
                </p>
              </div>
              
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 transition-all duration-300 hover:bg-white/10">
                <div className="bg-gradient-to-br from-violet-500 to-violet-700 rounded-xl w-12 h-12 flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Mode Khusus Mahasiswa</h3>
                <p className="text-blue-100/70">
                  Fitur mode mahasiswa untuk akses informasi lebih mendalam tentang mata kuliah, jadwal, dan resources khusus jurusan.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
      <Toaster />
    </div>
  );
};

export default ChatbotPage; 