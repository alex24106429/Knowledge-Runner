import { LANE_X, GATE_SPAWN_Z, PLAYER_Z, GameState } from './state.js';
import {
	scene,
	camera,
	renderer,
	playerGroup,
	characterMeshes,
	gridLines,
	sceneryObjects,
	particles
} from './world.js';
import { handleGateCollision } from './game.js';

let clock;
let cameraShake = 0;
let currentCamX = 0;

export function triggerCameraShake(amount = 0.35) {
	cameraShake = amount;
}

export function resetCameraState() {
	currentCamX = 0;
	cameraShake = 0;
}

export function startLoop() {
	clock = new THREE.Clock();
	animate();
}

function animate() {
	requestAnimationFrame(animate);
	const dt = clock.getDelta();
	const elapsedTime = clock.getElapsedTime();

	if (GameState.status === 'PLAYING') {
		const currentSpeed = GameState.speed;

		const targetX = LANE_X[GameState.playerLane];
		playerGroup.position.x += (targetX - playerGroup.position.x) * 12 * dt;
		playerGroup.rotation.z = (targetX - playerGroup.position.x) * 0.08;

		const runCycle = elapsedTime * (currentSpeed * 0.45);
		if (characterMeshes.leftLeg) {
			characterMeshes.leftLeg.rotation.x = Math.sin(runCycle) * 0.75;
			characterMeshes.rightLeg.rotation.x = -Math.sin(runCycle) * 0.75;
			characterMeshes.leftArm.rotation.x = -Math.sin(runCycle) * 0.65;
			characterMeshes.rightArm.rotation.x = Math.sin(runCycle) * 0.65;
			playerGroup.position.y = Math.abs(Math.sin(runCycle)) * 0.16;
		}

		// Responsive camera lane tracking
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
			const approachBar = document.getElementById("approach-bar");
			if (approachBar) approachBar.style.width = `${progress}%`;

			if (!GameState.activeGate.checked && GameState.activeGate.group.position.z >= PLAYER_Z - 0.5) {
				handleGateCollision(GameState.activeGate);
			}

			if (GameState.activeGate && GameState.activeGate.group.position.z > 25) {
				scene.remove(GameState.activeGate.group);
				GameState.activeGate = null;
			}
		} else {
			const approachBar = document.getElementById("approach-bar");
			if (approachBar) approachBar.style.width = `0%`;
		}
	} else if (GameState.status === 'PAUSED') {
		// Frozen in place
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