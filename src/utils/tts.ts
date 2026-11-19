import type { ExamPart, ExamQuestion, TtsAccent, TtsPlaybackState } from '../types/exam';

class TtsEngine {
  private cancelToken = 0;
  private state: TtsPlaybackState = {
    playingKey: null,
    stageLabel: null,
    progressPct: 0,
  };
  private listeners = new Set<(state: TtsPlaybackState) => void>();

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public warmup(): void {
    if (this.isSupported()) {
      window.speechSynthesis.getVoices();
    }
  }

  public subscribe(listener: (state: TtsPlaybackState) => void): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private setState(next: TtsPlaybackState) {
    this.state = next;
    this.listeners.forEach((fn) => fn(next));
  }

  public getState(): TtsPlaybackState {
    return this.state;
  }

  public getPlayingKey(): string | null {
    return this.state.playingKey;
  }

  public stop(): void {
    this.cancelToken++;
    this.setState({
      playingKey: null,
      stageLabel: null,
      progressPct: 0,
    });
    if (this.isSupported()) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore synthesis cancel errors
      }
    }
  }

  private pickVoice(role: 'male' | 'female' | 'narrator', accent: TtsAccent): SpeechSynthesisVoice | null {
    if (!this.isSupported()) return null;
    const voices = window.speechSynthesis.getVoices() || [];
    const langPrefix = accent.toLowerCase();
    const matching = voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith(langPrefix));
    const pool =
      matching.length > 0
        ? matching
        : voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith('en'));

    if (pool.length === 0) return null;

    if (role === 'male') {
      const male = pool.find((v) => /male|daniel|george|david|mark|alex|arthur|ryan|guy/i.test(v.name));
      return male || pool[0];
    }
    if (role === 'female') {
      const female = pool.find((v) =>
        /female|samantha|victoria|martha|karen|zira|hazel|susan|jenny|sonia|libby/i.test(v.name)
      );
      return female || pool[pool.length > 1 ? 1 : 0];
    }
    return pool[0];
  }

  private speakLine(
    text: string,
    role: 'male' | 'female' | 'narrator',
    accent: TtsAccent,
    rate: number,
    token: number
  ): Promise<void> {
    return new Promise((resolve) => {
      if (token !== this.cancelToken || !this.isSupported()) {
        resolve();
        return;
      }
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = accent;
      utter.rate = rate;
      utter.pitch = role === 'male' ? 0.92 : role === 'female' ? 1.08 : 1.0;
      const voice = this.pickVoice(role, accent);
      if (voice) utter.voice = voice;
      utter.onend = () => resolve();
      utter.onerror = () => resolve();
      try {
        window.speechSynthesis.speak(utter);
      } catch {
        resolve();
      }
    });
  }

  private waitMs(ms: number, token: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(), token === this.cancelToken ? ms : 0);
    });
  }

  public async playQuestion(
    q: ExamQuestion,
    accent: TtsAccent,
    rate: number,
    playTwice = true
  ): Promise<boolean> {
    if (!this.isSupported()) return false;
    const key = `q_${q.id}`;
    if (this.state.playingKey === key) {
      this.stop();
      return true;
    }

    this.stop();
    const token = ++this.cancelToken;
    const dialogue = q.ttsDialogue || [];
    const rounds = playTwice ? 2 : 1;
    const totalSteps = 1 + rounds * Math.max(1, dialogue.length) + (playTwice ? 1 : 0);
    let currentStep = 0;

    const updateStage = (stageLabel: string) => {
      if (token !== this.cancelToken) return;
      currentStep++;
      const pct = Math.min(100, Math.max(8, Math.round((currentStep / totalSteps) * 100)));
      this.setState({
        playingKey: key,
        stageLabel,
        progressPct: pct,
      });
    };

    updateStage('Đang đọc đề...');
    await this.speakLine(`Question ${q.num}. ${q.prompt || ''}`, 'narrator', accent, rate, token);
    await this.waitMs(650, token);

    for (let r = 0; r < rounds; r++) {
      if (token !== this.cancelToken) break;
      if (r === 1) {
        await this.waitMs(850, token);
        updateStage('Now listen again...');
        await this.speakLine('Now listen again.', 'narrator', accent, rate, token);
        await this.waitMs(550, token);
      }
      const roundLabel = rounds > 1 ? `Lượt ${r + 1}/${rounds}` : 'Lượt 1/1';
      if (dialogue.length === 0) {
        updateStage(roundLabel);
      }
      for (const line of dialogue) {
        if (token !== this.cancelToken) break;
        updateStage(roundLabel);
        await this.speakLine(line.text, line.role, accent, rate, token);
        await this.waitMs(340, token);
      }
    }

    if (token === this.cancelToken) {
      this.setState({
        playingKey: null,
        stageLabel: null,
        progressPct: 0,
      });
    }
    return true;
  }

  public async playPart(part: ExamPart, accent: TtsAccent, rate: number): Promise<boolean> {
    if (!this.isSupported()) return false;
    const key = `part_${part.id}`;
    if (this.state.playingKey === key) {
      this.stop();
      return true;
    }

    this.stop();
    const token = ++this.cancelToken;
    const totalQ = Math.max(1, part.questions.length);

    this.setState({
      playingKey: key,
      stageLabel: 'Đang đọc tiêu đề...',
      progressPct: 5,
    });

    await this.speakLine(part.title, 'narrator', accent, rate, token);
    await this.waitMs(750, token);

    for (let qIdx = 0; qIdx < part.questions.length; qIdx++) {
      const q = part.questions[qIdx];
      if (token !== this.cancelToken) break;

      const basePct = Math.round((qIdx / totalQ) * 100);
      this.setState({
        playingKey: key,
        stageLabel: `Câu ${q.num} · Đang đọc đề...`,
        progressPct: Math.max(8, basePct),
      });

      await this.speakLine(`Number ${q.num}. ${q.prompt || ''}`, 'narrator', accent, rate, token);
      await this.waitMs(650, token);

      for (let r = 0; r < 2; r++) {
        if (token !== this.cancelToken) break;
        if (r === 1) {
          await this.waitMs(750, token);
          this.setState({
            playingKey: key,
            stageLabel: `Câu ${q.num} · Now listen again...`,
            progressPct: Math.min(98, basePct + Math.round(50 / totalQ)),
          });
          await this.speakLine('Now listen again.', 'narrator', accent, rate, token);
          await this.waitMs(480, token);
        }
        this.setState({
          playingKey: key,
          stageLabel: `Câu ${q.num} · Lượt ${r + 1}/2`,
          progressPct: Math.min(98, basePct + Math.round(((r + 0.5) / 2) * (100 / totalQ))),
        });
        for (const line of q.ttsDialogue || []) {
          if (token !== this.cancelToken) break;
          await this.speakLine(line.text, line.role, accent, rate, token);
          await this.waitMs(320, token);
        }
      }
      await this.waitMs(1100, token);
    }

    if (token === this.cancelToken) {
      this.setState({
        playingKey: null,
        stageLabel: null,
        progressPct: 0,
      });
    }
    return true;
  }
}

export const ttsEngine = new TtsEngine();
