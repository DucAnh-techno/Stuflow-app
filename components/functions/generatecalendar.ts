export function generateCalendar(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay(); // Thứ mấy (0=CN, 6=Th7)
  const daysInMonth = new Date(year, month + 1, 0).getDate(); // Số ngày trong tháng

  const weeks = [];
  let currentDay = 2 - firstDay; // Bắt đầu từ ô trống nếu tháng không khởi đầu từ CN
  let temp = false;
  if (firstDay === 0){
    temp = true;
  }

  while (currentDay <= daysInMonth) {
    const week = [];
    for (let i = 0; i < 7; i++) {
      if (currentDay > 0 && currentDay <= daysInMonth) {
        if (temp) {
          temp = false;
          i--;
          for (let i = 0; i < 6; i++){
            week.push(null);
          }
          week.push(`01`);
          break;
        } else {
          week.push(currentDay);
        }
      } else {
        week.push(null); // Ô trống
      }
      currentDay++;
    }
    weeks.push(week);
  }

  return weeks;
}
