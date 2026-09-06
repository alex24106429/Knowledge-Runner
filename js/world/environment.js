import { COLORS, rand, makeCanvasTexture, box, metal, neon, addGlow } from './materials.js';

export const gridLines = [];
export const sceneryObjects = [];

export function createRoadTexture(renderer) {
	const texture = makeCanvasTexture(256, 256, (ctx, w, h) => {
		ctx.fillStyle = '#536070';
		ctx.fillRect(0, 0, w, h);

		for (let i = 0; i < 9000; i++) {
			const value = Math.floor(rand(65, 115));
			ctx.fillStyle = `rgba(${value},${value},${value},0.22)`;
			ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
		}
	});

	texture.wrapS = THREE.RepeatWrapping;
	texture.wrapT = THREE.RepeatWrapping;
	texture.repeat.set(4, 100);
	if (renderer) {
		texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
	}
	return texture;
}

export function createWindowTexture(color) {
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

export function createEnvironment(scene, renderer) {
	const roadTexture = createRoadTexture(renderer);

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

	// Lane dividers
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

	// Raised neon side rails
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

	// Dynamic grid markers
	const tickGeo = new THREE.BoxGeometry(13, 0.015, 0.075);
	const tickMat = new THREE.MeshBasicMaterial({ color: 0x243950 });
	const markerGeo = new THREE.BoxGeometry(0.14, 0.025, 1.2);

	for (let z = 0; z > -380; z -= 10) {
		const tick = new THREE.Mesh(tickGeo, tickMat);
		tick.position.set(0, 0.006, z);
		scene.add(tick);
		gridLines.push(tick);

		[-5.8, 5.8].forEach(x => {
			const marker = new THREE.Mesh(markerGeo, cyanMat);
			marker.position.set(x, 0.02, 0);
			tick.add(marker);
		});
	}

	// Cyberpunk buildings
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

	// Distant atmospheric glowing halos
	addGlow(scene, COLORS.purple, 0, 22, -240, 150, 100, 0.2);
	addGlow(scene, COLORS.cyan, -35, 10, -180, 70, 45, 0.12);
}