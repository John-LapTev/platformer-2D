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

// Конфигурация Phaser для полноэкранного режима
const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#2c3e50',
    scale: {
        mode: Phaser.Scale.RESIZE, // Автоматическая адаптация к размеру окна
        autoCenter: Phaser.Scale.NO_CENTER, // Без центрирования
        width: window.innerWidth,
        height: window.innerHeight,
        min: {
            width: 320,
            height: 240
        },
        max: {
            width: 3840,
            height: 2160
        }
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
        antialias: true,   // Включаем сглаживание для плавности
        pixelArt: false,   // Отключаем пиксельный режим
        roundPixels: true, // Округление позиций для чёткости
        transparent: false,
        powerPreference: 'high-performance' // Используем дискретную видеокарту
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

// Phaser.Scale.RESIZE сам обрабатывает изменение размера окна
// Дополнительные обработчики не нужны

// Экспортируем игру для отладки
if ((import.meta as any).env?.DEV) {
    (window as any).game = game;
}