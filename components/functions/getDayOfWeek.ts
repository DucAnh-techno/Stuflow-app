export function getWeeksDates() {
  const today = new Date();

  // Lấy ngày đầu tuần hiện tại (giả sử tuần bắt đầu từ Thứ 2)
  const currentDay = today.getDay(); // Chủ nhật = 0, Thứ 2 = 1, ...
  const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  const mondayThisWeek = new Date(today);
  mondayThisWeek.setDate(today.getDate() + diffToMonday);

  let allWeeks = [];

  // Lặp qua từ tuần -1 → +3 (tổng 5 tuần)
  for (let weekOffset = -2; weekOffset <= 6; weekOffset++) {
    let weekDates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(mondayThisWeek);
      d.setDate(mondayThisWeek.getDate() + weekOffset * 7 + i);

      // format dd/mm/yy
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yy = String(d.getFullYear()).slice(-2);

      weekDates.push(`${dd}/${mm}/${yy}`);
    }
    allWeeks.push(weekDates);
  }

  return allWeeks;
}

