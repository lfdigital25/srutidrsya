import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Settings, History, LogOut, Heart, CreditCard, Headphones } from 'lucide-react';
import { auth, signInWithGoogle, logOut } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [backgroundPlay, setBackgroundPlay] = useState(
    localStorage.getItem('backgroundPlay') === 'true'
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const toggleBackgroundPlay = () => {
    const newValue = !backgroundPlay;
    setBackgroundPlay(newValue);
    localStorage.setItem('backgroundPlay', String(newValue));
  };

  if (!user) {
    return (
      <div className="p-4 max-w-2xl mx-auto flex flex-col items-center justify-center h-full text-center">
        <div className="w-24 h-24 rounded-full bg-neutral-800 flex items-center justify-center mb-6">
          <User className="w-12 h-12 text-neutral-500" />
        </div>
        <h1 className="text-2xl font-bold text-neutral-100 mb-2">Sign in to SRUTI DRSYA</h1>
        <p className="text-neutral-400 mb-8 max-w-sm">Sign in to save your watch history, manage preferences, and support creators.</p>
        <button 
          onClick={signInWithGoogle}
          className="px-6 py-3 bg-red-600 text-white rounded-full font-medium hover:bg-red-700 transition-colors"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-6 mb-8">
        {user.photoURL ? (
          <img src={user.photoURL} alt="Profile" className="w-24 h-24 rounded-full shadow-lg object-cover" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-24 h-24 rounded-full bg-red-600 flex items-center justify-center text-4xl font-bold text-white shadow-lg">
            {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-neutral-100">{user.displayName || 'User'}</h1>
          <p className="text-neutral-400">{user.email}</p>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-neutral-200 mb-4 px-2">Account Settings</h2>
        
        <Link to="/history" className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-neutral-800 transition-colors text-left group">
          <History className="w-6 h-6 text-neutral-400 group-hover:text-red-600 transition-colors" />
          <div className="flex-1">
            <h3 className="font-medium text-neutral-200">Watch History</h3>
            <p className="text-sm text-neutral-500">Videos you've watched recently (auto-deletes after 15 days)</p>
          </div>
        </Link>

        <div className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-neutral-800 transition-colors text-left group">
          <div className="flex items-center gap-4">
            <Headphones className="w-6 h-6 text-neutral-400 group-hover:text-red-600 transition-colors" />
            <div>
              <h3 className="font-medium text-neutral-200">Background Play</h3>
              <p className="text-sm text-neutral-500">Keep playing audio when app is in background</p>
            </div>
          </div>
          <button 
            onClick={toggleBackgroundPlay}
            className={`w-12 h-6 rounded-full transition-colors relative ${backgroundPlay ? 'bg-red-600' : 'bg-neutral-700'}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${backgroundPlay ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </div>

        <div className="h-px bg-neutral-800 my-4"></div>

        <h2 className="text-lg font-semibold text-neutral-200 mb-4 px-2 mt-6">Monetization & Support</h2>

        <button className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-neutral-800 transition-colors text-left group">
          <CreditCard className="w-6 h-6 text-neutral-400 group-hover:text-red-600 transition-colors" />
          <div className="flex-1">
            <h3 className="font-medium text-neutral-200">Premium Memberships</h3>
            <p className="text-sm text-neutral-500">Manage your channel subscriptions</p>
          </div>
        </button>

        <button className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-neutral-800 transition-colors text-left group">
          <Heart className="w-6 h-6 text-neutral-400 group-hover:text-red-600 transition-colors" />
          <div className="flex-1">
            <h3 className="font-medium text-neutral-200">Creator Donations</h3>
            <p className="text-sm text-neutral-500">Support your favorite creators</p>
          </div>
        </button>

        <div className="h-px bg-neutral-800 my-4"></div>

        <button className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-neutral-800 transition-colors text-left group">
          <Settings className="w-6 h-6 text-neutral-400 group-hover:text-red-600 transition-colors" />
          <div className="flex-1">
            <h3 className="font-medium text-neutral-200">Settings</h3>
            <p className="text-sm text-neutral-500">App preferences and privacy</p>
          </div>
        </button>

        <button onClick={logOut} className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-neutral-800 transition-colors text-left group text-red-500">
          <LogOut className="w-6 h-6 group-hover:text-red-400 transition-colors" />
          <div className="flex-1">
            <h3 className="font-medium">Sign Out</h3>
          </div>
        </button>
      </div>
    </div>
  );
}
