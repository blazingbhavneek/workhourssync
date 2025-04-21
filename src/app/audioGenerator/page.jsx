'use client'
import { useState, useEffect, useRef } from 'react'

const adder = 18000; 

const lowFreq1 = adder + 0;
const lowFreq2 = adder + 250;
const lowFreq3 = adder + 500;
const lowFreq4 = adder + 750;

const highFreq1 = adder + 1000;
const highFreq2 = adder + 1500;
const highFreq3 = adder + 2000;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class FastDigitSender {
  constructor() {
    this.context = new AudioContext({ sampleRate: 48000 });
    this.dtmfFrequencies = {
      0: [lowFreq4, highFreq2],
      1: [lowFreq1, highFreq1],
      2: [lowFreq1, highFreq2],
      3: [lowFreq1, highFreq3],
      4: [lowFreq2, highFreq1],
      5: [lowFreq2, highFreq2],
      6: [lowFreq2, highFreq3],
      7: [lowFreq3, highFreq1],
      8: [lowFreq3, highFreq2],
      9: [lowFreq3, highFreq3],
      'g': [lowFreq4, highFreq1],
      'e': [lowFreq4, highFreq3]
    };    
  }

  async playDigit(digit, duration = 0.05) {
    if (this.context.state === 'suspended') {
      await this.context.resume();
    }
    
    const [f1, f2] = this.dtmfFrequencies[digit];
    const now = this.context.currentTime;
    const merger = this.context.createChannelMerger(2);

    [f1, f2].forEach(freq => {
      const osc = this.context.createOscillator();
      osc.frequency.setValueAtTime(freq, now);
      osc.connect(merger);
      osc.start(now);
      osc.stop(now + duration);
    });

    merger.connect(this.context.destination);

    return new Promise(resolve => {
      setTimeout(() => {
        merger.disconnect();
        resolve();
      }, duration * 1000);
    });
  }
}

export default function audioGenerator() {
  const [isGeneratorOn, setIsGeneratorOn] = useState(false);
  const transmitterRef = useRef();

  const generate = async () => {
    const payload = `${1234567}${Date.now() + 10000}`;
    console.log(payload);
    const arr = payload.split('').map(Number);
    
    for (let i = 0; i < arr.length; i++) {
      if(i && arr[i]===arr[i-1]) await transmitterRef.current.playDigit('g', 0.1);
      await transmitterRef.current.playDigit(arr[i], 0.1);
      await sleep(10); // Add gap between digits
    }
  }

  useEffect(() => {
    if (!isGeneratorOn) return;

    transmitterRef.current = new FastDigitSender();
    let intervalId;

    const init = async () => {
      await generate();
      intervalId = setInterval(generate, 5000);
    };

    init();

    return () => {
      clearInterval(intervalId);
      if (transmitterRef.current?.context) {
        transmitterRef.current.context.close();
      }
    };
  }, [isGeneratorOn]);

  return (
    <div className='bg-white flex flex-col justify-center items-center h-screen w-screen'>
      <div className='absolute top-0 left-0 text-center text-white bg-[#b20303] text-5xl flex flex-row justify-center items-center w-full h-auto p-3.5'>
        Generate QR Code
      </div>

      {!isGeneratorOn ? (
        <button 
          className='w-[100px] p-3 bg-[#0057A6] rounded-2xl'
          onClick={() => setIsGeneratorOn(true)}
        >
          Start
        </button>
      ) : 
        <div className='flex flex-col justify-around items-center gap-2.5'>
          <button 
            className='w-[100px] p-3 bg-[#0057A6]'
            onClick={() => setIsGeneratorOn(false)}
          >
            Stop
          </button>
        </div>
      }
    </div>
  );
}