import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import config from '../firebase-applet-config.json' assert { type: 'json' };

admin.initializeApp({
  projectId: config.projectId,
});

const db = getFirestore(admin.app(), config.firestoreDatabaseId);

async function resetDatabase() {
  console.log('Starting database reset...');
  const collections = [
    'users', 'enrollments', 'testResults', 'lessons', 
    'assignments', 'attendance', 'remarks', 'notifications', 
    'parentRequests', 'dateSheets', 'subjects', 'websiteContent'
  ];

  for (const collName of collections) {
    console.log(`Clearing collection: ${collName}`);
    const snapshot = await db.collection(collName).get();
    const batch = db.batch();
    
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      // Keep the admin user. We identify admin by role or specific email.
      // Based on previous context, the admin email is bila3727673@gmail.com
      if (collName === 'users' && (data.role === 'admin' || data.email === 'bila3727673@gmail.com' || data.username === 'iamadmin')) {
        console.log(`Skipping admin user: ${data.email || data.username}`);
        return;
      }
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Finished clearing ${collName}`);
  }
  console.log('Database reset complete.');
}

resetDatabase().catch(console.error);
