import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Toaster } from '../components/ui/toaster';
import { useToast } from '../lib/hooks/use-toast';
import { Bot, User, Send, Brain, Zap, Sparkles, Wand2, LucideIcon, X, Maximize, Minimize, Copy, ThumbsUp, ThumbsDown, RefreshCw, Check, HelpCircle, InfoIcon, CheckCircle } from 'lucide-react';

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
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes scaleIn {
    from { transform: scale(0.95); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
  
  @keyframes borderPulse {
    0% { border-color: rgba(59, 130, 246, 0.3); }
    50% { border-color: rgba(59, 130, 246, 0.6); }
    100% { border-color: rgba(59, 130, 246, 0.3); }
  }
  
  @keyframes glowPulse {
    0% { box-shadow: 0 0 5px rgba(99, 102, 241, 0.2); }
    50% { box-shadow: 0 0 15px rgba(99, 102, 241, 0.5); }
    100% { box-shadow: 0 0 5px rgba(99, 102, 241, 0.2); }
  }
  
  @keyframes rotateAndScale {
    0% { transform: rotate(0deg) scale(1); }
    50% { transform: rotate(180deg) scale(1.2); }
    100% { transform: rotate(360deg) scale(1); }
  }
  
  @keyframes movingGradient {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  
  @keyframes shiftHue {
    0% { filter: hue-rotate(0deg); }
    50% { filter: hue-rotate(30deg); }
    100% { filter: hue-rotate(0deg); }
  }
  
  @keyframes orbMove1 {
    0% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(30px, -20px) scale(1.1); }
    66% { transform: translate(-20px, 15px) scale(0.9); }
    100% { transform: translate(0, 0) scale(1); }
  }
  
  @keyframes orbMove2 {
    0% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(-25px, 25px) scale(1.15); }
    66% { transform: translate(15px, -30px) scale(0.85); }
    100% { transform: translate(0, 0) scale(1); }
  }
  
  @keyframes orbMove3 {
    0% { transform: translate(0, 0) rotate(0deg); }
    33% { transform: translate(15px, 15px) rotate(120deg); }
    66% { transform: translate(-20px, -10px) rotate(240deg); }
    100% { transform: translate(0, 0) rotate(360deg); }
  }
  
  @keyframes riseIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
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
  
  .animated-gradient-bg {
    background: linear-gradient(-45deg, #4f46e5, #3b82f6, #8b5cf6, #6366f1);
    background-size: 400% 400%;
    animation: gradient-shift 15s ease infinite;
  }
  
  .super-gradient-bg {
    background: linear-gradient(-45deg, #3b82f6, #8b5cf6, #ec4899, #8b5cf6, #3b82f6);
    background-size: 400% 400%;
    animation: gradient-shift 15s ease infinite, shiftHue 10s ease infinite;
  }
  
  .glass-effect {
    backdrop-filter: blur(10px);
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.18);
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  }
  
  .fade-in {
    animation: fadeIn 0.5s ease-out forwards;
  }
  
  .scale-in {
    animation: scaleIn 0.3s ease-out forwards;
  }
  
  .rise-in {
    animation: riseIn 0.8s ease-out forwards;
    opacity: 0;
  }
  
  .message-bot {
    animation: fadeIn 0.5s ease-out;
    transition: all 0.3s ease;
  }
  
  .message-user {
    animation: fadeIn 0.5s ease-out;
    transition: all 0.3s ease;
  }
  
  .floaty-icon {
    animation: float 3s ease-in-out infinite;
  }
  
  .border-pulse {
    animation: borderPulse 2s infinite;
  }
  
  .glow-effect {
    animation: glowPulse 2s infinite;
  }
  
  .orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(40px);
    opacity: 0.5;
    mix-blend-mode: screen;
  }
  
  .orb-1 {
    background: radial-gradient(circle, rgba(79, 70, 229, 0.8) 0%, rgba(79, 70, 229, 0) 70%);
    animation: orbMove1 20s ease-in-out infinite;
  }
  
  .orb-2 {
    background: radial-gradient(circle, rgba(139, 92, 246, 0.8) 0%, rgba(139, 92, 246, 0) 70%);
    animation: orbMove2 25s ease-in-out infinite;
  }
  
  .orb-3 {
    background: radial-gradient(circle, rgba(236, 72, 153, 0.8) 0%, rgba(236, 72, 153, 0) 70%);
    animation: orbMove3 30s ease-in-out infinite;
  }
  
  .stroke-animation {
    stroke-dasharray: 1000;
    stroke-dashoffset: 1000;
    animation: dash 5s ease-in-out forwards infinite;
  }
  
  @keyframes dash {
    from {
      stroke-dashoffset: 1000;
    }
    to {
      stroke-dashoffset: 0;
    }
  }
  
  .feature-card {
    transition: all 0.4s ease;
    position: relative;
    overflow: hidden;
    z-index: 1;
  }

  .feature-card::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(45deg, rgba(59, 130, 246, 0.15), rgba(139, 92, 246, 0.15));
    z-index: -1;
    transform: translateY(100%);
    transition: transform 0.6s cubic-bezier(0.23, 1, 0.32, 1);
  }

  .feature-card:hover::before {
    transform: translateY(0);
  }

  .feature-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 40px -15px rgba(79, 70, 229, 0.25);
  }

  .feature-card .icon-container {
    transition: all 0.4s ease;
  }

  .feature-card:hover .icon-container {
    transform: scale(1.15) rotate(10deg);
    background: linear-gradient(45deg, #4f46e5, #8b5cf6);
  }
  
  .typing-dot:nth-child(1) { animation-delay: 0s; }
  .typing-dot:nth-child(2) { animation-delay: 0.2s; }
  .typing-dot:nth-child(3) { animation-delay: 0.4s; }
  
  /* Custom scrollbar */
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(241, 245, 249, 0.5);
    border-radius: 10px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(148, 163, 184, 0.5);
    border-radius: 10px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(148, 163, 184, 0.8);
  }

  .fullscreen-overlay {
    backdrop-filter: blur(8px);
    background-color: rgba(15, 23, 42, 0.3);
    transition: all 0.5s cubic-bezier(0.19, 1, 0.22, 1);
  }

  .fullscreen-container {
    transition: all 0.5s cubic-bezier(0.19, 1, 0.22, 1);
  }

  .fullscreen-header {
    transition: all 0.3s ease;
  }

  .fullscreen-enter {
    animation: fullscreenEnter 0.5s forwards;
  }

  .fullscreen-exit {
    animation: fullscreenExit 0.5s forwards;
  }

  @keyframes fullscreenEnter {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes fullscreenExit {
    from {
      opacity: 1;
      transform: scale(1);
    }
    to {
      opacity: 0;
      transform: scale(0.9);
    }
  }
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

// Replace the formatMarkdown function with this enhanced version
const formatMarkdown = (text: string) => {
  if (!text) return '';
  
  // Process code blocks with syntax highlighting
  let formattedText = text.replace(
    /```([a-z]*)\n([\s\S]*?)```/g, 
    (_, language, code) => {
      return `<pre class="bg-slate-100 p-3 rounded-md overflow-x-auto"><code class="language-${language || 'plaintext'}">${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`;
    }
  );
  
  // Process inline code
  formattedText = formattedText.replace(
    /`([^`]+)`/g, 
    (_, code) => {
      return `<code class="bg-slate-100 px-1 py-0.5 rounded text-sm">${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code>`;
    }
  );
  
  // Process tables
  formattedText = formattedText.replace(
    /\|(.+)\|\n\|([-:]+[-| :]*)\|\n((.*\|.*\n)+)/g,
    (match, header, alignment, rows) => {
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
}

// Add this function after the formatMarkdown function
const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text).catch(err => {
    console.error('Failed to copy text: ', err);
  });
};

const ChatbotPage: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [role, setRole] = useState<'general' | 'mahasigma'>('general');
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandAnimation, setExpandAnimation] = useState<'entering' | 'exiting' | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [suggestedTopics] = useState([
    "What are the focus of the Information Technology department?",
    "Who is the head of the Information Technology department?",
    "When is the Information Technology department founded?",
    "What is the prospect of the Information Technology alumni?",
    "Why should I choose Information Technology department?",
  ]);
  const [ratedMessages, setRatedMessages] = useState<Record<string, 'up' | 'down'>>({});
  const fullscreenRef = useRef<HTMLDivElement>(null);

  // Add a ref to track initial load
  const initialLoadRef = useRef(true);

  // Update useEffect to only run once on component mount
  useEffect(() => {
    if (initialLoadRef.current) {
      setMessages([
        {
          id: '1',
          sender: 'bot',
          text: 'Halo! Saya adalah asisten virtual Program Studi Teknologi Informasi ITS. Apa yang ingin kamu ketahui tentang jurusan kami?',
          timestamp: new Date(),
        }
      ]);
      initialLoadRef.current = false;
    }
  }, []);

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

  // Update resetChat function to simply reset to empty array
  const resetChat = () => {
    setMessages([]);
    setIsTyping(false);
    setInputMessage('');
  };

  const handleRateResponse = (messageId: string, rating: 'up' | 'down') => {
    // Update local state
    setRatedMessages(prev => ({
      ...prev,
      [messageId]: rating
    }));
    
    // Here you would typically send this rating to your backend
    console.log(`Message ${messageId} rated ${rating}`);
    // Example backend call:
    // fetch('/api/rate-response', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ messageId, rating })
    // });
  };

  return (
    <div className="flex flex-col min-h-screen w-full overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
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
                  <span className="inline-block transform hover:scale-105 transition-transform">T</span>
                  <span className="inline-block transform hover:scale-105 transition-transform">A</span>
                  <span className="inline-block transform hover:scale-105 transition-transform">N</span>
                  <span className="inline-block transform hover:scale-105 transition-transform">Y</span>
                  <span className="inline-block transform hover:scale-105 transition-transform">A</span>
                  <span className="inline-block transform hover:scale-105 transition-transform">B</span>
                  <span className="inline-block transform hover:scale-105 transition-transform">O</span>
                  <span className="inline-block transform hover:scale-105 transition-transform">T</span>
                  <span className="inline-block transform hover:scale-105 transition-transform mx-2"> </span>
                  <span className="inline-block transform hover:scale-105 transition-transform relative">
                    <span className="bg-gradient-to-r from-blue-300 via-indigo-300 to-violet-300 text-transparent bg-clip-text">IT</span>
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
                  { icon: Brain, title: "Knowledge Base", delay: "1.2s" },
                  { icon: Zap, title: "Instant Answers", delay: "1.4s" },
                  { icon: Sparkles, title: "Smart Responses", delay: "1.6s" }
                ].map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div 
                      key={index} 
                      className="glass-effect px-6 py-4 rounded-xl transform hover:scale-105 transition-all duration-300 cursor-pointer fade-in"
                      style={{ animationDelay: feature.delay }}
                    >
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center mr-3">
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-white font-medium">{feature.title}</span>
                      </div>
                    </div>
                  );
                })}
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
                  <h2 className="text-3xl font-bold text-slate-900 ml-6 pt-2">Fitur <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Tanyabot ITS</span></h2>
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
                    Kelebihan Tanyabot
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
                      ? 'fixed inset-4 md:inset-10 z-50 fullscreen-container' 
                      : 'h-[600px] hover:shadow-2xl hover:border-blue-200'
                    }
                    ${expandAnimation === 'entering' ? 'fullscreen-enter' : 
                      expandAnimation === 'exiting' ? 'fullscreen-exit' : ''}
                  `}
                >
                  {/* Chatbot Header */}
                  <div className={`
                    animated-gradient-bg p-4 text-white flex justify-between items-center fullscreen-header
                    ${isExpanded ? 'border-b border-white/10' : ''}
                  `}>
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center mr-3 floaty-icon">
                        <Bot className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base md:text-lg">Tanyabot ITS</h3>
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
                              onClick={() => handleRoleChange('mahasigma')} 
                              size="sm" 
                              variant={role === 'mahasigma' ? 'default' : 'outline'} 
                              className={`rounded-full text-xs transition-all duration-300 ${role === 'mahasigma' ? 'bg-white text-violet-700 shadow-lg' : 'bg-white/10 text-white border-white/30 hover:bg-white/20'}`}
                            >
                              Mode Mahasiswa
                            </Button>
                          </div>
                          <button
                            onClick={resetChat}
                            className="flex items-center space-x-1 px-2 py-1 text-xs bg-white/10 hover:bg-white/20 rounded-full text-white transition-all duration-300"
                            title="Reset conversation"
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            <span>New Chat</span>
                          </button>
                        </>
                      )}
                      
                      {/* Always visible buttons */}
                      <div className="flex items-center gap-1">
                        {isExpanded && (
                          <button
                            onClick={resetChat}
                            className="flex items-center space-x-1 px-2 py-1 text-xs bg-white/10 hover:bg-white/20 rounded-full text-white transition-all duration-300"
                            title="Reset conversation"
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            <span className="hidden md:inline">New Chat</span>
                          </button>
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
                  </div>
                  
                  {/* Mode selector in fullscreen (visible only in fullscreen) */}
                  {isExpanded && (
                    <div className="border-b border-slate-100 bg-slate-50 py-2 px-4 flex justify-center">
                      <div className="flex space-x-3 items-center">
                        <span className="text-xs text-slate-500">Mode:</span>
                        <div className="bg-white rounded-full p-1 flex shadow-sm border border-slate-200">
                          <button
                            onClick={() => handleRoleChange('general')}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                              role === 'general' 
                                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-sm' 
                                : 'text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            Umum
                          </button>
                          <button
                            onClick={() => handleRoleChange('mahasigma')}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                              role === 'mahasigma' 
                                ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-sm' 
                                : 'text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            Mahasiswa
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                
                  {/* Chatbot Messages */}
                  <div className={`flex-grow overflow-y-auto p-6 ${isExpanded ? 'md:px-12' : ''} space-y-6 bg-gradient-to-b from-slate-50 to-white custom-scrollbar`}>
                    {messages.length === 0 && (
                      <div className="p-4 flex flex-col items-center fade-in">
                        <div className="mb-6 text-center">
                          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-violet-500 rounded-full mx-auto flex items-center justify-center mb-4 floaty-icon shadow-lg">
                            <Bot className="h-8 w-8 text-white" />
                          </div>
                          <h2 className="text-2xl font-semibold mb-2 bg-gradient-to-r from-blue-700 to-violet-700 bg-clip-text text-transparent">Selamat Datang di Tanyabot IT</h2>
                          <p className="text-slate-500">Tanyakan apa saja tentang Departemen Teknologi Informasi ITS</p>
                        </div>
                        <div className="flex flex-wrap gap-2 justify-center max-w-2xl">
                          {suggestedTopics.map((topic, index) => (
                            <button
                              key={index}
                              onClick={() => handleTopicSelect(topic)}
                              className="px-3 py-2 bg-gradient-to-r from-slate-50 to-slate-100 hover:from-blue-50 hover:to-violet-50 border border-slate-200 rounded-full text-sm transition-all duration-300 shadow-sm hover:shadow scale-in"
                              style={{ animationDelay: `${index * 0.1}s` }}
                            >
                              {topic}
                            </button>
                          ))}
                        </div>
                        
                        <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-violet-50 rounded-lg border border-blue-100 max-w-md mx-auto">
                          <h3 className="font-medium text-blue-800 mb-2 flex items-center">
                            <Sparkles className="h-4 w-4 mr-2 text-blue-500" />
                            Fitur Unggulan
                          </h3>
                          <ul className="space-y-2 text-sm text-slate-700">
                            <li className="flex items-center">
                              <span className="bg-blue-100 text-blue-600 rounded-full p-1 mr-2">
                                <Check className="h-3 w-3" />
                              </span>
                              <span>Bertanya tentang Program Studi</span>
                            </li>
                            <li className="flex items-center">
                              <span className="bg-blue-100 text-blue-600 rounded-full p-1 mr-2">
                                <Check className="h-3 w-3" />
                              </span>
                              <span>Informasi Fasilitas & Laboratorium</span>
                            </li>
                            <li className="flex items-center">
                              <span className="bg-blue-100 text-blue-600 rounded-full p-1 mr-2">
                                <Check className="h-3 w-3" />
                              </span>
                              <span>Kurikulum & Mata Kuliah</span>
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
                              {message.sender === 'user' ? 'Kamu' : 'Tanyabot IT'}
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
                                <div className="mt-2 flex items-center space-x-2 text-xs text-slate-500">
                                  <span>Was this helpful?</span>
                                  <button
                                    onClick={() => handleRateResponse(message.id, 'up')}
                                    className={`p-1 rounded-full hover:bg-slate-100 transition-colors ${ratedMessages[message.id] === 'up' ? 'text-green-500 bg-green-50' : ''}`}
                                    aria-label="Thumbs up"
                                  >
                                    <ThumbsUp className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => handleRateResponse(message.id, 'down')}
                                    className={`p-1 rounded-full hover:bg-slate-100 transition-colors ${ratedMessages[message.id] === 'down' ? 'text-red-500 bg-red-50' : ''}`}
                                    aria-label="Thumbs down"
                                  >
                                    <ThumbsDown className="h-3 w-3" />
                                  </button>
                                  {ratedMessages[message.id] && (
                                    <span className="text-xs fade-in">
                                      {ratedMessages[message.id] === 'up' ? 'Thanks for your feedback!' : 'Thanks for your feedback. We\'ll try to improve.'}
                                    </span>
                                  )}
                                </div>
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
                            {message.timestamp.toLocaleTimeString([], {
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
                            <span className="text-xs text-slate-500">Tanyabot IT</span>
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