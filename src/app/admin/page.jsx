'use client';
import { useState, useRef, useEffect } from 'react';

export default function AdminPage() {
  const [status, setStatus] = useState('Disconnected');
  const [result, setResult] = useState(null);
  const [iceState, setIceState] = useState('');
  const wsRef = useRef(null);
  const pcRef = useRef(null);

  const iceServers = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun.l.google.com:5349" },
      { urls: "stun:stun1.l.google.com:3478" },
      {
        urls: "stun:stun.relay.metered.ca:80",
      },
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
    const ws = new WebSocket('wss://192.168.3.157:8080');
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

        if (msg.type === 'ice-candidate') {
          const candidate = new RTCIceCandidate(msg.candidate);
          pcRef.current?.addIceCandidate(candidate).catch(console.error);
        }

        if (msg.type === 'answer') {
          if (!pcRef.current) return;
          
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(msg.answer));
          setStatus('Remote description set');
        }
      } catch (error) {
        console.error('Message handling error:', error);
        setStatus(`Error: ${error instanceof Error ? error.message : String(error)}`);
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

  const startConnection = async () => {
    try {
      setStatus('Creating peer connection...');
      const pc = new RTCPeerConnection(iceServers);
      pcRef.current = pc;

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          console.log('New ICE candidate:', e.candidate);
          setIceState(prev => `${prev}\nCandidate: ${e.candidate?.candidate}`);
          // Send ICE candidate to client
          wsRef.current?.send(JSON.stringify({
            type: 'ice-candidate',
            candidate: e.candidate,
            target: 'client'
          }));
        } else {
          setIceState(prev => `${prev}\nICE gathering complete`);
        }
      };
            

      pc.oniceconnectionstatechange = () => {
        setStatus(`ICE state: ${pc.iceConnectionState}`);
        console.log('ICE connection state:', pc.iceConnectionState);
      };

      pc.onconnectionstatechange = () => {
        setStatus(`Connection state: ${pc.connectionState}`);
      };

      const dc = pc.createDataChannel('proximity');
      dc.onopen = () => {
        setStatus('Data channel open - sending ping');
        dc.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
      };

      dc.onmessage = (e) => {
        const data = JSON.parse(e.data);
        if (data.type === 'pong') {
          const rtt = Date.now() - data.timestamp;
          setResult(rtt < 50 ? '✅ Devices are nearby!' : '❌ High latency detected');
          setStatus(`Round-trip time: ${rtt}ms`);
        }
      };

      setStatus('Creating offer...');
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      wsRef.current?.send(JSON.stringify({
        type: 'offer',
        offer: pc.localDescription,
        target: 'client'
      }));
      
      setStatus('Offer sent to client');
    } catch (error) {
      console.error('Connection error:', error);
      setStatus(`Error: ${error instanceof Error ? error.message : String(error)}`);
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
          
          {result && (
            <div className={`p-3 rounded-md ${
              result.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {result}
            </div>
          )}
          
          <div className="text-xs bg-gray-50 p-2 rounded-md overflow-auto max-h-32">
            <pre>ICE State:{iceState}</pre>
          </div>
        </div>
        
        <button
          onClick={startConnection}
          disabled={!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN}
          className={`w-full py-2 px-4 rounded-md ${
            wsRef.current?.readyState === WebSocket.OPEN
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Start Connection
        </button>
      </div>
    </div>
  );
}