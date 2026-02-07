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
    // Загрузка тайлов (из твоего списка)
    this.load.image('grass', 'assets/grass.png');
    this.load.image('b_down', 'assets/border_down.png');
    this.load.image('b_left', 'assets/border_left.png');
    this.load.image('b_right', 'assets/border_right.png');
    this.load.image('b_up', 'assets/border_up.png');
    this.load.image('c_ld', 'assets/corner_left_down.png');
    this.load.image('c_rd', 'assets/corner_right_down.png');
    this.load.image('c_lu', 'assets/corner_left_up.png');
    this.load.image('c_ru', 'assets/corner_right_up.png');

    // Загрузка анимаций (используем 480 как базу кадра в файле)
    const spriteCfg = { frameWidth: 480, frameHeight: 480 };
    this.load.spritesheet('idle_d', 'assets/goblin_idle_down.png', spriteCfg);
    this.load.spritesheet('idle_u', 'assets/goblin_idle_up.png', spriteCfg);
    this.load.spritesheet('idle_l', 'assets/goblin_idle_left.png', spriteCfg);
    this.load.spritesheet('idle_r', 'assets/goblin_idle_right.png', spriteCfg);
    
    this.load.spritesheet('gob_d', 'assets/goblin_run_down.png', spriteCfg);
    this.load.spritesheet('gob_u', 'assets/goblin_run_up.png', spriteCfg);
    this.load.spritesheet('gob_l', 'assets/goblin_run_left.png', spriteCfg);
    this.load.spritesheet('gob_r', 'assets/goblin_run_right.png', spriteCfg);

    this.load.image('goal_frame', 'assets/1000084547.png');
}

function create() {
    const WORLD_WIDTH = COLS * TILE_SIZE;
    const WORLD_HEIGHT = ROWS * TILE_SIZE;
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // СБОРКА ПОЛЯ (твой алгоритм)
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            let tileKey = 'grass';
            if (x === 0 && y === 0) tileKey = 'c_lu';
            else if (x === COLS - 1 && y === 0) tileKey = 'c_ru';
            else if (x === 0 && y === ROWS - 1) tileKey = 'c_ld';
            else if (x === COLS - 1 && y === ROWS - 1) tileKey = 'c_rd';
            else if (y === 0) tileKey = 'b_up';
            else if (y === ROWS - 1) tileKey = 'b_down';
            else if (x === 0) tileKey = 'b_left';
            else if (x === COLS - 1) tileKey = 'b_right';

            this.add.image(x * TILE_SIZE, y * TILE_SIZE, tileKey).setOrigin(0, 0).setDepth(0);
        }
    }

    // --- СОЗДАНИЕ ОГРОМНОГО ГОБЛИНА ---
    player = this.physics.add.sprite(500, WORLD_HEIGHT / 2, 'idle_d');
    
    // Устанавливаем точный размер 840x720
    player.setDisplaySize(840, 720); 
    player.setDepth(5);
    player.setCollideWorldBounds(true);

    // НАСТРОЙКА ХИТБОКСА (под размер 840x720)
    // Делаем тело маленьким и внизу (только ноги), чтобы он мог "заходить" за объекты
    // Ширина 300, Высота 150, Смещение чтобы было внизу по центру
    player.body.setSize(300, 150);
    player.body.setOffset(90, 450); 

    // Ворота
    let goalX = WORLD_WIDTH - 300;
    let goalY = WORLD_HEIGHT / 2;
    this.add.image(goalX, goalY, 'goal_frame').setOrigin(0.5).setDepth(10).setScale(1.2);

    // Камера
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.startFollow(player, true, 0.1, 0.1);

    setupAnimations.call(this);
    createJoystick.call(this);
}

function update() {
    player.setVelocity(0);
    const speed = 800; // Немного увеличил скорость, так как персонаж стал больше
    let moving = false;

    if (window.moveL) { player.setVelocityX(-speed); player.play('gob_l', true); lastDir = 'l'; moving = true; }
    else if (window.moveR) { player.setVelocityX(speed); player.play('gob_r', true); lastDir = 'r'; moving = true; }
    
    if (window.moveU) { 
        player.setVelocityY(-speed); 
        if(!moving) player.play('gob_u', true); 
        lastDir = 'u'; moving = true; 
    } else if (window.moveD) { 
        player.setVelocityY(speed); 
        if(!moving) player.play('gob_d', true); 
        lastDir = 'd'; moving = true; 
    }

    if (!moving) player.play('idle_' + lastDir, true);
}

function setupAnimations() {
    const dirs = ['l', 'r', 'u', 'd'];
    dirs.forEach(dir => {
        this.anims.create({
            key: 'gob_' + dir,
            frames: this.anims.generateFrameNumbers('gob_' + dir, { start: 0, end: 11 }),
            frameRate: 15, repeat: -1
        });
        this.anims.create({
            key: 'idle_' + dir,
            frames: this.anims.generateFrameNumbers('idle_' + dir, { start: 0, end: 15 }),
            frameRate: 12, repeat: -1
        });
    });
}

function createJoystick() {
    const h = this.scale.height;
    const addB = (x, y, label, action) => {
        let btn = this.add.circle(x, y, 50, 0x000000, 0.3).setInteractive().setScrollFactor(0).setDepth(1000);
        this.add.text(x, y, label, {fontSize: '40px'}).setOrigin(0.5).setScrollFactor(0).setDepth(1001);
        btn.on('pointerdown', () => window[action] = true);
        btn.on('pointerup', () => window[action] = false);
        btn.on('pointerout', () => window[action] = false);
    };
    // Увеличил кнопки джойстика, чтобы соответствовать масштабу
    addB(120, h - 180, '▲', 'moveU');
    addB(120, h - 60, '▼', 'moveD');
    addB(60, h - 120, '◀', 'moveL');
    addB(180, h - 120, '▶', 'moveR');
}
