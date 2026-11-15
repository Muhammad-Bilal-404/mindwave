import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { db, auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, getDocs, doc, getDoc, updateDoc, arrayUnion, orderBy, limit } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, GraduationCap, Calendar, 
  CheckCircle, MessageSquare, BookOpen,
  TrendingUp, Award, Clock, User, LogOut, 
  Menu, X, Bell, Phone, Mail, Search,
  Plus, AlertCircle, Check, Shield, FileText, Video
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Toast } from '../components/Toast';

// --- Sub-Components ---

const VerificationPortal = ({ setToast }: { setToast: (t: any) => void }) => {
  const { profile } = useAuth();
  const [searchEmail, setSearchEmail] = useState('');
  const [searchRoll, setSearchRoll] = useState('');
  const [searching, setSearching] = useState(false);
  
  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchEmail.trim() || !searchRoll.trim()) return;
    
    setSearching(true);
    
    try {
      // Find student by email AND roll number (username)
      const q = query(
        collection(db, 'users'), 
        where('email', '==', searchEmail), 
        where('username', '==', searchRoll),
        where('role', '==', 'student')
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setToast({ type: 'error', message: 'Student not found. Please verify the email and roll number.' });
        setSearching(false);
        return;
      }

      const studentDoc = querySnapshot.docs[0];
      const studentId = studentDoc.id;

      // Check if already requested or verified
      if (profile?.verifiedStudentIds?.includes(studentId) || profile?.pendingStudentIds?.includes(studentId)) {
        setToast({ type: 'error', message: 'Access already requested or verified for this student.' });
        setSearching(false);
        return;
      }

      // Update parent profile with pending request
      await updateDoc(doc(db, 'users', profile!.uid), {
        pendingStudentIds: arrayUnion(studentId)
      });

      setToast({ type: 'success', message: 'Access request sent to IT team for verification.' });
      setSearchEmail('');
      setSearchRoll('');
    } catch (error) {
      console.error('Error requesting access:', error);
      setToast({ type: 'error', message: 'Failed to send request. Please try again.' });
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <p className="text-white/60">To access the portal, link your account with your child's student profile. You must provide their academy email and roll number as proof of relationship.</p>
      </div>

      <div className="glass-card p-8">
        <form onSubmit={handleRequestAccess} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/60 mb-2">Student's Academy Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-5 h-5" />
                <input
                  type="email"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  placeholder="child@mindwave.edu"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-mind-purple transition-colors"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/60 mb-2">Student's Roll Number</label>
              <div className="relative">
                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-5 h-5" />
                <input
                  type="text"
                  value={searchRoll}
                  onChange={(e) => setSearchRoll(e.target.value)}
                  placeholder="Roll No"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-mind-purple transition-colors"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={searching}
            className="w-full btn-mind flex items-center justify-center space-x-2 py-4"
          >
            {searching ? (
              <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Plus className="w-5 h-5" />
                <span>Verify & Request Access</span>
              </>
            )}
          </button>
        </form>
      </div>

      {(profile?.pendingStudentIds?.length || 0) > 0 && (
        <div className="mt-12">
          <h3 className="text-lg font-bold mb-4 flex items-center space-x-2">
            <Clock className="w-5 h-5 text-mind-purple" />
            <span>Pending Verifications</span>
          </h3>
          <div className="space-y-4">
            {profile?.pendingStudentIds?.map((id) => (
              <PendingStudentItem key={id} studentId={id} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const PendingStudentItem = ({ studentId }: { studentId: string }) => {
  const [student, setStudent] = useState<any>(null);

  useEffect(() => {
    const fetchStudent = async () => {
      const docSnap = await getDoc(doc(db, 'users', studentId));
      if (docSnap.exists()) setStudent(docSnap.data());
    };
    fetchStudent();
  }, [studentId]);

  if (!student) return null;

  return (
    <div className="glass-card p-4 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
          <User className="w-5 h-5 text-white/40" />
        </div>
        <div>
          <p className="text-sm font-bold">{student.displayName}</p>
          <p className="text-xs text-white/40">{student.email}</p>
        </div>
      </div>
      <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
        Awaiting IT Approval
      </span>
    </div>
  );
};

const Sidebar = ({ activeTab, setActiveTab, isOpen, setIsOpen, verifiedStudents, selectedStudentId, setSelectedStudentId }: any) => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  const menuItems = [
    { id: 'overview', name: 'Child Overview', icon: LayoutDashboard },
    { id: 'grades', name: 'Grades & Results', icon: Award },
    { id: 'attendance', name: 'Attendance', icon: CheckCircle },
    { id: 'lessons', name: 'Daily Lessons', icon: BookOpen },
    { id: 'teachers', name: 'Contact Teachers', icon: Phone },
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
          "fixed top-0 left-0 bottom-0 w-72 bg-mind-deep border-r border-white/10 z-50 lg:translate-x-0 lg:static lg:block",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 mind-gradient rounded-lg flex items-center justify-center">
              <User className="text-mind-deep w-6 h-6" />
            </div>
          </div>

          {verifiedStudents.length > 1 && (
            <div className="mb-8">
              <label className="block text-[10px] uppercase tracking-widest text-white/40 font-bold mb-3">Select Child</label>
              <div className="space-y-2">
                {verifiedStudents.map((student: any) => (
                  <button
                    key={student.uid}
                    onClick={() => setSelectedStudentId(student.uid)}
                    className={cn(
                      "w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all text-left",
                      selectedStudentId === student.uid ? "bg-white/10 border border-white/10" : "hover:bg-white/5 opacity-60"
                    )}
                  >
                    <div className="w-8 h-8 rounded-full bg-mind-purple/20 flex items-center justify-center overflow-hidden">
                      {student.photoURL ? <img src={student.photoURL} className="w-full h-full object-cover" /> : <User className="w-4 h-4 text-mind-purple" />}
                    </div>
                    <span className="text-xs font-bold truncate">{student.displayName}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

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
            <button
              onClick={() => setActiveTab('verification')}
              className={cn(
                "w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200",
                activeTab === 'verification' 
                  ? "bg-white/10 text-white font-bold" 
                  : "text-white/40 hover:bg-white/5 hover:text-white"
              )}
            >
              <Plus className="w-5 h-5" />
              <span>Link Another Child</span>
            </button>
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
                <p className="text-xs text-white/40 truncate">Parent</p>
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

const ChildOverview = ({ studentId }: { studentId: string }) => {
  const [child, setChild] = useState<any>(null);
  const [remarks, setRemarks] = useState<any[]>([]);

  useEffect(() => {
    if (!studentId) return;
    const fetchChild = async () => {
      const docSnap = await getDoc(doc(db, 'users', studentId));
      if (docSnap.exists()) setChild(docSnap.data());
    };
    fetchChild();

    const q = query(collection(db, 'remarks'), where('studentId', '==', studentId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRemarks(snapshot.docs.map(doc => doc.data()));
    });
    return unsubscribe;
  }, [studentId]);

  const attendanceData = [
    { name: 'Present', value: 92, color: '#10b981' },
    { name: 'Absent', value: 5, color: '#ef4444' },
    { name: 'Late', value: 3, color: '#f59e0b' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-white/60">Monitoring {child?.displayName}'s academic growth.</p>
        </div>
        <div className="glass-card px-6 py-4 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full mind-gradient p-[2px]">
            <div className="w-full h-full rounded-full bg-mind-deep flex items-center justify-center overflow-hidden">
              {child?.photoURL ? (
                <img src={child.photoURL} alt="Child" className="w-full h-full object-cover" />
              ) : (
                <User className="w-6 h-6 text-mind-purple" />
              )}
            </div>
          </div>
          <div>
            <p className="text-sm font-bold">{child?.displayName}</p>
            <p className="text-xs text-white/40">{child?.grade} Student</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Growth Stats */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-8">
              <h3 className="text-lg font-bold mb-6 flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-mind-purple" />
                <span>Overall Growth</span>
              </h3>
              <div className="flex items-end space-x-4">
                <span className="text-emerald-400 text-sm font-bold mb-2">+5% from last week</span>
              </div>
              <div className="mt-6 w-full bg-white/5 h-2 rounded-full overflow-hidden">
                <div className="h-full mind-gradient w-[88%] rounded-full" />
              </div>
            </div>
            <div className="glass-card p-8">
              <h3 className="text-lg font-bold mb-6 flex items-center space-x-2">
                <Award className="w-5 h-5 text-mind-purple" />
                <span>Recent Remarks</span>
              </h3>
              {remarks.length > 0 ? (
                <div className="space-y-4">
                  {remarks.slice(0, 2).map((remark, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                      <span className="text-sm font-medium">{remark.subject}</span>
                      <span className={cn(
                        "px-2 py-1 rounded-lg text-[10px] font-bold uppercase",
                        remark.status === 'Good' ? "bg-emerald-500/20 text-emerald-400" : 
                        remark.status === 'Average' ? "bg-amber-500/20 text-amber-400" : "bg-red-500/20 text-red-400"
                      )}>
                        {remark.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/40 text-sm">No remarks added yet.</p>
              )}
            </div>
          </div>

          <div className="glass-card p-8">
            <h3 className="text-xl font-bold mb-8">Attendance Summary</h3>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={attendanceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {attendanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0a0a1a', border: '1px solid #ffffff10', borderRadius: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col space-y-4 ml-8">
                {attendanceData.map((item, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-white/60">{item.name}: {item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions / Contact */}
        <div className="space-y-8">
          <div className="glass-card p-8">
            <h3 className="text-lg font-bold mb-6">Teacher Contacts</h3>
            <div className="space-y-6">
              {[
                { name: 'Dr. Sarah Ahmed', subject: 'Physics', phone: '+1 234 567 890' },
                { name: 'Prof. John Doe', subject: 'Mathematics', phone: '+1 234 567 891' },
              ].map((teacher, i) => (
                <div key={i} className="space-y-2">
                  <p className="text-sm font-bold">{teacher.name}</p>
                  <p className="text-xs text-mind-purple">{teacher.subject}</p>
                  <div className="flex items-center space-x-4 text-white/40">
                    <button className="p-2 hover:text-mind-purple transition-colors"><Phone className="w-4 h-4" /></button>
                    <button className="p-2 hover:text-mind-purple transition-colors"><Mail className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AttendanceView = ({ studentId }: { studentId: string }) => {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) return;
    const q = query(
      collection(db, 'attendance'),
      where('studentId', '==', studentId),
      orderBy('date', 'desc'),
      limit(20)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAttendance(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return unsubscribe;
  }, [studentId]);

  const stats = {
    present: attendance.filter(a => a.status === 'present').length,
    absent: attendance.filter(a => a.status === 'absent').length,
    total: attendance.length
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-6 border-l-4 border-emerald-500">
          <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">Present</p>
          <p className="text-2xl font-black text-white">{stats.present}</p>
        </div>
        <div className="glass-card p-6 border-l-4 border-red-500">
          <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">Absent</p>
          <p className="text-2xl font-black text-white">{stats.absent}</p>
        </div>
        <div className="glass-card p-6 border-l-4 border-mind-purple">
          <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">Attendance Rate</p>
          <p className="text-2xl font-black text-white">
            {stats.total > 0 ? ((stats.present / stats.total) * 100).toFixed(0) : 0}%
          </p>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h3 className="font-bold text-sm">Recent Attendance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5">
                <th className="px-6 py-3 text-[10px] font-black text-white/40 uppercase tracking-widest">Date</th>
                <th className="px-6 py-3 text-[10px] font-black text-white/40 uppercase tracking-widest">Subject</th>
                <th className="px-6 py-3 text-[10px] font-black text-white/40 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {attendance.map((record) => (
                <tr key={record.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-xs font-medium">{record.date}</td>
                  <td className="px-6 py-4 text-xs">{record.subject}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded text-[10px] font-bold uppercase",
                      record.status === 'present' ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                    )}>
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))}
              {attendance.length === 0 && !loading && (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-white/40 italic">No attendance records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const GradesView = ({ studentId }: { studentId: string }) => {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) return;
    const q = query(
      collection(db, 'testResults'),
      where('studentId', '==', studentId),
      orderBy('testDate', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setResults(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return unsubscribe;
  }, [studentId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Academic Performance</h2>
        <div className="flex items-center space-x-2 text-sm text-white/40">
          <Award className="w-4 h-4" />
          <span>Recent Test Results</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {results.map((result) => (
          <div key={result.id} className="glass-card p-6 flex items-center justify-between group hover:border-mind-purple/30 transition-all">
            <div className="flex items-center space-x-6">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                <FileText className="w-6 h-6 text-white/40" />
              </div>
              <div>
                <p className="text-sm font-bold">{result.subject}</p>
                <p className="text-xs text-white/40">{result.testDate} • Week {result.week}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-black text-mind-purple">
                {result.obtainedMarks} / {result.totalMarks}
              </p>
              <p className="text-[10px] text-white/40 uppercase tracking-widest">
                {((Number(result.obtainedMarks) / Number(result.totalMarks)) * 100).toFixed(0)}% Score
              </p>
            </div>
          </div>
        ))}
        {results.length === 0 && !loading && (
          <div className="py-20 text-center glass-card text-white/40 italic">
            No test results found for this student.
          </div>
        )}
      </div>
    </div>
  );
};

const LessonsView = ({ studentId }: { studentId: string }) => {
  const [lessons, setLessons] = useState<any[]>([]);
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) return;
    const fetchStudent = async () => {
      const docSnap = await getDoc(doc(db, 'users', studentId));
      if (docSnap.exists()) setStudent(docSnap.data());
    };
    fetchStudent();
  }, [studentId]);

  useEffect(() => {
    if (!student?.grade) return;
    const q = query(
      collection(db, 'lessons'),
      where('class', '==', student.grade),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLessons(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return unsubscribe;
  }, [student?.grade]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Daily Lessons</h2>
        <div className="flex items-center space-x-2 text-sm text-white/40">
          <BookOpen className="w-4 h-4" />
          <span>Curriculum for {student?.grade}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {lessons.map((lesson) => (
          <div key={lesson.id} className="glass-card p-6 space-y-4 group hover:border-mind-purple/30 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2 py-1 rounded-md bg-mind-purple/10 text-mind-purple text-[10px] font-bold uppercase tracking-wider">
                  {lesson.subject}
                </span>
                <h3 className="text-lg font-bold mt-2 group-hover:text-mind-purple transition-colors">{lesson.title}</h3>
              </div>
              <div className="p-3 rounded-xl bg-white/5">
                <Video className="w-6 h-6 text-white/40" />
              </div>
            </div>
            <p className="text-sm text-white/60 line-clamp-2">{lesson.description}</p>
            <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-white/40">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>{new Date(lesson.createdAt?.toDate()).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>{lesson.resources?.length || 0} Resources</span>
              </div>
            </div>
          </div>
        ))}
        {lessons.length === 0 && !loading && (
          <div className="col-span-full py-20 text-center glass-card text-white/40 italic">
            No lessons posted for this class yet.
          </div>
        )}
      </div>
    </div>
  );
};

// --- Main Dashboard ---
export default function ParentDashboard() {
  const { profile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [verifiedStudents, setVerifiedStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!profile?.verifiedStudentIds?.length) {
      setActiveTab('verification');
      return;
    }

    const fetchVerifiedStudents = async () => {
      const students = [];
      for (const id of profile.verifiedStudentIds) {
        const docSnap = await getDoc(doc(db, 'users', id));
        if (docSnap.exists()) {
          students.push({ uid: docSnap.id, ...docSnap.data() });
        }
      }
      setVerifiedStudents(students);
      if (students.length > 0 && !selectedStudentId) {
        setSelectedStudentId(students[0].uid);
      }
    };

    fetchVerifiedStudents();
  }, [profile, selectedStudentId]);

  if (loading) return <div className="pt-32 text-center">Loading Parent Portal...</div>;
  if (!profile || profile.role !== 'parent') {
    return <div className="pt-32 text-center">Unauthorized Access</div>;
  }

  const isVerified = verifiedStudents.length > 0;

  return (
    <div className="flex min-h-screen bg-mind-deep">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen}
        verifiedStudents={verifiedStudents}
        selectedStudentId={selectedStudentId}
        setSelectedStudentId={setSelectedStudentId}
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
                <p className="text-[10px] text-white/40 uppercase tracking-wider">Parent</p>
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
              key={activeTab + (selectedStudentId || '')}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'verification' && <VerificationPortal setToast={setToast} />}
              
              {isVerified && selectedStudentId ? (
                <>
                  {activeTab === 'overview' && <ChildOverview studentId={selectedStudentId} />}
                  {activeTab === 'attendance' && <AttendanceView studentId={selectedStudentId} />}
                  {activeTab === 'grades' && <GradesView studentId={selectedStudentId} />}
                  {activeTab === 'lessons' && <LessonsView studentId={selectedStudentId} />}
                  {activeTab === 'teachers' && <div className="py-20 text-center glass-card text-white/40">Teacher Contact List Placeholder</div>}
                </>
              ) : (
                activeTab !== 'verification' && (
                  <div className="py-32 text-center">
                    <AlertCircle className="w-16 h-16 text-mind-purple mx-auto mb-6 opacity-20" />
                    <h2 className="text-2xl font-bold mb-2">Verification Required</h2>
                    <p className="text-white/40 mb-8">You haven't linked any verified student profiles yet.</p>
                    <button onClick={() => setActiveTab('verification')} className="btn-mind">
                      Go to Verification Portal
                    </button>
                  </div>
                )
              )}
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
