// Follow-ups can exceed a single API page; never silently truncate the calendar.
export async function allAppointmentPages(fetchPage) {
  const first = await fetchPage({ status: "all", page: 1, limit: 500 });
  const rows = [...(first.data.followups || [])];
  for (let page = 2; page <= (first.data.pagination?.pages || 1); page++) {
    const result = await fetchPage({ status: "all", page, limit: 500 });
    rows.push(...(result.data.followups || []));
  }
  return rows;
}
