import type { ByCategoryReportResponse, MonthlyReportResponse } from "@expense-tracker/shared";

import { apiRequest } from "@/api/client";

const toReportsQuery = (startDate: string, endDate: string) => {
  const params = new URLSearchParams();
  params.set("startDate", startDate);
  params.set("endDate", endDate);
  return `?${params.toString()}`;
};

export const fetchMonthlyReport = (startDate: string, endDate: string) =>
  apiRequest<MonthlyReportResponse>(`/reports/monthly${toReportsQuery(startDate, endDate)}`);

export const fetchByCategoryReport = (startDate: string, endDate: string) =>
  apiRequest<ByCategoryReportResponse>(`/reports/by-category${toReportsQuery(startDate, endDate)}`);
