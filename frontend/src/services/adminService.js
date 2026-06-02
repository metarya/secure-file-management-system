const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8080/api";

const getAuthHeader = () => {
  const storedUser =
    localStorage.getItem("sfmsUser");

  if (!storedUser) {
    return {};
  }

  const user =
    JSON.parse(storedUser);

  return {
    Authorization: `Bearer ${user.token}`,
  };
};

export const getAdminStats = async () => {
  const response =
    await fetch(
      `${API_BASE_URL}/admin/stats`,
      {
        headers: getAuthHeader(),
      }
    );

  if (!response.ok) {
    throw new Error(
      "Failed to fetch admin stats"
    );
  }

  return response.json();
};

export const getAllUsers = async () => {
  const response =
    await fetch(
      `${API_BASE_URL}/admin/users`,
      {
        headers: getAuthHeader(),
      }
    );

  if (!response.ok) {
    throw new Error(
      "Failed to fetch users"
    );
  }

  return response.json();
};

export const updateUserRole = async (
  userId,
  role
) => {
  const response =
    await fetch(
      `${API_BASE_URL}/admin/users/${userId}/role`,
      {
        method: "PATCH",
        headers: {
          "Content-Type":
            "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          role,
        }),
      }
    );

  if (!response.ok) {
    throw new Error(
      "Failed to update role"
    );
  }

  return response.text();
};

export const updateUserStatus = async (
  userId,
  status
) => {
  const response =
    await fetch(
      `${API_BASE_URL}/admin/users/${userId}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type":
            "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          status,
        }),
      }
    );

  if (!response.ok) {
    throw new Error(
      "Failed to update status"
    );
  }

  return response.text();
};