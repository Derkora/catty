import React, { useState, useEffect } from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { CheckCircle, Clock, BookOpen, Award, TrendingUp, Users, BarChart } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Simulasi loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Data dummy untuk statistik
  const stats = [
    { id: 1, title: 'IPK', value: '3.75', icon: <Award className="h-8 w-8 text-blue-500" />, change: '+0.05', trend: 'up' },
    { id: 2, title: 'SKS yang telah diambil', value: '96', icon: <BookOpen className="h-8 w-8 text-violet-500" />, change: '+24', trend: 'up' },
    { id: 3, title: 'Kehadiran', value: '98%', icon: <CheckCircle className="h-8 w-8 text-green-500" />, change: '+2%', trend: 'up' },
    { id: 4, title: 'Deadline Tugas', value: '4', icon: <Clock className="h-8 w-8 text-amber-500" />, change: '-2', trend: 'down' },
  ];

  // Data dummy untuk berita terbaru
  const latestActivities = [
    { id: 1, title: 'Tugas Algoritma Lanjut 2', type: 'assignment', date: '20 Agu 2023', status: 'completed' },
    { id: 2, title: 'Kuis Sistem Operasi', type: 'quiz', date: '18 Agu 2023', status: 'upcoming' },
    { id: 3, title: 'Praktikum Jaringan Komputer', type: 'lab', date: '15 Agu 2023', status: 'ongoing' },
    { id: 4, title: 'Ujian Tengah Semester', type: 'exam', date: '10 Sep 2023', status: 'upcoming' },
  ];

  // Data dummy untuk grafik nilai
  const courses = [
    { id: 1, name: 'Algoritma & Pemrograman', grade: 'A', credits: 3 },
    { id: 2, name: 'Sistem Operasi', grade: 'A-', credits: 3 },
    { id: 3, name: 'Jaringan Komputer', grade: 'B+', credits: 4 },
    { id: 4, name: 'Basis Data', grade: 'A', credits: 4 },
    { id: 5, name: 'Kalkulus II', grade: 'B', credits: 3 },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'assignment':
        return <BookOpen className="h-5 w-5 text-blue-500" />;
      case 'quiz':
        return <BarChart className="h-5 w-5 text-violet-500" />;
      case 'lab':
        return <Users className="h-5 w-5 text-green-500" />;
      case 'exam':
        return <Award className="h-5 w-5 text-amber-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Selesai</span>;
      case 'upcoming':
        return <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full">Akan Datang</span>;
      case 'ongoing':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Berlangsung</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">Tidak Diketahui</span>;
    }
  };

  const getTrendIcon = (trend: string) => {
    return trend === 'up' ? (
      <span className="flex items-center text-green-500">
        <TrendingUp className="h-4 w-4 mr-1" />
        {stats.find(stat => stat.trend === trend)?.change}
      </span>
    ) : (
      <span className="flex items-center text-red-500">
        <TrendingUp className="h-4 w-4 mr-1 transform rotate-180" />
        {stats.find(stat => stat.trend === trend)?.change}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="h-16 w-16 relative">
            <div className="absolute inset-0 rounded-full border-t-4 border-blue-500 animate-spin"></div>
          </div>
          <p className="mt-4 text-slate-600 animate-pulse">Memuat Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-bl from-blue-500/10 to-violet-500/10 rounded-bl-full -z-10"></div>
      <div className="absolute bottom-0 left-0 w-1/4 h-1/4 bg-gradient-to-tr from-blue-500/10 to-violet-500/10 rounded-tr-full -z-10"></div>
      <div className="absolute top-1/4 left-1/3 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
      <div className="absolute top-1/2 right-1/4 w-3 h-3 bg-violet-400 rounded-full animate-pulse delay-300"></div>
      <div className="absolute bottom-1/4 left-1/4 w-2 h-2 bg-amber-400 rounded-full animate-pulse delay-700"></div>

      <Header />
      
      <main className="flex-grow container-content py-8">
        <div className="animate-fade-in">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Selamat datang, Mahasiswa!</h1>
              <p className="text-slate-500 mt-1">Berikut perkembangan akademik Anda semester ini</p>
            </div>
            <div className="mt-4 md:mt-0 flex space-x-2">
              <Button className="bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-sm">
                <Clock className="h-4 w-4 mr-2" />
                Jadwal Kuliah
              </Button>
              <Button className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white shadow-md transition-all hover:shadow-lg">
                <Award className="h-4 w-4 mr-2" />
                Transkrip
              </Button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8 border-b border-slate-200 animate-fade-in animate-delay-100">
          <div className="flex overflow-x-auto hide-scrollbar space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-4 px-2 text-sm font-medium ${
                activeTab === 'overview'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              } transition-colors`}
            >
              Ringkasan
            </button>
            <button
              onClick={() => setActiveTab('courses')}
              className={`pb-4 px-2 text-sm font-medium ${
                activeTab === 'courses'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              } transition-colors`}
            >
              Mata Kuliah
            </button>
            <button
              onClick={() => setActiveTab('assignments')}
              className={`pb-4 px-2 text-sm font-medium ${
                activeTab === 'assignments'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              } transition-colors`}
            >
              Tugas
            </button>
            <button
              onClick={() => setActiveTab('grades')}
              className={`pb-4 px-2 text-sm font-medium ${
                activeTab === 'grades'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              } transition-colors`}
            >
              Nilai
            </button>
          </div>
        </div>

        {/* Stats */}
        {activeTab === 'overview' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((stat, index) => (
                <Card key={stat.id} className="p-6 border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all animate-fade-in" style={{ animationDelay: `${index * 150}ms` }}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                      <h3 className="text-2xl font-bold mt-1 text-slate-800">{stat.value}</h3>
                      <p className="mt-2 text-xs">{getTrendIcon(stat.trend)}</p>
                    </div>
                    <div className="bg-slate-100 p-3 rounded-lg">{stat.icon}</div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Activity Feed */}
              <Card className="col-span-1 lg:col-span-2 p-6 border border-slate-200 animate-fade-in animate-delay-300">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold text-slate-800">Aktivitas Terbaru</h2>
                  <Button variant="outline" size="sm" className="text-xs">
                    Lihat Semua
                  </Button>
                </div>
                <div className="space-y-4">
                  {latestActivities.map((activity, index) => (
                    <div 
                      key={activity.id} 
                      className="p-4 bg-white border border-slate-100 rounded-lg hover:shadow-sm transition-all flex items-center justify-between animate-fade-in"
                      style={{ animationDelay: `${(index + 4) * 150}ms` }}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="bg-slate-100 p-2 rounded-lg">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div>
                          <h3 className="font-medium text-slate-800">{activity.title}</h3>
                          <p className="text-sm text-slate-500">{activity.date}</p>
                        </div>
                      </div>
                      <div>
                        {getStatusBadge(activity.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Courses */}
              <Card className="col-span-1 p-6 border border-slate-200 animate-fade-in animate-delay-500">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold text-slate-800">Mata Kuliah Aktif</h2>
                  <Button variant="outline" size="sm" className="text-xs">
                    Lihat Semua
                  </Button>
                </div>
                <div className="space-y-3">
                  {courses.map((course, index) => (
                    <div 
                      key={course.id} 
                      className="p-3 border-b border-slate-100 last:border-0 flex justify-between items-center animate-fade-in"
                      style={{ animationDelay: `${(index + 8) * 100}ms` }}
                    >
                      <div>
                        <h3 className="font-medium text-slate-800 text-sm">{course.name}</h3>
                        <p className="text-xs text-slate-500">{course.credits} SKS</p>
                      </div>
                      <div className="flex items-center">
                        <span className={`w-8 h-8 flex items-center justify-center rounded-full font-medium text-sm
                          ${course.grade.startsWith('A') ? 'bg-green-100 text-green-800' : 
                            course.grade.startsWith('B') ? 'bg-blue-100 text-blue-800' : 
                            'bg-amber-100 text-amber-800'}`}
                        >
                          {course.grade}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </>
        )}

        {/* Placeholder for other tabs */}
        {activeTab === 'courses' && (
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm animate-fade-in">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Daftar Mata Kuliah Semester Ini</h2>
            <p className="text-slate-600">Konten Mata Kuliah akan ditampilkan di sini.</p>
          </div>
        )}

        {activeTab === 'assignments' && (
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm animate-fade-in">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Daftar Tugas Terbaru</h2>
            <p className="text-slate-600">Konten Tugas akan ditampilkan di sini.</p>
          </div>
        )}

        {activeTab === 'grades' && (
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm animate-fade-in">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Transkrip Nilai</h2>
            <p className="text-slate-600">Konten Nilai akan ditampilkan di sini.</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard; 