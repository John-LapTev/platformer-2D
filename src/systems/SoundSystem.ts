import Phaser from 'phaser';

export class SoundSystem {
    private scene: Phaser.Scene;
    private sounds: Map<string, Phaser.Sound.BaseSound> = new Map();
    private musicVolume: number = 0.2;  // 20% по умолчанию
    private sfxVolume: number = 0.4;    // 40% по умолчанию
    private isMuted: boolean = false;
    private currentMusic: Phaser.Sound.BaseSound | null = null;
    private individualVolumes: Map<string, number> = new Map();

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.loadSettings();
    }

    private loadSettings(): void {
        // Загружаем настройки из localStorage
        const settings = localStorage.getItem('soundSettings');
        if (settings) {
            const parsed = JSON.parse(settings);
            this.musicVolume = parsed.musicVolume ?? 0.2;  // 20% по умолчанию  
            this.sfxVolume = parsed.sfxVolume ?? 0.4;      // 40% по умолчанию
            this.isMuted = parsed.isMuted ?? false;
            
            // Загружаем индивидуальные настройки звуков
            if (parsed.individualVolumes) {
                Object.entries(parsed.individualVolumes).forEach(([key, value]) => {
                    this.individualVolumes.set(key, value as number);
                });
            }
        }
        
        // Устанавливаем значения по умолчанию для индивидуальных звуков если их нет
        this.initializeDefaultVolumes();
    }
    
    private initializeDefaultVolumes(): void {
        // Оптимально сбалансированные значения по умолчанию (0-100%)
        const defaults = new Map([
            // Звуки игрока
            ['jump', 40],         // Прыжок - средне
            ['land', 25],         // Приземление - тише
            ['footstep', 15],     // Шаги - очень тихо
            ['hurt', 60],         // Урон игрока - заметно
            ['death', 70],        // Смерть игрока - громко
            
            // Звуки сбора
            ['coin', 35],         // Монеты - приятно
            ['powerup', 55],      // Усиления - заметно
            
            // Звуки врагов  
            ['enemy_hurt', 45],   // Урон врага - средне
            ['enemy_death', 50],  // Смерть врага - заметно
            
            // Звуки окружения
            ['portal', 30],       // Портал - атмосферно
            ['lava_bubble', 25]   // Лава - тихо
        ]);
        
        defaults.forEach((value, key) => {
            if (!this.individualVolumes.has(key)) {
                this.individualVolumes.set(key, value);
            }
        });
        
        // Сохраняем если были добавлены новые значения
        if (!localStorage.getItem('soundSettings')) {
            this.musicVolume = 0.15;  // 15% - музыка тише
            this.sfxVolume = 0.3;     // 30% - звуки умеренно
            this.isMuted = false;
            this.saveSettings();
        }
    }

    private saveSettings(): void {
        // Конвертируем Map в объект для сохранения
        const individualVolumesObj: { [key: string]: number } = {};
        this.individualVolumes.forEach((value, key) => {
            individualVolumesObj[key] = value;
        });
        
        localStorage.setItem('soundSettings', JSON.stringify({
            musicVolume: this.musicVolume,
            sfxVolume: this.sfxVolume,
            isMuted: this.isMuted,
            individualVolumes: individualVolumesObj
        }));
    }

    // Метод удалён - звуки загружаются в PreloadScene

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
            } else {
                console.warn(`SoundSystem: Звук "${key}" не найден в кэше!`);
            }
        });
    }

    public playSound(key: string, config?: Phaser.Types.Sound.SoundConfig): void {
        // Проверяем и возобновляем Audio Context если нужно
        this.ensureAudioContext();
        
        if (this.isMuted) return;

        // Получаем сбалансированную громкость для данного звука
        const balancedVolume = this.getBalancedVolume(key, config?.volume);
        const finalConfig = { ...config, volume: balancedVolume };

        const sound = this.sounds.get(key);
        if (sound) {
            sound.play(finalConfig);
        } else if (this.scene.cache.audio.exists(key)) {
            // Если звук не был предзагружен, создаём его на лету
            this.scene.sound.play(key, finalConfig);
        } else {
            console.warn(`SoundSystem: Звук "${key}" не найден!`);
        }
    }
    
    private getBalancedVolume(soundKey: string, customVolume?: number): number {
        // Если указана кастомная громкость, используем её
        if (customVolume !== undefined) {
            return customVolume * this.sfxVolume; // Применяем общий множитель
        }
        
        // Получаем индивидуальную громкость для данного звука (0-100)
        const individualVolume = this.individualVolumes.get(soundKey) ?? 50;
        
        // Конвертируем из процентов (0-100) в множитель (0-1) и применяем общую громкость
        return (individualVolume / 100) * this.sfxVolume;
    }
    
    private ensureAudioContext(): void {
        if (this.scene.sound.context && (this.scene.sound.context as any).state === 'suspended') {
            (this.scene.sound.context as any).resume();
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
    
    public setIndividualVolume(soundKey: string, volume: number): void {
        // volume приходит в процентах (0-100)
        this.individualVolumes.set(soundKey, Phaser.Math.Clamp(volume, 0, 100));
        this.saveSettings();
    }
    
    public getIndividualVolume(soundKey: string): number {
        return this.individualVolumes.get(soundKey) ?? 50;
    }
    
    public getAllIndividualVolumes(): Map<string, number> {
        return new Map(this.individualVolumes);
    }
    
    public resetIndividualVolumes(): void {
        this.individualVolumes.clear();
        this.initializeDefaultVolumes();
        this.saveSettings();
    }

    public destroy(): void {
        this.stopMusic();
        this.sounds.clear();
    }
}