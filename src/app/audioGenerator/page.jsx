'use client'
import { useState, useEffect } from 'react'

class FastDigitReceiver {
    constructor() {
      this.context = new AudioContext({ sampleRate: 48000 });
      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = 2048;  // Higher frequency resolution
      this.spectrum = new Float32Array(this.analyser.frequencyBinCount);
    }
  
    async start() {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = this.context.createMediaStreamSource(stream);
      source.connect(this.analyser);
      setInterval(() => this.detectDigit(), 40);  // Check every 40ms
    }
  
    detectDigit() {
      this.analyser.getFloatFrequencyData(this.spectrum);
      
      // DTMF frequency bands
      const lowFreqs = [697, 770, 852, 941];
      const highFreqs = [1209, 1336, 1477];
      
      const { sampleRate, fftSize } = this.analyser;
      const binSize = sampleRate / fftSize;
  
      // Find dominant low and high frequencies
      const [lowPeak, highPeak] = [lowFreqs, highFreqs].map(band => 
        band.reduce((a, b) => 
          this.spectrum[Math.round(a/binSize)] > 
          this.spectrum[Math.round(b/binSize)] ? a : b
        )
      );
  
      // Map to DTMF digits
      const digitMap = {
        '697-1209': 1, '697-1336': 2, '697-1477': 3,
        '770-1209': 4, '770-1336': 5, '770-1477': 6,
        '852-1209': 7, '852-1336': 8, '852-1477': 9,
        '941-1336': 0
      };
  
      return digitMap[`${lowPeak}-${highPeak}`];
    }
  }

export default function DynamicQRCode() {
  const [value, setValue] = useState('');
  const [isGeneratorOn, setIsGeneratorOn] = useState(false);

  const generate = () => {
    // const payload = JSON.stringify({
    //   employeeId: 1234567890, // session.user.employeeId,
    //   expiry: (Date.now() + 10000).toString()
    // })
    const payload = `${1234567890}${Date.now() + 10000}`;
    // const encrypted_payload = encryptJSON(payload);
    console.log(payload.length);

  useEffect(() => {
    if(!isGeneratorOn) return;
    generate()
    const id = setInterval(generate, 20000)
    return () => clearInterval(id)
  }, [isGeneratorOn])

  return <div className='bg-white flex flex-col justify-center items-center h-screen w-screen'>
            <div className='absolute top-0 left-0 text-center text-white bg-[#b20303] text-5xl flex flex-row justify-center items-center w-full h-auto p-3.5'>
                Generate QR Code
            </div>

            {!isGeneratorOn ? (
                    <button 
                    className='w-[100px] p-3 bg-[#0057A6] rounded-2xl'
                    onClick={() => setIsGeneratorOn(true)}>
                    Start
                </button>
            ) : 
                <div className='flex flex-col justify-around items-center gap-2.5'>
                    <button 
                    className='w-[100px] p-3 bg-[#0057A6]'
                    onClick={() => setIsGeneratorOn(false)}>
                        Stop
                    </button>
                </div>
            }
        </div>;
}
