import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';
import { SaveSystem } from '../systems/SaveSystem';
import { SoundSystem } from '../systems/SoundSystem';
import { SettingsModal } from '../ui/SettingsModal';

export class MenuScene extends Phaser.Scene {
    private selectedLevel: number = 0;
    private levelButtons: Phaser.GameObjects.Container[] = [];
    private playButton!: Phaser.GameObjects.Container;
    private isMobile: boolean = false;
    private soundSystem!: SoundSystem;
    private settingsModal!: SettingsModal;

    constructor() {
        super({ key: 'MenuScene' });
    }

    create(): void {
        this.isMobile = this.checkMobile();
        
        // Инициализируем звуковую систему
        this.soundSystem = new SoundSystem(this);
        this.soundSystem.createSounds();
        
        // Обработка первого клика для разблокировки AudioContext
        const resumeAudioContext = () => {
            if (this.sound.context && this.sound.context.state === 'suspended') {
                this.sound.context.resume();
            }
            // Запускаем музыку только после первого взаимодействия
            this.soundSystem.playMusic('menu_music');
            // Удаляем обработчик после первого клика
            this.input.off('pointerdown', resumeAudioContext);
        };
        
        // Добавляем одноразовый обработчик на первый клик
        this.input.once('pointerdown', resumeAudioContext);
        
        // Пытаемся запустить музыку сразу (если контекст уже активен)
        if (this.sound.context && this.sound.context.state === 'running') {
            this.soundSystem.playMusic('menu_music');
        }
        
        // Получаем реальные размеры экрана
        const { width, height } = this.scale;
        const centerX = width / 2;
        const centerY = height / 2;
        
        // Красивый фон меню на весь экран
        const bg = this.add.image(centerX, centerY, this.textures.exists('background-forest') ? 'background-forest' : 'sky');
        bg.setDisplaySize(width, height);
        
        // Глубокое затемнение с тёплым градиентом
        const overlay = this.add.graphics();
        overlay.fillGradientStyle(0x2e1a0c, 0x3e2a1a, 0x2e1a0c, 0x3e2a1a, 0.85, 0.85, 0.7, 0.7);
        overlay.fillRect(0, 0, width, height);
        
        // Красивые светящиеся частицы
        const particles = this.add.particles(0, 0, this.textures.exists('coin') ? 'coin' : 'fog_particle', {
            x: { min: -50, max: width + 50 },
            y: { min: -100, max: height + 100 },
            scale: { start: 0.2, end: 0 },
            alpha: { start: 0.6, end: 0 },
            speed: { min: 30, max: 80 },
            lifespan: { min: 8000, max: 15000 },
            frequency: 300,
            tint: [0xffd700, 0x00d4ff, 0xff69b4, 0x98fb98],
            blendMode: Phaser.BlendModes.ADD,
            gravityY: -20
        });
        
        // Дополнительные магические сверкающие частицы
        const sparkles = this.add.particles(0, 0, this.textures.exists('fog_particle') ? 'fog_particle' : 'coin', {
            x: { min: 0, max: width },
            y: { min: 0, max: height },
            scale: { start: 0.1, end: 0 },
            alpha: { start: 1, end: 0 },
            speed: { min: 10, max: 50 },
            lifespan: { min: 2000, max: 4000 },
            frequency: 100,
            tint: [0xffffff, 0xffff00],
            blendMode: Phaser.BlendModes.ADD,
            emitZone: { type: 'random', source: new Phaser.Geom.Rectangle(0, 0, width, height) }
        });
        
        // Эпический заголовок с эффектами
        const titleShadow = this.add.text(centerX + 8, height * 0.14 + 8, 'SUPER ADVENTURE', {
            fontSize: '96px',
            fontFamily: 'Impact, Trebuchet MS, Arial Black, sans-serif',
            color: '#000000',
            alpha: 0.3
        });
        titleShadow.setOrigin(0.5);
        
        // 3D заголовок в тёплых тонах
        const title = this.add.text(centerX, height * 0.14, 'SUPER ADVENTURE', {
            fontSize: '96px',
            fontFamily: 'Impact, Trebuchet MS, Arial Black, sans-serif',
            color: '#ffcc00',
            stroke: '#8b4513',
            strokeThickness: 8,
            shadow: {
                offsetX: 6,
                offsetY: 6,
                color: '#5a2e0a',
                blur: 12,
                stroke: true,
                fill: true
            }
        });
        title.setOrigin(0.5);
        title.setResolution(2); // Улучшаем качество текста
        
        // Плавная анимация заголовка
        this.tweens.add({
            targets: [title, titleShadow],
            scaleX: 1.03,
            scaleY: 1.03,
            duration: 4000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Мерцающие блики на заголовке
        this.tweens.add({
            targets: title,
            alpha: { from: 0.9, to: 1 },
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Power2'
        });
        
        // Красивый подзаголовок
        const subtitle = this.add.text(centerX, height * 0.28, 'Выберите уровень для приключения', {
            fontSize: '28px',
            fontFamily: 'Segoe UI, Arial, sans-serif',
            color: '#e8f5e8',
            stroke: '#2c3e50',
            strokeThickness: 2,
            shadow: {
                offsetX: 2,
                offsetY: 2,
                color: '#000000',
                blur: 5,
                fill: true
            }
        });
        subtitle.setOrigin(0.5);
        
        // Мягкая пульсация подзаголовка
        this.tweens.add({
            targets: subtitle,
            alpha: { from: 0.7, to: 1 },
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Power1'
        });
        
        // Создаём кнопки уровней
        this.createLevelButtons();
        
        // Кнопки управления
        this.createPlayButton();
        this.createSettingsButton();
        
        // Добавляем декоративные элементы
        this.createDecorations();
        
        // Создаём модальное окно настроек
        this.settingsModal = new SettingsModal(this, this.soundSystem);
        
        // Проверяем сохранения
        this.checkSaveData();
        
        // Красивый блок с инструкциями
        const hintBg = this.add.graphics();
        hintBg.fillStyle(0x000000, 0.7);
        hintBg.fillRoundedRect(centerX - 350, height * 0.88 - 25, 700, 50, 15);
        hintBg.lineStyle(2, 0xffaa00, 0.5);
        hintBg.strokeRoundedRect(centerX - 350, height * 0.88 - 25, 700, 50, 15);
        
        // Создаём SVG-подобные иконки с помощью графики
        if (!this.isMobile) {
            // Левая секция - стрелки для выбора
            const leftArrow = this.add.graphics();
            leftArrow.fillStyle(0xffffff, 1);
            leftArrow.fillTriangle(centerX - 320, height * 0.88, centerX - 310, height * 0.88 - 8, centerX - 310, height * 0.88 + 8);
            
            const rightArrow = this.add.graphics();
            rightArrow.fillStyle(0xffffff, 1);
            rightArrow.fillTriangle(centerX - 140, height * 0.88, centerX - 150, height * 0.88 - 8, centerX - 150, height * 0.88 + 8);
            
            const leftText = this.add.text(centerX - 230, height * 0.88, 'для выбора уровня', {
                fontSize: '16px',
                fontFamily: 'Arial, sans-serif',
                color: '#ffffff'
            });
            leftText.setOrigin(0.5);
            
            // Правая секция - Enter для запуска
            const enterIcon = this.add.graphics();
            enterIcon.lineStyle(2, 0xffffff, 1);
            enterIcon.strokeRoundedRect(centerX + 100, height * 0.88 - 12, 60, 24, 4);
            enterIcon.fillStyle(0xffffff, 1);
            // Стрелка Enter
            enterIcon.fillTriangle(
                centerX + 145, height * 0.88,
                centerX + 135, height * 0.88 - 5,
                centerX + 135, height * 0.88 + 5
            );
            enterIcon.beginPath();
            enterIcon.moveTo(centerX + 145, height * 0.88);
            enterIcon.lineTo(centerX + 125, height * 0.88);
            enterIcon.lineTo(centerX + 125, height * 0.88 - 8);
            enterIcon.strokePath();
            
            const rightText = this.add.text(centerX + 190, height * 0.88, 'для запуска', {
                fontSize: '16px',
                fontFamily: 'Arial, sans-serif',
                color: '#ffffff'
            });
            rightText.setOrigin(0, 0.5);
        } else {
            const hint = this.add.text(centerX, height * 0.88, 'Нажмите на карточку для выбора уровня', {
                fontSize: '18px',
                fontFamily: 'Arial, sans-serif',
                color: '#ffffff'
            });
            hint.setOrigin(0.5);
        }
        
        // Мягкая пульсация блока
        this.tweens.add({
            targets: hintBg,
            alpha: { from: 0.7, to: 1 },
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
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
    
    private createDecorations(): void {
        const { width, height } = this.scale;
        
        // Декоративные угловые элементы
        const cornerSize = 80;
        
        // Левый верхний угол
        const topLeft = this.add.graphics();
        topLeft.fillGradientStyle(0x3498db, 0x2980b9, 0x3498db, 0x2980b9, 0.6);
        topLeft.fillTriangle(0, 0, cornerSize, 0, 0, cornerSize);
        
        // Правый верхний угол
        const topRight = this.add.graphics();
        topRight.fillGradientStyle(0xe74c3c, 0xc0392b, 0xe74c3c, 0xc0392b, 0.6);
        topRight.fillTriangle(width, 0, width - cornerSize, 0, width, cornerSize);
        
        // Левый нижний угол
        const bottomLeft = this.add.graphics();
        bottomLeft.fillGradientStyle(0x27ae60, 0x229954, 0x27ae60, 0x229954, 0.6);
        bottomLeft.fillTriangle(0, height, cornerSize, height, 0, height - cornerSize);
        
        // Правый нижний угол
        const bottomRight = this.add.graphics();
        bottomRight.fillGradientStyle(0xf39c12, 0xe67e22, 0xf39c12, 0xe67e22, 0.6);
        bottomRight.fillTriangle(width, height, width - cornerSize, height, width, height - cornerSize);
        
        // Мягкая анимация углов
        [topLeft, topRight, bottomLeft, bottomRight].forEach((corner, index) => {
            this.tweens.add({
                targets: corner,
                alpha: { from: 0.3, to: 0.8 },
                duration: 2000 + index * 500,
                yoyo: true,
                repeat: -1,
                ease: 'Power2'
            });
        });
        
        // Центральные декоративные линии - подняты выше
        const centerLine1 = this.add.graphics();
        centerLine1.fillGradientStyle(0xffaa00, 0xff6600, 0xffaa00, 0xff6600, 0.4, 0.4, 0, 0);
        centerLine1.fillRect(width * 0.05, height * 0.35, width * 0.9, 3);
        
        const centerLine2 = this.add.graphics();
        centerLine2.fillGradientStyle(0xff6600, 0xffaa00, 0xff6600, 0xffaa00, 0, 0, 0.4, 0.4);
        centerLine2.fillRect(width * 0.05, height * 0.67, width * 0.9, 3);
    }

    private checkMobile(): boolean {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    private createLevelButtons(): void {
        const { width, height } = this.scale;
        const centerX = width / 2;
        const startX = centerX - (GameConfig.LEVELS.length - 1) * 170;
        
        GameConfig.LEVELS.forEach((level, index) => {
            const x = startX + index * 340;
            const y = height * 0.48; // Поднято выше для центрирования между декоративными линиями
            
            const container = this.add.container(x, y);
            
            // Карточка с тенью
            const shadow = this.add.graphics();
            shadow.fillStyle(0x000000, 0.5);
            shadow.fillRoundedRect(-138, -78, 276, 196, 20);
            container.add(shadow);
            
            // Основная карточка - рамка
            const bg = this.add.graphics();
            bg.fillStyle(0x2a1810, 1);
            bg.fillRoundedRect(-140, -80, 280, 200, 20);
            bg.lineStyle(3, 0xffaa00, 1);
            bg.strokeRoundedRect(-140, -80, 280, 200, 20);
            container.add(bg);
            
            // Превью уровня - ЗАПОЛНЯЕТ ВЕСЬ БЛОК
            const previewKey = `level${index + 1}_preview`;
            if (this.textures.exists(previewKey)) {
                // Картинка с правильным масштабированием для заполнения
                const preview = this.add.image(0, 0, previewKey);
                
                // Вычисляем правильный масштаб для cover-эффекта
                const cardWidth = 280;
                const cardHeight = 200;
                const texture = this.textures.get(previewKey);
                const frame = texture.get();
                const scaleX = cardWidth / frame.width;
                const scaleY = cardHeight / frame.height;
                const scale = Math.max(scaleX, scaleY);
                
                preview.setScale(scale);
                // Сохраняем базовый масштаб для анимации
                preview.setData('baseScale', scale);
                
                // Маска для обрезки по форме карточки
                const maskGraphics = this.make.graphics();
                maskGraphics.fillStyle(0xffffff);
                maskGraphics.fillRoundedRect(x - 140, y - 80, 280, 200, 20);
                const mask = maskGraphics.createGeometryMask();
                preview.setMask(mask);
                
                container.add(preview);
                // Сохраняем ссылку на превью в контейнере
                container.setData('preview', preview);
            }
            
            // Информационная панель ПРИЖАТА К НИЗУ карточки
            const infoBg = this.add.graphics();
            infoBg.fillStyle(0x000000, 0.85);
            // Позиция Y: -80 (верх) + 200 (высота) - 60 (высота панели) = 60
            infoBg.fillRoundedRect(-140, 60, 280, 60, { tl: 0, tr: 0, bl: 20, br: 20 });
            container.add(infoBg);
            
            // Текст в информационной панели
            const levelNumber = this.add.text(-120, 75, `Уровень ${index + 1}`, {
                fontSize: '20px',
                fontFamily: 'Arial Black, sans-serif',
                color: '#ffffff',
                fontStyle: 'bold'
            });
            levelNumber.setOrigin(0, 0.5);
            container.add(levelNumber);
            
            const levelName = this.add.text(-120, 95, level.name, {
                fontSize: '14px',
                fontFamily: 'Arial, sans-serif',
                color: '#bbbbbb'
            });
            levelName.setOrigin(0, 0.5);
            container.add(levelName);
            
            // Добавляем иконку замка для заблокированных уровней
            if (index > 0) {
                // Затемнение для заблокированных
                const lockOverlay = this.add.graphics();
                lockOverlay.fillStyle(0x000000, 0.6);
                lockOverlay.fillRoundedRect(-140, -80, 280, 200, 20);
                container.add(lockOverlay);
                
                // Иконка замка
                const lockBg = this.add.graphics();
                lockBg.fillStyle(0x000000, 0.8);
                lockBg.fillCircle(0, -10, 35);
                lockBg.lineStyle(2, 0xffffff, 0.5);
                lockBg.strokeCircle(0, -10, 35);
                
                const lock = this.add.text(0, -10, '🔒', {
                    fontSize: '32px'
                });
                lock.setOrigin(0.5);
                container.add([lockBg, lock]);
            }
            
            // Интерактивность
            const hitArea = new Phaser.Geom.Rectangle(-140, -80, 280, 200);
            bg.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
            
            bg.on('pointerdown', () => {
                this.selectLevel(index);
            });
            
            bg.on('pointerover', () => {
                // Анимируем весь контейнер с быстрой анимацией
                this.tweens.killTweensOf(container);
                this.tweens.add({
                    targets: container,
                    scaleX: 1.05,
                    scaleY: 1.05,
                    y: y - 5,
                    duration: 100,
                    ease: 'Back.easeOut'
                });
                
                // Анимируем картинку отдельно
                const preview = container.getData('preview');
                if (preview) {
                    const baseScale = preview.getData('baseScale');
                    this.tweens.killTweensOf(preview);
                    this.tweens.add({
                        targets: preview,
                        scaleX: baseScale * 1.05,
                        scaleY: baseScale * 1.05,
                        duration: 100,
                        ease: 'Back.easeOut'
                    });
                }
                
                // Подсветка рамки
                bg.lineStyle(4, 0xffcc00, 1);
                bg.strokeRoundedRect(-140, -80, 280, 200, 20);
            });
            
            bg.on('pointerout', () => {
                if (index !== this.selectedLevel) {
                    this.tweens.killTweensOf(container);
                    this.tweens.add({
                        targets: container,
                        scaleX: 1,
                        scaleY: 1,
                        y: y,
                        duration: 100,
                        ease: 'Back.easeIn'
                    });
                    
                    // Возвращаем картинку к базовому масштабу
                    const preview = container.getData('preview');
                    if (preview) {
                        const baseScale = preview.getData('baseScale');
                        this.tweens.killTweensOf(preview);
                        this.tweens.add({
                            targets: preview,
                            scaleX: baseScale,
                            scaleY: baseScale,
                            duration: 100,
                            ease: 'Back.easeIn'
                        });
                    }
                    
                    // Возвращаем обычную рамку
                    bg.lineStyle(3, 0xffaa00, 1);
                    bg.strokeRoundedRect(-140, -80, 280, 200, 20);
                }
            });
            
            this.levelButtons.push(container);
        });
        
        // Выбираем первый уровень по умолчанию
        this.selectLevel(0);
    }

    private createPlayButton(): void {
        const { width, height } = this.scale;
        const centerX = width / 2;
        // Перемещаем кнопку ниже, чтобы она не накладывалась на карточки
        this.playButton = this.add.container(centerX, height * 0.8);
        
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
        const { width, height } = this.scale;
        const container = this.add.container(width - 80, 50);
        
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
            this.settingsModal.show();
            // Воспроизводим звук клика
            this.soundSystem.playSound('coin', { volume: 0.3 });
        });
        
        // Кнопка быстрого отключения звука
        this.createMuteButton();
        // Кнопка полноэкранного режима
        this.createFullscreenButton();
    }
    
    private createMuteButton(): void {
        const { width, height } = this.scale;
        const container = this.add.container(width - 140, 50);
        
        const bg = this.add.circle(0, 0, 25, 0x666666, 0.8);
        bg.setStrokeStyle(2, 0xffffff);
        
        // Используем Unicode иконку динамика
        const speakerIcon = this.add.text(0, 0, '🔊', {
            fontSize: '20px'
        });
        speakerIcon.setOrigin(0.5);
        
        // Функция обновления иконки
        const updateIcon = () => {
            const isMuted = localStorage.getItem('soundMuted') === 'true';
            speakerIcon.setText(isMuted ? '🔇' : '🔊');
        };
        
        updateIcon();
        container.add([bg, speakerIcon]);
        
        bg.setInteractive({ useHandCursor: true });
        
        bg.on('pointerdown', () => {
            const isMuted = localStorage.getItem('soundMuted') === 'true';
            const newMuted = !isMuted;
            
            localStorage.setItem('soundMuted', String(newMuted));
            
            // Применяем изменения
            if (newMuted) {
                this.soundSystem.setMusicVolume(0);
                this.soundSystem.setSfxVolume(0);
            } else {
                const musicVolume = parseFloat(localStorage.getItem('musicVolume') || '0.2');
                const sfxVolume = parseFloat(localStorage.getItem('sfxVolume') || '0.4');
                this.soundSystem.setMusicVolume(musicVolume);
                this.soundSystem.setSfxVolume(sfxVolume);
            }
            
            updateIcon();
            
            // Звук клика
            if (!newMuted) {
                this.soundSystem.playSound('coin', { volume: 0.3 });
            }
        });
    }
    
    private createFullscreenButton(): void {
        const { width, height } = this.scale;
        const container = this.add.container(width - 200, 50);
        
        const bg = this.add.circle(0, 0, 25, 0x666666, 0.8);
        bg.setStrokeStyle(2, 0xffffff);
        
        // Иконка полноэкранного режима
        const icon = this.add.text(0, 0, '⛶', {
            fontSize: '20px',
            color: '#ffffff'
        });
        icon.setOrigin(0.5);
        
        container.add([bg, icon]);
        
        bg.setInteractive({ useHandCursor: true });
        
        bg.on('pointerdown', () => {
            if (this.scale.isFullscreen) {
                this.scale.stopFullscreen();
            } else {
                this.scale.startFullscreen();
            }
            // Звук клика
            this.soundSystem.playSound('coin', { volume: 0.3 });
        });
        
        // Обновляем иконку при изменении режима
        this.scale.on('fullscreenchange', () => {
            icon.setText(this.scale.isFullscreen ? '⛶' : '⛶');
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
        
        // Останавливаем музыку меню
        this.soundSystem.stopMusic();
        
        // Эффект перехода
        this.cameras.main.fadeOut(500, 0, 0, 0);
        
        this.time.delayedCall(500, () => {
            // Передаём данные о выбранном уровне
            this.scene.start('GameScene', { level: level.key });
            this.scene.start('UIScene');
        });
    }
}