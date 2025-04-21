import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../ui/button';
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger
} from '../ui/sheet';
import { Menu, X, ChevronDown, BookOpen, Home, Info, Bot, Sparkles } from 'lucide-react';
import { Badge } from '../ui/badge';

interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  children?: NavItem[];
  highlight?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Beranda', href: '/', icon: <Home className="h-4 w-4" /> },
  {
    label: 'Akademik', 
    href: '/akademik', 
    icon: <BookOpen className="h-4 w-4" />,
    children: [
      { label: 'Kurikulum', href: '/akademik/kurikulum' },
      { label: 'Bidang Keahlian', href: '/akademik/bidang-keahlian' },
      { label: 'Kalender Akademik', href: '/akademik/kalender' },
    ]
  },
  { label: 'Tentang', href: '/tentang', icon: <Info className="h-4 w-4" /> },
  { 
    label: 'Tanyabot AI', 
    href: '/chatbot', 
    icon: <Bot className="h-4 w-4" />, 
    highlight: true 
  },
];

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

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

  const handleDropdownClick = (label: string) => {
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

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/85 backdrop-blur-md shadow-lg' 
          : 'bg-transparent backdrop-blur-sm'
      }`}
    >
      <div className="container-content mx-auto">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 md:gap-4">
            <Link to="/" className="flex items-center gap-2 group transition-all duration-300">
              <div className="relative overflow-hidden h-9 w-auto rounded-full transition-all duration-300 group-hover:scale-105">
                <img src="/images/logo-its.png" alt="Logo ITS" className="h-full w-auto object-contain transition-transform duration-500 group-hover:scale-110" />
              </div>
              <div className="hidden md:block">
                <h1 className="text-lg font-bold leading-none bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent transition-all duration-300 group-hover:from-blue-500 group-hover:to-violet-500">Teknologi Informasi</h1>
                <p className="text-xs text-muted-foreground">Institut Teknologi Sepuluh Nopember</p>
              </div>
            </Link>
            
            <Badge variant="primary" className="hidden md:inline-flex ml-2 bg-gradient-to-r from-blue-600 to-violet-600 shadow-sm hover:shadow-md transition-all duration-300">
              Portal Pengetahuan
            </Badge>
          </div>

          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <React.Fragment key={item.label}>
                {item.children ? (
                  <div 
                    className="relative"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDropdownClick(item.label);
                    }}
                  >
                    <Button 
                      variant="ghost" 
                      className={`flex items-center gap-2 transition-all duration-300 hover:bg-blue-50 ${
                        location.pathname.startsWith(item.href) 
                          ? 'bg-blue-50 text-blue-600 font-medium' 
                          : 'hover:text-blue-600'
                      }`}
                    >
                      {item.icon}
                      {item.label} 
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${openDropdown === item.label ? 'rotate-180' : ''}`} />
                    </Button>

                    {openDropdown === item.label && (
                      <div className="absolute top-full left-0 w-56 rounded-md border bg-white/95 backdrop-blur-sm shadow-lg mt-1 py-1 z-50 overflow-hidden animate-in fade-in slide-in-from-top-5 duration-300">
                        {item.children.map((child) => (
                          <Link 
                            key={child.label}
                            to={child.href}
                            className={`block px-4 py-2 hover:bg-blue-50 hover:text-blue-600 text-sm ${
                              location.pathname === child.href ? 'bg-blue-50 text-blue-600 font-medium' : ''
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
                    className={`flex items-center gap-2 transition-all duration-300 ${
                      item.highlight 
                        ? 'bg-gradient-to-r from-blue-600 to-violet-600 hover:shadow-md text-white' 
                        : 'hover:bg-blue-50 hover:text-blue-600'
                    } ${
                      location.pathname === item.href 
                        ? (item.highlight ? 'shadow-md' : 'bg-blue-50 text-blue-600 font-medium') 
                        : ''
                    }`}
                  >
                    <Link to={item.href} className="flex items-center gap-2">
                      {item.icon}
                      {item.label}
                      {item.highlight && <Sparkles className="h-3 w-3 ml-1" />}
                    </Link>
                  </Button>
                )}
              </React.Fragment>
            ))}
          </nav>

          <div className="flex items-center space-x-2">
            <div className="hidden md:flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={() => navigate('/login')} 
                size="sm"
                className="border-blue-300 hover:border-blue-500 hover:bg-blue-50 transition-all duration-300"
              >
                Masuk
              </Button>
              <Button 
                variant="primary" 
                onClick={() => navigate('/register')} 
                size="sm"
                className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 shadow-sm hover:shadow-md transition-all duration-300"
              >
                Daftar
              </Button>
            </div>

            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" className="hover:bg-blue-50">
                  {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="p-0 bg-white/95 backdrop-blur-md border-l border-blue-100">
                <div className="py-6 px-4">
                  <div className="flex items-center justify-center mb-6">
                    <img src="/images/logo-its.png" alt="Logo ITS" className="h-12 w-auto" />
                    <div className="ml-2">
                      <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">Teknologi Informasi</h2>
                      <p className="text-xs text-muted-foreground">Portal Pengetahuan</p>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    {navItems.map((item) => (
                      <div key={item.label} className="border-b border-blue-50 pb-2 mb-2">
                        {item.children ? (
                          <div className="space-y-2">
                            <div className="font-medium flex items-center gap-2 text-blue-700 py-2">
                              {item.icon}
                              {item.label}
                            </div>
                            <div className="pl-6 space-y-1 bg-blue-50/50 rounded-md py-2">
                              {item.children.map((child) => (
                                <Link
                                  key={child.label}
                                  to={child.href}
                                  className={`block text-sm py-1.5 px-2 rounded hover:bg-blue-100 transition-colors ${
                                    location.pathname === child.href ? 'bg-blue-100 text-blue-700 font-medium' : ''
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
                            className={`flex items-center gap-2 py-2 font-medium hover:text-blue-700 transition-colors ${
                              item.highlight ? 'text-blue-600 bg-blue-50/50 rounded-md px-2' : ''
                            } ${
                              location.pathname === item.href ? 'text-blue-700' : ''
                            }`}
                            onClick={() => setIsMenuOpen(false)}
                          >
                            {item.icon}
                            {item.label}
                            {item.highlight && <Sparkles className="h-3 w-3 ml-1" />}
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 space-y-2">
                    <Button 
                      variant="outline" 
                      className="w-full border-blue-300 hover:border-blue-500 hover:bg-blue-50" 
                      onClick={() => {
                        navigate('/login');
                        setIsMenuOpen(false);
                      }}
                    >
                      Masuk
                    </Button>
                    <Button 
                      variant="primary" 
                      className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700"
                      onClick={() => {
                        navigate('/register');
                        setIsMenuOpen(false);
                      }}
                    >
                      Daftar
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/admin" className="text-sm font-medium hover:text-blue-600 transition-colors">
              Admin
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 