const config = {
    type: Phaser.AUTO,
    scale: { 
        mode: Phaser.Scale.FIT, // Изменил на FIT для лучшей работы в Telegram
        parent: 'game-container', 
        width: 1280, // Фиксированная ширина для стабильности
        height: 720,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: { default: 'arcade', arcade: { gravity: { y: 0 } } },
    scene: { preload, create, update }
};

const game = new Phaser.Game(config);
let player, moveL, moveR, moveU, moveD;
let lastDir = 'd';
const WORLD_WIDTH = 6000;

function preload() {
    const frameSize = 480; 
    const idleFrames = { frameWidth: frameSize, frameHeight: frameSize };
    
    // Загрузка (проверь пути к файлам!)
    this.load.spritesheet('idle_l', 'assets/goblin_idle_left.png', idleFrames);
    this.load.spritesheet('idle_r', 'assets/goblin_idle_right.png', idleFrames);
    this.load.spritesheet('idle_u', 'assets/goblin_idle_up.png', idleFrames);
    this.load.spritesheet('idle_d', 'assets/goblin_idle_down.png', idleFrames);
    this.load.spritesheet('gob_l', 'assets/goblin_run_left.png', idleFrames);
    this.load.spritesheet('gob_r', 'assets/goblin_run_right.png', idleFrames);
    this.load.spritesheet('gob_u', 'assets/goblin_run_up.png', idleFrames);
    this.load.spritesheet('gob_d', 'assets/goblin_run_down.png', idleFrames);
    this.load.image('stadium', 'assets/field.jpg');
}

function create() {
    const gameW = this.scale.width;
    const gameH = this.scale.height;
    const WORLD_HEIGHT = gameH * 3; 

    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    let bg = this.add.image(0, 0, 'stadium').setOrigin(0, 0);
    bg.setDisplaySize(WORLD_WIDTH, WORLD_HEIGHT);

    // Анимации
    const dirs = ['l', 'r', 'u', 'd'];
    dirs.forEach(d => {
        this.anims.create({
            key: 'run_' + d,
            frames: this.anims.generateFrameNumbers('gob_' + d, { start: 0, end: 11 }),
            frameRate: 15, repeat: -1
        });
        this.anims.create({
            key: 'idle_' + d,
            frames: this.anims.generateFrameNumbers('idle_' + d, { start: 0, end: 15 }),
            frameRate: 12, repeat: -1
        });
    });

    // --- ИСПРАВЛЕННЫЙ РАЗМЕР ---
    player = this.physics.add.sprite(400, WORLD_HEIGHT / 2, 'idle_d');
    player.setScale(0.35); // Этот размер должен быть как на твоем скрине
    player.setCollideWorldBounds(true);
    player.body.setSize(220, 150).setOffset(130, 300);

    this.cameras.main.startFollow(player, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // Рисуем джойстик поверх всего
    createFixedJoystick.call(this);
}

function createFixedJoystick() {
    const gameH = this.scale.height;
    // Смещаем джойстик чуть выше, чтобы не перекрывался системными кнопками
    const xBase = 120, yBase = gameH - 120, step = 65;

    const addBtn = (x, y, label, act) => {
        let btn = this.add.circle(x, y, 45, 0x000000, 0.4)
            .setInteractive()
            .setScrollFactor(0) // ВАЖНО: джойстик не уезжает с камерой
            .setDepth(1000);
        
        this.add.text(x, y, label, {fontSize: '32px', color: '#ffffff'})
            .setOrigin(0.5).setScrollFactor(0).setDepth(1001);

        btn.on('pointerdown', () => { window[act] = true; btn.setAlpha(0.8); });
        btn.on('pointerup', () => { window[act] = false; btn.setAlpha(0.4); });
        btn.on('pointerout', () => { window[act] = false; btn.setAlpha(0.4); });
    };

    addBtn(xBase, yBase - step, '▲', 'moveU');
    addBtn(xBase, yBase + step, '▼', 'moveD');
    addBtn(xBase - step, yBase, '◀', 'moveL');
    addBtn(xBase + step, yBase, '▶', 'moveR');
}

function update() {
    player.setVelocity(0);
    const s = 600; 
    let moving = false;

    if (window.moveL) { player.setVelocityX(-s); player.play('run_l', true); lastDir = 'l'; moving = true; }
    else if (window.moveR) { player.setVelocityX(s); player.play('run_r', true); lastDir = 'r'; moving = true; }
    
    if (window.moveU) { 
        player.setVelocityY(-s); 
        if(!moving) { player.play('run_u', true); lastDir = 'u'; }
        moving = true; 
    } else if (window.moveD) { 
        player.setVelocityY(s); 
        if(!moving) { player.play('run_d', true); lastDir = 'd'; }
        moving = true; 
    }

    if (!moving) {
        player.play('idle_' + lastDir, true);
    }
}
