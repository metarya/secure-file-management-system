export default function ShareErrorMessage(message, status) {
  const text = String(message || "").toLowerCase();

  if (
    status === 404 ||
    text.includes("target user") ||
    text.includes("user not found") ||
    text.includes("email not found") ||
    text.includes("not registered") ||
    text.includes("target email")
  ) {
    return "Wrong mail ID. User is not registered.";
  }

  return message || "Share failed.";
}