'use client'
import { useState, useRef } from 'react';

const adder = 18000; 

const lowFreq1 = adder + 0;
const lowFreq2 = adder + 250;
const lowFreq3 = adder + 500;
const lowFreq4 = adder + 750;

const highFreq1 = adder + 1000;
const highFreq2 = adder + 1500;
const highFreq3 = adder + 2000;

class DTMFDecoder {
  constructor(sampleRate = 48000) {
    this.sampleRate = sampleRate;
    this.dtmfMap = {
      [`${lowFreq1}-${highFreq1}`]: '1',
      [`${lowFreq1}-${highFreq2}`]: '2',
      [`${lowFreq1}-${highFreq3}`]: '3',
      [`${lowFreq2}-${highFreq1}`]: '4',
      [`${lowFreq2}-${highFreq2}`]: '5',
      [`${lowFreq2}-${highFreq3}`]: '6',
      [`${lowFreq3}-${highFreq1}`]: '7',
      [`${lowFreq3}-${highFreq2}`]: '8',
      [`${lowFreq3}-${highFreq3}`]: '9',
      [`${lowFreq4}-${highFreq1}`]: '*',
      [`${lowFreq4}-${highFreq2}`]: '0',
      [`${lowFreq4}-${highFreq3}`]: '#'
    };
    
    // Frequencies to scan (with tolerance)
    this.lowFreqs = [lowFreq1, lowFreq2, lowFreq3, lowFreq4];
    this.highFreqs = [highFreq1, highFreq2, highFreq3];
    
    // Detection parameters
    this.signalThreshold = -75;  // dB threshold for signal detection
    this.freqTolerance = 25;     // Hz tolerance for frequency matching
  }
  
  async processAudioBuffer(audioBuffer) {
    const bufferLength = audioBuffer.length;
    const frameSize = Math.floor(this.sampleRate * 0.030); // 30ms frames
    const frames = Math.floor(bufferLength / frameSize);
    
    // For holding digit detection states
    let detectedDigits = [];
    let currentDigit = null;
    let digitCount = 0;
    let silenceCount = 0;
    
    // We'll process the audio in frames to detect DTMF signals and gaps
    for (let frameIndex = 0; frameIndex < frames; frameIndex++) {
      // Create a frame of audio to analyze
      const frameStart = frameIndex * frameSize;
      const frame = audioBuffer.getChannelData(0).slice(frameStart, frameStart + frameSize);
      
      // Create an offline context for spectral analysis
      const offlineCtx = new OfflineAudioContext(1, frameSize, this.sampleRate);
      const frameBuffer = offlineCtx.createBuffer(1, frameSize, this.sampleRate);
      frameBuffer.copyToChannel(frame, 0);
      
      // Set up the analyser
      const analyser = offlineCtx.createAnalyser();
      analyser.fftSize = 2048;
      const freqBinCount = analyser.frequencyBinCount;
      const freqData = new Float32Array(freqBinCount);
      
      // Connect the frame buffer to the analyser
      const source = offlineCtx.createBufferSource();
      source.buffer = frameBuffer;
      source.connect(analyser);
      analyser.connect(offlineCtx.destination);
      source.start();
      
      // Render the audio and get frequency data
      await offlineCtx.startRendering();
      analyser.getFloatFrequencyData(freqData);
      
      // Detect DTMF in this frame
      const digit = this.detectDTMFInFrame(freqData, this.sampleRate / analyser.fftSize);
      
      // State machine for digit detection with debouncing
      if (digit) {
        silenceCount = 0; // Reset silence counter
        
        if (digit === currentDigit) {
          digitCount++;
        } else {
          // New digit detected
          currentDigit = digit;
          digitCount = 1;
        }
        
        // If we've seen the same digit for enough consecutive frames, consider it valid
        if (digitCount === 3) {
          detectedDigits.push(digit);
        }
      } else {
        silenceCount++;
        
        // After sufficient silence, reset current digit to allow new detections
        if (silenceCount >= 3) {
          currentDigit = null;
          digitCount = 0;
        }
      }
    }
    
    return detectedDigits.join('');
  }
  
  detectDTMFInFrame(freqData, binSize) {
    // Find strongest low and high frequencies
    const lowFreq = this.findStrongestFrequency(freqData, this.lowFreqs, binSize);
    const highFreq = this.findStrongestFrequency(freqData, this.highFreqs, binSize);
    
    // No strong frequencies found
    if (!lowFreq || !highFreq) return null;
    
    // Map the frequency pair to a digit
    const key = `${lowFreq}-${highFreq}`;
    return this.dtmfMap[key] || null;
  }
  
  findStrongestFrequency(freqData, frequencies, binSize) {
    let maxPower = this.signalThreshold;
    let strongestFreq = null;
    
    frequencies.forEach(freq => {
      const binIndex = Math.round(freq / binSize);
      
      // Check a small window around the expected frequency bin
      for (let i = -2; i <= 2; i++) {
        const bin = binIndex + i;
        if (bin >= 0 && bin < freqData.length) {
          const power = freqData[bin];
          
          if (power > maxPower) {
            maxPower = power;
            // The actual frequency is the bin index times the bin size
            strongestFreq = Math.round((binIndex + i) * binSize);
          }
        }
      }
    });
    
    // Only return a frequency if it's close enough to one of our target frequencies
    if (strongestFreq) {
      for (const targetFreq of frequencies) {
        if (Math.abs(strongestFreq - targetFreq) <= this.freqTolerance) {
          return targetFreq;  // Return the canonical frequency, not the exact detected one
        }
      }
    }
    
    return null;
  }
}

export default function DTMFReceiver() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const maxRecordingTime = 5; // 5 seconds maximum recording
  
  const startRecording = async () => {
    try {
      // Reset state
      audioChunksRef.current = [];
      setResult('');
      setElapsedTime(0);
      setIsProcessing(false);
      
      // Request audio input access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          autoGainControl: false,
          noiseSuppression: false
        }
      });
      
      // before starting MediaRecorder
      let options;
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        options = { mimeType: 'audio/webm;codecs=opus' };
      } else if (MediaRecorder.isTypeSupported('audio/mp4;codecs=aac')) {
        options = { mimeType: 'audio/mp4;codecs=aac' };
      } // else leave options undefined

      mediaRecorderRef.current = options
        ? new MediaRecorder(stream, options)
        : new MediaRecorder(stream);

      
      // Handle data as it comes in
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      // Handle recording stop
      mediaRecorderRef.current.onstop = async () => {
        setIsProcessing(true);
        await processAudio();
        setIsProcessing(false);
      };
      
      // Start recording
      mediaRecorderRef.current.start(100);
      setIsRecording(true);
      
      // Set up timer to update UI and auto-stop recording
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => {
          const newTime = prev + 1;
          if (newTime >= maxRecordingTime) {
            stopRecording();
            return maxRecordingTime;
          }
          return newTime;
        });
      }, 1000);
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      setResult(`Error: ${error.message}`);
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      
      // Stop and clean up the media stream
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    setIsRecording(false);
  };
  
  const processAudio = async () => {
    if (audioChunksRef.current.length === 0) {
      setResult('No audio recorded');
      return;
    }
    
    try {
      // Create a blob from all the audio chunks
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      // Convert the blob to an AudioBuffer for processing
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Process with our DTMF decoder
      const decoder = new DTMFDecoder(audioContext.sampleRate);
      const digits = await decoder.processAudioBuffer(audioBuffer);
      
      setResult(digits.length > 0 ? `Detected: ${digits}` : 'No DTMF tones detected');
      
      // Clean up audio context
      audioContext.close();
      
    } catch (error) {
      console.error('Audio processing error:', error);
      setResult(`Processing error: ${error.message}`);
    }
  };
  
  return (
    <div className="bg-white flex flex-col justify-center items-center h-screen w-screen">
      <div className="absolute top-0 left-0 text-center text-white bg-[#b20303] text-5xl flex flex-row justify-center items-center w-full h-auto p-3.5">
        DTMF Tone Receiver
      </div>
      
      <div className="mt-20 text-4xl font-mono space-y-8">
        <div className="text-center text-green-600">
          {isProcessing ? 'Processing...' : 
           result || (isRecording ? 'Listening...' : 'Press start to begin')}
        </div>
        
        {isRecording && (
          <div className="text-center text-red-600 animate-pulse">
            Recording time: {elapsedTime}s/{maxRecordingTime}s
          </div>
        )}
      </div>
      
      {!isRecording && !isProcessing ? (
        <button 
          className="w-[200px] p-4 text-white bg-[#0057A6] rounded-2xl mt-8 hover:bg-[#004080] transition-all"
          onClick={startRecording}
        >
          ▶ Start Recording
        </button>
      ) : (
        <button 
          className={`w-[200px] p-4 text-white ${isProcessing ? 'bg-gray-500' : 'bg-red-600 hover:bg-red-700'} rounded-2xl mt-8 transition-all`}
          onClick={stopRecording}
          disabled={isProcessing}
        >
          {isProcessing ? '⏳ Processing...' : '⏹ Stop Early'}
        </button>
      )}
    </div>
  );
}