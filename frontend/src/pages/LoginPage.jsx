import { useEffect, useState } from "react";

export default function LoginPage({ setUser, setPage }) {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!message) return;

    const toastTimer = setTimeout(() => {
      setMessage("");
    }, 3500);

    return () => clearTimeout(toastTimer);

  }, [message]);

  async function loginUser() {

    try {

      const response = await fetch(
        `${API_BASE_URL}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email,
            password
          })
        }
      );

      const data = await response.json();

      if (response.ok && data.userId) {

        localStorage.setItem(
          "sfmsUser",
          JSON.stringify(data)
        );

        localStorage.setItem(
          "sfms_user",
          JSON.stringify(data)
        );

        setUser(data);

      } else {

        setMessage(
          data.message || "Login failed"
        );
      }

    } catch (error) {

      setMessage(
        "Login failed: " + error.message
      );
    }
  }

  return (

    <div className="page center-page">

      <div className="card form-card">

        <h2>Login</h2>

        <label>Email</label>

        <input
          type="email"
          placeholder="Enter email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
        />

        <label>Password</label>

        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
        />

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginTop: "10px",
            marginBottom: "10px",
          }}
        >
          <span
            onClick={() => setPage("reset-password")}
            style={{
              color: "#2563eb",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "14px",
            }}
          >
            Forgot Password?
          </span>
        </div>

        <button
          className="btn primary full-width"
          onClick={loginUser}
        >
          Login
        </button>

        <p className="link-text">
          New user?{" "}

          <button
            className="link-button"
            onClick={() => setPage("register")}
          >
            Register
          </button>
        </p>

        {message && (
          <div className="message error">
            {message}
          </div>
        )}

      </div>

    </div>
  );
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8080/api";