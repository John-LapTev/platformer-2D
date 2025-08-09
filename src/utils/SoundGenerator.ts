export class SoundGenerator {
    private audioContext: AudioContext;

    constructor() {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    // Генерация звука прыжка
    public async generateJump(): Promise<AudioBuffer> {
        const duration = 0.2;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            // Восходящий свип частоты
            const frequency = 200 + (600 * t);
            const envelope = Math.exp(-5 * t);
            data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.3;
        }

        return buffer;
    }

    // Генерация звука приземления
    public async generateLand(): Promise<AudioBuffer> {
        const duration = 0.15;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            // Низкий удар
            const frequency = 80 - (30 * t);
            const envelope = Math.exp(-10 * t);
            const noise = (Math.random() - 0.5) * 0.1;
            data[i] = (Math.sin(2 * Math.PI * frequency * t) + noise) * envelope * 0.4;
        }

        return buffer;
    }

    // Генерация звука сбора монеты
    public async generateCoin(): Promise<AudioBuffer> {
        const duration = 0.5;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            // Две гармоники для приятного звучания
            const freq1 = 800;
            const freq2 = 1200;
            const envelope = Math.exp(-3 * t);
            
            const wave1 = Math.sin(2 * Math.PI * freq1 * t);
            const wave2 = Math.sin(2 * Math.PI * freq2 * t);
            
            data[i] = (wave1 * 0.5 + wave2 * 0.5) * envelope * 0.3;
        }

        return buffer;
    }

    // Генерация звука PowerUp
    public async generatePowerUp(): Promise<AudioBuffer> {
        const duration = 0.8;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            // Восходящий арпеджио
            const step = Math.floor(t * 8) % 4;
            const frequencies = [400, 500, 600, 800];
            const frequency = frequencies[step];
            const envelope = 1 - (t / duration);
            
            data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.3;
        }

        return buffer;
    }

    // Генерация звука получения урона
    public async generateHurt(): Promise<AudioBuffer> {
        const duration = 0.3;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            // Низкая частота с шумом
            const frequency = 150 - (50 * t);
            const envelope = Math.exp(-5 * t);
            const noise = (Math.random() - 0.5);
            
            data[i] = (Math.sin(2 * Math.PI * frequency * t) * 0.5 + noise * 0.5) * envelope * 0.4;
        }

        return buffer;
    }

    // Генерация звука шагов
    public async generateFootstep(): Promise<AudioBuffer> {
        const duration = 0.1;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            // Короткий щелчок с шумом
            const envelope = Math.exp(-50 * t);
            const noise = (Math.random() - 0.5);
            
            data[i] = noise * envelope * 0.2;
        }

        return buffer;
    }

    // Генерация звука портала
    public async generatePortal(): Promise<AudioBuffer> {
        const duration = 1.5;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            // Космический свуш
            const frequency = 300 + Math.sin(t * 5) * 100;
            const envelope = Math.sin(Math.PI * t / duration);
            const resonance = Math.sin(2 * Math.PI * frequency * t);
            const harmonics = Math.sin(4 * Math.PI * frequency * t) * 0.3;
            
            data[i] = (resonance + harmonics) * envelope * 0.3;
        }

        return buffer;
    }

    // Генерация пузырьков лавы
    public async generateLavaBubble(): Promise<AudioBuffer> {
        const duration = 0.4;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            // Булькающий звук
            const frequency = 100 + Math.sin(t * 20) * 50;
            const envelope = Math.exp(-3 * t);
            const bubble = Math.sin(2 * Math.PI * frequency * t);
            const pop = t > 0.3 ? (Math.random() - 0.5) * Math.exp(-20 * (t - 0.3)) : 0;
            
            data[i] = (bubble * 0.7 + pop * 0.3) * envelope * 0.3;
        }

        return buffer;
    }

    // Конвертация AudioBuffer в Blob для сохранения
    private audioBufferToWav(buffer: AudioBuffer): Blob {
        const length = buffer.length * buffer.numberOfChannels * 2 + 44;
        const arrayBuffer = new ArrayBuffer(length);
        const view = new DataView(arrayBuffer);
        const channels: Float32Array[] = [];
        let offset = 0;
        let pos = 0;

        // Записываем WAVE header
        const setUint16 = (data: number) => {
            view.setUint16(pos, data, true);
            pos += 2;
        };
        const setUint32 = (data: number) => {
            view.setUint32(pos, data, true);
            pos += 4;
        };

        // RIFF identifier
        setUint32(0x46464952);
        // file length
        setUint32(length - 8);
        // RIFF type
        setUint32(0x45564157);
        // format chunk identifier
        setUint32(0x20746d66);
        // format chunk length
        setUint32(16);
        // sample format (PCM)
        setUint16(1);
        // channel count
        setUint16(buffer.numberOfChannels);
        // sample rate
        setUint32(buffer.sampleRate);
        // byte rate
        setUint32(buffer.sampleRate * buffer.numberOfChannels * 2);
        // block align
        setUint16(buffer.numberOfChannels * 2);
        // bits per sample
        setUint16(16);
        // data chunk identifier
        setUint32(0x61746164);
        // data chunk length
        setUint32(length - pos - 4);

        // Записываем аудио данные
        for (let i = 0; i < buffer.numberOfChannels; i++) {
            channels.push(buffer.getChannelData(i));
        }

        while (pos < length) {
            for (let i = 0; i < buffer.numberOfChannels; i++) {
                const sample = Math.max(-1, Math.min(1, channels[i][offset]));
                view.setInt16(pos, sample * 0x7FFF, true);
                pos += 2;
            }
            offset++;
        }

        return new Blob([arrayBuffer], { type: 'audio/wav' });
    }

    // Сохранение сгенерированного звука
    public async saveSound(buffer: AudioBuffer, filename: string): Promise<void> {
        const blob = this.audioBufferToWav(buffer);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    // Генерация всех звуков
    public async generateAllSounds(): Promise<Map<string, AudioBuffer>> {
        const sounds = new Map<string, AudioBuffer>();
        
        sounds.set('jump', await this.generateJump());
        sounds.set('land', await this.generateLand());
        sounds.set('coin', await this.generateCoin());
        sounds.set('powerup', await this.generatePowerUp());
        sounds.set('hurt', await this.generateHurt());
        sounds.set('footstep', await this.generateFootstep());
        sounds.set('portal', await this.generatePortal());
        sounds.set('lava_bubble', await this.generateLavaBubble());
        
        return sounds;
    }
}