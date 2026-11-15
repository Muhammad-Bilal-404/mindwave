import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import config from '../firebase-applet-config.json' assert { type: 'json' };

admin.initializeApp({
  projectId: config.projectId,
});

const db = getFirestore(admin.app(), config.firestoreDatabaseId);

const syllabusData = [
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
  { date: '2026-02-15', Sunday: true, day: 'Sunday', subjects: [], testNumber: '', syllabus: 'Weekly Totals', isHoliday: true },
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

async function uploadSyllabus() {
  console.log('Starting syllabus upload...');
  const grade = '12th';
  const collectionRef = db.collection('dateSheets');

  // Optional: Clear existing entries for this grade to avoid duplicates
  const existing = await collectionRef.where('grade', '==', grade).get();
  const batch = db.batch();
  existing.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
  console.log(`Cleared existing entries for ${grade}`);

  for (const entry of syllabusData) {
    await collectionRef.add({
      ...entry,
      grade
    });
  }

  console.log('Syllabus upload complete.');
}

uploadSyllabus().catch(console.error);
