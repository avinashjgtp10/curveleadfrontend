import { Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Header = ({ title, onMenuClick }) => {
  const { tenant } = useAuth();
  return (
    <header className="sticky top-0 z-30 bg-white border-b h-16">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <button onClick={onMenuClick} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"><Menu size={22} /></button>
          <h1 className="text-lg font-semibold">{title}</h1>
        </div>
        {tenant?.subscription_status === 'trial' && (
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Free Trial</span>
        )}
      </div>
    </header>
  );
};

export default Header;
