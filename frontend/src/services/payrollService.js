import api from "./api";

// ============================================================
// CREATE PAYROLL
// ============================================================

export const createPayroll = async (data) => {
  const response = await api.post(
    "/payrolls",
    data
  );

  return response.data;
};

// ============================================================
// GET PAYROLLS
// ============================================================

export const getPayrolls = async (
  params = {}
) => {
  const response = await api.get(
    "/payrolls",
    {
      params,
    }
  );

  return response.data;
};

// ============================================================
// GET MY PAYROLL
// ============================================================

export const getMyPayroll = async () => {
  const response = await api.get(
    "/payrolls/my"
  );

  return response.data;
};

// ============================================================
// GET PAYROLL BY ID
// ============================================================

export const getPayroll = async (payrollId) => {
  const response = await api.get(
    `/payrolls/${payrollId}`
  );

  return response.data;
};

// ============================================================
// UPDATE PAYROLL
// ============================================================

export const updatePayroll = async (
  payrollId,
  data
) => {
  const response = await api.put(
    `/payrolls/${payrollId}`,
    data
  );

  return response.data;
};

// ============================================================
// PROCESS PAYROLL
// ============================================================

export const processPayroll = async (
  payrollId
) => {
  const response = await api.post(
    `/payrolls/${payrollId}/process`
  );

  return response.data;
};

// ============================================================
// PAY PAYROLL
// ============================================================

export const payPayroll = async (
  payrollId
) => {
  const response = await api.post(
    `/payrolls/${payrollId}/pay`
  );

  return response.data;
};