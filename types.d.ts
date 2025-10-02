export interface LichTuanItem {
    ngayBatDauHoc: string;
    tenPhong: string;
    thu: string;
    tuTiet: number;
    denTiet: number;
    maLopHocPhan: string;
    tenMonHoc: string;
    isTamNgung: boolean;
    timeToDisplay: string;
    link: string;
    daystart: string;
    gioHoc: string;
}

export interface Subject {
  nameToDisplay: string;
};
export interface DayItem {
  date: string;      // "10/09/2025"
  total: number;     // 1
  subjects: Subject[];
}

export interface Courses {
  id: string,
  name: string,
  activityname: string,
  activitystr: string,
  url: string,
  popupname: string,
  timestart: string,
  daystart: string,
  eventtype: string,
  coursename: string,
}

export interface fileSubSave {
  subName: string,
  files: Files[],
  pictures: Picture[],
}
  
export interface Files {
  name: string,
  uri: string,
  color: string
}

export interface Pictures {
  uri: string,
}
