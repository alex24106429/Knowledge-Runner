import { LANE_X, GATE_SPAWN_Z, PLAYER_Z } from './state.js';

export let scene, camera, renderer;
export let playerGroup;
export let characterMeshes = {};
export let gridLines = [];
export let sceneryObjects = [];
export let particles;

export function init3D() {
	const container = document.getElementById("canvas-container");

	scene = new THREE.Scene();
	scene.fog = new THREE.FogExp2(0x070913, 0.012);

	camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 350);
	camera.position.set(0, 4.4, 7.8);
	camera.lookAt(0, 2.0, -10);

	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
	renderer.setClearColor(0x070913);
	container.appendChild(renderer.domElement);

	const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
	scene.add(ambientLight);

	const dirLight = new THREE.DirectionalLight(0x00f0ff, 1.3);
	dirLight.position.set(5, 15, 10);
	scene.add(dirLight);

	createEnvironment();
	createPlayer();
	createParticles();

	window.addEventListener('resize', onWindowResize);
}

function createEnvironment() {
	const trackGeo = new THREE.PlaneGeometry(16, 450);
	const trackMat = new THREE.MeshBasicMaterial({ color: 0x090e1c });
	const groundTrack = new THREE.Mesh(trackGeo, trackMat);
	groundTrack.rotation.x = -Math.PI / 2;
	groundTrack.position.z = -180;
	scene.add(groundTrack);

	const lineMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
	[-2, 2].forEach(x => {
		const lineGeo = new THREE.BoxGeometry(0.15, 0.02, 450);
		const line = new THREE.Mesh(lineGeo, lineMat);
		line.position.set(x, 0.02, -180);
		scene.add(line);
	});

	[-6.5, 6.5].forEach(x => {
		const borderGeo = new THREE.BoxGeometry(0.35, 0.5, 450);
		const borderMat = new THREE.MeshBasicMaterial({ color: 0xff0077 });
		const border = new THREE.Mesh(borderGeo, borderMat);
		border.position.set(x, 0.25, -180);
		scene.add(border);
	});

	for (let z = 0; z > -380; z -= 10) {
		const tickGeo = new THREE.BoxGeometry(13, 0.02, 0.35);
		const tickMat = new THREE.MeshBasicMaterial({ color: 0x1a2645 });
		const tick = new THREE.Mesh(tickGeo, tickMat);
		tick.position.set(0, 0.01, z);
		scene.add(tick);
		gridLines.push(tick);
	}

	for (let i = 0; i < 35; i++) {
		const h = 18 + Math.random() * 40;
		const w = 4 + Math.random() * 6;
		const geo = new THREE.BoxGeometry(w, h, w);
		const mat = new THREE.MeshBasicMaterial({ color: 0x0c152a, wireframe: Math.random() > 0.6 });
		const pillar = new THREE.Mesh(geo, mat);
		const side = Math.random() > 0.5 ? 1 : -1;
		pillar.position.set(side * (16 + Math.random() * 35), h / 2, -Math.random() * 380);
		scene.add(pillar);
		sceneryObjects.push(pillar);
	}
}

function createPlayer() {
	playerGroup = new THREE.Group();

	const torsoGeo = new THREE.BoxGeometry(0.9, 1.1, 0.55);
	const torsoMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });
	const torso = new THREE.Mesh(torsoGeo, torsoMat);
	torso.position.y = 1.45;
	playerGroup.add(torso);

	const chestGeo = new THREE.BoxGeometry(0.5, 0.6, 0.1);
	const chestMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
	const chest = new THREE.Mesh(chestGeo, chestMat);
	chest.position.set(0, 1.45, 0.29);
	playerGroup.add(chest);

	const headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
	const headMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
	const head = new THREE.Mesh(headGeo, headMat);
	head.position.y = 2.3;
	playerGroup.add(head);

	const visorGeo = new THREE.BoxGeometry(0.48, 0.16, 0.15);
	const visorMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
	const visor = new THREE.Mesh(visorGeo, visorMat);
	visor.position.set(0, 2.3, 0.24);
	playerGroup.add(visor);

	const limbMat = new THREE.MeshStandardMaterial({ color: 0x334155 });

	const legGeo = new THREE.BoxGeometry(0.3, 0.8, 0.3);
	const leftLeg = new THREE.Mesh(legGeo, limbMat);
	leftLeg.position.set(-0.28, 0.7, 0);
	playerGroup.add(leftLeg);

	const rightLeg = new THREE.Mesh(legGeo, limbMat);
	rightLeg.position.set(0.28, 0.7, 0);
	playerGroup.add(rightLeg);

	const armGeo = new THREE.BoxGeometry(0.22, 0.8, 0.22);
	const leftArm = new THREE.Mesh(armGeo, limbMat);
	leftArm.position.set(-0.62, 1.4, 0);
	playerGroup.add(leftArm);

	const rightArm = new THREE.Mesh(armGeo, limbMat);
	rightArm.position.set(0.62, 1.4, 0);
	playerGroup.add(rightArm);

	characterMeshes = { torso, head, leftLeg, rightLeg, leftArm, rightArm };
	playerGroup.position.set(LANE_X[1], 0, PLAYER_Z);
	scene.add(playerGroup);
}

function createParticles() {
	const count = 280;
	const geo = new THREE.BufferGeometry();
	const positions = new Float32Array(count * 3);

	for (let i = 0; i < count * 3; i += 3) {
		positions[i] = (Math.random() - 0.5) * 40;
		positions[i + 1] = Math.random() * 18;
		positions[i + 2] = -Math.random() * 260;
	}

	geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
	const mat = new THREE.PointsMaterial({
		color: 0x00f0ff,
		size: 0.22,
		transparent: true,
		opacity: 0.6
	});

	particles = new THREE.Points(geo, mat);
	scene.add(particles);
}

export function createDoorSignTexture(text, letter) {
	const canvas = document.createElement('canvas');
	canvas.width = 640;
	canvas.height = 420;
	const ctx = canvas.getContext('2d');

	ctx.fillStyle = '#060b18';
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	ctx.lineWidth = 16;
	ctx.strokeStyle = '#00f0ff';
	ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);

	ctx.fillStyle = '#00f0ff';
	ctx.fillRect(0, 0, canvas.width, 90);
	ctx.fillStyle = '#000000';
	ctx.font = 'bold 50px sans-serif';
	ctx.textAlign = 'center';
	ctx.fillText(`LANE ${letter}`, canvas.width / 2, 65);

	ctx.fillStyle = '#ffffff';
	ctx.font = 'bold 44px sans-serif';
	ctx.textAlign = 'center';

	const words = text.split(' ');
	let lines = [];
	let curLine = '';

	for (let n = 0; n < words.length; n++) {
		const testLine = curLine + words[n] + ' ';
		const metrics = ctx.measureText(testLine);
		if (metrics.width > canvas.width - 60 && n > 0) {
			lines.push(curLine);
			curLine = words[n] + ' ';
		} else {
			curLine = testLine;
		}
	}
	lines.push(curLine);

	const lineHeight = 55;
	const startY = 175 + (3 - lines.length) * 18;
	lines.forEach((line, idx) => {
		ctx.fillText(line.trim(), canvas.width / 2, startY + idx * lineHeight);
	});

	const texture = new THREE.CanvasTexture(canvas);
	texture.needsUpdate = true;
	return texture;
}

export function createQuestionGateGroup(qData) {
	const gateGroup = new THREE.Group();
	gateGroup.position.set(0, 0, GATE_SPAWN_Z);

	const letters = ['A', 'B', 'C'];
	const doors = [];

	const headerGeo = new THREE.BoxGeometry(14.0, 1.2, 1.2);
	const headerMat = new THREE.MeshStandardMaterial({ color: 0x151f38 });
	const headerMesh = new THREE.Mesh(headerGeo, headerMat);
	headerMesh.position.set(0, 5.5, 0);
	gateGroup.add(headerMesh);

	const trimGeo = new THREE.BoxGeometry(14.0, 0.18, 1.3);
	const trimMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
	const trim = new THREE.Mesh(trimGeo, trimMat);
	trim.position.set(0, 6.1, 0);
	gateGroup.add(trim);

	LANE_X.forEach((laneX, i) => {
		const doorContainer = new THREE.Group();
		doorContainer.position.set(laneX, 0, 0);

		[-1.7, 1.7].forEach(px => {
			const postGeo = new THREE.BoxGeometry(0.35, 5.2, 0.8);
			const postMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
			const post = new THREE.Mesh(postGeo, postMat);
			post.position.set(px, 2.6, 0);
			doorContainer.add(post);
		});

		const portalRingGeo = new THREE.BoxGeometry(3.4, 4.6, 0.2);
		const portalRingMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: true });
		const portalRing = new THREE.Mesh(portalRingGeo, portalRingMat);
		portalRing.position.set(0, 2.6, 0);
		doorContainer.add(portalRing);

		const signGeo = new THREE.PlaneGeometry(3.2, 2.4);
		const signTex = createDoorSignTexture(qData.options[i], letters[i]);
		const signMat = new THREE.MeshBasicMaterial({ map: signTex });
		const signMesh = new THREE.Mesh(signGeo, signMat);
		signMesh.position.set(0, 2.7, 0);
		doorContainer.add(signMesh);

		gateGroup.add(doorContainer);
		doors.push(doorContainer);
	});

	scene.add(gateGroup);

	return {
		group: gateGroup,
		doors: doors,
		questionData: qData,
		checked: false
	};
}

export function onWindowResize() {
	if (!camera || !renderer) return;
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}
