import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Toaster } from '../components/ui/toaster';
import { useToast } from '../lib/hooks/use-toast';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';

// Modern Logo Component with Subtle Animation (copied from LoginPage)
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

// Particle Background (copied from LoginPage)
const ParticleBackground = () => {
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

  const MIN_ICON_DISTANCE_PERCENT = 15;
  const MAX_PLACEMENT_ATTEMPTS = 20;
  const NUM_ICONS = 5;
  const generatedIcons = [];
  for (let i = 0; i < NUM_ICONS; i++) {
    let currentX = 0;
    let currentY = 0;
    let placementAttempts = 0;
    let positionValid = false;
    while (!positionValid && placementAttempts < MAX_PLACEMENT_ATTEMPTS) {
      currentX = Math.random() * 90 + 5;
      currentY = Math.random() * 90 + 5;
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

const RegisterPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [form, setForm] = useState({
    nrp: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState({ nrp: '', email: '', password: '', confirmPassword: '' });

  const validate = () => {
    let errors = { nrp: '', email: '', password: '', confirmPassword: '' };
    if (!form.nrp.trim()) errors.nrp = 'NRP tidak boleh kosong';
    if (!/^[a-zA-Z0-9]+$/.test(form.nrp)) errors.nrp = 'NRP hanya boleh berisi huruf dan angka';
    if (!form.email.trim()) errors.email = 'Email tidak boleh kosong';
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) errors.email = 'Format email tidak valid';
    if (!form.password) errors.password = 'Password tidak boleh kosong';
    else if (form.password.length < 6) errors.password = 'Password minimal 6 karakter';
    if (form.password !== form.confirmPassword) errors.confirmPassword = 'Konfirmasi password tidak cocok';
    return errors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setFormError(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validate();
    setFormError(errors);
    if (Object.values(errors).some(Boolean)) return;
    setLoading(true);
    try {
      // Register user (do NOT send confirmed/blocked fields, let Strapi handle default)
      await axios.post(`${API_BASE_URL}/api/auth/local/register`, {
        username: form.nrp, // Use NRP as username
        email: form.email,
        password: form.password,
      });
      // Try to login immediately after registration
      try {
        const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/local`, {
          identifier: form.nrp,
          password: form.password,
        });
        if (loginResponse.data && loginResponse.data.jwt) {
          // Check if user is confirmed
          if (loginResponse.data.user && loginResponse.data.user.confirmed) {
            localStorage.setItem('token', loginResponse.data.jwt);
            localStorage.setItem('user', JSON.stringify(loginResponse.data.user));
            toast({
              variant: 'success',
              title: 'Registrasi & Login Berhasil',
              description: `Selamat datang, ${loginResponse.data.user.username}!`,
            });
            setTimeout(() => navigate('/dashboard'), 1000);
          } else {
            toast({
              variant: 'success',
              title: 'Registrasi Berhasil',
              description: 'Akun Anda berhasil didaftarkan. Silakan tunggu persetujuan admin sebelum dapat login.',
            });
            setTimeout(() => navigate('/login'), 2000);
          }
        } else {
          toast({
            variant: 'success',
            title: 'Registrasi Berhasil',
            description: 'Akun Anda berhasil didaftarkan. Silakan tunggu persetujuan admin sebelum dapat login.',
          });
          setTimeout(() => navigate('/login'), 2000);
        }
      } catch (loginErr: any) {
        // If login fails, most likely not confirmed
        toast({
          variant: 'success',
          title: 'Registrasi Berhasil',
          description: 'Akun Anda berhasil didaftarkan. Silakan tunggu persetujuan admin sebelum dapat login.',
        });
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err: any) {
      let message = 'Gagal mendaftar. Silakan coba lagi.';
      if (axios.isAxiosError(err) && err.response?.data?.error?.message) {
        message = err.response.data.error.message;
      }
      toast({ variant: 'destructive', title: 'Registrasi Gagal', description: message });
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
              <CardTitle className="text-3xl font-bold text-white">Registrasi Mahasiswa</CardTitle>
              <CardDescription className="text-indigo-100/80">Isi data di bawah untuk mendaftar akun mahasiswa</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6 pt-6 relative z-10">
                <div className="space-y-2">
                  <Label htmlFor="nrp" className="text-indigo-100 font-medium">NRP</Label>
                  <Input id="nrp" name="nrp" type="text" value={form.nrp} onChange={handleChange} placeholder="Masukkan NRP" required className={`bg-white/10 border-white/20 text-white placeholder-indigo-200/50 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-300/50 transition-all rounded-lg py-2.5 ${formError.nrp ? 'border-red-400' : ''}`} />
                  {formError.nrp && <p className="text-red-300 text-xs mt-1 ml-1">{formError.nrp}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-indigo-100 font-medium">Email</Label>
                  <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="Masukkan email" required className={`bg-white/10 border-white/20 text-white placeholder-indigo-200/50 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-300/50 transition-all rounded-lg py-2.5 ${formError.email ? 'border-red-400' : ''}`} />
                  {formError.email && <p className="text-red-300 text-xs mt-1 ml-1">{formError.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-indigo-100 font-medium">Password</Label>
                  <Input id="password" name="password" type="password" value={form.password} onChange={handleChange} placeholder="Masukkan password" required className={`bg-white/10 border-white/20 text-white placeholder-indigo-200/50 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-300/50 transition-all rounded-lg py-2.5 ${formError.password ? 'border-red-400' : ''}`} />
                  {formError.password && <p className="text-red-300 text-xs mt-1 ml-1">{formError.password}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-indigo-100 font-medium">Konfirmasi Password</Label>
                  <Input id="confirmPassword" name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} placeholder="Ulangi password" required className={`bg-white/10 border-white/20 text-white placeholder-indigo-200/50 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-300/50 transition-all rounded-lg py-2.5 ${formError.confirmPassword ? 'border-red-400' : ''}`} />
                  {formError.confirmPassword && <p className="text-red-300 text-xs mt-1 ml-1">{formError.confirmPassword}</p>}
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
                  ) : 'Daftar'}
                </Button>
                <div className="text-center text-sm text-indigo-200">
                  <span>Sudah punya akun? </span>
                  <a href="/login" className="font-medium text-white hover:text-indigo-200 hover:underline transition-colors">Login</a>
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

export default RegisterPage;
