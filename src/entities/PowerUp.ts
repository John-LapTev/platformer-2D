import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';

export class PowerUp {
    public sprite: Phaser.Physics.Arcade.Sprite;
    private scene: Phaser.Scene;
    public type: string;
    private isCollected: boolean = false;
    private respawnTime: number = 30000; // 30 секунд
    private floatTween?: Phaser.Tweens.Tween;
    private glowEffect?: Phaser.GameObjects.Graphics;

    constructor(scene: Phaser.Scene, x: number, y: number, type: string) {
        this.scene = scene;
        this.type = type;
        
        // Создаём спрайт
        const textureKey = `powerup_${type}`;
        this.sprite = scene.physics.add.sprite(x, y, textureKey);
        this.sprite.setCollideWorldBounds(false);
        
        // Настраиваем физику
        const body = this.sprite.body as Phaser.Physics.Arcade.Body;
        body.setAllowGravity(false);
        body.setSize(35, 35);
        
        // Создаём эффекты
        this.createEffects();
        
        // Создаём анимацию
        this.createAnimation();
    }

    private createEffects(): void {
        // Эффект свечения
        this.glowEffect = this.scene.add.graphics();
        this.glowEffect.setPosition(this.sprite.x, this.sprite.y);
        
        // Анимация плавания
        this.floatTween = this.scene.tweens.add({
            targets: this.sprite,
            y: this.sprite.y - 10,
            duration: 1500,
            ease: 'Sine.inOut',
            yoyo: true,
            repeat: -1
        });
        
        // Вращение
        this.scene.tweens.add({
            targets: this.sprite,
            rotation: Math.PI * 2,
            duration: 3000,
            repeat: -1
        });
        
        // Пульсация
        this.scene.tweens.add({
            targets: this.sprite,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 1000,
            ease: 'Sine.inOut',
            yoyo: true,
            repeat: -1
        });
    }

    private createAnimation(): void {
        // Создаём частицы вокруг power-up
        const particles = this.scene.add.particles(0, 0, 'fog_particle', {
            scale: { start: 0.1, end: 0 },
            speed: 30,
            lifespan: 1000,
            frequency: 100,
            tint: this.getParticleTint(),
            blendMode: Phaser.BlendModes.ADD
        });
        
        particles.startFollow(this.sprite);
        
        // Сохраняем ссылку на частицы
        this.sprite.setData('particles', particles);
    }

    private getParticleTint(): number {
        switch (this.type) {
            case 'jump':
                return 0xffff00; // Жёлтый
            case 'speed':
                return 0x00ffff; // Голубой
            case 'invincible':
                return 0xff00ff; // Малиновый
            default:
                return 0xffffff;
        }
    }

    public collect(): void {
        if (this.isCollected) return;
        
        this.isCollected = true;
        
        // Эффект сбора
        this.createCollectEffect();
        
        // Скрываем спрайт
        this.sprite.setVisible(false);
        this.sprite.body?.enable && (this.sprite.body.enable = false);
        
        // Удаляем частицы
        const particles = this.sprite.getData('particles');
        if (particles) {
            particles.stop();
            this.scene.time.delayedCall(1000, () => particles.destroy());
        }
        
        // Останавливаем анимации
        if (this.floatTween) {
            this.floatTween.stop();
        }
        
        // Респавн через некоторое время
        this.scene.time.delayedCall(this.respawnTime, () => {
            this.respawn();
        });
    }

    private createCollectEffect(): void {
        // Вспышка при сборе
        const flash = this.scene.add.circle(
            this.sprite.x,
            this.sprite.y,
            50,
            this.getParticleTint(),
            0.8
        );
        
        this.scene.tweens.add({
            targets: flash,
            scale: 3,
            alpha: 0,
            duration: 500,
            ease: 'Power2',
            onComplete: () => flash.destroy()
        });
        
        // Частицы взрыва
        const burstParticles = this.scene.add.particles(this.sprite.x, this.sprite.y, 'fog_particle', {
            scale: { start: 0.2, end: 0 },
            speed: { min: 200, max: 400 },
            lifespan: 500,
            quantity: 15,
            angle: { min: 0, max: 360 },
            tint: this.getParticleTint(),
            blendMode: Phaser.BlendModes.ADD
        });
        
        burstParticles.explode();
        
        this.scene.time.delayedCall(500, () => burstParticles.destroy());
        
        // Текст power-up
        const text = this.scene.add.text(
            this.sprite.x,
            this.sprite.y - 30,
            this.getPowerUpText(),
            {
                fontSize: '24px',
                fontFamily: 'Arial Black',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4
            }
        );
        text.setOrigin(0.5);
        
        this.scene.tweens.add({
            targets: text,
            y: text.y - 50,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => text.destroy()
        });
    }

    private getPowerUpText(): string {
        switch (this.type) {
            case 'jump':
                return 'Тройной прыжок!';
            case 'speed':
                return 'Супер скорость!';
            case 'invincible':
                return 'Неуязвимость!';
            default:
                return 'Power-up!';
        }
    }

    private respawn(): void {
        this.isCollected = false;
        this.sprite.setVisible(true);
        this.sprite.body?.enable && (this.sprite.body.enable = true);
        
        // Эффект появления
        this.sprite.setScale(0);
        this.sprite.setAlpha(0);
        
        this.scene.tweens.add({
            targets: this.sprite,
            scale: 1,
            alpha: 1,
            duration: 500,
            ease: 'Back.out'
        });
        
        // Возобновляем анимации
        this.createEffects();
        this.createAnimation();
    }

    public destroy(): void {
        if (this.floatTween) {
            this.floatTween.stop();
        }
        
        if (this.glowEffect) {
            this.glowEffect.destroy();
        }
        
        const particles = this.sprite.getData('particles');
        if (particles) {
            particles.destroy();
        }
        
        this.sprite.destroy();
    }
}