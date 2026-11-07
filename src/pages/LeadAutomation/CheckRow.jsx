// A checkbox with a plain-language label and a line saying what it does.
export default function CheckRow({ checked, onChange, label, hint }) {
  return (
    <label className="flex gap-2 text-sm items-start cursor-pointer">
      <input type="checkbox" className="mt-1" checked={checked} onChange={onChange} />
      <span><span className="font-medium">{label}</span>{hint && <span className="block text-xs text-gray-500 font-normal">{hint}</span>}</span>
    </label>
  );
}
