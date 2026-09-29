import { TalkingHead } from '@met4citizen/talkinghead';

export type MayraState =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'interrupted'
  | 'offline';

export interface MayraAvatarOptions {
  container: HTMLElement;
  assetUrl?: string;
}

/**
 * Human-avatar presentation layer for Mayra.
 * Gemini Live supplies the brain/audio; Nexus remains the orchestrator.
 * This class owns only avatar state, camera, mood and speech animation.
 */
export class MayraAvatar {
  private readonly head: TalkingHead;
  private state: MayraState = 'idle';

  constructor(options: MayraAvatarOptions) {
    this.head = new TalkingHead(options.container, {
      avatarMood: 'neutral',
      cameraRotateEnable: false,
      cameraPanEnable: false,
      cameraZoomEnable: false,
      lightAmbientIntensity: 1.8,
      lightDirectIntensity: 18,
      lightSpotIntensity: 0,
      mixerGainSpeech: 1.0,
    });

    if (options.assetUrl) {
      void this.load(options.assetUrl);
    }
  }

  async load(assetUrl: string) {
    await this.head.showAvatar({
      url: assetUrl,
      body: 'F',
      avatarMood: 'neutral',
      lipsyncLang: 'en',
      avatarListeningEyeContact: 0.85,
      avatarSpeakingHeadMove: 0.35,
      avatarIgnoreCamera: false,
    });
    this.head.setView('upper');
    this.head.lookAtCamera(500);
  }

  setState(state: MayraState) {
    this.state = state;

    switch (state) {
      case 'listening':
        this.head.setMood('neutral');
        this.head.lookAtCamera(350);
        break;
      case 'thinking':
        this.head.setMood('neutral');
        break;
      case 'speaking':
        this.head.setMood('happy');
        this.head.lookAtCamera(450);
        break;
      case 'interrupted':
        this.head.setMood('neutral');
        break;
      case 'offline':
        this.head.setMood('sad');
        break;
      default:
        this.head.setMood('neutral');
    }
  }

  getState() {
    return this.state;
  }

  /** Feed Gemini Live PCM/viseme output into the avatar when available. */
  speakAudio(audio: Parameters<TalkingHead['speakAudio']>[0]) {
    this.setState('speaking');
    this.head.speakAudio(audio, {}, undefined);
  }

  interrupt() {
    this.setState('interrupted');
    this.head.streamInterrupt?.();
  }

  dispose() {
    this.head.stop();
  }
}
