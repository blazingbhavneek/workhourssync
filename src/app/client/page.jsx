'use client';
import { useState } from 'react';
import { useClient } from 'vicinix';

const iceServers = {
  // ... (iceServers configuration remains the same)
};

export default function ClientPage() {
  const [inputId, setInputId] = useState('');
  const [currentId, setCurrentId] = useState('');
  const [isPinging, setIsPinging] = useState(false);
  const threshold = 10;

  const { status, result, iceState, register, sendPing } = useClient({
    wsUrl: 'wss://proximity-websocket.onrender.com',
    iceServers: iceServers,
    threshold: threshold
  });

  const handleSetId = () => {
    if (inputId) {
      setCurrentId(inputId);
      register(inputId);
    }
  };

  const sendMultiplePings = async () => {
    if (isPinging) return;
    setIsPinging(true);
    for (let i = 0; i < 10; i++) {
      sendPing();
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    setIsPinging(false);
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
            <span className="font-medium">Current ID:</span> {currentId || 'Not set'}
          </div>
          <button
            onClick={sendMultiplePings}
            disabled={!currentId || isPinging}
            className={`w-full py-2 px-4 rounded-md ${
              currentId && !isPinging ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isPinging ? 'Pinging...' : 'Start Pinging (10 times)'}
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