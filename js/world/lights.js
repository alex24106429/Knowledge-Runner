import { PLAYER_Z } from '../state.js';
import { COLORS } from './materials.js';

export function createLighting(scene, mobile) {
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