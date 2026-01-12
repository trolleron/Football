const config = {
    type: Phaser.AUTO,
    scale: { mode: Phaser.Scale.RESIZE, parent: 'game-container', width: '100%', height: '100%' },
    physics: { default: 'arcade', arcade: { gravity: { y: 0 } } },
    scene: { preload, create, update }
};

const game = new Phaser.Game(config);
let player, net, posts, goals, moveL, moveR, moveU, moveD, lastDir = 'd';
const WORLD_WIDTH = 6000;

function preload() {
    const frameSize = 480;
    const spriteCfg = { frameWidth: frameSize, frameHeight: frameSize };
    
    // Гоблин
    this.load.spritesheet('idle_l', 'assets/goblin_idle_left.png', spriteCfg);
    this.load.spritesheet('idle_r', 'assets/goblin_idle_right.png', spriteCfg);
    this.load.spritesheet('idle_u', 'assets/goblin_idle_up.png', spriteCfg);
    this.load.spritesheet('idle_d', 'assets/goblin_idle_down.png', spriteCfg);
    this.load.spritesheet('gob_l', 'assets/goblin_run_left.png', spriteCfg);
    this.load.spritesheet('gob_r', 'assets/goblin_run_right.png', spriteCfg);
    this.load.spritesheet('gob_u', 'assets/goblin_run_up.png', spriteCfg);
    this.load.spritesheet('gob_d', 'assets/goblin_run_down.png', spriteCfg);
    
    // ТВОИ КАРТИНКИ
    this.load.image('stadium', 'assets/field.jpg');
    this.load.image('goal_posts', 'assets/1000084547.png'); // Твои штанги
    this.load.image('goal_net', 'assets/1000084550.png');   // Твоя сетка
}

function create() {
    const h = this.scale.height;
    const WORLD_HEIGHT = h * 3;
    const goalX = WORLD_WIDTH - 200;
    const goalY = WORLD_HEIGHT / 2;

    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.add.image(0, 0, 'stadium').setOrigin(0, 0).setDisplaySize(WORLD_WIDTH, WORLD_HEIGHT);

    // 1. СЕТКА (Рисуем её чуть растянутой, чтобы закрыть проем ворот)
    // Мы используем TileSprite, чтобы сетка могла "дрожать" внутри
    net = this.add.tileSprite(goalX + 30, goalY, 200, 320, 'goal_net').setDepth(1);
    net.setAlpha(0.6); // Сетка должна быть прозрачной

    // 2. ИГРОК
    player = this.physics.add.sprite(400, goalY, 'idle_d');
    player.setScale(0.25).setDepth(5).setCollideWorldBounds(true);
    player.body.setSize(200, 100).setOffset(140, 320);

    // 3. ШТАНГИ (Поверх игрока)
    posts = this.add.image(goalX, goalY, 'goal_posts').setOrigin(0.5).setDepth(10);
    posts.setScale(0.7); // Подгоняем размер под масштаб гоблина

    // 4. ФИЗИКА (Чтобы гоблин не ходил сквощий штанги)
    goals = this.physics.add.staticGroup();
    goals.create(goalX - 50, goalY - 145, null).setSize(100, 20).setVisible(false); // Верхняя штанга
    goals.create(goalX - 50, goalY + 145, null).setSize(100, 20).setVisible(false); // Нижняя штанга
    goals.create(goalX + 100, goalY, null).setSize(20, 300).setVisible(false);      // Зад ворот
    this.physics.add.collider(player, goals);

    setupAnimations.call(this);
    this.cameras.main.startFollow(player, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    createJoystick.call(this);
}

function update() {
    player.setVelocity(0);
    const s = 600;
    let moving = false;

    if (window.moveL) { player.setVelocityX(-s); player.play('run_l', true); lastDir = 'l'; moving = true; }
    else if (window.moveR) { player.setVelocityX(s); player.play('run_r', true); lastDir = 'r'; moving = true; }
    if (window.moveU) { player.setVelocityY(-s); if(!moving) player.play('run_u', true); lastDir = 'u'; moving = true; }
    else if (window.moveD) { player.setVelocityY(s); if(!moving) player.play('run_d', true); lastDir = 'd'; moving = true; }

    if (!moving) player.play('idle_' + lastDir, true);

    // ОЖИВЛЯЕМ СЕТКУ: если гоблин касается зоны ворот, сетка "колышется"
    if (player.x > WORLD_WIDTH - 350 && Math.abs(player.y - (this.scale.height * 3 / 2)) < 150) {
        net.tilePositionX += 2; // Смещение текстуры создает эффект шевеления
        net.tilePositionY += Math.sin(this.time.now / 100) * 2;
    }
}

// Вспомогательные функции анимаций и джойстика остаются прежними
function setupAnimations() {
    ['l', 'r', 'u', 'd'].forEach(d => {
        this.anims.create({ key: 'run_'+d, frames: this.anims.generateFrameNumbers('gob_'+d, {start:0, end:11}), frameRate:15, repeat:-1 });
        this.anims.create({ key: 'idle_'+d, frames: this.anims.generateFrameNumbers('idle_'+d, {start:0, end:15}), frameRate:12, repeat:-1 });
    });
}

function createJoystick() {
    const h = this.scale.height;
    const addB = (x, y, l, a) => {
        let c = this.add.circle(x, y, 40, 0x000000, 0.3).setInteractive().setScrollFactor(0).setDepth(1000);
        this.add.text(x, y, l, {fontSize:'30px'}).setOrigin(0.5).setScrollFactor(0).setDepth(1001);
        c.on('pointerdown', () => window[a] = true);
        c.on('pointerup', () => window[a] = false);
        c.on('pointerout', () => window[a] = false);
    };
    addB(100, h-155, '▲', 'moveU'); addB(100, h-45, '▼', 'moveD');
    addB(45, h-100, '◀', 'moveL'); addB(155, h-100, '▶', 'moveR');
}
