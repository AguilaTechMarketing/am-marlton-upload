const fileInput = document.getElementById('fileInput');
const fileName = document.getElementById('fileName');
const uploadForm = document.getElementById('uploadForm');
const status = document.getElementById('status');

fileInput.addEventListener('change', () => {
    fileName.textContent = `${fileInput.files.length} file(s) selected`;
});

uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (fileInput.files.length === 0) return;

    status.textContent = "Uploading... Please wait.";
    document.getElementById('submitBtn').disabled = true;

    // Replace this string with your published Google Apps Script Web App URL after deployment
    const scriptURL = "https://script.google.com/macros/s/AKfycbzD38JAuSD0-ma4Ys68jUxntowxjwjJpZnFE_yxrfdmgItJxR9aki7XGRTeSMGAhPDVzg/exec";

    for (let file of fileInput.files) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        await new Promise((resolve) => {
            reader.onload = async () => {
                const base64Data = reader.result.split(',')[1];
                const payload = {
                    fileData: base64Data,
                    mimeType: file.type,
                    fileName: file.name
                };

                try {
                    await fetch(scriptURL, {
                        method: 'POST',
                        body: new URLSearchParams(payload)
                    });
                } catch (err) {
                    console.error(err);
                }
                resolve();
            };
        });
    }

    status.textContent = "Upload complete! Thank you for sharing your moments!";
    status.style.color = "#4CAF50";
    uploadForm.reset();
    fileName.textContent = "";
    document.getElementById('submitBtn').disabled = false;
});