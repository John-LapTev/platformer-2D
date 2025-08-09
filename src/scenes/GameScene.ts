import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { PowerUp } from '../entities/PowerUp';
import { VineSystem } from '../systems/VineSystem';
import { PhysicsSystem } from '../systems/PhysicsSystem';
import { SaveSystem } from '../systems/SaveSystem';
import { PortalSystem } from '../systems/PortalSystem';
import { GameConfig } from '../config/GameConfig';
import { TouchControls } from '../ui/TouchControls';

export class GameScene extends Phaser.Scene {
    private player!: Player;
    private enemies: Enemy[] = [];
    private powerUps: PowerUp[] = [];
    private platforms!: Phaser.Physics.Arcade.StaticGroup;
    private hazards!: Phaser.Physics.Arcade.StaticGroup;
    private collectibles!: Phaser.Physics.Arcade.StaticGroup;
    private vineSystem!: VineSystem;
    private physicsSystem!: PhysicsSystem;
    private portalSystem!: PortalSystem;
    private touchControls?: TouchControls;
    private currentLevel: string = 'level1';
    private score: number = 0;
    private lives: number = GameConfig.MAX_LIVES;
    private checkpointX: number = 100;
    private checkpointY: number = 500;  // Безопасная высота над платформой на 700
    private isPaused: boolean = false;

    constructor() {
        super({ key: 'GameScene' });
    }

    init(data: any): void {
        if (data.level) {
            this.currentLevel = data.level;
        }
        this.score = 0;
        this.lives = GameConfig.MAX_LIVES;
        this.isPaused = false;
    }

    create(): void {
        // Фон
        this.createBackground();
        
        // Инициализируем системы ПЕРЕД созданием уровня
        this.physicsSystem = new PhysicsSystem(this);
        this.vineSystem = new VineSystem(this);
        this.portalSystem = new PortalSystem(this);
        
        // Создаём уровень
        this.createLevel();
        
        // Создаём игрока но делаем невидимым для анимации появления
        this.player = new Player(this, this.checkpointX, this.checkpointY);
        this.player.sprite.setVisible(false);
        this.player.sprite.setScale(0);
        
        // Задержка перед появлением портала
        this.time.delayedCall(800, () => {
            // Создаём стартовый портал чуть выше персонажа
            const spawnPortal = this.portalSystem.createPortal(this.checkpointX, this.checkpointY - 20, 'spawn');
            spawnPortal.setScale(0.01, 0.01);
            spawnPortal.setAlpha(0);
            spawnPortal.setDepth(100);
            
            // Яркая вспышка при открытии
            const flash = this.add.graphics();
            flash.fillStyle(0x00ff00, 1);
            flash.fillCircle(this.checkpointX, this.checkpointY - 20, 10);
            flash.setDepth(200);
            
            this.tweens.add({
                targets: flash,
                scaleX: 15,
                scaleY: 15,
                alpha: 0,
                duration: 1000,
                ease: 'Power2.out',
                onComplete: () => flash.destroy()
            });
            
            // Медленное открытие портала - сначала горизонтально
            this.tweens.add({
                targets: spawnPortal,
                scaleX: 1.2,
                scaleY: 0.05,
                alpha: 1,
                duration: 450,
                ease: 'Power2.out',
                onComplete: () => {
                    // Затем вертикально
                    this.tweens.add({
                        targets: spawnPortal,
                        scaleX: 1,
                        scaleY: 1,
                        duration: 350,
                        ease: 'Back.out',
                        onComplete: () => {
                            // Появляется игрок
                            this.player.sprite.setVisible(true);
                            this.player.respawn(this.checkpointX, this.checkpointY);
                            
                            // Устанавливаем правильную глубину для портала за персонажем
                            spawnPortal.setDepth(1); // Видимый, но за персонажем
                            this.player.sprite.setDepth(10); // Персонаж впереди портала
                            
                            // Портал быстро закрывается через 0.5 секунды
                            this.time.delayedCall(1500, () => {
                                this.portalSystem.closePortal(spawnPortal);
                            });
                        }
                    });
                }
            });
        });
        
        // Устанавливаем игрока в VineSystem
        this.vineSystem.setPlayer(this.player.sprite);
        
        // Создаём врагов
        this.createEnemies();
        
        // Передаём игрока врагам для обнаружения
        this.enemies.forEach(enemy => {
            enemy.setPlayer(this.player.sprite);
        });
        
        // Создаём power-ups
        this.createPowerUps();
        
        // Создаём финиш уровня (после создания игрока)
        this.createFinish();
        
        // Настраиваем физику
        this.setupPhysics();
        
        // Камера
        this.setupCamera();
        
        // Мобильное управление
        if (this.checkMobile()) {
            this.touchControls = new TouchControls(this);
            this.touchControls.setPlayer(this.player);
        }
        
        // Клавиатурное управление
        this.setupKeyboardControls();
        
        // Пауза
        this.input.keyboard?.on('keydown-ESC', () => {
            this.togglePause();
        });
        
        // Обработка полного урона
        this.events.on('player-damage-full', () => {
            this.playerHit();
        });
        
        // Сохраняем при достижении checkpoint
        this.time.addEvent({
            delay: 5000,
            callback: () => this.autoSave(),
            loop: true
        });
    }

    private createBackground(): void {
        // Красивый AI-фон
        const bg = this.add.image(0, 0, 'background-forest');
        bg.setOrigin(0, 0);
        bg.setScrollFactor(0, 0);
        bg.setDisplaySize(1280, 720);
        
        // Убрали старый прямоугольный туман - теперь только красивый облачный
        
        // Красивый туман из мягких облачных частиц с плавным появлением И исчезновением
        const fogParticles = this.add.particles(0, 0, 'fog_particle', {
            x: { min: 0, max: 5000 },
            y: { min: 200, max: 500 },
            scale: { start: 0, end: 2 },  // Плавно растёт
            alpha: {
                onEmit: () => 0,  // Начинается с 0
                onUpdate: (particle, key, t) => {
                    // Плавное появление и исчезновение
                    if (t < 0.2) return t * 5 * 0.12;  // Появление (первые 20%)
                    if (t > 0.8) return (1 - t) * 5 * 0.12;  // Исчезновение (последние 20%)
                    return 0.12;  // Максимальная видимость в середине
                }
            },
            speed: { min: 3, max: 10 },
            lifespan: 25000,
            frequency: 150,
            tint: [0xffffff, 0xf0f0f0, 0xe8e8e8],
            blendMode: Phaser.BlendModes.NORMAL,
            emitZone: {
                type: 'random',
                source: new Phaser.Geom.Rectangle(0, 0, 5000, 300)
            }
        });
        fogParticles.setScrollFactor(0.5, 0.5);
        
        // Дополнительный слой тумана для глубины
        const fogLayer2 = this.add.particles(0, 0, 'fog_particle', {
            x: { min: 0, max: 5000 },
            y: { min: 300, max: 600 },
            scale: { start: 0.5, end: 3 },  // Плавное увеличение
            alpha: {
                onEmit: () => 0,
                onUpdate: (particle, key, t) => {
                    if (t < 0.15) return t * 6.67 * 0.08;  // Плавное появление
                    if (t > 0.85) return (1 - t) * 6.67 * 0.08;  // Плавное исчезновение
                    return 0.08;
                }
            },
            speed: { min: 2, max: 6 },
            lifespan: 35000,
            frequency: 250,
            tint: [0xf8f8f8, 0xf0f0f0],
            blendMode: Phaser.BlendModes.NORMAL
        });
        fogLayer2.setScrollFactor(0.3, 0.3);
        
        // Мягкие солнечные блики с плавными краями
        const lightParticles = this.add.particles(0, 0, 'sun_flare', {
            x: { min: 0, max: 5000 },
            y: { min: 100, max: 400 },
            scale: { start: 0.5, end: 0 },
            alpha: { start: 0.08, end: 0 },
            speed: { min: 5, max: 15 },
            lifespan: 12000,
            frequency: 4000,  // Реже появляются
            tint: [0xffffee, 0xffeeaa, 0xffffff],
            blendMode: Phaser.BlendModes.ADD
        });
        lightParticles.setScrollFactor(0.7, 0.7);
    }

    private createLevel(): void {
        // Платформы
        this.platforms = this.physics.add.staticGroup();
        
        // Основная земля внизу экрана
        for (let i = 0; i < 50; i++) {
            const platform = this.platforms.create(i * 100, 700, 'platform-texture');
            platform.setScale(0.3, 0.5).refreshBody();
            platform.setTint(0x7a5d3a);
        }
        
        // Случайные платформы
        const platformPositions = [
            { x: 300, y: 450 },
            { x: 500, y: 350 },
            { x: 700, y: 400 },
            { x: 900, y: 300 },
            { x: 1100, y: 450 },
            { x: 1400, y: 250 },
            { x: 1600, y: 400 },
            { x: 1900, y: 350 },
            { x: 2200, y: 200 },
            { x: 2500, y: 450 }
        ];
        
        platformPositions.forEach(pos => {
            this.platforms.create(pos.x, pos.y, 'platform');
        });
        
        // Опасности
        this.hazards = this.physics.add.staticGroup();
        
        // Шипы (НАД землёй - ЕЩЁ ВЫШЕ, но НЕ в зоне лавы)
        for (let i = 0; i < 10; i++) {
            const spikeX = 600 + i * 300;
            // Пропускаем зону лавы (примерно 1375-1725)
            if (spikeX < 1375 || spikeX > 1725) {
                const spike = this.hazards.create(spikeX, 638, 'spikes');
                spike.setScale(1.2, 1.2);
                spike.setOrigin(0.5, 1); // Якорь внизу = низ шипов на Y:638
                spike.setAlpha(1); // Полная непрозрачность
                
                // Расширяем хитбокс шипов
                const body = spike.body as Phaser.Physics.Arcade.Body;
                body.setSize(45, 20);
                body.setOffset(0, 0);
            }
        }
        
        // Лава (единый большой объект полностью закрывающий землю)
        const lavaX = 1550; // Центральная позиция лавы
        const lava = this.hazards.create(lavaX, 687, 'lava');
        lava.setScale(3.5, 3.5); // Увеличиваем и ширину и высоту для полного покрытия
        lava.setOrigin(0.5, 0.5); // Якорь по центру
        
        // Расширяем хитбокс лавы для правильного урона
        const body = lava.body as Phaser.Physics.Arcade.Body;
        body.setSize(300, 40); // Широкий хитбокс на всю зону лавы
        body.setOffset(-150, -40); // Центрируем хитбокс
        
        // Убираем прозрачность, добавляем пульсацию яркости
        lava.setAlpha(1); // Полная непрозрачность
        this.tweens.add({
            targets: lava,
            tint: { from: 0xffffff, to: 0xff6600 },
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut'
        });
        
        // Внутренняя анимация лавы - пузыри и переливы по всей ширине
        const lavaParticles = this.add.particles(lavaX, lava.y - 50, 'fog_particle', {
            scale: { start: 0.15, end: 0.05 },
            speed: { min: 5, max: 20 },
            lifespan: 1200,
            frequency: 200,
            tint: [0xff4500, 0xffa500, 0xffff00, 0xff0000],
            alpha: { start: 0.6, end: 0 },
            angle: { min: -110, max: -70 },
            blendMode: Phaser.BlendModes.ADD,
            emitZone: {
                type: 'random',
                source: new Phaser.Geom.Rectangle(-150, 0, 300, 10)
            }
        });
        
        // Создаём графические градиенты для маскировки резких краёв
        const leftGradient = this.add.graphics();
        const rightGradient = this.add.graphics();
        
        // Левый градиент - от коричневого (земля) к красному (лава)
        for (let i = 0; i < 80; i++) {
            const progress = i / 80;
            const alpha = Math.pow(progress, 0.5); // Используем квадратный корень для более плавного перехода
            
            // Интерполируем цвет от земли к лаве
            const r = Math.floor(139 + (204 - 139) * progress);
            const g = Math.floor(69 + (51 - 69) * progress);
            const b = Math.floor(19 + (0 - 19) * progress);
            
            leftGradient.fillStyle(Phaser.Display.Color.GetColor(r, g, b), alpha * 0.8);
            leftGradient.fillRect(lavaX - 175 - 80 + i, 687 - 52, 2, 105);
        }
        
        // Правый градиент - от красного (лава) к коричневому (земля)
        for (let i = 0; i < 80; i++) {
            const progress = 1 - (i / 80);
            const alpha = Math.pow(progress, 0.5); // Используем квадратный корень для более плавного перехода
            
            // Интерполируем цвет от лавы к земле
            const r = Math.floor(204 - (204 - 139) * (1 - progress));
            const g = Math.floor(51 - (51 - 69) * (1 - progress));
            const b = Math.floor(0 - (0 - 19) * (1 - progress));
            
            rightGradient.fillStyle(Phaser.Display.Color.GetColor(r, g, b), alpha * 0.8);
            rightGradient.fillRect(lavaX + 175 + i, 687 - 52, 2, 105);
        }
        
        // Дополнительное размытие краёв самой лавы чёрными полупрозрачными полосами
        const leftShadow = this.add.graphics();
        const rightShadow = this.add.graphics();
        
        // Левая тень для смягчения края
        for (let i = 0; i < 30; i++) {
            const alpha = (30 - i) / 30;
            leftShadow.fillStyle(0x000000, alpha * 0.3);
            leftShadow.fillRect(lavaX - 175 + i, 687 - 52, 1, 105);
        }
        
        // Правая тень для смягчения края
        for (let i = 0; i < 30; i++) {
            const alpha = (30 - i) / 30;
            rightShadow.fillStyle(0x000000, alpha * 0.3);
            rightShadow.fillRect(lavaX + 175 - i, 687 - 52, 1, 105);
        }
        
        // Коллекционные предметы
        this.collectibles = this.physics.add.staticGroup();
        
        // Монетки (чуть выше платформ)
        platformPositions.forEach((pos, index) => {
            for (let i = 0; i < 3; i++) {
                const coin = this.collectibles.create(pos.x - 30 + i * 30, pos.y - 35, 'coin');
                coin.setScale(1.2);
            }
        });
        
        // Создаём лианы
        this.createVines();
        
        // Добавляем декоративные элементы
        this.createDecorations();
    }

    private createDecorations(): void {
        // Трава на платформах (пропускаем места с лавой)
        for (let i = 0; i < 50; i++) {
            const x = i * 100 + Math.random() * 80;
            // Пропускаем зону лавы с запасом (1300-1800)
            if ((x < 1300 || x > 1800) && Math.random() > 0.3) {
                const grass = this.add.image(x, 636, 'grass');
                grass.setScale(0.8 + Math.random() * 0.4);
                grass.setAlpha(0.8);
                grass.setOrigin(0.5, 1); // Якорь внизу = низ травы на Y:636
            }
        }
        
        // Камни (пропускаем места с лавой)
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * 5000;
            // Пропускаем зону лавы с запасом (1300-1800)
            if (x < 1300 || x > 1800) {
                const stone = this.add.image(x, 640, 'stones');
                stone.setScale(0.6 + Math.random() * 0.4);
                stone.setAlpha(0.7);
                stone.setOrigin(0.5, 1); // Якорь внизу = низ камней на Y:640
            }
        }
        
        // Цветы (пропускаем места с лавой и шипами)
        for (let i = 0; i < 15; i++) {
            const x = Math.random() * 5000;
            // Пропускаем зону лавы с запасом (1300-1800) и зоны шипов
            let skipZone = false;
            if (x >= 1300 && x <= 1800) skipZone = true; // Лава
            for (let j = 0; j < 10; j++) {
                const spikeX = 600 + j * 300;
                if (x >= spikeX - 50 && x <= spikeX + 50) skipZone = true; // Шипы
            }
            
            if (!skipZone) {
                const flower = this.add.image(x, 636, 'flower');
                flower.setScale(0.8 + Math.random() * 0.4);
                flower.setAlpha(0.9);
                flower.setOrigin(0.5, 1); // Якорь внизу = низ цветов на Y:636
            }
        }
    }

    private createVines(): void {
        const vinePositions = [
            { x: 800, y: 100 },
            { x: 1200, y: 50 },
            { x: 1800, y: 100 },
            { x: 2400, y: 80 }
        ];
        
        vinePositions.forEach(pos => {
            this.vineSystem.createVine(pos.x, pos.y, 15);
        });
    }

    private createEnemies(): void {
        const enemyPositions = [
            { x: 400, y: 660, type: 'enemy1' },
            { x: 800, y: 660, type: 'enemy2' },
            { x: 1200, y: 400, type: 'enemy3' },
            { x: 1600, y: 660, type: 'enemy1' },
            { x: 2000, y: 300, type: 'enemy2' },
            { x: 2400, y: 660, type: 'enemy3' }
        ];
        
        enemyPositions.forEach(pos => {
            const enemy = new Enemy(this, pos.x, pos.y, pos.type);
            this.enemies.push(enemy);
        });
    }

    private createPowerUps(): void {
        const powerUpPositions = [
            { x: 600, y: 300, type: 'jump' },
            { x: 1300, y: 200, type: 'speed' },
            { x: 2100, y: 150, type: 'invincible' }
        ];
        
        powerUpPositions.forEach(pos => {
            const powerUp = new PowerUp(this, pos.x, pos.y, pos.type);
            this.powerUps.push(powerUp);
        });
    }

    private setupPhysics(): void {
        // Коллизии игрока
        this.physics.add.collider(this.player.sprite, this.platforms);
        
        // Коллизии врагов
        this.enemies.forEach(enemy => {
            this.physics.add.collider(enemy.sprite, this.platforms);
            
            // Столкновения с игроком
            this.physics.add.overlap(
                this.player.sprite,
                enemy.sprite,
                () => this.handleEnemyCollision(enemy),
                undefined,
                this
            );
        });
        
        // Коллизии с опасностями
        this.physics.add.overlap(
            this.player.sprite,
            this.hazards,
            (player, hazard) => this.handleHazardCollision(hazard as Phaser.Physics.Arcade.Sprite),
            () => true, // Проверяем каждый кадр
            this
        );
        
        // Сбор монет
        this.physics.add.overlap(
            this.player.sprite,
            this.collectibles,
            (player, coin) => this.collectCoin(coin as Phaser.Physics.Arcade.Sprite),
            undefined,
            this
        );
        
        // Сбор power-ups
        this.powerUps.forEach(powerUp => {
            this.physics.add.overlap(
                this.player.sprite,
                powerUp.sprite,
                () => this.collectPowerUp(powerUp),
                undefined,
                this
            );
        });
    }

    private setupCamera(): void {
        this.cameras.main.setBounds(0, 0, 5000, 720);
        this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
        this.cameras.main.setZoom(1);
    }

    private setupKeyboardControls(): void {
        if (!this.checkMobile()) {
            // Уже настроено в Player
        }
    }

    private checkMobile(): boolean {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    private handleEnemyCollision(enemy: Enemy): void {
        if (this.player.isInvincible) {
            enemy.destroy();
            this.score += 50;
            this.updateScore();
        } else if (this.player.sprite.body?.velocity.y! > 0 && 
                   this.player.sprite.y < enemy.sprite.y) {
            // Прыгаем на врага
            enemy.destroy();
            this.player.bounce();
            this.score += 100;
            this.updateScore();
        } else {
            // Получаем частичный урон как от шипов
            if (!this.player.sprite.getData('enemyHitCooldown')) {
                this.player.takeEnemyDamage();
                // Короткий кулдаун между уроном от врагов
                this.player.sprite.setData('enemyHitCooldown', true);
                this.time.delayedCall(1000, () => {
                    this.player.sprite.setData('enemyHitCooldown', false);
                });
            }
        }
    }

    private handleHazardCollision(hazard: Phaser.Physics.Arcade.Sprite): void {
        // Проверяем тип опасности по текстуре
        const hazardTexture = hazard.texture.key;
        
        if (hazardTexture === 'spikes') {
            // Шипы - частичный урон с отбросом
            if (!this.player.isInvincible && !this.player.sprite.getData('spikeHitCooldown')) {
                this.player.takeSpikesDamage();
                // Короткий кулдаун между уроном от шипов
                this.player.sprite.setData('spikeHitCooldown', true);
                this.time.delayedCall(1000, () => {
                    this.player.sprite.setData('spikeHitCooldown', false);
                });
            }
        } else if (hazardTexture === 'lava') {
            // Лава - постепенный урон
            this.player.startHazardDamage();
        }
    }

    private playerHit(): void {
        if (this.player.isInvincible) return;
        
        this.lives--;
        this.updateLives();
        
        if (this.lives <= 0) {
            // Анимация смерти и game over
            this.player.playDeathAnimation(() => {
                this.gameOver();
            });
        } else {
            // Анимация смерти
            this.player.playDeathAnimation(() => {
                // Временно отключаем слежение камеры за игроком
                this.cameras.main.stopFollow();
                
                // Плавное перемещение камеры к точке респавна
                this.cameras.main.pan(this.checkpointX, this.checkpointY, 1000, 'Power2');
                
                // Задержка после перемещения камеры перед появлением портала
                this.time.delayedCall(1200, () => {
                    // Создаём портал респавна немного выше персонажа
                    const respawnPortal = this.portalSystem.createPortal(
                        this.checkpointX, 
                        this.checkpointY - 20, // Немного выше персонажа
                        'spawn'
                    );
                    respawnPortal.setScale(0);
                    respawnPortal.setDepth(100); // Портал ПЕРЕД персонажем вначале
                    
                    // Яркая вспышка
                    const flash = this.add.graphics();
                    flash.fillStyle(0x00ff00, 1);
                    flash.fillCircle(this.checkpointX, this.checkpointY - 20, 10);
                    flash.setDepth(200);
                    
                    this.tweens.add({
                        targets: flash,
                        scaleX: 15,
                        scaleY: 15,
                        alpha: 0,
                        duration: 1000,
                        ease: 'Power2.out',
                        onComplete: () => flash.destroy()
                    });
                    
                    // Медленное открытие портала - как разрыв пространства
                    this.tweens.add({
                        targets: respawnPortal,
                        scaleX: 1.3,
                        scaleY: 0.02,
                        alpha: 1,
                        duration: 800,
                        ease: 'Power2.out',
                        onComplete: () => {
                            // Портал расширяется вертикально
                            this.tweens.add({
                                targets: respawnPortal,
                                scaleX: 1,
                                scaleY: 1,
                                duration: 1200,
                                ease: 'Back.out',
                                onComplete: () => {
                                    // Появляется игрок
                                    this.player.respawn(this.checkpointX, this.checkpointY);
                                    
                                    // Восстанавливаем слежение камеры за игроком
                                    this.cameras.main.startFollow(this.player.sprite);
                                    
                                    // Устанавливаем правильную глубину для портала за персонажем
                                    respawnPortal.setDepth(1); // Видимый, но за персонажем
                                    this.player.sprite.setDepth(10); // Персонаж впереди портала
                                    
                                    // Портал быстро закрывается через 0.5 секунды
                                    this.time.delayedCall(500, () => {
                                        this.portalSystem.closePortal(respawnPortal);
                                    });
                                }
                            });
                        }
                    });
                });
            });
        }
    }

    private collectCoin(coin: Phaser.Physics.Arcade.Sprite): void {
        coin.destroy();
        this.score += GameConfig.COIN_VALUE;
        this.updateScore();
        
        // Эффект сбора
        this.tweens.add({
            targets: coin,
            y: coin.y - 50,
            alpha: 0,
            duration: 300,
            onComplete: () => coin.destroy()
        });
    }

    private collectPowerUp(powerUp: PowerUp): void {
        powerUp.collect();
        this.player.applyPowerUp(powerUp.type);
        
        // Обновляем UI
        this.events.emit('powerup-collected', powerUp.type);
    }

    private updateScore(): void {
        this.events.emit('score-updated', this.score);
    }

    private updateLives(): void {
        this.events.emit('lives-updated', this.lives);
    }

    private togglePause(): void {
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            this.physics.pause();
            this.events.emit('game-paused');
        } else {
            this.physics.resume();
            this.events.emit('game-resumed');
        }
    }

    private autoSave(): void {
        const saveData = {
            level: this.currentLevel,
            score: this.score,
            lives: this.lives,
            checkpointX: this.player.sprite.x,
            checkpointY: this.player.sprite.y,
            timestamp: Date.now()
        };
        
        SaveSystem.save(saveData);
    }

    private gameOver(): void {
        this.scene.pause();
        this.events.emit('game-over', this.score);
        
        this.time.delayedCall(3000, () => {
            this.scene.stop('UIScene');
            this.scene.start('MenuScene');
        });
    }

    private createFinish(): void {
        // Флаг на финише
        const flagPole = this.add.rectangle(4800, 600, 10, 200, 0x8b4513);
        const flag = this.add.graphics();
        flag.fillStyle(0xff0000, 1);
        flag.fillTriangle(4810, 420, 4810, 470, 4870, 445);
        
        // Замок в конце уровня
        const castle = this.add.graphics();
        castle.fillStyle(0x666666, 1);
        castle.fillRect(4900, 550, 150, 150);
        castle.fillStyle(0x888888, 1);
        castle.fillRect(4920, 500, 30, 50);
        castle.fillRect(4950, 500, 30, 50);
        castle.fillRect(4980, 500, 30, 50);
        castle.fillRect(5010, 500, 30, 50);
        
        // Текст финиша
        const finishText = this.add.text(4800, 380, 'ФИНИШ!', {
            fontSize: '48px',
            fontFamily: 'Arial Black',
            color: '#ffff00',
            stroke: '#ff0000',
            strokeThickness: 6
        });
        finishText.setOrigin(0.5);
        
        // Анимация флага
        this.tweens.add({
            targets: flag,
            x: 5,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut'
        });
        
        // Коллизия с финишем
        const finishZone = this.physics.add.staticGroup();
        const finishTrigger = finishZone.create(4850, 600, undefined);
        finishTrigger.setSize(100, 200);
        finishTrigger.setVisible(false);
        
        this.physics.add.overlap(
            this.player.sprite,
            finishTrigger,
            () => this.victory(),
            undefined,
            this
        );
    }
    
    private victory(): void {
        this.scene.pause();
        
        // Красивый экран победы
        const victoryBg = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.8);
        victoryBg.setScrollFactor(0);
        
        // Звёзды
        for (let i = 0; i < 50; i++) {
            const star = this.add.circle(
                Math.random() * 1280,
                Math.random() * 720,
                Math.random() * 3,
                0xffff00,
                Math.random()
            );
            star.setScrollFactor(0);
            
            this.tweens.add({
                targets: star,
                alpha: 0,
                duration: 1000 + Math.random() * 2000,
                yoyo: true,
                repeat: -1
            });
        }
        
        // Заголовок победы
        const victoryText = this.add.text(640, 200, 'ПОБЕДА!', {
            fontSize: '96px',
            fontFamily: 'Arial Black',
            color: '#ffd700',
            stroke: '#ff6600',
            strokeThickness: 8,
            shadow: {
                offsetX: 5,
                offsetY: 5,
                color: '#000000',
                blur: 10,
                fill: true
            }
        });
        victoryText.setOrigin(0.5);
        victoryText.setScrollFactor(0);
        
        // Очки
        const scoreText = this.add.text(640, 320, `Очки: ${this.score}`, {
            fontSize: '48px',
            fontFamily: 'Arial',
            color: '#ffffff'
        });
        scoreText.setOrigin(0.5);
        scoreText.setScrollFactor(0);
        
        // Кнопка продолжения
        const continueBtn = this.add.graphics();
        continueBtn.fillStyle(0x27ae60, 1);
        continueBtn.fillRoundedRect(520, 400, 240, 60, 20);
        continueBtn.setScrollFactor(0);
        
        const continueText = this.add.text(640, 430, 'Продолжить', {
            fontSize: '32px',
            fontFamily: 'Arial Black',
            color: '#ffffff'
        });
        continueText.setOrigin(0.5);
        continueText.setScrollFactor(0);
        
        // Анимация появления
        this.tweens.add({
            targets: [victoryText, scoreText],
            scale: { from: 0, to: 1 },
            duration: 1000,
            ease: 'Bounce.out'
        });
        
        this.events.emit('victory', this.score);
        
        this.time.delayedCall(5000, () => {
            this.scene.stop('UIScene');
            this.scene.start('MenuScene');
        });
    }

    update(time: number, delta: number): void {
        if (!this.isPaused) {
            // Обновляем игрока
            this.player.update(delta);
            
            // Проверяем, не вышел ли игрок из опасной зоны
            const playerBounds = this.player.sprite.getBounds();
            let inHazard = false;
            this.hazards.children.entries.forEach((hazard: any) => {
                const hazardBounds = hazard.getBounds();
                if (Phaser.Geom.Rectangle.Overlaps(playerBounds, hazardBounds)) {
                    inHazard = true;
                }
            });
            
            if (!inHazard) {
                this.player.stopHazardDamage();
            }
            
            // Обновляем врагов
            this.enemies.forEach(enemy => enemy.update(delta));
            
            // Обновляем системы
            this.vineSystem.update(delta);
            
            // Обновляем мобильное управление
            if (this.touchControls) {
                this.touchControls.update();
            }
            
            // Проверяем падение (только после 3 секунд игры)
            if (this.player.sprite.y > 900 && this.time.now > 3000) {
                this.playerHit();
            }
            
            // Проверяем победу - теперь через коллизию с финишем
        }
    }
}