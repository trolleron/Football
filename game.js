const TILE_SIZE = 256;
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
        arcade: { gravity: { y: 0 }, debug: false } 
    },
    scene: { preload, create, update }
};

const game = new Phaser.Game(config);

// Инициализируем переменные управления в объекте window, чтобы они были доступны везде
window.moveU = false; window.moveD = false; window.moveL = false; window.moveR = false;

let player, lastDir = 'd';

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

    // Тайлы разметки
    this.load.image('conn_up', 'assets/connection_up.png');
    this.load.image('conn_down', 'assets/connection_down.png');
    this.load.image('line_v', 'assets/vertical.png'); 

    // Спрайты гоблина (все 8 файлов)
    const spriteCfg = { frameWidth: 480, frameHeight: 480 };
    this.load.spritesheet('idle_l', 'assets/goblin_idle_left.png', spriteCfg);
    this.load.spritesheet('idle_r', 'assets/goblin_idle_right.png', spriteCfg);
    this.load.spritesheet('idle_u', 'assets/goblin_idle_up.png', spriteCfg);
    this.load.spritesheet('idle_d', 'assets/goblin_idle_down.png', spriteCfg);
    this.load.spritesheet('gob_l', 'assets/goblin_run_left.png', spriteCfg);
    this.load.spritesheet('gob_r', 'assets/goblin_run_right.png', spriteCfg);
    this.load.spritesheet('gob_u', 'assets/goblin_run_up.png', spriteCfg);
    this.load.spritesheet('gob_d', 'assets/goblin_run_down.png', spriteCfg);

    // Ворота
    this.load.image('goal_frame', 'assets/1000084547.png');
}

function create() {
    const WORLD_WIDTH = COLS * TILE_SIZE;
    const WORLD_HEIGHT = ROWS * TILE_SIZE;
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // Сборка поля
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

            this.add.image(x * TILE_SIZE, y * TILE_SIZE, tileKey).setOrigin(0, 0).setDepth(0);
        }
    }

    // Создание гоблина (280x240)
    player = this.physics.add.sprite(500, WORLD_HEIGHT / 2, 'idle_d');
    player.setDisplaySize(280, 240); 
    player.setDepth(5).setCollideWorldBounds(true);
    // Точный хитбокс для ног
    player.body.setSize(120, 60).setOffset(180, 380); 

    // Ворота
    this.add.image(WORLD_WIDTH - 250, WORLD_HEIGHT / 2, 'goal_frame')
        .setOrigin(0.5).setDepth(10).setScale(0.8);

    // Настройка камеры
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.startFollow(player, true, 0.1, 0.1);

    // Запуск функций
    setupAnimations.call(this);
    createJoystick.call(this);
}

function update() {
    if (!player) return;

    player.setVelocity(0);
    const speed = 600;
    let moving = false;

    // Управление по 4 осям
    if (window.moveL) { 
        player.setVelocityX(-speed); player.play('run_l', true); lastDir = 'l'; moving = true; 
    } else if (window.moveR) { 
        player.setVelocityX(speed); player.play('run_r', true); lastDir = 'r'; moving = true; 
    }
    
    if (window.moveU) { 
        player.setVelocityY(-speed); if(!moving) player.play('run_u', true); lastDir = 'u'; moving = true; 
    } else if (window.moveD) { 
        player.setVelocityY(speed); if(!moving) player.play('run_d', true); lastDir = 'd'; moving = true; 
    }

    // Если не движемся — включаем Idle нужного направления
    if (!moving) {
        player.play('idle_' + lastDir, true);
    }
}

function setupAnimations() {
    const dirs = ['l', 'r', 'u', 'd'];
    dirs.forEach(dir => {
        // Анимация бега
        this.anims.create({
            key: 'run_' + dir,
            frames: this.anims.generateFrameNumbers('gob_' + dir, { start: 0, end: 11 }),
            frameRate: 15, repeat: -1
        });
        // Анимация покоя
        this.anims.create({
            key: 'idle_' + dir,
            frames: this.anims.generateFrameNumbers('idle_' + dir, { start: 0, end: 15 }),
            frameRate: 12, repeat: -1
        });
    });
}

function createJoystick() {
    const h = this.scale.height;
    // Базовые координаты (левый нижний угол)
    const xBase = 120, yBase = h - 120, step = 70;

    const addB = (x, y, label, action) => {
        let btn = this.add.circle(x, y, 45, 0x000000, 0.4)
            .setInteractive()
            .setScrollFactor(0) // Важно: джойстик не должен улетать вместе с камерой
            .setDepth(1000);
        
        this.add.text(x, y, label, { fontSize: '35px', color: '#ffffff' })
            .setOrigin(0.5).setScrollFactor(0).setDepth(1001);

        btn.on('pointerdown', () => { window[action] = true; btn.setAlpha(0.7); });
        btn.on('pointerup', () => { window[action] = false; btn.setAlpha(0.4); });
        btn.on('pointerout', () => { window[action] = false; btn.setAlpha(0.4); });
    };

    addB(xBase, yBase - step, '▲', 'moveU');
    addB(xBase, yBase + step, '▼', 'moveD');
    addB(xBase - step, yBase, '◀', 'moveL');
    addB(xBase + step, yBase, '▶', 'moveR');
}
