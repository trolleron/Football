const config = {
    type: Phaser.AUTO,
    scale: { mode: Phaser.Scale.RESIZE, parent: 'game-container', width: '100%', height: '100%' },
    physics: { default: 'arcade', arcade: { gravity: { y: 0 } } },
    scene: { preload, create, update }
};

const game = new Phaser.Game(config);
let player, goals, moveL, moveR, moveU, moveD;

const WORLD_WIDTH = 6000; 

function preload() {
    const frameData = { frameWidth: 480, frameHeight: 480 };
    this.load.spritesheet('gob_l', 'assets/goblin_run_left.png', frameData);
    this.load.spritesheet('gob_r', 'assets/goblin_run_right.png', frameData);
    this.load.spritesheet('gob_u', 'assets/goblin_run_up.png', frameData);
    this.load.spritesheet('gob_d', 'assets/goblin_run_down.png', frameData);
    this.load.image('stadium', 'assets/field.jpg');
}

function create() {
    const h = this.scale.height;
    // ТЕПЕРЬ ЕЩЕ ВЫШЕ (в 3 раза выше экрана)
    const WORLD_HEIGHT = h * 3;
    
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // 1. Фон стадиона
    let bg = this.add.image(0, 0, 'stadium').setOrigin(0, 0);
    bg.setDisplaySize(WORLD_WIDTH, WORLD_HEIGHT);

    // 2. ВОРОТА (центровка по новой высоте)
    goals = this.physics.add.staticGroup();
    goals.create(WORLD_WIDTH - 20, WORLD_HEIGHT/2 - 200, null).setSize(40, 40).setVisible(false);
    goals.create(WORLD_WIDTH - 20, WORLD_HEIGHT/2 + 200, null).setSize(40, 40).setVisible(false);

    let graphics = this.add.graphics();
    graphics.lineStyle(10, 0xffffff, 0.9);
    graphics.strokeRect(WORLD_WIDTH - 180, WORLD_HEIGHT/2 - 200, 180, 400);

    // 3. Персонаж
    player = this.physics.add.sprite(200, WORLD_HEIGHT / 2, 'gob_r');
    player.setScale(0.3).setCollideWorldBounds(true);
    player.body.setSize(200, 100).setOffset(140, 320);

    this.physics.add.collider(player, goals);

    setupAnims.call(this);
    
    this.cameras.main.startFollow(player, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // Создаем НОРМАЛЬНЫЙ компактный джойстик
    createSmartJoystick.call(this);
}

function createSmartJoystick() {
    const h = this.scale.height;
    const xBase = 110;  // Отступ от левого края
    const yBase = h - 110; // Отступ от низа
    const dist = 55;   // Расстояние между кнопками

    const makeKey = (x, y, label, action) => {
        let circle = this.add.circle(x, y, 40, 0x000000, 0.4)
            .setInteractive()
            .setScrollFactor(0)
            .setDepth(200);
        
        this.add.text(x, y, label, { fontSize: '32px', color: '#ffffff' })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(201);

        circle.on('pointerdown', () => { window[action] = true; circle.setFillStyle(0xffffff, 0.3); });
        circle.on('pointerup', () => { window[action] = false; circle.setFillStyle(0x000000, 0.4); });
        circle.on('pointerout', () => { window[action] = false; circle.setFillStyle(0x000000, 0.4); });
    };

    // Компактная крестовина
    makeKey(xBase, yBase - dist, '▲', 'moveU');
    makeKey(xBase, yBase + dist, '▼', 'moveD');
    makeKey(xBase - dist, yBase, '◀', 'moveL');
    makeKey(xBase + dist, yBase, '▶', 'moveR');
}

function update() {
    player.setVelocity(0);
    const s = 600; // Скорость увеличена для огромного поля
    if (window.moveL) { player.setVelocityX(-s); player.play('run_l', true); }
    else if (window.moveR) { player.setVelocityX(s); player.play('run_r', true); }
    else if (window.moveU) { player.setVelocityY(-s); player.play('run_u', true); }
    else if (window.moveD) { player.setVelocityY(s); player.play('run_d', true); }
    else { player.anims.stop(); player.setFrame(0); }
}

function setupAnims() {
    const dirs = ['l', 'r', 'u', 'd'];
    dirs.forEach(d => {
        this.anims.create({
            key: 'run_' + d,
            frames: this.anims.generateFrameNumbers('gob_' + d, { start: 0, end: 11 }),
            frameRate: 15, repeat: -1
        });
    });
}
