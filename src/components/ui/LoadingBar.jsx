import { useState, useEffect } from 'react';
import { loadingState } from '../../services/loadingState';

const LoadingBar = () => {
  const [loading, setLoading] = useState(false);

  useEffect(() => loadingState.subscribe(setLoading), []);

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 h-0.5 transition-opacity duration-300 ${
        loading ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="h-full bg-brand-500 loading-bar-progress" />
    </div>
  );
};

export default LoadingBar;
