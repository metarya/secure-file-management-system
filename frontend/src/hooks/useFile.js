import { useState } from "react";
import { API_BASE_URL } from "../config";

// NOTE: previously imported from "../utils/authHeaders", which does not exist
// and broke the build whenever this hook was referenced. Inlined here so the
// legacy hook is self-contained and safe to use.
function authHeaders(token) {
  const headers = { "ngrok-skip-browser-warning": "true" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export default function useFiles() {
  const [files, setFiles] = useState([]);
  const [sharedFiles, setSharedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");


async function loadMyFiles(user) {
  if (!user?.userId || !user?.token) {
    return;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/files/my-files`,
      {
        headers: authHeaders(user?.token),
      }
    );

    const data = await response.json();

    if (response.ok) {
      setFiles(
        Array.isArray(data)
          ? data
          : []
      );
    } else {
      setMessage(
        data?.message ||
        "Failed to load files."
      );
    }
  } catch (error) {
    setMessage(
      "Failed to load files: " +
      error.message
    );
  }
}

async function loadSharedFiles(user) {
  if (!user?.userId || !user?.token) {
    return;
  }

  // Recipient is derived from the JWT on the backend; no userId is sent.
  try {
    const response = await fetch(
      `${API_BASE_URL}/files/shared-with-me`,
      {
        headers: authHeaders(user?.token),
      }
    );

    if (response.ok) {
      const data = await response.json();

      setSharedFiles(
        Array.isArray(data)
          ? data
          : []
      );

      return;
    }
  } catch {
    // fall through to clearing the list
  }

  setSharedFiles([]);
}

async function refreshAllFiles(
  loadMyFiles,
  loadSharedFiles,
  setMessage
) {
  await loadMyFiles();
  await loadSharedFiles();

  setMessage(
    "Files refreshed successfully."
  );
}


return {
  files,
  setFiles,

  sharedFiles,
  setSharedFiles,

  loading,
  setLoading,

  message,
  setMessage,


  refreshAllFiles,
  loadMyFiles,
  loadSharedFiles,
  };
}


