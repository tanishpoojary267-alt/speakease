// ========================================
// Speakease — Audio Waveform Visualizer
// ========================================

export class WaveformVisualizer {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.analyser = null;
        this.animationId = null;
        this.isRunning = false;
        this.dataArray = null;
        this.barCount = 40;
    }

    mount(containerId, analyser) {
        const container = document.getElementById(containerId);
        if (!container) return;

        this.analyser = analyser;
        this.canvas = document.createElement('canvas');
        this.canvas.style.cssText = 'width:100%;height:48px;display:block;border-radius:8px;';
        this.canvas.width = 400;
        this.canvas.height = 48;
        this.ctx = this.canvas.getContext('2d');
        container.appendChild(this.canvas);

        if (analyser) {
            this.dataArray = new Uint8Array(analyser.frequencyBinCount);
            this.isRunning = true;
            this._draw();
        } else {
            this._drawIdle();
        }
    }

    _draw() {
        if (!this.isRunning || !this.ctx) return;
        this.animationId = requestAnimationFrame(() => this._draw());

        if (this.analyser) {
            this.analyser.getByteFrequencyData(this.dataArray);
        }

        const { width, height } = this.canvas;
        this.ctx.clearRect(0, 0, width, height);

        const barWidth = (width / this.barCount) * 0.65;
        const gap = (width / this.barCount) * 0.35;
        const sliceSize = Math.floor(this.dataArray.length / this.barCount);

        for (let i = 0; i < this.barCount; i++) {
            // Average a slice of the frequency data
            let sum = 0;
            for (let j = 0; j < sliceSize; j++) {
                sum += this.dataArray[i * sliceSize + j];
            }
            const avgVal = sum / sliceSize;
            const normalised = avgVal / 255;
            const barH = Math.max(3, normalised * height * 0.9);

            const x = i * (barWidth + gap);
            const y = (height - barH) / 2;

            // Gradient colour based on intensity
            const hue = 240 - normalised * 80; // blue → purple at high volume
            const alpha = 0.5 + normalised * 0.5;
            this.ctx.fillStyle = `hsla(${hue}, 80%, 65%, ${alpha})`;
            this.ctx.beginPath();
            this.ctx.roundRect(x, y, barWidth, barH, barWidth / 2);
            this.ctx.fill();
        }
    }

    _drawIdle() {
        if (!this.ctx) return;
        const { width, height } = this.canvas;
        this.ctx.clearRect(0, 0, width, height);
        const barWidth = (width / this.barCount) * 0.65;
        const gap = (width / this.barCount) * 0.35;
        for (let i = 0; i < this.barCount; i++) {
            this.ctx.fillStyle = 'rgba(99,102,241,0.15)';
            this.ctx.beginPath();
            this.ctx.roundRect(i * (barWidth + gap), (height - 3) / 2, barWidth, 3, 1.5);
            this.ctx.fill();
        }
    }

    stop() {
        this.isRunning = false;
        if (this.animationId) cancelAnimationFrame(this.animationId);
    }

    unmount() {
        this.stop();
        this.canvas?.remove();
    }
}
