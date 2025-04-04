'use client';

import { useState } from 'react';

export default function LoginPage() {
    // State hooks for user inputs and response
    const [employeeNumber, setEmployeeNumber] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [isMobile, setIsMobile] = useState(false);
    const [fingerprintHash, setFingerprintHash] = useState('');
    const [error, setError] = useState('');
    const [otp, setOtp] = useState('');

    // Handle form submission
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        // Prepare the request body
        const body = JSON.stringify({
            employeeNumber,
            password,
            email,
            isMobile,
            fingerprintHash,
        });

        // Make the API request to login
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body,
        });

        // Get the response data
        const data = await res.json();

        if (res.ok) {
            // If it's a non-mobile login (PC), an OTP will be sent
            if (!isMobile) {
                alert('OTP sent to your email');
                setOtp(data.otp); // Store OTP in state (optional for frontend use)
            } else {
                alert('Login successful via fingerprint!');
            }
        } else {
            setError(data.error); // Display error message
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
                <h2 className="text-2xl font-semibold text-center mb-6">Login</h2>

                {/* Display error message if exists */}
                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

                <form onSubmit={handleLogin}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700" htmlFor="employeeNumber">
                            Employee Number
                        </label>
                        <input
                            type="text"
                            id="employeeNumber"
                            value={employeeNumber}
                            onChange={(e) => setEmployeeNumber(e.target.value)}
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter your employee number"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700" htmlFor="password">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter your password"
                        />
                    </div>

                    {/* If it's a non-mobile login (PC), show email input */}
                    {!isMobile && (
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700" htmlFor="email">
                                Email
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter your email"
                            />
                        </div>
                    )}

                    {/* If it's a mobile login, show fingerprint hash input */}
                    {isMobile && (
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700" htmlFor="fingerprintHash">
                                Fingerprint Hash
                            </label>
                            <input
                                type="text"
                                id="fingerprintHash"
                                value={fingerprintHash}
                                onChange={(e) => setFingerprintHash(e.target.value)}
                                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter fingerprint hash"
                            />
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:ring-4 focus:ring-blue-200 focus:outline-none"
                    >
                        Login
                    </button>
                </form>
            </div>
        </div>
    );
}