

export async function updateData(username: string, password: string, token: string) {

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
      body: JSON.stringify({ username, password, token })
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
      body: JSON.stringify({ username, token })
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
