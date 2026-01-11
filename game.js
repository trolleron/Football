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
let player, moveL, moveR, moveU, moveD;
const WORLD_WIDTH = 5000; // Длина поля

function preload() {
    const frameData = { frameWidth: 480, frameHeight: 480 };
    this.load.spritesheet('gob_l', 'assets/goblin_run_left.png', frameData);
    this.load.spritesheet('gob_r', 'assets/goblin_run_right.png', frameData);
    this.load.spritesheet('gob_u', 'assets/goblin_run_up.png', frameData);
    this.load.spritesheet('gob_d', 'assets/goblin_run_down.png', frameData);
}

function create() {
    const h = this.scale.height;

    // 1. Устанавливаем границы ФИЗИЧЕСКОГО мира (теперь он не застрянет)
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, h);

    // 2. Рисуем длинное поле
    this.add.rectangle(WORLD_WIDTH / 2, h / 2, WORLD_WIDTH, h, 0x2e7d32);

    // 3. Создаем анимации
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

    // 4. Персонаж
    player = this.physics.add.sprite(200, h / 2, 'gob_r');
    player.setScale(0.3);
    player.setCollideWorldBounds(true); // Теперь он упрется только в самом конце поля (5000px)

    // 5. Камера
    this.cameras.main.startFollow(player, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, h);

    // 6. Красивый джойстик
    createNiceJoystick.call(this);
}

function createNiceJoystick() {
    const h = this.scale.height;
    const padding = 60;
    const size = 50;
    const xBase = 120;
    const yBase = h - 120;

    // Функция для создания кнопок
    const createBtn = (x, y, label, pointerVar) => {
        let btn = this.add.container(x, y);
        let circle = this.add.circle(0, 0, size, 0xffffff, 0.2);
        let text = this.add.text(0, 0, label, { fontSize: '40px' }).setOrigin(0.5);
        btn.add([circle, text]);
        btn.setInteractive(new Phaser.Geom.Circle(0, 0, size), Phaser.Geom.Circle.Contains);
        btn.setScrollFactor(0); // Кнопки не уплывают при движении камеры
        btn.setDepth(100);

        btn.on('pointerdown', () => { window[pointerVar] = true; circle.setAlpha(0.5); });
        btn.on('pointerup', () => { window[pointerVar] = false; circle.setAlpha(0.2); });
        btn.on('pointerout', () => { window[pointerVar] = false; circle.setAlpha(0.2); });
    };

    createBtn(xBase, yBase - padding, '▲', 'moveU');
    createBtn(xBase, yBase + padding, '▼', 'moveD');
    createBtn(xBase - padding, yBase, '◀', 'moveL');
    createBtn(xBase + padding, yBase, '▶', 'moveR');
}

function update() {
    player.setVelocity(0);
    const s = 400; // Скорость гоблина

    if (window.moveL) {
        player.setVelocityX(-s);
        player.play('run_l', true);
    } else if (window.moveR) {
        player.setVelocityX(s);
        player.play('run_r', true);
    } else if (window.moveU) {
        player.setVelocityY(-s);
        player.play('run_u', true);
    } else if (window.moveD) {
        player.setVelocityY(s);
        player.play('run_d', true);
    } else {
        player.anims.stop();
        player.setFrame(0);
    }
}
