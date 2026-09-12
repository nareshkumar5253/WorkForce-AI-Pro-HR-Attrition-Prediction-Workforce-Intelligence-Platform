import React, { useEffect, useState } from "react";
import api from "../../services/api";

export default function SettingsPage() {
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [darkMode, setDarkMode] = useState(true);
  const [emailNotifications, setEmailNotifications] =
    useState(true);
  const [chatNotifications, setChatNotifications] =
    useState(true);

  useEffect(() => {
    loadProfile();

    const savedDarkMode =
      localStorage.getItem("settings_dark_mode");

    const savedEmailNotifications =
      localStorage.getItem("settings_email_notifications");

    const savedChatNotifications =
      localStorage.getItem("settings_chat_notifications");

    if (savedDarkMode !== null) {
      setDarkMode(savedDarkMode === "true");
    }

    if (savedEmailNotifications !== null) {
      setEmailNotifications(
        savedEmailNotifications === "true"
      );
    }

    if (savedChatNotifications !== null) {
      setChatNotifications(
        savedChatNotifications === "true"
      );
    }
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/users/me");

      setUser(response.data);
      setName(response.data?.name || "");
      setEmail(response.data?.email || "");
    } catch (err) {
      console.error("Settings profile loading failed:", err);

      setError(
        err?.response?.data?.detail ||
          "Unable to load your profile."
      );
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = () => {
    localStorage.setItem(
      "settings_dark_mode",
      String(darkMode)
    );

    localStorage.setItem(
      "settings_email_notifications",
      String(emailNotifications)
    );

    localStorage.setItem(
      "settings_chat_notifications",
      String(chatNotifications)
    );

    setMessage("Preferences saved successfully.");
    setTimeout(() => setMessage(""), 3000);
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      /*
       * Your current users.py does not expose
       * a profile update endpoint.
       *
       * Therefore we only validate the fields here
       * until PUT /users/me is added to the backend.
       */

      if (!name.trim()) {
        setError("Name cannot be empty.");
        return;
      }

      setMessage(
        "Profile details are ready. Backend update endpoint is required to persist changes."
      );
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.detail ||
          "Unable to save profile."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <style>{settingsStyles}</style>

        <div className="settings-page">
          <div className="settings-loading">
            <div className="settings-spinner"></div>

            <h2>Loading settings...</h2>

            <p>
              Loading your WorkForce AI Pro settings.
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{settingsStyles}</style>

      <div className="settings-page">

        <div className="settings-header">
          <div>
            <div className="settings-eyebrow">
              APPLICATION CONFIGURATION
            </div>

            <h1>Settings</h1>

            <p>
              Manage your profile, notifications and
              application preferences.
            </p>
          </div>
        </div>

        {error && (
          <div className="settings-message error">
            {error}
          </div>
        )}

        {message && (
          <div className="settings-message success">
            {message}
          </div>
        )}

        <div className="settings-grid">

          {/* PROFILE */}

          <div className="settings-card settings-profile-card">

            <div className="settings-card-header">
              <div>
                <h2>Profile</h2>

                <p>
                  Your WorkForce AI Pro account details.
                </p>
              </div>

              <div className="settings-card-icon">
                ♙
              </div>
            </div>

            <form onSubmit={handleSaveProfile}>

              <div className="settings-avatar">
                {(name || "U")
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div className="settings-user-summary">
                <strong>
                  {name || "User"}
                </strong>

                <span>
                  {user?.role || "EMPLOYEE"}
                </span>
              </div>

              <div className="settings-field">
                <label>Name</label>

                <input
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="Enter your name"
                />
              </div>

              <div className="settings-field">
                <label>Email</label>

                <input
                  value={email}
                  disabled
                  readOnly
                />
              </div>

              <div className="settings-field">
                <label>Role</label>

                <input
                  value={user?.role || ""}
                  disabled
                  readOnly
                />
              </div>

              <button
                type="submit"
                className="settings-primary-button"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : "Save Profile"}
              </button>

            </form>

          </div>

          {/* PREFERENCES */}

          <div className="settings-card">

            <div className="settings-card-header">
              <div>
                <h2>Preferences</h2>

                <p>
                  Control your application experience.
                </p>
              </div>

              <div className="settings-card-icon">
                ⚙
              </div>
            </div>

            <div className="settings-option">
              <div>
                <strong>
                  Dark Theme
                </strong>

                <span>
                  Keep the WorkForce AI Pro interface
                  in dark mode.
                </span>
              </div>

              <button
                type="button"
                className={
                  darkMode
                    ? "settings-toggle active"
                    : "settings-toggle"
                }
                onClick={() =>
                  setDarkMode((value) => !value)
                }
              >
                <span></span>
              </button>
            </div>

            <div className="settings-option">
              <div>
                <strong>
                  Email Notifications
                </strong>

                <span>
                  Receive HR and workforce updates by email.
                </span>
              </div>

              <button
                type="button"
                className={
                  emailNotifications
                    ? "settings-toggle active"
                    : "settings-toggle"
                }
                onClick={() =>
                  setEmailNotifications(
                    (value) => !value
                  )
                }
              >
                <span></span>
              </button>
            </div>

            <div className="settings-option">
              <div>
                <strong>
                  Chat Notifications
                </strong>

                <span>
                  Receive alerts for new workforce messages.
                </span>
              </div>

              <button
                type="button"
                className={
                  chatNotifications
                    ? "settings-toggle active"
                    : "settings-toggle"
                }
                onClick={() =>
                  setChatNotifications(
                    (value) => !value
                  )
                }
              >
                <span></span>
              </button>
            </div>

            <button
              type="button"
              className="settings-secondary-button"
              onClick={savePreferences}
            >
              Save Preferences
            </button>

          </div>

          {/* SYSTEM INFORMATION */}

          <div className="settings-card">

            <div className="settings-card-header">
              <div>
                <h2>System Information</h2>

                <p>
                  Current platform information.
                </p>
              </div>

              <div className="settings-card-icon">
                ◈
              </div>
            </div>

            <div className="settings-info-row">
              <span>Application</span>
              <strong>WorkForce AI Pro</strong>
            </div>

            <div className="settings-info-row">
              <span>Platform</span>
              <strong>HR Workforce Intelligence</strong>
            </div>

            <div className="settings-info-row">
              <span>Authentication</span>
              <strong>JWT</strong>
            </div>

            <div className="settings-info-row">
              <span>Database</span>
              <strong>MySQL</strong>
            </div>

            <div className="settings-info-row">
              <span>Mode</span>
              <strong>Production Ready</strong>
            </div>

          </div>

          {/* SECURITY */}

          <div className="settings-card">

            <div className="settings-card-header">
              <div>
                <h2>Security</h2>

                <p>
                  Account and session security information.
                </p>
              </div>

              <div className="settings-card-icon">
                🔒
              </div>
            </div>

            <div className="security-status">
              <div className="security-status-icon">
                ✓
              </div>

              <div>
                <strong>
                  Account Active
                </strong>

                <span>
                  Your account is currently active.
                </span>
              </div>
            </div>

            <div className="settings-info-row">
              <span>Verification</span>

              <strong>
                {user?.is_verified
                  ? "Verified"
                  : "Not Verified"}
              </strong>
            </div>

            <div className="settings-info-row">
              <span>Account Status</span>

              <strong>
                {user?.status || "ACTIVE"}
              </strong>
            </div>

          </div>

        </div>

        <div className="settings-footer">
          <span>
            WorkForce AI Pro
          </span>

          <span>
            HR Attrition Prediction & Workforce Intelligence
          </span>
        </div>

      </div>
    </>
  );
}

const settingsStyles = `
  html,
  body,
  #root {
    background: #09111f !important;
    color: #ffffff !important;
  }

  .app-shell,
  .main-area,
  .page-content {
    background: #09111f !important;
  }

  .settings-page {
    width: 100%;
    min-height: calc(100vh - 70px);
    padding: 30px;
    box-sizing: border-box;
    background: #09111f !important;
    color: #ffffff !important;
  }

  .settings-header {
    margin-bottom: 24px;
  }

  .settings-eyebrow {
    color: #60a5fa;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 1.5px;
    margin-bottom: 7px;
  }

  .settings-header h1 {
    margin: 0;
    color: #ffffff;
    font-size: 30px;
    font-weight: 800;
  }

  .settings-header p {
    margin: 8px 0 0;
    color: #94a3b8;
    font-size: 14px;
  }

  .settings-message {
    margin-bottom: 18px;
    padding: 13px 16px;
    border-radius: 10px;
    font-size: 12px;
  }

  .settings-message.error {
    background: #450a0a !important;
    border: 1px solid #7f1d1d;
    color: #fecaca;
  }

  .settings-message.success {
    background: #052e26 !important;
    border: 1px solid #065f46;
    color: #a7f3d0;
  }

  .settings-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px;
  }

  .settings-card {
    padding: 22px;
    border: 1px solid #263850;
    border-radius: 16px;
    background: #111c2d !important;
    box-shadow: 0 14px 35px rgba(0,0,0,0.18);
  }

  .settings-profile-card {
    grid-row: span 2;
  }

  .settings-card-header {
    display: flex;
    justify-content: space-between;
    gap: 15px;
    margin-bottom: 22px;
  }

  .settings-card-header h2 {
    margin: 0;
    color: #ffffff;
    font-size: 17px;
  }

  .settings-card-header p {
    margin: 6px 0 0;
    color: #64748b;
    font-size: 11px;
  }

  .settings-card-icon {
    width: 38px;
    height: 38px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    background: #172554 !important;
    color: #93c5fd;
  }

  .settings-avatar {
    width: 65px;
    height: 65px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 10px;
    border-radius: 18px;
    background: #1d4ed8 !important;
    color: #ffffff;
    font-size: 25px;
    font-weight: 800;
  }

  .settings-user-summary {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 20px;
  }

  .settings-user-summary strong {
    color: #ffffff;
    font-size: 16px;
  }

  .settings-user-summary span {
    color: #60a5fa;
    font-size: 10px;
    font-weight: 800;
  }

  .settings-field {
    margin-bottom: 15px;
  }

  .settings-field label {
    display: block;
    margin-bottom: 7px;
    color: #cbd5e1;
    font-size: 11px;
    font-weight: 700;
  }

  .settings-field input {
    width: 100%;
    padding: 11px 12px;
    box-sizing: border-box;
    border: 1px solid #334155;
    border-radius: 9px;
    outline: none;
    background: #09111f !important;
    color: #ffffff !important;
    font-size: 12px;
  }

  .settings-field input:focus {
    border-color: #3b82f6;
  }

  .settings-field input:disabled {
    opacity: 0.65;
  }

  .settings-primary-button,
  .settings-secondary-button {
    width: 100%;
    padding: 11px 14px;
    border-radius: 9px;
    cursor: pointer;
    font-size: 11px;
    font-weight: 800;
  }

  .settings-primary-button {
    margin-top: 5px;
    border: 1px solid #2563eb;
    background: #2563eb !important;
    color: #ffffff !important;
  }

  .settings-secondary-button {
    margin-top: 12px;
    border: 1px solid #334155;
    background: #172554 !important;
    color: #93c5fd !important;
  }

  .settings-option {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
    padding: 16px 0;
    border-bottom: 1px solid #223149;
  }

  .settings-option strong {
    display: block;
    margin-bottom: 5px;
    color: #ffffff;
    font-size: 12px;
  }

  .settings-option span {
    color: #64748b;
    font-size: 10px;
    line-height: 1.5;
  }

  .settings-toggle {
    width: 42px;
    height: 23px;
    flex-shrink: 0;
    padding: 3px;
    border: 0;
    border-radius: 99px;
    background: #334155 !important;
    cursor: pointer;
  }

  .settings-toggle span {
    display: block;
    width: 17px;
    height: 17px;
    border-radius: 50%;
    background: #ffffff;
    transition: transform 0.2s ease;
  }

  .settings-toggle.active {
    background: #2563eb !important;
  }

  .settings-toggle.active span {
    transform: translateX(19px);
  }

  .settings-info-row {
    display: flex;
    justify-content: space-between;
    gap: 15px;
    padding: 12px 0;
    border-bottom: 1px solid #223149;
  }

  .settings-info-row span {
    color: #64748b;
    font-size: 10px;
  }

  .settings-info-row strong {
    color: #e2e8f0;
    text-align: right;
    font-size: 10px;
  }

  .security-status {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 14px;
    padding: 13px;
    border-radius: 10px;
    background: #052e26 !important;
    border: 1px solid #065f46;
  }

  .security-status-icon {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 9px;
    background: #064e3b;
    color: #6ee7b7;
    font-weight: 800;
  }

  .security-status strong {
    display: block;
    color: #ffffff;
    font-size: 11px;
  }

  .security-status span {
    display: block;
    margin-top: 3px;
    color: #6ee7b7;
    font-size: 9px;
  }

  .settings-footer {
    display: flex;
    justify-content: space-between;
    gap: 15px;
    margin-top: 18px;
    padding: 15px 18px;
    border: 1px solid #263850;
    border-radius: 12px;
    background: #111c2d !important;
    color: #64748b;
    font-size: 9px;
  }

  .settings-loading {
    min-height: 65vh;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
  }

  .settings-loading h2 {
    margin: 17px 0 6px;
    color: #ffffff;
  }

  .settings-loading p {
    margin: 0;
    color: #64748b;
    font-size: 12px;
  }

  .settings-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #1e293b;
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: settingsSpin 0.8s linear infinite;
  }

  @keyframes settingsSpin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 850px) {
    .settings-page {
      padding: 18px;
    }

    .settings-grid {
      grid-template-columns: 1fr;
    }

    .settings-profile-card {
      grid-row: auto;
    }
  }

  @media (max-width: 550px) {
    .settings-footer {
      flex-direction: column;
    }
  }
`;