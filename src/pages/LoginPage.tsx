import React, { useState } from 'react';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, sendPasswordResetEmail, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, query, collection, where, getDocs, deleteDoc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, Mail, Lock, GraduationCap, Shield, User as UserIcon, AlertCircle, CheckCircle } from 'lucide-react';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [dob, setDob] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      // Handle 'iamadmin' username mapping
      let loginEmail = identifier;
      if (identifier.toLowerCase() === 'iamadmin') {
        loginEmail = 'bila3727673@gmail.com';
      } else if (!identifier.includes('@')) {
        loginEmail = `${identifier.toLowerCase()}@academy.edu`;
      }
      
      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, loginEmail, password);
      } catch (authErr: any) {
        // Bootstrap: If it's the first time and admin account doesn't exist in Auth, 
        // or if it's the specific admin credentials provided by user
        if (loginEmail === 'bila3727673@gmail.com' && password === 'admin16aug2006') {
          try {
            userCredential = await createUserWithEmailAndPassword(auth, loginEmail, password);
          } catch (createErr: any) {
            // If already exists in Auth but password was wrong, this will fail, which is correct
            throw authErr;
          }
        } else {
          throw authErr;
        }
      }

      const user = userCredential.user;
      console.log('Login successful:', user.email);
      
      // Check profile
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const profile = docSnap.data();
        if (profile.isBlocked) {
          setError('Your account has been disabled. Please contact admin.');
          await auth.signOut();
          return;
        }

        // Email verification check for Staff (Admin/IT)
        if ((profile.role === 'admin' || profile.role === 'it-manager') && !user.emailVerified) {
          // Allow primary admin to bypass if it's the first time, or just send verification
          if (user.email !== 'bila3727673@gmail.com') {
            const { sendEmailVerification } = await import('firebase/auth');
            await sendEmailVerification(user);
            setError('Please verify your Gmail address. A verification link has been sent to your inbox.');
            await auth.signOut();
            return;
          }
        }

        navigate(`/${profile.role}-dashboard`);
      } else {
        // If it's the admin email but no profile exists yet (e.g. after database clear)
        if (user.email === 'bila3727673@gmail.com') {
          await setDoc(docRef, {
            uid: user.uid,
            email: user.email,
            displayName: 'System Admin',
            username: 'iamadmin',
            role: 'admin',
            createdAt: new Date().toISOString()
          });
          navigate('/admin-dashboard');
        } else {
          setError('User profile not found. Please contact admin.');
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.code === 'auth/network-request-failed') {
        setError('Network error. This can happen if the connection is unstable or a browser extension is blocking the request. Please try again or refresh the page.');
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Invalid username or password.');
      } else {
        setError(err.message || 'Failed to login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      
      const result = await signInWithPopup(auth, provider);
      await handleAuthResult(result.user);
    } catch (err: any) {
      console.error('Google login error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('The login popup was closed before completion. This often happens if the domain is not authorized in Firebase or if you manually closed it. Please ensure popups are allowed and the current domain is added to Firebase Authorized Domains.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError(`This domain (${window.location.hostname}) is not authorized in the Firebase Console. Please add it to Authentication > Settings > Authorized domains.`);
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error or popup blocked. Please check your connection and allow popups.');
      } else {
        setError(err.message || 'Google login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRedirect = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      // Note: This will reload the page. The result is handled in a useEffect with getRedirectResult if needed,
      // but onAuthStateChanged in App.tsx usually handles the session after redirect.
      const { signInWithRedirect } = await import('firebase/auth');
      await signInWithRedirect(auth, provider);
    } catch (err: any) {
      console.error('Redirect login error:', err);
      setError(err.message || 'Redirect login failed');
      setLoading(false);
    }
  };

  const handleAuthResult = async (user: any) => {
    // 1. Try direct UID lookup
    let docRef = doc(db, 'users', user.uid);
    let docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      // 2. Try email lookup (for pre-registered teachers/staff added by admin)
      const q = query(collection(db, 'users'), where('email', '==', user.email));
      const querySnap = await getDocs(q);
      
      if (!querySnap.empty) {
        const existingDoc = querySnap.docs[0];
        const existingData = existingDoc.data();
        
        // Link the UID to this profile by creating a new document at the UID path
        await setDoc(docRef, {
          ...existingData,
          uid: user.uid,
          photoURL: user.photoURL || existingData.photoURL,
          displayName: user.displayName || existingData.displayName,
          updatedAt: new Date().toISOString()
        });
        
        // Delete the old document with the random ID
        if (existingDoc.id !== user.uid) {
          await deleteDoc(existingDoc.ref);
        }
        
        docSnap = await getDoc(docRef);
      }
    }

    if (docSnap.exists()) {
      const profile = docSnap.data();
      if (profile.isBlocked) {
        setError('Your account has been disabled. Please contact admin.');
        await auth.signOut();
        return;
      }

      // Email verification check for Staff (Admin/IT)
      if ((profile.role === 'admin' || profile.role === 'it-manager') && !user.emailVerified) {
        if (user.email !== 'bila3727673@gmail.com') {
          setError('Your Gmail address must be verified to access the staff portal.');
          await auth.signOut();
          return;
        }
      }

      navigate(`/${profile.role}-dashboard`);
    } else {
      if (user.email === 'bila3727673@gmail.com') {
        await setDoc(docRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          role: 'admin',
          createdAt: new Date().toISOString()
        });
        navigate('/admin-dashboard');
      } else {
        setError('Your account is not registered in our system. Please enroll first.');
        await auth.signOut();
      }
    }
  };

  const handleForgotPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!identifier || !dob) {
      setError('Please enter your email/username and date of birth.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const email = identifier.includes('@') ? identifier : `${identifier.toLowerCase()}@academy.edu`;
      
      // Verify DOB in Firestore
      const q = query(collection(db, 'users'), where('email', '==', email), where('dateOfBirth', '==', dob));
      const querySnap = await getDocs(q);
      
      if (querySnap.empty) {
        setError('No account found with that information. Please check your username and date of birth.');
        setLoading(false);
        return;
      }

      await sendPasswordResetEmail(auth, email);
      setSuccess('Password reset email sent! Please check your inbox.');
      setShowForgotModal(false);
    } catch (err: any) {
      console.error('Forgot password error:', err);
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-32 pb-20 px-4 flex items-center justify-center min-h-screen">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full glass-card p-8 md:p-10"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 mind-gradient rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <GraduationCap className="text-white w-10 h-10" />
          </div>
          <p className="text-white/60 mt-2">Login to access your dashboard</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center space-x-3 text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center space-x-3 text-emerald-400 text-sm">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-mind-purple font-medium flex items-center space-x-2">
              <UserIcon className="w-4 h-4" /> <span>Username or Email</span>
            </label>
            <input
              required
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full bg-mind-deep/50 border border-white/10 rounded-xl px-4 py-3 focus:border-mind-purple outline-none transition-all"
              placeholder="Enter username or email"
            />
          </div>

          <div className="space-y-2">
            <label className="text-mind-purple font-medium flex items-center space-x-2">
              <Lock className="w-4 h-4" /> <span>Password</span>
            </label>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-mind-deep/50 border border-white/10 rounded-xl px-4 py-3 focus:border-mind-purple outline-none transition-all"
              placeholder="Enter your password"
            />
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full btn-mind flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>Login</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-mind-accent text-white/40">Or continue with</span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="mt-6 w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center space-x-3 transition-all"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
          <span>Google Account</span>
        </button>

        {error && error.includes('popup') && (
          <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-3">
            <div className="flex items-center space-x-2 text-amber-500 text-xs font-bold uppercase tracking-wider">
              <AlertCircle className="w-4 h-4" />
              <span>Troubleshooting</span>
            </div>
            <p className="text-[10px] text-white/60 leading-relaxed">
              If popups are blocked or failing, try the redirect method instead. 
              Note: You must authorize <strong>{window.location.hostname}</strong> in your Firebase Console.
            </p>
            <button 
              onClick={handleGoogleRedirect}
              className="w-full py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-500 text-[10px] font-bold rounded-lg transition-all"
            >
              Try Login with Redirect
            </button>
          </div>
        )}

        <div className="mt-10 text-center space-y-4">
          <p className="text-white/40 text-sm">
            Don't have an account? <Link to="/enroll" className="text-mind-purple hover:underline">Enroll Now</Link>
          </p>
          <p className="text-white/40 text-sm">
            Parent? <Link to="/parent-request" className="text-mind-purple hover:underline">Request Access</Link>
          </p>
          <div className="pt-6 border-t border-white/5">
            <p className="text-xs text-white/40 mb-3 uppercase tracking-widest font-bold">Staff Portal</p>
            <div className="flex justify-center space-x-4">
              <button 
                onClick={handleGoogleLogin}
                className="text-xs bg-white/5 hover:bg-mind-purple/20 border border-white/10 px-4 py-2 rounded-lg transition-all flex items-center space-x-2"
              >
                <Shield className="w-3 h-3" />
                <span>Admin Login</span>
              </button>
            </div>
          </div>
          <div className="flex justify-center space-x-6 text-white/40 text-xs pt-4">
            <button onClick={() => setShowForgotModal(true)} className="hover:text-mind-purple">Forgot Password?</button>
            <Link to="/contact" className="hover:text-mind-purple">Need Help?</Link>
          </div>
        </div>
      </motion.div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForgotModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md glass-card p-8 space-y-6"
            >
              <div className="text-center">
                <h3 className="text-2xl font-bold">Reset Password</h3>
                <p className="text-white/60 text-sm mt-2">Verify your identity to receive a reset link</p>
              </div>

              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-mind-purple text-xs font-bold uppercase">Username or Email</label>
                  <input
                    required
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full bg-mind-deep/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-mind-purple"
                    placeholder="Enter your identifier"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-mind-purple text-xs font-bold uppercase">Date of Birth</label>
                  <input
                    required
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full bg-mind-deep/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-mind-purple"
                  />
                </div>
                <button
                  disabled={loading}
                  type="submit"
                  className="w-full btn-mind py-3"
                >
                  {loading ? 'Verifying...' : 'Send Reset Link'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="w-full text-white/40 text-xs hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
