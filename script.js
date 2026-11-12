const form = document.getElementById('uploadForm');
const fileInput = document.getElementById('fileInput');
const fileNameDisplay = document.getElementById('fileName');
const submitBtn = document.getElementById('submitBtn');
const statusDiv = document.getElementById('status');

fileInput.addEventListener('change', () => {
    const files = fileInput.files;
    if (files.length > 0) {
        fileNameDisplay.textContent = `${files.length} file(s) selected`;
    } else {
        fileNameDisplay.textContent = 'No file(s) selected';
    }
});

form.addEventListener('submit', e => {
    submitted = true;
    submitBtn.disabled = true;
    statusDiv.style.color = "#f4f4f4";
    statusDiv.textContent = "Uploading file to studio... Please wait.";
});

function handleUploadComplete() {
    statusDiv.style.color = "#4BB543";
    statusDiv.textContent = "File successfully uploaded to the studio!";
    form.reset();
    fileNameDisplay.textContent = 'No file(s) selected';
    submitBtn.disabled = false;
    submitted = false;
}