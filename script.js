/**
 * Arthur Murray Marlton - Frontend Event Media Upload Handler
 * Converts selected images/videos to Base64 and submits them sequentially
 * via a hidden iframe form POST to bypass cross-origin fetch limits.
 */
const mediaUploadHandler = {
    config: {
        scriptURL: 'https://script.google.com/macros/s/AKfycbzA-r2Ejkx22TZGmPCDRFxS7Q9rqMxtu1PdUpW3pd0K6-MXpGf19qL2oizMSE8TYxKzVA/exec',
        maxFileSize: 45 * 1024 * 1024, // 45MB safe ceiling for Base64 POST payloads in Apps Script
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
        statusId: 'status',
        iframeId: 'hiddenFrame'
    },

    elements: {},

    init: function () {
        this.elements.form = document.getElementById(this.config.formId);
        this.elements.fileInput = document.getElementById(this.config.fileInputId);
        this.elements.fileNameDisplay = document.getElementById(this.config.fileNameId);
        this.elements.submitBtn = document.getElementById(this.config.submitBtnId);
        this.elements.statusDiv = document.getElementById(this.config.statusId);
        this.elements.iframe = document.getElementById(this.config.iframeId);

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
            throw new Error(`"${file.name}" is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Max is 45MB.`);
        }
        if (file.type && !this.config.allowedTypes.includes(file.type.toLowerCase())) {
            throw new Error(`"${file.name}" has an unsupported format (${file.type}).`);
        }
    },

    handleFormSubmit: async function (event) {
        event.preventDefault();
        const files = Array.from(this.elements.fileInput.files || []);

        if (files.length === 0) {
            this.setStatus('Please select at least one photo or video.', '#ff6b6b');
            return;
        }

        try {
            files.forEach((file) => this.validateFile(file));
        } catch (error) {
            this.setStatus(error.message, '#ff6b6b');
            return;
        }

        this.elements.submitBtn.disabled = true;

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                this.setStatus(`Uploading ${file.name} (${i + 1} of ${files.length})...`, '#000000');
                await this.postFileViaIframe(file);
            }

            this.setStatus('File(s) successfully uploaded to the studio!', '#2e7d32');
            this.elements.form.reset();
            this.elements.fileNameDisplay.textContent = 'No file(s) selected';
        } catch (error) {
            this.setStatus(`Upload error: ${error.message}`, '#b71c1c');
        } finally {
            this.elements.submitBtn.disabled = false;
        }
    },

    /**
     * Reads a file as Base64 and submits it via a temporary hidden form targeting hiddenFrame.
     */
    postFileViaIframe: function (file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () => {
                const base64Data = reader.result.split(',')[1];
                const tempForm = document.createElement('form');
                tempForm.method = 'POST';
                tempForm.action = this.config.scriptURL;
                tempForm.target = this.config.iframeId;
                tempForm.style.display = 'none';

                const fields = {
                    fileData: base64Data,
                    fileName: file.name,
                    mimeType: file.type || 'application/octet-stream'
                };

                Object.entries(fields).forEach(([key, value]) => {
                    const input = document.createElement('input');
                    input.type = 'hidden';
                    input.name = key;
                    input.value = value;
                    tempForm.appendChild(input);
                });

                const onIframeLoad = () => {
                    this.elements.iframe.removeEventListener('load', onIframeLoad);
                    tempForm.remove();
                    resolve();
                };

                this.elements.iframe.addEventListener('load', onIframeLoad);
                document.body.appendChild(tempForm);
                tempForm.submit();
            };

            reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
            reader.readAsDataURL(file);
        });
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