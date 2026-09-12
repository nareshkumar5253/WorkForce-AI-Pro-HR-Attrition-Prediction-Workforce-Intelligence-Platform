import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import notificationService from "../../services/notificationService";

export default function NotificationsPage() {
  const [notifications, setNotifications] =
    useState([]);

  const [unreadCount, setUnreadCount] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [processingId, setProcessingId] =
    useState(null);

  const [markingAll, setMarkingAll] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [filter, setFilter] =
    useState("ALL");

  const [typeFilter, setTypeFilter] =
    useState("ALL");

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        notificationData,
        unreadData,
      ] = await Promise.all([
        notificationService.getMyNotifications(
          false
        ),
        notificationService.getUnreadCount(),
      ]);

      setNotifications(
        notificationData || []
      );

      setUnreadCount(
        Number(
          unreadData?.unread_count || 0
        )
      );
    } catch (err) {
      console.error(
        "Notifications loading failed:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Unable to load notifications."
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
        notificationData,
        unreadData,
      ] = await Promise.all([
        notificationService.getMyNotifications(
          false
        ),
        notificationService.getUnreadCount(),
      ]);

      setNotifications(
        notificationData || []
      );

      setUnreadCount(
        Number(
          unreadData?.unread_count || 0
        )
      );

      setSuccess(
        "Notifications refreshed successfully."
      );
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.detail ||
          "Unable to refresh notifications."
      );
    } finally {
      setRefreshing(false);
    }
  };

  const handleMarkAsRead = async (
    notification
  ) => {
    if (notification.is_read) {
      return;
    }

    try {
      setProcessingId(
        notification.id
      );

      setError("");
      setSuccess("");

      await notificationService.markAsRead(
        notification.id
      );

      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id
            ? {
                ...item,
                is_read: true,
                read_at:
                  new Date().toISOString(),
              }
            : item
        )
      );

      setUnreadCount((count) =>
        Math.max(count - 1, 0)
      );

      setSuccess(
        "Notification marked as read."
      );
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.detail ||
          "Unable to mark notification as read."
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) {
      return;
    }

    try {
      setMarkingAll(true);
      setError("");
      setSuccess("");

      await notificationService.markAllAsRead();

      const now =
        new Date().toISOString();

      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          is_read: true,
          read_at:
            item.read_at || now,
        }))
      );

      setUnreadCount(0);

      setSuccess(
        "All notifications marked as read."
      );
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.detail ||
          "Unable to mark all notifications as read."
      );
    } finally {
      setMarkingAll(false);
    }
  };

  const getTypeClass = (type) => {
    switch (
      String(type || "").toUpperCase()
    ) {
      case "SUCCESS":
        return "notification-success";

      case "WARNING":
        return "notification-warning";

      case "ERROR":
        return "notification-error";

      case "INFO":
      default:
        return "notification-info";
    }
  };

  const getTypeIcon = (type) => {
    switch (
      String(type || "").toUpperCase()
    ) {
      case "SUCCESS":
        return "✓";

      case "WARNING":
        return "!";

      case "ERROR":
        return "×";

      case "INFO":
      default:
        return "i";
    }
  };

  const formatDateTime = (value) => {
    if (!value) {
      return "-";
    }

    const date = new Date(value);

    if (
      Number.isNaN(date.getTime())
    ) {
      return value;
    }

    return date.toLocaleString(
      "en-IN"
    );
  };

  const filteredNotifications =
    useMemo(() => {
      return notifications.filter(
        (notification) => {
          const matchesRead =
            filter === "ALL" ||
            (filter === "UNREAD" &&
              !notification.is_read) ||
            (filter === "READ" &&
              notification.is_read);

          const matchesType =
            typeFilter === "ALL" ||
            notification.notification_type ===
              typeFilter;

          return (
            matchesRead &&
            matchesType
          );
        }
      );
    }, [
      notifications,
      filter,
      typeFilter,
    ]);

  const readCount =
    notifications.filter(
      (item) => item.is_read
    ).length;

  const notificationTypes = [
    ...new Set(
      notifications
        .map(
          (item) =>
            item.notification_type
        )
        .filter(Boolean)
    ),
  ];

  /* ==========================================================
     LOADING
     ========================================================== */

  if (loading) {
    return (
      <>
        <style>
          {notificationStyles}
        </style>

        <div
  className="notifications-page"
  style={{
    background: "#09111f",
    color: "#ffffff",
    minHeight: "calc(100vh - 70px)",
    width: "100%",
    boxSizing: "border-box",
  }}
>
          <div className="notifications-loading">

            <div className="notifications-spinner"></div>

            <h2>
              Loading notifications...
            </h2>

            <p>
              Checking your latest HR and
              workforce notifications.
            </p>

          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>
        {notificationStyles}
      </style>

      <div className="notifications-page">

        {/* ====================================================
            HEADER
            ==================================================== */}

        <div className="notifications-header">

          <div>

            <div className="notifications-eyebrow">
              WORKFORCE COMMUNICATION
            </div>

            <h1>
              Notifications
            </h1>

            <p>
              Stay updated with important HR,
              leave, payroll and workforce events.
            </p>

          </div>

          <button
            type="button"
            className="notifications-refresh"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing
              ? "Refreshing..."
              : "↻ Refresh"}
          </button>

        </div>

        {/* ====================================================
            MESSAGES
            ==================================================== */}

        {error && (
          <div className="notifications-error">
            {error}
          </div>
        )}

        {success && (
          <div className="notifications-success">
            {success}
          </div>
        )}

        {/* ====================================================
            SUMMARY
            ==================================================== */}

        <div className="notification-summary-grid">

          <NotificationSummary
            title="Total Notifications"
            value={
              notifications.length
            }
            icon="◌"
            className="summary-blue"
          />

          <NotificationSummary
            title="Unread"
            value={unreadCount}
            icon="●"
            className="summary-red"
          />

          <NotificationSummary
            title="Read"
            value={readCount}
            icon="✓"
            className="summary-green"
          />

        </div>

        {/* ====================================================
            ACTION BAR
            ==================================================== */}

        <div className="notification-action-bar">

          <div className="notification-action-info">

            <div className="notification-bell">
              ◉
            </div>

            <div>
              <strong>
                Notification Center
              </strong>

              <span>
                You have{" "}
                <b>
                  {unreadCount}
                </b>{" "}
                unread notification
                {unreadCount === 1
                  ? ""
                  : "s"}.
              </span>
            </div>

          </div>

          <button
            type="button"
            className="mark-all-button"
            onClick={handleMarkAllAsRead}
            disabled={
              markingAll ||
              unreadCount === 0
            }
          >
            {markingAll
              ? "Marking..."
              : "✓ Mark All as Read"}
          </button>

        </div>

        {/* ====================================================
            NOTIFICATION PANEL
            ==================================================== */}

        <div className="notifications-panel">

          <div className="notifications-panel-header">

            <div>
              <h2>
                Your Notifications
              </h2>

              <p>
                Latest messages and workforce
                updates.
              </p>
            </div>

            <div className="notification-record-count">
              {filteredNotifications.length}{" "}
              records
            </div>

          </div>

          {/* FILTERS */}

          <div className="notification-filters">

            <div className="filter-group">

              <button
                type="button"
                className={
                  filter === "ALL"
                    ? "filter-button active"
                    : "filter-button"
                }
                onClick={() =>
                  setFilter("ALL")
                }
              >
                All
              </button>

              <button
                type="button"
                className={
                  filter === "UNREAD"
                    ? "filter-button active"
                    : "filter-button"
                }
                onClick={() =>
                  setFilter("UNREAD")
                }
              >
                Unread
              </button>

              <button
                type="button"
                className={
                  filter === "READ"
                    ? "filter-button active"
                    : "filter-button"
                }
                onClick={() =>
                  setFilter("READ")
                }
              >
                Read
              </button>

            </div>

            <select
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(
                  event.target.value
                )
              }
              className="notification-type-filter"
            >
              <option value="ALL">
                All Types
              </option>

              {notificationTypes.map(
                (type) => (
                  <option
                    key={type}
                    value={type}
                  >
                    {type}
                  </option>
                )
              )}
            </select>

          </div>

          {/* NOTIFICATION LIST */}

          {filteredNotifications.length ===
          0 ? (
            <div className="notifications-empty">

              <div className="empty-icon">
                ✓
              </div>

              <h3>
                No notifications found
              </h3>

              <p>
                There are no notifications matching
                your current filter.
              </p>

            </div>
          ) : (
            <div className="notification-list">

              {filteredNotifications.map(
                (notification) => (
                  <div
                    key={notification.id}
                    className={
                      notification.is_read
                        ? "notification-item read"
                        : "notification-item unread"
                    }
                  >

                    <div
                      className={`notification-type-icon ${getTypeClass(
                        notification.notification_type
                      )}`}
                    >
                      {getTypeIcon(
                        notification.notification_type
                      )}
                    </div>

                    <div className="notification-content">

                      <div className="notification-item-top">

                        <div>

                          <div className="notification-title-row">

                            <h3>
                              {
                                notification.title
                              }
                            </h3>

                            {!notification.is_read && (
                              <span className="unread-dot">
                                NEW
                              </span>
                            )}

                          </div>

                          <span
                            className={`notification-type-badge ${getTypeClass(
                              notification.notification_type
                            )}`}
                          >
                            {
                              notification.notification_type
                            }
                          </span>

                        </div>

                        <span className="notification-time">
                          {formatDateTime(
                            notification.created_at
                          )}
                        </span>

                      </div>

                      <p>
                        {
                          notification.message
                        }
                      </p>

                      <div className="notification-footer">

                        <span>
                          Notification #
                          {
                            notification.id
                          }
                        </span>

                        {notification.is_read &&
                          notification.read_at && (
                            <span>
                              Read:{" "}
                              {formatDateTime(
                                notification.read_at
                              )}
                            </span>
                          )}

                        {!notification.is_read && (
                          <button
                            type="button"
                            className="read-button"
                            onClick={() =>
                              handleMarkAsRead(
                                notification
                              )
                            }
                            disabled={
                              processingId ===
                              notification.id
                            }
                          >
                            {processingId ===
                            notification.id
                              ? "Updating..."
                              : "Mark as Read"}
                          </button>
                        )}

                      </div>

                    </div>

                  </div>
                )
              )}

            </div>
          )}

        </div>

        {/* ====================================================
            FOOTER
            ==================================================== */}

        <div className="notifications-footer">

          <span>
            WorkForce AI Pro Notification Center
          </span>

          <span>
            {notifications.length} total ·{" "}
            {unreadCount} unread
          </span>

        </div>

      </div>
    </>
  );
}

/* ============================================================
   SUMMARY CARD
   ============================================================ */

function NotificationSummary({
  title,
  value,
  icon,
  className,
}) {
  return (
    <div
      className={`notification-summary-card ${className}`}
    >

      <div className="notification-summary-top">

        <span>
          {title}
        </span>

        <div className="notification-summary-icon">
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
   STYLES
   ============================================================ */

const notificationStyles = `
  /* ==========================================================
     GLOBAL DARK BACKGROUND
     ========================================================== */

  html,
  body,
  #root {
    margin: 0 !important;
    min-height: 100% !important;
    background: #09111f !important;
    color: #ffffff !important;
  }

  body {
    background: #09111f !important;
  }

  .app-shell {
    min-height: 100vh !important;
    background: #09111f !important;
  }

  .main-area {
    min-height: 100vh !important;
    background: #09111f !important;
  }

  .page-content {
    min-height: calc(100vh - 70px) !important;
    background: #09111f !important;
  }

  /* ==========================================================
     MAIN PAGE
     ========================================================== */

  .notifications-page {
    width: 100%;
    min-height: calc(100vh - 70px);
    box-sizing: border-box;
    padding: 30px;
    background: #09111f !important;
    color: #ffffff !important;
  }

  /* ==========================================================
     HEADER
     ========================================================== */

  .notifications-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 20px;
    margin-bottom: 26px;
  }

  .notifications-eyebrow {
    color: #60a5fa;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 1.4px;
    margin-bottom: 8px;
  }

  .notifications-header h1 {
    margin: 0;
    color: #ffffff !important;
    font-size: 30px;
    font-weight: 800;
  }

  .notifications-header p {
    margin: 8px 0 0;
    max-width: 760px;
    color: #94a3b8 !important;
    font-size: 15px;
    line-height: 1.6;
  }

  .notifications-refresh {
    padding: 11px 18px;
    border-radius: 10px;
    border: 1px solid #334155;
    background: #111c2d !important;
    color: #ffffff !important;
    cursor: pointer;
    font-weight: 700;
  }

  .notifications-refresh:hover {
    background: #17253a !important;
  }

  .notifications-refresh:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* ==========================================================
     MESSAGES
     ========================================================== */

  .notifications-error,
  .notifications-success {
    margin-bottom: 18px;
    padding: 13px 16px;
    border-radius: 10px;
  }

  .notifications-error {
    background: #450a0a !important;
    border: 1px solid #7f1d1d;
    color: #fecaca !important;
  }

  .notifications-success {
    background: #052e26 !important;
    border: 1px solid #065f46;
    color: #a7f3d0 !important;
  }

  /* ==========================================================
     SUMMARY
     ========================================================== */

  .notification-summary-grid {
    display: grid;
    grid-template-columns:
      repeat(3, minmax(0, 1fr));
    gap: 16px;
    margin-bottom: 20px;
  }

  .notification-summary-card {
    min-height: 115px;
    padding: 19px;
    border-radius: 15px;
    background: #111c2d !important;
    border: 1px solid #263850;
    box-shadow:
      0 10px 25px rgba(0, 0, 0, 0.18);
  }

  .notification-summary-card.summary-blue {
    border-top: 3px solid #3b82f6;
  }

  .notification-summary-card.summary-red {
    border-top: 3px solid #ef4444;
  }

  .notification-summary-card.summary-green {
    border-top: 3px solid #10b981;
  }

  .notification-summary-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .notification-summary-top span {
    color: #cbd5e1 !important;
    font-size: 13px;
    font-weight: 600;
  }

  .notification-summary-icon {
    width: 34px;
    height: 34px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 10px;
    background: #0b1628 !important;
    color: #ffffff !important;
    font-weight: 800;
  }

  .notification-summary-card > strong {
    display: block;
    margin-top: 14px;
    color: #ffffff !important;
    font-size: 30px;
  }

  /* ==========================================================
     ACTION BAR
     ========================================================== */

  .notification-action-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
    margin-bottom: 21px;
    padding: 18px 20px;
    border-radius: 14px;
    border: 1px solid #263850;
    background: #111c2d !important;
  }

  .notification-action-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .notification-bell {
    width: 42px;
    height: 42px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 11px;
    background: #172554 !important;
    color: #93c5fd !important;
    font-weight: 800;
  }

  .notification-action-info > div:last-child {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .notification-action-info strong {
    color: #ffffff !important;
    font-size: 14px;
  }

  .notification-action-info span {
    color: #94a3b8 !important;
    font-size: 12px;
  }

  .notification-action-info b {
    color: #ffffff !important;
  }

  .mark-all-button {
    padding: 10px 14px;
    border-radius: 9px;
    border: 1px solid #3b82f6;
    background: #172554 !important;
    color: #93c5fd !important;
    cursor: pointer;
    font-weight: 700;
    font-size: 11px;
  }

  .mark-all-button:hover {
    background: #1e3a8a !important;
  }

  .mark-all-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* ==========================================================
     NOTIFICATIONS PANEL
     ========================================================== */

  .notifications-panel {
    border-radius: 16px;
    border: 1px solid #263850;
    background: #111c2d !important;
    overflow: hidden;
  }

  .notifications-panel-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 15px;
    padding: 22px 24px 18px;
  }

  .notifications-panel-header h2 {
    margin: 0;
    color: #ffffff !important;
    font-size: 19px;
  }

  .notifications-panel-header p {
    margin: 6px 0 0;
    color: #94a3b8 !important;
    font-size: 12px;
  }

  .notification-record-count {
    padding: 7px 11px;
    border-radius: 8px;
    background: #0b1628 !important;
    border: 1px solid #293b55;
    color: #93c5fd !important;
    font-size: 11px;
    font-weight: 700;
  }

  /* ==========================================================
     FILTERS
     ========================================================== */

  .notification-filters {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 15px;
    padding: 0 24px 18px;
  }

  .filter-group {
    display: flex;
    gap: 7px;
  }

  .filter-button {
    padding: 8px 13px;
    border-radius: 8px;
    border: 1px solid #334155;
    background: #0b1628 !important;
    color: #94a3b8 !important;
    cursor: pointer;
    font-size: 11px;
    font-weight: 700;
  }

  .filter-button:hover {
    color: #ffffff !important;
  }

  .filter-button.active {
    border-color: #3b82f6;
    background: #172554 !important;
    color: #93c5fd !important;
  }

  .notification-type-filter {
    min-width: 150px;
    padding: 9px 11px;
    border-radius: 8px;
    border: 1px solid #334155;
    background: #0b1628 !important;
    color: #ffffff !important;
    outline: none;
  }

  /* ==========================================================
     LIST
     ========================================================== */

  .notification-list {
    display: grid;
    gap: 1px;
    background: #1e293b !important;
  }

  .notification-item {
    display: flex;
    gap: 15px;
    padding: 20px 24px;
    background: #111c2d !important;
    border-left: 3px solid transparent;
  }

  .notification-item:hover {
    background: #142137 !important;
  }

  .notification-item.unread {
    border-left-color: #3b82f6;
    background: #101d31 !important;
  }

  .notification-type-icon {
    width: 43px;
    height: 43px;
    flex-shrink: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 12px;
    font-weight: 900;
  }

  .notification-success {
    background: #052e26 !important;
    color: #6ee7b7 !important;
  }

  .notification-warning {
    background: #451a03 !important;
    color: #fcd34d !important;
  }

  .notification-error {
    background: #450a0a !important;
    color: #fca5a5 !important;
  }

  .notification-info {
    background: #172554 !important;
    color: #93c5fd !important;
  }

  .notification-content {
    flex: 1;
    min-width: 0;
  }

  .notification-item-top {
    display: flex;
    justify-content: space-between;
    gap: 20px;
  }

  .notification-title-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .notification-title-row h3 {
    margin: 0;
    color: #ffffff !important;
    font-size: 15px;
  }

  .unread-dot {
    padding: 4px 7px;
    border-radius: 99px;
    background: #172554 !important;
    color: #93c5fd !important;
    font-size: 8px;
    font-weight: 900;
  }

  .notification-type-badge {
    display: inline-flex;
    margin-top: 7px;
    padding: 4px 7px;
    border-radius: 99px;
    font-size: 8px;
    font-weight: 800;
  }

  .notification-time {
    flex-shrink: 0;
    color: #64748b !important;
    font-size: 10px;
  }

  .notification-content > p {
    margin: 12px 0 14px;
    max-width: 850px;
    color: #cbd5e1 !important;
    line-height: 1.6;
    font-size: 12px;
  }

  .notification-footer {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 13px;
    color: #64748b !important;
    font-size: 9px;
  }

  .read-button {
    padding: 7px 10px;
    border-radius: 7px;
    border: 1px solid #334155;
    background: #0b1628 !important;
    color: #93c5fd !important;
    cursor: pointer;
    font-size: 10px;
    font-weight: 700;
  }

  .read-button:hover {
    background: #17253a !important;
  }

  .read-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* ==========================================================
     EMPTY
     ========================================================== */

  .notifications-empty {
    padding: 70px 20px;
    text-align: center;
    background: #111c2d !important;
  }

  .empty-icon {
    width: 50px;
    height: 50px;
    margin: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 14px;
    background: #052e26 !important;
    color: #6ee7b7 !important;
    font-size: 22px;
    font-weight: 800;
  }

  .notifications-empty h3 {
    margin: 13px 0 6px;
    color: #ffffff !important;
  }

  .notifications-empty p {
    margin: 0;
    color: #64748b !important;
    font-size: 12px;
  }

  /* ==========================================================
     FOOTER
     ========================================================== */

  .notifications-footer {
    display: flex;
    justify-content: space-between;
    gap: 15px;
    margin-top: 18px;
    padding: 15px 18px;
    border-radius: 12px;
    border: 1px solid #263850;
    background: #111c2d !important;
    color: #64748b !important;
    font-size: 9px;
  }

  /* ==========================================================
     LOADING
     ========================================================== */

  .notifications-loading {
    min-height: 65vh;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    text-align: center;
    background: #09111f !important;
  }

  .notifications-loading h2 {
    margin: 18px 0 7px;
    color: #ffffff !important;
  }

  .notifications-loading p {
    margin: 0;
    color: #64748b !important;
  }

  .notifications-spinner {
    width: 42px;
    height: 42px;
    border: 4px solid #1e293b;
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: notificationsSpin 0.8s linear infinite;
  }

  @keyframes notificationsSpin {
    to {
      transform: rotate(360deg);
    }
  }

  /* ==========================================================
     RESPONSIVE
     ========================================================== */

  @media (max-width: 800px) {
    .notifications-page {
      padding: 18px;
    }

    .notifications-header {
      flex-direction: column;
    }

    .notification-summary-grid {
      grid-template-columns: 1fr;
    }

    .notification-action-bar {
      align-items: flex-start;
      flex-direction: column;
    }

    .notification-filters {
      align-items: stretch;
      flex-direction: column;
    }

    .notification-type-filter {
      width: 100%;
    }

    .notification-item-top {
      align-items: flex-start;
      flex-direction: column;
      gap: 8px;
    }
  }

  @media (max-width: 550px) {
    .notification-item {
      padding: 18px;
    }

    .notifications-panel-header {
      padding: 18px;
    }

    .notification-filters {
      padding: 0 18px 16px;
    }

    .notifications-footer {
      flex-direction: column;
    }
  }
`;