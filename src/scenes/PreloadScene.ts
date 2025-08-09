import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';

export class PreloadScene extends Phaser.Scene {
    private progressBar!: Phaser.GameObjects.Graphics;
    private progressBox!: Phaser.GameObjects.Graphics;
    private loadingText!: Phaser.GameObjects.Text;
    private percentText!: Phaser.GameObjects.Text;
    private assetText!: Phaser.GameObjects.Text;

    constructor() {
        super({ key: 'PreloadScene' });
    }

    preload(): void {
        this.createLoadingScreen();
        this.loadAssets();
    }

    private createLoadingScreen(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.progressBox = this.add.graphics();
        this.progressBar = this.add.graphics();

        this.progressBox.fillStyle(0x222222, 0.8);
        this.progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

        this.loadingText = this.make.text({
            x: width / 2,
            y: height / 2 - 50,
            text: 'Загрузка...',
            style: {
                font: '20px monospace',
                color: '#ffffff'
            }
        });
        this.loadingText.setOrigin(0.5, 0.5);

        this.percentText = this.make.text({
            x: width / 2,
            y: height / 2,
            text: '0%',
            style: {
                font: '18px monospace',
                color: '#ffffff'
            }
        });
        this.percentText.setOrigin(0.5, 0.5);

        this.assetText = this.make.text({
            x: width / 2,
            y: height / 2 + 50,
            text: '',
            style: {
                font: '14px monospace',
                color: '#ffffff'
            }
        });
        this.assetText.setOrigin(0.5, 0.5);

        // Обновление прогресс-бара
        this.load.on('progress', (value: number) => {
            this.percentText.setText(Math.floor(value * 100) + '%');
            this.progressBar.clear();
            this.progressBar.fillStyle(0xffffff, 1);
            this.progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
        });

        this.load.on('fileprogress', (file: any) => {
            this.assetText.setText('Загружается: ' + file.key);
        });

        this.load.on('complete', () => {
            this.progressBar.destroy();
            this.progressBox.destroy();
            this.loadingText.destroy();
            this.percentText.destroy();
            this.assetText.destroy();
        });
    }

    private loadAssets(): void {
        // Загружаем красивые AI-сгенерированные спрайты
        this.load.image('hero-sprite', '/sprites/hero.png');
        this.load.image('background-forest', '/sprites/background.png');
        this.load.image('platform-texture', '/sprites/platform.png');
        this.load.image('enemy-sprite', '/sprites/enemy.png');
        
        // Генерируем дополнительные спрайты программно
        this.generateSprites();
        
        // Загружаем звуки (если есть)
        // this.load.audio('jump', 'assets/sounds/jump.mp3');
        // this.load.audio('coin', 'assets/sounds/coin.mp3');
        // this.load.audio('powerup', 'assets/sounds/powerup.mp3');
        // this.load.audio('music', 'assets/sounds/music.mp3');
    }

    private generateSprites(): void {
        // Генерируем игрока
        this.generatePlayer();
        
        // Генерируем врагов
        this.generateEnemies();
        
        // Генерируем окружение
        this.generateEnvironment();
        
        // Генерируем UI элементы
        this.generateUI();
    }

    private generatePlayer(): void {
        // Создаём графику с увеличенным разрешением для чёткости
        const graphics = this.add.graphics();
        graphics.lineStyle(2, 0x000000, 0.8); // Добавляем контуры для чёткости
        
        // Кадр 1 - стоит прямо (увеличенное разрешение)
        this.drawPlayerFrame(graphics, 0, false);
        graphics.generateTexture('player_idle', 80, 100);
        
        // Кадр 2 - бежит (левая нога вперёд)
        graphics.clear();
        graphics.lineStyle(2, 0x000000, 0.8);
        this.drawPlayerFrame(graphics, 1, false);
        graphics.generateTexture('player_run1', 80, 100);
        
        // Кадр 3 - бежит (правая нога вперёд)
        graphics.clear();
        graphics.lineStyle(2, 0x000000, 0.8);
        this.drawPlayerFrame(graphics, 2, false);
        graphics.generateTexture('player_run2', 80, 100);
        
        // Кадр 4 - прыжок
        graphics.clear();
        graphics.lineStyle(2, 0x000000, 0.8);
        this.drawPlayerFrame(graphics, 3, false);
        graphics.generateTexture('player_jump', 80, 100);
        
        // Основная текстура для обратной совместимости
        graphics.clear();
        graphics.lineStyle(2, 0x000000, 0.8);
        this.drawPlayerFrame(graphics, 0, false);
        graphics.generateTexture('player', 80, 100);
        
        graphics.destroy();
    }
    
    private drawPlayerFrame(graphics: Phaser.GameObjects.Graphics, frame: number, flipX: boolean): void {
        // Увеличиваем размеры для лучшего качества
        const scale = 1.5;
        const offsetX = flipX ? 80 : 0;
        const scaleX = flipX ? -1 : 1;
        
        // Майка/футболка (увеличенные размеры)
        graphics.fillStyle(0x3498db, 1);
        graphics.fillRoundedRect(20, 33, 40, 45, 6);
        graphics.fillStyle(0x2980b9, 1);
        graphics.fillRoundedRect(20, 33, 40, 6, 0); // Воротник
        graphics.strokeRoundedRect(20, 33, 40, 45, 6); // Контур
        
        // Голова (увеличенная)
        graphics.fillStyle(0xffdbac, 1);
        graphics.fillCircle(40, 22, 16);
        graphics.strokeCircle(40, 22, 16);
        
        // Волосы/шляпа
        graphics.fillStyle(0x8b4513, 1);
        graphics.fillEllipse(40, 12, 14, 8);
        
        // Глаза (смотрят в сторону движения)
        graphics.fillStyle(0xffffff, 1);
        if (frame === 0) { // idle - смотрит вперёд
            graphics.fillCircle(34, 22, 4);
            graphics.fillCircle(46, 22, 4);
            graphics.fillStyle(0x2c3e50, 1);
            graphics.fillCircle(35, 22, 2);
            graphics.fillCircle(45, 22, 2);
        } else { // движение - смотрит вправо
            graphics.fillCircle(36, 22, 4);
            graphics.fillCircle(48, 22, 4);
            graphics.fillStyle(0x2c3e50, 1);
            graphics.fillCircle(38, 22, 2);
            graphics.fillCircle(49, 22, 2);
        }
        
        // Руки (анимированные)
        graphics.fillStyle(0xffdbac, 1);
        if (frame === 0) { // idle
            graphics.fillRoundedRect(12, 38, 8, 20, 3);
            graphics.fillRoundedRect(60, 38, 8, 20, 3);
        } else if (frame === 1) { // бег 1
            graphics.fillRoundedRect(14, 35, 8, 20, 3); // левая рука вперёд
            graphics.fillRoundedRect(58, 41, 8, 20, 3); // правая назад
        } else if (frame === 2) { // бег 2
            graphics.fillRoundedRect(12, 41, 8, 20, 3); // левая назад
            graphics.fillRoundedRect(60, 35, 8, 20, 3); // правая вперёд
        } else if (frame === 3) { // прыжок
            graphics.fillRoundedRect(10, 32, 8, 18, 3); // левая вверх
            graphics.fillRoundedRect(62, 32, 8, 18, 3); // правая вверх
        }
        
        // Ноги (анимированные)
        graphics.fillStyle(0x2c3e50, 1); // штаны
        if (frame === 0) { // idle
            graphics.fillRoundedRect(28, 68, 10, 20, 2);
            graphics.fillRoundedRect(42, 68, 10, 20, 2);
        } else if (frame === 1) { // бег 1
            graphics.fillRoundedRect(26, 68, 10, 20, 2); // левая вперёд
            graphics.fillRoundedRect(44, 70, 10, 18, 2); // правая согнута
        } else if (frame === 2) { // бег 2
            graphics.fillRoundedRect(30, 70, 10, 18, 2); // левая согнута
            graphics.fillRoundedRect(40, 68, 10, 20, 2); // правая вперёд
        } else if (frame === 3) { // прыжок
            graphics.fillRoundedRect(28, 65, 10, 15, 2); // левая согнута
            graphics.fillRoundedRect(42, 65, 10, 15, 2); // правая согнута
        }
        
        // Ботинки
        graphics.fillStyle(0x8b4513, 1);
        if (frame === 0 || frame === 3) { // idle или прыжок
            graphics.fillRoundedRect(27, 88, 12, 10, 2);
            graphics.fillRoundedRect(41, 88, 12, 10, 2);
        } else if (frame === 1) {
            graphics.fillRoundedRect(25, 86, 12, 10, 2);
            graphics.fillRoundedRect(43, 88, 12, 8, 2);
        } else if (frame === 2) {
            graphics.fillRoundedRect(29, 88, 12, 8, 2);
            graphics.fillRoundedRect(39, 86, 12, 10, 2);
        }
    }

    private generateEnemies(): void {
        const graphics = this.add.graphics();
        
        // Враг 1 - Красный гриб
        graphics.clear();
        // Ножка
        graphics.fillStyle(0xf39c12, 1);
        graphics.fillRect(15, 20, 10, 15);
        // Шляпка
        graphics.fillGradientStyle(0xe74c3c, 0xc0392b, 0xe74c3c, 0xa93226, 1);
        graphics.fillEllipse(20, 12, 18, 12);
        // Точки
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(15, 10, 2);
        graphics.fillCircle(25, 10, 2);
        graphics.fillCircle(20, 15, 2);
        // Глаза
        graphics.fillStyle(0x2c3e50, 1);
        graphics.fillCircle(14, 8, 3);
        graphics.fillCircle(26, 8, 3);
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(15, 7, 1);
        graphics.fillCircle(27, 7, 1);
        graphics.generateTexture('enemy1', 40, 35);
        
        // Враг 2 - Зелёный слайм
        graphics.clear();
        graphics.fillGradientStyle(0x27ae60, 0x229954, 0x27ae60, 0x1e8449, 1);
        graphics.fillEllipse(20, 25, 20, 15);
        graphics.fillStyle(0x239b56, 1);
        graphics.fillEllipse(20, 20, 18, 18);
        // Глаза
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(13, 18, 4);
        graphics.fillCircle(27, 18, 4);
        graphics.fillStyle(0x2c3e50, 1);
        graphics.fillCircle(14, 19, 2);
        graphics.fillCircle(26, 19, 2);
        // Блик
        graphics.fillStyle(0x52be80, 0.5);
        graphics.fillEllipse(25, 15, 8, 6);
        graphics.generateTexture('enemy2', 40, 40);
        
        // Враг 3 - Летучая мышь
        graphics.clear();
        // Тело
        graphics.fillGradientStyle(0x9b59b6, 0x8e44ad, 0x9b59b6, 0x7d3c98, 1);
        graphics.fillEllipse(20, 20, 15, 12);
        // Крылья
        graphics.fillStyle(0x7d3c98, 0.8);
        graphics.fillTriangle(5, 15, 10, 25, 15, 18);
        graphics.fillTriangle(35, 15, 30, 25, 25, 18);
        // Уши
        graphics.fillStyle(0x9b59b6, 1);
        graphics.fillCircle(15, 13, 5);
        graphics.fillCircle(25, 13, 5);
        // Глаза
        graphics.fillStyle(0xe74c3c, 1);
        graphics.fillCircle(15, 20, 3);
        graphics.fillCircle(25, 20, 3);
        graphics.fillStyle(0x2c3e50, 1);
        graphics.fillCircle(15, 20, 1);
        graphics.fillCircle(25, 20, 1);
        // Зубы
        graphics.fillStyle(0xffffff, 1);
        graphics.fillTriangle(18, 23, 20, 26, 22, 23);
        graphics.generateTexture('enemy3', 40, 40);
        
        graphics.destroy();
    }

    private generateEnvironment(): void {
        const graphics = this.add.graphics();
        
        // Красивая платформа с травой и правильной обводкой
        // Основа платформы
        graphics.fillStyle(0x8b6914, 1);
        graphics.fillRect(0, 0, 100, 32);
        
        // Градиентная земля
        graphics.fillGradientStyle(0x8b6914, 0x654321, 0x8b6914, 0x654321, 1);
        graphics.fillRect(2, 6, 96, 20);
        
        // Камешки в земле
        for (let i = 0; i < 5; i++) {
            graphics.fillStyle(0x696969, 0.8);
            graphics.fillCircle(Math.random() * 90 + 5, Math.random() * 10 + 10, 2);
        }
        
        // Трава сверху
        graphics.fillStyle(0x4a7c59, 1);
        graphics.fillRect(0, 0, 100, 6);
        // Детали травы
        for (let i = 0; i < 100; i += 3) {
            graphics.fillStyle(0x5fa052, 1);
            graphics.fillRect(i, 0, 2, Math.random() * 4 + 2);
        }
        
        // Обводка со всех сторон
        graphics.lineStyle(2, 0x3e2723, 1);
        graphics.strokeRect(0, 0, 100, 32);
        
        graphics.generateTexture('platform', 100, 32);
        
        // Красивая монетка с деталями
        graphics.clear();
        // Внешний обод
        graphics.fillStyle(0xffd700, 1);
        graphics.fillCircle(15, 15, 12);
        // Градиент монеты
        graphics.fillGradientStyle(0xffed4e, 0xffd700, 0xffed4e, 0xffd700, 1);
        graphics.fillCircle(15, 15, 10);
        // Внутренний круг
        graphics.fillStyle(0xffa500, 1);
        graphics.fillCircle(15, 15, 8);
        // Символ доллара
        graphics.fillStyle(0xffd700, 1);
        graphics.fillRect(14, 10, 2, 10);
        graphics.fillRect(12, 11, 6, 2);
        graphics.fillRect(12, 14, 6, 2);
        graphics.fillRect(12, 17, 6, 2);
        // Блик
        graphics.fillStyle(0xffffff, 0.6);
        graphics.fillEllipse(12, 12, 4, 3);
        graphics.generateTexture('coin', 30, 30);
        
        // Лиана
        graphics.clear();
        graphics.lineStyle(3, 0x8b4513, 1);
        graphics.lineBetween(0, 0, 0, 20);
        graphics.generateTexture('vine_segment', 6, 20);
        
        // Красивые металлические шипы - БОЛЕЕ КАЧЕСТВЕННЫЕ И РАЗНООБРАЗНЫЕ
        graphics.clear();
        // Увеличиваем размер текстуры для лучшего качества
        const spikeColors = [
            { base: 0x9a9a9a, light: 0xdadada, dark: 0x606060 },
            { base: 0xa8a8a8, light: 0xe8e8e8, dark: 0x707070 },
            { base: 0x8a8a8a, light: 0xcacaca, dark: 0x505050 }
        ];
        
        for (let i = 0; i < 3; i++) {
            const colors = spikeColors[i];
            // Основание шипа с градиентом
            graphics.fillGradientStyle(colors.base, colors.dark, colors.base, colors.dark, 1);
            graphics.fillTriangle(
                i * 20 + 10, 2,
                i * 20 + 3, 23,
                i * 20 + 17, 23
            );
            // Яркий блик для объёма
            graphics.fillStyle(colors.light, 0.7);
            graphics.fillTriangle(
                i * 20 + 10, 2,
                i * 20 + 10, 10,
                i * 20 + 14, 12
            );
            // Тень с другой стороны
            graphics.fillStyle(colors.dark, 0.4);
            graphics.fillTriangle(
                i * 20 + 10, 2,
                i * 20 + 6, 12,
                i * 20 + 10, 10
            );
        }
        graphics.generateTexture('spikes', 60, 25);
        
        // Анимированная лава - БЕЗ КРУГОВ, БОЛЕЕ РЕАЛИСТИЧНАЯ
        graphics.clear();
        // Основной слой - тёмно-красная база
        graphics.fillStyle(0xcc0000, 1);
        graphics.fillRect(0, 0, 100, 30);
        
        // Градиентные волны лавы (горизонтальные)
        graphics.fillGradientStyle(0xff4400, 0xff6600, 0xff4400, 0xff6600, 1);
        graphics.fillRect(0, 0, 100, 30);
        
        // Яркие оранжевые потоки (вертикальные полосы)
        for (let i = 0; i < 8; i++) {
            const x = i * 12 + Math.random() * 6;
            const width = 3 + Math.random() * 4;
            graphics.fillGradientStyle(0xff8800, 0xffaa00, 0xff8800, 0xffaa00, 1);
            graphics.fillRect(x, 0, width, 30);
        }
        
        // Горячие жёлтые прожилки (неровные линии)
        graphics.lineStyle(2, 0xffff00, 0.8);
        for (let i = 0; i < 3; i++) {
            const y = 5 + i * 10;
            graphics.beginPath();
            graphics.moveTo(0, y);
            for (let x = 0; x <= 100; x += 10) {
                graphics.lineTo(x, y + Math.sin(x * 0.1) * 3);
            }
            graphics.strokePath();
        }
        
        // Яркая кромка сверху (где лава самая горячая)
        graphics.fillGradientStyle(0xffff00, 0xffaa00, 0xffff00, 0xffaa00, 1, 0.3, 1, 0);
        graphics.fillRect(0, 0, 100, 5);
        
        graphics.generateTexture('lava', 100, 30);
        
        // Красивые Power-ups с эффектами
        // Звезда прыжка
        graphics.clear();
        // Внешнее свечение
        graphics.fillStyle(0xffff00, 0.3);
        graphics.fillCircle(20, 20, 20);
        // Градиентная звезда
        graphics.fillGradientStyle(0xffd700, 0xffff00, 0xffd700, 0xffff00, 1);
        graphics.beginPath();
        const cx = 20, cy = 20, spikes = 5, outerRadius = 18, innerRadius = 8;
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        const step = Math.PI / spikes;
        graphics.moveTo(cx, cy - outerRadius);
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            graphics.lineTo(x, y);
            rot += step;
            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            graphics.lineTo(x, y);
            rot += step;
        }
        graphics.lineTo(cx, cy - outerRadius);
        graphics.closePath();
        graphics.fillPath();
        // Блик
        graphics.fillStyle(0xffffff, 0.5);
        graphics.fillCircle(16, 16, 4);
        graphics.generateTexture('powerup_jump', 40, 40);
        
        // Молния скорости
        graphics.clear();
        // Свечение
        graphics.fillStyle(0x00ffff, 0.3);
        graphics.fillCircle(20, 20, 20);
        // Основа
        graphics.fillGradientStyle(0x00bfff, 0x00ffff, 0x00bfff, 0x00ffff, 1);
        graphics.fillCircle(20, 20, 16);
        // Молния
        graphics.fillStyle(0xffffff, 1);
        graphics.beginPath();
        graphics.moveTo(15, 10);
        graphics.lineTo(20, 18);
        graphics.lineTo(18, 18);
        graphics.lineTo(25, 30);
        graphics.lineTo(20, 22);
        graphics.lineTo(22, 22);
        graphics.closePath();
        graphics.fillPath();
        graphics.generateTexture('powerup_speed', 40, 40);
        
        // Щит неуязвимости
        graphics.clear();
        // Свечение
        graphics.fillStyle(0xff00ff, 0.3);
        graphics.fillCircle(20, 20, 20);
        // Градиентный щит
        graphics.fillGradientStyle(0xff00ff, 0xff69b4, 0xff00ff, 0xff69b4, 1);
        graphics.beginPath();
        graphics.moveTo(20, 5);
        graphics.lineTo(35, 15);
        graphics.lineTo(35, 25);
        graphics.lineTo(20, 35);
        graphics.lineTo(5, 25);
        graphics.lineTo(5, 15);
        graphics.closePath();
        graphics.fillPath();
        // Центральная звезда
        graphics.fillStyle(0xffffff, 0.9);
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
            const px = 20 + Math.cos(angle) * 6;
            const py = 20 + Math.sin(angle) * 6;
            graphics.fillRect(px - 1, py - 1, 2, 2);
        }
        graphics.generateTexture('powerup_invincible', 40, 40);
        
        // Фоны
        graphics.clear();
        graphics.fillStyle(0x87CEEB, 1);
        graphics.fillRect(0, 0, 1280, 720);
        graphics.generateTexture('sky', 1280, 720);
        
        // Декоративная трава
        graphics.clear();
        for (let i = 0; i < 8; i++) {
            const height = Math.random() * 10 + 5;
            graphics.fillStyle(0x4a7c59, 0.9);
            graphics.fillRect(i * 5, 15 - height, 2, height);
            graphics.fillStyle(0x5fa052, 1);
            graphics.fillRect(i * 5 + 1, 15 - height, 1, height);
        }
        graphics.generateTexture('grass', 40, 15);
        
        // Камешки
        graphics.clear();
        for (let i = 0; i < 3; i++) {
            const x = i * 10 + 5;
            const y = 5;
            graphics.fillStyle(0x696969, 1);
            graphics.fillEllipse(x, y, 6, 4);
            graphics.fillStyle(0x808080, 0.5);
            graphics.fillEllipse(x - 1, y - 1, 3, 2);
        }
        graphics.generateTexture('stones', 30, 10);
        
        // Цветы
        graphics.clear();
        // Стебель
        graphics.fillStyle(0x228b22, 1);
        graphics.fillRect(9, 8, 2, 7);
        // Лепестки
        const colors = [0xff69b4, 0xffff00, 0xff00ff, 0x00ffff];
        const color = colors[Math.floor(Math.random() * colors.length)];
        graphics.fillStyle(color, 1);
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 3) {
            const x = 10 + Math.cos(angle) * 4;
            const y = 5 + Math.sin(angle) * 4;
            graphics.fillCircle(x, y, 3);
        }
        // Центр цветка
        graphics.fillStyle(0xffff00, 1);
        graphics.fillCircle(10, 5, 2);
        graphics.generateTexture('flower', 20, 15);
        
        // Специальный спрайт для тумана - мягкое облако
        graphics.clear();
        // Создаём градиентное облако для тумана
        const fogSize = 64;
        const centerX = fogSize / 2;
        const centerY = fogSize / 2;
        
        // Рисуем несколько полупрозрачных кругов для создания облачного эффекта
        for (let i = 0; i < 5; i++) {
            const offsetX = (Math.random() - 0.5) * 20;
            const offsetY = (Math.random() - 0.5) * 15;
            const radius = 20 + Math.random() * 10;
            const alpha = 0.1 + Math.random() * 0.15;
            
            graphics.fillStyle(0xffffff, alpha);
            graphics.fillCircle(centerX + offsetX, centerY + offsetY, radius);
        }
        
        // Центральное более плотное облако
        graphics.fillStyle(0xffffff, 0.2);
        graphics.fillCircle(centerX, centerY, 25);
        graphics.fillStyle(0xffffff, 0.15);
        graphics.fillCircle(centerX, centerY, 30);
        graphics.fillStyle(0xffffff, 0.08);
        graphics.fillCircle(centerX, centerY, 35);
        
        graphics.generateTexture('fog_particle', fogSize, fogSize);
        
        // Спрайт для солнечных бликов - мягкий градиент
        graphics.clear();
        const flareSize = 128;
        const flareCenterX = flareSize / 2;
        const flareCenterY = flareSize / 2;
        
        // Создаём мягкий радиальный градиент
        for (let r = flareSize / 2; r > 0; r -= 2) {
            const alpha = Math.pow((r / (flareSize / 2)), 3) * 0.15; // Кубическая функция для мягкого спада
            graphics.fillStyle(0xffffee, alpha);
            graphics.fillCircle(flareCenterX, flareCenterY, r);
        }
        
        graphics.generateTexture('sun_flare', flareSize, flareSize);
        
        // Спрайт для сердечка (жизни)
        graphics.clear();
        // Красивое красное сердечко
        const heartSize = 32;
        const hx = heartSize / 2;
        const hy = heartSize / 2;
        
        // Ярко-красное сердце
        graphics.fillStyle(0xff0044, 1);
        // Левая половина сердца
        graphics.fillCircle(hx - 5, hy - 5, 7);
        // Правая половина сердца
        graphics.fillCircle(hx + 5, hy - 5, 7);
        // Нижняя часть сердца
        graphics.fillTriangle(hx - 11, hy - 2, hx + 11, hy - 2, hx, hy + 12);
        // Блик для объёма
        graphics.fillStyle(0xffffff, 0.3);
        graphics.fillEllipse(hx - 3, hy - 6, 4, 3);
        graphics.fillStyle(0xff6688, 0.5);
        graphics.fillEllipse(hx + 2, hy - 4, 3, 2);
        graphics.generateTexture('heart', heartSize, heartSize);
        
        // Пустое сердечко (потерянная жизнь)
        graphics.clear();
        // Контур сердца
        graphics.lineStyle(2, 0x666666, 1);
        // Левая половина
        graphics.strokeCircle(hx - 5, hy - 5, 7);
        // Правая половина
        graphics.strokeCircle(hx + 5, hy - 5, 7);
        // Нижняя часть
        graphics.beginPath();
        graphics.moveTo(hx - 11, hy - 2);
        graphics.lineTo(hx, hy + 12);
        graphics.lineTo(hx + 11, hy - 2);
        graphics.strokePath();
        graphics.generateTexture('heart_empty', heartSize, heartSize);
        
        graphics.destroy();
    }

    private generateUI(): void {
        const graphics = this.add.graphics();
        
        // Кнопка для мобильных устройств
        graphics.fillStyle(0xffffff, 0.3);
        graphics.fillCircle(40, 40, 40);
        graphics.generateTexture('button_a', 80, 80);
        
        graphics.clear();
        graphics.fillStyle(0xffffff, 0.3);
        graphics.fillCircle(40, 40, 40);
        graphics.generateTexture('button_b', 80, 80);
        
        // Джойстик
        graphics.clear();
        graphics.fillStyle(0xffffff, 0.2);
        graphics.fillCircle(75, 75, 75);
        graphics.fillStyle(0xffffff, 0.5);
        graphics.fillCircle(75, 75, 30);
        graphics.generateTexture('joystick_base', 150, 150);
        
        graphics.clear();
        graphics.fillStyle(0xffffff, 0.8);
        graphics.fillCircle(30, 30, 30);
        graphics.generateTexture('joystick_thumb', 60, 60);
        
        graphics.destroy();
    }

    create(): void {
        // Обновляем HTML progress bar
        const progressElement = document.getElementById('loading-progress');
        if (progressElement) {
            progressElement.style.width = '100%';
        }
        
        // Переходим к меню
        this.time.delayedCall(500, () => {
            this.scene.start('MenuScene');
        });
    }
}