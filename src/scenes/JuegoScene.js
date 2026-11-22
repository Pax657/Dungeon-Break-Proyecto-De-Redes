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
        this.j2 = new J2(this, geometry, this.world.colliders);

        this.inputManager = new InputManager(this, {
            left: () => this.tetris.movePiece(-1),
            right: () => this.tetris.movePiece(1),
            down: () => this.tetris.stepDown(),
            rotate: () => this.tetris.rotatePiece(),
        });

        this.connectTetrisEvents();
        this.tetris.start();
    }

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
        t.on('linesFull', () => {
            this.sound.play(AUDIO.lineClear.key, { volume: Balance.audioVolume });
            redraw();
        });
        t.on('linesCleared', (total) => {
            this.world.updateGroundHitbox(t.board);
            this.renderer.setLines(total);
        })
        t.on('gameOver', () => {
            const { width, height } = this.scale;
            this.add.text(width / 2, height / 2, 'GAME OVER', { fontSize: '128px' }).setOrigin(0.5);
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