import Phaser from 'phaser';

export class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }

    create() {
        const { width, height } = this.scale;

        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);

        this.add.text(width / 2, 200, 'Game Over', { fontSize: '128px', fontFamily: 'TetrisFont' }).setOrigin(0.5);

        const rematchBtn = this.add.text(width / 2, 420, 'Revancha', { fontSize: '64px', fontFamily: 'TetrisFont', color: 'rgb(255, 255, 255)' }).setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => rematchBtn.setStyle({ color: '#006eff' }))
            .on('pointerout', () => rematchBtn.setStyle({ color: '#ffffff' }))
            .on('pointerdown', () => {
                rematchBtn.disableInteractive();
                this.cameras.main.fadeOut(1000, 0, 0, 0, (camera, progress) => {
                    if (progress === 1) {
                        this.scene.stop('JuegoScene');
                        this.scene.start('JuegoScene');
                    }
                });
            });

        const menuBtn = this.add.text(width / 2, 700, 'Menú', { fontSize: '64px', fontFamily: 'TetrisFont', color: '#ffffff' }).setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => menuBtn.setStyle({ color: '#006eff' }))
            .on('pointerout', () => menuBtn.setStyle({ color: '#ffffff' }))
            .on('pointerdown', () => {
                menuBtn.disableInteractive();
                this.cameras.main.fadeOut(1000, 0, 0, 0, (camera, progress) => {
                    if (progress === 1) {
                        this.scene.stop('JuegoScene');
                        this.scene.start('MenuScene');
                    }
                });
            });

            this.cameras.main.fadeIn(800, 255, 0, 0);
    }
}
