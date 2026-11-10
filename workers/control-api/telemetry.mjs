const ROUTE_CLASSES = new Set(["services", "agents", "providers", "mcp", "health", "runtime", "other"]);

export function writeRequestMetric(binding, { method, routeClass, status, requestId, path, durationMs }) {
  if (!binding || typeof binding.writeDataPoint !== "function") return false;
  const safeMethod = ["GET", "HEAD", "OPTIONS", "POST", "PUT", "PATCH", "DELETE"].includes(method) ? method : "OTHER";
  const safeRoute = ROUTE_CLASSES.has(routeClass) ? routeClass : "other";
  const statusClass = Number.isInteger(status) && status >= 100 && status <= 599 ? `${Math.floor(status / 100)}xx` : "unknown";
  const safeDuration = Number.isFinite(durationMs) ? Math.max(0, Math.min(durationMs, 120000)) : 0;
  binding.writeDataPoint({ indexes: [safeMethod, safeRoute, statusClass], blobs: [String(requestId).slice(0, 80), String(path).slice(0, 160)], doubles: [safeDuration] });
  return true;
}
