const TILE_SIZE = 256;
const COLS = 25; 
const ROWS = 15;

const config = {
    type: Phaser.AUTO,
    scale: { mode: Phaser.Scale.RESIZE, parent: 'game-container', width: '100%', height: '100%' },
    physics: { default: 'arcade', arcade: { gravity: { y: 0 } } },
    scene: { preload, create, update }
};

const game = new Phaser.Game(config);
let player, moveL, moveR, moveU, moveD, lastDir = 'd';

function preload() {
    // Базовые тайлы
    this.load.image('grass', 'assets/grass.png');
    this.load.image('b_down', 'assets/border_down.png');
    this.load.image('b_left', 'assets/border_left.png');
    this.load.image('b_right', 'assets/border_right.png');
    this.load.image('b_up', 'assets/border_up.png');
    this.load.image('c_ld', 'assets/corner_left_down.png');
    this.load.image('c_rd', 'assets/corner_right_down.png');
    this.load.image('c_lu', 'assets/corner_left_up.png');
    this.load.image('c_ru', 'assets/corner_right_up.png');

    // ТАЙЛЫ РАЗМЕТКИ (Исправлено название)
    this.load.image('conn_up', 'assets/connection_up.png');
    this.load.image('conn_down', 'assets/connection_down.png');
    this.load.image('line_v', 'assets/vertical.png'); 

    // Гоблин (спрайт-листы 480x480)
    const spriteCfg = { frameWidth: 480, frameHeight: 480 };
    this.load.spritesheet('idle_d', 'assets/goblin_idle_down.png', spriteCfg);
    this.load.spritesheet('gob_d', 'assets/goblin_run_down.png', spriteCfg);
    this.load.image('goal_frame', 'assets/1000084547.png');
}

function create() {
    const WORLD_WIDTH = COLS * TILE_SIZE;
    const WORLD_HEIGHT = ROWS * TILE_SIZE;
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // --- Сборка поля ---
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            let tileKey = 'grass';

            // 1. Центральная ось (13-й столбец, индекс 12)
            if (x === 12) {
                if (y === 0) tileKey = 'conn_up';
                else if (y === ROWS - 1) tileKey = 'conn_down';
                else tileKey = 'line_v'; // Тот самый vertical
            } 
            // 2. Углы
            else if (x === 0 && y === 0) tileKey = 'c_lu';
            else if (x === COLS - 1 && y === 0) tileKey = 'c_ru';
            else if (x === 0 && y === ROWS - 1) tileKey = 'c_ld';
            else if (x === COLS - 1 && y === ROWS - 1) tileKey = 'c_rd';
            
            // 3. Границы
            else if (y === 0) tileKey = 'b_up';
            else if (y === ROWS - 1) tileKey = 'b_down';
            else if (x === 0) tileKey = 'b_left';
            else if (x === COLS - 1) tileKey = 'b_right';

            this.add.image(x * TILE_SIZE, y * TILE_SIZE, tileKey).setOrigin(0, 0).setDepth(0);
        }
    }

    // Персонаж (280x240)
    player = this.physics.add.sprite(TILE_SIZE * 2, WORLD_HEIGHT / 2, 'idle_d');
    player.setDisplaySize(280, 240); 
    player.setDepth(5).setCollideWorldBounds(true);
    player.body.setSize(100, 50).setOffset(190, 380); 

    // Ворота
    this.add.image(WORLD_WIDTH - 250, WORLD_HEIGHT / 2, 'goal_frame')
        .setOrigin(0.5).setDepth(10).setScale(0.8);

    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.startFollow(player, true, 0.1, 0.1);

    setupAnimations.call(this);
    createJoystick.call(this);
}

function update() {
    player.setVelocity(0);
    const speed = 600;
    let moving = false;

    if (window.moveL) { player.setVelocityX(-speed); moving = true; }
    if (window.moveR) { player.setVelocityX(speed); moving = true; }
    if (window.moveU) { player.setVelocityY(-speed); moving = true; }
    if (window.moveD) { player.setVelocityY(speed); moving = true; }

    if (!moving) player.play('idle_d', true); 
    else player.play('gob_d', true);
}

// Функции setupAnimations и createJoystick остаются без изменений
