import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { db, auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, BookOpen, ClipboardList, 
  GraduationCap, Calendar, CheckCircle, 
  MessageSquare, Bell, Search, Filter,
  TrendingUp, Award, Clock, FileText,
  ChevronRight, User, LogOut, Menu, X, Trash2
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Toast } from '../components/Toast';
import { DateSheetEntry, Grade } from '../types';

// --- Sub-Components ---
const Sidebar = ({ activeTab, setActiveTab, isOpen, setIsOpen }: any) => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  const menuItems = [
    { id: 'overview', name: 'Overview', icon: LayoutDashboard },
    { id: 'lessons', name: 'Lessons', icon: BookOpen },
    { id: 'assignments', name: 'Assignments', icon: ClipboardList },
    { id: 'grades', name: 'Grades', icon: GraduationCap },
    { id: 'datesheet', name: 'Date Sheet', icon: Calendar },
    { id: 'attendance', name: 'Attendance', icon: CheckCircle },
    { id: 'messages', name: 'Messages', icon: MessageSquare },
  ];

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Content */}
      <motion.aside
        initial={false}
        animate={{ x: isOpen ? 0 : -300 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={cn(
          "fixed top-0 left-0 bottom-0 w-72 bg-mind-accent border-r border-white/10 z-50 lg:translate-x-0 lg:static lg:block",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center space-x-3 mb-12">
            <div className="w-10 h-10 mind-gradient rounded-lg flex items-center justify-center">
              <GraduationCap className="text-white w-6 h-6" />
            </div>
          </div>

          <nav className="flex-grow space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200",
                  activeTab === item.id 
                    ? "bg-mind-purple text-white font-bold shadow-lg shadow-mind-purple/20" 
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t border-white/10">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-mind-purple/20 border border-mind-purple/30 flex items-center justify-center overflow-hidden">
                {profile?.photoURL ? (
                  <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="text-mind-purple w-5 h-5" />
                )}
              </div>
              <div className="flex-grow overflow-hidden">
                <p className="text-sm font-bold truncate">{profile?.displayName}</p>
                <p className="text-xs text-white/40 truncate">{profile?.role}</p>
              </div>
            </div>
            <button 
              onClick={async () => {
                try {
                  await signOut(auth);
                  navigate('/');
                } catch (error) {
                  console.error('Logout error:', error);
                }
              }}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
};

// --- Views ---
const Overview = () => {
  const { profile } = useAuth();
  const [upcomingExams, setUpcomingExams] = useState<DateSheetEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.grade) {
      setLoading(false);
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    const q = query(
      collection(db, 'dateSheets'),
      where('grade', '==', profile.grade),
      where('date', '>=', today),
      orderBy('date', 'asc'),
      limit(3)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUpcomingExams(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DateSheetEntry)));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching upcoming exams:", error);
      setLoading(false);
    });
    return unsubscribe;
  }, [profile]);

  const data = [
    { name: 'Mon', progress: 40 },
    { name: 'Tue', progress: 55 },
    { name: 'Wed', progress: 48 },
    { name: 'Thu', progress: 70 },
    { name: 'Fri', progress: 85 },
    { name: 'Sat', progress: 90 },
    { name: 'Sun', progress: 95 },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-white/60">Here's what's happening with your studies today.</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="glass-card px-4 py-2 flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-mind-purple" />
            <span className="text-sm font-medium">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Syllabus Completion', value: '75%', icon: TrendingUp, color: 'text-emerald-400' },
          { label: 'Average Grade', value: 'A-', icon: Award, color: 'text-mind-purple' },
          { label: 'Attendance', value: '92%', icon: CheckCircle, color: 'text-blue-400' },
          { label: 'Pending Tasks', value: '3', icon: Clock, color: 'text-amber-400' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-3 rounded-xl bg-white/5", stat.color)}>
                <stat.icon className="w-6 h-6" />
              </div>
              <span className={cn("text-2xl font-bold", stat.color)}>{stat.value}</span>
            </div>
            <p className="text-white/40 text-sm font-medium">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Progress Chart */}
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-card p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold">Weekly Progress</h3>
              <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-sm outline-none">
                <option>This Week</option>
                <option>Last Week</option>
              </select>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="name" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f0a1e', border: '1px solid #ffffff10', borderRadius: '12px' }}
                    itemStyle={{ color: '#8b5cf6' }}
                  />
                  <Area type="monotone" dataKey="progress" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorProgress)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Upcoming Exams Widget */}
          <div className="glass-card p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-mind-purple" />
                <span>Upcoming Exams</span>
              </h3>
              <button className="text-xs font-bold text-mind-purple hover:text-white transition-colors uppercase tracking-widest">
                View Full Date Sheet
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {upcomingExams.length > 0 ? (
                upcomingExams.map((exam, i) => (
                  <div key={exam.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-mind-purple/30 transition-all group">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-black text-mind-purple uppercase tracking-widest">{exam.day}</span>
                      <span className="text-[10px] text-white/40">{exam.date}</span>
                    </div>
                    <h4 className="text-sm font-bold mb-2 line-clamp-1">{exam.subjects.join(' / ')}</h4>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-[10px] px-2 py-1 bg-white/5 rounded text-white/60">Test #{exam.testNumber}</span>
                      <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-mind-purple transition-colors" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-3 py-12 text-center text-white/20 italic text-sm">
                  {loading ? 'Loading exams...' : 'No upcoming exams scheduled.'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="glass-card p-8">
          <h3 className="text-xl font-bold mb-6 flex items-center space-x-2">
            <Bell className="w-5 h-5 text-mind-purple" />
            <span>Notifications</span>
          </h3>
          <div className="space-y-6">
            {[
              { title: 'New Quiz Posted', time: '2h ago', desc: 'Physics Quiz 4 is now available.', type: 'quiz' },
              { title: 'Assignment Graded', time: '5h ago', desc: 'Your Math assignment has been graded.', type: 'grade' },
              { title: 'Exam Date Sheet', time: '1d ago', desc: 'Final exam date sheet is out.', type: 'calendar' },
            ].map((note, i) => (
              <div key={i} className="flex space-x-4 group cursor-pointer">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0 group-hover:bg-mind-purple/20 transition-colors">
                  {note.type === 'quiz' && <ClipboardList className="w-5 h-5 text-mind-purple" />}
                  {note.type === 'grade' && <Award className="w-5 h-5 text-emerald-400" />}
                  {note.type === 'calendar' && <Calendar className="w-5 h-5 text-blue-400" />}
                </div>
                <div className="flex-grow">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-bold">{note.title}</h4>
                    <span className="text-[10px] text-white/40">{note.time}</span>
                  </div>
                  <p className="text-xs text-white/60 line-clamp-1">{note.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-8 py-3 text-sm font-bold text-mind-purple hover:text-white transition-colors">
            View All Notifications
          </button>
        </div>
      </div>
    </div>
  );
};

const Lessons = () => {
  const { profile } = useAuth();
  const [lessons, setLessons] = useState<any[]>([]);

  useEffect(() => {
    if (!profile) return;
    const q = query(
      collection(db, 'lessons'),
      where('grade', '==', profile.grade),
      orderBy('date', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLessons(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, [profile]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input 
              placeholder="Search lessons..." 
              className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:border-mind-purple transition-all"
            />
          </div>
          <button className="p-2 bg-white/5 border border-white/10 rounded-xl hover:text-mind-purple transition-colors">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {lessons.length > 0 ? lessons.map((lesson, i) => (
          <motion.div
            key={lesson.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card overflow-hidden group"
          >
            <div className="h-48 bg-mind-accent relative overflow-hidden">
              {lesson.youtubeLink ? (
                <img 
                  src={`https://img.youtube.com/vi/${lesson.youtubeLink.split('v=')[1]}/maxresdefault.jpg`} 
                  alt="Lesson Thumbnail"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center mind-gradient/20">
                  <BookOpen className="w-12 h-12 text-mind-purple" />
                </div>
              )}
              <div className="absolute top-4 left-4 px-3 py-1 bg-mind-purple text-white text-xs font-bold rounded-lg">
                {lesson.subject}
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-white/40 flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(lesson.date).toLocaleDateString()}</span>
                </span>
                <span className="text-xs text-white/40 flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>45 mins</span>
                </span>
              </div>
              <h3 className="text-lg font-bold mb-2 line-clamp-1">{lesson.summary}</h3>
              <p className="text-sm text-white/60 line-clamp-2 mb-6">{lesson.summary}</p>
              <div className="flex items-center justify-between">
                <a 
                  href={lesson.youtubeLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-mind-purple text-sm font-bold flex items-center space-x-2 hover:underline"
                >
                  <span>Watch Video</span>
                  <ChevronRight className="w-4 h-4" />
                </a>
                {lesson.resources?.length > 0 && (
                  <div className="flex items-center space-x-2 text-white/40">
                    <FileText className="w-4 h-4" />
                    <span className="text-xs">{lesson.resources.length} files</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )) : (
          <div className="col-span-full py-20 text-center glass-card">
            <BookOpen className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <p className="text-white/40">No lessons found for your grade.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const Grades = () => {
  const { profile } = useAuth();
  const [grades, setGrades] = useState<any[]>([]);

  useEffect(() => {
    if (!profile) return;
    const q = query(
      collection(db, 'grades'),
      where('studentId', '==', profile.uid),
      orderBy('date', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setGrades(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, [profile]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4">
        {grades.length > 0 ? grades.map((grade, i) => (
          <motion.div
            key={grade.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card p-6 flex items-center justify-between"
          >
            <div>
              <h3 className="font-bold text-lg">{grade.subject}</h3>
              <p className="text-sm text-white/40">{grade.assessmentType} • {new Date(grade.date).toLocaleDateString()}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-mind-purple">{grade.score}/{grade.totalMarks}</p>
              <p className="text-xs text-white/40">{Math.round((grade.score / grade.totalMarks) * 100)}%</p>
            </div>
          </motion.div>
        )) : (
          <div className="py-20 text-center glass-card">
            <GraduationCap className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <p className="text-white/40">No grades recorded yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const DateSheetView = () => {
  const { profile } = useAuth();
  const [entries, setEntries] = useState<DateSheetEntry[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<'test-session' | 'other'>('test-session');

  useEffect(() => {
    if (!profile?.uid) return;
    const q = query(
      collection(db, 'grades'),
      where('studentId', '==', profile.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setGrades(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Grade)));
    });
    return unsubscribe;
  }, [profile]);

  useEffect(() => {
    if (!profile?.grade) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(
      collection(db, 'dateSheets'), 
      where('grade', '==', profile.grade), 
      where('type', '==', selectedType),
      orderBy('date', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setEntries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DateSheetEntry)));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching date sheet:", error);
      setLoading(false);
    });
    return unsubscribe;
  }, [profile, selectedType]);

  const getGradeForEntry = (entry: DateSheetEntry) => {
    if (!entry.testNumber || entry.isHoliday) return null;
    return grades.find(g => 
      g.testNumber === entry.testNumber && 
      entry.subjects.includes(g.subject)
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="text-2xl font-bold">Academic Date Sheet</h2>
          <p className="text-white/40 text-sm">Schedule for {profile?.grade} Class</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
            <button 
              onClick={() => setSelectedType('test-session')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                selectedType === 'test-session' ? "bg-mind-purple text-white shadow-lg shadow-mind-purple/20" : "text-white/40 hover:text-white/60"
              )}
            >
              Test Session
            </button>
            <button 
              onClick={() => setSelectedType('other')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                selectedType === 'other' ? "bg-mind-purple text-white shadow-lg shadow-mind-purple/20" : "text-white/40 hover:text-white/60"
              )}
            >
              Other
            </button>
          </div>

          <div className="flex items-center space-x-4 text-[10px] uppercase tracking-wider font-bold">
            <div className="flex items-center space-x-1.5">
              <div className="w-2.5 h-2.5 bg-mind-purple rounded-sm" />
              <span className="text-white/60">Your Subjects</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <div className="w-2.5 h-2.5 bg-white/5 rounded-sm border border-white/10" />
              <span className="text-white/60">Other Subjects</span>
            </div>
          </div>
        </div>
      </div>

      {entries.length === 0 && !loading && (
        <div className="glass-card p-12 text-center">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-white/20" />
          </div>
          <h3 className="text-xl font-bold mb-2">No Date Sheet Found</h3>
          <p className="text-white/40 max-w-md mx-auto">
            {profile?.grade 
              ? `We couldn't find any ${selectedType === 'test-session' ? 'Test Session' : 'Other'} date sheet entries for ${profile.grade} Class.`
              : "Your account doesn't have a grade assigned. Please contact the administrator to update your profile."}
          </p>
        </div>
      )}

      {entries.length > 0 && (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                  <thead className="bg-white/5 border-b border-white/10">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest">Date / Day</th>
                      <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest">Subject(s)</th>
                      <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest">Test #</th>
                      <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest">Syllabus</th>
                      <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest">Result</th>
                    </tr>
                  </thead>
              <tbody className="divide-y divide-white/5">
                {entries.map(entry => {
                  const mySubjects = entry.subjects.filter(s => profile?.enrolledSubjects?.includes(s));
                  const isRelevant = mySubjects.length > 0 || entry.isHoliday;
  
                  return (
                    <tr key={entry.id} className={cn(
                      "hover:bg-white/5 transition-colors",
                      entry.isHoliday && "bg-red-500/5",
                      !isRelevant && "opacity-30"
                    )}>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold">{entry.date}</p>
                        <p className="text-[10px] text-white/40 uppercase">{entry.day}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {entry.subjects.map(s => {
                            const isMine = profile?.enrolledSubjects?.includes(s);
                            return (
                              <span key={s} className={cn(
                                "px-2 py-1 rounded text-[10px] font-bold transition-all",
                                isMine ? "bg-mind-purple text-white shadow-lg shadow-mind-purple/20 ring-1 ring-white/20" : "bg-white/5 text-white/40"
                              )}>
                                {s}
                              </span>
                            );
                          })}
                          {entry.isHoliday && <span className="text-red-400 font-black uppercase text-[10px] px-2 py-1 bg-red-500/10 rounded">Holiday</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">{entry.testNumber || '-'}</td>
                      <td className="px-6 py-4 text-xs text-white/60 max-w-xs">{entry.syllabus}</td>
                      <td className="px-6 py-4">
                        {getGradeForEntry(entry) ? (
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-emerald-400">
                              {getGradeForEntry(entry)?.score} / {getGradeForEntry(entry)?.totalMarks}
                            </span>
                            <span className="text-[10px] text-white/40">
                              {Math.round((getGradeForEntry(entry)!.score / getGradeForEntry(entry)!.totalMarks) * 100)}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-white/20">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const Attendance = () => {
  const { profile } = useAuth();
  const [attendance, setAttendance] = useState<any[]>([]);

  useEffect(() => {
    if (!profile) return;
    const q = query(
      collection(db, 'attendance'),
      where('studentId', '==', profile.uid),
      orderBy('date', 'desc'),
      limit(30)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAttendance(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, [profile]);

  const stats = {
    present: attendance.filter(a => a.status === 'present').length,
    absent: attendance.filter(a => a.status === 'absent').length,
    late: attendance.filter(a => a.status === 'late').length,
    total: attendance.length
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 text-center">
          <p className="text-emerald-400 text-3xl font-bold">{stats.present}</p>
          <p className="text-white/40 text-sm">Present</p>
        </div>
        <div className="glass-card p-6 text-center">
          <p className="text-red-400 text-3xl font-bold">{stats.absent}</p>
          <p className="text-white/40 text-sm">Absent</p>
        </div>
        <div className="glass-card p-6 text-center">
          <p className="text-amber-400 text-3xl font-bold">{stats.late}</p>
          <p className="text-white/40 text-sm">Late</p>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="px-6 py-4 text-sm font-bold">Date</th>
              <th className="px-6 py-4 text-sm font-bold">Subject</th>
              <th className="px-6 py-4 text-sm font-bold">Status</th>
            </tr>
          </thead>
          <tbody>
            {attendance.map((record) => (
              <tr key={record.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 text-sm">{new Date(record.date).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-sm">{record.subject}</td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase",
                    record.status === 'present' ? "bg-emerald-500/20 text-emerald-400" :
                    record.status === 'absent' ? "bg-red-500/20 text-red-400" :
                    "bg-amber-500/20 text-amber-400"
                  )}>
                    {record.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {attendance.length === 0 && (
          <div className="py-20 text-center">
            <CheckCircle className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <p className="text-white/40">No attendance records found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const Assignments = () => {
  const { profile } = useAuth();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.grade) return;

    const q = query(
      collection(db, 'assignments'),
      where('class', '==', profile.grade),
      orderBy('dueDate', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAssignments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      console.error('Error fetching assignments:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile?.grade]);

  if (loading) return <div className="py-20 text-center text-white/40">Loading Assignments...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">My Assignments</h2>
        <div className="flex items-center space-x-2 text-sm text-white/40">
          <Clock className="w-4 h-4" />
          <span>Showing all active assignments</span>
        </div>
      </div>

      {assignments.length === 0 ? (
        <div className="py-20 text-center glass-card">
          <ClipboardList className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/40 font-medium">No assignments posted for your class yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {assignments.map((assignment) => (
            <motion.div
              key={assignment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 space-y-4 group hover:border-mind-purple/30 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 rounded-md bg-mind-purple/10 text-mind-purple text-[10px] font-bold uppercase tracking-wider">
                      {assignment.subject}
                    </span>
                    {new Date(assignment.dueDate) < new Date() && (
                      <span className="px-2 py-1 rounded-md bg-red-500/10 text-red-400 text-[10px] font-bold uppercase tracking-wider">
                        Overdue
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold group-hover:text-mind-purple transition-colors">
                    {assignment.title}
                  </h3>
                </div>
                <div className="p-3 rounded-xl bg-white/5">
                  <FileText className="w-6 h-6 text-white/40" />
                </div>
              </div>

              <p className="text-sm text-white/60 line-clamp-2">
                {assignment.description}
              </p>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs text-white/40">
                  <Calendar className="w-4 h-4" />
                  <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                </div>
                <button className="text-xs font-bold text-mind-purple hover:underline">
                  View Details
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

const Messages = () => {
  const { profile } = useAuth();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.grade) return;

    // Fetch teachers who teach this student's class
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'teacher'),
      where('assignedClasses', 'array-contains', profile.grade)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTeachers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      console.error('Error fetching teachers:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile?.grade]);

  if (loading) return <div className="py-20 text-center text-white/40">Loading Teachers...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Messages & Support</h2>
        <div className="flex items-center space-x-2 text-sm text-white/40">
          <MessageSquare className="w-4 h-4" />
          <span>Contact your subject teachers</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4">
          <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest px-2">My Teachers</h3>
          <div className="space-y-2">
            {teachers.map((teacher) => (
              <button
                key={teacher.id}
                className="w-full flex items-center space-x-3 p-4 rounded-xl hover:bg-white/5 transition-colors text-left group border border-transparent hover:border-white/10"
              >
                <div className="w-10 h-10 rounded-full bg-mind-purple/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-mind-purple" />
                </div>
                <div>
                  <p className="text-sm font-bold group-hover:text-mind-purple transition-colors">{teacher.displayName}</p>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider">{teacher.subject}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="glass-card h-[500px] flex flex-col items-center justify-center space-y-4 text-center p-8">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-white/20" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold">Select a teacher to start chatting</h3>
              <p className="text-sm text-white/40 max-w-xs mx-auto">
                You can ask questions about lessons, assignments, or request extra help from your teachers directly.
              </p>
            </div>
            <button className="btn-mind px-8 py-3">
              New Conversation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main Dashboard ---
export default function StudentDashboard() {
  const { profile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  if (loading) return <div className="pt-32 text-center">Loading Dashboard...</div>;
  if (!profile || profile.role !== 'student') {
    return <div className="pt-32 text-center">Unauthorized Access</div>;
  }

  return (
    <div className="flex min-h-screen bg-mind-deep">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
      />
      
      <div className="flex-grow flex flex-col">
        {/* Top Header */}
        <header className="h-20 border-b border-white/10 flex items-center justify-between px-8 bg-mind-deep/50 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold capitalize">{activeTab.replace('-', ' ')}</h1>
          </div>

          <div className="flex items-center space-x-6">
            <button className="relative p-2 hover:bg-white/5 rounded-lg transition-colors group">
              <Bell className="w-5 h-5 text-white/60 group-hover:text-mind-purple" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-mind-purple rounded-full border-2 border-mind-deep" />
            </button>
            <div className="h-8 w-[1px] bg-white/10 hidden md:block" />
            <div className="hidden md:flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-bold">{profile.displayName}</p>
                <p className="text-[10px] text-white/40 uppercase tracking-wider">{profile.grade}</p>
              </div>
              <div className="w-10 h-10 rounded-full mind-gradient p-[2px]">
                <div className="w-full h-full rounded-full bg-mind-deep flex items-center justify-center overflow-hidden">
                  {profile.photoURL ? (
                    <img src={profile.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-mind-purple" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-8 max-w-7xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'overview' && <Overview />}
              {activeTab === 'lessons' && <Lessons />}
              {activeTab === 'assignments' && <Assignments />}
              {activeTab === 'grades' && <Grades />}
              {activeTab === 'datesheet' && <DateSheetView />}
              {activeTab === 'attendance' && <Attendance />}
              {activeTab === 'messages' && <Messages />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <AnimatePresence>
        {toast && (
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
