import Phaser from 'phaser';
import { Layout } from '../config/Layout';
import { Balance } from '../config/Balance';
import { TetrisController } from '../systems/TetrisController';
import { PhysicalWorld } from '../systems/PhysicalWorld';
import { Tablero } from '../entities/Tablero';
import { J2 } from '../entities/J2';
import { InputManager } from '../systems/InputManager';
import { TetrisRenderer } from '../systems/TetrisRenderer';
import { IMAGES, AUDIO, loadAssets } from '../config/Assets'
import { COLORS } from '../config/pieza';

export class JuegoScene extends Phaser.Scene {

    constructor() {
        super('JuegoScene');
    }

    preload() {
    loadAssets(this);

    Object.values(COLORS).forEach(({ key, path }) => {
        this.load.image(key, path);
    });

    // Cargar animación Idle
    for (let i = 0; i < 7; i++) {
        this.load.image(`idle_${i}`, `assets/Animaciones/Idle/idle_${i}.png`);
    }

    // Cargar animación Jump
    for (let i = 0; i < 9; i++) {
        this.load.image(`jump_${i}`, `assets/Animaciones/Jump/jump_${i}.png`);
    }

    // Cargar animación Die
    for (let i = 0; i < 7; i++) {
        this.load.image(`die_${i}`, `assets/Animaciones/Die/die_${i}.png`);
    }
}

    create() {

        const { width, height } = this.scale;
        const { infoBox } = Layout;
        const geometry = this.computeGeometry();

        //fondo
        this.add.image(width / 2, height / 2, IMAGES.fondo.key).setDisplaySize(width, height);

        //cajas (guardamos su info para poder acceder a su posición y/o tamaño)
        this.box1 = this.createInfoBox(IMAGES.infoJugador1.key, infoBox.boxP1, width, height);
        this.box2 = this.createInfoBox(IMAGES.infoJugador2.key, infoBox.boxP2, width, height);

        //Este menú permite comprar power ups para el jugador de tetris
        this.createPowerUpMenu();

        //Musica
        this.setUpMusic();

        // Pause with ESC and show the pause menu on top
        this.input.keyboard.on('keydown-ESC', () => {
            this.scene.pause();
            this.scene.launch('PauseScene');
        });

        //Sistemas
        this.renderer = new TetrisRenderer(this, geometry, this.box1)
        this.world = new PhysicalWorld(this, geometry);
        this.tetris = new TetrisController(this, geometry);

        // Crear animaciones antes de crear al jugador
        this.createPlayerAnimations();

        this.j2 = new J2(this, geometry, this.world.colliders);

        this.inputManager = new InputManager(this, {
            left: () => this.tetris.movePiece(-1),
            right: () => this.tetris.movePiece(1),
            down: () => this.tetris.stepDown(),
            rotate: () => this.tetris.rotatePiece(),
        });

        this.connectTetrisEvents();
        this.tetris.start();

        this.normalSpeed = Balance.j2.speed;
        this.normalFallSpeed = Balance.tetris.keys.down.repeatAfter;
        this.normalLockDelay = Balance.tetris.lockDelay;

        //si había un powerup y reiniciamos la escena, reestablecemos todos los valores a los que teníamos
        this.events.once('shutdown', () => {
            Balance.j2.speed = this.normalSpeed;
            Balance.tetris.keys.down.repeatAfter = this.normalFallSpeed;
            Balance.tetris.lockDelay = this.normalLockDelay;
        });

        this.cameras.main.fadeIn(500, 0, 0, 0);


    }

    createPlayerAnimations() {

    // Animación de estar quieto
    this.anims.create({
        key: 'idle',
        frames: Array.from({ length: 7 }, (_, i) => ({
            key: `idle_${i}`
        })),
        frameRate: 8,
        repeat: -1
    });

    // Animación de salto
    this.anims.create({
        key: 'jump',
        frames: Array.from({ length: 9 }, (_, i) => ({
            key: `jump_${i}`
        })),
        frameRate: 10,
        repeat: 0
    });

    // Animación de muerte
    this.anims.create({
        key: 'die',
        frames: Array.from({ length: 7 }, (_, i) => ({
            key: `die_${i}`
        })),
        frameRate: 8,
        repeat: 0
    });
}

    createPowerUpMenu() {
        const boxWidth = this.box1.displayWidth;
        const boxHeight = this.box1.displayHeight;
        const centerX = this.box1.x;

        const startY = this.box1.y + 50; //Ajustar hasta que quede bien
        const gap = Math.max(42, boxHeight * 0.11);
        const buttonWidth = boxWidth * 0.7; //Ancho del botón, ajustar hasta que quede bien
        const buttonHeight = 30; //Altura
        const fontSize = '24px'; //Tamaño de la fuente

        const buttonsPowerups = [
            { label: '2 Líneas: Fiesta Palo', callback: () => this.PowerUp1Activation('PU1') },
            { label: '3 Líneas: Jugador Cojo', callback: () => this.PowerUp2Activation('PU2') },
            { label: '5 Líneas: Piezas Rápidas', callback: () => this.PowerUp3Activation('PU3') },
        ];

        this.box1MenuButtons = buttonsPowerups.map(({ label, callback }, index) => {
            const y = startY + index * gap;

            const background = this.add.rectangle(centerX, y, buttonWidth, buttonHeight, 0x1e293b, 0.9)
                .setStrokeStyle(2, 0x94a3b8)
                .setInteractive({ useHandCursor: true });

            const text = this.add.text(centerX, y, label, {
                fontSize,
                color: '#ffffff',
            }).setOrigin(0.5);

            background.on('pointerover', () => {
                background.setFillStyle(0x334155, 1);
                background.setStrokeStyle(2, 0xf8fafc);
            });

            background.on('pointerout', () => {
                background.setFillStyle(0x1e293b, 0.9);
                background.setStrokeStyle(2, 0x94a3b8);
            });

            background.on('pointerdown', callback);

            return { background, text };
        });
    }

    PowerUp1Activation() {
        if (this.tetris.linesCleared >= 2) {
            this.tetris.nextTypes = ['I', 'I', 'I', 'I', 'I'];
        }
    }

    PowerUp2Activation() {
        if (this.tetris.linesCleared >= 3) {

            if (this.j2SpeedNerftimer) {
                this.j2SpeedNerftimer.remove(false);
            }

            Balance.j2.speed = 150;

            this.j2SpeedNerftimer = this.time.delayedCall(15000, () => {
                Balance.j2.speed = this.normalSpeed;

                this.j2SpeedNerftimer = null;
            });
        }
    }

    PowerUp3Activation() {
        if (this.tetris.linesCleared >= 5) {

            console.log('sí llego aquí');

            if (this.j1Bufftimer) {
                this.j1Bufftimer.remove(false);
            }

            Balance.tetris.keys.down.repeatAfter = 30;

            this.inputManager.updateBalance(this, {
                left: () => this.tetris.movePiece(-1),
                right: () => this.tetris.movePiece(1),
                down: () => this.tetris.stepDown(),
                rotate: () => this.tetris.rotatePiece(),
            });

            Balance.tetris.lockDelay = 1;

            this.j1Bufftimer = this.time.delayedCall(15000, () => {
                Balance.tetris.keys.down.repeatAfter = this.normalFallSpeed;
                Balance.tetris.lockDelay = this.normalLockDelay;

                this.inputManager.updateBalance(this, {
                    left: () => this.tetris.movePiece(-1),
                    right: () => this.tetris.movePiece(1),
                    down: () => this.tetris.stepDown(),
                    rotate: () => this.tetris.rotatePiece(),
                });;

                this.j1Bufftimer = null;
            });
        }
    }

    //DANI TODO LO QUE HAGAS EMPIEZA AQUÍ


    //Y ACABA AQUÍ

    //conecta los sistemas de sonido, renderizado, colisiones y lógica
    connectTetrisEvents() {
        const t = this.tetris;
        const redraw = () => this.renderer.render(t.board, t.piece, t.nextTypes);

        t.on('changed', redraw);
        t.on('locked', () => {
            this.world.updateGroundHitbox(t.board);
            redraw();
        });
        t.on('rotated', () => this.sound.play(AUDIO.rotate.key, { volume: Balance.audioVolume }));
        t.on('linesFull', (fullLines) => {
            this.sound.play(AUDIO.lineClear.key, { volume: Balance.audioVolume });
            redraw();
            this.renderer.rumble(Balance.tetris.lineClearDelay, fullLines);
        });
        t.on('linesCleared', (total) => {
            this.world.updateGroundHitbox(t.board);
            this.renderer.setLines(total);


        })
        t.on('gameOver', () => {
            this.music.stop();
            this.scene.pause();
            this.scene.launch('GameOverScene');
        })

        this.events.once('shutdown', () => t.removeAllListeners());
    }

    computeGeometry() {
        const { width, height } = this.scale;
        const { cols, rows, x, y, cellRatio } = Layout.board;
        return { cell: height * cellRatio, boardX: width * x, boardY: height * y, cols, rows };
    }

    setUpMusic() {
        this.music = this.sound.add(AUDIO.gameMusic.key, { loop: true, volume: Balance.audioVolume });
        this.music.play();

        this.events.on('pause', () => this.music.pause());
        this.events.on('resume', () => this.music.resume());
        this.events.once('shutdown', () => {
            this.events.off('pause');
            this.events.off('resume');
            this.music.destroy();
        });
    }

    createInfoBox(key, pos, width, height) {
        const box = this.add.image(width * pos.x, height * pos.y, key);
        box.setScale((width * Layout.infoBox.widthRatio) / box.width);
        return box;
    }

    update(time) {
        this.inputManager.update(time);
        this.j2.update();
    }
}
