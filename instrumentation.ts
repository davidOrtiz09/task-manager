export async function register() {
  // Scheduler is started lazily on first task creation via triggerImmediateEmail,
  // so the recurring email interval begins from when the user actually has work
  // to track — not from server boot.
}
