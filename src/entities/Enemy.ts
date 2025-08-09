import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';

export class Enemy {
    public sprite: Phaser.Physics.Arcade.Sprite;
    private scene: Phaser.Scene;
    private type: string;
    private speed: number = GameConfig.ENEMY_SPEED;
    private direction: number = 1;
    private player?: Phaser.Physics.Arcade.Sprite;
    private patrolDistance: number = 200;
    private startX: number;
    private isAlive: boolean = true;
    public isEnemy: boolean = true; // Флаг для идентификации врага
    
    // AI состояния
    private aiState: 'patrol' | 'chase' | 'attack' | 'return' = 'patrol';
    private lastPlayerSeen: number = 0;
    private memoryDuration: number = 2000; // Помнит игрока 2 секунды
    private attackCooldown: number = 0;
    private stuckCounter: number = 0;
    private lastX: number = 0;

    constructor(scene: Phaser.Scene, x: number, y: number, type: string) {
        this.scene = scene;
        this.type = type;
        this.startX = x;
        
        // Создаём спрайт с AI-графикой
        const textureKey = scene.textures.exists('enemy-sprite') ? 'enemy-sprite' : type;
        this.sprite = scene.physics.add.sprite(x, y, textureKey);
        this.sprite.setCollideWorldBounds(false); // Враги могут двигаться по всему уровню
        this.sprite.setBounce(0.1);
        this.sprite.setGravityY(0); // Убеждаемся что гравитация включена по умолчанию
        
        // Масштабируем врагов для нормальной видимости
        if (textureKey === 'enemy-sprite') {
            this.sprite.setScale(1.5);
            this.sprite.setTint(0xff6666 + Math.random() * 0x0099ff); // Разные цвета врагов
        } else {
            // Для обычных текстур тоже увеличиваем
            this.sprite.setScale(1.8);
        }
        
        // Плавное покачивание
        this.scene.tweens.add({
            targets: this.sprite,
            scaleY: this.sprite.scaleY * 1.1,
            duration: 1000 + Math.random() * 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut'
        });
        
        // Настраиваем размер в зависимости от типа
        this.setupPhysics();
        
        // Создаём анимации
        this.createAnimations();
        
        // Начинаем патрулирование
        this.startPatrol();
        
        // Помечаем спрайт как врага для исключения из коллизий с опасностями
        this.sprite.setData('isEnemy', true);
    }

    private setupPhysics(): void {
        const body = this.sprite.body as Phaser.Physics.Arcade.Body;
        
        switch (this.type) {
            case 'enemy1':
                body.setSize(30, 30);
                this.speed = GameConfig.ENEMY_SPEED;
                this.patrolDistance = 100; // Меньше для enemy1
                break;
            case 'enemy2':
                body.setSize(35, 35);
                this.speed = GameConfig.ENEMY_SPEED * 0.8;
                this.patrolDistance = 120; // Меньше для enemy2
                break;
            case 'enemy3':
                body.setSize(32, 35);
                this.speed = GameConfig.ENEMY_SPEED * 1.2;
                this.patrolDistance = 140; // Меньше для enemy3
                break;
        }
        
        body.setOffset(2, 2);
    }

    private createAnimations(): void {
        // Проверяем, существует ли уже анимация
        if (!this.scene.anims.exists(`${this.type}_walk`)) {
            // Патруль
            this.scene.anims.create({
                key: `${this.type}_walk`,
                frames: [{ key: this.type, frame: 0 }],
                frameRate: 8,
                repeat: -1
            });
        }
        
        if (!this.scene.anims.exists(`${this.type}_attack`)) {
            // Атака
            this.scene.anims.create({
                key: `${this.type}_attack`,
                frames: [{ key: this.type, frame: 0 }],
                frameRate: 10,
                repeat: 0
            });
        }
    }

    private startPatrol(): void {
        this.sprite.play(`${this.type}_walk`);
        const body = this.sprite.body as Phaser.Physics.Arcade.Body;
        body.setVelocityX(this.speed * this.direction);
    }

    public update(delta: number): void {
        if (!this.isAlive) return;
        
        const body = this.sprite.body as Phaser.Physics.Arcade.Body;
        if (!body) return; // Защита от отсутствующего body
        
        // Проверяем различные условия
        this.checkEdge();
        
        // Обнаружение игрока (это также управляет патрулированием)
        if (this.player) {
            this.detectPlayer();
        }
        
        // Поворот спрайта
        this.sprite.setFlipX(this.direction < 0);
    }

    private checkEdge(): void {
        const body = this.sprite.body as Phaser.Physics.Arcade.Body;
        
        // Проверка застревания - ВРЕМЕННО ОТКЛЮЧАЕМ для отладки
        // if (Math.abs(this.sprite.x - this.lastX) < 0.5) {
        //     this.stuckCounter++;
        //     if (this.stuckCounter > 30) {
        //         this.changeDirection();
        //         this.stuckCounter = 0;
        //     }
        // } else {
        //     this.stuckCounter = 0;
        // }
        this.lastX = this.sprite.x;
        
        // Проверка границ УРОВНЯ (не экрана)
        if (this.sprite.x < 50 || this.sprite.x > 4950) {
            this.changeDirection();
            return;
        }
        
        // Убрали проверку body.blocked - враги проходят сквозь препятствия
        
        // В режиме патруля - проверяем расстояние от стартовой позиции
        if (this.aiState === 'patrol' && Math.abs(this.sprite.x - this.startX) > this.patrolDistance) {
            this.aiState = 'return';
        }
        
        // В режиме возврата - возвращаемся к стартовой позиции
        if (this.aiState === 'return' && Math.abs(this.sprite.x - this.startX) < 50) {
            this.aiState = 'patrol';
        }
    }

    private changeDirection(): void {
        this.direction *= -1;
        const body = this.sprite.body as Phaser.Physics.Arcade.Body;
        body.setVelocityX(this.speed * this.direction);
    }

    private detectPlayer(): void {
        if (!this.player) return;
        
        const distance = Phaser.Math.Distance.Between(
            this.sprite.x,
            this.sprite.y,
            this.player.x,
            this.player.y
        );
        
        const canSeePlayer = distance < GameConfig.ENEMY_DETECTION_RANGE;
        const directionToPlayer = this.player.x > this.sprite.x ? 1 : -1;
        const body = this.sprite.body as Phaser.Physics.Arcade.Body;
        
        // Обновляем память о игроке
        if (canSeePlayer) {
            this.lastPlayerSeen = Date.now();
        }
        
        const remembersPlayer = (Date.now() - this.lastPlayerSeen) < this.memoryDuration;
        
        // Состояние AI
        if (distance < 50 && this.attackCooldown <= 0) {
            // Атака
            this.aiState = 'attack';
            this.sprite.play(`${this.type}_attack`, true);
            this.attackCooldown = 1000;
            body.setVelocityX(0); // Останавливаемся для атаки
            
        } else if (canSeePlayer || remembersPlayer) {
            // Преследование
            this.aiState = 'chase';
            this.direction = directionToPlayer;
            
            // Разная скорость преследования для разных типов
            let chaseSpeed = this.speed * 1.5;
            if (this.type === 'enemy3') chaseSpeed = this.speed * 2; // enemy3 быстрее
            if (this.type === 'enemy2') chaseSpeed = this.speed * 1.3; // enemy2 медленнее
            
            body.setVelocityX(chaseSpeed * this.direction);
            
            // Умные прыжки для enemy3
            if (this.type === 'enemy3') {
                const heightDiff = this.player.y - this.sprite.y;
                if (body.blocked.down && heightDiff < -30) {
                    // Прыгаем если игрок выше
                    body.setVelocityY(GameConfig.ENEMY_JUMP_VELOCITY);
                } else if (distance < 150 && Math.random() < 0.02) {
                    // Случайные тактические прыжки в бою
                    if (body.blocked.down) {
                        body.setVelocityY(GameConfig.ENEMY_JUMP_VELOCITY * 0.8);
                    }
                }
            }
            
        } else if (Math.abs(this.sprite.x - this.startX) > this.patrolDistance * 1.5) {
            // Возвращение на базу
            this.aiState = 'return';
            this.direction = this.startX > this.sprite.x ? 1 : -1;
            body.setVelocityX(this.speed * this.direction);
            
        } else {
            // Патрулирование
            this.aiState = 'patrol';
            body.setVelocityX(this.speed * this.direction);
        }
        
        // Уменьшаем кулдаун атаки
        if (this.attackCooldown > 0) {
            this.attackCooldown -= 16; // Примерно 60 FPS
        }
    }

    public setPlayer(player: Phaser.Physics.Arcade.Sprite): void {
        this.player = player;
    }

    public takeDamage(damage: number = 1): void {
        // Воспроизводим звук урона врага
        if ((this.scene as any).soundSystem) {
            (this.scene as any).soundSystem.playSound('enemy_hurt');
        }
        
        // Можно расширить для системы здоровья
        this.destroy();
    }

    public destroy(): void {
        if (!this.isAlive) return;
        
        this.isAlive = false;
        
        // Воспроизводим звук смерти врага
        if ((this.scene as any).soundSystem) {
            (this.scene as any).soundSystem.playSound('enemy_death');
        }
        
        // Эффект смерти
        this.scene.tweens.add({
            targets: this.sprite,
            y: this.sprite.y - 50,
            alpha: 0,
            rotation: Math.PI * 2,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                this.sprite.destroy();
            }
        });
        
        // Частицы
        const particles = this.scene.add.particles(this.sprite.x, this.sprite.y, this.type, {
            scale: { start: 0.8, end: 0 },
            speed: { min: 100, max: 200 },
            lifespan: 500,
            quantity: 10,
            angle: { min: 0, max: 360 }
        });
        
        this.scene.time.delayedCall(500, () => particles.destroy());
    }
}