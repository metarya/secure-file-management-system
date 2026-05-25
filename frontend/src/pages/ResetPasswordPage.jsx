import { useState } from "react";
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8080/api";

export default function ResetPasswordPage({ setPage }) {

  const [step, setStep] = useState(1);

  const [email, setEmail] = useState("");

  const [token, setToken] = useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [verified, setVerified] =
    useState(false);

  async function sendResetLink() {

    try {

      const response = await fetch(
        `${API_BASE_URL}/auth/forgot-password`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email,
          }),
        }
      );

      const data = await response.text();

      setMessage(data);
      
      setStep(2);

    } catch {

      setMessage(
        "Failed to send reset link"
      );
    }
  }

  async function resetPassword() {

    try {

      const response = await fetch(
        `${API_BASE_URL}/auth/reset-password`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            token,
            newPassword,
          }),
        }
      );

      const data = await response.text();

      setMessage(data);

    } catch {

      setMessage(
        "Password reset failed"
      );
    }
  }

  return (

    <div className="page center-page">

      <div className="card form-card">

        <h2>Reset Password</h2>

        {step === 1 && (

          <>

            <input
              type="email"
              placeholder="Enter registered email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
            />

            <button
              className="btn primary full-width"
              onClick={sendResetLink}
            >
              Send Code
            </button>

          </>

        )}

        {step === 2 && !verified && (

          <>

            <input
              type="text"
              placeholder="Enter token/code"
              value={token}
              onChange={(e) =>
                setToken(e.target.value)
              }
            />

            <button
              className="btn primary full-width"
              onClick={() => {

                if (!token) {

                  setMessage("Enter token");

                  return;
                }

                setVerified(true);
              }}
            >
              Verify
            </button>

          </>

        )}

        {verified && (

          <>

            <input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) =>
                setNewPassword(e.target.value)
              }
            />

            <button
              className="btn primary full-width"
              onClick={resetPassword}
            >
              Reset Password
            </button>

          </>

        )}

        <p className="link-text">

          Back to Login?{" "}

          <button
            className="link-button"
            onClick={() => setPage("login")}
          >
            Login
          </button>

        </p>

        {message && (
          <div className="message">
            {message}
          </div>
        )}

      </div>

    </div>
  );
}