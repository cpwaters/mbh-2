import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Map, Truck, User, Clock, LogOut, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface NavigationProps {
  onLogout: () => void;
}

export default function Navigation({ onLogout }: NavigationProps) {
  const { currentUser } = useAuth();
  const [profileImage, setProfileImage] = useState<string>('');

  useEffect(() => {
    const fetchProfileImage = async () => {
      if (!currentUser) return;

      try {
        const profileDoc = await getDoc(doc(db, 'userProfiles', currentUser.uid));
        if (profileDoc.exists()) {
          const data = profileDoc.data();
          setProfileImage(data.image || currentUser.photoURL || '');
        } else if (currentUser.photoURL) {
          setProfileImage(currentUser.photoURL);
        }
      } catch (error) {
        console.error('Error fetching profile image:', error);
      }
    };

    fetchProfileImage();
  }, [currentUser]);

  const navItems = [
    { path: '/', label: 'Dashboard', mobileLabel: 'Home', icon: LayoutDashboard },
    { path: '/active', label: 'Active Jobs', mobileLabel: 'Jobs', icon: Truck },
    { path: '/map', label: 'Map', mobileLabel: 'Map', icon: Map },
    { path: '/driving', label: 'Driving Time', mobileLabel: 'Time', icon: Clock },
    { path: '/earnings', label: 'Earnings', mobileLabel: 'Earn', icon: TrendingUp },
    { path: '/profile', label: 'Profile', mobileLabel: 'Profile', icon: User, isProfile: true },
  ];

  return (
    <>
      <nav className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Truck className="w-8 h-8 text-blue-600" />
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">MyBackHaul</h1>
            </div>

            {/* Full nav + logout, desktop only */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isProfileLink = item.path === '/profile';
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
                    {isProfileLink && profileImage ? (
                      <img
                        src={profileImage}
                        alt="Profile"
                        className="w-6 h-6 rounded-full object-cover border border-gray-300"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors ml-2"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>

            {/* Mobile: just logout, main nav moves to the bottom tab bar */}
            <button
              onClick={onLogout}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile bottom tab bar */}
      <div
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="grid grid-cols-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isProfileLink = item.path === '/profile';
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium ${
                    isActive ? 'text-blue-600' : 'text-gray-500'
                  }`
                }
              >
                {isProfileLink && profileImage ? (
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="w-5 h-5 rounded-full object-cover border border-gray-300"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
                <span>{item.mobileLabel}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </>
  );
}
