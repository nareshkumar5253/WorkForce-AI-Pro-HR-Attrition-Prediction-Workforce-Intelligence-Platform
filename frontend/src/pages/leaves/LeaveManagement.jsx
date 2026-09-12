import { useEffect, useMemo, useState } from "react";
import {
  createLeaveRequest,
  getMyLeaveRequests,
  cancelLeaveRequest,
  approveLeaveRequest,
  rejectLeaveRequest,
} from "../../services/leaveService";

const LeaveManagement = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);

  const [leaveTypeId, setLeaveTypeId] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ============================================================
  // LOAD LEAVE REQUESTS
  // ============================================================

  const loadLeaveRequests = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getMyLeaveRequests();

      if (Array.isArray(data)) {
        setLeaveRequests(data);
      } else if (Array.isArray(data?.items)) {
        setLeaveRequests(data.items);
      } else {
        setLeaveRequests([]);
      }
    } catch (err) {
      console.error("Leave loading failed:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to load leave requests."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    loadLeaveRequests();
  }, []);

  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatDate = (value) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ============================================================
  // STATUS CLASS
  // ============================================================

  const getStatusStyle = (status) => {
    const normalized = String(status || "").toUpperCase();

    if (normalized === "APPROVED") {
      return {
        background: "#dcfce7",
        color: "#166534",
      };
    }

    if (normalized === "PENDING") {
      return {
        background: "#fef3c7",
        color: "#92400e",
      };
    }

    if (normalized === "REJECTED") {
      return {
        background: "#fee2e2",
        color: "#991b1b",
      };
    }

    if (normalized === "CANCELLED") {
      return {
        background: "#e5e7eb",
        color: "#374151",
      };
    }

    return {
      background: "#e0e7ff",
      color: "#3730a3",
    };
  };

  // ============================================================
  // APPLY LEAVE
  // ============================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!startDate || !endDate) {
      setError("Please select both start date and end date.");
      return;
    }

    if (endDate < startDate) {
      setError("End date cannot be earlier than start date.");
      return;
    }

    if (!reason.trim()) {
      setError("Please enter a reason for the leave.");
      return;
    }

    try {
      setSubmitting(true);

      await createLeaveRequest({
        leave_type_id: Number(leaveTypeId),
        start_date: startDate,
        end_date: endDate,
        reason: reason.trim(),
      });

      setSuccess(
        "Leave request submitted successfully."
      );

      setStartDate("");
      setEndDate("");
      setReason("");

      await loadLeaveRequests();
    } catch (err) {
      console.error("Leave creation failed:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to create leave request."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================
  // CANCEL LEAVE
  // ============================================================

  const handleCancel = async (leaveId) => {
    try {
      setProcessingId(leaveId);
      setError("");
      setSuccess("");

      await cancelLeaveRequest(leaveId);

      setSuccess(
        "Leave request cancelled successfully."
      );

      await loadLeaveRequests();
    } catch (err) {
      console.error("Leave cancellation failed:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to cancel leave request."
      );
    } finally {
      setProcessingId(null);
    }
  };

  // ============================================================
  // APPROVE LEAVE
  // ============================================================

  const handleApprove = async (leaveId) => {
    try {
      setProcessingId(leaveId);
      setError("");
      setSuccess("");

      await approveLeaveRequest(leaveId);

      setSuccess(
        "Leave request approved successfully."
      );

      await loadLeaveRequests();
    } catch (err) {
      console.error("Leave approval failed:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to approve leave request."
      );
    } finally {
      setProcessingId(null);
    }
  };

  // ============================================================
  // REJECT LEAVE
  // ============================================================

  const handleReject = async (leaveId) => {
    try {
      setProcessingId(leaveId);
      setError("");
      setSuccess("");

      await rejectLeaveRequest(leaveId);

      setSuccess(
        "Leave request rejected successfully."
      );

      await loadLeaveRequests();
    } catch (err) {
      console.error("Leave rejection failed:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to reject leave request."
      );
    } finally {
      setProcessingId(null);
    }
  };

  // ============================================================
  // SUMMARY
  // ============================================================

  const summary = useMemo(() => {
    return {
      total: leaveRequests.length,

      approved: leaveRequests.filter(
        (item) =>
          String(item.status).toUpperCase() === "APPROVED"
      ).length,

      pending: leaveRequests.filter(
        (item) =>
          String(item.status).toUpperCase() === "PENDING"
      ).length,

      rejected: leaveRequests.filter(
        (item) =>
          String(item.status).toUpperCase() === "REJECTED"
      ).length,

      cancelled: leaveRequests.filter(
        (item) =>
          String(item.status).toUpperCase() === "CANCELLED"
      ).length,
    };
  }, [leaveRequests]);

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="leave-page">

      {/* ======================================================
          HEADER
          ====================================================== */}

      <div className="page-header">

        <div>
          <p className="page-eyebrow">
            WORKFORCE MANAGEMENT
          </p>

          <h1>Leave Management</h1>

          <p className="page-description">
            Manage employee leave requests and approvals.
          </p>
        </div>

      </div>

      {/* ======================================================
          ALERTS
          ====================================================== */}

      {success && (
        <div
          style={{
            marginBottom: "20px",
            padding: "14px 18px",
            borderRadius: "10px",
            background: "#dcfce7",
            color: "#166534",
            fontWeight: 600,
          }}
        >
          ✓ {success}
        </div>
      )}

      {error && (
        <div
          style={{
            marginBottom: "20px",
            padding: "14px 18px",
            borderRadius: "10px",
            background: "#fee2e2",
            color: "#991b1b",
            fontWeight: 600,
          }}
        >
          ! {error}
        </div>
      )}

      {/* ======================================================
          SUMMARY CARDS
          ====================================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <SummaryCard
          title="Total Requests"
          value={summary.total}
          icon="▤"
        />

        <SummaryCard
          title="Approved"
          value={summary.approved}
          icon="✓"
        />

        <SummaryCard
          title="Pending"
          value={summary.pending}
          icon="◷"
        />

        <SummaryCard
          title="Rejected"
          value={summary.rejected}
          icon="!"
        />

        <SummaryCard
          title="Cancelled"
          value={summary.cancelled}
          icon="×"
        />
      </div>

      {/* ======================================================
          APPLY LEAVE + INFO
          ====================================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "minmax(320px, 1fr) minmax(280px, 0.8fr)",
          gap: "24px",
          marginBottom: "24px",
        }}
      >

        {/* APPLY LEAVE */}

        <div className="content-card">

          <div className="card-header">
            <div>
              <h2>Apply for Leave</h2>

              <p>
                Submit a new employee leave request.
              </p>
            </div>

            <span className="card-header-badge">
              NEW REQUEST
            </span>
          </div>

          <form onSubmit={handleSubmit}>

            {/* LEAVE TYPE */}

            <div
              style={{
                marginBottom: "18px",
              }}
            >
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: 600,
                }}
              >
                Leave Type
              </label>

              <select
                value={leaveTypeId}
                onChange={(event) =>
                  setLeaveTypeId(event.target.value)
                }
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid #d1d5db",
                  fontSize: "14px",
                }}
              >
                <option value={1}>
                  Casual Leave
                </option>
              </select>
            </div>

            {/* DATES */}

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "1fr 1fr",
                gap: "16px",
                marginBottom: "18px",
              }}
            >

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: 600,
                  }}
                >
                  Start Date
                </label>

                <input
                  type="date"
                  value={startDate}
                  onChange={(event) =>
                    setStartDate(event.target.value)
                  }
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "8px",
                    border:
                      "1px solid #d1d5db",
                    fontSize: "14px",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: 600,
                  }}
                >
                  End Date
                </label>

                <input
                  type="date"
                  value={endDate}
                  onChange={(event) =>
                    setEndDate(event.target.value)
                  }
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "8px",
                    border:
                      "1px solid #d1d5db",
                    fontSize: "14px",
                  }}
                />
              </div>

            </div>

            {/* REASON */}

            <div
              style={{
                marginBottom: "18px",
              }}
            >
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: 600,
                }}
              >
                Reason
              </label>

              <textarea
                value={reason}
                onChange={(event) =>
                  setReason(event.target.value)
                }
                placeholder="Enter reason for leave"
                rows={4}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "8px",
                  border:
                    "1px solid #d1d5db",
                  fontSize: "14px",
                  resize: "vertical",
                }}
              />
            </div>

            {/* SUBMIT */}

            <button
              type="submit"
              disabled={submitting}
              style={{
                border: "none",
                borderRadius: "8px",
                padding: "12px 20px",
                background: "#111827",
                color: "#ffffff",
                fontWeight: 600,
                cursor: submitting
                  ? "not-allowed"
                  : "pointer",
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting
                ? "Submitting..."
                : "✓ Apply for Leave"}
            </button>

          </form>

        </div>

        {/* INFORMATION CARD */}

        <div className="content-card">

          <div className="card-header">

            <div>
              <h2>Leave Information</h2>

              <p>
                Current leave request status
              </p>
            </div>

            <span className="ai-badge">
              HR
            </span>

          </div>

          <div
            style={{
              padding: "10px 0",
            }}
          >

            <InfoRow
              label="Total Requests"
              value={summary.total}
            />

            <InfoRow
              label="Approved"
              value={summary.approved}
            />

            <InfoRow
              label="Pending"
              value={summary.pending}
            />

            <InfoRow
              label="Rejected"
              value={summary.rejected}
            />

            <InfoRow
              label="Cancelled"
              value={summary.cancelled}
            />

          </div>

          <div
            style={{
              marginTop: "18px",
              padding: "14px",
              borderRadius: "10px",
              background: "#cbd5e1",
              color: "#000000",
              fontSize: "13px",
              lineHeight: 1.6,
            }}
          >
            Your leave requests are sent to HR/
            management for review. Approved and
            rejected requests will appear in your
            history.
          </div>

        </div>

      </div>

      {/* ======================================================
          LEAVE HISTORY
          ====================================================== */}

      <div className="content-card">

        <div className="card-header">

          <div>
            <h2>Leave History</h2>

            <p>
              Your recent leave requests and their status.
            </p>
          </div>

        </div>

        {loading ? (

          <div
            style={{
              padding: "40px",
              textAlign: "center",
            }}
          >
            Loading leave requests...
          </div>

        ) : leaveRequests.length === 0 ? (

          <div
            style={{
              padding: "50px 20px",
              textAlign: "center",
            }}
          >

            <div
              style={{
                fontSize: "48px",
                marginBottom: "12px",
              }}
            >
              📅
            </div>

            <h3>
              No leave requests
            </h3>

            <p>
              Your leave requests will appear here.
            </p>

          </div>

        ) : (

          <div
            style={{
              overflowX: "auto",
            }}
          >

            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "900px",
              }}
            >

              <thead>

                <tr>
                  <th style={tableHeaderStyle}>
                    ID
                  </th>

                  <th style={tableHeaderStyle}>
                    Leave Type
                  </th>

                  <th style={tableHeaderStyle}>
                    Start Date
                  </th>

                  <th style={tableHeaderStyle}>
                    End Date
                  </th>

                  <th style={tableHeaderStyle}>
                    Days
                  </th>

                  <th style={tableHeaderStyle}>
                    Status
                  </th>

                  <th style={tableHeaderStyle}>
                    Reason
                  </th>

                  <th style={tableHeaderStyle}>
                    Actions
                  </th>
                </tr>

              </thead>

              <tbody>

                {leaveRequests.map((record) => {

                  const status =
                    String(
                      record.status || ""
                    ).toUpperCase();

                  const isProcessing =
                    processingId === record.id;

                  return (
                    <tr key={record.id}>

                      <td style={tableCellStyle}>
                        #{record.id}
                      </td>

                      <td style={tableCellStyle}>
                        {Number(
                          record.leave_type_id
                        ) === 1
                          ? "Casual Leave"
                          : `Leave Type ${record.leave_type_id}`}
                      </td>

                      <td style={tableCellStyle}>
                        {formatDate(
                          record.start_date
                        )}
                      </td>

                      <td style={tableCellStyle}>
                        {formatDate(
                          record.end_date
                        )}
                      </td>

                      <td style={tableCellStyle}>
                        {record.total_days}
                      </td>

                      <td style={tableCellStyle}>

                        <span
                          style={{
                            display:
                              "inline-block",
                            padding:
                              "5px 10px",
                            borderRadius:
                              "999px",
                            fontSize:
                              "12px",
                            fontWeight: 700,
                            ...getStatusStyle(
                              record.status
                            ),
                          }}
                        >
                          {status}
                        </span>

                      </td>

                      <td style={tableCellStyle}>
                        {record.reason || "-"}
                      </td>

                      <td style={tableCellStyle}>

                        <div
                          style={{
                            display:
                              "flex",
                            gap: "8px",
                            flexWrap:
                              "wrap",
                          }}
                        >

                          {/* APPROVE */}

                          {status === "PENDING" && (
                            <button
                              type="button"
                              disabled={
                                isProcessing
                              }
                              onClick={() =>
                                handleApprove(
                                  record.id
                                )
                              }
                              style={{
                                border:
                                  "none",
                                borderRadius:
                                  "6px",
                                padding:
                                  "7px 11px",
                                background:
                                  "#16a34a",
                                color:
                                  "#ffffff",
                                cursor:
                                  "pointer",
                                fontSize:
                                  "12px",
                                fontWeight:
                                  600,
                                opacity:
                                  isProcessing
                                    ? 0.6
                                    : 1,
                              }}
                            >
                              Approve
                            </button>
                          )}

                          {/* REJECT */}

                          {status === "PENDING" && (
                            <button
                              type="button"
                              disabled={
                                isProcessing
                              }
                              onClick={() =>
                                handleReject(
                                  record.id
                                )
                              }
                              style={{
                                border:
                                  "none",
                                borderRadius:
                                  "6px",
                                padding:
                                  "7px 11px",
                                background:
                                  "#dc2626",
                                color:
                                  "#ffffff",
                                cursor:
                                  "pointer",
                                fontSize:
                                  "12px",
                                fontWeight:
                                  600,
                                opacity:
                                  isProcessing
                                    ? 0.6
                                    : 1,
                              }}
                            >
                              Reject
                            </button>
                          )}

                          {/* CANCEL */}

                          {status === "PENDING" && (
                            <button
                              type="button"
                              disabled={
                                isProcessing
                              }
                              onClick={() =>
                                handleCancel(
                                  record.id
                                )
                              }
                              style={{
                                border:
                                  "1px solid #d1d5db",
                                borderRadius:
                                  "6px",
                                padding:
                                  "7px 11px",
                                background:
                                  "#ffffff",
                                color:
                                  "#374151",
                                cursor:
                                  "pointer",
                                fontSize:
                                  "12px",
                                fontWeight:
                                  600,
                                opacity:
                                  isProcessing
                                    ? 0.6
                                    : 1,
                              }}
                            >
                              Cancel
                            </button>
                          )}

                          {status !== "PENDING" && (
                            <span
                              style={{
                                color:
                                  "#6b7280",
                                fontSize:
                                  "12px",
                              }}
                            >
                              No actions
                            </span>
                          )}

                        </div>

                      </td>

                    </tr>
                  );
                })}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>
  );
};

// ============================================================
// SUMMARY CARD
// ============================================================

const SummaryCard = ({
  title,
  value,
  icon,
}) => {
  return (
    <div className="content-card">

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent:
            "space-between",
          gap: "12px",
        }}
      >

        <div>

          <div
            style={{
              color: "#6b7280",
              fontSize: "13px",
              marginBottom: "8px",
            }}
          >
            {title}
          </div>

          <div
            style={{
              fontSize: "30px",
              fontWeight: 700,
            }}
          >
            {value}
          </div>

        </div>

        <div
          style={{
            width: "42px",
            height: "42px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "10px",
            background: "#1e293b",
            color: "#ffffff",
            fontSize: "20px",
            fontWeight: "700",
          }}
        >
          {icon}
        </div>

      </div>

    </div>
  );
};

// ============================================================
// INFO ROW
// ============================================================

const InfoRow = ({
  label,
  value,
}) => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent:
          "space-between",
        alignItems: "center",
        padding: "12px 0",
        borderBottom:
          "1px solid #e5e7eb",
      }}
    >

      <span
        style={{
          color: "#6b7280",
        }}
      >
        {label}
      </span>

      <strong>
        {value}
      </strong>

    </div>
  );
};

// ============================================================
// TABLE STYLES
// ============================================================

const tableHeaderStyle = {
  textAlign: "left",
  padding: "13px 12px",
  borderBottom: "1px solid #e5e7eb",
  color: "#6b7280",
  fontSize: "12px",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  whiteSpace: "nowrap",
};

const tableCellStyle = {
  padding: "14px 12px",
  borderBottom: "1px solid #f3f4f6",
  fontSize: "13px",
  verticalAlign: "middle",
};

export default LeaveManagement;