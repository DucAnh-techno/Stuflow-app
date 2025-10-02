

export async function updateData(username: string, password: string, token: string) {

  const now = new Date();
  const month = now.getMonth();
  const day = now.getDate();

    const dateThang: string[] = [-1, 0, 1, 2, 3].map(offset =>
      getFirstDayOfMonth(new Date(now.getFullYear(), month + offset, 1))
    );

    const dateTuan: string[] = [-14, -7, 0, 7, 14, 21, 28, 35, 42].map(offset =>
      formatDate(new Date(now.getFullYear(), month, day + offset))
    );

    console.log('day laf thoong tin ---------------', JSON.stringify({ username, password, token, date: dateThang }));
    
    try {
        //Lay lich Courses
    const resCourse = await fetch('https://stuflow-notify.vercel.app/api/lib/lichCourse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!resCourse.ok) {
      const text = await resCourse.text().catch(() => '');
      console.error('loi lay course', { status: resCourse.status, text });
      return { error: 'loi_lay_course', status: resCourse.status };
    }

    // Lay lich Thang
    const resThang = await fetch('https://stuflow-notify.vercel.app/api/lib/lichHoc/thang', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, token, date: dateThang })
    });
    if (!resThang.ok) {
      const text = await resThang.text().catch(() => '');
      console.error('loi lay thang', { status: resThang.status, text });
      return { error: 'loi_lay_thang', status: resThang.status , detail: resThang};
    }
    //Lay lich Tuan
    const resTuan = await fetch('https://stuflow-notify.vercel.app/api/lib/lichHoc/tuan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, token, date: dateTuan })
    });
    if (!resTuan.ok) {
      const text = await resTuan.text().catch(() => '');
      console.error('loi lay tuan', { status: resTuan.status, text });
      return { error: 'loi_lay_tuan', status: resTuan.status };
    }

    console.log('Update Thanh Cong');
    return { ok: true };

    } catch (err) {
        console.error("API error:", err);
        return { error: err };
    }
}

function getFirstDayOfMonth(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // thêm số 0 ở trước nếu <10
  return `${year}-${month}-01`;
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}