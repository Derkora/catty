import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, GraduationCap, Book, Calendar, Settings, ChevronLeft, ChevronRight, 
  Bell, FileText, Folder, Users, HelpCircle, BarChart 
} from 'lucide-react';

interface SidebarProps {
  isMobile?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isMobile = false }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [showTooltips, setShowTooltips] = useState(false);
  const location = useLocation();
  
  // Menunda tampilnya tooltip untuk animasi yang lebih mulus
  useEffect(() => {
    if (collapsed) {
      const timer = setTimeout(() => {
        setShowTooltips(true);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setShowTooltips(false);
    }
  }, [collapsed]);

  const navItems = [
    { path: '/dashboard', name: 'Dashboard', icon: <Home size={20} /> },
    { path: '/courses', name: 'Mata Kuliah', icon: <Book size={20} /> },
    { path: '/schedule', name: 'Jadwal', icon: <Calendar size={20} /> },
    { path: '/assignments', name: 'Tugas', icon: <FileText size={20} /> },
    { path: '/exams', name: 'Ujian', icon: <GraduationCap size={20} /> },
    { path: '/resources', name: 'Materi', icon: <Folder size={20} /> },
    { path: '/reports', name: 'Laporan', icon: <BarChart size={20} /> },
    { path: '/messages', name: 'Pesan', icon: <Bell size={20} />, badge: 3 },
    { path: '/students', name: 'Mahasiswa', icon: <Users size={20} /> },
  ];

  const bottomNavItems = [
    { path: '/help', name: 'Bantuan', icon: <HelpCircle size={20} /> },
    { path: '/settings', name: 'Pengaturan', icon: <Settings size={20} /> },
  ];

  if (isMobile) {
    return (
      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 z-40 animate-fade-in">
        <div className="flex justify-around p-3">
          {navItems.slice(0, 5).map((item) => (
            <NavLink 
              key={item.path} 
              to={item.path}
              className={({ isActive }: { isActive: boolean }) => 
                `flex flex-col items-center space-y-1 px-2 py-1 rounded-md transition-all ${
                  isActive 
                    ? 'text-blue-600' 
                    : 'text-slate-600 hover:text-blue-500'
                }`
              }
            >
              <div className="relative">
                {item.icon}
                {item.badge && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{item.name}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    );
  }

  return (
    <div 
      className={`h-screen flex flex-col bg-gradient-to-b from-slate-900 to-slate-800 text-white transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      } group fixed left-0 top-0 shadow-xl border-r border-slate-700 z-30`}
    >
      {/* Logo dan Header */}
      <div className="px-6 py-6 flex items-center justify-between border-b border-slate-700/50">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="flex-shrink-0 relative h-10 w-10 rounded-full bg-gradient-to-r from-blue-600 to-violet-600 p-0.5 shadow-glow">
            <div className="absolute inset-0 rounded-full bg-blue-600 animate-pulse opacity-60"></div>
            <div className="h-full w-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
              <img src="/logo-its.png" alt="ITS Logo" className="h-6 w-6 object-cover" />
            </div>
          </div>
          <div className={`transition-opacity duration-200 ${collapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
            <h1 className="font-bold text-lg text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">
              ITS Campus
            </h1>
            <p className="text-xs text-slate-400">Portal Akademik</p>
          </div>
        </div>
        <button 
          onClick={() => setCollapsed(!collapsed)} 
          className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-700/50 transition-colors"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigasi Utama */}
      <div className="flex-1 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        <ul className="px-3 space-y-2">
          {navItems.map((item, index) => (
            <li key={item.path} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
              <NavLink
                to={item.path}
                className={({ isActive }: { isActive: boolean }) => 
                  `flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all relative group/item
                  ${isActive 
                    ? 'bg-gradient-to-r from-blue-600/20 to-blue-500/10 text-white font-medium border-l-2 border-blue-500' 
                    : 'hover:bg-slate-700/50 text-slate-300 hover:text-white'
                  }`
                }
              >
                <div className="relative">
                  <div className="relative z-10">
                    {item.icon}
                  </div>
                  {item.badge && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className={`transition-all duration-200 ${collapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
                  {item.name}
                </span>
                
                {/* Tooltip saat collapsed */}
                {collapsed && showTooltips && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 bg-slate-800 text-white text-sm font-medium py-1.5 px-3 rounded-md opacity-0 group-hover/item:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
                    <div className="absolute top-1/2 -left-1 transform -translate-y-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
                    {item.name}
                  </div>
                )}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Divider */}
        <div className="mt-6 mb-4 mx-4">
          <div className="h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent opacity-50"></div>
        </div>

        {/* Bottom Navigation */}
        <ul className="px-3 space-y-1">
          {bottomNavItems.map((item, index) => (
            <li key={item.path} className="animate-fade-in" style={{ animationDelay: `${(index + navItems.length) * 50}ms` }}>
              <NavLink
                to={item.path}
                className={({ isActive }: { isActive: boolean }) => 
                  `flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all relative group/item
                  ${isActive 
                    ? 'bg-gradient-to-r from-slate-700/70 to-slate-700/30 text-white font-medium' 
                    : 'hover:bg-slate-700/50 text-slate-400 hover:text-white'
                  }`
                }
              >
                <div className="relative z-10">
                  {item.icon}
                </div>
                <span className={`transition-all duration-200 ${collapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
                  {item.name}
                </span>
                
                {/* Tooltip saat collapsed */}
                {collapsed && showTooltips && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 bg-slate-800 text-white text-sm font-medium py-1.5 px-3 rounded-md opacity-0 group-hover/item:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
                    <div className="absolute top-1/2 -left-1 transform -translate-y-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
                    {item.name}
                  </div>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer User Profile */}
      <div className={`p-4 border-t border-slate-700/50 mt-auto transition-all ${collapsed ? 'px-4' : 'px-4'}`}>
        <div className={`flex items-center space-x-3 ${collapsed ? 'justify-center' : ''}`}>
          <div className="relative h-9 w-9 rounded-full overflow-hidden bg-gradient-to-r from-blue-400 to-violet-400 p-0.5">
            <img 
              src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=120&q=80" 
              alt="User" 
              className="h-full w-full object-cover rounded-full"
            />
          </div>
          <div className={`transition-all duration-200 overflow-hidden ${collapsed ? 'w-0 opacity-0' : 'opacity-100'}`}>
            <h3 className="text-sm font-medium">Muhammad Zaki</h3>
            <p className="text-xs text-slate-400">Mahasiswa</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 