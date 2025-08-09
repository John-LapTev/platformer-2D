import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';
import { Player } from '../entities/Player';

export class TouchControls {
    private scene: Phaser.Scene;
    private player?: Player;
    private container: Phaser.GameObjects.Container;
    
    // Джойстик
    private joystickBase!: Phaser.GameObjects.Image;
    private joystickThumb!: Phaser.GameObjects.Image;
    private joystickPointer?: Phaser.Input.Pointer;
    private joystickRadius: number = 75;
    private joystickDirection: { x: number, y: number } = { x: 0, y: 0 };
    
    // Кнопки
    private buttonA!: Phaser.GameObjects.Image; // Прыжок
    private buttonB!: Phaser.GameObjects.Image; // Атака
    private buttonPause!: Phaser.GameObjects.Image;
    
    // Состояния кнопок
    private isJumpPressed: boolean = false;
    private isAttackPressed: boolean = false;
    
    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        
        // Создаём контейнер для всех элементов управления
        this.container = scene.add.container(0, 0);
        this.container.setDepth(1000);
        this.container.setScrollFactor(0);
        
        // Создаём джойстик
        this.createJoystick();
        
        // Создаём кнопки
        this.createButtons();
        
        // Настраиваем обработчики
        this.setupEventHandlers();
        
        // Настраиваем прозрачность
        this.container.setAlpha(GameConfig.MOBILE_UI_OPACITY);
    }

    private createJoystick(): void {
        const x = 150;
        const y = this.scene.cameras.main.height - 150;
        
        // Основание джойстика
        this.joystickBase = this.scene.add.image(x, y, 'joystick_base');
        this.joystickBase.setDisplaySize(
            GameConfig.MOBILE_JOYSTICK_SIZE,
            GameConfig.MOBILE_JOYSTICK_SIZE
        );
        
        // Ручка джойстика
        this.joystickThumb = this.scene.add.image(x, y, 'joystick_thumb');
        this.joystickThumb.setDisplaySize(60, 60);
        
        this.container.add([this.joystickBase, this.joystickThumb]);
        
        // Делаем джойстик интерактивным
        this.joystickBase.setInteractive();
        
        // Область вокруг джойстика для увеличения зоны касания
        const hitArea = new Phaser.Geom.Circle(0, 0, this.joystickRadius * 1.5);
        this.joystickBase.setInteractive(hitArea, Phaser.Geom.Circle.Contains);
    }

    private createButtons(): void {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        // Кнопка A (прыжок)
        this.buttonA = this.scene.add.image(
            width - 180,
            height - 100,
            'button_a'
        );
        this.buttonA.setDisplaySize(
            GameConfig.MOBILE_BUTTON_SIZE,
            GameConfig.MOBILE_BUTTON_SIZE
        );
        this.buttonA.setInteractive();
        
        // Кнопка B (атака)
        this.buttonB = this.scene.add.image(
            width - 80,
            height - 150,
            'button_b'
        );
        this.buttonB.setDisplaySize(
            GameConfig.MOBILE_BUTTON_SIZE,
            GameConfig.MOBILE_BUTTON_SIZE
        );
        this.buttonB.setInteractive();
        
        // Кнопка паузы
        this.buttonPause = this.scene.add.image(
            width - 40,
            40,
            'button_a'
        );
        this.buttonPause.setDisplaySize(40, 40);
        this.buttonPause.setInteractive();
        this.buttonPause.setTint(0x666666);
        
        // Добавляем текст на кнопку паузы
        const pauseText = this.scene.add.text(
            width - 40,
            40,
            '⏸',
            {
                fontSize: '24px',
                color: '#ffffff'
            }
        );
        pauseText.setOrigin(0.5);
        
        this.container.add([
            this.buttonA,
            this.buttonB,
            this.buttonPause,
            pauseText
        ]);
    }

    private setupEventHandlers(): void {
        // Обработка джойстика
        this.joystickBase.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            this.joystickPointer = pointer;
            this.updateJoystick(pointer);
        });
        
        this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (this.joystickPointer && pointer.id === this.joystickPointer.id) {
                this.updateJoystick(pointer);
            }
        });
        
        this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
            if (this.joystickPointer && pointer.id === this.joystickPointer.id) {
                this.resetJoystick();
                this.joystickPointer = undefined;
            }
        });
        
        // Обработка кнопки A
        this.buttonA.on('pointerdown', () => {
            this.isJumpPressed = true;
            this.buttonA.setScale(0.9);
            this.buttonA.setTint(0xcccccc);
            
            if (this.player) {
                this.player.jump();
            }
        });
        
        this.buttonA.on('pointerup', () => {
            this.isJumpPressed = false;
            this.buttonA.setScale(1);
            this.buttonA.clearTint();
        });
        
        this.buttonA.on('pointerout', () => {
            this.isJumpPressed = false;
            this.buttonA.setScale(1);
            this.buttonA.clearTint();
        });
        
        // Обработка кнопки B
        this.buttonB.on('pointerdown', () => {
            this.isAttackPressed = true;
            this.buttonB.setScale(0.9);
            this.buttonB.setTint(0xcccccc);
            
            // Логика атаки
            // if (this.player) {
            //     this.player.attack();
            // }
        });
        
        this.buttonB.on('pointerup', () => {
            this.isAttackPressed = false;
            this.buttonB.setScale(1);
            this.buttonB.clearTint();
        });
        
        this.buttonB.on('pointerout', () => {
            this.isAttackPressed = false;
            this.buttonB.setScale(1);
            this.buttonB.clearTint();
        });
        
        // Обработка кнопки паузы
        this.buttonPause.on('pointerdown', () => {
            this.buttonPause.setScale(0.9);
            // Отправляем событие паузы
            const gameScene = this.scene.scene.get('GameScene');
            gameScene.events.emit('toggle-pause');
        });
        
        this.buttonPause.on('pointerup', () => {
            this.buttonPause.setScale(1);
        });
        
        // Обработка свайпов для лазания по лианам
        this.setupSwipeGestures();
    }

    private setupSwipeGestures(): void {
        let startY = 0;
        let startTime = 0;
        
        this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            // Игнорируем касания в области UI
            if (pointer.x < 300 || pointer.x > this.scene.cameras.main.width - 300) {
                return;
            }
            
            startY = pointer.y;
            startTime = Date.now();
        });
        
        this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
            const deltaY = pointer.y - startY;
            const deltaTime = Date.now() - startTime;
            
            // Определяем свайп
            if (Math.abs(deltaY) > 50 && deltaTime < 500) {
                if (deltaY < 0) {
                    // Свайп вверх - лазание вверх по лиане
                    if (this.player) {
                        // this.player.climbUp();
                    }
                } else {
                    // Свайп вниз - спуск по лиане
                    if (this.player) {
                        // this.player.climbDown();
                    }
                }
            }
        });
    }

    private updateJoystick(pointer: Phaser.Input.Pointer): void {
        const dx = pointer.x - this.joystickBase.x;
        const dy = pointer.y - this.joystickBase.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > this.joystickRadius) {
            // Ограничиваем движение ручки
            const angle = Math.atan2(dy, dx);
            this.joystickThumb.x = this.joystickBase.x + Math.cos(angle) * this.joystickRadius;
            this.joystickThumb.y = this.joystickBase.y + Math.sin(angle) * this.joystickRadius;
            
            this.joystickDirection.x = Math.cos(angle);
            this.joystickDirection.y = Math.sin(angle);
        } else {
            this.joystickThumb.x = pointer.x;
            this.joystickThumb.y = pointer.y;
            
            this.joystickDirection.x = dx / this.joystickRadius;
            this.joystickDirection.y = dy / this.joystickRadius;
        }
    }

    private resetJoystick(): void {
        this.joystickThumb.x = this.joystickBase.x;
        this.joystickThumb.y = this.joystickBase.y;
        this.joystickDirection.x = 0;
        this.joystickDirection.y = 0;
    }

    public setPlayer(player: Player): void {
        this.player = player;
    }

    public update(): void {
        if (!this.player) return;
        
        // Применяем движение от джойстика
        if (Math.abs(this.joystickDirection.x) > 0.2) {
            if (this.joystickDirection.x < 0) {
                this.player.moveLeft();
            } else {
                this.player.moveRight();
            }
        } else {
            this.player.stopHorizontal();
        }
        
        // Приседание при движении джойстика вниз
        if (this.joystickDirection.y > 0.7) {
            this.player.crouch();
        }
        
        // Прыжок при движении джойстика вверх
        if (this.joystickDirection.y < -0.7) {
            this.player.jump();
        }
    }

    public show(): void {
        this.container.setVisible(true);
        
        // Анимация появления
        this.scene.tweens.add({
            targets: this.container,
            alpha: GameConfig.MOBILE_UI_OPACITY,
            duration: 300
        });
    }

    public hide(): void {
        // Анимация исчезновения
        this.scene.tweens.add({
            targets: this.container,
            alpha: 0,
            duration: 300,
            onComplete: () => {
                this.container.setVisible(false);
            }
        });
    }

    public setOpacity(opacity: number): void {
        this.container.setAlpha(opacity);
    }

    public destroy(): void {
        this.container.destroy();
    }
}