'use client';

import { useState, useEffect } from 'react';

export default function LoginPage() {
    const [employeeNumber, setEmployeeNumber] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [isMobile, setIsMobile] = useState(false);
    const [fingerprintHash, setFingerprintHash] = useState('');
    const [error, setError] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);

    // Detect device on component mount
    useEffect(() => {
        const userAgent = navigator.userAgent.toLowerCase();
        if (/mobile|android|touch|webos|iphone|ipad|ipod/.test(userAgent)) {
            setIsMobile(true);
            // Simulate fingerprint hash for demo (replace with real fingerprint API if available)
            setFingerprintHash('simulated-fingerprint-hash-' + Math.random().toString(36).substring(2));
        } else {
            setIsMobile(false);
        }
    }, []);

    // Handle form submission for login
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        const body = JSON.stringify({
            employeeNumber,
            password,
            email,
            isMobile,
            fingerprintHash: isMobile ? fingerprintHash : undefined,
        });

        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body,
        });

        const data = await res.json();

        if (res.ok) {
            if (!isMobile) {
                alert('OTP sent to your email');
                setOtpSent(true);
            } else {
                alert('Login successful via fingerprint!');
            }
        } else {
            setError(data.error);
        }
    };

    // Handle OTP submission
    const handleOtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const body = JSON.stringify({
            employeeNumber,
            otp,
        });

        const res = await fetch('/api/auth/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body,
        });

        const data = await res.json();

        if (res.ok) {
            alert('OTP verified successfully!');
            setOtpSent(false); // Reset OTP form
            setOtp('');
        } else {
            setError(data.error || 'Invalid OTP');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center">
            <div className="max-w-lg w-full bg-white p-12 rounded-xl shadow-xl transform transition-all duration-500 ease-in-out hover:scale-105">
                <h2 className="text-4xl font-extrabold text-center text-gray-800 mb-8 animate__animated animate__fadeIn">
                    Login
                </h2>

                {error && (
                    <p className="text-red-600 text-sm mb-4 animate__animated animate__fadeIn">
                        {error}
                    </p>
                )}

                <div className="text-center mb-4">
                    {isMobile ? (
                        <span className="text-green-600 text-lg font-semibold">Mobile Login</span>
                    ) : (
                        <span className="text-blue-600 text-lg font-semibold">PC Login</span>
                    )}
                </div>

                <form onSubmit={handleLogin} className="space-y-8">
                    <div className="mb-6">
                        <label className="block text-lg font-medium text-gray-800" htmlFor="employeeNumber">
                            Employee Number
                        </label>
                        <input
                            type="text"
                            id="employeeNumber"
                            value={employeeNumber}
                            onChange={(e) => setEmployeeNumber(e.target.value)}
                            className="mt-3 block w-full px-5 py-3 text-gray-800 bg-gray-100 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition-all duration-300"
                            placeholder="Enter your employee number"
                            required
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-lg font-medium text-gray-800" htmlFor="password">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-3 block w-full px-5 py-3 text-gray-800 bg-gray-100 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition-all duration-300"
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    {!isMobile && (
                        <div className="mb-6">
                            <label className="block text-lg font-medium text-gray-800" htmlFor="email">
                                Email
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-3 block w-full px-5 py-3 text-gray-800 bg-gray-100 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition-all duration-300"
                                placeholder="Enter your email"
                                required
                            />
                        </div>
                    )}

                    {isMobile && (
                        <div className="mb-6">
                            <label className="block text-lg font-medium text-gray-800" htmlFor="fingerprintHash">
                                Fingerprint Hash
                            </label>
                            <input
                                type="text"
                                id="fingerprintHash"
                                value={fingerprintHash}
                                onChange={(e) => setFingerprintHash(e.target.value)}
                                className="mt-3 block w-full px-5 py-3 text-gray-800 bg-gray-100 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition-all duration-300"
                                placeholder="Enter fingerprint hash"
                                required
                            />
                        </div>
                    )}

                    <div className="mb-8">
                        <button
                            type="submit"
                            className="w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-semibold rounded-xl hover:bg-gradient-to-l hover:from-indigo-600 hover:to-blue-700 focus:outline-none transition-all duration-300"
                        >
                            Login
                        </button>
                    </div>
                </form>

                {otpSent && (
                    <form onSubmit={handleOtpSubmit} className="space-y-6">
                        <div className="mb-6">
                            <label className="block text-lg font-medium text-gray-800" htmlFor="otp">
                                OTP
                            </label>
                            <input
                                type="text"
                                id="otp"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                className="mt-3 block w-full px-5 py-3 text-gray-800 bg-gray-100 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition-all duration-300"
                                placeholder="Enter OTP sent to your email"
                                required
                            />
                        </div>

                        <div className="mb-8">
                            <button
                                type="submit"
                                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-semibold rounded-xl hover:bg-gradient-to-l hover:from-indigo-600 hover:to-blue-700 focus:outline-none transition-all duration-300"
                            >
                                Verify OTP
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}