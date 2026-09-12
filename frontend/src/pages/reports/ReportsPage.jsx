import React, {
  useEffect,
  useState,
} from "react";

import reportsService from "../../services/reportsService";

export default function ReportsPage() {
  const [reports, setReports] = useState({
    workforce: null,
    attendance: null,
    leave: null,
    payroll: null,
    attrition: null,
    stability: null,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadReports = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        workforce,
        attendance,
        leave,
        payroll,
        attrition,
        stability,
      ] = await Promise.all([
        reportsService.getWorkforceReport(),
        reportsService.getAttendanceReport(),
        reportsService.getLeaveReport(),
        reportsService.getPayrollReport(),
        reportsService.getAttritionReport(),
        reportsService.getWorkforceStabilityReport(),
      ]);

      setReports({
        workforce,
        attendance,
        leave,
        payroll,
        attrition,
        stability,
      });
    } catch (err) {
      console.error(
        "Reports loading failed:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Unable to load reports."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setError("");
      setSuccess("");

      const [
        workforce,
        attendance,
        leave,
        payroll,
        attrition,
        stability,
      ] = await Promise.all([
        reportsService.getWorkforceReport(),
        reportsService.getAttendanceReport(),
        reportsService.getLeaveReport(),
        reportsService.getPayrollReport(),
        reportsService.getAttritionReport(),
        reportsService.getWorkforceStabilityReport(),
      ]);

      setReports({
        workforce,
        attendance,
        leave,
        payroll,
        attrition,
        stability,
      });

      setSuccess(
        "Reports refreshed successfully."
      );
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.detail ||
          "Unable to refresh reports."
      );
    } finally {
      setRefreshing(false);
    }
  };

  const downloadBlob = (
    response,
    fileName
  ) => {
    const blob = new Blob(
      [response.data],
      {
        type:
          response.headers?.["content-type"] ||
          "application/octet-stream",
      }
    );

    const url =
      window.URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;
    link.setAttribute(
      "download",
      fileName
    );

    document.body.appendChild(link);

    link.click();

    link.remove();

    window.URL.revokeObjectURL(url);
  };

  const handleExport = async (
    reportType
  ) => {
    try {
      setExporting(reportType);
      setError("");
      setSuccess("");

      let response;
      let fileName;

      switch (reportType) {
        case "workforce":
          response =
            await reportsService.exportWorkforce();

          fileName =
            "workforce-report";
          break;

        case "attendance":
          response =
            await reportsService.exportAttendance();

          fileName =
            "attendance-report";
          break;

        case "leave":
          response =
            await reportsService.exportLeave();

          fileName =
            "leave-report";
          break;

        case "payroll":
          response =
            await reportsService.exportPayroll();

          fileName =
            "payroll-report";
          break;

        case "attrition":
          response =
            await reportsService.exportAttrition();

          fileName =
            "attrition-report";
          break;

        default:
          throw new Error(
            "Unknown report type."
          );
      }

      const contentType =
        response.headers?.[
          "content-type"
        ] || "";

      let extension = "csv";

      if (
        contentType.includes(
          "spreadsheet"
        ) ||
        contentType.includes(
          "excel"
        )
      ) {
        extension = "xlsx";
      }

      if (
        contentType.includes(
          "pdf"
        )
      ) {
        extension = "pdf";
      }

      downloadBlob(
        response,
        `${fileName}.${extension}`
      );

      setSuccess(
        `${fileName} exported successfully.`
      );
    } catch (err) {
      console.error(
        "Report export failed:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Unable to export report."
      );
    } finally {
      setExporting("");
    }
  };

  const formatCurrency = (
    value
  ) => {
    return `₹${Number(
      value || 0
    ).toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const formatDateTime = (
    value
  ) => {
    if (!value) {
      return "-";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return value;
    }

    return date.toLocaleString(
      "en-IN"
    );
  };

  if (loading) {
    return (
      <div className="reports-page">
        <style>
          {reportsStyles}
        </style>

        <div className="reports-loading">

          <div className="reports-spinner"></div>

          <h2>
            Loading reports...
          </h2>

          <p>
            Preparing the latest workforce
            reports and summaries.
          </p>

        </div>
      </div>
    );
  }

  return (
    <div className="reports-page">

      <style>
        {reportsStyles}
      </style>

      {/* =====================================================
          HEADER
          ===================================================== */}

      <div className="reports-header">

        <div>

          <div className="reports-eyebrow">
            WORKFORCE REPORTING
          </div>

          <h1>
            Reports
          </h1>

          <p>
            View workforce reports and export
            HR data for analysis, management
            and decision-making.
          </p>

        </div>

        <button
          type="button"
          className="reports-refresh"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing
            ? "Refreshing..."
            : "↻ Refresh"}
        </button>

      </div>

      {/* =====================================================
          MESSAGES
          ===================================================== */}

      {error && (
        <div className="reports-error">
          {error}
        </div>
      )}

      {success && (
        <div className="reports-success">
          {success}
        </div>
      )}

      {/* =====================================================
          OVERVIEW CARDS
          ===================================================== */}

      <div className="reports-overview-grid">

        <OverviewCard
          title="Employees"
          value={
            reports.workforce
              ?.total_employees ?? 0
          }
          detail={
            `${
              reports.workforce
                ?.active_employees ?? 0
            } active`
          }
          icon="♙"
          className="overview-blue"
        />

        <OverviewCard
          title="Attendance Rate"
          value={
            `${Number(
              reports.attendance
                ?.attendance_percentage ??
                0
            ).toFixed(0)}%`
          }
          detail={
            `${
              reports.attendance
                ?.total_records ?? 0
            } records`
          }
          icon="◷"
          className="overview-green"
        />

        <OverviewCard
          title="Leave Requests"
          value={
            reports.leave
              ?.total_requests ?? 0
          }
          detail={
            `${
              reports.leave
                ?.approved ?? 0
            } approved`
          }
          icon="✓"
          className="overview-orange"
        />

        <OverviewCard
          title="Payroll Net"
          value={
            formatCurrency(
              reports.payroll
                ?.total_net_salary
            )
          }
          detail={
            `${
              reports.payroll
                ?.paid ?? 0
            } paid`
          }
          icon="₹"
          className="overview-purple"
        />

        <OverviewCard
          title="Attrition Risk"
          value={
            `${Number(
              reports.attrition
                ?.average_attrition_probability ??
                0
            ).toFixed(2)}%`
          }
          detail={
            `${
              reports.attrition
                ?.monitored_employees ??
                0
            } monitored`
          }
          icon="△"
          className="overview-red"
        />

      </div>

      {/* =====================================================
          REPORT CARDS
          ===================================================== */}

      <div className="reports-section">

        <div className="section-title">

          <div>
            <h2>
              Available Reports
            </h2>

            <p>
              Preview the latest data and
              export reports when needed.
            </p>
          </div>

        </div>

        <div className="report-card-grid">

          {/* WORKFORCE */}

          <ReportCard
            title="Workforce Report"
            icon="♙"
            type="WORKFORCE"
            generatedAt={
              reports.workforce
                ?.generated_at
            }
            onExport={() =>
              handleExport(
                "workforce"
              )
            }
            exporting={
              exporting ===
              "workforce"
            }
          >

            <StatLine
              label="Total Employees"
              value={
                reports.workforce
                  ?.total_employees
              }
            />

            <StatLine
              label="Active Employees"
              value={
                reports.workforce
                  ?.active_employees
              }
            />

            <StatLine
              label="On Leave"
              value={
                reports.workforce
                  ?.on_leave
              }
            />

            <StatLine
              label="Resigned"
              value={
                reports.workforce
                  ?.resigned
              }
            />

            <StatLine
              label="Terminated"
              value={
                reports.workforce
                  ?.terminated
              }
            />

          </ReportCard>

          {/* ATTENDANCE */}

          <ReportCard
            title="Attendance Report"
            icon="◷"
            type="ATTENDANCE"
            generatedAt={
              reports.attendance
                ?.generated_at
            }
            onExport={() =>
              handleExport(
                "attendance"
              )
            }
            exporting={
              exporting ===
              "attendance"
            }
          >

            <StatLine
              label="Total Records"
              value={
                reports.attendance
                  ?.total_records
              }
            />

            <StatLine
              label="Present Days"
              value={
                reports.attendance
                  ?.present_days
              }
              valueClass="success-value"
            />

            <StatLine
              label="Late Days"
              value={
                reports.attendance
                  ?.late_days
              }
            />

            <StatLine
              label="Half Days"
              value={
                reports.attendance
                  ?.half_days
              }
            />

            <StatLine
              label="Absent Days"
              value={
                reports.attendance
                  ?.absent_days
              }
              valueClass="danger-value"
            />

            <div className="report-highlight green">

              <span>
                Attendance Percentage
              </span>

              <strong>
                {
                  reports.attendance
                    ?.attendance_percentage
                }%
              </strong>

            </div>

          </ReportCard>

          {/* LEAVE */}

          <ReportCard
            title="Leave Report"
            icon="✓"
            type="LEAVE"
            generatedAt={
              reports.leave
                ?.generated_at
            }
            onExport={() =>
              handleExport(
                "leave"
              )
            }
            exporting={
              exporting ===
              "leave"
            }
          >

            <StatLine
              label="Total Requests"
              value={
                reports.leave
                  ?.total_requests
              }
            />

            <StatLine
              label="Approved"
              value={
                reports.leave
                  ?.approved
              }
              valueClass="success-value"
            />

            <StatLine
              label="Pending"
              value={
                reports.leave
                  ?.pending
              }
              valueClass="warning-value"
            />

            <StatLine
              label="Rejected"
              value={
                reports.leave
                  ?.rejected
              }
              valueClass="danger-value"
            />

            <StatLine
              label="Cancelled"
              value={
                reports.leave
                  ?.cancelled
              }
            />

          </ReportCard>

          {/* PAYROLL */}

          <ReportCard
            title="Payroll Report"
            icon="₹"
            type="PAYROLL"
            generatedAt={
              reports.payroll
                ?.generated_at
            }
            onExport={() =>
              handleExport(
                "payroll"
              )
            }
            exporting={
              exporting ===
              "payroll"
            }
          >

            <StatLine
              label="Total Records"
              value={
                reports.payroll
                  ?.total_records
              }
            />

            <StatLine
              label="Pending"
              value={
                reports.payroll
                  ?.pending
              }
              valueClass="warning-value"
            />

            <StatLine
              label="Processed"
              value={
                reports.payroll
                  ?.processed
              }
            />

            <StatLine
              label="Paid"
              value={
                reports.payroll
                  ?.paid
              }
              valueClass="success-value"
            />

            <div className="salary-report-box">

              <div>
                <span>
                  Gross Salary
                </span>

                <strong>
                  {formatCurrency(
                    reports.payroll
                      ?.total_gross_salary
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Net Salary
                </span>

                <strong>
                  {formatCurrency(
                    reports.payroll
                      ?.total_net_salary
                  )}
                </strong>
              </div>

            </div>

          </ReportCard>

          {/* ATTRITION */}

          <ReportCard
            title="Attrition Report"
            icon="△"
            type="ATTRITION"
            generatedAt={
              reports.attrition
                ?.generated_at
            }
            onExport={() =>
              handleExport(
                "attrition"
              )
            }
            exporting={
              exporting ===
              "attrition"
            }
          >

            <StatLine
              label="Total Employees"
              value={
                reports.attrition
                  ?.total_employees
              }
            />

            <StatLine
              label="Monitored"
              value={
                reports.attrition
                  ?.monitored_employees
              }
            />

            <StatLine
              label="Low Risk"
              value={
                reports.attrition
                  ?.low_risk
              }
              valueClass="success-value"
            />

            <StatLine
              label="Medium Risk"
              value={
                reports.attrition
                  ?.medium_risk
              }
              valueClass="warning-value"
            />

            <StatLine
              label="High Risk"
              value={
                reports.attrition
                  ?.high_risk
              }
              valueClass="danger-value"
            />

            <StatLine
              label="Critical Risk"
              value={
                reports.attrition
                  ?.critical_risk
              }
              valueClass="danger-value"
            />

            <div className="report-highlight red">

              <span>
                Average Attrition Probability
              </span>

              <strong>
                {
                  reports.attrition
                    ?.average_attrition_probability
                }%
              </strong>

            </div>

          </ReportCard>

        </div>

      </div>

      {/* =====================================================
          WORKFORCE STABILITY
          ===================================================== */}

      <div className="stability-panel">

        <div className="stability-icon">
          ✓
        </div>

        <div className="stability-content">

          <div className="stability-title-row">

            <div>

              <span className="stability-eyebrow">
                WORKFORCE STABILITY REPORT
              </span>

              <h2>
                {
                  reports.stability
                    ?.stability_status ||
                  "STABLE"
                }
              </h2>

            </div>

            <span className="stable-badge">
              STABLE
            </span>

          </div>

          <p>
            Workforce stability is currently
            monitored across attrition risk,
            interventions and unresolved alerts.
          </p>

          <div className="stability-metrics">

            <div>
              <span>
                Total Employees
              </span>

              <strong>
                {
                  reports.stability
                    ?.total_employees
                }
              </strong>
            </div>

            <div>
              <span>
                High Risk
              </span>

              <strong>
                {
                  reports.stability
                    ?.high_risk_employees
                }
              </strong>
            </div>

            <div>
              <span>
                Critical Risk
              </span>

              <strong>
                {
                  reports.stability
                    ?.critical_risk_employees
                }
              </strong>
            </div>

            <div>
              <span>
                Active Interventions
              </span>

              <strong>
                {
                  reports.stability
                    ?.active_interventions
                }
              </strong>
            </div>

            <div>
              <span>
                Unresolved Alerts
              </span>

              <strong>
                {
                  reports.stability
                    ?.unresolved_alerts
                }
              </strong>
            </div>

            <div>
              <span>
                Estimated Attrition
              </span>

              <strong>
                {
                  reports.stability
                    ?.estimated_attrition_rate
                }%
              </strong>
            </div>

          </div>

          <div className="stability-updated">
            Generated:{" "}
            {formatDateTime(
              reports.stability
                ?.generated_at
            )}
          </div>

        </div>

      </div>

      {/* =====================================================
          INFO
          ===================================================== */}

      <div className="reports-info">

        <div className="reports-info-icon">
          i
        </div>

        <div>

          <strong>
            Report Data
          </strong>

          <p>
            Report previews are loaded directly
            from the WorkForce AI Pro backend.
            Export buttons use the dedicated
            report export APIs.
          </p>

        </div>

      </div>

    </div>
  );
}

/* ============================================================
   OVERVIEW CARD
   ============================================================ */

function OverviewCard({
  title,
  value,
  detail,
  icon,
  className,
}) {
  return (
    <div
      className={`overview-card ${className}`}
    >

      <div className="overview-top">

        <span>
          {title}
        </span>

        <div className="overview-icon">
          {icon}
        </div>

      </div>

      <strong>
        {value}
      </strong>

      <small>
        {detail}
      </small>

    </div>
  );
}

/* ============================================================
   REPORT CARD
   ============================================================ */

function ReportCard({
  title,
  icon,
  type,
  generatedAt,
  onExport,
  exporting,
  children,
}) {
  return (
    <div className="report-card">

      <div className="report-card-header">

        <div className="report-title">

          <div className="report-icon">
            {icon}
          </div>

          <div>

            <h3>
              {title}
            </h3>

            <span>
              {type}
            </span>

          </div>

        </div>

        <span className="report-live">
          LIVE
        </span>

      </div>

      <div className="report-stats">
        {children}
      </div>

      <div className="report-card-footer">

        <span>
          Generated{" "}
          {generatedAt
            ? new Date(
                generatedAt
              ).toLocaleString(
                "en-IN"
              )
            : "-"}
        </span>

        <button
          type="button"
          onClick={onExport}
          disabled={exporting}
          className="export-button"
        >
          {exporting
            ? "Exporting..."
            : "↓ Export"}
        </button>

      </div>

    </div>
  );
}

/* ============================================================
   STAT LINE
   ============================================================ */

function StatLine({
  label,
  value,
  valueClass = "",
}) {
  return (
    <div className="stat-line">

      <span>
        {label}
      </span>

      <strong
        className={valueClass}
      >
        {value ?? 0}
      </strong>

    </div>
  );
}

/* ============================================================
   STYLES
   ============================================================ */

const reportsStyles = `
  .reports-page {
    min-height: 100vh;
    padding: 30px;
    background: #09111f;
    color: #ffffff;
  }

  .reports-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 20px;
    margin-bottom: 26px;
  }

  .reports-eyebrow {
    color: #60a5fa;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 1.4px;
    margin-bottom: 8px;
  }

  .reports-header h1 {
    margin: 0;
    font-size: 30px;
    font-weight: 800;
  }

  .reports-header p {
    margin: 8px 0 0;
    max-width: 780px;
    color: #94a3b8;
    font-size: 15px;
    line-height: 1.6;
  }

  .reports-refresh {
    padding: 11px 18px;
    border-radius: 10px;
    border: 1px solid #334155;
    background: #111c2d;
    color: #ffffff;
    cursor: pointer;
    font-weight: 700;
  }

  .reports-refresh:hover {
    background: #17253a;
  }

  .reports-refresh:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .reports-error,
  .reports-success {
    margin-bottom: 18px;
    padding: 13px 16px;
    border-radius: 10px;
  }

  .reports-error {
    background: #450a0a;
    border: 1px solid #7f1d1d;
    color: #fecaca;
  }

  .reports-success {
    background: #052e26;
    border: 1px solid #065f46;
    color: #a7f3d0;
  }

  .reports-overview-grid {
    display: grid;
    grid-template-columns:
      repeat(5, minmax(0, 1fr));
    gap: 16px;
    margin-bottom: 24px;
  }

  .overview-card {
    min-height: 125px;
    padding: 19px;
    border-radius: 15px;
    background: #111c2d;
    border: 1px solid #263850;
    box-shadow: 0 10px 25px rgba(0,0,0,0.18);
  }

  .overview-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
  }

  .overview-top > span {
    color: #cbd5e1;
    font-size: 13px;
    font-weight: 600;
  }

  .overview-icon {
    width: 35px;
    height: 35px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    background: #0b1628;
    font-weight: 800;
  }

  .overview-card > strong {
    display: block;
    margin-top: 14px;
    color: #ffffff;
    font-size: 27px;
  }

  .overview-card > small {
    display: block;
    margin-top: 6px;
    color: #64748b;
    font-size: 11px;
  }

  .overview-blue {
    border-top: 3px solid #3b82f6;
  }

  .overview-green {
    border-top: 3px solid #10b981;
  }

  .overview-orange {
    border-top: 3px solid #f59e0b;
  }

  .overview-purple {
    border-top: 3px solid #8b5cf6;
  }

  .overview-red {
    border-top: 3px solid #ef4444;
  }

  .reports-section {
    margin-bottom: 20px;
  }

  .section-title {
    margin-bottom: 15px;
  }

  .section-title h2 {
    margin: 0;
    font-size: 20px;
  }

  .section-title p {
    margin: 6px 0 0;
    color: #94a3b8;
    font-size: 13px;
  }

  .report-card-grid {
    display: grid;
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
    gap: 20px;
  }

  .report-card {
    padding: 21px;
    border-radius: 16px;
    background: #111c2d;
    border: 1px solid #263850;
    box-shadow: 0 10px 25px rgba(0,0,0,0.16);
  }

  .report-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 15px;
    padding-bottom: 15px;
    border-bottom: 1px solid #24344c;
  }

  .report-title {
    display: flex;
    align-items: center;
    gap: 11px;
  }

  .report-icon {
    width: 40px;
    height: 40px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 11px;
    background: #172554;
    color: #93c5fd;
    font-weight: 800;
    font-size: 17px;
  }

  .report-title h3 {
    margin: 0 0 4px;
    color: #ffffff;
    font-size: 16px;
  }

  .report-title span {
    color: #64748b;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.7px;
  }

  .report-live {
    padding: 6px 9px;
    border-radius: 8px;
    background: #052e26;
    color: #6ee7b7;
    font-size: 9px;
    font-weight: 800;
  }

  .report-stats {
    display: grid;
    gap: 8px;
    padding: 16px 0;
  }

  .stat-line {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding: 9px 11px;
    border-radius: 8px;
    background: #0b1628;
    border: 1px solid #1e293b;
  }

  .stat-line span {
    color: #94a3b8;
    font-size: 11px;
  }

  .stat-line strong {
    color: #ffffff;
    font-size: 13px;
  }

  .success-value {
    color: #6ee7b7 !important;
  }

  .warning-value {
    color: #fcd34d !important;
  }

  .danger-value {
    color: #fca5a5 !important;
  }

  .report-highlight {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-top: 3px;
    padding: 12px 13px;
    border-radius: 9px;
  }

  .report-highlight span {
    font-size: 10px;
  }

  .report-highlight strong {
    font-size: 17px;
  }

  .report-highlight.green {
    background: #052e26;
    border: 1px solid #065f46;
  }

  .report-highlight.green span {
    color: #a7f3d0;
  }

  .report-highlight.green strong {
    color: #6ee7b7;
  }

  .report-highlight.red {
    background: #3f1010;
    border: 1px solid #7f1d1d;
  }

  .report-highlight.red span {
    color: #fecaca;
  }

  .report-highlight.red strong {
    color: #fca5a5;
  }

  .salary-report-box {
    display: grid;
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
    gap: 9px;
    margin-top: 3px;
  }

  .salary-report-box > div {
    padding: 12px;
    border-radius: 9px;
    background: #0b1628;
    border: 1px solid #1e293b;
  }

  .salary-report-box span {
    display: block;
    color: #64748b;
    font-size: 10px;
  }

  .salary-report-box strong {
    display: block;
    margin-top: 5px;
    color: #ffffff;
    font-size: 14px;
  }

  .report-card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    padding-top: 14px;
    border-top: 1px solid #24344c;
  }

  .report-card-footer > span {
    color: #64748b;
    font-size: 9px;
  }

  .export-button {
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid #3b82f6;
    background: #172554;
    color: #93c5fd;
    cursor: pointer;
    font-size: 11px;
    font-weight: 700;
  }

  .export-button:hover {
    background: #1e3a8a;
  }

  .export-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .stability-panel {
    display: flex;
    align-items: flex-start;
    gap: 17px;
    padding: 22px;
    margin-bottom: 20px;
    border-radius: 16px;
    background: #111c2d;
    border: 1px solid #065f46;
    box-shadow: 0 10px 25px rgba(0,0,0,0.16);
  }

  .stability-icon {
    width: 48px;
    height: 48px;
    flex-shrink: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 13px;
    background: #052e26;
    color: #6ee7b7;
    font-size: 22px;
    font-weight: 800;
  }

  .stability-content {
    flex: 1;
  }

  .stability-title-row {
    display: flex;
    justify-content: space-between;
    gap: 20px;
    align-items: center;
  }

  .stability-eyebrow {
    color: #6ee7b7;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 1px;
  }

  .stability-title-row h2 {
    margin: 5px 0 0;
    font-size: 21px;
  }

  .stable-badge {
    padding: 7px 11px;
    border-radius: 99px;
    background: #052e26;
    color: #6ee7b7;
    font-size: 10px;
    font-weight: 800;
  }

  .stability-content > p {
    margin: 9px 0 17px;
    color: #94a3b8;
    font-size: 12px;
    line-height: 1.6;
  }

  .stability-metrics {
    display: grid;
    grid-template-columns:
      repeat(6, minmax(0, 1fr));
    gap: 9px;
  }

  .stability-metrics > div {
    padding: 12px;
    border-radius: 9px;
    background: #0b1628;
    border: 1px solid #1e293b;
  }

  .stability-metrics span {
    display: block;
    color: #64748b;
    font-size: 9px;
  }

  .stability-metrics strong {
    display: block;
    margin-top: 6px;
    color: #ffffff;
    font-size: 17px;
  }

  .stability-updated {
    margin-top: 13px;
    color: #64748b;
    font-size: 9px;
  }

  .reports-info {
    display: flex;
    align-items: flex-start;
    gap: 11px;
    padding: 15px 18px;
    border-radius: 12px;
    background: #0b1628;
    border: 1px solid #263850;
  }

  .reports-info-icon {
    width: 27px;
    height: 27px;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-shrink: 0;
    border-radius: 8px;
    background: #172554;
    color: #93c5fd;
    font-weight: 800;
  }

  .reports-info strong {
    display: block;
    color: #ffffff;
    font-size: 11px;
    margin-bottom: 4px;
  }

  .reports-info p {
    margin: 0;
    color: #64748b;
    font-size: 10px;
    line-height: 1.5;
  }

  .reports-loading {
    min-height: 65vh;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    text-align: center;
  }

  .reports-loading h2 {
    margin: 18px 0 7px;
  }

  .reports-loading p {
    margin: 0;
    color: #64748b;
  }

  .reports-spinner {
    width: 42px;
    height: 42px;
    border: 4px solid #1e293b;
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: reportsSpin 0.8s linear infinite;
  }

  @keyframes reportsSpin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 1200px) {
    .reports-overview-grid {
      grid-template-columns:
        repeat(3, minmax(0, 1fr));
    }

    .stability-metrics {
      grid-template-columns:
        repeat(3, minmax(0, 1fr));
    }
  }

  @media (max-width: 900px) {
    .reports-page {
      padding: 18px;
    }

    .reports-header {
      flex-direction: column;
    }

    .reports-overview-grid {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .report-card-grid {
      grid-template-columns: 1fr;
    }

    .stability-panel {
      flex-direction: column;
    }

    .stability-title-row {
      align-items: flex-start;
      flex-direction: column;
    }
  }

  @media (max-width: 550px) {
    .reports-overview-grid,
    .salary-report-box {
      grid-template-columns: 1fr;
    }

    .stability-metrics {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .report-card-footer {
      align-items: flex-start;
      flex-direction: column;
    }
  }
`;