import { Balance } from "../config/Balance";
import { Layout } from "../config/Layout";
import { SHAPES, COLORS } from "../config/pieza";

export class TetrisRenderer {
    constructor(scene, { cell, boardX, boardY }, infoBox) {
        this.scene = scene;
        this.cell = cell;
        this.boardX = boardX;
        this.boardY = boardY;
        this.infoBox = infoBox;

        this.blocks = scene.add.group(); //todos los cubos en pantalla, para borrarlos de una vez

        this.linesText = scene.add.text(infoBox.x, infoBox.y - 90, 'Líneas: 0', {
            fontFamily: 'Comic Sans MS',
            fontSize: '30px',
            color: '#000000',
        }).setOrigin(0.5);
    }

    setLines(count) {
        this.linesText.setText('Líneas: ' + count);
    }

    //redibuja todo a partir de los datos
    render(board, piece, nextTypes) {
        this.blocks.clear(true, true);

        Layout.infoBox.nextPieces.offsetsX.forEach((offsetX, i) => {
            this.drawNextPiece(nextTypes[i], offsetX);
        });

        const fullRows = board.savedLines();   //filas completas, se pintan en blanco

        board.grid.forEach((row, r) =>
            row.forEach((type, c) => {
                if (type) this.drawCell(c, r, type, fullRows.includes(r));
            })
        );

        if (piece) {
            const { matrix, x, y, type } = piece;
            matrix.forEach((row, r) => row.forEach((cell, c) => {
                if (cell && y + r >= 0) this.drawCell(x + c, y + r, type);
            }));
        }
    }

    drawCell(col, row, type, isWhite = false) {
        const x = this.boardX + col * this.cell + this.cell / 2;
        const y = this.boardY + row * this.cell + this.cell / 2;
        this.addBlock(x, y, type, isWhite).isBoard = true;
    }

    drawNextPiece(type, offsetX) {
        if (!type) return;

        const { offsetY } = Layout.infoBox.nextPieces;
        const startX = this.infoBox.x - this.infoBox.displayWidth / 2 + this.cell / 2 + offsetX;
        const startY = this.infoBox.y - this.infoBox.displayHeight / 2 + this.cell / 2 + offsetY;

        SHAPES[type].forEach((row, r) => row.forEach((cell, c) => {
            if (cell) {
                this.addBlock(
                    startX + c * this.cell + this.cell / 2,
                    startY + r * this.cell + this.cell / 2,
                    type
                );
            }
        }));
    }

    addBlock(x, y, type, isWhite = false) {
        const sprite = this.scene.add.image(x, y, COLORS[type].key)
            .setDisplaySize(this.cell, this.cell);
        if (isWhite) {
            sprite.setTintFill(0xffffff);
            sprite.isFull = true;
        }
        this.blocks.add(sprite);
        return sprite;
    }

    rumble(duration, lines) {
        const { intensity, all } = Balance.tetris.rumbleLevels[Math.min(lines, 4)];

        this.blocks.getChildren().filter(b => all ? b.isBoard : b.isFull) //hacemos el rumble sobre todos o en las líneas llenas
            .forEach(b => {
                this.scene.tweens.add({
                    targets: b,
                    x: b.x + Phaser.Math.Between(-intensity, intensity),
                    y: b.y + Phaser.Math.Between(-intensity, intensity),
                    duration: 30,
                    yoyo: true,
                    repeat: Math.floor(duration / 60),
                })
            })
    }
}