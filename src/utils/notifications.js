export function groupNotifications(rows) {
  const groups = new Map();
  for (const row of rows) {
    const key = row.type || "info";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  return [...groups];
}
