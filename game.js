const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 800,
        height: 450
    },
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 1200 }, debug: false }
    },
    scene: { preload, create, update }
};

const game = new Phaser.Game(config);
let player, moveLeft, moveRight;

function preload() {
    // Загружаем бег влево
    this.load.spritesheet('goblin_left', 'assets/goblin_run_left.png', { 
        frameWidth: 480, 
        frameHeight: 480 
    });
    // Загружаем бег вправо (тот файл, что у тебя есть)
    this.load.spritesheet('goblin_right', 'assets/goblin_run_right.png', { 
        frameWidth: 480, 
        frameHeight: 480 
    });
}

function create() {
    this.cameras.main.setBackgroundColor('#4488aa');
    let ground = this.add.rectangle(1500, 430, 3000, 40, 0x2e7d32);
    this.physics.add.existing(ground, true);

    // Анимация бега ВЛЕВО
    this.anims.create({
        key: 'run_l',
        frames: this.anims.generateFrameNumbers('goblin_left', { start: 0, end: 11 }),
        frameRate: 15,
        repeat: -1
    });

    // Анимация бега ВПРАВО
    this.anims.create({
        key: 'run_r',
        frames: this.anims.generateFrameNumbers('goblin_right', { start: 0, end: 11 }),
        frameRate: 15,
        repeat: -1
    });

    // Создаем игрока (начальный спрайт - вправо)
    player = this.physics.add.sprite(200, 300, 'goblin_right');
    player.setScale(0.25);
    player.setCollideWorldBounds(true);
    
    // Хитбокс
    player.body.setSize(200, 350); 
    player.body.setOffset(140, 80);

    this.physics.add.collider(player, ground);

    this.cameras.main.startFollow(player, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, 3000, 450);

    setupControls.call(this);
}

function update() {
    if (moveLeft) {
        player.setVelocityX(-300);
        // Переключаем текстуру на "левую" и запускаем анимацию
        player.setTexture('goblin_left'); 
        player.play('run_l', true);
    } 
    else if (moveRight) {
        player.setVelocityX(300);
        // Переключаем текстуру на "правую" и запускаем анимацию
        player.setTexture('goblin_right');
        player.play('run_r', true);
    } 
    else {
        player.setVelocityX(0);
        player.anims.stop();
        player.setFrame(0); 
    }
}

function setupControls() {
    let h = 450;
    let btnStyle = { fontSize: '50px', backgroundColor: '#00000088', padding: 20 };
    let btnL = this.add.text(50, h-110, '◀', btnStyle).setInteractive().setScrollFactor(0);
    btnL.on('pointerdown', () => moveLeft = true);
    btnL.on('pointerup', () => moveLeft = false);

    let btnR = this.add.text(200, h-110, '▶', btnStyle).setInteractive().setScrollFactor(0);
    btnR.on('pointerdown', () => moveRight = true);
    btnR.on('pointerup', () => moveRight = false);
}
