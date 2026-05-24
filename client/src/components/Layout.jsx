import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, LogOut, User } from 'lucide-react';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-800 bg-gray-900 px-6 py-4 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2 text-indigo-400 font-bold text-lg">
          <BookOpen size={22} />
          StudyAI
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm flex items-center gap-1">
            <User size={14} /> {user?.name}
          </span>
          <button onClick={handleLogout} className="text-gray-400 hover:text-red-400 transition-colors">
            <LogOut size={18} />
          </button>
        </div>
      </header>
      <main className="flex-1 p-6 max-w-5xl mx-auto w-full">{children}</main>
    </div>
  );
}
