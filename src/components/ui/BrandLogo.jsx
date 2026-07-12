// Tightly-cropped, transparent-background derivatives (see public/curvelead-logo-*-trimmed.png) —
// the source brand PNGs ship with ~3x more canvas padding than visible logo, so raw dimensions
// aren't used for sizing; width/height below are the trimmed assets' true intrinsic pixels,
// letting the browser derive aspect-ratio and reserve layout space before the image loads.
const LOGO_SRC = {
  navy: '/curvelead-logo-navy-trimmed.png',
  white: '/curvelead-logo-white-trimmed.png',
};
const INTRINSIC_WIDTH = 1541;
const INTRINSIC_HEIGHT = 279;

const BrandLogo = ({ className = 'h-10', alt = 'CurveLead', variant = 'navy' }) => (
  <img
    src={LOGO_SRC[variant]}
    alt={alt}
    width={INTRINSIC_WIDTH}
    height={INTRINSIC_HEIGHT}
    className={`object-contain object-left ${className}`}
  />
);

export default BrandLogo;
