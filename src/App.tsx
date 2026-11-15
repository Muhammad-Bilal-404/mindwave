import React, { createContext, useContext, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { doc, getDoc, onSnapshot, query, collection, where } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile } from './types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, X, LogIn, User as UserIcon, LogOut, 
  LayoutDashboard, BookOpen, ClipboardList, 
  GraduationCap, Calendar, CheckCircle, Video,
  MessageSquare, Settings, Shield, Info, Phone, Mail, Newspaper,
  Home, ChevronRight, Bell, Search, Filter, MapPin, TrendingUp
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utils ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Auth Context ---
interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthReady: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAuthReady: false,
});

export const useAuth = () => useContext(AuthContext);

// --- Components ---
const Navbar = () => {
  const { user, profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Results', path: '/test-results' },
    { name: 'Contact', path: '/contact' },
    { name: 'Blog', path: '/blog' },
  ];

  const dashboardLink = profile ? `/${profile.role}-dashboard` : '/login';
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isDashboard = location.pathname.includes('dashboard');

  if (isDashboard) return null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-mind-deep/80 backdrop-blur-lg border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-12 h-12 mind-gradient rounded-2xl flex items-center justify-center shadow-xl group-hover:rotate-12 transition-transform duration-300">
              <GraduationCap className="text-white w-7 h-7" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-display font-black tracking-tighter text-white leading-none">MIND WAVE</span>
              <span className="text-[10px] font-bold tracking-[0.3em] text-mind-purple uppercase leading-none mt-1">Academy</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={cn(
                  "nav-link",
                  location.pathname === link.path && "active"
                )}
              >
                {link.name}
              </Link>
            ))}
            {user ? (
              <div className="flex items-center space-x-4">
                <Link to={dashboardLink} className="btn-mind py-2 px-5 text-sm">
                  Dashboard
                </Link>
                <button 
                  onClick={handleLogout}
                  className="p-2 text-white/60 hover:text-red-400 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link to="/login" className="btn-outline-mind py-2 px-5 text-sm flex items-center space-x-2">
                <LogIn className="w-4 h-4" />
                <span>Login</span>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-white hover:text-mind-purple transition-colors"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden bg-royal-accent border-b border-white/10"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 text-base font-medium text-white/70 hover:text-mind-purple"
                >
                  {link.name}
                </Link>
              ))}
              <Link
                to={dashboardLink}
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 text-base font-medium text-mind-purple"
              >
                {user ? 'Dashboard' : 'Login'}
              </Link>
              {user && (
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-base font-medium text-red-400"
                >
                  Logout
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Footer = () => {
  const location = useLocation();
  const isDashboard = location.pathname.includes('dashboard');

  if (isDashboard) return null;

  return (
    <footer className="bg-mind-accent border-t border-white/10 py-12">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="col-span-1 md:col-span-2">
          <Link to="/" className="flex items-center space-x-3 mb-8 group">
            <div className="w-12 h-12 mind-gradient rounded-2xl flex items-center justify-center shadow-xl group-hover:rotate-12 transition-transform duration-300">
              <GraduationCap className="text-white w-7 h-7" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-display font-black tracking-tighter text-white leading-none">MIND WAVE</span>
              <span className="text-[10px] font-bold tracking-[0.3em] text-mind-purple uppercase leading-none mt-1">Academy</span>
            </div>
          </Link>
          <p className="text-white/60 max-w-md">
            Unlock your child's true potential with our modern educational platform. 
            Quality education, experienced faculty, and real-time progress tracking.
          </p>
        </div>
        <div>
          <h4 className="text-mind-purple font-bold mb-6">Quick Links</h4>
          <ul className="space-y-4 text-white/60">
            <li><Link to="/about" className="hover:text-mind-purple transition-colors">About Us</Link></li>
            <li><Link to="/contact" className="hover:text-mind-purple transition-colors">Contact</Link></li>
            <li><Link to="/enroll" className="hover:text-mind-purple transition-colors">Enroll Now</Link></li>
            <li><Link to="/login" className="hover:text-mind-purple transition-colors">Staff Portal</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-mind-purple font-bold mb-6">Contact Us</h4>
          <ul className="space-y-4 text-white/60">
            <li className="flex items-center space-x-3">
              <Phone className="w-4 h-4 text-mind-purple" />
              <span>+1 (234) 567-890</span>
            </li>
            <li className="flex items-center space-x-3">
              <MessageSquare className="w-4 h-4 text-mind-purple" />
              <span>info@mindwave.edu</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="mt-12 pt-8 border-t border-white/5 text-center text-white/40 text-sm">
        &copy; {new Date().getFullYear()} Mind Wave Academy. All rights reserved.
      </div>
    </div>
  </footer>
);
};

// --- Pages ---
const HomePage = () => (
  <div className="pt-20">
    {/* Hero Section */}
    <section className="relative min-h-[95vh] flex items-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-mind-deep/40 via-mind-deep/90 to-mind-deep z-10" />
        <img 
          src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070&auto=format&fit=crop" 
          alt="Academy Background" 
          className="w-full h-full object-cover scale-105 animate-pulse-slow"
          referrerPolicy="no-referrer"
        />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 w-full">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center"
          >
            <div className="inline-flex items-center space-x-2 bg-white/5 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full mb-8">
              <span className="w-2 h-2 bg-mind-purple rounded-full animate-ping" />
              <span className="text-xs font-bold tracking-widest uppercase text-white/80">Welcome to the Future</span>
            </div>
            
            <h1 className="text-6xl md:text-9xl font-display font-black mb-8 leading-[0.9] tracking-tighter">
              <span className="text-mind-purple">MIND WAVE</span> <br />
              <span className="text-white">ACADEMY</span>
            </h1>

            <div className="mb-10 max-w-2xl">
              <h2 className="text-2xl md:text-4xl font-bold text-white mb-4 italic font-display">
                Unlock Your <span className="text-mind-purple">Child's</span> True Potential
              </h2>
              <p className="text-lg text-white/70 leading-relaxed">
                Experience a revolutionary educational ecosystem. Personalized learning, 
                expert faculty, and real-time progress tracking for every student.
              </p>
            </div>

            <div className="flex flex-wrap gap-6 justify-center">
              <Link to="/enroll" className="btn-mind px-10 py-4 text-lg">
                Enroll Now
              </Link>
              <Link to="/login" className="bg-white/10 hover:bg-white/20 text-white px-10 py-4 text-lg rounded-xl font-bold backdrop-blur-md border border-white/10 transition-all">
                Login to LMS
              </Link>
            </div>
            <div className="mt-8 flex items-center space-x-4">
              <Link to="/login" className="text-white/60 hover:text-white font-bold transition-colors">Parent Login</Link>
              <span className="w-1 h-1 bg-white/20 rounded-full" />
              <Link to="/login" className="text-white/60 hover:text-white font-bold transition-colors">Student Login</Link>
              <span className="w-1 h-1 bg-white/20 rounded-full" />
              <Link to="/test-results" className="text-mind-purple font-black uppercase tracking-widest text-sm hover:scale-105 transition-transform">Test Results</Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>

    {/* Features Section */}
    <section className="py-24 bg-mind-accent/60 relative">
      <div className="absolute inset-0 bg-mind-purple/5 blur-[120px] -z-10" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Why Choose <span className="text-mind-purple">Mind Wave</span>?</h2>
          <p className="text-white/60 max-w-2xl mx-auto">We provide a comprehensive educational ecosystem designed for success.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: BookOpen, title: 'Quality Education', desc: 'Curriculum designed by experts to ensure deep understanding.', link: '/achievers', linkText: "Academy's Pride" },
            { icon: ClipboardList, title: 'Test Portal', desc: 'Secure portal for students to view their test session results.', link: '/test-results', linkText: 'View Results' },
            { icon: LayoutDashboard, title: 'LMS Dashboards', desc: 'Real-time tracking of lessons, assignments, and grades.', link: '/login', linkText: 'Access LMS' },
            { icon: Shield, title: 'Secure & Reliable', desc: 'Safe environment for students to learn and grow.' },
            { icon: Users, title: 'Experienced Faculty', desc: 'Learn from the best teachers in the industry.', link: '/faculty', linkText: 'Meet Faculty' },
            { icon: CheckCircle, title: 'Auto-Grading', desc: 'Instant feedback on quizzes and assignments.', link: '/auto-grading', linkText: 'How it Works' },
            { icon: Video, title: 'Lecture Mechanism', desc: 'Interactive and recorded lectures for a seamless learning experience.', link: '/lecture-mechanism', linkText: 'Learn More' },
          ].map((feature, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -10 }}
              className="glass-card p-8 text-center flex flex-col items-center"
            >
              <div className="w-16 h-16 mind-gradient rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <feature.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-mind-purple">{feature.title}</h3>
              <p className="text-white/60 mb-6">{feature.desc}</p>
              {feature.link && (
                <Link to={feature.link} className="text-mind-purple text-sm font-bold flex items-center space-x-1 hover:translate-x-2 transition-transform mt-auto">
                  <span>{feature.linkText}</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  </div>
);

import EnrollPage from './pages/EnrollPage';
import ParentRequestPage from './pages/ParentRequestPage';
import LoginPage from './pages/LoginPage';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ParentDashboard from './pages/ParentDashboard';
import AchieversPage from './pages/AchieversPage';
import TestResultsPage from './pages/TestResultsPage';

// --- Pages ---
const AboutPage = () => (
  <div className="pt-32 pb-20 px-4 max-w-7xl mx-auto">
    <div className="text-center mb-16">
      <p className="text-white/60 max-w-2xl mx-auto">
        Mind Wave Academy was founded with a single mission: to provide world-class education 
        accessible to every child, leveraging modern technology and experienced faculty.
      </p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
      <div className="glass-card p-8">
        <h2 className="text-3xl font-bold mb-6 text-mind-purple">Our Methodology</h2>
        <p className="text-white/70 leading-relaxed mb-6">
          We combine traditional teaching excellence with modern digital tools. Our LMS 
          provides students with real-time access to lessons, while parents can monitor 
          progress through detailed analytics.
        </p>
        <ul className="space-y-4">
          {['Personalized Learning Paths', 'Interactive Video Lessons', 'Real-time Progress Tracking', 'Expert Faculty Support'].map((item, i) => (
            <li key={i} className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-mind-purple" />
              <span className="text-white/80">{item}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/10">
        <img 
          src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=2070&auto=format&fit=crop" 
          alt="Classroom" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>
    </div>
  </div>
);

const ContactPage = () => (
  <div className="pt-32 pb-20 px-4 max-w-4xl mx-auto">
    <div className="text-center mb-16">
      <p className="text-white/60">Have questions? We're here to help you.</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
      <div className="space-y-8">
        <div className="glass-card p-6 flex items-center space-x-4">
          <div className="w-12 h-12 mind-gradient rounded-xl flex items-center justify-center">
            <Phone className="w-6 h-6 text-white" />
          </div>
          <div>
            <h4 className="font-bold">Call Us</h4>
            <p className="text-white/60">+1 (234) 567-890</p>
          </div>
        </div>
        <div className="glass-card p-6 flex items-center space-x-4">
          <div className="w-12 h-12 mind-gradient rounded-xl flex items-center justify-center">
            <Mail className="w-6 h-6 text-white" />
          </div>
          <div>
            <h4 className="font-bold">Email Us</h4>
            <p className="text-white/60">info@mindwave.edu</p>
          </div>
        </div>
        <div className="glass-card p-6 flex items-center space-x-4">
          <div className="w-12 h-12 mind-gradient rounded-xl flex items-center justify-center">
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <div>
            <h4 className="font-bold">Visit Us</h4>
            <p className="text-white/60">123 Academy Way, Education City</p>
          </div>
        </div>
      </div>
      <form className="glass-card p-8 space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-mind-purple">Name</label>
          <input className="w-full bg-mind-deep/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-mind-purple" placeholder="Your Name" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-bold text-mind-purple">Email</label>
          <input className="w-full bg-mind-deep/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-mind-purple" placeholder="Your Email" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-bold text-mind-purple">Message</label>
          <textarea className="w-full bg-mind-deep/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-mind-purple h-32 resize-none" placeholder="How can we help?" />
        </div>
        <button className="w-full btn-mind">Send Message</button>
      </form>
    </div>
  </div>
);

const BlogPage = () => (
  <div className="pt-32 pb-20 px-4 max-w-7xl mx-auto">
    <div className="text-center mb-16">
      <p className="text-white/60">Stay updated with the latest from Mind Wave Academy.</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {[
        { title: 'New Science Lab Opened', date: 'March 10, 2026', img: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=2070&auto=format&fit=crop' },
        { title: 'Annual Sports Day 2026', date: 'March 05, 2026', img: 'https://images.unsplash.com/photo-1526676037777-05a232554f77?q=80&w=2070&auto=format&fit=crop' },
        { title: 'Top Achievers of Term 1', date: 'Feb 28, 2026', img: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2070&auto=format&fit=crop' },
      ].map((post, i) => (
        <div key={i} className="glass-card overflow-hidden group cursor-pointer">
          <div className="h-48 overflow-hidden">
            <img src={post.img} alt={post.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
          </div>
          <div className="p-6">
            <p className="text-xs text-mind-purple font-bold mb-2">{post.date}</p>
            <h3 className="text-xl font-bold mb-4">{post.title}</h3>
            <p className="text-white/60 text-sm line-clamp-2 mb-4">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
            <span className="text-mind-purple text-sm font-bold flex items-center space-x-1 group-hover:translate-x-2 transition-transform">
              <span>Read More</span>
              <ChevronRight className="w-4 h-4" />
            </span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const FacultyPage = () => {
  const [faculty, setFaculty] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'teacher'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setFaculty(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)));
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <div className="pt-32 pb-20 px-4 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-display font-black mb-4">EXPERIENCED <span className="text-mind-purple">FACULTY</span></h1>
        <p className="text-white/60 max-w-2xl mx-auto">
          Our educators are industry experts dedicated to nurturing the next generation of leaders.
        </p>
      </div>
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-12 h-12 border-4 border-mind-purple border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {faculty.map((teacher) => (
            <motion.div 
              key={teacher.uid} 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass-card p-8 flex flex-col items-center text-center group hover:border-mind-purple/30 transition-all duration-500"
            >
              <div className="w-32 h-32 rounded-full mind-gradient p-[2px] mb-6 group-hover:scale-110 transition-transform duration-500">
                <div className="w-full h-full rounded-full bg-mind-deep flex items-center justify-center overflow-hidden">
                  {teacher.photoURL ? (
                    <img src={teacher.photoURL} alt={teacher.displayName} className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-12 h-12 text-mind-purple" />
                  )}
                </div>
              </div>
              
              <h3 className="text-2xl font-bold mb-1">{teacher.displayName}</h3>
              <p className="text-mind-purple font-bold text-xs mb-6 uppercase tracking-[0.2em]">
                {teacher.facultyInfo?.currentRole || 'Faculty Member'}
              </p>

              <div className="w-full space-y-4 text-left">
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <p className="text-[10px] text-white/40 uppercase font-bold mb-2 flex items-center space-x-2">
                    <GraduationCap className="w-3 h-3 text-mind-purple" />
                    <span>Qualification</span>
                  </p>
                  <p className="text-sm font-medium">{teacher.facultyInfo?.qualification || teacher.experience || 'Not specified'}</p>
                </div>

                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <p className="text-[10px] text-white/40 uppercase font-bold mb-2 flex items-center space-x-2">
                    <BookOpen className="w-3 h-3 text-mind-purple" />
                    <span>Subjects</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(teacher.facultyInfo?.subjects?.split(',') || teacher.subjectsTaught || []).map((s: string, idx: number) => (
                      <span key={idx} className="text-[10px] bg-mind-purple/20 text-mind-purple px-2 py-1 rounded-md font-bold">
                        {s.trim()}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <p className="text-[10px] text-white/40 uppercase font-bold mb-2 flex items-center space-x-2">
                    <MessageSquare className="w-3 h-3 text-mind-purple" />
                    <span>Subject Guidance</span>
                  </p>
                  <p className="text-xs text-white/60 leading-relaxed italic">
                    "{teacher.facultyInfo?.subjectGuide || teacher.bio || 'Dedicated to student success.'}"
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

const AutoGradingPage = () => (
  <div className="pt-32 pb-20 px-4 max-w-4xl mx-auto">
    <div className="text-center mb-16">
      <p className="text-white/60">Efficiency meets accuracy in our modern assessment ecosystem.</p>
    </div>
    <div className="glass-card p-10 space-y-8">
      <div className="flex items-center space-x-6">
        <div className="w-16 h-16 mind-gradient rounded-2xl flex items-center justify-center flex-shrink-0">
          <CheckCircle className="w-8 h-8 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-mind-purple">How it Works</h2>
          <p className="text-white/70 mt-2">
            Our automated grading system utilizes advanced algorithms to evaluate student submissions instantly. 
            For objective assessments like quizzes and multiple-choice tests, the system compares student answers 
            against a pre-defined key, providing immediate feedback and score generation.
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-6">
        <div className="w-16 h-16 mind-gradient rounded-2xl flex items-center justify-center flex-shrink-0">
          <TrendingUp className="w-8 h-8 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-mind-purple">Instant Results</h2>
          <p className="text-white/70 mt-2">
            As soon as a student submits their work, the system processes the data and updates the student's 
            performance dashboard. This real-time evaluation helps students identify their strengths and 
            weaknesses immediately, allowing for faster learning cycles and more targeted study sessions.
          </p>
        </div>
      </div>
      <div className="bg-mind-purple/10 border-l-4 border-mind-purple p-6 rounded-r-2xl">
        <p className="text-white/80 italic">
          "The auto-grading mechanism ensures 100% objectivity and eliminates human bias in assessments, 
          providing a fair and transparent grading environment for all students."
        </p>
      </div>
    </div>
  </div>
);

const LectureMechanismPage = () => (
  <div className="pt-32 pb-20 px-4 max-w-7xl mx-auto">
    <div className="text-center mb-16">
      <p className="text-white/60 max-w-2xl mx-auto">
        Discover how we transform complex concepts into simple, engaging learning experiences.
      </p>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-mind-purple">Engaging the Modern Student</h2>
        <p className="text-white/70 leading-relaxed">
          Our teachers employ a variety of engagement techniques, from interactive digital whiteboards 
          to real-time polls and breakout discussions. We believe that active participation is the 
          key to deep understanding, and our platform is designed to facilitate this interaction 
          seamlessly, whether in a live session or through recorded content.
        </p>
        <p className="text-white/70 leading-relaxed">
          Complex concepts are broken down into bite-sized, digestible modules. We use visual 
          analogies, real-world examples, and interactive simulations to ensure that even the 
          most challenging topics become clear and accessible to every student.
        </p>
        <div className="grid grid-cols-2 gap-4 pt-4">
          <div className="glass-card p-4 text-center">
            <h4 className="font-bold text-mind-purple mb-1">Interactive</h4>
            <p className="text-xs text-white/40">Live Q&A Sessions</p>
          </div>
          <div className="glass-card p-4 text-center">
            <h4 className="font-bold text-mind-purple mb-1">Visual</h4>
            <p className="text-xs text-white/40">Concept Mapping</p>
          </div>
        </div>
      </div>
      <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/10 h-[400px]">
        <img 
          src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop" 
          alt="Interactive Learning" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
      <div className="order-2 lg:order-1 rounded-2xl overflow-hidden shadow-2xl border border-white/10 h-[400px]">
        <img 
          src="https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=2070&auto=format&fit=crop" 
          alt="Collaborative Learning" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>
      <div className="order-1 lg:order-2 space-y-6">
        <h2 className="text-3xl font-bold text-mind-purple">Classroom Interaction Techniques</h2>
        <p className="text-white/70 leading-relaxed">
          We utilize the Socratic method to encourage critical thinking, prompting students to 
          arrive at conclusions through guided inquiry. Our teachers are trained in neuro-linguistic 
          programming (NLP) techniques to better connect with different learning styles—visual, 
          auditory, and kinesthetic.
        </p>
        <ul className="space-y-4">
          {[
            'Gamified Learning Challenges',
            'Peer-to-Peer Teaching Sessions',
            'Flipped Classroom Model',
            'Real-time Collaborative Projects'
          ].map((tech, i) => (
            <li key={i} className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-mind-purple" />
              <span className="text-white/80">{tech}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </div>
);

// --- Main App ---
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      if (firebaseUser) {
        const docRef = doc(db, 'users', firebaseUser.uid);
        unsubProfile = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            setProfile(null);
          }
          setLoading(false);
          setIsAuthReady(true);
        });
      } else {
        setProfile(null);
        setLoading(false);
        setIsAuthReady(true);
      }
    });

    return () => {
      unsubscribe();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAuthReady }}>
      <Router>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/faculty" element={<FacultyPage />} />
              <Route path="/auto-grading" element={<AutoGradingPage />} />
              <Route path="/lecture-mechanism" element={<LectureMechanismPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/enroll" element={<EnrollPage />} />
              <Route path="/parent-request" element={<ParentRequestPage />} />
              <Route path="/student-dashboard" element={<StudentDashboard />} />
              <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
              <Route path="/admin-dashboard" element={<AdminDashboard />} />
              <Route path="/it-manager-dashboard" element={<AdminDashboard />} />
              <Route path="/parent-dashboard" element={<ParentDashboard />} />
              <Route path="/achievers" element={<AchieversPage />} />
              <Route path="/test-results" element={<TestResultsPage />} />
              {/* Add more routes as we build them */}
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthContext.Provider>
  );
}

// Mock Icons for the features list
const Users = (props: any) => <UserIcon {...props} />;
