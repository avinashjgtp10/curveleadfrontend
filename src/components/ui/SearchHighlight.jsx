import { matchParts } from '../../utils/leadSearch';
export default function SearchHighlight({ value, search, phone = false }) {
  const digitsOnly = phone && /^[+\d\s().-]+$/.test(search || '');
  return matchParts(value, search, digitsOnly).map((part, i) => part.match
    ? <mark key={i} className="bg-yellow-100 text-inherit rounded-sm">{part.text}</mark>
    : <span key={i}>{part.text}</span>);
}
