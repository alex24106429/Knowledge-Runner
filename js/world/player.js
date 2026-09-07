import { LANE_X, PLAYER_Z } from '../state.js';
import { COLORS, box, metal, neon, addGlow, shadowTexture } from './materials.js';

export const playerGroup = new THREE.Group();
export const characterMeshes = {
	torso: null,
	head: null,
	leftLeg: null,
	rightLeg: null,
	leftArm: null,
	rightArm: null
};

export function createPlayer(scene) {
	const darkMat = metal(0x101a2b, 0.38, 0.65);
	const armorMat = metal(COLORS.armor, 0.32, 0.65);
	const jointMat = metal(0x080f1b, 0.75, 0.2);
	const cyanMat = neon(COLORS.cyan, 2.8);
	const pinkMat = neon(COLORS.pink, 1.8);

	const torso = box(
		playerGroup, 0.9, 1.05, 0.58,
		darkMat, 0, 1.48, 0
	);

	// Chest plating and glowing energy core
	box(torso, 0.73, 0.6, 0.12, armorMat, 0, 0.12, 0.33);
	box(torso, 0.15, 0.42, 0.025, cyanMat, 0, 0.12, 0.405);

	[-0.27, 0.27].forEach(x => {
		box(torso, 0.075, 0.48, 0.025, cyanMat, x, 0.12, 0.405);
	});

	box(torso, 0.8, 0.1, 0.64, armorMat, 0, -0.4, 0);
	box(torso, 0.22, 0.09, 0.035, pinkMat, 0, -0.4, 0.34);

	// Rear battery pack
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

	// Ground contact shadow
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

	characterMeshes.torso = torso;
	characterMeshes.head = head;
	characterMeshes.leftLeg = leftLeg;
	characterMeshes.rightLeg = rightLeg;
	characterMeshes.leftArm = leftArm;
	characterMeshes.rightArm = rightArm;

	playerGroup.position.set(LANE_X[1], 0, PLAYER_Z);
	playerGroup.rotation.y = Math.PI;
	scene.add(playerGroup);
	return playerGroup;
}