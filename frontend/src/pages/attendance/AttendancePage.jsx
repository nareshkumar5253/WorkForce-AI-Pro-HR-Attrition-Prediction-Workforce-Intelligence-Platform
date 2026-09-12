
import { useEffect, useState } from "react";
import {
  checkIn,
  checkOut,
  getMyAttendance,
  getMyTodayAttendance,
} from "../../services/attendanceService";

const AttendancePage = () => {
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);

  const [remarks, setRemarks] = useState("");

  const [loadingToday, setLoadingToday] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ============================================================
  // LOAD TODAY'S ATTENDANCE
  // ============================================================

  const loadTodayAttendance = async () => {
    try {
      setLoadingToday(true);
      setError("");

      const data = await getMyTodayAttendance();

      setTodayAttendance(data);
    } catch (err) {
      if (err.response?.status === 404) {
        setTodayAttendance(null);
      } else {
        setError(
          err.response?.data?.detail ||
            "Failed to load today's attendance."
        );
      }
    } finally {
      setLoadingToday(false);
    }
  };

  // ============================================================
  // LOAD ATTENDANCE HISTORY
  // ============================================================

  const loadAttendanceHistory = async () => {
    try {
      setLoadingHistory(true);

      const data = await getMyAttendance();

      if (Array.isArray(data)) {
        setAttendanceHistory(data);
      } else if (Array.isArray(data?.items)) {
        setAttendanceHistory(data.items);
      } else {
        setAttendanceHistory([]);
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Failed to load attendance history."
      );
    } finally {
      setLoadingHistory(false);
    }
  };

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    loadTodayAttendance();
    loadAttendanceHistory();
  }, []);

  // ============================================================
  // GET TODAY DATE
  // ============================================================

  const getTodayDate = () => {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  // ============================================================
  // CHECK IN
  // TEST TIME = 09:00 AM
  // ============================================================

  const handleCheckIn = async () => {
    try {
      setCheckingIn(true);
      setError("");
      setSuccess("");

      const today = getTodayDate();

      // TESTING:
      // Check-in time will be 09:00 AM
      const checkInTime = `${today}T09:00:00`;

      await checkIn({
        attendance_date: today,
        check_in: checkInTime,
        remarks: remarks || "Starting full day work",
      });

      setSuccess(
        "Attendance check-in completed successfully at 09:00 AM."
      );

      setRemarks("");

      await loadTodayAttendance();
      await loadAttendanceHistory();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to check in."
      );
    } finally {
      setCheckingIn(false);
    }
  };

  // ============================================================
  // CHECK OUT
  // TEST TIME = 06:00 PM
  // ============================================================

  const handleCheckOut = async () => {
    try {
      setCheckingOut(true);
      setError("");
      setSuccess("");

      const today = getTodayDate();

      // TESTING:
      // Check-out time will be 06:00 PM
      const checkOutTime = `${today}T18:00:00`;

      await checkOut({
        check_out: checkOutTime,
        remarks: remarks || "Completed full day work",
      });

      setSuccess(
        "Attendance check-out completed successfully at 06:00 PM."
      );

      setRemarks("");

      await loadTodayAttendance();
      await loadAttendanceHistory();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to check out."
      );
    } finally {
      setCheckingOut(false);
    }
  };

  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatDate = (dateValue) => {
    if (!dateValue) return "-";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return dateValue;
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ============================================================
  // FORMAT TIME
  // ============================================================

  const formatTime = (dateValue) => {
    if (!dateValue) return "-";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return dateValue;
    }

    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ============================================================
  // FORMAT WORKING HOURS
  // ============================================================

  const formatWorkingHours = (hours) => {
    if (hours === null || hours === undefined) {
      return "-";
    }

    const numericHours = Number(hours);

    if (Number.isNaN(numericHours)) {
      return hours;
    }

    return `${numericHours.toFixed(2)} hrs`;
  };

  // ============================================================
  // STATUS CLASS
  // ============================================================

  const getStatusClass = (status) => {
    if (!status) {
      return "attendance-status-default";
    }

    const normalized = String(status).toUpperCase();

    if (normalized === "PRESENT") {
      return "attendance-status-present";
    }

    if (normalized === "LATE") {
      return "attendance-status-late";
    }

    if (normalized === "FULL_DAY") {
      return "attendance-status-full-day";
    }

    if (normalized === "HALF_DAY") {
      return "attendance-status-half-day";
    }

    if (normalized === "ABSENT") {
      return "attendance-status-absent";
    }

    return "attendance-status-default";
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="attendance-page">

      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <div className="attendance-page-header">
        <div>
          <h1>Attendance</h1>

          <p>
            Manage your daily attendance, check-in,
            check-out, and attendance history.
          </p>
        </div>

        <div className="attendance-date-card">
          <span>Today</span>

          <strong>
            {new Date().toLocaleDateString("en-IN", {
              weekday: "short",
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </strong>
        </div>
      </div>

      {/* ======================================================
          SUCCESS MESSAGE
      ====================================================== */}

      {success && (
        <div className="attendance-alert attendance-alert-success">
          <span>✓</span>
          {success}
        </div>
      )}

      {/* ======================================================
          ERROR MESSAGE
      ====================================================== */}

      {error && (
        <div className="attendance-alert attendance-alert-error">
          <span>!</span>
          {error}
        </div>
      )}

      {/* ======================================================
          TODAY + ACTIONS
      ====================================================== */}

      <div className="attendance-grid">

        {/* ==================================================
            TODAY'S ATTENDANCE
        ================================================== */}

        <div className="attendance-card attendance-today-card">

          <div className="attendance-card-header">
            <div>
              <h2>Today's Attendance</h2>

              <p>
                Your current attendance status
              </p>
            </div>

            <div className="attendance-card-icon">
              ✓
            </div>
          </div>

          {loadingToday ? (
            <div className="attendance-loading">
              Loading attendance...
            </div>
          ) : (
            <>
              <div className="attendance-status-section">

                <span className="attendance-label">
                  Status
                </span>

                <span
                  className={`attendance-status-badge ${getStatusClass(
                    todayAttendance?.status
                  )}`}
                >
                  {todayAttendance?.status || "NOT MARKED"}
                </span>
              </div>

              <div className="attendance-time-grid">

                <div className="attendance-time-box">
                  <span>Check In</span>

                  <strong>
                    {formatTime(
                      todayAttendance?.check_in
                    )}
                  </strong>
                </div>

                <div className="attendance-time-box">
                  <span>Check Out</span>

                  <strong>
                    {formatTime(
                      todayAttendance?.check_out
                    )}
                  </strong>
                </div>

                <div className="attendance-time-box">
                  <span>Working Hours</span>

                  <strong>
                    {formatWorkingHours(
                      todayAttendance?.working_hours
                    )}
                  </strong>
                </div>

              </div>
            </>
          )}
        </div>

        {/* ==================================================
            ACTION CARD
        ================================================== */}

        <div className="attendance-card attendance-action-card">

          <div className="attendance-card-header">

            <div>
              <h2>Attendance Actions</h2>

              <p>
                Mark your attendance for today
              </p>
            </div>

            <div className="attendance-card-icon">
              ⏱
            </div>
          </div>

          <div className="attendance-remarks">

            <label htmlFor="attendanceRemarks">
              Remarks
            </label>

            <textarea
              id="attendanceRemarks"
              value={remarks}
              onChange={(event) =>
                setRemarks(event.target.value)
              }
              placeholder="Enter remarks (optional)"
              rows="3"
            />
          </div>

          <div className="attendance-action-buttons">

            {/* CHECK IN */}

            <button
              type="button"
              className="attendance-check-in-button"
              onClick={handleCheckIn}
              disabled={
                checkingIn ||
                checkingOut ||
                Boolean(todayAttendance?.check_in)
              }
            >
              {checkingIn
                ? "Checking In..."
                : "✓ Check In"}
            </button>

            {/* CHECK OUT */}

            <button
              type="button"
              className="attendance-check-out-button"
              onClick={handleCheckOut}
              disabled={
                checkingIn ||
                checkingOut ||
                !todayAttendance?.check_in ||
                Boolean(todayAttendance?.check_out)
              }
            >
              {checkingOut
                ? "Checking Out..."
                : "↗ Check Out"}
            </button>

          </div>

          <div className="attendance-action-hint">

            {!todayAttendance?.check_in
              ? "Check in when you start your workday."
              : !todayAttendance?.check_out
              ? "Check out when your workday ends."
              : "Today's attendance is completed."}

          </div>

        </div>
      </div>

      {/* ======================================================
          ATTENDANCE HISTORY
      ====================================================== */}

      <div className="attendance-card attendance-history-card">

        <div className="attendance-card-header">

          <div>
            <h2>Attendance History</h2>

            <p>
              Your recent attendance records
            </p>
          </div>

        </div>

        {loadingHistory ? (
          <div className="attendance-loading">
            Loading attendance history...
          </div>
        ) : attendanceHistory.length === 0 ? (

          <div className="attendance-empty">

            <div className="attendance-empty-icon">
              📅
            </div>

            <h3>
              No attendance records
            </h3>

            <p>
              Your attendance records will appear here.
            </p>

          </div>

        ) : (

          <div className="attendance-table-wrapper">

            <table className="attendance-table">

              <thead>
                <tr>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Status</th>
                  <th>Working Hours</th>
                  <th>Remarks</th>
                </tr>
              </thead>

              <tbody>

                {attendanceHistory.map((record) => (

                  <tr key={record.id}>

                    <td>
                      {formatDate(
                        record.attendance_date
                      )}
                    </td>

                    <td>
                      {formatTime(
                        record.check_in
                      )}
                    </td>

                    <td>
                      {formatTime(
                        record.check_out
                      )}
                    </td>

                    <td>

                      <span
                        className={`attendance-status-badge ${getStatusClass(
                          record.status
                        )}`}
                      >
                        {record.status || "-"}
                      </span>

                    </td>

                    <td>
                      {formatWorkingHours(
                        record.working_hours
                      )}
                    </td>

                    <td>
                      {record.remarks || "-"}
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>
  );
};

export default AttendancePage;
