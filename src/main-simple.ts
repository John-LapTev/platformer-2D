import Phaser from 'phaser';

// Простая тестовая сцена
class TestScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TestScene' });
    }

    preload(): void {
        console.log('Preload started');
    }

    create(): void {
        console.log('Scene created');
        
        // Создаём простой текст
        this.add.text(640, 360, 'Игра загружается...', {
            fontSize: '48px',
            color: '#ffffff'
        }).setOrigin(0.5);
        
        // Создаём простую графику
        const graphics = this.add.graphics();
        graphics.fillStyle(0x00ff00, 1);
        graphics.fillRect(100, 100, 100, 100);
        
        console.log('Graphics created');
    }
}

// Конфигурация
const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    parent: 'game-container',
    backgroundColor: '#2c3e50',
    scene: [TestScene]
};

// Создаём игру
const game = new Phaser.Game(config);
console.log('Game created', game);