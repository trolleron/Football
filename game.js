const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT, // Растягивает под экран
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 800,
        height: 450
    },
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 1000 }, debug: false }
    },
    scene: { preload, create, update }
};

const game = new Phaser.Game(config);
let player, ball, moveLeft, moveRight, btnJump, btnKick;

function preload() {
    // Пока мы не загрузили спрайты Кунио-куна, создадим временные текстуры кодом
}

function create() {
    // Фон - небо (градиент)
    this.cameras.main.setBackgroundColor('#4488aa');

    // Огромное поле (3000 пикселей в длину)
    this.physics.world.setBounds(0, 0, 3000, 450);

    // Газон с разметкой
    let ground = this.add.rectangle(1500, 430, 3000, 40, 0x2e7d32);
    this.physics.add.existing(ground, true);

    // Линии разметки
    for(let i=0; i<3000; i+=200) {
        this.add.rectangle(i, 430, 2, 40, 0xffffff, 0.3);
    }

    // Ворота (как в Goal 3 - штанги с физикой)
    let goalLeft = this.add.rectangle(10, 300, 20, 260, 0xffffff);
    this.physics.add.existing(goalLeft, true);
    
    let goalRight = this.add.rectangle(2990, 300, 20, 260, 0xffffff);
    this.physics.add.existing(goalRight, true);

    // Персонаж (Белый квадрат - временный Кунио)
    player = this.add.rectangle(200, 300, 40, 60, 0xffffff);
    this.physics.add.existing(player);
    player.body.setCollideWorldBounds(true);

    // Мяч (Красный - временный)
    ball = this.add.circle(400, 300, 15, 0xff0000);
    this.physics.add.existing(ball);
    ball.body.setCollideWorldBounds(true);
    ball.body.setBounce(0.8); // Прыгучий как в Goal 3
    ball.body.setDragX(200);

    // Столкновения
    this.physics.add.collider(player, ground);
    this.physics.add.collider(ball, ground);
    this.physics.add.collider(player, ball);

    // Камера
    this.cameras.main.startFollow(player, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, 3000, 450);

    // КНОПКИ (Сенсорное управление)
    setupControls.call(this);
}

function setupControls() {
    let w = 800; let h = 450;
    let btnStyle = { fontSize: '40px', backgroundColor: '#00000088', padding: 15 };

    // Джойстик влево/вправо
    this.add.text(40, h-100, '◀', btnStyle).setInteractive().setScrollFactor(0)
        .on('pointerdown', () => moveLeft = true).on('pointerup', () => moveLeft = false);
    
    this.add.text(160, h-100, '▶', btnStyle).setInteractive().setScrollFactor(0)
        .on('pointerdown', () => moveRight = true).on('pointerup', () => moveRight = false);

    // Кнопка A (Прыжок)
    this.add.text(w-220, h-100, ' A ', btnStyle).setInteractive().setScrollFactor(0)
        .on('pointerdown', () => { if(player.body.touching.down) player.body.setVelocityY(-600) });

    // Кнопка B (Удар)
    this.add.text(w-100, h-100, ' B ', btnStyle).setInteractive().setScrollFactor(0)
        .on('pointerdown', () => {
            let dist = Phaser.Math.Distance.Between(player.x, player.y, ball.x, ball.y);
            if(dist < 70) ball.body.setVelocity(1000, -400); // Сильный удар
        });
}

function update() {
    if (moveLeft) player.body.setVelocityX(-300);
    else if (moveRight) player.body.setVelocityX(300);
    else player.body.setVelocityX(0);
}
