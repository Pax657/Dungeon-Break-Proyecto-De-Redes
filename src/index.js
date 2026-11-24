import Phaser from 'phaser';
import { MenuScene } from './scenes/MenuScene.js';
import { PauseScene } from './scenes/PauseScene.js';
import { CreditosScene } from './scenes/CreditosScene.js';
import { JuegoScene } from './scenes/JuegoScene';
import { GameOverScene } from './scenes/GameOverScene.js';

const config = {
    type: Phaser.AUTO,      // WebGL if available; otherwise, Canvas
    width: 1920,
    height: 1080,
    parent: 'game',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [MenuScene, JuegoScene, PauseScene, CreditosScene, GameOverScene],    // The first scene starts automatically

    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 600 },
            debug: false,
        }
    },
};

const game = new Phaser.Game(config);
