import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";
import { Mic, MicOff, Volume2, VolumeX, Loader2, MessageSquare, Bot, AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LiveAgentProps {
  onClose?: () => void;
}

export default function LiveAgent({ onClose }: LiveAgentProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcription, setTranscription] = useState<{ user?: string; model?: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sessionRef = useRef<any>(null);
  const audioQueueRef = useRef<Int16Array[]>([]);
  const isPlayingRef = useRef(false);
  const nextStartTimeRef = useRef(0);

  const SAMPLE_RATE = 16000;

  const stopSession = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
    setVolume(0);
  }, []);

  const startSession = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      audioContextRef.current = new AudioContext({ sampleRate: SAMPLE_RATE });
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

      const session = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: "You are a helpful and friendly real-time assistant. Keep your responses concise and conversational.",
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            setIsConnecting(false);
            
            processorRef.current?.addEventListener('audioprocess', (e) => {
              if (isMuted) return;
              
              const inputData = e.inputBuffer.getChannelData(0);
              // Convert Float32 to Int16
              const pcmData = new Int16Array(inputData.length);
              let sum = 0;
              for (let i = 0; i < inputData.length; i++) {
                const s = Math.max(-1, Math.min(1, inputData[i]));
                pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                sum += Math.abs(inputData[i]);
              }
              setVolume(sum / inputData.length);

              // Convert to base64
              const base64Data = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
              session.sendRealtimeInput({
                audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
              });
            });

            source.connect(processorRef.current!);
            processorRef.current!.connect(audioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle audio output
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              const binary = atob(base64Audio);
              const bytes = new Uint8Array(binary.length);
              for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
              }
              const pcmData = new Int16Array(bytes.buffer);
              audioQueueRef.current.push(pcmData);
              if (!isPlayingRef.current) {
                playNextChunk();
              }
            }

            // Handle transcriptions
            if (message.serverContent?.modelTurn?.parts?.[0]?.text) {
              setTranscription(prev => ({ ...prev, model: message.serverContent?.modelTurn?.parts?.[0]?.text }));
            }

            if (message.serverContent?.interrupted) {
              audioQueueRef.current = [];
              isPlayingRef.current = false;
            }

            // Handle input/output transcriptions if enabled
            const inputTranscription = (message as any).serverContent?.inputAudioTranscription?.text;
            if (inputTranscription) {
              setTranscription(prev => ({ ...prev, user: inputTranscription }));
            }
            
            const outputTranscription = (message as any).serverContent?.outputAudioTranscription?.text;
            if (outputTranscription) {
              setTranscription(prev => ({ ...prev, model: outputTranscription }));
            }
          },
          onclose: () => {
            stopSession();
          },
          onerror: (err) => {
            console.error("Live API Error:", err);
            setError("Connection error. Please try again.");
            stopSession();
          }
        }
      });

      sessionRef.current = session;
    } catch (err) {
      console.error("Failed to start session:", err);
      setError("Could not access microphone or connect to API.");
      setIsConnecting(false);
    }
  };

  const playNextChunk = () => {
    if (audioQueueRef.current.length === 0 || !audioContextRef.current) {
      isPlayingRef.current = false;
      return;
    }

    isPlayingRef.current = true;
    const pcmData = audioQueueRef.current.shift()!;
    const floatData = new Float32Array(pcmData.length);
    for (let i = 0; i < pcmData.length; i++) {
      floatData[i] = pcmData[i] / 0x8000;
    }

    const buffer = audioContextRef.current.createBuffer(1, floatData.length, SAMPLE_RATE);
    buffer.getChannelData(0).set(floatData);

    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);

    const currentTime = audioContextRef.current.currentTime;
    const startTime = Math.max(currentTime, nextStartTimeRef.current);
    
    source.start(startTime);
    nextStartTimeRef.current = startTime + buffer.duration;

    source.onended = () => {
      playNextChunk();
    };
  };

  useEffect(() => {
    return () => {
      stopSession();
    };
  }, [stopSession]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[600px]"
      >
        {/* Header */}
        <div className="p-6 border-bottom border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-zinc-600'}`} />
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Bot className="w-5 h-5 text-indigo-400" />
              Gemini Live
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-8 flex flex-col items-center justify-center relative overflow-hidden">
          {/* Background Animation */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/30 rounded-full blur-[120px]" />
          </div>

          <AnimatePresence mode="wait">
            {!isConnected && !isConnecting ? (
              <motion.div 
                key="start"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center z-10"
              >
                <div className="w-24 h-24 bg-indigo-600/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-indigo-500/30">
                  <Bot className="w-12 h-12 text-indigo-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Ready to talk?</h3>
                <p className="text-zinc-400 mb-8 max-w-xs mx-auto">
                  Experience real-time, low-latency voice conversation with Gemini 3.1 Flash.
                </p>
                <button
                  onClick={startSession}
                  className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-bold text-lg transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-indigo-600/20"
                >
                  Start Conversation
                </button>
              </motion.div>
            ) : isConnecting ? (
              <motion.div 
                key="connecting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center z-10"
              >
                <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mx-auto mb-6" />
                <h3 className="text-xl font-medium text-white">Connecting to Gemini...</h3>
                <p className="text-zinc-500 mt-2">Setting up secure audio channel</p>
              </motion.div>
            ) : (
              <motion.div 
                key="active"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full flex flex-col items-center justify-between z-10"
              >
                {/* Visualizer */}
                <div className="flex items-center justify-center gap-1 h-32">
                  {[...Array(12)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ 
                        height: isMuted ? 4 : Math.max(4, volume * 200 * (0.5 + Math.random() * 0.5)) 
                      }}
                      className="w-2 bg-indigo-500 rounded-full"
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    />
                  ))}
                </div>

                {/* Transcriptions */}
                <div className="w-full space-y-6 max-h-[200px] overflow-y-auto px-4 custom-scrollbar">
                  {transcription.user && (
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex gap-3 items-start"
                    >
                      <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="w-4 h-4 text-zinc-400" />
                      </div>
                      <div className="bg-zinc-800/50 p-3 rounded-2xl rounded-tl-none border border-zinc-700/50">
                        <p className="text-zinc-300 text-sm">{transcription.user}</p>
                      </div>
                    </motion.div>
                  )}
                  {transcription.model && (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex gap-3 items-start justify-end"
                    >
                      <div className="bg-indigo-600/20 p-3 rounded-2xl rounded-tr-none border border-indigo-500/20 max-w-[80%]">
                        <p className="text-indigo-100 text-sm">{transcription.model}</p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-indigo-600/30 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-indigo-400" />
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Controls */}
                <div className="flex items-center gap-6 mt-8">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className={`p-5 rounded-full transition-all ${isMuted ? 'bg-red-500/20 text-red-500 border-red-500/30' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'} border`}
                  >
                    {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                  </button>
                  <button
                    onClick={stopSession}
                    className="px-10 py-4 bg-red-600 hover:bg-red-500 text-white rounded-full font-bold transition-all shadow-lg shadow-red-600/20"
                  >
                    End Call
                  </button>
                  <div className="p-5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                    <Volume2 className="w-6 h-6" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-4 left-4 right-4 bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-center gap-3 text-red-400 text-sm"
            >
              <AlertCircle className="w-4 h-4" />
              {error}
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-950/50 text-center">
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">
            Powered by Gemini 3.1 Flash Live API
          </p>
        </div>
      </motion.div>
    </div>
  );
}
