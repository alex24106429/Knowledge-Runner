import { GameState } from './state.js';

export function escapeHTML(str) {
	return str.replace(/[&<>'"]/g, tag => ({
		'&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
	}[tag] || tag));
}

export function showScreen(screen) {
	document.getElementById("screen-start").style.display = screen === 'start' ? 'flex' : 'none';
	document.getElementById("screen-loading").style.display = screen === 'loading' ? 'flex' : 'none';
	document.getElementById("screen-gameover").style.display = screen === 'gameover' ? 'flex' : 'none';
	const pauseModal = document.getElementById("screen-pause");
	if (pauseModal) pauseModal.style.display = screen === 'pause' ? 'flex' : 'none';
	if (screen !== 'pause') {
		document.body.classList.remove("is-paused");
	}
	document.getElementById("ui-layer").style.display = (screen === 'playing' || screen === 'pause') ? 'flex' : 'none';
}

export function setPauseScreenVisible(isPaused) {
	const pauseModal = document.getElementById("screen-pause");
	if (isPaused) {
		document.body.classList.add("is-paused");
		if (pauseModal) pauseModal.style.display = 'flex';
	} else {
		document.body.classList.remove("is-paused");
		if (pauseModal) pauseModal.style.display = 'none';
	}
}

export function updateHUDStats() {
	document.getElementById("hud-score").textContent = GameState.score;
	document.getElementById("hud-streak").textContent = GameState.streak;

	const tierNum = Math.floor(GameState.currentQIndex / 6) + 1;
	document.getElementById("hud-tier").textContent = `TIER ${tierNum}`;

	let hearts = "";
	for (let i = 0; i < 3; i++) {
		const isActive = i < GameState.lives;
		hearts += `<span class="material-symbols-outlined heart-icon ${isActive ? 'active' : 'empty'}">favorite</span>`;
	}
	document.getElementById("hud-lives").innerHTML = hearts;
}

export function updateHUDQuestion(qData) {
	document.getElementById("q-number").textContent = `QUESTION ${GameState.currentQIndex + 1}`;

	const diffBadge = document.getElementById("q-difficulty");
	const diff = (qData.difficulty || 'MEDIUM').toUpperCase();
	diffBadge.textContent = diff;
	diffBadge.className = `q-difficulty diff-${diff.toLowerCase()}`;

	document.getElementById("q-text").textContent = qData.question;
	document.getElementById("text-lane-0").textContent = qData.options[0];
	document.getElementById("text-lane-1").textContent = qData.options[1];
	document.getElementById("text-lane-2").textContent = qData.options[2];

	updateLaneCardHighlights();
}

export function updateLaneCardHighlights() {
	[0, 1, 2].forEach(i => {
		const el = document.getElementById(`card-lane-${i}`);
		if (el) {
			if (i === GameState.playerLane) el.classList.add('active');
			else el.classList.remove('active');
		}
	});
}

export function showFeedback(text, isPositive) {
	const el = document.getElementById("feedback-flash");
	el.innerHTML = text;
	el.style.color = isPositive ? "var(--green)" : "var(--red)";
	el.classList.add("show");
	setTimeout(() => {
		el.classList.remove("show");
	}, 1000);
}

export function renderGameOverReview() {
	document.getElementById("go-score").textContent = GameState.score;
	const correctCount = GameState.answeredHistory.filter(h => h.isCorrect).length;
	document.getElementById("go-correct").textContent = `${correctCount} / ${GameState.answeredHistory.length}`;
	document.getElementById("go-streak").textContent = GameState.maxStreak;

	const list = document.getElementById("review-list");
	list.innerHTML = "";
	GameState.answeredHistory.forEach((item, i) => {
		const div = document.createElement("div");
		div.className = `review-entry ${item.isCorrect ? 'passed' : 'missed'}`;
		div.innerHTML = `
      <div style="font-weight:700;">${i + 1}. ${escapeHTML(item.question)}</div>
      <div style="color: ${item.isCorrect ? 'var(--green)' : 'var(--red)'}; margin-top:3px; font-weight:600; display:flex; align-items:center; gap:0.25rem;">
        ${item.isCorrect
				? '<span class="material-symbols-outlined" style="font-size:1.1rem; font-variation-settings:\'FILL\' 1;">check_circle</span> Correct'
				: `<span class="material-symbols-outlined" style="font-size:1.1rem; font-variation-settings:\'FILL\' 1;">cancel</span> You chose: ${escapeHTML(item.chosen)} | Correct: ${escapeHTML(item.correct)}`}
      </div>
      <div style="font-size:0.8rem; color:#94a3b8; margin-top:3px;">${escapeHTML(item.explanation || '')}</div>
    `;
		list.appendChild(div);
	});
}
