export const COLORS = {
	background: 0x060914,
	road: 0x111a2c,
	cyan: 0x00eaff,
	pink: 0xff287e,
	purple: 0x8b5cff,
	metal: 0x18243a,
	armor: 0x26364d
};

export const rand = (min, max) => min + Math.random() * (max - min);

export function setColorTexture(texture) {
	if ('colorSpace' in texture && THREE.SRGBColorSpace) {
		texture.colorSpace = THREE.SRGBColorSpace;
	} else if (THREE.sRGBEncoding) {
		texture.encoding = THREE.sRGBEncoding;
	}
	return texture;
}

export function makeCanvasTexture(width, height, draw, isColor = true) {
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;

	draw(canvas.getContext('2d'), width, height);

	const texture = new THREE.CanvasTexture(canvas);
	if (isColor) setColorTexture(texture);
	return texture;
}

export function box(parent, width, height, depth, material, x = 0, y = 0, z = 0) {
	const mesh = new THREE.Mesh(
		new THREE.BoxGeometry(width, height, depth),
		material
	);
	mesh.position.set(x, y, z);
	parent.add(mesh);
	return mesh;
}

export function metal(color = COLORS.metal, roughness = 0.45, metalness = 0.55) {
	return new THREE.MeshStandardMaterial({
		color,
		roughness,
		metalness
	});
}

export function neon(color, intensity = 2.0) {
	return new THREE.MeshStandardMaterial({
		color,
		emissive: color,
		emissiveIntensity: intensity,
		roughness: 0.3,
		metalness: 0.15
	});
}

export let glowTexture;
export let shadowTexture;

export function createUtilityTextures() {
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

export function addGlow(parent, color, x, y, z, width, height, opacity = 0.25) {
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