import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-white w-full relative overflow-hidden">
      {/* Enhanced gradient border */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-violet-500 to-indigo-500"></div>
      
      {/* Improved background effects */}
      <div className="absolute top-0 left-1/3 w-2/3 h-48 bg-blue-600/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-1/2 h-32 bg-violet-600/10 rounded-full blur-3xl"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-[url('/images/dot-pattern.png')] opacity-3 mix-blend-overlay"></div>
      
      <div className="container mx-auto px-6 py-12 md:py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* First column with department info */}
          <div className="transform transition duration-500 hover:translate-y-1">
            <div className="flex items-center mb-6">
              <h3 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                Departemen Teknologi Informasi
              </h3>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              Gedung Tower 2, Lantai 2<br />
              Kampus ITS Sukolilo<br />
              Surabaya 60111, Indonesia
            </p>
            <div className="flex mt-6">
              <a 
                href="https://maps.google.com/?q=Gedung+Tower+2,+Kampus+ITS+Sukolilo,+Surabaya+60111" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg text-sm text-slate-300 hover:text-blue-300 flex items-center space-x-2 group transition-all duration-300 border border-slate-700/50 hover:border-blue-500/30"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400 group-hover:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Lihat di Peta</span>
              </a>
            </div>
          </div>

          {/* Second column with contact information */}
          <div className="transform transition duration-500 hover:translate-y-1">
            <h3 className="text-lg font-semibold mb-6 text-white relative inline-block">
              Kontak
              <span className="absolute -bottom-1 left-0 w-12 h-0.5 bg-blue-500/70"></span>
            </h3>
            <div className="space-y-5">
              <a href="tel:+62315994251" className="text-slate-300 hover:text-blue-300 flex items-start space-x-3 group transition duration-300">
                <div className="p-2 bg-slate-800/70 rounded-lg group-hover:bg-blue-900/20 transition duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400 group-hover:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <span className="text-sm pt-1">+62 31 5994251-54</span>
              </a>
              
              <a href="mailto:tinformasi@its.ac.id" className="text-slate-300 hover:text-blue-300 flex items-start space-x-3 group transition duration-300">
                <div className="p-2 bg-slate-800/70 rounded-lg group-hover:bg-blue-900/20 transition duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400 group-hover:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-sm pt-1">tinformasi@its.ac.id</span>
              </a>
              
              <a href="fax:+62315996360" className="text-slate-300 hover:text-blue-300 flex items-start space-x-3 group transition duration-300">
                <div className="p-2 bg-slate-800/70 rounded-lg group-hover:bg-blue-900/20 transition duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400 group-hover:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="text-sm pt-1">+62 31 5996360</span>
              </a>
              
              <a href="tel:+6281234511434" className="text-slate-300 hover:text-blue-300 flex items-start space-x-3 group transition duration-300">
                <div className="p-2 bg-slate-800/70 rounded-lg group-hover:bg-blue-900/20 transition duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400 group-hover:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20l9-5-9-5-9 5 9 5z" />
                  </svg>
                </div>
                <span className="text-sm pt-1">+62 81234511434</span>
              </a>
            </div>
          </div>
          
          {/* Empty columns to maintain grid structure */}
          <div className="hidden lg:block"></div>
          <div className="hidden lg:block"></div>
        </div>
        
        {/* Copyright section */}
        <div className="mt-12 pt-8 border-t border-slate-800/80">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-slate-400">© {new Date().getFullYear()} Departemen Teknologi Informasi - ITS</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;