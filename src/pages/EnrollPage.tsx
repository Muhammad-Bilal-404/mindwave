import React, { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, onSnapshot, query } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Send, User, Mail, Phone, Book, GraduationCap, MapPin, Calendar, AlertCircle, Lock } from 'lucide-react';

export default function EnrollPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    studentName: '',
    fatherName: '',
    lastDegree: '',
    marks: '',
    currentClass: '',
    age: '',
    religion: 'Muslim',
    email: '',
    contactInfo: '',
    dateOfBirth: '',
    password: '',
    isSupplementary: false,
    selectedSubjects: [] as string[],
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dbSubjects, setDbSubjects] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'subjects'), (snapshot) => {
      setDbSubjects(snapshot.docs.map(doc => doc.data().name));
    });
    return unsubscribe;
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubjectToggle = (subject: string) => {
    setFormData(prev => {
      const selected = prev.selectedSubjects.includes(subject)
        ? prev.selectedSubjects.filter(s => s !== subject)
        : [...prev.selectedSubjects, subject];
      return { ...prev, selectedSubjects: selected };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await addDoc(collection(db, 'enrollments'), {
        ...formData,
        marks: Number(formData.marks),
        age: Number(formData.age),
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      // Notify Admin
      await addDoc(collection(db, 'notifications'), {
        recipientId: 'admin',
        title: 'New Enrollment Application',
        content: `A new student, ${formData.studentName}, has applied for enrollment in ${formData.currentClass || formData.lastDegree}.`,
        type: 'enrollment',
        read: false,
        createdAt: serverTimestamp()
      });

      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting enrollment:', error);
      setError('Failed to submit enrollment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="pt-32 pb-20 max-w-2xl mx-auto px-4 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-card p-12"
        >
          <div className="w-20 h-20 mind-gradient rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle className="text-white w-12 h-12" />
          </div>
          <p className="text-white/70 mb-8">
            Thank you for applying to Mind Wave Academy. Our admin team will verify your details and send your login credentials to <strong>{formData.email}</strong> shortly.
          </p>
          <button 
            onClick={() => navigate('/')}
            className="btn-mind"
          >
            Return Home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-white/60">Fill out the form below to start your educational journey with us.</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-8 md:p-12 space-y-12">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center space-x-3 text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Personal Information */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2 pb-2 border-b border-white/10">
              <User className="w-5 h-5 text-mind-purple" />
              <h3 className="text-xl font-bold">Personal Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Student Name */}
              <div className="space-y-2">
                <label className="text-mind-purple font-medium flex items-center space-x-2">
                  <User className="w-4 h-4" /> <span>Student Name</span>
                </label>
                <input
                  required
                  name="studentName"
                  value={formData.studentName}
                  onChange={handleChange}
                  className="w-full bg-mind-deep/50 border border-white/10 rounded-xl px-4 py-3 focus:border-mind-purple outline-none transition-all"
                  placeholder="Enter full name"
                />
              </div>

              {/* Father Name */}
              <div className="space-y-2">
                <label className="text-mind-purple font-medium flex items-center space-x-2">
                  <User className="w-4 h-4" /> <span>Father Name</span>
                </label>
                <input
                  required
                  name="fatherName"
                  value={formData.fatherName}
                  onChange={handleChange}
                  className="w-full bg-mind-deep/50 border border-white/10 rounded-xl px-4 py-3 focus:border-mind-purple outline-none transition-all"
                  placeholder="Enter father's name"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-mind-purple font-medium flex items-center space-x-2">
                  <Mail className="w-4 h-4" /> <span>Email Address</span>
                </label>
                <input
                  required
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-mind-deep/50 border border-white/10 rounded-xl px-4 py-3 focus:border-mind-purple outline-none transition-all"
                  placeholder="example@email.com"
                />
              </div>

              {/* Contact Info */}
              <div className="space-y-2">
                <label className="text-mind-purple font-medium flex items-center space-x-2">
                  <Phone className="w-4 h-4" /> <span>Contact Number</span>
                </label>
                <input
                  required
                  name="contactInfo"
                  value={formData.contactInfo}
                  onChange={handleChange}
                  className="w-full bg-mind-deep/50 border border-white/10 rounded-xl px-4 py-3 focus:border-mind-purple outline-none transition-all"
                  placeholder="+1 (234) 567-890"
                />
              </div>

              {/* Date of Birth */}
              <div className="space-y-2">
                <label className="text-mind-purple font-medium flex items-center space-x-2">
                  <Calendar className="w-4 h-4" /> <span>Date of Birth</span>
                </label>
                <input
                  required
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="w-full bg-mind-deep/50 border border-white/10 rounded-xl px-4 py-3 focus:border-mind-purple outline-none transition-all"
                />
              </div>

              {/* Age */}
              <div className="space-y-2">
                <label className="text-mind-purple font-medium flex items-center space-x-2">
                  <Calendar className="w-4 h-4" /> <span>Age</span>
                </label>
                <input
                  required
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  className="w-full bg-mind-deep/50 border border-white/10 rounded-xl px-4 py-3 focus:border-mind-purple outline-none transition-all"
                  placeholder="e.g. 15"
                />
              </div>

              {/* Religion */}
              <div className="space-y-2">
                <label className="text-mind-purple font-medium flex items-center space-x-2">
                  <MapPin className="w-4 h-4" /> <span>Religion</span>
                </label>
                <select
                  name="religion"
                  value={formData.religion}
                  onChange={handleChange}
                  className="w-full bg-mind-deep/50 border border-white/10 rounded-xl px-4 py-3 focus:border-mind-purple outline-none transition-all appearance-none"
                >
                  <option value="Muslim">Muslim</option>
                  <option value="Non-Muslim">Non-Muslim</option>
                </select>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-mind-purple font-medium flex items-center space-x-2">
                  <Lock className="w-4 h-4" /> <span>Set Account Password</span>
                </label>
                <input
                  required
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-mind-deep/50 border border-white/10 rounded-xl px-4 py-3 focus:border-mind-purple outline-none transition-all"
                  placeholder="Minimum 6 characters"
                  minLength={6}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Academic History */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2 pb-2 border-b border-white/10">
              <GraduationCap className="w-5 h-5 text-mind-purple" />
              <h3 className="text-xl font-bold">Academic History</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Last Degree */}
              <div className="space-y-2">
                <label className="text-mind-purple font-medium flex items-center space-x-2">
                  <GraduationCap className="w-4 h-4" /> <span>Last Degree / Grade Completed</span>
                </label>
                <input
                  required
                  name="lastDegree"
                  value={formData.lastDegree}
                  onChange={handleChange}
                  className="w-full bg-mind-deep/50 border border-white/10 rounded-xl px-4 py-3 focus:border-mind-purple outline-none transition-all"
                  placeholder="e.g. 9th Grade, Matric"
                />
              </div>

              {/* Marks */}
              <div className="space-y-2">
                <label className="text-mind-purple font-medium flex items-center space-x-2">
                  <Book className="w-4 h-4" /> <span>Marks Obtained in Last Degree (%)</span>
                </label>
                <input
                  required
                  type="number"
                  name="marks"
                  value={formData.marks}
                  onChange={handleChange}
                  className="w-full bg-mind-deep/50 border border-white/10 rounded-xl px-4 py-3 focus:border-mind-purple outline-none transition-all"
                  placeholder="e.g. 85"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Current Enrollment */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2 pb-2 border-b border-white/10">
              <Book className="w-5 h-5 text-mind-purple" />
              <h3 className="text-xl font-bold">Current Enrollment</h3>
            </div>
            <div className="space-y-8">
              {/* Current Class */}
              <div className="space-y-2">
                <label className="text-mind-purple font-medium flex items-center space-x-2">
                  <GraduationCap className="w-4 h-4" /> <span>Current Class / Degree You Want to Join</span>
                </label>
                <select
                  required
                  name="currentClass"
                  value={formData.currentClass}
                  onChange={handleChange}
                  className="w-full bg-mind-deep/50 border border-white/10 rounded-xl px-4 py-3 focus:border-mind-purple outline-none transition-all appearance-none"
                >
                  <option value="">Select Class</option>
                  <option value="9th">9th Class</option>
                  <option value="10th">10th Class</option>
                  <option value="11th">11th Class (1st Year)</option>
                  <option value="12th">12th Class (2nd Year)</option>
                </select>
              </div>

              {/* Supplementary Checkbox */}
              <div className="flex items-center space-x-3 p-4 bg-white/5 rounded-xl border border-white/10">
                <input
                  type="checkbox"
                  id="isSupplementary"
                  name="isSupplementary"
                  checked={formData.isSupplementary}
                  onChange={handleChange}
                  className="w-5 h-5 accent-mind-purple"
                />
                <label htmlFor="isSupplementary" className="text-white font-medium cursor-pointer">
                  Are you a Supplementary Student? (Extra support for specific subjects)
                </label>
              </div>

              {/* Subject Selection */}
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-4"
              >
                <label className="text-mind-purple font-medium block">Select Subjects you are studying:</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {dbSubjects.map(subject => (
                    <button
                      key={subject}
                      type="button"
                      onClick={() => handleSubjectToggle(subject)}
                      className={cn(
                        "px-4 py-2 rounded-lg border transition-all text-sm font-medium",
                        formData.selectedSubjects.includes(subject)
                          ? "bg-mind-purple text-white border-mind-purple"
                          : "bg-transparent border-white/10 text-white/60 hover:border-mind-purple/50"
                      )}
                    >
                      {subject}
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>

          <div className="pt-6">
            <button
              disabled={loading}
              type="submit"
              className="w-full btn-mind flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Submit Application</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
