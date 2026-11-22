import Phaser from 'phaser';
import { Layout } from '../config/Layout';
import { Balance } from '../config/Balance';
import { Tablero } from '../entities/Tablero';
import { IMAGES, AUDIO, loadAssets } from '../config/Assets'
import { SHAPES, COLORS, rotateCW } from '../config/pieza';

export class JuegoScene extends Phaser.Scene {

    constructor() {
        super('JuegoScene');
    }

    init() {
        this.players = new Map();
        this.inputMappings = [];
        this.keyHeld = [];
        this.typeArray = [];
        this.linesCleared = 0;
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

        //fondo
        this.add.image(width / 2, height / 2, IMAGES.fondo.key).setDisplaySize(width, height);

        //cajas (guardamos su info para poder acceder a su posición y/o tamaño)
        this.box1 = this.createInfoBox(IMAGES.infoJugador1.key, infoBox.boxP1, width, height);
        this.box2 = this.createInfoBox(IMAGES.infoJugador2.key, infoBox.boxP2, width, height);

        //este texto dice cuántas líneas ha limpiado el jugador del tetris
        this.linesText = this.add.text(this.box1.x, this.box1.y, 'Líneas: 0', {
            fontFamily: 'Comic Sans MS',
            fontSize: ' 30px',
            color: '#000000',
        }).setOrigin(0.5);

        //SetOririgin nos permite que el punto de referencia del texto sea el centro, lo que nos facilita centrarlo en la caja de info

        // Looping background music
        this.music = this.sound.add(AUDIO.gameMusic.key, { loop: true, volume: Balance.audioVolume });
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

        //físicas para J2
        this.boardWallsHitbox = this.physics.add.staticGroup();
        this.groundHitbox = this.physics.add.staticGroup();
        this.eternalGroundHitbox = this.physics.add.staticGroup();

        this.createEternalGround();
        this.createBoardWalls();

        this.createPlayer2();

        this.physics.add.collider(this.player2, this.eternalGroundHitbox);
        this.physics.add.collider(this.player2, this.groundHitbox);
        this.physics.add.collider(this.player2, this.boardWallsHitbox);

        this.cursors = this.input.keyboard.createCursorKeys();
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
        //this.add.rectangle(this.boardX, this.boardY, cols * this.cell, rows * this.cell).setOrigin(0).setStrokeStyle(2, 0xff00ff);

        this.spawnPiece();

        //GRAVEDAD diferente a la de Jugador 2, más sencillo usar la de Phaser con el 2
        this.fallTimer = this.time.addEvent({
            delay: Balance.tetris.fallDelay, loop: true, callback: () => this.stepDown()
        });

        //MAPEADO DE CONTROLES
        const kb = this.input.keyboard;
        const { keys } = Balance.tetris;

        //Acciones mantenidas
        this.keyHeld = [
            { key: kb.addKey('A'), action: () => this.movePiece(-1), nextAt: null, repeatAfter: keys.left.repeatAfter },
            { key: kb.addKey('D'), action: () => this.movePiece(1), nextAt: null, repeatAfter: keys.right.repeatAfter },
            { key: kb.addKey('S'), action: () => this.stepDown(), nextAt: null, repeatAfter: keys.down.repeatAfter },
        ];

        //Acciones de una pulsación
        this.inputMappings = [
            { key: 'W', action: () => this.rotatePiece() },
        ];

        const onKeyDown = (key, action) => (event) => {
            if (!event.repeat) action();   //ignora el autoRepeat del sistema
        };

        this.inputMappings.forEach(m => {
            m.handler = onKeyDown(m.key, m.action);
            kb.on(`keydown-${m.key}`, m.handler);
        });



        this.events.once('shutdown', () => {
            this.inputMappings.forEach(m => kb.off(`keydown-${m.key}`, m.handler));
        });
    }

    createEternalGround() {
        const { cols, rows } = Layout.board;
        const boardWidth = cols * this.cell;
        const { floorHeight } = Balance.world;
        const centerX = this.boardX + boardWidth / 2;
        const centerY = this.boardY + rows * this.cell + floorHeight / 2;

        const floor = this.add.zone(centerX, centerY, boardWidth, floorHeight);
        this.physics.add.existing(floor, true); // true = cuerpo estático
        this.eternalGroundHitbox.add(floor);
    }

    createBoardWalls() {
        const { cols, rows } = Layout.board;
        const { wallThickness } = Balance.world;
        const boardWidth = cols * this.cell;
        const boardHeight = rows * this.cell;
        const centerY = this.boardY + boardHeight / 2;

        const leftX = this.boardX - wallThickness / 2;
        const rightX = this.boardX + boardWidth + wallThickness / 2;

        //en vez de hacer 2 veces lo mismo, hacemos un bucle
        [leftX, rightX].forEach(wallX => {
            const wall = this.add.zone(wallX, centerY, wallThickness, boardHeight);
            this.physics.add.existing(wall, true);
            this.boardWallsHitbox.add(wall);
        });
    }

    createPlayer2() {
        const size = this.cell * Balance.j2.sizeRatio;
        const startX = this.boardX + (Layout.board.cols * this.cell) / 2;
        const startY = this.boardY + (Layout.board.rows * this.cell) - size;

        const placeHolder = this.add.rectangle(startX, startY, size, size, 0xff9900);
        this.physics.add.existing(placeHolder); // Cuerpo dinámico por defecto

        placeHolder.body.setCollideWorldBounds(true);
        placeHolder.body.setMaxVelocityX(Balance.j2.maxVelocityX);


        this.player2 = placeHolder;
        this.players.set('p2', this.player2);
    }

    spawnPiece() {
        //Si no hay piezas en el array, se generan las dos piezas iniciales

        if (!this.typeArray.length) {
            this.typeArray.push(this.nextType());
            this.typeArray.push(this.nextType());
        }

        const type = this.typeArray.shift(); //saca la primera pieza del array
        this.typeArray.push(this.nextType()); //añade una nueva pieza al final del array

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

    updateGroundHitbox() {
        this.groundHitbox.clear(true, true);

        this.board.grid.forEach((row, r) => {
            row.forEach((type, c) => {
                if (type) {
                    const centerX = this.boardX + c * this.cell + this.cell / 2;
                    const centerY = this.boardY + r * this.cell + this.cell / 2;

                    const zone = this.add.zone(centerX, centerY, this.cell, this.cell);
                    this.physics.add.existing(zone, true);
                    this.groundHitbox.add(zone);
                }
            });
        });
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
            this.sound.play(AUDIO.rotate.key, { volume: Balance.audioVolume });
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

        this.updateGroundHitbox();

        this.piece = null;
        const completedRows = this.board.savedLines();

        if (completedRows.length > 0) {
            this.render();
            this.sound.play(AUDIO.lineClear.key, { volume: Balance.audioVolume });

            this.time.delayedCall(Balance.tetris.lineClearDelay, () => {
                this.linesCleared += this.board.clearLine();
                this.updateGroundHitbox();
                this.linesText.setText('Líneas: ' + this.linesCleared);
                this.spawnPiece();
            });
        } else {
            this.spawnPiece();
        }
    }

    //dibujaremos el tablero fijo y la pieza activa (piece)
    render() {

        this.blocks.clear(true, true); //borramos todo

        this.drawNextPiece(0, 70);
        this.drawNextPiece(1, 250);

        const lineas = this.board.savedLines();

        //r y c = fila y columna. Si existe algo de un tipo en esa casilla, dibuja un cuadrado de ese tipo
        this.board.grid.forEach((row, r) =>
            row.forEach((type, c) => {
                if (type) {

                    const cLine = lineas.includes(r);
                    this.drawCell(c, r, type, cLine);
                }
            })
        );
        if (this.piece) {
            const { matrix, x, y, type } = this.piece;
            matrix.forEach((row, r) => row.forEach((cell, c) => {
                if (cell && y + r >= 0) this.drawCell(x + c, y + r, type, false);
            }));
        }
    }

    drawNextPiece(piece, paddingX) {
        const nextType = this.typeArray[piece];
        const nextMatrix = SHAPES[nextType];

        //La posición donde se ve la pieza siguiente
        const startX = this.box1.x - this.box1.displayWidth / 2 + this.cell / 2 + paddingX;
        const startY = this.box1.y - this.box1.displayHeight / 2 + this.cell / 2 + 40;

        nextMatrix.forEach((row, r) => {
            row.forEach((cell, c) => {
                if (cell) {
                    const posX = startX + c * this.cell + this.cell / 2;
                    const posY = startY + r * this.cell + this.cell / 2;
                    const sprite = this.add.image(posX, posY, COLORS[nextType].key).setDisplaySize(this.cell, this.cell);
                    this.blocks.add(sprite);
                }
            });
        });
    }

    gameOver() {
        this.fallTimer.remove();
        this.piece = null;

        //cambiar por escena GAMEOVER
        const { width, height } = this.scale;
        this.add.text(width / 2, height / 2, 'GAME OVER', { fontSize: '128px' }).setOrigin(0.5);
    }

    drawCell(col, row, type, isWhite = false) {
        const celdaX = this.boardX + col * this.cell + this.cell / 2;
        const celdaY = this.boardY + row * this.cell + this.cell / 2;
        const sprite = this.add.image(celdaX, celdaY, COLORS[type].key).setDisplaySize(this.cell, this.cell);

        if (isWhite) {
            sprite.setTintFill(0xffffff);
        }
        this.blocks.add(sprite);
    }

    createInfoBox(key, pos, width, height) {
        const box = this.add.image(width * pos.x, height * pos.y, key);
        box.setScale((width * Layout.infoBox.widthRatio) / box.width);
        return box;
    }

    update(time) {

        this.jugador1Mov(time);
        this.jugador2Mov();

    }

    jugador1Mov(time) {
        const { firstRepeatDelay } = Balance.tetris;

        this.keyHeld.forEach(held => {
            if (!held.key.isDown) {
                held.nextAt = null;
            } else if (held.nextAt === null) {
                held.action();                       //primera pulsación
                held.nextAt = time + firstRepeatDelay;
            } else if (time >= held.nextAt) {
                held.action();                       //repetición
                held.nextAt = time + held.repeatAfter;
            }
        });
    }

    jugador2Mov() {
        if (!this.player2 || !this.cursors) return;

        const { speed, jumpVelocity } = Balance.j2;
        const body = this.player2.body;

        // Movimiento horizontal
        if (this.cursors.left.isDown) {
            body.setVelocityX(-speed);
        } else if (this.cursors.right.isDown) {
            body.setVelocityX(speed);
        } else {
            body.setVelocityX(0);
        }

        const onGround = body.blocked.down || body.touching.down;
        if (this.cursors.up.isDown && onGround) {
            body.setVelocityY(jumpVelocity);
        }
    }
}