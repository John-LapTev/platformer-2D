import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';
import { SettingsModal } from '../ui/SettingsModal';

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
    private iconPanel!: Phaser.GameObjects.Container;
    private iconButtons: Map<string, Phaser.GameObjects.Container> = new Map();

    constructor() {
        super({ key: 'UIScene' });
    }

    create(): void {
        // UI всегда поверх игры
        this.scene.bringToTop();
        
        // Обработка изменения размера экрана
        this.scale.on('resize', this.handleResize, this);
        
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
        // Создаём автоматическую панель для иконок справа
        this.createIconPanel();
        
        // FPS счётчик под панелью иконок
        this.fpsText = this.add.text(this.scale.width - 60, 65, 'FPS: 60', {
            fontSize: '14px',
            fontFamily: 'Courier New, monospace',
            color: '#66bb6a',
            shadow: {
                offsetX: 1,
                offsetY: 1,
                color: '#000000',
                blur: 3,
                fill: true
            }
        });
        this.fpsText.setOrigin(1, 0);
        this.fpsText.setScrollFactor(0);
    }
    
    private createIconPanel(): void {
        // Создаём горизонтальную панель иконок вверху справа
        const panelX = this.scale.width - 120;
        const panelY = 30;
        this.iconPanel = this.add.container(panelX, panelY);
        this.iconPanel.setScrollFactor(0);
        
        // Красивый градиентный фон панели
        const panelBg = this.add.graphics();
        // Тёмный полупрозрачный фон с градиентом
        panelBg.fillGradientStyle(0x1a1a1a, 0x2a2a2a, 0x1a1a1a, 0x2a2a2a, 0.85, 0.85, 0.75, 0.75);
        panelBg.fillRoundedRect(-105, -22, 210, 44, 15);
        // Стильная рамка
        panelBg.lineStyle(2, 0xffffff, 0.2);
        panelBg.strokeRoundedRect(-105, -22, 210, 44, 15);
        // Внутренняя подсветка
        panelBg.lineStyle(1, 0xffffff, 0.1);
        panelBg.strokeRoundedRect(-103, -20, 206, 40, 14);
        this.iconPanel.add(panelBg);
        
        // Добавляем кнопки в панель горизонтально
        const buttonSpacing = 45;
        const startX = -75;
        
        // Кнопка паузы
        this.pauseButton = this.createIconButton(startX, 0, 0x2196f3, () => {
            const gameScene = this.scene.get('GameScene');
            gameScene.events.emit('toggle-pause');
        });
        const pauseIcon = this.add.text(0, 0, '⏸', {
            fontSize: '22px',
            color: '#ffffff'
        });
        pauseIcon.setOrigin(0.5);
        this.pauseButton.add(pauseIcon);
        this.iconPanel.add(this.pauseButton);
        this.iconButtons.set('pause', this.pauseButton);
        
        // Кнопка звука с Unicode иконкой
        const muteButton = this.createIconButton(startX + buttonSpacing, 0, 0x9c27b0, () => {
            this.toggleMute();
        });
        // Используем Unicode символ для динамика
        const speakerIcon = this.add.text(0, 0, '🔊', {
            fontSize: '18px'
        });
        speakerIcon.setOrigin(0.5);
        muteButton.add(speakerIcon);
        muteButton.setData('icon', speakerIcon);
        this.iconPanel.add(muteButton);
        this.iconButtons.set('mute', muteButton);
        
        // Кнопка полноэкранного режима
        const fullscreenButton = this.createIconButton(startX + buttonSpacing * 2, 0, 0x4caf50, () => {
            if (this.scale.isFullscreen) {
                this.scale.stopFullscreen();
            } else {
                this.scale.startFullscreen();
            }
        });
        const fullscreenIcon = this.add.text(0, 0, '⛶', {
            fontSize: '22px',
            color: '#ffffff'
        });
        fullscreenIcon.setOrigin(0.5);
        fullscreenButton.add(fullscreenIcon);
        fullscreenButton.setData('icon', fullscreenIcon);
        this.iconPanel.add(fullscreenButton);
        this.iconButtons.set('fullscreen', fullscreenButton);
        
        // Кнопка настроек
        const settingsButton = this.createIconButton(startX + buttonSpacing * 3, 0, 0xff9800, () => {
            this.showSettingsModal();
        });
        const settingsIcon = this.add.text(0, 0, '⚙', {
            fontSize: '22px',
            color: '#ffffff'
        });
        settingsIcon.setOrigin(0.5);
        settingsButton.add(settingsIcon);
        this.iconPanel.add(settingsButton);
        this.iconButtons.set('settings', settingsButton);
    }
    
    private createIconButton(x: number, y: number, color: number, callback: () => void): Phaser.GameObjects.Container {
        const container = this.add.container(x, y);
        
        const bg = this.add.graphics();
        bg.fillStyle(color, 0.8);
        bg.fillCircle(0, 0, 18);
        bg.lineStyle(1.5, 0xffffff, 0.5);
        bg.strokeCircle(0, 0, 18);
        
        container.add(bg);
        container.setInteractive(new Phaser.Geom.Circle(0, 0, 18), Phaser.Geom.Circle.Contains);
        
        // Hover эффекты
        container.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(color, 1);
            bg.fillCircle(0, 0, 20);
            bg.lineStyle(2, 0xffffff, 0.8);
            bg.strokeCircle(0, 0, 20);
            container.setScale(1.1);
        });
        
        container.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(color, 0.8);
            bg.fillCircle(0, 0, 18);
            bg.lineStyle(1.5, 0xffffff, 0.5);
            bg.strokeCircle(0, 0, 18);
            container.setScale(1);
        });
        
        container.on('pointerdown', callback);
        
        container.setData('bg', bg);
        container.setData('color', color);
        
        return container;
    }
    
    private updateSpeakerIcon(graphics: Phaser.GameObjects.Graphics): void {
        graphics.clear();
        const isMuted = localStorage.getItem('soundMuted') === 'true';
        
        // Рисуем реалистичный динамик
        graphics.fillStyle(0xffffff, 1);
        
        // Основная часть динамика
        graphics.fillRect(-8, -4, 6, 8);
        
        // Диффузор динамика
        graphics.beginPath();
        graphics.moveTo(-2, -4);
        graphics.lineTo(4, -7);
        graphics.lineTo(4, 7);
        graphics.lineTo(-2, 4);
        graphics.closePath();
        graphics.fillPath();
        
        // Коннектор
        graphics.fillRect(-3, -2, 2, 4);
        
        if (isMuted) {
            // Крестик для выключенного звука
            graphics.lineStyle(2, 0xff0000, 1);
            graphics.lineBetween(6, -6, -6, 6);
            graphics.lineBetween(-6, -6, 6, 6);
        } else {
            // Волны звука
            graphics.lineStyle(1.5, 0xffffff, 0.9);
            graphics.beginPath();
            graphics.arc(5, 0, 4, -0.6, 0.6, false);
            graphics.strokePath();
            
            graphics.lineStyle(1.5, 0xffffff, 0.6);
            graphics.beginPath();
            graphics.arc(5, 0, 7, -0.6, 0.6, false);
            graphics.strokePath();
            
            graphics.lineStyle(1.5, 0xffffff, 0.3);
            graphics.beginPath();
            graphics.arc(5, 0, 10, -0.6, 0.6, false);
            graphics.strokePath();
        }
    }
    
    private toggleMute(): void {
        const isMuted = localStorage.getItem('soundMuted') === 'true';
        const newMuted = !isMuted;
        
        localStorage.setItem('soundMuted', String(newMuted));
        
        // Применяем изменения к звуковой системе игры
        const gameScene = this.scene.get('GameScene') as any;
        if (gameScene && gameScene.soundSystem) {
            if (newMuted) {
                gameScene.soundSystem.setMusicVolume(0);
                gameScene.soundSystem.setSfxVolume(0);
            } else {
                const musicVolume = parseFloat(localStorage.getItem('musicVolume') || '0.2');
                const sfxVolume = parseFloat(localStorage.getItem('sfxVolume') || '0.4');
                gameScene.soundSystem.setMusicVolume(musicVolume);
                gameScene.soundSystem.setSfxVolume(sfxVolume);
            }
            
            // Звук клика
            if (!newMuted) {
                gameScene.soundSystem.playSound('coin', { volume: 0.3 });
            }
        }
        
        // Обновляем иконку
        const muteButton = this.iconButtons.get('mute');
        if (muteButton) {
            const icon = muteButton.getData('icon');
            if (icon && icon instanceof Phaser.GameObjects.Text) {
                icon.setText(newMuted ? '🔇' : '🔊');
            }
        }
    }

    private createPauseOverlay(): void {
        const { width, height } = this.scale;
        this.pauseOverlay = this.add.container(width / 2, height / 2);
        
        // Затемнение на весь экран
        const overlay = this.add.rectangle(0, 0, width * 2, height * 2, 0x000000, 0.85);
        
        // Панель паузы на весь экран с отступами
        const panelWidth = Math.min(width * 0.9, 1200);
        const panelHeight = Math.min(height * 0.85, 700);
        
        const panel = this.add.graphics();
        panel.fillGradientStyle(0x1a1a2e, 0x0f3460, 0x1a1a2e, 0x0f3460, 0.98);
        panel.fillRoundedRect(-panelWidth/2, -panelHeight/2, panelWidth, panelHeight, 30);
        panel.lineStyle(4, 0x2196f3, 1);
        panel.strokeRoundedRect(-panelWidth/2, -panelHeight/2, panelWidth, panelHeight, 30);
        
        // Заголовок
        const title = this.add.text(0, -250, 'ПАУЗА', {
            fontSize: '72px',
            fontFamily: 'Arial Black',
            color: '#ffffff',
            shadow: {
                offsetX: 3,
                offsetY: 3,
                color: '#000000',
                blur: 8,
                fill: true
            }
        });
        title.setOrigin(0.5);
        
        // Кнопка продолжить
        const continueButton = this.createStyledButton(0, -50, 'Продолжить', 0x4caf50, () => {
            const gameScene = this.scene.get('GameScene');
            gameScene.events.emit('toggle-pause');
        });
        
        // Кнопка настроек
        const settingsButton = this.createStyledButton(0, 50, 'Настройки', 0x2196f3, () => {
            this.showSettingsModal();
        });
        
        // Кнопка в меню
        const menuButton = this.createStyledButton(0, 150, 'В меню', 0xf44336, () => {
            // Останавливаем ВСЕ звуки перед переходом в меню
            this.sound.stopAll();
            this.scene.stop('GameScene');
            this.scene.stop();
            this.scene.start('MenuScene');
        });
        
        this.pauseOverlay.add([overlay, panel, title, ...continueButton, ...settingsButton, ...menuButton]);
        this.pauseOverlay.setVisible(false);
    }

    private createGameOverOverlay(): void {
        const { width, height } = this.scale;
        this.gameOverOverlay = this.add.container(width / 2, height / 2);
        
        // Затемнение на весь экран
        const overlay = this.add.rectangle(0, 0, width * 2, height * 2, 0x000000, 0.9);
        
        // Панель на весь экран
        const panelWidth = Math.min(width * 0.8, 800);
        const panelHeight = Math.min(height * 0.75, 600);
        
        const panel = this.add.graphics();
        panel.fillGradientStyle(0x8b0000, 0x330000, 0x8b0000, 0x330000, 1);
        panel.fillRoundedRect(-panelWidth/2, -panelHeight/2, panelWidth, panelHeight, 25);
        panel.lineStyle(4, 0xff0000, 1);
        panel.strokeRoundedRect(-panelWidth/2, -panelHeight/2, panelWidth, panelHeight, 25);
        
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
            // Останавливаем ВСЕ звуки перед переходом в меню
            this.sound.stopAll();
            this.scene.stop('GameScene');
            this.scene.stop();
            this.scene.start('MenuScene');
        });
        
        this.gameOverOverlay.add([overlay, panel, title, scoreText, ...retryButton, ...menuButton]);
        this.gameOverOverlay.setVisible(false);
    }

    private createVictoryOverlay(): void {
        const { width, height } = this.scale;
        this.victoryOverlay = this.add.container(width / 2, height / 2);
        
        // Затемнение на весь экран
        const overlay = this.add.rectangle(0, 0, width * 2, height * 2, 0x000000, 0.85);
        
        // Панель победы - больше и красивее
        const panel = this.add.graphics();
        panel.fillGradientStyle(0x2e7d32, 0x1b5e20, 0x2e7d32, 0x1b5e20, 1);
        panel.fillRoundedRect(-350, -250, 700, 500, 30);
        panel.lineStyle(4, 0xffd700, 1);
        panel.strokeRoundedRect(-350, -250, 700, 500, 30);
        
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
            // Останавливаем ВСЕ звуки перед переходом в меню
            this.sound.stopAll();
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
        // Удаляем старую иконку если есть (для обновления таймера)
        if (this.powerUpIcons.has(type)) {
            const oldIcon = this.powerUpIcons.get(type);
            oldIcon?.destroy();
            this.powerUpIcons.delete(type);
        }
        
        // Создаём контейнер для power-up (сначала создаём в центре экрана)
        const { width } = this.scale;
        const centerY = 40;
        const container = this.add.container(width / 2, centerY);
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
        
        // Добавляем в Map
        this.powerUpIcons.set(type, container);
        
        // Перепозиционируем все иконки после добавления новой
        this.repositionPowerUpIcons();
        
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
                if (timeLeft > 0 && timerText && timerText.active) {
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
                            // Перепозиционируем оставшиеся иконки
                            this.repositionPowerUpIcons();
                        }
                    });
                }
            },
            repeat: timeLeft - 1
        });
        
        timerText.setText(`${timeLeft}s`);
    }

    private repositionPowerUpIcons(): void {
        const { width } = this.scale;
        const iconSpacing = 70;
        const totalIcons = this.powerUpIcons.size;
        const startX = width / 2 - ((totalIcons - 1) * iconSpacing) / 2;
        
        let index = 0;
        this.powerUpIcons.forEach((icon) => {
            this.tweens.add({
                targets: icon,
                x: startX + index * iconSpacing,
                duration: 300,
                ease: 'Power2'
            });
            index++;
        });
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
    
    private showSettingsModal(): void {
        const gameScene = this.scene.get('GameScene') as any;
        if (gameScene && gameScene.soundSystem) {
            const modal = new SettingsModal(this, gameScene.soundSystem);
            modal.show();
        }
    }
    
    // Удаляем старый метод createMuteButton - теперь он встроен в панель иконок

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
        
        // Обновляем иконку полноэкранного режима
        const fullscreenButton = this.iconButtons.get('fullscreen');
        if (fullscreenButton) {
            const icon = fullscreenButton.getData('icon');
            if (icon && icon instanceof Phaser.GameObjects.Text) {
                icon.setText(this.scale.isFullscreen ? '⛷' : '⛶');
            }
        }
    }
    
    private handleResize(gameSize: Phaser.Structs.Size): void {
        // Обновляем позиции UI элементов при изменении размера экрана
        const { width, height } = gameSize;
        
        // Обновляем позиции элементов UI
        if (this.fpsText) {
            this.fpsText.setPosition(width - 60, 65);
        }
        
        if (this.iconPanel) {
            this.iconPanel.setPosition(width - 120, 30);
        }
        
        // Обновляем power-up иконки в центре
        this.powerUpIcons.forEach(container => {
            container.setPosition(width / 2, 40);
        });
        
        // Обновляем оверлеи
        if (this.pauseOverlay) {
            this.pauseOverlay.setPosition(width / 2, height / 2);
        }
        
        if (this.gameOverOverlay) {
            this.gameOverOverlay.setPosition(width / 2, height / 2);
        }
        
        if (this.victoryOverlay) {
            this.victoryOverlay.setPosition(width / 2, height / 2);
        }
    }
}