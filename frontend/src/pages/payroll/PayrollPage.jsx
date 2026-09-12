import { useEffect, useMemo, useState } from "react";
import {
  getPayrolls,
  createPayroll,
  processPayroll,
  payPayroll,
} from "../../services/payrollService";

const PayrollPage = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [employeeId, setEmployeeId] = useState("");

  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  const [form, setForm] = useState({
    employee_id: "",
    payroll_year: new Date().getFullYear(),
    payroll_month: new Date().getMonth() + 1,
    basic_salary: "",
    hra: "",
    allowances: "",
    bonus: "",
    deductions: "",
    remarks: "",
  });

  // ============================================================
  // LOAD PAYROLLS
  // ============================================================

  const loadPayrolls = async (params = {}) => {
    try {
      setLoading(true);
      setError("");

      const data = await getPayrolls(params);

      if (Array.isArray(data)) {
        setPayrolls(data);
      } else if (Array.isArray(data?.items)) {
        setPayrolls(data.items);
      } else {
        setPayrolls([]);
      }
    } catch (err) {
      console.error("Payroll loading failed:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to load payroll records."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    loadPayrolls();
  }, []);

  // ============================================================
  // SEARCH
  // ============================================================

  const handleSearch = async () => {
    try {
      setSearching(true);
      setError("");
      setSuccess("");

      if (!employeeId.trim()) {
        await loadPayrolls();
        return;
      }

      await loadPayrolls({
        employee_id: Number(employeeId),
      });
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to search payroll records."
      );
    } finally {
      setSearching(false);
    }
  };

  const clearSearch = async () => {
    setEmployeeId("");
    setError("");
    setSuccess("");

    await loadPayrolls();
  };

  // ============================================================
  // FORM CHANGE
  // ============================================================

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ============================================================
  // CREATE PAYROLL
  // ============================================================

  const handleCreatePayroll = async (event) => {
    event.preventDefault();

    try {
      setCreating(true);
      setError("");
      setSuccess("");

      if (!form.employee_id) {
        setError("Please enter employee ID.");
        return;
      }

      const payload = {
        employee_id: Number(form.employee_id),
        payroll_year: Number(form.payroll_year),
        payroll_month: Number(form.payroll_month),
        basic_salary: Number(form.basic_salary || 0),
        hra: Number(form.hra || 0),
        allowances: Number(form.allowances || 0),
        bonus: Number(form.bonus || 0),
        deductions: Number(form.deductions || 0),
        remarks: form.remarks || null,
      };

      await createPayroll(payload);

      setSuccess("Payroll created successfully.");

      setForm({
        employee_id: "",
        payroll_year: new Date().getFullYear(),
        payroll_month: new Date().getMonth() + 1,
        basic_salary: "",
        hra: "",
        allowances: "",
        bonus: "",
        deductions: "",
        remarks: "",
      });

      setShowCreateForm(false);

      await loadPayrolls();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to create payroll."
      );
    } finally {
      setCreating(false);
    }
  };

  // ============================================================
  // PROCESS
  // ============================================================

  const handleProcess = async (payrollId) => {
    try {
      setProcessingId(payrollId);
      setError("");
      setSuccess("");

      await processPayroll(payrollId);

      setSuccess(
        `Payroll #${payrollId} processed successfully.`
      );

      await loadPayrolls();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to process payroll."
      );
    } finally {
      setProcessingId(null);
    }
  };

  // ============================================================
  // PAY
  // ============================================================

  const handlePay = async (payrollId) => {
    try {
      setProcessingId(payrollId);
      setError("");
      setSuccess("");

      await payPayroll(payrollId);

      setSuccess(
        `Payroll #${payrollId} paid successfully.`
      );

      await loadPayrolls();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to pay payroll."
      );
    } finally {
      setProcessingId(null);
    }
  };

  // ============================================================
  // CURRENCY
  // ============================================================

  const formatCurrency = (value) => {
    return `₹${Number(value || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // ============================================================
  // MONTH
  // ============================================================

  const getMonthName = (month) => {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    return months[Number(month) - 1] || "-";
  };

  // ============================================================
  // STATUS STYLE
  // ============================================================

  const getStatusStyle = (status) => {
    const normalized = String(status || "").toUpperCase();

    if (normalized === "PAID") {
      return {
        background: "#dcfce7",
        color: "#166534",
      };
    }

    if (normalized === "PROCESSED") {
      return {
        background: "#dbeafe",
        color: "#1d4ed8",
      };
    }

    return {
      background: "#fef3c7",
      color: "#92400e",
    };
  };

  // ============================================================
  // SUMMARY
  // ============================================================

  const summary = useMemo(() => {
    const totalGross = payrolls.reduce(
      (total, payroll) =>
        total + Number(payroll.gross_salary || 0),
      0
    );

    const totalNet = payrolls.reduce(
      (total, payroll) =>
        total + Number(payroll.net_salary || 0),
      0
    );

    const paid = payrolls.filter(
      (payroll) =>
        String(payroll.status).toUpperCase() === "PAID"
    ).length;

    const processed = payrolls.filter(
      (payroll) =>
        String(payroll.status).toUpperCase() === "PROCESSED"
    ).length;

    const pending = payrolls.filter(
      (payroll) =>
        String(payroll.status).toUpperCase() === "PENDING"
    ).length;

    return {
      totalRecords: payrolls.length,
      totalGross,
      totalNet,
      paid,
      processed,
      pending,
    };
  }, [payrolls]);

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="payroll-page">

      {/* HEADER */}

      <div className="page-header">

        <div>
          <p className="page-eyebrow">
            WORKFORCE MANAGEMENT
          </p>

          <h1>Payroll</h1>

          <p className="page-description">
            Manage employee payroll and compensation.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setShowCreateForm((value) => !value)
          }
          style={{
            padding: "12px 18px",
            borderRadius: "9px",
            border: "none",
            background: "#2563eb",
            color: "#ffffff",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {showCreateForm
            ? "Close"
            : "+ Create Payroll"}
        </button>

      </div>

      {/* ALERTS */}

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

      {/* SUMMARY */}

      <div
        className="payroll-summary-grid"
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(190px, 1fr))",
          gap: "18px",
          marginBottom: "24px",
        }}
      >

        <SummaryCard
          title="Total Payrolls"
          value={summary.totalRecords}
          subtitle="Payroll records"
          icon="▤"
        />

        <SummaryCard
          title="Total Gross Salary"
          value={formatCurrency(summary.totalGross)}
          subtitle="Before deductions"
          icon="₹"
        />

        <SummaryCard
          title="Total Net Salary"
          value={formatCurrency(summary.totalNet)}
          subtitle="After deductions"
          icon="◈"
        />

        <SummaryCard
          title="Paid Payrolls"
          value={summary.paid}
          subtitle={`${summary.totalRecords} total records`}
          icon="✓"
        />

        <SummaryCard
          title="Processed"
          value={summary.processed}
          subtitle={`${summary.pending} pending`}
          icon="◷"
        />

      </div>

      {/* CREATE PAYROLL */}

      {showCreateForm && (
        <div
          className="content-card"
          style={{
            marginBottom: "24px",
          }}
        >

          <div className="card-header">

            <div>
              <h2>Create Payroll</h2>

              <p>
                Create a payroll record for an employee.
              </p>
            </div>

          </div>

          <form onSubmit={handleCreatePayroll}>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(3, minmax(180px, 1fr))",
                gap: "18px",
              }}
            >

              <FormInput
                label="Employee ID"
                name="employee_id"
                type="number"
                value={form.employee_id}
                onChange={handleFormChange}
                placeholder="1"
              />

              <FormInput
                label="Payroll Year"
                name="payroll_year"
                type="number"
                value={form.payroll_year}
                onChange={handleFormChange}
              />

              <FormInput
                label="Payroll Month"
                name="payroll_month"
                type="number"
                min="1"
                max="12"
                value={form.payroll_month}
                onChange={handleFormChange}
              />

              <FormInput
                label="Basic Salary"
                name="basic_salary"
                type="number"
                value={form.basic_salary}
                onChange={handleFormChange}
                placeholder="50000"
              />

              <FormInput
                label="HRA"
                name="hra"
                type="number"
                value={form.hra}
                onChange={handleFormChange}
                placeholder="15000"
              />

              <FormInput
                label="Allowances"
                name="allowances"
                type="number"
                value={form.allowances}
                onChange={handleFormChange}
                placeholder="5000"
              />

              <FormInput
                label="Bonus"
                name="bonus"
                type="number"
                value={form.bonus}
                onChange={handleFormChange}
                placeholder="2000"
              />

              <FormInput
                label="Deductions"
                name="deductions"
                type="number"
                value={form.deductions}
                onChange={handleFormChange}
                placeholder="3000"
              />

              <FormInput
                label="Remarks"
                name="remarks"
                type="text"
                value={form.remarks}
                onChange={handleFormChange}
                placeholder="September 2026 payroll"
              />

            </div>

            <div
              style={{
                marginTop: "20px",
              }}
            >

              <button
                type="submit"
                disabled={creating}
                style={{
                  padding: "11px 18px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#2563eb",
                  color: "#ffffff",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {creating
                  ? "Creating..."
                  : "Create Payroll"}
              </button>

            </div>

          </form>

        </div>
      )}

      {/* SEARCH */}

      <div
        className="content-card"
        style={{
          marginBottom: "24px",
        }}
      >

        <div className="card-header">

          <div>
            <h2>Find Payroll Records</h2>

            <p>
              Search payroll records using Employee ID.
            </p>
          </div>

        </div>

        <div
          style={{
            display: "flex",
            gap: "12px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >

          <input
            type="number"
            min="1"
            value={employeeId}
            onChange={(event) =>
              setEmployeeId(event.target.value)
            }
            placeholder="Enter Employee ID"
            style={{
              width: "260px",
              padding: "12px",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              fontSize: "14px",
            }}
          />

          <button
            type="button"
            onClick={handleSearch}
            disabled={searching}
            style={{
              padding: "12px 18px",
              borderRadius: "8px",
              border: "none",
              background: "#2563eb",
              color: "#ffffff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {searching
              ? "Searching..."
              : "Search"}
          </button>

          <button
            type="button"
            onClick={clearSearch}
            style={{
              padding: "12px 18px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              color: "#172033",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Clear
          </button>

        </div>

      </div>

      {/* PAYROLL RECORDS */}

      <div className="content-card">

        <div className="card-header">

          <div>
            <h2>Payroll Records</h2>

            <p>
              Employee payroll history and payment status.
            </p>
          </div>

          <span className="card-header-badge">
            {summary.totalRecords} RECORDS
          </span>

        </div>

        {loading ? (

          <div className="payroll-loading">
            Loading payroll records...
          </div>

        ) : payrolls.length === 0 ? (

          <div className="payroll-empty">
            <div className="payroll-empty-icon">
              ▤
            </div>

            <h3>
              No payroll records found
            </h3>

            <p>
              Create a payroll record or change your search.
            </p>
          </div>

        ) : (

          <div
            style={{
              overflowX: "auto",
            }}
          >

            <table className="payroll-table">

              <thead>

                <tr>

                  <th>ID</th>
                  <th>Employee ID</th>
                  <th>Period</th>
                  <th>Basic Salary</th>
                  <th>HRA</th>
                  <th>Allowances</th>
                  <th>Bonus</th>
                  <th>Deductions</th>
                  <th>Gross Salary</th>
                  <th>Net Salary</th>
                  <th>Status</th>
                  <th>Actions</th>

                </tr>

              </thead>

              <tbody>

                {payrolls.map((payroll) => {

                  const status = String(
                    payroll.status || ""
                  ).toUpperCase();

                  const busy =
                    processingId === payroll.id;

                  return (
                    <tr key={payroll.id}>

                      <td>
                        #{payroll.id}
                      </td>

                      <td>
                        Employee {payroll.employee_id}
                      </td>

                      <td>
                        {getMonthName(
                          payroll.payroll_month
                        )}{" "}
                        {payroll.payroll_year}
                      </td>

                      <td>
                        {formatCurrency(
                          payroll.basic_salary
                        )}
                      </td>

                      <td>
                        {formatCurrency(
                          payroll.hra
                        )}
                      </td>

                      <td>
                        {formatCurrency(
                          payroll.allowances
                        )}
                      </td>

                      <td>
                        {formatCurrency(
                          payroll.bonus
                        )}
                      </td>

                      <td>
                        {formatCurrency(
                          payroll.deductions
                        )}
                      </td>

                      <td>
                        <strong>
                          {formatCurrency(
                            payroll.gross_salary
                          )}
                        </strong>
                      </td>

                      <td>
                        <strong>
                          {formatCurrency(
                            payroll.net_salary
                          )}
                        </strong>
                      </td>

                      <td>

                        <span
                          className="payroll-status"
                          style={getStatusStyle(
                            payroll.status
                          )}
                        >
                          {status}
                        </span>

                      </td>

                      <td>

                        {status === "PENDING" && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              handleProcess(
                                payroll.id
                              )
                            }
                            className="payroll-action-process"
                          >
                            Process
                          </button>
                        )}

                        {status === "PROCESSED" && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              handlePay(
                                payroll.id
                              )
                            }
                            className="payroll-action-pay"
                          >
                            Pay
                          </button>
                        )}

                        {status === "PAID" && (
                          <span className="payroll-paid">
                            ✓ Paid
                          </span>
                        )}

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
  subtitle,
  icon,
}) => {
  return (
    <div className="content-card payroll-summary-card">

      <div className="payroll-summary-content">

        <div className="payroll-summary-text">

          <div className="payroll-summary-title">
            {title}
          </div>

          <div className="payroll-summary-value">
            {value}
          </div>

          <div className="payroll-summary-subtitle">
            {subtitle}
          </div>

        </div>

        <div className="payroll-summary-icon">
          {icon}
        </div>

      </div>

    </div>
  );
};

// ============================================================
// FORM INPUT
// ============================================================

const FormInput = ({
  label,
  name,
  type,
  value,
  onChange,
  placeholder,
  min,
  max,
}) => {
  return (
    <div>

      <label
        style={{
          display: "block",
          marginBottom: "7px",
          color: "#ffffff",
          fontSize: "13px",
          fontWeight: 600,
        }}
      >
        {label}
      </label>

      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        min={min}
        max={max}
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "11px 12px",
          borderRadius: "8px",
          border: "1px solid #475569",
          background: "#1e293b",
          color: "#ffffff",
        }}
      />

    </div>
  );
};

export default PayrollPage;