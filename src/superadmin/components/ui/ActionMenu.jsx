import { useState } from 'react';
import { MoreHorizontal } from 'lucide-react';

// items: [{ label, icon: Icon, onClick, danger }]
const ActionMenu = ({ items }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block text-left" onClick={e => e.stopPropagation()}>
      <button onClick={() => setOpen(o => !o)} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100">
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-48 bg-white border rounded-xl shadow-lg z-20 py-1">
            {items.map(item => (
              <button key={item.label}
                onClick={() => { setOpen(false); item.onClick(); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 ${item.danger ? 'text-red-600' : 'text-gray-700'}`}>
                {item.icon && <item.icon size={14} />} {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ActionMenu;
