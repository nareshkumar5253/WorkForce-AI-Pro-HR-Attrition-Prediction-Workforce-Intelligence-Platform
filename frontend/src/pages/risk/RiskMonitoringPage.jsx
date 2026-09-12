import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import riskMonitoringService from "../../services/riskMonitoringService";

export default function RiskMonitoringPage() {
  const [summary, setSummary] = useState({
    total_monitored_employees: 0,
    low_risk: 0,
    medium_risk: 0,
    high_risk: 0,
    critical_risk: 0,
    total_high_or_critical: 0,
  });

  const [employees, setEmployees] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("ALL");

  const [selectedEmployee, setSelectedEmployee] =
    useState(null);

  const [refreshing, setRefreshing] =
    useState(false);

  useEffect(() => {
    loadRiskMonitoring();
  }, []);

  const loadRiskMonitoring = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        summaryData,
        employeeData,
      ] = await Promise.all([
        riskMonitoringService.getRiskSummary(),
        riskMonitoringService.getAllRisks(),
      ]);

      setSummary(
        summaryData || {
          total_monitored_employees: 0,
          low_risk: 0,
          medium_risk: 0,
          high_risk: 0,
          critical_risk: 0,
          total_high_or_critical: 0,
        }
      );

      setEmployees(
        employeeData?.employees || []
      );
    } catch (err) {
      console.error(
        "Risk monitoring loading failed:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Unable to load employee risk data."
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
        summaryData,
        employeeData,
      ] = await Promise.all([
        riskMonitoringService.getRiskSummary(),
        riskMonitoringService.getAllRisks(),
      ]);

      setSummary(summaryData || {});

      setEmployees(
        employeeData?.employees || []
      );
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.detail ||
          "Unable to refresh risk monitoring data."
      );
    } finally {
      setRefreshing(false);
    }
  };

  const filteredEmployees = useMemo(() => {
    const searchValue =
      search.trim().toLowerCase();

    return employees.filter((employee) => {
      const matchesSearch =
        !searchValue ||
        String(employee.employee_id)
          .toLowerCase()
          .includes(searchValue) ||
        String(employee.employee_code || "")
          .toLowerCase()
          .includes(searchValue) ||
        String(employee.employee_name || "")
          .toLowerCase()
          .includes(searchValue) ||
        String(employee.department || "")
          .toLowerCase()
          .includes(searchValue) ||
        String(employee.job_role || "")
          .toLowerCase()
          .includes(searchValue);

      const matchesRisk =
        riskFilter === "ALL" ||
        employee.risk_level === riskFilter;

      return matchesSearch && matchesRisk;
    });
  }, [
    employees,
    search,
    riskFilter,
  ]);

  const getRiskClass = (riskLevel) => {
    switch (
      String(riskLevel || "").toUpperCase()
    ) {
      case "CRITICAL":
        return "risk-critical";

      case "HIGH":
        return "risk-high";

      case "MEDIUM":
        return "risk-medium";

      default:
        return "risk-low";
    }
  };

  const getRiskDescription = (riskLevel) => {
    switch (
      String(riskLevel || "").toUpperCase()
    ) {
      case "CRITICAL":
        return "Immediate intervention required";

      case "HIGH":
        return "Requires HR attention";

      case "MEDIUM":
        return "Monitor employee closely";

      default:
        return "No immediate intervention required";
    }
  };

  const formatDate = (value) => {
    if (!value) {
      return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString("en-IN");
  };

  if (loading) {
    return (
      <div className="risk-page">
        <style>{riskStyles}</style>

        <div className="risk-loading">
          <div className="risk-spinner"></div>

          <h2>
            Loading risk monitoring...
          </h2>

          <p>
            Fetching the latest AI workforce
            risk profiles.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="risk-page">
      <style>{riskStyles}</style>

      {/* =====================================================
          HEADER
          ===================================================== */}

      <div className="risk-header">
        <div>
          <div className="risk-eyebrow">
            WORKFORCE INTELLIGENCE
          </div>

          <h1>
            Risk Monitoring
          </h1>

          <p>
            Monitor employee attrition risk and
            identify employees who may require
            HR intervention.
          </p>
        </div>

        <button
          type="button"
          className="refresh-button"
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
        <div className="risk-error">
          {error}
        </div>
      )}

      {/* =====================================================
          SUMMARY CARDS
          ===================================================== */}

      <div className="risk-summary-grid">

        <SummaryCard
          title="Monitored Employees"
          value={
            summary.total_monitored_employees
          }
          icon="◎"
          className="summary-blue"
        />

        <SummaryCard
          title="Low Risk"
          value={summary.low_risk}
          icon="✓"
          className="summary-green"
        />

        <SummaryCard
          title="Medium Risk"
          value={summary.medium_risk}
          icon="!"
          className="summary-orange"
        />

        <SummaryCard
          title="High Risk"
          value={summary.high_risk}
          icon="▲"
          className="summary-red"
        />

        <SummaryCard
          title="Critical Risk"
          value={summary.critical_risk}
          icon="⚠"
          className="summary-critical"
        />
      </div>

      {/* =====================================================
          ACTION BANNER
          ===================================================== */}

      <div className="risk-action-banner">

        <div className="risk-action-icon">
          ⚠
        </div>

        <div className="risk-action-content">
          <strong>
            {summary.total_high_or_critical > 0
              ? "Action Required"
              : "Workforce Risk Stable"}
          </strong>

          <span>
            {summary.total_high_or_critical}{" "}
            employee
            {summary.total_high_or_critical === 1
              ? ""
              : "s"} currently have high or
            critical attrition risk.
          </span>
        </div>

        <div className="risk-action-count">
          {summary.total_high_or_critical}
        </div>
      </div>

      {/* =====================================================
          FILTERS
          ===================================================== */}

      <div className="risk-panel">

        <div className="risk-panel-header">
          <div>
            <h2>
              Employee Risk Profiles
            </h2>

            <p>
              Latest AI-generated risk profile
              for each monitored employee.
            </p>
          </div>

          <div className="risk-count">
            {filteredEmployees.length} employees
          </div>
        </div>

        <div className="risk-filters">

          <div className="search-box">
            <span>⌕</span>

            <input
              type="text"
              placeholder="Search employee, code, department..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />
          </div>

          <select
            value={riskFilter}
            onChange={(event) =>
              setRiskFilter(
                event.target.value
              )
            }
            className="risk-select"
          >
            <option value="ALL">
              All Risk Levels
            </option>

            <option value="LOW">
              Low Risk
            </option>

            <option value="MEDIUM">
              Medium Risk
            </option>

            <option value="HIGH">
              High Risk
            </option>

            <option value="CRITICAL">
              Critical Risk
            </option>
          </select>

        </div>

        {/* ===================================================
            TABLE
            =================================================== */}

        {filteredEmployees.length === 0 ? (
          <div className="no-risk-data">
            <div className="no-risk-icon">
              ◎
            </div>

            <h3>
              No matching employees
            </h3>

            <p>
              No employee risk profile matches
              your current filters.
            </p>
          </div>
        ) : (
          <div className="risk-table-wrapper">
            <table className="risk-table">

              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Job Role</th>
                  <th>Attrition Probability</th>
                  <th>Risk Score</th>
                  <th>Risk Level</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredEmployees.map(
                  (employee) => (
                    <tr
                      key={
                        employee.employee_id
                      }
                    >

                      <td>
                        <div className="employee-cell">

                          <div className="employee-avatar">
                            {String(
                              employee.employee_name ||
                                "E"
                            )
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <strong>
                              {
                                employee.employee_name
                              }
                            </strong>

                            <span>
                              {
                                employee.employee_code
                              }
                            </span>
                          </div>

                        </div>
                      </td>

                      <td>
                        {
                          employee.department ||
                          "-"
                        }
                      </td>

                      <td>
                        {
                          employee.job_role ||
                          "-"
                        }
                      </td>

                      <td>
                        <div className="probability-cell">

                          <strong>
                            {Number(
                              employee.attrition_probability ||
                                0
                            ).toFixed(2)}
                            %
                          </strong>

                          <div className="probability-bar">
                            <div
                              className={`probability-fill ${getRiskClass(
                                employee.risk_level
                              )}`}
                              style={{
                                width: `${Math.min(
                                  Number(
                                    employee.attrition_probability ||
                                      0
                                  ),
                                  100
                                )}%`,
                              }}
                            ></div>
                          </div>

                        </div>
                      </td>

                      <td>
                        <strong>
                          {Number(
                            employee.risk_score ||
                              0
                          ).toFixed(2)}
                        </strong>
                      </td>

                      <td>
                        <span
                          className={`risk-badge ${getRiskClass(
                            employee.risk_level
                          )}`}
                        >
                          {
                            employee.risk_level
                          }
                        </span>
                      </td>

                      <td>
                        <span
                          className={
                            employee.employment_status ===
                            "ACTIVE"
                              ? "employment-active"
                              : "employment-other"
                          }
                        >
                          {
                            employee.employment_status ||
                            "-"
                          }
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="view-button"
                          onClick={() =>
                            setSelectedEmployee(
                              employee
                            )
                          }
                        >
                          View Details
                        </button>
                      </td>

                    </tr>
                  )
                )}
              </tbody>

            </table>
          </div>
        )}

      </div>

      {/* =====================================================
          DETAIL PANEL
          ===================================================== */}

      {selectedEmployee && (
        <div className="modal-backdrop">

          <div className="risk-modal">

            <div className="modal-header">

              <div>
                <span className="modal-eyebrow">
                  EMPLOYEE RISK PROFILE
                </span>

                <h2>
                  {
                    selectedEmployee.employee_name
                  }
                </h2>

                <p>
                  {
                    selectedEmployee.employee_code
                  }{" "}
                  · Employee #
                  {
                    selectedEmployee.employee_id
                  }
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() =>
                  setSelectedEmployee(null)
                }
              >
                ×
              </button>

            </div>

            <div className="modal-risk-summary">

              <div
                className={`large-risk-badge ${getRiskClass(
                  selectedEmployee.risk_level
                )}`}
              >
                {
                  selectedEmployee.risk_level
                }
              </div>

              <div className="modal-risk-number">
                <span>
                  Attrition Probability
                </span>

                <strong>
                  {Number(
                    selectedEmployee.attrition_probability ||
                      0
                  ).toFixed(2)}
                  %
                </strong>
              </div>

              <div className="modal-risk-number">
                <span>
                  Risk Score
                </span>

                <strong>
                  {Number(
                    selectedEmployee.risk_score ||
                      0
                  ).toFixed(2)}
                </strong>
              </div>

            </div>

            <div className="modal-grid">

              <div className="modal-info-box">
                <span>
                  Department
                </span>

                <strong>
                  {
                    selectedEmployee.department ||
                    "-"
                  }
                </strong>
              </div>

              <div className="modal-info-box">
                <span>
                  Job Role
                </span>

                <strong>
                  {
                    selectedEmployee.job_role ||
                    "-"
                  }
                </strong>
              </div>

              <div className="modal-info-box">
                <span>
                  Employment Status
                </span>

                <strong>
                  {
                    selectedEmployee.employment_status ||
                    "-"
                  }
                </strong>
              </div>

              <div className="modal-info-box">
                <span>
                  Model
                </span>

                <strong>
                  {
                    selectedEmployee.model_name ||
                    "-"
                  }
                </strong>
              </div>

            </div>

            <div className="risk-summary-box">

              <h3>
                AI Risk Summary
              </h3>

              <p>
                {
                  selectedEmployee.summary ||
                  getRiskDescription(
                    selectedEmployee.risk_level
                  )
                }
              </p>

            </div>

            <div className="risk-factors-box">

              <h3>
                Risk Factors
              </h3>

              {selectedEmployee
                .risk_factors &&
              selectedEmployee.risk_factors
                .length > 0 ? (
                <div className="factor-list">

                  {selectedEmployee.risk_factors.map(
                    (factor, index) => (
                      <div
                        className="factor-item"
                        key={index}
                      >
                        <span>
                          •
                        </span>

                        <span>
                          {typeof factor ===
                          "object"
                            ? JSON.stringify(
                                factor
                              )
                            : factor}
                        </span>
                      </div>
                    )
                  )}

                </div>
              ) : (
                <div className="no-factors">
                  No immediate risk factors
                  detected.
                </div>
              )}

            </div>

            <div className="modal-footer">

              <span>
                Prediction ID:{" "}
                {
                  selectedEmployee.attrition_prediction_id
                }
              </span>

              <span>
                Updated:{" "}
                {formatDate(
                  selectedEmployee.created_at
                )}
              </span>

            </div>

          </div>

        </div>
      )}
    </div>
  );
}

/* ============================================================
   SUMMARY CARD
   ============================================================ */

function SummaryCard({
  title,
  value,
  icon,
  className,
}) {
  return (
    <div
      className={`risk-summary-card ${className}`}
    >

      <div className="summary-card-top">

        <div className="summary-card-title">
          {title}
        </div>

        <div className="summary-card-icon">
          {icon}
        </div>

      </div>

      <div className="summary-card-value">
        {value}
      </div>

    </div>
  );
}

/* ============================================================
   STYLES
   ============================================================ */

const riskStyles = `
  .risk-page {
    min-height: 100vh;
    padding: 30px;
    background: #09111f;
    color: #ffffff;
  }

  .risk-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 20px;
    margin-bottom: 26px;
  }

  .risk-eyebrow {
    color: #60a5fa;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 1.4px;
    margin-bottom: 8px;
  }

  .risk-header h1 {
    margin: 0;
    font-size: 30px;
    font-weight: 800;
  }

  .risk-header p {
    margin: 8px 0 0;
    max-width: 750px;
    color: #94a3b8;
    font-size: 15px;
    line-height: 1.6;
  }

  .refresh-button {
    border: 1px solid #334155;
    background: #111c2d;
    color: #ffffff;
    padding: 11px 18px;
    border-radius: 10px;
    cursor: pointer;
    font-weight: 700;
  }

  .refresh-button:hover {
    background: #17253a;
  }

  .refresh-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .risk-error {
    padding: 13px 16px;
    margin-bottom: 20px;
    border-radius: 10px;
    background: #450a0a;
    border: 1px solid #7f1d1d;
    color: #fecaca;
  }

  .risk-summary-grid {
    display: grid;
    grid-template-columns:
      repeat(5, minmax(0, 1fr));
    gap: 16px;
    margin-bottom: 20px;
  }

  .risk-summary-card {
    min-height: 125px;
    border-radius: 16px;
    padding: 19px;
    border: 1px solid #24344c;
    background: #111c2d;
    box-shadow:
      0 10px 24px rgba(0,0,0,0.18);
  }

  .summary-card-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
  }

  .summary-card-title {
    color: #cbd5e1;
    font-size: 13px;
    font-weight: 600;
  }

  .summary-card-icon {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    background: #0b1628;
  }

  .summary-card-value {
    margin-top: 15px;
    font-size: 31px;
    font-weight: 800;
    color: #ffffff;
  }

  .summary-blue {
    border-top: 3px solid #3b82f6;
  }

  .summary-green {
    border-top: 3px solid #10b981;
  }

  .summary-orange {
    border-top: 3px solid #f59e0b;
  }

  .summary-red {
    border-top: 3px solid #ef4444;
  }

  .summary-critical {
    border-top: 3px solid #dc2626;
  }

  .risk-action-banner {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 19px 22px;
    margin-bottom: 22px;
    border-radius: 14px;
    background: #111c2d;
    border: 1px solid #293b55;
  }

  .risk-action-icon {
    width: 45px;
    height: 45px;
    border-radius: 12px;
    display: flex;
    justify-content: center;
    align-items: center;
    background: #3f1d1d;
    color: #fca5a5;
    font-size: 20px;
    font-weight: 800;
  }

  .risk-action-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .risk-action-content strong {
    color: #ffffff;
    font-size: 15px;
  }

  .risk-action-content span {
    color: #94a3b8;
    font-size: 14px;
  }

  .risk-action-count {
    min-width: 55px;
    text-align: center;
    font-size: 25px;
    font-weight: 800;
    color: #fca5a5;
  }

  .risk-panel {
    background: #111c2d;
    border: 1px solid #24344c;
    border-radius: 16px;
    overflow: hidden;
  }

  .risk-panel-header {
    padding: 22px 24px 18px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 15px;
  }

  .risk-panel-header h2 {
    margin: 0;
    font-size: 19px;
    font-weight: 700;
  }

  .risk-panel-header p {
    margin: 6px 0 0;
    color: #94a3b8;
    font-size: 13px;
  }

  .risk-count {
    color: #93c5fd;
    background: #0b1628;
    border: 1px solid #263a56;
    padding: 7px 11px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 700;
  }

  .risk-filters {
    display: flex;
    gap: 12px;
    padding: 0 24px 18px;
  }

  .search-box {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 0 12px;
    border-radius: 9px;
    border: 1px solid #334155;
    background: #0b1628;
  }

  .search-box span {
    color: #64748b;
    font-size: 18px;
  }

  .search-box input {
    width: 100%;
    padding: 11px 0;
    border: none;
    outline: none;
    background: transparent;
    color: #ffffff;
  }

  .search-box input::placeholder {
    color: #64748b;
  }

  .risk-select {
    min-width: 180px;
    padding: 11px 12px;
    border-radius: 9px;
    border: 1px solid #334155;
    background: #0b1628;
    color: #ffffff;
    outline: none;
  }

  .risk-table-wrapper {
    width: 100%;
    overflow-x: auto;
  }

  .risk-table {
    width: 100%;
    min-width: 1050px;
    border-collapse: collapse;
  }

  .risk-table th {
    padding: 14px 18px;
    text-align: left;
    background: #0d1727;
    border-top: 1px solid #1e293b;
    border-bottom: 1px solid #27364b;
    color: #94a3b8;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.4px;
  }

  .risk-table td {
    padding: 16px 18px;
    border-bottom: 1px solid #1e293b;
    color: #e2e8f0;
    font-size: 13px;
    vertical-align: middle;
  }

  .risk-table tbody tr:hover {
    background: #0d1727;
  }

  .employee-cell {
    display: flex;
    align-items: center;
    gap: 11px;
    min-width: 190px;
  }

  .employee-avatar {
    width: 38px;
    height: 38px;
    border-radius: 11px;
    background: #1d4ed8;
    color: #dbeafe;
    display: flex;
    justify-content: center;
    align-items: center;
    font-weight: 800;
  }

  .employee-cell > div:last-child {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .employee-cell strong {
    color: #ffffff;
    font-size: 13px;
  }

  .employee-cell span {
    color: #64748b;
    font-size: 11px;
  }

  .probability-cell {
    min-width: 135px;
  }

  .probability-cell strong {
    color: #ffffff;
  }

  .probability-bar {
    height: 5px;
    margin-top: 7px;
    border-radius: 99px;
    overflow: hidden;
    background: #1e293b;
  }

  .probability-fill {
    height: 100%;
    border-radius: 99px;
  }

  .probability-fill.risk-low {
    background: #10b981;
  }

  .probability-fill.risk-medium {
    background: #f59e0b;
  }

  .probability-fill.risk-high {
    background: #f97316;
  }

  .probability-fill.risk-critical {
    background: #ef4444;
  }

  .risk-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 70px;
    padding: 6px 10px;
    border-radius: 99px;
    font-size: 11px;
    font-weight: 800;
  }

  .risk-low {
    background: #064e3b;
    color: #6ee7b7;
  }

  .risk-medium {
    background: #78350f;
    color: #fde68a;
  }

  .risk-high {
    background: #7c2d12;
    color: #fdba74;
  }

  .risk-critical {
    background: #7f1d1d;
    color: #fca5a5;
  }

  .employment-active {
    color: #6ee7b7;
    font-weight: 700;
  }

  .employment-other {
    color: #cbd5e1;
    font-weight: 600;
  }

  .view-button {
    border: 1px solid #334155;
    background: #0b1628;
    color: #93c5fd;
    padding: 8px 11px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 700;
    white-space: nowrap;
  }

  .view-button:hover {
    background: #17253a;
  }

  .no-risk-data {
    padding: 70px 20px;
    text-align: center;
  }

  .no-risk-icon {
    font-size: 38px;
    color: #475569;
  }

  .no-risk-data h3 {
    margin: 12px 0 6px;
  }

  .no-risk-data p {
    margin: 0;
    color: #64748b;
  }

  .modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: rgba(2, 6, 23, 0.78);
  }

  .risk-modal {
    width: min(760px, 100%);
    max-height: 90vh;
    overflow-y: auto;
    border-radius: 18px;
    border: 1px solid #334155;
    background: #111c2d;
    box-shadow:
      0 25px 70px rgba(0,0,0,0.5);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    gap: 20px;
    padding: 24px;
    border-bottom: 1px solid #24344c;
  }

  .modal-eyebrow {
    color: #60a5fa;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 1px;
  }

  .modal-header h2 {
    margin: 7px 0 5px;
    font-size: 24px;
  }

  .modal-header p {
    margin: 0;
    color: #94a3b8;
    font-size: 13px;
  }

  .modal-close {
    width: 38px;
    height: 38px;
    border: 1px solid #334155;
    border-radius: 9px;
    background: #0b1628;
    color: #ffffff;
    font-size: 24px;
    cursor: pointer;
  }

  .modal-risk-summary {
    display: grid;
    grid-template-columns:
      1fr 1fr 1fr;
    gap: 14px;
    padding: 20px 24px;
  }

  .large-risk-badge {
    min-height: 80px;
    border-radius: 13px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 20px;
    font-weight: 900;
  }

  .modal-risk-number {
    padding: 15px;
    border: 1px solid #24344c;
    border-radius: 13px;
    background: #0b1628;
  }

  .modal-risk-number span,
  .modal-info-box span {
    display: block;
    color: #94a3b8;
    font-size: 11px;
    margin-bottom: 7px;
  }

  .modal-risk-number strong {
    color: #ffffff;
    font-size: 23px;
  }

  .modal-grid {
    display: grid;
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
    gap: 12px;
    padding: 0 24px 20px;
  }

  .modal-info-box {
    padding: 14px;
    border-radius: 11px;
    background: #0b1628;
    border: 1px solid #1e293b;
  }

  .modal-info-box strong {
    color: #ffffff;
  }

  .risk-summary-box,
  .risk-factors-box {
    margin: 0 24px 20px;
    padding: 17px;
    border-radius: 12px;
    background: #0b1628;
    border: 1px solid #1e293b;
  }

  .risk-summary-box h3,
  .risk-factors-box h3 {
    margin: 0 0 9px;
    font-size: 14px;
  }

  .risk-summary-box p {
    margin: 0;
    color: #cbd5e1;
    line-height: 1.6;
    font-size: 13px;
  }

  .factor-list {
    display: grid;
    gap: 9px;
  }

  .factor-item {
    display: flex;
    gap: 8px;
    color: #cbd5e1;
    font-size: 13px;
  }

  .factor-item > span:first-child {
    color: #f59e0b;
  }

  .no-factors {
    color: #6ee7b7;
    font-size: 13px;
  }

  .modal-footer {
    display: flex;
    justify-content: space-between;
    gap: 15px;
    padding: 15px 24px;
    border-top: 1px solid #24344c;
    color: #64748b;
    font-size: 11px;
  }

  .risk-loading {
    min-height: 65vh;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    text-align: center;
  }

  .risk-loading h2 {
    margin: 18px 0 7px;
  }

  .risk-loading p {
    margin: 0;
    color: #64748b;
  }

  .risk-spinner {
    width: 42px;
    height: 42px;
    border: 4px solid #1e293b;
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: riskSpin 0.8s linear infinite;
  }

  @keyframes riskSpin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 1200px) {
    .risk-summary-grid {
      grid-template-columns:
        repeat(3, minmax(0, 1fr));
    }
  }

  @media (max-width: 800px) {
    .risk-page {
      padding: 18px;
    }

    .risk-header {
      flex-direction: column;
    }

    .risk-summary-grid {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .risk-filters {
      flex-direction: column;
    }

    .risk-select {
      width: 100%;
    }

    .modal-risk-summary,
    .modal-grid {
      grid-template-columns: 1fr;
    }

    .modal-footer {
      flex-direction: column;
    }
  }

  @media (max-width: 500px) {
    .risk-summary-grid {
      grid-template-columns: 1fr;
    }
  }
`;