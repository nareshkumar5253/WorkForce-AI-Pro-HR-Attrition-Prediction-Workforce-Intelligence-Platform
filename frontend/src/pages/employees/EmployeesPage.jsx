
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getEmployees } from "../../services/employeeService";

function EmployeesPage() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  

  const [search, setSearch] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [jobRoleId, setJobRoleId] = useState("");
  const [employmentStatus, setEmploymentStatus] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {
        page,
        page_size: pageSize,
      };

      if (search.trim()) {
        params.search = search.trim();
      }

      if (departmentId) {
        params.department_id = Number(departmentId);
      }

      if (jobRoleId) {
        params.job_role_id = Number(jobRoleId);
      }

      if (employmentStatus) {
        params.employment_status = employmentStatus;
      }

      const data = await getEmployees(params);

      setEmployees(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      console.error("Failed to load employees:", err);

      if (err.response?.status === 401) {
        setError("Authentication required. Please login again.");
      } else {
        setError(
          err.response?.data?.detail ||
            "Unable to load employees from the backend."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, [page, departmentId, jobRoleId, employmentStatus]);

  const handleSearch = (event) => {
    event.preventDefault();

    if (page === 1) {
      loadEmployees();
    } else {
      setPage(1);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setDepartmentId("");
    setJobRoleId("");
    setEmploymentStatus("");
    setPage(1);
  };

  const handleRefresh = () => {
    loadEmployees();
  };

  const getInitials = (employee) => {
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

  const activeCount = employees.filter(
    (employee) => employee.employment_status === "ACTIVE"
  ).length;

  const inactiveCount = employees.filter(
    (employee) => employee.employment_status !== "ACTIVE"
  ).length;

  return (
    <div className="employees-page">
      {/* ======================================================
          PAGE HEADER
          ====================================================== */}

      <div className="page-header employee-page-header">
        <div>
          <p className="page-eyebrow">WORKFORCE MANAGEMENT</p>

          <h1>Employees</h1>

          <p className="page-description">
            Manage employees, search workforce records and review employee
            information.
          </p>
        </div>

        <div className="employee-header-summary">
          <div className="employee-total">
            <span>Total Employees</span>
            <strong>{total}</strong>
          </div>

          <button
            type="button"
            className="employee-refresh-button"
            onClick={handleRefresh}
            disabled={loading}
          >
            ↻
            <span>{loading ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* ======================================================
          WORKFORCE SUMMARY
          ====================================================== */}

      <div className="employee-summary-grid">
        <div className="employee-summary-card">
          <div className="employee-summary-icon blue">
            👥
          </div>

          <div>
            <span>Total Workforce</span>
            <strong>{total}</strong>
            <small>Employees in database</small>
          </div>
        </div>

        <div className="employee-summary-card">
          <div className="employee-summary-icon green">
            ✓
          </div>

          <div>
            <span>Active Employees</span>
            <strong>{activeCount}</strong>
            <small>Active records on this page</small>
          </div>
        </div>

        <div className="employee-summary-card">
          <div className="employee-summary-icon orange">
            ◐
          </div>

          <div>
            <span>Other Status</span>
            <strong>{inactiveCount}</strong>
            <small>Non-active records on this page</small>
          </div>
        </div>
      </div>

      {/* ======================================================
          SEARCH TOOLBAR
          ====================================================== */}

      <div className="employee-control-card">
        <div className="employee-control-header">
          <div>
            <h2>Employee Directory</h2>

            <p>
              Search and filter workforce records using employee information.
            </p>
          </div>

          {(search ||
            departmentId ||
            jobRoleId ||
            employmentStatus) && (
            <button
              type="button"
              className="clear-button"
              onClick={clearFilters}
            >
              Clear Filters
            </button>
          )}
        </div>

        <form
          className="employee-search-form"
          onSubmit={handleSearch}
        >
          <div className="employee-search-input">
            <span>⌕</span>

            <input
              type="text"
              placeholder="Search name, employee code or phone..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>

          <button
            type="submit"
            className="employee-search-button"
          >
            Search
          </button>
        </form>

        <div className="employee-filters">
          <div className="filter-group">
            <label>Department</label>

            <select
              value={departmentId}
              onChange={(event) => {
                setDepartmentId(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All Departments</option>
              <option value="1">Engineering</option>
              <option value="2">Human Resources</option>
              <option value="3">Finance</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Job Role</label>

            <select
              value={jobRoleId}
              onChange={(event) => {
                setJobRoleId(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All Job Roles</option>
              <option value="1">Software Engineer</option>
              <option value="2">HR Manager</option>
              <option value="3">
                Senior Software Engineer
              </option>
            </select>
          </div>

          <div className="filter-group">
            <label>Employment Status</label>

            <select
              value={employmentStatus}
              onChange={(event) => {
                setEmploymentStatus(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="ON_LEAVE">On Leave</option>
              <option value="RESIGNED">Resigned</option>
              <option value="TERMINATED">Terminated</option>
              <option value="RETIRED">Retired</option>
            </select>
          </div>
        </div>
      </div>

      {/* ======================================================
          ERROR
          ====================================================== */}

      {error && (
        <div className="employee-error">
          <div className="employee-error-icon">!</div>

          <div>
            <strong>Unable to load employees</strong>

            <p>{error}</p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
          >
            Retry
          </button>
        </div>
      )}

      {/* ======================================================
          EMPLOYEE TABLE
          ====================================================== */}

      <div className="employee-table-card">
        <div className="employee-table-header">
          <div>
            <div className="employee-table-title">
              <h2>Employee Records</h2>

              <span className="employee-record-count">
                {total} records
              </span>
            </div>

            <p>
              Workforce records from the employee management database.
            </p>
          </div>

          <div className="employee-page-indicator">
            Page <strong>{page}</strong> of{" "}
            <strong>{totalPages}</strong>
          </div>
        </div>

        {loading ? (
          <div className="employee-loading">
            <div className="employee-loader"></div>

            <strong>Loading employees</strong>

            <span>
              Retrieving workforce records...
            </span>
          </div>
        ) : employees.length === 0 ? (
          <div className="employee-empty">
            <div className="empty-icon">◈</div>

            <h3>No employees found</h3>

            <p>
              No employee records match your current search and
              filter criteria.
            </p>

            <button
              type="button"
              onClick={clearFilters}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="employee-table-wrapper">
            <table className="employee-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Employee Code</th>
                  <th>Department</th>
                  <th>Job Role</th>
                  <th>Joining Date</th>
                  <th>Salary</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {employees.map((employee) => (
                  <tr
  key={employee.id}
  className="employee-row-clickable"
  onClick={() => navigate(`/employees/${employee.id}`)}
>
                    {/* Employee */}
                    <td>
                      <div className="employee-name">
                        <div className="employee-avatar">
                          {getInitials(employee)}
                        </div>

                        <div className="employee-name-info">
                          <strong>
                            {employee.first_name}{" "}
                            {employee.last_name}
                          </strong>

                          <span>
                            {employee.city ||
                              "Location not available"}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Employee Code */}
                    <td>
                      <span className="employee-code">
                        {employee.employee_code || "-"}
                      </span>
                    </td>

                    {/* Department */}
                    <td>
                      <span className="employee-department">
                        {employee.department?.name || "-"}
                      </span>
                    </td>

                    {/* Job Role */}
                    <td>
                      <span className="employee-job-role">
                        {employee.job_role?.title || "-"}
                      </span>
                    </td>

                    {/* Joining Date */}
                    <td>
                      <span className="employee-date">
                        {formatDate(employee.joining_date)}
                      </span>
                    </td>

                    {/* Salary */}
                    <td>
                      <span className="employee-salary">
                        {formatSalary(employee.salary)}
                      </span>
                    </td>

                    {/* Status */}
                    <td>
                      <span
                        className={`status-badge ${String(
                          employee.employment_status || ""
                        ).toLowerCase()}`}
                      >
                        <span className="status-dot"></span>

                        {formatStatus(
                          employee.employment_status
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ====================================================
            PAGINATION
            ==================================================== */}

        <div className="employee-pagination">
          <div className="pagination-info">
            Showing{" "}
            <strong>
              {employees.length}
            </strong>{" "}
            of{" "}
            <strong>{total}</strong>{" "}
            employees
          </div>

          <div className="pagination-controls">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() =>
                setPage((current) => current - 1)
              }
            >
              ← Previous
            </button>

            <span className="pagination-current">
              {page}
            </span>

            <button
              type="button"
              disabled={
                page >= totalPages || loading
              }
              onClick={() =>
                setPage((current) => current + 1)
              }
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmployeesPage;
