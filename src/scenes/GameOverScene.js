import Phaser from 'phaser';

export class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }

    create() {
        const {width, height} = this.scale;

        this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.7);

        this.add.text(width/2, 200, 'Game Over', { fontSize: '128px' }).setOrigin(0.5);

        const rematchBtn = this.add.text(width/2, 420, 'Revancha', { fontSize: '64px', color: '#00ff00' }).setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => rematchBtn.setStyle({ color: '#ffff00' }))
            .on('pointerout', () => rematchBtn.setStyle({ color: '#00ff00' }))
            .on('pointerdown', () => {
                this.scene.stop('JuegoScene');
                this.scene.start('JuegoScene');
            });

        const menuBtn = this.add.text(width/2, 700, 'Menu', { fontSize: '64px', color: '#00ff00' }).setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => menuBtn.setStyle({ color: '#ffff00' }))
            .on('pointerout', () => menuBtn.setStyle({ color: '#00ff00' }))
            .on('pointerdown', () => {
                this.scene.stop('JuegoScene');
                this.scene.start('MenuScene');
            });
    }
}
