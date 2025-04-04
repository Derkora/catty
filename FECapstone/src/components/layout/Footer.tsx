import React from 'react';
import { Button } from '../ui/button';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-white w-full relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-violet-600 to-blue-600"></div>
      <div className="absolute top-0 left-1/4 w-1/2 h-40 bg-blue-600/20 rounded-full blur-[100px]"></div>
      <div className="absolute top-0 left-0 w-full h-32 bg-[url('/images/dot-pattern.png')] opacity-5"></div>
      
      <div className="container-content py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="animate-fade-in">
            <div className="flex items-center space-x-2 mb-4">
              <div className="relative h-8 w-8 overflow-hidden rounded-full bg-gradient-to-r from-blue-600 to-violet-600 p-0.5">
                <div className="h-full w-full rounded-full bg-slate-900 flex items-center justify-center">
                  <img src="/logo-its.png" alt="ITS Logo" className="h-6" />
                </div>
              </div>
              <h3 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                Departemen Teknologi Informasi
              </h3>
            </div>
            <p className="text-slate-300 mb-6">
              Gedung Tower 2, Lantai 2<br />
              Kampus ITS Sukolilo<br />
              Surabaya 60111, Indonesia
            </p>
            <div className="flex space-x-4 mt-6">
              <a 
                href="https://maps.google.com/?q=Gedung+Tower+2,+Kampus+ITS+Sukolilo,+Surabaya+60111" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-sm text-slate-400 hover:text-blue-400 flex items-center space-x-1 group"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Lihat di Peta</span>
              </a>
            </div>
          </div>
          
          <div className="animate-fade-in animate-delay-100">
            <h3 className="text-lg font-semibold mb-6 text-white">Navigasi Cepat</h3>
            <ul className="space-y-3">
              <li>
                <a href="/" className="text-slate-300 hover:text-blue-400 transition-colors flex items-center space-x-1 group">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-blue-500 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span>Beranda</span>
                </a>
              </li>
              <li>
                <a href="/program-studi" className="text-slate-300 hover:text-blue-400 transition-colors flex items-center space-x-1 group">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-blue-500 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span>Program Studi</span>
                </a>
              </li>
              <li>
                <a href="/tentang" className="text-slate-300 hover:text-blue-400 transition-colors flex items-center space-x-1 group">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-blue-500 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span>Tentang</span>
                </a>
              </li>
              <li>
                <a href="/kontak" className="text-slate-300 hover:text-blue-400 transition-colors flex items-center space-x-1 group">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-blue-500 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span>Kontak</span>
                </a>
              </li>
            </ul>
          </div>

          <div className="animate-fade-in animate-delay-200">
            <h3 className="text-lg font-semibold mb-6 text-white">Kontak</h3>
            <div className="space-y-4">
              <p className="text-slate-300 flex items-start space-x-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>+62 31 5994251-54</span>
              </p>
              <p className="text-slate-300 flex items-start space-x-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>tinformasi@its.ac.id</span>
              </p>
              <p className="text-slate-300 flex items-start space-x-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>+62 31 5996360</span>
              </p>
              <p className="text-slate-300 flex items-start space-x-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20l9-5-9-5-9 5 9 5z" />
                </svg>
                <span>+62 81234511434</span>
              </p>
            </div>
          </div>
          
          <div className="animate-fade-in animate-delay-300">
            <h3 className="text-lg font-semibold mb-6 text-white">Media Sosial</h3>
            <div className="flex space-x-4 mb-6">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-white hover:text-blue-400 transition-colors p-2 rounded-full bg-slate-800 hover:bg-slate-700">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-white hover:text-blue-400 transition-colors p-2 rounded-full bg-slate-800 hover:bg-slate-700">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                </svg>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-white hover:text-blue-400 transition-colors p-2 rounded-full bg-slate-800 hover:bg-slate-700">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="text-white hover:text-blue-400 transition-colors p-2 rounded-full bg-slate-800 hover:bg-slate-700">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
                  <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
                </svg>
              </a>
            </div>
            <h4 className="text-sm font-medium text-slate-400 mb-3">Berlangganan Newsletter</h4>
            <div className="flex">
              <input 
                type="email" 
                placeholder="Email Anda" 
                className="bg-slate-800 border-0 text-white text-sm rounded-l-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
              />
              <Button className="text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 rounded-r-md rounded-l-none px-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Button>
            </div>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-slate-800">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-slate-400 text-sm">&copy; {new Date().getFullYear()} Departemen Teknologi Informasi - Institut Teknologi Sepuluh Nopember</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-slate-400 hover:text-white text-sm">Privasi</a>
              <a href="#" className="text-slate-400 hover:text-white text-sm">Ketentuan</a>
              <a href="#" className="text-slate-400 hover:text-white text-sm">FAQ</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
