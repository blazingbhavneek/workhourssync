'use client';
import { useState, useRef, useEffect } from 'react';

export default function ClientPage() {
  const [status, setStatus] = useState('Disconnected');
  const [iceState, setIceState] = useState('');
  const [id, setId] = useState('');
  const [inputId, setInputId] = useState('');
  const [result, setResult] = useState('');
  const wsRef = useRef(null);
  const pcRef = useRef(null);
  const dataChannelRef = useRef(null);

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
      ws.send(JSON.stringify({ type: 'register', role: 'client' }));
      setStatus('Ready');
    };

    ws.onmessage = async (e) => {
      try {
        const msg = JSON.parse(e.data);
        
        if (msg.type === 'registered') {
          setStatus('Registered as client');
          return;
        }

        if (msg.type === 'ice-candidate') {
          const candidate = new RTCIceCandidate(msg.candidate);
          pcRef.current?.addIceCandidate(candidate).catch(console.error);
        }

        if (msg.type === 'offer') {
          setStatus('Received offer - creating answer');
          const pc = new RTCPeerConnection(iceServers);
          pcRef.current = pc;

          pc.onicecandidate = (e) => {
            if (e.candidate) {
              setIceState(prev => `${prev}\nCandidate: ${e.candidate.candidate}`);
              wsRef.current?.send(JSON.stringify({
                type: 'ice-candidate',
                candidate: e.candidate,
                target: 'admin'
              }));
            }
          };

          pc.oniceconnectionstatechange = () => {
            setStatus(`ICE state: ${pc.iceConnectionState}`);
          };

          pc.ondatachannel = ({ channel }) => {
            dataChannelRef.current = channel;
            channel.onmessage = (e) => {
              const data = JSON.parse(e.data);
              if (data.type === 'pong') {
                const rtt = Date.now() - data.timestamp;
                setResult(rtt < 50 ? '✅ Nearby' : '❌ Not nearby');
                setStatus(`Round-trip time: ${rtt}ms`);
              }
            };
          };

          await pc.setRemoteDescription(new RTCSessionDescription(msg.offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          
          ws.send(JSON.stringify({
            type: 'answer',
            answer: pc.localDescription,
            target: 'admin'
          }));
          
          setStatus('Answer sent to admin');
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

  const sendPing = () => {
    if (dataChannelRef.current?.readyState === 'open' && id) {
      const timestamp = Date.now();
      dataChannelRef.current.send(JSON.stringify({
        type: 'ping',
        timestamp,
        id
      }));
    }
  };

  const handleSetId = () => {
    if (inputId) {
      setId(inputId);
      wsRef.current?.send(JSON.stringify({
        type: 'register',
        role: 'client',
        id: inputId
      }));
    }
  };

  return (

    <div className="min-h-screen bg-gray-100 p-8 text-black">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Client Device</h1>
        
        <div className="space-y-4">
          <div className="text-sm">
            <span className="font-medium">Status:</span> {status}
          </div>
          
          <div>
            <input
              type="text"
              value={inputId}
              onChange={(e) => setInputId(e.target.value)}
              className="border p-2 rounded-md w-full"
              placeholder="Enter ID"
            />
            <button
              onClick={handleSetId}
              className="mt-2 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
            >
              Set ID
            </button>
          </div>
          
          <div className="text-sm">
            <span className="font-medium">Current ID:</span> {id || 'Not set'}
          </div>
          
          <button
            onClick={sendPing}
            disabled={!id}
            className={`w-full py-2 px-4 rounded-md ${
              id ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Send Ping
          </button>
          
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
      </div>
    </div>
  );
}