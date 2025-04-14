'use client'
import { useState, useEffect } from 'react'
import QRCode from 'react-qr-code'
import CryptoJS from 'crypto-js';

const secretKey = 'your-secret-key';

function encryptJSON(data) {
  const ciphertext = CryptoJS.AES.encrypt(JSON.stringify(data), secretKey).toString();
  return ciphertext;
}

function decryptJSON(ciphertext) {
  const bytes = CryptoJS.AES.decrypt(ciphertext, secretKey);
  const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  return decryptedData;
}

export default function DynamicQRCode() {
  const [value, setValue] = useState('');
  const [isGeneratorOn, setIsGeneratorOn] = useState(false);

  const generate = () => {
    const payload = JSON.stringify({
      employeeId: 1234567890, // session.user.employeeId,
      expiry: Date.now() + 10000
    })
    const qrCode = encryptJSON(payload);
    console.log(qrCode);
    setValue(qrCode);
  }

  useEffect(() => {
    if(!isGeneratorOn) return;
    generate()
    const id = setInterval(generate, 2000)
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
                    <QRCode value={value} />
                    <button 
                    className='w-[100px] p-3 bg-[#0057A6]'
                    onClick={() => setIsGeneratorOn(false)}>
                        Stop
                    </button>
                </div>
            }
        </div>;
}
