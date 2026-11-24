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
        this.lockTimer = null;
        this.lockResets = 0;
        this.currentFallDelay = Balance.tetris.fallDelay;
        this.frozen = false;
    };




    start() {
        this.currentFallDelay = Balance.tetris.fallDelay;

        this.spawnPiece();
        this.fallTimer = this.scene.time.addEvent({
            delay: this.currentFallDelay,
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
        this.lockResets = 0;
        this.updateLockTimer();
    }

    movePiece(dx) {
        if (!this.piece || this.frozen) return;
        const { matrix, x, y } = this.piece;
        if (this.board.isValid(matrix, x + dx, y)) {
            this.piece.x += dx;
            this.emit('changed');
            this.updateLockTimer(true);
        }
    }

    rotatePiece() {
        if (!this.piece || this.frozen) return;
        const rotated = rotateCW(this.piece.matrix);
        if (this.board.isValid(rotated, this.piece.x, this.piece.y)) {
            this.piece.matrix = rotated;
            this.emit('rotated');
            this.emit('changed');
            this.updateLockTimer(true);
        }
    }

    stepDown() {
        if (!this.piece || this.frozen) return;
        const { matrix, x, y } = this.piece;
        if (this.board.isValid(matrix, x, y + 1)) {
            this.piece.y++;
            this.emit('changed');
        } else {
            //el temporizador controla que se lockee
            this.updateLockTimer(false);
        }
    }

    lockPiece() {
        const { matrix, x, y, type } = this.piece;
        this.board.lockPiece(matrix, x, y, type);
        this.piece = null;
        this.emit('locked');
        this.cancelLockTimer();
        this.lockResets = 0;

        if (this.board.savedLines().length > 0) {
            const fullLines = this.board.savedLines().length;
            this.emit('linesFull', fullLines);
            this.scene.time.delayedCall(Balance.tetris.lineClearDelay, () => {
                this.linesCleared += this.board.clearLine();
                this.emit('linesCleared', this.linesCleared);
                if (this.currentFallDelay > 100) {
                    this.currentFallDelay -= 15;

                    if (this.fallTimer) {
                        this.fallTimer.delay = this.currentFallDelay;
                    }
                }

                this.spawnPiece();
            });
        } else {
            this.spawnPiece();
        }
    }

    isGrounded() {
        const { matrix, x, y } = this.piece;
        return !this.board.isValid(matrix, x, y + 1);
    }

    //TEMPORIZADOR DE LAS PIEZAS ANTES DE LOCKEARSE
    //resetIfRunning = true cuando el jugador mueve o rota la pieza.
    updateLockTimer(resetIfRunning = false) {
        if (!this.piece) return;

        if (!this.isGrounded()) {
            this.cancelLockTimer();      // se movió a un sitio donde puede seguir cayendo
            return;
        }

        if (!this.lockTimer) {
            this.startLockTimer();
        } else if (resetIfRunning && this.lockResets < Balance.tetris.maxLockResets) {
            this.lockResets++;
            this.cancelLockTimer();
            this.startLockTimer();
        }
    }

    startLockTimer() {
        this.lockTimer = this.scene.time.delayedCall(Balance.tetris.lockDelay, () => {
            this.lockTimer = null;
            if (this.piece && this.isGrounded()) this.lockPiece();
        });
    }

    cancelLockTimer() {
        if (this.lockTimer) {
            this.lockTimer.remove(false);
            this.lockTimer = null;
        }
    }

    freeze() {
        this.frozen = true;
        this.cancelLockTimer();
        if (this.fallTimer) this.fallTimer.paused = true;
    }

    gameOver() {
        this.fallTimer.remove();
        this.piece = null;
        this.emit('gameOver');
    }
}