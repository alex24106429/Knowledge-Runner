import { GameState } from './state.js';
import {
	setPlayerLane,
	togglePause,
	resumeGame,
	onStartGameClick,
	restartSameTopic,
	openTopicSelect
} from './game.js';

export function initInput() {
	document.getElementById("btn-start").addEventListener("click", onStartGameClick);
	document.getElementById("btn-restart").addEventListener("click", restartSameTopic);
	document.getElementById("btn-new-topic").addEventListener("click", openTopicSelect);
	document.getElementById("btn-resume").addEventListener("click", resumeGame);
	document.getElementById("btn-pause-floating").addEventListener("click", togglePause);

	document.querySelectorAll(".lane-card").forEach(card => {
		card.addEventListener("click", () => {
			setPlayerLane(parseInt(card.dataset.lane, 10));
		});
	});

	window.addEventListener('keydown', (e) => {
		if (e.key === 'Escape') {
			togglePause();
			return;
		}

		if (GameState.status !== 'PLAYING') return;

		if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
			setPlayerLane(Math.max(0, GameState.playerLane - 1));
		} else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
			setPlayerLane(Math.min(2, GameState.playerLane + 1));
		} else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
			setPlayerLane(1);
		} else if (e.key === '1') {
			setPlayerLane(0);
		} else if (e.key === '2') {
			setPlayerLane(1);
		} else if (e.key === '3') {
			setPlayerLane(2);
		}
	});

	let touchStartX = 0;
	window.addEventListener('touchstart', (e) => {
		touchStartX = e.touches[0].clientX;
	}, { passive: true });

	window.addEventListener('touchend', (e) => {
		if (GameState.status !== 'PLAYING') return;
		const deltaX = e.changedTouches[0].clientX - touchStartX;
		if (Math.abs(deltaX) > 35) {
			if (deltaX < 0) setPlayerLane(Math.max(0, GameState.playerLane - 1));
			else setPlayerLane(Math.min(2, GameState.playerLane + 1));
		}
	}, { passive: true });
}