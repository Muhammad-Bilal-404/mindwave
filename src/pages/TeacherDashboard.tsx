import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { db, auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { signOut, updatePassword } from 'firebase/auth';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, getDocs, updateDoc, doc, deleteDoc, orderBy } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, BookOpen, ClipboardList, 
  CheckCircle, MessageSquare, Plus, 
  Users, Calendar, Clock, FileText,
  ChevronRight, User, LogOut, Menu, X,
  Video, Save, Trash2, Edit3, AlertCircle,
  Trophy, GraduationCap, TrendingUp, Settings, Lock, Shield, Star,
  Search, BarChart2, Filter, Bell, Check
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Toast } from '../components/Toast';
import { DateSheetEntry, Grade } from '../types';

// --- Sub-Components ---

const Modal = ({ isOpen, onClose, title, children, onConfirm, confirmText = "Confirm", variant = "primary" }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card max-w-md w-full p-8 space-y-6"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="text-white/60">{children}</div>
        <div className="flex justify-end space-x-4">
          <button onClick={onClose} className="px-4 py-2 text-white/60 hover:text-white">Cancel</button>
          <button 
            onClick={() => { onConfirm(); onClose(); }} 
            className={cn(
              "px-6 py-2 rounded-xl font-bold transition-all",
              variant === "danger" ? "bg-red-500 hover:bg-red-600 text-white" : "btn-mind"
            )}
          >
            {confirmText}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// --- Sub-Components ---

const Notifications = ({ role, uid }: { role: string, uid?: string }) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const recipientId = role === 'admin' ? 'admin' : uid;
    if (!recipientId) return;

    const q = query(
      collection(db, 'notifications'),
      where('recipientId', '==', recipientId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return unsubscribe;
  }, [role, uid]);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">Notifications</h3>
        <span className="bg-mind-purple/20 text-mind-purple px-3 py-1 rounded-full text-xs font-bold">
          {notifications.filter(n => !n.read).length} Unread
        </span>
      </div>

      <div className="space-y-4">
        {notifications.map((notif) => (
          <div 
            key={notif.id} 
            className={cn(
              "glass-card p-6 flex items-start justify-between transition-all",
              !notif.read && "border-l-4 border-l-mind-purple"
            )}
          >
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <h4 className="font-bold">{notif.title}</h4>
                {!notif.read && <span className="w-2 h-2 bg-mind-purple rounded-full" />}
              </div>
              <p className="text-sm text-white/60">{notif.content}</p>
              <p className="text-[10px] text-white/20">
                {notif.createdAt?.toDate ? notif.createdAt.toDate().toLocaleString() : 'Just now'}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {!notif.read && (
                <button 
                  onClick={() => markAsRead(notif.id)}
                  className="p-2 hover:bg-white/5 rounded-lg text-emerald-400"
                  title="Mark as read"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
              <button 
                onClick={() => deleteNotification(notif.id)}
                className="p-2 hover:bg-white/5 rounded-lg text-red-400"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {notifications.length === 0 && !loading && (
          <div className="glass-card p-12 text-center text-white/40 italic">
            No notifications yet.
          </div>
        )}
      </div>
    </div>
  );
};

const Sidebar = ({ activeTab, setActiveTab, isOpen, setIsOpen }: any) => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  const menuItems = [
    { id: 'overview', name: 'Overview', icon: LayoutDashboard },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'faculty-info', name: 'Faculty Info', icon: GraduationCap },
    { id: 'lessons', name: 'Manage Lessons', icon: BookOpen },
    { id: 'assignments', name: 'Assignments', icon: ClipboardList },
    { id: 'attendance', name: 'Attendance', icon: CheckCircle },
    { id: 'grades', name: 'Manage Results', icon: FileText },
    { id: 'test-portal', name: 'Test Portal', icon: ClipboardList },
    { id: 'remarks', name: 'Weekly Remarks', icon: MessageSquare },
    { id: 'datesheet', name: 'Date Sheet', icon: Calendar },
    { id: 'students', name: 'My Students', icon: Users },
    { id: 'settings', name: 'Settings', icon: Settings },
    ...(profile?.isCoordinator ? [{ id: 'coordinator', name: 'Coordinator Tools', icon: Trophy }] : []),
  ];

  return (
    <>
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
                <p className="text-xs text-white/40 truncate">Teacher</p>
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

const ManageLessons = ({ setToast }: { setToast: (t: any) => void }) => {
  const { profile } = useAuth();
  const [showAdd, setShowAdd] = useState(false);
  const [lessons, setLessons] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    subject: '',
    grade: '',
    date: new Date().toISOString().split('T')[0],
    summary: '',
    youtubeLink: '',
  });

  useEffect(() => {
    if (!profile) return;
    const q = query(
      collection(db, 'lessons'),
      where('teacherId', '==', profile.uid),
      orderBy('date', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLessons(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    try {
      await addDoc(collection(db, 'lessons'), {
        ...formData,
        teacherId: profile.uid,
        createdAt: serverTimestamp(),
      });
      setShowAdd(false);
      setFormData({
        subject: '',
        grade: '',
        date: new Date().toISOString().split('T')[0],
        summary: '',
        youtubeLink: '',
      });
      setToast({ message: 'Lesson added successfully!', type: 'success' });
    } catch (error) {
      console.error('Error adding lesson:', error);
      setToast({ message: 'Failed to add lesson', type: 'error' });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => setShowAdd(true)}
          className="btn-mind flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add New Lesson</span>
        </button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card p-8"
          >
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-mind-purple text-sm font-bold">Subject</label>
                <select 
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  className="w-full bg-mind-deep/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-mind-purple"
                >
                  <option value="">Select Subject</option>
                  {profile?.subjectsTaught?.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-mind-purple text-sm font-bold">Grade / Class</label>
                <input 
                  required
                  value={formData.grade}
                  onChange={(e) => setFormData({...formData, grade: e.target.value})}
                  className="w-full bg-mind-deep/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-mind-purple"
                  placeholder="e.g. 9th Grade"
                />
              </div>
              <div className="space-y-2">
                <label className="text-mind-purple text-sm font-bold">Date</label>
                <input 
                  required
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full bg-mind-deep/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-mind-purple"
                />
              </div>
              <div className="space-y-2">
                <label className="text-mind-purple text-sm font-bold">YouTube Video Link</label>
                <input 
                  value={formData.youtubeLink}
                  onChange={(e) => setFormData({...formData, youtubeLink: e.target.value})}
                  className="w-full bg-mind-deep/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-mind-purple"
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-mind-purple text-sm font-bold">Lesson Summary</label>
                <textarea 
                  required
                  value={formData.summary}
                  onChange={(e) => setFormData({...formData, summary: e.target.value})}
                  className="w-full bg-mind-deep/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-mind-purple h-32 resize-none"
                  placeholder="Enter a brief summary of the lesson..."
                />
              </div>
              <div className="md:col-span-2 flex justify-end space-x-4">
                <button 
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="px-6 py-3 text-white/60 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-mind flex items-center space-x-2">
                  <Save className="w-5 h-5" />
                  <span>Save Lesson</span>
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-4">
        {lessons.map(lesson => (
          <div key={lesson.id} className="glass-card p-6 flex items-center justify-between group">
            <div className="flex items-center space-x-6">
              <div className="w-12 h-12 mind-gradient rounded-xl flex items-center justify-center">
                <BookOpen className="text-white w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-lg">{lesson.subject} - {lesson.grade}</h4>
                <p className="text-xs text-white/40 flex items-center space-x-2">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(lesson.date).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>{lesson.youtubeLink ? 'Video Included' : 'Text Only'}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="p-2 hover:bg-white/5 rounded-lg text-white/60 hover:text-mind-purple transition-colors">
                <Edit3 className="w-5 h-5" />
              </button>
              <button className="p-2 hover:bg-white/5 rounded-lg text-white/60 hover:text-red-400 transition-colors">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ManageAttendance = ({ setToast }: { setToast: (t: any) => void }) => {
  const { profile } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState<{[key: string]: string}>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedGrade) {
      setStudents([]);
      return;
    }
    const q = query(collection(db, 'users'), where('role', '==', 'student'), where('grade', '==', selectedGrade));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedStudents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudents(fetchedStudents);
      
      // Initialize attendance data
      const initialData: {[key: string]: string} = {};
      fetchedStudents.forEach(s => {
        initialData[s.id] = 'present';
      });
      setAttendanceData(initialData);
    });
    return unsubscribe;
  }, [selectedGrade]);

  const handleMarkAll = (status: string) => {
    const newData = { ...attendanceData };
    students.forEach(s => {
      newData[s.id] = status;
    });
    setAttendanceData(newData);
  };

  const handleSave = async () => {
    if (!selectedSubject || !selectedGrade) {
      setToast({ message: 'Please select subject and grade', type: 'error' });
      return;
    }
    setLoading(true);
    try {
      const batch: any[] = [];
      for (const studentId in attendanceData) {
        batch.push(addDoc(collection(db, 'attendance'), {
          studentId,
          subject: selectedSubject,
          grade: selectedGrade,
          date,
          status: attendanceData[studentId],
          teacherId: profile?.uid,
          createdAt: serverTimestamp()
        }));
      }
      await Promise.all(batch);
      setToast({ message: 'Attendance saved successfully!', type: 'success' });
    } catch (error) {
      console.error('Error saving attendance:', error);
      setToast({ message: 'Failed to save attendance', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="glass-card p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className="text-mind-purple text-sm font-bold">Subject</label>
          <select 
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full bg-mind-deep/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-mind-purple"
          >
            <option value="">Select Subject</option>
            {profile?.subjectsTaught?.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-mind-purple text-sm font-bold">Grade / Class</label>
          <select 
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="w-full bg-mind-deep/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-mind-purple appearance-none"
          >
            <option value="">Select Class</option>
            <option value="9th">9th Class</option>
            <option value="10th">10th Class</option>
            <option value="11th">11th Class (1st Year)</option>
            <option value="12th">12th Class (2nd Year)</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-mind-purple text-sm font-bold">Date</label>
          <input 
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-mind-deep/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-mind-purple"
          />
        </div>
      </div>

      {students.length > 0 && (
        <div className="glass-card overflow-hidden">
          <div className="p-4 bg-white/5 flex items-center justify-between border-b border-white/10">
            <span className="font-bold">Student List ({students.length})</span>
            <div className="flex space-x-2">
              <button onClick={() => handleMarkAll('present')} className="text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-lg hover:bg-emerald-500/30 transition-all">All Present</button>
              <button onClick={() => handleMarkAll('absent')} className="text-xs bg-red-500/20 text-red-400 px-3 py-1 rounded-lg hover:bg-red-500/30 transition-all">All Absent</button>
            </div>
          </div>
          <div className="divide-y divide-white/5">
            {students.map(student => (
              <div key={student.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-mind-purple/20 flex items-center justify-center">
                    <User className="w-4 h-4 text-mind-purple" />
                  </div>
                  <span className="text-sm font-medium">{student.displayName}</span>
                </div>
                <div className="flex items-center space-x-4">
                  {['present', 'absent', 'late'].map(status => (
                    <label key={status} className="flex items-center space-x-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name={`attendance-${student.id}`}
                        checked={attendanceData[student.id] === status}
                        onChange={() => setAttendanceData({...attendanceData, [student.id]: status})}
                        className="text-mind-purple focus:ring-mind-purple bg-transparent border-white/20"
                      />
                      <span className="text-xs capitalize text-white/60">{status}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="p-6 bg-white/5 flex justify-end">
            <button 
              onClick={handleSave}
              disabled={loading}
              className="btn-mind flex items-center space-x-2"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
              <span>Save Attendance</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const ManageGrades = ({ setToast }: { setToast: (t: any) => void }) => {
  const { profile } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [loading, setLoading] = useState(false);
  const [newGrade, setNewGrade] = useState({
    studentId: '',
    score: '',
    totalMarks: '',
    type: 'Quiz', // Quiz, Midterm, Final, etc.
    testNumber: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (!selectedGrade) {
      setStudents([]);
      return;
    }
    const q = query(collection(db, 'users'), where('role', '==', 'student'), where('grade', '==', selectedGrade));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, [selectedGrade]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject || !newGrade.studentId) {
      setToast({ message: 'Please select subject and student', type: 'error' });
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, 'grades'), {
        ...newGrade,
        score: Number(newGrade.score),
        totalMarks: Number(newGrade.totalMarks),
        subject: selectedSubject,
        grade: selectedGrade,
        teacherId: profile?.uid,
        createdAt: serverTimestamp()
      });
      setToast({ message: 'Grade saved successfully!', type: 'success' });
      setNewGrade({ ...newGrade, score: '', totalMarks: '', testNumber: '' });
    } catch (error) {
      console.error('Error saving grade:', error);
      setToast({ message: 'Failed to save grade', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="glass-card p-8">
        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-mind-purple text-sm font-bold">Subject</label>
            <select 
              required
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full bg-mind-deep/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-mind-purple"
            >
              <option value="">Select Subject</option>
              {profile?.subjectsTaught?.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-mind-purple text-sm font-bold">Grade / Class</label>
            <input 
              required
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="w-full bg-mind-deep/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-mind-purple"
              placeholder="e.g. 9th Grade"
            />
          </div>
          <div className="space-y-2">
            <label className="text-mind-purple text-sm font-bold">Student</label>
            <select 
              required
              value={newGrade.studentId}
              onChange={(e) => setNewGrade({...newGrade, studentId: e.target.value})}
              className="w-full bg-mind-deep/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-mind-purple"
            >
              <option value="">Select Student</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.displayName}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-mind-purple text-sm font-bold">Assessment Type</label>
            <select 
              required
              value={newGrade.type}
              onChange={(e) => setNewGrade({...newGrade, type: e.target.value})}
              className="w-full bg-mind-deep/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-mind-purple"
            >
              <option value="Quiz">Quiz</option>
              <option value="Assignment">Assignment</option>
              <option value="Test Session">Test Session</option>
              <option value="Midterm">Midterm</option>
              <option value="Final">Final</option>
              <option value="Test">Test</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-mind-purple text-sm font-bold">Test Number (Optional)</label>
            <input 
              type="text"
              value={newGrade.testNumber}
              onChange={(e) => setNewGrade({...newGrade, testNumber: e.target.value})}
              className="w-full bg-mind-deep/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-mind-purple"
              placeholder="e.g. 1, 2, 3"
            />
          </div>
          <div className="space-y-2">
            <label className="text-mind-purple text-sm font-bold">Score</label>
            <input 
              required
              type="number"
              value={newGrade.score}
              onChange={(e) => setNewGrade({...newGrade, score: e.target.value})}
              className="w-full bg-mind-deep/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-mind-purple"
              placeholder="Obtained Marks"
            />
          </div>
          <div className="space-y-2">
            <label className="text-mind-purple text-sm font-bold">Total Marks</label>
            <input 
              required
              type="number"
              value={newGrade.totalMarks}
              onChange={(e) => setNewGrade({...newGrade, totalMarks: e.target.value})}
              className="w-full bg-mind-deep/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-mind-purple"
              placeholder="Maximum Marks"
            />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button type="submit" disabled={loading} className="btn-mind flex items-center space-x-2">
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
              <span>Save Result</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const StudentProgress = ({ student, onClose }: { student: any, onClose: () => void }) => {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const attQ = query(collection(db, 'attendance'), where('studentId', '==', student.id));
      const grdQ = query(collection(db, 'grades'), where('studentId', '==', student.id));
      
      const [attSnap, grdSnap] = await Promise.all([getDocs(attQ), getDocs(grdQ)]);
      
      setAttendance(attSnap.docs.map(doc => doc.data()));
      setGrades(grdSnap.docs.map(doc => doc.data()));
      setLoading(false);
    };
    fetchStats();
  }, [student.id]);

  const attendanceRate = attendance.length > 0 
    ? (attendance.filter(a => a.status === 'present').length / attendance.length * 100).toFixed(1)
    : '0';

  const avgGrade = grades.length > 0
    ? (grades.reduce((acc, curr) => acc + (curr.score / curr.totalMarks), 0) / grades.length * 100).toFixed(1)
    : '0';

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-white/5 rounded-lg">
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center space-x-4 mb-8">
          <div className="w-16 h-16 rounded-full mind-gradient p-[2px]">
            <div className="w-full h-full rounded-full bg-mind-deep flex items-center justify-center overflow-hidden">
              {student.photoURL ? <img src={student.photoURL} className="w-full h-full object-cover" /> : <User className="w-8 h-8 text-mind-purple" />}
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold">{student.displayName}</h3>
            <p className="text-white/40">{student.grade} Student</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/5 rounded-2xl p-6 text-center">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Attendance Rate</p>
            <p className="text-4xl font-bold text-emerald-400">{attendanceRate}%</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-6 text-center">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Average Grade</p>
            <p className="text-4xl font-bold text-mind-purple">{avgGrade}%</p>
          </div>
        </div>

        <div className="space-y-6">
          <h4 className="font-bold border-b border-white/10 pb-2">Recent Results</h4>
          {grades.length > 0 ? (
            <div className="space-y-3">
              {grades.slice(0, 5).map((g, i) => (
                <div key={i} className="flex items-center justify-between text-sm bg-white/5 p-3 rounded-xl">
                  <span>{g.subject} ({g.type})</span>
                  <span className="font-bold">{g.score}/{g.totalMarks}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-white/40 italic">No results recorded yet.</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const ManageTestResults = ({ setToast }: { setToast: (t: any) => void }) => {
  const { profile } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [testDate, setTestDate] = useState(new Date().toISOString().split('T')[0]);
  const [week, setWeek] = useState('1');
  const [totalMarks, setTotalMarks] = useState('100');
  const [marksData, setMarksData] = useState<{[key: string]: string}>({});
  const [loading, setLoading] = useState(false);
  const [existingResults, setExistingResults] = useState<any[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [showCoordinatorPanel, setShowCoordinatorPanel] = useState(false);
  const [dateSheetEntries, setDateSheetEntries] = useState<DateSheetEntry[]>([]);
  const [showDateSheetSelector, setShowDateSheetSelector] = useState(false);

  useEffect(() => {
    if (!selectedGrade) return;
    const q = query(collection(db, 'dateSheets'), where('grade', '==', selectedGrade), orderBy('date', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setDateSheetEntries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DateSheetEntry)));
    });
    return unsubscribe;
  }, [selectedGrade]);

  const weeks = [
    ...Array.from({ length: 14 }, (_, i) => (i + 1).toString()),
    'FLP'
  ];

  useEffect(() => {
    if (!selectedGrade || !selectedSubject) {
      setStudents([]);
      return;
    }
    const q = query(collection(db, 'users'), where('role', '==', 'student'), where('grade', '==', selectedGrade));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allStudents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const filtered = allStudents.filter((s: any) => s.enrolledSubjects?.includes(selectedSubject));
      setStudents(filtered);
    });
    return unsubscribe;
  }, [selectedGrade, selectedSubject]);

  useEffect(() => {
    if (!selectedSubject || !selectedGrade || !testDate) return;

    const q = query(
      collection(db, 'testResults'),
      where('subject', '==', selectedSubject),
      where('class', '==', selectedGrade),
      where('testDate', '==', testDate)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setExistingResults(results);
      setIsLocked(results.length > 0);
      
      if (results.length > 0) {
        const data: any = {};
        results.forEach((r: any) => {
          const student = students.find(s => (s.username || s.id.slice(0, 4)) === r.rollNumber);
          if (student) data[student.id] = r.obtainedMarks;
        });
        setMarksData(data);
      }
    });

    return unsubscribe;
  }, [selectedSubject, selectedGrade, testDate, students]);

  const handleSave = async () => {
    if (isLocked && !profile?.isCoordinator) {
      setToast({ message: 'Results are locked. Contact a coordinator.', type: 'error' });
      return;
    }

    if (!selectedSubject || !selectedGrade || !testDate) {
      setToast({ message: 'Please fill all header fields', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const batch: any[] = [];
      for (const studentId in marksData) {
        const student = students.find(s => s.id === studentId);
        if (marksData[studentId].trim() !== '') {
          const rollNo = student?.username || student?.id.slice(0, 4);
          const existing = existingResults.find((r: any) => r.rollNumber === rollNo);
          
          if (existing) {
            batch.push(deleteDoc(doc(db, 'testResults', existing.id)));
          }

          batch.push(addDoc(collection(db, 'testResults'), {
            rollNumber: rollNo,
            studentName: student?.displayName,
            class: selectedGrade,
            subject: selectedSubject,
            obtainedMarks: marksData[studentId].toUpperCase(),
            totalMarks: totalMarks,
            testDate: testDate,
            week: week,
            teacherId: profile?.uid,
            status: existing ? 'EDITED' : 'UPLOADED',
            lastEditedBy: profile?.uid,
            lastEditedAt: new Date().toISOString(),
            createdAt: existing ? existing.createdAt : new Date().toISOString()
          }));
        }
      }
      await Promise.all(batch);
      setToast({ message: 'Results processed successfully!', type: 'success' });
    } catch (error) {
      console.error('Error saving results:', error);
      setToast({ message: 'Failed to process results', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteResult = async (resultId: string) => {
    if (!profile?.isCoordinator) return;
    try {
      await deleteDoc(doc(db, 'testResults', resultId));
      setToast({ message: 'Result deleted.', type: 'success' });
    } catch (error) {
      console.error('Error deleting result:', error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs text-white/40 uppercase tracking-widest font-black">
          <Shield className="w-4 h-4 text-mind-purple" />
          <span>Authority Control System</span>
        </div>
        {profile?.isCoordinator && (
          <button 
            onClick={() => setShowCoordinatorPanel(!showCoordinatorPanel)}
            className={cn(
              "flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
              showCoordinatorPanel ? "bg-amber-500 text-white" : "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
            )}
          >
            <Star className="w-4 h-4" />
            <span>{showCoordinatorPanel ? 'Close Coordinator Panel' : 'Coordinator Mode'}</span>
          </button>
        )}
      </div>

      <div className="glass-card p-8 grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="space-y-2">
          <label className="text-mind-purple text-xs font-black uppercase tracking-wider">Schedule Ref</label>
          <button 
            onClick={() => setShowDateSheetSelector(true)}
            className="w-full flex items-center justify-between bg-mind-deep/50 border border-white/10 rounded-xl px-4 py-3 hover:border-mind-purple transition-all group"
          >
            <span className="text-xs text-white/60 group-hover:text-white">Select Test</span>
            <Calendar className="w-4 h-4 text-mind-purple" />
          </button>
        </div>
        <div className="space-y-2">
          <label className="text-mind-purple text-xs font-black uppercase tracking-wider">Subject</label>
          <select 
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full bg-mind-deep/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-mind-purple"
          >
            <option value="">Select Subject</option>
            {profile?.subjectsTaught?.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-mind-purple text-xs font-black uppercase tracking-wider">Class</label>
          <select 
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="w-full bg-mind-deep/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-mind-purple"
          >
            <option value="">Select Class</option>
            <option value="9th">9th Class</option>
            <option value="10th">10th Class</option>
            <option value="11th">11th Class (1st Year)</option>
            <option value="12th">12th Class (2nd Year)</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-mind-purple text-xs font-black uppercase tracking-wider">Test Date</label>
          <input 
            type="date"
            value={testDate}
            onChange={(e) => setTestDate(e.target.value)}
            className="w-full bg-mind-deep/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-mind-purple"
          />
        </div>
        <div className="space-y-2">
          <label className="text-mind-purple text-xs font-black uppercase tracking-wider">Week / Total</label>
          <div className="flex space-x-2">
            <select 
              value={week}
              onChange={(e) => setWeek(e.target.value)}
              className="w-20 bg-mind-deep/50 border border-white/10 rounded-xl px-2 py-3 outline-none focus:border-mind-purple"
            >
              {weeks.map(w => <option key={w} value={w}>{w === 'FLP' ? 'FLP' : `W${w}`}</option>)}
            </select>
            <input 
              type="number"
              value={totalMarks}
              onChange={(e) => setTotalMarks(e.target.value)}
              className="flex-grow bg-mind-deep/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-mind-purple"
              placeholder="Total"
            />
          </div>
        </div>
      </div>

      <Modal
        isOpen={showDateSheetSelector}
        onClose={() => setShowDateSheetSelector(false)}
        title="Select Test from Date Sheet"
        onConfirm={() => {}}
        confirmText="Close"
      >
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
          {!selectedGrade && <p className="text-center text-white/40 py-4">Please select a class first.</p>}
          {dateSheetEntries.filter(e => !e.isHoliday).map(entry => (
            <button
              key={entry.id}
              onClick={() => {
                setTestDate(entry.date);
                setWeek(entry.testNumber);
                const commonSubjects = entry.subjects.filter(s => profile?.subjectsTaught?.includes(s));
                if (commonSubjects.length === 1) {
                  setSelectedSubject(commonSubjects[0]);
                }
                setShowDateSheetSelector(false);
              }}
              className="w-full text-left p-4 rounded-xl bg-white/5 border border-white/10 hover:border-mind-purple hover:bg-mind-purple/5 transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-mind-purple uppercase tracking-widest">Test #{entry.testNumber}</span>
                <span className="text-[10px] text-white/40">{entry.date} ({entry.day})</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-2">
                {entry.subjects.map(s => (
                  <span key={s} className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-bold",
                    profile?.subjectsTaught?.includes(s) ? "bg-mind-purple text-white" : "bg-white/10 text-white/40"
                  )}>
                    {s}
                  </span>
                ))}
              </div>
              <p className="text-[10px] text-white/60 line-clamp-1 italic">{entry.syllabus}</p>
            </button>
          ))}
          {selectedGrade && dateSheetEntries.length === 0 && (
            <p className="text-center text-white/40 py-4">No date sheet entries found for this class.</p>
          )}
        </div>
      </Modal>

      {isLocked && !showCoordinatorPanel && (
        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-center space-x-4">
          <Lock className="w-6 h-6 text-amber-500" />
          <div>
            <p className="text-amber-500 font-bold text-sm">Results Locked</p>
            <p className="text-[10px] text-white/60">Results for this date and subject are locked. Only a coordinator can edit them.</p>
          </div>
        </div>
      )}

      {selectedSubject && selectedGrade && (
        <div className="glass-card overflow-hidden">
          <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
            <h3 className="font-black uppercase tracking-widest text-xs">Student List - Bulk Entry</h3>
            <p className="text-[10px] text-white/40 italic">Enter 'A' for Absent students</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/5">
                  <th className="p-4 text-[10px] font-black text-white/40 uppercase tracking-widest">Roll No</th>
                  <th className="p-4 text-[10px] font-black text-white/40 uppercase tracking-widest">Student Name</th>
                  <th className="p-4 text-[10px] font-black text-white/40 uppercase tracking-widest">Obtained Marks</th>
                  {showCoordinatorPanel && <th className="p-4 text-[10px] font-black text-white/40 uppercase tracking-widest text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {students.map(student => {
                  const rollNo = student.username || student.id.slice(0, 4);
                  const result = existingResults.find(r => r.rollNumber === rollNo);
                  
                  return (
                    <tr key={student.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 text-sm font-bold text-mind-purple">{rollNo}</td>
                      <td className="p-4 text-sm font-medium">{student.displayName}</td>
                      <td className="p-4">
                        <input 
                          disabled={isLocked && !showCoordinatorPanel}
                          type="text"
                          value={marksData[student.id] || ''}
                          onChange={(e) => setMarksData({...marksData, [student.id]: e.target.value})}
                          placeholder="Marks / A"
                          className={cn(
                            "w-32 bg-mind-deep/50 border border-white/10 rounded-lg px-4 py-2 outline-none text-center font-black transition-all",
                            isLocked && !showCoordinatorPanel ? "opacity-50 cursor-not-allowed" : "focus:border-mind-purple"
                          )}
                        />
                      </td>
                      {showCoordinatorPanel && (
                        <td className="p-4 text-right">
                          {result && (
                            <button 
                              onClick={() => handleDeleteResult(result.id)}
                              className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
                {students.length === 0 && (
                  <tr>
                    <td colSpan={showCoordinatorPanel ? 4 : 3} className="p-12 text-center text-white/40 italic text-sm">
                      No students found for this grade and subject.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-8 bg-white/5 flex justify-end">
            <button 
              onClick={handleSave}
              disabled={loading || (isLocked && !showCoordinatorPanel)}
              className="btn-mind px-12 py-4 rounded-2xl flex items-center space-x-3 shadow-2xl"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-6 h-6" />
                  <span className="font-black uppercase tracking-widest">{isLocked ? 'Update Results' : 'Save & Upload Results'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const ProgressGraph = () => {
  const { profile } = useAuth();
  const [selectedSubject, setSelectedSubject] = useState('');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedSubject) return;

    setLoading(true);
    const q = query(
      collection(db, 'testResults'),
      where('subject', '==', selectedSubject),
      orderBy('testDate', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const results = snapshot.docs.map(doc => doc.data());
      
      // Group by date and calculate average
      const grouped = results.reduce((acc: any, curr: any) => {
        if (!acc[curr.testDate]) {
          acc[curr.testDate] = { date: curr.testDate, total: 0, count: 0, max: Number(curr.totalMarks) };
        }
        const marks = curr.obtainedMarks === 'A' ? 0 : Number(curr.obtainedMarks);
        acc[curr.testDate].total += marks;
        acc[curr.testDate].count += 1;
        return acc;
      }, {});

      const chartData = Object.values(grouped).map((g: any) => ({
        date: new Date(g.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        average: Math.round((g.total / g.count) / g.max * 100)
      }));

      setData(chartData);
      setLoading(false);
    });

    return unsubscribe;
  }, [selectedSubject]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-black uppercase tracking-widest text-xs flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-mind-purple" />
          <span>Performance Analytics</span>
        </h3>
        <select 
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="bg-mind-deep/50 border border-white/10 rounded-xl px-4 py-2 text-xs outline-none focus:border-mind-purple"
        >
          <option value="">Select Subject</option>
          {profile?.subjectsTaught?.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="glass-card p-8 h-[400px]">
        {selectedSubject ? (
          loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-mind-purple border-t-transparent rounded-full animate-spin" />
            </div>
          ) : data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="rgba(255,255,255,0.4)" 
                  fontSize={10} 
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.4)" 
                  fontSize={10} 
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0A0118', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="average" 
                  name="Class Average %"
                  stroke="#A855F7" 
                  strokeWidth={4}
                  dot={{ fill: '#A855F7', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 8, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-white/40 space-y-4">
              <BarChart2 className="w-12 h-12 opacity-20" />
              <p className="text-sm italic">No test data available for this subject yet.</p>
            </div>
          )
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-white/40 space-y-4">
            <TrendingUp className="w-12 h-12 opacity-20" />
            <p className="text-sm italic">Select a subject to view performance trends.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const WeeklyRemarks = ({ setToast }: { setToast: (t: any) => void }) => {
  const { profile } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [remarks, setRemarks] = useState<{[key: string]: string}>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedGrade || !selectedSubject) {
      setStudents([]);
      return;
    }
    const q = query(collection(db, 'users'), where('role', '==', 'student'), where('grade', '==', selectedGrade));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allStudents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const filtered = allStudents.filter((s: any) => s.enrolledSubjects?.includes(selectedSubject));
      setStudents(filtered);
    });
    return unsubscribe;
  }, [selectedGrade, selectedSubject]);

  const handleSave = async () => {
    if (!selectedGrade || !selectedSubject) return;
    setLoading(true);
    try {
      const batch = [];
      for (const studentId in remarks) {
        batch.push(addDoc(collection(db, 'remarks'), {
          studentId,
          teacherId: profile?.uid,
          subject: selectedSubject,
          status: remarks[studentId],
          date: new Date().toISOString(),
          createdAt: serverTimestamp()
        }));
      }
      await Promise.all(batch);
      setToast({ message: 'Remarks saved successfully!', type: 'success' });
      setRemarks({});
    } catch (error) {
      console.error('Error saving remarks:', error);
      setToast({ message: 'Failed to save remarks', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="glass-card p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-mind-purple text-xs font-black uppercase tracking-wider">Class</label>
          <select 
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="w-full bg-mind-deep/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-mind-purple"
          >
            <option value="">Select Class</option>
            <option value="9th">9th Class</option>
            <option value="10th">10th Class</option>
            <option value="11th">11th Class (1st Year)</option>
            <option value="12th">12th Class (2nd Year)</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-mind-purple text-xs font-black uppercase tracking-wider">Subject</label>
          <select 
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full bg-mind-deep/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-mind-purple"
          >
            <option value="">Select Subject</option>
            {profile?.subjectsTaught?.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {students.length > 0 && (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5">
                <th className="p-4 text-xs font-bold">Student</th>
                <th className="p-4 text-xs font-bold">Performance Remark</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {students.map(student => (
                <tr key={student.id}>
                  <td className="p-4">
                    <p className="font-bold">{student.displayName}</p>
                    <p className="text-xs text-white/40">{student.username || student.id.slice(0, 8)}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex space-x-2">
                      {['Good', 'Average', 'Needs Improvement'].map(status => (
                        <button
                          key={status}
                          onClick={() => setRemarks({...remarks, [student.id]: status})}
                          className={cn(
                            "px-3 py-1 rounded-lg text-[10px] font-bold transition-all",
                            remarks[student.id] === status 
                              ? (status === 'Good' ? "bg-emerald-500 text-white" : status === 'Average' ? "bg-amber-500 text-white" : "bg-red-500 text-white")
                              : "bg-white/5 text-white/40 hover:bg-white/10"
                          )}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-6 bg-white/5 flex justify-end">
            <button 
              onClick={handleSave}
              disabled={loading || Object.keys(remarks).length === 0}
              className="btn-mind px-8"
            >
              {loading ? 'Saving...' : 'Save All Remarks'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const DateSheetView = () => {
  const { profile } = useAuth();
  const [entries, setEntries] = useState<DateSheetEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGrade, setSelectedGrade] = useState('11th');

  useEffect(() => {
    const q = query(collection(db, 'dateSheets'), where('grade', '==', selectedGrade), orderBy('date', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setEntries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DateSheetEntry)));
      setLoading(false);
    });
    return unsubscribe;
  }, [selectedGrade]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-4">
          <select 
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="bg-mind-deep/50 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-mind-purple"
          >
            <option value="11th">11th Class (1st Year)</option>
            <option value="12th">12th Class (2nd Year)</option>
            <option value="9th">9th Class</option>
            <option value="10th">10th Class</option>
          </select>
        </div>
        <div className="flex items-center space-x-2 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-mind-purple rounded" />
            <span className="text-white/60">Your Subjects</span>
          </div>
          <div className="flex items-center space-x-1 ml-4">
            <div className="w-3 h-3 bg-white/5 rounded" />
            <span className="text-white/60">Other Subjects</span>
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest">Date / Day</th>
                <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest">Subject(s)</th>
                <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest">Test #</th>
                <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest">Syllabus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {entries.map(entry => {
                const mySubjects = entry.subjects.filter(s => profile?.subjectsTaught?.includes(s));
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
                          const isMine = profile?.subjectsTaught?.includes(s);
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
                  </tr>
                );
              })}
              {entries.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center text-white/40 italic">
                    No date sheet entries found for this class.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const MyStudents = () => {
  const { profile } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!profile?.subjectsTaught || profile.subjectsTaught.length === 0) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'users'),
      where('role', '==', 'student'),
      where('enrolledSubjects', 'array-contains-any', profile.subjectsTaught)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return unsubscribe;
  }, [profile]);

  const filteredStudents = students.filter(s => 
    s.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.username && s.username.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) return <div className="flex justify-center p-20"><div className="w-8 h-8 border-4 border-mind-purple border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-black uppercase tracking-widest text-xs flex items-center space-x-2">
          <Users className="w-4 h-4 text-mind-purple" />
          <span>My Students ({filteredStudents.length})</span>
        </h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          <input 
            type="text"
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-mind-deep/50 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs outline-none focus:border-mind-purple w-64"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.map(student => (
          <div key={student.id} className="glass-card p-4 flex items-center justify-between group hover:border-mind-purple/50 transition-all">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-mind-purple/20 flex items-center justify-center overflow-hidden text-mind-purple font-black">
                {student.photoURL ? <img src={student.photoURL} className="w-full h-full object-cover" /> : student.displayName[0]}
              </div>
              <div>
                <p className="font-bold text-sm">{student.displayName}</p>
                <div className="flex items-center space-x-2">
                  <p className="text-[10px] text-white/40">{student.grade || 'Grade N/A'}</p>
                  <span className="text-[10px] text-mind-purple font-bold">Roll: {student.username || 'N/A'}</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setSelectedStudent(student)}
              className="p-2 hover:bg-mind-purple/20 rounded-lg text-mind-purple transition-all"
            >
              <TrendingUp className="w-5 h-5" />
            </button>
          </div>
        ))}
        {filteredStudents.length === 0 && (
          <div className="col-span-full py-20 text-center text-white/40 italic text-sm">
            No students found matching your search or assigned subjects.
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedStudent && (
          <StudentProgress 
            student={selectedStudent} 
            onClose={() => setSelectedStudent(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const CoordinatorTools = ({ setToast }: { setToast: (t: any) => void }) => {
  const { profile } = useAuth();
  const [achievers, setAchievers] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newAchiever, setNewAchiever] = useState({
    studentName: '',
    rollNumber: '',
    obtainedMarks: '',
    totalMarks: '',
    grade: '',
    photoURL: ''
  });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'achievers'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAchievers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, []);

  const handleAddAchiever = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    try {
      await addDoc(collection(db, 'achievers'), {
        ...newAchiever,
        obtainedMarks: Number(newAchiever.obtainedMarks),
        totalMarks: Number(newAchiever.totalMarks),
        teacherId: profile.uid,
        createdAt: new Date().toISOString()
      });
      setShowAdd(false);
      setNewAchiever({ studentName: '', rollNumber: '', obtainedMarks: '', totalMarks: '', grade: '', photoURL: '' });
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'achievers', id));
      setToast({ type: 'success', message: 'Achiever removed successfully' });
    } catch (error) {
      console.error(error);
      setToast({ type: 'error', message: 'Failed to remove achiever' });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <button onClick={() => setShowAdd(true)} className="btn-mind flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>Add Achiever</span>
        </button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="glass-card p-6">
            <form onSubmit={handleAddAchiever} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input 
                required 
                placeholder="Student Name" 
                value={newAchiever.studentName} 
                onChange={e => setNewAchiever({...newAchiever, studentName: e.target.value})}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-mind-purple"
              />
              <input 
                required 
                placeholder="Roll Number" 
                value={newAchiever.rollNumber} 
                onChange={e => setNewAchiever({...newAchiever, rollNumber: e.target.value})}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-mind-purple"
              />
              <input 
                required 
                type="number"
                placeholder="Obtained Marks" 
                value={newAchiever.obtainedMarks} 
                onChange={e => setNewAchiever({...newAchiever, obtainedMarks: e.target.value})}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-mind-purple"
              />
              <input 
                required 
                type="number"
                placeholder="Total Marks" 
                value={newAchiever.totalMarks} 
                onChange={e => setNewAchiever({...newAchiever, totalMarks: e.target.value})}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-mind-purple"
              />
              <input 
                required 
                placeholder="Class (e.g., 10th Grade)" 
                value={newAchiever.grade} 
                onChange={e => setNewAchiever({...newAchiever, grade: e.target.value})}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-mind-purple"
              />
              <input 
                placeholder="Photo URL (Optional)" 
                value={newAchiever.photoURL} 
                onChange={e => setNewAchiever({...newAchiever, photoURL: e.target.value})}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-mind-purple"
              />
              <div className="md:col-span-2 flex justify-end space-x-4">
                <button type="button" onClick={() => setShowAdd(false)} className="text-white/60">Cancel</button>
                <button type="submit" className="btn-mind">Save Achiever</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {achievers.map(achiever => (
          <div key={achiever.id} className="glass-card p-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-mind-purple/20 flex items-center justify-center overflow-hidden">
                {achiever.photoURL ? <img src={achiever.photoURL} className="w-full h-full object-cover" /> : <Trophy className="w-6 h-6 text-mind-purple" />}
              </div>
              <div>
                <p className="font-bold">{achiever.studentName}</p>
                <p className="text-xs text-white/40">Roll: {achiever.rollNumber} | {achiever.grade}</p>
                <p className="text-xs text-mind-purple font-bold">{achiever.obtainedMarks}/{achiever.totalMarks}</p>
              </div>
            </div>
            <button onClick={() => setConfirmDelete(achiever.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>

      <Modal 
        isOpen={!!confirmDelete} 
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
        title="Remove Achiever"
        confirmText="Remove"
        variant="danger"
      >
        Are you sure you want to remove this achiever?
      </Modal>
    </div>
  );
};

const SettingsView = ({ setToast }: { setToast: (t: any) => void }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setToast({ type: 'error', message: 'Passwords do not match' });
      return;
    }
    if (newPassword.length < 6) {
      setToast({ type: 'error', message: 'Password must be at least 6 characters' });
      return;
    }

    setLoading(true);
    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
        setToast({ type: 'success', message: 'Password updated successfully!' });
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error: any) {
      console.error('Error updating password:', error);
      setToast({ type: 'error', message: error.message || 'Failed to update password' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-8">
      <div className="glass-card p-8">
        <h3 className="text-xl font-bold mb-6 flex items-center space-x-2">
          <Lock className="w-5 h-5 text-mind-purple" />
          <span>Change Password</span>
        </h3>

        <form onSubmit={handleUpdatePassword} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/60">New Password</label>
            <input
              required
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-mind-purple transition-all"
              placeholder="Min. 6 characters"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/60">Confirm New Password</label>
            <input
              required
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-mind-purple transition-all"
              placeholder="Repeat new password"
            />
          </div>
          <button
            disabled={loading}
            type="submit"
            className="w-full btn-mind flex items-center justify-center space-x-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Update Password</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

const Overview = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    students: 0,
    lessons: 0,
    assignments: 0
  });

  useEffect(() => {
    if (!profile) return;
    
    const fetchStats = async () => {
      const lessonsQ = query(collection(db, 'lessons'), where('teacherId', '==', profile.uid));
      const studentsQ = query(collection(db, 'users'), where('role', '==', 'student'));
      const assignmentsQ = query(collection(db, 'assignments'), where('teacherId', '==', profile.uid));
      
      const [lessonsSnap, studentsSnap, assignmentsSnap] = await Promise.all([
        getDocs(lessonsQ),
        getDocs(studentsQ),
        getDocs(assignmentsQ)
      ]);
      
      setStats({
        students: studentsSnap.size,
        lessons: lessonsSnap.size,
        assignments: assignmentsSnap.size
      });
    };
    
    fetchStats();
  }, [profile]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-8 text-center">
          <Users className="w-10 h-10 text-mind-purple mx-auto mb-4" />
          <h3 className="text-3xl font-bold">{stats.students}</h3>
          <p className="text-white/40">Total Students</p>
        </div>
        <div className="glass-card p-8 text-center">
          <BookOpen className="w-10 h-10 text-blue-400 mx-auto mb-4" />
          <h3 className="text-3xl font-bold">{stats.lessons}</h3>
          <p className="text-white/40">Lessons Delivered</p>
        </div>
        <div className="glass-card p-8 text-center">
          <ClipboardList className="w-10 h-10 text-emerald-400 mx-auto mb-4" />
          <h3 className="text-3xl font-bold">{stats.assignments}</h3>
          <p className="text-white/40">Active Assignments</p>
        </div>
      </div>
    </div>
  );
};

const FacultyInfo = ({ setToast }: { setToast: (t: any) => void }) => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    qualification: profile?.facultyInfo?.qualification || '',
    currentRole: profile?.facultyInfo?.currentRole || '',
    subjects: profile?.facultyInfo?.subjects || '',
    subjectGuide: profile?.facultyInfo?.subjectGuide || '',
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', profile.uid), {
        facultyInfo: formData,
        // Also update top-level fields for compatibility with FacultyPage
        subjectsTaught: formData.subjects.split(',').map((s: string) => s.trim()),
        bio: formData.subjectGuide,
        experience: formData.qualification
      });
      setToast({ message: 'Faculty information updated successfully!', type: 'success' });
    } catch (error) {
      console.error('Error updating faculty info:', error);
      setToast({ message: 'Failed to update information', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">Faculty <span className="text-mind-purple">Profile Setup</span></h2>
        <p className="text-white/60">Please answer the following questions to complete your public faculty profile.</p>
      </div>

      <form onSubmit={handleSave} className="glass-card p-8 space-y-8">
        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-lg font-bold text-mind-purple flex items-center space-x-2">
              <GraduationCap className="w-5 h-5" />
              <span>What is your highest qualification?</span>
            </label>
            <input 
              required
              value={formData.qualification}
              onChange={(e) => setFormData({...formData, qualification: e.target.value})}
              className="w-full bg-mind-deep/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-mind-purple transition-all"
              placeholder="e.g. M.Phil in Physics, PhD in Mathematics"
            />
          </div>

          <div className="space-y-3">
            <label className="text-lg font-bold text-mind-purple flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>What is your current role in the academy?</span>
            </label>
            <input 
              required
              value={formData.currentRole}
              onChange={(e) => setFormData({...formData, currentRole: e.target.value})}
              className="w-full bg-mind-deep/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-mind-purple transition-all"
              placeholder="e.g. Senior Physics Lecturer, Head of Science Department"
            />
          </div>

          <div className="space-y-3">
            <label className="text-lg font-bold text-mind-purple flex items-center space-x-2">
              <BookOpen className="w-5 h-5" />
              <span>Which subjects do you currently teach?</span>
            </label>
            <input 
              required
              value={formData.subjects}
              onChange={(e) => setFormData({...formData, subjects: e.target.value})}
              className="w-full bg-mind-deep/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-mind-purple transition-all"
              placeholder="e.g. Physics, Mathematics (comma separated)"
            />
          </div>

          <div className="space-y-3">
            <label className="text-lg font-bold text-mind-purple flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Provide a brief guide or advice for students in your subjects.</span>
            </label>
            <textarea 
              required
              value={formData.subjectGuide}
              onChange={(e) => setFormData({...formData, subjectGuide: e.target.value})}
              className="w-full bg-mind-deep/50 border border-white/10 rounded-xl px-4 py-4 outline-none focus:border-mind-purple transition-all h-40 resize-none"
              placeholder="Share some tips, study guides, or general advice for your students..."
            />
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button 
            type="submit" 
            disabled={loading}
            className="btn-mind px-10 py-4 text-lg flex items-center space-x-3"
          >
            {loading ? (
              <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-6 h-6" />
            )}
            <span>Save Profile Information</span>
          </button>
        </div>
      </form>

      <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-2xl flex items-start space-x-4">
        <AlertCircle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-1" />
        <div className="space-y-1">
          <h4 className="font-bold text-amber-500">Public Profile Note</h4>
          <p className="text-sm text-white/60">
            This information will be visible to students and parents on the "Experienced Faculty" page. 
            Your profile picture must be uploaded by the IT Department.
          </p>
        </div>
      </div>
    </div>
  );
};

// --- Main Dashboard ---
export default function TeacherDashboard() {
  const { profile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  if (loading) return <div className="pt-32 text-center">Loading Dashboard...</div>;
  if (!profile || profile.role !== 'teacher') {
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
            <div className="hidden md:flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-bold">{profile.displayName}</p>
                <p className="text-[10px] text-white/40 uppercase tracking-wider">Teacher</p>
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
              {activeTab === 'notifications' && <Notifications role={profile?.role} uid={profile?.uid} />}
              {activeTab === 'faculty-info' && <FacultyInfo setToast={setToast} />}
              {activeTab === 'lessons' && <ManageLessons setToast={setToast} />}
              {activeTab === 'assignments' && <div className="py-20 text-center glass-card text-white/40">Assignments Management Placeholder</div>}
               {activeTab === 'attendance' && <ManageAttendance setToast={setToast} />}
               {activeTab === 'grades' && <ManageGrades setToast={setToast} />}
               {activeTab === 'test-portal' && <ManageTestResults setToast={setToast} />}
               {activeTab === 'remarks' && <WeeklyRemarks setToast={setToast} />}
               {activeTab === 'datesheet' && <DateSheetView />}
              {activeTab === 'students' && <MyStudents />}
              {activeTab === 'settings' && <SettingsView setToast={setToast} />}
              {activeTab === 'coordinator' && <CoordinatorTools setToast={setToast} />}
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
