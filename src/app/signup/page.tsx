'use client';

import { useState } from 'react';

export default function LoginPage() {
    // State hooks for user inputs and response
    const [employeeNumber, setEmployeeNumber] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isOtpSent, setIsOtpSent] = useState(false);

    // Handle form submission
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                employeeNumber,
                password,
                email,
            }),
        });

        const data = await res.json();

        if (res.ok) {
            setSuccess('Login successful, OTP sent to your email');
            setError('');
            setIsOtpSent(true);  // OTP has been sent, now request OTP from the user
        } else {
            setError(data.error);
            setSuccess('');
        }
    };

    // Handle OTP submission
    const handleOtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                employeeNumber,
                password,
                email,
                otp,  // Include OTP entered by the user
            }),
        });

        const data = await res.json();

        if (res.ok) {
            setSuccess('Login successful');
            setError('');
        } else {
            setError(data.error);
            setSuccess('');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
                <h2 className="text-2xl font-semibold text-center mb-6">Login</h2>

                {/* Display error message if exists */}
                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

                {/* Display success message */}
                {success && <p className="text-green-500 text-sm mb-4">{success}</p>}

                {/* Login form */}
                {!isOtpSent ? (
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
                                required
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
                                required
                            />
                        </div>

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
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:ring-4 focus:ring-blue-200 focus:outline-none"
                        >
                            Login
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleOtpSubmit}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700" htmlFor="otp">
                                OTP
                            </label>
                            <input
                                type="text"
                                id="otp"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter the OTP sent to your email"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:ring-4 focus:ring-blue-200 focus:outline-none"
                        >
                            Verify OTP
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}