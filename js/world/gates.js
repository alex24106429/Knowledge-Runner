import { LANE_X, GATE_SPAWN_Z } from '../state.js';
import { COLORS, box, metal, neon, addGlow, makeCanvasTexture } from './materials.js';

let rendererRef = null;

export function setGateRenderer(renderer) {
	rendererRef = renderer;
}

export function wrapText(ctx, text, maxWidth) {
	const words = String(text ?? '').trim().split(/\s+/);
	const lines = [];
	let line = '';

	for (const word of words) {
		const candidate = line ? `${line} ${word}` : word;
		if (ctx.measureText(candidate).width <= maxWidth) {
			line = candidate;
			continue;
		}

		if (line) {
			lines.push(line);
			line = '';
		}

		for (const char of word) {
			if (line && ctx.measureText(line + char).width > maxWidth) {
				lines.push(line);
				line = char;
			} else {
				line += char;
			}
		}
	}

	if (line) lines.push(line);
	return lines;
}

export function createDoorSignTexture(text, letter) {
	const texture = makeCanvasTexture(1024, 768, (ctx, w, h) => {
		const accent = '#39edff';

		const background = ctx.createLinearGradient(0, 0, 0, h);
		background.addColorStop(0, '#14263d');
		background.addColorStop(0.55, '#0b1629');
		background.addColorStop(1, '#060c19');

		ctx.fillStyle = background;
		ctx.fillRect(0, 0, w, h);

		ctx.strokeStyle = 'rgba(66,198,225,0.065)';
		ctx.lineWidth = 1;

		for (let x = 0; x <= w; x += 48) {
			ctx.beginPath();
			ctx.moveTo(x, 0);
			ctx.lineTo(x, h);
			ctx.stroke();
		}

		for (let y = 0; y <= h; y += 48) {
			ctx.beginPath();
			ctx.moveTo(0, y);
			ctx.lineTo(w, y);
			ctx.stroke();
		}

		ctx.shadowColor = accent;
		ctx.shadowBlur = 18;
		ctx.strokeStyle = accent;
		ctx.lineWidth = 5;
		ctx.strokeRect(18, 18, w - 36, h - 36);
		ctx.shadowBlur = 0;

		const header = ctx.createLinearGradient(0, 0, w, 0);
		header.addColorStop(0, '#04c9ef');
		header.addColorStop(1, '#74fff1');

		ctx.fillStyle = header;
		ctx.fillRect(32, 32, w - 64, 126);

		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillStyle = '#061323';
		ctx.font = '800 64px system-ui, sans-serif';
		ctx.fillText(`LANE ${letter}`, w / 2, 98);

		ctx.fillStyle = '#70a9bf';
		ctx.font = '600 22px system-ui, sans-serif';
		ctx.fillText('SELECT YOUR ANSWER', w / 2, 207);

		const maxWidth = w - 130;
		const availableHeight = 390;

		let fontSize = 66;
		let lines;
		let lineHeight;

		do {
			ctx.font = `700 ${fontSize}px system-ui, sans-serif`;
			lines = wrapText(ctx, text, maxWidth);
			lineHeight = fontSize * 1.24;

			if (lines.length * lineHeight <= availableHeight || fontSize <= 12) {
				break;
			}
			fontSize -= 2;
		} while (true);

		ctx.save();
		ctx.beginPath();
		ctx.rect(60, 255, w - 120, availableHeight);
		ctx.clip();

		ctx.fillStyle = '#f1fcff';
		ctx.shadowColor = 'rgba(44,214,255,0.25)';
		ctx.shadowBlur = 8;

		const startY = 255 + availableHeight / 2 - ((lines.length - 1) * lineHeight) / 2;
		lines.forEach((line, index) => {
			ctx.fillText(line, w / 2, startY + index * lineHeight);
		});
		ctx.restore();

		ctx.fillStyle = '#477087';
		ctx.font = '500 20px system-ui, sans-serif';
		ctx.fillText('NEURAL LINK  •  READY', w / 2, h - 66);

		// Corner brackets
		ctx.strokeStyle = '#c2ffff';
		ctx.lineWidth = 7;
		[
			[20, 20, 1, 1],
			[w - 20, 20, -1, 1],
			[20, h - 20, 1, -1],
			[w - 20, h - 20, -1, -1]
		].forEach(([x, y, dx, dy]) => {
			ctx.beginPath();
			ctx.moveTo(x + dx * 44, y);
			ctx.lineTo(x, y);
			ctx.lineTo(x, y + dy * 44);
			ctx.stroke();
		});
	});

	if (rendererRef) {
		texture.anisotropy = Math.min(8, rendererRef.capabilities.getMaxAnisotropy());
	}
	return texture;
}

export function createQuestionGateGroup(qData, scene) {
	const gateGroup = new THREE.Group();
	gateGroup.position.set(0, 0, GATE_SPAWN_Z);

	const letters = ['A', 'B', 'C'];
	const doors = [];

	const frameMat = metal(0x18253b, 0.32, 0.7);
	const insetMat = metal(0x090f1d, 0.6, 0.4);
	const cyanMat = neon(COLORS.cyan, 2.5);
	const pinkMat = neon(COLORS.pink, 1.8);

	const header = box(
		gateGroup, 14, 1.05, 1.05,
		frameMat, 0, 5.5, 0
	);
	header.castShadow = true;

	box(gateGroup, 13.5, 0.55, 0.08, insetMat, 0, 5.5, 0.57);
	box(gateGroup, 14.1, 0.1, 1.15, cyanMat, 0, 6.06, 0);
	box(gateGroup, 14.1, 0.06, 1.15, pinkMat, 0, 4.96, 0);

	for (let i = -3; i <= 3; i++) {
		box(gateGroup, 0.65, 0.09, 0.04, cyanMat, i * 1.7, 5.5, 0.63);
	}

	addGlow(gateGroup, COLORS.cyan, 0, 6.08, 0.1, 15, 1.7, 0.16);

	LANE_X.forEach((laneX, i) => {
		const doorContainer = new THREE.Group();
		doorContainer.position.set(laneX, 0, 0);

		[-1.7, 1.7].forEach(px => {
			const post = box(
				doorContainer, 0.38, 5.2, 0.85,
				frameMat, px, 2.6, 0
			);
			post.castShadow = true;

			box(doorContainer, 0.065, 4.8, 0.035, cyanMat, px, 2.65, 0.45);
			box(doorContainer, 0.62, 0.35, 1.05, insetMat, px, 0.175, 0);
			box(doorContainer, 0.64, 0.045, 1.07, pinkMat, px, 0.37, 0);
		});

		box(doorContainer, 3.1, 0.065, 0.16, cyanMat, 0, 4.85, 0.15);
		box(doorContainer, 3.1, 0.055, 0.16, cyanMat, 0, 0.3, 0.15);

		[-1.53, 1.53].forEach(x => {
			box(doorContainer, 0.055, 4.55, 0.16, cyanMat, x, 2.575, 0.15);
		});

		const portal = new THREE.Mesh(
			new THREE.PlaneGeometry(3.05, 4.5),
			new THREE.MeshBasicMaterial({
				color: COLORS.cyan,
				transparent: true,
				opacity: 0.035,
				side: THREE.DoubleSide,
				blending: THREE.AdditiveBlending,
				depthWrite: false
			})
		);
		portal.position.set(0, 2.575, -0.08);
		doorContainer.add(portal);

		box(doorContainer, 3.3, 2.5, 0.16, insetMat, 0, 2.7, 0.12);

		const sign = new THREE.Mesh(
			new THREE.PlaneGeometry(3.2, 2.4),
			new THREE.MeshBasicMaterial({
				map: createDoorSignTexture(qData.options[i], letters[i]),
				toneMapped: false
			})
		);
		sign.position.set(0, 2.7, 0.215);
		doorContainer.add(sign);

		box(doorContainer, 3.1, 0.025, 0.75, cyanMat, 0, 0.025, 0);

		addGlow(doorContainer, COLORS.cyan, 0, 0.25, 0.2, 4.2, 1.2, 0.24);
		addGlow(doorContainer, COLORS.cyan, -1.7, 2.6, 0.12, 0.9, 5.8, 0.1);
		addGlow(doorContainer, COLORS.cyan, 1.7, 2.6, 0.12, 0.9, 5.8, 0.1);

		gateGroup.add(doorContainer);
		doors.push(doorContainer);
	});

	if (scene) {
		scene.add(gateGroup);
	}

	return {
		group: gateGroup,
		doors,
		questionData: qData,
		checked: false
	};
}