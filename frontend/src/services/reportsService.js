import api from "./api";

const reportsService = {
  // Report previews
  getWorkforceReport: async () => {
    const response = await api.get(
      "/reports/workforce"
    );

    return response.data;
  },

  getAttendanceReport: async () => {
    const response = await api.get(
      "/reports/attendance"
    );

    return response.data;
  },

  getLeaveReport: async () => {
    const response = await api.get(
      "/reports/leave"
    );

    return response.data;
  },

  getPayrollReport: async () => {
    const response = await api.get(
      "/reports/payroll"
    );

    return response.data;
  },

  getAttritionReport: async () => {
    const response = await api.get(
      "/reports/attrition"
    );

    return response.data;
  },

  getWorkforceStabilityReport: async () => {
    const response = await api.get(
      "/reports/workforce-stability"
    );

    return response.data;
  },

  // Export endpoints
  exportWorkforce: async () => {
    const response = await api.get(
      "/reports/export/workforce",
      {
        responseType: "blob",
      }
    );

    return response;
  },

  exportAttendance: async () => {
    const response = await api.get(
      "/reports/export/attendance",
      {
        responseType: "blob",
      }
    );

    return response;
  },

  exportLeave: async () => {
    const response = await api.get(
      "/reports/export/leave",
      {
        responseType: "blob",
      }
    );

    return response;
  },

  exportPayroll: async () => {
    const response = await api.get(
      "/reports/export/payroll",
      {
        responseType: "blob",
      }
    );

    return response;
  },

  exportAttrition: async () => {
    const response = await api.get(
      "/reports/export/attrition",
      {
        responseType: "blob",
      }
    );

    return response;
  },
};

export default reportsService;