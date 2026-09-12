import React, { useEffect, useState } from "react";
import predictionService from "../../services/predictionService";

const initialForm = {
  employee_id: 1,
  age: 30,
  monthly_income: 50000,
  job_sat: 3,
  years_at_company: 5,
  distance_km: 10,
  performance: 3,
  work_life: 3,
  overtime_risk: 0,
  low_job_satisfaction: 0,
  poor_work_life_balance: 0,
  low_performance: 0,
  department: "Sales",
  job_role: "Sales Executive",
  overtime: "No",
  education: "Bachelor",
  marital: "Single",
};

export default function AttritionPredictionPage() {
  const [form, setForm] = useState(initialForm);
  const [prediction, setPrediction] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setHistoryLoading(true);

      const data =
        await predictionService.getPredictions();

      setHistory(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    const numericFields = [
      "employee_id",
      "age",
      "monthly_income",
      "job_sat",
      "years_at_company",
      "distance_km",
      "performance",
      "work_life",
      "overtime_risk",
      "low_job_satisfaction",
      "poor_work_life_balance",
      "low_performance",
    ];

    setForm((prev) => ({
      ...prev,
      [name]: numericFields.includes(name)
        ? Number(value)
        : value,
    }));
  };

  const handlePredict = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");

      const employeeData = {
        age: form.age,
        monthly_income: form.monthly_income,
        job_sat: form.job_sat,
        years_at_company: form.years_at_company,
        distance_km: form.distance_km,
        performance: form.performance,
        work_life: form.work_life,
        overtime_risk: form.overtime_risk,
        low_job_satisfaction:
          form.low_job_satisfaction,
        poor_work_life_balance:
          form.poor_work_life_balance,
        low_performance:
          form.low_performance,
        department: form.department,
        job_role: form.job_role,
        overtime: form.overtime,
        education: form.education,
        marital: form.marital,
      };

      const result =
        await predictionService.predictAttrition({
          employee_id: form.employee_id,
          employee_data: employeeData,
        });

      setPrediction(result);

      await loadHistory();
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.detail ||
          "Prediction failed. Please check the employee details."
      );
    } finally {
      setLoading(false);
    }
  };

  const riskClass =
    prediction?.risk_level === "HIGH"
      ? "high"
      : prediction?.risk_level === "MEDIUM"
      ? "medium"
      : "low";

  const predictionText =
    prediction?.prediction === 1
      ? "Likely to Leave"
      : "Likely to Stay";

  const probability =
    prediction?.attrition_probability ?? 0;

  return (
    <div className="attrition-page">
      <style>{`
        .attrition-page {
          min-height: 100vh;
          padding: 30px;
          background: #09111f;
          color: #ffffff;
        }

        .attrition-header {
          margin-bottom: 28px;
        }

        .attrition-header h1 {
          margin: 0;
          font-size: 30px;
          font-weight: 700;
        }

        .attrition-header p {
          margin: 8px 0 0;
          color: #94a3b8;
          font-size: 15px;
        }

        .prediction-layout {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 24px;
          align-items: start;
        }

        .panel {
          background: #111c2d;
          border: 1px solid #22324a;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        }

        .panel-title {
          font-size: 19px;
          font-weight: 700;
          margin-bottom: 20px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .field label {
          font-size: 13px;
          color: #cbd5e1;
          font-weight: 600;
        }

        .field input,
        .field select {
          width: 100%;
          box-sizing: border-box;
          padding: 11px 12px;
          border-radius: 9px;
          border: 1px solid #334155;
          background: #0b1628;
          color: #ffffff;
          outline: none;
        }

        .field input:focus,
        .field select:focus {
          border-color: #3b82f6;
        }

        .full-width {
          grid-column: 1 / -1;
        }

        .predict-button {
          width: 100%;
          margin-top: 22px;
          padding: 13px;
          border: none;
          border-radius: 10px;
          background: #2563eb;
          color: white;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
        }

        .predict-button:hover {
          background: #1d4ed8;
        }

        .predict-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .result-empty {
          min-height: 260px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: #64748b;
        }

        .result-box {
          text-align: center;
        }

        .risk-badge {
          display: inline-block;
          padding: 8px 18px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 20px;
        }

        .risk-badge.low {
          background: #064e3b;
          color: #6ee7b7;
        }

        .risk-badge.medium {
          background: #78350f;
          color: #fde68a;
        }

        .risk-badge.high {
          background: #7f1d1d;
          color: #fca5a5;
        }

        .result-main {
          font-size: 30px;
          font-weight: 800;
          margin-bottom: 8px;
        }

        .probability {
          font-size: 18px;
          color: #93c5fd;
          margin-bottom: 24px;
        }

        .result-details {
          display: grid;
          gap: 12px;
          text-align: left;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 12px;
          background: #0b1628;
          border-radius: 9px;
          border: 1px solid #1e293b;
        }

        .detail-label {
          color: #94a3b8;
        }

        .detail-value {
          color: #ffffff;
          font-weight: 600;
        }

        .history-panel {
          margin-top: 24px;
        }

        .table-wrapper {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th {
          text-align: left;
          padding: 14px 12px;
          border-bottom: 1px solid #334155;
          color: #94a3b8;
          font-size: 13px;
        }

        td {
          padding: 14px 12px;
          border-bottom: 1px solid #1e293b;
          color: #ffffff;
          font-size: 14px;
        }

        .status-stay {
          color: #6ee7b7;
          font-weight: 700;
        }

        .status-leave {
          color: #fca5a5;
          font-weight: 700;
        }

        .error-message {
          margin-bottom: 18px;
          padding: 12px;
          border-radius: 9px;
          background: #450a0a;
          border: 1px solid #7f1d1d;
          color: #fecaca;
        }

        @media (max-width: 1000px) {
          .prediction-layout {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 700px) {
          .attrition-page {
            padding: 18px;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="attrition-header">
        <h1>AI Attrition Prediction</h1>
        <p>
          Predict employee attrition risk using the trained
          machine learning model.
        </p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="prediction-layout">
        <div className="panel">
          <div className="panel-title">
            Employee Information
          </div>

          <form onSubmit={handlePredict}>
            <div className="form-grid">
              <div className="field">
                <label>Employee ID</label>
                <input
                  type="number"
                  name="employee_id"
                  value={form.employee_id}
                  onChange={handleChange}
                  min="1"
                  required
                />
              </div>

              <div className="field">
                <label>Age</label>
                <input
                  type="number"
                  name="age"
                  value={form.age}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="field">
                <label>Monthly Income</label>
                <input
                  type="number"
                  name="monthly_income"
                  value={form.monthly_income}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="field">
                <label>Job Satisfaction</label>
                <select
                  name="job_sat"
                  value={form.job_sat}
                  onChange={handleChange}
                >
                  <option value={1}>1 - Low</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4 - High</option>
                </select>
              </div>

              <div className="field">
                <label>Years at Company</label>
                <input
                  type="number"
                  name="years_at_company"
                  value={form.years_at_company}
                  onChange={handleChange}
                  min="0"
                  required
                />
              </div>

              <div className="field">
                <label>Distance from Home (km)</label>
                <input
                  type="number"
                  name="distance_km"
                  value={form.distance_km}
                  onChange={handleChange}
                  min="0"
                  required
                />
              </div>

              <div className="field">
                <label>Performance</label>
                <select
                  name="performance"
                  value={form.performance}
                  onChange={handleChange}
                >
                  <option value={1}>1 - Low</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4 - High</option>
                </select>
              </div>

              <div className="field">
                <label>Work Life Balance</label>
                <select
                  name="work_life"
                  value={form.work_life}
                  onChange={handleChange}
                >
                  <option value={1}>1 - Low</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4 - High</option>
                </select>
              </div>

              <div className="field">
                <label>Overtime Risk</label>
                <input
                  type="number"
                  name="overtime_risk"
                  value={form.overtime_risk}
                  onChange={handleChange}
                  min="0"
                  max="1"
                />
              </div>

              <div className="field">
                <label>Low Job Satisfaction</label>
                <input
                  type="number"
                  name="low_job_satisfaction"
                  value={form.low_job_satisfaction}
                  onChange={handleChange}
                  min="0"
                  max="1"
                />
              </div>

              <div className="field">
                <label>Poor Work Life Balance</label>
                <input
                  type="number"
                  name="poor_work_life_balance"
                  value={form.poor_work_life_balance}
                  onChange={handleChange}
                  min="0"
                  max="1"
                />
              </div>

              <div className="field">
                <label>Low Performance</label>
                <input
                  type="number"
                  name="low_performance"
                  value={form.low_performance}
                  onChange={handleChange}
                  min="0"
                  max="1"
                />
              </div>

              <div className="field">
                <label>Department</label>
                <input
                  type="text"
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="field">
                <label>Job Role</label>
                <input
                  type="text"
                  name="job_role"
                  value={form.job_role}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="field">
                <label>Overtime</label>
                <select
                  name="overtime"
                  value={form.overtime}
                  onChange={handleChange}
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>

              <div className="field">
                <label>Education</label>
                <input
                  type="text"
                  name="education"
                  value={form.education}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="field">
                <label>Marital Status</label>
                <select
                  name="marital"
                  value={form.marital}
                  onChange={handleChange}
                >
                  <option value="Single">
                    Single
                  </option>
                  <option value="Married">
                    Married
                  </option>
                  <option value="Divorced">
                    Divorced
                  </option>
                </select>
              </div>
            </div>

            <button
              className="predict-button"
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Predicting..."
                : "Predict Attrition"}
            </button>
          </form>
        </div>

        <div className="panel">
          <div className="panel-title">
            Prediction Result
          </div>

          {!prediction ? (
            <div className="result-empty">
              Enter employee information and click
              <br />
              "Predict Attrition" to see the result.
            </div>
          ) : (
            <div className="result-box">
              <div className={`risk-badge ${riskClass}`}>
                {prediction.risk_level} RISK
              </div>

              <div className="result-main">
                {predictionText}
              </div>

              <div className="probability">
                Attrition Probability:{" "}
                {probability.toFixed(2)}%
              </div>

              <div className="result-details">
                <div className="detail-row">
                  <span className="detail-label">
                    Employee ID
                  </span>
                  <span className="detail-value">
                    {prediction.employee_id}
                  </span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">
                    Prediction
                  </span>
                  <span className="detail-value">
                    {prediction.prediction}
                  </span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">
                    Model
                  </span>
                  <span className="detail-value">
                    {prediction.model_name}
                  </span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">
                    Prediction ID
                  </span>
                  <span className="detail-value">
                    {prediction.id}
                  </span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">
                    Created At
                  </span>
                  <span className="detail-value">
                    {new Date(
                      prediction.created_at
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="panel history-panel">
        <div className="panel-title">
          Prediction History
        </div>

        {historyLoading ? (
          <div className="result-empty">
            Loading prediction history...
          </div>
        ) : history.length === 0 ? (
          <div className="result-empty">
            No predictions available yet.
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Employee</th>
                  <th>Prediction</th>
                  <th>Probability</th>
                  <th>Risk</th>
                  <th>Model</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>
                {history.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>
                      Employee #{item.employee_id}
                    </td>
                    <td>
                      <span
                        className={
                          item.prediction === 1
                            ? "status-leave"
                            : "status-stay"
                        }
                      >
                        {item.prediction === 1
                          ? "Likely to Leave"
                          : "Likely to Stay"}
                      </span>
                    </td>
                    <td>
                      {Number(
                        item.attrition_probability
                      ).toFixed(2)}
                      %
                    </td>
                    <td>{item.risk_level}</td>
                    <td>{item.model_name}</td>
                    <td>
                      {new Date(
                        item.created_at
                      ).toLocaleDateString()}
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
}