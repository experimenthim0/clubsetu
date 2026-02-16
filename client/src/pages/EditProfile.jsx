import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNotification } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';

const EditProfile = () => {
    const { showNotification } = useNotification();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        githubProfile: '',
        linkedinProfile: '',
        xProfile: '',
        portfolioUrl: '',
        bankName: '',
        accountHolderName: '',
        accountNumber: '',
        ifscCode: '',
        upiId: '',
        bankPhone: '',
        instagramProfile: '',
        whatsappNumber: ''
    });

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        const storedRole = localStorage.getItem('role');
        if (storedUser) {
            setUser(storedUser);
            setRole(storedRole);
            setFormData({
                name: storedUser.name || '',
                githubProfile: storedUser.githubProfile || '',
                linkedinProfile: storedUser.linkedinProfile || '',
                xProfile: storedUser.xProfile || '',
                portfolioUrl: storedUser.portfolioUrl || '',
                bankName: storedUser.bankName || '',
                accountHolderName: storedUser.accountHolderName || '',
                accountNumber: storedUser.accountNumber || '',
                ifscCode: storedUser.ifscCode || '',
                upiId: storedUser.upiId || '',
                bankPhone: storedUser.bankPhone || '',
                instagramProfile: storedUser.instagramProfile || '',
                whatsappNumber: storedUser.whatsappNumber || ''
            });
        }
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.put(`http://localhost:5000/api/users/${role}/${user._id}`, formData);
            localStorage.setItem('user', JSON.stringify(res.data.user)); // Update local storage
            showNotification('Profile updated successfully', 'success');
            navigate('/profile');
        } catch (err) {
            showNotification(err.response?.data?.message || 'Update failed', 'error');
        }
    };

    if (!user) return <div className="text-center mt-10">Loading...</div>;

    return (
        <div className="max-w-xl mx-auto px-6 py-12">
            <h1 className="text-2xl font-bold mb-8">Edit Profile</h1>
            <form onSubmit={handleSubmit} className="bg-white p-8 border border-gray-200 rounded-xl shadow-sm space-y-6">
                
                {/* Read Only Fields */}
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase">Roll No</label>
                        <p className="font-mono text-gray-800">{user.rollNo}</p>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase">Email</label>
                        <p className="font-mono text-gray-800 break-all">{role === 'student' ? user.email : user.collegeEmail}</p>
                    </div>
                </div>

                {/* Editable Fields */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input 
                        type="text" 
                        name="name" 
                        value={formData.name} 
                        onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">GitHub Profile URL</label>
                    <input 
                        type="url" 
                        name="githubProfile" 
                        value={formData.githubProfile} 
                        onChange={handleChange}
                        placeholder="https://github.com/username"
                        className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn Profile URL</label>
                    <input 
                        type="url" 
                        name="linkedinProfile" 
                        value={formData.linkedinProfile} 
                        onChange={handleChange}
                        placeholder="https://linkedin.com/in/username"
                        className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">X (Twitter) Profile URL</label>
                    <input 
                        type="url" 
                        name="xProfile" 
                        value={formData.xProfile} 
                        onChange={handleChange}
                        placeholder="https://x.com/username"
                        className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Portfolio Website</label>
                    <input 
                        type="url" 
                        name="portfolioUrl" 
                        value={formData.portfolioUrl} 
                        onChange={handleChange}
                        placeholder="https://myportfolio.com"
                        className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Instagram Profile URL</label>
                    <input 
                        type="url" 
                        name="instagramProfile" 
                        value={formData.instagramProfile} 
                        onChange={handleChange}
                        placeholder="https://instagram.com/username"
                        className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
                    <input 
                        type="tel" 
                        name="whatsappNumber" 
                        value={formData.whatsappNumber} 
                        onChange={handleChange}
                        placeholder="+91 XXXXX XXXXX"
                        className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                </div>

                {role === 'club-head' && (
                    <div className="pt-6 border-t border-gray-200 space-y-6">
                        <div className="flex items-center gap-2 mb-2">
                             <i className="ri-bank-card-line text-orange-600 text-lg" />
                             <h3 className="font-bold text-gray-800">Bank Information (For Payment Settlements)</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                                <input 
                                    type="text" 
                                    name="bankName" 
                                    value={formData.bankName} 
                                    onChange={handleChange}
                                    placeholder="e.g. HDFC Bank"
                                    className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Account Holder Name</label>
                                <input 
                                    type="text" 
                                    name="accountHolderName" 
                                    value={formData.accountHolderName} 
                                    onChange={handleChange}
                                    placeholder="Full name as in bank"
                                    className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                                <input 
                                    type="password" 
                                    name="accountNumber" 
                                    value={formData.accountNumber} 
                                    onChange={handleChange}
                                    placeholder="Enter account number"
                                    className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 outline-none font-mono"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                                <input 
                                    type="text" 
                                    name="ifscCode" 
                                    value={formData.ifscCode} 
                                    onChange={handleChange}
                                    placeholder="ABCD0123456"
                                    className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 outline-none uppercase font-mono"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">UPI ID</label>
                                <input 
                                    type="text" 
                                    name="upiId" 
                                    value={formData.upiId} 
                                    onChange={handleChange}
                                    placeholder="yourname@upi"
                                    className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Bank Linked Phone</label>
                                <input 
                                    type="tel" 
                                    name="bankPhone" 
                                    value={formData.bankPhone} 
                                    onChange={handleChange}
                                    placeholder="+91 XXXXX XXXXX"
                                    className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 outline-none"
                                />
                            </div>
                        </div>
                        <p className="text-[11px] text-gray-400 italic">
                            * This information is used for payouts and will not be displayed publicly.
                        </p>
                    </div>
                )}

                <div className="pt-4 flex gap-4">
                    <button 
                        type="button" 
                        onClick={() => navigate('/profile')}
                        className="flex-1 py-3 border border-gray-300 rounded font-bold hover:bg-gray-50 transition"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        className="flex-1 py-3 bg-black text-white rounded font-bold hover:bg-orange-600 transition"
                    >
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditProfile;
