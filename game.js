const TILE_SIZE = 128;
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

// Глобальные переменные управления
let joystickBase, joystickStick, player, lastDir = 'd';
let joyX = 0, joyY = 0, isDragging = false;
const JOYSTICK_RADIUS = 60;

function preload() {
    // 1. Загрузка базовых тайлов поля
    const baseTiles = [
        ['grass', 'grass.png'], ['b_down', 'border_down.png'], ['b_left', 'border_left.png'], 
        ['b_right', 'border_right.png'], ['b_up', 'border_up.png'], ['c_ld', 'corner_left_down.png'], 
        ['c_rd', 'corner_right_down.png'], ['c_lu', 'corner_left_up.png'], ['c_ru', 'corner_right_up.png'],
        ['conn_up', 'connection_up.png'], ['conn_down', 'connection_down.png'], ['line_v', 'vertical.png']
    ];
    baseTiles.forEach(t => this.load.image(t[0], `assets/${t[1]}`));

    // 2. Загрузка тайлов центрального круга
    for (let i = 1; i <= 8; i++) {
        let name = `circle_0${i}`;
        this.load.image(name, `assets/${name}.png`);
    }
    this.load.image('center_dot', 'assets/center.png');

    // 3. Загрузка гоблина (8 направлений: idle и run)
    const spriteCfg = { frameWidth: 480, frameHeight: 480 };
    const states = ['idle', 'run'];
    const dirs = ['l', 'r', 'u', 'd'];
    
    dirs.forEach(d => {
        this.load.spritesheet(`idle_${d}`, `assets/goblin_idle_${getDirName(d)}.png`, spriteCfg);
        this.load.spritesheet(`run_${d}`, `assets/goblin_run_${getDirName(d)}.png`, spriteCfg);
    });

    // 4. Прочее
    this.load.image('goal_frame', 'assets/1000084547.png');
}

function create() {
    const WORLD_WIDTH = COLS * TILE_SIZE;
    const WORLD_HEIGHT = ROWS * TILE_SIZE;
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // --- ГЕНЕРАЦИЯ КАРТЫ ---
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            let tileKey = 'grass';

            // Приоритет 1: Центральный круг (сетка 3x3 вокруг центра)
            if (x === 11 && y === 6) tileKey = 'circle_01';
            else if (x === 12 && y === 6) tileKey = 'circle_02';
            else if (x === 13 && y === 6) tileKey = 'circle_03';
            else if (x === 13 && y === 7) tileKey = 'circle_04';
            else if (x === 13 && y === 8) tileKey = 'circle_05';
            else if (x === 12 && y === 8) tileKey = 'circle_06';
            else if (x === 11 && y === 8) tileKey = 'circle_07';
            else if (x === 11 && y === 7) tileKey = 'circle_08';
            else if (x === 12 && y === 7) tileKey = 'center_dot';

            // Приоритет 2: Центральная линия (вертикаль)
            else if (x === 12) {
                if (y === 0) tileKey = 'conn_up';
                else if (y === ROWS - 1) tileKey = 'conn_down';
                else tileKey = 'line_v';
            }

            // Приоритет 3: Внешние границы и углы
            else if (x === 0 && y === 0) tileKey = 'c_lu';
            else if (x === COLS - 1 && y === 0) tileKey = 'c_ru';
            else if (x === 0 && y === ROWS - 1) tileKey = 'c_ld';
            else if (x === COLS - 1 && y === ROWS - 1) tileKey = 'c_rd';
            else if (y === 0) tileKey = 'b_up';
            else if (y === ROWS - 1) tileKey = 'b_down';
            else if (x === 0) tileKey = 'b_left';
            else if (x === COLS - 1) tileKey = 'b_right';

            this.add.image(x * TILE_SIZE, y * TILE_SIZE, tileKey)
                .setOrigin(0, 0)
                .setDisplaySize(TILE_SIZE, TILE_SIZE);
        }
    }

    // --- ПЕРСОНАЖ ---
    player = this.physics.add.sprite(WORLD_WIDTH / 4, WORLD_HEIGHT / 2, 'idle_d');
    player.setDisplaySize(210, 180).setDepth(5).setCollideWorldBounds(true);
    // Настройка хитбокса только под ногами
    player.body.setSize(120, 60).setOffset(180, 380);

    // --- ОБЪЕКТЫ ---
    this.add.image(WORLD_WIDTH - 150, WORLD_HEIGHT / 2, 'goal_frame')
        .setOrigin(0.5).setDepth(10).setScale(0.5);

    // --- КАМЕРА ---
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.startFollow(player, true, 0.1, 0.1);

    setupAnimations.call(this);
    createMobileJoystick.call(this);
}

function update() {
    if (!player) return;

    const speed = 450;

    if (isDragging) {
        // Движение по вектору джойстика
        player.setVelocity(joyX * speed, joyY * speed);

        // Выбор анимации по углу наклона
        if (Math.abs(joyX) > Math.abs(joyY)) {
            if (joyX > 0) { player.play('run_r', true); lastDir = 'r'; }
            else { player.play('run_l', true); lastDir = 'l'; }
        } else {
            if (joyY > 0) { player.play('run_d', true); lastDir = 'd'; }
            else { player.play('run_u', true); lastDir = 'u'; }
        }
    } else {
        player.setVelocity(0);
        player.play(`idle_${lastDir}`, true);
    }
}

function createMobileJoystick() {
    const x = 150;
    const y = this.scale.height - 150;

    joystickBase = this.add.circle(x, y, JOYSTICK_RADIUS, 0xffffff, 0.15)
        .setScrollFactor(0).setDepth(1000).setStrokeStyle(3, 0xffffff, 0.5);

    joystickStick = this.add.circle(x, y, 35, 0xffffff, 0.4)
        .setScrollFactor(0).setDepth(1001);

    this.input.on('pointerdown', (pointer) => {
        if (Phaser.Math.Distance.Between(pointer.x, pointer.y, x, y) < JOYSTICK_RADIUS * 2.5) {
            isDragging = true;
        }
    });

    this.input.on('pointermove', (pointer) => {
        if (!isDragging) return;

        let dist = Phaser.Math.Distance.Between(pointer.x, pointer.y, x, y);
        let angle = Phaser.Math.Angle.Between(x, y, pointer.x, pointer.y);

        if (dist > JOYSTICK_RADIUS) dist = JOYSTICK_RADIUS;

        joyX = Math.cos(angle) * (dist / JOYSTICK_RADIUS);
        joyY = Math.sin(angle) * (dist / JOYSTICK_RADIUS);

        joystickStick.x = x + (Math.cos(angle) * dist);
        joystickStick.y = y + (Math.sin(angle) * dist);
    });

    this.input.on('pointerup', () => {
        isDragging = false;
        joyX = 0; joyY = 0;
        joystickStick.x = x;
        joystickStick.y = y;
    });
}

function setupAnimations() {
    const dirs = ['l', 'r', 'u', 'd'];
    dirs.forEach(d => {
        this.anims.create({
            key: `run_${d}`,
            frames: this.anims.generateFrameNumbers(`run_${d}`, { start: 0, end: 11 }),
            frameRate: 16, repeat: -1
        });
        this.anims.create({
            key: `idle_${d}`,
            frames: this.anims.generateFrameNumbers(`idle_${d}`, { start: 0, end: 15 }),
            frameRate: 12, repeat: -1
        });
    });
}

function getDirName(d) {
    const names = { 'l': 'left', 'r': 'right', 'u': 'up', 'd': 'down' };
    return names[d];
}
