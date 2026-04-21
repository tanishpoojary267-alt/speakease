// ========================================
// Speakease — Video Feed Component
// ========================================

export class VideoFeed {
    constructor() {
        this.video = null;
        this.canvas = null;
        this.stream = null;
    }

    render() {
        const container = document.createElement('div');
        container.className = 'video-feed-container';
        container.innerHTML = `
      <div class="video-feed-wrapper">
        <video id="webcam-video" autoplay playsinline muted></video>
        <canvas id="face-overlay"></canvas>
        <div class="video-status" id="video-status">
          <i data-lucide="camera-off" class="video-status-icon"></i>
          <span>Camera initializing...</span>
        </div>
      </div>
    `;
        return container;
    }

    async startCamera() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                // NOTE: audio is intentionally excluded here.
                // Grabbing audio here causes a mic-lock conflict with SpeechRecognition
                // on Chrome — the browser can't give the mic to both APIs simultaneously.
                // SpeechAnalyzer requests its own audio stream internally with a delay.
                video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
            });

            this.video = document.getElementById('webcam-video');
            this.canvas = document.getElementById('face-overlay');

            if (this.video) {
                this.video.srcObject = this.stream;
                await this.video.play();
                const status = document.getElementById('video-status');
                if (status) status.style.display = 'none';
            }

            return { video: this.video, canvas: this.canvas, stream: this.stream };
        } catch (err) {
            console.error('Camera access error:', err);
            const status = document.getElementById('video-status');
            if (status) {
                status.innerHTML = `<i data-lucide="camera-off" class="video-status-icon"></i><span>Camera access denied</span>`;
                status.classList.add('error');
            }
            throw err;
        }
    }

    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(t => t.stop());
            this.stream = null;
        }
    }

    getElements() {
        return { video: this.video, canvas: this.canvas };
    }
}
