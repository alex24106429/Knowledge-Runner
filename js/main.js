import { SoundFX } from './audio.js';
import { LANE_X, GATE_SPAWN_Z, PLAYER_Z, GameState, resetGameRuntimeState } from './state.js';
import { fetchLLMQuestionsBatch } from './api.js';
import {
	init3D,
	scene,
	camera,
	renderer,
	playerGroup,
	characterMeshes,
	gridLines,
	sceneryObjects,
	particles,
	createQuestionGateGroup
} from './world.js';
import {
	showScreen,
	setPauseScreenVisible,
	updateHUDStats,
	updateHUDQuestion,
	updateLaneCardHighlights,
	showFeedback,
	renderGameOverReview
} from './ui.js';

let clock;
let cameraShake = 0;
let currentCamX = 0;

function setPlayerLane(laneIdx) {
	if (GameState.status !== 'PLAYING') return;
	if (laneIdx >= 0 && laneIdx <= 2 && laneIdx !== GameState.playerLane) {
		GameState.playerLane = laneIdx;
		SoundFX.playLaneShift();
		updateLaneCardHighlights();
	}
}

function pauseGame() {
	if (GameState.status !== 'PLAYING') return;
	GameState.status = 'PAUSED';
	setPauseScreenVisible(true);
}

function resumeGame() {
	if (GameState.status !== 'PAUSED') return;
	GameState.status = 'PLAYING';
	setPauseScreenVisible(false);
}

function togglePause() {
	if (GameState.status === 'PLAYING') {
		pauseGame();
	} else if (GameState.status === 'PAUSED') {
		resumeGame();
	}
}

function spawnQuestionGate(qData) {
	if (GameState.activeGate) {
		scene.remove(GameState.activeGate.group);
	}

	GameState.activeGate = createQuestionGateGroup(qData);
	updateHUDQuestion(qData);
	checkAndTriggerBackgroundFetch();
}

function checkAndTriggerBackgroundFetch() {
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

function handleGateCollision(gate) {
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
		cameraShake = 0.35;
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

function triggerGameOver() {
	GameState.status = 'GAMEOVER';
	SoundFX.playGameOver();
	showScreen('gameover');
	renderGameOverReview();
}

async function onStartGameClick() {
	SoundFX.init();
	const topic = document.getElementById("topic-input").value.trim() || "Solar System";
	GameState.topic = topic;

	showScreen('loading');
	document.getElementById("loading-msg").textContent = `Synthesizing starting Tier 1 questions on "${topic}"...`;

	try {
		GameState.questions = await fetchLLMQuestionsBatch(topic, 1, []);
	} catch (err) {
		alert("Failed to fetch questions!");
	}

	startGame();
}

function startGame() {
	resetGameRuntimeState();
	currentCamX = 0;
	if (playerGroup) {
		playerGroup.position.x = LANE_X[GameState.playerLane];
	}
	showScreen('playing');

	updateHUDStats();
	updateLaneCardHighlights();
	spawnQuestionGate(GameState.questions[GameState.currentQIndex]);
}

function restartSameTopic() {
	SoundFX.init();
	startGame();
}

function openTopicSelect() {
	GameState.status = 'MENU';
	showScreen('start');
}

// =================================================================
// GAME LOOP
// =================================================================
function animate() {
	requestAnimationFrame(animate);
	const dt = clock.getDelta();
	const elapsedTime = clock.getElapsedTime();

	if (GameState.status === 'PLAYING') {
		const currentSpeed = GameState.speed;

		const targetX = LANE_X[GameState.playerLane];
		playerGroup.position.x += (targetX - playerGroup.position.x) * 12 * dt;
		playerGroup.rotation.z = -(targetX - playerGroup.position.x) * 0.08;

		const runCycle = elapsedTime * (currentSpeed * 0.45);
		characterMeshes.leftLeg.rotation.x = Math.sin(runCycle) * 0.75;
		characterMeshes.rightLeg.rotation.x = -Math.sin(runCycle) * 0.75;
		characterMeshes.leftArm.rotation.x = -Math.sin(runCycle) * 0.65;
		characterMeshes.rightArm.rotation.x = Math.sin(runCycle) * 0.65;
		playerGroup.position.y = Math.abs(Math.sin(runCycle)) * 0.16;

		// Responsive camera framing: follow player lane so character is never clipped
		const aspect = camera.aspect || (window.innerWidth / window.innerHeight);
		const followFactor = aspect < 0.6 ? 0.72 : (aspect < 1.0 ? 0.48 : 0.25);
		const targetCamX = playerGroup.position.x * followFactor;
		currentCamX += (targetCamX - currentCamX) * 10 * dt;

		const camBaseY = camera.baseY || 4.4;
		const camBaseZ = camera.baseZ || 7.8;

		if (cameraShake > 0) {
			camera.position.x = currentCamX + (Math.random() - 0.5) * cameraShake;
			camera.position.y = camBaseY + (Math.random() - 0.5) * cameraShake;
			cameraShake = Math.max(0, cameraShake - dt * 1.5);
		} else {
			camera.position.x = currentCamX;
			camera.position.y = camBaseY;
		}
		camera.position.z = camBaseZ;
		camera.lookAt(currentCamX * 0.55, 1.8, -12);

		gridLines.forEach(line => {
			line.position.z += currentSpeed * dt;
			if (line.position.z > 10) line.position.z -= 380;
		});

		sceneryObjects.forEach(obj => {
			obj.position.z += (currentSpeed * 0.6) * dt;
			if (obj.position.z > 20) obj.position.z -= 380;
		});

		if (particles) {
			const pos = particles.geometry.attributes.position.array;
			for (let i = 2; i < pos.length; i += 3) {
				pos[i] += (currentSpeed * 1.2) * dt;
				if (pos[i] > 10) pos[i] = -250;
			}
			particles.geometry.attributes.position.needsUpdate = true;
		}

		if (GameState.activeGate) {
			GameState.activeGate.group.position.z += currentSpeed * dt;

			const progress = Math.max(0, Math.min(100, (1 - (GameState.activeGate.group.position.z / GATE_SPAWN_Z)) * 100));
			document.getElementById("approach-bar").style.width = `${progress}%`;

			if (!GameState.activeGate.checked && GameState.activeGate.group.position.z >= PLAYER_Z - 0.5) {
				handleGateCollision(GameState.activeGate);
			}

			if (GameState.activeGate.group.position.z > 25) {
				scene.remove(GameState.activeGate.group);
				GameState.activeGate = null;
			}
		} else {
			document.getElementById("approach-bar").style.width = `0%`;
		}
	} else if (GameState.status === 'PAUSED') {
		// Frozen in place while paused
	} else {
		const camBaseY = camera ? (camera.baseY || 4.4) : 4.4;
		const camBaseZ = camera ? (camera.baseZ || 7.8) : 7.8;
		camera.position.x = Math.sin(elapsedTime * 0.4) * 1.2;
		camera.position.y = camBaseY;
		camera.position.z = camBaseZ;
		camera.lookAt(0, 2.0, -10);
	}

	renderer.render(scene, camera);
}

// =================================================================
// EVENT LISTENERS & INITIALIZATION
// =================================================================
function bindEvents() {
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

window.addEventListener('DOMContentLoaded', () => {
	clock = new THREE.Clock();
	init3D();
	bindEvents();
	animate();
});
