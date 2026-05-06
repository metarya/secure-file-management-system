import { useState } from "react";

const API_BASE_URL = "http://localhost:8080/api";

export default function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("sfmsUser");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [page, setPage] = useState(() => {
    const savedUser = localStorage.getItem("sfmsUser");
    return savedUser ? "dashboard" : "login";
  });

  function logout() {
    localStorage.removeItem("sfmsUser");
    setUser(null);
    setPage("login");
  }

  return (
    <div>
      {!user && page === "login" && (
        <LoginPage setUser={setUser} setPage={setPage} />
      )}

      {!user && page === "register" && (
        <RegisterPage setPage={setPage} />
      )}

      {user && (
        <Dashboard user={user} logout={logout} />
      )}
    </div>
  );
}

function LoginPage({ setUser, setPage }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function loginUser() {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok && data.userId) {
        localStorage.setItem("sfmsUser", JSON.stringify(data));
        setUser(data);
      } else {
        setMessage(data.message || "Login failed");
      }
    } catch (error) {
      setMessage("Login failed: " + error.message);
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
          onChange={(e) => setEmail(e.target.value)}
        />

        <label>Password</label>
        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="btn primary full-width" onClick={loginUser}>
          Login
        </button>

        <p className="link-text">
          New user?{" "}
          <button className="link-button" onClick={() => setPage("register")}>
            Register
          </button>
        </p>

        {message && <div className="message error">{message}</div>}
      </div>
    </div>
  );
}

function RegisterPage({ setPage }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

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

function Dashboard({ user, logout }) {
  const [singleFile, setSingleFile] = useState(null);
  const [multipleFiles, setMultipleFiles] = useState([]);
  const [files, setFiles] = useState([]);
  const [searchName, setSearchName] = useState("");
  const [singleMessage, setSingleMessage] = useState("");
  const [multiMessage, setMultiMessage] = useState("");

  async function loadMyFiles() {
    try {
      const response = await fetch(`${API_BASE_URL}/files/my-files?ownerId=${user.userId}`);
      const data = await response.json();
      setFiles(data);
    } catch (error) {
      alert("Failed to load files: " + error.message);
    }
  }

  async function searchFiles() {
    if (!searchName.trim()) {
      loadMyFiles();
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/files/search?ownerId=${user.userId}&name=${encodeURIComponent(searchName)}`
      );

      const data = await response.json();
      setFiles(data);
    } catch (error) {
      alert("Search failed: " + error.message);
    }
  }

  async function uploadSingleFile() {
    if (!singleFile) {
      setSingleMessage("Please select one .txt file.");
      return;
    }

    const formData = new FormData();
    formData.append("ownerId", user.userId);
    formData.append("file", singleFile);

    try {
      const response = await fetch(`${API_BASE_URL}/files/upload`, {
        method: "POST",
        body: formData
      });

      const text = await response.text();
      setSingleMessage(text);
      setSingleFile(null);

      if (response.ok) {
        loadMyFiles();
      }
    } catch (error) {
      setSingleMessage("Upload failed: " + error.message);
    }
  }

  async function uploadMultipleFiles() {
    if (!multipleFiles || multipleFiles.length === 0) {
      setMultiMessage("Please select one or more .txt files.");
      return;
    }

    const formData = new FormData();
    formData.append("ownerId", user.userId);

    for (const file of multipleFiles) {
      formData.append("files", file);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/files/upload-multiple`, {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      const resultText = data.map((item) => {
        return `${item.success ? "SUCCESS" : "FAILED"}: ${item.fileName} - ${item.message}`;
      }).join("\n");

      setMultiMessage(resultText);
      setMultipleFiles([]);

      if (response.ok) {
        loadMyFiles();
      }
    } catch (error) {
      setMultiMessage("Multiple upload failed: " + error.message);
    }
  }

  function downloadFile(fileId) {
    window.location.href = `${API_BASE_URL}/files/download/${fileId}?userId=${user.userId}`;
  }

  async function deleteFile(fileId) {
    const confirmed = window.confirm("Are you sure you want to delete this file?");
    if (!confirmed) return;

    try {
      const response = await fetch(`${API_BASE_URL}/files/${fileId}?userId=${user.userId}`, {
        method: "DELETE"
      });

      const text = await response.text();

      if (response.ok) {
        alert(text);
        loadMyFiles();
      } else {
        alert("Delete failed: " + text);
      }
    } catch (error) {
      alert("Delete failed: " + error.message);
    }
  }

  return (
    <div>
      <header className="topbar">
        <div>
          <h2>Secure File Management System</h2>
          <p>
            Logged in as {user.fullName} ({user.email}) | User ID: {user.userId}
          </p>
        </div>
        <button className="btn danger" onClick={logout}>Logout</button>
      </header>

      <main className="dashboard">
        <section className="card">
          <h3>Single File Upload</h3>
          <p className="muted">Only real .txt files are allowed.</p>

          <input
            type="file"
            accept=".txt"
            onChange={(e) => setSingleFile(e.target.files[0])}
          />

          <button className="btn primary" onClick={uploadSingleFile}>
            Upload File
          </button>

          {singleMessage && <div className="message">{singleMessage}</div>}
        </section>

        <section className="card">
          <h3>Multiple File Upload</h3>
          <p className="muted">
            Valid files are saved. Invalid files return error messages.
          </p>

          <input
            type="file"
            accept=".txt"
            multiple
            onChange={(e) => setMultipleFiles(Array.from(e.target.files))}
          />

          <button className="btn primary" onClick={uploadMultipleFiles}>
            Upload Multiple
          </button>

          {multiMessage && <div className="message pre">{multiMessage}</div>}
        </section>

        <section className="card wide-card">
          <div className="section-header">
            <div>
              <h3>My Files</h3>
              <p className="muted">
                Metadata only. fileData and fileHash are not shown.
              </p>
            </div>
            <button className="btn secondary" onClick={loadMyFiles}>
              Refresh
            </button>
          </div>

          <div className="search-row">
            <input
              type="text"
              placeholder="Search by file name"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
            />
            <button className="btn primary" onClick={searchFiles}>Search</button>
            <button
              className="btn secondary"
              onClick={() => {
                setSearchName("");
                loadMyFiles();
              }}
            >
              Clear
            </button>
          </div>

          <FileTable
            files={files}
            downloadFile={downloadFile}
            deleteFile={deleteFile}
          />
        </section>
      </main>
    </div>
  );
}

function FileTable({ files, downloadFile, deleteFile }) {
  if (!files || files.length === 0) {
    return (
      <div className="empty-state">
        No files found. Click Refresh after uploading files.
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>File Name</th>
            <th>Type</th>
            <th>Original Size</th>
            <th>Compressed Size</th>
            <th>Compressed</th>
            <th>Visibility</th>
            <th>Uploaded At</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {files.map((file) => (
            <tr key={file.fileId}>
              <td>{file.fileId}</td>
              <td>{file.fileName}</td>
              <td>{file.fileType}</td>
              <td>{file.originalFileSize ?? file.fileSize ?? "-"}</td>
              <td>{file.compressedFileSize ?? "-"}</td>
              <td>{file.compressed ? "Yes" : "No"}</td>
              <td>{file.visibility}</td>
              <td>{file.uploadedAt || "-"}</td>
              <td>
                <button
                  className="btn secondary action-btn"
                  onClick={() => downloadFile(file.fileId)}
                >
                  Download
                </button>
                <button
                  className="btn danger action-btn"
                  onClick={() => deleteFile(file.fileId)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
