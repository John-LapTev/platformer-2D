import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';

export class UIScene extends Phaser.Scene {
    private scoreText!: Phaser.GameObjects.Text;
    private hearts: Phaser.GameObjects.Image[] = [];
    private heartPartials: Phaser.GameObjects.Graphics[] = [];
    private powerUpIcons: Map<string, Phaser.GameObjects.Container> = new Map();
    private pauseButton!: Phaser.GameObjects.Container;
    private fpsText!: Phaser.GameObjects.Text;
    private pauseOverlay!: Phaser.GameObjects.Container;
    private gameOverOverlay!: Phaser.GameObjects.Container;
    private victoryOverlay!: Phaser.GameObjects.Container;
    private powerUpTimers: Map<string, number> = new Map();
    private currentLives: number = GameConfig.MAX_LIVES;
    private currentPartialHealth: number = 3;

    constructor() {
        super({ key: 'UIScene' });
    }

    create(): void {
        // UI всегда поверх игры
        this.scene.bringToTop();
        
        // Создаём элементы UI
        this.createLeftPanel();
        this.createCenterPanel();
        this.createRightPanel();
        this.createPauseOverlay();
        this.createGameOverOverlay();
        this.createVictoryOverlay();
        
        // Подписываемся на события из GameScene
        const gameScene = this.scene.get('GameScene');
        
        gameScene.events.on('score-updated', (score: number) => {
            this.updateScore(score);
        });
        
        gameScene.events.on('lives-updated', (lives: number) => {
            this.updateLives(lives);
        });
        
        gameScene.events.on('powerup-collected', (type: string) => {
            this.startPowerUpTimer(type);
        });
        
        gameScene.events.on('game-paused', () => {
            this.showPauseOverlay();
        });
        
        gameScene.events.on('game-resumed', () => {
            this.hidePauseOverlay();
        });
        
        gameScene.events.on('game-over', (finalScore: number) => {
            this.showGameOverOverlay(finalScore);
        });
        
        gameScene.events.on('victory', (finalScore: number) => {
            this.showVictoryOverlay(finalScore);
        });
        
        gameScene.events.on('health-partial-update', (partialHealth: number) => {
            this.updatePartialHealth(partialHealth);
        });
    }

    private createLeftPanel(): void {
        // Компактная панель слева БЕЗ огромной таблицы
        // Просто монетка со счётом и сердечки
        
        // Монетка со счётом (без заголовка и таблицы)
        
        const coinIcon = this.add.image(25, 25, 'coin');
        coinIcon.setScale(0.8);
        coinIcon.setScrollFactor(0);
        
        this.scoreText = this.add.text(50, 25, '0', {
            fontSize: '20px',
            fontFamily: 'Arial Black',
            color: '#ffd700',
            stroke: '#000000',
            strokeThickness: 2
        });
        this.scoreText.setOrigin(0, 0.5);
        this.scoreText.setScrollFactor(0);
        
        // Сердечки для жизней (без заголовка)
        
        // Сердечки для жизней в одну строку с монеткой
        for (let i = 0; i < GameConfig.MAX_LIVES; i++) {
            const heart = this.add.image(25 + i * 30, 55, 'heart');
            heart.setScale(0.9);
            heart.setScrollFactor(0);
            this.hearts.push(heart);
            
            // Добавляем графику для частичного урона (3 части на сердце)
            const partial = this.add.graphics();
            partial.setScrollFactor(0);
            this.heartPartials.push(partial);
        }
    }

    private createCenterPanel(): void {
        // Панель для активных power-ups по центру
        const centerX = 640;
        const centerY = 40;
        
        // Контейнер для иконок power-ups
        const powerUpContainer = this.add.container(centerX, centerY);
        powerUpContainer.setScrollFactor(0);
    }

    private createRightPanel(): void {
        // Техническая информация справа
        const rightX = 1200;
        
        // FPS счётчик
        this.fpsText = this.add.text(rightX, 30, 'FPS: 60', {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#66bb6a',
            shadow: {
                offsetX: 1,
                offsetY: 1,
                color: '#000000',
                blur: 2,
                fill: true
            }
        });
        this.fpsText.setOrigin(1, 0.5);
        this.fpsText.setScrollFactor(0);
        
        // Кнопка паузы
        this.pauseButton = this.add.container(rightX, 70);
        
        // Фон кнопки
        const pauseBg = this.add.graphics();
        pauseBg.fillStyle(0x2196f3, 0.8);
        pauseBg.fillCircle(0, 0, 25);
        pauseBg.lineStyle(2, 0x1976d2, 1);
        pauseBg.strokeCircle(0, 0, 25);
        
        // Иконка паузы
        const pauseIcon = this.add.text(0, 0, '⏸', {
            fontSize: '24px',
            color: '#ffffff'
        });
        pauseIcon.setOrigin(0.5);
        
        this.pauseButton.add([pauseBg, pauseIcon]);
        this.pauseButton.setScrollFactor(0);
        this.pauseButton.setInteractive(new Phaser.Geom.Circle(0, 0, 25), Phaser.Geom.Circle.Contains);
        
        // Hover эффект
        this.pauseButton.on('pointerover', () => {
            pauseBg.clear();
            pauseBg.fillStyle(0x42a5f5, 1);
            pauseBg.fillCircle(0, 0, 27);
            pauseBg.lineStyle(2, 0x1976d2, 1);
            pauseBg.strokeCircle(0, 0, 27);
        });
        
        this.pauseButton.on('pointerout', () => {
            pauseBg.clear();
            pauseBg.fillStyle(0x2196f3, 0.8);
            pauseBg.fillCircle(0, 0, 25);
            pauseBg.lineStyle(2, 0x1976d2, 1);
            pauseBg.strokeCircle(0, 0, 25);
        });
        
        this.pauseButton.on('pointerdown', () => {
            const gameScene = this.scene.get('GameScene');
            gameScene.events.emit('toggle-pause');
        });
    }

    private createPauseOverlay(): void {
        this.pauseOverlay = this.add.container(640, 360);
        
        // Затемнение
        const overlay = this.add.rectangle(0, 0, 1280, 720, 0x000000, 0.7);
        
        // Панель паузы
        const panel = this.add.graphics();
        panel.fillGradientStyle(0x1a1a2e, 0x0f3460, 0x1a1a2e, 0x0f3460, 1);
        panel.fillRoundedRect(-200, -150, 400, 300, 20);
        panel.lineStyle(3, 0x2196f3, 1);
        panel.strokeRoundedRect(-200, -150, 400, 300, 20);
        
        // Заголовок
        const title = this.add.text(0, -100, 'ПАУЗА', {
            fontSize: '48px',
            fontFamily: 'Arial Black',
            color: '#ffffff',
            shadow: {
                offsetX: 2,
                offsetY: 2,
                color: '#000000',
                blur: 5,
                fill: true
            }
        });
        title.setOrigin(0.5);
        
        // Кнопка продолжить
        const continueButton = this.createStyledButton(0, 0, 'Продолжить', 0x4caf50, () => {
            const gameScene = this.scene.get('GameScene');
            gameScene.events.emit('toggle-pause');
        });
        
        // Кнопка в меню
        const menuButton = this.createStyledButton(0, 80, 'В меню', 0xf44336, () => {
            this.scene.stop('GameScene');
            this.scene.stop();
            this.scene.start('MenuScene');
        });
        
        this.pauseOverlay.add([overlay, panel, title, ...continueButton, ...menuButton]);
        this.pauseOverlay.setVisible(false);
    }

    private createGameOverOverlay(): void {
        this.gameOverOverlay = this.add.container(640, 360);
        
        // Затемнение
        const overlay = this.add.rectangle(0, 0, 1280, 720, 0x000000, 0.8);
        
        // Панель
        const panel = this.add.graphics();
        panel.fillGradientStyle(0x8b0000, 0x330000, 0x8b0000, 0x330000, 1);
        panel.fillRoundedRect(-250, -200, 500, 400, 20);
        panel.lineStyle(3, 0xff0000, 1);
        panel.strokeRoundedRect(-250, -200, 500, 400, 20);
        
        // Заголовок
        const title = this.add.text(0, -120, 'ИГРА ОКОНЧЕНА', {
            fontSize: '42px',
            fontFamily: 'Arial Black',
            color: '#ff0000',
            shadow: {
                offsetX: 3,
                offsetY: 3,
                color: '#000000',
                blur: 8,
                fill: true
            }
        });
        title.setOrigin(0.5);
        
        // Счёт
        const scoreText = this.add.text(0, -40, '', {
            fontSize: '28px',
            fontFamily: 'Arial',
            color: '#ffffff'
        });
        scoreText.setOrigin(0.5);
        scoreText.setName('finalScore');
        
        // Кнопка повторить
        const retryButton = this.createStyledButton(0, 40, 'Повторить', 0xff9800, () => {
            this.scene.stop();
            this.scene.get('GameScene').scene.restart();
            this.scene.start('UIScene');
        });
        
        // Кнопка в меню
        const menuButton = this.createStyledButton(0, 120, 'В меню', 0x9e9e9e, () => {
            this.scene.stop('GameScene');
            this.scene.stop();
            this.scene.start('MenuScene');
        });
        
        this.gameOverOverlay.add([overlay, panel, title, scoreText, ...retryButton, ...menuButton]);
        this.gameOverOverlay.setVisible(false);
    }

    private createVictoryOverlay(): void {
        this.victoryOverlay = this.add.container(640, 360);
        
        // Затемнение
        const overlay = this.add.rectangle(0, 0, 1280, 720, 0x000000, 0.8);
        
        // Панель
        const panel = this.add.graphics();
        panel.fillGradientStyle(0x1b5e20, 0x004d00, 0x1b5e20, 0x004d00, 1);
        panel.fillRoundedRect(-250, -200, 500, 400, 20);
        panel.lineStyle(3, 0xffd700, 1);
        panel.strokeRoundedRect(-250, -200, 500, 400, 20);
        
        // Заголовок
        const title = this.add.text(0, -120, 'ПОБЕДА!', {
            fontSize: '56px',
            fontFamily: 'Arial Black',
            color: '#ffd700',
            shadow: {
                offsetX: 3,
                offsetY: 3,
                color: '#000000',
                blur: 10,
                fill: true
            }
        });
        title.setOrigin(0.5);
        
        // Анимация заголовка
        this.tweens.add({
            targets: title,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 1000,
            ease: 'Sine.inOut',
            yoyo: true,
            repeat: -1
        });
        
        // Счёт
        const scoreText = this.add.text(0, -40, '', {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#ffffff'
        });
        scoreText.setOrigin(0.5);
        scoreText.setName('finalScore');
        
        // Звёзды рейтинга
        const stars = this.add.container(0, 40);
        for (let i = 0; i < 3; i++) {
            const star = this.add.text(-60 + i * 60, 0, '⭐', {
                fontSize: '48px'
            });
            star.setOrigin(0.5);
            stars.add(star);
        }
        
        // Кнопка следующий уровень
        const nextButton = this.createStyledButton(0, 120, 'Следующий уровень', 0x4caf50, () => {
            console.log('Следующий уровень');
        });
        
        // Кнопка в меню
        const menuButton = this.createStyledButton(0, 200, 'В меню', 0x2196f3, () => {
            this.scene.stop('GameScene');
            this.scene.stop();
            this.scene.start('MenuScene');
        });
        
        this.victoryOverlay.add([overlay, panel, title, scoreText, stars, ...nextButton, ...menuButton]);
        this.victoryOverlay.setVisible(false);
    }

    private createStyledButton(x: number, y: number, text: string, color: number, callback: () => void): Phaser.GameObjects.GameObject[] {
        const buttonBg = this.add.graphics();
        buttonBg.fillStyle(color, 0.9);
        buttonBg.fillRoundedRect(x - 100, y - 25, 200, 50, 10);
        buttonBg.lineStyle(2, 0xffffff, 0.8);
        buttonBg.strokeRoundedRect(x - 100, y - 25, 200, 50, 10);
        
        const buttonText = this.add.text(x, y, text, {
            fontSize: '20px',
            fontFamily: 'Arial Black',
            color: '#ffffff',
            shadow: {
                offsetX: 1,
                offsetY: 1,
                color: '#000000',
                blur: 2,
                fill: true
            }
        });
        buttonText.setOrigin(0.5);
        
        // Создаём интерактивную зону
        const hitArea = this.add.rectangle(x, y, 200, 50, 0x000000, 0);
        hitArea.setInteractive({ useHandCursor: true });
        
        hitArea.on('pointerover', () => {
            buttonBg.clear();
            buttonBg.fillStyle(color, 1);
            buttonBg.fillRoundedRect(x - 105, y - 27, 210, 54, 10);
            buttonBg.lineStyle(3, 0xffffff, 1);
            buttonBg.strokeRoundedRect(x - 105, y - 27, 210, 54, 10);
            buttonText.setScale(1.05);
        });
        
        hitArea.on('pointerout', () => {
            buttonBg.clear();
            buttonBg.fillStyle(color, 0.9);
            buttonBg.fillRoundedRect(x - 100, y - 25, 200, 50, 10);
            buttonBg.lineStyle(2, 0xffffff, 0.8);
            buttonBg.strokeRoundedRect(x - 100, y - 25, 200, 50, 10);
            buttonText.setScale(1);
        });
        
        hitArea.on('pointerdown', callback);
        
        return [buttonBg, buttonText, hitArea];
    }

    private updateScore(score: number): void {
        this.scoreText.setText(score.toString());
        
        // Анимация при обновлении
        this.tweens.add({
            targets: this.scoreText,
            scaleX: 1.3,
            scaleY: 1.3,
            duration: 100,
            yoyo: true,
            ease: 'Power1'
        });
    }

    private updateLives(lives: number): void {
        this.currentLives = lives;
        this.currentPartialHealth = 3; // Сбрасываем частичное здоровье при потере полной жизни
        
        // Очищаем все частичные индикаторы
        this.heartPartials.forEach(partial => partial.clear());
        
        // Обновляем отображение сердечек
        for (let i = 0; i < this.hearts.length; i++) {
            if (!this.hearts[i] || !this.hearts[i].active) continue;
            
            if (i < lives) {
                this.hearts[i].setTexture('heart');
                this.hearts[i].setAlpha(1);
            } else {
                this.hearts[i].setTexture('heart_empty');
                this.hearts[i].setAlpha(0.5);
            }
        }
        
        // Анимация потери жизни
        if (lives < GameConfig.MAX_LIVES) {
            const lostHeart = this.hearts[lives];
            this.tweens.add({
                targets: lostHeart,
                scaleX: 1.5,
                scaleY: 1.5,
                alpha: 0,
                duration: 300,
                onComplete: () => {
                    if (lostHeart && lostHeart.active) {
                        lostHeart.setScale(1);
                        lostHeart.setAlpha(0.5);
                        lostHeart.setTexture('heart_empty');
                    }
                }
            });
        }
    }

    private startPowerUpTimer(type: string): void {
        // Отображаем иконку активного power-up в центре
        const centerX = 640;
        const centerY = 40;
        
        // Удаляем старую иконку если есть
        if (this.powerUpIcons.has(type)) {
            const oldIcon = this.powerUpIcons.get(type);
            oldIcon?.destroy();
        }
        
        // Создаём контейнер для power-up
        const container = this.add.container(centerX, centerY);
        container.setScrollFactor(0);
        
        // Фон для иконки
        const bg = this.add.graphics();
        bg.fillStyle(0x000000, 0.6);
        bg.fillRoundedRect(-30, -30, 60, 60, 10);
        bg.lineStyle(2, this.getPowerUpColor(type), 1);
        bg.strokeRoundedRect(-30, -30, 60, 60, 10);
        
        // Иконка power-up
        const icon = this.add.image(0, 0, `powerup_${type}`);
        icon.setScale(0.8);
        
        // Таймер
        const timerText = this.add.text(0, 40, '', {
            fontSize: '16px',
            fontFamily: 'Arial Black',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        });
        timerText.setOrigin(0.5);
        
        container.add([bg, icon, timerText]);
        this.powerUpIcons.set(type, container);
        
        // Анимация появления
        container.setScale(0);
        this.tweens.add({
            targets: container,
            scale: 1,
            duration: 300,
            ease: 'Back.out'
        });
        
        // Запускаем таймер
        let timeLeft = GameConfig.POWERUP_DURATION / 1000;
        
        const timerEvent = this.time.addEvent({
            delay: 1000,
            callback: () => {
                timeLeft--;
                if (timeLeft > 0) {
                    timerText.setText(`${timeLeft}s`);
                } else {
                    // Анимация исчезновения
                    this.tweens.add({
                        targets: container,
                        scale: 0,
                        alpha: 0,
                        duration: 300,
                        onComplete: () => {
                            container.destroy();
                            this.powerUpIcons.delete(type);
                        }
                    });
                }
            },
            repeat: timeLeft - 1
        });
        
        timerText.setText(`${timeLeft}s`);
    }

    private getPowerUpColor(type: string): number {
        switch (type) {
            case 'jump': return 0xffd700;
            case 'speed': return 0x00ffff;
            case 'invincible': return 0xff00ff;
            default: return 0xffffff;
        }
    }

    private showPauseOverlay(): void {
        this.pauseOverlay.setVisible(true);
        
        // Анимация появления
        this.pauseOverlay.setScale(0);
        this.tweens.add({
            targets: this.pauseOverlay,
            scaleX: 1,
            scaleY: 1,
            duration: 200,
            ease: 'Back.out'
        });
    }

    private hidePauseOverlay(): void {
        // Анимация исчезновения
        this.tweens.add({
            targets: this.pauseOverlay,
            scaleX: 0,
            scaleY: 0,
            duration: 200,
            ease: 'Back.in',
            onComplete: () => {
                this.pauseOverlay.setVisible(false);
            }
        });
    }

    private showGameOverOverlay(finalScore: number): void {
        this.gameOverOverlay.setVisible(true);
        
        // Обновляем счёт
        const scoreText = this.gameOverOverlay.getByName('finalScore') as Phaser.GameObjects.Text;
        if (scoreText) {
            scoreText.setText(`Итоговый счёт: ${finalScore}`);
        }
        
        // Анимация появления
        this.gameOverOverlay.setAlpha(0);
        this.tweens.add({
            targets: this.gameOverOverlay,
            alpha: 1,
            duration: 1000
        });
    }

    private updatePartialHealth(partialHealth: number): void {
        this.currentPartialHealth = partialHealth;
        
        // Обновляем визуализацию частичного урона на последнем целом сердце
        const lastFullHeart = this.currentLives - 1;
        
        // Очищаем все частичные индикаторы
        this.heartPartials.forEach(partial => partial.clear());
        
        if (lastFullHeart >= 0 && lastFullHeart < this.hearts.length) {
            const heart = this.hearts[lastFullHeart];
            const partial = this.heartPartials[lastFullHeart];
            
            if (heart && partial && heart.active) {
                const x = heart.x;
                const y = heart.y;
                
                // Рисуем тёмную маску поверх сердца для показа потерянных частей
                partial.clear();
                
                if (partialHealth < 3) {
                    // Затемняем часть сердца в зависимости от потерянного здоровья
                    partial.fillStyle(0x000000, 0.6);
                    
                    if (partialHealth === 2) {
                        // Потеряна 1/3 - затемняем правую треть
                        partial.fillRect(x + 5, y - 14, 9, 28);
                    } else if (partialHealth === 1) {
                        // Потеряны 2/3 - затемняем правые две трети
                        partial.fillRect(x - 2, y - 14, 16, 28);
                    }
                    
                    // Добавляем красные трещины для драматичности
                    partial.lineStyle(1, 0xff0000, 0.8);
                    if (partialHealth === 2) {
                        partial.lineBetween(x + 8, y - 10, x + 6, y + 5);
                    } else if (partialHealth === 1) {
                        partial.lineBetween(x + 8, y - 10, x + 6, y + 5);
                        partial.lineBetween(x, y - 8, x - 2, y + 8);
                    }
                }
            }
        }
    }

    private showVictoryOverlay(finalScore: number): void {
        this.victoryOverlay.setVisible(true);
        
        // Обновляем счёт
        const scoreText = this.victoryOverlay.getByName('finalScore') as Phaser.GameObjects.Text;
        if (scoreText) {
            scoreText.setText(`Итоговый счёт: ${finalScore}`);
        }
        
        // Анимация появления
        this.victoryOverlay.setScale(0);
        this.tweens.add({
            targets: this.victoryOverlay,
            scaleX: 1,
            scaleY: 1,
            duration: 500,
            ease: 'Back.out'
        });
        
        // Конфетти эффект
        for (let i = 0; i < 50; i++) {
            const confetti = this.add.rectangle(
                Math.random() * 1280,
                -50,
                10,
                10,
                Phaser.Math.Between(0xff0000, 0xffff00)
            );
            
            this.tweens.add({
                targets: confetti,
                y: 800,
                x: confetti.x + Phaser.Math.Between(-100, 100),
                rotation: Math.PI * 4,
                duration: Phaser.Math.Between(2000, 4000),
                ease: 'Quad.in',
                onComplete: () => confetti.destroy()
            });
        }
    }

    update(time: number, delta: number): void {
        // Обновляем FPS
        const fps = Math.round(1000 / delta);
        this.fpsText.setText(`FPS: ${fps}`);
        
        // Цвет FPS в зависимости от производительности
        if (fps >= 55) {
            this.fpsText.setColor('#66bb6a'); // Зелёный
        } else if (fps >= 30) {
            this.fpsText.setColor('#ffeb3b'); // Жёлтый
        } else {
            this.fpsText.setColor('#ef5350'); // Красный
        }
    }
}