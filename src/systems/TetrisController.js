import Phaser from "phaser";
import { Balance } from "../config/Balance";
import { Tablero } from "../entities/Tablero";
import { SHAPES, rotateCW } from "../config/pieza";

//maneja eventos
export class TetrisController extends Phaser.Events.EventEmitter {
    constructor(scene, { cols, rows }) {
        super();
        this.scene = scene;
        this.board = new Tablero(rows, cols);
        this.piece = null;
        this.nextTypes = [];
        this.linesCleared = 0;
        this.fallTimer = null;
    };

    start() {
        this.spawnPiece();
        this.fallTimer = this.scene.time.addEvent({
            delay: Balance.tetris.fallDelay,
            loop: true,
            callback: () => this.stepDown()
        });
    }

    randomType() {
        return Phaser.Utils.Array.GetRandom(Object.keys(SHAPES));
    }

    spawnPiece() {
        if (!this.nextTypes.length) {
            this.nextTypes.push(this.randomType(), this.randomType());
        }
        const type = this.nextTypes.shift();
        this.nextTypes.push(this.randomType());

        const matrix = SHAPES[type].map(row => [...row]);
        this.piece = {
            type,
            matrix,
            x: Math.floor((this.board.cols - matrix[0].length) / 2),
            y: 0,
        };

        if (!this.board.isValid(matrix, this.piece.x, this.piece.y)) {
            this.gameOver();
            return;
        }
        this.emit('changed');
    }

    movePiece(dx) {
        if (!this.piece) return;
        const { matrix, x, y } = this.piece;
        if (this.board.isValid(matrix, x + dx, y)) {
            this.piece.x += dx;
            this.emit('changed');
        }
    }

    rotatePiece() {
        if (!this.piece) return;
        const rotated = rotateCW(this.piece.matrix);
        if (this.board.isValid(rotated, this.piece.x, this.piece.y)) {
            this.piece.matrix = rotated;
            this.emit('rotated');
            this.emit('changed');
        }
    }

    stepDown() {
        if (!this.piece) return;
        const { matrix, x, y } = this.piece;
        if (this.board.isValid(matrix, x, y + 1)) {
            this.piece.y++;
            this.emit('changed');
        } else {
            this.lockPiece();
        }
    }

    lockPiece() {
        const { matrix, x, y, type } = this.piece;
        this.board.lockPiece(matrix, x, y, type);
        this.piece = null;
        this.emit('locked');

        if (this.board.savedLines().length > 0) {
            this.emit('linesFull');   //el renderer pinta las filas en blanco
            this.scene.time.delayedCall(Balance.tetris.lineClearDelay, () => {
                this.linesCleared += this.board.clearLine();
                this.emit('linesCleared', this.linesCleared);
                this.spawnPiece();
            });
        } else {
            this.spawnPiece();
        }
    }

    gameOver() {
        this.fallTimer.remove();
        this.piece = null;
        this.emit('gameOver');
    }
}