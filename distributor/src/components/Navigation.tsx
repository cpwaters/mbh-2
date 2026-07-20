import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, Truck, LogOut, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface NavigationProps {
  onLogout: () => void;
}

export default function Navigation({ onLogout }: NavigationProps) {
  const { currentUser } = useAuth();
  const [profileImage, setProfileImage] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!currentUser) return;

      try {
        const profileDoc = await getDoc(doc(db, 'userProfiles', currentUser.uid));
        if (profileDoc.exists()) {
          const data = profileDoc.data();
          setProfileImage(data.image || currentUser.photoURL || '');
          setDisplayName(`${data.first_name} ${data.last_name}`.trim() || currentUser.displayName || 'User');
        } else {
          setProfileImage(currentUser.photoURL || '');
          setDisplayName(currentUser.displayName || 'User');
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    };

    fetchUserInfo();
  }, [currentUser]);

  const navItems = [
    { path: '/', label: 'All Loads', icon: LayoutDashboard },
    { path: '/create', label: 'Create Load', icon: PlusCircle },
  ];

  return (
    <nav className="bg-white shadow-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Truck className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">DistributAHaul</h1>
          </div>

          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`
                  }
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}

            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors border-l border-gray-200 ml-2 ${
                  isActive
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover border-2 border-gray-300"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className={`bg-gray-200 p-1.5 rounded-full ${profileImage ? 'hidden' : 'flex'}`}>
                <User className="w-5 h-5 text-gray-600" />
              </div>
              <span className="font-medium hidden md:inline">{displayName}</span>
            </NavLink>

            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
