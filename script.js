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
            await uploadFileInChunks(file);
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

async function uploadFileInChunks(file) {
    const chunkSize = 3 * 1024 * 1024; // 3MB chunks to stay safely under limits
    const totalChunks = Math.ceil(file.size / chunkSize);
    let fileId = null;

    for (let index = 0; index < totalChunks; index++) {
        const start = index * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);

        const base64Data = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = error => reject(error);
            reader.readAsDataURL(chunk);
        });

        const payload = {
            fileName: file.name,
            mimeType: file.type || "application/octet-stream",
            data: base64Data,
            chunkIndex: index,
            totalChunks: totalChunks,
            fileId: fileId
        };

        const response = await fetch(scriptURL, {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (result.status !== 'success') {
            throw new Error(result.message || 'Upload failed');
        }
        
        fileId = result.fileId;
        const percent = Math.round(((index + 1) / totalChunks) * 100);
        statusDiv.textContent = `Uploading ${file.name}: ${percent}%`;
    }
}