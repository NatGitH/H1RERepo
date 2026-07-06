// Shared file-size guard for every file input in the app.
// Resumes, avatars, logos, and company documents are all capped at 20 MB.
export const MAX_FILE_MB = 20;

// Returns true when the file is within the limit. Otherwise pops a modal and
// returns false so callers can simply `if (!checkFileSize(file)) return;`.
export function checkFileSize(file, maxMB = MAX_FILE_MB) {
  if (!file) return false;
  if (file.size > maxMB * 1024 * 1024) {
    const mb = (file.size / (1024 * 1024)).toFixed(1);
    window.showAlert(
      `"${file.name}" is ${mb} MB, which exceeds the ${maxMB} MB limit. Please choose a smaller file.`
    );
    return false;
  }
  return true;
}
