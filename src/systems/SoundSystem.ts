import Phaser from 'phaser';

export class SoundSystem {
    private scene: Phaser.Scene;
    private sounds: Map<string, Phaser.Sound.BaseSound> = new Map();
    private musicVolume: number = 0.2;  // 20% по умолчанию
    private sfxVolume: number = 0.4;    // 40% по умолчанию
    private isMuted: boolean = false;
    private currentMusic: Phaser.Sound.BaseSound | null = null;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.loadSettings();
    }

    private loadSettings(): void {
        const settings = localStorage.getItem('soundSettings');
        if (settings) {
            const parsed = JSON.parse(settings);
            this.musicVolume = parsed.musicVolume ?? 0.2;  // 20% по умолчанию
            this.sfxVolume = parsed.sfxVolume ?? 0.4;      // 40% по умолчанию
            this.isMuted = parsed.isMuted ?? false;
        }
    }

    private saveSettings(): void {
        localStorage.setItem('soundSettings', JSON.stringify({
            musicVolume: this.musicVolume,
            sfxVolume: this.sfxVolume,
            isMuted: this.isMuted
        }));
    }

    public preloadSounds(): void {
        // Звуки действий игрока
        this.scene.load.audio('jump', [
            '/sounds/jump.ogg',
            '/sounds/jump.mp3'
        ]);
        this.scene.load.audio('land', [
            '/sounds/land.ogg',
            '/sounds/land.mp3'
        ]);
        this.scene.load.audio('footstep', [
            '/sounds/footstep.ogg',
            '/sounds/footstep.mp3'
        ]);
        
        // Звуки сбора предметов
        this.scene.load.audio('coin', [
            '/sounds/coin.ogg',
            '/sounds/coin.mp3'
        ]);
        this.scene.load.audio('powerup', [
            '/sounds/powerup.ogg',
            '/sounds/powerup.mp3'
        ]);
        
        // Звуки урона и смерти
        this.scene.load.audio('hurt', [
            '/sounds/hurt.ogg',
            '/sounds/hurt.mp3'
        ]);
        this.scene.load.audio('death', [
            '/sounds/death.ogg',
            '/sounds/death.mp3'
        ]);
        
        // Звуки врагов
        this.scene.load.audio('enemy_hurt', [
            '/sounds/enemy_hurt.ogg',
            '/sounds/enemy_hurt.mp3'
        ]);
        this.scene.load.audio('enemy_death', [
            '/sounds/enemy_death.ogg',
            '/sounds/enemy_death.mp3'
        ]);
        
        // Звуки окружения
        this.scene.load.audio('lava_bubble', [
            '/sounds/lava_bubble.ogg',
            '/sounds/lava_bubble.mp3'
        ]);
        this.scene.load.audio('portal', [
            '/sounds/portal.ogg',
            '/sounds/portal.mp3'
        ]);
        
        // Музыка
        this.scene.load.audio('level1_music', [
            '/sounds/level1_music.ogg',
            '/sounds/level1_music.mp3'
        ]);
        this.scene.load.audio('menu_music', [
            '/sounds/menu_music.ogg',
            '/sounds/menu_music.mp3'
        ]);
        this.scene.load.audio('boss_music', [
            '/sounds/boss_music.ogg',
            '/sounds/boss_music.mp3'
        ]);
    }

    public createSounds(): void {
        // Создаём звуки и сохраняем их для повторного использования
        const soundKeys = [
            'jump', 'land', 'footstep', 'coin', 'powerup',
            'hurt', 'death', 'enemy_hurt', 'enemy_death',
            'lava_bubble', 'portal'
        ];

        soundKeys.forEach(key => {
            if (this.scene.cache.audio.exists(key)) {
                const sound = this.scene.sound.add(key, {
                    volume: this.sfxVolume
                });
                this.sounds.set(key, sound);
            }
        });
    }

    public playSound(key: string, config?: Phaser.Types.Sound.SoundConfig): void {
        if (this.isMuted) return;

        const sound = this.sounds.get(key);
        if (sound) {
            const volume = config?.volume ?? this.sfxVolume;
            sound.play({ ...config, volume });
        } else if (this.scene.cache.audio.exists(key)) {
            // Если звук не был предзагружен, создаём его на лету
            this.scene.sound.play(key, {
                volume: this.sfxVolume,
                ...config
            });
        }
    }

    public playMusic(key: string, loop: boolean = true): void {
        if (this.isMuted) return;

        // Останавливаем текущую музыку
        if (this.currentMusic) {
            this.currentMusic.stop();
        }

        if (this.scene.cache.audio.exists(key)) {
            this.currentMusic = this.scene.sound.add(key, {
                volume: this.musicVolume,
                loop
            });
            this.currentMusic.play();
        }
    }

    public stopMusic(): void {
        if (this.currentMusic) {
            this.currentMusic.stop();
            this.currentMusic = null;
        }
    }

    public setMusicVolume(volume: number): void {
        this.musicVolume = Phaser.Math.Clamp(volume, 0, 1);
        if (this.currentMusic) {
            (this.currentMusic as any).setVolume(this.musicVolume);
        }
        this.saveSettings();
    }

    public setSfxVolume(volume: number): void {
        this.sfxVolume = Phaser.Math.Clamp(volume, 0, 1);
        this.sounds.forEach(sound => {
            (sound as any).setVolume(this.sfxVolume);
        });
        this.saveSettings();
    }

    public toggleMute(): void {
        this.isMuted = !this.isMuted;
        
        if (this.isMuted) {
            this.scene.sound.mute = true;
        } else {
            this.scene.sound.mute = false;
        }
        
        this.saveSettings();
    }

    public getMuted(): boolean {
        return this.isMuted;
    }

    public getMusicVolume(): number {
        return this.musicVolume;
    }

    public getSfxVolume(): number {
        return this.sfxVolume;
    }

    public destroy(): void {
        this.stopMusic();
        this.sounds.clear();
    }
}