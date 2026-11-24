import { Balance } from '../config/Balance';
import { Controls } from '../config/Controls';

export class J2 {
    constructor(scene, { cell, boardX, boardY, cols, rows }, colliders) {
        const { sizeRatio, maxVelocityX } = Balance.j2;

        this.scene = scene;
        this.geometry = { cell, boardX, boardY, cols, rows }; // Guardamos la geometría para las checks
        this.coins = 0;
        this.hasDoubleJumpActive = false;
        this.canDoubleJump = false;
        this.isFloatingActive = false;
        this.hasWon = false;

        const size = cell * sizeRatio;
        const startX = boardX + (cols * cell) / 2;
        const startY = boardY + rows * cell - size;

        const boxSize = size * 0.55;
        this.sprite = scene.physics.add.sprite(startX, startY, 'idle_0');
        this.sprite.body.setSize(boxSize, boxSize);
        this.sprite.body.setCollideWorldBounds(true);
        this.sprite.body.setMaxVelocityX(maxVelocityX);
        this.sprite.setAlpha(0);

        this.animSprite = scene.add.sprite(startX, startY, 'idle_0');
        this.animSprite.setScale(0.02);
        this.animSprite.setOrigin(0.5, 0.5);

        colliders.forEach(group =>
            scene.physics.add.collider(this.sprite, group)
        );

        if (colliders[1]) {
            scene.physics.add.overlap(this.sprite, colliders[1], () => {
                this.checkCrush();
            });
        }

        this.coinsText = scene.add.text(scene.box2.x, scene.box2.y - 15, 'Monedas: 0', {
            fontFamily: 'Comic Sans MS',
            fontSize: '34px',
            color: '#000000',
        }).setOrigin(0.9);

        scene.add.text(scene.box2.x, scene.box2.y + 60, '[,] Velocidad (5 monedas)\n[.] Flotar (8 monedas)\n[-] Doble Salto (10 monedas)', {
            fontFamily: 'Comic Sans MS',
            fontSize: '20px',
            color: '#000000',
            align: 'center'
        }).setOrigin(0.5);

        const kb = scene.input.keyboard;

        this.keys = {
            left: kb.addKey(Controls.j2.left),
            right: kb.addKey(Controls.j2.right),
            jump: kb.addKey(Controls.j2.jump),
            buy1: kb.addKey(Phaser.Input.Keyboard.KeyCodes.COMMA),
            buy2: kb.addKey(Phaser.Input.Keyboard.KeyCodes.PERIOD),
            buy3: kb.addKey(Phaser.Input.Keyboard.KeyCodes.MINUS),
        };

        this.isDead = false;
        this.currentState = 'idle';
        this.animSprite.play('idle');

        this.scene.time.addEvent({
            delay: 2000,
            loop: true,
            callback: () => {
                this.coins += 1;
                this.coinsText.setText('Monedas: ' + this.coins);
            }
        });
    }

    get body() {
        return this.sprite.body;
    }

    update() {
        if (this.isDead || this.hasWon) return;
        this.checkCrush();

        const { speed, jumpVelocity } = Balance.j2;

        if (this.keys.left.isDown) {
            this.body.setVelocityX(-speed);
            this.animSprite.setFlipX(true);
        } else if (this.keys.right.isDown) {
            this.body.setVelocityX(speed);
            this.animSprite.setFlipX(false);
        } else {
            this.body.setVelocityX(0);
        }

        const onGround = this.body.blocked.down || this.body.touching.down;

        if (onGround) {
            this.canDoubleJump = true;
        }

        if (Phaser.Input.Keyboard.JustDown(this.keys.jump)) {
            if (onGround) {
                this.body.setVelocityY(jumpVelocity);
            } else if (this.hasDoubleJumpActive && this.canDoubleJump) {
                this.body.setVelocityY(jumpVelocity);
                this.canDoubleJump = false;
            }
        }

        if (this.isFloatingActive && this.keys.jump.isDown && this.body.velocity.y > 0) {
            this.body.setVelocityY(60);
        }

        if (Phaser.Input.Keyboard.JustDown(this.keys.buy1)) {
            this.buyPowerUp1();
        }
        if (Phaser.Input.Keyboard.JustDown(this.keys.buy2)) {
            this.buyPowerUp2();
        }
        if (Phaser.Input.Keyboard.JustDown(this.keys.buy3)) {
            this.buyPowerUp3();
        }

        const inAir = !onGround;

        if (inAir && this.currentState !== 'jump') {
            this.currentState = 'jump';
            this.animSprite.play('jump');
        }
        else if (onGround && this.currentState !== 'idle') {
            this.currentState = 'idle';
            this.animSprite.play('idle');
        }

        const { cell, boardX, boardY, cols } = this.geometry;
        const boardRight = boardX + (cols * cell);
        if (this.sprite.x > boardRight - 10 && this.sprite.y < boardY + (cell * 3)) {
            this.win();
        }

        if (this.sprite.x > boardRight && this.sprite.y < boardY + (cell * 2)) {
            this.win();
        }

        const visualOffsetX = 0;
        const visualOffsetY = -18;

        this.animSprite.x = this.sprite.x + visualOffsetX;
        this.animSprite.y = this.sprite.y + visualOffsetY;
    }

    checkCrush() {
        if (this.isInsideBlock()) {
            this.die();
        }
    }

    win() {
        if (this.hasWon || this.isDead) return;
        this.hasWon = true;
        this.body.setVelocity(0, 0);
        this.body.enable = false;
        this.scene.tetris.freeze();

        const cam = this.scene.cameras.main;

        this.scene.cameras.main.shake(250, 0.01);
        console.log("¡Has ganado! El slime ha escapado.");
        this.scene.time.delayedCall(1000, () => {
            this.scene.gameOver('JUGADOR 2'); 
            cam.fadeOut(500, 255, 0, 0);
        });
    }

    buyPowerUp1() {
        if (this.coins >= 5) {
            this.coins -= 5;
            this.coinsText.setText('Monedas: ' + this.coins);
            Balance.j2.speed += 150;

            this.scene.time.delayedCall(10000, () => {
                Balance.j2.speed = Balance.j2.normalSpeed || 300;
            });
        }
    }

    buyPowerUp2() {
        if (this.coins >= 8) {
            this.coins -= 8;
            this.coinsText.setText('Monedas: ' + this.coins);

            this.isFloatingActive = true;

            this.scene.time.delayedCall(10000, () => {
                this.isFloatingActive = false;
            });
        }
    }

    buyPowerUp3() {
        if (this.coins >= 10) {
            this.coins -= 10;
            this.coinsText.setText('Monedas: ' + this.coins);

            this.hasDoubleJumpActive = true;

            this.scene.time.delayedCall(12000, () => {
                this.hasDoubleJumpActive = false;
            });
        }
    }

    isInsideBlock() {
        const { cell, boardX, boardY } = this.geometry;
        const { board, piece } = this.scene.tetris;
        const inset = 3;   // margen para que apoyarse sobre un bloque no cuente como "dentro"
        const b = this.body;

        const corners = [
            [b.left + inset, b.top + inset],
            [b.right - inset, b.top + inset],
            [b.left + inset, b.bottom - inset],
            [b.right - inset, b.bottom - inset],
        ];

        return corners.some(([px, py]) => {
            const col = Math.floor((px - boardX) / cell);
            const row = Math.floor((py - boardY) / cell);

            // Fuera del tablero (por ejemplo, el túnel de salida): no cuenta
            if (row < 0 || row >= board.rows || col < 0 || col >= board.cols) return false;

            if (board.grid[row][col]) return true;   // pieza ya fijada

            return !!board.grid[row][col];
        });
    };


    die() {
        if (this.isDead || this.hasWon) return;

        this.isDead = true;
        this.currentState = 'die';

        this.body.setVelocity(0, 0);
        this.body.enable = false;
        this.scene.tetris.freeze();

        const cam = this.scene.cameras.main;

        this.scene.cameras.main.shake(250, 0.01);
        this.animSprite.play('die');
        this.animSprite.setTint(0xff4444);
        //el jugador vibra antes de morir
        this.scene.tweens.add({
            targets: this.animSprite,
            scaleY: this.animSprite.scaleY * 0.2,
            scaleX: this.animSprite.scaleX * 1.4,
            duration: 150,
            ease: 'Quad.easeOut',
        });

        this.scene.time.delayedCall(600, () => {
            cam.once('camerafadeoutcomplete', () => this.scene.gameOver('JUGADOR 1')); //gana j1 si el j2 muere aplastado
            cam.fadeOut(500, 255, 0, 0);
        });
    }
}
