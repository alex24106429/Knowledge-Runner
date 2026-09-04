export const SoundFX = {
	ctx: null,

	init() {
		if (!this.ctx) {
			const AudioCtx = window.AudioContext || window.webkitAudioContext;
			this.ctx = new AudioCtx();
		}
		if (this.ctx.state === 'suspended') {
			this.ctx.resume();
		}
	},

	playLaneShift() {
		if (!this.ctx) return;
		const osc = this.ctx.createOscillator();
		const gain = this.ctx.createGain();
		osc.type = 'sine';
		osc.frequency.setValueAtTime(350, this.ctx.currentTime);
		osc.frequency.exponentialRampToValueAtTime(550, this.ctx.currentTime + 0.08);
		gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
		gain.gain.linearRampToValueAtTime(0.0, this.ctx.currentTime + 0.08);
		osc.connect(gain);
		gain.connect(this.ctx.destination);
		osc.start();
		osc.stop(this.ctx.currentTime + 0.08);
	},

	playCorrect(gainedLife) {
		if (!this.ctx) return;
		const now = this.ctx.currentTime;
		const freqs = gainedLife ? [523.25, 659.25, 783.99, 1046.50] : [523.25, 659.25, 783.99];
		freqs.forEach((freq, i) => {
			const osc = this.ctx.createOscillator();
			const gain = this.ctx.createGain();
			osc.type = 'triangle';
			osc.frequency.setValueAtTime(freq, now + i * 0.08);
			gain.gain.setValueAtTime(0.12, now + i * 0.08);
			gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.25);
			osc.connect(gain);
			gain.connect(this.ctx.destination);
			osc.start(now + i * 0.08);
			osc.stop(now + i * 0.08 + 0.25);
		});
	},

	playWrong() {
		if (!this.ctx) return;
		const now = this.ctx.currentTime;
		const osc = this.ctx.createOscillator();
		const gain = this.ctx.createGain();
		osc.type = 'sawtooth';
		osc.frequency.setValueAtTime(140, now);
		osc.frequency.linearRampToValueAtTime(70, now + 0.28);
		gain.gain.setValueAtTime(0.16, now);
		gain.gain.linearRampToValueAtTime(0.001, now + 0.28);
		osc.connect(gain);
		gain.connect(this.ctx.destination);
		osc.start(now);
		osc.stop(now + 0.28);
	},

	playGameOver() {
		if (!this.ctx) return;
		const now = this.ctx.currentTime;
		[220, 196, 160].forEach((freq, i) => {
			const osc = this.ctx.createOscillator();
			const gain = this.ctx.createGain();
			osc.type = 'sawtooth';
			osc.frequency.setValueAtTime(freq, now + i * 0.2);
			gain.gain.setValueAtTime(0.12, now + i * 0.2);
			gain.gain.linearRampToValueAtTime(0.001, now + i * 0.2 + 0.25);
			osc.connect(gain);
			gain.connect(this.ctx.destination);
			osc.start(now + i * 0.2);
			osc.stop(now + i * 0.2 + 0.25);
		});
	}
};
