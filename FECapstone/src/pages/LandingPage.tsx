import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { Button } from '../components/ui/button';
import { ArrowRight, Code, Database, Globe, Lock, Cpu } from 'lucide-react';

const customStyles = `
  @keyframes float {
      0% { transform: translateY(0px) translateX(0px); }
      50% { transform: translateY(-20px) translateX(10px); }
      100% { transform: translateY(0px) translateX(0px); }
  }
  
  @keyframes float-delay {
      0% { transform: translateY(0px) translateX(0px); }
      50% { transform: translateY(20px) translateX(-10px); }
      100% { transform: translateY(0px) translateX(0px); }
  }
  
  @keyframes float-slow {
      0% { transform: translateY(0px) translateX(0px); }
      50% { transform: translateY(-15px) translateX(-15px); }
      100% { transform: translateY(0px) translateX(0px); }
  }
  
  .animate-float {
      animation: float 8s ease-in-out infinite;
  }
  
  .animate-float-delay {
      animation: float-delay 9s ease-in-out infinite;
  }
  
  .animate-float-slow {
      animation: float-slow 12s ease-in-out infinite;
  }
  
  @keyframes particle-float {
      0% { transform: translateY(0) translateX(0); opacity: 0; }
      10% { opacity: 1; }
      90% { opacity: 1; }
      100% { transform: translateY(-100vh) translateX(100px); opacity: 0; }
  }
  
  .particle {
      animation: particle-float linear infinite;
  }
  
  .bg-grid-pattern {
      background-image: 
          linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px);
      background-size: 40px 40px;
  }
  
  @keyframes text-gradient {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
  }
  
  .animate-text-gradient {
      background-size: 200% auto;
      animation: text-gradient 5s ease-in-out infinite;
  }
  
  .fade-in-section {
      opacity: 0;
      transform: translateY(30px);
      transition: all 1s ease-out;
  }
  
  .fade-in-section.is-visible {
      opacity: 1;
      transform: translateY(0);
  }
  
  .fade-in-delay {
      transition-delay: 0.3s;
  }
  
  .perspective-container {
      perspective: 1000px;
  }
  
  .floating-card {
      transform-style: preserve-3d;
      animation: card-float 10s ease-in-out infinite;
  }
  
  @keyframes card-float {
      0% { transform: rotateX(5deg) rotateY(5deg); }
      50% { transform: rotateX(-5deg) rotateY(-5deg); }
      100% { transform: rotateX(5deg) rotateY(5deg); }
  }
  
  .floating-element {
      animation: float 6s ease-in-out infinite;
  }
  
  .floating-element-delay {
      animation: float-delay 7s ease-in-out infinite;
  }
`;

const LandingPage: React.FC = () => {
    const navigate = useNavigate(); // Initialize useNavigate
    const [visibleSection, setVisibleSection] = useState(false);
    
    useEffect(() => {
        setVisibleSection(true);
        
        const handleScroll = () => {
            const sections = document.querySelectorAll('.fade-in-section');
            sections.forEach(section => {
                const sectionTop = section.getBoundingClientRect().top;
                const isVisible = sectionTop < window.innerHeight - 100;
                if (isVisible) {
                    section.classList.add('is-visible');
                }
            });
        };
        
        window.addEventListener('scroll', handleScroll);
        
        // Trigger initially
        handleScroll();
        
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    return (
        <div className="flex flex-col min-h-screen w-full overflow-hidden">
            <style dangerouslySetInnerHTML={{ __html: customStyles }} />
            <Header />

            <main className="flex-grow w-full mt-16">
                <section className="relative min-h-[calc(100vh-4rem)] flex items-center w-full overflow-hidden bg-gradient-to-br from-blue-900 via-indigo-900 to-violet-900">
                    <div className="absolute inset-0">
                        <div className="absolute inset-0">
                            {[...Array(20)].map((_, i) => (
                                <div
                                    key={i}
                                    className="particle absolute rounded-full bg-white/20"
                                    style={{
                                        top: `${Math.random() * 100}%`,
                                        left: `${Math.random() * 100}%`,
                                        width: `${Math.random() * 7 + 3}px`,
                                        height: `${Math.random() * 7 + 3}px`,
                                        animationDelay: `${Math.random() * 5}s`,
                                        animationDuration: `${Math.random() * 10 + 15}s`,
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                    
                    <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-600 rounded-full filter blur-[100px] opacity-30 mix-blend-multiply animate-float"></div>
                    <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-violet-600 rounded-full filter blur-[80px] opacity-30 mix-blend-multiply animate-float-delay"></div>
                    <div className="absolute top-3/4 left-1/3 w-72 h-72 bg-indigo-500 rounded-full filter blur-[120px] opacity-20 mix-blend-multiply animate-float-slow"></div>
                    
                    <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
                    
                    <div className="container-content relative z-10 mx-auto px-4 py-12">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
                            <div className={`fade-in-section ${visibleSection ? 'is-visible' : ''} space-y-6 text-center lg:text-left`}>
                           
                                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight">
                                    Departemen <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-300 to-indigo-300 animate-text-gradient">Teknologi Informasi</span> ITS
                                </h1>
                                
                                <p className="text-xl text-blue-100/90 max-w-xl">
                                    Menyongsong era digital dengan inovasi, kurikulum terintegrasi, dan lima konsentrasi unggulan untuk menghasilkan lulusan profesional yang siap berinovasi di industri.
                                </p>
                                
                                <div className="flex flex-wrap gap-4 mt-8 justify-center lg:justify-start">
                                    <Button 
                                        size="lg" 
                                        className="rounded-full text-white shadow-lg shadow-blue-700/30 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 hover:shadow-xl transition-all group"
                                        onClick={() => navigate('/chatbot')} // Navigate to chatbot page
                                    >
                                        Akses Chatbot IT (Catty)
                                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </Button>
                                </div>
                                
                                <div className="pt-10 pb-4">
                                    <p className="text-sm text-blue-200 mb-4">Bidang Keahlian Utama:</p>
                                    <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                                        <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/20">
                                            <Lock className="w-4 h-4 text-blue-300 mr-2" />
                                            <span className="text-xs font-medium text-blue-100">Keamanan Siber</span>
                                        </div>
                                        <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/20">
                                            <Code className="w-4 h-4 text-blue-300 mr-2" />
                                            <span className="text-xs font-medium text-blue-100">Keamanan Aplikasi</span>
                                        </div>
                                        <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/20">
                                            <Database className="w-4 h-4 text-blue-300 mr-2" />
                                            <span className="text-xs font-medium text-blue-100">Integrasi Sistem</span>
                                        </div>
                                        <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/20">
                                            <Globe className="w-4 h-4 text-blue-300 mr-2" />
                                            <span className="text-xs font-medium text-blue-100">Layanan Awan</span>
                                        </div>
                                        <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/20">
                                            <Cpu className="w-4 h-4 text-blue-300 mr-2" />
                                            <span className="text-xs font-medium text-blue-100">Internet of Things</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className={`fade-in-section ${visibleSection ? 'is-visible fade-in-delay' : ''} hidden lg:block`}>
                                <div className="relative perspective-container">
                                    {/* Main Card */}
                                    <div className="floating-card bg-gradient-to-br from-blue-700 to-indigo-800 rounded-2xl p-6 shadow-2xl transform rotate-y-10 rotate-x-10 relative overflow-hidden border border-white/20 backdrop-blur-sm">
                                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500 rounded-full filter blur-3xl opacity-30"></div>
                                        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-violet-500 rounded-full filter blur-3xl opacity-30"></div>
                                        
                                        <div className="relative z-10">
                                            <div className="flex items-center mb-4">
                                                <img src="/images/logo-its.png" alt="ITS Logo" className="h-16 w-auto mr-4" />
                                                <div>
                                                    <h3 className="text-white text-xl font-bold">Teknologi Informasi</h3>
                                                    <p className="text-blue-200 text-sm">Institut Teknologi Sepuluh Nopember</p>
                                                </div>
                                            </div>
                                            
                                            <div className="mb-6 bg-white/10 p-4 rounded-lg">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-xs text-blue-200 mb-1">Program Studi</p>
                                                        <p className="text-white font-medium">Sarjana Teknologi Informasi</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-blue-200 mb-1">Akreditasi</p>
                                                        <p className="text-white font-medium">Unggul (A)</p>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="relative h-48 rounded-lg overflow-hidden mb-4">
                                                <img 
                                                    src="/images/dept-it.JPG" 
                                                    alt="Kegiatan Departemen IT" 
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/70 to-transparent"></div>
                                                <div className="absolute bottom-4 left-4 text-white">
                                                    <p className="font-bold">Fasilitas Modern</p>
                                                    <p className="text-sm text-blue-100">Laboratorium & Ruang Kuliah</p>
                                                </div>
                                            </div>
                                            
                                            <a href="https://www.its.ac.id/it/" className="block text-blue-200 text-sm hover:text-white transition-colors" target="_blank" rel="noopener noreferrer">
                                            https://www.its.ac.id/it/
                                            </a>
                                        </div>
                                    </div>
                                    
                                    {/* Floating Elements Around Main Card */}
                                    <div className="absolute -top-6 -right-12 floating-element">
                                        <div className="bg-gradient-to-r from-violet-500 to-purple-700 rounded-lg p-3 shadow-lg">
                                            <div className="flex items-center">
                                                <div className="h-8 w-8 bg-white/20 rounded-full flex items-center justify-center mr-2">
                                                    <Cpu className="h-4 w-4 text-white" />
                                                </div>
                                                <div>
                                                    <p className="text-white text-xs font-medium">10+ Dosen</p>
                                                    <p className="text-white/70 text-xs">Ahli di Bidangnya</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="absolute bottom-20 -left-14 floating-element-delay">
                                        <div className="bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg p-3 shadow-lg">
                                            <div className="flex items-center">
                                                <div className="h-8 w-8 bg-white/20 rounded-full flex items-center justify-center mr-2">
                                                    <Database className="h-4 w-4 text-white" />
                                                </div>
                                                <div>
                                                    <p className="text-white text-xs font-medium">Kurikulum</p>
                                                    <p className="text-white/70 text-xs">Terintegrasi Industri</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Bottom Wave */}
                    <div className="absolute -bottom-1 left-0 right-0">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 200">
                            <path fill="#f8fafc" fillOpacity="1" d="M0,128L60,117.3C120,107,240,85,360,90.7C480,96,600,128,720,138.7C840,149,960,139,1080,122.7C1200,107,1320,85,1380,74.7L1440,64L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"></path>
                        </svg>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default LandingPage;
