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

        // 1. CUERPO FÍSICO
        const boxSize = size * 0.55;
        this.sprite = scene.physics.add.sprite(startX, startY, 'idle_0');
        this.sprite.body.setSize(boxSize, boxSize);
        this.sprite.body.setCollideWorldBounds(true);
        this.sprite.body.setMaxVelocityX(maxVelocityX);
        this.sprite.setAlpha(0); 

        // 2. SPRITE VISUAL
        this.animSprite = scene.add.sprite(startX, startY, 'idle_0');
        this.animSprite.setScale(0.02);
        this.animSprite.setOrigin(0.5, 0.5);

        // Colisiones normales contra el suelo y paredes
        colliders.forEach(group =>
            scene.physics.add.collider(this.sprite, group)
        );

        // --- DETECCIÓN DE APLASTAMIENTO (Si un bloque del Tetris choca contra el slime) ---
        // colliders[1] es 'ground' (los bloques fijos del Tetris) en PhysicalWorld.js
        if (colliders[1]) {
            scene.physics.add.overlap(this.sprite, colliders[1], () => {
                this.checkCrush();
            });
        }

        // Texto principal de monedas
        this.coinsText = scene.add.text(scene.box2.x, scene.box2.y - 15, 'Monedas: 0', {
            fontFamily: 'Comic Sans MS',
            fontSize: '34px',
            color: '#000000',
        }).setOrigin(0.9);

        scene.add.text(scene.box2.x, scene.box2.y + 60, '[1] Velocidad (5 monedas)\n[2] Flotar (8 monedas)\n[3] Doble Salto (10 monedas)', {
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
            buy1: kb.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),   
            buy2: kb.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),   
            buy3: kb.addKey(Phaser.Input.Keyboard.KeyCodes.THREE), 
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

        // --- COMPROBAR CONDICIÓN DE VICTORIA ---
        // Si el slime entra en la zona del túnel superior derecho (fuera del ancho del tablero por la derecha y arriba)
        // --- COMPROBAR CONDICIÓN DE VICTORIA ---
        const { cell, boardX, boardY, cols } = this.geometry;
        const boardRight = boardX + (cols * cell);
        
        // Si el slime pasa del borde derecho y está en la mitad superior del tablero (cerca del túnel)
        if (this.sprite.x > boardRight - 10 && this.sprite.y < boardY + (cell * 3)) {
            this.win();
        }
        
        if (this.sprite.x > boardRight && this.sprite.y < boardY + (cell * 2)) {
            this.win();
        }

        // --- SINCRONIZACIÓN VISUAL ---
        const visualOffsetX = 0;   
        const visualOffsetY = -18; 

        this.animSprite.x = this.sprite.x + visualOffsetX;
        this.animSprite.y = this.sprite.y + visualOffsetY;
    }

    checkCrush() {
        // Si un bloque cae justo encima del slime (bloqueado por arriba y tocando un bloque)
        if (this.body.blocked.up || this.body.touching.up) {
            this.die();
        }
    }

    win() {
        if (this.hasWon || this.isDead) return;
        this.hasWon = true;
        this.body.setVelocity(0, 0);
        this.body.enable = false;

        // Aquí puedes cambiar de escena a una de victoria o mostrar un mensaje
        console.log("¡Has ganado! El slime ha escapado.");
        this.scene.time.delayedCall(1000, () => {
            this.scene.scene.start('MenuScene'); // O la escena de victoria que tengas
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

    die() {
        if (this.isDead || this.hasWon) return;

        this.isDead = true;
        this.currentState = 'die';

        this.body.setVelocity(0, 0);
        this.body.enable = false;

        this.animSprite.play('die');

        // Transición a Game Over tras un segundo
        this.scene.time.delayedCall(1000, () => {
            this.scene.scene.start('GameOverScene');
        });
    }
}