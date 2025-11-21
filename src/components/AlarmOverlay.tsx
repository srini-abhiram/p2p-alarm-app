import React, { useEffect, useRef } from 'react';
import { BellOff, AlertTriangle } from 'lucide-react';

interface AlarmOverlayProps {
    onStop: () => void;
    message?: string;
    senderName?: string;
}

export const AlarmOverlay: React.FC<AlarmOverlayProps> = ({ onStop, message, senderName }) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Create audio context for alarm sound
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'square';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.5);

        // LFO for siren effect
        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 2;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 300;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start();

        osc.start();

        // Pulsing volume
        gain.gain.setValueAtTime(0.1, ctx.currentTime);

        const interval = setInterval(() => {
            if (ctx.state === 'suspended') ctx.resume();
        }, 1000);

        return () => {
            osc.stop();
            lfo.stop();
            ctx.close();
            clearInterval(interval);
        };
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-red-600 animate-pulse">
            <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-6 max-w-md mx-4">
                <AlertTriangle className="w-24 h-24 text-red-600 animate-bounce" />
                <h1 className="text-4xl font-black text-red-600 uppercase tracking-widest">Alarm!</h1>
                <p className="text-gray-600 text-center text-lg">
                    Alarm received from <span className="font-bold text-gray-900">{senderName || 'Unknown'}</span>
                </p>
                {message && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 w-full rounded-r">
                        <p className="text-xl font-bold text-red-800 text-center break-words">"{message}"</p>
                    </div>
                )}
                <button
                    onClick={onStop}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-full text-xl font-bold transition-all transform hover:scale-105 shadow-lg"
                >
                    <BellOff className="w-6 h-6" />
                    STOP ALARM
                </button>
            </div>
        </div>
    );
};
