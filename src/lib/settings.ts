export const ITEM_PER_PAGE = 10

type RouteAccessMap = {
  [key: string]: string[];
};

export const routeAccessMap: RouteAccessMap = {
  "/admin(.*)": ["admin"],
  "/student(.*)": ["student"],
  "/teacher(.*)": ["teacher"],
  "/parent(.*)": ["parent"],
  "/list/teachers": ["admin", "teacher"],
  "/list/students": ["admin", "teacher"],
  "/list/subjects": ["admin"],
  "/list/classes": ["admin", "teacher"],
  "/list/exams": ["admin", "teacher", "student", "parent"],
  "/list/results": ["admin", "teacher", "student", "parent"],
  "/list/attendance": ["admin", "teacher", "student", "parent"],
  "/list/events": ["admin", "teacher", "student", "parent"],
  "/list/announcements": ["admin", "teacher", "student", "parent"],
  "/fees/packages(.*)": ["admin"],
  "/fees/collect(.*)": ["admin"],
  "/fees/ledger(.*)": ["admin", "student", "parent"],
  "/fees/receipt(.*)": ["admin", "student", "parent"],
  "/fees/reports(.*)": ["admin"],
  "/exams/schedule(.*)": ["admin", "teacher", "student", "parent"],
  "/exams/marksheet(.*)": ["admin", "teacher"],
  "/report-cards(.*)": ["admin", "teacher", "student", "parent"],
  "/notices(.*)": ["admin", "teacher", "student", "parent"],
  "/routine(.*)": ["admin", "teacher", "student", "parent"],
};