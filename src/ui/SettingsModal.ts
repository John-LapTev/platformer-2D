import Phaser from 'phaser';
import { SoundSystem } from '../systems/SoundSystem';

export class SettingsModal extends Phaser.GameObjects.Container {
    private background!: Phaser.GameObjects.Rectangle;
    private panel!: Phaser.GameObjects.Graphics;
    private title!: Phaser.GameObjects.Text;
    private soundSystem: SoundSystem;
    private lobbyMusicSlider!: Phaser.GameObjects.Container;
    private gameMusicSlider!: Phaser.GameObjects.Container;
    private sfxVolumeSlider!: Phaser.GameObjects.Container;
    private muteButton!: Phaser.GameObjects.Container;
    private blurSlider!: Phaser.GameObjects.Container;
    private closeButton!: Phaser.GameObjects.Text;
    private tabs!: Phaser.GameObjects.Container[];
    private tabContents!: Phaser.GameObjects.Container[];
    private currentTab: number = 0;

    constructor(scene: Phaser.Scene, soundSystem: SoundSystem) {
        super(scene, scene.scale.width / 2, scene.scale.height / 2);
        this.soundSystem = soundSystem;
        
        this.createModal();
        this.setVisible(false);
        scene.add.existing(this);
    }

    private createModal(): void {
        const { width, height } = this.scene.scale;
        
        // Затемнённый фон на весь экран
        this.background = this.scene.add.rectangle(0, 0, width * 2, height * 2, 0x000000, 0.85);
        this.background.setInteractive();
        this.add(this.background);
        
        // Панель настроек на весь экран с отступами
        const panelWidth = Math.min(width * 0.9, 1200);
        const panelHeight = Math.min(height * 0.85, 700);
        
        this.panel = this.scene.add.graphics();
        this.panel.fillStyle(0x1a1a2e, 0.98);
        this.panel.fillRoundedRect(-panelWidth/2, -panelHeight/2, panelWidth, panelHeight, 25);
        this.panel.lineStyle(4, 0xffd700, 1);
        this.panel.strokeRoundedRect(-panelWidth/2, -panelHeight/2, panelWidth, panelHeight, 25);
        this.add(this.panel);
        
        // Заголовок
        this.title = this.scene.add.text(0, -panelHeight/2 + 40, 'НАСТРОЙКИ', {
            fontSize: '48px',
            fontFamily: 'Arial Black',
            color: '#ffd700',
            stroke: '#000000',
            strokeThickness: 4
        });
        this.title.setOrigin(0.5);
        this.add(this.title);
        
        // Создаём вкладки
        this.createTabs(panelWidth, panelHeight);
        
        // Создаём содержимое вкладок
        this.tabContents = [];
        this.createSoundTab(panelWidth, panelHeight);
        this.createControlsTab(panelWidth, panelHeight);
        this.createGraphicsTab(panelWidth, panelHeight);
        
        // Показываем первую вкладку
        this.selectTab(0);
        
        // Кнопка закрытия
        this.closeButton = this.scene.add.text(panelWidth/2 - 30, -panelHeight/2 + 40, '✕', {
            fontSize: '42px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        });
        this.closeButton.setOrigin(0.5);
        this.closeButton.setInteractive({ useHandCursor: true });
        this.closeButton.on('pointerdown', () => this.hide());
        this.closeButton.on('pointerover', () => this.closeButton.setScale(1.2));
        this.closeButton.on('pointerout', () => this.closeButton.setScale(1));
        this.add(this.closeButton);
    }

    private createTabs(panelWidth: number, panelHeight: number): void {
        this.tabs = [];
        const tabNames = ['🔊 Звук', '🎮 Управление', '🎨 Графика'];
        const tabWidth = 200;
        const tabHeight = 50;
        const startX = -tabWidth * 1.5;
        const y = -panelHeight/2 + 100;
        
        tabNames.forEach((name, index) => {
            const tab = this.scene.add.container(startX + index * (tabWidth + 10), y);
            
            const bg = this.scene.add.graphics();
            bg.fillStyle(index === 0 ? 0x3498db : 0x2c3e50, 1);
            bg.fillRoundedRect(-tabWidth/2, -tabHeight/2, tabWidth, tabHeight, 10);
            bg.lineStyle(2, index === 0 ? 0xffd700 : 0x666666, 1);
            bg.strokeRoundedRect(-tabWidth/2, -tabHeight/2, tabWidth, tabHeight, 10);
            bg.name = 'bg';
            tab.add(bg);
            
            const text = this.scene.add.text(0, 0, name, {
                fontSize: '20px',
                fontFamily: 'Arial',
                color: index === 0 ? '#ffffff' : '#aaaaaa'
            });
            text.setOrigin(0.5);
            text.name = 'text';
            tab.add(text);
            
            bg.setInteractive(new Phaser.Geom.Rectangle(-tabWidth/2, -tabHeight/2, tabWidth, tabHeight), Phaser.Geom.Rectangle.Contains);
            bg.on('pointerdown', () => this.selectTab(index));
            bg.on('pointerover', () => {
                if (index !== this.currentTab) {
                    bg.clear();
                    bg.fillStyle(0x3a4a5c, 1);
                    bg.fillRoundedRect(-tabWidth/2, -tabHeight/2, tabWidth, tabHeight, 10);
                    bg.lineStyle(2, 0x999999, 1);
                    bg.strokeRoundedRect(-tabWidth/2, -tabHeight/2, tabWidth, tabHeight, 10);
                }
            });
            bg.on('pointerout', () => {
                if (index !== this.currentTab) {
                    bg.clear();
                    bg.fillStyle(0x2c3e50, 1);
                    bg.fillRoundedRect(-tabWidth/2, -tabHeight/2, tabWidth, tabHeight, 10);
                    bg.lineStyle(2, 0x666666, 1);
                    bg.strokeRoundedRect(-tabWidth/2, -tabHeight/2, tabWidth, tabHeight, 10);
                }
            });
            
            this.tabs.push(tab);
            this.add(tab);
        });
    }
    
    private selectTab(index: number): void {
        this.currentTab = index;
        
        // Обновляем визуал вкладок
        this.tabs.forEach((tab, i) => {
            const bg = tab.getByName('bg') as Phaser.GameObjects.Graphics;
            const text = tab.getByName('text') as Phaser.GameObjects.Text;
            
            bg.clear();
            if (i === index) {
                bg.fillStyle(0x3498db, 1);
                bg.fillRoundedRect(-100, -25, 200, 50, 10);
                bg.lineStyle(2, 0xffd700, 1);
                bg.strokeRoundedRect(-100, -25, 200, 50, 10);
                text.setColor('#ffffff');
            } else {
                bg.fillStyle(0x2c3e50, 1);
                bg.fillRoundedRect(-100, -25, 200, 50, 10);
                bg.lineStyle(2, 0x666666, 1);
                bg.strokeRoundedRect(-100, -25, 200, 50, 10);
                text.setColor('#aaaaaa');
            }
        });
        
        // Показываем/скрываем содержимое вкладок
        this.tabContents.forEach((content, i) => {
            content.setVisible(i === index);
        });
    }
    
    private createSoundTab(panelWidth: number, panelHeight: number): void {
        const container = this.scene.add.container(0, 0);
        const startY = -panelHeight/2 + 200;
        
        // Заголовок секции звука
        const soundTitle = this.scene.add.text(0, startY - 30, '🔊 Настройки звука', {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#ffd700'
        });
        soundTitle.setOrigin(0.5);
        container.add(soundTitle);
        
        // Громкость музыки лобби
        this.createLobbyMusicControl(container, startY + 30);
        
        // Громкость музыки в игре
        this.createGameMusicControl(container, startY + 100);
        
        // Громкость эффектов
        this.createSfxControl(container, startY + 170);
        
        // Кнопка отключения звука
        this.createMuteControl(container, startY + 260);
        
        this.tabContents.push(container);
        this.add(container);
    }
    
    private createControlsTab(panelWidth: number, panelHeight: number): void {
        const container = this.scene.add.container(0, 0);
        const startY = -panelHeight/2 + 200;
        
        // Заголовок секции управления (как у других вкладок)
        const controlsTitle = this.scene.add.text(0, startY - 30, '🎮 Схема управления', {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#ffd700'
        });
        controlsTitle.setOrigin(0.5);
        container.add(controlsTitle);
        
        // Создаём красивые карточки для каждого типа управления
        const cardWidth = 360;
        const itemHeight = 35; // высота одного элемента
        const cardPadding = 20; // отступы внутри карточки
        
        // Данные для карточек
        const pcControls = [
            { keys: 'A/D ←→', action: 'Движение влево/вправо' },
            { keys: 'ПРОБЕЛ', action: 'Прыжок (двойной доступен)' },
            { keys: 'W ↑', action: 'Лазание вверх по лианам' },
            { keys: 'S ↓', action: 'Приседание / Спуск по лианам' },
            { keys: 'E', action: 'Захват/отпускание лиан' },
            { keys: 'SHIFT', action: 'Ускорение бега' },
            { keys: 'ESC', action: 'Пауза' }
        ];
        
        // Автоматическая высота карточки PC
        const pcCardHeight = 85 + (pcControls.length * itemHeight) + cardPadding;
        
        // Карточка PC управления
        const pcCard = this.scene.add.graphics();
        pcCard.fillStyle(0x1e3a5f, 0.9);
        pcCard.fillRoundedRect(-cardWidth - 20, startY, cardWidth, pcCardHeight, 15);
        pcCard.lineStyle(3, 0x4fc3f7, 1);
        pcCard.strokeRoundedRect(-cardWidth - 20, startY, cardWidth, pcCardHeight, 15);
        container.add(pcCard);
        
        // Иконка клавиатуры
        const pcIcon = this.scene.add.text(-cardWidth/2 - 20, startY + 25, '⌨️', {
            fontSize: '32px'
        });
        pcIcon.setOrigin(0.5);
        container.add(pcIcon);
        
        const pcTitle = this.scene.add.text(-cardWidth/2 - 20, startY + 55, 'КЛАВИАТУРА', {
            fontSize: '22px',
            fontFamily: 'Arial Black',
            color: '#4fc3f7'
        });
        pcTitle.setOrigin(0.5);
        container.add(pcTitle);
        
        pcControls.forEach((control, i) => {
            // Клавиша
            const keyBg = this.scene.add.graphics();
            keyBg.fillStyle(0x2c5aa0, 1);
            keyBg.fillRoundedRect(-cardWidth + 10, startY + 85 + i * 35, 75, 24, 5);
            keyBg.lineStyle(1, 0x4fc3f7, 0.8);
            keyBg.strokeRoundedRect(-cardWidth + 10, startY + 85 + i * 35, 75, 24, 5);
            container.add(keyBg);
            
            const keyText = this.scene.add.text(-cardWidth + 47, startY + 97 + i * 35, control.keys, {
                fontSize: '11px',
                fontFamily: 'Arial',
                color: '#ffffff',
                fontStyle: 'bold'
            });
            keyText.setOrigin(0.5);
            container.add(keyText);
            
            // Действие
            const actionText = this.scene.add.text(-cardWidth + 95, startY + 97 + i * 35, control.action, {
                fontSize: '13px',
                fontFamily: 'Arial',
                color: '#e0e0e0'
            });
            actionText.setOrigin(0, 0.5);
            container.add(actionText);
        });
        
        // Данные для мобильного управления
        const mobileControls = [
            { gesture: '🕹️ Джойстик', action: 'Движение влево/вправо' },
            { gesture: '🕹️ Вверх', action: 'Прыжок' },
            { gesture: '🕹️ Вниз', action: 'Приседание' },
            { gesture: 'Ⓐ Кнопка A', action: 'Прыжок (двойной)' },
            { gesture: 'Ⓑ Кнопка B', action: 'Атака (скоро)' },
            { gesture: '👆👇 Свайпы', action: 'Лазание по лианам' },
            { gesture: '⏸️ Пауза', action: 'Меню паузы' }
        ];
        
        // Автоматическая высота карточки мобильного управления
        const mobileCardHeight = 85 + (mobileControls.length * itemHeight) + cardPadding;
        
        // Карточка мобильного управления
        const mobileCard = this.scene.add.graphics();
        mobileCard.fillStyle(0x4a148c, 0.9);
        mobileCard.fillRoundedRect(20, startY, cardWidth, mobileCardHeight, 15);
        mobileCard.lineStyle(3, 0xba68c8, 1);
        mobileCard.strokeRoundedRect(20, startY, cardWidth, mobileCardHeight, 15);
        container.add(mobileCard);
        
        // Иконка телефона
        const mobileIcon = this.scene.add.text(cardWidth/2 + 20, startY + 25, '📱', {
            fontSize: '32px'
        });
        mobileIcon.setOrigin(0.5);
        container.add(mobileIcon);
        
        const mobileTitle = this.scene.add.text(cardWidth/2 + 20, startY + 55, 'СЕНСОРНЫЙ ЭКРАН', {
            fontSize: '22px',
            fontFamily: 'Arial Black',
            color: '#ba68c8'
        });
        mobileTitle.setOrigin(0.5);
        container.add(mobileTitle);
        
        mobileControls.forEach((control, i) => {
            // Жест
            const gestureText = this.scene.add.text(40, startY + 85 + i * 35, control.gesture, {
                fontSize: '12px',
                fontFamily: 'Arial',
                color: '#ffffff',
                fontStyle: 'bold'
            });
            container.add(gestureText);
            
            // Стрелка
            const arrow = this.scene.add.text(150, startY + 85 + i * 35, '→', {
                fontSize: '12px',
                color: '#ba68c8'
            });
            container.add(arrow);
            
            // Действие
            const actionText = this.scene.add.text(165, startY + 85 + i * 35, control.action, {
                fontSize: '12px',
                fontFamily: 'Arial',
                color: '#e0e0e0'
            });
            container.add(actionText);
        });
        
        // Вычисляем позицию для подсказки на основе высоты карточек
        const maxCardHeight = Math.max(pcCardHeight, mobileCardHeight);
        const tipY = startY + maxCardHeight + 20;
        
        // Подсказка про двойной прыжок
        const tipBg = this.scene.add.graphics();
        tipBg.fillStyle(0x1b5e20, 0.9);
        tipBg.fillRoundedRect(-280, tipY, 560, 45, 10);
        tipBg.lineStyle(2, 0x4caf50, 1);
        tipBg.strokeRoundedRect(-280, tipY, 560, 45, 10);
        container.add(tipBg);
        
        const tipIcon = this.scene.add.text(-250, tipY + 22, '💡', {
            fontSize: '20px'
        });
        tipIcon.setOrigin(0.5);
        container.add(tipIcon);
        
        const tipText = this.scene.add.text(-220, tipY + 22, 'СОВЕТ: Двойной прыжок доступен сразу! Тройной - с бустом!', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        tipText.setOrigin(0, 0.5);
        container.add(tipText);
        
        // Будущий геймпад
        const gamepadNote = this.scene.add.text(0, tipY + 60, '🎮 Поддержка геймпада появится в следующем обновлении!', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffa726',
            fontStyle: 'italic'
        });
        gamepadNote.setOrigin(0.5);
        container.add(gamepadNote);
        
        container.setVisible(false);
        this.tabContents.push(container);
        this.add(container);
    }
    
    private createGraphicsTab(panelWidth: number, panelHeight: number): void {
        const container = this.scene.add.container(0, 0);
        const startY = -panelHeight/2 + 200;
        
        // Заголовок секции графики
        const graphicsTitle = this.scene.add.text(0, startY - 30, '🎨 Настройки графики', {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#ffd700'
        });
        graphicsTitle.setOrigin(0.5);
        container.add(graphicsTitle);
        
        // Настройка размытия фона
        this.createBlurControl(container, startY + 50);
        
        // Будущие настройки
        const futureSettings = [
            'Качество частиц - скоро!',
            'Качество теней - скоро!',
            'Сглаживание - скоро!',
            'VSync - скоро!'
        ];
        
        futureSettings.forEach((setting, i) => {
            const text = this.scene.add.text(0, startY + 150 + i * 40, setting, {
                fontSize: '20px',
                fontFamily: 'Arial',
                color: '#888888'
            });
            text.setOrigin(0.5);
            container.add(text);
        });
        
        container.setVisible(false);
        this.tabContents.push(container);
        this.add(container);
    }
    
    private createLobbyMusicControl(container: Phaser.GameObjects.Container, y: number): void {
        // Заголовок
        const label = this.scene.add.text(-350, y, 'Музыка лобби:', {
            fontSize: '22px',
            color: '#ffffff'
        });
        container.add(label);
        
        // Контейнер для слайдера
        this.lobbyMusicSlider = this.scene.add.container(100, y);
        
        // Линия слайдера
        const track = this.scene.add.graphics();
        track.fillStyle(0x555555, 1);
        track.fillRoundedRect(-150, -5, 300, 10, 5);
        this.lobbyMusicSlider.add(track);
        
        // Заполненная часть
        const fill = this.scene.add.graphics();
        const lobbyVolume = parseFloat(localStorage.getItem('lobbyMusicVolume') || '0.2');
        fill.fillStyle(0x00ff00, 1);
        fill.fillRoundedRect(-150, -5, 300 * lobbyVolume, 10, 5);
        fill.name = 'fill';
        this.lobbyMusicSlider.add(fill);
        
        // Ползунок
        const handle = this.scene.add.circle(-150 + 300 * lobbyVolume, 0, 15, 0xffffff);
        handle.setInteractive({ useHandCursor: true, draggable: true });
        handle.name = 'handle';
        this.lobbyMusicSlider.add(handle);
        
        // Процент
        const percent = this.scene.add.text(170, 0, `${Math.round(lobbyVolume * 100)}%`, {
            fontSize: '20px',
            color: '#ffffff'
        });
        percent.setOrigin(0, 0.5);
        percent.name = 'percent';
        this.lobbyMusicSlider.add(percent);
        
        // Обработка перетаскивания
        handle.on('drag', (pointer: Phaser.Input.Pointer, dragX: number) => {
            const clampedX = Phaser.Math.Clamp(dragX, -150, 150);
            handle.x = clampedX;
            
            const volume = (clampedX + 150) / 300;
            localStorage.setItem('lobbyMusicVolume', volume.toString());
            
            // Если мы в меню, применяем громкость сразу
            const menuScene = this.scene.scene.get('MenuScene');
            if (menuScene && menuScene.scene.isActive()) {
                this.soundSystem.setMusicVolume(volume);
            }
            
            // Обновляем визуализацию
            fill.clear();
            fill.fillStyle(0x00ff00, 1);
            fill.fillRoundedRect(-150, -5, 300 * volume, 10, 5);
            
            percent.setText(`${Math.round(volume * 100)}%`);
        });
        
        container.add(this.lobbyMusicSlider);
    }
    
    private createGameMusicControl(container: Phaser.GameObjects.Container, y: number): void {
        // Заголовок
        const label = this.scene.add.text(-350, y, 'Музыка в игре:', {
            fontSize: '22px',
            color: '#ffffff'
        });
        container.add(label);
        
        // Контейнер для слайдера
        this.gameMusicSlider = this.scene.add.container(100, y);
        
        // Линия слайдера
        const track = this.scene.add.graphics();
        track.fillStyle(0x555555, 1);
        track.fillRoundedRect(-150, -5, 300, 10, 5);
        this.gameMusicSlider.add(track);
        
        // Заполненная часть
        const fill = this.scene.add.graphics();
        const gameVolume = parseFloat(localStorage.getItem('gameMusicVolume') || '0.2');
        fill.fillStyle(0x00ff00, 1);
        fill.fillRoundedRect(-150, -5, 300 * gameVolume, 10, 5);
        fill.name = 'fill';
        this.gameMusicSlider.add(fill);
        
        // Ползунок
        const handle = this.scene.add.circle(-150 + 300 * gameVolume, 0, 15, 0xffffff);
        handle.setInteractive({ useHandCursor: true, draggable: true });
        handle.name = 'handle';
        this.gameMusicSlider.add(handle);
        
        // Процент
        const percent = this.scene.add.text(170, 0, `${Math.round(gameVolume * 100)}%`, {
            fontSize: '20px',
            color: '#ffffff'
        });
        percent.setOrigin(0, 0.5);
        percent.name = 'percent';
        this.gameMusicSlider.add(percent);
        
        // Обработка перетаскивания
        handle.on('drag', (pointer: Phaser.Input.Pointer, dragX: number) => {
            const clampedX = Phaser.Math.Clamp(dragX, -150, 150);
            handle.x = clampedX;
            
            const volume = (clampedX + 150) / 300;
            localStorage.setItem('gameMusicVolume', volume.toString());
            
            // Если мы в игре, применяем громкость сразу
            const gameScene = this.scene.scene.get('GameScene');
            if (gameScene && gameScene.scene.isActive()) {
                this.soundSystem.setMusicVolume(volume);
            }
            
            // Обновляем визуализацию
            fill.clear();
            fill.fillStyle(0x00ff00, 1);
            fill.fillRoundedRect(-150, -5, 300 * volume, 10, 5);
            
            percent.setText(`${Math.round(volume * 100)}%`);
        });
        
        container.add(this.gameMusicSlider);
    }
    
    private createSfxControl(container: Phaser.GameObjects.Container, y: number): void {
        // Заголовок
        const label = this.scene.add.text(-350, y, 'Звуковые эффекты:', {
            fontSize: '22px',
            color: '#ffffff'
        });
        container.add(label);
        
        // Контейнер для слайдера
        this.sfxVolumeSlider = this.scene.add.container(100, y);
        
        // Линия слайдера
        const track = this.scene.add.graphics();
        track.fillStyle(0x555555, 1);
        track.fillRoundedRect(-150, -5, 300, 10, 5);
        this.sfxVolumeSlider.add(track);
        
        // Заполненная часть
        const fill = this.scene.add.graphics();
        const sfxVolume = this.soundSystem.getSfxVolume();
        fill.fillStyle(0x00ff00, 1);
        fill.fillRoundedRect(-150, -5, 300 * sfxVolume, 10, 5);
        fill.name = 'fill';
        this.sfxVolumeSlider.add(fill);
        
        // Ползунок
        const handle = this.scene.add.circle(-150 + 300 * sfxVolume, 0, 15, 0xffffff);
        handle.setInteractive({ useHandCursor: true, draggable: true });
        handle.name = 'handle';
        this.sfxVolumeSlider.add(handle);
        
        // Процент
        const percent = this.scene.add.text(170, 0, `${Math.round(sfxVolume * 100)}%`, {
            fontSize: '20px',
            color: '#ffffff'
        });
        percent.setOrigin(0, 0.5);
        percent.name = 'percent';
        this.sfxVolumeSlider.add(percent);
        
        // Обработка перетаскивания
        handle.on('drag', (pointer: Phaser.Input.Pointer, dragX: number) => {
            const clampedX = Phaser.Math.Clamp(dragX, -150, 150);
            handle.x = clampedX;
            
            const volume = (clampedX + 150) / 300;
            this.soundSystem.setSfxVolume(volume);
            
            // Обновляем визуализацию
            fill.clear();
            fill.fillStyle(0x00ff00, 1);
            fill.fillRoundedRect(-150, -5, 300 * volume, 10, 5);
            
            percent.setText(`${Math.round(volume * 100)}%`);
            
            // Проигрываем тестовый звук
            this.soundSystem.playSound('coin', { volume: volume * 0.5 });
        });
        
        container.add(this.sfxVolumeSlider);
    }
    
    private createMuteControl(container: Phaser.GameObjects.Container, y: number): void {
        this.muteButton = this.scene.add.container(0, y);
        
        // Фон кнопки
        const bg = this.scene.add.graphics();
        const isMuted = this.soundSystem.getMuted();
        bg.fillStyle(isMuted ? 0xff0000 : 0x00ff00, 1);
        bg.fillRoundedRect(-150, -30, 300, 60, 15);
        bg.name = 'bg';
        this.muteButton.add(bg);
        
        // Текст кнопки
        const text = this.scene.add.text(0, 0, isMuted ? '🔇 Звук ВЫКЛЮЧЕН' : '🔊 Звук ВКЛЮЧЕН', {
            fontSize: '28px',
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        });
        text.setOrigin(0.5);
        text.name = 'text';
        this.muteButton.add(text);
        
        // Интерактивность
        bg.setInteractive(new Phaser.Geom.Rectangle(-150, -30, 300, 60), Phaser.Geom.Rectangle.Contains);
        bg.on('pointerdown', () => {
            this.soundSystem.toggleMute();
            const muted = this.soundSystem.getMuted();
            
            // Обновляем визуализацию
            bg.clear();
            bg.fillStyle(muted ? 0xff0000 : 0x00ff00, 1);
            bg.fillRoundedRect(-150, -30, 300, 60, 15);
            
            text.setText(muted ? '🔇 Звук ВЫКЛЮЧЕН' : '🔊 Звук ВКЛЮЧЕН');
        });
        
        bg.on('pointerover', () => {
            this.muteButton.setScale(1.05);
        });
        
        bg.on('pointerout', () => {
            this.muteButton.setScale(1);
        });
        
        container.add(this.muteButton);
    }
    
    private createBlurControl(container: Phaser.GameObjects.Container, y: number): void {
        // Заголовок
        const label = this.scene.add.text(-350, y, 'Размытие фона:', {
            fontSize: '22px',
            color: '#ffffff'
        });
        container.add(label);
        
        // Контейнер для слайдера
        this.blurSlider = this.scene.add.container(100, y);
        
        // Линия слайдера
        const track = this.scene.add.graphics();
        track.fillStyle(0x555555, 1);
        track.fillRoundedRect(-150, -5, 300, 10, 5);
        this.blurSlider.add(track);
        
        // Получаем текущее значение размытия из localStorage (по умолчанию 41%)
        const savedBlur = parseFloat(localStorage.getItem('backgroundBlur') || '0.41');
        
        // Заполненная часть
        const fill = this.scene.add.graphics();
        fill.fillStyle(0x00aaff, 1);
        fill.fillRoundedRect(-150, -5, 300 * savedBlur, 10, 5);
        fill.name = 'fill';
        this.blurSlider.add(fill);
        
        // Ползунок
        const handle = this.scene.add.circle(-150 + 300 * savedBlur, 0, 15, 0xffffff);
        handle.setInteractive({ useHandCursor: true, draggable: true });
        handle.name = 'handle';
        this.blurSlider.add(handle);
        
        // Процент
        const percent = this.scene.add.text(170, 0, `${Math.round(savedBlur * 100)}%`, {
            fontSize: '20px',
            color: '#ffffff'
        });
        percent.setOrigin(0, 0.5);
        percent.name = 'percent';
        this.blurSlider.add(percent);
        
        // Обработка начала перетаскивания
        handle.on('dragstart', () => {
            // Уменьшаем прозрачность остальных элементов
            this.panel.setAlpha(0.5);
            this.title.setAlpha(0.5);
            this.closeButton.setAlpha(0.5);
            this.tabs.forEach(tab => tab.setAlpha(0.5));
            this.background.setAlpha(0.3);
        });
        
        // Обработка окончания перетаскивания
        handle.on('dragend', () => {
            // Возвращаем прозрачность
            this.panel.setAlpha(1);
            this.title.setAlpha(1);
            this.closeButton.setAlpha(1);
            this.tabs.forEach(tab => tab.setAlpha(1));
            this.background.setAlpha(0.85);
        });
        
        // Обработка перетаскивания
        handle.on('drag', (pointer: Phaser.Input.Pointer, dragX: number) => {
            const clampedX = Phaser.Math.Clamp(dragX, -150, 150);
            handle.x = clampedX;
            
            const blurAmount = (clampedX + 150) / 300;
            
            // Сохраняем в localStorage
            localStorage.setItem('backgroundBlur', blurAmount.toString());
            
            // Обновляем визуализацию
            fill.clear();
            fill.fillStyle(0x00aaff, 1);
            fill.fillRoundedRect(-150, -5, 300 * blurAmount, 10, 5);
            
            percent.setText(`${Math.round(blurAmount * 100)}%`);
            
            // Применяем размытие к фону в GameScene
            const gameScene = this.scene.scene.get('GameScene') as any;
            if (gameScene && gameScene.backgroundTile) {
                // Применяем эффект размытия
                if (blurAmount > 0) {
                    // Создаём эффект размытия через уменьшение альфы и добавление тумана
                    gameScene.backgroundTile.setAlpha(1 - blurAmount * 0.5);
                    gameScene.backgroundTile.setTint(0x888888 + Math.floor(0x777777 * (1 - blurAmount)));
                } else {
                    gameScene.backgroundTile.setAlpha(1);
                    gameScene.backgroundTile.clearTint();
                }
            }
        });
        
        container.add(this.blurSlider);
    }

    public show(): void {
        // Обновляем размеры при показе
        const { width, height } = this.scene.scale;
        this.setPosition(width / 2, height / 2);
        
        // Обновляем размер фона
        this.background.setSize(width * 2, height * 2);
        
        this.setVisible(true);
        this.setDepth(1000);
        
        // Анимация появления
        this.setScale(0.8);
        this.setAlpha(0);
        this.scene.tweens.add({
            targets: this,
            scaleX: 1,
            scaleY: 1,
            alpha: 1,
            duration: 200,
            ease: 'Back.out'
        });
    }

    public hide(): void {
        // Анимация исчезновения
        this.scene.tweens.add({
            targets: this,
            scaleX: 0.8,
            scaleY: 0.8,
            alpha: 0,
            duration: 200,
            ease: 'Back.in',
            onComplete: () => {
                this.setVisible(false);
            }
        });
    }
}