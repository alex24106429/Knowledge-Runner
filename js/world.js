import { COLORS, createUtilityTextures } from './world/materials.js';
import { createLighting } from './world/lights.js';
import { createEnvironment, gridLines, sceneryObjects } from './world/environment.js';
import { createPlayer, playerGroup, characterMeshes } from './world/player.js';
import { createParticles, particles } from './world/particles.js';
import { createQuestionGateGroup, setGateRenderer } from './world/gates.js';

export let scene, camera, renderer;

export { playerGroup, characterMeshes } from './world/player.js';
export { gridLines, sceneryObjects } from './world/environment.js';
export { particles } from './world/particles.js';

export function createGate(qData) {
	return createQuestionGateGroup(qData, scene);
}
export { createGate as createQuestionGateGroup };

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

	setGateRenderer(renderer);
	createUtilityTextures();
	createLighting(scene, mobile);
	createEnvironment(scene, renderer);
	createPlayer(scene);
	createParticles(scene);

	window.addEventListener('resize', onWindowResize);
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
