import { SoundFX } from './audio.js';
import { LANE_X, GameState, resetGameRuntimeState } from './state.js';
import { fetchLLMQuestionsBatch } from './api.js';
import { scene, playerGroup, createQuestionGateGroup } from './world.js';
import {
	showScreen,
	setPauseScreenVisible,
	updateHUDStats,
	updateHUDQuestion,
	updateLaneCardHighlights,
	showFeedback,
	renderGameOverReview
} from './ui.js';
import { triggerCameraShake, resetCameraState } from './loop.js';

export function setPlayerLane(laneIdx) {
	if (GameState.status !== 'PLAYING') return;
	if (laneIdx >= 0 && laneIdx <= 2 && laneIdx !== GameState.playerLane) {
		GameState.playerLane = laneIdx;
		SoundFX.playLaneShift();
		updateLaneCardHighlights();
	}
}

export function pauseGame() {
	if (GameState.status !== 'PLAYING') return;
	GameState.status = 'PAUSED';
	setPauseScreenVisible(true);
}

export function resumeGame() {
	if (GameState.status !== 'PAUSED') return;
	GameState.status = 'PLAYING';
	setPauseScreenVisible(false);
}

export function togglePause() {
	if (GameState.status === 'PLAYING') {
		pauseGame();
	} else if (GameState.status === 'PAUSED') {
		resumeGame();
	}
}

export function spawnQuestionGate(qData) {
	if (GameState.activeGate) {
		scene.remove(GameState.activeGate.group);
	}

	GameState.activeGate = createQuestionGateGroup(qData);
	updateHUDQuestion(qData);
	checkAndTriggerBackgroundFetch();
}

export function checkAndTriggerBackgroundFetch() {
	const remaining = GameState.questions.length - GameState.currentQIndex;
	if (remaining <= 2 && !GameState.isFetchingBackground) {
		GameState.isFetchingBackground = true;
		document.getElementById("fetch-toast").classList.add("visible");

		const nextBatchNum = GameState.batchCount + 1;
		fetchLLMQuestionsBatch(GameState.topic, nextBatchNum, GameState.questions)
			.then(newQuestions => {
				GameState.questions.push(...newQuestions);
				GameState.batchCount = nextBatchNum;
				console.log(`[Background Fetch] Appended Tier ${nextBatchNum} questions! Total: ${GameState.questions.length}`);
			})
			.catch(err => {
				console.warn("[Background Fetch Error] Retrying next question...", err);
			})
			.finally(() => {
				GameState.isFetchingBackground = false;
				document.getElementById("fetch-toast").classList.remove("visible");
			});
	}
}

export function handleGateCollision(gate) {
	gate.checked = true;
	const q = gate.questionData;
	const isCorrect = (GameState.playerLane === q.correct_index);

	GameState.answeredHistory.push({
		question: q.question,
		chosen: q.options[GameState.playerLane],
		correct: q.options[q.correct_index],
		isCorrect: isCorrect,
		explanation: q.explanation
	});

	if (isCorrect) {
		GameState.streak++;
		if (GameState.streak > GameState.maxStreak) GameState.maxStreak = GameState.streak;
		const points = 100 + (GameState.streak * 20);
		GameState.score += points;
		GameState.speed = Math.min(22, GameState.speed + 0.35);

		let gainedLife = false;
		if (GameState.lives < 3) {
			GameState.lives = Math.min(3, GameState.lives + 1);
			gainedLife = true;
		}

		SoundFX.playCorrect(gainedLife);

		const lifeNotice = gainedLife
			? `<br><span style="font-size:1.4rem; color:var(--cyan); display:inline-flex; align-items:center; justify-content:center; gap:0.35rem;"><span class="material-symbols-outlined" style="font-variation-settings:'FILL' 1; color:var(--red); font-size:1.6rem;">favorite</span> +1 LIFE RESTORED!</span>`
			: "";
		showFeedback(`CORRECT! +${points}${lifeNotice}`, true);

		if (gainedLife) {
			const heartsEl = document.getElementById("hud-lives");
			heartsEl.classList.add("pop");
			setTimeout(() => heartsEl.classList.remove("pop"), 300);
		}
	} else {
		GameState.streak = 0;
		GameState.lives--;
		triggerCameraShake(0.35);
		SoundFX.playWrong();
		showFeedback("WRONG DOOR! -1 LIFE", false);

		if (GameState.lives <= 0) {
			triggerGameOver();
			return;
		}
	}

	updateHUDStats();
	GameState.currentQIndex++;

	const spawnNext = () => {
		if (GameState.status === 'PAUSED') {
			setTimeout(spawnNext, 150);
			return;
		}
		if (GameState.status !== 'PLAYING') return;

		if (GameState.currentQIndex < GameState.questions.length) {
			spawnQuestionGate(GameState.questions[GameState.currentQIndex]);
		} else {
			setTimeout(spawnNext, 500);
		}
	};

	setTimeout(spawnNext, 1400);
}

export function triggerGameOver() {
	GameState.status = 'GAMEOVER';
	SoundFX.playGameOver();
	showScreen('gameover');
	renderGameOverReview();
}

export async function onStartGameClick() {
	SoundFX.init();
	const topic = document.getElementById("topic-input").value.trim() || "Solar System";
	GameState.topic = topic;

	showScreen('loading');
	document.getElementById("loading-msg").textContent = `Synthesizing starting Tier 1 questions on "${topic}"...`;

	try {
		GameState.questions = await fetchLLMQuestionsBatch(topic, 1, []);
	} catch (err) {
		alert("Failed to fetch questions!");
		showScreen('start');
		return;
	}

	startGame();
}

export function startGame() {
	resetGameRuntimeState();
	resetCameraState();
	if (playerGroup) {
		playerGroup.position.x = LANE_X[GameState.playerLane];
	}
	showScreen('playing');

	updateHUDStats();
	updateLaneCardHighlights();
	spawnQuestionGate(GameState.questions[GameState.currentQIndex]);
}

export function restartSameTopic() {
	SoundFX.init();
	startGame();
}

export function openTopicSelect() {
	GameState.status = 'MENU';
	showScreen('start');
}