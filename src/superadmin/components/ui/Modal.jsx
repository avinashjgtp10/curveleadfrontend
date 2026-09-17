import { X } from 'lucide-react';

const Modal = ({ title, onClose, children, maxWidth = 'max-w-md', footer }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
    <div className={`w-full ${maxWidth} bg-white rounded-2xl shadow-xl max-h-[90vh] flex flex-col`} onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700"><X size={18} /></button>
      </div>
      <div className="px-5 py-4 overflow-y-auto">{children}</div>
      {footer && <div className="px-5 py-4 border-t shrink-0 flex gap-3">{footer}</div>}
    </div>
  </div>
);

export default Modal;
