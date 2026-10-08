const PageHeader = ({ title, subtitle, action }) => (
  <div className="flex items-center justify-between flex-wrap gap-3">
    <div className="min-w-0">
      <h1 className="text-2xl font-bold text-[#141a3d] tracking-tight">{title}</h1>
      {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
    {action}
  </div>
);

export default PageHeader;
