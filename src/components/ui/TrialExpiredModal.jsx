import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CreditCard, X } from 'lucide-react';

const TrialExpiredModal = () => {
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState('Your trial has expired. Please upgrade to continue using CurveLead.');
  const navigate = useNavigate();

  useEffect(() => {
    const onExpired = (e) => {
      if (e.detail?.message) setMessage(e.detail.message);
      setShow(true);
    };
    const onPaid = () => setShow(false);

    window.addEventListener('trial-expired', onExpired);
    window.addEventListener('payment-success', onPaid);
    return () => {
      window.removeEventListener('trial-expired', onExpired);
      window.removeEventListener('payment-success', onPaid);
    };
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative">
        <button
          onClick={() => setShow(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
            <AlertTriangle size={32} className="text-amber-500" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Trial Expired</h2>
            <p className="text-gray-500 text-sm leading-relaxed">{message}</p>
          </div>

          <div className="w-full pt-2 flex flex-col gap-3">
            <button
              onClick={() => { setShow(false); navigate('/billing'); }}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              <CreditCard size={18} />
              Upgrade Now
            </button>
            <button
              onClick={() => setShow(false)}
              className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors py-1"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrialExpiredModal;
