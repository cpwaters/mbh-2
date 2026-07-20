import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth, googleProvider, db } from '../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function signup(email: string, password: string, displayName: string) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    // Update the user's display name
    if (userCredential.user) {
      await updateProfile(userCredential.user, {
        displayName: displayName
      });

      // Create user profile in Firestore
      const nameParts = displayName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      await setDoc(doc(db, 'userProfiles', userCredential.user.uid), {
        user_id: userCredential.user.uid,
        username: displayName.toLowerCase().replace(/\s+/g, ''),
        email: email,
        first_name: firstName,
        last_name: lastName,
        date_of_birth: '',
        company_name: '',
        company_registration_number: '',
        company_address: {
          street: '',
          town: '',
          city: '',
          postcode: ''
        },
        company_contact: {
          name: '',
          email: '',
          phone: ''
        },
        VAT_number: '',
        driving_license_number: '',
        quantity_of_vehicles: 0,
        rating: 0,
        payment_type: {
          invoiced: false,
          instant_payment: false
        },
        earnings: {
          today: 0,
          week: 0,
          month: 0
        },
        performance: {
          total_trips: 0,
          total_miles: 0,
          on_time_delivery_percentage: 0
        },
        recent_trips: [],
        image: '',
        createdAt: new Date().toISOString()
      });
    }
  }

  async function login(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function logout() {
    await signOut(auth);
  }

  async function loginWithGoogle() {
    const result = await signInWithPopup(auth, googleProvider);

    // Check if user profile exists, if not create one
    if (result.user) {
      const profileRef = doc(db, 'userProfiles', result.user.uid);
      const profileSnap = await getDoc(profileRef);

      if (!profileSnap.exists()) {
        // Create new profile for Google sign-in users
        const nameParts = (result.user.displayName || '').split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        await setDoc(profileRef, {
          user_id: result.user.uid,
          username: (result.user.email || '').split('@')[0],
          email: result.user.email || '',
          first_name: firstName,
          last_name: lastName,
          date_of_birth: '',
          company_name: '',
          company_registration_number: '',
          company_address: {
            street: '',
            town: '',
            city: '',
            postcode: ''
          },
          company_contact: {
            name: '',
            email: '',
            phone: ''
          },
          VAT_number: '',
          driving_license_number: '',
          quantity_of_vehicles: 0,
          rating: 0,
          payment_type: {
            invoiced: false,
            instant_payment: false
          },
          earnings: {
            today: 0,
            week: 0,
            month: 0
          },
          performance: {
            total_trips: 0,
            total_miles: 0,
            on_time_delivery_percentage: 0
          },
          recent_trips: [],
          image: result.user.photoURL || '',
          createdAt: new Date().toISOString()
        });
      }
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loading,
    signup,
    login,
    logout,
    loginWithGoogle
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
