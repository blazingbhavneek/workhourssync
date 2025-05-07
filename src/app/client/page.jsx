'use client';
import { useState, useRef, useEffect } from 'react';

export default function ClientPage() {
  const [status, setStatus] = useState('Disconnected');
  const [iceState, setIceState] = useState('');
  const wsRef = useRef(null);
  const pcRef = useRef(null);

  const iceServers = {
    iceServers: [
      // Google public STUN endpoints
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun.l.google.com:5349' },
      { urls: 'stun:stun1.l.google.com:3478' },
      { urls: 'stun:stun1.l.google.com:5349' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:5349' },
      { urls: 'stun:stun3.l.google.com:3478' },
      { urls: 'stun:stun3.l.google.com:5349' },
      { urls: 'stun:stun4.l.google.com:19302' },
  
      // Other free public STUN servers
      { urls: 'stun:stun.12connect.com:3478' },
      { urls: 'stun:stun.12voip.com:3478' },
      { urls: 'stun:stun.1und1.de:3478' },
      { urls: 'stun:stun.3cx.com:3478' },
      { urls: 'stun:stun.acrobits.cz:3478' },
      { urls: 'stun:stun.actionvoip.com:3478' },
      { urls: 'stun:stun.advfn.com:3478' },
      { urls: 'stun:stun.altar.com.pl:3478' },
      { urls: 'stun:stun.antisip.com:3478' },
      { urls: 'stun:stun.avigora.fr:3478' },
      { urls: 'stun:stun.bluesip.net:3478' },
      { urls: 'stun:iphone-stun.strato-iphone.de:3478' },
      { urls: 'stun:numb.viagenie.ca:3478' },
      { urls: 'stun:stun.cloudflare.com:3478' },
      { urls: 'stun:stun.flashdance.cx:3478' },
      { urls: 'stun:stunserver2024.stunprotocol.org:3478' },
      { urls: 'stun:stun.freestun.net:3478' }
    ],
    iceTransportPolicy: 'all'
  };

  useEffect(() => {
    const ws = new WebSocket('wss://192.168.188.157:8080');
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

        if (msg.type === 'offer') {
          setStatus('Received offer - creating answer');
          const pc = new RTCPeerConnection(iceServers);
          pcRef.current = pc;

          pc.onicecandidate = (e) => {
            if (e.candidate) {
              console.log('New ICE candidate:', e.candidate);
              setIceState(prev => `${prev}\nCandidate: ${e.candidate.candidate}`);
            }
          };

          pc.oniceconnectionstatechange = () => {
            setStatus(`ICE state: ${pc.iceConnectionState}`);
          };

          pc.ondatachannel = ({ channel }) => {
            channel.onmessage = (e) => {
              const data = JSON.parse(e.data);
              if (data.type === 'ping') {
                channel.send(JSON.stringify({
                  type: 'pong',
                  timestamp: data.timestamp
                }));
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
        setStatus(`Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setStatus('WebSocket connection error');
    };

    return () => {
      ws.close();
      if (pcRef.current) {
        pcRef.current.close();
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8 text-black">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Client Device</h1>
        
        <div className="space-y-4">
          <div className="text-sm">
            <span className="font-medium">Status:</span> {status}
          </div>
          
          <div className="text-xs bg-gray-50 p-2 rounded-md overflow-auto max-h-32">
            <pre>ICE State:{iceState}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}