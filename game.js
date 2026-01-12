const config = {
    type: Phaser.AUTO,
    scale: { 
        mode: Phaser.Scale.RESIZE, // Растягивает игру под размер экрана
        parent: 'game-container', 
        width: '100%', 
        height: '100%' 
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
    
    // Загрузка Idle
    this.load.spritesheet('idle_l', 'assets/goblin_idle_left.png', idleFrames);
    this.load.spritesheet('idle_r', 'assets/goblin_idle_right.png', idleFrames);
    this.load.spritesheet('idle_u', 'assets/goblin_idle_up.png', idleFrames);
    this.load.spritesheet('idle_d', 'assets/goblin_idle_down.png', idleFrames);

    // Загрузка бега
    this.load.spritesheet('gob_l', 'assets/goblin_run_left.png', idleFrames);
    this.load.spritesheet('gob_r', 'assets/goblin_run_right.png', idleFrames);
    this.load.spritesheet('gob_u', 'assets/goblin_run_up.png', idleFrames);
    this.load.spritesheet('gob_d', 'assets/goblin_run_down.png', idleFrames);
    
    this.load.image('stadium', 'assets/field.jpg');
}

function create() {
    const h = this.scale.height;
    const WORLD_HEIGHT = h * 3; 
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    let bg = this.add.image(0, 0, 'stadium').setOrigin(0, 0);
    bg.setDisplaySize(WORLD_WIDTH, WORLD_HEIGHT);

    // Создание анимаций
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

    // --- ИСПРАВЛЕНИЕ РАЗМЕРА ---
    player = this.physics.add.sprite(200, WORLD_HEIGHT / 2, 'idle_d');
    player.setScale(0.2); // Если всё еще большой, поставь 0.15
    player.setCollideWorldBounds(true);
    
    // Подгоняем хитбокс под новый масштаб
    player.body.setSize(200, 100).setOffset(140, 320);

    this.cameras.main.startFollow(player, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    createCompactJoystick.call(this);

    // Попытка скрыть полосу (работает после первого клика по экрану)
    this.input.on('pointerdown', () => {
        if (!this.scale.isFullscreen) {
            this.scale.startFullscreen();
        }
    });
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

function createCompactJoystick() {
    const h = this.scale.height;
    const xBase = 80, yBase = h - 80, step = 45; // Еще компактнее

    const addBtn = (x, y, label, act) => {
        let circle = this.add.circle(x, y, 35, 0x000000, 0.2) // Прозрачнее (0.2)
            .setInteractive()
            .setScrollFactor(0)
            .setDepth(200);
        
        this.add.text(x, y, label, {fontSize: '24px', color: '#ffffff'})
            .setOrigin(0.5).setScrollFactor(0).setDepth(201);

        circle.on('pointerdown', () => { window[act] = true; circle.setAlpha(0.5); });
        circle.on('pointerup', () => { window[act] = false; circle.setAlpha(0.2); });
        circle.on('pointerout', () => { window[act] = false; circle.setAlpha(0.2); });
    };

    addBtn(xBase, yBase - step, '▲', 'moveU');
    addBtn(xBase, yBase + step, '▼', 'moveD');
    addBtn(xBase - step, yBase, '◀', 'moveL');
    addBtn(xBase + step, yBase, '▶', 'moveR');
}
