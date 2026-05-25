import { useEffect, useState } from "react";

export default function RegisterPage({ setPage }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  // Day 6 floating-toast auto-clear: message:setMessage
  useEffect(() => {
    if (!message) return;

    const toastTimer = setTimeout(() => {
      setMessage("");
    }, 3500);

    return () => clearTimeout(toastTimer);
  }, [message]);

  async function registerUser() {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ fullName, email, password })
      });

      const text = await response.text();
      setMessage(text);

      if (response.ok && text.toLowerCase().includes("success")) {
        setTimeout(() => setPage("login"), 900);
      }
    } catch (error) {
      setMessage("Registration failed: " + error.message);
    }
  }

  return (
    <div className="page center-page">
      <div className="card form-card">
        <h2>Create Account</h2>

        <label>Full Name</label>
        <input
          type="text"
          placeholder="Enter full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />

        <label>Email</label>
        <input
          type="email"
          placeholder="Enter email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label>Password</label>
        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="btn primary full-width" onClick={registerUser}>
          Register
        </button>

        <p className="link-text">
          Already have an account?{" "}
          <button className="link-button" onClick={() => setPage("login")}>
            Login
          </button>
        </p>

        {message && <div className="message">{message}</div>}
      </div>
    </div>
  );
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8080/api";