import BrandLogo from './BrandLogo';

const PageLoader = ({ message = 'Loading data...', minHeight = 'h-64' }) => (
  <div className={`flex flex-col items-center justify-center ${minHeight} text-center`}>
    <BrandLogo className="mb-5 h-20 w-auto max-w-44 p-2 shadow-sm" />
    <div className="relative h-12 w-12">
      <div className="absolute inset-0 rounded-full border-4 border-brand-100" />
      <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-brand-600 animate-spin" />
    </div>
    <p className="mt-4 text-sm font-medium text-gray-600">{message}</p>
  </div>
);

export default PageLoader;
