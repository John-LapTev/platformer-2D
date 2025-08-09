import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';

interface VineSegment {
    x: number;
    y: number;
    oldX: number;
    oldY: number;
    sprite: Phaser.GameObjects.Image;
    pinned: boolean;
}

interface Vine {
    segments: VineSegment[];
    container: Phaser.GameObjects.Container;
    isGrabbed: boolean;
    grabbedSegmentIndex: number;
}

export class VineSystem {
    private scene: Phaser.Scene;
    private vines: Vine[] = [];
    private player?: Phaser.Physics.Arcade.Sprite;
    private gravity: number = 0.5;
    private iterations: number = 3;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    public createVine(x: number, y: number, segmentCount: number = GameConfig.VINE_SEGMENTS): Vine {
        const segments: VineSegment[] = [];
        const container = this.scene.add.container(x, y);
        
        // Создаём сегменты лианы
        for (let i = 0; i < segmentCount; i++) {
            const segmentY = i * GameConfig.VINE_SEGMENT_LENGTH;
            const sprite = this.scene.add.image(0, segmentY, 'vine_segment');
            
            const segment: VineSegment = {
                x: 0,
                y: segmentY,
                oldX: 0,
                oldY: segmentY,
                sprite: sprite,
                pinned: i === 0 // Первый сегмент закреплён
            };
            
            segments.push(segment);
            container.add(sprite);
        }
        
        // Создаём точку крепления
        const anchor = this.scene.add.circle(0, 0, 8, 0x8b4513);
        anchor.setStrokeStyle(2, 0x654321);
        container.add(anchor);
        
        const vine: Vine = {
            segments: segments,
            container: container,
            isGrabbed: false,
            grabbedSegmentIndex: -1
        };
        
        this.vines.push(vine);
        
        // Делаем лиану интерактивной
        this.makeInteractive(vine);
        
        return vine;
    }

    private makeInteractive(vine: Vine): void {
        vine.segments.forEach((segment, index) => {
            if (index > 0) { // Не делаем первый сегмент интерактивным
                const hitArea = new Phaser.Geom.Rectangle(-10, -10, 20, 30);
                segment.sprite.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
            }
        });
    }

    public setPlayer(player: Phaser.Physics.Arcade.Sprite): void {
        this.player = player;
    }

    public update(delta: number): void {
        this.vines.forEach(vine => {
            this.updateVine(vine, delta);
            this.checkPlayerCollision(vine);
        });
    }

    private updateVine(vine: Vine, delta: number): void {
        const deltaTime = Math.min(delta / 1000, 0.016); // Ограничиваем дельту
        
        // Обновляем физику сегментов (Verlet integration)
        vine.segments.forEach((segment, index) => {
            if (!segment.pinned) {
                const velocityX = (segment.x - segment.oldX) * GameConfig.VINE_DAMPING;
                const velocityY = (segment.y - segment.oldY) * GameConfig.VINE_DAMPING;
                
                segment.oldX = segment.x;
                segment.oldY = segment.y;
                
                segment.x += velocityX;
                segment.y += velocityY + this.gravity;
                
                // Если схвачен игроком
                if (vine.isGrabbed && index === vine.grabbedSegmentIndex && this.player) {
                    const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
                    const worldPos = this.getWorldPosition(vine, segment);
                    
                    // Применяем умеренную силу от движения игрока для раскачивания
                    if (Math.abs(playerBody.velocity.x) > 10) {
                        segment.x += playerBody.velocity.x * 0.004;  // Средняя сила раскачки
                        // Добавляем небольшую инерцию
                        segment.oldX -= playerBody.velocity.x * 0.001;
                    }
                    
                    // Если игрок лезет вверх/вниз по верёвке
                    if (Math.abs(playerBody.velocity.y) > 100) {
                        const climbDirection = playerBody.velocity.y > 0 ? 1 : -1;
                        // Перемещаемся к следующему/предыдущему сегменту
                        const newIndex = Math.max(1, Math.min(vine.segments.length - 1, 
                                                              vine.grabbedSegmentIndex + climbDirection));
                        if (newIndex !== vine.grabbedSegmentIndex) {
                            vine.grabbedSegmentIndex = newIndex;
                        }
                    }
                    
                    // Плавно перемещаем игрока к сегменту
                    const targetX = worldPos.x;
                    const targetY = worldPos.y + 15; // Немного ниже сегмента
                    
                    this.player.x += (targetX - this.player.x) * 0.3;
                    this.player.y += (targetY - this.player.y) * 0.3;
                    
                    // Передаём умеренную инерцию верёвки игроку
                    const maxSwingSpeed = 300; // Ограничиваем максимальную скорость качания
                    const newVelX = Math.max(-maxSwingSpeed, Math.min(maxSwingSpeed, 
                                            playerBody.velocity.x + velocityX * 10));
                    playerBody.setVelocity(newVelX, velocityY * 30);
                }
            }
        });
        
        // Ограничения расстояния между сегментами
        for (let i = 0; i < this.iterations; i++) {
            this.applyConstraints(vine);
        }
        
        // Обновляем визуальное представление
        this.updateVisuals(vine);
    }

    private applyConstraints(vine: Vine): void {
        for (let i = 1; i < vine.segments.length; i++) {
            const segment1 = vine.segments[i - 1];
            const segment2 = vine.segments[i];
            
            const dx = segment2.x - segment1.x;
            const dy = segment2.y - segment1.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                const difference = GameConfig.VINE_SEGMENT_LENGTH - distance;
                const percent = (difference / distance) * GameConfig.VINE_STIFFNESS;
                const offsetX = dx * percent;
                const offsetY = dy * percent;
                
                if (!segment1.pinned) {
                    segment1.x -= offsetX * 0.5;
                    segment1.y -= offsetY * 0.5;
                }
                if (!segment2.pinned) {
                    segment2.x += offsetX * 0.5;
                    segment2.y += offsetY * 0.5;
                }
            }
        }
    }

    private updateVisuals(vine: Vine): void {
        vine.segments.forEach(segment => {
            segment.sprite.setPosition(segment.x, segment.y);
            
            // Можно добавить поворот сегментов
            if (vine.segments.indexOf(segment) > 0) {
                const prevSegment = vine.segments[vine.segments.indexOf(segment) - 1];
                const angle = Math.atan2(
                    segment.y - prevSegment.y,
                    segment.x - prevSegment.x
                );
                segment.sprite.setRotation(angle + Math.PI / 2);
            }
        });
    }

    private checkPlayerCollision(vine: Vine): void {
        if (!this.player) return;
        
        const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
        const playerData = this.player.getData('playerInstance');
        
        // Пропускаем если игрок уже на верёвке ИЛИ верёвка уже захвачена
        if ((playerData && playerData.isOnVine) || vine.isGrabbed) return;
        
        // Дополнительная проверка - игрок недавно отпустил верёвку
        const lastReleaseTime = this.player.getData('lastVineRelease') || 0;
        const currentTime = Date.now();
        if (currentTime - lastReleaseTime < 500) return; // 500мс задержка перед повторным захватом
        
        // Проверяем коллизию с каждым сегментом
        vine.segments.forEach((segment, index) => {
            if (index === 0) return; // Пропускаем якорь
            
            const worldPos = this.getWorldPosition(vine, segment);
            const distance = Phaser.Math.Distance.Between(
                this.player!.x,
                this.player!.y,
                worldPos.x,
                worldPos.y
            );
            
            // Автоматически цепляемся только при прыжке вверх
            if (distance < 40 && playerBody.velocity.y < -200) {
                this.grabVine(vine, index);
                return; // Выходим после первого захвата
            }
        });
    }

    public grabVine(vine: Vine, segmentIndex: number): void {
        if (vine.isGrabbed) return;
        
        vine.isGrabbed = true;
        vine.grabbedSegmentIndex = segmentIndex;
        
        // Отправляем событие игроку
        if (this.player) {
            const playerData = this.player.getData('playerInstance');
            if (playerData && playerData.attachToVine) {
                playerData.attachToVine(vine);
            }
        }
    }

    public releaseVine(vine: Vine): void {
        vine.isGrabbed = false;
        vine.grabbedSegmentIndex = -1;
        
        // НЕ вызываем detachFromVine здесь - игрок сам управляет своим состоянием
    }

    public applyForceToVine(vine: Vine, forceX: number, forceY: number): void {
        if (vine.isGrabbed && vine.grabbedSegmentIndex >= 0) {
            const segment = vine.segments[vine.grabbedSegmentIndex];
            if (!segment.pinned) {
                segment.x += forceX * 0.1;
                segment.y += forceY * 0.1;
            }
        }
    }

    private getWorldPosition(vine: Vine, segment: VineSegment): { x: number, y: number } {
        return {
            x: vine.container.x + segment.x,
            y: vine.container.y + segment.y
        };
    }

    public destroy(): void {
        this.vines.forEach(vine => {
            vine.container.destroy();
        });
        this.vines = [];
    }
}