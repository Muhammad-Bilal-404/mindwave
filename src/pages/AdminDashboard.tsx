import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { db, auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { signOut, getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { initializeApp, deleteApp, getApps } from 'firebase/app';
import firebaseConfig from '../../firebase-applet-config.json';
import { collection, query, onSnapshot, updateDoc, doc, setDoc, deleteDoc, getDoc, where, arrayUnion, arrayRemove, addDoc, orderBy, serverTimestamp, getDocs, writeBatch } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Users, UserPlus, 
  Shield, Settings, Check, X, 
  Search, Filter, MoreVertical,
  Trash2, UserCheck, UserX, BarChart2,
  GraduationCap, LogOut, Menu, Bell, User,
  Clock, AlertCircle, Plus, Star, BookOpen, Calendar, CheckCircle, FileText, TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { Toast } from '../components/Toast';
import { DateSheetEntry } from '../types';

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
          <button onClick={onClose} className="px-4 py-2 text-white/60 hover:text-white transition-colors">Cancel</button>
          <button 
            onClick={async () => { 
              try {
                await onConfirm(); 
              } finally {
                onClose(); 
              }
            }} 
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

const ParentVerification = ({ setToast }: { setToast: (t: any) => void }) => {
  const [parents, setParents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'parent'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const pendingParents = snapshot.docs
        .map(doc => ({ uid: doc.id, ...doc.data() }))
        .filter((p: any) => (p.pendingStudentIds?.length || 0) > 0);
      setParents(pendingParents);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleApprove = async (parentUid: string, studentId: string) => {
    try {
      await updateDoc(doc(db, 'users', parentUid), {
        verifiedStudentIds: arrayUnion(studentId),
        pendingStudentIds: arrayRemove(studentId)
      });
    } catch (error) {
      console.error('Error approving parent access:', error);
    }
  };

  const handleReject = async (parentUid: string, studentId: string) => {
    try {
      await updateDoc(doc(db, 'users', parentUid), {
        pendingStudentIds: arrayRemove(studentId)
      });
    } catch (error) {
      console.error('Error rejecting parent access:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">Parent-Student Verification</h3>
        <span className="bg-mind-purple/20 text-mind-purple px-3 py-1 rounded-full text-xs font-bold">
          {parents.reduce((acc, p) => acc + (p.pendingStudentIds?.length || 0), 0)} Pending Requests
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {parents.map((parent) => (
          <div key={parent.uid} className="glass-card p-6">
            <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-mind-purple/20 flex items-center justify-center">
                  <User className="w-6 h-6 text-mind-purple" />
                </div>
                <div>
                  <p className="font-bold">{parent.displayName}</p>
                  <p className="text-xs text-white/40">{parent.email}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {parent.pendingStudentIds.map((studentId: string) => (
                <PendingRequestItem 
                  key={studentId} 
                  studentId={studentId} 
                  onApprove={() => handleApprove(parent.uid, studentId)}
                  onReject={() => handleReject(parent.uid, studentId)}
                />
              ))}
            </div>
          </div>
        ))}

        {parents.length === 0 && !loading && (
          <div className="py-20 text-center glass-card text-white/40">
            <Check className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No pending verification requests.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const PendingRequestItem = ({ studentId, onApprove, onReject }: any) => {
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
    <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl">
      <div className="flex items-center space-x-4">
        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center overflow-hidden">
          {student.photoURL ? <img src={student.photoURL} className="w-full h-full object-cover" /> : <GraduationCap className="w-5 h-5 text-white/40" />}
        </div>
        <div>
          <p className="text-sm font-bold">{student.displayName}</p>
          <p className="text-[10px] text-white/40">{student.email} • Grade {student.grade}</p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <button 
          onClick={onApprove}
          className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500 hover:text-white transition-all"
          title="Verify Relationship"
        >
          <Check className="w-4 h-4" />
        </button>
        <button 
          onClick={onReject}
          className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all"
          title="Reject Request"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const FacultyManager = ({ setToast }: { setToast: (t: any) => void }) => {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'teacher'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTeachers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleImageUpload = async (teacherId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500000) { // 500KB limit for base64
      setToast({ message: 'Image too large. Please use an image under 500KB.', type: 'error' });
      return;
    }

    setUploading(teacherId);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64String = reader.result as string;
        await updateDoc(doc(db, 'users', teacherId), {
          photoURL: base64String
        });
        setToast({ message: 'Teacher picture updated successfully!', type: 'success' });
      } catch (error) {
        console.error('Error updating teacher picture:', error);
        setToast({ message: 'Failed to update picture', type: 'error' });
      } finally {
        setUploading(null);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">Faculty Picture Management</h3>
        <span className="text-xs text-white/40 uppercase tracking-widest font-bold">IT Sector Only</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {teachers.map((teacher) => (
          <div key={teacher.uid} className="glass-card p-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full mind-gradient p-[2px]">
                <div className="w-full h-full rounded-full bg-mind-deep flex items-center justify-center overflow-hidden">
                  {teacher.photoURL ? (
                    <img src={teacher.photoURL} alt={teacher.displayName} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-mind-purple" />
                  )}
                </div>
              </div>
              <div>
                <p className="font-bold">{teacher.displayName}</p>
                <p className="text-xs text-white/40">{teacher.email}</p>
              </div>
            </div>

            <div className="flex flex-col items-end space-y-2">
              <label className={cn(
                "cursor-pointer btn-mind py-2 px-4 text-xs flex items-center space-x-2",
                uploading === teacher.uid && "opacity-50 pointer-events-none"
              )}>
                {uploading === teacher.uid ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                <span>{teacher.photoURL ? 'Change Picture' : 'Upload Picture'}</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => handleImageUpload(teacher.uid, e)}
                />
              </label>
              {teacher.photoURL && (
                <button 
                  onClick={async () => {
                    await updateDoc(doc(db, 'users', teacher.uid), { photoURL: null });
                    setToast({ message: 'Picture removed', type: 'success' });
                  }}
                  className="text-[10px] text-red-400 hover:underline"
                >
                  Remove Picture
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Sub-Components ---
const Teachers = ({ setToast }: { setToast: (t: any) => void }) => {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [dbSubjects, setDbSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<any>(null);
  const [newTeacher, setNewTeacher] = useState({ 
    username: '', 
    password: '', 
    displayName: '', 
    selectedSubjects: [] as string[] 
  });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'teacher'));
    const unsubscribeTeachers = onSnapshot(q, (snapshot) => {
      setTeachers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })));
      setLoading(false);
    });

    const unsubscribeSubjects = onSnapshot(collection(db, 'subjects'), (snapshot) => {
      setDbSubjects(snapshot.docs.map(doc => doc.data().name));
    });

    return () => {
      unsubscribeTeachers();
      unsubscribeSubjects();
    };
  }, []);

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    let secondaryApp;
    try {
      const existingApp = getApps().find(app => app.name === 'Secondary');
      secondaryApp = existingApp || initializeApp(firebaseConfig, 'Secondary');
      
      const secondaryAuth = getAuth(secondaryApp);
      const sanitizedUsername = newTeacher.username.toLowerCase().replace(/\s+/g, '');
      const teacherEmail = `${sanitizedUsername}@academy.edu`;
      
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, teacherEmail, newTeacher.password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        username: sanitizedUsername,
        email: teacherEmail,
        displayName: newTeacher.displayName,
        role: 'teacher',
        subjectsTaught: newTeacher.selectedSubjects,
        isBlocked: false,
        createdAt: new Date().toISOString()
      });

      setShowAdd(false);
      setToast({ type: 'success', message: `Teacher profile created successfully!\nUsername: ${sanitizedUsername}` });
      setNewTeacher({ username: '', password: '', displayName: '', selectedSubjects: [] });
    } catch (error: any) {
      console.error('Error adding teacher:', error);
      setToast({ type: 'error', message: error.message || 'Error creating teacher profile' });
    } finally {
      if (secondaryApp) {
        try {
          await deleteApp(secondaryApp);
        } catch (err) {
          console.error('Error deleting secondary app:', err);
        }
      }
    }
  };

  const handleUpdateSubjects = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;
    try {
      await updateDoc(doc(db, 'users', editingTeacher.uid), {
        subjectsTaught: editingTeacher.subjectsTaught
      });
      setEditingTeacher(null);
      setToast({ type: 'success', message: 'Teacher subjects updated successfully' });
    } catch (error) {
      console.error('Error updating teacher subjects:', error);
      setToast({ type: 'error', message: 'Failed to update subjects' });
    }
  };

  const handleToggleSubject = (subject: string, isNew: boolean) => {
    if (isNew) {
      setNewTeacher(prev => ({
        ...prev,
        selectedSubjects: prev.selectedSubjects.includes(subject)
          ? prev.selectedSubjects.filter(s => s !== subject)
          : [...prev.selectedSubjects, subject]
      }));
    } else {
      setEditingTeacher((prev: any) => ({
        ...prev,
        subjectsTaught: prev.subjectsTaught.includes(subject)
          ? prev.subjectsTaught.filter((s: string) => s !== subject)
          : [...prev.subjectsTaught, subject]
      }));
    }
  };

  const handleToggleBlock = async (teacher: any) => {
    try {
      await updateDoc(doc(db, 'users', teacher.uid), {
        isBlocked: !teacher.isBlocked
      });
    } catch (error) {
      console.error('Error toggling block:', error);
    }
  };

  const handleRemoveTeacher = async (teacherId: string) => {
    try {
      await deleteDoc(doc(db, 'users', teacherId));
      setToast({ type: 'success', message: 'Teacher removed successfully' });
    } catch (error: any) {
      console.error('Error removing teacher:', error);
      setToast({ type: 'error', message: 'Failed to remove teacher' });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <button onClick={() => setShowAdd(true)} className="btn-mind flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>Add Teacher</span>
        </button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="glass-card p-6">
            <form onSubmit={handleAddTeacher} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input 
                  required 
                  placeholder="Full Name" 
                  value={newTeacher.displayName} 
                  onChange={e => setNewTeacher({...newTeacher, displayName: e.target.value})}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-mind-purple"
                />
                <input 
                  required 
                  placeholder="Username" 
                  value={newTeacher.username} 
                  onChange={e => setNewTeacher({...newTeacher, username: e.target.value})}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-mind-purple"
                />
                <input 
                  required 
                  type="password"
                  placeholder="Default Password" 
                  value={newTeacher.password} 
                  onChange={e => setNewTeacher({...newTeacher, password: e.target.value})}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-mind-purple"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-mind-purple">Assign Subjects</label>
                <div className="flex flex-wrap gap-2">
                  {dbSubjects.map(subject => (
                    <button
                      key={subject}
                      type="button"
                      onClick={() => handleToggleSubject(subject, true)}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-bold transition-all border",
                        newTeacher.selectedSubjects.includes(subject)
                          ? "bg-mind-purple text-white border-mind-purple"
                          : "bg-white/5 text-white/40 border-white/10 hover:border-mind-purple/50"
                      )}
                    >
                      {subject}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button type="button" onClick={() => setShowAdd(false)} className="text-white/60">Cancel</button>
                <button type="submit" className="btn-mind">Create Profile</button>
              </div>
            </form>
          </motion.div>
        )}

        {editingTeacher && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="glass-card p-6">
            <form onSubmit={handleUpdateSubjects} className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="font-bold">Edit Subjects: {editingTeacher.displayName}</h4>
                <button type="button" onClick={() => setEditingTeacher(null)} className="text-white/40 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-mind-purple">Assigned Subjects</label>
                <div className="flex flex-wrap gap-2">
                  {dbSubjects.map(subject => (
                    <button
                      key={subject}
                      type="button"
                      onClick={() => handleToggleSubject(subject, false)}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-bold transition-all border",
                        editingTeacher.subjectsTaught.includes(subject)
                          ? "bg-mind-purple text-white border-mind-purple"
                          : "bg-white/5 text-white/40 border-white/10 hover:border-mind-purple/50"
                      )}
                    >
                      {subject}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <button type="submit" className="btn-mind">Update Subjects</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {teachers.map(teacher => (
          <div key={teacher.uid} className={cn("glass-card p-6 flex items-center justify-between", teacher.isBlocked && "opacity-50")}>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-mind-purple/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-mind-purple" />
              </div>
              <div>
                <p className="font-bold">{teacher.displayName}</p>
                <p className="text-xs text-white/40">{teacher.email}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {teacher.subjectsTaught?.map((s: string) => (
                    <span key={s} className="text-[8px] bg-mind-purple/20 text-mind-purple px-2 py-0.5 rounded-full uppercase font-bold">{s}</span>
                  ))}
                  {teacher.isCoordinator && (
                    <span className="text-[8px] bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full uppercase font-bold flex items-center">
                      <Star className="w-2 h-2 mr-1" /> Coordinator
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setEditingTeacher(teacher)}
                className="p-2 text-mind-purple hover:bg-mind-purple/10 rounded-lg transition-all"
                title="Edit Subjects"
              >
                <BookOpen className="w-5 h-5" />
              </button>
              <button 
                onClick={() => handleToggleBlock(teacher)}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  teacher.isBlocked ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white" : "bg-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-white"
                )}
                title={teacher.isBlocked ? "Unblock Teacher" : "Block Teacher"}
              >
                {teacher.isBlocked ? <Check className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
              </button>
              <button 
                onClick={async () => {
                  try {
                    await updateDoc(doc(db, 'users', teacher.uid), { isCoordinator: !teacher.isCoordinator });
                  } catch (e) {
                    console.error(e);
                  }
                }}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  teacher.isCoordinator ? "text-amber-500 bg-amber-500/10" : "text-white/20 hover:bg-white/5"
                )}
                title={teacher.isCoordinator ? "Remove Coordinator Role" : "Appoint as Coordinator"}
              >
                <Star className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setConfirmDelete(teacher.uid)}
                className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal 
        isOpen={!!confirmDelete} 
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && handleRemoveTeacher(confirmDelete)}
        title="Remove Teacher"
        confirmText="Remove"
        variant="danger"
      >
        Are you sure you want to remove this teacher? This action cannot be undone.
      </Modal>
    </div>
  );
};

const Subjects = ({ setToast }: { setToast: (t: any) => void }) => {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [newSubject, setNewSubject] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'subjects'), (snapshot) => {
      setSubjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, []);

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim()) return;
    try {
      await setDoc(doc(collection(db, 'subjects')), { name: newSubject.trim() });
      setNewSubject('');
    } catch (error) {
      console.error('Error adding subject:', error);
    }
  };

  const handleRemoveSubject = async (id: string) => {
    await deleteDoc(doc(db, 'subjects', id));
  };

  return (
    <div className="space-y-8">
      <div className="glass-card p-6">
        <form onSubmit={handleAddSubject} className="flex gap-4">
          <input 
            required 
            type="text" 
            placeholder="New Subject Name" 
            value={newSubject} 
            onChange={e => setNewSubject(e.target.value)}
            className="flex-grow bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-mind-purple"
          />
          <button type="submit" className="btn-mind px-6">Add Subject</button>
        </form>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {subjects.map(subject => (
          <div key={subject.id} className="glass-card p-4 flex items-center justify-between group">
            <span className="font-bold">{subject.name}</span>
            <button onClick={() => setConfirmDelete(subject.id)} className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <Modal 
        isOpen={!!confirmDelete} 
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && handleRemoveSubject(confirmDelete)}
        title="Remove Subject"
        confirmText="Remove"
        variant="danger"
      >
        Are you sure you want to remove this subject?
      </Modal>
    </div>
  );
};

const ManageDateSheet = ({ setToast }: { setToast: (t: any) => void }) => {
  const [entries, setEntries] = useState<DateSheetEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGrade, setSelectedGrade] = useState('11th');
  const [selectedType, setSelectedType] = useState<'test-session' | 'other'>('test-session');
  const [showAdd, setShowAdd] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [showGlobalClearModal, setShowGlobalClearModal] = useState(false);
  const [newEntry, setNewEntry] = useState<Partial<DateSheetEntry>>({
    grade: '11th',
    date: '',
    day: '',
    subjects: [],
    testNumber: '',
    syllabus: '',
    isHoliday: false,
    type: 'test-session'
  });

  useEffect(() => {
    const q = query(
      collection(db, 'dateSheets'), 
      where('grade', '==', selectedGrade), 
      where('type', '==', selectedType),
      orderBy('date', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setEntries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DateSheetEntry)));
      setLoading(false);
    });
    return unsubscribe;
  }, [selectedGrade, selectedType]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Check for duplicate
      const q = query(
        collection(db, 'dateSheets'), 
        where('grade', '==', selectedGrade), 
        where('date', '==', newEntry.date)
      );
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        setToast({ message: 'An entry for this date and grade already exists.', type: 'error' });
        return;
      }

      await addDoc(collection(db, 'dateSheets'), {
        ...newEntry,
        grade: selectedGrade,
        type: newEntry.type || 'test-session',
        subjects: typeof newEntry.subjects === 'string' ? (newEntry.subjects as string).split('/').map(s => s.trim()) : newEntry.subjects
      });
      setShowAdd(false);
      setNewEntry({ grade: selectedGrade, date: '', day: '', subjects: [], testNumber: '', syllabus: '', isHoliday: false, type: selectedType });
      setToast({ message: 'Entry added successfully!', type: 'success' });
    } catch (error) {
      console.error('Error adding date sheet entry:', error);
      setToast({ message: 'Failed to add entry.', type: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!confirmDeleteId) {
      console.warn('No delete ID provided');
      return;
    }
    
    console.log('Attempting to delete date sheet entry:', confirmDeleteId);
    try {
      await deleteDoc(doc(db, 'dateSheets', confirmDeleteId));
      setToast({ message: 'Entry deleted successfully.', type: 'success' });
      console.log('Successfully deleted entry:', confirmDeleteId);
    } catch (error) {
      console.error('Error deleting entry:', error);
      setToast({ message: 'Failed to delete entry.', type: 'error' });
    }
    setConfirmDeleteId(null);
  };

  const seedData = async () => {
    if (isSeeding) return;
    
    const data11th = [
      { date: '2026-02-02', day: 'Monday', subjects: ['English'], testNumber: '1', syllabus: 'Test # 1', isHoliday: false },
      { date: '2026-02-03', day: 'Tuesday', subjects: ['Islamiyat'], testNumber: '1', syllabus: 'باب نمبر 1: قرآنی مجید و حدیث نبوی، باب نمبر 4: اخلاق و آداب', isHoliday: false },
      { date: '2026-02-04', day: 'Wednesday', subjects: ['Chemistry', 'Computer', 'I.S(Elective)'], testNumber: '1', syllabus: 'Ch#1 /Ch 1/1#', isHoliday: false },
      { date: '2026-02-05', day: 'Thursday', subjects: ['Urdu'], testNumber: '1', syllabus: 'Test # 1', isHoliday: false },
      { date: '2026-02-06', day: 'Friday', subjects: ['Physics', 'Education', 'Psychology', 'Economics'], testNumber: '1', syllabus: 'Chap 1/chap 1/chap1,2', isHoliday: false },
      { date: '2026-02-07', day: 'Saturday', subjects: ['Biology', 'Math', 'Sociology'], testNumber: '1', syllabus: 'ch 2/ch1/ch1', isHoliday: false },
      { date: '2026-02-08', day: 'Sunday', subjects: [], testNumber: '', syllabus: 'Weekly Totals', isHoliday: true },
      { date: '2026-02-09', day: 'Monday', subjects: ['English'], testNumber: '2', syllabus: 'Test # 2', isHoliday: false },
      { date: '2026-02-10', day: 'Tuesday', subjects: ['T.Q'], testNumber: '1', syllabus: 'سورۃ البقرہ (مکمل)', isHoliday: false },
      { date: '2026-02-11', day: 'Wednesday', subjects: ['Chemistry', 'Computer', 'I.S(Elective)'], testNumber: '2', syllabus: 'Ch#3 /Ch#2/', isHoliday: false },
      { date: '2026-02-12', day: 'Thursday', subjects: ['Urdu'], testNumber: '2', syllabus: 'Test # 2', isHoliday: false },
      { date: '2026-02-13', day: 'Friday', subjects: ['Physics', 'Education', 'Psychology', 'Economics'], testNumber: '2', syllabus: 'chapter 2/ chapter 8/chapter 3', isHoliday: false },
      { date: '2026-02-14', day: 'Saturday', subjects: ['Biology', 'Math', 'Sociology'], testNumber: '2', syllabus: 'Ch 3/Ch2,3/ch 8', isHoliday: false },
      { date: '2026-02-15', day: 'Sunday', subjects: [], testNumber: '', syllabus: 'Weekly Totals', isHoliday: true },
      { date: '2026-02-16', day: 'Monday', subjects: ['English'], testNumber: '3', syllabus: 'Test # 3', isHoliday: false },
      { date: '2026-02-17', day: 'Tuesday', subjects: ['Islamiyat'], testNumber: '2', syllabus: 'باب نمبر 2: ایمانیات و عبادات', isHoliday: false },
      { date: '2026-02-18', day: 'Wednesday', subjects: ['Chemistry', 'Computer', 'I.S(Elective)'], testNumber: '3', syllabus: 'Ch#4 /Ch#3/', isHoliday: false },
      { date: '2026-02-19', day: 'Thursday', subjects: ['Urdu'], testNumber: '3', syllabus: 'Test # 3', isHoliday: false },
      { date: '2026-02-20', day: 'Friday', subjects: [], testNumber: 'PTM', syllabus: 'Parent Teacher Meeting', isHoliday: false },
      { date: '2026-02-21', day: 'Saturday', subjects: ['Physics', 'Education', 'Psychology', 'Economics'], testNumber: '3', syllabus: 'Ch 3,4/ باب نمبر 2/ chap 4', isHoliday: false },
      { date: '2026-02-22', day: 'Sunday', subjects: [], testNumber: '', syllabus: 'Weekly Totals', isHoliday: true },
      { date: '2026-02-23', day: 'Monday', subjects: ['Biology', 'Math', 'Sociology'], testNumber: '3', syllabus: 'ch 4/ch4/ch2', isHoliday: false },
      { date: '2026-02-24', day: 'Tuesday', subjects: ['English'], testNumber: '4', syllabus: 'Test # 4', isHoliday: false },
      { date: '2026-02-25', day: 'Wednesday', subjects: ['T.Q'], testNumber: '2', syllabus: 'سورۃ آل عمران (مکمل)', isHoliday: false },
      { date: '2026-02-26', day: 'Thursday', subjects: ['Chemistry', 'Computer', 'I.S(Elective)'], testNumber: '4', syllabus: 'Ch#5 /Ch#4/', isHoliday: false },
      { date: '2026-02-27', day: 'Friday', subjects: ['Urdu'], testNumber: '4', syllabus: 'Test # 4', isHoliday: false },
      { date: '2026-02-28', day: 'Saturday', subjects: ['Physics', 'Education', 'Psychology', 'Economics'], testNumber: '4', syllabus: 'Ch 5#/ chap 5', isHoliday: false },
      { date: '2026-03-01', day: 'Sunday', subjects: [], testNumber: '', syllabus: 'Weekly Totals', isHoliday: true },
      { date: '2026-03-02', day: 'Monday', subjects: ['Biology', 'Math', 'Sociology'], testNumber: '4', syllabus: 'ch #5/ Ch#5/ Ch#3,4', isHoliday: false },
      { date: '2026-03-03', day: 'Tuesday', subjects: ['English'], testNumber: '5', syllabus: 'Test # 5', isHoliday: false },
      { date: '2026-03-04', day: 'Wednesday', subjects: ['Islamiyat'], testNumber: '3', syllabus: 'باب نمبر 3: سیرت النبی ﷺ', isHoliday: false },
      { date: '2026-03-05', day: 'Thursday', subjects: ['Chemistry', 'Computer', 'I.S(Elective)'], testNumber: '5', syllabus: 'Ch#6/ Ch#5/', isHoliday: false },
      { date: '2026-03-06', day: 'Friday', subjects: ['Urdu'], testNumber: '5', syllabus: 'Test # 5', isHoliday: false },
      { date: '2026-03-07', day: 'Saturday', subjects: ['Physics', 'Education', 'Psychology', 'Economics'], testNumber: '5', syllabus: 'Ch 1,2,3,4,5,6/ chap 6', isHoliday: false },
      { date: '2026-03-08', day: 'Sunday', subjects: [], testNumber: '', syllabus: 'Weekly Totals', isHoliday: true },
      { date: '2026-03-09', day: 'Monday', subjects: ['Biology', 'Math', 'Sociology'], testNumber: '5', syllabus: 'ch#6/Ch#6/Ch#5', isHoliday: false },
      { date: '2026-03-10', day: 'Tuesday', subjects: ['English'], testNumber: '6', syllabus: 'Test # 6', isHoliday: false },
      { date: '2026-03-11', day: 'Wednesday', subjects: ['T.Q'], testNumber: '3', syllabus: 'سورۃ الانفال (مکمل)', isHoliday: false },
      { date: '2026-03-12', day: 'Thursday', subjects: ['Chemistry', 'Computer', 'I.S(Elective)'], testNumber: '6', syllabus: 'Ch#7/ Ch#6/ حصہ دوم', isHoliday: false },
      { date: '2026-03-13', day: 'Friday', subjects: ['Urdu'], testNumber: '6', syllabus: 'Test # 6', isHoliday: false },
      { date: '2026-03-14', day: 'Saturday', subjects: ['Physics', 'Education', 'Psychology', 'Economics'], testNumber: '6', syllabus: 'Ch 7/ chap7', isHoliday: false },
      { date: '2026-03-15', day: 'Sunday', subjects: [], testNumber: '', syllabus: 'Weekly Totals', isHoliday: true },
      { date: '2026-03-16', day: 'Monday', subjects: ['Biology', 'Math', 'Sociology'], testNumber: '6', syllabus: 'Ch#7/ Ch #7/ 6', isHoliday: false },
      { date: '2026-03-17', day: 'Tuesday', subjects: ['English'], testNumber: '7', syllabus: 'Test # 7', isHoliday: false },
      { date: '2026-03-18', day: 'Wednesday', subjects: [], testNumber: '', syllabus: 'EID-UL-FITAR holidays', isHoliday: true },
      { date: '2026-03-19', day: 'Thursday', subjects: [], testNumber: '', syllabus: 'EID-UL-FITAR holidays', isHoliday: true },
      { date: '2026-03-20', day: 'Friday', subjects: [], testNumber: '', syllabus: 'EID-UL-FITAR holidays', isHoliday: true },
      { date: '2026-03-21', day: 'Saturday', subjects: [], testNumber: '', syllabus: 'EID-UL-FITAR holidays', isHoliday: true },
      { date: '2026-03-22', day: 'Sunday', subjects: [], testNumber: '', syllabus: 'Weekly Totals', isHoliday: true },
      { date: '2026-03-23', day: 'Monday', subjects: ['Islamiyat'], testNumber: '4', syllabus: 'باب نمبر 5: حسن معاملات و معاشرت', isHoliday: false },
      { date: '2026-03-24', day: 'Tuesday', subjects: ['Chemistry', 'Computer', 'I.S(Elective)'], testNumber: '7', syllabus: 'Ch#8/ Ch 6#/ حصہ دوم', isHoliday: false },
      { date: '2026-03-25', day: 'Wednesday', subjects: ['Urdu'], testNumber: '7', syllabus: 'Test # 7', isHoliday: false },
      { date: '2026-03-26', day: 'Thursday', subjects: ['Physics', 'Education', 'Psychology', 'Economics'], testNumber: '7', syllabus: 'Ch 8,9/ chap 8', isHoliday: false },
      { date: '2026-03-27', day: 'Friday', subjects: ['Biology', 'Math', 'Sociology'], testNumber: '7', syllabus: 'Ch#8/Ch#9,11/Ch#7', isHoliday: false },
      { date: '2026-03-28', day: 'Saturday', subjects: [], testNumber: '', syllabus: 'Discussion class', isHoliday: false },
      { date: '2026-03-29', day: 'Sunday', subjects: [], testNumber: '', syllabus: 'Weekly Totals', isHoliday: true },
      { date: '2026-03-30', day: 'Monday', subjects: ['T.Q'], testNumber: '4', syllabus: 'سورۃ التوبہ (مکمل)', isHoliday: false },
      { date: '2026-03-31', day: 'Tuesday', subjects: ['Chemistry', 'Computer', 'I.S(Elective)'], testNumber: '8', syllabus: 'Ch#9,10 / Ch 7#/ حصہ دوم', isHoliday: false },
      { date: '2026-04-01', day: 'Wednesday', subjects: ['English'], testNumber: '8', syllabus: 'Test # 8', isHoliday: false },
      { date: '2026-04-02', day: 'Thursday', subjects: ['Urdu'], testNumber: '8', syllabus: 'Test # 8', isHoliday: false },
      { date: '2026-04-03', day: 'Friday', subjects: ['Physics', 'Education', 'Psychology', 'Economics'], testNumber: '8', syllabus: 'ch 10/ ch 7/chap 9', isHoliday: false },
      { date: '2026-04-04', day: 'Saturday', subjects: [], testNumber: 'PTM', syllabus: 'Parent Teacher Meeting', isHoliday: false },
      { date: '2026-04-05', day: 'Sunday', subjects: [], testNumber: '', syllabus: 'Weekly Totals', isHoliday: true },
      { date: '2026-04-06', day: 'Monday', subjects: ['Biology', 'Math', 'Sociology'], testNumber: '8', syllabus: 'Ch#9/ Ch #10/ T1,T2,T4', isHoliday: false },
      { date: '2026-04-07', day: 'Tuesday', subjects: ['English'], testNumber: '9', syllabus: 'Test # 9', isHoliday: false },
      { date: '2026-04-08', day: 'Wednesday', subjects: ['Islamiyat'], testNumber: '5', syllabus: 'باب نمبر 6: ہدایت کے سرچشمے اور مشاہیر اسلام', isHoliday: false },
      { date: '2026-04-09', day: 'Thursday', subjects: ['Chemistry', 'Computer', 'I.S(Elective)'], testNumber: '9', syllabus: 'Ch#2,14/ Ch 8#/ حصہ دوم', isHoliday: false },
      { date: '2026-04-10', day: 'Friday', subjects: ['Urdu'], testNumber: '9', syllabus: 'Test # 9', isHoliday: false },
      { date: '2026-04-11', day: 'Saturday', subjects: ['English'], testNumber: '11', syllabus: 'Test # 11', isHoliday: false },
      { date: '2026-04-12', day: 'Sunday', subjects: [], testNumber: '', syllabus: 'Weekly Totals', isHoliday: true },
      { date: '2026-04-13', day: 'Monday', subjects: ['Physics', 'Education', 'Psychology', 'Economics'], testNumber: '09', syllabus: 'Ch 11/ chap10', isHoliday: false },
      { date: '2026-04-14', day: 'Tuesday', subjects: ['Biology', 'Math'], testNumber: '09', syllabus: 'Ch#10/ch#12', isHoliday: false },
      { date: '2026-04-15', day: 'Wednesday', subjects: ['English'], testNumber: '10', syllabus: 'Test # 10', isHoliday: false },
      { date: '2026-04-16', day: 'Thursday', subjects: ['T.Q'], testNumber: 'FLP', syllabus: 'Full Length Paper', isHoliday: false },
      { date: '2026-04-17', day: 'Friday', subjects: ['Chemistry', 'Computer', 'I.S(Elective)'], testNumber: '2nd Half', syllabus: 'C#11 / Ch #9/', isHoliday: false },
      { date: '2026-04-18', day: 'Saturday', subjects: ['Urdu'], testNumber: '10', syllabus: 'Test # 10', isHoliday: false },
      { date: '2026-04-19', day: 'Sunday', subjects: [], testNumber: '', syllabus: 'Weekly Totals', isHoliday: true },
      { date: '2026-04-20', day: 'Monday', subjects: ['Physics', 'Education', 'Psychology', 'Economics'], testNumber: '10', syllabus: 'ch 7,8,9,10,11/T1 to T4/chap 11,12', isHoliday: false },
      { date: '2026-04-21', day: 'Tuesday', subjects: ['Biology', 'Math'], testNumber: '10', syllabus: 'ch#1,11/ch#13', isHoliday: false },
      { date: '2026-04-23', day: 'Wednesday', subjects: ['Islamiyat'], testNumber: '06', syllabus: 'باب نمبر 7: اسلامی تعلیمات اور عصر حاضر کے تقاضے', isHoliday: false },
      { date: '2026-04-24', day: 'Thursday', subjects: ['Chemistry', 'Computer', 'I.S(Elective)'], testNumber: '11', syllabus: 'C#12,13 / FLP/FLP', isHoliday: false },
      { date: '2026-04-25', day: 'Friday', subjects: ['Urdu'], testNumber: '11', syllabus: 'Test # 11', isHoliday: false },
      { date: '2026-04-26', day: 'Saturday', subjects: ['Biology', 'Math'], testNumber: '11', syllabus: 'Ch#12/ Ch #14', isHoliday: false },
      { date: '2026-04-27', day: 'Sunday', subjects: [], testNumber: '', syllabus: 'Weekly Totals', isHoliday: true },
      { date: '2026-04-28', day: 'Monday', subjects: ['Physics', 'Education', 'Psychology', 'Economics'], testNumber: 'FLP', syllabus: 'T1 to T10', isHoliday: false },
      { date: '2026-04-29', day: 'Tuesday', subjects: ['English'], testNumber: 'FLP', syllabus: 'T1 to T10', isHoliday: false },
      { date: '2026-04-30', day: 'Wednesday', subjects: ['Islamiyat'], testNumber: 'FLP', syllabus: 'T1 to T10', isHoliday: false },
      { date: '2026-05-01', day: 'Thursday', subjects: ['Chemistry'], testNumber: 'FLP', syllabus: 'T1 to T11', isHoliday: false },
      { date: '2026-05-02', day: 'Friday', subjects: ['Urdu'], testNumber: 'FLP', syllabus: 'T1 to T12', isHoliday: false },
      { date: '2026-05-03', day: 'Saturday', subjects: ['Biology', 'Math'], testNumber: 'FLP', syllabus: 'T1 to T12', isHoliday: false },
      { date: '2026-05-04', day: 'Sunday', subjects: [], testNumber: '', syllabus: 'Weekly Totals', isHoliday: true },
    ];

    const data12th = [
      { date: '2026-02-02', day: 'Monday', subjects: ['English'], testNumber: '1', syllabus: 'Test # 1', isHoliday: false },
      { date: '2026-02-03', day: 'Tuesday', subjects: ['Pak.Study'], testNumber: '1', syllabus: 'باب نمبر 1', isHoliday: false },
      { date: '2026-02-04', day: 'Wednesday', subjects: ['Chemistry', 'Computer', 'Physics Education', 'Civics'], testNumber: '1', syllabus: 'Ch#7 /Ch#1/1 باب نمبر / Ch#1', isHoliday: false },
      { date: '2026-02-05', day: 'Thursday', subjects: ['Urdu'], testNumber: '1', syllabus: 'Test # 1', isHoliday: false },
      { date: '2026-02-06', day: 'Friday', subjects: ['Physics', 'Economics'], testNumber: '1', syllabus: 'Ch 12#/ہاف فسٹ ۔باب نمبر 1', isHoliday: false },
      { date: '2026-02-07', day: 'Saturday', subjects: ['T.Q'], testNumber: '1', syllabus: 'سورۃ النساء،سورۃ محمد', isHoliday: false },
      { date: '2026-02-08', day: 'Sunday', subjects: [], testNumber: '', syllabus: 'Weekly Totals', isHoliday: true },
      { date: '2026-02-09', day: 'Monday', subjects: ['Biology', 'Math', 'I.S(Elective)'], testNumber: '1', syllabus: 'Ch#(15,21)/ Ch 1# / سل پ ب دیکھیں', isHoliday: false },
      { date: '2026-02-10', day: 'Tuesday', subjects: ['English'], testNumber: '2', syllabus: 'Test # 2', isHoliday: false },
      { date: '2026-02-11', day: 'Wednesday', subjects: ['Pak.Study'], testNumber: '2', syllabus: 'باب نمبر 2۔ہاف فسٹ', isHoliday: false },
      { date: '2026-02-12', day: 'Thursday', subjects: ['Chemistry', 'Computer', 'Physics Education', 'Civics'], testNumber: '2', syllabus: 'Ch#8 /Ch#2/2 باب نمبر / Ch#2', isHoliday: false },
      { date: '2026-02-13', day: 'Friday', subjects: ['Urdu'], testNumber: '2', syllabus: 'Test # 2', isHoliday: false },
      { date: '2026-02-14', day: 'Saturday', subjects: ['Physics', 'Economics'], testNumber: '2', syllabus: 'Ch 13#/کنڈہاف۔باب نمبر 1', isHoliday: false },
      { date: '2026-02-15', day: 'Sunday', subjects: [], testNumber: '', syllabus: 'Weekly Totals', isHoliday: true },
      { date: '2026-02-16', day: 'Monday', subjects: ['T.Q'], testNumber: '2', syllabus: 'سورۃ الحدید،سورۃ النور', isHoliday: false },
      { date: '2026-02-17', day: 'Tuesday', subjects: ['Biology', 'Math', 'I.S(Elective)'], testNumber: '2', syllabus: 'Ch#16 /Ch#2(Ex 2.1 - 2.4 (/سل پ ب دیکھیں', isHoliday: false },
      { date: '2026-02-18', day: 'Wednesday', subjects: ['English'], testNumber: '3', syllabus: 'Test # 3', isHoliday: false },
      { date: '2026-02-19', day: 'Thursday', subjects: ['Pak.Study'], testNumber: '3', syllabus: 'باب نمبر 2۔کنڈہاف', isHoliday: false },
      { date: '2026-02-20', day: 'Friday', subjects: [], testNumber: 'PTM', syllabus: 'Parent Teacher Meeting', isHoliday: false },
      { date: '2026-02-21', day: 'Saturday', subjects: ['Chemistry', 'Computer', 'Physics Education', 'Civics'], testNumber: '3', syllabus: 'Ch#(9,10) /Ch#3,4/3 باب نمبر / Ch#3', isHoliday: false },
      { date: '2026-02-22', day: 'Sunday', subjects: [], testNumber: '', syllabus: 'Weekly Totals', isHoliday: true },
      { date: '2026-02-23', day: 'Monday', subjects: ['Urdu'], testNumber: '3', syllabus: 'Test # 3', isHoliday: false },
      { date: '2026-02-24', day: 'Tuesday', subjects: ['Physics', 'Economics'], testNumber: '3', syllabus: 'Ch 14#/ہاف فسٹ ۔باب نمبر 2', isHoliday: false },
      { date: '2026-02-25', day: 'Wednesday', subjects: ['T.Q'], testNumber: '3', syllabus: 'سورۃ المجادلہ،سورۃ الممتحنہ', isHoliday: false },
      { date: '2026-02-26', day: 'Thursday', subjects: ['Biology', 'Math', 'I.S(Elective)'], testNumber: '3', syllabus: 'Ch#17 /Ch 2#)2.10-2.5(/سل پ ب دیکھیں', isHoliday: false },
      { date: '2026-02-27', day: 'Friday', subjects: ['English'], testNumber: '4', syllabus: 'Test # 4', isHoliday: false },
      { date: '2026-02-28', day: 'Saturday', subjects: ['Pak.Study'], testNumber: '4', syllabus: 'باب نمبر 3۔ہاف فسٹ', isHoliday: false },
      { date: '2026-03-01', day: 'Sunday', subjects: [], testNumber: '', syllabus: 'Weekly Totals', isHoliday: true },
      { date: '2026-03-02', day: 'Monday', subjects: ['Chemistry', 'Computer', 'Physics Education', 'Civics'], testNumber: '4', syllabus: 'Ch#(11,15) /Ch#(5,6)/4 باب نمبر / Ch#4', isHoliday: false },
      { date: '2026-03-03', day: 'Tuesday', subjects: ['Urdu'], testNumber: '4', syllabus: 'Test # 4', isHoliday: false },
      { date: '2026-03-04', day: 'Wednesday', subjects: ['Physics', 'Economics'], testNumber: '4', syllabus: 'Ch 15#/کنڈہاف۔باب نمبر 2', isHoliday: false },
      { date: '2026-03-05', day: 'Thursday', subjects: ['T.Q'], testNumber: '4', syllabus: 'سورۃ الاحزاب،سورۃ الصف', isHoliday: false },
      { date: '2026-03-06', day: 'Friday', subjects: ['Biology', 'Math', 'I.S(Elective)'], testNumber: '4', syllabus: 'Ch#18 /Ch 3#)3.4-3.1(/سل پ ب دیکھیں', isHoliday: false },
      { date: '2026-03-07', day: 'Saturday', subjects: ['English'], testNumber: '5', syllabus: 'Test # 5', isHoliday: false },
      { date: '2026-03-08', day: 'Sunday', subjects: [], testNumber: '', syllabus: 'Weekly Totals', isHoliday: true },
      { date: '2026-03-09', day: 'Monday', subjects: ['Pak.Study'], testNumber: '5', syllabus: 'باب نمبر 3۔کنڈہاف', isHoliday: false },
      { date: '2026-03-10', day: 'Tuesday', subjects: ['Chemistry', 'Computer', 'Physics Education', 'Civics'], testNumber: '5', syllabus: 'Ch#12 /Ch#(7,8)/5 باب نمبر / Ch#5', isHoliday: false },
      { date: '2026-03-11', day: 'Wednesday', subjects: ['Urdu'], testNumber: '5', syllabus: 'Test # 5', isHoliday: false },
      { date: '2026-03-12', day: 'Thursday', subjects: ['Physics', 'Economics'], testNumber: '5', syllabus: 'Chp 16,20 /ہاف فسٹ ۔باب نمبر 3', isHoliday: false },
      { date: '2026-03-13', day: 'Friday', subjects: ['T.Q'], testNumber: '5', syllabus: 'سورۃ الجمعہ،سورۃ المنافقون', isHoliday: false },
      { date: '2026-03-14', day: 'Saturday', subjects: ['Biology', 'Math', 'I.S(Elective)'], testNumber: '5', syllabus: 'Ch#19,26 /Ch 3#)3.8-3.5(/سل پ ب دیکھیں', isHoliday: false },
      { date: '2026-03-15', day: 'Sunday', subjects: [], testNumber: '', syllabus: 'Weekly Totals', isHoliday: true },
      { date: '2026-03-16', day: 'Monday', subjects: ['English'], testNumber: '6', syllabus: 'Test # 6', isHoliday: false },
      { date: '2026-03-17', day: 'Tuesday', subjects: ['Pak.Study'], testNumber: '6', syllabus: 'باب نمبر 4', isHoliday: false },
      { date: '2026-03-18', day: 'Wednesday', subjects: [], testNumber: '', syllabus: 'Eid-ul-Fitar Holiday', isHoliday: true },
      { date: '2026-03-19', day: 'Thursday', subjects: [], testNumber: '', syllabus: 'Eid-ul-Fitar Holiday', isHoliday: true },
      { date: '2026-03-20', day: 'Friday', subjects: [], testNumber: '', syllabus: 'Eid-ul-Fitar Holiday', isHoliday: true },
      { date: '2026-03-21', day: 'Saturday', subjects: [], testNumber: '', syllabus: 'Eid-ul-Fitar Holiday', isHoliday: true },
      { date: '2026-03-22', day: 'Sunday', subjects: [], testNumber: '', syllabus: 'Weekly Totals', isHoliday: true },
      { date: '2026-03-23', day: 'Monday', subjects: ['Chemistry', 'Computer', 'Physics Education', 'Civics'], testNumber: '6', syllabus: 'Ch#(13,14) /Ch#9/6 باب نمبر / Ch#6', isHoliday: false },
      { date: '2026-03-24', day: 'Tuesday', subjects: ['Urdu'], testNumber: '6', syllabus: 'Test # 7', isHoliday: false },
      { date: '2026-03-25', day: 'Wednesday', subjects: ['Physics', 'Economics'], testNumber: '6', syllabus: 'Ch 17#/کنڈہاف۔باب نمبر 3', isHoliday: false },
      { date: '2026-03-26', day: 'Thursday', subjects: ['T.Q'], testNumber: '6', syllabus: 'سورۃ الحجرات،سورۃ التغابن', isHoliday: false },
      { date: '2026-03-27', day: 'Friday', subjects: ['Biology', 'Math', 'I.S(Elective)'], testNumber: '6', syllabus: 'Ch#20 /Ch 5#/سل پ ب دیکھیں', isHoliday: false },
      { date: '2026-03-28', day: 'Saturday', subjects: ['English'], testNumber: '7', syllabus: 'Test # 7', isHoliday: false },
      { date: '2026-03-29', day: 'Sunday', subjects: [], testNumber: '', syllabus: 'Weekly Totals', isHoliday: true },
      { date: '2026-03-30', day: 'Monday', subjects: ['Pak.Study'], testNumber: '7', syllabus: 'باب نمبر 5۔ہاف فسٹ', isHoliday: false },
      { date: '2026-03-31', day: 'Tuesday', subjects: ['Chemistry', 'Computer', 'Physics Education', 'Civics'], testNumber: '7', syllabus: 'Ch#(1,16) /Ch#10/ 7 باب نمبر / Ch#7,8', isHoliday: false },
      { date: '2026-04-01', day: 'Wednesday', subjects: [], testNumber: 'PTM', syllabus: 'Parent Teacher Meeting', isHoliday: false },
      { date: '2026-04-02', day: 'Thursday', subjects: ['Urdu'], testNumber: '7', syllabus: 'Test # 7', isHoliday: false },
      { date: '2026-04-03', day: 'Friday', subjects: ['Physics', 'Economics'], testNumber: '7', syllabus: 'Ch 19#/ہاف فسٹ ۔باب نمبر 4', isHoliday: false },
      { date: '2026-04-04', day: 'Saturday', subjects: ['T.Q'], testNumber: '7', syllabus: 'سورۃ الطلاق،سورۃ التحریم', isHoliday: false },
      { date: '2026-04-05', day: 'Sunday', subjects: [], testNumber: '', syllabus: 'Weekly Totals', isHoliday: true },
      { date: '2026-04-06', day: 'Monday', subjects: ['Biology', 'Math', 'I.S(Elective)'], testNumber: '7', syllabus: 'Ch#22 /Ch 7#/سل پ ب دیکھیں', isHoliday: false },
      { date: '2026-04-07', day: 'Tuesday', subjects: ['English'], testNumber: '8', syllabus: 'Test # 8', isHoliday: false },
      { date: '2026-04-08', day: 'Wednesday', subjects: ['Pak.Study'], testNumber: '8', syllabus: 'باب نمبر 5۔کنڈہاف', isHoliday: false },
      { date: '2026-04-09', day: 'Thursday', subjects: ['Chemistry', 'Computer', 'Physics Education', 'Civics'], testNumber: '8', syllabus: 'Ch#2,3,4 (S.Qs) /Ch#(11,12) /8 باب نمبر / Ch#9,10', isHoliday: false },
      { date: '2026-04-10', day: 'Friday', subjects: ['Urdu'], testNumber: '8', syllabus: 'Test # 8', isHoliday: false },
      { date: '2026-04-11', day: 'Saturday', subjects: ['Physics', 'Economics'], testNumber: '8', syllabus: 'Chp 18, 21/کنڈہاف۔باب نمبر 4', isHoliday: false },
      { date: '2026-04-12', day: 'Sunday', subjects: [], testNumber: '', syllabus: 'Weekly Totals', isHoliday: true },
      { date: '2026-04-13', day: 'Monday', subjects: ['T.Q'], testNumber: '8', syllabus: 'سورۃ المائدہ', isHoliday: false },
      { date: '2026-04-14', day: 'Tuesday', subjects: ['Biology', 'Math', 'I.S(Elective)'], testNumber: '08', syllabus: 'Ch#23,27 /Ch 4#/سل پ ب دیکھیں', isHoliday: false },
      { date: '2026-04-15', day: 'Wednesday', subjects: ['English'], testNumber: '09', syllabus: 'Test # 9', isHoliday: false },
      { date: '2026-04-16', day: 'Thursday', subjects: ['Pak.Study'], testNumber: '09', syllabus: 'باب نمبر 6', isHoliday: false },
      { date: '2026-04-17', day: 'Friday', subjects: ['Chemistry', 'Computer', 'Physics Education', 'Civics'], testNumber: '09', syllabus: 'Ch # 13,14 / سوالات مختصر و کثیر الانتخابی / فل بک', isHoliday: false },
      { date: '2026-04-18', day: 'Saturday', subjects: ['Urdu'], testNumber: '09', syllabus: 'Test # 9', isHoliday: false },
      { date: '2026-04-19', day: 'Sunday', subjects: [], testNumber: '', syllabus: 'Weekly Totals', isHoliday: true },
      { date: '2026-04-20', day: 'Monday', subjects: ['Physics', 'Economics'], testNumber: '09', syllabus: 'Full Book Short Question & MCQ/ باب نمبر 5۔ہاف فسٹ', isHoliday: false },
      { date: '2026-04-21', day: 'Tuesday', subjects: ['T.Q'], testNumber: '09', syllabus: 'سورۃ الحشر،سورۃ الفتح', isHoliday: false },
      { date: '2026-04-22', day: 'Wednesday', subjects: ['Biology', 'Math', 'I.S(Elective)'], testNumber: '09', syllabus: 'Ch#24,25 /Ch 6#/سل پ ب دیکھیں', isHoliday: false },
      { date: '2026-04-23', day: 'Thursday', subjects: ['English'], testNumber: 'FLP', syllabus: 'APTs', isHoliday: false },
      { date: '2026-04-24', day: 'Friday', subjects: ['Pak.Study'], testNumber: 'FLP', syllabus: 'APTs', isHoliday: false },
      { date: '2026-04-25', day: 'Saturday', subjects: ['Chemistry', 'Computer', 'Physics Education', 'Civics'], testNumber: 'FLP', syllabus: 'APTs', isHoliday: false },
      { date: '2026-04-26', day: 'Sunday', subjects: [], testNumber: '', syllabus: 'Weekly Totals', isHoliday: true },
      { date: '2026-04-27', day: 'Monday', subjects: ['Urdu'], testNumber: 'FLP', syllabus: 'APTs', isHoliday: false },
      { date: '2026-04-28', day: 'Tuesday', subjects: ['Physics', 'Economics'], testNumber: 'FLP', syllabus: 'APTs', isHoliday: false },
      { date: '2026-04-29', day: 'Wednesday', subjects: ['T.Q'], testNumber: 'FLP', syllabus: 'APTs', isHoliday: false },
      { date: '2026-04-30', day: 'Thursday', subjects: ['Biology', 'Math', 'I.S(Elective)'], testNumber: 'FLP', syllabus: 'APTs', isHoliday: false },
      { date: '2026-05-02', day: 'Friday', subjects: [], testNumber: 'PTM', syllabus: 'Parent Teacher Meeting', isHoliday: false },
      { date: '2026-05-03', day: 'Saturday', subjects: [], testNumber: '', syllabus: 'Weekly Totals', isHoliday: true },
    ];

    const data9th = [
      { date: '2026-02-02', day: 'Monday', subjects: ['English'], testNumber: '1', syllabus: 'Unit 1', isHoliday: false },
      { date: '2026-02-03', day: 'Tuesday', subjects: ['Math'], testNumber: '1', syllabus: 'Chapter 1', isHoliday: false },
      { date: '2026-02-04', day: 'Wednesday', subjects: ['Physics'], testNumber: '1', syllabus: 'Chapter 1', isHoliday: false },
    ];

    const data10th = [
      { date: '2026-02-02', day: 'Monday', subjects: ['English'], testNumber: '1', syllabus: 'Unit 1', isHoliday: false },
      { date: '2026-02-03', day: 'Tuesday', subjects: ['Math'], testNumber: '1', syllabus: 'Chapter 1', isHoliday: false },
      { date: '2026-02-04', day: 'Wednesday', subjects: ['Physics'], testNumber: '1', syllabus: 'Chapter 1', isHoliday: false },
    ];

    const dataToSeed = selectedGrade === '11th' ? data11th : 
                       selectedGrade === '12th' ? data12th : 
                       selectedGrade === '9th' ? data9th :
                       selectedGrade === '10th' ? data10th : [];
    
    if (dataToSeed.length === 0) {
      setToast({ message: 'No seed data for this grade yet.', type: 'error' });
      return;
    }

    setIsSeeding(true);
    let addedCount = 0;
    let skippedCount = 0;

    try {
      for (const item of dataToSeed) {
        const q = query(
          collection(db, 'dateSheets'), 
          where('grade', '==', selectedGrade), 
          where('date', '==', item.date)
        );
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
          await addDoc(collection(db, 'dateSheets'), { ...item, grade: selectedGrade, type: selectedType });
          addedCount++;
        } else {
          skippedCount++;
        }
      }
      
      if (addedCount > 0) {
        setToast({ 
          message: `Seeded ${addedCount} entries. ${skippedCount > 0 ? `Skipped ${skippedCount} duplicates.` : ''}`, 
          type: 'success' 
        });
      } else {
        setToast({ message: 'All entries already exist. No new data added.', type: 'error' });
      }
    } catch (error) {
      console.error('Error seeding data:', error);
      setToast({ message: 'Failed to seed data.', type: 'error' });
    } finally {
      setIsSeeding(false);
    }
  };

  const clearAllData = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'dateSheets'));
      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      setToast({ message: 'All date sheet entries deleted from database.', type: 'success' });
      setShowGlobalClearModal(false);
    } catch (error) {
      console.error('Error clearing global data:', error);
      setToast({ message: 'Failed to clear global data.', type: 'error' });
    }
  };

  const clearGradeData = async () => {
    try {
      const q = query(
        collection(db, 'dateSheets'), 
        where('grade', '==', selectedGrade),
        where('type', '==', selectedType)
      );
      const snapshot = await getDocs(q);
      for (const docSnap of snapshot.docs) {
        await deleteDoc(doc(db, 'dateSheets', docSnap.id));
      }
      setToast({ message: `Cleared all ${selectedGrade} ${selectedType === 'test-session' ? 'Test Session' : 'Other'} data.`, type: 'success' });
    } catch (error) {
      console.error('Error clearing data:', error);
      setToast({ message: 'Failed to clear data.', type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
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

          <button onClick={() => setShowAdd(true)} className="btn-mind flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Add Entry</span>
          </button>
          <button 
            onClick={() => setShowClearAllModal(true)} 
            className="px-4 py-2 bg-red-500/10 border border-red-500/40 text-red-400 hover:bg-red-500/20 rounded-xl text-xs font-bold transition-all flex items-center space-x-2"
            title="Clear all entries for selected grade and type"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear ({selectedGrade})</span>
          </button>
          <button 
            onClick={() => setShowGlobalClearModal(true)} 
            className="px-4 py-2 bg-red-600/20 border border-red-600/40 text-red-500 hover:bg-red-600/30 rounded-xl text-xs font-bold transition-all flex items-center space-x-2"
            title="DANGEROUS: Clear ALL date sheet entries for ALL grades"
          >
            <AlertTriangle className="w-3 h-3" />
            <span>Clear ALL</span>
          </button>
        </div>
        <button 
          onClick={seedData} 
          disabled={isSeeding}
          className={cn(
            "text-[10px] text-white/20 hover:text-white transition-colors uppercase tracking-widest font-black",
            isSeeding && "opacity-50 cursor-not-allowed"
          )}
        >
          {isSeeding ? 'Seeding...' : 'Seed Syllabus from PDF'}
        </button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="glass-card p-6">
            <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input 
                type="date" 
                required
                value={newEntry.date}
                onChange={e => setNewEntry({...newEntry, date: e.target.value})}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-mind-purple"
              />
              <input 
                placeholder="Day (e.g. Monday)" 
                value={newEntry.day}
                onChange={e => setNewEntry({...newEntry, day: e.target.value})}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-mind-purple"
              />
              <select
                value={newEntry.type}
                onChange={e => setNewEntry({...newEntry, type: e.target.value as any})}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-mind-purple"
              >
                <option value="test-session">Test Session Date Sheet</option>
                <option value="other">Other Date Sheet</option>
              </select>
              <input 
                placeholder="Subjects (slash separated)" 
                value={typeof newEntry.subjects === 'string' ? newEntry.subjects : (newEntry.subjects as string[]).join(' / ')}
                onChange={e => setNewEntry({...newEntry, subjects: e.target.value as any})}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-mind-purple"
              />
              <input 
                placeholder="Test #" 
                value={newEntry.testNumber}
                onChange={e => setNewEntry({...newEntry, testNumber: e.target.value})}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-mind-purple"
              />
              <input 
                placeholder="Syllabus" 
                value={newEntry.syllabus}
                onChange={e => setNewEntry({...newEntry, syllabus: e.target.value})}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-mind-purple md:col-span-2"
              />
              <label className="flex items-center space-x-2 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={newEntry.isHoliday}
                  onChange={e => setNewEntry({...newEntry, isHoliday: e.target.checked})}
                  className="w-4 h-4 rounded border-white/10 bg-white/5 text-mind-purple focus:ring-mind-purple"
                />
                <span className="text-sm">Is Holiday?</span>
              </label>
              <div className="md:col-span-3 flex justify-end space-x-4">
                <button type="button" onClick={() => setShowAdd(false)} className="text-white/40 hover:text-white">Cancel</button>
                <button type="submit" className="btn-mind px-8">Save Entry</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-white/5">
              <th className="p-4 text-[10px] font-black text-white/40 uppercase tracking-widest">Date / Day</th>
              <th className="p-4 text-[10px] font-black text-white/40 uppercase tracking-widest">Subject(s)</th>
              <th className="p-4 text-[10px] font-black text-white/40 uppercase tracking-widest">Test #</th>
              <th className="p-4 text-[10px] font-black text-white/40 uppercase tracking-widest">Syllabus</th>
              <th className="p-4 text-[10px] font-black text-white/40 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {entries.map(entry => (
              <tr key={entry.id} className={cn("hover:bg-white/5 transition-colors", entry.isHoliday && "bg-red-500/5")}>
                <td className="p-4">
                  <p className="text-sm font-bold">{entry.date}</p>
                  <p className="text-[10px] text-white/40 uppercase">{entry.day}</p>
                </td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-2">
                    {entry.subjects.map(s => (
                      <span key={s} className="px-2 py-1 bg-mind-purple/10 text-mind-purple rounded text-[10px] font-bold">
                        {s}
                      </span>
                    ))}
                    {entry.isHoliday && <span className="text-red-400 font-black uppercase text-[10px]">Holiday</span>}
                  </div>
                </td>
                <td className="p-4 text-sm font-medium">{entry.testNumber || '-'}</td>
                <td className="p-4 text-xs text-white/60 max-w-xs truncate">{entry.syllabus}</td>
                <td className="p-4 text-right">
                  <button onClick={() => setConfirmDeleteId(entry.id!)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {entries.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="p-12 text-center text-white/40 italic text-sm">
                  No date sheet entries found for this class.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        title="Delete Entry"
        onConfirm={handleDelete}
        confirmText="Delete"
        variant="danger"
      >
        <p>Are you sure you want to delete this date sheet entry? This action cannot be undone.</p>
      </Modal>

      <Modal
        isOpen={showClearAllModal}
        onClose={() => setShowClearAllModal(false)}
        title={`Clear All ${selectedGrade} ${selectedType === 'test-session' ? 'Test Session' : 'Other'} Data`}
        onConfirm={clearGradeData}
        confirmText="Yes, Delete All"
        variant="danger"
      >
        <p>This will permanently delete ALL <strong>{selectedType === 'test-session' ? 'Test Session' : 'Other'}</strong> date sheet entries for <strong>{selectedGrade} Class</strong>. Are you absolutely sure?</p>
      </Modal>

      <Modal
        isOpen={showGlobalClearModal}
        onClose={() => setShowGlobalClearModal(false)}
        title="DANGER: Clear ALL Date Sheets"
        onConfirm={clearAllData}
        confirmText="DELETE EVERYTHING"
        variant="danger"
      >
        <p className="text-red-400 font-bold underline mb-2">CRITICAL WARNING:</p>
        <p>This will permanently delete <strong>EVERY</strong> date sheet entry for <strong>ALL grades</strong> and <strong>ALL types</strong> in the entire database.</p>
        <p className="mt-2 text-sm opacity-70 italic">This action is irreversible and will affect all students across the entire platform.</p>
      </Modal>
    </div>
  );
};

const WebsiteManager = ({ setToast }: { setToast: (t: any) => void }) => {
  const [content, setContent] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({ type: 'notification', title: '', content: '' });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'websiteContent'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setContent(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, []);

  const handleAddContent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setDoc(doc(collection(db, 'websiteContent')), {
        ...newItem,
        date: new Date().toISOString()
      });
      setShowAdd(false);
      setNewItem({ type: 'notification', title: '', content: '' });
    } catch (error) {
      console.error('Error adding content:', error);
    }
  };

  const handleRemoveContent = async (id: string) => {
    await deleteDoc(doc(db, 'websiteContent', id));
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <button onClick={() => setShowAdd(true)} className="btn-mind flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>Add Content</span>
        </button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="glass-card p-6">
            <form onSubmit={handleAddContent} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select 
                  value={newItem.type} 
                  onChange={e => setNewItem({...newItem, type: e.target.value})}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-mind-purple"
                >
                  <option value="notification">Notification</option>
                  <option value="announcement">Announcement</option>
                  <option value="blog">Blog Post</option>
                  <option value="contact">Contact Info Update</option>
                </select>
                <input 
                  required 
                  type="text" 
                  placeholder="Title" 
                  value={newItem.title} 
                  onChange={e => setNewItem({...newItem, title: e.target.value})}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-mind-purple"
                />
              </div>
              <textarea 
                required 
                placeholder="Content" 
                value={newItem.content} 
                onChange={e => setNewItem({...newItem, content: e.target.value})}
                className="w-full h-32 bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-mind-purple"
              />
              <button type="submit" className="btn-mind w-full">Publish Content</button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {content.map(item => (
          <div key={item.id} className="glass-card p-6 flex items-center justify-between group">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-mind-purple/20 text-mind-purple rounded">
                  {item.type}
                </span>
                <span className="text-xs text-white/40">{new Date(item.date).toLocaleDateString()}</span>
              </div>
              <h3 className="font-bold">{item.title}</h3>
              <p className="text-sm text-white/60 line-clamp-1">{item.content}</p>
            </div>
            <button onClick={() => setConfirmDelete(item.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>

      <Modal 
        isOpen={!!confirmDelete} 
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && handleRemoveContent(confirmDelete)}
        title="Remove Content"
        confirmText="Remove"
        variant="danger"
      >
        Are you sure you want to remove this content?
      </Modal>
    </div>
  );
};

const Students = ({ setToast }: { setToast: (t: any) => void }) => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [editingRollNumber, setEditingRollNumber] = useState<any>(null);
  const [rollNumberInput, setRollNumberInput] = useState('');
  const [editingGrade, setEditingGrade] = useState<any>(null);
  const [gradeInput, setGradeInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const gradeOptions = [
    { value: '11th', label: '11th Class (1st Year)' },
    { value: '12th', label: '12th Class (2nd Year)' },
    { value: '9th', label: '9th Class' },
    { value: '10th', label: '10th Class' },
  ];

  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'student'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setStudents(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleUpdateRollNumber = async () => {
    if (!editingRollNumber || !rollNumberInput.trim()) return;
    setIsProcessing(true);
    try {
      await updateDoc(doc(db, 'users', editingRollNumber.uid), {
        rollNumber: rollNumberInput.trim()
      });
      setToast({ type: 'success', message: 'Roll number updated successfully' });
      setEditingRollNumber(null);
      setRollNumberInput('');
    } catch (error) {
      console.error('Error updating roll number:', error);
      setToast({ type: 'error', message: 'Failed to update roll number' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateGrade = async () => {
    if (!editingGrade || !gradeInput.trim()) return;
    setIsProcessing(true);
    try {
      await updateDoc(doc(db, 'users', editingGrade.uid), {
        grade: gradeInput.trim()
      });
      setToast({ type: 'success', message: 'Grade updated successfully' });
      setEditingGrade(null);
      setGradeInput('');
    } catch (error) {
      console.error('Error updating grade:', error);
      setToast({ type: 'error', message: 'Failed to update grade' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    try {
      await deleteDoc(doc(db, 'users', studentId));
      setToast({ type: 'success', message: 'Student removed successfully' });
    } catch (error: any) {
      console.error('Error removing student:', error);
      setToast({ type: 'error', message: 'Failed to remove student' });
    }
  };

  const filteredStudents = students.filter(s => 
    s.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input 
            placeholder="Search by name, roll no, or email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:border-mind-purple transition-all"
          />
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              <th className="px-6 py-4 text-mind-purple font-bold text-sm">Student</th>
              <th className="px-6 py-4 text-mind-purple font-bold text-sm">Roll Number</th>
              <th className="px-6 py-4 text-mind-purple font-bold text-sm">Grade</th>
              <th className="px-6 py-4 text-mind-purple font-bold text-sm">Email</th>
              <th className="px-6 py-4 text-mind-purple font-bold text-sm text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredStudents.map(student => (
              <tr key={student.uid} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 font-bold">{student.displayName}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs bg-white/5 px-2 py-1 rounded border border-white/10">
                      {student.rollNumber || 'Not Assigned'}
                    </span>
                    <button 
                      onClick={() => {
                        setEditingRollNumber(student);
                        setRollNumberInput(student.rollNumber || '');
                      }}
                      className="p-1 text-white/40 hover:text-mind-purple transition-colors"
                      title="Edit Roll Number"
                    >
                      <Settings className="w-3 h-3" />
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">
                      {gradeOptions.find(g => g.value === student.grade)?.label || student.grade || 'N/A'}
                    </span>
                    <button 
                      onClick={() => {
                        setEditingGrade(student);
                        setGradeInput(student.grade || '');
                      }}
                      className="p-1 text-white/40 hover:text-mind-purple transition-colors"
                      title="Edit Grade"
                    >
                      <Settings className="w-3 h-3" />
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4 text-white/60">{student.email}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <button 
                      onClick={() => {
                        setEditingRollNumber(student);
                        setRollNumberInput(student.rollNumber || '');
                      }}
                      className="p-2 text-white/40 hover:text-mind-purple transition-colors"
                      title="Assign/Edit Roll Number"
                    >
                      <Shield className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => setConfirmDelete(student.uid)}
                      className="p-2 text-white/40 hover:text-red-400 transition-colors"
                      title="Remove Student"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredStudents.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-white/40 italic">No students found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={!!editingRollNumber}
        onClose={() => { setEditingRollNumber(null); setRollNumberInput(''); }}
        title="Assign Roll Number"
        onConfirm={handleUpdateRollNumber}
        confirmText={isProcessing ? "Updating..." : "Update Roll Number"}
      >
        <div className="space-y-4">
          <p>Assign or update roll number for <strong>{editingRollNumber?.displayName}</strong>.</p>
          <div className="space-y-2">
            <label className="text-xs font-bold text-mind-purple uppercase">Roll Number</label>
            <input 
              type="text"
              value={rollNumberInput}
              onChange={(e) => setRollNumberInput(e.target.value)}
              placeholder="e.g. MW-2024-001"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-mind-purple"
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!editingGrade}
        onClose={() => { setEditingGrade(null); setGradeInput(''); }}
        title="Update Student Grade"
        onConfirm={handleUpdateGrade}
        confirmText={isProcessing ? "Updating..." : "Update Grade"}
      >
        <div className="space-y-4">
          <p>Update grade for <strong>{editingGrade?.displayName}</strong>.</p>
          <div className="space-y-2">
            <label className="text-xs font-bold text-mind-purple uppercase">Select Grade</label>
            <select 
              value={gradeInput}
              onChange={(e) => setGradeInput(e.target.value)}
              className="w-full bg-mind-deep border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-mind-purple"
            >
              <option value="">Select a grade...</option>
              {gradeOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Remove Student"
        onConfirm={() => confirmDelete && handleRemoveStudent(confirmDelete)}
        confirmText="Remove"
        variant="danger"
      >
        Are you sure you want to remove this student? This action cannot be undone and will permanently delete their account.
      </Modal>
    </div>
  );
};

const Notifications = ({ role, uid }: { role: string, uid?: string }) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const recipientId = role === 'admin' ? 'admin' : uid;
    if (!recipientId) return;

    // IT Managers should see notifications sent to 'admin' as well
    const q = role === 'it-manager' 
      ? query(
          collection(db, 'notifications'),
          where('recipientId', 'in', ['admin', uid]),
          orderBy('createdAt', 'desc')
        )
      : query(
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
const Sidebar = ({ activeTab, setActiveTab, isOpen, setIsOpen, role }: any) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { profile } = useAuth();
  
  const menuItems = [
    { id: 'overview', name: 'Overview', icon: LayoutDashboard, roles: ['admin'] },
    { id: 'notifications', name: 'Notifications', icon: Bell, roles: ['admin', 'it-manager'] },
    { id: 'enrollments', name: 'Enrollments', icon: UserPlus, roles: ['admin'] },
    { id: 'subjects', name: 'Subjects', icon: BookOpen, roles: ['admin'] },
    { id: 'students', name: 'Students', icon: GraduationCap, roles: ['admin'] },
    { id: 'teachers', name: 'Teachers', icon: Users, roles: ['admin'] },
    { id: 'attendance', name: 'Attendance', icon: CheckCircle, roles: ['admin'] },
    { id: 'results', name: 'Test Results', icon: FileText, roles: ['admin'] },
    { id: 'date-sheet', name: 'Date Sheet', icon: Calendar, roles: ['admin'] },
    { id: 'it-sector', name: 'IT Sector', icon: Shield, roles: ['admin', 'it-manager'] },
    { id: 'website', name: 'Website Manager', icon: Settings, roles: ['admin', 'it-manager'] },
    { id: 'settings', name: 'Settings', icon: Settings, roles: ['admin'] },
  ].filter(item => item.roles.includes(role));

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
        animate={{ x: (isOpen || !isMobile) ? 0 : -300 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={cn(
          "fixed top-0 left-0 bottom-0 w-72 bg-mind-accent border-r border-white/10 z-50 lg:translate-x-0 lg:static lg:block",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center space-x-3 mb-12">
            <div className="w-10 h-10 mind-gradient rounded-lg flex items-center justify-center">
              <Shield className="text-white w-6 h-6" />
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
                <p className="text-xs text-white/40 truncate">Administrator</p>
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

const Enrollments = ({ setToast }: { setToast: (t: any) => void }) => {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmReject, setConfirmReject] = useState<string | null>(null);
  const [approvingEnrollment, setApprovingEnrollment] = useState<any>(null);
  const [rollNumberInput, setRollNumberInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'enrollments'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setEnrollments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleApprove = async (enrollment: any, rollNumber: string) => {
    if (!rollNumber.trim()) {
      setToast({ type: 'error', message: 'Roll number is required' });
      return;
    }
    setIsProcessing(true);
    let secondaryApp;
    try {
      const existingApp = getApps().find(app => app.name === 'Secondary');
      secondaryApp = existingApp || initializeApp(firebaseConfig, 'Secondary');
      
      const secondaryAuth = getAuth(secondaryApp);
      const sanitizedUsername = enrollment.studentName.toLowerCase().replace(/\s+/g, '') + Math.floor(1000 + Math.random() * 9000);
      const studentEmail = enrollment.email;
      const studentPassword = enrollment.password || ('Student@' + Math.floor(1000 + Math.random() * 9000));
      
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, studentEmail, studentPassword);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        username: sanitizedUsername,
        email: studentEmail,
        displayName: enrollment.studentName,
        role: 'student',
        grade: enrollment.currentClass || enrollment.lastDegree,
        rollNumber: rollNumber.trim(),
        dateOfBirth: enrollment.dateOfBirth || '',
        enrolledSubjects: enrollment.selectedSubjects || [],
        isBlocked: false,
        createdAt: new Date().toISOString()
      });

      await updateDoc(doc(db, 'enrollments', enrollment.id), { status: 'verified', rollNumber: rollNumber.trim() });
      
      // Notify Admin
      await addDoc(collection(db, 'notifications'), {
        recipientId: 'admin',
        title: 'Enrollment Approved',
        content: `Student ${enrollment.studentName} has been approved with Roll Number: ${rollNumber}.`,
        type: 'enrollment_approved',
        read: false,
        createdAt: serverTimestamp()
      });

      // Notify Teachers of selected subjects
      if (enrollment.selectedSubjects && enrollment.selectedSubjects.length > 0) {
        const teachersQuery = query(collection(db, 'users'), where('role', '==', 'teacher'));
        const teachersSnapshot = await getDocs(teachersQuery);
        const teachers = teachersSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));

        for (const subject of enrollment.selectedSubjects) {
          const relevantTeachers = teachers.filter((t: any) => t.subjectsTaught?.includes(subject));
          for (const teacher of relevantTeachers) {
            await addDoc(collection(db, 'notifications'), {
              recipientId: teacher.uid,
              title: 'New Student in Subject',
              content: `A new student, ${enrollment.studentName} (Roll No: ${rollNumber}), has joined your ${subject} class.`,
              type: 'new_student',
              read: false,
              createdAt: serverTimestamp()
            });
          }
        }
      }

      setToast({ 
        type: 'success', 
        message: `Student account created!\nRoll No: ${rollNumber}\nUsername: ${sanitizedUsername}\nPassword: ${studentPassword}` 
      });
      setApprovingEnrollment(null);
      setRollNumberInput('');
    } catch (error: any) {
      console.error('Error approving enrollment:', error);
      setToast({ type: 'error', message: error.message || 'Failed to approve enrollment' });
    } finally {
      setIsProcessing(false);
      if (secondaryApp) {
        try {
          await deleteApp(secondaryApp);
        } catch (err) {
          console.error('Error deleting secondary app:', err);
        }
      }
    }
  };

  const handleReject = async (id: string) => {
    try {
      await updateDoc(doc(db, 'enrollments', id), { status: 'rejected' });
      setToast({ type: 'success', message: 'Application rejected' });
    } catch (error) {
      console.error('Error rejecting enrollment:', error);
      setToast({ type: 'error', message: 'Failed to reject enrollment' });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input 
              placeholder="Search applications..." 
              className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:border-mind-purple transition-all"
            />
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="px-6 py-4 text-mind-purple font-bold text-sm uppercase tracking-wider">Student</th>
                <th className="px-6 py-4 text-mind-purple font-bold text-sm uppercase tracking-wider">Details</th>
                <th className="px-6 py-4 text-mind-purple font-bold text-sm uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-mind-purple font-bold text-sm uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-mind-purple font-bold text-sm uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {enrollments.map((enroll) => (
                <tr key={enroll.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold">{enroll.studentName}</div>
                    <div className="text-xs text-white/40">{enroll.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <span className="text-white/40">Last:</span> {enroll.lastDegree}
                    </div>
                    {enroll.currentClass && (
                      <div className="text-sm">
                        <span className="text-mind-purple">Current:</span> {enroll.currentClass}
                      </div>
                    )}
                    <div className="text-xs text-white/40">Marks: {enroll.marks}% | Age: {enroll.age}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded-lg text-[10px] font-bold uppercase",
                      enroll.isSupplementary ? "bg-amber-500/20 text-amber-400" : "bg-blue-500/20 text-blue-400"
                    )}>
                      {enroll.isSupplementary ? 'Supplementary' : 'Regular'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded-lg text-[10px] font-bold uppercase",
                      enroll.status === 'pending' ? "bg-white/10 text-white/60" : 
                      enroll.status === 'verified' ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                    )}>
                      {enroll.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {enroll.status === 'pending' && (
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => setApprovingEnrollment(enroll)}
                          className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500 hover:text-white transition-all"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setConfirmReject(enroll.id)}
                          className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    {enroll.status === 'verified' && (
                      <div className="text-xs font-bold text-emerald-400">
                        Roll No: {enroll.rollNumber}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {enrollments.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-white/40">No enrollment applications found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal 
        isOpen={!!confirmReject} 
        onClose={() => setConfirmReject(null)}
        onConfirm={() => confirmReject && handleReject(confirmReject)}
        title="Reject Application"
        confirmText="Reject"
        variant="danger"
      >
        Are you sure you want to reject this application?
      </Modal>

      <Modal 
        isOpen={!!approvingEnrollment} 
        onClose={() => { if (!isProcessing) { setApprovingEnrollment(null); setRollNumberInput(''); } }}
        onConfirm={() => approvingEnrollment && !isProcessing && handleApprove(approvingEnrollment, rollNumberInput)}
        title="Approve Application"
        confirmText={isProcessing ? "Creating Account..." : "Approve & Create Account"}
      >
        <div className="space-y-4">
          <p>Assign a permanent Roll Number to <strong>{approvingEnrollment?.studentName}</strong>.</p>
          <div className="space-y-2">
            <label className="text-xs font-bold text-mind-purple uppercase">Roll Number</label>
            <input 
              disabled={isProcessing}
              type="text"
              value={rollNumberInput}
              onChange={(e) => setRollNumberInput(e.target.value)}
              placeholder="e.g. MW-2024-001"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-mind-purple disabled:opacity-50"
            />
          </div>
          {isProcessing && (
            <p className="text-xs text-mind-purple animate-pulse">This may take a few seconds...</p>
          )}
        </div>
      </Modal>
    </div>
  );
};

const ManageAcademyAttendance = () => {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGrade, setSelectedGrade] = useState('10th');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const q = query(
      collection(db, 'attendance'),
      where('grade', '==', selectedGrade),
      where('date', '==', selectedDate)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAttendance(data);
      setLoading(false);
    });
    return unsubscribe;
  }, [selectedGrade, selectedDate]);

  return (
    <div className="space-y-8">
      <div className="glass-card p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-mind-purple text-xs font-bold uppercase">Class</label>
          <select 
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="w-full bg-mind-deep/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-mind-purple"
          >
            <option value="9th">9th Class</option>
            <option value="10th">10th Class</option>
            <option value="11th">11th Class</option>
            <option value="12th">12th Class</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-mind-purple text-xs font-bold uppercase">Date</label>
          <input 
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full bg-mind-deep/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-mind-purple"
          />
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h3 className="font-bold">Attendance Records ({attendance.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5">
                <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest">Student ID</th>
                <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest">Subject</th>
                <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest">Teacher</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {attendance.map((record) => (
                <tr key={record.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium">{record.studentId}</td>
                  <td className="px-6 py-4 text-sm">{record.subject}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded text-[10px] font-bold uppercase",
                      record.status === 'present' ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                    )}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-white/40">{record.teacherId}</td>
                </tr>
              ))}
              {attendance.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-white/40 italic">No records found for this selection.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const ManageTestResults = ({ setToast }: { setToast: (t: any) => void }) => {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGrade, setSelectedGrade] = useState('10th');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingResult, setEditingResult] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'testResults'),
      where('class', '==', selectedGrade),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setResults(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return unsubscribe;
  }, [selectedGrade]);

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'testResults', id));
      setToast({ message: 'Result deleted successfully', type: 'success' });
    } catch (error) {
      console.error('Error deleting result:', error);
      setToast({ message: 'Failed to delete result', type: 'error' });
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, 'testResults', editingResult.id), {
        obtainedMarks: editingResult.obtainedMarks,
        totalMarks: editingResult.totalMarks,
        subject: editingResult.subject
      });
      setEditingResult(null);
      setToast({ message: 'Result updated successfully', type: 'success' });
    } catch (error) {
      console.error('Error updating result:', error);
      setToast({ message: 'Failed to update result', type: 'error' });
    }
  };

  const filteredResults = results.filter(r => 
    r.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.rollNumber?.toString().includes(searchTerm)
  );

  return (
    <div className="space-y-8">
      <div className="glass-card p-6 flex flex-col md:flex-row gap-6 justify-between items-end">
        <div className="w-full md:w-1/3 space-y-2">
          <label className="text-mind-purple text-xs font-bold uppercase">Class</label>
          <select 
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="w-full bg-mind-deep/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-mind-purple"
          >
            <option value="9th">9th Class</option>
            <option value="10th">10th Class</option>
            <option value="11th">11th Class</option>
            <option value="12th">12th Class</option>
          </select>
        </div>
        <div className="w-full md:w-1/2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input 
            placeholder="Search by name or roll number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-mind-deep/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-mind-purple"
          />
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5">
                <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest">Student</th>
                <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest">Subject</th>
                <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest">Marks</th>
                <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredResults.map((result) => (
                <tr key={result.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-sm">{result.studentName}</p>
                    <p className="text-[10px] text-white/40">Roll: {result.rollNumber}</p>
                  </td>
                  <td className="px-6 py-4 text-sm">{result.subject}</td>
                  <td className="px-6 py-4 text-sm font-bold">
                    {result.obtainedMarks} / {result.totalMarks}
                  </td>
                  <td className="px-6 py-4 text-xs text-white/40">{result.testDate}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-2">
                      <button 
                        onClick={() => setEditingResult(result)}
                        className="p-2 hover:bg-mind-purple/20 text-mind-purple rounded-lg transition-all"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setDeleteConfirm(result.id)}
                        className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal 
        isOpen={!!deleteConfirm} 
        onClose={() => setDeleteConfirm(null)}
        title="Delete Result"
        confirmText="Delete"
        variant="danger"
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
      >
        Are you sure you want to delete this test result? This action cannot be undone.
      </Modal>

      <AnimatePresence>
        {editingResult && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card max-w-md w-full p-8">
              <h3 className="text-xl font-bold mb-6">Edit Test Result</h3>
              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-white/40 mb-1">Subject</label>
                  <input 
                    value={editingResult.subject}
                    onChange={(e) => setEditingResult({...editingResult, subject: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-mind-purple"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-white/40 mb-1">Obtained</label>
                    <input 
                      type="number"
                      value={editingResult.obtainedMarks}
                      onChange={(e) => setEditingResult({...editingResult, obtainedMarks: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-mind-purple"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-white/40 mb-1">Total</label>
                    <input 
                      type="number"
                      value={editingResult.totalMarks}
                      onChange={(e) => setEditingResult({...editingResult, totalMarks: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-mind-purple"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-4 mt-8">
                  <button type="button" onClick={() => setEditingResult(null)} className="text-white/60 hover:text-white">Cancel</button>
                  <button type="submit" className="btn-mind px-6 py-2">Save Changes</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Main Dashboard ---
export default function AdminDashboard() {
  const { profile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  if (loading) return <div className="pt-32 text-center">Loading Admin Panel...</div>;
  if (!profile || profile.role !== 'admin') {
    return <div className="pt-32 text-center">Unauthorized Access</div>;
  }

  return (
    <div className="flex min-h-screen bg-mind-deep">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
        role={profile.role}
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
                <p className="text-[10px] text-white/40 uppercase tracking-wider">{profile.role}</p>
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
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="glass-card p-6">
                      <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-2">Total Students</p>
                      <h3 className="text-3xl font-bold">842</h3>
                      <div className="mt-4 flex items-center text-emerald-400 text-xs">
                        <BarChart2 className="w-3 h-3 mr-1" />
                        <span>+12% from last month</span>
                      </div>
                    </div>
                    <div className="glass-card p-6">
                      <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-2">Active Teachers</p>
                      <h3 className="text-3xl font-bold">36</h3>
                      <div className="mt-4 flex items-center text-blue-400 text-xs">
                        <Users className="w-3 h-3 mr-1" />
                        <span>All active</span>
                      </div>
                    </div>
                    <div className="glass-card p-6">
                      <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-2">Pending Enrollments</p>
                      <h3 className="text-3xl font-bold">18</h3>
                      <div className="mt-4 flex items-center text-amber-400 text-xs">
                        <UserPlus className="w-3 h-3 mr-1" />
                        <span>Requires action</span>
                      </div>
                    </div>
                    <div className="glass-card p-6">
                      <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-2">Attendance Today</p>
                      <h3 className="text-3xl font-bold">94%</h3>
                      <div className="mt-4 flex items-center text-emerald-400 text-xs">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        <span>Consistent with average</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'notifications' && <Notifications role={profile?.role} uid={profile?.uid} />}
              {activeTab === 'enrollments' && <Enrollments setToast={setToast} />}
              {activeTab === 'subjects' && <Subjects setToast={setToast} />}
              {activeTab === 'students' && <Students setToast={setToast} />}
              {activeTab === 'teachers' && <Teachers setToast={setToast} />}
              {activeTab === 'attendance' && <ManageAcademyAttendance />}
              {activeTab === 'results' && <ManageTestResults setToast={setToast} />}
              {activeTab === 'date-sheet' && <ManageDateSheet setToast={setToast} />}
              {activeTab === 'it-sector' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                      <ParentVerification setToast={setToast} />
                      <FacultyManager setToast={setToast} />
                    </div>
                    <div className="space-y-8">
                      <div className="glass-card p-6">
                        <h3 className="text-lg font-bold mb-4">Security Overview</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-white/60">Active Sessions</span>
                            <span className="font-bold">142</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-white/60">Failed Logins (24h)</span>
                            <span className="text-red-400 font-bold">3</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-white/60">System Health</span>
                            <span className="text-emerald-400 font-bold">Optimal</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'website' && <WebsiteManager setToast={setToast} />}
              {activeTab === 'settings' && <AdminSettings role={profile?.role} uid={profile?.uid} setToast={setToast} />}
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

const AdminSettings = ({ role, uid, setToast }: any) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newITEmail, setNewITEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [adminUsername, setAdminUsername] = useState('iamadmin');

  const handleResetDatabase = async () => {
    if (adminUsername !== 'iamadmin') {
      setToast({ type: 'error', message: 'Please type "iamadmin" to confirm' });
      return;
    }
    setIsProcessing(true);
    try {
      const collectionsToDelete = [
        'users', 'enrollments', 'testResults', 'lessons', 
        'assignments', 'attendance', 'remarks', 'notifications', 
        'parentRequests', 'dateSheet'
      ];

      for (const collName of collectionsToDelete) {
        const q = query(collection(db, collName));
        const snapshot = await getDocs(q);
        for (const docSnap of snapshot.docs) {
          // Don't delete the current admin user!
          if (collName === 'users' && docSnap.id === uid) continue;
          await deleteDoc(doc(db, collName, docSnap.id));
        }
      }

      setToast({ type: 'success', message: 'Database reset successfully! All data cleared except your account.' });
    } catch (error: any) {
      console.error('Error resetting database:', error);
      setToast({ type: 'error', message: 'Failed to reset database: ' + error.message });
    } finally {
      setIsProcessing(false);
      setShowResetConfirm(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setToast({ type: 'error', message: 'Passwords do not match' });
      return;
    }
    if (newPassword.length < 6) {
      setToast({ type: 'error', message: 'Password must be at least 6 characters' });
      return;
    }
    setIsProcessing(true);
    try {
      const { updatePassword } = await import('firebase/auth');
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
        setToast({ type: 'success', message: 'Password updated successfully' });
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error: any) {
      console.error('Error updating password:', error);
      setToast({ type: 'error', message: 'Failed to update password. You may need to re-login to perform this sensitive action.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAssignRole = async (email: string, targetRole: string) => {
    if (!email.trim()) return;
    setIsProcessing(true);
    try {
      const q = query(collection(db, 'users'), where('email', '==', email.trim()));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        // Create a placeholder profile if user hasn't logged in yet
        await addDoc(collection(db, 'users'), {
          email: email.trim(),
          role: targetRole,
          createdAt: new Date().toISOString(),
          needsVerification: true
        });
      } else {
        const userDoc = snapshot.docs[0];
        await updateDoc(doc(db, 'users', userDoc.id), {
          role: targetRole
        });
      }
      
      setToast({ type: 'success', message: `User ${email} assigned as ${targetRole}` });
      if (targetRole === 'admin') setNewAdminEmail('');
      else setNewITEmail('');
    } catch (error: any) {
      console.error('Error assigning role:', error);
      setToast({ type: 'error', message: 'Failed to assign role: ' + error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <div className="flex items-center space-x-4 mb-8">
        <div className="w-12 h-12 mind-gradient rounded-xl flex items-center justify-center">
          <Settings className="text-white w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Admin Settings</h2>
          <p className="text-white/60">Manage system configuration and security</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Profile & Password */}
        <div className="glass-card p-8 space-y-6">
          <h3 className="text-lg font-bold flex items-center space-x-2">
            <Shield className="w-5 h-5 text-mind-purple" />
            <span>Security & Password</span>
          </h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase">New Password</label>
              <input 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-mind-purple"
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase">Confirm Password</label>
              <input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-mind-purple"
                placeholder="••••••••"
              />
            </div>
            <button 
              onClick={handleChangePassword}
              disabled={isProcessing}
              className="w-full btn-mind py-3"
            >
              {isProcessing ? 'Updating...' : 'Change Password'}
            </button>
          </div>
        </div>

        {/* Role Management */}
        <div className="glass-card p-8 space-y-6">
          <h3 className="text-lg font-bold flex items-center space-x-2">
            <Users className="w-5 h-5 text-mind-purple" />
            <span>Role Management</span>
          </h3>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase">Assign New Admin (Email)</label>
              <div className="flex space-x-2">
                <input 
                  type="email" 
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-mind-purple"
                  placeholder="admin@gmail.com"
                />
                <button 
                  onClick={() => handleAssignRole(newAdminEmail, 'admin')}
                  disabled={isProcessing}
                  className="btn-mind px-4"
                >
                  Add
                </button>
              </div>
              <p className="text-[10px] text-white/40">New admins must verify their Gmail upon first login.</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase">Assign IT Guy (Email)</label>
              <div className="flex space-x-2">
                <input 
                  type="email" 
                  value={newITEmail}
                  onChange={(e) => setNewITEmail(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-mind-purple"
                  placeholder="it@gmail.com"
                />
                <button 
                  onClick={() => handleAssignRole(newITEmail, 'it-manager')}
                  disabled={isProcessing}
                  className="btn-mind px-4"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="glass-card border-red-500/20 p-8 space-y-6">
        <h3 className="text-lg font-bold text-red-400 flex items-center space-x-2">
          <AlertCircle className="w-5 h-5" />
          <span>Danger Zone</span>
        </h3>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h4 className="font-bold">Reset Entire Database</h4>
            <p className="text-sm text-white/40">This will delete all students, teachers, enrollments, and results. This action is irreversible.</p>
          </div>
          <button 
            onClick={() => setShowResetConfirm(true)}
            className="px-8 py-3 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white rounded-xl font-bold transition-all border border-red-500/20"
          >
            Reset Database
          </button>
        </div>
      </div>

      <Modal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        title="CRITICAL: Reset Database"
        onConfirm={handleResetDatabase}
        confirmText="Yes, Delete Everything"
        variant="danger"
      >
        <div className="space-y-4">
          <p className="text-red-400 font-bold">WARNING: This will permanently delete all data in the system.</p>
          <p>Only your admin account will be preserved. All other users, records, and settings will be wiped.</p>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase">Type "iamadmin" to confirm</label>
            <input 
              type="text"
              value={adminUsername}
              onChange={(e) => setAdminUsername(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-red-500"
              placeholder="iamadmin"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
