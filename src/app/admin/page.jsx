'use client';
import { useAdmin } from 'vicinix';

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

export default function AdminPage() {
  const { status, nearbyDevices, iceState } = useAdmin({
    wsUrl: 'wss://proximity-websocket.onrender.com',
    iceServers: iceServers
  });

  return (
    <div className="min-h-screen bg-gray-100 p-8 text-black">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Admin Console</h1>
        
        <div className="mb-6 space-y-4">
          <div className="text-sm">
            <span className="font-medium">Status:</span> {status}
          </div>
          
          <div className="text-sm">
            <span className="font-medium">Nearby Devices:</span>
            {nearbyDevices.map(device => (
              <div key={device.id} className="mt-2">
                {device.id} - {device.rtt}ms {device.rtt < 20 ? '✅' : '❌'}
              </div>
            ))}
          </div>
          
          <div className="text-xs bg-gray-50 p-2 rounded-md overflow-auto max-h-32">
            <pre>ICE State:{iceState}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}