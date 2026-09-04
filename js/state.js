export const LANE_X = [-4.0, 0, 4.0];
export const GATE_SPAWN_Z = -140;
export const PLAYER_Z = 0;

export const GameState = {
	status: 'MENU', // 'MENU' | 'PLAYING' | 'GAMEOVER'
	topic: 'Solar System',
	score: 0,
	streak: 0,
	maxStreak: 0,
	lives: 3,
	speed: 14.5,
	playerLane: 1,
	questions: [],
	currentQIndex: 0,
	batchCount: 1,
	isFetchingBackground: false,
	activeGate: null,
	answeredHistory: []
};

export function resetGameRuntimeState() {
	GameState.status = 'PLAYING';
	GameState.score = 0;
	GameState.streak = 0;
	GameState.maxStreak = 0;
	GameState.lives = 3;
	GameState.speed = 14.5;
	GameState.playerLane = 1;
	GameState.currentQIndex = 0;
	GameState.batchCount = 1;
	GameState.isFetchingBackground = false;
	GameState.answeredHistory = [];
}
