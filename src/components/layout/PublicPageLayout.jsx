import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import BrandLogo from '../ui/BrandLogo';

const PublicPageLayout = ({ children }) => {
  const [mobileMenu, setMobileMenu] = useState(false);

  return (
    <div className="min-h-screen bg-white text-gray-950">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <BrandLogo className="h-10 w-24 p-1" />
          </Link>
          <div className="hidden items-center gap-7 md:flex">
            <Link to="/login" className="text-sm font-semibold text-brand-700">Sign In</Link>
            <Link to="/signup" className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
              Start Free
            </Link>
          </div>
          <button onClick={() => setMobileMenu(!mobileMenu)} className="p-2 md:hidden" aria-label="Toggle menu">
            {mobileMenu ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        {mobileMenu && (
          <div className="space-y-3 border-t bg-white p-4 md:hidden">
            <Link to="/login" onClick={() => setMobileMenu(false)} className="block py-2 text-sm font-semibold text-brand-700">Sign In</Link>
            <Link to="/signup" onClick={() => setMobileMenu(false)} className="block w-full rounded-lg bg-brand-600 px-5 py-2.5 text-center text-sm font-semibold text-white">
              Start Free
            </Link>
          </div>
        )}
      </nav>

      <div className="pt-16">
        {children}
      </div>

      <footer className="border-t border-gray-200 bg-white px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <Link to="/">
              <BrandLogo className="h-9 w-24 p-1" />
            </Link>
            <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">
              <Link to="/privacy-policy" className="hover:text-gray-950 transition-colors">Privacy Policy</Link>
              <Link to="/terms-of-service" className="hover:text-gray-950 transition-colors">Terms of Service</Link>
              <Link to="/contact" className="hover:text-gray-950 transition-colors">Contact Us</Link>
              <a href="mailto:support@curvelead.com" className="hover:text-gray-950 transition-colors">support@curvelead.com</a>
            </nav>
          </div>
          <p className="mt-6 text-sm text-gray-400">© 2026 CurveLead. Built in Baramati, India.</p>
        </div>
      </footer>
    </div>
  );
};

export default PublicPageLayout;
