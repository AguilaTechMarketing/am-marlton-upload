const scriptURL = "https://script.google.com/macros/s/AKfycbyqbLzqtNjJ1JCKNCs8m6IEhIRY_TarJKoxoWQeP_QYFG8a7IEK2_gkHQ2iP42Bp9yZ-Q/exec";

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
            await uploadFileDirectly(file);
        } catch (error) {
            statusDiv.style.color = "#ff6b6b";
            statusDiv.textContent = `Error uploading ${file.name}: ${error.message}`;
            submitBtn.disabled = false;
            return;
        }
    }

    statusDiv.style.color = "#4BB543";
    statusDiv.textContent = "All files successfully uploaded to the studio!";
    form.reset();
    fileNameDisplay.textContent = 'No file(s) selected';
    submitBtn.disabled = false;
});

function uploadFileDirectly(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async function() {
            try {
                const base64Data = reader.result.split(',')[1];
                const formData = new URLSearchParams();
                formData.append('data', base64Data);
                formData.append('filename', file.name);
                formData.append('mimetype', file.type || 'application/octet-stream');

                const response = await fetch(scriptURL, {
                    method: 'POST',
                    body: formData
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