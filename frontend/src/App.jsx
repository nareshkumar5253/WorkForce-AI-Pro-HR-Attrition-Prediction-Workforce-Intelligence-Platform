import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { useEffect, useState } from "react";

import "./App.css";

import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginPage from "./pages/auth/LoginPage";
import EmployeesPage from "./pages/employees/EmployeesPage";
import EmployeeDetailsPage from "./pages/employees/EmployeeDetailsPage";
import EditEmployeePage from "./pages/employees/EditEmployeePage";
import AttendancePage from "./pages/attendance/AttendancePage";
import LeaveManagement from "./pages/leaves/LeaveManagement";
import PayrollPage from "./pages/payroll/PayrollPage";
import AttritionPredictionPage from "./pages/attrition/AttritionPredictionPage";
import RiskMonitoringPage from "./pages/risk/RiskMonitoringPage";
import AIRecommendationsPage from "./pages/recommendations/AIRecommendationsPage";
import WorkforceAnalyticsPage from "./pages/analytics/WorkforceAnalyticsPage";
import PerformancePage from "./pages/performance/PerformancePage";
import ReportsPage from "./pages/reports/ReportsPage";
import NotificationsPage from "./pages/notifications/NotificationsPage";
import ChatPage from "./pages/chat/ChatPage";
import SettingsPage from "./pages/settings/SettingsPage";
import {
  getDashboardAnalytics,
} from "./services/dashboardService";

import api from "./services/api";

/* ============================================================
   PLACEHOLDER PAGE
   ============================================================ */

function PlaceholderPage({ title, description }) {
  return (
    <div className="page-placeholder">
      <div className="placeholder-card">
        <div className="placeholder-icon">◈</div>

        <h1>{title}</h1>

        <p>{description}</p>

        <span>WorkForce AI Pro</span>
      </div>
    </div>
  );
}

/* ============================================================
   DASHBOARD
   ============================================================ */

function Dashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [recommendations, setRecommendations] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const [dashboardData, recommendationData] =
        await Promise.all([
          getDashboardAnalytics(),
          api.get("/recommendations/summary"),
        ]);

      setAnalytics(dashboardData);
      setRecommendations(recommendationData.data);
    } catch (err) {
      console.error("Dashboard loading failed:", err);

      if (err.response?.status === 401) {
        setError(
          "Your session has expired. Please login again."
        );
      } else {
        setError(
          err.response?.data?.detail ||
            "Unable to load dashboard analytics."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  /* ==========================================================
     LOADING
     ========================================================== */

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-loading">
          <div className="dashboard-loader"></div>

          <h2>Loading workforce intelligence...</h2>

          <p>
            Fetching the latest workforce analytics.
          </p>
        </div>
      </div>
    );
  }

  /* ==========================================================
     ERROR
     ========================================================== */

  if (error) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-error">
          <div className="dashboard-error-icon">
            !
          </div>

          <h2>Unable to load dashboard</h2>

          <p>{error}</p>

          <button
            type="button"
            onClick={loadDashboard}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  /* ==========================================================
     DATA
     ========================================================== */

  const workforce = analytics?.workforce || {};
  const attendance = analytics?.attendance || {};
  const leave = analytics?.leave || {};
  const payroll = analytics?.payroll || {};
  const attrition = analytics?.attrition || {};

  const recommendationCount =
    recommendations?.total_recommendations ?? 0;

  const activePercentage =
    workforce.total_employees > 0
      ? Math.round(
          (workforce.active_employees /
            workforce.total_employees) *
            100
        )
      : 0;

  const attendanceTotal =
    attendance.total_records || 0;

  const attendancePresentPercentage =
    attendanceTotal > 0
      ? Math.round(
          (attendance.present / attendanceTotal) *
            100
        )
      : 0;

  const leaveApprovalPercentage =
    leave.total_requests > 0
      ? Math.round(
          (leave.approved / leave.total_requests) *
            100
        )
      : 0;

  const formatCurrency = (value) => {
    return `₹${Number(
      value || 0
    ).toLocaleString("en-IN")}`;
  };

  const today = new Date().toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );

  return (
    <div className="dashboard-page">

      {/* ======================================================
          HEADER
          ====================================================== */}

      <div className="page-header">
        <div>
          <p className="page-eyebrow">
            WORKFORCE INTELLIGENCE
          </p>

          <h1>Dashboard</h1>

          <p className="page-description">
            Monitor your workforce, employee health,
            attendance and AI-powered insights.
          </p>
        </div>

        <div className="header-date">
          <span>Today</span>

          <strong>{today}</strong>
        </div>
      </div>

      {/* ======================================================
          TOP STAT CARDS
          ====================================================== */}

      <div className="stats-grid">

        {/* TOTAL EMPLOYEES */}

        <div className="stat-card dashboard-stat-blue">
          <div className="stat-card-top">
            <div className="stat-label">
              Total Employees
            </div>

            <div className="stat-icon">
              ♙
            </div>
          </div>

          <div className="stat-value">
            {workforce.total_employees}
          </div>

          <div className="stat-meta">
            <span className="positive-text">
              {activePercentage}%
            </span>{" "}
            active workforce
          </div>
        </div>

        {/* ATTENDANCE */}

        <div className="stat-card dashboard-stat-green">
          <div className="stat-card-top">
            <div className="stat-label">
              Attendance
            </div>

            <div className="stat-icon">
              ◷
            </div>
          </div>

          <div className="stat-value">
            {attendance.present}
          </div>

          <div className="stat-meta">
            Present records
            <span className="positive-text">
              {" "}
              · {attendancePresentPercentage}%
            </span>
          </div>
        </div>

        {/* ATTRITION */}

        <div className="stat-card dashboard-stat-red">
          <div className="stat-card-top">
            <div className="stat-label">
              Critical Attrition
            </div>

            <div className="stat-icon">
              △
            </div>
          </div>

          <div className="stat-value">
            {attrition.critical_risk}
          </div>

          <div className="stat-meta">
            Employees requiring attention
          </div>
        </div>

        {/* RECOMMENDATIONS */}

        <div className="stat-card dashboard-stat-purple">
          <div className="stat-card-top">
            <div className="stat-label">
              AI Recommendations
            </div>

            <div className="stat-icon">
              ✦
            </div>
          </div>

          <div className="stat-value">
            {recommendationCount}
          </div>

          <div className="stat-meta">
            Workforce actions available
          </div>
        </div>

      </div>

      {/* ======================================================
          MAIN DASHBOARD GRID
          ====================================================== */}

      <div className="dashboard-grid">

        {/* ====================================================
            WORKFORCE OVERVIEW
            ==================================================== */}

        <div className="content-card large-card">

          <div className="card-header">
            <div>
              <h2>Workforce Overview</h2>

              <p>
                Current employee workforce distribution
              </p>
            </div>

            <span className="card-header-badge">
              LIVE DATA
            </span>
          </div>

          <div className="workforce-overview">

            <div className="workforce-main-number">
              <strong>
                {workforce.total_employees}
              </strong>

              <span>
                Employees tracked
              </span>
            </div>

            <div className="workforce-breakdown">

              <div className="workforce-row">
                <div className="workforce-row-label">
                  <span className="workforce-dot active"></span>

                  <span>Active</span>
                </div>

                <strong>
                  {workforce.active_employees}
                </strong>
              </div>

              <div className="workforce-row">
                <div className="workforce-row-label">
                  <span className="workforce-dot leave"></span>

                  <span>On Leave</span>
                </div>

                <strong>
                  {workforce.on_leave_employees}
                </strong>
              </div>

              <div className="workforce-row">
                <div className="workforce-row-label">
                  <span className="workforce-dot resigned"></span>

                  <span>Resigned</span>
                </div>

                <strong>
                  {workforce.resigned_employees}
                </strong>
              </div>

              <div className="workforce-row">
                <div className="workforce-row-label">
                  <span className="workforce-dot terminated"></span>

                  <span>Terminated</span>
                </div>

                <strong>
                  {workforce.terminated_employees}
                </strong>
              </div>

            </div>

          </div>

          <div className="workforce-progress">
            <div
              className="workforce-progress-active"
              style={{
                width: `${activePercentage}%`,
              }}
            ></div>
          </div>

          <div className="progress-caption">
            <span>
              {activePercentage}% active workforce
            </span>

            <span>
              {workforce.active_employees} of{" "}
              {workforce.total_employees}
            </span>
          </div>

        </div>

        {/* ====================================================
            AI INSIGHTS
            ==================================================== */}

        <div className="content-card">

          <div className="card-header">
            <div>
              <h2>AI Insights</h2>

              <p>
                Latest workforce intelligence
              </p>
            </div>

            <span className="ai-badge">
              AI
            </span>
          </div>

          {/* ATTRITION */}

          <div className="insight-item critical-insight">

            <div className="insight-dot danger"></div>

            <div className="insight-content">

              <div className="insight-title-row">

                <strong>
                  Attrition Risk
                </strong>

                <span className="critical-label">
                  CRITICAL
                </span>

              </div>

              <p>
                {attrition.critical_risk} employee
                {attrition.critical_risk === 1
                  ? ""
                  : "s"} require
                {attrition.critical_risk === 1
                  ? "s"
                  : ""} immediate attention.
              </p>

              <div className="risk-score">

                <span>
                  Average probability
                </span>

                <strong>
                  {Number(
                    attrition.average_attrition_probability ||
                      0
                  ).toFixed(2)}
                  %
                </strong>

              </div>

            </div>

          </div>

          {/* RECOMMENDATIONS */}

          <div className="insight-item">

            <div className="insight-dot purple"></div>

            <div className="insight-content">

              <div className="insight-title-row">

                <strong>
                  AI Recommendations
                </strong>

                <span className="recommendation-label">
                  {recommendationCount}
                </span>

              </div>

              <p>
                AI-generated workforce actions
                are available for HR review.
              </p>

            </div>

          </div>

          {/* MONITORING */}

          <div className="insight-item">

            <div className="insight-dot blue"></div>

            <div className="insight-content">

              <div className="insight-title-row">

                <strong>
                  Risk Monitoring
                </strong>

              </div>

              <p>
                {attrition.monitored_employees} of{" "}
                {attrition.total_employees} employees
                are currently monitored.
              </p>

            </div>

          </div>

        </div>

      </div>

      {/* ======================================================
          SECOND ROW
          ====================================================== */}

      <div className="dashboard-grid dashboard-grid-three">

        {/* ATTENDANCE */}

        <div className="content-card">

          <div className="card-header">
            <div>
              <h2>Attendance</h2>

              <p>
                Workforce attendance overview
              </p>
            </div>
          </div>

          <div className="mini-stat-grid">

            <div className="mini-stat">
              <span>Present</span>

              <strong className="mini-green">
                {attendance.present}
              </strong>
            </div>

            <div className="mini-stat">
              <span>Half Day</span>

              <strong>
                {attendance.half_day}
              </strong>
            </div>

            <div className="mini-stat">
              <span>Late</span>

              <strong>
                {attendance.late}
              </strong>
            </div>

            <div className="mini-stat">
              <span>Absent</span>

              <strong className="mini-red">
                {attendance.absent}
              </strong>
            </div>

          </div>

          <div className="card-footer-text">
            {attendance.total_records} total attendance
            records
          </div>

        </div>

        {/* LEAVE */}

        <div className="content-card">

          <div className="card-header">
            <div>
              <h2>Leave Overview</h2>

              <p>
                Employee leave requests
              </p>
            </div>
          </div>

          <div className="mini-stat-grid">

            <div className="mini-stat">
              <span>Total</span>

              <strong>
                {leave.total_requests}
              </strong>
            </div>

            <div className="mini-stat">
              <span>Approved</span>

              <strong className="mini-green">
                {leave.approved}
              </strong>
            </div>

            <div className="mini-stat">
              <span>Pending</span>

              <strong className="mini-orange">
                {leave.pending}
              </strong>
            </div>

            <div className="mini-stat">
              <span>Rejected</span>

              <strong className="mini-red">
                {leave.rejected}
              </strong>
            </div>

          </div>

          <div className="card-footer-text">
            {leaveApprovalPercentage}% approval rate
          </div>

        </div>

        {/* PAYROLL */}

        <div className="content-card">

          <div className="card-header">
            <div>
              <h2>Payroll</h2>

              <p>
                Workforce compensation overview
              </p>
            </div>
          </div>

          <div className="payroll-summary">

            <div>
              <span>Total Gross</span>

              <strong>
                {formatCurrency(
                  payroll.total_gross_salary
                )}
              </strong>
            </div>

            <div>
              <span>Total Net</span>

              <strong className="payroll-net">
                {formatCurrency(
                  payroll.total_net_salary
                )}
              </strong>
            </div>

          </div>

          <div className="card-footer-text">
            {payroll.paid} paid payroll records
          </div>

        </div>

      </div>

      {/* ======================================================
          ATTRITION INTELLIGENCE
          ====================================================== */}

      <div className="content-card attrition-banner">

        <div className="attrition-banner-icon">
          △
        </div>

        <div className="attrition-banner-content">

          <div className="attrition-banner-title">

            <h2>
              AI Attrition Intelligence
            </h2>

            <span className="critical-label">
              {attrition.critical_risk > 0
                ? "ACTION REQUIRED"
                : "STABLE"}
            </span>

          </div>

          <p>
            {attrition.total_high_or_critical} employee
            {attrition.total_high_or_critical === 1
              ? ""
              : "s"} currently have high or critical
            attrition risk. The average predicted
            attrition probability is{" "}
            <strong>
              {Number(
                attrition.average_attrition_probability ||
                  0
              ).toFixed(2)}
              %
            </strong>.
          </p>

        </div>

        <div className="attrition-banner-score">

          <span>
            Average Risk
          </span>

          <strong>
            {Number(
              attrition.average_attrition_probability ||
                0
            ).toFixed(2)}
            %
          </strong>

        </div>

      </div>

    </div>
  );
}

/* ============================================================
   PROTECTED ROUTE
   ============================================================ */

function ProtectedRoute({ children }) {
  const {
    isAuthenticated,
    loading,
  } = useAuth();

  if (loading) {
    return (
      <div className="page-placeholder">
        <div className="placeholder-card">

          <div className="placeholder-icon">
            ◌
          </div>

          <h1>Loading...</h1>

          <p>
            Checking your authentication session.
          </p>

        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return children;
}

/* ============================================================
   APPLICATION LAYOUT
   ============================================================ */

function AppLayout() {
  const {
    user,
    logout,
  } = useAuth();

  const userName =
    user?.name ||
    user?.first_name ||
    "Naresh";

  const userRole =
    user?.role ||
    "ADMIN";

  return (
    <div
  className="app-shell"
  style={{
    background: "#09111f",
    minHeight: "100vh",
  }}
>

      {/* ======================================================
          SIDEBAR
          ====================================================== */}

      <aside className="sidebar">

        <div className="brand">

          <div className="brand-mark">
            W
          </div>

          <div>

            <div className="brand-name">
              WorkForce AI
            </div>

            <div className="brand-subtitle">
              PRO
            </div>

          </div>

        </div>

        <nav className="sidebar-nav">

          <div className="nav-section-title">
            MAIN
          </div>

          <NavItem
            to="/dashboard"
            icon="▦"
            label="Dashboard"
          />

          <NavItem
            to="/employees"
            icon="♙"
            label="Employees"
          />

          <NavItem
            to="/attendance"
            icon="◷"
            label="Attendance"
          />

          <NavItem
            to="/leaves"
            icon="✓"
            label="Leave Management"
          />

          <NavItem
            to="/payroll"
            icon="▤"
            label="Payroll"
          />

          <div className="nav-section-title">
            INTELLIGENCE
          </div>

          <NavItem
            to="/attrition"
            icon="◉"
            label="Attrition Prediction"
          />

          <NavItem
            to="/risk-monitoring"
            icon="△"
            label="Risk Monitoring"
          />

          <NavItem
            to="/recommendations"
            icon="✦"
            label="AI Recommendations"
          />

          <NavItem
            to="/analytics"
            icon="⌁"
            label="Workforce Analytics"
          />

          <div className="nav-section-title">
            MANAGEMENT
          </div>

          <NavItem
            to="/performance"
            icon="★"
            label="Performance"
          />

          <NavItem
            to="/reports"
            icon="▥"
            label="Reports"
          />

          <NavItem
            to="/notifications"
            icon="◌"
            label="Notifications"
          />

          <NavItem
            to="/chat"
            icon="◫"
            label="Chat"
          />

          <NavItem
            to="/settings"
            icon="⚙"
            label="Settings"
          />

        </nav>

        <div className="sidebar-user">

          <div className="user-avatar">
            NA
          </div>

          <div className="user-info">

            <strong>
              {userName}
            </strong>

            <span>
              {userRole}
            </span>

          </div>

        </div>

      </aside>

      {/* ======================================================
          MAIN AREA
          ====================================================== */}

      <main
       className="main-area"
      style={{
      background: "#09111f",
      minHeight: "100vh",
     }}
      >

        <header className="topbar">

          <div className="breadcrumb">

            <span>
              WorkForce AI Pro
            </span>

            <span className="breadcrumb-separator">
              /
            </span>

            <strong>
              Workforce Intelligence
            </strong>

          </div>

          <div className="topbar-actions">

            <button
              className="icon-button"
              type="button"
              title="Notifications"
            >
              ◌
            </button>

            <div className="topbar-user">

              <div className="user-avatar small">
                NA
              </div>

              <div>

                <strong>
                  {userName}
                </strong>

                <span>
                  {userRole}
                </span>

              </div>

            </div>

            <button
              className="logout-button"
              type="button"
              onClick={logout}
            >
              Logout
            </button>

          </div>

        </header>

        <section
  className="page-content"
  style={{
    background: "#09111f",
    minHeight: "calc(100vh - 70px)",
    color: "#ffffff",
  }}
  >

          <Routes>

            {/* =================================================
                DASHBOARD
                ================================================= */}

            <Route
              path="/dashboard"
              element={<Dashboard />}
            />

            {/* =================================================
                EMPLOYEES
                ================================================= */}

            <Route
              path="/employees"
              element={<EmployeesPage />}
            />

            <Route
              path="/employees/:employeeId"
              element={<EmployeeDetailsPage />}
            />

            <Route
              path="/employees/:employeeId/edit"
              element={<EditEmployeePage />}
            />

            {/* =================================================
                ATTENDANCE
                ================================================= */}

            <Route
              path="/attendance"
              element={<AttendancePage />}
            />

            {/* =================================================
                LEAVE MANAGEMENT
                ================================================= */}

            <Route
              path="/leaves"
              element={<LeaveManagement />}
            />

            {/* =================================================
                PAYROLL
                ================================================= */}

            <Route
              path="/payroll"
              element={<PayrollPage />}
            />

            {/* =================================================
                ATTRITION PREDICTION
                ================================================= */}

            <Route
              path="/attrition"
              element={<AttritionPredictionPage />}
            />

            {/* =================================================
                RISK MONITORING
                ================================================= */}

            <Route
           path="/risk-monitoring"
           element={<RiskMonitoringPage />}
          />

            {/* =================================================
                AI RECOMMENDATIONS
                ================================================= */}

            <Route
             path="/recommendations"
             element={<AIRecommendationsPage />}
             />

            {/* =================================================
                WORKFORCE ANALYTICS
                ================================================= */}

             <Route
              path="/analytics"
              element={<WorkforceAnalyticsPage />}
              />

            {/* =================================================
                PERFORMANCE
                ================================================= */}

            <Route
             path="/performance"
             element={<PerformancePage />}
             />

            {/* =================================================
                REPORTS
                ================================================= */}

            <Route
             path="/reports"
             element={<ReportsPage />}
             />

            {/* =================================================
                NOTIFICATIONS
                ================================================= */}

             <Route
             path="/notifications"
             element={<NotificationsPage />}
             />

            {/* =================================================
                CHAT
                ================================================= */}

            <Route
             path="/chat"
             element={<ChatPage />}
            />

            {/* =================================================
                SETTINGS
                ================================================= */}

            <Route
             path="/settings"
             element={<SettingsPage />}
              />

            {/* =================================================
                DEFAULT
                ================================================= */}

            <Route
              path="/"
              element={
                <Navigate
                  to="/dashboard"
                  replace
                />
              }
            />

            <Route
              path="*"
              element={
                <Navigate
                  to="/dashboard"
                  replace
                />
              }
            />

          </Routes>

        </section>

      </main>

    </div>
  );
}

/* ============================================================
   NAVIGATION ITEM
   ============================================================ */

function NavItem({
  to,
  icon,
  label,
}) {
  return (
    <a
      className="nav-item"
      href={to}
    >
      <span className="nav-icon">
        {icon}
      </span>

      <span>
        {label}
      </span>
    </a>
  );
}

/* ============================================================
   APPLICATION ROOT
   ============================================================ */

function App() {
  return (
    <BrowserRouter>

      <AuthProvider>

        <Routes>

          <Route
            path="/login"
            element={<LoginPage />}
          />

          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          />

        </Routes>

      </AuthProvider>

    </BrowserRouter>
  );
}

export default App;