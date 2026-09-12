import api from "./api";

// ============================================================
// ATTENDANCE SERVICE
// ============================================================

// Get all attendance records
export const getAttendance = async (params = {}) => {
  const response = await api.get("/attendance", {
    params,
  });

  return response.data;
};

// Get a single attendance record
export const getAttendanceById = async (attendanceId) => {
  const response = await api.get(
    `/attendance/${attendanceId}`
  );

  return response.data;
};

// Create attendance record - Admin/HR
export const createAttendance = async (attendanceData) => {
  const response = await api.post(
    "/attendance",
    attendanceData
  );

  return response.data;
};

// Employee check-in
export const checkIn = async (data = {}) => {
  const response = await api.post(
    "/attendance/check-in",
    data
  );

  return response.data;
};

// Employee check-out
export const checkOut = async (data = {}) => {
  const response = await api.post(
    "/attendance/check-out",
    data
  );

  return response.data;
};

// Get logged-in employee attendance
export const getMyAttendance = async (params = {}) => {
  const response = await api.get(
    "/attendance/my",
    {
      params,
    }
  );

  return response.data;
};

// Get today's attendance
export const getMyTodayAttendance = async () => {
  const response = await api.get(
    "/attendance/my/today"
  );

  return response.data;
};

// Get overall attendance analytics
export const getAttendanceAnalytics = async (
  params = {}
) => {
  const response = await api.get(
    "/attendance/analytics",
    {
      params,
    }
  );

  return response.data;
};

// Get logged-in employee attendance analytics
export const getMyAttendanceAnalytics = async (
  params = {}
) => {
  const response = await api.get(
    "/attendance/analytics/my",
    {
      params,
    }
  );

  return response.data;
};