import { init3D } from './world.js';
import { initInput } from './input.js';
import { startLoop } from './loop.js';

window.addEventListener('DOMContentLoaded', () => {
	init3D();
	initInput();
	startLoop();
});
