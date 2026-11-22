import { Balance } from '../config/Balance';
import { Controls } from '../config/Controls';

export class J2 {
    constructor(scene, { cell, boardX, boardY, cols, rows }, colliders) {
        const { sizeRatio, maxVelocityX } = Balance.j2;

        const size = cell * sizeRatio;
        const startX = boardX + (cols * cell) / 2;
        const startY = boardY + rows * cell - size;

        this.sprite = scene.add.rectangle(startX, startY, size, size, 0xff9900);
        scene.physics.add.existing(this.sprite);

        this.body = this.sprite.body;
        this.body.setCollideWorldBounds(true);
        this.body.setMaxVelocityX(maxVelocityX);

        colliders.forEach(group => scene.physics.add.collider(this.sprite, group));

        const kb = scene.input.keyboard;
        this.keys = {
            left: kb.addKey(Controls.j2.left),
            right: kb.addKey(Controls.j2.right),
            jump: kb.addKey(Controls.j2.jump),
        }
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
        if (this.keys.jump.isDown && onGround) {
            this.body.setVelocityY(jumpVelocity);
        }
    }
}