import { Link } from "react-router-dom";
const EmptyState = ({
  message = "No data yet",
  className = "py-8",
  actionLabel = "View leads",
  onAction,
  to = "/leads",
}) => (
  <div className={`text-sm text-gray-500 text-center ${className}`}>
    <p>{message}</p>
    {onAction ? (
      <button className="btn-primary mt-3" onClick={onAction}>
        {actionLabel}
      </button>
    ) : (
      <Link className="inline-block btn-primary mt-3" to={to}>
        {actionLabel}
      </Link>
    )}
  </div>
);
export default EmptyState;
