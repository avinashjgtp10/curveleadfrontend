export default function ChartLegend({ payload = [] }) {
  return (
    <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs mt-3">
      {payload.map((item, i) => (
        <li
          key={`${item.value}-${i}`}
          className="inline-flex items-center gap-2"
        >
          <span
            aria-hidden="true"
            className="inline-block w-3 h-3 rounded-sm shrink-0"
            style={{ backgroundColor: item.color }}
          />
          {item.value}
        </li>
      ))}
    </ul>
  );
}
