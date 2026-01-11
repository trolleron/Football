const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 450,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 1000 },
            debug: false
        }
    },
    scene: { preload, create, update }
};

const game = new Phaser.Game(config);

let player, ball, cursors, moveLeft, moveRight, isJumping = false;

function preload() {
    // Используем готовые ассеты из библиотеки Phaser для быстрой проверки
    this.load.image('ball', 'https://labs.phaser.io/assets/sprites/pangball.png');
    this.load.image('player', 'https://labs.phaser.io/assets/sprites/phaser-dude.png');
}

function create() {
    // 1. Создаем мир (длинное поле)
    this.physics.world.setBounds(0, 0, 2000, 450);

    // 2. Рисуем газон
    let ground = this.add.rectangle(1000, 435, 2000, 30, 0x2e7d32);
    this.physics.add.existing(ground, true);

    // 3. Ворота (простые штанги)
    let leftGoal = this.add.rectangle(50, 350, 10, 150, 0xffffff);
    let rightGoal = this.add.rectangle(1950, 350, 10, 150, 0xffffff);
    this.physics.add.existing(leftGoal, true);
    this.physics.add.existing(rightGoal, true);

    // 4. Игрок
    player = this.physics.add.sprite(200, 300, 'player');
    player.setCollideWorldBounds(true);
    player.setBounce(0.1);

    // 5. Мяч (с высокой прыгучестью как в Goal 3)
    ball = this.physics.add.sprite(400, 300, 'ball');
    ball.setCollideWorldBounds(true);
    ball.setBounce(0.8);
    ball.setDragX(200);
    ball.setCircle(15);

    // 6. Столкновения
    this.physics.add.collider(player, ground);
    this.physics.add.collider(ball, ground);
    this.physics.add.collider(player, ball);

    // 7. Камера
    this.cameras.main.startFollow(player, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, 2000, 450);

    // 8. СЕНСОРНОЕ УПРАВЛЕНИЕ (Кнопки на экране)
    createTouchControls.call(this);
}

function createTouchControls() {
    // Кнопка Влево
    let btnL = this.add.circle(80, 380, 40, 0xffffff, 0.3).setInteractive().setScrollFactor(0);
    btnL.on('pointerdown', () => { moveLeft = true; });
    btnL.on('pointerup', () => { moveLeft = false; });

    // Кнопка Вправо
    let btnR = this.add.circle(180, 380, 40, 0xffffff, 0.3).setInteractive().setScrollFactor(0);
    btnR.on('pointerdown', () => { moveRight = true; });
    btnR.on('pointerup', () => { moveRight = false; });

    // Кнопка Прыжок/Удар
    let btnJump = this.add.circle(720, 380, 45, 0xff0000, 0.5).setInteractive().setScrollFactor(0);
    btnJump.on('pointerdown', () => {
        if (player.body.touching.down) player.setVelocityY(-550);
        // Если игрок рядом с мячом при нажатии - бьем!
        let dist = Phaser.Math.Distance.Between(player.x, player.y, ball.x, ball.y);
        if (dist < 60) {
            ball.setVelocity(800, -300);
        }
    });
}

function update() {
    if (moveLeft) {
        player.setVelocityX(-200);
        player.flipX = true;
    } else if (moveRight) {
        player.setVelocityX(200);
        player.flipX = false;
    } else {
        player.setVelocityX(0);
    }
}
