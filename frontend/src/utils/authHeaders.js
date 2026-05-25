export default function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    "ngrok-skip-browser-warning": "true",
  };
}