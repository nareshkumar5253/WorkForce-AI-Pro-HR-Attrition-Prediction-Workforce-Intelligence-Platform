import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import analyticsService from "../../services/analyticsService";

export default function WorkforceAnalyticsPage() {
  const [dashboard, setDashboard] =
    useState(null);

  const [departments, setDepartments] =
    useState([]);

  const [attritionDashboard, setAttritionDashboard] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [departmentSearch, setDepartmentSearch] =
    useState("");

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        dashboardData,
        departmentData,
        attritionData,
      ] = await Promise.all([
        analyticsService.getDashboard(),
        analyticsService.getWorkforceByDepartment(),
        analyticsService.getAttritionDashboard(),
      ]);

      setDashboard(dashboardData);
      setDepartments(
        departmentData || []
      );
      setAttritionDashboard(
        attritionData
      );
    } catch (err) {
      console.error(
        "Workforce analytics loading failed:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Unable to load workforce analytics."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setError("");

      const [
        dashboardData,
        departmentData,
        attritionData,
      ] = await Promise.all([
        analyticsService.getDashboard(),
        analyticsService.getWorkforceByDepartment(),
        analyticsService.getAttritionDashboard(),
      ]);

      setDashboard(dashboardData);
      setDepartments(
        departmentData || []
      );
      setAttritionDashboard(
        attritionData
      );
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.detail ||
          "Unable to refresh workforce analytics."
      );
    } finally {
      setRefreshing(false);
    }
  };

  const workforce =
    dashboard?.workforce || {};

  const attendance =
    dashboard?.attendance || {};

  const attendanceRate =
    dashboard?.attendance_rate || {};

  const payroll =
    dashboard?.payroll || {};

  const leave =
    dashboard?.leave || {};

  const attritionOverview =
    attritionDashboard?.overview || {};

  const riskDistribution =
    attritionDashboard?.risk_distribution || [];

  const attritionByDepartment =
    attritionDashboard?.by_department || [];

  const attritionByRole =
    attritionDashboard?.by_role || [];

  const filteredDepartments = useMemo(() => {
    const query =
      departmentSearch
        .trim()
        .toLowerCase();

    return departments.filter(
      (department) =>
        !query ||
        String(
          department.department_name || ""
        )
          .toLowerCase()
          .includes(query)
    );
  }, [
    departments,
    departmentSearch,
  ]);

  const totalDepartmentEmployees =
    departments.reduce(
      (sum, item) =>
        sum +
        Number(
          item.employee_count || 0
        ),
      0
    );

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

  const formatPercent = (
    value
  ) => {
    return `${Number(
      value || 0
    ).toFixed(2)}%`;
  };

  const getStatusClass = (
    status
  ) => {
    switch (
      String(
        status || ""
      ).toUpperCase()
    ) {
      case "ACTIVE":
        return "analytics-active";

      case "ON LEAVE":
      case "ON_LEAVE":
        return "analytics-leave";

      case "RESIGNED":
        return "analytics-resigned";

      case "TERMINATED":
        return "analytics-terminated";

      case "RETIRED":
        return "analytics-retired";

      default:
        return "analytics-default";
    }
  };

  const getRiskClass = (
    risk
  ) => {
    switch (
      String(
        risk || ""
      ).toUpperCase()
    ) {
      case "LOW":
        return "risk-low";

      case "MEDIUM":
        return "risk-medium";

      case "HIGH":
        return "risk-high";

      case "CRITICAL":
        return "risk-critical";

      default:
        return "risk-default";
    }
  };

  const getBarWidth = (
    value,
    maximum
  ) => {
    if (!maximum) {
      return "0%";
    }

    return `${Math.min(
      (Number(value || 0) /
        maximum) *
        100,
      100
    )}%`;
  };

  if (loading) {
    return (
      <div className="analytics-page">
        <style>
          {analyticsStyles}
        </style>

        <div className="analytics-loading">

          <div className="analytics-spinner"></div>

          <h2>
            Loading workforce analytics...
          </h2>

          <p>
            Fetching workforce intelligence
            and performance metrics.
          </p>

        </div>
      </div>
    );
  }

  return (
    <div className="analytics-page">

      <style>
        {analyticsStyles}
      </style>

      {/* =====================================================
          HEADER
          ===================================================== */}

      <div className="analytics-header">

        <div>

          <div className="analytics-eyebrow">
            WORKFORCE INTELLIGENCE
          </div>

          <h1>
            Workforce Analytics
          </h1>

          <p>
            Analyze workforce composition,
            attendance, payroll, leave and
            AI-powered attrition intelligence.
          </p>

        </div>

        <button
          type="button"
          className="analytics-refresh"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing
            ? "Refreshing..."
            : "↻ Refresh"}
        </button>

      </div>

      {/* =====================================================
          ERROR
          ===================================================== */}

      {error && (
        <div className="analytics-error">
          {error}
        </div>
      )}

      {/* =====================================================
          KPI CARDS
          ===================================================== */}

      <div className="analytics-kpi-grid">

        <AnalyticsKpi
          title="Total Employees"
          value={
            workforce.total_employees
          }
          description={`${workforce.active_employees || 0} active employees`}
          icon="♙"
          className="kpi-blue"
        />

        <AnalyticsKpi
          title="Attendance Rate"
          value={
            `${Number(
              attendanceRate.attendance_rate ??
                0
            ).toFixed(0)}%`
          }
          description={`${attendance.present || 0} present records`}
          icon="◷"
          className="kpi-green"
        />

        <AnalyticsKpi
          title="Payroll Net"
          value={formatCurrency(
            payroll.total_net_salary
          )}
          description={`${payroll.paid || 0} paid records`}
          icon="₹"
          className="kpi-purple"
        />

        <AnalyticsKpi
          title="Leave Requests"
          value={
            leave.total_requests
          }
          description={`${leave.approved || 0} approved`}
          icon="✓"
          className="kpi-orange"
        />

        <AnalyticsKpi
          title="Attrition Risk"
          value={formatPercent(
            attritionOverview.average_attrition_probability
          )}
          description={`${attritionOverview.monitored_employees || 0} monitored`}
          icon="△"
          className="kpi-red"
        />

      </div>

      {/* =====================================================
          WORKFORCE + ATTRITION
          ===================================================== */}

      <div className="analytics-two-column">

        {/* WORKFORCE DISTRIBUTION */}

        <div className="analytics-panel">

          <div className="analytics-panel-header">

            <div>
              <h2>
                Workforce Distribution
              </h2>

              <p>
                Current workforce status
              </p>
            </div>

            <span className="analytics-live">
              LIVE DATA
            </span>

          </div>

          <div className="workforce-grid">

            <DistributionItem
              label="Active"
              value={
                workforce.active_employees
              }
              total={
                workforce.total_employees
              }
              className="distribution-active"
            />

            <DistributionItem
              label="On Leave"
              value={
                workforce.on_leave_employees
              }
              total={
                workforce.total_employees
              }
              className="distribution-leave"
            />

            <DistributionItem
              label="Resigned"
              value={
                workforce.resigned_employees
              }
              total={
                workforce.total_employees
              }
              className="distribution-resigned"
            />

            <DistributionItem
              label="Terminated"
              value={
                workforce.terminated_employees
              }
              total={
                workforce.total_employees
              }
              className="distribution-terminated"
            />

            <DistributionItem
              label="Retired"
              value={
                workforce.retired_employees
              }
              total={
                workforce.total_employees
              }
              className="distribution-retired"
            />

          </div>

          <div className="workforce-total-box">

            <span>
              Total workforce
            </span>

            <strong>
              {
                workforce.total_employees
              }
            </strong>

          </div>

        </div>

        {/* ATTRITION OVERVIEW */}

        <div className="analytics-panel">

          <div className="analytics-panel-header">

            <div>
              <h2>
                Attrition Intelligence
              </h2>

              <p>
                AI-predicted workforce risk
              </p>
            </div>

            <span className="analytics-ai">
              AI
            </span>

          </div>

          <div className="attrition-main">

            <div className="attrition-main-score">
              <span>
                Average probability
              </span>

              <strong>
                {formatPercent(
                  attritionOverview.average_attrition_probability
                )}
              </strong>
            </div>

            <div className="attrition-main-stats">

              <div>
                <span>
                  Monitored
                </span>

                <strong>
                  {
                    attritionOverview.monitored_employees
                  }
                </strong>
              </div>

              <div>
                <span>
                  Unmonitored
                </span>

                <strong>
                  {
                    attritionOverview.unmonitored_employees
                  }
                </strong>
              </div>

              <div>
                <span>
                  High/Critical
                </span>

                <strong className="attrition-danger">
                  {
                    attritionOverview.total_high_or_critical
                  }
                </strong>
              </div>

            </div>

          </div>

          <div className="risk-distribution">

            {riskDistribution.map(
              (item) => (
                <div
                  className="risk-distribution-row"
                  key={
                    item.risk_level
                  }
                >

                  <div className="risk-distribution-label">

                    <span
                      className={`risk-dot ${getRiskClass(
                        item.risk_level
                      )}`}
                    ></span>

                    <span>
                      {
                        item.risk_level
                      }
                    </span>

                  </div>

                  <strong>
                    {
                      item.employee_count
                    }
                  </strong>

                </div>
              )
            )}

          </div>

        </div>

      </div>

      {/* =====================================================
          DEPARTMENT ANALYTICS
          ===================================================== */}

      <div className="analytics-panel department-panel">

        <div className="analytics-panel-header">

          <div>
            <h2>
              Workforce by Department
            </h2>

            <p>
              Employee distribution across
              organizational departments.
            </p>
          </div>

          <div className="analytics-count">
            {
              totalDepartmentEmployees
            }{" "}
            employees
          </div>

        </div>

        <div className="analytics-search">

          <span>
            ⌕
          </span>

          <input
            type="text"
            placeholder="Search department..."
            value={
              departmentSearch
            }
            onChange={(
              event
            ) =>
              setDepartmentSearch(
                event.target.value
              )
            }
          />

        </div>

        {filteredDepartments.length ===
        0 ? (
          <div className="analytics-empty">
            No department data found.
          </div>
        ) : (
          <div className="department-list">

            {filteredDepartments.map(
              (department) => {

                const maximum =
                  Math.max(
                    ...departments.map(
                      (item) =>
                        Number(
                          item.employee_count ||
                            0
                        )
                    ),
                    1
                  );

                return (
                  <div
                    className="department-row"
                    key={
                      department.department_id
                    }
                  >

                    <div className="department-name-box">

                      <div className="department-icon">
                        {String(
                          department.department_name ||
                            "D"
                        )
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div>
                        <strong>
                          {
                            department.department_name
                          }
                        </strong>

                        <span>
                          Department #
                          {
                            department.department_id
                          }
                        </span>
                      </div>

                    </div>

                    <div className="department-progress">

                      <div className="department-progress-top">

                        <span>
                          Employee count
                        </span>

                        <strong>
                          {
                            department.employee_count
                          }
                        </strong>

                      </div>

                      <div className="department-bar">
                        <div
                          className="department-bar-fill"
                          style={{
                            width:
                              getBarWidth(
                                department.employee_count,
                                maximum
                              ),
                          }}
                        ></div>
                      </div>

                    </div>

                  </div>
                );
              }
            )}

          </div>
        )}

      </div>

      {/* =====================================================
          ATTENDANCE / PAYROLL / LEAVE
          ===================================================== */}

      <div className="analytics-three-column">

        {/* ATTENDANCE */}

        <div className="analytics-panel">

          <div className="analytics-panel-header">
            <div>
              <h2>
                Attendance
              </h2>

              <p>
                Attendance record summary
              </p>
            </div>
          </div>

          <div className="metric-list">

            <MetricRow
              label="Total Records"
              value={
                attendance.total_records
              }
            />

            <MetricRow
              label="Present"
              value={
                attendance.present
              }
              className="metric-green"
            />

            <MetricRow
              label="Half Day"
              value={
                attendance.half_day
              }
              className="metric-orange"
            />

            <MetricRow
              label="Late"
              value={
                attendance.late
              }
            />

            <MetricRow
              label="Absent"
              value={
                attendance.absent
              }
              className="metric-red"
            />

          </div>

          <div className="analytics-highlight green-highlight">
            <span>
              Attendance Rate
            </span>

            <strong>
              {Number(
                attendanceRate.attendance_rate ??
                  0
              ).toFixed(0)}
              %
            </strong>
          </div>

        </div>

        {/* PAYROLL */}

        <div className="analytics-panel">

          <div className="analytics-panel-header">
            <div>
              <h2>
                Payroll
              </h2>

              <p>
                Compensation overview
              </p>
            </div>
          </div>

          <div className="metric-list">

            <MetricRow
              label="Total Records"
              value={
                payroll.total_records
              }
            />

            <MetricRow
              label="Pending"
              value={
                payroll.pending
              }
              className="metric-orange"
            />

            <MetricRow
              label="Processed"
              value={
                payroll.processed
              }
            />

            <MetricRow
              label="Paid"
              value={
                payroll.paid
              }
              className="metric-green"
            />

          </div>

          <div className="salary-box">

            <div>
              <span>
                Gross Salary
              </span>

              <strong>
                {formatCurrency(
                  payroll.total_gross_salary
                )}
              </strong>
            </div>

            <div>
              <span>
                Net Salary
              </span>

              <strong>
                {formatCurrency(
                  payroll.total_net_salary
                )}
              </strong>
            </div>

          </div>

        </div>

        {/* LEAVE */}

        <div className="analytics-panel">

          <div className="analytics-panel-header">
            <div>
              <h2>
                Leave Management
              </h2>

              <p>
                Leave request distribution
              </p>
            </div>
          </div>

          <div className="metric-list">

            <MetricRow
              label="Total Requests"
              value={
                leave.total_requests
              }
            />

            <MetricRow
              label="Approved"
              value={
                leave.approved
              }
              className="metric-green"
            />

            <MetricRow
              label="Pending"
              value={
                leave.pending
              }
              className="metric-orange"
            />

            <MetricRow
              label="Rejected"
              value={
                leave.rejected
              }
              className="metric-red"
            />

            <MetricRow
              label="Cancelled"
              value={
                leave.cancelled
              }
            />

          </div>

          <div className="analytics-highlight orange-highlight">

            <span>
              Approval Rate
            </span>

            <strong>
              {leave.total_requests > 0
                ? (
                    (Number(
                      leave.approved || 0
                    ) /
                      Number(
                        leave.total_requests
                      )) *
                    100
                  ).toFixed(0)
                : 0}
              %
            </strong>

          </div>

        </div>

      </div>

      {/* =====================================================
          ATTRITION DEPARTMENT ANALYSIS
          ===================================================== */}

      <div className="analytics-two-column">

        <div className="analytics-panel">

          <div className="analytics-panel-header">

            <div>
              <h2>
                Attrition by Department
              </h2>

              <p>
                AI risk distribution by department.
              </p>
            </div>

          </div>

          {attritionByDepartment.length ===
          0 ? (
            <div className="analytics-empty">
              No attrition department data available.
            </div>
          ) : (
            <div className="attrition-analysis-list">

              {attritionByDepartment.map(
                (item) => (
                  <div
                    className="attrition-analysis-row"
                    key={
                      item.department
                    }
                  >

                    <div>
                      <strong>
                        {
                          item.department
                        }
                      </strong>

                      <span>
                        {
                          item.employee_count
                        }{" "}
                        employee
                        {
                          Number(
                            item.employee_count
                          ) === 1
                            ? ""
                            : "s"
                        }
                      </span>
                    </div>

                    <div className="attrition-analysis-score">

                      <strong>
                        {formatPercent(
                          item.average_attrition_probability
                        )}
                      </strong>

                      <span
                        className={`mini-risk ${getRiskClass(
                          item.risk_level
                        )}`}
                      >
                        {
                          item.risk_level
                        }
                      </span>

                    </div>

                  </div>
                )
              )}

            </div>
          )}

        </div>

        <div className="analytics-panel">

          <div className="analytics-panel-header">

            <div>
              <h2>
                Attrition by Job Role
              </h2>

              <p>
                AI risk distribution across roles.
              </p>
            </div>

          </div>

          {attritionByRole.length ===
          0 ? (
            <div className="analytics-empty">
              No attrition role data available.
            </div>
          ) : (
            <div className="attrition-analysis-list">

              {attritionByRole.map(
                (item) => (
                  <div
                    className="attrition-analysis-row"
                    key={
                      item.job_role
                    }
                  >

                    <div>
                      <strong>
                        {
                          item.job_role
                        }
                      </strong>

                      <span>
                        {
                          item.employee_count
                        }{" "}
                        employee
                        {
                          Number(
                            item.employee_count
                          ) === 1
                            ? ""
                            : "s"
                        }
                      </span>
                    </div>

                    <div className="attrition-analysis-score">

                      <strong>
                        {formatPercent(
                          item.average_attrition_probability
                        )}
                      </strong>

                      <span
                        className={`mini-risk ${getRiskClass(
                          item.risk_level
                        )}`}
                      >
                        {
                          item.risk_level
                        }
                      </span>

                    </div>

                  </div>
                )
              )}

            </div>
          )}

        </div>

      </div>

      {/* =====================================================
          FOOTER
          ===================================================== */}

      <div className="analytics-footer">

        <div>
          <strong>
            Workforce Intelligence
          </strong>

          <span>
            Analytics powered by your HR data
            and AI models.
          </span>
        </div>

        <span>
          Data refreshed from live backend APIs
        </span>

      </div>

    </div>
  );
}

/* ============================================================
   KPI CARD
   ============================================================ */

function AnalyticsKpi({
  title,
  value,
  description,
  icon,
  className,
}) {
  return (
    <div
      className={`analytics-kpi ${className}`}
    >

      <div className="kpi-top">

        <span>
          {title}
        </span>

        <div className="kpi-icon">
          {icon}
        </div>

      </div>

      <strong>
        {value}
      </strong>

      <small>
        {description}
      </small>

    </div>
  );
}

/* ============================================================
   DISTRIBUTION ITEM
   ============================================================ */

function DistributionItem({
  label,
  value,
  total,
  className,
}) {
  const percentage =
    total > 0
      ? Math.round(
          (Number(value || 0) /
            Number(total)) *
            100
        )
      : 0;

  return (
    <div
      className={`distribution-item ${className}`}
    >

      <div className="distribution-top">

        <span>
          {label}
        </span>

        <strong>
          {value || 0}
        </strong>

      </div>

      <div className="distribution-bar">
        <div
          style={{
            width: `${percentage}%`,
          }}
        ></div>
      </div>

      <small>
        {percentage}% of workforce
      </small>

    </div>
  );
}

/* ============================================================
   METRIC ROW
   ============================================================ */

function MetricRow({
  label,
  value,
  className = "",
}) {
  return (
    <div className="metric-row">

      <span>
        {label}
      </span>

      <strong
        className={className}
      >
        {value ?? 0}
      </strong>

    </div>
  );
}

/* ============================================================
   STYLES
   ============================================================ */

const analyticsStyles = `
  .analytics-page {
    min-height: 100vh;
    padding: 30px;
    background: #09111f;
    color: #ffffff;
  }

  .analytics-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 20px;
    margin-bottom: 26px;
  }

  .analytics-eyebrow {
    color: #60a5fa;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 1.4px;
    margin-bottom: 8px;
  }

  .analytics-header h1 {
    margin: 0;
    font-size: 30px;
    font-weight: 800;
  }

  .analytics-header p {
    margin: 8px 0 0;
    max-width: 800px;
    color: #94a3b8;
    font-size: 15px;
    line-height: 1.6;
  }

  .analytics-refresh {
    padding: 11px 18px;
    border-radius: 10px;
    border: 1px solid #334155;
    background: #111c2d;
    color: #ffffff;
    cursor: pointer;
    font-weight: 700;
  }

  .analytics-refresh:hover {
    background: #17253a;
  }

  .analytics-refresh:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .analytics-error {
    margin-bottom: 18px;
    padding: 13px 16px;
    border-radius: 10px;
    background: #450a0a;
    border: 1px solid #7f1d1d;
    color: #fecaca;
  }

  .analytics-kpi-grid {
    display: grid;
    grid-template-columns:
      repeat(5, minmax(0, 1fr));
    gap: 16px;
    margin-bottom: 22px;
  }

  .analytics-kpi {
    min-height: 125px;
    padding: 19px;
    border-radius: 15px;
    background: #111c2d;
    border: 1px solid #263850;
    box-shadow: 0 10px 25px rgba(0,0,0,0.18);
  }

  .kpi-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .kpi-top > span {
    color: #cbd5e1;
    font-size: 13px;
    font-weight: 600;
  }

  .kpi-icon {
    width: 35px;
    height: 35px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    background: #0b1628;
    font-weight: 800;
  }

  .analytics-kpi > strong {
    display: block;
    margin-top: 14px;
    color: #ffffff;
    font-size: 28px;
    font-weight: 800;
  }

  .analytics-kpi > small {
    display: block;
    margin-top: 6px;
    color: #64748b;
    font-size: 11px;
  }

  .kpi-blue {
    border-top: 3px solid #3b82f6;
  }

  .kpi-green {
    border-top: 3px solid #10b981;
  }

  .kpi-purple {
    border-top: 3px solid #8b5cf6;
  }

  .kpi-orange {
    border-top: 3px solid #f59e0b;
  }

  .kpi-red {
    border-top: 3px solid #ef4444;
  }

  .analytics-two-column {
    display: grid;
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
    gap: 20px;
    margin-bottom: 20px;
  }

  .analytics-three-column {
    display: grid;
    grid-template-columns:
      repeat(3, minmax(0, 1fr));
    gap: 20px;
    margin-bottom: 20px;
  }

  .analytics-panel {
    padding: 22px;
    border-radius: 16px;
    background: #111c2d;
    border: 1px solid #263850;
    box-shadow: 0 10px 25px rgba(0,0,0,0.16);
  }

  .department-panel {
    margin-bottom: 20px;
  }

  .analytics-panel-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 15px;
    margin-bottom: 19px;
  }

  .analytics-panel-header h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
  }

  .analytics-panel-header p {
    margin: 6px 0 0;
    color: #94a3b8;
    font-size: 12px;
    line-height: 1.5;
  }

  .analytics-live,
  .analytics-ai {
    padding: 6px 9px;
    border-radius: 8px;
    font-size: 10px;
    font-weight: 800;
  }

  .analytics-live {
    background: #052e26;
    color: #6ee7b7;
  }

  .analytics-ai {
    background: #312e81;
    color: #c4b5fd;
  }

  .analytics-count {
    padding: 7px 11px;
    border-radius: 8px;
    background: #0b1628;
    border: 1px solid #293b55;
    color: #93c5fd;
    font-size: 11px;
    font-weight: 700;
  }

  .workforce-grid {
    display: grid;
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .distribution-item {
    padding: 14px;
    border-radius: 11px;
    background: #0b1628;
    border: 1px solid #1e293b;
  }

  .distribution-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
  }

  .distribution-top span {
    color: #94a3b8;
    font-size: 12px;
  }

  .distribution-top strong {
    color: #ffffff;
    font-size: 21px;
  }

  .distribution-bar {
    height: 6px;
    margin-top: 10px;
    border-radius: 99px;
    background: #1e293b;
    overflow: hidden;
  }

  .distribution-bar > div {
    height: 100%;
    border-radius: 99px;
  }

  .distribution-active .distribution-bar > div {
    background: #10b981;
  }

  .distribution-leave .distribution-bar > div {
    background: #f59e0b;
  }

  .distribution-resigned .distribution-bar > div {
    background: #60a5fa;
  }

  .distribution-terminated .distribution-bar > div {
    background: #ef4444;
  }

  .distribution-retired .distribution-bar > div {
    background: #a78bfa;
  }

  .distribution-item small {
    display: block;
    margin-top: 7px;
    color: #64748b;
    font-size: 10px;
  }

  .workforce-total-box {
    margin-top: 14px;
    padding: 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-radius: 10px;
    background: #0b1628;
    border: 1px solid #263850;
  }

  .workforce-total-box span {
    color: #94a3b8;
    font-size: 12px;
  }

  .workforce-total-box strong {
    font-size: 22px;
  }

  .attrition-main {
    display: grid;
    grid-template-columns:
      1fr 1.4fr;
    gap: 14px;
    margin-bottom: 17px;
  }

  .attrition-main-score {
    padding: 16px;
    border-radius: 12px;
    background: #0b1628;
    border: 1px solid #263850;
  }

  .attrition-main-score span {
    color: #94a3b8;
    font-size: 11px;
  }

  .attrition-main-score strong {
    display: block;
    margin-top: 7px;
    color: #ffffff;
    font-size: 29px;
  }

  .attrition-main-stats {
    display: grid;
    grid-template-columns:
      repeat(3, 1fr);
    gap: 9px;
  }

  .attrition-main-stats > div {
    padding: 12px;
    border-radius: 10px;
    background: #0b1628;
    border: 1px solid #1e293b;
  }

  .attrition-main-stats span {
    display: block;
    color: #64748b;
    font-size: 10px;
  }

  .attrition-main-stats strong {
    display: block;
    margin-top: 6px;
    color: #ffffff;
    font-size: 20px;
  }

  .attrition-danger {
    color: #fca5a5 !important;
  }

  .risk-distribution {
    display: grid;
    gap: 9px;
  }

  .risk-distribution-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 12px;
    border-radius: 9px;
    background: #0b1628;
    border: 1px solid #1e293b;
  }

  .risk-distribution-label {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #cbd5e1;
    font-size: 12px;
    font-weight: 600;
  }

  .risk-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .risk-distribution-row strong {
    color: #ffffff;
  }

  .risk-low {
    background: #10b981 !important;
  }

  .risk-medium {
    background: #f59e0b !important;
  }

  .risk-high {
    background: #f97316 !important;
  }

  .risk-critical {
    background: #ef4444 !important;
  }

  .risk-default {
    background: #64748b !important;
  }

  .analytics-search {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 17px;
    padding: 0 12px;
    border-radius: 9px;
    background: #0b1628;
    border: 1px solid #334155;
  }

  .analytics-search span {
    color: #64748b;
  }

  .analytics-search input {
    width: 100%;
    padding: 11px 0;
    border: none;
    outline: none;
    background: transparent;
    color: #ffffff;
  }

  .analytics-search input::placeholder {
    color: #64748b;
  }

  .department-list {
    display: grid;
    gap: 11px;
  }

  .department-row {
    display: grid;
    grid-template-columns: 230px 1fr;
    gap: 20px;
    align-items: center;
    padding: 14px;
    border-radius: 11px;
    background: #0b1628;
    border: 1px solid #1e293b;
  }

  .department-name-box {
    display: flex;
    align-items: center;
    gap: 11px;
  }

  .department-icon {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    display: flex;
    justify-content: center;
    align-items: center;
    background: #172554;
    color: #93c5fd;
    font-weight: 800;
  }

  .department-name-box > div:last-child {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .department-name-box strong {
    color: #ffffff;
    font-size: 13px;
  }

  .department-name-box span {
    color: #64748b;
    font-size: 10px;
  }

  .department-progress-top {
    display: flex;
    justify-content: space-between;
    margin-bottom: 7px;
  }

  .department-progress-top span {
    color: #64748b;
    font-size: 10px;
  }

  .department-progress-top strong {
    color: #ffffff;
    font-size: 12px;
  }

  .department-bar {
    height: 7px;
    border-radius: 99px;
    background: #1e293b;
    overflow: hidden;
  }

  .department-bar-fill {
    height: 100%;
    border-radius: 99px;
    background: #3b82f6;
  }

  .metric-list {
    display: grid;
    gap: 8px;
  }

  .metric-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 11px;
    border-radius: 8px;
    background: #0b1628;
    border: 1px solid #1e293b;
  }

  .metric-row span {
    color: #94a3b8;
    font-size: 11px;
  }

  .metric-row strong {
    color: #ffffff;
    font-size: 14px;
  }

  .metric-green {
    color: #6ee7b7 !important;
  }

  .metric-orange {
    color: #fcd34d !important;
  }

  .metric-red {
    color: #fca5a5 !important;
  }

  .analytics-highlight {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 13px;
    padding: 13px 14px;
    border-radius: 10px;
  }

  .analytics-highlight span {
    font-size: 11px;
  }

  .analytics-highlight strong {
    font-size: 21px;
  }

  .green-highlight {
    background: #052e26;
    border: 1px solid #065f46;
  }

  .green-highlight span {
    color: #a7f3d0;
  }

  .green-highlight strong {
    color: #6ee7b7;
  }

  .orange-highlight {
    background: #451a03;
    border: 1px solid #78350f;
  }

  .orange-highlight span {
    color: #fde68a;
  }

  .orange-highlight strong {
    color: #fcd34d;
  }

  .salary-box {
    display: grid;
    grid-template-columns:
      repeat(2, 1fr);
    gap: 9px;
    margin-top: 13px;
  }

  .salary-box > div {
    padding: 12px;
    border-radius: 9px;
    background: #0b1628;
    border: 1px solid #1e293b;
  }

  .salary-box span {
    display: block;
    color: #64748b;
    font-size: 10px;
  }

  .salary-box strong {
    display: block;
    margin-top: 5px;
    color: #ffffff;
    font-size: 14px;
  }

  .attrition-analysis-list {
    display: grid;
    gap: 10px;
  }

  .attrition-analysis-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 14px;
    padding: 13px;
    border-radius: 10px;
    background: #0b1628;
    border: 1px solid #1e293b;
  }

  .attrition-analysis-row > div:first-child {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .attrition-analysis-row strong {
    color: #ffffff;
    font-size: 12px;
  }

  .attrition-analysis-row span {
    color: #64748b;
    font-size: 10px;
  }

  .attrition-analysis-score {
    display: flex;
    align-items: center;
    gap: 9px;
  }

  .attrition-analysis-score > strong {
    font-size: 13px;
  }

  .mini-risk {
    padding: 5px 8px;
    border-radius: 99px;
    font-size: 9px !important;
    font-weight: 800;
  }

  .analytics-empty {
    padding: 35px 10px;
    text-align: center;
    color: #64748b;
    font-size: 12px;
  }

  .analytics-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 15px;
    margin-top: 20px;
    padding: 17px 20px;
    border-radius: 13px;
    border: 1px solid #263850;
    background: #111c2d;
  }

  .analytics-footer div {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .analytics-footer strong {
    font-size: 12px;
  }

  .analytics-footer span {
    color: #64748b;
    font-size: 10px;
  }

  .analytics-loading {
    min-height: 65vh;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    text-align: center;
  }

  .analytics-loading h2 {
    margin: 18px 0 7px;
  }

  .analytics-loading p {
    margin: 0;
    color: #64748b;
  }

  .analytics-spinner {
    width: 42px;
    height: 42px;
    border: 4px solid #1e293b;
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: analyticsSpin 0.8s linear infinite;
  }

  @keyframes analyticsSpin {
    to {
      transform: rotate(360deg);
    }
  }

  .analytics-active {
    color: #6ee7b7 !important;
  }

  .analytics-leave {
    color: #fcd34d !important;
  }

  .analytics-resigned {
    color: #93c5fd !important;
  }

  .analytics-terminated {
    color: #fca5a5 !important;
  }

  .analytics-retired {
    color: #c4b5fd !important;
  }

  .analytics-default {
    color: #cbd5e1 !important;
  }

  @media (max-width: 1200px) {
    .analytics-kpi-grid {
      grid-template-columns:
        repeat(3, minmax(0, 1fr));
    }

    .analytics-three-column {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 850px) {
    .analytics-page {
      padding: 18px;
    }

    .analytics-header {
      flex-direction: column;
    }

    .analytics-two-column,
    .analytics-three-column {
      grid-template-columns: 1fr;
    }

    .analytics-kpi-grid {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .department-row {
      grid-template-columns: 1fr;
      gap: 12px;
    }

    .attrition-main {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 550px) {
    .analytics-kpi-grid,
    .workforce-grid {
      grid-template-columns: 1fr;
    }

    .attrition-main-stats {
      grid-template-columns: 1fr;
    }

    .salary-box {
      grid-template-columns: 1fr;
    }

    .analytics-footer {
      flex-direction: column;
      align-items: flex-start;
    }
  }
`;