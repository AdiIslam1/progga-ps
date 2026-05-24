export const ITEM_PER_PAGE = 10

type RouteAccessMap = {
  [key: string]: string[];
};

export const routeAccessMap: RouteAccessMap = {
  "/admin(.*)": ["admin"],
  "/student(.*)": ["student"],
  "/teacher(.*)": ["teacher"],
  "/list/teachers": ["admin", "teacher"],
  "/list/students": ["admin", "teacher"],
  "/list/subjects": ["admin"],
  "/list/classes": ["admin", "teacher"],
  "/list/exams": ["admin", "teacher", "student"],
  "/list/results": ["admin", "teacher", "student"],
  "/list/attendance": ["admin", "teacher", "student"],
  "/list/events": ["admin", "teacher", "student"],
  "/list/announcements": ["admin", "teacher", "student"],
  "/fees/packages(.*)": ["admin"],
  "/fees/collect(.*)": ["admin"],
  "/fees/ledger(.*)": ["admin", "student"],
  "/fees/receipt(.*)": ["admin", "student"],
  "/fees/reports(.*)": ["admin"],
  "/exams/schedule(.*)": ["admin", "teacher", "student"],
  "/exams/marksheet(.*)": ["admin", "teacher"],
  "/report-cards(.*)": ["admin", "teacher", "student"],
  "/notices(.*)": ["admin", "teacher", "student"],
  "/routine(.*)": ["admin", "teacher", "student"],
};