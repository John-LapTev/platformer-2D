import Phaser from 'phaser';

export class PhysicsSystem {
    private scene: Phaser.Scene;
    private movingPlatforms: Phaser.Physics.Arcade.Group;
    private windZones: Phaser.GameObjects.Zone[] = [];
    private gravityZones: Phaser.GameObjects.Zone[] = [];

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.movingPlatforms = scene.physics.add.group();
    }

    public createMovingPlatform(
        x: number,
        y: number,
        width: number,
        moveDistance: number,
        speed: number,
        horizontal: boolean = true
    ): Phaser.Physics.Arcade.Sprite {
        const platform = this.scene.physics.add.sprite(x, y, 'platform');
        platform.setImmovable(true);
        platform.body?.setAllowGravity(false);
        platform.setDisplaySize(width, 20);
        
        // Сохраняем параметры движения
        platform.setData('startX', x);
        platform.setData('startY', y);
        platform.setData('moveDistance', moveDistance);
        platform.setData('speed', speed);
        platform.setData('horizontal', horizontal);
        platform.setData('direction', 1);
        
        this.movingPlatforms.add(platform);
        
        return platform;
    }

    public createWindZone(x: number, y: number, width: number, height: number, forceX: number, forceY: number): void {
        const zone = this.scene.add.zone(x, y, width, height);
        zone.setData('forceX', forceX);
        zone.setData('forceY', forceY);
        
        // Визуализация зоны ветра
        const graphics = this.scene.add.graphics();
        graphics.fillStyle(0x00ffff, 0.1);
        graphics.fillRect(x - width/2, y - height/2, width, height);
        
        // Частицы ветра
        const particles = this.scene.add.particles(x, y, 'coin', {
            scale: { start: 0.1, end: 0 },
            speed: { min: Math.abs(forceX) * 2, max: Math.abs(forceX) * 3 },
            lifespan: 2000,
            frequency: 50,
            tint: 0xcccccc,
            alpha: 0.3,
            angle: forceX > 0 ? 0 : 180,
            emitZone: {
                type: 'random',
                source: new Phaser.Geom.Rectangle(-width/2, -height/2, width, height)
            } as any
        });
        
        this.windZones.push(zone);
    }

    public createGravityZone(x: number, y: number, width: number, height: number, gravityMultiplier: number): void {
        const zone = this.scene.add.zone(x, y, width, height);
        zone.setData('gravityMultiplier', gravityMultiplier);
        
        // Визуализация зоны гравитации
        const graphics = this.scene.add.graphics();
        const color = gravityMultiplier < 1 ? 0xff00ff : 0xff0000;
        graphics.fillStyle(color, 0.1);
        graphics.fillRect(x - width/2, y - height/2, width, height);
        
        this.gravityZones.push(zone);
    }

    public update(player: Phaser.Physics.Arcade.Sprite, enemies: any[]): void {
        // Обновляем движущиеся платформы
        this.updateMovingPlatforms();
        
        // Применяем эффекты зон
        this.applyWindEffect(player);
        this.applyGravityEffect(player);
        
        // Применяем эффекты к врагам
        enemies.forEach(enemy => {
            if (enemy.sprite) {
                this.applyWindEffect(enemy.sprite);
                this.applyGravityEffect(enemy.sprite);
            }
        });
    }

    private updateMovingPlatforms(): void {
        this.movingPlatforms.children.entries.forEach(platform => {
            const sprite = platform as Phaser.Physics.Arcade.Sprite;
            const startX = sprite.getData('startX');
            const startY = sprite.getData('startY');
            const moveDistance = sprite.getData('moveDistance');
            const speed = sprite.getData('speed');
            const horizontal = sprite.getData('horizontal');
            let direction = sprite.getData('direction');
            
            if (horizontal) {
                // Горизонтальное движение
                sprite.setVelocityX(speed * direction);
                
                if (Math.abs(sprite.x - startX) > moveDistance) {
                    direction *= -1;
                    sprite.setData('direction', direction);
                }
            } else {
                // Вертикальное движение
                sprite.setVelocityY(speed * direction);
                
                if (Math.abs(sprite.y - startY) > moveDistance) {
                    direction *= -1;
                    sprite.setData('direction', direction);
                }
            }
        });
    }

    private applyWindEffect(sprite: Phaser.Physics.Arcade.Sprite): void {
        const body = sprite.body as Phaser.Physics.Arcade.Body;
        
        this.windZones.forEach(zone => {
            if (zone.getBounds().contains(sprite.x, sprite.y)) {
                const forceX = zone.getData('forceX');
                const forceY = zone.getData('forceY');
                
                body.setVelocity(
                    body.velocity.x + forceX,
                    body.velocity.y + forceY
                );
            }
        });
    }

    private applyGravityEffect(sprite: Phaser.Physics.Arcade.Sprite): void {
        const body = sprite.body as Phaser.Physics.Arcade.Body;
        
        let inGravityZone = false;
        this.gravityZones.forEach(zone => {
            if (zone.getBounds().contains(sprite.x, sprite.y)) {
                const multiplier = zone.getData('gravityMultiplier');
                body.setGravityY(this.scene.physics.world.gravity.y * (multiplier - 1));
                inGravityZone = true;
            }
        });
        
        if (!inGravityZone) {
            body.setGravityY(0);
        }
    }

    public createBouncePad(x: number, y: number, bounceVelocity: number = -800): Phaser.Physics.Arcade.Sprite {
        const pad = this.scene.physics.add.sprite(x, y, 'platform');
        pad.setImmovable(true);
        pad.body?.setAllowGravity(false);
        pad.setTint(0x00ff00);
        pad.setDisplaySize(60, 10);
        pad.setData('bounceVelocity', bounceVelocity);
        
        // Эффект при касании
        this.scene.physics.add.collider(pad, this.scene.physics.world.bodies.entries, 
            (pad, other) => {
                const body = other as Phaser.Physics.Arcade.Body;
                if (body.velocity.y > 0) {
                    body.setVelocityY(bounceVelocity);
                    
                    // Визуальный эффект
                    this.scene.tweens.add({
                        targets: pad,
                        scaleY: 0.5,
                        duration: 100,
                        yoyo: true
                    });
                }
            }
        );
        
        return pad;
    }

    public createConveyorBelt(x: number, y: number, width: number, speed: number): Phaser.Physics.Arcade.Sprite {
        const conveyor = this.scene.physics.add.sprite(x, y, 'platform');
        conveyor.setImmovable(true);
        conveyor.body?.setAllowGravity(false);
        conveyor.setDisplaySize(width, 20);
        conveyor.setTint(0x666666);
        conveyor.setData('conveyorSpeed', speed);
        
        // Анимация конвейера
        this.scene.tweens.add({
            targets: conveyor,
            tilePositionX: speed > 0 ? 100 : -100,
            duration: 1000,
            repeat: -1
        });
        
        // Эффект при касании
        this.scene.physics.add.collider(conveyor, this.scene.physics.world.bodies.entries,
            (conveyor, other) => {
                const body = other as Phaser.Physics.Arcade.Body;
                if (body.touching.down) {
                    body.setVelocityX(body.velocity.x + speed);
                }
            }
        );
        
        return conveyor;
    }

    public destroy(): void {
        this.movingPlatforms.destroy();
        this.windZones = [];
        this.gravityZones = [];
    }
}