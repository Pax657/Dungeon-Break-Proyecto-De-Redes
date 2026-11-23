import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    preload() {
        //load assets
        this.load.audio('menuMusic', 'assets/Sonidos/CancionPonponTororon.mp3');

        this.load.image('fondoMenu', 'assets/images/Background.png');
    }
    create() {
        const { width, height } = this.scale;

        const background = this.add.image(width / 2, height / 2, 'fondoMenu')
            .setOrigin(0.5)
            .setDepth(-1);

        const scaleX = width / background.width;
        const scaleY = height / background.height;

        background.setScale(Math.max(scaleX, scaleY));

        this.music = this.sound.add('menuMusic', { loop: true, volume: 0.3 });
        this.music.play();

        this.add.text(width / 2, 200, 'DUNGEON BREAK DEMO', {
            fontSize: '128px',
            fontFamily: 'TetrisFont',
            color: '#ffffff'
        }).setOrigin(0.5);

        const playBtn = this.add.text(width / 2, 500, 'Local Play', {
            fontSize: '72px',
            fontFamily: 'TetrisFont',
            color: '#006eff'
        }).setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => playBtn.setStyle({ color: '#cc00ff' }))
            .on('pointerout', () => playBtn.setStyle({ color: '#006eff' }))
            .on('pointerdown', () => {
                playBtn.disableInteractive();
                this.cameras.main.fadeOut(1000, 0, 0, 0, (camera, progress) => {
                    console.log(progress);
                    if (progress === 1) {
                        this.scene.start('JuegoScene');
                    }
                });
            });

        const creditsBtn = this.add.text(width / 2 + 750, 1000, 'Créditos', {
            fontSize: '64px',
            color: '#00ff00'
        }).setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => creditsBtn.setStyle({ color: '#ffff00' }))
            .on('pointerout', () => creditsBtn.setStyle({ color: '#00ff00' }))
            .on('pointerdown', () => this.scene.start('CreditosScene'));

        //parar música al cambiar    
        this.events.once('shutdown', () => {
            this.music.destroy();
        });
    }
}
