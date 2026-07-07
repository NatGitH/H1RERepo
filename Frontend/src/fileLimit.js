export const MAX_FILE_MB = 20;

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
