
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getEmployee } from "../../services/employeeService";

function EmployeeDetailsPage() {
  const navigate = useNavigate();
  const { employeeId } = useParams();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadEmployee = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getEmployee(employeeId);
        setEmployee(data);
      } catch (err) {
        console.error("Failed to load employee:", err);

        if (err.response?.status === 404) {
          setError("Employee record was not found.");
        } else if (err.response?.status === 401) {
          setError("Authentication required. Please login again.");
        } else {
          setError(
            err.response?.data?.detail ||
              "Unable to load employee information."
          );
        }
      } finally {
        setLoading(false);
      }
    };

    loadEmployee();
  }, [employeeId]);

  const getInitials = () => {
    if (!employee) return "EM";

    const first = employee.first_name?.charAt(0) || "";
    const last = employee.last_name?.charAt(0) || "";

    return `${first}${last}`.toUpperCase() || "EM";
  };

  const formatStatus = (status) => {
    if (!status) return "-";

    return status
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  const formatDate = (date) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatSalary = (salary) => {
    if (salary === null || salary === undefined || salary === "") {
      return "-";
    }

    return `₹${Number(salary).toLocaleString("en-IN")}`;
  };

  if (loading) {
    return (
      <div className="employee-details-page">
        <div className="employee-details-loading">
          <div className="employee-loader"></div>

          <strong>Loading employee profile</strong>

          <span>Retrieving employee information...</span>
        </div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="employee-details-page">
        <div className="employee-details-error">
          <div className="employee-details-error-icon">!</div>

          <div>
            <h2>Unable to load employee</h2>
            <p>{error || "Employee information is unavailable."}</p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/employees")}
          >
            Back to Employees
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="employee-details-page">
      {/* ======================================================
          TOP ACTIONS
          ====================================================== */}

      <div className="employee-details-actions">
        <button
          type="button"
          className="employee-details-back"
          onClick={() => navigate("/employees")}
        >
          ← Back to Employees
        </button>

        <button
          type="button"
          className="employee-details-edit-button"
          onClick={() => navigate(`/employees/${employee.id}/edit`)}
        >
          ✎ Edit Employee
        </button>
      </div>

      {/* ======================================================
          PROFILE HEADER
          ====================================================== */}

      <div className="employee-details-header">
        <div className="employee-details-profile">
          <div className="employee-details-avatar">
            {getInitials()}
          </div>

          <div className="employee-details-heading">
            <p className="page-eyebrow">EMPLOYEE PROFILE</p>

            <h1>
              {employee.first_name} {employee.last_name}
            </h1>

            <div className="employee-details-meta">
              <span>
                {employee.employee_code || "No employee code"}
              </span>

              <span>•</span>

              <span>
                {employee.job_role?.title || "Role not assigned"}
              </span>

              <span>•</span>

              <span>
                {employee.department?.name || "Department not assigned"}
              </span>
            </div>
          </div>
        </div>

        <div className="employee-details-status">
          <span className="status-dot"></span>

          {formatStatus(employee.employment_status)}
        </div>
      </div>

      {/* ======================================================
          PROFILE SUMMARY
          ====================================================== */}

      <div className="employee-details-summary-grid">
        <div className="employee-details-summary-card">
          <span>Employee Code</span>
          <strong>{employee.employee_code || "-"}</strong>
        </div>

        <div className="employee-details-summary-card">
          <span>Department</span>
          <strong>{employee.department?.name || "-"}</strong>
        </div>

        <div className="employee-details-summary-card">
          <span>Job Role</span>
          <strong>{employee.job_role?.title || "-"}</strong>
        </div>

        <div className="employee-details-summary-card">
          <span>Joining Date</span>
          <strong>{formatDate(employee.joining_date)}</strong>
        </div>
      </div>

      {/* ======================================================
          INFORMATION GRID
          ====================================================== */}

      <div className="employee-details-grid">
        {/* Personal Information */}

        <div className="employee-details-card">
          <div className="employee-details-card-header">
            <div className="employee-details-card-icon">
              👤
            </div>

            <div>
              <h2>Personal Information</h2>
              <p>Basic employee information</p>
            </div>
          </div>

          <div className="employee-info-list">
            <div className="employee-info-row">
              <span>First Name</span>
              <strong>{employee.first_name || "-"}</strong>
            </div>

            <div className="employee-info-row">
              <span>Last Name</span>
              <strong>{employee.last_name || "-"}</strong>
            </div>

            <div className="employee-info-row">
              <span>Date of Birth</span>
              <strong>
                {formatDate(employee.date_of_birth)}
              </strong>
            </div>

            <div className="employee-info-row">
              <span>Gender</span>
              <strong>{employee.gender || "-"}</strong>
            </div>
          </div>
        </div>

        {/* Contact Information */}

        <div className="employee-details-card">
          <div className="employee-details-card-header">
            <div className="employee-details-card-icon">
              ☎
            </div>

            <div>
              <h2>Contact Information</h2>
              <p>Employee contact and location</p>
            </div>
          </div>

          <div className="employee-info-list">
            <div className="employee-info-row">
              <span>Phone</span>
              <strong>{employee.phone || "-"}</strong>
            </div>

            <div className="employee-info-row">
              <span>Address</span>
              <strong>{employee.address || "-"}</strong>
            </div>

            <div className="employee-info-row">
              <span>City</span>
              <strong>{employee.city || "-"}</strong>
            </div>

            <div className="employee-info-row">
              <span>State</span>
              <strong>{employee.state || "-"}</strong>
            </div>

            <div className="employee-info-row">
              <span>Country</span>
              <strong>{employee.country || "-"}</strong>
            </div>
          </div>
        </div>

        {/* Employment Information */}

        <div className="employee-details-card">
          <div className="employee-details-card-header">
            <div className="employee-details-card-icon">
              💼
            </div>

            <div>
              <h2>Employment Information</h2>
              <p>Current workforce assignment</p>
            </div>
          </div>

          <div className="employee-info-list">
            <div className="employee-info-row">
              <span>Employee Code</span>
              <strong>{employee.employee_code || "-"}</strong>
            </div>

            <div className="employee-info-row">
              <span>Department</span>
              <strong>
                {employee.department?.name || "-"}
              </strong>
            </div>

            <div className="employee-info-row">
              <span>Job Role</span>
              <strong>
                {employee.job_role?.title || "-"}
              </strong>
            </div>

            <div className="employee-info-row">
              <span>Manager</span>
              <strong>
                {employee.manager
                  ? `${employee.manager.first_name || ""} ${
                      employee.manager.last_name || ""
                    }`.trim()
                  : "No manager assigned"}
              </strong>
            </div>

            <div className="employee-info-row">
              <span>Joining Date</span>
              <strong>
                {formatDate(employee.joining_date)}
              </strong>
            </div>
          </div>
        </div>

        {/* Compensation */}

        <div className="employee-details-card">
          <div className="employee-details-card-header">
            <div className="employee-details-card-icon">
              ₹
            </div>

            <div>
              <h2>Compensation</h2>
              <p>Current salary information</p>
            </div>
          </div>

          <div className="employee-compensation">
            <span>Current Salary</span>

            <strong>
              {formatSalary(employee.salary)}
            </strong>

            <small>Annual compensation</small>
          </div>
        </div>
      </div>

      {/* ======================================================
          RECORD INFORMATION
          ====================================================== */}

      <div className="employee-details-card employee-record-information">
        <div className="employee-details-card-header">
          <div className="employee-details-card-icon">
            ℹ
          </div>

          <div>
            <h2>Record Information</h2>
            <p>Employee record metadata</p>
          </div>
        </div>

        <div className="employee-record-grid">
          <div>
            <span>Record ID</span>
            <strong>#{employee.id}</strong>
          </div>

          <div>
            <span>User ID</span>
            <strong>
              {employee.user_id ?? "-"}
            </strong>
          </div>

          <div>
            <span>Created</span>
            <strong>
              {formatDate(employee.created_at)}
            </strong>
          </div>

          <div>
            <span>Last Updated</span>
            <strong>
              {formatDate(employee.updated_at)}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmployeeDetailsPage;
