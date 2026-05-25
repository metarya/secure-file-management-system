import authHeaders from "../utils/authHeaders";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8080/api";

export async function loadMyFiles(user) {
  const response = await fetch(
    `${API_BASE_URL}/files/my-files?ownerId=${user.userId}`,
    {
      headers: authHeaders(user?.token),
    }
  );

  return {
    ok: response.ok,
    data: await response.json(),
  };
}

export async function loadSharedWithMe(user) {
  const response = await fetch(
    `${API_BASE_URL}/files/shared-with-me`,
    {
      headers: authHeaders(user?.token),
    }
  );

  return {
    ok: response.ok,
    data: await response.json(),
  };
}

export async function searchFiles(user, searchName) {
  const response = await fetch(
    `${API_BASE_URL}/files/search?ownerId=${user.userId}&name=${encodeURIComponent(searchName)}`,
    {
      headers: authHeaders(user?.token),
    }
  );

  return {
    ok: response.ok,
    data: await response.json(),
  };
}

export async function downloadFile(user, fileId) {
    const response = await fetch(
      `${API_BASE_URL}/files/download/${fileId}`, 
      {
        headers: authHeaders(user?.token)
      });

      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition");

      let fileName = `file-${fileId}.txt`;

      if (disposition) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) {
          fileName = match[1];
        }
      }

      return{
        blob,
        fileName,
      };
}

export async function deleteFile(
  user,
  fileId
) {
  return fetch(
    `${API_BASE_URL}/files/${fileId}?userId=${user.userId}`,
    {
      method: "DELETE",
      headers: authHeaders(user?.token),
    }
  );
}

export async function toggleVisibility(
  user,
  file
) {
  const nextVisibility =
    file.visibility === "PUBLIC"
      ? "PRIVATE"
      : "PUBLIC";

  const response = await fetch(
    `${API_BASE_URL}/files/${file.fileId}/visibility?visibility=${nextVisibility}`,
    {
      method: "PATCH",
      headers: authHeaders(user?.token),
    }
  );

  return {
    response,
    nextVisibility,
    data: await response.json().catch(() => null),
  };
}
