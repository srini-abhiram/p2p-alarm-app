import React, { useState } from 'react';
import { usePeer } from '../context/PeerContext';
import { Copy, UserPlus, Bell, Users, Shield, Radio } from 'lucide-react';
import { Toast } from './Toast';

export const Dashboard: React.FC = () => {
    const { myId, username, setUsername, connections, connectToPeer, sendAlarm, broadcastAlarm } = usePeer();
    const [friendId, setFriendId] = useState('');
    const [message, setMessage] = useState('');
    const [tempUsername, setTempUsername] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(myId);
        setToast({ message: 'ID copied to clipboard!', type: 'success' });
    };

    const handleConnect = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!friendId || friendId.length !== 6) return;

        if (friendId === myId) {
            setToast({ message: 'You cannot connect to yourself!', type: 'error' });
            return;
        }

        setIsConnecting(true);
        try {
            await connectToPeer(friendId);
            setFriendId('');
            setToast({ message: 'Connected successfully!', type: 'success' });
        } catch (err) {
            console.error(err);
            setToast({ message: 'Connection failed. User not found or offline.', type: 'error' });
        } finally {
            setIsConnecting(false);
        }
    };

    const handleSetUsername = (e: React.FormEvent) => {
        e.preventDefault();
        if (tempUsername.trim()) {
            setUsername(tempUsername.trim());
        }
    };

    if (!username) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center space-y-6">
                    <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                        <Shield className="w-8 h-8 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Welcome to P2P Alarm</h1>
                        <p className="text-gray-500 mt-2">Choose a username to get started</p>
                    </div>
                    <form onSubmit={handleSetUsername} className="space-y-4">
                        <input
                            type="text"
                            value={tempUsername}
                            onChange={(e) => setTempUsername(e.target.value)}
                            placeholder="Enter your username"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-center text-lg"
                            autoFocus
                        />
                        <button
                            type="submit"
                            disabled={!tempUsername.trim()}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl transition-all transform active:scale-95"
                        >
                            Continue
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-gray-900">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <header className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-600 p-2 rounded-lg">
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight">P2P Alarm</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <div className="text-sm font-bold text-gray-900">{username}</div>
                            <div className="text-xs text-gray-500">ID: {myId}</div>
                        </div>
                        <button
                            onClick={copyToClipboard}
                            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-full font-mono font-semibold transition-colors"
                            title="Click to copy ID"
                        >
                            <Copy className="w-4 h-4 text-gray-500" />
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Add Friend Section */}
                    <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2 mb-6">
                            <UserPlus className="w-5 h-5 text-indigo-600" />
                            <h2 className="text-xl font-bold">Add Friend</h2>
                        </div>
                        <form onSubmit={handleConnect} className="space-y-4">
                            <div>
                                <label htmlFor="friendId" className="block text-sm font-medium text-gray-700 mb-1">
                                    Enter Friend's 6-Digit Code
                                </label>
                                <input
                                    type="text"
                                    id="friendId"
                                    value={friendId}
                                    onChange={(e) => setFriendId(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="123456"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all font-mono text-lg tracking-widest text-center"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isConnecting || friendId.length !== 6 || friendId === myId}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl transition-all transform active:scale-95"
                            >
                                {isConnecting ? 'Connecting...' : 'Connect'}
                            </button>
                        </form>
                    </section>

                    {/* Friends List Section */}
                    <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-indigo-600" />
                                <h2 className="text-xl font-bold">Friends ({connections.length})</h2>
                            </div>
                            {connections.length > 1 && (
                                <button
                                    onClick={() => broadcastAlarm(message)}
                                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg font-bold text-xs transition-colors shadow-sm"
                                >
                                    <Radio className="w-3 h-3" />
                                    ALARM ALL
                                </button>
                            )}
                        </div>

                        {connections.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                                <p>No friends connected yet.</p>
                                <p className="text-sm mt-2">Share your code to get started!</p>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                                <div className="mb-4">
                                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                                        Custom Message (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        id="message"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="WAKE UP!"
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                                    />
                                </div>
                                {connections.map((conn) => (
                                    <div key={conn.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                            <div>
                                                <div className="font-bold text-gray-800">{conn.username}</div>
                                                <div className="font-mono text-xs text-gray-400">{conn.id}</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => sendAlarm(conn.id, message)}
                                            className="flex items-center gap-2 bg-red-100 hover:bg-red-200 text-red-600 px-4 py-2 rounded-lg font-bold text-sm transition-colors"
                                        >
                                            <Bell className="w-4 h-4" />
                                            ALARM
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>

                {/* Instructions */}
                <div className="text-center text-sm text-gray-400 mt-8">
                    <p>This app runs entirely in your browser. No data is stored on any server.</p>
                </div>
            </div>
        </div>
    );
};
