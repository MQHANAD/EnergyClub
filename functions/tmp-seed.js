(async () => {
  const fs = require('fs');
  const admin = require('firebase-admin');

  // Read service account details from local functions/.env
  const env = fs.readFileSync('.env', 'utf8');
  function getVar(key) {
    const m = env.match(new RegExp('^' + key + '=(.*)$', 'm'));
    if (!m) return null;
    let v = m[1].trim();
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    v = v.replace(/\\n/g, '\n');
    return v;
  }

  const privateKey = getVar('GOOGLE_PRIVATE_KEY');
  const clientEmail = getVar('GOOGLE_CLIENT_EMAIL');
  const projectId = 'university-club-platform';

  if (!privateKey || !clientEmail) {
    throw new Error('Missing GOOGLE_PRIVATE_KEY or GOOGLE_CLIENT_EMAIL in functions/.env');
  }

  admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  });

  const db = admin.firestore();
  const now = admin.firestore.Timestamp.now();

  // 1) Create a test event
  const eventRef = await db.collection('events').add({
    title: 'Test Event ' + Date.now(),
    description: 'Automated test event for email triggers',
    date: now,
    location: 'Online',
    maxAttendees: 100,
    currentAttendees: 0,
    organizerId: 'admin',
    organizerName: 'Admin',
    status: 'active',
    createdAt: now,
    updatedAt: now,
    tags: []
  });

  const eventId = eventRef.id;

  // 2) Create a registration (triggers sendOnRegisterEmail)
  const regRef = await db.collection('registrations').add({
    eventId,
    userId: 'testUser',
    userName: 'Test User',
    userEmail: 'mohanad.aldrewesh+test@gmail.com',
    registrationTime: now,
    status: 'waitlist'
  });

  console.log('Created event', eventId, 'and registration', regRef.id);

  // Wait a bit for onCreate email to process
  await new Promise(r => setTimeout(r, 4000));

  // 3) Approve registration (triggers sendOnApproveEmail)
  await regRef.update({ status: 'confirmed' });
  console.log('Updated registration to confirmed');

  // Wait then reject to test rejection email too
  await new Promise(r => setTimeout(r, 4000));
  await regRef.update({ status: 'cancelled' });
  console.log('Updated registration to cancelled');

  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
