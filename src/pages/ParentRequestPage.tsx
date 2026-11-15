import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Send, User, Mail, Phone, Lock, Calendar, AlertCircle, Shield } from 'lucide-react';

export default function ParentRequestPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    parentName: '',
    studentRollNumber: '',
    studentName: '',
    email: '',
    contactInfo: '',
    dateOfBirth: '', // Parent's DOB for verification later
    password: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await addDoc(collection(db, 'parentRequests'), {
        ...formData,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      // Notify Admin
      await addDoc(collection(db, 'notifications'), {
        recipientId: 'admin',
        title: 'New Parent Access Request',
        content: `Parent ${formData.parentName} has requested access for student ${formData.studentName} (Roll No: ${formData.studentRollNumber}).`,
        type: 'parent_request',
        read: false,
        createdAt: serverTimestamp()
      });

      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting parent request:', error);
      setError('Failed to submit request. Please try again.');
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
          <h2 className="text-2xl font-bold mb-4">Request Submitted!</h2>
          <p className="text-white/70 mb-8">
            Your request for parent access has been sent to our IT team. We will verify your relationship with the student and send your login credentials to <strong>{formData.email}</strong> once approved.
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
          <h1 className="text-4xl font-bold mb-4">Parent Access Request</h1>
          <p className="text-white/60">Provide your information to request access to your child's academic progress.</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-8 md:p-12 space-y-8">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center space-x-3 text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Parent Name */}
            <div className="space-y-2">
              <label className="text-mind-purple font-medium flex items-center space-x-2">
                <User className="w-4 h-4" /> <span>Parent Name</span>
              </label>
              <input
                required
                name="parentName"
                value={formData.parentName}
                onChange={handleChange}
                className="w-full bg-mind-deep/50 border border-white/10 rounded-xl px-4 py-3 focus:border-mind-purple outline-none transition-all"
                placeholder="Enter your full name"
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

            {/* Student Roll Number */}
            <div className="space-y-2">
              <label className="text-mind-purple font-medium flex items-center space-x-2">
                <Shield className="w-4 h-4" /> <span>Student Roll Number</span>
              </label>
              <input
                required
                name="studentRollNumber"
                value={formData.studentRollNumber}
                onChange={handleChange}
                className="w-full bg-mind-deep/50 border border-white/10 rounded-xl px-4 py-3 focus:border-mind-purple outline-none transition-all"
                placeholder="e.g. 2024-001"
              />
            </div>

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
                placeholder="Enter child's full name"
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
                <Calendar className="w-4 h-4" /> <span>Your Date of Birth</span>
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

            {/* Password */}
            <div className="space-y-2">
              <label className="text-mind-purple font-medium flex items-center space-x-2">
                <Lock className="w-4 h-4" /> <span>Set Password</span>
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
                  <span>Submit Request</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
