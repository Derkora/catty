import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../ui/button';
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger,
} from '../ui/sheet';
import { 
  Menu, 
  X, 
  ChevronDown, 
  Home, 
  Bot, 
  Sparkles, 
  LogOut, 
  User, 
  LayoutDashboard, 

  Flame
} from 'lucide-react';
import { Badge } from '../ui/badge';

// Interface for user structure from Strapi
interface StrapiUser {
  id: number;
  username: string;
  email: string;
  role?: {
    id: number;
    name: string; 
    description: string;
    type: string;
  };
}

interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  children?: NavItem[];
  highlight?: boolean;
  new?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Beranda', href: '/', icon: <Home className="h-4 w-4" /> },
  { 
    label: 'Tanyabot AI', 
    href: '/chatbot', 
    icon: <Bot className="h-4 w-4" />,
    highlight: true,
    new: true
  },
];

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<StrapiUser | null>(null);

  // Check authentication status on mount and location change
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userString = localStorage.getItem('user');
    if (token && userString) {
      try {
        setUser(JSON.parse(userString));
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Error parsing user data:", error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        setUser(null);
      }
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }
  }, [location.pathname]);

  const handleScroll = () => {
    if (window.scrollY > 10) {
      setIsScrolled(true);
    } else {
      setIsScrolled(false);
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleDropdownClick = (label: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (openDropdown === label) {
      setOpenDropdown(null);
    } else {
      setOpenDropdown(label);
    }
  };

  const handleClickOutside = () => {
    setOpenDropdown(null);
  };

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setOpenDropdown(null);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
    navigate('/login');
    setIsMenuOpen(false);
  };



  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-500 ease-in-out ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-xl shadow-lg border-b border-gray-200/30'
          : 'bg-gradient-to-r from-blue-50/80 to-violet-50/80 backdrop-blur-md'
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3 md:gap-4">
            <Link to="/" className="flex items-center gap-2 group transition-all duration-300 transform hover:-translate-y-0.5">
              <div className="h-9 w-9 bg-gradient-to-br from-blue-600 to-violet-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all duration-300">
                <span className="text-white font-bold text-lg">IT</span>
              </div>
              <div className="hidden md:block">
                <h1 className="text-lg font-bold leading-tight bg-gradient-to-r from-blue-600 to-violet-700 bg-clip-text text-transparent transition-all duration-300 group-hover:brightness-110">Teknologi Informasi</h1>
                <p className="text-xs text-muted-foreground/90">Institut Teknologi Sepuluh Nopember</p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-3">
            {navItems.map((item) => (
              <React.Fragment key={item.label}>
                {item.children ? (
                  <div
                    className="relative"
                    onClick={(e) => handleDropdownClick(item.label, e)}
                  >
                    <Button
                      variant="ghost"
                      className={`flex items-center gap-2 transition-all duration-300 hover:bg-blue-100/70 rounded-full px-4 py-2 ${
                        location.pathname.startsWith(item.href)
                          ? 'bg-blue-100 text-blue-700 font-semibold' 
                          : 'hover:text-blue-700'
                      }`}
                    >
                      {item.icon}
                      {item.label}
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${openDropdown === item.label ? 'rotate-180' : ''}`} />
                    </Button>

                    {openDropdown === item.label && (
                      <div className="absolute top-full left-0 w-56 rounded-xl border border-gray-200/50 bg-white/95 backdrop-blur-md shadow-xl mt-2 py-2 z-50 overflow-hidden animate-in fade-in slide-in-from-top-3 duration-300">
                        {item.children.map((child) => (
                          <Link
                            key={child.label}
                            to={child.href}
                            className={`block px-4 py-2.5 hover:bg-blue-100 hover:text-blue-700 text-sm transition-colors duration-150 ${
                              location.pathname === child.href ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-gray-700'
                            }`}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Button
                    variant={item.highlight ? "default" : "ghost"}
                    asChild
                    className={`flex items-center gap-2 transition-all duration-300 rounded-full px-4 py-2 ${
                      item.highlight
                        ? 'bg-gradient-to-r from-blue-600 to-violet-600 hover:shadow-xl hover:brightness-110 text-white transform hover:scale-105'
                        : 'hover:bg-blue-100/70 hover:text-blue-700'
                    } ${
                      location.pathname === item.href
                        ? (item.highlight ? 'shadow-lg shadow-blue-500/30 ring-2 ring-blue-300 ring-offset-1' : 'bg-blue-100 text-blue-700 font-semibold')
                        : ''
                    }`}
                  >
                    <Link to={item.href} className="flex items-center gap-2">
                      {item.icon}
                      {item.label}
                      {item.highlight && <Sparkles className="h-3.5 w-3.5 ml-1 text-yellow-300" />}
                      {item.new && (
                        <Badge className="bg-red-500 text-white text-xs py-0 px-1.5 rounded-full ml-1">
                          Baru
                        </Badge>
                      )}
                    </Link>
                  </Button>
                )}
              </React.Fragment>
            ))}
          </nav>

          <div className="flex items-center space-x-2">
            {/* Desktop Auth Buttons & Dashboard Links */}
            <div className="hidden md:flex items-center gap-2">
              {isAuthenticated ? (
                <>
                  <div className="bg-blue-50 border border-blue-100 rounded-full py-1 px-3 flex items-center">
                    <User className="h-4 w-4 mr-2 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700 mr-1">
                      {user?.username || 'Pengguna'}
                    </span>
                  </div>
                  
                  {user?.role?.name === 'Admin IT' && (
                    <Button variant="ghost" size="sm" asChild className="hover:bg-blue-100/70 hover:text-blue-700 rounded-full transition-colors duration-200"> 
                      <Link to="/admin" className="flex items-center gap-1.5">
                        <LayoutDashboard className="h-4 w-4" /> Admin
                      </Link>
                    </Button>
                  )}
                  {user?.role?.name === 'Mahasiswa IT' && (
                     <Button variant="ghost" size="sm" asChild className="hover:bg-blue-100/70 hover:text-blue-700 rounded-full transition-colors duration-200"> 
                      <Link to="/dashboard" className="flex items-center gap-1.5">
                        <LayoutDashboard className="h-4 w-4" /> Dashboard
                      </Link>
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    onClick={handleLogout}
                    size="sm"
                    className="border-red-300 text-red-600 hover:border-red-400 hover:bg-red-50/80 hover:text-red-700 transition-all duration-300 rounded-full"
                  >
                    <LogOut className="h-4 w-4 mr-1.5" /> 
                    Keluar
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/login')}
                    size="sm"
                    className="border-blue-300 text-blue-700 hover:border-blue-400 hover:bg-blue-50/80 hover:text-blue-800 transition-all duration-300 rounded-full"
                  >
                    Masuk
                  </Button>
                  
                </>
              )}
            </div>

            {/* Mobile Menu */}
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" className="hover:bg-blue-100/70 rounded-full transition-colors duration-200"> 
                  {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] p-0 bg-white/95 backdrop-blur-xl border-l border-gray-200/50 shadow-xl">
                <div className="py-6 px-5">
                  {/* Mobile Header */}
                  <div className="flex items-center justify-start mb-8 border-b border-gray-200/70 pb-5">
                    <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-violet-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-500/20">
                      <span className="text-white font-bold text-lg">TI</span>
                    </div>
                    <div className="ml-3">
                      <h2 className="text-base font-semibold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">Teknologi Informasi</h2>
                      <p className="text-xs text-muted-foreground/90">Portal Pengetahuan</p>
                    </div>
                  </div>

                  {/* Mobile Navigation */}
                  <div className="space-y-2">
                    {navItems.map((item) => (
                      <div key={item.label} className="pb-1 mb-1">
                        {item.children ? (
                          <div className="space-y-1.5">
                            <div className="font-semibold flex items-center gap-2 text-gray-800 py-2 px-2 rounded-md">
                              {item.icon}
                              {item.label}
                            </div>
                            <div className="pl-5 space-y-1 py-1">
                              {item.children.map((child) => (
                                <Link
                                  key={child.label}
                                  to={child.href}
                                  className={`block text-sm py-2.5 px-3 rounded-lg hover:bg-blue-100/80 transition-colors duration-150 ${
                                    location.pathname === child.href ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-gray-600 hover:text-gray-900'
                                  }`}
                                  onClick={() => setIsMenuOpen(false)}
                                >
                                  {child.label}
                                </Link>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <Link
                            to={item.href}
                            className={`flex items-center gap-2.5 py-3 px-4 rounded-lg font-medium hover:bg-blue-100/80 transition-colors duration-150 ${
                              item.highlight ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-md shadow-blue-500/20' : 'text-gray-700 hover:text-gray-900'
                            } ${
                              location.pathname === item.href ? (item.highlight ? 'ring-2 ring-blue-300' : 'bg-blue-100 text-blue-700') : ''
                            }`}
                            onClick={() => setIsMenuOpen(false)}
                          >
                            {item.icon}
                            {item.label}
                            {item.highlight && <Sparkles className="h-3.5 w-3.5 ml-1 text-yellow-300" />}
                            {item.new && (
                              <Badge className="bg-red-500 text-white text-xs py-0 px-1.5 rounded-full ml-1">
                                Baru
                              </Badge>
                            )}
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Mobile Featured Section */}
                  <div className="mt-6 mb-6">
                    <div className="bg-gradient-to-r from-blue-100 to-violet-100 rounded-xl p-4 border border-blue-200/50">
                      <div className="flex items-center mb-2">
                        <Flame className="h-4 w-4 text-orange-500 mr-2" />
                        <h3 className="text-sm font-semibold text-blue-800">Terbaru</h3>
                      </div>
                      <p className="text-xs text-blue-700 mb-3">Lihat fitur dan konten terbaru dari Teknologi Informasi ITS</p>
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:shadow-lg hover:brightness-110 text-white rounded-lg"
                        onClick={() => {
                          navigate('/features');
                          setIsMenuOpen(false);
                        }}
                      >
                        Jelajahi
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mt-8 space-y-3 border-t border-gray-200/70 pt-5">
                    {isAuthenticated ? (
                      <>
                        <div className="flex items-center p-3 rounded-lg bg-blue-50 border border-blue-200 mb-4">
                          <User className="h-4 w-4 mr-2.5 text-blue-600" />
                          <span className="text-sm font-medium text-blue-700">{user?.username || 'Pengguna'}</span>
                        </div>
                        
                        {user?.role?.name === 'Admin IT' && (
                          <Button variant="outline" className="w-full justify-start gap-2 px-3 py-2.5 border-blue-200 hover:bg-blue-50/80 rounded-lg transition-colors duration-200" asChild>
                            <Link to="/admin" onClick={() => setIsMenuOpen(false)}>
                              <LayoutDashboard className="h-4 w-4 text-blue-600" /> Admin Dashboard
                            </Link>
                          </Button>
                        )}
                        {user?.role?.name === 'Mahasiswa IT' && (
                          <Button variant="outline" className="w-full justify-start gap-2 px-3 py-2.5 border-blue-200 hover:bg-blue-50/80 rounded-lg transition-colors duration-200" asChild>
                            <Link to="/dashboard" onClick={() => setIsMenuOpen(false)}>
                              <LayoutDashboard className="h-4 w-4 text-blue-600" /> Dashboard Mahasiswa
                            </Link>
                          </Button>
                        )}
                        
                        <Button
                          variant="outline"
                          className="w-full border-red-300 text-red-600 hover:border-red-400 hover:bg-red-50/80 hover:text-red-700 rounded-lg transition-all duration-300 py-2.5"
                          onClick={handleLogout}
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Keluar
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          className="w-full border-blue-300 text-blue-700 hover:border-blue-400 hover:bg-blue-50/80 hover:text-blue-800 rounded-lg transition-all duration-300 py-2.5"
                          onClick={() => {
                            navigate('/login');
                            setIsMenuOpen(false);
                          }}
                        >
                          Masuk
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
