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
let player, net, posts, goals, moveL, moveR, moveU, moveD;
let lastDir = 'd';
const WORLD_WIDTH = 6000;

function preload() {
    const frameSize = 480;
    const spriteCfg = { frameWidth: frameSize, frameHeight: frameSize };
    
    // Загрузка спрайтов гоблина
    this.load.spritesheet('idle_l', 'assets/goblin_idle_left.png', spriteCfg);
    this.load.spritesheet('idle_r', 'assets/goblin_idle_right.png', spriteCfg);
    this.load.spritesheet('idle_u', 'assets/goblin_idle_up.png', spriteCfg);
    this.load.spritesheet('idle_d', 'assets/goblin_idle_down.png', spriteCfg);
    this.load.spritesheet('gob_l', 'assets/goblin_run_left.png', spriteCfg);
    this.load.spritesheet('gob_r', 'assets/goblin_run_right.png', spriteCfg);
    this.load.spritesheet('gob_u', 'assets/goblin_run_up.png', spriteCfg);
    this.load.spritesheet('gob_d', 'assets/goblin_run_down.png', spriteCfg);
    
    // Окружение
    this.load.image('stadium', 'assets/field.jpg');
    this.load.image('goal_posts', 'assets/goal_posts.png');
    this.load.image('goal_net', 'assets/goal_net.png');
}

function create() {
    const h = this.scale.height;
    const WORLD_HEIGHT = h * 3;
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // 1. ФОН (Самый низ)
    let bg = this.add.image(0, 0, 'stadium').setOrigin(0, 0).setDepth(0);
    bg.setDisplaySize(WORLD_WIDTH, WORLD_HEIGHT);

    const goalX = WORLD_WIDTH - 250;
    const goalY = WORLD_HEIGHT / 2;

    // 2. СЕТКА ВОРОТ (За игроком)
    net = this.add.image(goalX, goalY, 'goal_net').setOrigin(0.5).setDepth(1);
    net.setScale(1.1).setAlpha(0.8);

    // 3. ИГРОК (Между сеткой и штангами)
    player = this.physics.add.sprite(400, goalY, 'idle_d');
    player.setScale(0.25).setDepth(5).setCollideWorldBounds(true);
    player.body.setSize(200, 100).setOffset(140, 320);

    // 4. ШТАНГИ (Над игроком)
    posts =
