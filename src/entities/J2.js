
import { Balance } from '../config/Balance';
import { Controls } from '../config/Controls';

export class J2 {
    constructor(scene, { cell, boardX, boardY, cols, rows }, colliders) {
        const { sizeRatio, maxVelocityX } = Balance.j2;

        const size = cell * sizeRatio;
        const startX = boardX + (cols * cell) / 2;
        const startY = boardY + rows * cell - size;

        // Crear sprite del jugador
        this.sprite = scene.physics.add.sprite(startX, startY, 'idle_0');
        this.sprite.setDisplaySize(size * 0.03, size * 0.03);



        // Ajustar hitbox
        this.body = this.sprite.body;
        this.body.setCollideWorldBounds(true);
        this.body.setMaxVelocityX(maxVelocityX);

        colliders.forEach(group =>
            scene.physics.add.collider(this.sprite, group)
        );

        const kb = scene.input.keyboard;

        this.keys = {
            left: kb.addKey(Controls.j2.left),
            right: kb.addKey(Controls.j2.right),
            jump: kb.addKey(Controls.j2.jump),
        };

        this.isDead = false;
        this.currentState = 'idle';

        // Animación inicial
        this.sprite.play('idle');
    }

    update() {
        if (this.isDead) return;

        const { speed, jumpVelocity } = Balance.j2;

        // Movimiento horizontal
        if (this.keys.left.isDown) {
            this.body.setVelocityX(-speed);
            this.sprite.setFlipX(true);
        } else if (this.keys.right.isDown) {
            this.body.setVelocityX(speed);
            this.sprite.setFlipX(false);
        } else {
            this.body.setVelocityX(0);
        }

        // Comprobar si está en el suelo
        const onGround = this.body.blocked.down || this.body.touching.down;

        // Salto
        if (this.keys.jump.isDown && onGround) {
            this.body.setVelocityY(jumpVelocity);
        }

        // Cambiar animación según el estado
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

    die() {
        if (this.isDead) return;

        this.isDead = true;
        this.currentState = 'die';

        this.body.setVelocity(0, 0);
        this.body.enable = false;

        this.sprite.play('die');
    }
}
