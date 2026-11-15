import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Achiever } from '../types';
import { motion } from 'framer-motion';
import { Trophy, Star, Award, User, BookOpen, Hash } from 'lucide-react';

export default function AchieversPage() {
  const [achievers, setAchievers] = useState<Achiever[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'achievers'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAchievers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Achiever)));
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <div className="pt-32 pb-20 px-4 min-h-screen bg-mind-deep">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 mind-gradient rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl"
          >
            <Trophy className="text-white w-10 h-10" />
          </motion.div>
          <p className="text-white/60 max-w-2xl mx-auto">
            Celebrating the exceptional achievements of our students who have set new benchmarks of excellence.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-mind-purple border-t-transparent rounded-full animate-spin" />
          </div>
        ) : achievers.length === 0 ? (
          <div className="text-center py-20 glass-card">
            <Star className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/40">No achievers listed yet. Stay tuned!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {achievers.map((achiever, index) => (
              <motion.div
                key={achiever.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-card group overflow-hidden"
              >
                <div className="h-64 relative overflow-hidden">
                  <img
                    src={achiever.photoURL || `https://picsum.photos/seed/${achiever.id}/400/600`}
                    alt={achiever.studentName}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-mind-deep via-transparent to-transparent" />
                  <div className="absolute top-4 right-4">
                    <div className="bg-mind-purple/90 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1 shadow-lg">
                      <Award className="w-3 h-3" />
                      <span>Top Achiever</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 relative">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-bold text-white group-hover:text-mind-purple transition-colors">
                      {achiever.studentName}
                    </h3>
                    <div className="flex items-center space-x-1 text-mind-purple">
                      <Hash className="w-4 h-4" />
                      <span className="font-mono font-bold">{achiever.rollNumber}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                      <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Class</p>
                      <div className="flex items-center space-x-2">
                        <BookOpen className="w-4 h-4 text-mind-purple" />
                        <span className="font-bold text-sm">{achiever.grade}</span>
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                      <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Marks</p>
                      <div className="flex items-center space-x-2">
                        <Star className="w-4 h-4 text-amber-400" />
                        <span className="font-bold text-sm">
                          {achiever.obtainedMarks} <span className="text-white/40 font-normal">/ {achiever.totalMarks}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs text-white/40">
                      <User className="w-3 h-3" />
                      <span>Verified by Academy</span>
                    </div>
                    <div className="text-[10px] text-mind-purple font-bold uppercase tracking-tighter">
                      {((achiever.obtainedMarks / achiever.totalMarks) * 100).toFixed(1)}% Score
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
