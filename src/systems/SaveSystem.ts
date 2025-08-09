import localforage from 'localforage';

interface SaveData {
    level: string;
    score: number;
    lives: number;
    checkpointX: number;
    checkpointY: number;
    timestamp: number;
    unlockedLevels?: string[];
    achievements?: string[];
    totalPlayTime?: number;
    highScores?: { [key: string]: number };
    settings?: GameSettings;
}

interface GameSettings {
    masterVolume: number;
    musicVolume: number;
    sfxVolume: number;
    language: string;
    controls: ControlMapping;
}

interface ControlMapping {
    left: string;
    right: string;
    jump: string;
    crouch: string;
    attack: string;
}

export class SaveSystem {
    private static instance: SaveSystem;
    private storage: LocalForage;
    private currentSave: SaveData | null = null;
    private autoSaveInterval: number = 60000; // 1 минута
    private maxSaveSlots: number = 3;

    private constructor() {
        // Настраиваем localforage
        this.storage = localforage.createInstance({
            name: 'SuperAdventureGame',
            storeName: 'saves',
            description: 'Game save data storage'
        });
        
        this.initializeStorage();
    }

    public static getInstance(): SaveSystem {
        if (!SaveSystem.instance) {
            SaveSystem.instance = new SaveSystem();
        }
        return SaveSystem.instance;
    }

    private async initializeStorage(): Promise<void> {
        try {
            // Проверяем доступность storage
            await this.storage.ready();
            console.log('Система сохранения инициализирована');
            
            // Загружаем последнее сохранение
            await this.loadLastSave();
        } catch (error) {
            console.error('Ошибка инициализации системы сохранения:', error);
        }
    }

    // Статические методы для обратной совместимости
    public static save(data: SaveData): Promise<boolean> {
        return SaveSystem.getInstance().saveGame(data);
    }

    public static load(): SaveData | null {
        return SaveSystem.getInstance().getCurrentSave();
    }

    public static async loadSlot(slotIndex: number): Promise<SaveData | null> {
        return SaveSystem.getInstance().loadSaveSlot(slotIndex);
    }

    public static async deleteSlot(slotIndex: number): Promise<boolean> {
        return SaveSystem.getInstance().deleteSaveSlot(slotIndex);
    }

    // Основные методы
    public async saveGame(data: SaveData, slotIndex: number = 0): Promise<boolean> {
        try {
            const saveKey = `save_slot_${slotIndex}`;
            data.timestamp = Date.now();
            
            await this.storage.setItem(saveKey, data);
            this.currentSave = data;
            
            // Сохраняем метаданные
            await this.updateSaveMetadata(slotIndex, data);
            
            console.log(`Игра сохранена в слот ${slotIndex}`);
            return true;
        } catch (error) {
            console.error('Ошибка сохранения:', error);
            return false;
        }
    }

    public async loadSaveSlot(slotIndex: number): Promise<SaveData | null> {
        try {
            const saveKey = `save_slot_${slotIndex}`;
            const data = await this.storage.getItem<SaveData>(saveKey);
            
            if (data) {
                this.currentSave = data;
                console.log(`Загружено сохранение из слота ${slotIndex}`);
            }
            
            return data;
        } catch (error) {
            console.error('Ошибка загрузки:', error);
            return null;
        }
    }

    public async deleteSaveSlot(slotIndex: number): Promise<boolean> {
        try {
            const saveKey = `save_slot_${slotIndex}`;
            await this.storage.removeItem(saveKey);
            
            // Удаляем метаданные
            await this.removeSaveMetadata(slotIndex);
            
            console.log(`Сохранение в слоте ${slotIndex} удалено`);
            return true;
        } catch (error) {
            console.error('Ошибка удаления:', error);
            return false;
        }
    }

    public async getAllSaveSlots(): Promise<{ [key: number]: SaveData | null }> {
        const saves: { [key: number]: SaveData | null } = {};
        
        for (let i = 0; i < this.maxSaveSlots; i++) {
            saves[i] = await this.loadSaveSlot(i);
        }
        
        return saves;
    }

    public getCurrentSave(): SaveData | null {
        return this.currentSave;
    }

    private async loadLastSave(): Promise<void> {
        try {
            const metadata = await this.storage.getItem<any>('save_metadata');
            
            if (metadata && metadata.lastUsedSlot !== undefined) {
                await this.loadSaveSlot(metadata.lastUsedSlot);
            }
        } catch (error) {
            console.error('Ошибка загрузки последнего сохранения:', error);
        }
    }

    private async updateSaveMetadata(slotIndex: number, data: SaveData): Promise<void> {
        try {
            let metadata = await this.storage.getItem<any>('save_metadata') || {};
            
            if (!metadata.slots) {
                metadata.slots = {};
            }
            
            metadata.slots[slotIndex] = {
                level: data.level,
                score: data.score,
                timestamp: data.timestamp,
                playTime: data.totalPlayTime || 0
            };
            
            metadata.lastUsedSlot = slotIndex;
            metadata.lastSaveTime = Date.now();
            
            await this.storage.setItem('save_metadata', metadata);
        } catch (error) {
            console.error('Ошибка обновления метаданных:', error);
        }
    }

    private async removeSaveMetadata(slotIndex: number): Promise<void> {
        try {
            const metadata = await this.storage.getItem<any>('save_metadata');
            
            if (metadata && metadata.slots) {
                delete metadata.slots[slotIndex];
                
                if (metadata.lastUsedSlot === slotIndex) {
                    metadata.lastUsedSlot = null;
                }
                
                await this.storage.setItem('save_metadata', metadata);
            }
        } catch (error) {
            console.error('Ошибка удаления метаданных:', error);
        }
    }

    // Методы для сохранения настроек
    public async saveSettings(settings: GameSettings): Promise<boolean> {
        try {
            await this.storage.setItem('game_settings', settings);
            console.log('Настройки сохранены');
            return true;
        } catch (error) {
            console.error('Ошибка сохранения настроек:', error);
            return false;
        }
    }

    public async loadSettings(): Promise<GameSettings | null> {
        try {
            return await this.storage.getItem<GameSettings>('game_settings');
        } catch (error) {
            console.error('Ошибка загрузки настроек:', error);
            return null;
        }
    }

    // Методы для достижений
    public async unlockAchievement(achievementId: string): Promise<void> {
        try {
            if (this.currentSave) {
                if (!this.currentSave.achievements) {
                    this.currentSave.achievements = [];
                }
                
                if (!this.currentSave.achievements.includes(achievementId)) {
                    this.currentSave.achievements.push(achievementId);
                    await this.saveGame(this.currentSave);
                    console.log(`Достижение разблокировано: ${achievementId}`);
                }
            }
        } catch (error) {
            console.error('Ошибка разблокировки достижения:', error);
        }
    }

    public async updateHighScore(level: string, score: number): Promise<void> {
        try {
            if (this.currentSave) {
                if (!this.currentSave.highScores) {
                    this.currentSave.highScores = {};
                }
                
                if (!this.currentSave.highScores[level] || score > this.currentSave.highScores[level]) {
                    this.currentSave.highScores[level] = score;
                    await this.saveGame(this.currentSave);
                    console.log(`Новый рекорд для ${level}: ${score}`);
                }
            }
        } catch (error) {
            console.error('Ошибка обновления рекорда:', error);
        }
    }

    // Очистка всех данных
    public async clearAllData(): Promise<boolean> {
        try {
            await this.storage.clear();
            this.currentSave = null;
            console.log('Все данные очищены');
            return true;
        } catch (error) {
            console.error('Ошибка очистки данных:', error);
            return false;
        }
    }
}