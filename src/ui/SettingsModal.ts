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
    private characterCards: { rick?: Phaser.GameObjects.Container; program?: Phaser.GameObjects.Container } = {};

    constructor(scene: Phaser.Scene, soundSystem: SoundSystem) {
        super(scene, scene.scale.width / 2, scene.scale.height / 2);
        this.soundSystem = soundSystem;
        
        this.createModal();
        this.setVisible(false);
        scene.add.existing(this);
    }

    private createModal(): void {
        const { width, height } = this.scene.scale;
        
        // ПОЛНОЭКРАННЫЙ ПРОФЕССИОНАЛЬНЫЙ ИНТЕРФЕЙС
        this.background = this.scene.add.rectangle(0, 0, width * 2, height * 2, 0x0a0a0a, 0.95);
        this.background.setInteractive();
        this.add(this.background);
        
        // ГЛАВНАЯ ПАНЕЛЬ - МИНИМАЛИСТИЧНАЯ
        const panelWidth = width * 0.95;
        const panelHeight = height * 0.9;
        
        this.panel = this.scene.add.graphics();
        this.panel.fillStyle(0x1a1a1a, 0.98);
        this.panel.fillRect(-panelWidth/2, -panelHeight/2, panelWidth, panelHeight);
        // Тонкая граница как в AAA играх
        this.panel.lineStyle(1, 0x333333, 1);
        this.panel.strokeRect(-panelWidth/2, -panelHeight/2, panelWidth, panelHeight);
        this.add(this.panel);
        
        // СОДЕРЖИМОЕ ВКЛАДОК - ДОБАВЛЯЕМ ПЕРВЫМ, ЧТОБЫ ОНО БЫЛО ПОД ВСЕМ ОСТАЛЬНЫМ
        this.tabContents = [];
        this.createProfessionalSoundTab(panelWidth, panelHeight);
        this.createProfessionalControlsTab(panelWidth, panelHeight);  
        this.createProfessionalGraphicsTab(panelWidth, panelHeight);
        
        // ЗАГОЛОВОК - ЧИСТЫЙ МИНИМАЛИСТИЧНЫЙ
        this.title = this.scene.add.text(0, -panelHeight/2 + 50, 'НАСТРОЙКИ', {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        this.title.setOrigin(0.5);
        this.add(this.title);
        
        // ПРОФЕССИОНАЛЬНЫЕ ВКЛАДКИ - ДОБАВЛЯЕМ ПОСЛЕ СОДЕРЖИМОГО
        this.createProfessionalTabs(panelWidth, panelHeight);
        
        // Показываем первую вкладку
        this.selectTab(0);
        
        // КНОПКА ЗАКРЫТИЯ - МИНИМАЛИСТИЧНАЯ
        this.closeButton = this.scene.add.text(panelWidth/2 - 40, -panelHeight/2 + 50, '×', {
            fontSize: '28px',
            color: '#999999'
        });
        this.closeButton.setOrigin(0.5);
        this.closeButton.setInteractive({ useHandCursor: true });
        this.closeButton.on('pointerdown', () => this.hide());
        this.closeButton.on('pointerover', () => {
            this.closeButton.setColor('#ffffff');
            this.closeButton.setScale(1.1);
        });
        this.closeButton.on('pointerout', () => {
            this.closeButton.setColor('#999999');
            this.closeButton.setScale(1);
        });
        this.add(this.closeButton);
        
        // КНОПКА СОХРАНЕНИЯ - ВНИЗУ ПАНЕЛИ
        const saveButton = this.scene.add.container(0, panelHeight/2 - 60);
        
        // Фон кнопки
        const saveBg = this.scene.add.graphics();
        saveBg.fillStyle(0x27ae60, 1);
        saveBg.fillRoundedRect(-100, -25, 200, 50, 10);
        saveBg.lineStyle(2, 0x2ecc71, 1);
        saveBg.strokeRoundedRect(-100, -25, 200, 50, 10);
        saveButton.add(saveBg);
        
        // Текст кнопки
        const saveText = this.scene.add.text(0, 0, '💾 СОХРАНИТЬ', {
            fontSize: '20px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#ffffff'
        });
        saveText.setOrigin(0.5);
        saveButton.add(saveText);
        
        // Интерактивность кнопки
        saveBg.setInteractive(new Phaser.Geom.Rectangle(-100, -25, 200, 50), Phaser.Geom.Rectangle.Contains);
        saveBg.on('pointerdown', () => {
            // Анимация нажатия
            this.scene.tweens.add({
                targets: saveButton,
                scaleX: 0.95,
                scaleY: 0.95,
                duration: 100,
                yoyo: true
            });
            
            // Сохраняем все настройки
            this.saveAllSettings();
            
            // Показываем уведомление
            this.showNotification('✅ Все настройки сохранены!');
        });
        
        saveBg.on('pointerover', () => {
            saveBg.clear();
            saveBg.fillStyle(0x2ecc71, 1);
            saveBg.fillRoundedRect(-100, -25, 200, 50, 10);
            saveBg.lineStyle(2, 0x27ae60, 1);
            saveBg.strokeRoundedRect(-100, -25, 200, 50, 10);
            saveButton.setScale(1.05);
        });
        
        saveBg.on('pointerout', () => {
            saveBg.clear();
            saveBg.fillStyle(0x27ae60, 1);
            saveBg.fillRoundedRect(-100, -25, 200, 50, 10);
            saveBg.lineStyle(2, 0x2ecc71, 1);
            saveBg.strokeRoundedRect(-100, -25, 200, 50, 10);
            saveButton.setScale(1);
        });
        
        this.add(saveButton);
    }
    
    private saveAllSettings(): void {
        // Звуковые настройки уже сохраняются автоматически через SoundSystem
        // Персонаж сохраняется при переключении
        // Размытие фона сохраняется при изменении
        
        // Применяем все изменения
        const useAI = localStorage.getItem('useAISprites') === 'true';
        this.applyCharacterStyleChange(useAI);
        
        const blur = parseFloat(localStorage.getItem('backgroundBlur') || '0.41');
        this.applyBlurEffect(blur);
        
        // Принудительно сохраняем настройки звука
        if (this.soundSystem) {
            const soundSettings = {
                musicVolume: this.soundSystem.getMusicVolume(),
                sfxVolume: this.soundSystem.getSfxVolume(),
                isMuted: this.soundSystem.getMuted()
            };
            localStorage.setItem('soundSettings', JSON.stringify(soundSettings));
        }
    }

    private createProfessionalTabs(panelWidth: number, panelHeight: number): void {
        this.tabs = [];
        const tabNames = ['ЗВУК', 'УПРАВЛЕНИЕ', 'ГРАФИКА'];
        const tabWidth = 180;
        const tabHeight = 45;
        
        // Горизонтальная линия для вкладок
        const tabLineY = -panelHeight/2 + 110;
        const tabLine = this.scene.add.graphics();
        tabLine.lineStyle(1, 0x333333, 1);
        tabLine.lineBetween(-panelWidth/2 + 40, tabLineY, panelWidth/2 - 40, tabLineY);
        this.add(tabLine);
        
        // Позиционирование вкладок
        const totalTabsWidth = tabNames.length * tabWidth;
        const startX = -totalTabsWidth/2 + tabWidth/2;
        
        tabNames.forEach((name, index) => {
            const tab = this.scene.add.container(startX + index * tabWidth, tabLineY - 15);
            
            // Фон вкладки - минималистичный
            const bg = this.scene.add.graphics();
            if (index === 0) {
                // Активная вкладка
                bg.fillStyle(0x2a2a2a, 1);
                bg.fillRect(-tabWidth/2, -tabHeight/2, tabWidth, tabHeight);
                bg.lineStyle(1, 0x00aaff, 1);
                bg.lineBetween(-tabWidth/2, tabHeight/2, tabWidth/2, tabHeight/2);
            } else {
                // Неактивная вкладка
                bg.fillStyle(0x1a1a1a, 1);
                bg.fillRect(-tabWidth/2, -tabHeight/2, tabWidth, tabHeight);
            }
            bg.name = 'bg';
            tab.add(bg);
            
            // Текст вкладки
            const text = this.scene.add.text(0, 0, name, {
                fontSize: '14px',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                color: index === 0 ? '#ffffff' : '#888888'
            });
            text.setOrigin(0.5);
            text.name = 'text';
            tab.add(text);
            
            // Интерактивность
            bg.setInteractive(new Phaser.Geom.Rectangle(-tabWidth/2, -tabHeight/2, tabWidth, tabHeight), Phaser.Geom.Rectangle.Contains);
            bg.on('pointerdown', () => this.selectProfessionalTab(index));
            bg.on('pointerover', () => {
                if (index !== this.currentTab) {
                    text.setColor('#ffffff');
                }
            });
            bg.on('pointerout', () => {
                if (index !== this.currentTab) {
                    text.setColor('#888888');
                }
            });
            
            this.tabs.push(tab);
            this.add(tab);
        });
    }
    
    private selectProfessionalTab(index: number): void {
        this.currentTab = index;
        
        // Обновляем визуал вкладок профессионально
        this.tabs.forEach((tab, i) => {
            const bg = tab.getByName('bg') as Phaser.GameObjects.Graphics;
            const text = tab.getByName('text') as Phaser.GameObjects.Text;
            
            bg.clear();
            if (i === index) {
                // Активная вкладка
                bg.fillStyle(0x2a2a2a, 1);
                bg.fillRect(-90, -22, 180, 45);
                bg.lineStyle(1, 0x00aaff, 1);
                bg.lineBetween(-90, 22, 90, 22);
                text.setColor('#ffffff');
            } else {
                // Неактивная вкладка
                bg.fillStyle(0x1a1a1a, 1);
                bg.fillRect(-90, -22, 180, 45);
                text.setColor('#888888');
            }
        });
        
        // Показываем/скрываем содержимое вкладок
        this.tabContents.forEach((content, i) => {
            content.setVisible(i === index);
        });
    }

    // Совместимость со старым методом
    private selectTab(index: number): void {
        this.selectProfessionalTab(index);
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
    
    private createProfessionalGraphicsTab(panelWidth: number, panelHeight: number): void {
        const container = this.scene.add.container(0, 0);
        
        // ИДЕАЛЬНАЯ СЕТКА С РАВНЫМИ ОТСТУПАМИ
        const contentY = -panelHeight/2 + 180;
        const rowHeight = 60;
        
        // Определяем ширину контента и равномерные отступы
        const contentWidth = 800;         // Общая ширина контентной области
        const leftMargin = 80;           // Отступ слева
        const rightMargin = 80;          // Отступ справа
        const middleGap = 40;            // Отступ между колонками
        
        // Вычисляем позиции колонок с равными отступами
        const leftColumnX = -contentWidth/2 + leftMargin;
        const rightColumnX = contentWidth/2 - rightMargin;
        
        // ТОЛЬКО РЕАЛЬНЫЕ настройки графики нашей игры
        const graphicsSettings = [
            { 
                label: 'Стиль персонажа', 
                type: 'dropdown', 
                options: ['Рик Санчез', 'Стандартный'], 
                value: (() => {
                    const useAISetting = localStorage.getItem('useAISprites');
                    // Если настройка не установлена, по умолчанию AI (0)
                    // Если установлена в 'true', то AI (0), иначе программный (1)
                    return useAISetting === null ? 0 : (useAISetting === 'true' ? 0 : 1);
                })(),
                settingKey: 'characterStyle'
            },
            { 
                label: 'Размытие фона', 
                type: 'slider', 
                min: 0, 
                max: 100, 
                value: Math.round(parseFloat(localStorage.getItem('backgroundBlur') || '0.41') * 100),
                settingKey: 'backgroundBlur'
            }
        ];
        
        // Создаём строки настроек
        graphicsSettings.forEach((setting, index) => {
            const y = contentY + index * rowHeight;
            
            // Создаём профессиональную строку настройки
            this.createSettingRow(container, {
                label: setting.label,
                y: y,
                leftX: leftColumnX,
                rightX: rightColumnX,
                type: setting.type,
                options: setting.options || [],
                value: setting.value,
                min: setting.min || 0,
                max: setting.max || 100,
                settingKey: setting.settingKey
            });
        });
        
        container.setVisible(false);
        this.tabContents.push(container);
        this.add(container);
    }

    // Старый метод для совместимости
    private createGraphicsTab(panelWidth: number, panelHeight: number): void {
        this.createProfessionalGraphicsTab(panelWidth, panelHeight);
    }


    // ТАБЛИЧНАЯ СИСТЕМА - ИДЕАЛЬНОЕ ВЫРАВНИВАНИЕ
    private createTableRow(container: Phaser.GameObjects.Container, config: {
        x: number, y: number, width: number, height: number,
        title: string, content: string
    }): void {
        
        // ФОНОВАЯ ЯЧЕЙКА С ГРАНИЦАМИ - ТОЧНАЯ ГЕОМЕТРИЯ
        const cellBg = this.scene.add.graphics();
        cellBg.fillStyle(0x34495e, 0.3);
        cellBg.fillRoundedRect(
            config.x - config.width/2, 
            config.y - config.height/2, 
            config.width, 
            config.height, 
            12
        );
        cellBg.lineStyle(2, 0x5dade2, 0.8);
        cellBg.strokeRoundedRect(
            config.x - config.width/2, 
            config.y - config.height/2, 
            config.width, 
            config.height, 
            12
        );
        container.add(cellBg);
        
        // ЗАГОЛОВОК ЯЧЕЙКИ - ВСЕГДА В ВЕРХНЕЙ ЧАСТИ
        const titleY = config.y - config.height/2 + 25;
        const title = this.scene.add.text(config.x, titleY, config.title, {
            fontSize: '18px',
            fontFamily: 'Arial Bold',
            color: '#ffffff'
        });
        title.setOrigin(0.5);
        container.add(title);
        
        // КОНТЕНТ ЯЧЕЙКИ - В ЦЕНТРЕ ОСТАВШЕГОСЯ ПРОСТРАНСТВА  
        const contentY = config.y + 10; // Смещение вниз от центра
        
        switch(config.content) {
            case 'character_cards':
                this.createTableCharacterCards(container, config.x, contentY, config.width - 40);
                break;
            case 'blur_slider':
                this.createTableBlurSlider(container, config.x, contentY, config.width - 60);
                break;
            case 'future_text':
                this.createTableFutureText(container, config.x, contentY);
                break;
        }
    }

    private createCharacterCardsGrid(container: Phaser.GameObjects.Container, y: number): void {
        // ДИНАМИЧЕСКАЯ СЕТКА КАРТОЧЕК
        const CARD_WIDTH = 180;
        const CARD_HEIGHT = 140;
        const CARD_GAP = 40;        // Отступ между карточками
        const CARDS_COUNT = 2;      // Количество карточек
        const TOTAL_WIDTH = CARDS_COUNT * CARD_WIDTH + (CARDS_COUNT - 1) * CARD_GAP;
        
        const useAISprites = localStorage.getItem('useAISprites') === 'true';

        // Вычисляем позиции карточек динамически (центрированно)
        const startX = -TOTAL_WIDTH / 2 + CARD_WIDTH / 2;
        
        // КАРТОЧКА РИКА (ЛЕВАЯ)
        const rickX = startX;
        const rickCard = this.createCharacterCard(
            rickX, y, CARD_WIDTH, CARD_HEIGHT,
            'Рик Санчез', 'AI Generated', '🧪',
            useAISprites, true, 'hero-sprite'
        );
        container.add(rickCard);

        // КАРТОЧКА ПРОГРАММНОГО (ПРАВАЯ) 
        const programX = startX + CARD_WIDTH + CARD_GAP;
        const programCard = this.createCharacterCard(
            programX, y, CARD_WIDTH, CARD_HEIGHT,
            'Стандартный', 'Программный', '👤', 
            !useAISprites, false, 'player'
        );
        container.add(programCard);

        // Сохраняем ссылки
        this.characterCards.rick = rickCard;
        this.characterCards.program = programCard;
    }

    // Старый метод для обратной совместимости
    private createCharacterCards(container: Phaser.GameObjects.Container, y: number): void {
        // Используем новый динамический метод
        this.createCharacterCardsGrid(container, y);
    }

    private createBlurSliderGrid(container: Phaser.GameObjects.Container, y: number, maxWidth: number): void {
        // ДИНАМИЧЕСКИЙ LAYOUT ЭЛЕМЕНТОВ СЛАЙДЕРА
        const PANEL_HEIGHT = 50;
        const ICON_SIZE = 20;
        const LABEL_WIDTH = 150;
        const SLIDER_WIDTH = 200;
        const VALUE_WIDTH = 60;
        const ELEMENT_GAP = 20;
        
        // Вычисляем позиции элементов динамически
        const availableWidth = maxWidth - 2 * ELEMENT_GAP; // Отступы по краям
        const iconX = -maxWidth/2 + ELEMENT_GAP + ICON_SIZE/2;
        const labelX = iconX + ICON_SIZE/2 + ELEMENT_GAP;
        const sliderStartX = labelX + LABEL_WIDTH + ELEMENT_GAP;
        const valueX = sliderStartX + SLIDER_WIDTH + ELEMENT_GAP;
        
        // Фон панели слайдера
        const panelBg = this.scene.add.graphics();
        panelBg.fillStyle(0x34495e, 0.9);
        panelBg.fillRoundedRect(-maxWidth/2, y - PANEL_HEIGHT/2, maxWidth, PANEL_HEIGHT, 12);
        panelBg.lineStyle(2, 0x3498db, 0.8);
        panelBg.strokeRoundedRect(-maxWidth/2, y - PANEL_HEIGHT/2, maxWidth, PANEL_HEIGHT, 12);
        container.add(panelBg);

        // Иконка (динамическая позиция)
        const icon = this.scene.add.text(iconX, y, '🌫️', {
            fontSize: ICON_SIZE + 'px'
        });
        icon.setOrigin(0.5);
        container.add(icon);

        // Подпись (динамическая позиция)
        const label = this.scene.add.text(labelX, y, 'Размытие фона', {
            fontSize: '16px',
            fontFamily: 'Arial Bold',
            color: '#ffffff'
        });
        label.setOrigin(0, 0.5);
        container.add(label);

        // Слайдер (динамическая позиция и размер)
        this.createProfessionalSliderGrid(container, sliderStartX, y, SLIDER_WIDTH, valueX);
    }

    // Старый метод для обратной совместимости
    private createBlurSlider(container: Phaser.GameObjects.Container, y: number, maxWidth: number): void {
        // Используем новый динамический метод
        this.createBlurSliderGrid(container, y, maxWidth);
    }

    private createCharacterCard(x: number, y: number, width: number, height: number, 
                              title: string, subtitle: string, fallbackIcon: string,
                              isSelected: boolean, isAI: boolean, textureKey: string): Phaser.GameObjects.Container {
        
        const card = this.scene.add.container(x, y);
        
        // ФОНОВАЯ ПАНЕЛЬ - ТОЧНЫЕ РАЗМЕРЫ
        const bg = this.scene.add.graphics();
        const bgColor = isSelected ? (isAI ? 0x27ae60 : 0x3498db) : 0x2c3e50;
        const borderColor = isSelected ? (isAI ? 0x2ecc71 : 0x5dade2) : 0x7f8c8d;
        const borderWidth = isSelected ? 4 : 2;

        bg.fillStyle(bgColor, 0.95);
        bg.fillRoundedRect(-width/2, -height/2, width, height, 12);
        bg.lineStyle(borderWidth, borderColor, 1);
        bg.strokeRoundedRect(-width/2, -height/2, width, height, 12);
        bg.name = 'bg';  // Унифицированное имя для всех карточек
        card.add(bg);

        // ПРЕВЬЮ ПЕРСОНАЖА 
        if (this.scene.textures.exists(textureKey)) {
            const preview = this.scene.add.image(0, -25, textureKey);
            preview.setScale(0.8);
            card.add(preview);
        } else {
            const emoji = this.scene.add.text(0, -25, fallbackIcon, {
                fontSize: '45px'
            });
            emoji.setOrigin(0.5);
            card.add(emoji);
        }

        // НАЗВАНИЕ
        const nameText = this.scene.add.text(0, 30, title, {
            fontSize: '15px',
            fontFamily: 'Arial Black',
            color: '#ffffff'
        });
        nameText.setOrigin(0.5);
        card.add(nameText);

        // ПОДПИСЬ
        const subText = this.scene.add.text(0, 48, subtitle, {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#bdc3c7'
        });
        subText.setOrigin(0.5);
        card.add(subText);

        // ИНДИКАТОР ВЫБОРА (создаём для всех карточек, но скрываем для невыбранных)
        const checkBg = this.scene.add.graphics();
        checkBg.fillStyle(0xffffff, 1);
        checkBg.fillCircle(width/2 - 15, -height/2 + 15, 15);
        checkBg.lineStyle(2, isAI ? 0x27ae60 : 0x3498db, 1);
        checkBg.strokeCircle(width/2 - 15, -height/2 + 15, 15);
        checkBg.name = 'checkmark_bg';
        checkBg.setVisible(isSelected);
        card.add(checkBg);

        const check = this.scene.add.text(width/2 - 15, -height/2 + 15, '✓', {
            fontSize: '22px',
            color: isAI ? '#27ae60' : '#3498db',
            fontFamily: 'Arial Black'
        });
        check.setOrigin(0.5);
        check.name = 'checkmark';
        check.setVisible(isSelected);
        card.add(check);

        // ИНТЕРАКТИВНОСТЬ
        const hitArea = this.scene.add.zone(0, 0, width, height);
        hitArea.setInteractive({ useHandCursor: true });
        card.add(hitArea);

        // СОБЫТИЯ
        hitArea.on('pointerdown', () => this.selectCharacterStyle(isAI));
        hitArea.on('pointerover', () => {
            card.setScale(1.03);
            this.scene.tweens.add({
                targets: bg,
                alpha: 0.8,
                duration: 150
            });
        });
        hitArea.on('pointerout', () => {
            card.setScale(1);
            this.scene.tweens.add({
                targets: bg,
                alpha: 0.95,
                duration: 150
            });
        });

        return card;
    }

    private selectCharacterStyle(useAI: boolean): void {
        localStorage.setItem('useAISprites', useAI.toString());
        this.applyCharacterStyleChange(useAI); // Применяем изменения сразу!
        this.showNotification(`✅ Персонаж изменён на ${useAI ? 'Рика Санчеза' : 'Стандартный'}!`);
        this.updateCharacterCards(useAI);
    }

    private updateCharacterCards(useAI: boolean): void {
        // Просто обновляем визуальное состояние карточек, не пересоздавая их
        if (this.characterCards) {
            // Обновляем визуальное состояние карточки Рика
            if (this.characterCards.rick) {
                const rickBg = this.characterCards.rick.getByName('bg') as Phaser.GameObjects.Graphics;
                const rickCheck = this.characterCards.rick.getByName('checkmark');
                const rickCheckBg = this.characterCards.rick.getByName('checkmark_bg');
                if (rickBg) {
                    rickBg.clear();
                    rickBg.fillStyle(useAI ? 0x27ae60 : 0x2c3e50, 0.95);
                    rickBg.fillRoundedRect(-90, -70, 180, 140, 12);
                    rickBg.lineStyle(useAI ? 4 : 2, useAI ? 0x2ecc71 : 0x7f8c8d, 1);
                    rickBg.strokeRoundedRect(-90, -70, 180, 140, 12);
                }
                if (rickCheck) {
                    rickCheck.setVisible(useAI);
                }
                if (rickCheckBg) {
                    rickCheckBg.setVisible(useAI);
                }
            }
            
            // Обновляем визуальное состояние карточки стандартного персонажа
            if (this.characterCards.program) {
                const programBg = this.characterCards.program.getByName('bg') as Phaser.GameObjects.Graphics;
                const programCheck = this.characterCards.program.getByName('checkmark');
                const programCheckBg = this.characterCards.program.getByName('checkmark_bg');
                if (programBg) {
                    programBg.clear();
                    programBg.fillStyle(!useAI ? 0x3498db : 0x2c3e50, 0.95);
                    programBg.fillRoundedRect(-90, -70, 180, 140, 12);
                    programBg.lineStyle(!useAI ? 4 : 2, !useAI ? 0x5dade2 : 0x7f8c8d, 1);
                    programBg.strokeRoundedRect(-90, -70, 180, 140, 12);
                }
                if (programCheck) {
                    programCheck.setVisible(!useAI);
                }
                if (programCheckBg) {
                    programCheckBg.setVisible(!useAI);
                }
            }
        }
    }

    private createProfessionalSliderGrid(container: Phaser.GameObjects.Container, x: number, y: number, width: number, valueX: number): void {
        const savedBlur = parseFloat(localStorage.getItem('backgroundBlur') || '0.41');
        const TRACK_HEIGHT = 6;
        const HANDLE_RADIUS = 12;
        
        // ТРЕК СЛАЙДЕРА - ДИНАМИЧЕСКОЕ ПОЗИЦИОНИРОВАНИЕ  
        const track = this.scene.add.graphics();
        track.fillStyle(0x7f8c8d, 1);
        track.fillRoundedRect(x - width/2, y - TRACK_HEIGHT/2, width, TRACK_HEIGHT, TRACK_HEIGHT/2);
        container.add(track);

        // АКТИВНАЯ ЧАСТЬ - ДИНАМИЧЕСКОЕ ПОЗИЦИОНИРОВАНИЕ
        const fill = this.scene.add.graphics();
        fill.fillStyle(0x3498db, 1);
        fill.fillRoundedRect(x - width/2, y - TRACK_HEIGHT/2, width * savedBlur, TRACK_HEIGHT, TRACK_HEIGHT/2);
        fill.name = 'blurFill';
        container.add(fill);

        // РУЧКА СЛАЙДЕРА - ДИНАМИЧЕСКАЯ ПОЗИЦИЯ НА ТРЕКЕ
        const handleX = x - width/2 + width * savedBlur;
        const handle = this.scene.add.graphics();
        handle.fillStyle(0xffffff, 1);
        handle.fillCircle(handleX, y, HANDLE_RADIUS);
        handle.lineStyle(3, 0x3498db, 1);
        handle.strokeCircle(handleX, y, HANDLE_RADIUS);
        handle.name = 'blurHandle';
        handle.setInteractive({
            hitArea: new Phaser.Geom.Circle(handleX, y, HANDLE_RADIUS + 6),
            hitAreaCallback: Phaser.Geom.Circle.Contains,
            draggable: true,
            useHandCursor: true
        });
        container.add(handle);

        // ЗНАЧЕНИЕ - ДИНАМИЧЕСКАЯ ПОЗИЦИЯ
        const valueText = this.scene.add.text(valueX, y, `${Math.round(savedBlur * 100)}%`, {
            fontSize: '16px',
            fontFamily: 'Arial Black',
            color: '#ffffff'
        });
        valueText.setOrigin(0, 0.5);
        valueText.name = 'blurValue';
        container.add(valueText);

        // DRAG HANDLER - АДАПТИВНАЯ ЛОГИКА
        handle.on('drag', (pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
            // Преобразуем координаты из мирового пространства в локальное пространство контейнера
            const localPoint = container.getLocalPoint(pointer.x, pointer.y);
            const relativeX = localPoint.x;
            
            const clampedX = Phaser.Math.Clamp(relativeX, x - width/2, x + width/2);
            const blurAmount = (clampedX - (x - width/2)) / width;
            
            // Обновляем ручку - ДИНАМИЧЕСКОЕ ПОЗИЦИОНИРОВАНИЕ
            handle.clear();
            handle.fillStyle(0xffffff, 1);
            handle.fillCircle(clampedX, y, HANDLE_RADIUS);
            handle.lineStyle(3, 0x3498db, 1);
            handle.strokeCircle(clampedX, y, HANDLE_RADIUS);
            
            // Обновляем hitArea динамически
            handle.input.hitArea = new Phaser.Geom.Circle(clampedX, y, HANDLE_RADIUS + 6);

            // Обновляем заливку - ДИНАМИЧЕСКОЕ ПОЗИЦИОНИРОВАНИЕ
            fill.clear();
            fill.fillStyle(0x3498db, 1);
            fill.fillRoundedRect(x - width/2, y - TRACK_HEIGHT/2, width * blurAmount, TRACK_HEIGHT, TRACK_HEIGHT/2);

            // Обновляем значение
            valueText.setText(`${Math.round(blurAmount * 100)}%`);
            
            // Применяем эффект
            localStorage.setItem('backgroundBlur', blurAmount.toString());
            this.applyBlurEffect(blurAmount);
        });
    }

    // Старый метод для обратной совместимости
    private createSimpleSliderWithGrid(container: Phaser.GameObjects.Container, x: number, y: number, width: number): void {
        // Используем новый динамический метод с вычисленной позицией для значения
        const valueX = x + width/2 + 25;
        this.createProfessionalSliderGrid(container, x, y, width, valueX);
    }



    private showNotification(text: string): void {
        // Уведомление в правом верхнем углу
        const notificationBg = this.scene.add.graphics();
        notificationBg.fillStyle(0xf39c12, 0.95);
        notificationBg.fillRoundedRect(250, -300, 300, 40, 8);
        notificationBg.lineStyle(2, 0xe67e22, 1);
        notificationBg.strokeRoundedRect(250, -300, 300, 40, 8);
        this.add(notificationBg);

        const notification = this.scene.add.text(400, -280, text, {
            fontSize: '12px',
            fontFamily: 'Arial Bold',
            color: '#ffffff'
        });
        notification.setOrigin(0.5);
        this.add(notification);

        // Анимация появления и исчезновения
        notificationBg.setAlpha(0);
        notification.setAlpha(0);

        this.scene.tweens.add({
            targets: [notificationBg, notification],
            alpha: 1,
            duration: 300,
            ease: 'Back.out'
        });

        this.scene.time.delayedCall(3000, () => {
            this.scene.tweens.add({
                targets: [notificationBg, notification],
                alpha: 0,
                y: '-=30',
                duration: 400,
                ease: 'Back.in',
                onComplete: () => {
                    notificationBg.destroy();
                    notification.destroy();
                }
            });
        });
    }

    private applyBlurEffect(amount: number): void {
        const gameScene = this.scene.scene.get('GameScene') as any;
        if (gameScene && gameScene.backgroundTile) {
            if (amount > 0) {
                gameScene.backgroundTile.setAlpha(1 - amount * 0.5);
                gameScene.backgroundTile.setTint(0x888888 + Math.floor(0x777777 * (1 - amount)));
            } else {
                gameScene.backgroundTile.setAlpha(1);
                gameScene.backgroundTile.clearTint();
            }
        }
    }
    
    private applyCharacterStyleChange(useAISprites: boolean): void {
        // Обновляем игрока в активной сцене игры
        const gameScene = this.scene.scene.get('GameScene') as any;
        if (gameScene && gameScene.scene.isActive() && gameScene.player && gameScene.player.updateSprite) {
            gameScene.player.updateSprite(useAISprites);
        }
        
        // Если мы в меню, обновляем превью персонажа 
        const menuScene = this.scene.scene.get('MenuScene') as any;
        if (menuScene && menuScene.scene.isActive() && menuScene.updatePlayerPreview) {
            menuScene.updatePlayerPreview(useAISprites);
        }
        
        // Обновляем все экземпляры игрока в других активных сценах
        this.scene.scene.manager.scenes.forEach((scene: Phaser.Scene) => {
            if (scene.scene.isActive()) {
                const sceneWithPlayer = scene as any;
                if (sceneWithPlayer.player && sceneWithPlayer.player.updateSprite && sceneWithPlayer.player !== gameScene?.player) {
                    sceneWithPlayer.player.updateSprite(useAISprites);
                }
            }
        });
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
        
        // Линия слайдера (интерактивная)
        const track = this.scene.add.graphics();
        track.fillStyle(0x555555, 1);
        track.fillRoundedRect(-150, -5, 300, 10, 5);
        // Делаем трек интерактивным для быстрого перемещения
        track.setInteractive(new Phaser.Geom.Rectangle(-150, -5, 300, 10), Phaser.Geom.Rectangle.Contains);
        track.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            const localPoint = this.lobbyMusicSlider.getLocalPoint(pointer.x, pointer.y);
            const clampedX = Phaser.Math.Clamp(localPoint.x, -150, 150);
            handle.x = clampedX;
            const volume = (clampedX + 150) / 300;
            localStorage.setItem('lobbyMusicVolume', volume.toString());
            const menuScene = this.scene.scene.get('MenuScene');
            if (menuScene && menuScene.scene.isActive()) {
                this.soundSystem.setMusicVolume(volume);
            }
            fill.clear();
            fill.fillStyle(0x00ff00, 1);
            fill.fillRoundedRect(-150, -5, 300 * volume, 10, 5);
            percent.setText(`${Math.round(volume * 100)}%`);
        });
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
        // Увеличиваем область захвата для удобства
        handle.setInteractive({ 
            hitArea: new Phaser.Geom.Circle(0, 0, 25),
            hitAreaCallback: Phaser.Geom.Circle.Contains,
            useHandCursor: true, 
            draggable: true 
        });
        handle.name = 'handle';
        handle.setDepth(10); // Поднимаем над другими элементами
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
        handle.on('drag', (pointer: Phaser.Input.Pointer) => {
            // Преобразуем мировые координаты в локальные координаты слайдера
            const localPoint = this.lobbyMusicSlider.getLocalPoint(pointer.x, pointer.y);
            const clampedX = Phaser.Math.Clamp(localPoint.x, -150, 150);
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
        
        // Линия слайдера (интерактивная)
        const track = this.scene.add.graphics();
        track.fillStyle(0x555555, 1);
        track.fillRoundedRect(-150, -5, 300, 10, 5);
        // Делаем трек интерактивным для быстрого перемещения
        track.setInteractive(new Phaser.Geom.Rectangle(-150, -5, 300, 10), Phaser.Geom.Rectangle.Contains);
        track.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            const localPoint = this.gameMusicSlider.getLocalPoint(pointer.x, pointer.y);
            const clampedX = Phaser.Math.Clamp(localPoint.x, -150, 150);
            handle.x = clampedX;
            const volume = (clampedX + 150) / 300;
            localStorage.setItem('gameMusicVolume', volume.toString());
            const gameScene = this.scene.scene.get('GameScene');
            if (gameScene && gameScene.scene.isActive()) {
                this.soundSystem.setMusicVolume(volume);
            }
            fill.clear();
            fill.fillStyle(0x00ff00, 1);
            fill.fillRoundedRect(-150, -5, 300 * volume, 10, 5);
            percent.setText(`${Math.round(volume * 100)}%`);
        });
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
        // Увеличиваем область захвата для удобства
        handle.setInteractive({ 
            hitArea: new Phaser.Geom.Circle(0, 0, 25),
            hitAreaCallback: Phaser.Geom.Circle.Contains,
            useHandCursor: true, 
            draggable: true 
        });
        handle.name = 'handle';
        handle.setDepth(10); // Поднимаем над другими элементами
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
        handle.on('drag', (pointer: Phaser.Input.Pointer) => {
            // Преобразуем мировые координаты в локальные координаты слайдера
            const localPoint = this.gameMusicSlider.getLocalPoint(pointer.x, pointer.y);
            const clampedX = Phaser.Math.Clamp(localPoint.x, -150, 150);
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
        
        // Линия слайдера (интерактивная)
        const track = this.scene.add.graphics();
        track.fillStyle(0x555555, 1);
        track.fillRoundedRect(-150, -5, 300, 10, 5);
        // Делаем трек интерактивным для быстрого перемещения
        track.setInteractive(new Phaser.Geom.Rectangle(-150, -5, 300, 10), Phaser.Geom.Rectangle.Contains);
        track.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            const localPoint = this.sfxVolumeSlider.getLocalPoint(pointer.x, pointer.y);
            const clampedX = Phaser.Math.Clamp(localPoint.x, -150, 150);
            handle.x = clampedX;
            const volume = (clampedX + 150) / 300;
            this.soundSystem.setSfxVolume(volume);
            fill.clear();
            fill.fillStyle(0x00ff00, 1);
            fill.fillRoundedRect(-150, -5, 300 * volume, 10, 5);
            percent.setText(`${Math.round(volume * 100)}%`);
        });
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
        // Увеличиваем область захвата для удобства
        handle.setInteractive({ 
            hitArea: new Phaser.Geom.Circle(0, 0, 25),
            hitAreaCallback: Phaser.Geom.Circle.Contains,
            useHandCursor: true, 
            draggable: true 
        });
        handle.name = 'handle';
        handle.setDepth(10); // Поднимаем над другими элементами
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
        handle.on('drag', (pointer: Phaser.Input.Pointer) => {
            // Преобразуем мировые координаты в локальные координаты слайдера
            const localPoint = this.sfxVolumeSlider.getLocalPoint(pointer.x, pointer.y);
            const clampedX = Phaser.Math.Clamp(localPoint.x, -150, 150);
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

    // === ТАБЛИЧНЫЕ МЕТОДЫ ДЛЯ ИДЕАЛЬНОГО ВЫРАВНИВАНИЯ ===
    
    private createTableCharacterCards(container: Phaser.GameObjects.Container, centerX: number, centerY: number, maxWidth: number): void {
        const CARD_WIDTH = 160;
        const CARD_HEIGHT = 120;
        const CARD_GAP = 30;
        
        // Точные координаты для 2 карточек в центре ячейки
        const card1X = centerX - CARD_WIDTH/2 - CARD_GAP/2;
        const card2X = centerX + CARD_WIDTH/2 + CARD_GAP/2;
        
        const useAISprites = localStorage.getItem('useAISprites') === 'true';

        // КАРТОЧКА РИКА - ТОЧНАЯ ПОЗИЦИЯ В ТАБЛИЦЕ
        const rickCard = this.createTableCard(
            card1X, centerY, CARD_WIDTH, CARD_HEIGHT,
            'Рик Санчез', 'AI Generated', '🧪',
            useAISprites, true, 'hero-sprite'
        );
        container.add(rickCard);

        // КАРТОЧКА ПРОГРАММНОГО - ТОЧНАЯ ПОЗИЦИЯ В ТАБЛИЦЕ 
        const programCard = this.createTableCard(
            card2X, centerY, CARD_WIDTH, CARD_HEIGHT,
            'Стандартный', 'Программный', '👤', 
            !useAISprites, false, 'player'
        );
        container.add(programCard);

        // Сохраняем ссылки для обновления
        this.characterCards.rick = rickCard;
        this.characterCards.program = programCard;
    }
    
    private createTableBlurSlider(container: Phaser.GameObjects.Container, centerX: number, centerY: number, maxWidth: number): void {
        const savedBlur = parseFloat(localStorage.getItem('backgroundBlur') || '0.41');
        const SLIDER_WIDTH = Math.min(300, maxWidth - 100);
        
        // ИКОНКА - ТОЧНАЯ ПОЗИЦИЯ В ТАБЛИЦЕ
        const iconX = centerX - maxWidth/2 + 40;
        const icon = this.scene.add.text(iconX, centerY, '🌫️', {
            fontSize: '24px'
        });
        icon.setOrigin(0.5);
        container.add(icon);
        
        // ПОДПИСЬ - ТОЧНАЯ ПОЗИЦИЯ В ТАБЛИЦЕ
        const labelX = iconX + 50;
        const label = this.scene.add.text(labelX, centerY, 'Размытие фона', {
            fontSize: '16px',
            fontFamily: 'Arial Bold',
            color: '#ffffff'
        });
        label.setOrigin(0, 0.5);
        container.add(label);
        
        // СЛАЙДЕР - ТОЧНАЯ ПОЗИЦИЯ В ТАБЛИЦЕ
        const sliderX = centerX + 50;
        this.createTableSlider(container, sliderX, centerY, SLIDER_WIDTH, centerX + maxWidth/2 - 60);
    }
    
    private createTableFutureText(container: Phaser.GameObjects.Container, centerX: number, centerY: number): void {
        const text = this.scene.add.text(centerX, centerY, 
            'Качество частиц, динамические тени, сглаживание - скоро будет доступно', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#95a5a6',
            fontStyle: 'italic'
        });
        text.setOrigin(0.5);
        container.add(text);
    }
    
    private createTableCard(x: number, y: number, width: number, height: number,
                           title: string, subtitle: string, fallbackIcon: string,
                           isSelected: boolean, isAI: boolean, textureKey: string): Phaser.GameObjects.Container {
        
        const card = this.scene.add.container(x, y);
        
        // ФОНОВАЯ ПАНЕЛЬ КАРТОЧКИ - ТОЧНЫЕ РАЗМЕРЫ
        const bg = this.scene.add.graphics();
        const bgColor = isSelected ? (isAI ? 0x27ae60 : 0x3498db) : 0x2c3e50;
        const borderColor = isSelected ? (isAI ? 0x2ecc71 : 0x5dade2) : 0x7f8c8d;
        const borderWidth = isSelected ? 3 : 2;

        bg.fillStyle(bgColor, 0.95);
        bg.fillRoundedRect(-width/2, -height/2, width, height, 10);
        bg.lineStyle(borderWidth, borderColor, 1);
        bg.strokeRoundedRect(-width/2, -height/2, width, height, 10);
        bg.name = 'bg';  // Унифицированное имя
        card.add(bg);

        // ПРЕВЬЮ ПЕРСОНАЖА - ЦЕНТРИРОВАН В КАРТОЧКЕ
        if (this.scene.textures.exists(textureKey)) {
            const preview = this.scene.add.image(0, -20, textureKey);
            preview.setScale(0.7);
            card.add(preview);
        } else {
            const emoji = this.scene.add.text(0, -20, fallbackIcon, {
                fontSize: '36px'
            });
            emoji.setOrigin(0.5);
            card.add(emoji);
        }

        // НАЗВАНИЕ - ТОЧНО ПОД ПРЕВЬЮ
        const nameText = this.scene.add.text(0, 25, title, {
            fontSize: '14px',
            fontFamily: 'Arial Black',
            color: '#ffffff'
        });
        nameText.setOrigin(0.5);
        card.add(nameText);

        // ПОДПИСЬ - ТОЧНО ПОД НАЗВАНИЕМ
        const subText = this.scene.add.text(0, 40, subtitle, {
            fontSize: '11px',
            fontFamily: 'Arial',
            color: '#bdc3c7'
        });
        subText.setOrigin(0.5);
        card.add(subText);

        // ИНДИКАТОР ВЫБОРА - создаём для всех, но скрываем для невыбранных
        const checkBg = this.scene.add.graphics();
        checkBg.fillStyle(0xffffff, 1);
        checkBg.fillCircle(width/2 - 12, -height/2 + 12, 10);
        checkBg.lineStyle(2, isAI ? 0x27ae60 : 0x3498db, 1);
        checkBg.strokeCircle(width/2 - 12, -height/2 + 12, 10);
        checkBg.name = 'checkmark_bg';
        checkBg.setVisible(isSelected);
        card.add(checkBg);

        const check = this.scene.add.text(width/2 - 12, -height/2 + 12, '✓', {
            fontSize: '16px',
            color: isAI ? '#27ae60' : '#3498db',
            fontFamily: 'Arial Black'
        });
        check.setOrigin(0.5);
        check.name = 'checkmark';
        check.setVisible(isSelected);
        card.add(check);

        // ИНТЕРАКТИВНОСТЬ
        const hitArea = this.scene.add.zone(0, 0, width, height);
        hitArea.setInteractive({ useHandCursor: true });
        card.add(hitArea);

        // СОБЫТИЯ
        hitArea.on('pointerdown', () => this.selectCharacterStyle(isAI));
        hitArea.on('pointerover', () => card.setScale(1.02));
        hitArea.on('pointerout', () => card.setScale(1));

        return card;
    }
    
    private createTableSlider(container: Phaser.GameObjects.Container, x: number, y: number, width: number, valueX: number): void {
        const savedBlur = parseFloat(localStorage.getItem('backgroundBlur') || '0.41');
        const TRACK_HEIGHT = 6;
        const HANDLE_RADIUS = 10;
        
        // ТРЕК СЛАЙДЕРА - ТОЧНАЯ ГЕОМЕТРИЯ В ТАБЛИЦЕ
        const track = this.scene.add.graphics();
        track.fillStyle(0x7f8c8d, 1);
        track.fillRoundedRect(x - width/2, y - TRACK_HEIGHT/2, width, TRACK_HEIGHT, TRACK_HEIGHT/2);
        container.add(track);

        // АКТИВНАЯ ЧАСТЬ - ТОЧНАЯ ГЕОМЕТРИЯ
        const fill = this.scene.add.graphics();
        fill.fillStyle(0x3498db, 1);
        fill.fillRoundedRect(x - width/2, y - TRACK_HEIGHT/2, width * savedBlur, TRACK_HEIGHT, TRACK_HEIGHT/2);
        fill.name = 'blurFill';
        container.add(fill);

        // РУЧКА СЛАЙДЕРА - ТОЧНАЯ ПОЗИЦИЯ
        const handleX = x - width/2 + width * savedBlur;
        const handle = this.scene.add.graphics();
        handle.fillStyle(0xffffff, 1);
        handle.fillCircle(handleX, y, HANDLE_RADIUS);
        handle.lineStyle(2, 0x3498db, 1);
        handle.strokeCircle(handleX, y, HANDLE_RADIUS);
        handle.name = 'blurHandle';
        handle.setInteractive({
            hitArea: new Phaser.Geom.Circle(handleX, y, HANDLE_RADIUS + 4),
            hitAreaCallback: Phaser.Geom.Circle.Contains,
            draggable: true,
            useHandCursor: true
        });
        container.add(handle);

        // ЗНАЧЕНИЕ - ТОЧНАЯ ПОЗИЦИЯ В ТАБЛИЦЕ
        const valueText = this.scene.add.text(valueX, y, `${Math.round(savedBlur * 100)}%`, {
            fontSize: '14px',
            fontFamily: 'Arial Bold',
            color: '#ffffff'
        });
        valueText.setOrigin(0.5);
        valueText.name = 'blurValue';
        container.add(valueText);

        // DRAG HANDLER - ТОЧНАЯ ЛОГИКА
        handle.on('drag', (pointer: Phaser.Input.Pointer, dragX: number) => {
            const clampedX = Phaser.Math.Clamp(dragX, x - width/2, x + width/2);
            const blurAmount = (clampedX - (x - width/2)) / width;
            
            // Обновляем ручку
            handle.clear();
            handle.fillStyle(0xffffff, 1);
            handle.fillCircle(clampedX, y, HANDLE_RADIUS);
            handle.lineStyle(2, 0x3498db, 1);
            handle.strokeCircle(clampedX, y, HANDLE_RADIUS);
            
            handle.input.hitArea = new Phaser.Geom.Circle(clampedX, y, HANDLE_RADIUS + 4);

            // Обновляем заливку
            fill.clear();
            fill.fillStyle(0x3498db, 1);
            fill.fillRoundedRect(x - width/2, y - TRACK_HEIGHT/2, width * blurAmount, TRACK_HEIGHT, TRACK_HEIGHT/2);

            // Обновляем значение
            valueText.setText(`${Math.round(blurAmount * 100)}%`);
            
            // Применяем эффект
            localStorage.setItem('backgroundBlur', blurAmount.toString());
            this.applyBlurEffect(blurAmount);
        });
    }
    
    // === ПРОФЕССИОНАЛЬНЫЕ МЕТОДЫ ИНТЕРФЕЙСА ===
    
    private createSettingRow(container: Phaser.GameObjects.Container, config: {
        label: string, y: number, leftX: number, rightX: number,
        type: string, options: string[], value: number, min: number, max: number, settingKey: string
    }): void {
        
        // Подложка строки (точно под контентом)
        const rowWidth = 800; // Соответствует contentWidth
        const rowBg = this.scene.add.graphics();
        rowBg.fillStyle(0x2a2a2a, 0.3);
        rowBg.fillRect(-rowWidth/2, config.y - 25, rowWidth, 50);
        if (config.y % 120 === 0) { // Каждая вторая строка
            rowBg.fillStyle(0x333333, 0.2);
            rowBg.fillRect(-rowWidth/2, config.y - 25, rowWidth, 50);
        }
        container.add(rowBg);
        
        // Метка настройки (левая колонка)
        const label = this.scene.add.text(config.leftX, config.y, config.label, {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'normal'
        });
        label.setOrigin(0, 0.5);
        container.add(label);
        
        // Элемент управления (правая колонка)
        switch(config.type) {
            case 'dropdown':
                this.createProfessionalDropdown(container, config.rightX, config.y, config.options, config.value, config.settingKey);
                break;
            case 'slider':
                this.createProfessionalSlider(container, config.rightX, config.y, config.min, config.max, config.value, config.settingKey);
                break;
        }
    }
    
    private createProfessionalDropdown(container: Phaser.GameObjects.Container, x: number, y: number, options: string[], selectedIndex: number, settingKey: string): void {
        const dropdownWidth = 180;
        const dropdownHeight = 35;
        
        // Переменная для отслеживания текущего выбранного индекса
        let currentIndex = selectedIndex;
        
        // Фон дропдауна
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x3a3a3a, 1);
        bg.fillRect(x - dropdownWidth/2, y - dropdownHeight/2, dropdownWidth, dropdownHeight);
        bg.lineStyle(1, 0x555555, 1);
        bg.strokeRect(x - dropdownWidth/2, y - dropdownHeight/2, dropdownWidth, dropdownHeight);
        container.add(bg);
        
        // Текст выбранного значения
        const selectedText = this.scene.add.text(x - dropdownWidth/2 + 10, y, options[currentIndex], {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#ffffff'
        });
        selectedText.setOrigin(0, 0.5);
        container.add(selectedText);
        
        // Стрелка дропдауна
        const arrow = this.scene.add.text(x + dropdownWidth/2 - 20, y, '▼', {
            fontSize: '12px',
            color: '#888888'
        });
        arrow.setOrigin(0.5);
        container.add(arrow);
        
        // Интерактивность
        const hitArea = this.scene.add.zone(x, y, dropdownWidth, dropdownHeight);
        hitArea.setInteractive({ useHandCursor: true });
        container.add(hitArea);
        
        hitArea.on('pointerdown', () => {
            // Обновляем currentIndex и сохраняем его
            currentIndex = (currentIndex + 1) % options.length;
            selectedText.setText(options[currentIndex]);
            this.handleSettingChange(settingKey, currentIndex);
        });
        
        hitArea.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(0x4a4a4a, 1);
            bg.fillRect(x - dropdownWidth/2, y - dropdownHeight/2, dropdownWidth, dropdownHeight);
            bg.lineStyle(1, 0x00aaff, 1);
            bg.strokeRect(x - dropdownWidth/2, y - dropdownHeight/2, dropdownWidth, dropdownHeight);
        });
        
        hitArea.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(0x3a3a3a, 1);
            bg.fillRect(x - dropdownWidth/2, y - dropdownHeight/2, dropdownWidth, dropdownHeight);
            bg.lineStyle(1, 0x555555, 1);
            bg.strokeRect(x - dropdownWidth/2, y - dropdownHeight/2, dropdownWidth, dropdownHeight);
        });
    }
    
    private createProfessionalSlider(container: Phaser.GameObjects.Container, x: number, y: number, min: number, max: number, value: number, settingKey: string): void {
        const sliderWidth = 200;
        const trackHeight = 4;
        const handleRadius = 8;
        
        // Трек слайдера
        const track = this.scene.add.graphics();
        track.fillStyle(0x555555, 1);
        track.fillRect(x - sliderWidth/2, y - trackHeight/2, sliderWidth, trackHeight);
        container.add(track);
        
        // Активная часть трека
        const progress = (value - min) / (max - min);
        const fill = this.scene.add.graphics();
        fill.fillStyle(0x00aaff, 1);
        fill.fillRect(x - sliderWidth/2, y - trackHeight/2, sliderWidth * progress, trackHeight);
        fill.name = 'fill';
        container.add(fill);
        
        // Ручка слайдера
        const handleX = x - sliderWidth/2 + sliderWidth * progress;
        const handle = this.scene.add.graphics();
        handle.fillStyle(0xffffff, 1);
        handle.fillCircle(handleX, y, handleRadius);
        handle.lineStyle(2, 0x00aaff, 1);
        handle.strokeCircle(handleX, y, handleRadius);
        handle.name = 'handle';
        handle.setInteractive({
            hitArea: new Phaser.Geom.Circle(handleX, y, handleRadius + 5),
            hitAreaCallback: Phaser.Geom.Circle.Contains,
            draggable: true,
            useHandCursor: true
        });
        container.add(handle);
        
        // Значение
        const valueText = this.scene.add.text(x + sliderWidth/2 + 20, y, `${value}`, {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#ffffff'
        });
        valueText.setOrigin(0, 0.5);
        valueText.name = 'valueText';
        container.add(valueText);
        
        // Drag handler
        handle.on('drag', (pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
            // Преобразуем координаты из мирового пространства в локальное пространство контейнера
            const localPoint = container.getLocalPoint(pointer.x, pointer.y);
            const relativeX = localPoint.x;
            
            const clampedX = Phaser.Math.Clamp(relativeX, x - sliderWidth/2, x + sliderWidth/2);
            const newProgress = (clampedX - (x - sliderWidth/2)) / sliderWidth;
            const newValue = Math.round(min + newProgress * (max - min));
            
            // Обновляем ручку
            handle.clear();
            handle.fillStyle(0xffffff, 1);
            handle.fillCircle(clampedX, y, handleRadius);
            handle.lineStyle(2, 0x00aaff, 1);
            handle.strokeCircle(clampedX, y, handleRadius);
            handle.input.hitArea = new Phaser.Geom.Circle(clampedX, y, handleRadius + 5);
            
            // Обновляем заливку
            fill.clear();
            fill.fillStyle(0x00aaff, 1);
            fill.fillRect(x - sliderWidth/2, y - trackHeight/2, sliderWidth * newProgress, trackHeight);
            
            // Обновляем значение
            valueText.setText(`${newValue}`);
            
            // Обработка изменения
            this.handleSettingChange(settingKey, newValue);
        });
    }
    
    private getSettingKey(label: string): string {
        const keyMap: { [key: string]: string } = {
            'Стиль персонажа': 'characterStyle',
            'Размытие фона': 'backgroundBlur',
            'Качество теней': 'shadowQuality',
            'Сглаживание': 'antialiasing',
            'Качество частиц': 'particleQuality',
            'Отражения': 'reflections'
        };
        return keyMap[label] || label.toLowerCase().replace(/\s+/g, '');
    }
    
    private handleSettingChange(settingKey: string, value: number): void {
        switch(settingKey) {
            case 'characterStyle':
                const useAI = value === 0;
                localStorage.setItem('useAISprites', useAI ? 'true' : 'false');
                
                // Немедленно применяем изменения к игроку
                this.applyCharacterStyleChange(useAI);
                
                this.showProfessionalNotification(`Стиль персонажа: ${useAI ? 'AI-генерированный' : 'Программный'}. Применено!`);
                break;
            case 'backgroundBlur':
                localStorage.setItem('backgroundBlur', (value / 100).toString());
                this.applyBlurEffect(value / 100);
                break;
            case 'lobbyMusicVolume':
                localStorage.setItem('lobbyMusicVolume', (value / 100).toString());
                // Если мы в меню, применяем громкость сразу
                const menuScene = this.scene.scene.get('MenuScene');
                if (menuScene && menuScene.scene.isActive()) {
                    this.soundSystem.setMusicVolume(value / 100);
                }
                break;
            case 'gameMusicVolume':
                localStorage.setItem('gameMusicVolume', (value / 100).toString());
                // Если мы в игре, применяем громкость сразу
                const gameScene = this.scene.scene.get('GameScene');
                if (gameScene && gameScene.scene.isActive()) {
                    this.soundSystem.setMusicVolume(value / 100);
                }
                break;
            case 'sfxVolume':
                this.soundSystem.setSfxVolume(value / 100);
                // Проигрываем тестовый звук
                this.soundSystem.playSound('coin', { volume: (value / 100) * 0.5 });
                break;
            case 'muteAll':
                this.soundSystem.toggleMute();
                this.showProfessionalNotification(value ? 'Звук выключен' : 'Звук включен');
                break;
            default:
                console.log(`Setting ${settingKey} changed to ${value}`);
        }
    }

    // Специальный метод для создания строк звуковых настроек
    private createSoundSettingRow(container: Phaser.GameObjects.Container, config: {
        label: string, y: number, leftX: number, rightX: number,
        type: string, value: number, min: number, max: number, settingKey: string
    }): void {
        
        // Подложка строки (точно под контентом)
        const rowWidth = 800; // Соответствует contentWidth
        const rowBg = this.scene.add.graphics();
        rowBg.fillStyle(0x2a2a2a, 0.3);
        rowBg.fillRect(-rowWidth/2, config.y - 25, rowWidth, 50);
        if (config.y % 120 === 0) {
            rowBg.fillStyle(0x333333, 0.2);
            rowBg.fillRect(-rowWidth/2, config.y - 25, rowWidth, 50);
        }
        container.add(rowBg);
        
        // Метка настройки
        const label = this.scene.add.text(config.leftX, config.y, config.label, {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'normal'
        });
        label.setOrigin(0, 0.5);
        container.add(label);
        
        // Элемент управления
        switch(config.type) {
            case 'slider':
                this.createProfessionalSlider(container, config.rightX, config.y, config.min, config.max, config.value, config.settingKey);
                break;
            case 'toggle':
                this.createProfessionalToggle(container, config.rightX, config.y, config.value, config.settingKey);
                break;
        }
    }
    
    // Профессиональный тогл для звука
    private createProfessionalToggle(container: Phaser.GameObjects.Container, x: number, y: number, value: number, settingKey: string): void {
        const toggleWidth = 60;
        const toggleHeight = 30;
        const isEnabled = value === 0; // Для mute - 0 означает звук включен
        
        // Фон тогла
        const bg = this.scene.add.graphics();
        bg.fillStyle(isEnabled ? 0x00aa00 : 0xaa0000, 1);
        bg.fillRoundedRect(x - toggleWidth/2, y - toggleHeight/2, toggleWidth, toggleHeight, toggleHeight/2);
        bg.lineStyle(1, 0x555555, 1);
        bg.strokeRoundedRect(x - toggleWidth/2, y - toggleHeight/2, toggleWidth, toggleHeight, toggleHeight/2);
        container.add(bg);
        
        // Ручка тогла
        const handleX = isEnabled ? x + toggleWidth/2 - 15 : x - toggleWidth/2 + 15;
        const handle = this.scene.add.graphics();
        handle.fillStyle(0xffffff, 1);
        handle.fillCircle(handleX, y, 12);
        handle.lineStyle(1, 0x333333, 1);
        handle.strokeCircle(handleX, y, 12);
        container.add(handle);
        
        // Текст состояния
        const statusText = this.scene.add.text(x + toggleWidth/2 + 30, y, isEnabled ? 'ВКЛ' : 'ВЫКЛ', {
            fontSize: '14px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: isEnabled ? '#00aa00' : '#aa0000'
        });
        statusText.setOrigin(0, 0.5);
        container.add(statusText);
        
        // Интерактивность
        const hitArea = this.scene.add.zone(x, y, toggleWidth + 60, toggleHeight);
        hitArea.setInteractive({ useHandCursor: true });
        container.add(hitArea);
        
        hitArea.on('pointerdown', () => {
            const newValue = isEnabled ? 1 : 0;
            const newEnabled = newValue === 0;
            
            // Обновляем визуал
            bg.clear();
            bg.fillStyle(newEnabled ? 0x00aa00 : 0xaa0000, 1);
            bg.fillRoundedRect(x - toggleWidth/2, y - toggleHeight/2, toggleWidth, toggleHeight, toggleHeight/2);
            bg.lineStyle(1, 0x555555, 1);
            bg.strokeRoundedRect(x - toggleWidth/2, y - toggleHeight/2, toggleWidth, toggleHeight, toggleHeight/2);
            
            const newHandleX = newEnabled ? x + toggleWidth/2 - 15 : x - toggleWidth/2 + 15;
            handle.clear();
            handle.fillStyle(0xffffff, 1);
            handle.fillCircle(newHandleX, y, 12);
            handle.lineStyle(1, 0x333333, 1);
            handle.strokeCircle(newHandleX, y, 12);
            
            statusText.setText(newEnabled ? 'ВКЛ' : 'ВЫКЛ');
            statusText.setColor(newEnabled ? '#00aa00' : '#aa0000');
            
            this.handleSettingChange(settingKey, newValue);
        });
    }
    
    private showProfessionalNotification(text: string): void {
        // Минималистичное уведомление как в AAA играх
        const notification = this.scene.add.text(400, -300, text, {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#ffffff',
            backgroundColor: 'rgba(0, 170, 255, 0.8)',
            padding: { x: 15, y: 8 }
        });
        notification.setOrigin(0.5);
        this.add(notification);
        
        // Анимация
        this.scene.tweens.add({
            targets: notification,
            alpha: 0,
            y: '-=20',
            duration: 2000,
            ease: 'Power2',
            onComplete: () => notification.destroy()
        });
    }
    
    // РЕАЛЬНЫЕ НАСТРОЙКИ ЗВУКА В ПРОФЕССИОНАЛЬНОМ СТИЛЕ
    private createProfessionalSoundTab(panelWidth: number, panelHeight: number): void {
        const container = this.scene.add.container(0, 0);
        
        // Создаём невидимую зону для отслеживания прокрутки ПЕРВОЙ, чтобы она была ПОД всеми элементами
        const scrollZone = this.scene.add.zone(0, 0, panelWidth, panelHeight);
        scrollZone.setInteractive();
        container.add(scrollZone);
        
        // Создаём прокручиваемый контейнер для содержимого
        const scrollContainer = this.scene.add.container(0, 0);
        container.add(scrollContainer);
        
        // УБИРАЕМ ВСЮ ЭТУ ХУЙНЮ С МАСКАМИ И ОГРАНИЧЕНИЯМИ
        const viewportHeight = panelHeight - 180;
        const viewportTop = -panelHeight/2 + 160;
        const viewportBottom = viewportTop + viewportHeight;
        
        // Переменная для отслеживания позиции прокрутки
        let scrollY = 0;
        const maxScroll = 0;
        let minScroll = 0;
        
        let currentY = -panelHeight/2 + 160; // Начинаем ниже вкладок
        const rowHeight = 50;
        
        // Музыка лобби
        const lobbyMusicLabel = this.scene.add.text(-300, currentY, '🎵 Музыка лобби:', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffffff'
        });
        lobbyMusicLabel.setOrigin(0, 0.5);
        scrollContainer.add(lobbyMusicLabel);
        
        const lobbyVolume = parseFloat(localStorage.getItem('lobbyMusicVolume') || '0.2');
        this.createSimpleSlider(scrollContainer, 50, currentY, 200, lobbyVolume, (value) => {
            localStorage.setItem('lobbyMusicVolume', value.toString());
            // Если мы в меню, применяем громкость
            const menuScene = this.scene.scene.get('MenuScene');
            if (menuScene && menuScene.scene.isActive()) {
                this.soundSystem.setMusicVolume(value);
            }
        });
        
        currentY += rowHeight;
        
        // Музыка в игре
        const gameMusicLabel = this.scene.add.text(-300, currentY, '🎮 Музыка в игре:', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffffff'
        });
        gameMusicLabel.setOrigin(0, 0.5);
        scrollContainer.add(gameMusicLabel);
        
        const gameVolume = parseFloat(localStorage.getItem('gameMusicVolume') || '0.2');
        this.createSimpleSlider(scrollContainer, 50, currentY, 200, gameVolume, (value) => {
            localStorage.setItem('gameMusicVolume', value.toString());
        });
        
        currentY += rowHeight;
        
        // Звуковые эффекты
        const sfxLabel = this.scene.add.text(-300, currentY, '🔊 Звуковые эффекты:', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffffff'
        });
        sfxLabel.setOrigin(0, 0.5);
        scrollContainer.add(sfxLabel);
        
        const sfxVolume = this.soundSystem.getSfxVolume();
        this.createSimpleSlider(scrollContainer, 50, currentY, 200, sfxVolume, (value) => {
            this.soundSystem.setSfxVolume(value);
        });
        
        currentY += rowHeight;
        
        // Разделитель
        const separator = this.scene.add.graphics();
        separator.lineStyle(1, 0x555555, 0.5);
        separator.lineBetween(-350, currentY, 350, currentY);
        scrollContainer.add(separator);
        currentY += 30;
        
        // Заголовок индивидуальных настроек
        const individualTitle = this.scene.add.text(0, currentY, '📊 Индивидуальная настройка звуков', {
            fontSize: '18px',
            fontFamily: 'Arial Bold',
            color: '#00aaff'
        });
        individualTitle.setOrigin(0.5);
        scrollContainer.add(individualTitle);
        currentY += 40;
        
        // Получаем все индивидуальные настройки звуков
        const individualSounds = [
            { key: 'jump', label: '🦘 Прыжок' },
            { key: 'land', label: '👟 Приземление' },
            { key: 'footstep', label: '👣 Шаги' },
            { key: 'coin', label: '🪙 Монеты', defaultVolume: 0.15 },
            { key: 'powerup', label: '⭐ Усиления' },
            { key: 'hurt', label: '💔 Урон игрока' },
            { key: 'death', label: '💀 Смерть игрока' },
            { key: 'enemy_hurt', label: '👹 Урон врага' },
            { key: 'enemy_death', label: '👻 Смерть врага' },
            { key: 'portal', label: '🌀 Портал' },
            { key: 'lava_bubble', label: '🔥 Лава' }
        ];
        
        // Создаём слайдеры для каждого звука
        individualSounds.forEach((sound) => {
            // Метка звука
            const label = this.scene.add.text(-300, currentY, sound.label, {
                fontSize: '14px',
                fontFamily: 'Arial',
                color: '#dddddd'
            });
            label.setOrigin(0, 0.5);
            scrollContainer.add(label);
            
            // Слайдер для звука (используем дефолтную громкость если указана)
            const defaultVolume = sound.defaultVolume !== undefined ? sound.defaultVolume * 100 : 100;
            const volume = this.soundSystem.getIndividualVolume(sound.key, defaultVolume) / 100; // Преобразуем из 0-100 в 0-1
            this.createSimpleSlider(scrollContainer, 50, currentY, 180, volume, (value) => {
                this.soundSystem.setIndividualVolume(sound.key, value * 100); // Преобразуем обратно в 0-100
                
                // Проигрываем звук для проверки (кроме смерти и лавы)
                if (sound.key !== 'death' && sound.key !== 'lava_bubble') {
                    this.soundSystem.playSound(sound.key);
                }
            });
            
            currentY += 40; // Компактнее для индивидуальных звуков
        });
        
        // Кнопка сброса к значениям по умолчанию
        currentY += 20;
        const resetButton = this.createResetButton(0, currentY);
        scrollContainer.add(resetButton);
        
        // Вычисляем общую высоту содержимого для прокрутки
        const totalContentHeight = currentY - viewportTop + 50; // Высота от начала до конца содержимого
        minScroll = Math.min(0, viewportHeight - totalContentHeight);
        
        // Добавляем обработку прокрутки ТОЛЬКО когда мышь над панелью
        scrollZone.on('wheel', (pointer: Phaser.Input.Pointer, deltaX: number, deltaY: number, deltaZ: number) => {
            if (container.visible && this.visible && totalContentHeight > viewportHeight) {
                const scrollSpeed = 30;
                scrollY = Phaser.Math.Clamp(scrollY - deltaY * scrollSpeed, minScroll, maxScroll);
                scrollContainer.y = scrollY;
                
                // Обновляем позицию ползунка прокрутки
                if (minScroll < 0) {
                    const scrollPercent = scrollY / minScroll;
                    const scrollThumb = container.getByName('scrollThumb');
                    if (scrollThumb && scrollThumb instanceof Phaser.GameObjects.Graphics) {
                        const scrollThumbHeight = Math.max(30, (viewportHeight / totalContentHeight) * viewportHeight);
                        const thumbY = viewportTop + 2 + scrollPercent * (viewportHeight - scrollThumbHeight);
                        scrollThumb.clear();
                        scrollThumb.fillStyle(0x666666, 0.8);
                        scrollThumb.fillRoundedRect(panelWidth/2 - 19, thumbY, 8, scrollThumbHeight - 4, 4);
                    }
                }
            }
        });
        
        // Добавляем индикатор прокрутки если содержимое не помещается
        if (totalContentHeight > viewportHeight) {
            const scrollbarX = panelWidth/2 - 20;
            
            // Фон полосы прокрутки
            const scrollTrack = this.scene.add.graphics();
            scrollTrack.fillStyle(0x333333, 0.3);
            scrollTrack.fillRoundedRect(scrollbarX, viewportTop, 10, viewportHeight, 5);
            container.add(scrollTrack);
            
            // Ползунок прокрутки
            const scrollThumbHeight = Math.max(30, (viewportHeight / totalContentHeight) * viewportHeight);
            const scrollThumb = this.scene.add.graphics();
            scrollThumb.fillStyle(0x666666, 0.8);
            scrollThumb.fillRoundedRect(scrollbarX + 1, viewportTop + 2, 8, scrollThumbHeight - 4, 4);
            scrollThumb.name = 'scrollThumb';
            container.add(scrollThumb);
            
            
            // Добавляем подсказку о прокрутке
            const scrollHint = this.scene.add.text(0, viewportBottom - 20, '⬇ Прокрутите для остальных настроек ⬇', {
                fontSize: '12px',
                fontFamily: 'Arial',
                color: '#888888'
            });
            scrollHint.setOrigin(0.5);
            container.add(scrollHint);
        }
        
        container.setVisible(false);
        this.tabContents.push(container);
        this.add(container);
    }
    
    // Простой рабочий слайдер - БЕЗ ВЛОЖЕННЫХ КОНТЕЙНЕРОВ
    private createSimpleSlider(container: Phaser.GameObjects.Container, x: number, y: number, 
                                width: number, value: number, onChange: (value: number) => void): void {
        
        // Трек слайдера - добавляем прямо в контейнер
        const track = this.scene.add.graphics();
        track.fillStyle(0x555555, 1);
        track.fillRoundedRect(x - width/2, y - 3, width, 6, 3);
        container.add(track);
        
        // Заполненная часть - добавляем прямо в контейнер
        const fill = this.scene.add.graphics();
        fill.fillStyle(0x00ff00, 1);
        fill.fillRoundedRect(x - width/2, y - 3, width * value, 6, 3);
        container.add(fill);
        
        // Ручка - добавляем прямо в контейнер
        const handleX = x - width/2 + width * value;
        const handle = this.scene.add.circle(handleX, y, 10, 0xffffff);
        handle.setInteractive({ useHandCursor: true, draggable: true });
        container.add(handle);
        
        // Процент - добавляем прямо в контейнер
        const percent = this.scene.add.text(x + width/2 + 15, y, `${Math.round(value * 100)}%`, {
            fontSize: '14px',
            color: '#ffffff',
            fontFamily: 'Arial'
        });
        percent.setOrigin(0, 0.5);
        container.add(percent);
        
        // Обработка перетаскивания
        handle.on('drag', (pointer: Phaser.Input.Pointer) => {
            const localPoint = container.getLocalPoint(pointer.x, pointer.y);
            const relativeX = localPoint.x - x;
            const clampedX = Phaser.Math.Clamp(relativeX, -width/2, width/2);
            handle.x = x + clampedX;
            
            const newValue = (clampedX + width/2) / width;
            
            // Обновляем визуализацию
            fill.clear();
            fill.fillStyle(0x00ff00, 1);
            fill.fillRoundedRect(x - width/2, y - 3, width * newValue, 6, 3);
            percent.setText(`${Math.round(newValue * 100)}%`);
            
            // Вызываем обработчик
            onChange(newValue);
        });
    }
    
    // РЕАЛЬНЫЕ НАСТРОЙКИ УПРАВЛЕНИЯ В ПРОФЕССИОНАЛЬНОМ СТИЛЕ  
    private createProfessionalControlsTab(panelWidth: number, panelHeight: number): void {
        const container = this.scene.add.container(0, 0);
        
        const contentY = -panelHeight/2 + 180;
        const leftColumnX = -panelWidth/2 + 80;
        const rightColumnX = panelWidth/2 - 80;
        
        // Секция PC управления
        const pcTitle = this.scene.add.text(leftColumnX, contentY, 'КЛАВИАТУРА', {
            fontSize: '18px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#00aaff'
        });
        pcTitle.setOrigin(0, 0.5);
        container.add(pcTitle);
        
        const pcControls = [
            { keys: 'A/D ←→', action: 'Движение влево/вправо' },
            { keys: 'ПРОБЕЛ', action: 'Прыжок (двойной доступен)' },
            { keys: 'W ↑', action: 'Лазание вверх по лианам' },
            { keys: 'S ↓', action: 'Приседание / Спуск по лианам' },
            { keys: 'E', action: 'Захват/отпускание лиан' },
            { keys: 'SHIFT', action: 'Ускорение бега' },
            { keys: 'ESC', action: 'Пауза' }
        ];
        
        pcControls.forEach((control, index) => {
            const y = contentY + 50 + index * 35;
            
            // Клавиша
            const keyBg = this.scene.add.graphics();
            keyBg.fillStyle(0x3a3a3a, 1);
            keyBg.fillRect(leftColumnX, y - 12, 80, 24);
            keyBg.lineStyle(1, 0x555555, 1);
            keyBg.strokeRect(leftColumnX, y - 12, 80, 24);
            container.add(keyBg);
            
            const keyText = this.scene.add.text(leftColumnX + 40, y, control.keys, {
                fontSize: '11px',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                color: '#ffffff'
            });
            keyText.setOrigin(0.5);
            container.add(keyText);
            
            // Действие
            const actionText = this.scene.add.text(leftColumnX + 95, y, control.action, {
                fontSize: '13px',
                fontFamily: 'Arial',
                color: '#cccccc'
            });
            actionText.setOrigin(0, 0.5);
            container.add(actionText);
        });
        
        // Секция мобильного управления
        const mobileTitle = this.scene.add.text(rightColumnX - 300, contentY, 'СЕНСОРНЫЙ ЭКРАН', {
            fontSize: '18px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#00aaff'
        });
        mobileTitle.setOrigin(0, 0.5);
        container.add(mobileTitle);
        
        const mobileControls = [
            { gesture: '🕹️ Джойстик', action: 'Движение влево/вправо' },
            { gesture: '🕹️ Вверх', action: 'Прыжок' },
            { gesture: '🕹️ Вниз', action: 'Приседание' },
            { gesture: 'Ⓐ Кнопка A', action: 'Прыжок (двойной)' },
            { gesture: 'Ⓑ Кнопка B', action: 'Атака (скоро)' },
            { gesture: '👆👇 Свайпы', action: 'Лазание по лианам' },
            { gesture: '⏸️ Пауза', action: 'Меню паузы' }
        ];
        
        mobileControls.forEach((control, index) => {
            const y = contentY + 50 + index * 35;
            
            // Жест
            const gestureText = this.scene.add.text(rightColumnX - 280, y, control.gesture, {
                fontSize: '12px',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                color: '#ffffff'
            });
            gestureText.setOrigin(0, 0.5);
            container.add(gestureText);
            
            // Стрелка
            const arrow = this.scene.add.text(rightColumnX - 160, y, '→', {
                fontSize: '12px',
                color: '#00aaff'
            });
            arrow.setOrigin(0.5);
            container.add(arrow);
            
            // Действие
            const actionText = this.scene.add.text(rightColumnX - 140, y, control.action, {
                fontSize: '12px',
                fontFamily: 'Arial',
                color: '#cccccc'
            });
            actionText.setOrigin(0, 0.5);
            container.add(actionText);
        });
        
        // Подсказка
        const tipY = contentY + 350;
        const tipBg = this.scene.add.graphics();
        tipBg.fillStyle(0x2a2a2a, 0.8);
        tipBg.fillRect(-400, tipY - 15, 800, 30);
        tipBg.lineStyle(1, 0x555555, 1);
        tipBg.strokeRect(-400, tipY - 15, 800, 30);
        container.add(tipBg);
        
        const tipText = this.scene.add.text(0, tipY, 'СОВЕТ: Двойной прыжок доступен сразу! Тройной - с бустом!', {
            fontSize: '14px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#00aaff'
        });
        tipText.setOrigin(0.5);
        container.add(tipText);
        
        container.setVisible(false);
        this.tabContents.push(container);
        this.add(container);
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

    private createIndividualSoundRow(container: Phaser.GameObjects.Container, config: {
        key: string,
        label: string,
        y: number,
        leftX: number,
        rightX: number,
        value: number
    }): void {
        // Компактная подложка строки
        const rowWidth = 800;
        const rowBg = this.scene.add.graphics();
        rowBg.fillStyle(0x2a2a2a, 0.2);
        rowBg.fillRect(-rowWidth/2, config.y - 20, rowWidth, 40);
        container.add(rowBg);
        
        // Метка с эмодзи слева
        const label = this.scene.add.text(config.leftX, config.y, config.label, {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#dddddd'
        });
        label.setOrigin(0, 0.5);
        container.add(label);
        
        // Компактный слайдер
        const sliderWidth = 150;
        const sliderX = config.rightX - 100;
        
        // Трек слайдера
        const track = this.scene.add.graphics();
        track.fillStyle(0x555555, 1);
        track.fillRect(sliderX - sliderWidth/2, config.y - 2, sliderWidth, 4);
        container.add(track);
        
        // Активная часть трека
        const progress = config.value / 100;
        const fill = this.scene.add.graphics();
        fill.fillStyle(0x00aaff, 1);
        fill.fillRect(sliderX - sliderWidth/2, config.y - 2, sliderWidth * progress, 4);
        container.add(fill);
        
        // Ручка слайдера
        const handleX = sliderX - sliderWidth/2 + sliderWidth * progress;
        const handle = this.scene.add.graphics();
        handle.fillStyle(0xffffff, 1);
        handle.fillCircle(handleX, config.y, 6);
        handle.lineStyle(1, 0x00aaff, 1);
        handle.strokeCircle(handleX, config.y, 6);
        handle.setInteractive({
            hitArea: new Phaser.Geom.Circle(handleX, config.y, 10),
            hitAreaCallback: Phaser.Geom.Circle.Contains,
            draggable: true,
            useHandCursor: true
        });
        container.add(handle);
        
        // Значение
        const valueText = this.scene.add.text(config.rightX, config.y, `${config.value}%`, {
            fontSize: '13px',
            fontFamily: 'Arial',
            color: '#ffffff'
        });
        valueText.setOrigin(1, 0.5);
        container.add(valueText);
        
        // Drag handler
        handle.on('drag', (pointer: Phaser.Input.Pointer) => {
            const localPoint = container.getLocalPoint(pointer.x, pointer.y);
            const relativeX = localPoint.x;
            
            const clampedX = Phaser.Math.Clamp(relativeX, sliderX - sliderWidth/2, sliderX + sliderWidth/2);
            const newProgress = (clampedX - (sliderX - sliderWidth/2)) / sliderWidth;
            const newValue = Math.round(newProgress * 100);
            
            // Обновляем графику
            handle.clear();
            handle.fillStyle(0xffffff, 1);
            handle.fillCircle(clampedX, config.y, 6);
            handle.lineStyle(1, 0x00aaff, 1);
            handle.strokeCircle(clampedX, config.y, 6);
            handle.input.hitArea = new Phaser.Geom.Circle(clampedX, config.y, 10);
            
            fill.clear();
            fill.fillStyle(0x00aaff, 1);
            fill.fillRect(sliderX - sliderWidth/2, config.y - 2, sliderWidth * newProgress, 4);
            
            valueText.setText(`${newValue}%`);
            
            // Сохраняем настройку
            this.soundSystem.setIndividualVolume(config.key, newValue);
            
            // Воспроизводим тестовый звук при изменении
            if (config.key !== 'death' && config.key !== 'lava_bubble') { // Не проигрываем слишком негативные звуки
                this.soundSystem.playSound(config.key, { volume: 0.5 });
            }
        });
    }
    
    private createResetButton(x: number, y: number): Phaser.GameObjects.Container {
        const buttonContainer = this.scene.add.container(x, y);
        
        // Фон кнопки
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x555555, 0.8);
        bg.fillRoundedRect(-100, -20, 200, 40, 8);
        bg.lineStyle(2, 0x888888, 1);
        bg.strokeRoundedRect(-100, -20, 200, 40, 8);
        buttonContainer.add(bg);
        
        // Текст кнопки
        const text = this.scene.add.text(0, 0, '🔄 Сброс к умолчанию', {
            fontSize: '14px',
            fontFamily: 'Arial Bold',
            color: '#ffffff'
        });
        text.setOrigin(0.5);
        buttonContainer.add(text);
        
        // Интерактивность
        bg.setInteractive(new Phaser.Geom.Rectangle(-100, -20, 200, 40), Phaser.Geom.Rectangle.Contains);
        
        bg.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(0x666666, 1);
            bg.fillRoundedRect(-100, -20, 200, 40, 8);
            bg.lineStyle(2, 0x00aaff, 1);
            bg.strokeRoundedRect(-100, -20, 200, 40, 8);
        });
        
        bg.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(0x555555, 0.8);
            bg.fillRoundedRect(-100, -20, 200, 40, 8);
            bg.lineStyle(2, 0x888888, 1);
            bg.strokeRoundedRect(-100, -20, 200, 40, 8);
        });
        
        bg.on('pointerdown', () => {
            this.soundSystem.resetIndividualVolumes();
            this.showProfessionalNotification('Звуки сброшены к значениям по умолчанию');
            
            // Обновляем UI - перезагружаем вкладку звука
            this.showTab(1);
        });
        
        return buttonContainer;
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