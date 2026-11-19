/**
 * Arthur Murray Marlton - Frontend Event Media Upload Handler
 * Reads selected photos/videos as Base64 and posts them to Google Apps Script,
 * verifying the returned JSON status before reporting success.
 */
const mediaUploadHandler = {
    config: {
        scriptURL: 'https://script.google.com/macros/s/AKfycbzA-r2Ejkx22TZGmPCDRFxS7Q9rqMxtu1PdUpW3pd0K6-MXpGf19qL2oizMSE8TYxKzVA/exec',
        maxFileSize: 25 * 1024 * 1024, // 25MB per file for reliable Base64 POST requests
        allowedTypes: [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/heic',
            'image/heif',
            'video/mp4',
            'video/quicktime',
            'video/webm'
        ],
        formId: 'uploadForm',
        fileInputId: 'fileInput',
        fileNameId: 'fileName',
        submitBtnId: 'submitBtn',
        statusId: 'status'
    },

    elements: {},

    init: function () {
        this.elements.form = document.getElementById(this.config.formId);
        this.elements.fileInput = document.getElementById(this.config.fileInputId);
        this.elements.fileNameDisplay = document.getElementById(this.config.fileNameId);
        this.elements.submitBtn = document.getElementById(this.config.submitBtnId);
        this.elements.statusDiv = document.getElementById(this.config.statusId);

        if (!this.elements.form || !this.elements.fileInput) return;

        this.elements.fileInput.addEventListener('change', () => {
            this.handleFileSelection();
        });

        this.elements.form.addEventListener('submit', (event) => {
            this.handleFormSubmit(event);
        });
    },

    handleFileSelection: function () {
        const files = this.elements.fileInput.files;
        this.elements.fileNameDisplay.textContent =
            files && files.length > 0 ? `${files.length} file(s) selected` : 'No file(s) selected';
    },

    validateFile: function (file) {
        if (file.size > this.config.maxFileSize) {
            throw new Error(`"${file.name}" exceeds the 25MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`);
        }
        if (file.type && !this.config.allowedTypes.includes(file.type.toLowerCase())) {
            throw new Error(`"${file.name}" has an unsupported format (${file.type}).`);
        }
    },

    readFileAsBase64: function (file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const parts = String(reader.result || '').split(',');
                if (parts.length < 2 || !parts[1]) {
                    reject(new Error(`Failed to encode "${file.name}".`));
                    return;
                }
                resolve(parts[1]);
            };
            reader.onerror = () => reject(new Error(`Failed to read "${file.name}".`));
            reader.readAsDataURL(file);
        });
    },

    uploadSingleFile: async function (file) {
        const base64Data = await this.readFileAsBase64(file);
        const payload = JSON.stringify({
            fileData: base64Data,
            fileName: file.name,
            mimeType: file.type || 'application/octet-stream'
        });

        await fetch(this.config.scriptURL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8'
            },
            body: payload
        });
    },

    handleFormSubmit: async function (event) {
        event.preventDefault();
        const files = Array.from(this.elements.fileInput.files || []);

        if (files.length === 0) {
            this.setStatus('Please select at least one photo or video.', '#b71c1c');
            return;
        }

        try {
            files.forEach((file) => this.validateFile(file));
        } catch (error) {
            this.setStatus(error.message, '#b71c1c');
            return;
        }

        if (this.elements.submitBtn) {
            this.elements.submitBtn.disabled = true;
        }

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                this.setStatus(`Uploading ${file.name} (${i + 1} of ${files.length})...`, '#000000');
                await this.uploadSingleFile(file);
            }

            this.setStatus('File(s) successfully uploaded to the studio!', '#2e7d32');
            this.elements.form.reset();
            this.elements.fileNameDisplay.textContent = 'No file(s) selected';
        } catch (error) {
            this.setStatus(`Upload failed: ${error.message}`, '#b71c1c');
        } finally {
            if (this.elements.submitBtn) {
                this.elements.submitBtn.disabled = false;
            }
        }
    },

    setStatus: function (message, color) {
        if (this.elements.statusDiv) {
            this.elements.statusDiv.style.color = color;
            this.elements.statusDiv.textContent = message;
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    mediaUploadHandler.init();
});