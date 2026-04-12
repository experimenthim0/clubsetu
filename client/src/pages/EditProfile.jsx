import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNotification } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';

const EditProfile = () => {
    const { showNotification } = useNotification();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
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
        whatsappNumber: '',
        isTwoStepEnabled: false
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
                whatsappNumber: storedUser.whatsappNumber || '',
                isTwoStepEnabled: storedUser.isTwoStepEnabled || false
            });
        }
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const updateData = { ...formData };
            // If newPassword is provided, use the change-password endpoint separately or combine
            // Let's keep it simple: if newPassword is provided, we use a separate logic or the backend handles it.
            // Our backend has a separate /change-password route. Let's send it there if filled.
            
            if (formData.newPassword) {
                if (!formData.currentPassword) {
                    return showNotification('Current password is required to set a new password', 'error');
                }
                await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/change-password`, {
                    currentPassword: formData.currentPassword,
                    newPassword: formData.newPassword
                });
                showNotification('Password updated successfully', 'success');
            }

            // Remove password fields from profile update data
            delete updateData.currentPassword;
            delete updateData.newPassword;

            const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/users/${role}/${user.id}`, updateData);
            localStorage.setItem('user', JSON.stringify(res.data.user)); // Update local storage
            showNotification('Profile updated successfully', 'success');
            navigate('/profile');
        } catch (err) {
            showNotification(err.response?.data?.message || 'Update failed', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    if (!user) return <div className="text-center mt-10">Loading...</div>;

    return (
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-12">
            <div className="flex justify-between items-center mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-black text-black">Edit Profile</h1>
                <button 
                    onClick={() => navigate('/profile')}
                    className="text-[14px] font-bold  tracking-widest text-neutral-400 hover:text-black transition-colors"
                >
                   Go Back
                </button>
            </div>

            <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 border-2 border-gray-300 rounded-sm space-y-6">
                
                {/* Read Only Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-neutral-50 p-4 border border-neutral-200">
                    <div>
                        <label className="block text-[10px] font-black text-neutral-400  tracking-widest">Roll No</label>
                        <p className="font-mono text-neutral-800 text-sm">{user.rollNo}</p>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-neutral-400  tracking-widest">Email</label>
                        <p className="font-mono text-neutral-800 text-sm break-all">{user.email}</p>
                    </div>
                </div>

                {/* Editable Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-neutral-700  tracking-widest mb-2">Full Name</label>
                        <input 
                            type="text" 
                            name="name" 
                            value={formData.name} 
                            onChange={handleChange}
                            className="w-full p-3 border-2 border-neutral-200 rounded-sm focus:border-black outline-none transition-colors font-bold"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-neutral-700  tracking-widest mb-2">GitHub URL</label>
                        <input 
                            type="url" 
                            name="githubProfile" 
                            value={formData.githubProfile} 
                            onChange={handleChange}
                            placeholder="https://github.com/experimenthim0"
                            className="w-full p-3 border-2 border-neutral-200 rounded-sm focus:border-black outline-none transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-neutral-700  tracking-widest mb-2">LinkedIn URL</label>
                        <input 
                            type="url" 
                            name="linkedinProfile" 
                            value={formData.linkedinProfile} 
                            onChange={handleChange}
                            placeholder="https://linkedin.com/in/nikhilydv0148"
                            className="w-full p-3 border-2 border-neutral-200 rounded-sm focus:border-black outline-none transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-neutral-700  tracking-widest mb-2">X (Twitter) URL</label>
                        <input 
                            type="url" 
                            name="xProfile" 
                            value={formData.xProfile} 
                            onChange={handleChange}
                            placeholder="https://x.com/nikhil0148"
                            className="w-full p-3 border-2 border-neutral-200 rounded-sm focus:border-black outline-none transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-neutral-700  tracking-widest mb-2">Portfolio Website</label>
                        <input 
                            type="url" 
                            name="portfolioUrl" 
                            value={formData.portfolioUrl} 
                            onChange={handleChange}
                            placeholder="https://nikhim.me"
                            className="w-full p-3 border-2 border-neutral-200 rounded-sm focus:border-black outline-none transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-neutral-700  tracking-widest mb-2">Instagram URL</label>
                        <input 
                            type="url" 
                            name="instagramProfile" 
                            value={formData.instagramProfile} 
                            onChange={handleChange}
                            placeholder="https://instagram.com/jankaritag.in"
                            className="w-full p-3 border-2 border-neutral-200 rounded-sm focus:border-black outline-none transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-neutral-700  tracking-widest mb-2">WhatsApp Number</label>
                        <input 
                            type="tel" 
                            name="whatsappNumber" 
                            value={formData.whatsappNumber} 
                            onChange={handleChange}
                            placeholder="+91 98765 43210"
                            className="w-full p-3 border-2 border-neutral-200 rounded-sm focus:border-black outline-none transition-colors"
                        />
                    </div>
                </div>

                {role === 'club' && (
                    <div className="pt-8 md:pt-10 border-t-2 border-neutral-100 space-y-6">
                        <div className="flex items-center gap-3">
                             <i className="ri-bank-card-fill text-orange-600 text-xl" />
                             <h3 className="font-black text-black  tracking-tight">Financial Information</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                            <div>
                                <label className="block text-[10px] font-black text-neutral-500  tracking-widest mb-2">Bank Name</label>
                                <input 
                                    type="text" 
                                    name="bankName" 
                                    value={formData.bankName} 
                                    onChange={handleChange}
                                    placeholder="e.g. HDFC Bank"
                                    className="w-full p-3 border-2 border-neutral-200 rounded-sm focus:border-black outline-none transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-neutral-500  tracking-widest mb-2">Account Holder</label>
                                <input 
                                    type="text" 
                                    name="accountHolderName" 
                                    value={formData.accountHolderName} 
                                    onChange={handleChange}
                                    className="w-full p-3 border-2 border-neutral-200 rounded-sm focus:border-black outline-none transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-neutral-500  tracking-widest mb-2">Account Number</label>
                                <input 
                                    type="password" 
                                    name="accountNumber" 
                                    value={formData.accountNumber} 
                                    onChange={handleChange}
                                    className="w-full p-3 border-2 border-neutral-200 rounded-sm focus:border-black outline-none transition-colors font-mono"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-neutral-500  tracking-widest mb-2">IFSC Code</label>
                                <input 
                                    type="text" 
                                    name="ifscCode" 
                                    value={formData.ifscCode} 
                                    onChange={handleChange}
                                    className="w-full p-3 border-2 border-neutral-200 rounded-sm focus:border-black outline-none  font-mono"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-neutral-500  tracking-widest mb-2">UPI ID</label>
                                <input 
                                    type="text" 
                                    name="upiId" 
                                    value={formData.upiId} 
                                    onChange={handleChange}
                                    className="w-full p-3 border-2 border-neutral-200 rounded-sm focus:border-black outline-none transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-neutral-500  tracking-widest mb-2">Linked Phone</label>
                                <input 
                                    type="tel" 
                                    name="bankPhone" 
                                    value={formData.bankPhone} 
                                    onChange={handleChange}
                                    className="w-full p-3 border-2 border-neutral-200 rounded-sm focus:border-black outline-none transition-colors"
                                />
                            </div>
                        </div>
                        <p className="text-[10px] text-neutral-400 italic">
                            * Private information used only for event settlements.
                        </p>
                    </div>
                )}

                {/* Change Password Section */}
                <div className="pt-8 md:pt-10 border-t-2 border-black space-y-6">
                    <div className="flex items-center gap-3">
                         <i className="ri-lock-2-fill text-orange-600 text-xl" />
                         <h3 className="font-black text-black  tracking-tight">Security & Auth</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                        <div>
                            <label className="block text-[10px] font-black text-neutral-500  tracking-widest mb-2">Current Password</label>
                            <input 
                                type="password" 
                                name="currentPassword" 
                                value={formData.currentPassword || ''} 
                                onChange={handleChange}
                                className="w-full p-3 border-2 border-neutral-200 rounded-sm focus:border-black outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-neutral-500  tracking-widest mb-2">New Password (Optional)</label>
                            <input 
                                type="password" 
                                name="newPassword" 
                                value={formData.newPassword || ''} 
                                onChange={handleChange}
                                className="w-full p-3 border-2 border-neutral-200 rounded-sm focus:border-black outline-none"
                            />
                        </div>
                    </div>
                    <p className="text-[10px] text-neutral-400 italic">
                        * Limit: 2 password updates per 24 hours.
                    </p>

                    {/* 2FA Toggle */}
                    {(!['member', 'student'].includes(role)) && (
                    <div className="pt-6 border-t border-neutral-100">
                        <label className="flex items-center justify-between p-4 bg-orange-50 border-2 border-orange-200 rounded-sm cursor-pointer group hover:border-orange-600 transition-colors">
                            <div className="flex items-center gap-3">
                                <i className="ri-shield-check-line text-2xl text-orange-600" />
                                <div>
                                    <p className="text-sm font-black text-black  tracking-tight">2-Step Verification</p>
                                    <p className="text-[10px] text-neutral-600">Requires an email OTP code every time you login.</p>
                                </div>
                            </div>
                            <div className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={formData.isTwoStepEnabled}
                                    onChange={(e) => setFormData({ ...formData, isTwoStepEnabled: e.target.checked })}
                                    className="sr-only peer" 
                                />
                                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                            </div>
                        </label>
                    </div>
                    )}
                </div>

                <div className="pt-6 flex flex-col sm:flex-row gap-4">
                    <button 
                        type="button" 
                        onClick={() => navigate('/profile')}
                        className="flex-1 py-4 border-2 border-black text-black font-black  tracking-widest rounded-sm transition-colors hover:bg-gray-300/40 cursor-pointer"
                    >
                        Discard
                    </button>
                    <button 
                        type="submit" 
                        disabled={isSaving}
                        className={`flex-1 py-4 text-white font-black cursor-pointer tracking-widest rounded-sm transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none ${isSaving ? 'bg-neutral-400 cursor-not-allowed shadow-none' : 'bg-black hover:bg-orange-600'}`}
                    >
                        {isSaving ? 'Saving…' : 'Update Profile'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditProfile;
