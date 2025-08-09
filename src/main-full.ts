import Phaser from 'phaser';
import { PreloadScene } from './scenes/PreloadScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { UIScene } from './scenes/UIScene';
import { GameConfig } from './config/GameConfig';

// Удаляем элемент загрузки после старта игры
window.addEventListener('load', () => {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        setTimeout(() => {
            loadingElement.style.display = 'none';
        }, 100);
    }
});

// Конфигурация Phaser
const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: GameConfig.WIDTH,
    height: GameConfig.HEIGHT,
    backgroundColor: '#2c3e50',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: GameConfig.WIDTH,
        height: GameConfig.HEIGHT
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: GameConfig.GRAVITY },
            debug: false
        }
    },
    scene: [PreloadScene, MenuScene, GameScene, UIScene],
    render: {
        antialias: true,
        pixelArt: false,
        roundPixels: true
    },
    audio: {
        disableWebAudio: false
    },
    input: {
        activePointers: 3,
        touch: {
            target: null,
            capture: false
        }
    }
};

// Создаём игру
const game = new Phaser.Game(config);

// Обработка изменения размера окна
window.addEventListener('resize', () => {
    game.scale.refresh();
});

// Обработка ориентации устройства
window.addEventListener('orientationchange', () => {
    setTimeout(() => {
        game.scale.refresh();
    }, 100);
});

// Экспортируем игру для отладки
if ((import.meta as any).env?.DEV) {
    (window as any).game = game;
}