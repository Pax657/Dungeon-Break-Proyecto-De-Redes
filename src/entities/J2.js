import { Balance } from '../config/Balance';
import { Controls } from '../config/Controls';

export class J2 {
    constructor(scene, { cell, boardX, boardY, cols, rows }, colliders) {
        const { sizeRatio, maxVelocityX } = Balance.j2;

        this.scene = scene;
        this.coins = 0; 
        this.hasDoubleJumpActive = false; 
        this.canDoubleJump = false;    
        this.isFloatingActive = false;

        const size = cell * sizeRatio;
        const startX = boardX + (cols * cell) / 2;
        const startY = boardY + rows * cell - size;

        this.sprite = scene.physics.add.sprite(startX, startY, 'idle_0');
        this.sprite.setDisplaySize(size * 0.03, size * 0.03);

        this.body = this.sprite.body;
        this.body.setCollideWorldBounds(true);
        this.body.setMaxVelocityX(maxVelocityX);

        colliders.forEach(group =>
            scene.physics.add.collider(this.sprite, group)
        );

        // Texto principal de monedas
        this.coinsText = scene.add.text(scene.box2.x, scene.box2.y - 15, 'Monedas: 0', {
            fontFamily: 'Comic Sans MS',
            fontSize: '22px',
            color: '#000000',
        }).setOrigin(0.5);

        // Texto de ayuda con los precios de la tienda
        this.shopText = scene.add.text(scene.box2.x, scene.box2.y + 15, '[1] Vel(5) [2] Flotar(8) [3] Doble(10)', {
            fontFamily: 'Comic Sans MS',
            fontSize: '14px',
            color: '#333333',
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

        this.sprite.play('idle');

        this.scene.time.addEvent({
            delay: 2000,
            loop: true,
            callback: () => {
                this.coins += 1;
                this.coinsText.setText('Monedas: ' + this.coins);
            }
        });
    }

    update() {
        if (this.isDead) return;

        const { speed, jumpVelocity } = Balance.j2;

        if (this.keys.left.isDown) {
            this.body.setVelocityX(-speed);
            this.sprite.setFlipX(true);
        } else if (this.keys.right.isDown) {
            this.body.setVelocityX(speed);
            this.sprite.setFlipX(false);
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
            this.sprite.play('jump');
        }
        else if (onGround && this.currentState !== 'idle') {
            this.currentState = 'idle';
            this.sprite.play('idle');
        }
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
        if (this.isDead) return;

        this.isDead = true;
        this.currentState = 'die';

        this.body.setVelocity(0, 0);
        this.body.enable = false;

        this.sprite.play('die');
    }
}