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
        arcade: { 
            gravity: { y: 0 }, // ВАЖНО: Убираем гравитацию для свободного бега по полю
            debug: false 
        }
    },
    scene: { preload, create, update }
};

const game = new Phaser.Game(config);
let player, moveL, moveR, moveU, moveD;

function preload() {
    const frameData = { frameWidth: 480, frameHeight: 480 };
    this.load.spritesheet('gob_l', 'assets/goblin_run_left.png', frameData);
    this.load.spritesheet('gob_r', 'assets/goblin_run_right.png', frameData);
    this.load.spritesheet('gob_u', 'assets/goblin_run_up.png', frameData);
    this.load.spritesheet('gob_d', 'assets/goblin_run_down.png', frameData);
}

function create() {
    // Рисуем поле (теперь оно занимает весь экран по высоте)
    this.add.rectangle(1500, 225, 3000, 450, 0x2e7d32);

    // Создаем анимации для всех направлений
    const anims = [
        { key: 'run_l', asset: 'gob_l' },
        { key: 'run_r', asset: 'gob_r' },
        { key: 'run_u', asset: 'gob_u' },
        { key: 'run_d', asset: 'gob_d' }
    ];

    anims.forEach(anim => {
        this.anims.create({
            key: anim.key,
            frames: this.anims.generateFrameNumbers(anim.asset, { start: 0, end: 11 }),
            frameRate: 15,
            repeat: -1
        });
    });

    player = this.physics.add.sprite(200, 225, 'gob_r');
    player.setScale(0.25).setCollideWorldBounds(true);
    
    // Хитбокс для 2D проекции
    player.body.setSize(200, 200); 
    player.body.setOffset(140, 200);

    this.cameras.main.startFollow(player, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, 3000, 450);

    setupControls.call(this);
}

function update() {
    player.setVelocity(0);
    let speed = 300;

    if (moveL) {
        player.setVelocityX(-speed);
        player.setTexture('gob_l');
        player.play('run_l', true);
    } else if (moveR) {
        player.setVelocityX(speed);
        player.setTexture('gob_r');
        player.play('run_r', true);
    } else if (moveU) {
        player.setVelocityY(-speed);
        player.setTexture('gob_u');
        player.play('run_u', true);
    } else if (moveD) {
        player.setVelocityY(speed);
        player.setTexture('gob_d');
        player.play('run_d', true);
    } else {
        player.anims.stop();
        player.setFrame(0);
    }
}

function setupControls() {
    let btnStyle = { fontSize: '40px', backgroundColor: '#00000088', padding: 15 };
    
    // Крестовина управления
    this.add.text(100, 280, '▲', btnStyle).setInteractive().setScrollFactor(0)
        .on('pointerdown', () => moveU = true).on('pointerup', () => moveU = false);
    this.add.text(100, 380, '▼', btnStyle).setInteractive().setScrollFactor(0)
        .on('pointerdown', () => moveD = true).on('pointerup', () => moveD = false);
    this.add.text(30, 330, '◀', btnStyle).setInteractive().setScrollFactor(0)
        .on('pointerdown', () => moveL = true).on('pointerup', () => moveL = false);
    this.add.text(170, 330, '▶', btnStyle).setInteractive().setScrollFactor(0)
        .on('pointerdown', () => moveR = true).on('pointerup', () => moveR = false);
}
