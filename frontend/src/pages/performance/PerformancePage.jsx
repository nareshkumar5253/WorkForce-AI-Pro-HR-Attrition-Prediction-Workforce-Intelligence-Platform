import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import performanceService from "../../services/performanceService";

export default function PerformancePage() {
  const [summary, setSummary] = useState({
    total_reviews: 0,
    draft_reviews: 0,
    submitted_reviews: 0,
    acknowledged_reviews: 0,
    completed_reviews: 0,
    average_overall_score: 0,
    average_goals_achievement: 0,
    average_productivity_score: 0,
    average_teamwork_score: 0,
    average_communication_score: 0,
  });

  const [reviews, setReviews] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [ratingFilter, setRatingFilter] = useState("ALL");

  const [selectedReview, setSelectedReview] = useState(null);

  const [error, setError] = useState("");

  useEffect(() => {
    loadPerformanceData();
  }, []);

  const loadPerformanceData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        summaryData,
        reviewsData,
        ratingsData,
        statusesData,
        departmentsData,
      ] = await Promise.all([
        performanceService.getSummary(),
        performanceService.getReviews(),
        performanceService.getRatingDistribution(),
        performanceService.getStatusDistribution(),
        performanceService.getDepartmentAnalytics(),
      ]);

      setSummary(summaryData || {});
      setReviews(reviewsData || []);
      setRatings(ratingsData || []);
      setStatuses(statusesData || []);
      setDepartments(departmentsData || []);
    } catch (err) {
      console.error(
        "Performance loading failed:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Unable to load performance analytics."
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
        reviewsData,
        ratingsData,
        statusesData,
        departmentsData,
      ] = await Promise.all([
        performanceService.getSummary(),
        performanceService.getReviews(),
        performanceService.getRatingDistribution(),
        performanceService.getStatusDistribution(),
        performanceService.getDepartmentAnalytics(),
      ]);

      setSummary(summaryData || {});
      setReviews(reviewsData || []);
      setRatings(ratingsData || []);
      setStatuses(statusesData || []);
      setDepartments(departmentsData || []);
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.detail ||
          "Unable to refresh performance data."
      );
    } finally {
      setRefreshing(false);
    }
  };

  const filteredReviews = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return reviews.filter((review) => {
      const matchesSearch =
        !query ||
        String(review.employee_id)
          .toLowerCase()
          .includes(query) ||
        String(review.reviewer_id)
          .toLowerCase()
          .includes(query) ||
        String(review.rating || "")
          .toLowerCase()
          .includes(query) ||
        String(review.status || "")
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "ALL" ||
        review.status === statusFilter;

      const matchesRating =
        ratingFilter === "ALL" ||
        review.rating === ratingFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesRating
      );
    });
  }, [
    reviews,
    search,
    statusFilter,
    ratingFilter,
  ]);

  const maximumRatingCount =
    Math.max(
      ...ratings.map(
        (item) =>
          Number(item.count || 0)
      ),
      1
    );

  const maximumDepartmentReviews =
    Math.max(
      ...departments.map(
        (item) =>
          Number(
            item.total_reviews || 0
          )
      ),
      1
    );

  const getRatingLabel = (rating) => {
    const labels = {
      EXCEPTIONAL: "Exceptional",
      EXCEEDS_EXPECTATIONS:
        "Exceeds Expectations",
      MEETS_EXPECTATIONS:
        "Meets Expectations",
      NEEDS_IMPROVEMENT:
        "Needs Improvement",
      UNSATISFACTORY:
        "Unsatisfactory",
    };

    return (
      labels[rating] ||
      String(rating || "-")
        .replaceAll("_", " ")
    );
  };

  const getRatingClass = (rating) => {
    switch (rating) {
      case "EXCEPTIONAL":
        return "rating-exceptional";

      case "EXCEEDS_EXPECTATIONS":
        return "rating-exceeds";

      case "MEETS_EXPECTATIONS":
        return "rating-meets";

      case "NEEDS_IMPROVEMENT":
        return "rating-improvement";

      case "UNSATISFACTORY":
        return "rating-unsatisfactory";

      default:
        return "rating-default";
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "COMPLETED":
        return "status-completed";

      case "ACKNOWLEDGED":
        return "status-acknowledged";

      case "SUBMITTED":
        return "status-submitted";

      case "DRAFT":
        return "status-draft";

      default:
        return "status-default";
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

    return date.toLocaleDateString(
      "en-IN"
    );
  };

  if (loading) {
    return (
      <div className="performance-page">
        <style>
          {performanceStyles}
        </style>

        <div className="performance-loading">
          <div className="performance-spinner"></div>

          <h2>
            Loading performance analytics...
          </h2>

          <p>
            Fetching employee reviews and
            performance intelligence.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="performance-page">
      <style>
        {performanceStyles}
      </style>

      {/* =====================================================
          HEADER
          ===================================================== */}

      <div className="performance-header">

        <div>
          <div className="performance-eyebrow">
            PEOPLE PERFORMANCE
          </div>

          <h1>
            Performance
          </h1>

          <p>
            Monitor employee performance,
            review progress and organization-wide
            performance trends.
          </p>
        </div>

        <button
          type="button"
          className="performance-refresh"
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
        <div className="performance-error">
          {error}
        </div>
      )}

      {/* =====================================================
          KPI CARDS
          ===================================================== */}

      <div className="performance-kpi-grid">

        <PerformanceKpi
          title="Total Reviews"
          value={summary.total_reviews}
          detail={`${summary.completed_reviews || 0} completed`}
          icon="★"
          className="kpi-blue"
        />

        <PerformanceKpi
          title="Overall Score"
          value={`${Number(
            summary.average_overall_score || 0
          ).toFixed(0)}%`}
          detail="Average performance"
          icon="✦"
          className="kpi-purple"
        />

        <PerformanceKpi
          title="Goals Achievement"
          value={`${Number(
            summary.average_goals_achievement || 0
          ).toFixed(0)}%`}
          detail="Goal completion"
          icon="✓"
          className="kpi-green"
        />

        <PerformanceKpi
          title="Productivity"
          value={`${Number(
            summary.average_productivity_score || 0
          ).toFixed(0)}%`}
          detail="Average productivity"
          icon="⌁"
          className="kpi-orange"
        />

        <PerformanceKpi
          title="Teamwork"
          value={`${Number(
            summary.average_teamwork_score || 0
          ).toFixed(0)}%`}
          detail="Collaboration score"
          icon="♙"
          className="kpi-cyan"
        />

      </div>

      {/* =====================================================
          PERFORMANCE SCORE GRID
          ===================================================== */}

      <div className="performance-score-panel">

        <div className="performance-panel-header">
          <div>
            <h2>
              Performance Scorecard
            </h2>

            <p>
              Organization-wide average performance
              indicators.
            </p>
          </div>

          <span className="performance-live">
            LIVE DATA
          </span>
        </div>

        <div className="scorecard-grid">

          <ScoreCard
            title="Overall"
            value={
              summary.average_overall_score
            }
          />

          <ScoreCard
            title="Goals"
            value={
              summary.average_goals_achievement
            }
          />

          <ScoreCard
            title="Productivity"
            value={
              summary.average_productivity_score
            }
          />

          <ScoreCard
            title="Teamwork"
            value={
              summary.average_teamwork_score
            }
          />

          <ScoreCard
            title="Communication"
            value={
              summary.average_communication_score
            }
          />

        </div>

      </div>

      {/* =====================================================
          CHART-STYLE ANALYTICS
          ===================================================== */}

      <div className="performance-two-column">

        {/* RATING DISTRIBUTION */}

        <div className="performance-panel">

          <div className="performance-panel-header">

            <div>
              <h2>
                Rating Distribution
              </h2>

              <p>
                Employee review ratings
              </p>
            </div>

          </div>

          {ratings.length === 0 ? (
            <div className="performance-empty">
              No rating data available.
            </div>
          ) : (
            <div className="rating-chart">

              {ratings.map((item) => {

                const count =
                  Number(
                    item.count || 0
                  );

                const width =
                  `${Math.min(
                    (count /
                      maximumRatingCount) *
                      100,
                    100
                  )}%`;

                return (
                  <div
                    className="rating-row"
                    key={item.rating}
                  >

                    <div className="rating-label">
                      <span>
                        {getRatingLabel(
                          item.rating
                        )}
                      </span>

                      <strong>
                        {count}
                      </strong>
                    </div>

                    <div className="rating-track">

                      <div
                        className={`rating-fill ${getRatingClass(
                          item.rating
                        )}`}
                        style={{
                          width,
                        }}
                      ></div>

                    </div>

                  </div>
                );
              })}

            </div>
          )}

        </div>

        {/* STATUS DISTRIBUTION */}

        <div className="performance-panel">

          <div className="performance-panel-header">

            <div>
              <h2>
                Review Status
              </h2>

              <p>
                Current review workflow
              </p>
            </div>

          </div>

          <div className="status-chart">

            {statuses.map((item) => {

              const count =
                Number(
                  item.count || 0
                );

              return (
                <div
                  className="status-chart-item"
                  key={item.status}
                >

                  <div className="status-chart-icon">
                    {item.status ===
                    "COMPLETED"
                      ? "✓"
                      : item.status ===
                        "DRAFT"
                      ? "✎"
                      : item.status ===
                        "SUBMITTED"
                      ? "→"
                      : "◉"}
                  </div>

                  <div className="status-chart-content">

                    <div>
                      <strong>
                        {item.status}
                      </strong>

                      <span>
                        {count} review
                        {count === 1
                          ? ""
                          : "s"}
                      </span>
                    </div>

                    <div
                      className={`status-chip ${getStatusClass(
                        item.status
                      )}`}
                    >
                      {item.status}
                    </div>

                  </div>

                </div>
              );
            })}

          </div>

        </div>

      </div>

      {/* =====================================================
          DEPARTMENT ANALYTICS
          ===================================================== */}

      <div className="performance-panel department-performance-panel">

        <div className="performance-panel-header">

          <div>
            <h2>
              Department Performance
            </h2>

            <p>
              Average performance across departments.
            </p>
          </div>

          <span className="department-count">
            {departments.length} departments
          </span>

        </div>

        {departments.length === 0 ? (
          <div className="performance-empty">
            No department performance data available.
          </div>
        ) : (
          <div className="department-performance-list">

            {departments.map((department) => {

              const reviewCount =
                Number(
                  department.total_reviews || 0
                );

              const score =
                Number(
                  department.average_overall_score || 0
                );

              return (
                <div
                  className="department-performance-row"
                  key={
                    department.department_id
                  }
                >

                  <div className="department-performance-name">

                    <div className="department-performance-icon">
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
                        {
                          department.completed_reviews
                        }{" "}
                        completed reviews
                      </span>

                    </div>

                  </div>

                  <div className="department-review-count">

                    <span>
                      Reviews
                    </span>

                    <strong>
                      {reviewCount}
                    </strong>

                  </div>

                  <div className="department-score-area">

                    <div className="department-score-top">

                      <span>
                        Average Score
                      </span>

                      <strong>
                        {score.toFixed(0)}%
                      </strong>

                    </div>

                    <div className="department-score-track">

                      <div
                        className="department-score-fill"
                        style={{
                          width: `${Math.min(
                            score,
                            100
                          )}%`,
                        }}
                      ></div>

                    </div>

                  </div>

                </div>
              );
            })}

          </div>
        )}

      </div>

      {/* =====================================================
          REVIEW TABLE
          ===================================================== */}

      <div className="performance-panel review-panel">

        <div className="performance-panel-header">

          <div>
            <h2>
              Performance Reviews
            </h2>

            <p>
              Employee performance review records.
            </p>
          </div>

          <span className="department-count">
            {filteredReviews.length} reviews
          </span>

        </div>

        <div className="review-filters">

          <div className="review-search">
            <span>⌕</span>

            <input
              type="text"
              placeholder="Search employee, rating or status..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />
          </div>

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

            <option value="DRAFT">
              Draft
            </option>

            <option value="SUBMITTED">
              Submitted
            </option>

            <option value="ACKNOWLEDGED">
              Acknowledged
            </option>

            <option value="COMPLETED">
              Completed
            </option>
          </select>

          <select
            value={ratingFilter}
            onChange={(event) =>
              setRatingFilter(
                event.target.value
              )
            }
          >
            <option value="ALL">
              All Ratings
            </option>

            <option value="EXCEPTIONAL">
              Exceptional
            </option>

            <option value="EXCEEDS_EXPECTATIONS">
              Exceeds Expectations
            </option>

            <option value="MEETS_EXPECTATIONS">
              Meets Expectations
            </option>

            <option value="NEEDS_IMPROVEMENT">
              Needs Improvement
            </option>

            <option value="UNSATISFACTORY">
              Unsatisfactory
            </option>
          </select>

        </div>

        {filteredReviews.length === 0 ? (
          <div className="performance-empty">
            No performance reviews match your filters.
          </div>
        ) : (
          <div className="review-table-wrapper">

            <table className="review-table">

              <thead>
                <tr>
                  <th>
                    Employee
                  </th>

                  <th>
                    Review Period
                  </th>

                  <th>
                    Rating
                  </th>

                  <th>
                    Overall
                  </th>

                  <th>
                    Goals
                  </th>

                  <th>
                    Productivity
                  </th>

                  <th>
                    Teamwork
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>

                {filteredReviews.map(
                  (review) => (
                    <tr
                      key={review.id}
                    >

                      <td>

                        <div className="review-employee">

                          <div className="review-avatar">
                            E
                          </div>

                          <div>

                            <strong>
                              Employee #
                              {
                                review.employee_id
                              }
                            </strong>

                            <span>
                              Reviewer #
                              {
                                review.reviewer_id
                              }
                            </span>

                          </div>

                        </div>

                      </td>

                      <td>

                        <div className="review-period">

                          <span>
                            {formatDate(
                              review.review_period_start
                            )}
                          </span>

                          <span>
                            —
                          </span>

                          <span>
                            {formatDate(
                              review.review_period_end
                            )}
                          </span>

                        </div>

                      </td>

                      <td>

                        <span
                          className={`rating-badge ${getRatingClass(
                            review.rating
                          )}`}
                        >
                          {getRatingLabel(
                            review.rating
                          )}
                        </span>

                      </td>

                      <td>
                        <strong className="table-score">
                          {
                            review.overall_score
                          }%
                        </strong>
                      </td>

                      <td>
                        {
                          review.goals_achievement
                        }%
                      </td>

                      <td>
                        {
                          review.productivity_score
                        }%
                      </td>

                      <td>
                        {
                          review.teamwork_score
                        }%
                      </td>

                      <td>

                        <span
                          className={`status-badge ${getStatusClass(
                            review.status
                          )}`}
                        >
                          {
                            review.status
                          }
                        </span>

                      </td>

                      <td>

                        <button
                          type="button"
                          className="review-view-button"
                          onClick={() =>
                            setSelectedReview(
                              review
                            )
                          }
                        >
                          View
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
          REVIEW DETAIL MODAL
          ===================================================== */}

      {selectedReview && (
        <div className="performance-modal-backdrop">

          <div className="performance-modal">

            <div className="performance-modal-header">

              <div>

                <span className="modal-eyebrow">
                  PERFORMANCE REVIEW
                </span>

                <h2>
                  Employee #
                  {
                    selectedReview.employee_id
                  }
                </h2>

                <p>
                  Review ID #
                  {selectedReview.id}
                </p>

              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() =>
                  setSelectedReview(
                    null
                  )
                }
              >
                ×
              </button>

            </div>

            <div className="modal-review-badges">

              <span
                className={`rating-badge ${getRatingClass(
                  selectedReview.rating
                )}`}
              >
                {getRatingLabel(
                  selectedReview.rating
                )}
              </span>

              <span
                className={`status-badge ${getStatusClass(
                  selectedReview.status
                )}`}
              >
                {
                  selectedReview.status
                }
              </span>

            </div>

            <div className="modal-score-grid">

              <ModalScore
                label="Overall Score"
                value={
                  selectedReview.overall_score
                }
              />

              <ModalScore
                label="Goals Achievement"
                value={
                  selectedReview.goals_achievement
                }
              />

              <ModalScore
                label="Productivity"
                value={
                  selectedReview.productivity_score
                }
              />

              <ModalScore
                label="Teamwork"
                value={
                  selectedReview.teamwork_score
                }
              />

              <ModalScore
                label="Communication"
                value={
                  selectedReview.communication_score
                }
              />

            </div>

            <div className="modal-period-box">

              <span>
                Review Period
              </span>

              <strong>
                {formatDate(
                  selectedReview.review_period_start
                )}{" "}
                —{" "}
                {formatDate(
                  selectedReview.review_period_end
                )}
              </strong>

            </div>

            <div className="modal-text-grid">

              <TextSection
                title="Strengths"
                text={
                  selectedReview.strengths
                }
              />

              <TextSection
                title="Areas for Improvement"
                text={
                  selectedReview.areas_for_improvement
                }
              />

              <TextSection
                title="Manager Comments"
                text={
                  selectedReview.manager_comments
                }
              />

              <TextSection
                title="Employee Comments"
                text={
                  selectedReview.employee_comments
                }
              />

            </div>

            <div className="modal-date-footer">

              <span>
                Reviewed:{" "}
                {formatDate(
                  selectedReview.reviewed_at
                )}
              </span>

              <span>
                Acknowledged:{" "}
                {formatDate(
                  selectedReview.acknowledged_at
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
   KPI
   ============================================================ */

function PerformanceKpi({
  title,
  value,
  detail,
  icon,
  className,
}) {
  return (
    <div
      className={`performance-kpi ${className}`}
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
        {detail}
      </small>

    </div>
  );
}

/* ============================================================
   SCORE CARD
   ============================================================ */

function ScoreCard({
  title,
  value,
}) {
  const numericValue =
    Number(value || 0);

  return (
    <div className="score-card">

      <div className="score-card-top">
        <span>
          {title}
        </span>

        <strong>
          {numericValue.toFixed(0)}%
        </strong>
      </div>

      <div className="score-track">

        <div
          className="score-fill"
          style={{
            width: `${Math.min(
              numericValue,
              100
            )}%`,
          }}
        ></div>

      </div>

    </div>
  );
}

/* ============================================================
   MODAL SCORE
   ============================================================ */

function ModalScore({
  label,
  value,
}) {
  return (
    <div className="modal-score">

      <span>
        {label}
      </span>

      <strong>
        {Number(
          value || 0
        ).toFixed(0)}%
      </strong>

    </div>
  );
}

/* ============================================================
   TEXT SECTION
   ============================================================ */

function TextSection({
  title,
  text,
}) {
  return (
    <div className="modal-text-section">

      <h3>
        {title}
      </h3>

      <p>
        {text || "Not provided."}
      </p>

    </div>
  );
}

/* ============================================================
   STYLES
   ============================================================ */

const performanceStyles = `
  .performance-page {
    min-height: 100vh;
    padding: 30px;
    background: #09111f;
    color: #ffffff;
  }

  .performance-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 20px;
    margin-bottom: 26px;
  }

  .performance-eyebrow {
    color: #60a5fa;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 1.4px;
    margin-bottom: 8px;
  }

  .performance-header h1 {
    margin: 0;
    font-size: 30px;
    font-weight: 800;
  }

  .performance-header p {
    margin: 8px 0 0;
    max-width: 760px;
    color: #94a3b8;
    font-size: 15px;
    line-height: 1.6;
  }

  .performance-refresh {
    padding: 11px 18px;
    border-radius: 10px;
    border: 1px solid #334155;
    background: #111c2d;
    color: #ffffff;
    cursor: pointer;
    font-weight: 700;
  }

  .performance-refresh:hover {
    background: #17253a;
  }

  .performance-refresh:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .performance-error {
    margin-bottom: 18px;
    padding: 13px 16px;
    border-radius: 10px;
    background: #450a0a;
    border: 1px solid #7f1d1d;
    color: #fecaca;
  }

  .performance-kpi-grid {
    display: grid;
    grid-template-columns:
      repeat(5, minmax(0, 1fr));
    gap: 16px;
    margin-bottom: 20px;
  }

  .performance-kpi {
    min-height: 125px;
    padding: 19px;
    border-radius: 15px;
    background: #111c2d;
    border: 1px solid #263850;
    box-shadow: 0 10px 25px rgba(0,0,0,0.18);
  }

  .performance-kpi .kpi-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
  }

  .performance-kpi .kpi-top > span {
    color: #cbd5e1;
    font-size: 13px;
    font-weight: 600;
  }

  .performance-kpi .kpi-icon {
    width: 35px;
    height: 35px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    background: #0b1628;
    font-weight: 800;
  }

  .performance-kpi > strong {
    display: block;
    margin-top: 14px;
    color: #ffffff;
    font-size: 28px;
    font-weight: 800;
  }

  .performance-kpi > small {
    display: block;
    margin-top: 6px;
    color: #64748b;
    font-size: 11px;
  }

  .kpi-blue {
    border-top: 3px solid #3b82f6;
  }

  .kpi-purple {
    border-top: 3px solid #8b5cf6;
  }

  .kpi-green {
    border-top: 3px solid #10b981;
  }

  .kpi-orange {
    border-top: 3px solid #f59e0b;
  }

  .kpi-cyan {
    border-top: 3px solid #06b6d4;
  }

  .performance-panel,
  .performance-score-panel {
    padding: 22px;
    border-radius: 16px;
    border: 1px solid #263850;
    background: #111c2d;
    box-shadow: 0 10px 25px rgba(0,0,0,0.16);
  }

  .performance-score-panel {
    margin-bottom: 20px;
  }

  .performance-panel-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 15px;
    margin-bottom: 19px;
  }

  .performance-panel-header h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
  }

  .performance-panel-header p {
    margin: 6px 0 0;
    color: #94a3b8;
    font-size: 12px;
    line-height: 1.5;
  }

  .performance-live,
  .department-count {
    padding: 6px 9px;
    border-radius: 8px;
    font-size: 10px;
    font-weight: 800;
    white-space: nowrap;
  }

  .performance-live {
    background: #052e26;
    color: #6ee7b7;
  }

  .department-count {
    background: #0b1628;
    border: 1px solid #293b55;
    color: #93c5fd;
  }

  .scorecard-grid {
    display: grid;
    grid-template-columns:
      repeat(5, minmax(0, 1fr));
    gap: 12px;
  }

  .score-card {
    padding: 15px;
    border-radius: 11px;
    background: #0b1628;
    border: 1px solid #1e293b;
  }

  .score-card-top {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    align-items: center;
  }

  .score-card-top span {
    color: #94a3b8;
    font-size: 11px;
  }

  .score-card-top strong {
    color: #ffffff;
    font-size: 17px;
  }

  .score-track {
    height: 6px;
    margin-top: 10px;
    overflow: hidden;
    border-radius: 99px;
    background: #1e293b;
  }

  .score-fill {
    height: 100%;
    border-radius: 99px;
    background: #3b82f6;
  }

  .performance-two-column {
    display: grid;
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
    gap: 20px;
    margin-bottom: 20px;
  }

  .rating-chart,
  .status-chart {
    display: grid;
    gap: 13px;
  }

  .rating-row {
    display: grid;
    gap: 7px;
  }

  .rating-label {
    display: flex;
    justify-content: space-between;
    gap: 10px;
  }

  .rating-label span {
    color: #cbd5e1;
    font-size: 12px;
  }

  .rating-label strong {
    color: #ffffff;
    font-size: 12px;
  }

  .rating-track {
    height: 8px;
    overflow: hidden;
    border-radius: 99px;
    background: #1e293b;
  }

  .rating-fill {
    height: 100%;
    border-radius: 99px;
  }

  .rating-exceptional {
    background: #8b5cf6 !important;
    color: #ddd6fe !important;
  }

  .rating-exceeds {
    background: #10b981 !important;
    color: #6ee7b7 !important;
  }

  .rating-meets {
    background: #3b82f6 !important;
    color: #93c5fd !important;
  }

  .rating-improvement {
    background: #f59e0b !important;
    color: #fde68a !important;
  }

  .rating-unsatisfactory {
    background: #ef4444 !important;
    color: #fca5a5 !important;
  }

  .rating-default {
    background: #64748b !important;
    color: #cbd5e1 !important;
  }

  .rating-badge,
  .status-badge,
  .status-chip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 99px;
    padding: 6px 10px;
    font-size: 10px;
    font-weight: 800;
  }

  .status-completed {
    background: #064e3b !important;
    color: #6ee7b7 !important;
  }

  .status-acknowledged {
    background: #172554 !important;
    color: #93c5fd !important;
  }

  .status-submitted {
    background: #78350f !important;
    color: #fde68a !important;
  }

  .status-draft {
    background: #334155 !important;
    color: #cbd5e1 !important;
  }

  .status-default {
    background: #334155 !important;
    color: #cbd5e1 !important;
  }

  .status-chart-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 13px;
    border-radius: 10px;
    background: #0b1628;
    border: 1px solid #1e293b;
  }

  .status-chart-icon {
    width: 37px;
    height: 37px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    background: #172554;
    color: #93c5fd;
    font-weight: 800;
  }

  .status-chart-content {
    flex: 1;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
  }

  .status-chart-content > div:first-child {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .status-chart-content strong {
    color: #ffffff;
    font-size: 12px;
  }

  .status-chart-content span {
    color: #64748b;
    font-size: 10px;
  }

  .department-performance-panel {
    margin-bottom: 20px;
  }

  .department-performance-list {
    display: grid;
    gap: 11px;
  }

  .department-performance-row {
    display: grid;
    grid-template-columns:
      260px 100px 1fr;
    gap: 20px;
    align-items: center;
    padding: 14px;
    border-radius: 11px;
    background: #0b1628;
    border: 1px solid #1e293b;
  }

  .department-performance-name {
    display: flex;
    align-items: center;
    gap: 11px;
  }

  .department-performance-icon {
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

  .department-performance-name > div:last-child {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .department-performance-name strong {
    color: #ffffff;
    font-size: 12px;
  }

  .department-performance-name span {
    color: #64748b;
    font-size: 10px;
  }

  .department-review-count {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .department-review-count span {
    color: #64748b;
    font-size: 10px;
  }

  .department-review-count strong {
    color: #ffffff;
    font-size: 18px;
  }

  .department-score-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 7px;
  }

  .department-score-top span {
    color: #64748b;
    font-size: 10px;
  }

  .department-score-top strong {
    color: #6ee7b7;
    font-size: 13px;
  }

  .department-score-track {
    height: 7px;
    overflow: hidden;
    border-radius: 99px;
    background: #1e293b;
  }

  .department-score-fill {
    height: 100%;
    border-radius: 99px;
    background: #10b981;
  }

  .review-panel {
    margin-bottom: 20px;
  }

  .review-filters {
    display: flex;
    gap: 12px;
    margin-bottom: 18px;
  }

  .review-search {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 12px;
    border-radius: 9px;
    background: #0b1628;
    border: 1px solid #334155;
  }

  .review-search span {
    color: #64748b;
    font-size: 18px;
  }

  .review-search input {
    width: 100%;
    padding: 11px 0;
    border: none;
    outline: none;
    background: transparent;
    color: #ffffff;
  }

  .review-search input::placeholder {
    color: #64748b;
  }

  .review-filters select {
    min-width: 180px;
    padding: 11px 12px;
    border-radius: 9px;
    border: 1px solid #334155;
    outline: none;
    background: #0b1628;
    color: #ffffff;
  }

  .review-table-wrapper {
    width: 100%;
    overflow-x: auto;
  }

  .review-table {
    width: 100%;
    min-width: 1200px;
    border-collapse: collapse;
  }

  .review-table th {
    padding: 14px 14px;
    text-align: left;
    border-top: 1px solid #1e293b;
    border-bottom: 1px solid #263850;
    background: #0d1727;
    color: #94a3b8;
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
  }

  .review-table td {
    padding: 15px 14px;
    border-bottom: 1px solid #1e293b;
    color: #cbd5e1;
    font-size: 12px;
    vertical-align: middle;
  }

  .review-table tbody tr:hover {
    background: #142137;
  }

  .review-employee {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 175px;
  }

  .review-avatar {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    background: #1d4ed8;
    color: #dbeafe;
    font-weight: 800;
  }

  .review-employee > div:last-child {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .review-employee strong {
    color: #ffffff;
    font-size: 12px;
  }

  .review-employee span {
    color: #64748b;
    font-size: 10px;
  }

  .review-period {
    display: flex;
    gap: 5px;
    align-items: center;
    white-space: nowrap;
    color: #94a3b8;
    font-size: 11px;
  }

  .table-score {
    color: #ffffff;
    font-size: 14px;
  }

  .review-view-button {
    padding: 7px 11px;
    border-radius: 8px;
    border: 1px solid #334155;
    background: #0b1628;
    color: #93c5fd;
    cursor: pointer;
    font-size: 11px;
    font-weight: 700;
  }

  .review-view-button:hover {
    background: #17253a;
  }

  .performance-empty {
    padding: 45px 10px;
    text-align: center;
    color: #64748b;
    font-size: 12px;
  }

  .performance-modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: rgba(2, 6, 23, 0.78);
  }

  .performance-modal {
    width: min(850px, 100%);
    max-height: 90vh;
    overflow-y: auto;
    border: 1px solid #334155;
    border-radius: 18px;
    background: #111c2d;
    box-shadow: 0 25px 70px rgba(0,0,0,0.5);
  }

  .performance-modal-header {
    display: flex;
    justify-content: space-between;
    gap: 15px;
    padding: 24px;
    border-bottom: 1px solid #24344c;
  }

  .modal-eyebrow {
    color: #60a5fa;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 1px;
  }

  .performance-modal-header h2 {
    margin: 7px 0 4px;
    font-size: 23px;
  }

  .performance-modal-header p {
    margin: 0;
    color: #94a3b8;
    font-size: 12px;
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

  .modal-review-badges {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    padding: 18px 24px 0;
  }

  .modal-score-grid {
    display: grid;
    grid-template-columns:
      repeat(5, minmax(0, 1fr));
    gap: 10px;
    padding: 20px 24px;
  }

  .modal-score {
    padding: 13px;
    border-radius: 10px;
    border: 1px solid #263850;
    background: #0b1628;
  }

  .modal-score span {
    display: block;
    margin-bottom: 6px;
    color: #64748b;
    font-size: 9px;
  }

  .modal-score strong {
    color: #ffffff;
    font-size: 21px;
  }

  .modal-period-box {
    margin: 0 24px 20px;
    padding: 14px;
    border-radius: 10px;
    background: #0b1628;
    border: 1px solid #1e293b;
  }

  .modal-period-box span {
    display: block;
    color: #64748b;
    font-size: 10px;
    margin-bottom: 5px;
  }

  .modal-period-box strong {
    color: #ffffff;
    font-size: 13px;
  }

  .modal-text-grid {
    display: grid;
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
    gap: 12px;
    padding: 0 24px 20px;
  }

  .modal-text-section {
    padding: 15px;
    border-radius: 11px;
    background: #0b1628;
    border: 1px solid #1e293b;
  }

  .modal-text-section h3 {
    margin: 0 0 8px;
    color: #ffffff;
    font-size: 12px;
  }

  .modal-text-section p {
    margin: 0;
    color: #94a3b8;
    font-size: 12px;
    line-height: 1.6;
  }

  .modal-date-footer {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    padding: 15px 24px;
    border-top: 1px solid #24344c;
    color: #64748b;
    font-size: 10px;
  }

  .performance-loading {
    min-height: 65vh;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    text-align: center;
  }

  .performance-loading h2 {
    margin: 18px 0 7px;
  }

  .performance-loading p {
    margin: 0;
    color: #64748b;
  }

  .performance-spinner {
    width: 42px;
    height: 42px;
    border: 4px solid #1e293b;
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: performanceSpin 0.8s linear infinite;
  }

  @keyframes performanceSpin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 1200px) {
    .performance-kpi-grid {
      grid-template-columns:
        repeat(3, minmax(0, 1fr));
    }

    .scorecard-grid {
      grid-template-columns:
        repeat(3, minmax(0, 1fr));
    }

    .department-performance-row {
      grid-template-columns:
        220px 80px 1fr;
    }
  }

  @media (max-width: 900px) {
    .performance-page {
      padding: 18px;
    }

    .performance-header {
      flex-direction: column;
    }

    .performance-two-column {
      grid-template-columns: 1fr;
    }

    .performance-kpi-grid {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .scorecard-grid {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .department-performance-row {
      grid-template-columns: 1fr;
      gap: 12px;
    }

    .review-filters {
      flex-direction: column;
    }

    .review-filters select {
      width: 100%;
    }

    .modal-score-grid {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .modal-text-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 550px) {
    .performance-kpi-grid,
    .scorecard-grid {
      grid-template-columns: 1fr;
    }

    .modal-score-grid {
      grid-template-columns: 1fr;
    }

    .modal-date-footer {
      flex-direction: column;
    }
  }
`;