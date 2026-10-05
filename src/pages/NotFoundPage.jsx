import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BrandLogo from '../components/ui/BrandLogo';

// Unknown URLs used to render a blank page; this gives a way back instead of a dead end.
const NotFoundPage = () => {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 text-center">
      <BrandLogo className="w-36 h-auto mb-8" />
      <p className="text-sm font-semibold text-brand-600">404</p>
      <h1 className="mt-2 text-2xl font-bold text-gray-900">We can't find that page</h1>
      <p className="mt-2 text-sm text-gray-500 max-w-sm">The link may be old or mistyped. Check the address, or head back and carry on from there.</p>
      <Link to={user ? '/dashboard' : '/'} className="mt-6 inline-flex rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
        {user ? 'Go to dashboard' : 'Go to home page'}
      </Link>
    </div>
  );
};

export default NotFoundPage;
