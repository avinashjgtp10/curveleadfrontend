const PageHeader = ({ title, subtitle, action }) => (
  <div className="flex items-center justify-between flex-wrap gap-3">
    <div>
      <h1 className="text-xl font-bold text-gray-900">{title}</h1>
      {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
    </div>
    {action}
  </div>
);

export default PageHeader;
