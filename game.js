const TILE_SIZE = 128; // Уменьшили размер тайла
const COLS = 25; 
const ROWS = 15;

const config = {
    type: Phaser.AUTO,
    scale: { 
        mode: Phaser.Scale.RESIZE, 
        parent: 'game-container', 
        width: '100%', 
        height: '100%' 
    },
    physics: { 
        default: 'arcade', 
        arcade: { gravity: { y: 0 } } 
    },
    scene: { preload, create, update }
};

const game = new Phaser.Game(config);

window.moveU = false; window.moveD = false; window.moveL = false; window.moveR = false;
let player, lastDir = 'd';

function preload() {
    // Загрузка тайлов
    const assets = [
        ['grass', 'grass.png'], ['b_down', 'border_down.png'], 
        ['b_left', 'border_left.png'], ['b_right', 'border_right.png'], 
        ['b_up', 'border_up.png'], ['c_ld', 'corner_left_down.png'], 
        ['c_rd', 'corner_right_down.png'], ['c_lu', 'corner_left_up.png'], 
        ['c_ru', 'corner_right_up.png'], ['conn_up', 'connection_up.png'], 
        ['conn_down', 'connection_down.png'], ['line_v', 'vertical.png']
    ];
    assets.forEach(a => this.load.image(a[0], `assets/${a[1]}`));

    // Гоблин
    const spriteCfg = { frameWidth: 480, frameHeight: 480 };
    this.load.spritesheet('idle_l', 'assets/goblin_idle_left.png', spriteCfg);
    this.load.spritesheet('idle_r', 'assets/goblin_idle_right.png', spriteCfg);
    this.load.spritesheet('idle_u', 'assets/goblin_idle_up.png', spriteCfg);
    this.load.spritesheet('idle_d', 'assets/goblin_idle_down.png', spriteCfg);
    this.load.spritesheet('gob_l', 'assets/goblin_run_left.png', spriteCfg);
    this.load.spritesheet('gob_r', 'assets/goblin_run_right.png', spriteCfg);
    this.load.spritesheet('gob_u', 'assets/goblin_run_up.png', spriteCfg);
    this.load.spritesheet('gob_d', 'assets/goblin_run_down.png', spriteCfg);

    this.load.image('goal_frame', 'assets/1000084547.png');
}

function create() {
    const WORLD_WIDTH = COLS * TILE_SIZE;  // 3200 px
    const WORLD_HEIGHT = ROWS * TILE_SIZE; // 1920 px
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // Сборка поля (масштабируем тайлы под 128x128, если исходники были 256)
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            let tileKey = 'grass';
            if (x === 12) {
                if (y === 0) tileKey = 'conn_up';
                else if (y === ROWS - 1) tileKey = 'conn_down';
                else tileKey = 'line_v';
            } 
            else if (x === 0 && y === 0) tileKey = 'c_lu';
            else if (x === COLS - 1 && y === 0) tileKey = 'c_ru';
            else if (x === 0 && y === ROWS - 1) tileKey = 'c_ld';
            else if (x === COLS - 1 && y === ROWS - 1) tileKey = 'c_rd';
            else if (y === 0) tileKey = 'b_up';
            else if (y === ROWS - 1) tileKey = 'b_down';
            else if (x === 0) tileKey = 'b_left';
            else if (x === COLS - 1) tileKey = 'b_right';

            let img = this.add.image(x * TILE_SIZE, y * TILE_SIZE, tileKey).setOrigin(0, 0);
            img.setDisplaySize(TILE_SIZE, TILE_SIZE); // Принудительно ставим 128x128
        }
    }

    // Создание гоблина (210x180)
    player = this.physics.add.sprite(400, WORLD_HEIGHT / 2, 'idle_d');
    player.setDisplaySize(210, 180); 
    player.setDepth(5).setCollideWorldBounds(true);
    
    // Хитбокс для ног (адаптирован под размер 210x180)
    player.body.setSize(100, 50).setOffset(190, 400); 

    // Ворота (уменьшаем масштаб, чтобы не были на пол-поля)
    this.add.image(WORLD_WIDTH - 150, WORLD_HEIGHT / 2, 'goal_frame')
        .setOrigin(0.5).setDepth(10).setScale(0.5);

    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.startFollow(player, true, 0.1, 0.1);

    setupAnimations.call(this);
    createJoystick.call(this);
}

function update() {
    if (!player) return;
    player.setVelocity(0);
    const speed = 450; // Уменьшили скорость, так как поле стало меньше
    let moving = false;

    if (window.moveL) { player.setVelocityX(-speed); player.play('run_l', true); lastDir = 'l'; moving = true; }
    else if (window.moveR) { player.setVelocityX(speed); player.play('run_r', true); lastDir = 'r'; moving = true; }
    
    if (window.moveU) { player.setVelocityY(-speed); if(!moving) player.play('run_u', true); lastDir = 'u'; moving = true; }
    else if (window.moveD) { player.setVelocityY(speed); if(!moving) player.play('run_d', true); lastDir = 'd'; moving = true; }

    if (!moving) player.play('idle_' + lastDir, true);
}

function setupAnimations() {
    const dirs = ['l', 'r', 'u', 'd'];
    dirs.forEach(dir => {
        this.anims.create({
            key: 'run_' + dir,
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
    const xBase = 100, yBase = h - 100, step = 60;
    const addB = (x, y, label, action) => {
        let btn = this.add.circle(x, y, 40, 0x000000, 0.4).setInteractive().setScrollFactor(0).setDepth(1000);
        this.add.text(x, y, label, { fontSize: '30px' }).setOrigin(0.5).setScrollFactor(0).setDepth(1001);
        btn.on('pointerdown', () => window[action] = true);
        btn.on('pointerup', () => window[action] = false);
        btn.on('pointerout', () => window[action] = false);
    };
    addB(xBase, yBase - step, '▲', 'moveU');
    addB(xBase, yBase + step, '▼', 'moveD');
    addB(xBase - step, yBase, '◀', 'moveL');
    addB(xBase + step, yBase, '▶', 'moveR');
}
