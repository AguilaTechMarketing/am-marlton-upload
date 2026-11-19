/**
 * Arthur Murray Marlton - Frontend Event Media Upload Handler
 * Connects the upload form UI to the hidden iframe submission flow, updates
 * selected file counts, prevents duplicate submissions, and resets state on completion.
 */
const mediaUploadHandler = {
    // DOM references and upload guardrails for event media submissions
    config: {
        maxFileSize: 250 * 1024 * 1024, // 250MB limit per file to accommodate mobile event videos
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

    // Cached DOM elements populated during init()
    elements: {},

    /**
     * Initialize the upload handler and bind UI event listeners.
     */
    init: function () {
        this.elements.form = document.getElementById(this.config.formId);
        this.elements.fileInput = document.getElementById(this.config.fileInputId);
        this.elements.fileNameDisplay = document.getElementById(this.config.fileNameId);
        this.elements.submitBtn = document.getElementById(this.config.submitBtnId);
        this.elements.statusDiv = document.getElementById(this.config.statusId);

        if (!this.elements.form || !this.elements.fileInput) {
            return;
        }

        // Update selected file count whenever the user picks files
        this.elements.fileInput.addEventListener('change', () => {
            this.handleFileSelection();
        });

        // Validate files and lock UI before native form submission to hiddenFrame
        this.elements.form.addEventListener('submit', (event) => {
            this.handleFormSubmit(event);
        });
    },

    /**
     * Update the file counter label based on chosen files.
     */
    handleFileSelection: function () {
        const files = this.elements.fileInput.files;
        if (files && files.length > 0) {
            this.elements.fileNameDisplay.textContent = `${files.length} file(s) selected`;
        } else {
            this.elements.fileNameDisplay.textContent = 'No file(s) selected';
        }
    },

    /**
     * Validate a single file's size and MIME type before allowing submission.
     * Allows empty file.type fallback when mobile browsers omit MIME strings.
     * @param {File} file
     */
    validateFile: function (file) {
        if (file.size > this.config.maxFileSize) {
            throw new Error(`"${file.name}" exceeds the 250MB size limit.`);
        }

        if (file.type && !this.config.allowedTypes.includes(file.type.toLowerCase())) {
            throw new Error(`"${file.name}" has an unsupported format (${file.type}).`);
        }
    },

    /**
     * Run validation on all selected files; block submission if any file fails.
     * @param {SubmitEvent} event
     */
    handleFormSubmit: function (event) {
        const files = Array.from(this.elements.fileInput.files || []);

        if (files.length === 0) {
            event.preventDefault();
            this.setStatus('Please select at least one photo or video.', '#ff6b6b');
            return;
        }

        try {
            files.forEach((file) => this.validateFile(file));
        } catch (error) {
            event.preventDefault();
            window.submitted = false;
            this.setStatus(error.message, '#ff6b6b');
            return;
        }

        // Allow native POST to target="hiddenFrame" while preventing double-clicks
        window.submitted = true;
        if (this.elements.submitBtn) {
            this.elements.submitBtn.disabled = true;
        }
        this.setStatus('Uploading file(s) to studio... Please wait.', '#f4f4f4');
    },

    /**
     * Reset form controls and show confirmation after hiddenFrame finishes loading.
     */
    onUploadComplete: function () {
        this.setStatus('File(s) successfully uploaded to the studio!', '#4BB543');
        if (this.elements.form) {
            this.elements.form.reset();
        }
        if (this.elements.fileNameDisplay) {
            this.elements.fileNameDisplay.textContent = 'No file(s) selected';
        }
        if (this.elements.submitBtn) {
            this.elements.submitBtn.disabled = false;
        }
        window.submitted = false;
    },

    /**
     * Helper to update status text and color consistently.
     * @param {string} message
     * @param {string} color
     */
    setStatus: function (message, color) {
        if (this.elements.statusDiv) {
            this.elements.statusDiv.style.color = color;
            this.elements.statusDiv.textContent = message;
        }
    }
};

// Bridge function called by the hidden iframe onload attribute in index.html
function handleUploadComplete() {
    mediaUploadHandler.onUploadComplete();
}

// Initialize once the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    mediaUploadHandler.init();
});