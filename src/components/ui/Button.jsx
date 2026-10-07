// Design-system button. Primary = filled brand, secondary = white with border,
// ghost = text only, danger = destructive actions only. Heights: 36 (app) / 44 (lg).
const VARIANTS = {
  primary: 'bg-brand-600 text-white shadow-sm hover:bg-brand-700',
  secondary: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
  ghost: 'text-brand-700 hover:bg-brand-50',
  danger: 'bg-red-600 text-white shadow-sm hover:bg-red-700',
};
const SIZES = { sm: 'h-8 px-3 text-xs', md: 'h-9 px-4 text-sm', lg: 'h-11 px-5 text-sm' };

const Button = ({ variant = 'primary', size = 'md', as: Tag = 'button', className = '', children, ...props }) => (
  <Tag
    {...(Tag === 'button' && !props.type ? { type: 'button' } : {})}
    {...props}
    className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}>
    {children}
  </Tag>
);

export default Button;
