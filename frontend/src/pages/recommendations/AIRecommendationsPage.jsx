import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import recommendationService from "../../services/recommendationService";

export default function AIRecommendationsPage() {
  const [summary, setSummary] = useState({
    total_recommendations: 0,
    new_recommendations: 0,
    reviewed_recommendations: 0,
    accepted_recommendations: 0,
    implemented_recommendations: 0,
    dismissed_recommendations: 0,
    low_priority: 0,
    medium_priority: 0,
    high_priority: 0,
    urgent_priority: 0,
  });

  const [recommendations, setRecommendations] =
    useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);

  const [generating, setGenerating] =
    useState(false);

  const [employeeId, setEmployeeId] =
    useState(1);

  const [search, setSearch] = useState("");

  const [priorityFilter, setPriorityFilter] =
    useState("ALL");

  const [statusFilter, setStatusFilter] =
    useState("ALL");

  const [selectedRecommendation, setSelectedRecommendation] =
    useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        summaryData,
        recommendationData,
      ] = await Promise.all([
        recommendationService.getSummary(),
        recommendationService.getRecommendations(),
      ]);

      setSummary(
        summaryData || {}
      );

      setRecommendations(
        recommendationData || []
      );
    } catch (err) {
      console.error(
        "Recommendation loading failed:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Unable to load AI recommendations."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setError("");
      setSuccess("");

      const [
        summaryData,
        recommendationData,
      ] = await Promise.all([
        recommendationService.getSummary(),
        recommendationService.getRecommendations(),
      ]);

      setSummary(
        summaryData || {}
      );

      setRecommendations(
        recommendationData || []
      );

      setSuccess(
        "Recommendations refreshed successfully."
      );
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.detail ||
          "Unable to refresh recommendations."
      );
    } finally {
      setRefreshing(false);
    }
  };

  const handleGenerate = async () => {
    if (!employeeId) {
      setError("Please enter an employee ID.");
      return;
    }

    try {
      setGenerating(true);
      setError("");
      setSuccess("");

      const result =
        await recommendationService.generateRecommendations(
          Number(employeeId)
        );

      await loadRecommendations();

      const generatedCount =
        Array.isArray(result)
          ? result.length
          : Array.isArray(result?.recommendations)
          ? result.recommendations.length
          : null;

      setSuccess(
        generatedCount !== null
          ? `${generatedCount} recommendation${
              generatedCount === 1 ? "" : "s"
            } generated successfully.`
          : "Recommendations generated successfully."
      );
    } catch (err) {
      console.error(
        "Recommendation generation failed:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Unable to generate recommendations."
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleUpdateStatus = async (
    recommendation,
    status
  ) => {
    try {
      setError("");
      setSuccess("");

      await recommendationService.updateRecommendation(
        recommendation.id,
        {
          status,
        }
      );

      await loadRecommendations();

      setSelectedRecommendation(null);

      setSuccess(
        `Recommendation marked as ${status}.`
      );
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.detail ||
          "Unable to update recommendation."
      );
    }
  };

  const filteredRecommendations = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return recommendations.filter(
      (item) => {
        const matchesSearch =
          !query ||
          String(item.employee_id)
            .toLowerCase()
            .includes(query) ||
          String(
            item.recommendation_type || ""
          )
            .toLowerCase()
            .includes(query) ||
          String(item.title || "")
            .toLowerCase()
            .includes(query) ||
          String(
            item.recommendation || ""
          )
            .toLowerCase()
            .includes(query);

        const matchesPriority =
          priorityFilter === "ALL" ||
          item.priority === priorityFilter;

        const matchesStatus =
          statusFilter === "ALL" ||
          item.status === statusFilter;

        return (
          matchesSearch &&
          matchesPriority &&
          matchesStatus
        );
      }
    );
  }, [
    recommendations,
    search,
    priorityFilter,
    statusFilter,
  ]);

  const getPriorityClass = (
    priority
  ) => {
    switch (
      String(
        priority || ""
      ).toUpperCase()
    ) {
      case "URGENT":
        return "priority-urgent";

      case "HIGH":
        return "priority-high";

      case "MEDIUM":
        return "priority-medium";

      default:
        return "priority-low";
    }
  };

  const getStatusClass = (
    status
  ) => {
    switch (
      String(
        status || ""
      ).toUpperCase()
    ) {
      case "REVIEWED":
        return "status-reviewed";

      case "ACCEPTED":
        return "status-accepted";

      case "IMPLEMENTED":
        return "status-implemented";

      case "DISMISSED":
        return "status-dismissed";

      default:
        return "status-new";
    }
  };

  const formatDate = (value) => {
    if (!value) {
      return "-";
    }

    const date = new Date(value);

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
      <div className="recommendation-page">
        <style>
          {recommendationStyles}
        </style>

        <div className="recommendation-loading">
          <div className="recommendation-spinner"></div>

          <h2>
            Loading AI recommendations...
          </h2>

          <p>
            Fetching workforce intervention
            recommendations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="recommendation-page">
      <style>
        {recommendationStyles}
      </style>

      {/* =====================================================
          HEADER
          ===================================================== */}

      <div className="recommendation-header">
        <div>
          <div className="recommendation-eyebrow">
            AI WORKFORCE INTELLIGENCE
          </div>

          <h1>
            AI Recommendations
          </h1>

          <p>
            Review AI-generated workforce
            actions and manage employee
            intervention recommendations.
          </p>
        </div>

        <button
          type="button"
          className="recommendation-refresh"
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
        <div className="recommendation-error">
          {error}
        </div>
      )}

      {success && (
        <div className="recommendation-success">
          {success}
        </div>
      )}

      {/* =====================================================
          SUMMARY
          ===================================================== */}

      <div className="recommendation-summary-grid">

        <SummaryCard
          title="Total Recommendations"
          value={
            summary.total_recommendations
          }
          icon="✦"
          className="summary-purple"
        />

        <SummaryCard
          title="New"
          value={
            summary.new_recommendations
          }
          icon="●"
          className="summary-blue"
        />

        <SummaryCard
          title="Reviewed"
          value={
            summary.reviewed_recommendations
          }
          icon="✓"
          className="summary-green"
        />

        <SummaryCard
          title="High Priority"
          value={
            summary.high_priority
          }
          icon="▲"
          className="summary-orange"
        />

        <SummaryCard
          title="Urgent"
          value={
            summary.urgent_priority
          }
          icon="⚠"
          className="summary-red"
        />

      </div>

      {/* =====================================================
          GENERATE RECOMMENDATIONS
          ===================================================== */}

      <div className="generate-panel">

        <div className="generate-icon">
          ✦
        </div>

        <div className="generate-content">

          <h2>
            Generate AI Recommendations
          </h2>

          <p>
            Run the AI recommendation engine
            for a specific employee.
          </p>

        </div>

        <div className="generate-controls">

          <input
            type="number"
            min="1"
            value={employeeId}
            onChange={(event) =>
              setEmployeeId(
                event.target.value
              )
            }
            placeholder="Employee ID"
          />

          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating
              ? "Generating..."
              : "Generate Recommendations"}
          </button>

        </div>

      </div>

      {/* =====================================================
          PRIORITY OVERVIEW
          ===================================================== */}

      <div className="priority-overview">

        <PriorityCard
          label="Low"
          value={
            summary.low_priority
          }
          className="overview-low"
        />

        <PriorityCard
          label="Medium"
          value={
            summary.medium_priority
          }
          className="overview-medium"
        />

        <PriorityCard
          label="High"
          value={
            summary.high_priority
          }
          className="overview-high"
        />

        <PriorityCard
          label="Urgent"
          value={
            summary.urgent_priority
          }
          className="overview-urgent"
        />

      </div>

      {/* =====================================================
          RECOMMENDATIONS PANEL
          ===================================================== */}

      <div className="recommendation-panel">

        <div className="recommendation-panel-header">

          <div>
            <h2>
              Workforce Recommendations
            </h2>

            <p>
              AI-generated actions for HR,
              managers and workforce teams.
            </p>
          </div>

          <div className="recommendation-count">
            {filteredRecommendations.length}{" "}
            records
          </div>

        </div>

        {/* FILTERS */}

        <div className="recommendation-filters">

          <div className="recommendation-search">
            <span>⌕</span>

            <input
              type="text"
              placeholder="Search recommendations..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />
          </div>

          <select
            value={priorityFilter}
            onChange={(event) =>
              setPriorityFilter(
                event.target.value
              )
            }
          >
            <option value="ALL">
              All Priorities
            </option>

            <option value="URGENT">
              Urgent
            </option>

            <option value="HIGH">
              High
            </option>

            <option value="MEDIUM">
              Medium
            </option>

            <option value="LOW">
              Low
            </option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
          >
            <option value="ALL">
              All Statuses
            </option>

            <option value="NEW">
              New
            </option>

            <option value="REVIEWED">
              Reviewed
            </option>

            <option value="ACCEPTED">
              Accepted
            </option>

            <option value="IMPLEMENTED">
              Implemented
            </option>

            <option value="DISMISSED">
              Dismissed
            </option>
          </select>

        </div>

        {/* RECOMMENDATION CARDS */}

        {filteredRecommendations.length ===
        0 ? (
          <div className="recommendation-empty">

            <div>
              ◎
            </div>

            <h3>
              No recommendations found
            </h3>

            <p>
              Try changing your filters or
              generate recommendations for
              an employee.
            </p>

          </div>
        ) : (
          <div className="recommendation-list">

            {filteredRecommendations.map(
              (item) => (
                <div
                  className="recommendation-card"
                  key={item.id}
                >

                  <div className="recommendation-card-top">

                    <div className="recommendation-type">
                      {item.recommendation_type}
                    </div>

                    <div className="recommendation-badges">

                      <span
                        className={`priority-badge ${getPriorityClass(
                          item.priority
                        )}`}
                      >
                        {item.priority}
                      </span>

                      <span
                        className={`status-badge ${getStatusClass(
                          item.status
                        )}`}
                      >
                        {item.status}
                      </span>

                    </div>

                  </div>

                  <h3>
                    {item.title}
                  </h3>

                  <p className="recommendation-text">
                    {item.recommendation}
                  </p>

                  <div className="recommendation-reason">
                    <strong>
                      Why this recommendation?
                    </strong>

                    <span>
                      {item.reason}
                    </span>
                  </div>

                  <div className="recommendation-card-footer">

                    <div className="recommendation-meta">

                      <span>
                        Employee #
                        {item.employee_id}
                      </span>

                      <span>
                        {item.generated_by}
                      </span>

                      <span>
                        {formatDate(
                          item.created_at
                        )}
                      </span>

                    </div>

                    <button
                      type="button"
                      className="details-button"
                      onClick={() =>
                        setSelectedRecommendation(
                          item
                        )
                      }
                    >
                      View Details
                    </button>

                  </div>

                </div>
              )
            )}

          </div>
        )}

      </div>

      {/* =====================================================
          DETAIL MODAL
          ===================================================== */}

      {selectedRecommendation && (
        <div className="recommendation-modal-backdrop">

          <div className="recommendation-modal">

            <div className="recommendation-modal-header">

              <div>
                <span className="modal-eyebrow">
                  AI RECOMMENDATION
                </span>

                <h2>
                  {
                    selectedRecommendation.title
                  }
                </h2>

                <p>
                  Employee #
                  {
                    selectedRecommendation.employee_id
                  }
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() =>
                  setSelectedRecommendation(
                    null
                  )
                }
              >
                ×
              </button>

            </div>

            <div className="modal-badges">

              <span
                className={`priority-badge ${getPriorityClass(
                  selectedRecommendation.priority
                )}`}
              >
                {
                  selectedRecommendation.priority
                }
              </span>

              <span
                className={`status-badge ${getStatusClass(
                  selectedRecommendation.status
                )}`}
              >
                {
                  selectedRecommendation.status
                }
              </span>

              <span className="type-badge">
                {
                  selectedRecommendation.recommendation_type
                }
              </span>

            </div>

            <div className="modal-section">

              <h3>
                Recommendation
              </h3>

              <p>
                {
                  selectedRecommendation.recommendation
                }
              </p>

            </div>

            <div className="modal-section">

              <h3>
                Reason
              </h3>

              <p>
                {
                  selectedRecommendation.reason
                }
              </p>

            </div>

            <div className="modal-information-grid">

              <div>
                <span>
                  Recommendation ID
                </span>

                <strong>
                  {
                    selectedRecommendation.id
                  }
                </strong>
              </div>

              <div>
                <span>
                  Employee ID
                </span>

                <strong>
                  {
                    selectedRecommendation.employee_id
                  }
                </strong>
              </div>

              <div>
                <span>
                  Generated By
                </span>

                <strong>
                  {
                    selectedRecommendation.generated_by
                  }
                </strong>
              </div>

              <div>
                <span>
                  Created
                </span>

                <strong>
                  {formatDate(
                    selectedRecommendation.created_at
                  )}
                </strong>
              </div>

            </div>

            <div className="modal-actions">

              {selectedRecommendation.status !==
                "REVIEWED" && (
                <button
                  type="button"
                  className="action-reviewed"
                  onClick={() =>
                    handleUpdateStatus(
                      selectedRecommendation,
                      "REVIEWED"
                    )
                  }
                >
                  Mark Reviewed
                </button>
              )}

              {selectedRecommendation.status !==
                "ACCEPTED" && (
                <button
                  type="button"
                  className="action-accepted"
                  onClick={() =>
                    handleUpdateStatus(
                      selectedRecommendation,
                      "ACCEPTED"
                    )
                  }
                >
                  Accept
                </button>
              )}

              {selectedRecommendation.status !==
                "IMPLEMENTED" && (
                <button
                  type="button"
                  className="action-implemented"
                  onClick={() =>
                    handleUpdateStatus(
                      selectedRecommendation,
                      "IMPLEMENTED"
                    )
                  }
                >
                  Mark Implemented
                </button>
              )}

              {selectedRecommendation.status !==
                "DISMISSED" && (
                <button
                  type="button"
                  className="action-dismissed"
                  onClick={() =>
                    handleUpdateStatus(
                      selectedRecommendation,
                      "DISMISSED"
                    )
                  }
                >
                  Dismiss
                </button>
              )}

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
      className={`recommendation-summary-card ${className}`}
    >

      <div className="summary-top">

        <span>
          {title}
        </span>

        <div className="summary-icon">
          {icon}
        </div>

      </div>

      <strong>
        {value}
      </strong>

    </div>
  );
}

/* ============================================================
   PRIORITY CARD
   ============================================================ */

function PriorityCard({
  label,
  value,
  className,
}) {
  return (
    <div
      className={`priority-overview-card ${className}`}
    >
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

      <small>
        recommendations
      </small>
    </div>
  );
}

/* ============================================================
   STYLES
   ============================================================ */

const recommendationStyles = `
  .recommendation-page {
    min-height: 100vh;
    padding: 30px;
    background: #09111f;
    color: #ffffff;
  }

  .recommendation-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 20px;
    margin-bottom: 26px;
  }

  .recommendation-eyebrow {
    color: #a78bfa;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 1.4px;
    margin-bottom: 8px;
  }

  .recommendation-header h1 {
    margin: 0;
    font-size: 30px;
    font-weight: 800;
  }

  .recommendation-header p {
    margin: 8px 0 0;
    max-width: 760px;
    color: #94a3b8;
    line-height: 1.6;
    font-size: 15px;
  }

  .recommendation-refresh {
    padding: 11px 18px;
    border-radius: 10px;
    border: 1px solid #334155;
    background: #111c2d;
    color: #ffffff;
    cursor: pointer;
    font-weight: 700;
  }

  .recommendation-refresh:hover {
    background: #17253a;
  }

  .recommendation-refresh:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .recommendation-error,
  .recommendation-success {
    margin-bottom: 18px;
    padding: 13px 16px;
    border-radius: 10px;
  }

  .recommendation-error {
    background: #450a0a;
    border: 1px solid #7f1d1d;
    color: #fecaca;
  }

  .recommendation-success {
    background: #052e26;
    border: 1px solid #065f46;
    color: #a7f3d0;
  }

  .recommendation-summary-grid {
    display: grid;
    grid-template-columns:
      repeat(5, minmax(0, 1fr));
    gap: 16px;
    margin-bottom: 20px;
  }

  .recommendation-summary-card {
    min-height: 120px;
    padding: 19px;
    border-radius: 15px;
    background: #111c2d;
    border: 1px solid #263850;
    box-shadow: 0 10px 25px rgba(0,0,0,0.18);
  }

  .summary-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .summary-top span {
    color: #cbd5e1;
    font-size: 13px;
    font-weight: 600;
  }

  .summary-icon {
    width: 34px;
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    background: #0b1628;
    font-weight: 800;
  }

  .recommendation-summary-card > strong {
    display: block;
    margin-top: 15px;
    color: #ffffff;
    font-size: 31px;
  }

  .summary-purple {
    border-top: 3px solid #8b5cf6;
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

  .generate-panel {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px 22px;
    margin-bottom: 20px;
    border-radius: 15px;
    border: 1px solid #334155;
    background: #111c2d;
  }

  .generate-icon {
    width: 47px;
    height: 47px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border-radius: 13px;
    background: #312e81;
    color: #c4b5fd;
    font-size: 21px;
  }

  .generate-content {
    flex: 1;
  }

  .generate-content h2 {
    margin: 0 0 5px;
    font-size: 17px;
  }

  .generate-content p {
    margin: 0;
    color: #94a3b8;
    font-size: 13px;
  }

  .generate-controls {
    display: flex;
    gap: 10px;
  }

  .generate-controls input {
    width: 120px;
    padding: 11px 12px;
    border-radius: 9px;
    border: 1px solid #334155;
    outline: none;
    background: #0b1628;
    color: #ffffff;
  }

  .generate-controls button {
    padding: 11px 16px;
    border: none;
    border-radius: 9px;
    background: #7c3aed;
    color: #ffffff;
    cursor: pointer;
    font-weight: 700;
  }

  .generate-controls button:hover {
    background: #6d28d9;
  }

  .generate-controls button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .priority-overview {
    display: grid;
    grid-template-columns:
      repeat(4, minmax(0, 1fr));
    gap: 14px;
    margin-bottom: 22px;
  }

  .priority-overview-card {
    padding: 16px;
    border-radius: 13px;
    border: 1px solid #263850;
    background: #111c2d;
  }

  .priority-overview-card span {
    color: #94a3b8;
    font-size: 12px;
    font-weight: 700;
  }

  .priority-overview-card strong {
    display: block;
    margin: 7px 0 4px;
    color: #ffffff;
    font-size: 26px;
  }

  .priority-overview-card small {
    color: #64748b;
  }

  .overview-low {
    border-left: 3px solid #10b981;
  }

  .overview-medium {
    border-left: 3px solid #f59e0b;
  }

  .overview-high {
    border-left: 3px solid #f97316;
  }

  .overview-urgent {
    border-left: 3px solid #ef4444;
  }

  .recommendation-panel {
    border-radius: 16px;
    border: 1px solid #263850;
    background: #111c2d;
    overflow: hidden;
  }

  .recommendation-panel-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 15px;
    padding: 22px 24px 18px;
  }

  .recommendation-panel-header h2 {
    margin: 0;
    font-size: 19px;
  }

  .recommendation-panel-header p {
    margin: 6px 0 0;
    color: #94a3b8;
    font-size: 13px;
  }

  .recommendation-count {
    padding: 7px 11px;
    border-radius: 8px;
    color: #c4b5fd;
    background: #1e1b4b;
    font-size: 12px;
    font-weight: 700;
  }

  .recommendation-filters {
    display: flex;
    gap: 12px;
    padding: 0 24px 18px;
  }

  .recommendation-search {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 0 12px;
    border-radius: 9px;
    border: 1px solid #334155;
    background: #0b1628;
  }

  .recommendation-search span {
    color: #64748b;
    font-size: 18px;
  }

  .recommendation-search input {
    width: 100%;
    padding: 11px 0;
    border: none;
    outline: none;
    background: transparent;
    color: #ffffff;
  }

  .recommendation-search input::placeholder {
    color: #64748b;
  }

  .recommendation-filters select {
    min-width: 160px;
    padding: 11px 12px;
    border-radius: 9px;
    border: 1px solid #334155;
    outline: none;
    background: #0b1628;
    color: #ffffff;
  }

  .recommendation-list {
    display: grid;
    gap: 1px;
    background: #1e293b;
  }

  .recommendation-card {
    padding: 20px 24px;
    background: #111c2d;
  }

  .recommendation-card:hover {
    background: #142137;
  }

  .recommendation-card-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 15px;
  }

  .recommendation-type {
    color: #a78bfa;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.7px;
  }

  .recommendation-badges {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .priority-badge,
  .status-badge,
  .type-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 99px;
    padding: 6px 10px;
    font-size: 10px;
    font-weight: 800;
  }

  .priority-urgent {
    background: #7f1d1d;
    color: #fecaca;
  }

  .priority-high {
    background: #7c2d12;
    color: #fdba74;
  }

  .priority-medium {
    background: #78350f;
    color: #fde68a;
  }

  .priority-low {
    background: #064e3b;
    color: #6ee7b7;
  }

  .status-new {
    background: #172554;
    color: #93c5fd;
  }

  .status-reviewed {
    background: #064e3b;
    color: #6ee7b7;
  }

  .status-accepted {
    background: #1e3a8a;
    color: #bfdbfe;
  }

  .status-implemented {
    background: #312e81;
    color: #c4b5fd;
  }

  .status-dismissed {
    background: #334155;
    color: #cbd5e1;
  }

  .type-badge {
    background: #1e293b;
    color: #cbd5e1;
  }

  .recommendation-card h3 {
    margin: 12px 0 8px;
    font-size: 17px;
    color: #ffffff;
  }

  .recommendation-text {
    margin: 0;
    color: #cbd5e1;
    font-size: 13px;
    line-height: 1.65;
  }

  .recommendation-reason {
    display: flex;
    flex-direction: column;
    gap: 5px;
    margin-top: 15px;
    padding: 12px 14px;
    border-radius: 10px;
    border: 1px solid #263850;
    background: #0b1628;
  }

  .recommendation-reason strong {
    color: #fbbf24;
    font-size: 12px;
  }

  .recommendation-reason span {
    color: #94a3b8;
    font-size: 12px;
    line-height: 1.5;
  }

  .recommendation-card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 15px;
    margin-top: 17px;
    padding-top: 14px;
    border-top: 1px solid #1e293b;
  }

  .recommendation-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 13px;
    color: #64748b;
    font-size: 11px;
  }

  .details-button {
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid #334155;
    background: #0b1628;
    color: #c4b5fd;
    cursor: pointer;
    font-weight: 700;
    font-size: 11px;
  }

  .details-button:hover {
    background: #1e1b4b;
  }

  .recommendation-empty {
    padding: 65px 20px;
    text-align: center;
  }

  .recommendation-empty > div {
    font-size: 38px;
    color: #475569;
  }

  .recommendation-empty h3 {
    margin: 12px 0 6px;
  }

  .recommendation-empty p {
    margin: 0;
    color: #64748b;
  }

  .recommendation-modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: rgba(2, 6, 23, 0.78);
  }

  .recommendation-modal {
    width: min(760px, 100%);
    max-height: 90vh;
    overflow-y: auto;
    border-radius: 18px;
    border: 1px solid #334155;
    background: #111c2d;
    box-shadow: 0 25px 70px rgba(0,0,0,0.5);
  }

  .recommendation-modal-header {
    display: flex;
    justify-content: space-between;
    gap: 15px;
    padding: 24px;
    border-bottom: 1px solid #24344c;
  }

  .modal-eyebrow {
    color: #a78bfa;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 1px;
  }

  .recommendation-modal-header h2 {
    margin: 7px 0 4px;
    font-size: 23px;
  }

  .recommendation-modal-header p {
    margin: 0;
    color: #94a3b8;
    font-size: 13px;
  }

  .modal-close {
    width: 38px;
    height: 38px;
    flex-shrink: 0;
    border-radius: 9px;
    border: 1px solid #334155;
    background: #0b1628;
    color: #ffffff;
    font-size: 24px;
    cursor: pointer;
  }

  .modal-badges {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    padding: 18px 24px 0;
  }

  .modal-section {
    margin: 20px 24px 0;
    padding: 16px;
    border-radius: 11px;
    border: 1px solid #24344c;
    background: #0b1628;
  }

  .modal-section h3 {
    margin: 0 0 9px;
    font-size: 13px;
  }

  .modal-section p {
    margin: 0;
    color: #cbd5e1;
    font-size: 13px;
    line-height: 1.65;
  }

  .modal-information-grid {
    display: grid;
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
    gap: 12px;
    padding: 20px 24px;
  }

  .modal-information-grid > div {
    padding: 13px;
    border-radius: 10px;
    border: 1px solid #24344c;
    background: #0b1628;
  }

  .modal-information-grid span {
    display: block;
    margin-bottom: 6px;
    color: #64748b;
    font-size: 10px;
  }

  .modal-information-grid strong {
    color: #ffffff;
    font-size: 12px;
  }

  .modal-actions {
    display: flex;
    gap: 9px;
    flex-wrap: wrap;
    padding: 0 24px 24px;
  }

  .modal-actions button {
    padding: 10px 13px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 11px;
    font-weight: 700;
    background: #0b1628;
  }

  .action-reviewed {
    border: 1px solid #059669;
    color: #6ee7b7;
  }

  .action-accepted {
    border: 1px solid #2563eb;
    color: #93c5fd;
  }

  .action-implemented {
    border: 1px solid #7c3aed;
    color: #c4b5fd;
  }

  .action-dismissed {
    border: 1px solid #64748b;
    color: #cbd5e1;
  }

  .risk-loading,
  .recommendation-loading {
    min-height: 65vh;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    text-align: center;
  }

  .recommendation-loading h2 {
    margin: 18px 0 7px;
  }

  .recommendation-loading p {
    margin: 0;
    color: #64748b;
  }

  .recommendation-spinner {
    width: 42px;
    height: 42px;
    border: 4px solid #1e293b;
    border-top-color: #8b5cf6;
    border-radius: 50%;
    animation: recommendationSpin 0.8s linear infinite;
  }

  @keyframes recommendationSpin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 1200px) {
    .recommendation-summary-grid {
      grid-template-columns:
        repeat(3, minmax(0, 1fr));
    }
  }

  @media (max-width: 900px) {
    .generate-panel {
      align-items: flex-start;
      flex-direction: column;
    }

    .generate-controls {
      width: 100%;
    }

    .generate-controls input {
      flex: 1;
    }

    .generate-controls button {
      flex: 1;
    }

    .recommendation-filters {
      flex-direction: column;
    }

    .recommendation-filters select {
      width: 100%;
    }

    .priority-overview {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 700px) {
    .recommendation-page {
      padding: 18px;
    }

    .recommendation-header {
      flex-direction: column;
    }

    .recommendation-summary-grid {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .modal-information-grid {
      grid-template-columns: 1fr;
    }

    .recommendation-card-top,
    .recommendation-card-footer {
      align-items: flex-start;
      flex-direction: column;
    }
  }

  @media (max-width: 500px) {
    .recommendation-summary-grid,
    .priority-overview {
      grid-template-columns: 1fr;
    }

    .generate-controls {
      flex-direction: column;
    }

    .generate-controls input,
    .generate-controls button {
      width: 100%;
      box-sizing: border-box;
    }
  }
`;
