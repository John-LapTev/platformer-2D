import Phaser from 'phaser';

export class PortalSystem {
    private scene: Phaser.Scene;
    private portals: Map<string, Phaser.GameObjects.Container> = new Map();
    
    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }
    
    public createPortal(x: number, y: number, type: 'spawn' | 'death' | 'teleport', id?: string): Phaser.GameObjects.Container {
        const portalId = id || `portal_${Date.now()}`;
        const container = this.scene.add.container(x, y);
        
        // Основа портала - овальная форма
        const portalBase = this.scene.add.graphics();
        
        // Градиентный овал портала - НАМНОГО БОЛЬШЕ
        const colors = type === 'spawn' ? [0x00ff00, 0x00aa00] : 
                      type === 'death' ? [0xff0000, 0xaa0000] : 
                      [0x00ffff, 0x0088ff];
        
        // Внешнее свечение (оставляем красивым)
        const glow = this.scene.add.graphics();
        glow.fillStyle(colors[0], 0.15);
        glow.fillEllipse(0, 0, 120, 160);
        glow.fillStyle(colors[0], 0.08);
        glow.fillEllipse(0, 0, 140, 180);
        
        // Рисуем основной портал - средний размер
        portalBase.fillGradientStyle(colors[0], colors[1], colors[0], colors[1], 1);
        portalBase.fillEllipse(0, 0, 100, 140);
        
        // Внутренний вихрь с МЯГКИМИ краями через градиент
        const vortex = this.scene.add.graphics();
        // Создаём мягкий переход от чёрного центра к краям
        for (let i = 10; i > 0; i--) {
            const alpha = 0.08 * i;
            const scale = i / 10;
            vortex.fillStyle(0x000000, alpha);
            vortex.fillEllipse(0, 0, 70 * scale, 110 * scale);
        }
        
        // Центральный вихрь - самый тёмный, но с мягкими краями
        const innerVortex = this.scene.add.graphics();
        for (let i = 8; i > 0; i--) {
            const alpha = 0.1 * i;
            const scale = i / 8;
            innerVortex.fillStyle(0x000033, alpha);
            innerVortex.fillEllipse(0, 0, 40 * scale, 70 * scale);
        }
        
        // Энергетические частицы - больше и эффектнее
        const particles = this.scene.add.particles(0, 0, 'fog_particle', {
            scale: { start: 0.2, end: 0.5 },
            alpha: { start: 1, end: 0 },
            speed: { min: 40, max: 100 },
            lifespan: 1500,
            frequency: 20,
            tint: colors,
            blendMode: Phaser.BlendModes.ADD,
            emitZone: {
                type: 'edge',
                source: new Phaser.Geom.Ellipse(0, 0, 90, 130),
                quantity: 24,
                yoyo: false
            }
        });
        
        // Внутренние спиральные частицы - более интенсивные
        const spiralParticles = this.scene.add.particles(0, 0, 'fog_particle', {
            scale: { start: 0.1, end: 0.3 },
            alpha: { start: 0.8, end: 0 },
            speed: { min: 50, max: 80 },
            lifespan: 2000,
            frequency: 10,
            tint: [0xffffff, colors[0], colors[1]],
            blendMode: Phaser.BlendModes.ADD,
            rotate: { min: 0, max: 360 },
            emitZone: {
                type: 'random',
                source: new Phaser.Geom.Ellipse(0, 0, 90, 150)
            }
        });
        
        // Дополнительные искры для эффектности
        const sparks = this.scene.add.particles(0, 0, 'fog_particle', {
            scale: { start: 0.05, end: 0.2 },
            alpha: { start: 1, end: 0 },
            speed: { min: 100, max: 200 },
            lifespan: 800,
            frequency: 50,
            quantity: 2,
            tint: [0xffffff],
            blendMode: Phaser.BlendModes.ADD
        });
        
        // Анимация вращения вихрей в разные стороны
        this.scene.tweens.add({
            targets: vortex,
            rotation: Math.PI * 2,
            duration: 3000,
            repeat: -1,
            ease: 'Linear'
        });
        
        this.scene.tweens.add({
            targets: innerVortex,
            rotation: -Math.PI * 2,
            duration: 4000,
            repeat: -1,
            ease: 'Linear'
        });
        
        // Пульсация портала
        this.scene.tweens.add({
            targets: [portalBase, vortex, innerVortex],
            scaleX: 1.1,
            scaleY: 1.05,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut'
        });
        
        container.add([glow, portalBase, vortex, innerVortex, particles, spiralParticles, sparks]);
        container.setDepth(1); // Портал виден но за персонажем
        
        this.portals.set(portalId, container);
        return container;
    }
    
    public openPortal(x: number, y: number, callback?: () => void): void {
        const portal = this.createPortal(x, y, 'teleport');
        
        // Начинаем с точки
        portal.setScale(0.01, 0.01);
        portal.setAlpha(0);
        
        // МГНОВЕННАЯ вспышка
        const flash = this.scene.add.graphics();
        flash.fillStyle(0xffffff, 1);
        flash.fillCircle(x, y, 2);
        flash.setDepth(200);
        
        // Вспышка - БАМ!
        this.scene.tweens.add({
            targets: flash,
            scaleX: 10,
            scaleY: 10,
            alpha: 0,
            duration: 100,
            ease: 'Expo.out',
            onComplete: () => flash.destroy()
        });
        
        // Портал МГНОВЕННО появляется
        this.scene.tweens.add({
            targets: portal,
            scaleX: 1,
            scaleY: 1,
            alpha: 1,
            duration: 150,
            ease: 'Back.out(4)',
            onComplete: () => {
                if (callback) {
                    callback(); // Сразу вызываем без задержки
                }
            }
        });
    }
    
    public closePortal(portal: Phaser.GameObjects.Container, callback?: () => void): void {
        // МОЛНИЕНОСНОЕ схлопывание!
        this.scene.tweens.add({
            targets: portal,
            scaleX: 0,
            scaleY: 0,
            rotation: Math.PI * 0.5,
            alpha: 0,
            duration: 120,
            ease: 'Back.in(5)',
            onComplete: () => {
                portal.destroy();
                if (callback) callback();
            }
        });
    }
    
    public teleportPlayer(player: Phaser.Physics.Arcade.Sprite, fromX: number, fromY: number, toX: number, toY: number, onComplete?: () => void): void {
        // Создаём портал входа
        const enterPortal = this.createPortal(fromX, fromY, 'teleport');
        enterPortal.setScale(0);
        
        // Открываем портал входа
        this.scene.tweens.add({
            targets: enterPortal,
            scaleX: 1,
            scaleY: 1,
            duration: 300,
            ease: 'Back.out',
            onComplete: () => {
                // Втягиваем игрока в портал
                this.scene.tweens.add({
                    targets: player,
                    x: fromX,
                    y: fromY,
                    scaleX: 0,
                    scaleY: 0,
                    rotation: Math.PI * 2,
                    duration: 500,
                    ease: 'Power2.in',
                    onComplete: () => {
                        // Закрываем портал входа
                        this.closePortal(enterPortal);
                        
                        // Создаём портал выхода
                        const exitPortal = this.createPortal(toX, toY, 'teleport');
                        exitPortal.setScale(0);
                        
                        // Перемещаем игрока
                        player.setPosition(toX, toY);
                        player.setScale(0, 0);
                        player.setRotation(0);
                        
                        // Открываем портал выхода
                        this.scene.tweens.add({
                            targets: exitPortal,
                            scaleX: 1,
                            scaleY: 1,
                            duration: 300,
                            ease: 'Back.out',
                            onComplete: () => {
                                // Выбрасываем игрока из портала
                                this.scene.tweens.add({
                                    targets: player,
                                    scaleX: 1,
                                    scaleY: 1,
                                    rotation: 0,
                                    duration: 500,
                                    ease: 'Back.out',
                                    onComplete: () => {
                                        // Закрываем портал выхода
                                        this.scene.time.delayedCall(500, () => {
                                            this.closePortal(exitPortal);
                                            if (onComplete) onComplete();
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    }
    
    public destroy(): void {
        this.portals.forEach(portal => portal.destroy());
        this.portals.clear();
    }
}