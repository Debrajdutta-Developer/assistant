import { TalkingHead } from '@met4citizen/talkinghead';

export const MAYRA_STATES = Object.freeze({
  IDLE: 'idle',
  LISTENING: 'listening',
  THINKING: 'thinking',
  SPEAKING: 'speaking',
  INTERRUPTED: 'interrupted',
  OFFLINE: 'offline'
});

/**
 * Browser/native-webview presentation runtime for Mayra.
 * The AI remains outside this module. Gemini Live owns conversation/audio;
 * Nexus owns tools. This module only renders and animates the human avatar.
 */
export class MayraRuntime {
  constructor(container, options = {}) {
    if (!container) throw new Error('MayraRuntime requires an avatar container.');

    this.container = container;
    this.state = MAYRA_STATES.IDLE;
    this.head = new TalkingHead(container, {
      avatarMood: 'neutral',
      cameraRotateEnable: false,
      cameraPanEnable: false,
      cameraZoomEnable: false,
      avatarOnly: false,
      lightAmbientIntensity: options.ambient ?? 1.8,
      lightDirectIntensity: options.direct ?? 18,
      lightSpotIntensity: 0,
      mixerGainSpeech: options.speechGain ?? 1
    });
  }

  async load(assetUrl) {
    if (!assetUrl) throw new Error('Mayra avatar asset URL is required.');

    await this.head.showAvatar({
      url: assetUrl,
      body: 'F',
      avatarMood: 'neutral',
      lipsyncLang: 'en',
      avatarListeningEyeContact: 0.85,
      avatarSpeakingHeadMove: 0.35,
      avatarIgnoreCamera: false
    });

    this.head.setView('upper');
    this.head.lookAtCamera(500);
    this.setState(MAYRA_STATES.IDLE);
  }

  setState(next) {
    this.state = next;

    const mood = {
      [MAYRA_STATES.IDLE]: 'neutral',
      [MAYRA_STATES.LISTENING]: 'neutral',
      [MAYRA_STATES.THINKING]: 'neutral',
      [MAYRA_STATES.SPEAKING]: 'happy',
      [MAYRA_STATES.INTERRUPTED]: 'neutral',
      [MAYRA_STATES.OFFLINE]: 'sad'
    }[next] ?? 'neutral';

    this.head.setMood(mood);

    if (next === MAYRA_STATES.LISTENING || next === MAYRA_STATES.SPEAKING) {
      this.head.lookAtCamera(next === MAYRA_STATES.SPEAKING ? 450 : 350);
    }
  }

  startListening() {
    this.setState(MAYRA_STATES.LISTENING);
  }

  startThinking() {
    this.setState(MAYRA_STATES.THINKING);
  }

  /**
   * Start the TalkingHead streaming audio path. Feed Gemini Live PCM chunks
   * to the returned session using the streamAudio API exposed by TalkingHead.
   */
  startSpeech(options = {}) {
    this.setState(MAYRA_STATES.SPEAKING);
    this.head.streamStart({
      sampleRate: options.sampleRate ?? 24000,
      gain: options.gain ?? 1,
      lipsyncLang: options.lipsyncLang ?? 'en'
    });
  }

  feedSpeechChunk(chunk) {
    if (this.state !== MAYRA_STATES.SPEAKING) this.startSpeech();
    this.head.streamAudio(chunk);
  }

  finishSpeech() {
    this.head.streamNotifyEnd();
    this.setState(MAYRA_STATES.IDLE);
  }

  interrupt() {
    this.head.streamInterrupt();
    this.setState(MAYRA_STATES.INTERRUPTED);
  }

  dispose() {
    this.head.stop();
    this.head.dispose?.();
  }
}
