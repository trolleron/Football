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
let player, ball, moveLeft, moveRight;

function preload() {
    // Загружаем гоблина с расчетом 480x480 за кадр
    this.load.spritesheet('goblin_left', 'assets/goblin_run_left.png', { 
        frameWidth: 480, 
        frameHeight: 480 
    });
    this.load.image('ball', 'https://labs.phaser.io/assets/sprites/pangball.png');
}

function create() {
    this.cameras.main.setBackgroundColor('#4488aa');
    let ground = this.add.rectangle(1500, 430, 3000, 40, 0x2e7d32);
    this.physics.add.existing(ground, true);

    // Анимация бега (используем все 12 кадров для плавности)
    this.anims.create({
        key: 'run_left',
        frames: this.anims.generateFrameNumbers('goblin_left', { start: 0, end: 11 }),
        frameRate: 15,
        repeat: -1
    });

    // Создаем игрока и уменьшаем его масштаб (т.к. исходник 480px — это очень много для экрана 800x450)
    player = this.physics.add.sprite(200, 300, 'goblin_left');
    player.setScale(0.25); // Уменьшаем в 4 раза до ~120px
    player.setCollideWorldBounds(true);
    
    // Настраиваем хитбокс (физическое тело), чтобы он был по центру гоблина, а не по всему кадру 480x480
    player.body.setSize(200, 300);
    player.body.setOffset(140, 100);

    ball = this.physics.add.sprite(400, 300, 'ball');
    ball.setCollideWorldBounds(true).setBounce(0.8).setDragX(200);

    this.physics.add.collider(player, ground);
    this.physics.add.collider(ball, ground);
    this.physics.add.collider(player, ball);

    this.cameras.main.startFollow(player, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, 3000, 450);

    setupControls.call(this);
}

function setupControls() {
    let h = 450; let w = 800;
    let btnStyle = { fontSize: '40px', backgroundColor: '#00000088', padding: 15 };

    this.add.text(40, h-100, '◀', btnStyle).setInteractive().setScrollFactor(0)
        .on('pointerdown', () => moveLeft = true).on('pointerup', () => moveLeft = false);
    
    this.add.text(160, h-100, '▶', btnStyle).setInteractive().setScrollFactor(0)
        .on('pointerdown', () => moveRight = true).on('pointerup', () => moveRight = false);

    this.add.text(w-120, h-100, ' B ', btnStyle).setInteractive().setScrollFactor(0)
        .on('pointerdown', () => {
            if(Phaser.Math.Distance.Between(player.x, player.y, ball.x, ball.y) < 80) {
                ball.body.setVelocity(moveLeft ? -1000 : 1000, -400);
            }
        });
}

function update() {
    if (moveLeft) {
        player.setVelocityX(-300);
        player.flipX = false; // Твой спрайт изначально смотрит влево
        player.play('run_left', true);
    } else if (moveRight) {
        player.setVelocityX(300);
        player.flipX = true; // Зеркалим для бега вправо
        player.play('run_left', true);
    } else {
        player.setVelocityX(0);
        player.anims.stop();
        player.setFrame(0);
    }
}
