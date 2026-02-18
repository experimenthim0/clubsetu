import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

const VerifyEmail = () => {
    const { token } = useParams();
    const [status, setStatus] = useState('loading'); // loading, success, error
    const [message, setMessage] = useState('');

    useEffect(() => {
        const verifyEmail = async () => {
            try {
                // In production, you might want to use an environment variable for the API URL
                // Assuming proxy is set up or relative path works
                const res = await axios.get(`http://localhost:5000/api/auth/verify-email/${token}`);
                setStatus('success');
                setMessage(res.data.message);
            } catch (error) {
                setStatus('error');
                setMessage(error.response?.data?.message || 'Verification failed');
            }
        };

        if (token) {
            verifyEmail();
        }
    }, [token]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-lg">
                <div className="text-center">
                    {status === 'loading' && (
                        <div className="flex flex-col items-center">
                            <Loader className="h-16 w-16 text-indigo-600 animate-spin" />
                            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Verifying...</h2>
                            <p className="mt-2 text-sm text-gray-600">Please wait while we verify your email.</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="flex flex-col items-center">
                            <CheckCircle className="h-16 w-16 text-green-500" />
                            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Verified!</h2>
                            <p className="mt-2 text-sm text-gray-600">{message}</p>
                            <div className="mt-6">
                                <Link
                                    to="/login"
                                    className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Go to Login
                                </Link>
                            </div>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="flex flex-col items-center">
                            <XCircle className="h-16 w-16 text-red-500" />
                            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Verification Failed</h2>
                            <p className="mt-2 text-sm text-gray-600">{message}</p>
                            <div className="mt-6">
                                <Link
                                    to="/login"
                                    className="font-medium text-indigo-600 hover:text-indigo-500"
                                >
                                    Back to Login
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;
