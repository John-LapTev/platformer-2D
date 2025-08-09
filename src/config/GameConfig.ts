export const GameConfig = {
    // Размеры игры
    WIDTH: 1280,
    HEIGHT: 720,
    
    // Физика
    GRAVITY: 2200,  // Очень высокая гравитация для резкого падения
    PLAYER_SPEED: 300,
    PLAYER_JUMP_VELOCITY: -750,  // Мощный прыжок
    PLAYER_DOUBLE_JUMP_VELOCITY: -650,  // Двойной прыжок
    PLAYER_TRIPLE_JUMP_VELOCITY: -600,  // Тройной прыжок
    
    // Враги
    ENEMY_SPEED: 100,
    ENEMY_JUMP_VELOCITY: -400,
    ENEMY_DETECTION_RANGE: 200,
    
    // Лианы
    VINE_SEGMENTS: 20,
    VINE_SEGMENT_LENGTH: 15,
    VINE_STIFFNESS: 0.8,
    VINE_DAMPING: 0.95,
    
    // Power-ups
    POWERUP_DURATION: 10000, // 10 секунд
    POWERUP_SPEED_MULTIPLIER: 1.5,
    POWERUP_INVINCIBILITY_DURATION: 5000,
    
    // Игровые настройки
    MAX_LIVES: 3,
    COIN_VALUE: 10,
    CHECKPOINT_INTERVAL: 1000,
    
    // Мобильные настройки
    MOBILE_BUTTON_SIZE: 80,
    MOBILE_JOYSTICK_SIZE: 150,
    MOBILE_UI_OPACITY: 0.6,
    
    // Уровни
    LEVELS: [
        { key: 'level1', name: 'Лесная долина' },
        { key: 'level2', name: 'Огненные пещеры' },
        { key: 'level3', name: 'Ледяной замок' }
    ],
    
    // Цвета
    COLORS: {
        PRIMARY: 0x3498db,
        SECONDARY: 0x2ecc71,
        DANGER: 0xe74c3c,
        WARNING: 0xf39c12,
        INFO: 0x9b59b6
    },
    
    // Анимации
    ANIMATION_FRAMERATE: 60, // 60 FPS для плавности
    
    // Звуки
    VOLUME: {
        MASTER: 0.7,
        MUSIC: 0.5,
        SFX: 0.8
    }
};