'use client';
import { useState, useRef, useEffect } from 'react';

export default function AdminPage() {
  const [status, setStatus] = useState('Disconnected');
  const [iceState, setIceState] = useState('');
  const [nearbyDevices, setNearbyDevices] = useState([]);
  const wsRef = useRef(null);
  const peerConnectionsRef = useRef(new Map()); // clientId -> { pc, dc }

  const iceServers = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun.l.google.com:5349" },
      { urls: "stun:stun1.l.google.com:3478" },
      { urls: "stun:stun.relay.metered.ca:80" },
      {
        urls: "turn:global.relay.metered.ca:80",
        username: "75700a6e7761f0c4540a170a",
        credential: "vJHVkZyfaTp/M/nQ",
      },
      {
        urls: "turn:global.relay.metered.ca:80?transport=tcp",
        username: "75700a6e7761f0c4540a170a",
        credential: "vJHVkZyfaTp/M/nQ",
      },
      {
        urls: "turn:global.relay.metered.ca:443",
        username: "75700a6e7761f0c4540a170a",
        credential: "vJHVkZyfaTp/M/nQ",
      },
      {
        urls: "turns:global.relay.metered.ca:443?transport=tcp",
        username: "75700a6e7761f0c4540a170a",
        credential: "vJHVkZyfaTp/M/nQ",
      },
    ],
    iceTransportPolicy: 'all'
  };

  useEffect(() => {
    const ws = new WebSocket('wss://proximity-websocket.onrender.com');
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'register', role: 'admin' }));
      setStatus('Ready to connect');
    };

    ws.onmessage = async (e) => {
      try {
        const msg = JSON.parse(e.data);
        
        if (msg.type === 'registered') {
          setStatus('Registered as admin');
          return;
        }

        if (msg.type === 'new-client') {
          const clientId = msg.id;
          startConnection(clientId);
          return;
        }

        if (msg.type === 'ice-candidate') {
          const clientId = msg.senderId;
          const pcData = peerConnectionsRef.current.get(clientId);
          if (!pcData) return;
          const candidate = new RTCIceCandidate(msg.candidate);
          pcData.pc.addIceCandidate(candidate).catch(console.error);
        }

        if (msg.type === 'answer') {
          const clientId = msg.senderId;
          const pcData = peerConnectionsRef.current.get(clientId);
          if (!pcData) return;
          await pcData.pc.setRemoteDescription(new RTCSessionDescription(msg.answer));
          setStatus(`Remote description set for ${clientId}`);
        }

        if (msg.type === 'client-disconnected') {
          const clientId = msg.id;
          const pcData = peerConnectionsRef.current.get(clientId);
          if (pcData) {
            pcData.pc.close();
            peerConnectionsRef.current.delete(clientId);
            setNearbyDevices(prev => prev.filter(d => d.id !== clientId));
          }
        }
      } catch (error) {
        console.error('Message handling error:', error);
        setStatus(`Error: ${error.message}`);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setStatus('WebSocket connection error');
    };

    return () => {
      ws.close();
      pcRef.current?.close();
    };
  }, []);

  const startConnection = async (clientId) => {
    try {
      setStatus(`Creating peer connection for ${clientId}...`);
      const pc = new RTCPeerConnection(iceServers);
      const dc = pc.createDataChannel(`proximity-${clientId}`);

      peerConnectionsRef.current.set(clientId, { pc, dc });

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          setIceState(prev => `${prev}\nCandidate: ${e.candidate.candidate}`);
          wsRef.current?.send(JSON.stringify({
            type: 'ice-candidate',
            candidate: e.candidate,
            target: 'client',
            targetId: clientId
          }));
        }
      };

      pc.oniceconnectionstatechange = () => {
        setStatus(`ICE state for ${clientId}: ${pc.iceConnectionState}`);
      };

      dc.onopen = () => {
        setStatus(`Data channel open for ${clientId}`);
      };

      dc.onmessage = (e) => {
        const data = JSON.parse(e.data);
        if (data.type === 'ping') {
          const timestamp = data.timestamp;
          const rtt = Date.now() - timestamp;
          dc.send(JSON.stringify({ type: 'pong', timestamp }));
          setNearbyDevices(prev => {
            const existing = prev.find(d => d.id === data.id);
            return existing ? 
              prev.map(d => d.id === data.id ? { ...d, rtt } : d) :
              [...prev, { id: data.id, rtt }];
          });
        }
      };

      setStatus(`Creating offer for ${clientId}...`);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      wsRef.current?.send(JSON.stringify({
        type: 'offer',
        offer: pc.localDescription,
        target: 'client',
        targetId: clientId
      }));
      
      setStatus(`Offer sent to client ${clientId}`);
    } catch (error) {
      console.error('Connection error:', error);
      setStatus(`Error: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 text-black">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Admin Console</h1>
        
        <div className="mb-6 space-y-4">
          <div className="text-sm">
            <span className="font-medium">Status:</span> {status}
          </div>
          
          <div className="text-sm">
            <span className="font-medium">Nearby Devices:</span>
            {nearbyDevices.map(device => (
              <div key={device.id} className="mt-2">
                {device.id} - {device.rtt}ms {device.rtt < 50 ? '✅' : '❌'}
              </div>
            ))}
          </div>
          
          <div className="text-xs bg-gray-50 p-2 rounded-md overflow-auto max-h-32">
            <pre>ICE State:{iceState}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}