import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { loginUser, getAuthenticatedUser } from '../api/strapiApi'; // Added getAuthenticatedUser
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import axios from 'axios'; // Added axios
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Toaster } from '../components/ui/toaster';
import { useToast } from '../lib/hooks/use-toast';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [nrp, setNrp] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validasi form
    if (!nrp || !password) {
      toast({
        variant: "destructive",
        title: "Kesalahan",
        description: "NRP dan Password harus diisi",
      });
      return;
    }

    try {
      setLoading(true);
      
      const loginResponse = await loginUser(nrp, password);
      
      console.log("Login API response:", loginResponse); // Log the full login response

      if (loginResponse && loginResponse.jwt) {
        // Simpan token JWT ke localStorage
        localStorage.setItem('token', loginResponse.jwt);
        
        // Fetch full user details using the new token
        const userDetails = await getAuthenticatedUser();
        
        console.log("Authenticated user details:", userDetails); // Log the user details from /users/me

        if (userDetails) {
          localStorage.setItem('user', JSON.stringify(userDetails)); 
          
          toast({
            variant: "success",
            title: "Login Berhasil",
            description: "Selamat datang di dashboard mahasiswa",
          });
          
          setTimeout(() => {
            navigate('/dashboard'); 
          }, 1000);
        } else {
           // Handle case where fetching user details fails after successful login
           console.error("Failed to fetch user details after login.");
           localStorage.removeItem('token'); // Clear token if user details can't be fetched
           toast({
            variant: "destructive",
            title: "Login Gagal",
            description: "Gagal mendapatkan detail pengguna. Silakan coba lagi.",
          });
        }
      } else {
        toast({
          variant: "destructive",
          title: "Login Gagal",
          description: "NRP atau Password salah",
        });
      }
    } catch (err) {
      console.error('Login process error:', err); // Log the overall error
      // Check if it's an Axios error with a response
      if (axios.isAxiosError(err) && err.response) {
        console.error('Login error response data:', err.response.data);
        console.error('Login error response status:', err.response.status);
        // Display a more specific error message if available from Strapi
        const errorMessage = err.response.data?.error?.message || "Gagal terhubung ke server. Silakan coba lagi.";
         toast({
          variant: "destructive",
          title: "Terjadi Kesalahan",
          description: errorMessage,
        });
      } else {
         toast({
          variant: "destructive",
          title: "Terjadi Kesalahan",
          description: "Gagal terhubung ke server. Silakan coba lagi.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen w-full overflow-hidden">
      <Header />
      
      <main className="flex-grow flex items-center justify-center w-full relative py-12 mt-16">
        {/* Background Elements */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-slate-50 to-white">
          <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-white to-transparent"></div>
          <div className="absolute top-20 right-0 w-96 h-96 bg-blue-100 rounded-full filter blur-[120px] opacity-60"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-violet-100 rounded-full filter blur-[120px] opacity-60"></div>
          <div className="absolute inset-0 bg-[url('/images/dot-pattern.png')] opacity-5"></div>
        </div>
        
        <div className="relative w-full max-w-md px-4 animate-fade-in">
          <Card className="border-none shadow-xl shadow-blue-800/5 backdrop-blur-sm bg-white/90">
            <div className="absolute -top-14 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-600 to-violet-600 w-24 h-24 rounded-full shadow-lg flex items-center justify-center p-1">
              <div className="bg-white rounded-full h-full w-full flex items-center justify-center overflow-hidden">
                <img 
                  src="/logo-its.png" 
                  alt="ITS Logo" 
                  className="h-16 transition-transform hover:scale-110 duration-300"
                />
              </div>
            </div>
            
            <CardHeader className="space-y-1 pt-12">
              <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                Login Mahasiswa
              </CardTitle>
              <CardDescription className="text-center">
                Masukkan NRP dan Password untuk mengakses Dashboard Mahasiswa
              </CardDescription>
            </CardHeader>
            
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nrp" className="text-gray-700">NRP</Label>
                  <Input
                    id="nrp"
                    type="text"
                    value={nrp}
                    onChange={(e) => setNrp(e.target.value)}
                    placeholder="Masukkan NRP Anda"
                    autoComplete="username"
                    required
                    className="border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition-all rounded-md"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-gray-700">Password</Label>
                    <a href="#" className="text-xs text-blue-600 hover:text-violet-600 hover:underline transition-colors">
                      Lupa Password?
                    </a>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan Password Anda"
                    autoComplete="current-password"
                    required
                    className="border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition-all rounded-md"
                  />
                </div>
                
                <div className="flex items-center space-x-2 mt-4">
                  <input
                    type="checkbox"
                    id="remember"
                    className="w-4 h-4 text-blue-600 bg-gray-100 rounded border-gray-300 focus:ring-2 focus:ring-blue-200"
                  />
                  <label htmlFor="remember" className="text-sm text-gray-600">
                    Ingat saya
                  </label>
                </div>
              </CardContent>
              
              <CardFooter className="flex flex-col space-y-4 pb-6">
                <Button 
                  type="submit" 
                  variant="primary" 
                  className="w-full text-white shadow-lg shadow-blue-700/20 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 transition-all rounded-md h-11" 
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Memproses...
                    </span>
                  ) : 'Masuk'}
                </Button>
                
                <div className="text-center text-sm text-gray-500">
                  <span>Belum memiliki akun? </span>
                  <a href="#" className="text-blue-600 hover:text-violet-600 hover:underline transition-colors">
                    Hubungi Admin
                  </a>
                </div>
              </CardFooter>
            </form>
          </Card>

          {/* Additional Decoration */}
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-gradient-to-r from-blue-500/10 to-violet-500/10 rounded-full blur-2xl -z-10"></div>
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-gradient-to-r from-violet-500/10 to-blue-500/10 rounded-full blur-2xl -z-10"></div>
        </div>
      </main>
      
      <Footer />
      <Toaster />
    </div>
  );
};

export default LoginPage;
