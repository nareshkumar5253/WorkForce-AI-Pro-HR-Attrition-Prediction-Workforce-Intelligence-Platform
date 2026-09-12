import api from "./api";

const riskMonitoringService = {
  // Get risk summary
  getRiskSummary: async () => {
    const response = await api.get(
      "/risk-monitoring/summary"
    );

    return response.data;
  },

  // Get all employee risks
  getAllRisks: async () => {
    const response = await api.get(
      "/risk-monitoring"
    );

    return response.data;
  },

  // Get only high-risk employees
  getHighRiskEmployees: async () => {
    const response = await api.get(
      "/risk-monitoring/high-risk"
    );

    return response.data;
  },

  // Get risk for a specific employee
  getEmployeeRisk: async (employeeId) => {
    const response = await api.get(
      `/risk-monitoring/employee/${employeeId}`
    );

    return response.data;
  },
};

export default riskMonitoringService;