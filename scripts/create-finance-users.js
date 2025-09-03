const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Finance users to create
const financeUsers = [
  {
    email: 'finance1@example.com',
    full_name: 'Sarah Johnson',
    role: 'viewer', // Maps to FINANCE in new system
    department: 'Finance',
    position: 'Financial Analyst',
    phone: '+1-555-0123',
    company_id: 'parent-company',
    is_active: true
  },
  {
    email: 'finance2@example.com',
    full_name: 'Michael Chen',
    role: 'viewer',
    department: 'Finance',
    position: 'Senior Financial Analyst',
    phone: '+1-555-0124',
    company_id: 'parent-company',
    is_active: true
  },
  {
    email: 'finance3@example.com',
    full_name: 'Emily Rodriguez',
    role: 'viewer',
    department: 'Finance',
    position: 'Financial Controller',
    phone: '+1-555-0125',
    company_id: 'parent-company',
    is_active: true
  },
  {
    email: 'finance4@example.com',
    full_name: 'David Thompson',
    role: 'viewer',
    department: 'Finance',
    position: 'Financial Manager',
    phone: '+1-555-0126',
    company_id: 'parent-company',
    is_active: true
  },
  {
    email: 'finance5@example.com',
    full_name: 'Lisa Wang',
    role: 'viewer',
    department: 'Finance',
    position: 'Financial Director',
    phone: '+1-555-0127',
    company_id: 'parent-company',
    is_active: true
  }
];

async function createFinanceUsers() {
  try {
    console.log('Creating finance users...');
    
    for (const userData of financeUsers) {
      const userDoc = {
        ...userData,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'users'), userDoc);
      console.log(`Created finance user: ${userData.full_name} (${docRef.id})`);
    }
    
    console.log('✅ All finance users created successfully!');
  } catch (error) {
    console.error('❌ Error creating finance users:', error);
  }
}

// Run the script
createFinanceUsers();
