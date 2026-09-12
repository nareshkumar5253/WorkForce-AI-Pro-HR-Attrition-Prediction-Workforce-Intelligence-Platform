
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getEmployee,
  updateEmployee,
} from "../../services/employeeService";

function EditEmployeePage() {
  const navigate = useNavigate();
  const { employeeId } = useParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    date_of_birth: "",
    gender: "",
    address: "",
    city: "",
    state: "",
    country: "",
    joining_date: "",
    department_id: "",
    job_role_id: "",
    manager_id: "",
    salary: "",
    employment_status: "ACTIVE",
  });

  useEffect(() => {
    const loadEmployee = async () => {
      try {
        setLoading(true);
        setError("");

        const employee = await getEmployee(employeeId);

        setFormData({
          first_name: employee.first_name || "",
          last_name: employee.last_name || "",
          phone: employee.phone || "",
          date_of_birth: employee.date_of_birth || "",
          gender: employee.gender || "",
          address: employee.address || "",
          city: employee.city || "",
          state: employee.state || "",
          country: employee.country || "",
          joining_date: employee.joining_date || "",
          department_id: employee.department_id || "",
          job_role_id: employee.job_role_id || "",
          manager_id: employee.manager_id || "",
          salary: employee.salary || "",
          employment_status:
            employee.employment_status || "ACTIVE",
        });
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

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone || null,
        date_of_birth: formData.date_of_birth || null,
        gender: formData.gender || null,
        address: formData.address || null,
        city: formData.city || null,
        state: formData.state || null,
        country: formData.country || null,
        joining_date: formData.joining_date,
        department_id: Number(formData.department_id),
        job_role_id: Number(formData.job_role_id),
        manager_id: formData.manager_id
          ? Number(formData.manager_id)
          : null,
        salary: formData.salary
          ? Number(formData.salary)
          : null,
        employment_status: formData.employment_status,
      };

      await updateEmployee(employeeId, payload);

      setSuccess("Employee information updated successfully.");

      setTimeout(() => {
        navigate(`/employees/${employeeId}`);
      }, 800);
    } catch (err) {
      console.error("Failed to update employee:", err);

      if (err.response?.status === 401) {
        setError("Authentication required. Please login again.");
      } else if (err.response?.status === 403) {
        setError(
          "You do not have permission to update this employee."
        );
      } else if (err.response?.status === 404) {
        setError("Employee record was not found.");
      } else if (err.response?.data?.detail) {
        setError(
          typeof err.response.data.detail === "string"
            ? err.response.data.detail
            : "Please check the entered employee information."
        );
      } else {
        setError(
          "Unable to update employee information. Please try again."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="employee-edit-page">
        <div className="employee-edit-loading">
          <div className="employee-loader"></div>

          <strong>Loading employee information</strong>

          <span>Preparing the edit form...</span>
        </div>
      </div>
    );
  }

  if (error && !formData.first_name) {
    return (
      <div className="employee-edit-page">
        <div className="employee-edit-error">
          <div className="employee-details-error-icon">
            !
          </div>

          <div>
            <h2>Unable to load employee</h2>
            <p>{error}</p>
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
    <div className="employee-edit-page">
      {/* Header */}

      <div className="employee-edit-topbar">
        <button
          type="button"
          className="employee-details-back"
          onClick={() => navigate(`/employees/${employeeId}`)}
        >
          ← Back to Employee
        </button>
      </div>

      <div className="employee-edit-header">
        <div>
          <p className="page-eyebrow">EMPLOYEE MANAGEMENT</p>

          <h1>Edit Employee</h1>

          <p>
            Update employee profile, employment and compensation
            information.
          </p>
        </div>

        <div className="employee-edit-code">
          Employee ID #{employeeId}
        </div>
      </div>

      {/* Alerts */}

      {error && (
        <div className="employee-edit-alert employee-edit-alert-error">
          <strong>Update failed</strong>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="employee-edit-alert employee-edit-alert-success">
          <strong>Success</strong>
          <span>{success}</span>
        </div>
      )}

      {/* Form */}

      <form
        className="employee-edit-form"
        onSubmit={handleSubmit}
      >
        {/* Personal Information */}

        <section className="employee-edit-card">
          <div className="employee-edit-card-header">
            <div className="employee-details-card-icon">
              👤
            </div>

            <div>
              <h2>Personal Information</h2>
              <p>Basic employee information</p>
            </div>
          </div>

          <div className="employee-edit-fields">
            <div className="employee-edit-field">
              <label htmlFor="first_name">
                First Name
              </label>

              <input
                id="first_name"
                name="first_name"
                type="text"
                value={formData.first_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="employee-edit-field">
              <label htmlFor="last_name">
                Last Name
              </label>

              <input
                id="last_name"
                name="last_name"
                type="text"
                value={formData.last_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="employee-edit-field">
              <label htmlFor="date_of_birth">
                Date of Birth
              </label>

              <input
                id="date_of_birth"
                name="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={handleChange}
              />
            </div>

            <div className="employee-edit-field">
              <label htmlFor="gender">
                Gender
              </label>

              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="">Select Gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>
        </section>

        {/* Contact Information */}

        <section className="employee-edit-card">
          <div className="employee-edit-card-header">
            <div className="employee-details-card-icon">
              ☎
            </div>

            <div>
              <h2>Contact Information</h2>
              <p>Employee contact and location</p>
            </div>
          </div>

          <div className="employee-edit-fields">
            <div className="employee-edit-field">
              <label htmlFor="phone">
                Phone
              </label>

              <input
                id="phone"
                name="phone"
                type="text"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div className="employee-edit-field employee-edit-field-wide">
              <label htmlFor="address">
                Address
              </label>

              <input
                id="address"
                name="address"
                type="text"
                value={formData.address}
                onChange={handleChange}
              />
            </div>

            <div className="employee-edit-field">
              <label htmlFor="city">
                City
              </label>

              <input
                id="city"
                name="city"
                type="text"
                value={formData.city}
                onChange={handleChange}
              />
            </div>

            <div className="employee-edit-field">
              <label htmlFor="state">
                State
              </label>

              <input
                id="state"
                name="state"
                type="text"
                value={formData.state}
                onChange={handleChange}
              />
            </div>

            <div className="employee-edit-field">
              <label htmlFor="country">
                Country
              </label>

              <input
                id="country"
                name="country"
                type="text"
                value={formData.country}
                onChange={handleChange}
              />
            </div>
          </div>
        </section>

        {/* Employment Information */}

        <section className="employee-edit-card">
          <div className="employee-edit-card-header">
            <div className="employee-details-card-icon">
              💼
            </div>

            <div>
              <h2>Employment Information</h2>
              <p>Workforce assignment and employment status</p>
            </div>
          </div>

          <div className="employee-edit-fields">
            <div className="employee-edit-field">
              <label htmlFor="joining_date">
                Joining Date
              </label>

              <input
                id="joining_date"
                name="joining_date"
                type="date"
                value={formData.joining_date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="employee-edit-field">
              <label htmlFor="department_id">
                Department ID
              </label>

              <input
                id="department_id"
                name="department_id"
                type="number"
                min="1"
                value={formData.department_id}
                onChange={handleChange}
                required
              />
            </div>

            <div className="employee-edit-field">
              <label htmlFor="job_role_id">
                Job Role ID
              </label>

              <input
                id="job_role_id"
                name="job_role_id"
                type="number"
                min="1"
                value={formData.job_role_id}
                onChange={handleChange}
                required
              />
            </div>

            <div className="employee-edit-field">
              <label htmlFor="manager_id">
                Manager ID
              </label>

              <input
                id="manager_id"
                name="manager_id"
                type="number"
                min="1"
                value={formData.manager_id}
                onChange={handleChange}
                placeholder="Optional"
              />
            </div>

            <div className="employee-edit-field">
              <label htmlFor="employment_status">
                Employment Status
              </label>

              <select
                id="employment_status"
                name="employment_status"
                value={formData.employment_status}
                onChange={handleChange}
              >
                <option value="ACTIVE">Active</option>
                <option value="ON_LEAVE">On Leave</option>
                <option value="RESIGNED">Resigned</option>
                <option value="TERMINATED">Terminated</option>
                <option value="RETIRED">Retired</option>
              </select>
            </div>
          </div>
        </section>

        {/* Compensation */}

        <section className="employee-edit-card">
          <div className="employee-edit-card-header">
            <div className="employee-details-card-icon">
              ₹
            </div>

            <div>
              <h2>Compensation</h2>
              <p>Current employee salary</p>
            </div>
          </div>

          <div className="employee-edit-fields">
            <div className="employee-edit-field">
              <label htmlFor="salary">
                Annual Salary
              </label>

              <input
                id="salary"
                name="salary"
                type="number"
                min="0"
                step="0.01"
                value={formData.salary}
                onChange={handleChange}
                placeholder="75000"
              />
            </div>
          </div>
        </section>

        {/* Actions */}

        <div className="employee-edit-actions">
          <button
            type="button"
            className="employee-edit-cancel"
            onClick={() =>
              navigate(`/employees/${employeeId}`)
            }
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="employee-edit-save"
            disabled={saving}
          >
            {saving ? "Saving Changes..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditEmployeePage;
