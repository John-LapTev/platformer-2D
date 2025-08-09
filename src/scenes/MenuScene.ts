import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';
import { SaveSystem } from '../systems/SaveSystem';

export class MenuScene extends Phaser.Scene {
    private selectedLevel: number = 0;
    private levelButtons: Phaser.GameObjects.Container[] = [];
    private playButton!: Phaser.GameObjects.Container;
    private isMobile: boolean = false;

    constructor() {
        super({ key: 'MenuScene' });
    }

    create(): void {
        this.isMobile = this.checkMobile();
        
        // Красивый фон меню
        const bg = this.add.image(640, 360, this.textures.exists('background-forest') ? 'background-forest' : 'sky');
        bg.setDisplaySize(1280, 720);
        
        // Затемнение для меню
        const overlay = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.4);
        
        // Добавляем частицы для красоты
        const particles = this.add.particles(0, 0, 'coin', {
            x: { min: 0, max: 1280 },
            y: { min: -100, max: 0 },
            scale: { start: 0.5, end: 0 },
            alpha: { start: 0.8, end: 0 },
            speed: { min: 100, max: 200 },
            lifespan: 8000,
            frequency: 200,
            tint: [0xffdd00, 0xff00ff, 0x00ffff],
            blendMode: Phaser.BlendModes.ADD,
            gravityY: 50
        });
        
        // Профессиональный заголовок
        const title = this.add.text(640, 100, 'SUPER ADVENTURE', {
            fontSize: '84px',
            fontFamily: 'Trebuchet MS, Arial Black, sans-serif',
            color: '#ffffff',
            stroke: '#2c3e50',
            strokeThickness: 8,
            shadow: {
                offsetX: 4,
                offsetY: 4,
                color: '#000000',
                blur: 15,
                stroke: true,
                fill: true
            }
        });
        title.setOrigin(0.5);
        title.setResolution(2); // Улучшаем качество текста
        
        // Плавная анимация заголовка 60 FPS
        this.tweens.add({
            targets: title,
            scaleX: 1.02,
            scaleY: 1.02,
            duration: 3000,
            yoyo: true,
            repeat: -1,
            ease: 'Power1'
        });
        
        // Подзаголовок
        const subtitle = this.add.text(640, 180, 'Выберите уровень', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#ffffff'
        });
        subtitle.setOrigin(0.5);
        
        // Создаём кнопки уровней
        this.createLevelButtons();
        
        // Кнопка играть
        this.createPlayButton();
        
        // Кнопка настроек
        this.createSettingsButton();
        
        // Проверяем сохранения
        this.checkSaveData();
        
        // Инструкции для мобильных
        if (this.isMobile) {
            const mobileHint = this.add.text(640, 650, 'Нажмите на уровень для выбора', {
                fontSize: '18px',
                fontFamily: 'Arial',
                color: '#ffffff'
            });
            mobileHint.setOrigin(0.5);
        }
        
        // Клавиатурное управление
        if (!this.isMobile) {
            this.input.keyboard?.on('keydown-ENTER', () => {
                this.startGame();
            });
            
            this.input.keyboard?.on('keydown-LEFT', () => {
                this.selectLevel(Math.max(0, this.selectedLevel - 1));
            });
            
            this.input.keyboard?.on('keydown-RIGHT', () => {
                this.selectLevel(Math.min(GameConfig.LEVELS.length - 1, this.selectedLevel + 1));
            });
        }
    }

    private checkMobile(): boolean {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    private createLevelButtons(): void {
        const startX = 640 - (GameConfig.LEVELS.length - 1) * 100;
        
        GameConfig.LEVELS.forEach((level, index) => {
            const x = startX + index * 200;
            const y = 350;
            
            const container = this.add.container(x, y);
            
            // Профессиональная кнопка с градиентом
            const bg = this.add.graphics();
            bg.fillGradientStyle(0x3498db, 0x2980b9, 0x3498db, 0x2980b9, 1);
            bg.fillRoundedRect(-90, -60, 180, 120, 15);
            bg.lineStyle(3, 0xffffff, 0.9);
            bg.strokeRoundedRect(-90, -60, 180, 120, 15);
            
            // Номер уровня
            const levelNumber = this.add.text(0, -20, `Уровень ${index + 1}`, {
                fontSize: '28px',
                fontFamily: 'Segoe UI, Arial Black, sans-serif',
                color: '#ffffff',
                fontStyle: 'bold'
            });
            levelNumber.setOrigin(0.5);
            levelNumber.setResolution(2);
            
            // Название уровня
            const levelName = this.add.text(0, 20, level.name, {
                fontSize: '18px',
                fontFamily: 'Segoe UI, Arial, sans-serif',
                color: '#e8f4f8'
            });
            levelName.setOrigin(0.5);
            levelName.setResolution(2);
            
            container.add([bg, levelNumber, levelName]);
            
            // Добавляем иконку замка для заблокированных уровней
            if (index > 0) {
                const lock = this.add.text(60, -40, '🔒', {
                    fontSize: '24px'
                });
                lock.setAlpha(0.7);
                container.add(lock);
            }
            
            // Интерактивность
            const hitArea = new Phaser.Geom.Rectangle(-90, -60, 180, 120);
            bg.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
            
            bg.on('pointerdown', () => {
                this.selectLevel(index);
            });
            
            bg.on('pointerover', () => {
                this.tweens.add({
                    targets: container,
                    scaleX: 1.1,
                    scaleY: 1.1,
                    duration: 200
                });
            });
            
            bg.on('pointerout', () => {
                if (index !== this.selectedLevel) {
                    this.tweens.add({
                        targets: container,
                        scaleX: 1,
                        scaleY: 1,
                        duration: 200
                    });
                }
            });
            
            this.levelButtons.push(container);
        });
        
        // Выбираем первый уровень по умолчанию
        this.selectLevel(0);
    }

    private createPlayButton(): void {
        this.playButton = this.add.container(640, 500);
        
        // Красивая кнопка "Играть"
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x27ae60, 0x229954, 0x27ae60, 0x229954, 1);
        bg.fillRoundedRect(-100, -30, 200, 60, 20);
        bg.lineStyle(3, 0xffffff, 1);
        bg.strokeRoundedRect(-100, -30, 200, 60, 20);
        
        // Тень кнопки
        const shadow = this.add.graphics();
        shadow.fillStyle(0x000000, 0.3);
        shadow.fillRoundedRect(-98, -28, 200, 60, 20);
        shadow.setPosition(3, 3);
        
        const text = this.add.text(0, 0, 'ИГРАТЬ', {
            fontSize: '36px',
            fontFamily: 'Segoe UI, Arial Black, sans-serif',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        text.setOrigin(0.5);
        text.setResolution(2);
        
        this.playButton.add([shadow, bg, text]);
        
        // Интерактивность
        const hitArea = new Phaser.Geom.Rectangle(-100, -30, 200, 60);
        bg.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
        
        bg.on('pointerdown', () => {
            this.startGame();
        });
        
        bg.on('pointerover', () => {
            this.tweens.add({
                targets: this.playButton,
                scaleX: 1.1,
                scaleY: 1.1,
                duration: 200
            });
        });
        
        bg.on('pointerout', () => {
            this.tweens.add({
                targets: this.playButton,
                scaleX: 1,
                scaleY: 1,
                duration: 200
            });
        });
    }

    private createSettingsButton(): void {
        const container = this.add.container(1200, 50);
        
        const bg = this.add.circle(0, 0, 25, 0x666666, 0.8);
        bg.setStrokeStyle(2, 0xffffff);
        
        const icon = this.add.text(0, 0, '⚙', {
            fontSize: '24px',
            color: '#ffffff'
        });
        icon.setOrigin(0.5);
        
        container.add([bg, icon]);
        
        bg.setInteractive({ useHandCursor: true });
        
        bg.on('pointerdown', () => {
            // Открыть настройки
            console.log('Открыть настройки');
        });
    }

    private selectLevel(index: number): void {
        this.selectedLevel = index;
        
        // Обновляем визуальное состояние кнопок
        this.levelButtons.forEach((button, i) => {
            if (i === index) {
                this.tweens.add({
                    targets: button,
                    scaleX: 1.2,
                    scaleY: 1.2,
                    duration: 200
                });
                // Обновляем градиент для выбранной кнопки
                const selectedBg = button.getAt(0);
                if (selectedBg && selectedBg instanceof Phaser.GameObjects.Graphics) {
                    selectedBg.clear();
                    selectedBg.fillGradientStyle(0xe74c3c, 0xc0392b, 0xe74c3c, 0xc0392b, 1);
                    selectedBg.fillRoundedRect(-90, -60, 180, 120, 15);
                    selectedBg.lineStyle(3, 0xffffff, 1);
                    selectedBg.strokeRoundedRect(-90, -60, 180, 120, 15);
                }
            } else {
                this.tweens.add({
                    targets: button,
                    scaleX: 1,
                    scaleY: 1,
                    duration: 200
                });
                // Возвращаем обычный градиент
                const normalBg = button.getAt(0);
                if (normalBg && normalBg instanceof Phaser.GameObjects.Graphics) {
                    normalBg.clear();
                    normalBg.fillGradientStyle(0x3498db, 0x2980b9, 0x3498db, 0x2980b9, 1);
                    normalBg.fillRoundedRect(-90, -60, 180, 120, 15);
                    normalBg.lineStyle(3, 0xffffff, 0.9);
                    normalBg.strokeRoundedRect(-90, -60, 180, 120, 15);
                }
            }
        });
    }

    private checkSaveData(): void {
        const saveData = SaveSystem.load();
        if (saveData) {
            // Отобразить прогресс на кнопках уровней
            console.log('Найдено сохранение:', saveData);
        }
    }

    private startGame(): void {
        const level = GameConfig.LEVELS[this.selectedLevel];
        
        // Эффект перехода
        this.cameras.main.fadeOut(500, 0, 0, 0);
        
        this.time.delayedCall(500, () => {
            // Передаём данные о выбранном уровне
            this.scene.start('GameScene', { level: level.key });
            this.scene.start('UIScene');
        });
    }
}