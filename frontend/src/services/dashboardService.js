
import api from "./api";

/*
 * ============================================================
 * WORKFORCE AI PRO
 * Dashboard Analytics Service
 * ============================================================
 */

/**
 * Workforce summary
 */
export const getWorkforceSummary = async () => {
  const response = await api.get(
    "/analytics/workforce/summary"
  );

  return response.data;
};

/**
 * Attendance summary
 */
export const getAttendanceSummary = async () => {
  const response = await api.get(
    "/analytics/attendance/summary"
  );

  return response.data;
};

/**
 * Leave summary
 */
export const getLeaveSummary = async () => {
  const response = await api.get(
    "/analytics/leave/summary"
  );

  return response.data;
};

/**
 * Payroll summary
 */
export const getPayrollSummary = async () => {
  const response = await api.get(
    "/analytics/payroll/summary"
  );

  return response.data;
};

/**
 * Attrition overview
 */
export const getAttritionOverview = async () => {
  const response = await api.get(
    "/analytics/attrition/overview"
  );

  return response.data;
};

/**
 * Load all dashboard analytics together.
 */
export const getDashboardAnalytics = async () => {
  const [
    workforce,
    attendance,
    leave,
    payroll,
    attrition,
  ] = await Promise.all([
    getWorkforceSummary(),
    getAttendanceSummary(),
    getLeaveSummary(),
    getPayrollSummary(),
    getAttritionOverview(),
  ]);

  return {
    workforce,
    attendance,
    leave,
    payroll,
    attrition,
  };
};
