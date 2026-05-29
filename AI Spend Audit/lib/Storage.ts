export function saveAudit(data: any) {
  localStorage.setItem("audit-data", JSON.stringify(data));
}

export function getAudit() {
  const data = localStorage.getItem("audit-data");

  if (!data) return null;

  return JSON.parse(data);
}
