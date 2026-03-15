import { useState, useCallback, useRef, useEffect } from 'react';

export type VoiceLanguage = 'en-US' | 'ro-RO' | 'de-DE' | 'fr-FR' | 'es-ES' | 'it-IT' | 'pt-PT';

export interface VoiceCommand {
  command: string;
  action: () => void;
  description: string;
}

export interface VoiceState {
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  language: VoiceLanguage;
  supported: boolean;
}

export interface VoiceOptions {
  language?: VoiceLanguage;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

// Speech Recognition wrapper
class SpeechRecognitionManager {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private recognition: any = null;
  private isListening = false;
  private options: VoiceOptions;

  constructor(options: VoiceOptions = {}) {
    this.options = options;
    this.init();
  }

  private init() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech Recognition not supported');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.lang = this.options.language || 'en-US';
    this.recognition.continuous = this.options.continuous ?? true;
    this.recognition.interimResults = this.options.interimResults ?? true;
    this.recognition.maxAlternatives = this.options.maxAlternatives || 1;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.options.onStart?.();
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.options.onEnd?.();
      // Auto-restart if continuous mode
      if (this.options.continuous && this.recognition) {
        setTimeout(() => this.start(), 100);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        this.options.onResult?.(finalTranscript, true);
      }
      if (interimTranscript) {
        this.options.onResult?.(interimTranscript, false);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.recognition.onerror = (event: any) => {
      this.options.onError?.(event.error);
    };
  }

  start() {
    if (this.recognition && !this.isListening) {
      try {
        this.recognition.start();
      } catch (e) {
        console.error('Failed to start recognition:', e);
      }
    }
  }

  stop() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  abort() {
    if (this.recognition && this.isListening) {
      this.recognition.abort();
    }
  }

  setLanguage(lang: VoiceLanguage) {
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  isSupported() {
    return !!this.recognition;
  }
}

// Speech Synthesis wrapper
class SpeechSynthesisManager {
  private synthesis: SpeechSynthesis;
  private voices: SpeechSynthesisVoice[] = [];
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeaking = false;

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.loadVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = () => this.loadVoices();
    }
  }

  private loadVoices() {
    this.voices = this.synthesis.getVoices();
  }

  speak(text: string, lang: VoiceLanguage = 'en-US', rate: number = 1, pitch: number = 1) {
    if (this.synthesis.speaking) {
      this.synthesis.cancel();
    }

    this.currentUtterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance.lang = lang;
    this.currentUtterance.rate = rate;
    this.currentUtterance.pitch = pitch;

    // Try to find a voice for the language
    const voice = this.voices.find(v => v.lang.startsWith(lang.split('-')[0]));
    if (voice) {
      this.currentUtterance.voice = voice;
    }

    this.currentUtterance.onstart = () => {
      this.isSpeaking = true;
    };

    this.currentUtterance.onend = () => {
      this.isSpeaking = false;
    };

    this.currentUtterance.onerror = () => {
      this.isSpeaking = false;
    };

    this.synthesis.speak(this.currentUtterance);
  }

  stop() {
    this.synthesis.cancel();
    this.isSpeaking = false;
  }

  pause() {
    this.synthesis.pause();
  }

  resume() {
    this.synthesis.resume();
  }

  isSpeakingNow() {
    return this.synthesis.speaking;
  }

  getVoices() {
    return this.voices;
  }
}

// Main hook
export function useVoice(options: VoiceOptions = {}) {
  const [state, setState] = useState<VoiceState>({
    isListening: false,
    isSpeaking: false,
    transcript: '',
    interimTranscript: '',
    error: null,
    language: options.language || 'en-US',
    supported: typeof window !== 'undefined' && 
               ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  });

  const recognitionRef = useRef<SpeechRecognitionManager | null>(null);
  const synthesisRef = useRef<SpeechSynthesisManager | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    recognitionRef.current = new SpeechRecognitionManager({
      ...options,
      onResult: (transcript, isFinal) => {
        if (isFinal) {
          setState(prev => ({ ...prev, transcript, interimTranscript: '' }));
        } else {
          setState(prev => ({ ...prev, interimTranscript: transcript }));
        }
        options.onResult?.(transcript, isFinal);
      },
      onError: (error) => {
        setState(prev => ({ ...prev, error, isListening: false }));
        options.onError?.(error);
      },
      onStart: () => {
        setState(prev => ({ ...prev, isListening: true, error: null }));
        options.onStart?.();
      },
      onEnd: () => {
        setState(prev => ({ ...prev, isListening: false }));
        options.onEnd?.();
      }
    });

    synthesisRef.current = new SpeechSynthesisManager();

    return () => {
      recognitionRef.current?.abort();
      synthesisRef.current?.stop();
    };
  }, []);

  const startListening = useCallback(() => {
    recognitionRef.current?.start();
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const abortListening = useCallback(() => {
    recognitionRef.current?.abort();
  }, []);

  const speak = useCallback((text: string, rate?: number, pitch?: number) => {
    synthesisRef.current?.speak(text, state.language, rate, pitch);
    setState(prev => ({ ...prev, isSpeaking: true }));
    setTimeout(() => {
      setState(prev => ({ ...prev, isSpeaking: false }));
    }, 100);
  }, [state.language]);

  const stopSpeaking = useCallback(() => {
    synthesisRef.current?.stop();
    setState(prev => ({ ...prev, isSpeaking: false }));
  }, []);

  const setLanguage = useCallback((language: VoiceLanguage) => {
    setState(prev => ({ ...prev, language }));
    recognitionRef.current?.setLanguage(language);
  }, []);

  const clearTranscript = useCallback(() => {
    setState(prev => ({ ...prev, transcript: '', interimTranscript: '' }));
  }, []);

  return {
    ...state,
    startListening,
    stopListening,
    abortListening,
    speak,
    stopSpeaking,
    setLanguage,
    clearTranscript
  };
}

export default useVoice;
