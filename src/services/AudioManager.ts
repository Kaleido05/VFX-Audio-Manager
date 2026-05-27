/**
 * AudioManager — 统一管理音频播放状态。
 * 封装 HTML5 Audio API，同一时间仅允许播放一个音频。
 */

type AudioEventCallback = () => void;

class AudioManager {
  private audio: HTMLAudioElement | null = null;
  private currentPath: string | null = null;
  private onTimeUpdate: ((currentTime: number) => void) | null = null;
  private onDurationChange: ((duration: number) => void) | null = null;
  private onEnded: AudioEventCallback | null = null;
  private onError: ((message: string) => void) | null = null;

  /**
   * 加载并播放指定音频文件。
   */
  play(filePath: string): void {
    // 停止当前播放
    this.stop();

    this.audio = new Audio();
    this.audio.src = `file:///${filePath.replace(/\\/g, '/')}`;
    this.audio.volume = this.audio.volume; // 保持默认音量，后续由外部设置
    this.currentPath = filePath;

    this.audio.addEventListener('loadedmetadata', () => {
      if (this.audio && this.onDurationChange) {
        this.onDurationChange(this.audio.duration || 0);
      }
    });

    this.audio.addEventListener('timeupdate', () => {
      if (this.audio && this.onTimeUpdate) {
        this.onTimeUpdate(this.audio.currentTime);
      }
    });

    this.audio.addEventListener('ended', () => {
      this.currentPath = null;
      if (this.onEnded) this.onEnded();
    });

    this.audio.addEventListener('error', () => {
      const errMsg = `无法播放音频: ${filePath}`;
      console.error(errMsg);
      if (this.onError) this.onError(errMsg);
    });

    this.audio.play().catch((err) => {
      console.error('Playback failed:', err);
      if (this.onError) this.onError(`播放失败: ${err.message}`);
    });
  }

  /**
   * 暂停当前播放。
   */
  pause(): void {
    if (this.audio) {
      this.audio.pause();
    }
  }

  /**
   * 恢复播放。
   */
  resume(): void {
    if (this.audio) {
      this.audio.play().catch(console.error);
    }
  }

  /**
   * 停止播放并清理资源。
   */
  stop(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.removeAttribute('src');
      this.audio.load();
      this.audio = null;
      this.currentPath = null;
    }
  }

  /**
   * 跳转到指定时间（秒）。
   */
  seek(time: number): void {
    if (this.audio) {
      this.audio.currentTime = Math.max(0, Math.min(time, this.audio.duration || 0));
    }
  }

  /**
   * 设置音量 (0.0 ~ 1.0)。
   */
  setVolume(volume: number): void {
    if (this.audio) {
      this.audio.volume = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * 设置播放速度 (0.5 ~ 2.0).
   */
  setPlaybackRate(rate: number): void {
    if (this.audio) {
      this.audio.playbackRate = Math.max(0.5, Math.min(2.0, rate));
    }
  }

  /**
   * 获取当前播放的音频路径。
   */
  getCurrentPath(): string | null {
    return this.currentPath;
  }

  /**
   * 是否正在播放。
   */
  isPlaying(): boolean {
    return this.audio !== null && !this.audio.paused;
  }

  /**
   * 注册事件回调。
   */
  on(event: 'timeupdate', cb: (currentTime: number) => void): void;
  on(event: 'durationchange', cb: (duration: number) => void): void;
  on(event: 'ended', cb: AudioEventCallback): void;
  on(event: 'error', cb: (message: string) => void): void;
  on(
    event: string,
    cb: ((...args: never[]) => void) | AudioEventCallback
  ): void {
    switch (event) {
      case 'timeupdate':
        this.onTimeUpdate = cb as (currentTime: number) => void;
        break;
      case 'durationchange':
        this.onDurationChange = cb as (duration: number) => void;
        break;
      case 'ended':
        this.onEnded = cb as AudioEventCallback;
        break;
      case 'error':
        this.onError = cb as (message: string) => void;
        break;
    }
  }
}

// 单例导出
export const audioManager = new AudioManager();
