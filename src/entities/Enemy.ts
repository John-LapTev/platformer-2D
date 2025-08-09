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

    constructor(scene: Phaser.Scene, x: number, y: number, type: string) {
        this.scene = scene;
        this.type = type;
        this.startX = x;
        
        // Создаём спрайт с AI-графикой
        const textureKey = scene.textures.exists('enemy-sprite') ? 'enemy-sprite' : type;
        this.sprite = scene.physics.add.sprite(x, y, textureKey);
        this.sprite.setCollideWorldBounds(false);
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
    }

    private setupPhysics(): void {
        const body = this.sprite.body as Phaser.Physics.Arcade.Body;
        
        switch (this.type) {
            case 'enemy1':
                body.setSize(30, 30);
                this.speed = GameConfig.ENEMY_SPEED;
                this.patrolDistance = 150;
                break;
            case 'enemy2':
                body.setSize(35, 35);
                this.speed = GameConfig.ENEMY_SPEED * 0.8;
                this.patrolDistance = 200;
                break;
            case 'enemy3':
                body.setSize(32, 35);
                this.speed = GameConfig.ENEMY_SPEED * 1.2;
                this.patrolDistance = 250;
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
        
        // Проверяем края платформы
        if (body.blocked && (body.blocked.left || body.blocked.right)) {
            this.changeDirection();
        }
        
        // Проверяем обрыв впереди
        this.checkEdge();
        
        // Патрулирование в пределах зоны
        if (Math.abs(this.sprite.x - this.startX) > this.patrolDistance) {
            this.changeDirection();
        }
        
        // Обнаружение игрока
        if (this.player) {
            this.detectPlayer();
        }
        
        // Поворот спрайта
        this.sprite.setFlipX(this.direction < 0);
    }

    private checkEdge(): void {
        const body = this.sprite.body as Phaser.Physics.Arcade.Body;
        
        // Проверяем наличие платформы впереди
        const checkX = this.sprite.x + (this.direction * 50);
        const checkY = this.sprite.y + 60;
        
        // Простая проверка границ платформы
        if (this.sprite.x < 100 || this.sprite.x > 4900) {
            this.changeDirection();
            return;
        }
        
        // Проверяем расстояние от стартовой позиции
        if (Math.abs(this.sprite.x - this.startX) > this.patrolDistance) {
            this.changeDirection();
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
        
        if (distance < GameConfig.ENEMY_DETECTION_RANGE) {
            // Преследуем игрока
            const directionToPlayer = this.player.x > this.sprite.x ? 1 : -1;
            
            if (this.type === 'enemy3') {
                // enemy3 может прыгать
                const body = this.sprite.body as Phaser.Physics.Arcade.Body;
                if (body.blocked.down && Math.abs(this.player.y - this.sprite.y) > 50) {
                    body.setVelocityY(GameConfig.ENEMY_JUMP_VELOCITY);
                }
            }
            
            this.direction = directionToPlayer;
            const body = this.sprite.body as Phaser.Physics.Arcade.Body;
            body.setVelocityX(this.speed * 1.5 * this.direction);
            
            // Анимация атаки
            if (distance < 50) {
                this.sprite.play(`${this.type}_attack`, true);
            }
        } else {
            // Возвращаемся к патрулированию
            const body = this.sprite.body as Phaser.Physics.Arcade.Body;
            body.setVelocityX(this.speed * this.direction);
        }
    }

    public setPlayer(player: Phaser.Physics.Arcade.Sprite): void {
        this.player = player;
    }

    public takeDamage(damage: number = 1): void {
        // Можно расширить для системы здоровья
        this.destroy();
    }

    public destroy(): void {
        if (!this.isAlive) return;
        
        this.isAlive = false;
        
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