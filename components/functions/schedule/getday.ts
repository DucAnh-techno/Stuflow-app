export function getWeekDayNumbersFrom(dateInput: Date) {
  const date = new Date(dateInput);
  const dayOfWeek = date.getDay();
  const monday = new Date(date);
  monday.setDate(date.getDate() - ((dayOfWeek + 6) % 7));

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);

    d.setDate(monday.getDate() + i);

    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = String(d.getFullYear());
    
    days.push(`${yy}-${mm}-${dd}`);
  }
  return days;
}
