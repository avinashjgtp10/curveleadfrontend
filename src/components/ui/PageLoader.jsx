const PageLoader = ({ className = 'h-64' }) => (
  <div className={`flex items-center justify-center ${className}`}>
    <div className="w-8 h-8 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
  </div>
);

export default PageLoader;
