import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Play,
  Pause,
  Trash2,
  AlertCircle,
  RotateCcw,
  RotateCw,
  Clock
} from 'lucide-react';
import { VoiceNote } from '../../types';
import { api } from '../../services/api';
import { useQuestionStore } from '../../stores/useQuestionStore';

export const VoiceNotesSection: React.FC = () => {
  const { currentQuestion } = useQuestionStore();
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackTime, setPlaybackTime] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordStartTimeRef = useRef<number>(0);
  const timerIntervalRef = useRef<any>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (currentQuestion?.id) {
      api.getVoiceNotes(currentQuestion.id).then(setVoiceNotes);
    }
    // Stop any playing audio on question change
    stopAudio();
  }, [currentQuestion?.id]);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      stopAudio();
    };
  }, []);

  const stopAudio = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.src = '';
      audioElementRef.current = null;
    }
    setActivePlayingId(null);
    setIsPlaying(false);
    setPlaybackTime(0);
  };

  if (!currentQuestion) return null;

  const startRecording = async () => {
    setErrorMsg('');
    stopAudio();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      audioChunksRef.current = [];

      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      recordStartTimeRef.current = Date.now();

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());

        // Accurately calculate recorded duration in seconds
        const measuredSeconds = Math.max(1, Math.round((Date.now() - recordStartTimeRef.current) / 1000));

        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        setIsRecording(false);
        setRecordDuration(0);

        if (audioChunksRef.current.length === 0) {
          setErrorMsg('No audio data was captured.');
          return;
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const reader = new FileReader();

        reader.onloadend = async () => {
          const dataUrl = reader.result as string;
          if (dataUrl) {
            try {
              const stored = await api.storeAudio(dataUrl, `voice_note_${Date.now()}.webm`);
              const newNote: VoiceNote = {
                id: stored.id,
                questionId: currentQuestion.id,
                filePath: stored.filePath,
                dataUrl: stored.dataUrl,
                title: `Voice Note ${voiceNotes.length + 1}`,
                duration: measuredSeconds,
                createdAt: new Date().toISOString()
              };

              const saved = await api.saveVoiceNote(newNote);
              setVoiceNotes(prev => [...prev, saved]);
            } catch (err: any) {
              setErrorMsg('Failed to save voice note: ' + err.message);
            }
          }
        };

        reader.readAsDataURL(audioBlob);
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordDuration(0);

      timerIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - recordStartTimeRef.current) / 1000);
        setRecordDuration(elapsed);
      }, 500);
    } catch (err: any) {
      console.error('Audio recording error:', err);
      setErrorMsg(`Recording error: ${err.message || 'Microphone access unavailable or denied.'}`);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      audioChunksRef.current = [];
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setIsRecording(false);
      setRecordDuration(0);
    }
  };

  const setupAudio = (note: VoiceNote) => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.src = '';
    }

    const audioSrc = note.dataUrl || note.filePath;
    const audio = new Audio(audioSrc);
    audioElementRef.current = audio;

    // Self-healing metadata listener: repairs duration if previously inaccurate
    audio.onloadedmetadata = () => {
      if (isFinite(audio.duration) && audio.duration > 0) {
        const accurateSec = Math.round(audio.duration);
        if (accurateSec > 0 && note.duration !== accurateSec) {
          const updated = { ...note, duration: accurateSec };
          api.saveVoiceNote(updated);
          setVoiceNotes(prev => prev.map(n => n.id === note.id ? updated : n));
        }
      }
    };

    audio.ontimeupdate = () => {
      setPlaybackTime(audio.currentTime);
      // Double check duration on playback if metadata was delayed
      if (isFinite(audio.duration) && audio.duration > 0) {
        const accurateSec = Math.round(audio.duration);
        if (accurateSec > 0 && Math.abs((note.duration || 0) - accurateSec) > 1) {
          const updated = { ...note, duration: accurateSec };
          api.saveVoiceNote(updated);
          setVoiceNotes(prev => prev.map(n => n.id === note.id ? updated : n));
        }
      }
    };

    audio.onended = () => {
      setIsPlaying(false);
      setPlaybackTime(0);
    };

    audio.onerror = (err) => {
      console.error('Audio playback error:', err);
      setIsPlaying(false);
    };

    return audio;
  };

  const togglePlayNote = (note: VoiceNote) => {
    const audioSrc = note.dataUrl || note.filePath;
    if (!audioSrc) return;

    if (activePlayingId === note.id && audioElementRef.current) {
      if (isPlaying) {
        audioElementRef.current.pause();
        setIsPlaying(false);
      } else {
        audioElementRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      }
    } else {
      const audio = setupAudio(note);
      setActivePlayingId(note.id);
      setPlaybackTime(0);
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.error('Playback failed:', err);
        setIsPlaying(false);
      });
    }
  };

  const seekDelta = (note: VoiceNote, deltaSeconds: number) => {
    if (activePlayingId !== note.id || !audioElementRef.current) {
      // If not currently active, start playing and apply delta
      const audio = setupAudio(note);
      setActivePlayingId(note.id);
      const target = Math.max(0, Math.min(note.duration || 9999, deltaSeconds > 0 ? deltaSeconds : 0));
      audio.currentTime = target;
      setPlaybackTime(target);
      audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      return;
    }

    const maxTime = isFinite(audioElementRef.current.duration) && audioElementRef.current.duration > 0
      ? audioElementRef.current.duration
      : (note.duration || 9999);

    const newTime = Math.max(0, Math.min(maxTime, audioElementRef.current.currentTime + deltaSeconds));
    audioElementRef.current.currentTime = newTime;
    setPlaybackTime(newTime);
  };

  const handleSeek = (note: VoiceNote, targetTime: number) => {
    if (activePlayingId !== note.id || !audioElementRef.current) {
      const audio = setupAudio(note);
      setActivePlayingId(note.id);
      audio.currentTime = targetTime;
      setPlaybackTime(targetTime);
      audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      return;
    }

    audioElementRef.current.currentTime = targetTime;
    setPlaybackTime(targetTime);
  };

  const handleDeleteNote = async (id: string) => {
    if (activePlayingId === id) {
      stopAudio();
    }
    await api.deleteVoiceNote(id, currentQuestion.id);
    setVoiceNotes(prev => prev.filter(n => n.id !== id));
  };

  const handleUpdateTitle = async (id: string, newTitle: string) => {
    const note = voiceNotes.find(n => n.id === id);
    if (!note) return;
    const updated = { ...note, title: newTitle };
    await api.saveVoiceNote(updated);
    setVoiceNotes(prev => prev.map(n => n.id === id ? updated : n));
  };

  const formatSeconds = (sec: number) => {
    if (isNaN(sec) || !isFinite(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mic className="w-4 h-4 text-rose-500" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Voice Notes & Verbal Walkthroughs
          </h3>
          {voiceNotes.length > 0 && (
            <span className="text-xs text-slate-400 font-mono">({voiceNotes.length})</span>
          )}
        </div>

        {/* Record / Stop Action Button */}
        {!isRecording ? (
          <button
            type="button"
            onClick={startRecording}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md bg-rose-600 hover:bg-rose-500 text-white shadow-sm transition"
            title="Record verbal explanation"
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Record Voice Note</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs text-rose-500 font-mono font-medium animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Recording: {formatSeconds(recordDuration)}
            </span>

            <button
              type="button"
              onClick={stopRecording}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-rose-700 hover:bg-rose-600 text-white transition shadow-sm"
              title="Stop & Save Recording"
            >
              <Square className="w-3 h-3 fill-white" />
              <span>Done</span>
            </button>

            <button
              type="button"
              onClick={cancelRecording}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Voice Notes Cards */}
      {voiceNotes.length > 0 ? (
        <div className="flex flex-col gap-2.5">
          {voiceNotes.map(note => {
            const isThisPlaying = activePlayingId === note.id && isPlaying;
            const isThisActive = activePlayingId === note.id;
            const currentPosition = isThisActive ? playbackTime : 0;
            const totalDuration = note.duration || 1;
            const progressPercent = Math.min(100, Math.max(0, (currentPosition / totalDuration) * 100));

            return (
              <div
                key={note.id}
                className={`flex flex-col p-3 rounded-lg border transition shadow-sm group ${
                  isThisActive
                    ? 'border-rose-500/60 bg-white dark:bg-[#161b22] ring-1 ring-rose-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161b22] hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Top Row: Title, Date, Delete */}
                <div className="flex items-center justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Mic className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <input
                      type="text"
                      value={note.title}
                      onChange={(e) => handleUpdateTitle(note.id, e.target.value)}
                      placeholder="Voice Note title..."
                      className="text-xs font-semibold text-slate-800 dark:text-slate-200 bg-transparent focus:outline-none truncate border-b border-transparent focus:border-rose-400 flex-1"
                    />
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(note.createdAt).toLocaleDateString()}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleDeleteNote(note.id)}
                      title="Delete voice note"
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-500 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Bottom Row: -5s, Play/Pause, +5s, Scrubber Tracker */}
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-[#0d1117]/60 rounded-md p-2 border border-slate-100 dark:border-slate-800/80">
                  {/* Controls Cluster */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* -5s (Rewind 5 sec) */}
                    <button
                      type="button"
                      onClick={() => seekDelta(note, -5)}
                      className="flex items-center gap-0.5 px-2 py-1 rounded bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium border border-slate-200 dark:border-slate-700/80 shadow-xs transition active:scale-95"
                      title="Rewind 5 seconds"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>-5s</span>
                    </button>

                    {/* Play / Pause Circular Button */}
                    <button
                      type="button"
                      onClick={() => togglePlayNote(note)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition shrink-0 active:scale-95 ${
                        isThisPlaying
                          ? 'bg-rose-600 text-white shadow-sm shadow-rose-500/30 ring-2 ring-rose-500/20'
                          : 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/80'
                      }`}
                      title={isThisPlaying ? 'Pause' : 'Play'}
                    >
                      {isThisPlaying ? (
                        <Pause className="w-3.5 h-3.5 fill-current" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      )}
                    </button>

                    {/* +5s (Forward 5 sec) */}
                    <button
                      type="button"
                      onClick={() => seekDelta(note, 5)}
                      className="flex items-center gap-0.5 px-2 py-1 rounded bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium border border-slate-200 dark:border-slate-700/80 shadow-xs transition active:scale-95"
                      title="Forward 5 seconds"
                    >
                      <span>+5s</span>
                      <RotateCw className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Present Tracker Scrubber & Elapsed Time */}
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300 w-9 text-right select-none">
                      {formatSeconds(currentPosition)}
                    </span>

                    {/* Interactive Slider Bar */}
                    <div className="relative flex-1 flex items-center group/slider py-1">
                      {/* Background Track with Fill Gradient */}
                      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden pointer-events-none">
                        <div
                          className="h-full bg-rose-500 rounded-full transition-[width] duration-100"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>

                      <input
                        type="range"
                        min={0}
                        max={totalDuration}
                        step={0.1}
                        value={currentPosition}
                        onChange={(e) => handleSeek(note, parseFloat(e.target.value))}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        title={`Seek: ${formatSeconds(currentPosition)} / ${formatSeconds(totalDuration)}`}
                      />
                    </div>

                    <span className="text-[11px] font-mono text-slate-400 select-none">
                      {formatSeconds(totalDuration)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          onClick={startRecording}
          className="flex flex-col items-center justify-center py-6 border border-dashed border-slate-200 dark:border-slate-800 hover:border-rose-500/50 rounded-lg cursor-pointer bg-slate-50/50 dark:bg-[#161b22]/30 transition group"
        >
          <div className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center mb-2 group-hover:scale-110 transition">
            <Mic className="w-4 h-4" />
          </div>
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Click to record a voice note
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5">
            Verbal intuition, time complexity explanation, mock interview walkthrough
          </span>
        </div>
      )}
    </div>
  );
};
