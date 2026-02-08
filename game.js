const TILE_SIZE = 128;
const COLS = 25; 
const ROWS = 15;

const config = {
    type: Phaser.AUTO,
    scale: { mode: Phaser.Scale.RESIZE, parent: 'game-container', width: '100%', height: '100%' },
    physics: { default: 'arcade', arcade: { gravity: { y: 0 } } },
    scene: { preload, create, update }
};

const game = new Phaser.Game(config);

// Глобальные переменные для джойстика
let joystickBase, joystickStick;
let joyX = 0, joyY = 0; // Значения от -1 до 1
let isDragging = false;
const JOYSTICK_RADIUS = 60; // Радиус движения стика

let player, lastDir = 'd';

function preload() {
    // Твои тайлы и спрайты (оставляем как было)
    const assets = [
        ['grass', 'grass.png'], ['b_down', 'border_down.png'], ['b_left', 'border_left.png'], 
        ['b_right', 'border_right.png'], ['b_up', 'border_up.png'], ['c_ld', 'corner_left_down.png'], 
        ['c_rd', 'corner_right_down.png'], ['c_lu', 'corner_left_up.png'], ['c_ru', 'corner_right_up.png'],
        ['conn_up', 'connection_up.png'], ['conn_down', 'connection_down.png'], ['line_v', 'vertical.png']
    ];
    assets.forEach(a => this.load.image(a[0], `assets/${a[1]}`));

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
    const WORLD_WIDTH = COLS * TILE_SIZE;
    const WORLD_HEIGHT = ROWS * TILE_SIZE;
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // Отрисовка поля (как в прошлом шаге)
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            let tileKey = (x === 12) ? (y === 0 ? 'conn_up' : (y === ROWS-1 ? 'conn_down' : 'line_v')) : 'grass';
            // Простая проверка углов и границ
            if (x!==12) {
                if (x === 0 && y === 0) tileKey = 'c_lu';
                else if (x === COLS-1 && y === 0) tileKey = 'c_ru';
                else if (x === 0 && y === ROWS-1) tileKey = 'c_ld';
                else if (x === COLS-1 && y === ROWS-1) tileKey = 'c_rd';
                else if (y === 0) tileKey = 'b_up';
                else if (y === ROWS-1) tileKey = 'b_down';
                else if (x === 0) tileKey = 'b_left';
                else if (x === COLS-1) tileKey = 'b_right';
            }
            this.add.image(x * TILE_SIZE, y * TILE_SIZE, tileKey).setOrigin(0, 0).setDisplaySize(TILE_SIZE, TILE_SIZE);
        }
    }

    player = this.physics.add.sprite(400, WORLD_HEIGHT / 2, 'idle_d');
    player.setDisplaySize(210, 180).setDepth(5).setCollideWorldBounds(true);
    player.body.setSize(120, 60).setOffset(180, 380);

    this.add.image(WORLD_WIDTH - 150, WORLD_HEIGHT / 2, 'goal_frame').setOrigin(0.5).setDepth(10).setScale(0.5);

    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.startFollow(player, true, 0.1, 0.1);

    setupAnimations.call(this);
    createMobileJoystick.call(this); // ЗАПУСКАЕМ НОВЫЙ ДЖОЙСТИК
}

function update() {
    if (!player) return;

    const speed = 450;
    
    // Если стик отклонен
    if (isDragging) {
        player.setVelocity(joyX * speed, joyY * speed);

        // Выбираем анимацию по доминирующему направлению
        if (Math.abs(joyX) > Math.abs(joyY)) {
            if (joyX > 0) { player.play('run_r', true); lastDir = 'r'; }
            else { player.play('run_l', true); lastDir = 'l'; }
        } else {
            if (joyY > 0) { player.play('run_d', true); lastDir = 'd'; }
            else { player.play('run_u', true); lastDir = 'u'; }
        }
    } else {
        player.setVelocity(0);
        player.play('idle_' + lastDir, true);
    }
}

function createMobileJoystick() {
    const x = 150;
    const y = this.scale.height - 150;

    // Внешнее кольцо
    joystickBase = this.add.circle(x, y, JOYSTICK_RADIUS, 0xffffff, 0.2)
        .setScrollFactor(0).setDepth(1000).setStrokeStyle(2, 0xffffff, 0.5);

    // Сам стик (пипка)
    joystickStick = this.add.circle(x, y, 30, 0xffffff, 0.5)
        .setScrollFactor(0).setDepth(1001);

    // Логика касаний
    this.input.on('pointerdown', (pointer) => {
        // Если нажали в районе джойстика
        if (Phaser.Math.Distance.Between(pointer.x, pointer.y, x, y) < JOYSTICK_RADIUS * 2) {
            isDragging = true;
        }
    });

    this.input.on('pointermove', (pointer) => {
        if (!isDragging) return;

        // Расстояние от центра
        let dist = Phaser.Math.Distance.Between(pointer.x, pointer.y, x, y);
        let angle = Phaser.Math.Angle.Between(pointer.x, pointer.y, x, y);

        // Ограничиваем движение стика радиусом
        if (dist > JOYSTICK_RADIUS) dist = JOYSTICK_RADIUS;

        // Вычисляем смещение
        joyX = -Math.cos(angle) * (dist / JOYSTICK_RADIUS);
        joyY = -Math.sin(angle) * (dist / JOYSTICK_RADIUS);

        // Двигаем визуальный стик
        joystickStick.x = x + (joyX * JOYSTICK_RADIUS);
        joystickStick.y = y + (joyY * JOYSTICK_RADIUS);
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
