// Triggers a browser download for an authenticated API response. Direct <a href> links can't
// carry the Authorization header, so exports are fetched as a blob via axios and saved manually.
export function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
