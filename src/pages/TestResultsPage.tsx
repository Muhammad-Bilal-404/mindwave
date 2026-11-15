import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, GraduationCap, Download, FileText, AlertCircle, ChevronRight, Calendar, BookOpen } from 'lucide-react';
import { Toast } from '../components/Toast';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface TestResult {
  id: string;
  rollNumber: string;
  studentName: string;
  class: string;
  subject: string;
  obtainedMarks: string;
  totalMarks: string;
  testDate: string;
  week: string;
  createdAt: string;
}

export default function TestResultsPage() {
  const [rollNumber, setRollNumber] = useState('');
  const [selectedClass, setSelectedClass] = useState('10th');
  const [selectedSubject, setSelectedSubject] = useState('Full Report (Summary)');
  const [selectedWeek, setSelectedWeek] = useState('All Weeks');
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const subjects = [
    'Full Report (Summary)', 'Physics', 'Chemistry', 'Math', 'English', 'Biology', 
    'Urdu', 'I.S (elective)', 'I.S', 'Education', 'Phsychology', 'Socialogy', 
    'Computer', 'T.Q', 'Ecnomics', 'P.S', 'Civics'
  ];

  const weeks = [
    'All Weeks', ...Array.from({ length: 14 }, (_, i) => `Week ${i + 1}`)
  ];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rollNumber) return;

    setLoading(true);
    setError('');
    setSearched(true);
    try {
      // We'll try a few variations to find the data
      const variations = [
        { field: 'rollNumber', value: rollNumber },
        { field: 'rollNumber', value: isNaN(Number(rollNumber)) ? null : Number(rollNumber) },
        { field: 'rollNo', value: rollNumber },
        { field: 'rollNo', value: isNaN(Number(rollNumber)) ? null : Number(rollNumber) },
        { field: 'roll', value: rollNumber },
        { field: 'roll', value: isNaN(Number(rollNumber)) ? null : Number(rollNumber) },
        { field: 'studentId', value: rollNumber },
        { field: 'id', value: rollNumber }
      ].filter(v => v.value !== null);

      let fetchedResults: TestResult[] = [];
      const collectionsToTry = ['testResults', 'results', 'test_results', 'studentResults', 'marks', 'scores'];
      
      for (const collectionName of collectionsToTry) {
        for (const variation of variations) {
          try {
            let q = query(
              collection(db, collectionName),
              where(variation.field, '==', variation.value)
            );

            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
              fetchedResults = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              })) as TestResult[];
              break; 
            }
          } catch (e) {
            // Ignore errors for collections that don't exist
            continue;
          }
        }
        if (fetchedResults.length > 0) break;
      }

      // If still no results, try searching without the class filter first, then filter in memory
      // This helps if the class naming convention is different (e.g. "9" vs "9th")
      if (fetchedResults.length > 0) {
        // Apply filters in memory for better compatibility with different data structures
        let filtered = fetchedResults;

        // Filter by class (fuzzy match)
        filtered = filtered.filter(r => {
          const rClass = String(r.class || '').toLowerCase();
          const sClass = selectedClass.toLowerCase();
          return rClass.includes(sClass) || sClass.includes(rClass) || rClass.replace('th', '') === sClass.replace('th', '');
        });

        if (selectedSubject !== 'Full Report (Summary)') {
          filtered = filtered.filter(r => r.subject === selectedSubject);
        }

        if (selectedWeek !== 'All Weeks') {
          const weekNum = selectedWeek.replace('Week ', '');
          filtered = filtered.filter(r => String(r.week) === weekNum);
        }

        filtered.sort((a, b) => new Date(b.testDate).getTime() - new Date(a.testDate).getTime());
        setResults(filtered);
      } else {
        setResults([]);
        setToast({ type: 'error', message: 'No results found for this roll number.' });
      }
    } catch (err: any) {
      console.error('Error fetching results:', err);
      setError('Failed to fetch results. Please try again.');
      setToast({ type: 'error', message: 'Failed to fetch results. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(88, 44, 131); // Brand Purple
    doc.text('MIND WAVE ACADEMY', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text('Student Marksheet - Secure Authority Portal', 105, 28, { align: 'center' });
    
    // Student Info
    if (results.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text(`Student Name: ${results[0].studentName}`, 20, 45);
      doc.text(`Roll Number: ${results[0].rollNumber}`, 20, 52);
      doc.text(`Class: ${results[0].class}`, 20, 59);
    }

    // Table
    const tableData = results.map(r => [
      r.testDate,
      r.subject,
      `Week ${r.week}`,
      r.obtainedMarks === 'A' ? 'ABSENT' : `${r.obtainedMarks} / ${r.totalMarks}`
    ]);

    autoTable(doc, {
      startY: 70,
      head: [['Date', 'Subject', 'Week', 'Score']],
      body: tableData,
      headStyles: { fillColor: [88, 44, 131] },
      alternateRowStyles: { fillColor: [245, 245, 250] },
    });

    // Footer
    const finalY = (doc as any).lastAutoTable.finalY || 70;
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, finalY + 20);
    doc.text('Official Mind-Wave Academy Document', 105, finalY + 30, { align: 'center' });

    doc.save(`Marksheet_${rollNumber}.pdf`);
  };

  const calculateOverall = () => {
    let totalObtained = 0;
    let totalPossible = 0;
    results.forEach(r => {
      if (r.obtainedMarks !== 'A') {
        totalObtained += parseFloat(r.obtainedMarks);
        totalPossible += parseFloat(r.totalMarks);
      } else {
        totalPossible += parseFloat(r.totalMarks);
      }
    });
    return totalPossible > 0 ? ((totalObtained / totalPossible) * 100).toFixed(1) : '0.0';
  };

  return (
    <div className="pt-32 pb-20 px-4 min-h-screen bg-mind-deep">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="w-20 h-20 mind-gradient rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <GraduationCap className="text-white w-12 h-12" />
          </div>
        </motion.div>

        <div className="glass-card p-8 mb-12">
          <form onSubmit={handleSearch} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-mind-purple text-xs font-black uppercase tracking-wider ml-1">Roll Number</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-5 h-5" />
                  <input
                    type="text"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    placeholder="Roll No"
                    className="w-full bg-mind-deep/50 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:border-mind-purple outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-mind-purple text-xs font-black uppercase tracking-wider ml-1">Class</label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full bg-mind-deep/50 border border-white/10 rounded-2xl px-4 py-4 text-white focus:border-mind-purple outline-none transition-all appearance-none"
                >
                  <option value="9th">9th Class</option>
                  <option value="10th">10th Class</option>
                  <option value="11th">11th Class</option>
                  <option value="12th">12th Class</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-mind-purple text-xs font-black uppercase tracking-wider ml-1">Subject</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full bg-mind-deep/50 border border-white/10 rounded-2xl px-4 py-4 text-white focus:border-mind-purple outline-none transition-all appearance-none"
                >
                  {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-mind-purple text-xs font-black uppercase tracking-wider ml-1">Week</label>
                <select
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(e.target.value)}
                  className="w-full bg-mind-deep/50 border border-white/10 rounded-2xl px-4 py-4 text-white focus:border-mind-purple outline-none transition-all appearance-none"
                >
                  {weeks.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-mind py-6 rounded-2xl flex items-center justify-center space-x-2 font-black uppercase tracking-widest shadow-lg text-lg"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Search className="w-6 h-6" />
                  <span>View Marksheet</span>
                </>
              )}
            </button>
          </form>
        </div>

        <AnimatePresence mode="wait">
          {searched && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {results.length > 0 ? (
                <div className="space-y-8">
                  {/* Summary Card */}
                  <div className="glass-card p-8 border-t-8 border-mind-purple">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                      <div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">{results[0].studentName}</h2>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-white/40 text-sm font-bold uppercase tracking-widest">Roll: {results[0].rollNumber}</span>
                          <span className="w-1 h-1 bg-white/20 rounded-full" />
                          <span className="text-white/40 text-sm font-bold uppercase tracking-widest">Class: {results[0].class}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-mind-purple text-xs font-black uppercase tracking-widest mb-1">Overall Percentage</p>
                        <p className="text-5xl font-black text-white leading-none">{calculateOverall()}%</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                      <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                        <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">Tests Taken</p>
                        <p className="text-2xl font-black text-white">{results.length}</p>
                      </div>
                      <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                        <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">Last Test</p>
                        <p className="text-2xl font-black text-white">{results[0].testDate}</p>
                      </div>
                      <button 
                        onClick={downloadPDF}
                        className="bg-mind-purple/20 hover:bg-mind-purple/30 text-mind-purple p-6 rounded-3xl border border-mind-purple/30 flex items-center justify-center space-x-3 transition-all group"
                      >
                        <Download className="w-6 h-6 group-hover:bounce" />
                        <span className="font-black uppercase tracking-widest text-sm">Download PDF</span>
                      </button>
                    </div>
                  </div>

                  {/* Results Table */}
                  <div className="glass-card overflow-hidden">
                    <div className="p-6 border-b border-white/10 flex items-center justify-between">
                      <h3 className="text-lg font-black text-white uppercase tracking-tighter flex items-center space-x-2">
                        <FileText className="w-5 h-5 text-mind-purple" />
                        <span>Academic Timeline</span>
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-white/5">
                            <th className="p-6 text-[10px] font-black text-white/40 uppercase tracking-widest">Date</th>
                            <th className="p-6 text-[10px] font-black text-white/40 uppercase tracking-widest">Subject</th>
                            <th className="p-6 text-[10px] font-black text-white/40 uppercase tracking-widest">Week</th>
                            <th className="p-6 text-[10px] font-black text-white/40 uppercase tracking-widest">Score</th>
                            <th className="p-6 text-[10px] font-black text-white/40 uppercase tracking-widest">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.map((result, index) => (
                            <tr key={result.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                              <td className="p-6">
                                <div className="flex items-center space-x-3">
                                  <Calendar className="w-4 h-4 text-mind-purple" />
                                  <span className="text-white font-medium">{result.testDate}</span>
                                </div>
                              </td>
                              <td className="p-6">
                                <div className="flex items-center space-x-3">
                                  <BookOpen className="w-4 h-4 text-mind-purple" />
                                  <span className="text-white font-bold">{result.subject}</span>
                                </div>
                              </td>
                              <td className="p-6">
                                <span className="bg-white/5 px-3 py-1 rounded-full text-[10px] font-black text-white/60 uppercase tracking-widest">
                                  Week {result.week}
                                </span>
                              </td>
                              <td className="p-6">
                                <span className={`text-lg font-black ${result.obtainedMarks === 'A' ? 'text-red-500' : 'text-white'}`}>
                                  {result.obtainedMarks === 'A' ? 'ABSENT' : `${result.obtainedMarks} / ${result.totalMarks}`}
                                </span>
                              </td>
                              <td className="p-6">
                                <div className="flex items-center space-x-2">
                                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest italic">Uploaded</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="glass-card p-20 text-center">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="text-white/20 w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tighter">No Results Found</h3>
                  <p className="text-white/40 mt-2 max-w-sm mx-auto">
                    We couldn't find any test records for roll number <span className="text-mind-purple font-bold">{rollNumber}</span> in the <span className="text-mind-purple font-bold">{selectedClass}</span> class.
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
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
