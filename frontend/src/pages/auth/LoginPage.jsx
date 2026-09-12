
import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function LoginPage() {
  const { login, isAuthenticated } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email address and password.");
      return;
    }

    try {
      setLoading(true);

      await login(email.trim(), password);

      const destination =
        location.state?.from?.pathname || "/dashboard";

      navigate(destination, { replace: true });
    } catch (err) {
      console.error("Login failed:", err);

      const detail = err.response?.data?.detail;

      if (typeof detail === "string") {
        setError(detail);
      } else if (Array.isArray(detail)) {
        setError("Invalid email address or password.");
      } else {
        setError("Unable to sign in. Please check your credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* LEFT BRAND PANEL */}
      <div style={styles.brandPanel}>
        <div style={styles.brandContent}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}>W</span>
          </div>

          <div>
            <span style={styles.brandName}>
              WorkForce <span style={styles.brandAccent}>AI</span>
            </span>

            <span style={styles.brandPro}>PRO</span>
          </div>

          <div style={styles.brandDivider}></div>

          <h1 style={styles.brandHeading}>
            Intelligent Workforce
            <br />
            Management
          </h1>

          <p style={styles.brandDescription}>
            Empower your organization with AI-driven workforce
            intelligence, employee insights, and smarter HR decisions.
          </p>

          <div style={styles.features}>
            <div style={styles.feature}>
              <div style={styles.featureIcon}>✦</div>

              <div>
                <strong style={styles.featureTitle}>
                  AI-Powered Insights
                </strong>

                <span style={styles.featureText}>
                  Predict and understand workforce trends
                </span>
              </div>
            </div>

            <div style={styles.feature}>
              <div style={styles.featureIcon}>◈</div>

              <div>
                <strong style={styles.featureTitle}>
                  Workforce Intelligence
                </strong>

                <span style={styles.featureText}>
                  Manage your people from one platform
                </span>
              </div>
            </div>

            <div style={styles.feature}>
              <div style={styles.featureIcon}>✓</div>

              <div>
                <strong style={styles.featureTitle}>
                  Secure & Reliable
                </strong>

                <span style={styles.featureText}>
                  Enterprise-grade authentication and access
                </span>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.brandFooter}>
          <span>WorkForce AI Pro</span>
          <span>•</span>
          <span>Workforce Intelligence Platform</span>
        </div>
      </div>

      {/* RIGHT LOGIN PANEL */}
      <div style={styles.loginPanel}>
        <div style={styles.loginWrapper}>
          {/* MOBILE BRAND */}
          <div style={styles.mobileLogo}>
            <div style={styles.mobileLogoIcon}>W</div>

            <div>
              <div style={styles.mobileBrandName}>
                WorkForce <span style={styles.brandAccent}>AI</span>
              </div>

              <div style={styles.mobileBrandPro}>PRO</div>
            </div>
          </div>

          {/* LOGIN CARD */}
          <div style={styles.loginCard}>
            <div style={styles.loginHeader}>
              <div style={styles.welcomeBadge}>
                <span style={styles.statusDot}></span>
                Workforce Intelligence
              </div>

              <h2 style={styles.loginTitle}>
                Welcome back
              </h2>

              <p style={styles.loginSubtitle}>
                Sign in to continue to your workforce dashboard.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              {/* EMAIL */}
              <div style={styles.field}>
                <label htmlFor="email" style={styles.label}>
                  Email address
                </label>

                <div style={styles.inputWrapper}>
                  <span style={styles.inputIcon}>
                    @
                  </span>

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    placeholder="name@company.com"
                    autoComplete="email"
                    disabled={loading}
                    style={styles.input}
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div style={styles.field}>
                <div style={styles.passwordLabelRow}>
                  <label htmlFor="password" style={styles.labelNoMargin}>
                    Password
                  </label>

                  <button
                    type="button"
                    style={styles.forgotButton}
                    onClick={() => {}}
                  >
                    Forgot password?
                  </button>
                </div>

                <div style={styles.inputWrapper}>
                  <span style={styles.inputIcon}>
                    •••
                  </span>

                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    disabled={loading}
                    style={{
                      ...styles.input,
                      paddingRight: "60px",
                    }}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((current) => !current)
                    }
                    style={styles.passwordToggle}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* ERROR */}
              {error && (
                <div style={styles.errorBox}>
                  <span style={styles.errorIcon}>!</span>

                  <span>{error}</span>
                </div>
              )}

              {/* LOGIN BUTTON */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  ...styles.loginButton,
                  opacity: loading ? 0.75 : 1,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? (
                  <>
                    <span style={styles.spinner}></span>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <span style={styles.arrow}>→</span>
                  </>
                )}
              </button>
            </form>

            {/* SECURITY */}
            <div style={styles.securityNote}>
              <span style={styles.lockIcon}>▣</span>

              <span>
                Your connection is protected with secure authentication.
              </span>
            </div>
          </div>

          {/* FOOTER */}
          <div style={styles.loginFooter}>
            <span>© 2026 WorkForce AI Pro</span>
            <span>•</span>
            <span>Enterprise Workforce Platform</span>
          </div>
        </div>
      </div>

      {/* SPINNER ANIMATION */}
      <style>
        {`
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }

            to {
              transform: rotate(360deg);
            }
          }

          input:focus {
            border-color: #368eff !important;
            box-shadow: 0 0 0 3px rgba(54, 142, 255, 0.10);
          }

          input::placeholder {
            color: #536276;
          }

          button:hover:not(:disabled) {
            filter: brightness(1.08);
          }
        `}
      </style>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    width: "100%",
    display: "flex",
    background: "#080c12",
    color: "#e8edf5",
    fontFamily:
      "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    overflow: "hidden",
  },

  /* LEFT PANEL */

  brandPanel: {
    width: "52%",
    minHeight: "100vh",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "64px 72px",
    boxSizing: "border-box",
    background:
      "radial-gradient(circle at 20% 20%, rgba(46, 144, 250, 0.15), transparent 32%), radial-gradient(circle at 80% 80%, rgba(124, 92, 255, 0.12), transparent 30%), #0b1119",
    borderRight: "1px solid #1d2733",
  },

  brandContent: {
    maxWidth: "620px",
    margin: "auto 0",
  },

  logo: {
    width: "54px",
    height: "54px",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "linear-gradient(135deg, #2388ff 0%, #5b5df5 100%)",
    boxShadow: "0 12px 30px rgba(35, 136, 255, 0.25)",
    marginBottom: "22px",
  },

  logoIcon: {
    fontSize: "25px",
    fontWeight: "800",
    color: "#ffffff",
  },

  brandName: {
    fontSize: "29px",
    fontWeight: "750",
    letterSpacing: "-0.8px",
    color: "#ffffff",
  },

  brandAccent: {
    color: "#4c9cff",
  },

  brandPro: {
    display: "inline-block",
    marginLeft: "10px",
    fontSize: "11px",
    fontWeight: "800",
    letterSpacing: "2px",
    color: "#8ea0b7",
    verticalAlign: "middle",
  },

  brandDivider: {
    width: "56px",
    height: "3px",
    borderRadius: "5px",
    background: "linear-gradient(90deg, #348fff, #6864ff)",
    marginTop: "42px",
    marginBottom: "30px",
  },

  brandHeading: {
    fontSize: "48px",
    lineHeight: "1.12",
    letterSpacing: "-1.8px",
    fontWeight: "750",
    margin: "0 0 22px",
    color: "#ffffff",
  },

  brandDescription: {
    maxWidth: "540px",
    fontSize: "17px",
    lineHeight: "1.7",
    color: "#8d9bae",
    margin: 0,
  },

  features: {
    marginTop: "42px",
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },

  feature: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
  },

  featureIcon: {
    width: "38px",
    height: "38px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#111b28",
    border: "1px solid #223044",
    color: "#62a8ff",
    fontSize: "15px",
    flexShrink: 0,
  },

  featureTitle: {
    display: "block",
    fontSize: "14px",
    fontWeight: "650",
    color: "#dce5f1",
    marginBottom: "3px",
  },

  featureText: {
    display: "block",
    fontSize: "12px",
    color: "#718198",
  },

  brandFooter: {
    display: "flex",
    gap: "9px",
    color: "#59687b",
    fontSize: "11px",
  },

  /* RIGHT PANEL */

  loginPanel: {
    flex: 1,
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#090e15",
    padding: "40px",
    boxSizing: "border-box",
  },

  loginWrapper: {
    width: "100%",
    maxWidth: "470px",
  },

  mobileLogo: {
    display: "none",
  },

  loginCard: {
    width: "100%",
    boxSizing: "border-box",
    padding: "44px",
    borderRadius: "18px",
    background: "#101720",
    border: "1px solid #202c39",
    boxShadow: "0 25px 70px rgba(0, 0, 0, 0.35)",
  },

  loginHeader: {
    marginBottom: "34px",
  },

  welcomeBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "7px 11px",
    borderRadius: "20px",
    background: "#101e2d",
    border: "1px solid #1d3853",
    color: "#75b4ff",
    fontSize: "10px",
    fontWeight: "700",
    letterSpacing: "0.8px",
    textTransform: "uppercase",
    marginBottom: "20px",
  },

  statusDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#3fa9ff",
    boxShadow: "0 0 8px rgba(63, 169, 255, 0.8)",
  },

  loginTitle: {
    margin: 0,
    fontSize: "34px",
    lineHeight: "1.2",
    letterSpacing: "-1px",
    fontWeight: "750",
    color: "#f5f8fc",
  },

  loginSubtitle: {
    margin: "10px 0 0",
    fontSize: "14px",
    lineHeight: "1.6",
    color: "#7e8da1",
  },

  field: {
    marginBottom: "22px",
  },

  passwordLabelRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "9px",
  },

  label: {
    display: "block",
    marginBottom: "9px",
    color: "#c7d1de",
    fontSize: "12px",
    fontWeight: "650",
  },

  labelNoMargin: {
    display: "block",
    margin: 0,
    color: "#c7d1de",
    fontSize: "12px",
    fontWeight: "650",
  },

  forgotButton: {
    border: "none",
    background: "transparent",
    padding: 0,
    color: "#4d9cff",
    fontSize: "11px",
    cursor: "pointer",
  },

  inputWrapper: {
    position: "relative",
    width: "100%",
  },

  inputIcon: {
    position: "absolute",
    left: "16px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#63758b",
    fontSize: "12px",
    fontWeight: "700",
    pointerEvents: "none",
  },

  input: {
    width: "100%",
    height: "50px",
    boxSizing: "border-box",
    borderRadius: "10px",
    border: "1px solid #273443",
    background: "#0c131c",
    color: "#eef4fb",
    outline: "none",
    padding: "0 16px 0 45px",
    fontSize: "13px",
    transition: "all 0.2s ease",
  },

  passwordToggle: {
    position: "absolute",
    right: "13px",
    top: "50%",
    transform: "translateY(-50%)",
    border: "none",
    background: "transparent",
    color: "#6282a4",
    fontSize: "11px",
    fontWeight: "600",
    cursor: "pointer",
    padding: "5px",
  },

  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "12px 14px",
    marginBottom: "20px",
    borderRadius: "9px",
    background: "#251519",
    border: "1px solid #4b252c",
    color: "#f28b96",
    fontSize: "12px",
    lineHeight: "1.4",
  },

  errorIcon: {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#5b2830",
    color: "#ffabb4",
    fontWeight: "800",
    flexShrink: 0,
  },

  loginButton: {
    width: "100%",
    height: "51px",
    border: "none",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    background:
      "linear-gradient(135deg, #287ff0 0%, #5358e9 100%)",
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: "700",
    boxShadow: "0 10px 25px rgba(53, 105, 230, 0.22)",
    transition: "all 0.2s ease",
  },

  arrow: {
    fontSize: "18px",
    lineHeight: 1,
  },

  spinner: {
    width: "15px",
    height: "15px",
    borderRadius: "50%",
    border: "2px solid rgba(255,255,255,0.35)",
    borderTopColor: "#ffffff",
    animation: "spin 0.8s linear infinite",
  },

  securityNote: {
    marginTop: "25px",
    paddingTop: "20px",
    borderTop: "1px solid #1d2732",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    color: "#59697d",
    fontSize: "10px",
    textAlign: "center",
  },

  lockIcon: {
    color: "#66809d",
    fontSize: "11px",
  },

  loginFooter: {
    marginTop: "24px",
    display: "flex",
    justifyContent: "center",
    gap: "8px",
    color: "#526175",
    fontSize: "10px",
  },

  /* MOBILE */

  mobileLogoIcon: {
    width: "42px",
    height: "42px",
    borderRadius: "11px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "linear-gradient(135deg, #2388ff, #5b5df5)",
    color: "#fff",
    fontWeight: "800",
    fontSize: "19px",
  },

  mobileBrandName: {
    fontSize: "21px",
    fontWeight: "750",
    color: "#fff",
  },

  mobileBrandPro: {
    fontSize: "8px",
    letterSpacing: "2px",
    color: "#8190a5",
    fontWeight: "800",
  },
};

export default LoginPage;
