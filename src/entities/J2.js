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

        this.sprite = scene.add.rectangle(startX, startY, size, size, 0xff9900);
        scene.physics.add.existing(this.sprite);

        this.body = this.sprite.body;
        this.body.setCollideWorldBounds(true);
        this.body.setMaxVelocityX(maxVelocityX);

        colliders.forEach(group => scene.physics.add.collider(this.sprite, group));
        

        this.coinsText = scene.add.text(scene.box2.x, scene.box2.y, 'Monedas: 0', {
            fontFamily: 'Comic Sans MS',
            fontSize: '36px',
            color: '#000000',
        }).setOrigin(0.9);

        scene.add.text(scene.box2.x, scene.box2.y + 60, '[1] Velocidad (5 monedas)\n[2] Flotar (8 monedas)\n[3] Doble Salto (10 monedas)', {
            fontFamily: 'Comic Sans MS',
            fontSize: '24px',
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
        const { speed, jumpVelocity } = Balance.j2;

        if (this.keys.left.isDown) {
            this.body.setVelocityX(-speed);
        } else if (this.keys.right.isDown) {
            this.body.setVelocityX(speed);
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
    }

    buyPowerUp1() {
        if (this.coins >= 5) {
            this.coins -= 5;
            this.coinsText.setText('Monedas: ' + this.coins); 
            console.log("¡J2 compró Súper Velocidad!");
            Balance.j2.speed += 150;

            this.scene.time.delayedCall(10000, () => {
                Balance.j2.speed = Balance.j2.normalSpeed || 300;
            });
        } else {
            console.log("Monedas insuficientes para Velocidad (necesitas 5). Tienes: " + this.coins);
        }
    }

    buyPowerUp2() {
        if (this.coins >= 8) {
            this.coins -= 8;
            this.coinsText.setText('Monedas: ' + this.coins);

            this.isFloatingActive = true;
            console.log("¡Habilidad de Flotar activada!");

            this.scene.time.delayedCall(10000, () => {
                this.isFloatingActive = false;
                console.log("¡Flotar desactivado!");
            });
        }
    }

    buyPowerUp3() {
        if (this.coins >= 10) {
            this.coins -= 10;
            this.coinsText.setText('Monedas: ' + this.coins);

            this.hasDoubleJumpActive = true;
            console.log("¡Doble Salto activado!");

            this.scene.time.delayedCall(12000, () => {
                this.hasDoubleJumpActive = false;
                console.log("¡Doble Salto desactivado!");
            });
        }
    }
}