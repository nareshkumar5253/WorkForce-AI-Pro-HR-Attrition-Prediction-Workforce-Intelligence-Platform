import api from "./api";

// ============================================================
// CREATE LEAVE REQUEST
// ============================================================

export const createLeaveRequest = async (leaveData) => {
  const response = await api.post(
    "/leaves",
    leaveData
  );

  return response.data;
};

// ============================================================
// GET MY LEAVE REQUESTS
// ============================================================

export const getMyLeaveRequests = async (
  params = {}
) => {
  const response = await api.get(
    "/leaves/my",
    {
      params,
    }
  );

  return response.data;
};

// ============================================================
// GET SINGLE LEAVE REQUEST
// ============================================================

export const getLeaveRequest = async (
  leaveId
) => {
  const response = await api.get(
    `/leaves/${leaveId}`
  );

  return response.data;
};

// ============================================================
// APPROVE LEAVE REQUEST
// ============================================================

export const approveLeaveRequest = async (
  leaveId
) => {
  const response = await api.post(
    `/leaves/${leaveId}/approve`
  );

  return response.data;
};

// ============================================================
// REJECT LEAVE REQUEST
// ============================================================

export const rejectLeaveRequest = async (
  leaveId
) => {
  const response = await api.post(
    `/leaves/${leaveId}/reject`
  );

  return response.data;
};

// ============================================================
// CANCEL LEAVE REQUEST
// ============================================================

export const cancelLeaveRequest = async (
  leaveId
) => {
  const response = await api.post(
    `/leaves/${leaveId}/cancel`
  );

  return response.data;
};