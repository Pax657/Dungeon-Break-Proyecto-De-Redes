import Phaser from 'phaser';
import { Layout } from '../config/Layout';
import { Tablero } from '../entities/Tablero';
import { SHAPES, COLORS, rotateCW } from '../config/pieza';

export class JuegoScene extends Phaser.Scene {
    constructor() {
        super('JuegoScene');
    }

    init() {
        this.players = new Map();
        this.inputMappings = [];
    }

    preload() {
        // Load assets

        //imágenes
        this.load.image('fondo', 'assets/Sprites/Fondo.png')

        this.load.image('infoJugador1', 'assets/Sprites/Info_Box_Amarillo.png')
        this.load.image('infoJugador2', 'assets/Sprites/Info_Box_Naranja.png')

        //evitamos escribir lo mismo 7 veces
        Object.values(COLORS).forEach(({ key, path }) => {
            this.load.image(key, path);
        })

        // Background music
        this.load.audio('gameMusic', 'assets/audio/music.mp3');
    }

    create() {

        const { width, height } = this.scale;
        const { infoBox } = Layout;

        //fondo
        this.add.image(width / 2, height / 2, 'fondo').setDisplaySize(width, height);

        //cajas
        //this.add.image(width / 2 * 0.3, height / 2 * 1.1, 'infoJugador1').setScale(0.7);
        //this.add.image(width / 2 * 1.67, height / 2 * 0.8, 'infoJugador2').setScale(0.3);
        this.createInfoBox('infoJugador1', infoBox.boxP1, width, height);
        this.createInfoBox('infoJugador2', infoBox.boxP2, width, height);


        // Looping background music
        this.music = this.sound.add('gameMusic', { loop: true, volume: 0.3 });
        this.music.play();

        // Pause/resume the music with the scene and stop it on exit
        this.events.on('pause', () => this.music.pause());
        this.events.on('resume', () => this.music.resume());
        this.events.once('shutdown', () => {
            this.events.off('pause');
            this.events.off('resume');
            this.music.destroy();
        });

        // Pause with ESC and show the pause menu on top
        this.input.keyboard.on('keydown-ESC', () => {
            this.scene.pause();
            this.scene.launch('PauseScene');
        });

        this.setUpBoard(width, height);
    }

    setUpBoard(width, height) {
        //MEDIDAS DEL TABLERO
        const { cols, rows, x, y, cellRatio } = Layout.board;
        this.cell = height * cellRatio;
        this.boardX = width * x;
        this.boardY = height * y;

        //DATOS DEL TABLERO
        this.board = new Tablero(rows, cols); //la lógica como tal
        this.blocks = this.add.group(); //optimización, añade en un grupo para borrar todos los cubos de una en vez de uno a uno

        //DEBUG mostrar espacio que ocupa el tablero
        this.add.rectangle(this.boardX, this.boardY, cols * this.cell, rows * this.cell).setOrigin(0).setStrokeStyle(2, 0xff00ff);

        this.spawnPiece();

        //GRAVEDAD diferente a la de Jugador 2, más sencillo usar la de Phaser con el 2
        this.fallTimer = this.time.addEvent({
            delay: 400, loop: true, callback: () => this.stepDown()
        });

        //MAPEADO DE CONTROLES
        const kb = this.input.keyboard;
        this.inputMappings = [
            { key: 'A', action: () => this.movePiece(-1) },
            { key: 'D', action: () => this.movePiece(1) },
            { key: 'W', action: () => this.rotatePiece() },
            { key: 'S', action: () => this.stepDown() },
        ];

        this.inputMappings.forEach(({ key, action }) => {
            kb.on(`keydown-${key}`, action);
        });

        this.events.once('shutdown', () => {
            this.inputMappings.forEach(({ key, action }) => {
                kb.off(`keydown-${key}`, action);
            });
        });
    }

    spawnPiece() {
        const type = this.nextType();
        //se crea la pieza mirando el tipo, se pone en la fila directamente (con ...), no el array
        const matrix = SHAPES[type].map(row => [...row]);
        this.piece = {
            type,
            matrix,
            x: Math.floor((this.board.cols - matrix[0].length) / 2), //lo centra
            y: 0,
        };

        //si la pieza al crearse no es válida, habrá llegado hasta arriba y pierde
        if (!this.board.isValid(matrix, this.piece.x, this.piece.y)) {
            this.gameOver();
            return;
        }
        this.render();
    }

    nextType() {
        return Phaser.Utils.Array.GetRandom(Object.keys(SHAPES)); //retorna pieza al azar
    }

    movePiece(direccion) {
        if (!this.piece) return; //si no hay pieza, no intentes moverla
        const { matrix, x, y } = this.piece;

        if (this.board.isValid(matrix, x + direccion, y)) {
            this.piece.x += direccion;
            this.render();
        }
    }

    rotatePiece() {
        if (!this.piece) return; //si no hay pieza, no intentes rotarla
        const rotated = rotateCW(this.piece.matrix); //rotar matriz = rotar pieza

        if (this.board.isValid(rotated, this.piece.x, this.piece.y)) {
            this.piece.matrix = rotated;
            this.render();
        }
    }

    stepDown() {
        if (!this.piece) return;
        const { matrix, x, y } = this.piece;

        if (this.board.isValid(matrix, x, y + 1)) {
            this.piece.y++;
            this.render();
        } else {
            this.lockPiece();
        }
    }

    lockPiece() {
        const { matrix, x, y, type } = this.piece;
        this.board.lockPiece(matrix, x, y, type);
        this.board.clearLine(); //si no se ha limpiado ninguna, no importa
        this.spawnPiece();
    }

    //dibujaremos el tablero fijo y la pieza activa (piece)
    render() {
        this.blocks.clear(true, true); //borramos todo

        //r y c = fila y columna. Si existe algo de un tipo en esa casilla, dibuja un cuadrado de ese tipo
        this.board.grid.forEach((row, r) =>
            row.forEach((type, c) => type && this.drawCell(c, r, type))
        );

        if (this.piece) {
            const { matrix, x, y, type } = this.piece;
            matrix.forEach((row, r) => row.forEach((cell, c) => {
                if (cell && y + r >= 0) this.drawCell(x + c, y + r, type);
            }));
        }
    }

    gameOver() {
        this.fallTimer.remove();
        this.piece = null;

        //cambiar por escena GAMEOVER
        const { width, height } = this.scale;
        this.add.text(width / 2, height / 2, 'GAME OVER', { fontSize: '128px' }).setOrigin(0.5);
    }

    drawCell(col, row, type) {
        const celdaX = this.boardX + col * this.cell + this.cell / 2;
        const celdaY = this.boardY + row * this.cell + this.cell / 2;
        const sprite = this.add.image(celdaX, celdaY, COLORS[type].key).setDisplaySize(this.cell, this.cell);

        this.blocks.add(sprite);
    }

    createInfoBox(key, pos, width, height) {
        const box = this.add.image(width * pos.x, height * pos.y, key);
        box.setScale((width * Layout.infoBox.widthRatio) / box.width);
        return box;
    }
}