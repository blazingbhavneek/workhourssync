'use client';
import { useState, useEffect, useRef } from 'react';
import { useClient } from 'vicinix';
import { FaArrowLeft, FaTimes } from 'react-icons/fa';

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


export default function ClientPage() {
  // Existing proximity states
  const [inputId, setInputId] = useState('');
  const [currentId, setCurrentId] = useState('');
  const [isPinging, setIsPinging] = useState(false);
  const [isProximityConfirmed, setIsProximityConfirmed] = useState(false);
  const threshold = 20;

  // Camera states
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [isWebcamReady, setIsWebcamReady] = useState(false);
  const [captureError, setCaptureError] = useState(null);

  const { status, result, rtts, iceState, register, sendPing } = useClient({
    wsUrl: 'wss://proximity-websocket.onrender.com',
    iceServers: iceServers,
    rttThreshold: threshold,
    acceptanceThreshold: 50
  });

  useEffect(() => {
    setIsProximityConfirmed(result?.includes('✅') ?? false);
  }, [result]);

  useEffect(() => {
    const setupWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await new Promise((resolve) => {
            if (videoRef.current) {
              videoRef.current.onloadedmetadata = resolve;
            }
          });
          videoRef.current.play();
          setIsWebcamReady(true);
        }
      } catch (err) {
        console.error('Webcam error:', err);
        setCaptureError('Failed to access webcam. Please check permissions.');
        setIsWebcamReady(false);
      }
    };

    if (isProximityConfirmed) {
      setupWebcam();
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      setIsWebcamReady(false);
    };
  }, [isProximityConfirmed]);

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current) {
      setCaptureError('Camera not ready');
      return;
    }

    try {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas context not available');
      
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);
      
      // Here you can handle the captured image
      const imageData = canvas.toDataURL('image/jpeg');
      console.log('Captured image:', imageData);
      setCaptureError(null);
    } catch (err) {
      console.error('Capture failed:', err);
      setCaptureError('Failed to capture image');
    }
  };

  const handleSetId = () => {
    if (inputId) {
      setCurrentId(inputId);
      register(inputId);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-emerald-900 to-green-900 p-8 text-white">
      {isProximityConfirmed ? (
        <div className="fixed inset-0 z-50 bg-black">
          <header className="w-full bg-gradient-to-r from-black via-[#0c2d12]/90 to-black backdrop-blur-md shadow-xl flex justify-between items-center px-4 py-4 relative z-10 border-b border-green-900/30">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setIsProximityConfirmed(false)}
                className="p-2 rounded-full hover:bg-white/10 transition-colors text-white"
              >
                <FaArrowLeft />
              </button>
              <h1 className="text-xl sm:text-2xl font-bold text-white">Camera Capture</h1>
            </div>
            <img
              src="/logo_Morabu.jpeg"
              alt="Morabu Logo"
              className="w-12 h-12 object-contain rounded-full border-4 border-white/30 transition-all duration-700 ease-in-out transform hover:scale-125"
            />
          </header>

          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-[#7FFFD4]/30 via-[#98FB98]/20 to-[#F0E68C]/10 backdrop-blur-md p-4 relative overflow-hidden h-[calc(100vh-64px)]">
            <div className="w-full max-w-lg mx-auto bg-gradient-to-b from-[#a0ffa0]/80 via-[#90eea0]/70 to-[#ceff90]/90 rounded-3xl p-6 shadow-xl border border-white/30 relative">
              <div className="bg-black/20 backdrop-blur-sm p-4 rounded-xl mx-auto max-w-[320px]">
                <div className="flex flex-col items-center w-full">
                  <div className="flex justify-center w-full">
                    <video
                      ref={videoRef}
                      width="320"
                      height="240"
                      className="rounded-lg border border-green-500/30 shadow-md mx-auto"
                      autoPlay
                      muted
                    />
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                  </div>
                  {captureError && (
                    <div className="text-red-500 text-sm mt-2">{captureError}</div>
                  )}
                  <button
                    onClick={handleCapture}
                    disabled={!isWebcamReady}
                    className="w-full max-w-[240px] mx-auto bg-black/80 hover:bg-black text-white py-3 px-8 rounded-xl font-bold transition shadow-md mt-4 flex items-center justify-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                    Capture Photo
                  </button>
                </div>
              </div>
              <div className="mt-6 flex justify-center">
                <button
                  className="bg-black/80 text-white py-3 px-8 rounded-xl font-bold transition hover:bg-black shadow-md"
                  onClick={() => setIsProximityConfirmed(false)}
                >
                  <FaTimes /> Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-md mx-auto bg-gradient-to-br from-green-900/90 via-emerald-900/80 to-green-800/90 rounded-2xl shadow-2xl p-6 border border-emerald-800/30 backdrop-blur-sm">
          <h1 className="text-2xl font-bold text-emerald-400 mb-4 border-b border-emerald-800/50 pb-3">
            Proximity Verification Client
          </h1>
          <div className="space-y-4">
            <div className="text-sm bg-black/20 p-3 rounded-lg border border-green-800/30">
              <span className="font-medium text-emerald-400">Status:</span>{" "}
              <span className="text-emerald-200">{status}</span>
            </div>

            <div>
              <input
                type="text"
                value={inputId}
                onChange={(e) => setInputId(e.target.value)}
                className="w-full bg-black/20 border border-green-500/30 rounded-lg py-2 px-3 text-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder-emerald-500/70"
                placeholder="Enter Device ID"
              />
              <button
                onClick={handleSetId}
                className="mt-3 w-full bg-gray-900 hover:bg-black text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] shadow-lg shadow-emerald-900/30"
              >
                Register Device
              </button>
            </div>

            <div className="text-sm bg-black/20 p-3 rounded-lg border border-green-800/30">
              <span className="font-medium text-emerald-400">Current ID:</span>{" "}
              <span className="text-emerald-200">{currentId || 'Not registered'}</span>
            </div>

            <button
              onClick={sendPing}
              disabled={!currentId || isPinging}
              className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                currentId && !isPinging 
                  ? 'bg-gray-900 hover:bg-black text-white shadow-lg shadow-emerald-900/30 hover:scale-[1.02]' 
                  : 'bg-gray-800/50 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isPinging ? 'Measuring Proximity...' : 'Start Proximity Check (10 samples)'}
            </button>

            {result && (
              <div className={`p-3 rounded-lg border ${
                result.includes('✅') 
                  ? 'bg-emerald-900/30 border-emerald-700/50 text-emerald-300' 
                  : 'bg-rose-900/30 border-rose-700/50 text-rose-300'
              }`}>
                {result}
              </div>
            )}

            <div className="bg-black/20 p-3 rounded-lg border border-green-800/30">
              <h3 className="font-medium text-emerald-400 mb-2">Proximity Measurements:</h3>
              <div className="space-y-1.5">
                {rtts.map((rtt, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between px-2 py-1 rounded-md bg-emerald-900/10"
                  >
                    <span className="text-emerald-300">Sample #{index + 1}</span>
                    <span className={`font-mono ${rtt < threshold ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {rtt}ms {rtt < threshold ? '✅' : '❌'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-xs bg-black/20 p-3 rounded-lg border border-green-800/30">
              <pre className="text-emerald-300 font-mono overflow-auto max-h-32">
                ICE State: <span className="text-emerald-400">{iceState}</span>
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}