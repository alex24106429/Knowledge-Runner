import { COLORS, rand, glowTexture } from './materials.js';

export let particles;

export function createParticles(scene) {
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
	return particles;
}