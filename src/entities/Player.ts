import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';

export class Player {
    public sprite: Phaser.Physics.Arcade.Sprite;
    private scene: Phaser.Scene;
    private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
    private spaceKey?: Phaser.Input.Keyboard.Key;
    private shiftKey?: Phaser.Input.Keyboard.Key;
    private grabKey?: Phaser.Input.Keyboard.Key;
    private jumpCount: number = 0;
    private maxJumps: number = 2;
    private speed: number = GameConfig.PLAYER_SPEED;
    private jumpVelocity: number = GameConfig.PLAYER_JUMP_VELOCITY;
    public isInvincible: boolean = false;
    private invincibilityTimer?: Phaser.Time.TimerEvent;
    private speedBoostTimer?: Phaser.Time.TimerEvent;
    private isOnVine: boolean = false;
    private currentVine?: any;
    private isDead: boolean = false;
    private idleTimer: number = 0;
    private isIdleAnimation: boolean = false;
    private hazardDamageTimer: number = 0;
    private hazardDamageTicks: number = 0;
    private isInHazard: boolean = false;
    private partialHealth: number = 3; // Каждое сердце = 3 части
    private healthRegenTimer: number = 0;
    private lastDamageTime: number = 0;
    private isKnockback: boolean = false; // Флаг для отключения управления при отбросе

    constructor(scene: Phaser.Scene, x: number, y: number) {
        this.scene = scene;
        
        // Создаём спрайт с красивой графикой
        this.sprite = scene.physics.add.sprite(x, y, scene.textures.exists('hero-sprite') ? 'hero-sprite' : 'player');
        this.sprite.setCollideWorldBounds(false);
        this.sprite.setBounce(0.1);
        this.sprite.setGravityY(0);
        this.sprite.setDragX(0); // Без сопротивления воздуха
        this.sprite.setMaxVelocity(400, 1000); // Очень быстрое падение
        this.sprite.setScale(1.0); // Нормальный размер для HD текстур
        
        // Настраиваем физику - хитбокс должен быть меньше спрайта для правильной коллизии
        const body = this.sprite.body as Phaser.Physics.Arcade.Body;
        body.setSize(30, 80);  // Компактный хитбокс для лучшей коллизии
        body.setOffset(25, 18); // Центрируем хитбокс (спрайт 80x100)
        
        // Добавляем свечение героя
        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0.95,
            duration: 1500,
            yoyo: true,
            repeat: -1
        });
        
        // Неуязвимость в начале игры на 0.5 секунды (очень коротко)
        this.isInvincible = true;
        this.sprite.setTint(0x00ff00); // Зелёный оттенок для неуязвимости
        // Мигание для индикации неуязвимости
        this.scene.tweens.add({
            targets: this.sprite,
            alpha: { from: 1, to: 0.6 },
            duration: 50,
            yoyo: true,
            repeat: 9, // Мигаем 0.5 секунды
            onComplete: () => {
                this.isInvincible = false;
                this.sprite.setAlpha(1);
                this.sprite.clearTint();
            }
        });
        
        // Сохраняем ссылку на этот экземпляр для VineSystem
        this.sprite.setData('playerInstance', this);
        
        // Настраиваем управление
        this.setupControls();
        
        // Создаём анимации
        this.createAnimations();
        
        // Запускаем анимацию по умолчанию
        this.sprite.play('idle');
    }

    private setupControls(): void {
        this.cursors = this.scene.input.keyboard?.createCursorKeys();
        this.spaceKey = this.scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.shiftKey = this.scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
        this.grabKey = this.scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        
        // WASD контроль - создаём как отдельные клавиши
        this.scene.input.keyboard?.addKey('A');
        this.scene.input.keyboard?.addKey('D');
        this.scene.input.keyboard?.addKey('W');
        this.scene.input.keyboard?.addKey('S');
    }

    private createAnimations(): void {
        // Проверяем существование анимаций
        if (!this.scene.anims.exists('idle')) {
            // Покой
            this.scene.anims.create({
                key: 'idle',
                frames: [{ key: 'player_idle', frame: 0 }],
                frameRate: 1,
                repeat: -1
            });
        }
        
        if (!this.scene.anims.exists('idle_animation')) {
            // Анимация бездействия (почёсывание, оглядывание)
            this.scene.anims.create({
                key: 'idle_animation',
                frames: [
                    { key: 'player_idle', frame: 0 },
                    { key: 'player_jump', frame: 0 },  // Поднимает руки
                    { key: 'player_idle', frame: 0 },
                    { key: 'player_run1', frame: 0 }   // Оглядывается
                ],
                frameRate: 2,
                repeat: 0
            });
        }
        
        if (!this.scene.anims.exists('run')) {
            // Бег с движением рук и ног
            this.scene.anims.create({
                key: 'run',
                frames: [
                    { key: 'player_run1', frame: 0 },
                    { key: 'player_run2', frame: 0 }
                ],
                frameRate: 10,
                repeat: -1
            });
        }
        
        if (!this.scene.anims.exists('jump')) {
            // Прыжок
            this.scene.anims.create({
                key: 'jump',
                frames: [{ key: 'player_jump', frame: 0 }],
                frameRate: 1
            });
        }
    }

    public update(delta: number): void {
        if (this.isDead) return;
        
        // Если в состоянии отброса - не даём управлять
        if (this.isKnockback) return;
        
        const body = this.sprite.body as Phaser.Physics.Arcade.Body;
        const onGround = body.blocked.down || body.touching.down;
        
        // Восстановление частичного здоровья
        if (this.partialHealth < 3 && Date.now() - this.lastDamageTime > 5000) {
            this.healthRegenTimer += delta;
            if (this.healthRegenTimer >= 2000) { // Каждые 2 секунды
                this.partialHealth = Math.min(3, this.partialHealth + 1);
                this.healthRegenTimer = 0;
                this.scene.events.emit('health-partial-update', this.partialHealth);
            }
        }
        
        // Обработка постепенного урона от опасностей
        if (this.isInHazard && !this.isInvincible) {
            this.hazardDamageTimer += delta;
            
            // Каждые 500мс - один тик урона
            if (this.hazardDamageTimer >= 500) {
                this.hazardDamageTimer = 0;
                this.hazardDamageTicks++;
                
                // Усиливаем красное свечение с каждым тиком
                const redIntensity = Math.min(0xff0000, 0x550000 * this.hazardDamageTicks);
                this.sprite.setTint(redIntensity);
                
                // Мигание при получении урона
                this.scene.tweens.add({
                    targets: this.sprite,
                    alpha: 0.3,
                    duration: 100,
                    yoyo: true,
                    onComplete: () => this.sprite.setAlpha(1)
                });
                
                // После 3 тиков - получаем урон
                if (this.hazardDamageTicks >= 3) {
                    this.scene.events.emit('player-damage-full');
                    this.resetHazardDamage();
                }
            }
        }
        
        // Обновляем счётчик прыжков
        if (onGround) {
            this.jumpCount = 0;
        }
        
        // Отслеживаем бездействие
        const keyboard = this.scene.input.keyboard;
        let isMoving = false;
        let hasInput = false;
        
        // Проверяем стрелки и WASD
        if (this.cursors?.left.isDown || keyboard?.addKey('A').isDown) {
            this.moveLeft();
            isMoving = true;
            hasInput = true;
            this.idleTimer = 0;
        } else if (this.cursors?.right.isDown || keyboard?.addKey('D').isDown) {
            this.moveRight();
            isMoving = true;
            hasInput = true;
            this.idleTimer = 0;
        } else {
            this.stopHorizontal();
        }
        
        // Прыжок или лазание по верёвке
        if (this.isOnVine) {
            // На верёвке - W/стрелка вверх для лазания
            if (this.cursors?.up.isDown || keyboard?.addKey('W').isDown) {
                this.climbUp();
                hasInput = true;
                this.idleTimer = 0;
            } else if (this.cursors?.down.isDown || keyboard?.addKey('S').isDown) {
                this.climbDown();
                hasInput = true;
                this.idleTimer = 0;
            }
            // Пробел для прыжка с верёвки
            if (this.spaceKey && Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
                this.jump();
                hasInput = true;
                this.idleTimer = 0;
            }
        } else {
            // Не на верёвке - только пробел для прыжка
            if (this.spaceKey && Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
                this.jump();
                hasInput = true;
                this.idleTimer = 0;
            }
        }
        
        // Приседание (только если не на верёвке)
        if (!this.isOnVine && (this.cursors?.down.isDown || keyboard?.addKey('S').isDown)) {
            this.crouch();
            hasInput = true;
            this.idleTimer = 0;
        } else if (onGround && !this.isOnVine) {
            this.standUp();
        }
        
        // Захват верёвки по нажатию E
        if (this.grabKey && Phaser.Input.Keyboard.JustDown(this.grabKey)) {
            // Если на верёвке - отпускаем
            if (this.isOnVine) {
                this.detachFromVine();
            } else {
                // Пытаемся схватить ближайшую верёвку
                const nearVine = this.sprite.getData('nearVine');
                const nearVineIndex = this.sprite.getData('nearVineIndex');
                if (nearVine && nearVineIndex !== null) {
                    // Вызываем grabVine через VineSystem
                    const vineSystem = (this.scene as any).vineSystem;
                    if (vineSystem) {
                        vineSystem.grabVine(nearVine, nearVineIndex);
                    }
                }
            }
            hasInput = true;
            this.idleTimer = 0;
        }
        
        // Обновляем счётчик бездействия
        if (!hasInput && onGround && Math.abs(body.velocity.x) < 10) {
            this.idleTimer += delta;
            
            // После 3 секунд бездействия - запускаем анимацию
            if (this.idleTimer > 3000 && !this.isIdleAnimation) {
                this.isIdleAnimation = true;
                this.sprite.play('idle_animation');
                
                // После анимации сбрасываем таймер
                this.sprite.on('animationcomplete', () => {
                    if (this.sprite.anims.currentAnim?.key === 'idle_animation') {
                        this.isIdleAnimation = false;
                        this.idleTimer = 0;
                    }
                });
            }
        } else {
            this.isIdleAnimation = false;
        }
        
        // Обновляем анимацию
        if (!this.isIdleAnimation) {
            this.updateAnimation();
        }
    }

    private updateAnimation(): void {
        const body = this.sprite.body as Phaser.Physics.Arcade.Body;
        const onGround = body.blocked.down || body.touching.down;
        
        // Специальная анимация для верёвки
        if (this.isOnVine) {
            // Используем анимацию прыжка с поднятыми руками для висения
            this.sprite.play('jump', true);
            // Добавляем небольшой наклон при качании
            if (Math.abs(body.velocity.x) > 50) {
                this.sprite.setRotation(body.velocity.x * 0.0005);
            }
            return;
        }
        
        // Обычные анимации
        this.sprite.setRotation(0); // Сбрасываем поворот
        if (!onGround) {
            this.sprite.play('jump', true);
        } else if (Math.abs(body.velocity.x) > 10) {
            this.sprite.play('run', true);
        } else {
            this.sprite.play('idle', true);
        }
    }

    public moveLeft(): void {
        const body = this.sprite.body as Phaser.Physics.Arcade.Body;
        const speed = this.shiftKey?.isDown ? this.speed * 1.5 : this.speed;
        
        if (this.isOnVine) {
            // На верёвке - умеренное раскачивание
            body.setVelocityX(-speed * 0.65);  // Умеренная сила раскачки
            // Добавляем небольшое вращение для эффекта качания
            this.sprite.setRotation(-0.1);
        } else {
            body.setVelocityX(-speed);
            this.sprite.setRotation(0);
        }
        this.sprite.setFlipX(true);
    }

    public moveRight(): void {
        const body = this.sprite.body as Phaser.Physics.Arcade.Body;
        const speed = this.shiftKey?.isDown ? this.speed * 1.5 : this.speed;
        
        if (this.isOnVine) {
            // На верёвке - умеренное раскачивание
            body.setVelocityX(speed * 0.65);  // Умеренная сила раскачки
            // Добавляем небольшое вращение для эффекта качания
            this.sprite.setRotation(0.1);
        } else {
            body.setVelocityX(speed);
            this.sprite.setRotation(0);
        }
        this.sprite.setFlipX(false);
    }

    public stopHorizontal(): void {
        if (this.isOnVine) {
            // На верёвке - плавно замедляемся, но не останавливаемся сразу
            const body = this.sprite.body as Phaser.Physics.Arcade.Body;
            body.setVelocityX(body.velocity.x * 0.95);
            // Возвращаем вращение к нулю
            this.sprite.setRotation(this.sprite.rotation * 0.9);
            return;
        }
        
        const body = this.sprite.body as Phaser.Physics.Arcade.Body;
        body.setVelocityX(0);
        this.sprite.setRotation(0);
    }

    public jump(): void {
        // Если на верёвке - отпускаем с прыжком
        if (this.isOnVine) {
            this.detachFromVine();
            const body = this.sprite.body as Phaser.Physics.Arcade.Body;
            body.setVelocityY(this.jumpVelocity);
            this.jumpCount = 1; // Считаем как первый прыжок
            this.createJumpEffect();
            return;
        }
        
        if (this.jumpCount < this.maxJumps) {
            const body = this.sprite.body as Phaser.Physics.Arcade.Body;
            
            // Разная сила для разных прыжков
            let velocity = this.jumpVelocity;
            if (this.jumpCount === 1) {
                velocity = GameConfig.PLAYER_DOUBLE_JUMP_VELOCITY;
            } else if (this.jumpCount === 2) {
                velocity = GameConfig.PLAYER_TRIPLE_JUMP_VELOCITY;
            }
            
            body.setVelocityY(velocity);
            this.jumpCount++;
            
            // Эффект прыжка
            this.createJumpEffect();
        }
    }

    private createJumpEffect(): void {
        // Лёгкий туманный эффект отталкивания от земли
        // Используем туманные частицы для эффекта
        const jumpCloud = this.scene.add.particles(this.sprite.x, this.sprite.y + 45, 'fog_particle', {
            scale: { start: 0.05, end: 0.3 },
            alpha: { start: 0.2, end: 0 },
            speed: { min: 20, max: 50 },
            lifespan: 400,
            quantity: 2,
            angle: { min: 160, max: 20 },  // Расходящиеся в стороны
            tint: [0xffffff, 0xdddddd],
            blendMode: Phaser.BlendModes.NORMAL
        });
        
        // Удаляем частицы после эффекта
        this.scene.time.delayedCall(400, () => jumpCloud.destroy());
        
        // Небольшое искажение воздуха (как в фильмах)
        const distortion = this.scene.add.ellipse(
            this.sprite.x,
            this.sprite.y + 45,
            30, 10,
            0xffffff,
            0.05
        );
        
        this.scene.tweens.add({
            targets: distortion,
            scaleX: 2,
            scaleY: 0.3,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => distortion.destroy()
        });
    }

    public crouch(): void {
        const body = this.sprite.body as Phaser.Physics.Arcade.Body;
        const onGround = body.blocked.down || body.touching.down;
        
        if (onGround) {
            // Приседание - уменьшаем hitbox
            body.setSize(30, 45);
            body.setOffset(25, 53);  // Смещаем вниз при приседании
        }
    }
    
    public standUp(): void {
        const body = this.sprite.body as Phaser.Physics.Arcade.Body;
        // Возвращаем обычный размер
        body.setSize(30, 80);
        body.setOffset(25, 18);
    }

    public bounce(): void {
        const body = this.sprite.body as Phaser.Physics.Arcade.Body;
        body.setVelocityY(-400);
        this.jumpCount = 0;
    }

    public climbUp(): void {
        if (!this.isOnVine || !this.currentVine) return;
        const body = this.sprite.body as Phaser.Physics.Arcade.Body;
        body.setVelocityY(-150); // Лазаем вверх
    }

    public climbDown(): void {
        if (!this.isOnVine || !this.currentVine) return;
        const body = this.sprite.body as Phaser.Physics.Arcade.Body;
        body.setVelocityY(150); // Лазаем вниз
    }

    public attachToVine(vine: any): void {
        // Не прицепляемся если уже на лиане
        if (this.isOnVine) return;
        
        const body = this.sprite.body as Phaser.Physics.Arcade.Body;
        this.isOnVine = true;
        this.currentVine = vine;
        this.jumpCount = 0; // Сбрасываем счётчик прыжков
        
        // Останавливаем падение но сохраняем горизонтальное движение для качания
        body.setVelocityY(0);
        body.setAllowGravity(false);
        
        // НЕ отключаем физику полностью - это вызывает проблемы
        // Просто отключаем коллизии с платформами временно
        body.checkCollision.down = false;
        body.checkCollision.up = false;
        body.checkCollision.left = false;
        body.checkCollision.right = false;
    }

    public detachFromVine(): void {
        if (!this.isOnVine) return;
        
        this.isOnVine = false;
        
        // Сохраняем время отпускания для предотвращения повторного захвата
        this.sprite.setData('lastVineRelease', Date.now());
        
        // Отпускаем верёвку в VineSystem
        if (this.currentVine) {
            const vineSystem = (this.scene as any).vineSystem;
            if (vineSystem) {
                vineSystem.releaseVine(this.currentVine);
            }
        }
        
        this.currentVine = null;
        const body = this.sprite.body as Phaser.Physics.Arcade.Body;
        
        // Восстанавливаем физику и коллизии
        body.setAllowGravity(true);
        body.checkCollision.down = true;
        body.checkCollision.up = true;
        body.checkCollision.left = true;
        body.checkCollision.right = true;
        
        // Сбрасываем счётчик прыжков
        this.jumpCount = 0;
    }

    public applyPowerUp(type: string): void {
        switch (type) {
            case 'jump':
                this.maxJumps = 3;
                this.scene.time.delayedCall(GameConfig.POWERUP_DURATION, () => {
                    this.maxJumps = 2;
                });
                break;
                
            case 'speed':
                if (this.speedBoostTimer) {
                    this.speedBoostTimer.destroy();
                }
                this.speed = GameConfig.PLAYER_SPEED * GameConfig.POWERUP_SPEED_MULTIPLIER;
                this.speedBoostTimer = this.scene.time.delayedCall(GameConfig.POWERUP_DURATION, () => {
                    this.speed = GameConfig.PLAYER_SPEED;
                });
                break;
                
            case 'invincible':
                if (this.invincibilityTimer) {
                    this.invincibilityTimer.destroy();
                }
                this.isInvincible = true;
                this.sprite.setTint(0xffff00);
                
                // Мигание
                this.scene.tweens.add({
                    targets: this.sprite,
                    alpha: 0.5,
                    duration: 200,
                    yoyo: true,
                    repeat: GameConfig.POWERUP_INVINCIBILITY_DURATION / 400
                });
                
                this.invincibilityTimer = this.scene.time.delayedCall(
                    GameConfig.POWERUP_INVINCIBILITY_DURATION,
                    () => {
                        this.isInvincible = false;
                        this.sprite.clearTint();
                        this.sprite.setAlpha(1);
                    }
                );
                break;
        }
    }

    public playDeathAnimation(callback?: () => void): void {
        this.isDead = true;
        const body = this.sprite.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(0, 0);
        body.setAllowGravity(false);
        
        // Отключаем управление
        this.isKnockback = true;
        
        // Анимация смерти - распад на частицы
        this.sprite.setTint(0xff0000);
        
        // Создаём эффект распада
        const deathParticles = this.scene.add.particles(this.sprite.x, this.sprite.y, 'fog_particle', {
            scale: { start: 0.3, end: 0 },
            alpha: { start: 1, end: 0 },
            speed: { min: 50, max: 150 },
            lifespan: 1000,
            quantity: 20,
            tint: [0xff0000, 0xff6600, 0xffaa00],
            blendMode: Phaser.BlendModes.ADD,
            emitZone: {
                type: 'random',
                source: new Phaser.Geom.Rectangle(-20, -40, 40, 80)
            }
        });
        
        // Анимация исчезновения персонажа
        this.scene.tweens.add({
            targets: this.sprite,
            scaleX: 0,
            scaleY: 0,
            rotation: Math.PI * 4,
            alpha: 0,
            duration: 800,
            ease: 'Power2.in',
            onComplete: () => {
                this.sprite.setVisible(false);
                deathParticles.destroy();
                if (callback) callback();
            }
        });
    }
    
    public respawn(x: number, y: number): void {
        this.isDead = false;
        this.sprite.setPosition(x, y);
        this.sprite.setScale(0, 0);
        this.sprite.setAlpha(1);
        this.sprite.clearTint();
        this.sprite.setVisible(true);
        this.sprite.setRotation(0);
        
        const body = this.sprite.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(0);
        body.setAllowGravity(true);
        this.jumpCount = 0;
        this.isKnockback = false;
        
        // Анимация появления из портала
        this.scene.tweens.add({
            targets: this.sprite,
            scaleX: 1,
            scaleY: 1,
            duration: 500,
            ease: 'Back.out',
            onComplete: () => {
                // Краткая неуязвимость после респавна
                this.isInvincible = true;
                this.sprite.setTint(0xffffff);
                
                this.scene.tweens.add({
                    targets: this.sprite,
                    alpha: 0.5,
                    duration: 100,
                    yoyo: true,
                    repeat: 10,
                    onComplete: () => {
                        this.isInvincible = false;
                        this.sprite.clearTint();
                        this.sprite.setAlpha(1);
                    }
                });
            }
        });
    }

    public startHazardDamage(): void {
        if (this.isInvincible || this.isInHazard) return;
        this.isInHazard = true;
        this.hazardDamageTimer = 0;
        this.hazardDamageTicks = 0;
    }
    
    public takeEnemyDamage(): void {
        if (this.isInvincible) return;
        
        // Отнимаем 1/3 здоровья
        this.partialHealth--;
        this.lastDamageTime = Date.now();
        this.healthRegenTimer = 0;
        
        // Красная вспышка
        this.sprite.setTint(0xff0000);
        this.scene.time.delayedCall(200, () => {
            if (!this.isInvincible) this.sprite.clearTint();
        });
        
        // ОТКЛЮЧАЕМ УПРАВЛЕНИЕ НА ВРЕМЯ ОТБРОСА
        this.isKnockback = true;
        
        // Отброс НАЗАД от направления движения (как от шипов)
        const body = this.sprite.body as Phaser.Physics.Arcade.Body;
        
        // Определяем направление отброса - ПРОТИВОПОЛОЖНО движению
        let knockbackX = 0;
        
        // Проверяем текущую скорость движения или направление взгляда
        if (Math.abs(body.velocity.x) > 10) {
            // Отбрасываем в ПРОТИВОПОЛОЖНУЮ сторону от движения
            knockbackX = -body.velocity.x * 1.5;
            // Минимальный отброс 250
            if (Math.abs(knockbackX) < 250) {
                knockbackX = Math.sign(knockbackX) * 250;
            }
        } else {
            // Стояли на месте - отброс от направления взгляда
            // flipX = true когда смотрим влево, false когда вправо
            knockbackX = this.sprite.flipX ? 250 : -250;
        }
        
        // Применяем умеренный отброс
        body.setVelocity(knockbackX, -150);
        
        // Через 300мс возвращаем управление
        this.scene.time.delayedCall(300, () => {
            this.isKnockback = false;
        });
        
        // Проверяем, потеряли ли полное сердце
        if (this.partialHealth <= 0) {
            this.partialHealth = 3; // Сбрасываем счётчик
            this.scene.events.emit('player-damage-full'); // Полная потеря жизни
        } else {
            this.scene.events.emit('health-partial-update', this.partialHealth);
        }
        
        // Краткая неуязвимость
        this.isInvincible = true;
        this.scene.time.delayedCall(500, () => {
            this.isInvincible = false;
            this.sprite.clearTint();
        });
    }
    
    public takeSpikesDamage(): void {
        if (this.isInvincible) return;
        
        // Отнимаем 1/3 здоровья
        this.partialHealth--;
        this.lastDamageTime = Date.now();
        this.healthRegenTimer = 0;
        
        // Красная вспышка
        this.sprite.setTint(0xff0000);
        this.scene.time.delayedCall(200, () => {
            if (!this.isInvincible) this.sprite.clearTint();
        });
        
        // ОТКЛЮЧАЕМ УПРАВЛЕНИЕ НА ВРЕМЯ ОТБРОСА
        this.isKnockback = true;
        
        // Сильный отброс НАЗАД от направления движения
        const body = this.sprite.body as Phaser.Physics.Arcade.Body;
        
        // Определяем направление отброса - ПРОТИВОПОЛОЖНО движению
        let knockbackX = 0;
        
        // Проверяем текущую скорость движения или направление взгляда
        if (Math.abs(body.velocity.x) > 10) {
            // Отбрасываем в ПРОТИВОПОЛОЖНУЮ сторону от движения
            knockbackX = -body.velocity.x * 1.5;
            // Минимальный отброс 250
            if (Math.abs(knockbackX) < 250) {
                knockbackX = Math.sign(knockbackX) * 250;
            }
        } else {
            // Стояли на месте - отброс от направления взгляда
            // flipX = true когда смотрим влево, false когда вправо
            knockbackX = this.sprite.flipX ? 250 : -250;
        }
        
        // Применяем умеренный отброс
        body.setVelocity(knockbackX, -150);
        
        // Через 300мс возвращаем управление
        this.scene.time.delayedCall(300, () => {
            this.isKnockback = false;
        });
        
        // Проверяем, потеряли ли полное сердце
        if (this.partialHealth <= 0) {
            this.partialHealth = 3; // Сбрасываем счётчик
            this.scene.events.emit('player-damage-full'); // Полная потеря жизни
        } else {
            this.scene.events.emit('health-partial-update', this.partialHealth);
        }
        
        // Краткая неуязвимость
        this.isInvincible = true;
        this.scene.time.delayedCall(500, () => {
            this.isInvincible = false;
            this.sprite.clearTint();
        });
    }
    
    public stopHazardDamage(): void {
        this.resetHazardDamage();
    }
    
    private resetHazardDamage(): void {
        this.isInHazard = false;
        this.hazardDamageTimer = 0;
        this.hazardDamageTicks = 0;
        if (!this.isInvincible) {
            this.sprite.clearTint();
        }
    }
    
    public destroy(): void {
        if (this.invincibilityTimer) {
            this.invincibilityTimer.destroy();
        }
        if (this.speedBoostTimer) {
            this.speedBoostTimer.destroy();
        }
        this.sprite.destroy();
    }
}