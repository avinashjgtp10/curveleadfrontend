import { Menu, Bell, Search } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const Header = ({ onMenuClick, title }) => {
  const { tenant } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 h-16">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            <Menu size={22} />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Subscription badge */}
          {tenant?.subscriptionStatus === 'trial' && (
            <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
              Free Trial
            </span>
          )}

          {/* Notifications */}
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 hover:bg-gray-100 rounded-lg"
          >
            <Bell size={20} className="text-gray-600" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
