import Peer, { type DataConnection } from 'peerjs';

// Generate a random 6-digit code
export const generatePeerId = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export interface AlarmData {
    type: 'ALARM';
    from: string;
    username?: string;
    timestamp: number;
    message?: string;
}

export interface HandshakeData {
    type: 'HANDSHAKE';
    from: string;
    username: string;
}

export type PeerData = AlarmData | HandshakeData;

class PeerService {
    peer: Peer | null = null;
    id: string = '';
    username: string = '';
    connections: Map<string, DataConnection> = new Map();

    // Callbacks
    onConnectionCallback: ((conn: DataConnection) => void) | null = null;
    onDataCallback: ((data: PeerData, conn: DataConnection) => void) | null = null;
    onHandshakeCallback: ((peerId: string, username: string) => void) | null = null;

    initialize(id: string): Promise<string> {
        return new Promise((resolve) => {
            this.id = id;
            this.peer = new Peer(id, {
                debug: 2,
            });

            this.peer.on('open', (id) => {
                console.log('My peer ID is: ' + id);
                resolve(id);
            });

            this.peer.on('connection', (conn: DataConnection) => {
                console.log('Incoming connection from:', conn.peer);
                this.handleConnection(conn);
            });

            this.peer.on('error', (err: any) => {
                console.error('PeerJS error:', err);
            });
        });
    }

    setUsername(name: string) {
        this.username = name;
    }

    connect(peerId: string): Promise<DataConnection> {
        return new Promise((resolve, reject) => {
            if (!this.peer) {
                reject(new Error('Peer not initialized'));
                return;
            }

            if (this.connections.has(peerId)) {
                resolve(this.connections.get(peerId)!);
                return;
            }

            const conn = this.peer.connect(peerId);

            // Timeout if connection takes too long (e.g. invalid ID)
            const timeout = setTimeout(() => {
                conn.close();
                reject(new Error('Connection timed out. User may not exist or is offline.'));
            }, 5000);

            conn.on('open', () => {
                clearTimeout(timeout);
                console.log('Connected to:', peerId);
                this.handleConnection(conn);
                resolve(conn);
            });

            conn.on('error', (err: any) => {
                clearTimeout(timeout);
                console.error('Connection error:', err);
                reject(err);
            });
        });
    }

    handleConnection(conn: DataConnection) {
        this.connections.set(conn.peer, conn);

        const sendHandshake = () => {
            if (this.username) {
                console.log('Sending handshake to:', conn.peer);
                const handshake: HandshakeData = {
                    type: 'HANDSHAKE',
                    from: this.id,
                    username: this.username
                };
                conn.send(handshake);
            }
        };

        if (conn.open) {
            sendHandshake();
        } else {
            conn.on('open', () => {
                console.log('Connection opened for handshake:', conn.peer);
                sendHandshake();
            });
        }

        if (this.onConnectionCallback) {
            this.onConnectionCallback(conn);
        }

        conn.on('data', (data: any) => {
            console.log('Received data:', data);

            if (data && data.type === 'HANDSHAKE') {
                const handshake = data as HandshakeData;
                if (this.onHandshakeCallback) {
                    this.onHandshakeCallback(handshake.from, handshake.username);
                }
            } else if (this.onDataCallback) {
                this.onDataCallback(data, conn);
            }
        });

        conn.on('close', () => {
            console.log('Connection closed:', conn.peer);
            this.connections.delete(conn.peer);
        });
    }

    sendAlarm(peerId: string, username?: string, message?: string) {
        const conn = this.connections.get(peerId);
        if (conn && conn.open) {
            const data: AlarmData = {
                type: 'ALARM',
                from: this.id,
                username,
                timestamp: Date.now(),
                message,
            };
            conn.send(data);
        } else {
            console.warn('Cannot send alarm, connection not open for:', peerId);
        }
    }

    broadcastAlarm(username?: string, message?: string) {
        const data: AlarmData = {
            type: 'ALARM',
            from: this.id,
            username,
            timestamp: Date.now(),
            message,
        };

        this.connections.forEach((conn) => {
            if (conn.open) {
                conn.send(data);
            }
        });
    }

    disconnect() {
        if (this.peer) {
            this.peer.destroy();
            this.peer = null;
            this.connections.clear();
        }
    }
}

export const peerService = new PeerService();
