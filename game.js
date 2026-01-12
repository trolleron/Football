const config = {
    type: Phaser.AUTO,
    scale: { mode: Phaser.Scale.RESIZE, parent: 'game-container', width: '100%', height: '100%' },
    physics: { default: 'arcade', arcade: { gravity: { y: 0 } } },
    scene: { preload, create, update }
};

const game = new Phaser.Game(config);
let player, goals, moveL, moveR, moveU, moveD;
const WORLD_WIDTH = 3000; 

function preload() {
    const frameData = { frameWidth: 480, frameHeight: 480 };
    this.load.spritesheet('gob_l', 'assets/goblin_run_left.png', frameData);
    this.load.spritesheet('gob_r', 'assets/goblin_run_right.png', frameData);
    this.load.spritesheet('gob_u', 'assets/goblin_run_up.png', frameData);
    this.load.spritesheet('gob_d', 'assets/goblin_run_down.png', frameData);
    
    // ЗАГРУЖАЕМ ТВОЙ JPG ФАЙЛ
    this.load.image('stadium', 'assets/field.jpg');
}

function create() {
    const h = this.scale.height;
    const w = this.scale.width;
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, h);

    // 1. Фон стадиона (JPG)
    let bg = this.add.image(0, 0, 'stadium').setOrigin(0, 0);
    // Растягиваем фон, чтобы он закрывал всё игровое пространство
    bg.setDisplaySize(WORLD_WIDTH, h);

    // 2. ВОРОТА (Физические границы)
    goals = this.physics.add.staticGroup();
    // Ставим невидимые штанги в самом конце поля справа
    // Верхняя штанга
    goals.create(WORLD_WIDTH - 20, h/2 - 100, null).setSize(40, 20).setVisible(false);
    // Нижняя штанга
    goals.create(WORLD_WIDTH - 20, h/2 + 100, null).setSize(40, 20).setVisible(false);

    // Рисуем визуальную рамку ворот поверх JPG
    let graphics = this.add.graphics();
    graphics.lineStyle(6, 0xffffff, 0.9);
    graphics.strokeRect(WORLD_WIDTH - 100, h/2 - 100, 100, 200);

    // 3. Персонаж (Гоблин)
    player = this.physics.add.sprite(200, h / 2, 'gob_r');
    player.setScale(0.3).setCollideWorldBounds(true);
    // Настраиваем коллизию так, чтобы он "стоял" на поле
    player.body.setSize(200, 100).setOffset(140, 320);

    this.physics.add.collider(player, goals);

    setupAnims.call(this);
    this.cameras.main.startFollow(player, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, h);

    createJoystick.call(this);
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

function update() {
    player.setVelocity(0);
    const s = 450; // Скорость чуть выше для длинного поля
    if (window.moveL) { player.setVelocityX(-s); player.play('run_l', true); }
    else if (window.moveR) { player.setVelocityX(s); player.play('run_r', true); }
    else if (window.moveU) { player.setVelocityY(-s); player.play('run_u', true); }
    else if (window.moveD) { player.setVelocityY(s); player.play('run_d', true); }
    else { player.anims.stop(); player.setFrame(0); }
}

function createJoystick() {
    const h = this.scale.height;
    const x = 120, y = h - 120, p = 70;
    const btn = (x, y, label, v) => {
        let b = this.add.circle(x, y, 50, 0x000000, 0.4).setInteractive().setScrollFactor(0).setDepth(100);
        this.add.text(x, y, label, {fontSize: '35px'}).setOrigin(0.5).setScrollFactor(0).setDepth(101);
        b.on('pointerdown', () => window[v] = true);
        b.on('pointerup', () => window[v] = false);
    };
    btn(x, y-p, '▲', 'moveU'); btn(x, y+p, '▼', 'moveD');
    btn(x-p, y, '◀', 'moveL'); btn(x+p, y, '▶', 'moveR');
}
