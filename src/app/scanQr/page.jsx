'use client'
import { useRef, useState, useEffect } from 'react';
import Image from 'next/image'
import BarcodeScannerComponent from "react-qr-barcode-scanner";
import qrPng from './qrcodePng.png'

const CameraScanner = () => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const canvasRef = useRef(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [result, setResult] = useState("");
  const [userId, setUserId] = useState(2);
  const [isAdmin, setIsAdmin] = useState(false)
  const [status, setStatus] = useState("Scan Qr Code...");

  useEffect(() => {
      const token = localStorage.getItem('token');
      if (token) {
          try {
              const decoded = jwt.decode(token);
              setUserId(2)
              setIsAdmin(decoded.role === 'ADMIN');
          } catch (error) {
              console.error('Error decoding token:', error);
          }
      }
  }, []);

  useEffect(() => {
    if (!canvasRef.current || !isCameraOn) return;

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setDimensions({ width, height });
      console.log("Size:", width, height);
    });

    observer.observe(canvasRef.current);

    return () => observer.disconnect();
  }, [isCameraOn]);

  const captureAndSend = async () => {
    try {
      const res = await fetch('/api/auth/qrAuth', {
        method: 'POST',
        body: JSON.stringify({
          userId: userId,
          result: result
        }),
      });
      const data = await res.json();
      setStatus(data.message)
    } finally {
      setIsCameraOn(false);
    }
  };

  return (
    <div>
        <div className='absolute top-0 left-0 text-center text-white bg-[#b20303] text-5xl flex flex-row justify-center items-center w-full h-auto p-3.5'>
            Scan QR Code...
        </div>
      {!isCameraOn ? (
        <div className='bg-white flex flex-col justify-center items-center h-screen w-screen'>
            <button className='bg-[#0377e2] p-3 rounded-3xl text-white'  onClick={() => setIsCameraOn(true)}>
            Open Scanner
            </button>
        </div>
      ) : (
        <div className='bg-white flex flex-col gap-2.5 justify-center items-center h-screen w-screen overflow-hidden'
        >
            <div className='border-2 overflow-hidden sm:w-[300px] w-[200px]'
            ref={canvasRef}
            >
                <Image
                  src={qrPng}
                  alt="QR Code"
                  className="absolute sm:w-[300px] w-[200px]"
                  style={{ objectFit: "fill", backgroundSize: "cover", height:dimensions.height}}
                />
                <BarcodeScannerComponent
                  style={{ objectFit: "fill", backgroundSize: "cover" }}
                  onUpdate={(err, res) => {
                    if (res){ 
                      setResult(res)
                      console.log(res.text);
                    }
                  }}
                />
            </div>
          <button onClick={captureAndSend} className='bg-[#0377e2] p-3 rounded-3xl text-white' >
            Capture & Send
          </button>

          <button onClick={() => setIsCameraOn(false)} className='bg-[#0377e2] p-3 rounded-3xl text-white' >
            Stop Camera
          </button>
        </div>
      )}
      <div className='absolute bottom-0 left-0 text-center text-white bg-[#b20303] text-xl flex flex-row justify-center items-center w-full h-auto p-3.5'>
            {status}
        </div>
    </div>
  );
};

export default CameraScanner;