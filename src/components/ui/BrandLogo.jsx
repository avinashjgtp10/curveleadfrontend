const BrandLogo = ({ className = 'h-10', alt = 'CurveLead', showText = true }) => (
  <span className={`inline-flex items-center gap-2 ${className}`} aria-label={alt}>
    <img src="/icon.svg" alt="" className="h-full w-auto rounded-xl shadow-sm" />
    {showText && <span className="text-xl font-extrabold text-gray-950">CurveLead</span>}
  </span>
);

export default BrandLogo;
