'use client'
import { useState, useEffect } from 'react'
import QRCode from 'react-qr-code'
import CryptoJS from 'crypto-js';

const secretKey = process.env.QR_SECRET;

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
  const [userId, setUserId] = useState();
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const decoded = jwt.decode(token);
            console.log(decoded)
            setUserId(decoded.id)
            setIsAdmin(decoded.role === 'ADMIN');
        } catch (error) {
            console.error('Error decoding token:', error);
        }
    }
}, []);

  const generate = async () => {
    try {
      const res = await fetch('/api/auth/codeGen', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({userId}),
      });
      const payload = JSON.stringify({
        employeeNumber: res.employeeNumber, // session.user.employeeId,
        expiry: Date.now() + 5000
      })
      const qrCode = encryptJSON(payload);
      console.log(qrCode);
      setValue(qrCode);
    }

    catch (err){
      console.log(err);
    }
  }

  useEffect(() => {
    if(!isAdmin) return;
    if(!isGeneratorOn) return;
    generate()
    const id = setInterval(generate, 2000)
    return () => clearInterval(id)
  }, [isGeneratorOn])

  return <div className='bg-white flex flex-col justify-center items-center h-screen w-screen'>
            {
              isAdmin ? 
                  <>
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
                  </>
                :
                <div className='absolute top-1/2 left-0 text-center text-white bg-[#b20303] text-5xl flex flex-row justify-center items-center w-full h-auto p-3.5'>
                  Only Admins allowed on this Page!!
                </div>
            }
            
        </div>;
}
