const scriptURL = "https://script.google.com/macros/s/AKfycbtZAND0-KEpzvavyBzo2xgy9d4w8ZJWdchv89F_anCeEZSJ1Wj722IsOsl/exec";

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

form.addEventListener('submit', async e => {
    e.preventDefault();
    const files = fileInput.files;
    if (files.length === 0) return;

    submitBtn.disabled = true;
    statusDiv.style.color = "#f4f4f4";

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        statusDiv.textContent = `Uploading ${file.name} (${i + 1} of ${files.length})...`;
        
        try {
            await uploadFile(file);
        } catch (error) {
            statusDiv.style.color = "#ff6b6b";
            statusDiv.textContent = `Error uploading ${file.name}: ${error.message}`;
            submitBtn.disabled = false;
            return;
        }
    }

    statusDiv.style.color = "#4BB543";
    statusDiv.textContent = "All files successfully uploaded!";
    form.reset();
    fileNameDisplay.textContent = 'No file(s) selected';
    submitBtn.disabled = false;
});

function uploadFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async function() {
            try {
                const base64Data = reader.result.split(',')[1];
                const payload = {
                    fileData: base64Data,
                    fileName: file.name,
                    mimeType: file.type || "application/octet-stream"
                };

                const response = await fetch(scriptURL, {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });

                const result = await response.json();
                if (result.status === 'success') {
                    resolve(result);
                } else {
                    reject(new Error(result.message || 'Upload failed'));
                }
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}