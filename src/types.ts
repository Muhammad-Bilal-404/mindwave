export type UserRole = 'student' | 'parent' | 'teacher' | 'admin' | 'it-manager';

export interface UserProfile {
  uid: string;
  email: string;
  username?: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  grade?: string;
  fatherName?: string;
  religion?: 'Muslim' | 'Non-Muslim';
  contactInfo?: string;
  qualifications?: string;
  subjectsTaught?: string[];
  enrolledSubjects?: string[];
  isSupplementary?: boolean;
  studentId?: string; // Legacy
  verifiedStudentIds?: string[]; // Verified by IT
  pendingStudentIds?: string[]; // Awaiting IT verification
  isBlocked?: boolean;
  isCoordinator?: boolean; // Appointed by admin
  experience?: string;
  bio?: string;
  facultyInfo?: {
    qualification: string;
    currentRole: string;
    subjects: string;
    subjectGuide: string;
  };
}

export interface Achiever {
  id?: string;
  rollNumber: string;
  studentName: string;
  obtainedMarks: number;
  totalMarks: number;
  grade: string; // Class
  photoURL?: string;
  createdAt: string;
  teacherId: string; // The coordinator who entered it
}

export interface Enrollment {
  id?: string;
  studentName: string;
  fatherName: string;
  lastDegree: string;
  marks: number;
  age: number;
  religion: 'Muslim' | 'Non-Muslim';
  email: string;
  contactInfo: string;
  isSupplementary: boolean;
  selectedSubjects: string[];
  status: 'pending' | 'verified' | 'rejected';
  createdAt: string;
}

export interface Lesson {
  id?: string;
  subject: string;
  grade: string;
  date: string;
  summary: string;
  youtubeLink?: string;
  resources?: { name: string; url: string }[];
  teacherId: string;
}

export interface Assignment {
  id?: string;
  title: string;
  type: 'quiz' | 'assignment';
  subject: string;
  grade: string;
  dueDate: string;
  questions?: any[];
  teacherId: string;
}

export interface Submission {
  id?: string;
  assignmentId: string;
  studentId: string;
  status: 'submitted' | 'graded';
  grade?: number;
  feedback?: string;
  answers?: any;
  submittedAt: string;
}

export interface Attendance {
  id?: string;
  studentId: string;
  subject: string;
  date: string;
  status: 'present' | 'absent' | 'late';
}

export interface Grade {
  id?: string;
  studentId: string;
  subject: string;
  score: number;
  totalMarks: number;
  type: string;
  testNumber?: string;
  date: string;
}

export interface Message {
  id?: string;
  senderId: string;
  receiverId: string;
  text: string;
  createdAt: string;
}

export interface DateSheetEntry {
  id?: string;
  grade: string; // e.g., '11th', '12th'
  date: string;
  day: string;
  subjects: string[];
  testNumber: string;
  syllabus: string;
  isHoliday: boolean;
  type?: 'test-session' | 'other';
}

export interface Remark {
  id?: string;
  studentId: string;
  teacherId: string;
  subject: string;
  status: 'Good' | 'Average' | 'Needs Improvement';
  date: string;
}
