'use client';
import React, { useState, useEffect, useRef } from 'react';

const BluetoothProximityScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState({});
  const [error, setError] = useState(null);
  const scannerRef = useRef(null);
  const cleanupInterval = useRef(null);

  // Proximity thresholds
  const PROXIMITY_THRESHOLDS = {
    NEAR: -50,
    MEDIUM: -70
  };

  const getProximity = (rssi) => {
    console.log("RSSI: ", rssi);
    if (rssi >= PROXIMITY_THRESHOLDS.NEAR) return '🟢 Near';
    if (rssi >= PROXIMITY_THRESHOLDS.MEDIUM) return '🟡 Medium';
    return '🔴 Far';
  };

  const getProximityColor = (rssi) => {
    if (rssi >= PROXIMITY_THRESHOLDS.NEAR) return 'text-green-500';
    if (rssi >= PROXIMITY_THRESHOLDS.MEDIUM) return 'text-yellow-500';
    return 'text-red-500';
  };

  const handleAdvertisementReceived = (event) => {
    const device = event.device;
    console.log(device);
    setDevices(prev => ({
      ...prev,
      [device.id]: {
        id: device.id,
        name: device.name || 'Unnamed Device',
        rssi: event.rssi,
      }
    }));
  };

  const startScanning = async () => {
    try {
      if (!navigator.bluetooth) {
        throw new Error('Web Bluetooth API not supported');
      }
      
      const options = { acceptAllAdvertisements: true };
      scannerRef.current = await navigator.bluetooth.requestLEScan(options);
      
      navigator.bluetooth.addEventListener('advertisementreceived', handleAdvertisementReceived);
      setIsScanning(true);
      setError(null);
    } catch (err) {
      setError(err.message);
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.stop();
      scannerRef.current = null;
    }
    navigator.bluetooth.removeEventListener('advertisementreceived', handleAdvertisementReceived);
    setIsScanning(false);
  };

  const toggleScanning = () => {
    if (isScanning) {
      stopScanning();
    } else {
      startScanning();
    }
  };

  useEffect(() => {
    // Cleanup old devices every 10 seconds
    cleanupInterval.current = setInterval(() => {
      setDevices(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(id => {
          if (now - updated[id].lastSeen > 15000) {
            delete updated[id];
          }
        });
        return updated;
      });
    }, 10000);

    return () => {
      clearInterval(cleanupInterval.current);
      stopScanning();
    };
  }, []);

  return (
    <div className=' bg-white h-screen w-screen flex justify-center items-center'>
        <div className="max-w-md mx-auto p-5 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Bluetooth Proximity Scanner</h2>
        
        <button 
            onClick={toggleScanning}
            disabled={!navigator.bluetooth}
            className={`px-4 py-2 rounded-md text-white font-medium ${isScanning ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'} ${!navigator.bluetooth ? 'bg-gray-500 cursor-not-allowed' : ''}`}
        >
            {isScanning ? 'Stop Scanning' : 'Start Scanning'}
        </button>

        {error && (
            <div className="mt-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700">
            <p>{error}</p>
            </div>
        )}

        {!navigator.bluetooth && (
            <div className="mt-4 p-3 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700">
            <p>Web Bluetooth API is not supported in your browser. Try Chrome or Edge.</p>
            </div>
        )}

        <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Nearby Devices ({Object.keys(devices).length})
            </h3>
            
            {Object.values(devices).length === 0 ? (
            <p className="text-gray-500 italic">No devices found yet</p>
            ) : (
            <div className="space-y-3">
                {Object.values(devices).map(device => (
                <div key={device.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-800 truncate max-w-[200px]">
                        {device.name}
                    </span>
                    <span className={`font-bold ${getProximityColor(device.rssi)}`}>
                        {getProximity(device.rssi)}
                    </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                    <div>Signal: {device.rssi} dBm</div>
                    </div>
                </div>
                ))}
            </div>
            )}
        </div>
        </div>
    </div>
  );
};

export default BluetoothProximityScanner;