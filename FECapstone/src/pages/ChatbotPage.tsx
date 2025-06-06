import React, { useState, useRef, useEffect } from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Toaster } from '../components/ui/toaster';
import { useToast } from '../lib/hooks/use-toast';
import { Bot, User, Send, Brain, Zap, Sparkles, Wand2, LucideIcon, X, Maximize, Minimize, Copy, RefreshCw, Check, HelpCircle, InfoIcon, CheckCircle } from 'lucide-react';
import './ChatbotPage.css';
import { FLASK_API_BASE_URL, API_BASE_URL } from '../config'; // Import Flask and Strapi URLs
// import suggestedQuestions from '../data/pertanyaan-chatbots?populate=*`.json'; // Will be removed

interface StrapiChatbotQuestion { // Updated to actual flat structure
  id: number;
  teksPertanyaan: string;
  urutan?: number | null; // urutan can be null
  documentId?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
  responseTime?: number;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

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

const formatMarkdown = (text: string) => {
  if (!text) return '';
  
  let formattedText = text.replace(
    /```([a-z]*)\n([\s\S]*?)```/g, 
    (_, language, code) => {
      return `<pre class="bg-slate-100 p-3 rounded-md overflow-x-auto"><code class="language-${language || 'plaintext'}">${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`;
    }
  );
  
  formattedText = formattedText.replace(
    /`([^`]+)`/g, 
    (_, code) => {
      return `<code class="bg-slate-100 px-1 py-0.5 rounded text-sm">${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code>`;
    }
  );
  
  // Process tables
  formattedText = formattedText.replace(
    /\|(.+)\|\n\|([-:]+[-| :]*)\|\n((.*\|.*\n)+)/g,
    (_, header, alignment, rows) => {
      const headerCells = header.split('|').map((cell: string) => cell.trim());
      const alignmentCells = alignment.split('|').map((cell: string) => {
        if (cell.trim().startsWith(':') && cell.trim().endsWith(':')) return 'text-center';
        if (cell.trim().endsWith(':')) return 'text-right';
        return 'text-left';
      });
      
      let tableHTML = '<div class="overflow-x-auto my-4"><table class="min-w-full border-collapse border border-slate-300">\n<thead>\n<tr>\n';
      
      // Generate header row
      headerCells.forEach((cell: string, i: number) => {
        if (cell) {
          const align = alignmentCells[i] || 'text-left';
          tableHTML += `<th class="border border-slate-300 px-4 py-2 bg-slate-100 ${align}">${cell}</th>\n`;
        }
      });
      
      tableHTML += '</tr>\n</thead>\n<tbody>\n';
      
      // Generate data rows
      const rowsArray = rows.trim().split('\n');
      rowsArray.forEach((row: string) => {
        const cells = row.split('|').map((cell: string) => cell.trim());
        tableHTML += '<tr>\n';
        cells.forEach((cell: string, i: number) => {
          if (cell !== undefined) {
            const align = alignmentCells[i] || 'text-left';
            tableHTML += `<td class="border border-slate-300 px-4 py-2 ${align}">${cell}</td>\n`;
          }
        });
        tableHTML += '</tr>\n';
      });
      
      tableHTML += '</tbody>\n</table></div>';
      return tableHTML;
    }
  );
  
  // Process headers
  formattedText = formattedText
    .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mt-5 mb-3">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>');
  
  // Process lists
  formattedText = formattedText
    .replace(/^\s*\d+\.\s+(.*$)/gm, '<li class="ml-6 list-decimal">$1</li>')
    .replace(/^\s*[\-\*]\s+(.*$)/gm, '<li class="ml-6 list-disc">$1</li>');
  
  // Replace consecutive list items with proper list elements
  formattedText = formattedText
    .replace(/<\/li>\n<li class="ml-6 list-decimal">/g, '</li><li class="ml-6 list-decimal">')
    .replace(/<\/li>\n<li class="ml-6 list-disc">/g, '</li><li class="ml-6 list-disc">')
    .replace(/<li class="ml-6 list-decimal">(.+?)(<\/li>)+/g, '<ol class="list-decimal pl-4 my-2">$&</ol>')
    .replace(/<li class="ml-6 list-disc">(.+?)(<\/li>)+/g, '<ul class="list-disc pl-4 my-2">$&</ul>');
  
  // Process bold and italic
  formattedText = formattedText
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\_\_(.+?)\_\_/g, '<strong>$1</strong>')
    .replace(/\_([^_]+)\_/g, '<em>$1</em>');
  
  // Process links
  formattedText = formattedText.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g, 
    '<a href="$2" target="_blank" class="text-blue-500 hover:underline">$1</a>'
  );
  
  // Replace newlines with <br> tags outside of code blocks
  formattedText = formattedText.replace(/\n/g, '<br>');
  
  return formattedText;
};

// Add this function after the formatMarkdown function
const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text).catch(err => {
    console.error('Failed to copy text: ', err);
  });
};

const ChatbotPage: React.FC = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [role, setRole] = useState<'general' | 'mahasiswa'>('general');
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandAnimation, setExpandAnimation] = useState<'entering' | 'exiting' | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<any | null>(null); // Use 'any' or define a StrapiUser interface if needed
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]); // Initialize as empty, will be fetched

  const fullscreenRef = useRef<HTMLDivElement>(null);

  const fetchSuggestedTopicsFromStrapi = async () => {

    try {
      // Using the endpoint from your feedback and AdminDashboard
      const response = await fetch(`${API_BASE_URL}/api/pertanyaan-chatbots`);
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status}`);
      }
      const data: { data: StrapiChatbotQuestion[] } = await response.json();
      if (data && data.data) {
        // Sort by 'urutan' attribute, direct access
        const sortedQuestions = data.data.sort((a, b) => (a.urutan || 0) - (b.urutan || 0));
        setSuggestedTopics(sortedQuestions.map(q => q.teksPertanyaan)); // Direct access to teksPertanyaan
      } else {
        setSuggestedTopics([]);
      }
    } catch (error) {
      console.error("Error fetching suggested topics:", error);
      setSuggestedTopics([]); // Fallback to empty or could use a default static list
      toast({
        title: "Gagal Memuat Topik Saran",
        description: "Tidak dapat mengambil topik saran dari server.",
        variant: "destructive",
      });
    } finally {
      setLoadingTopics(false);
    }
  };

  useEffect(() => {
    fetchSuggestedTopicsFromStrapi(); // Fetch topics on mount

    // Load user from localStorage
    const token = localStorage.getItem('token');
    const userString = localStorage.getItem('user');
    if (token && userString) {
      try {
        const parsedUser = JSON.parse(userString);
        setUser(parsedUser);
        setIsAuthenticated(true);
        // Set role based on user type
        if (parsedUser?.role?.name === 'Mahasiswa IT') {
          setRole('mahasiswa');
        } else if (parsedUser?.role?.name === 'Admin IT') {
          // Admin can use either mode, default to general
          setRole('general');
        } else {
          setRole('general');
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
        // Clear invalid data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        setUser(null);
        setRole('general');
      }
    } else {
      setIsAuthenticated(false);
      setUser(null);
      setRole('general');
    }
  }, []);
  
  // Add new states for chat history
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [showChatHistory, setShowChatHistory] = useState(false);

  // Add a ref to track initial load
  const initialLoadRef = useRef(true);

  // Update useEffect to load chat history from localStorage on mount
  useEffect(() => {
    // Load chat sessions from localStorage
    const savedSessions = localStorage.getItem('chatSessions');
    if (savedSessions) {
      try {
        // Parse dates correctly from JSON
        const sessions = JSON.parse(savedSessions, (key, value) => {
          if (key === 'timestamp' || key === 'createdAt' || key === 'updatedAt') {
            return new Date(value);
          }
          return value;
        });
        setChatSessions(sessions);
      } catch (error) {
        console.error('Error loading chat sessions:', error);
      }
    }

    if (initialLoadRef.current) {
      // Create a new chat session if none exists
      if (!savedSessions || JSON.parse(savedSessions).length === 0) {
        const newSessionId = Date.now().toString();
        
        const newSession: ChatSession = {
          id: newSessionId,
          title: 'New Chat',
          messages: [], // Empty messages array to show suggestions
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        setChatSessions([newSession]);
        setActiveChatId(newSessionId);
        setMessages([]); // Set empty messages to show suggestions
        
        // Save to localStorage
        localStorage.setItem('chatSessions', JSON.stringify([newSession]));
      } else {
        // Set the most recent chat session as active
        const sessions = JSON.parse(savedSessions);
        const mostRecent = sessions.sort((a: ChatSession, b: ChatSession) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )[0];
        
        setActiveChatId(mostRecent.id);
        setMessages(mostRecent.messages);
      }
      
      initialLoadRef.current = false;
    }
  }, []);

  // Save chat sessions to localStorage whenever they change
  useEffect(() => {
    if (chatSessions.length > 0) {
      localStorage.setItem('chatSessions', JSON.stringify(chatSessions));
      
      // Add toast notification for chat saving (only show if there are changes)
      if (chatSessions.some(session => session.updatedAt > new Date(Date.now() - 1000))) {
        toast({
          title: "Chat Tersimpan",
          description: "Percakapan Anda telah disimpan secara otomatis",
          variant: "default",
        });
      }
    }
  }, [chatSessions]);

  const handleRoleChange = (newRole: 'general' | 'mahasiswa') => {
    // Allow Admin IT to switch between both modes
    if (user?.role?.name === 'Admin IT') {
      setRole(newRole);
      toast({
        title: "Mode Chatbot Berubah",
        description: newRole === 'general' 
          ? "Mode umum aktif" 
          : "Mode mahasiswa aktif dengan akses informasi khusus",
        variant: "default",
      });
      return;
    }

    // Only allow mahasiswa mode for authenticated Mahasiswa IT users
    if (newRole === 'mahasiswa' && (!isAuthenticated || user?.role?.name !== 'Mahasiswa IT')) {
      toast({
        title: "Akses Dibatasi",
        description: "Mode mahasiswa hanya tersedia untuk mahasiswa yang telah login",
        variant: "destructive",
      });
      return;
    }

    // Only allow general mode for non-Mahasiswa IT users
    if (newRole === 'general' && isAuthenticated && user?.role?.name === 'Mahasiswa IT') {
      toast({
        title: "Akses Dibatasi",
        description: "Mahasiswa hanya dapat menggunakan mode mahasiswa",
        variant: "destructive",
      });
      return;
    }

    setRole(newRole);
    toast({
      title: "Mode Chatbot Berubah",
      description: newRole === 'general' 
        ? "Mode umum aktif untuk semua pengunjung" 
        : "Mode mahasiswa aktif dengan akses informasi khusus",
      variant: "default",
    });
  };

  const createNewChat = () => {
    const newSessionId = Date.now().toString();
    // Remove the initial message so the suggestions bubble will appear
    
    const newSession: ChatSession = {
      id: newSessionId,
      title: 'New Chat',
      messages: [], // Empty messages array to show suggestions
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setChatSessions(prev => [newSession, ...prev]);
    setActiveChatId(newSessionId);
    setMessages([]); // Set empty messages to show suggestions
    
    // Add toast notification
    toast({
      title: "Chat Baru Dibuat",
      description: "Anda dapat mulai percakapan baru dengan Catty",
      variant: "default",
    });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    const currentInputMessage = inputMessage; // Store before clearing
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: currentInputMessage, // Use stored value
      timestamp: new Date(),
    };
    
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputMessage('');
    setIsTyping(true);
    
    // Update chat session with new message
    if (activeChatId) {
      const updatedSessions = chatSessions.map(session => {
        if (session.id === activeChatId) {
          // Generate title from first user message if this is the first one
          let updatedTitle = session.title;
          if (session.title === 'New Chat' && updatedMessages.filter(m => m.sender === 'user').length === 1) {
            updatedTitle = userMessage.text.length > 30 
              ? userMessage.text.substring(0, 30) + '...'
              : userMessage.text;
          }
          
          return {
            ...session,
            messages: updatedMessages,
            title: updatedTitle,
            updatedAt: new Date()
          };
        }
        return session;
      });
      
      setChatSessions(updatedSessions);
    }
    
    try {
      // Hitung waktu respons
      const startTime = performance.now();
      let responseTime = 0;

      // Call the Flask backend endpoint
      const response = await fetch(`${FLASK_API_BASE_URL}/api/chat`, { 
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest"
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

      // Hitung waktu respons
      const endTime = performance.now();
      responseTime = Math.round(endTime - startTime);
      
      // Add bot response
      setTimeout(async () => { // Make the callback async
        setIsTyping(false);
        const botResponse: Message = {
          id: Date.now().toString(),
          sender: 'bot',
          text: data.answer,
          timestamp: new Date(),
          responseTime: responseTime, 
        };
        
        const finalMessages = [...updatedMessages, botResponse];
        setMessages(finalMessages);
        
        // Update chat session with bot response
        if (activeChatId) {
          setChatSessions(prev => prev.map(session => {
            if (session.id === activeChatId) {
              return {
                ...session,
                messages: finalMessages,
                updatedAt: new Date()
              };
            }
            return session;
          }));
        }

        // Save chat history to Strapi
        if (isAuthenticated && user && user.id && activeChatId) {
          const token = localStorage.getItem('token');
          if (token) {
            const historyPayload = {
              data: {
                message: userMessage.text, // User's original message
                response: botResponse.text,
                userType: role,
                sessionId: activeChatId,
                responseTime: botResponse.responseTime,
                timestamp: botResponse.timestamp.toISOString(),
                users_permissions_user: user.id, // Assuming user.id is the Strapi user ID
              }
            };

            try {
              const historyResponse = await fetch(`${API_BASE_URL}/api/histories`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(historyPayload),
              });

              if (!historyResponse.ok) {
                const errorData = await historyResponse.json();
                console.error('Failed to save chat history to Strapi:', errorData);
                toast({
                  title: "Gagal Menyimpan Riwayat",
                  description: `Gagal menyimpan riwayat chat ke server: ${errorData.error?.message || historyResponse.statusText}`,
                  variant: "destructive",
                });
              } else {
                // console.log('Chat history saved to Strapi successfully');
                // Optionally, show a success toast, but it might be too noisy
                // toast({
                //   title: "Riwayat Tersimpan",
                //   description: "Riwayat chat berhasil disimpan ke server.",
                //   variant: "default",
                // });
              }
            } catch (strapiError) {
              console.error('Error saving chat history to Strapi:', strapiError);
              toast({
                title: "Kesalahan Jaringan (Riwayat)",
                description: "Gagal terhubung ke server untuk menyimpan riwayat chat.",
                variant: "destructive",
              });
            }
          }
        }
      }, 700); 
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

  // Function to select and load a chat session
  const selectChatSession = (sessionId: string) => {
    const session = chatSessions.find(s => s.id === sessionId);
    if (session) {
      setActiveChatId(sessionId);
      setMessages(session.messages);
      setShowChatHistory(false); // Close the history panel after selection
    }
  };

  // Function to delete a chat session
  const deleteChatSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering selectChatSession
    
    const updatedSessions = chatSessions.filter(s => s.id !== sessionId);
    setChatSessions(updatedSessions);
    
    // If we're deleting the active chat, switch to another one
    if (sessionId === activeChatId && updatedSessions.length > 0) {
      selectChatSession(updatedSessions[0].id);
    } else if (updatedSessions.length === 0) {
      // If no chats remain, create a new one
      createNewChat();
    }

    // Add toast notification for chat deletion
    toast({
      title: "Chat Dihapus",
      description: "Percakapan telah berhasil dihapus",
      variant: "destructive",
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const toggleExpand = () => {
    if (isExpanded) {
      // Start exit animation
      setExpandAnimation('exiting');
      // Wait for animation to complete before actually changing state
      setTimeout(() => {
        setIsExpanded(false);
        setExpandAnimation(null);
        document.body.style.overflow = 'auto'; // Restore scrolling
      }, 500);
    } else {
      // Start enter animation and immediately go fullscreen
      setExpandAnimation('entering');
      setIsExpanded(true);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded) {
        toggleExpand();
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
      // Restore scrolling on unmount
      document.body.style.overflow = 'auto';
    };
  }, [isExpanded]);

  const handleTopicSelect = (topic: string) => {
    setInputMessage(topic);
    // Optional: automatically send the message
    // handleSendMessage(topic);
  };

  // Update resetChat function to create a new chat session
  const resetChat = () => {
    createNewChat();
    setIsTyping(false);
    setInputMessage('');
  };

  // Function to format date for chat history display
  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const day = 24 * 60 * 60 * 1000;
    
    if (diff < day) {
      return 'Today';
    } else if (diff < 2 * day) {
      return 'Yesterday';
    } else {
      return new Intl.DateTimeFormat('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: now.getFullYear() !== date.getFullYear() ? 'numeric' : undefined 
      }).format(date);
    }
  };

  return (
    <div className="flex flex-col min-h-screen w-full overflow-hidden">
      <Header />
      
      <main className="flex-grow w-full mt-16">
        {/* Hero Section */}
        <section className="relative py-28 overflow-hidden super-gradient-bg">
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
          
          {/* Animated orbs */}
          <div className="orb orb-1 w-96 h-96 top-10 right-[10%]"></div>
          <div className="orb orb-2 w-80 h-80 bottom-20 left-[5%]"></div>
          <div className="orb orb-3 w-72 h-72 top-1/3 left-1/4"></div>
          
          {/* 3D elements */}
          <div className="absolute opacity-20 w-full h-full">
            <div className="absolute top-[20%] left-[10%] w-20 h-20 border-4 border-white/30 rounded-xl transform rotate-12 animate-pulse"></div>
            <div className="absolute top-[40%] right-[15%] w-16 h-16 border-4 border-white/30 rounded-full transform rotate-45 animate-pulse" style={{animationDelay: '1s'}}></div>
            <div className="absolute bottom-[25%] left-[30%] w-24 h-24 border-4 border-white/30 rounded-lg transform -rotate-12 animate-pulse" style={{animationDelay: '0.5s'}}></div>
          </div>
          
          {/* Particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <div 
                key={i}
                className="absolute rounded-full bg-white/50"
                style={{
                  width: `${Math.random() * 6 + 2}px`,
                  height: `${Math.random() * 6 + 2}px`,
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  opacity: Math.random() * 0.5 + 0.3,
                  animation: `float ${Math.random() * 10 + 10}s linear infinite`,
                  animationDelay: `${Math.random() * 5}s`
                }}
              ></div>
            ))}
          </div>
          
          <div className="container-content relative z-10 mx-auto px-4 h-full">
            <div className="flex flex-col items-center justify-center h-full">
              {/* Cool animated badge */}
              <div className="mb-10 scale-in" style={{ animationDelay: '0.3s' }}>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-violet-600 rounded-full blur-md animate-pulse"></div>
                  <Badge 
                    variant="outline" 
                    className="rounded-full bg-white/10 backdrop-blur-md text-white border-white/20 px-5 py-2 text-sm relative shadow-xl"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-violet-600/20 rounded-full opacity-30"></div>
                    <div className="flex items-center relative z-10">
                      <div className="mr-2 bg-white/20 rounded-full p-1">
                        <Sparkles className="h-4 w-4 text-blue-100" />
                      </div>
                      <span className="font-medium tracking-wide">POWERED BY AI</span>
                    </div>
                  </Badge>
                </div>
              </div>
              
              {/* Main title with custom animations */}
              <div className="text-center mb-8 scale-in" style={{ animationDelay: '0.6s' }}>
                <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-4 drop-shadow-lg">
                  <span className="inline-block transform hover:scale-105 transition-transform">C</span>
                  <span className="inline-block transform hover:scale-105 transition-transform">A</span>
                  <span className="inline-block transform hover:scale-105 transition-transform">T</span>
                  <span className="inline-block transform hover:scale-105 transition-transform">T</span>
                  <span className="inline-block transform hover:scale-105 transition-transform">Y</span>
                  <span className="inline-block transform hover:scale-105 transition-transform mx-2"> </span>
                  <span className="inline-block transform hover:scale-105 transition-transform relative">
                    <span className="bg-gradient-to-r from-blue-300 via-indigo-300 to-violet-300 text-transparent bg-clip-text">DTI ITS</span>
                    <div className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-blue-300 to-violet-300 rounded-full"></div>
                  </span>
                </h1>
              </div>
              
              {/* Animated subtitle */}
              <div className="text-center mb-12 max-w-3xl mx-auto scale-in" style={{ animationDelay: '0.9s' }}>
                <p className="text-xl md:text-2xl text-white leading-relaxed">
                  Asisten virtual berbasis AI untuk menjelajahi segala hal tentang
                  <span className="relative ml-2">
                    <span className="bg-gradient-to-r from-blue-200 to-violet-200 text-transparent bg-clip-text font-semibold">Departemen Teknologi Informasi ITS</span>
                    <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-blue-200 to-violet-200 opacity-70"></span>
                  </span>
                </p>
              </div>
              
              {/* Animated feature cards */}
              <div className="flex flex-wrap justify-center gap-6 mt-6 mb-16 w-full max-w-4xl mx-auto">
                {[
                  { icon: Brain, title: "Knowledge Base", description: "Information about the knowledge base.", delay: "1.2s" },
                  { icon: Zap, title: "Instant Answers", description: "Get instant answers to your queries.", delay: "1.4s" },
                  { icon: Sparkles, title: "Smart Responses", description: "Smart responses tailored to your questions.", delay: "1.6s" }
                ].map((feature, index) => (
                  <FeatureCard 
                    key={index} 
                    title={feature.title} 
                    description={feature.description} 
                    icon={feature.icon} 
                  />
                ))}
              </div>
              
              {/* Chat now button with hover effect */}
              <div className="scale-in" style={{ animationDelay: '1.8s' }}>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-violet-500 rounded-full blur opacity-60 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
                  <button className="relative px-8 py-3 bg-black rounded-full leading-none flex items-center">
                    <span className="flex items-center justify-center pl-1">
                      <Bot className="w-5 h-5 text-blue-400 mr-2" />
                      <span className="text-white font-medium">Mulai Chat Sekarang</span>
                    </span>
                    <span className="ml-3 flex items-center text-indigo-400 group-hover:text-indigo-300 transition-colors">
                      <span className="mr-1">→</span>
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bottom Wave with advanced animation */}
          <div className="absolute -bottom-1 left-0 right-0 overflow-hidden leading-0 z-10">
            <div className="relative h-20">
              <svg 
                className="absolute bottom-0 w-full"
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 1440 320"
                preserveAspectRatio="none"
              >
                <path 
                  fill="#f8fafc" 
                  fillOpacity="1" 
                  d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,117.3C672,107,768,117,864,144C960,171,1056,213,1152,202.7C1248,192,1344,128,1392,96L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                  className="wave-animation"
                >
                </path>
              </svg>
              <svg 
                className="absolute bottom-0 w-full opacity-70" 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 1440 320"
                preserveAspectRatio="none"
                style={{ transform: 'translateX(10%) scale(1.1)' }}
              >
                <path 
                  fill="#f8fafc" 
                  fillOpacity="0.5" 
                  d="M0,160L48,165.3C96,171,192,181,288,176C384,171,480,149,576,160C672,171,768,213,864,213.3C960,213,1056,171,1152,144C1248,117,1344,107,1392,101.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                  className="wave-animation-delay"
                >
                </path>
              </svg>
            </div>
          </div>
        </section>
        
        {/* Chatbot Interface Section */}
        <section className="py-12 bg-slate-50 relative">
          <div className="container-content mx-auto px-4">
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              {/* Features Column */}
              <div className="lg:w-1/3 space-y-8 relative">
                <div className="relative mb-8 rise-in" style={{ animationDelay: '0.1s' }}>
                  <div className="h-12 w-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg absolute -top-6 -left-6 flex items-center justify-center transform rotate-12">
                    <Bot className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900 ml-6 pt-2">Fitur <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Catty DTI</span></h2>
                  <div className="h-1 w-20 bg-gradient-to-r from-blue-500 to-violet-500 rounded-full mt-2 ml-6"></div>
                </div>

                <p className="text-slate-600 rise-in" style={{ animationDelay: '0.2s' }}>
                  Asisten pintar berbasis AI yang dirancang khusus untuk membantu calon mahasiswa dan pengunjung mengetahui lebih banyak tentang Departemen Teknologi Informasi ITS.
                </p>
                
                <div className="space-y-6 mt-8">
                  {[
                    {
                      title: "Informasi Program Studi",
                      description: "Tanyakan tentang kurikulum, mata kuliah, dan spesialisasi di Teknologi Informasi ITS.",
                      icon: Brain,
                      delay: "0.3s",
                      gradient: "from-blue-600 to-blue-500"
                    },
                    {
                      title: "Fasilitas & Laboratorium",
                      description: "Ketahui lebih lanjut tentang fasilitas modern dan lab penelitian yang tersedia.",
                      icon: Zap,
                      delay: "0.4s",
                      gradient: "from-indigo-600 to-violet-500"
                    },
                    {
                      title: "Prestasi & Keunggulan",
                      description: "Pelajari prestasi mahasiswa dan keunggulan departemen di tingkat nasional dan internasional.",
                      icon: Wand2,
                      delay: "0.5s",
                      gradient: "from-violet-600 to-purple-500"
                    }
                  ].map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <div 
                        key={index} 
                        className="feature-card rounded-xl overflow-hidden shadow-md border border-slate-100 p-1 rise-in"
                        style={{ animationDelay: feature.delay }}
                      >
                        <div className="bg-white rounded-lg p-5">
                          <div className="flex items-start space-x-4">
                            <div className={`icon-container p-3 rounded-xl bg-gradient-to-br ${feature.gradient} text-white mr-4 shadow-md`}>
                              <Icon className="w-6 h-6" />
                            </div>
                            <div>
                              <h3 className="font-bold text-lg text-slate-800">{feature.title}</h3>
                              <p className="text-slate-600 text-sm mt-1 leading-relaxed">{feature.description}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-12 p-6 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-xl border border-blue-100 shadow-inner rise-in" style={{ animationDelay: '0.6s' }}>
                  <h3 className="font-bold text-blue-800 mb-4 flex items-center">
                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <HelpCircle className="h-4 w-4 text-blue-600" />
                    </div>
                    Cara Menggunakan
                  </h3>
                  
                  <div className="space-y-4">
                    {[
                      "Ketik pertanyaan tentang Departemen Teknologi Informasi ITS",
                      "Tekan tombol kirim atau tekan Enter",
                      "Dapatkan jawaban langsung dari AI yang terlatih dengan pengetahuan departemen"
                    ].map((step, index) => (
                      <div key={index} className="flex items-center group cursor-pointer hover:bg-white/60 p-2 rounded-lg transition-colors">
                        <div className="relative">
                          <div className="absolute inset-0 bg-blue-200 rounded-full opacity-20 animate-pulse group-hover:opacity-50"></div>
                          <div className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-medium relative z-10 transition-transform group-hover:scale-110">
                            {index + 1}
                          </div>
                        </div>
                        <div className="ml-4 text-slate-700 font-medium group-hover:text-blue-700 transition-colors">{step}</div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-blue-100">
                    <div className="flex items-center text-blue-600">
                      <InfoIcon className="h-4 w-4 mr-2" />
                      <span className="text-sm font-medium">Semakin spesifik pertanyaan Anda, semakin akurat jawaban yang akan diberikan.</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 bg-gradient-to-br from-indigo-900 to-blue-900 rounded-xl p-6 text-white shadow-xl overflow-hidden relative rise-in" style={{ animationDelay: '0.7s' }}>
                  <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600 opacity-10 rounded-full -mr-10 -mt-10"></div>
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400 opacity-10 rounded-full -ml-10 -mb-10"></div>
                  
                  <h3 className="font-bold text-xl mb-3 flex items-center">
                    <Sparkles className="h-5 w-5 mr-2 text-blue-300" />
                    Kelebihan Catty DTI
                  </h3>
                  
                  <ul className="space-y-3 relative z-10">
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-blue-300 mr-2 mt-0.5 shrink-0" />
                      <span>Akses 24/7 untuk informasi akurat dan terverifikasi</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-blue-300 mr-2 mt-0.5 shrink-0" />
                      <span>Jawaban cepat tanpa perlu menunggu email atau telepon</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-blue-300 mr-2 mt-0.5 shrink-0" />
                      <span>Pengetahuan komprehensif tentang program studi dan fasilitas</span>
                    </li>
                  </ul>
                  
                  <div className="mt-4 py-3 px-4 bg-white/10 rounded-lg backdrop-blur-sm">
                    <div className="flex items-center">
                      <Badge className="bg-blue-500 hover:bg-blue-600 px-2 mr-2">BARU</Badge>
                      <span className="text-sm font-medium">Mode Mahasiswa untuk akses informasi khusus</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Chatbot Interface */}
              <div 
                className={`lg:w-2/3 relative z-10 transition-all duration-500 ease-in-out ${
                  isExpanded ? '' : 'transform hover:translate-y-[-5px]'
                }`}
              >
                {isExpanded && (
                  <div 
                    className={`fixed inset-0 z-40 fullscreen-overlay ${
                      expandAnimation === 'entering' ? 'fullscreen-enter' : 
                      expandAnimation === 'exiting' ? 'fullscreen-exit' : ''
                    }`}
                    onClick={toggleExpand}
                  />
                )}
                
                <div 
                  ref={fullscreenRef}
                  className={`
                    bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden 
                    flex flex-col transition-all duration-300 transform relative glow-effect
                    ${isExpanded 
                      ? 'fixed inset-0 m-auto h-[90vh] w-[90vw] max-h-[800px] md:max-w-6xl md:w-5/6 lg:w-4/5 xl:w-3/4 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2' 
                      : 'h-[600px] hover:shadow-2xl hover:border-blue-200'
                    }
                    ${expandAnimation === 'entering' ? 'fullscreen-enter' : 
                      expandAnimation === 'exiting' ? 'fullscreen-exit' : ''}
                  `}
                >
                  {/* Chat History Sidebar - Visible only when showChatHistory is true */}
                  {showChatHistory && (
                    <div className="absolute left-0 top-0 bottom-0 w-72 bg-white border-r border-slate-200 z-20 shadow-lg transition-all duration-300 transform translate-x-0">
                      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
                        <h3 className="font-semibold text-slate-700">Chat History</h3>
                        <button 
                          onClick={() => setShowChatHistory(false)}
                          className="p-1 rounded-full hover:bg-slate-200 transition-colors"
                        >
                          <X className="h-4 w-4 text-slate-500" />
                        </button>
                      </div>
                      
                      <div className="p-3">
                        <button
                          onClick={createNewChat}
                          className="w-full py-2 px-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg mb-4 flex items-center justify-center hover:shadow-md transition-all"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          New Chat
                        </button>
                      </div>
                      
                      <div className="overflow-y-auto h-[calc(100%-108px)] custom-scrollbar">
                        {chatSessions.length === 0 ? (
                          <div className="p-4 text-center text-slate-500">
                            No chat history yet
                          </div>
                        ) : (
                          <div className="space-y-1 p-2">
                            {chatSessions.map(session => (
                              <div 
                                key={session.id} 
                                className={`p-3 rounded-lg cursor-pointer transition-colors hover:bg-slate-100 ${activeChatId === session.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                                onClick={() => selectChatSession(session.id)}
                              >
                                <div className="flex justify-between items-start">
                                  <div className="max-w-[80%]">
                                    <h4 className="font-medium text-slate-800 truncate">{session.title}</h4>
                                    <p className="text-xs text-slate-500 mt-1">{formatDate(new Date(session.updatedAt))}</p>
                                  </div>
                                  <button
                                    onClick={(e) => deleteChatSession(session.id, e)}
                                    className="p-1 rounded-full hover:bg-slate-200 text-slate-400 hover:text-red-500 transition-colors"
                                    title="Delete chat"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                                <p className="text-xs text-slate-500 mt-1 truncate">
                                  {session.messages.length} messages
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Chatbot Header */}
                  <div className={`
                    animated-gradient-bg p-4 text-white flex justify-between items-center fullscreen-header
                    ${isExpanded ? 'border-b border-white/10' : ''}
                  `}>
                    <div className="flex items-center">
                      {/* History button */}
                      <button
                        onClick={() => setShowChatHistory(!showChatHistory)}
                        className="h-8 w-8 bg-white/20 rounded-full flex items-center justify-center mr-3 hover:bg-white/30 transition-colors"
                        title="Chat history"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      
                      <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center mr-3 floaty-icon">
                        <Bot className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base md:text-lg">Catty DTI</h3>
                        <p className="text-xs text-blue-100">Asisten Virtual Departemen Teknologi Informasi</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isExpanded && (
                        <>
                          <div className="flex space-x-2">
                            <Button 
                              onClick={() => handleRoleChange('general')} 
                              size="sm" 
                              variant={role === 'general' ? 'default' : 'outline'} 
                              className={`rounded-full text-xs transition-all duration-300 ${role === 'general' ? 'bg-white text-blue-700 shadow-lg' : 'bg-white/10 text-white border-white/30 hover:bg-white/20'}`}
                            >
                              Mode Umum
                            </Button>
                           
                            <Button
                              onClick={() => handleRoleChange('mahasiswa')}
                              size="sm"
                              variant={role === 'mahasiswa' ? 'default' : 'outline'}
                              className={`rounded-full text-xs transition-all duration-300 ${role === 'mahasiswa' ? 'bg-white text-violet-700 shadow-lg' : 'bg-white/10 text-white border-white/30 hover:bg-white/20'}`}
                              disabled={!isAuthenticated || (user?.role?.name !== 'Mahasiswa IT' && user?.role?.name !== 'Admin IT')}
                            >
                              Mode Mahasiswa
                            </Button>
                          </div>
                          <button
                            onClick={resetChat}
                            className="flex items-center space-x-1 px-2 py-1 text-xs bg-white/10 hover:bg-white/20 rounded-full text-white transition-all duration-300"
                            title="Start new chat"
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            <span>New Chat</span>
                          </button>
                        </>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand();
                        }}
                        className="bg-white/10 text-white hover:bg-white/20 rounded-full h-8 w-8 transition-all duration-300"
                      >
                        {isExpanded ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Chatbot Messages */}
                  <div className={`flex-grow overflow-y-auto p-6 ${isExpanded ? 'md:px-12' : ''} space-y-6 bg-gradient-to-b from-slate-50 to-white custom-scrollbar`}>
                    {messages.length === 0 && (
                      <div className="p-4 flex flex-col items-center fade-in">
                        <div className="mb-8 text-center">
                          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-violet-500 rounded-full mx-auto flex items-center justify-center mb-6 floaty-icon shadow-lg">
                            <Bot className="h-10 w-10 text-white" />
                          </div>
                          <h2 className="text-2xl font-semibold mb-3 bg-gradient-to-r from-blue-700 to-violet-700 bg-clip-text text-transparent">Selamat Datang di Catty DTI</h2>
                          <p className="text-slate-500 max-w-xl mx-auto">Hai! Saya adalah asisten virtual Program Studi Teknologi Informasi ITS. Tanyakan apa saja yang ingin Anda ketahui tentang jurusan kami.</p>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-3xl w-full mb-8">
                          {suggestedTopics.map((topic, index) => (
                            <button
                              key={index}
                              onClick={() => handleTopicSelect(topic)}
                              className="px-4 py-3 bg-gradient-to-r from-slate-50 to-slate-100 hover:from-blue-50 hover:to-violet-50 border border-slate-200 rounded-xl text-left text-sm transition-all duration-300 shadow-sm hover:shadow-md scale-in flex items-start"
                              style={{ animationDelay: `${index * 0.1}s` }}
                            >
                              <div className="bg-blue-100 text-blue-600 rounded-full p-1 mr-2 mt-0.5 flex-shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <span className="text-slate-700">{topic}</span>
                            </button>
                          ))}
                        </div>
                        
                        <div className="p-5 bg-gradient-to-r from-blue-50 to-violet-50 rounded-lg border border-blue-100 max-w-lg mx-auto w-full shadow-sm">
                          <h3 className="font-medium text-blue-800 mb-3 flex items-center">
                            <Sparkles className="h-5 w-5 mr-2 text-blue-500" />
                            Coba tanyakan tentang:
                          </h3>
                          <ul className="space-y-3 text-sm text-slate-700">
                            <li className="flex items-center bg-white/50 p-2 rounded-md hover:bg-white/80 transition-colors">
                              <span className="bg-blue-100 text-blue-600 rounded-full p-1 mr-3 flex-shrink-0">
                                <Check className="h-3 w-3" />
                              </span>
                              <span>"Apa saja bidang peminatan di Departemen Teknologi Informasi?"</span>
                            </li>
                            <li className="flex items-center bg-white/50 p-2 rounded-md hover:bg-white/80 transition-colors">
                              <span className="bg-blue-100 text-blue-600 rounded-full p-1 mr-3 flex-shrink-0">
                                <Check className="h-3 w-3" />
                              </span>
                              <span>"Bagaimana prospek kerja lulusan Teknologi Informasi?"</span>
                            </li>
                            <li className="flex items-center bg-white/50 p-2 rounded-md hover:bg-white/80 transition-colors">
                              <span className="bg-blue-100 text-blue-600 rounded-full p-1 mr-3 flex-shrink-0">
                                <Check className="h-3 w-3" />
                              </span>
                              <span>"Berapa biaya kuliah di Teknologi Informasi ITS?"</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    )}
                    {messages.map((message, index) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} ${message.sender === 'user' ? 'message-user' : 'message-bot'}`}
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div
                          className={`max-w-[85%] ${
                            message.sender === 'user'
                              ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-2xl rounded-tr-none shadow-lg'
                              : 'bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-tl-none shadow-md hover:shadow-lg transition-shadow'
                          } p-4 transform transition-transform hover:scale-[1.01]`}
                        >
                          <div className="flex items-center mb-1">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${
                                message.sender === 'user'
                                  ? 'bg-white/20'
                                  : 'bg-gradient-to-r from-blue-100 to-blue-200'
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
                              {message.sender === 'user' ? 'Kamu' : 'Catty IT'}
                            </span>
                          </div>
                          <div className="whitespace-pre-wrap">
                            {message.sender === 'bot' ? (
                              <div className="relative">
                                <div 
                                  className="prose prose-sm max-w-none"
                                  dangerouslySetInnerHTML={{
                                    __html: formatMarkdown(message.text)
                                  }}
                                />
                                <div className="absolute top-0 right-0 flex space-x-1">
                                  <button
                                    onClick={() => {
                                      copyToClipboard(message.text);
                                      setCopiedMessageId(message.id);
                                      setTimeout(() => setCopiedMessageId(null), 2000);
                                    }}
                                    className="p-1 text-slate-400 hover:text-blue-500 transition-colors hover:bg-blue-50 rounded-full"
                                    title="Copy to clipboard"
                                  >
                                    <Copy className="h-4 w-4" />
                                    {copiedMessageId === message.id && (
                                      <span className="absolute -top-8 right-0 bg-slate-900 text-white text-xs px-2 py-1 rounded scale-in">
                                        Copied!
                                      </span>
                                    )}
                                  </button>
                                </div>
                                {message.responseTime && (
                                  <div className="text-xs mt-2 text-slate-400 flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                    </svg>
                                    <span title="Waktu respons">Respons: {message.responseTime}ms</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              message.text
                            )}
                          </div>
                          <div
                            className={`text-xs mt-2 text-right ${
                              message.sender === 'user' ? 'text-blue-100/70' : 'text-slate-400'
                            }`}
                          >
                            {new Date(message.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {isTyping && (
                      <div className="flex justify-start fade-in">
                        <div className="bg-white border border-slate-200 text-slate-500 rounded-2xl rounded-tl-none p-4 shadow-sm max-w-[85%]">
                          <div className="flex items-center mb-1">
                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                              <Bot className="h-3 w-3 text-blue-600" />
                            </div>
                            <span className="text-xs text-slate-500">Catty DTI</span>
                          </div>
                          <div className="flex space-x-2">
                            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse typing-dot"></div>
                            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse typing-dot"></div>
                            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse typing-dot"></div>
                          </div>
                        </div>
                      </div>
                    )}
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
                        className="flex-grow border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-full py-6 pl-4 pr-4 transition-all duration-300 border-pulse"
                      />
                      <Button
                        onClick={handleSendMessage}
                        className="animated-gradient-bg text-white px-5 rounded-full hover:shadow-lg transition-all hover:opacity-90 disabled:opacity-50"
                        disabled={isTyping || !inputMessage.trim()}
                      >
                        <Send className="h-5 w-5" />
                      </Button>
                    </div>
                    <div className="mt-2 text-xs text-slate-500 text-center">
                      <span>Catty akan menjawab pertanyaan tentang Departemen Teknologi Informasi ITS</span>
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
                Catty memanfaatkan model bahasa terkini yang diintegrasikan dengan basis pengetahuan khusus tentang Departemen Teknologi Informasi ITS
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

