import { useState } from "react";

import authHeaders from "../utils/authHeaders";
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8080/api";

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
      `${API_BASE_URL}/files/my-files?ownerId=${user.userId}`,
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

  const possibleUrls = [
    `${API_BASE_URL}/files/shared-with-me`,
    `${API_BASE_URL}/files/shared-with-me?userId=${user.userId}`,
  ];

  for (const url of possibleUrls) {
    try {
      const response = await fetch(
        url,
        {
          headers: authHeaders(
            user?.token
          ),
        }
      );

      if (response.ok) {
        const data =
          await response.json();

        setSharedFiles(
          Array.isArray(data)
            ? data
            : []
        );

        return;
      }
    } catch {
      // Try next endpoint
    }
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


