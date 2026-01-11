const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.RESIZE, // Растягивает игру на весь экран Telegram
        parent: 'game-container',
        width: '100%',
        height: '100%'
    },
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 }, debug: false } // Гравитация 0 для свободного бега
    },
    scene: { preload, create, update }
};

const game = new Phaser.Game(config);
let player, moveL, moveR, moveU, moveD;

function preload() {
    const frameData = { frameWidth: 480, frameHeight: 480 };
    // Загружаем все 4 файла (убедись, что названия в assets совпадают)
    this.load.spritesheet('gob_l', 'assets/goblin_run_left.png', frameData);
    this.load.spritesheet('gob_r', 'assets/goblin_run_right.png', frameData);
    this.load.spritesheet('gob_u', 'assets/goblin_run_up.png', frameData);
    this.load.spritesheet('gob_d', 'assets/goblin_run_down.png', frameData);
}

function create() {
    // Получаем текущий размер экрана
    const w = this.scale.width;
    const h = this.scale.height;

    // 1. Поле (делаем его очень длинным)
    this.add.rectangle(2500, h/2, 5000, h, 0x2e7d32); 

    // 2. Анимации
    const directions = [
        { key: 'run_l', asset: 'gob_l' },
        { key: 'run_r', asset: 'gob_r' },
        { key: 'run_u', asset: 'gob_u' },
        { key: 'run_d', asset: 'gob_d' }
    ];

    directions.forEach(dir => {
        if (this.textures.exists(dir.asset)) {
            this.anims.create({
                key: dir.key,
                frames: this.anims.generateFrameNumbers(dir.asset, { start: 0, end: 11 }),
                frameRate: 15,
                repeat: -1
            });
        }
    });

    // 3. Создание игрока
    player = this.physics.add.sprite(w/2, h/2, 'gob_l');
    player.setScale(0.3); // Размер гоблина
    player.setCollideWorldBounds(true);

    // 4. Камера
    this.cameras.main.startFollow(player, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, 5000, h);
    this.physics.world.setBounds(0, 0, 5000, h);

    // 5. Управление (Крестовина)
    createControls.call(this);
}

function createControls() {
    const h = this.scale.height;
    const btnStyle = { fontSize: '60px', backgroundColor: '#00000055', padding: 10 };

    // Располагаем кнопки в углу для удобства больших пальцев
    const upBtn = this.add.text(120, h - 220, ' ▲ ', btnStyle).setInteractive().setScrollFactor(0);
    const downBtn = this.add.text(120, h - 100, ' ▼ ', btnStyle).setInteractive().setScrollFactor(0);
    const leftBtn = this.add.text(30, h - 160, ' ◀ ', btnStyle).setInteractive().setScrollFactor(0);
    const rightBtn = this.add.text(210, h - 160, ' ▶ ', btnStyle).setInteractive().setScrollFactor(0);

    // Логика нажатий
    upBtn.on('pointerdown', () => moveU = true).on('pointerup', () => moveU = false);
    downBtn.on('pointerdown', () => moveD = true).on('pointerup', () => moveD = false);
    leftBtn.on('pointerdown', () => moveL = true).on('pointerup', () => moveL = false);
    rightBtn.on('pointerdown', () => moveR = true).on('pointerup', () => moveR = false);
}

function update() {
    player.setVelocity(0);
    const s = 350; // Скорость бега

    if (moveL) {
        player.setVelocityX(-s);
        player.play('run_l', true);
    } else if (moveR) {
        player.setVelocityX(s);
        player.play('run_r', true);
    } else if (moveU) {
        player.setVelocityY(-s);
        player.play('run_u', true);
    } else if (moveD) {
        player.setVelocityY(s);
        player.play('run_d', true);
    } else {
        player.anims.stop();
        player.setFrame(0);
    }
}
