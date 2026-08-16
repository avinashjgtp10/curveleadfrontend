const EmptyState = ({ message = 'No data', className = 'py-8' }) => (
  <p className={`text-sm text-gray-400 text-center ${className}`}>{message}</p>
);

export default EmptyState;
