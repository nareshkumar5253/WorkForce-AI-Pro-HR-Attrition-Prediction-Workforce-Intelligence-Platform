import api from "./api";

const analyticsService = {
  getDashboard: async () => {
    const response = await api.get(
      "/analytics/dashboard"
    );

    return response.data;
  },

  getWorkforceSummary: async () => {
    const response = await api.get(
      "/analytics/workforce/summary"
    );

    return response.data;
  },

  getWorkforceByDepartment: async () => {
    const response = await api.get(
      "/analytics/workforce/by-department"
    );

    return response.data;
  },

  getWorkforceByStatus: async () => {
    const response = await api.get(
      "/analytics/workforce/by-status"
    );

    return response.data;
  },

  getWorkforceByRole: async () => {
    const response = await api.get(
      "/analytics/workforce/by-role"
    );

    return response.data;
  },

  getAttendanceSummary: async () => {
    const response = await api.get(
      "/analytics/attendance/summary"
    );

    return response.data;
  },

  getAttendanceRate: async () => {
    const response = await api.get(
      "/analytics/attendance/rate"
    );

    return response.data;
  },

  getAttendanceTrend: async () => {
    const response = await api.get(
      "/analytics/attendance/trend"
    );

    return response.data;
  },

  getPayrollSummary: async () => {
    const response = await api.get(
      "/analytics/payroll/summary"
    );

    return response.data;
  },

  getSalaryAnalytics: async () => {
    const response = await api.get(
      "/analytics/payroll/salary-analytics"
    );

    return response.data;
  },

  getLeaveSummary: async () => {
    const response = await api.get(
      "/analytics/leave/summary"
    );

    return response.data;
  },

  getLeaveByType: async () => {
    const response = await api.get(
      "/analytics/leave/by-type"
    );

    return response.data;
  },

  getJoiningAttritionTrend: async () => {
    const response = await api.get(
      "/analytics/workforce/joining-attrition-trend"
    );

    return response.data;
  },

  getAttritionDashboard: async () => {
    const response = await api.get(
      "/analytics/attrition/dashboard"
    );

    return response.data;
  },
};

export default analyticsService;