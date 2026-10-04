// Phone photos of certificates are often 3–6 MB, over the 4 MB upload limit. Shrink large
// JPG/PNG images in the browser (max 2000px on the longest side) before uploading. PDFs and
// small images are left untouched.
export async function compressImage(file, { maxSide = 2000, quality = 0.85, skipBelowBytes = 1.5 * 1024 * 1024 } = {}) {
  if (!/^image\/(jpeg|png)$/.test(file.type) || file.size <= skipBelowBytes) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext('2d');
    // JPEG has no transparency; paint white first so transparent PNG areas don't turn black.
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch {
    return file;
  }
}

// Opens an authenticated file (fetched as a blob) in a new tab. The tab is opened straight
// away, inside the click, so pop-up blockers allow it; it's pointed at the file once loaded.
export async function openBlobInNewTab(fetchBlob) {
  const tab = window.open('', '_blank');
  try {
    const blob = await fetchBlob();
    const url = URL.createObjectURL(blob);
    if (tab) tab.location.href = url;
    else window.location.href = url;
    setTimeout(() => URL.revokeObjectURL(url), 5 * 60 * 1000);
  } catch (err) {
    tab?.close();
    throw err;
  }
}
