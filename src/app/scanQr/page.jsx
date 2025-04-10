'use client'
import { useRef, useState, useEffect } from 'react';
import Image from 'next/image'
import qrPng from './qrcodePng.png'

const CameraScanner = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCameraOn, setIsCameraOn] = useState(false);

  useEffect(() => {
    let stream;
    
    const initializeCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await new Promise(resolve => {
            videoRef.current.onloadedmetadata = () => {
              videoRef.current.play();
              resolve();
            };
          });
        }
      } catch (err) {
        console.error('Camera error:', err);
        setIsCameraOn(false);
        alert('Failed to access camera');
      }
    };

    if (isCameraOn) {
      initializeCamera();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isCameraOn]);

  const captureAndSend = () => {
    if (!videoRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
      const formData = new FormData();
      formData.append('image', blob, 'capture.jpg');

      try {
        await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
      } finally {
        setIsCameraOn(false);
      }
    }, 'image/jpeg', 0.85);
  };

  return (
    <div>
      {!isCameraOn ? (
        <div className='bg-black flex flex-col justify-center items-center h-screen w-screen'>
            <button className='bg-white p-3 rounded-3xl text-black'  onClick={() => setIsCameraOn(true)}>
            Open Scanner
            </button>
        </div>
      ) : (
        <div className='bg-black flex flex-col gap-2.5 justify-center items-center h-screen w-screen overflow-hidden'
        >
            <div className='border-2 overflow-hidden sm:w-[300px] sm:h-[300px] w-[200px] h-[200px]'
            >
                <Image
                    src={qrPng}
                    alt="QR Code"
                    className="absolute sm:w-[300px] sm:h-[300px] w-[200px] h-[200px]"
                    />
                <video
                    ref={videoRef}
                    playsInline
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                    }}
                    />
            </div>
          <button onClick={captureAndSend} className='bg-white p-3 rounded-3xl text-black' >
            Capture & Send
          </button>

          <button onClick={() => setIsCameraOn(false)} className='bg-white p-3 rounded-3xl text-black' >
            Stop Camera
          </button>
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
      )}
    </div>
  );
};

export default CameraScanner;