import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { loginUser, getAuthenticatedUser } from '../api/strapiApi';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Toaster } from '../components/ui/toaster';
import { useToast } from '../lib/hooks/use-toast';
import { Eye, EyeOff, BookOpen } from 'lucide-react';

// Modern Logo Component with Subtle Animation
const ITLogo = () => (
  <div className="flex items-center justify-center group">
    <span 
      className="text-5xl font-bold text-blue-600 transform transition-all duration-500 group-hover:scale-110"
    >
      I
    </span>
    <span 
      className="text-5xl font-bold text-black transform transition-all duration-500 group-hover:scale-110"
    >
      T
    </span>
  </div>
);

// Particle Background with knowledge and study icons
const ParticleBackground = () => {
  useEffect(() => {
    // Setup if needed
  }, []);

  const blobs = [...Array(10)].map((_, i) => ({
    id: i,
    size: Math.random() * 150 + 50,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 10,
    duration: Math.random() * 15 + 10,
    opacity: Math.random() * 0.5 + 0.2,
    borderRadius: Math.random() * 50 + 25
  }));

  const MIN_ICON_DISTANCE_PERCENT = 15; // Minimum distance in viewport percentage
  const MAX_PLACEMENT_ATTEMPTS = 20;
  const NUM_ICONS = 5;

  interface IconData {
    id: number;
    x: number;
    y: number;
    delay: number;
    duration: number;
    opacity: number;
    size: number;
  }

  const generatedIcons: IconData[] = [];

  for (let i = 0; i < NUM_ICONS; i++) {
    let currentX: number = 0; // Initialize to satisfy TypeScript
    let currentY: number = 0; // Initialize to satisfy TypeScript
    let placementAttempts = 0;
    let positionValid = false;

    while (!positionValid && placementAttempts < MAX_PLACEMENT_ATTEMPTS) {
      currentX = Math.random() * 90 + 5; // Generate between 5% and 95% to avoid edges
      currentY = Math.random() * 90 + 5; // Generate between 5% and 95% to avoid edges
      positionValid = true; 

      for (const placedIcon of generatedIcons) {
        const distance = Math.sqrt(
          Math.pow(currentX - placedIcon.x, 2) + Math.pow(currentY - placedIcon.y, 2)
        );
        if (distance < MIN_ICON_DISTANCE_PERCENT) {
          positionValid = false;
          break;
        }
      }
      placementAttempts++;
    }

    generatedIcons.push({
      id: i + blobs.length,
      x: currentX,
      y: currentY,
      delay: Math.random() * 8,
      duration: Math.random() * 12 + 8,
      opacity: Math.random() * 0.5 + 0.5,
      size: 60 + Math.random() * 20,
    });
  }
  const icons = generatedIcons;

  return (
    <div className="absolute inset-0 overflow-hidden">
      {blobs.map(blob => (
        <motion.div
          key={blob.id}
          className="absolute bg-white/20 blur-xl"
          style={{
            width: blob.size,
            height: blob.size,
            left: `${blob.x}%`,
            top: `${blob.y}%`,
            opacity: blob.opacity
          }}
          animate={{
            x: [0, 15, 0],
            y: [0, -20, 0],
            borderRadius: [`${blob.borderRadius}%`, `${100 - blob.borderRadius}%`, `${blob.borderRadius}%`]
          }}
          transition={{
            duration: blob.duration,
            delay: blob.delay,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      ))}

      {icons.map(icon => (
        <motion.div
          key={icon.id}
          className="absolute"
          style={{
            left: `${icon.x}%`,
            top: `${icon.y}%`,
            opacity: icon.opacity
          }}
          animate={{ scale: [1, 1.3, 1] }}
          transition={{
            duration: icon.duration,
            delay: icon.delay,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          <BookOpen size={icon.size} className="text-white/80" />
        </motion.div>
      ))}
    </div>
  );
};

const LoginPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [nrp, setNrp] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState({ nrp: '', password: '' });

  const validateNrp = (value: string): string => {
    if (!value.trim()) return 'NRP tidak boleh kosong';
    if (!/^[a-zA-Z0-9]+$/.test(value)) return 'NRP hanya boleh berisi huruf dan angka';
    return '';
  };

  const validatePassword = (value: string): string => {
    if (!value) return 'Password tidak boleh kosong';
    if (value.length < 6) return 'Password minimal 6 karakter';
    return '';
  };

  const handleNrpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNrp(e.target.value);
    setFormError(prev => ({ ...prev, nrp: validateNrp(e.target.value) }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setFormError(prev => ({ ...prev, password: validatePassword(e.target.value) }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const nrpError = validateNrp(nrp);
    const passwordError = validatePassword(password);
    if (nrpError || passwordError) {
      setFormError({ nrp: nrpError, password: passwordError });
      return;
    }

    try {
      setLoading(true);
      const loginResponse = await loginUser(nrp, password);
      if (loginResponse?.jwt) {
        localStorage.setItem('token', loginResponse.jwt);
        const userDetails = await getAuthenticatedUser();
        if (userDetails) {
          localStorage.setItem('user', JSON.stringify(userDetails));
          toast({ variant: 'success', title: 'Login Berhasil', description: `Selamat datang kembali, ${userDetails.username || 'Mahasiswa'}!` });
          setTimeout(() => navigate('/dashboard'), 1000);
        } else {
          localStorage.removeItem('token');
          toast({ variant: 'destructive', title: 'Login Gagal', description: 'Gagal mendapatkan detail pengguna. Silakan coba lagi.' });
        }
      } else {
        toast({ variant: 'destructive', title: 'Login Gagal', description: 'NRP atau Password salah' });
      }
    } catch (err) {
      console.error(err);
      const message = axios.isAxiosError(err) && err.response?.data?.error?.message
        ? err.response.data.error.message
        : 'Gagal terhubung ke server. Silakan coba lagi.';
      toast({ variant: 'destructive', title: 'Terjadi Kesalahan', description: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <Header />
      <main className="flex-grow flex items-center justify-center relative h-full w-full py-12 mt-16">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-800 to-indigo-800">
          <ParticleBackground />
          <div className="absolute top-0 left-1/4 w-1/2 h-full bg-white/5 rotate-12 transform -translate-x-full animate-beam" />
        </div>
        <div className="relative w-full max-w-md px-4 z-10 animate-float-slow">
          <Card className="border-0 shadow-2xl bg-white/10 backdrop-blur-xl hover:shadow-purple-500/30 transform transition-all duration-500 rounded-2xl mt-20">  
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-white/5 pointer-events-none border border-white/20 rounded-2xl" />
            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-white/20 backdrop-blur-xl w-24 h-24 rounded-full shadow-lg flex items-center justify-center p-1 border border-white/30">
              <div className="bg-gradient-to-br from-indigo-100/80 to-purple-100/80 rounded-full h-full w-full flex items-center justify-center overflow-hidden shadow-inner">
                <ITLogo />
              </div>
            </div>
            <CardHeader className="space-y-1 pt-16 text-center relative">
              <CardTitle className="text-3xl font-bold text-white">Login Mahasiswa</CardTitle>
              <CardDescription className="text-indigo-100/80">Masukkan NRP/Username dan Password untuk mengakses Dashboard</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6 pt-6 relative z-10">
                {/* NRP Field */}
                <div className="space-y-2">
                  <Label htmlFor="nrp" className="text-indigo-100 font-medium">NRP/Username</Label>
                  <div className="relative">
                    <Input id="nrp" type="text" value={nrp} onChange={handleNrpChange} placeholder="Masukkan NRP Anda" autoComplete="username" required className={`bg-white/10 border-white/20 text-white placeholder-indigo-200/50 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-300/50 transition-all rounded-lg py-2.5 ${formError.nrp ? 'border-red-400' : ''}`} />
                    {formError.nrp && <p className="text-red-300 text-xs mt-1 ml-1">{formError.nrp}</p>}
                  </div>
                </div>
                {/* Password Field */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-indigo-100 font-medium">Password</Label>
                    <a href="#" className="text-xs text-indigo-200 hover:text-white hover:underline transition-colors">Lupa Password?</a>
                  </div>
                  <div className="relative">
                    <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={handlePasswordChange} placeholder="Masukkan Password Anda" autoComplete="current-password" required className={`bg-white/10 border-white/20 text-white placeholder-indigo-200/50 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-300/50 transition-all rounded-lg py-2.5 pr-10 ${formError.password ? 'border-red-400' : ''}`} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-indigo-200 hover:text-white">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    {formError.password && <p className="text-red-300 text-xs mt-1 ml-1">{formError.password}</p>}
                  </div>
                </div>
                {/* Remember Checkbox */}
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="remember" className="w-4 h-4 text-indigo-600 bg-white/20 rounded border-white/30 focus:ring-2 focus:ring-indigo-500/50" />
                  <label htmlFor="remember" className="text-sm text-indigo-100">Ingat saya</label>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4 pb-8 pt-2">
                <Button type="submit" className="w-full text-white font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all rounded-lg h-12 text-base relative overflow-hidden group" disabled={loading}>
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/30 to-white/0 -translate-x-full group-hover:animate-shimmer" />
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Memproses...
                    </span>
                  ) : 'Masuk'}
                </Button>
                <div className="text-center text-sm text-indigo-200">
                  <span>Belum memiliki akun? </span>
                  <a href="https://wa.me/6281234511434" target="_blank" rel="noopener noreferrer" className="font-medium text-white hover:text-indigo-200 hover:underline transition-colors">Hubungi Admin</a>
                </div>
              </CardFooter>
            </form>
          </Card>
        </div>
      </main>
      <Footer />
      <Toaster />
      <style>{`
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-20px); }}
        @keyframes shimmer { 100% { transform: translateX(100%);} }
        @keyframes beam { 0% { transform: translateX(-100%) rotate(12deg); opacity:0;} 20%,80%{opacity:1;} 100%{transform:translateX(100%) rotate(12deg); opacity:0;} }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-slow { animation: float 8s ease-in-out infinite; }
        .animate-shimmer { animation: shimmer 2s infinite; }
        .animate-beam { animation: beam 10s infinite; }
      `}</style>
    </div>
  );
};

export default LoginPage;
