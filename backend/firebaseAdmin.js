// firebaseAdmin.js
import admin from 'firebase-admin';
import fs from 'fs';

const serviceAccount = JSON.parse(
  fs.readFileSync('/Users/delphinecamon/Desktop/GIMPA VLE/backend/firebaseKey.json', 'utf8')
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'gimpa-vle-app.firebasestorage.app',



  });
}

const bucket = admin.storage().bucket();

export { admin, bucket };
