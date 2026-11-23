const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyuKt7jN81g0NO1tlgJbCM5rK7VKuEcijvCmlJIdkohxxP8bEa47XqQzpo3wmERt2gH7Q/exec';

const fileInput = document.getElementById('fileInput');
const fileNameDisplay = document.getElementById('fileNameDisplay');
const uploadBtn = document.getElementById('uploadBtn');
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');
const statusText = document.getElementById('statusText');

fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
        fileNameDisplay.textContent = fileInput.files[0].name;
        uploadBtn.disabled = false;
    } else {
        fileNameDisplay.textContent = "No file selected";
        uploadBtn.disabled = true;
    }
});

uploadBtn.addEventListener('click', async () => {
    const file = fileInput.files[0];
    if (!file) return;

    uploadBtn.disabled = true;
    fileInput.disabled = true;
    progressContainer.classList.remove('hidden');
    progressBar.style.width = '0%';
    statusText.textContent = "Requesting secure upload link...";

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8'
            },
            body: JSON.stringify({ fileName: file.name })
        });

        const data = await response.json();

        if (data.status !== 'success' || !data.uploadUrl) {
            throw new Error(data.message || "Failed to generate secure link.");
        }

        uploadDirectlyToDrive(data.uploadUrl, file);

    } catch (error) {
        console.error(error);
        statusText.textContent = "Error: Could not start upload.";
        resetUI();
    }
});

function uploadDirectlyToDrive(uploadUrl, file) {
    const xhr = new XMLHttpRequest();
    let uploadReached100 = false;

    xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            progressBar.style.width = percentComplete + '%';
            statusText.textContent = `Uploading... ${percentComplete}%`;
            
            if (percentComplete === 100) {
                uploadReached100 = true;
            }
        }
    });

    const triggerSuccessUI = () => {
        statusText.textContent = "Upload complete! Thank you.";
        statusText.style.color = "#C0C0C0"; 
        fileInput.value = ""; 
        fileNameDisplay.textContent = "No file selected";
        
        setTimeout(() => {
            uploadBtn.disabled = true;
            fileInput.disabled = false;
            statusText.style.color = "#cccccc";
            progressContainer.classList.add('hidden');
            progressBar.style.width = '0%';
        }, 3000);
    };

    xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
            triggerSuccessUI();
        } else if (uploadReached100) {
            triggerSuccessUI();
        } else {
            statusText.textContent = "Upload failed at the server.";
            resetUI();
        }
    });

    xhr.addEventListener("error", () => {
        if (uploadReached100) {
            triggerSuccessUI();
        } else {
            statusText.textContent = "Network error. Connection lost.";
            resetUI();
        }
    });

    xhr.open("PUT", uploadUrl, true);
    xhr.send(file);
}

function resetUI() {
    uploadBtn.disabled = false;
    fileInput.disabled = false;
    setTimeout(() => {
        statusText.style.color = "#cccccc";
    }, 3000);
}