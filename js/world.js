import { LANE_X, GATE_SPAWN_Z, PLAYER_Z } from './state.js';

export let scene, camera, renderer;
export let playerGroup;
export let characterMeshes = {};
export let gridLines = [];
export let sceneryObjects = [];
export let particles;

const COLORS = {
	background: 0x060914,
	road: 0x111a2c,
	cyan: 0x00eaff,
	pink: 0xff287e,
	purple: 0x8b5cff,
	metal: 0x18243a,
	armor: 0x26364d
};

let glowTexture;
let shadowTexture;

const rand = (min, max) => min + Math.random() * (max - min);

// -----------------------------------------------------------------------------
// Utilities
// -----------------------------------------------------------------------------

function setColorTexture(texture) {
	// Supports both newer and older Three.js releases.
	if ('colorSpace' in texture && THREE.SRGBColorSpace) {
		texture.colorSpace = THREE.SRGBColorSpace;
	} else if (THREE.sRGBEncoding) {
		texture.encoding = THREE.sRGBEncoding;
	}

	return texture;
}

function makeCanvasTexture(width, height, draw, isColor = true) {
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;

	draw(canvas.getContext('2d'), width, height);

	const texture = new THREE.CanvasTexture(canvas);

	if (isColor) setColorTexture(texture);

	return texture;
}

function box(parent, width, height, depth, material, x = 0, y = 0, z = 0) {
	const mesh = new THREE.Mesh(
		new THREE.BoxGeometry(width, height, depth),
		material
	);

	mesh.position.set(x, y, z);
	parent.add(mesh);

	return mesh;
}

function metal(color = COLORS.metal, roughness = 0.45, metalness = 0.55) {
	return new THREE.MeshStandardMaterial({
		color,
		roughness,
		metalness
	});
}

function neon(color, intensity = 2.0) {
	return new THREE.MeshStandardMaterial({
		color,
		emissive: color,
		emissiveIntensity: intensity,
		roughness: 0.3,
		metalness: 0.15
	});
}

function addGlow(parent, color, x, y, z, width, height, opacity = 0.25) {
	const material = new THREE.SpriteMaterial({
		map: glowTexture,
		color,
		transparent: true,
		opacity,
		blending: THREE.AdditiveBlending,
		depthWrite: false,
		toneMapped: false
	});

	const sprite = new THREE.Sprite(material);
	sprite.position.set(x, y, z);
	sprite.scale.set(width, height, 1);
	parent.add(sprite);

	return sprite;
}

function createUtilityTextures() {
	glowTexture = makeCanvasTexture(128, 128, (ctx, w, h) => {
		const gradient = ctx.createRadialGradient(
			w / 2, h / 2, 0,
			w / 2, h / 2, w / 2
		);

		gradient.addColorStop(0, 'rgba(255,255,255,1)');
		gradient.addColorStop(0.18, 'rgba(255,255,255,0.65)');
		gradient.addColorStop(0.45, 'rgba(255,255,255,0.16)');
		gradient.addColorStop(1, 'rgba(255,255,255,0)');

		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, w, h);
	});

	shadowTexture = makeCanvasTexture(128, 128, (ctx, w, h) => {
		const gradient = ctx.createRadialGradient(
			w / 2, h / 2, 5,
			w / 2, h / 2, w / 2
		);

		gradient.addColorStop(0, 'rgba(0,0,0,0.65)');
		gradient.addColorStop(0.4, 'rgba(0,0,0,0.3)');
		gradient.addColorStop(1, 'rgba(0,0,0,0)');

		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, w, h);
	}, false);
}

// -----------------------------------------------------------------------------
// Camera and renderer
// -----------------------------------------------------------------------------

export function updateCameraConfig() {
	if (!camera) return;

	const aspect = window.innerWidth / window.innerHeight;
	camera.aspect = aspect;

	if (aspect < 0.6) {
		camera.fov = 72;
		camera.baseY = 5.2;
		camera.baseZ = 10.4;
	} else if (aspect < 1.0) {
		camera.fov = 68;
		camera.baseY = 4.8;
		camera.baseZ = 9.0;
	} else {
		camera.fov = 64;
		camera.baseY = 4.4;
		camera.baseZ = 7.8;
	}

	camera.updateProjectionMatrix();
}

export function init3D() {
	const container = document.getElementById('canvas-container');
	const mobile = window.matchMedia('(pointer: coarse)').matches;

	scene = new THREE.Scene();
	scene.background = new THREE.Color(COLORS.background);
	scene.fog = new THREE.FogExp2(COLORS.background, 0.014);

	camera = new THREE.PerspectiveCamera(
		64,
		window.innerWidth / window.innerHeight,
		0.1,
		400
	);

	updateCameraConfig();

	camera.position.set(0, camera.baseY, camera.baseZ);
	camera.lookAt(0, 1.8, -12);

	renderer = new THREE.WebGLRenderer({
		antialias: true,
		alpha: false,
		powerPreference: 'high-performance'
	});

	renderer.setPixelRatio(
		Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2)
	);
	renderer.setSize(window.innerWidth, window.innerHeight);

	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;

	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.toneMappingExposure = 1.15;

	if ('outputColorSpace' in renderer && THREE.SRGBColorSpace) {
		renderer.outputColorSpace = THREE.SRGBColorSpace;
	} else if (THREE.sRGBEncoding) {
		renderer.outputEncoding = THREE.sRGBEncoding;
	}

	renderer.domElement.style.display = 'block';
	container.appendChild(renderer.domElement);

	createUtilityTextures();
	createLighting(mobile);
	createEnvironment();
	createPlayer();
	createParticles();

	window.addEventListener('resize', onWindowResize);
}

function createLighting(mobile) {
	scene.add(new THREE.HemisphereLight(0x9acaff, 0x101026, 1.15));

	const keyLight = new THREE.DirectionalLight(0xd9f4ff, 2.2);
	keyLight.position.set(-6, 14, 7);

	keyLight.target.position.set(0, 0, PLAYER_Z - 7);
	scene.add(keyLight.target);

	keyLight.castShadow = true;
	keyLight.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);

	Object.assign(keyLight.shadow.camera, {
		left: -12,
		right: 12,
		top: 18,
		bottom: -18,
		near: 0.5,
		far: 65
	});

	keyLight.shadow.camera.updateProjectionMatrix();
	keyLight.shadow.bias = -0.0003;
	keyLight.shadow.normalBias = 0.035;
	keyLight.shadow.radius = 3;

	scene.add(keyLight);

	const rimLight = new THREE.DirectionalLight(COLORS.pink, 1.4);
	rimLight.position.set(8, 6, -18);
	scene.add(rimLight);

	const cyanFill = new THREE.PointLight(COLORS.cyan, 18, 24, 2);
	cyanFill.position.set(-4, 3, PLAYER_Z + 1);
	scene.add(cyanFill);

	const pinkFill = new THREE.PointLight(COLORS.pink, 14, 22, 2);
	pinkFill.position.set(5, 2, PLAYER_Z - 5);
	scene.add(pinkFill);
}

// -----------------------------------------------------------------------------
// Track and city
// -----------------------------------------------------------------------------

function createRoadTexture() {
	const texture = makeCanvasTexture(256, 256, (ctx, w, h) => {
		ctx.fillStyle = '#536070';
		ctx.fillRect(0, 0, w, h);

		for (let i = 0; i < 9000; i++) {
			const value = Math.floor(rand(65, 115));
			ctx.fillStyle = `rgba(${value},${value},${value},0.22)`;
			ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
		}

		ctx.strokeStyle = 'rgba(15,25,40,0.35)';
		ctx.lineWidth = 2;
		ctx.strokeRect(2, 2, w - 4, h - 4);
	});

	texture.wrapS = THREE.RepeatWrapping;
	texture.wrapT = THREE.RepeatWrapping;
	texture.repeat.set(4, 100);
	texture.anisotropy = Math.min(
		8,
		renderer.capabilities.getMaxAnisotropy()
	);

	return texture;
}

function createWindowTexture(color) {
	return makeCanvasTexture(128, 256, (ctx, w, h) => {
		ctx.fillStyle = '#000000';
		ctx.fillRect(0, 0, w, h);

		for (let y = 8; y < h - 8; y += 16) {
			for (let x = 8; x < w - 8; x += 16) {
				if (Math.random() > 0.48) {
					ctx.globalAlpha = rand(0.25, 0.95);
					ctx.fillStyle = color;
					ctx.fillRect(x, y, 5, 8);
				}
			}
		}

		ctx.globalAlpha = 1;
	});
}

function createEnvironment() {
	const roadTexture = createRoadTexture();

	const roadMat = new THREE.MeshStandardMaterial({
		color: 0x28394f,
		map: roadTexture,
		roughness: 0.72,
		metalness: 0.25
	});

	const track = new THREE.Mesh(
		new THREE.PlaneGeometry(16, 450),
		roadMat
	);

	track.rotation.x = -Math.PI / 2;
	track.position.set(0, -0.025, -180);
	track.receiveShadow = true;
	scene.add(track);

	const outerGround = new THREE.Mesh(
		new THREE.PlaneGeometry(260, 450),
		metal(0x080d19, 0.95, 0.05)
	);

	outerGround.rotation.x = -Math.PI / 2;
	outerGround.position.set(0, -0.12, -180);
	scene.add(outerGround);

	const cyanMat = neon(COLORS.cyan, 2.4);
	const pinkMat = neon(COLORS.pink, 2.1);
	const railMat = metal(0x172238, 0.4, 0.7);

	// Lane dividers.
	[-2, 2].forEach(x => {
		box(scene, 0.065, 0.018, 450, cyanMat, x, 0.015, -180);

		const spill = new THREE.MeshBasicMaterial({
			color: COLORS.cyan,
			transparent: true,
			opacity: 0.055,
			blending: THREE.AdditiveBlending,
			depthWrite: false
		});

		box(scene, 0.5, 0.005, 450, spill, x, 0.003, -180);
	});

	// Raised side rails with luminous top and inner strips.
	[-6.5, 6.5].forEach(x => {
		const rail = box(
			scene, 0.38, 0.46, 450,
			railMat, x, 0.23, -180
		);

		rail.receiveShadow = true;

		box(scene, 0.4, 0.055, 450, pinkMat, x, 0.48, -180);
		box(
			scene, 0.045, 0.075, 450,
			cyanMat, x - Math.sign(x) * 0.2, 0.15, -180
		);
	});

	const tickGeo = new THREE.BoxGeometry(13, 0.015, 0.075);
	const tickMat = new THREE.MeshBasicMaterial({ color: 0x243950 });
	const markerGeo = new THREE.BoxGeometry(0.14, 0.025, 1.2);

	for (let z = 0; z > -380; z -= 10) {
		const tick = new THREE.Mesh(tickGeo, tickMat);
		tick.position.set(0, 0.006, z);
		scene.add(tick);
		gridLines.push(tick);

		// Children follow your existing grid-line movement.
		[-5.8, 5.8].forEach(x => {
			const marker = new THREE.Mesh(markerGeo, cyanMat);
			marker.position.set(x, 0.02, 0);
			tick.add(marker);
		});
	}

	const buildingMaterials = [
		new THREE.MeshStandardMaterial({
			color: 0x101b2c,
			roughness: 0.8,
			metalness: 0.2,
			emissive: 0xffffff,
			emissiveMap: createWindowTexture('#31b8d2'),
			emissiveIntensity: 0.85
		}),
		new THREE.MeshStandardMaterial({
			color: 0x14182b,
			roughness: 0.8,
			metalness: 0.2,
			emissive: 0xffffff,
			emissiveMap: createWindowTexture('#ba568e'),
			emissiveIntensity: 0.7
		})
	];

	const roofMats = [
		neon(COLORS.cyan, 1.1),
		neon(COLORS.pink, 1.1)
	];

	for (let i = 0; i < 44; i++) {
		const h = rand(14, 56);
		const w = rand(4, 9);
		const d = rand(5, 11);
		const side = i % 2 === 0 ? -1 : 1;
		const style = i % 2;

		const building = new THREE.Mesh(
			new THREE.BoxGeometry(w, h, d),
			buildingMaterials[style]
		);

		building.position.set(
			side * rand(16, 48),
			h / 2,
			-rand(8, 380)
		);

		// Sparse roof accents keep the skyline readable.
		if (i % 3 === 0) {
			box(
				building,
				w + 0.12, 0.09, d + 0.12,
				roofMats[style],
				0, h / 2 + 0.05, 0
			);

			box(
				building,
				0.08, h, 0.08,
				roofMats[style],
				-w / 2 - 0.02, 0, d / 2 + 0.02
			);
		}

		scene.add(building);
		sceneryObjects.push(building);
	}

	// Distant atmospheric halo.
	addGlow(scene, COLORS.purple, 0, 22, -240, 150, 100, 0.2);
	addGlow(scene, COLORS.cyan, -35, 10, -180, 70, 45, 0.12);
}

// -----------------------------------------------------------------------------
// Character
// -----------------------------------------------------------------------------

function createPlayer() {
	playerGroup = new THREE.Group();

	const darkMat = metal(0x101a2b, 0.38, 0.65);
	const armorMat = metal(COLORS.armor, 0.32, 0.65);
	const jointMat = metal(0x080f1b, 0.75, 0.2);
	const cyanMat = neon(COLORS.cyan, 2.8);
	const pinkMat = neon(COLORS.pink, 1.8);

	const torso = box(
		playerGroup, 0.9, 1.05, 0.58,
		darkMat, 0, 1.48, 0
	);

	// Chest plating and energy core.
	box(torso, 0.73, 0.6, 0.12, armorMat, 0, 0.12, 0.33);
	box(torso, 0.15, 0.42, 0.025, cyanMat, 0, 0.12, 0.405);

	[-0.27, 0.27].forEach(x => {
		box(torso, 0.075, 0.48, 0.025, cyanMat, x, 0.12, 0.405);
	});

	box(torso, 0.8, 0.1, 0.64, armorMat, 0, -0.4, 0);
	box(torso, 0.22, 0.09, 0.035, pinkMat, 0, -0.4, 0.34);

	// Backpack is visible if the player turns.
	box(torso, 0.58, 0.65, 0.22, armorMat, 0, 0.02, -0.38);
	box(torso, 0.08, 0.4, 0.025, cyanMat, 0, 0.02, -0.505);

	const neck = new THREE.Mesh(
		new THREE.CylinderGeometry(0.15, 0.18, 0.2, 12),
		jointMat
	);
	neck.position.y = 2.08;
	playerGroup.add(neck);

	const head = box(
		playerGroup, 0.57, 0.53, 0.55,
		armorMat, 0, 2.36, 0
	);

	box(head, 0.53, 0.23, 0.06, jointMat, 0, 0.025, 0.29);
	box(head, 0.46, 0.115, 0.065, cyanMat, 0, 0.035, 0.33);
	box(head, 0.19, 0.07, 0.065, darkMat, 0, -0.15, 0.29);

	[-0.31, 0.31].forEach(x => {
		box(head, 0.09, 0.23, 0.29, darkMat, x, 0, 0);
		box(head, 0.095, 0.05, 0.17, pinkMat, x, 0.01, 0.02);
	});

	const limbGeo = new THREE.BoxGeometry(0.29, 0.8, 0.32);
	const armGeo = new THREE.BoxGeometry(0.23, 0.79, 0.26);

	function createLeg(x) {
		const leg = new THREE.Mesh(limbGeo, darkMat);
		leg.position.set(x, 0.7, 0);
		playerGroup.add(leg);

		box(leg, 0.31, 0.24, 0.13, armorMat, 0, -0.02, 0.19);
		box(leg, 0.08, 0.26, 0.025, cyanMat, 0, -0.19, 0.18);
		box(leg, 0.34, 0.19, 0.49, armorMat, 0, -0.38, 0.075);
		box(leg, 0.35, 0.04, 0.5, cyanMat, 0, -0.475, 0.075);

		return leg;
	}

	function createArm(x) {
		const arm = new THREE.Mesh(armGeo, darkMat);
		arm.position.set(x, 1.43, 0);
		playerGroup.add(arm);

		box(arm, 0.34, 0.27, 0.35, armorMat, 0, 0.29, 0);
		box(arm, 0.25, 0.28, 0.29, armorMat, 0, -0.19, 0.015);
		box(arm, 0.1, 0.19, 0.025, cyanMat, 0, -0.18, 0.175);
		box(arm, 0.25, 0.19, 0.27, jointMat, 0, -0.45, 0);

		return arm;
	}

	const leftLeg = createLeg(-0.27);
	const rightLeg = createLeg(0.27);
	const leftArm = createArm(-0.64);
	const rightArm = createArm(0.64);

	playerGroup.traverse(object => {
		if (object.isMesh) {
			object.castShadow = true;
			object.receiveShadow = true;
		}
	});

	// Contact shadow helps anchor the player to the track.
	const contactShadow = new THREE.Mesh(
		new THREE.PlaneGeometry(2.5, 1.8),
		new THREE.MeshBasicMaterial({
			map: shadowTexture,
			transparent: true,
			depthWrite: false,
			opacity: 0.65
		})
	);

	contactShadow.rotation.x = -Math.PI / 2;
	contactShadow.position.y = 0.012;
	playerGroup.add(contactShadow);

	addGlow(playerGroup, COLORS.cyan, 0, 1.58, 0.48, 1.1, 1.1, 0.12);
	addGlow(head, COLORS.cyan, 0, 0.035, 0.4, 0.95, 0.42, 0.22);

	characterMeshes = {
		torso,
		head,
		leftLeg,
		rightLeg,
		leftArm,
		rightArm
	};

	playerGroup.position.set(LANE_X[1], 0, PLAYER_Z);
	scene.add(playerGroup);
}

// -----------------------------------------------------------------------------
// Particles
// -----------------------------------------------------------------------------

function createParticles() {
	const count = 280;
	const geometry = new THREE.BufferGeometry();
	const positions = new Float32Array(count * 3);
	const colors = new Float32Array(count * 3);

	const cyan = new THREE.Color(COLORS.cyan);
	const pink = new THREE.Color(COLORS.pink);
	const color = new THREE.Color();

	for (let i = 0; i < count; i++) {
		const index = i * 3;

		positions[index] = rand(-22, 22);
		positions[index + 1] = rand(0.5, 18);
		positions[index + 2] = -Math.random() * 260;

		color.copy(cyan).lerp(pink, Math.random() * 0.65);

		colors[index] = color.r;
		colors[index + 1] = color.g;
		colors[index + 2] = color.b;
	}

	geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
	geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

	particles = new THREE.Points(
		geometry,
		new THREE.PointsMaterial({
			map: glowTexture,
			vertexColors: true,
			size: 0.32,
			sizeAttenuation: true,
			transparent: true,
			opacity: 0.72,
			blending: THREE.AdditiveBlending,
			depthWrite: false,
			toneMapped: false
		})
	);

	scene.add(particles);
}

// -----------------------------------------------------------------------------
// Gate signs
// -----------------------------------------------------------------------------

function wrapText(ctx, text, maxWidth) {
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

		// Break unusually long words rather than clipping them.
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

		// Subtle display grid.
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

		const startY =
			255 + availableHeight / 2 -
			((lines.length - 1) * lineHeight) / 2;

		lines.forEach((line, index) => {
			ctx.fillText(line, w / 2, startY + index * lineHeight);
		});

		ctx.restore();

		ctx.fillStyle = '#477087';
		ctx.font = '500 20px system-ui, sans-serif';
		ctx.fillText('NEURAL LINK  •  READY', w / 2, h - 66);

		// Bright corner brackets.
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

	if (renderer) {
		texture.anisotropy = Math.min(
			8,
			renderer.capabilities.getMaxAnisotropy()
		);
	}

	return texture;
}

// -----------------------------------------------------------------------------
// Gates
// -----------------------------------------------------------------------------

export function createQuestionGateGroup(qData) {
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

	// Header status lights.
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

			box(
				doorContainer, 0.065, 4.8, 0.035,
				cyanMat, px, 2.65, 0.45
			);

			box(
				doorContainer, 0.62, 0.35, 1.05,
				insetMat, px, 0.175, 0
			);

			box(
				doorContainer, 0.64, 0.045, 1.07,
				pinkMat, px, 0.37, 0
			);
		});

		// Clean luminous portal frame.
		box(doorContainer, 3.1, 0.065, 0.16, cyanMat, 0, 4.85, 0.15);
		box(doorContainer, 3.1, 0.055, 0.16, cyanMat, 0, 0.3, 0.15);

		[-1.53, 1.53].forEach(x => {
			box(doorContainer, 0.055, 4.55, 0.16, cyanMat, x, 2.575, 0.15);
		});

		// Subtle transparent portal surface.
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

		// Solid backing gives the sign depth and prevents reverse-side clutter.
		box(
			doorContainer, 3.3, 2.5, 0.16,
			insetMat, 0, 2.7, 0.12
		);

		const sign = new THREE.Mesh(
			new THREE.PlaneGeometry(3.2, 2.4),
			new THREE.MeshBasicMaterial({
				map: createDoorSignTexture(qData.options[i], letters[i]),
				toneMapped: false
			})
		);

		sign.position.set(0, 2.7, 0.215);
		doorContainer.add(sign);

		// Ground threshold and soft portal glow.
		box(
			doorContainer, 3.1, 0.025, 0.75,
			cyanMat, 0, 0.025, 0
		);

		addGlow(
			doorContainer, COLORS.cyan,
			0, 0.25, 0.2, 4.2, 1.2, 0.24
		);

		addGlow(
			doorContainer, COLORS.cyan,
			-1.7, 2.6, 0.12, 0.9, 5.8, 0.1
		);

		addGlow(
			doorContainer, COLORS.cyan,
			1.7, 2.6, 0.12, 0.9, 5.8, 0.1
		);

		gateGroup.add(doorContainer);
		doors.push(doorContainer);
	});

	scene.add(gateGroup);

	return {
		group: gateGroup,
		doors,
		questionData: qData,
		checked: false
	};
}

export function onWindowResize() {
	if (!camera || !renderer) return;

	updateCameraConfig();

	camera.position.y = camera.baseY;
	camera.position.z = camera.baseZ;
	camera.lookAt(0, 1.8, -12);

	const mobile = window.matchMedia('(pointer: coarse)').matches;

	renderer.setPixelRatio(
		Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2)
	);
	renderer.setSize(window.innerWidth, window.innerHeight);
}
