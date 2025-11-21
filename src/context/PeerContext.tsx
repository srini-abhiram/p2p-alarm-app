import React, { createContext, useContext, useEffect, useState } from 'react';
import { peerService, generatePeerId, type AlarmData } from '../lib/peer';

export interface PeerConnection {
    id: string;
    username: string;
}

interface PeerContextType {
    myId: string;
    username: string;
    setUsername: (name: string) => void;
    connections: PeerConnection[];
    isReady: boolean;
    connectToPeer: (id: string) => Promise<void>;
    sendAlarm: (id: string, message?: string) => void;
    broadcastAlarm: (message?: string) => void;
    lastAlarm: AlarmData | null;
    clearAlarm: () => void;
}

const PeerContext = createContext<PeerContextType | null>(null);

export const usePeer = () => {
    const context = useContext(PeerContext);
    if (!context) {
        throw new Error('usePeer must be used within a PeerProvider');
    }
    return context;
};

export const PeerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [myId, setMyId] = useState<string>('');
    const [username, setUsername] = useState<string>('');
    const [connections, setConnections] = useState<PeerConnection[]>([]);
    const [isReady, setIsReady] = useState(false);
    const [lastAlarm, setLastAlarm] = useState<AlarmData | null>(null);

    useEffect(() => {
        const id = generatePeerId();
        setMyId(id);

        peerService.initialize(id).then(() => {
            setIsReady(true);
        }).catch(err => {
            console.error('Failed to init peer:', err);
        });

        peerService.onConnectionCallback = (conn) => {
            // Initial connection, we might not have username yet
            setConnections(prev => {
                if (!prev.find(c => c.id === conn.peer)) {
                    return [...prev, { id: conn.peer, username: 'Connecting...' }];
                }
                return prev;
            });
        };

        peerService.onHandshakeCallback = (peerId, peerUsername) => {
            setConnections(prev => {
                return prev.map(c => {
                    if (c.id === peerId) {
                        return { ...c, username: peerUsername };
                    }
                    return c;
                });
            });
        };

        peerService.onDataCallback = (data: any) => {
            if (data && data.type === 'ALARM') {
                setLastAlarm(data);
            }
        };

        return () => {
            peerService.disconnect();
        };
    }, []);

    // Update service username when state changes
    useEffect(() => {
        if (username) {
            peerService.setUsername(username);
        }
    }, [username]);

    const connectToPeer = async (peerId: string) => {
        if (peerId === myId) return;
        try {
            await peerService.connect(peerId);
            // Connection callback handles state update
        } catch (err) {
            console.error('Failed to connect:', err);
            throw err;
        }
    };

    const sendAlarm = (peerId: string, message?: string) => {
        peerService.sendAlarm(peerId, username, message);
    };

    const broadcastAlarm = (message?: string) => {
        peerService.broadcastAlarm(username, message);
    };

    const clearAlarm = () => {
        setLastAlarm(null);
    };

    return (
        <PeerContext.Provider value={{ myId, username, setUsername, connections, isReady, connectToPeer, sendAlarm, broadcastAlarm, lastAlarm, clearAlarm }}>
            {children}
        </PeerContext.Provider>
    );
};
