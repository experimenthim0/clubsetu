import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNotification } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

const EditProfile = () => {
    const { showNotification } = useNotification();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        githubProfile: '',
        linkedinProfile: '',
        xProfile: '',
        portfolioUrl: '',
        whatsappNumber: '',
        isTwoStepEnabled: false,
        bankName: '',
        accountHolderName: '',
        accountNumber: '',
        ifscCode: '',
        upiId: '',
        bankPhone: ''
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
                instagramProfile: storedUser.instagramProfile || '',
                whatsappNumber: storedUser.whatsappNumber || '',
                isTwoStepEnabled: storedUser.isTwoStepEnabled || false,
                bankName: storedUser.bankName || '',
                accountHolderName: storedUser.accountHolderName || '',
                accountNumber: storedUser.accountNumber || '',
                ifscCode: storedUser.ifscCode || '',
                upiId: storedUser.upiId || '',
                bankPhone: storedUser.bankPhone || ''
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
                <h1 className="text-2xl md:text-3xl font-extrabold text-neutral-900 tracking-tight">Edit Profile</h1>
                <button 
                    onClick={() => navigate('/profile')}
                    className="text-sm font-semibold tracking-wide text-neutral-400 hover:text-orange-600 transition-colors cursor-pointer"
                >
                   Go Back
                </button>
            </div>

            <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 border border-neutral-200 rounded-xl space-y-6 shadow-sm">
                
                {/* Read Only Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-neutral-50/50 p-4 border border-neutral-200 rounded-lg">
                    <div>
                        <label className="block text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">Roll No</label>
                        <p className="font-mono text-neutral-600 text-sm">{user.rollNo}</p>
                    </div>
                    <div>
                        <label className="block text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">Email</label>
                        <p className="font-mono text-neutral-600 text-sm break-all">{user.email}</p>
                    </div>
                </div>

                {/* Editable Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-neutral-600 tracking-wider mb-2">Full Name</label>
                        <input 
                            type="text" 
                            name="name" 
                            value={formData.name} 
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 outline-none transition-all text-sm font-medium text-neutral-800"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-neutral-600 tracking-wider mb-2">GitHub URL</label>
                        <input 
                            type="url" 
                            name="githubProfile" 
                            value={formData.githubProfile} 
                            onChange={handleChange}
                            placeholder="https://github.com/experimenthim0"
                            className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 outline-none transition-all text-sm font-medium text-neutral-800"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-neutral-600 tracking-wider mb-2">LinkedIn URL</label>
                        <input 
                            type="url" 
                            name="linkedinProfile" 
                            value={formData.linkedinProfile} 
                            onChange={handleChange}
                            placeholder="https://linkedin.com/in/nikhilydv0148"
                            className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 outline-none transition-all text-sm font-medium text-neutral-800"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-neutral-600 tracking-wider mb-2">X (Twitter) URL</label>
                        <input 
                            type="url" 
                            name="xProfile" 
                            value={formData.xProfile} 
                            onChange={handleChange}
                            placeholder="https://x.com/nikhil0148"
                            className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 outline-none transition-all text-sm font-medium text-neutral-800"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-neutral-600 tracking-wider mb-2">Portfolio Website</label>
                        <input 
                            type="url" 
                            name="portfolioUrl" 
                            value={formData.portfolioUrl} 
                            onChange={handleChange}
                            placeholder="https://nikhim.me"
                            className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 outline-none transition-all text-sm font-medium text-neutral-800"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-neutral-600 tracking-wider mb-2">Instagram URL</label>
                        <input 
                            type="url" 
                            name="instagramProfile" 
                            value={formData.instagramProfile} 
                            onChange={handleChange}
                            placeholder="https://instagram.com/jankaritag.in"
                            className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 outline-none transition-all text-sm font-medium text-neutral-800"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-neutral-600 tracking-wider mb-2">WhatsApp Number</label>
                        <input 
                            type="tel" 
                            name="whatsappNumber" 
                            value={formData.whatsappNumber} 
                            onChange={handleChange}
                            placeholder="+91 98765 43210"
                            className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 outline-none transition-all text-sm font-medium text-neutral-800"
                        />
                    </div>
                </div>
                
                {/* Bank Information section - Restored for Club Account */}
                {(role === 'club') && (
                    <div className="pt-8 md:pt-10 border-t border-neutral-200 space-y-6">
                        <div className="flex items-center gap-3">
                             <i className="ri-bank-card-line text-orange-600 text-xl" />
                             <h3 className="font-bold text-neutral-900 tracking-tight">Financial Information</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-600 tracking-wider mb-2">Bank Name</label>
                                <input 
                                    type="text" name="bankName" value={formData.bankName} onChange={handleChange}
                                    placeholder="e.g. State Bank of India"
                                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 outline-none transition-all text-sm font-medium text-neutral-800 font-bold"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-600 tracking-wider mb-2">Account Holder Name</label>
                                <input 
                                    type="text" name="accountHolderName" value={formData.accountHolderName} onChange={handleChange}
                                    placeholder="Account Holder Name"
                                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 outline-none transition-all text-sm font-medium text-neutral-800 font-bold"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-600 tracking-wider mb-2">Account Number</label>
                                <input 
                                    type="text" name="accountNumber" value={formData.accountNumber} onChange={handleChange}
                                    placeholder="Account Number"
                                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 outline-none transition-all text-sm font-medium text-neutral-800 font-mono font-bold"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-600 tracking-wider mb-2">IFSC Code</label>
                                <input 
                                    type="text" name="ifscCode" value={formData.ifscCode} onChange={handleChange}
                                    placeholder="IFSC Code"
                                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 outline-none transition-all text-sm font-medium text-neutral-800 font-mono font-bold"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-600 tracking-wider mb-2">UPI ID</label>
                                <input 
                                    type="text" name="upiId" value={formData.upiId} onChange={handleChange}
                                    placeholder="e.g. nikhil@upi"
                                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 outline-none transition-all text-sm font-medium text-orange-655 text-orange-600 font-bold"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-600 tracking-wider mb-2">Linked Phone Number</label>
                                <input 
                                    type="tel" name="bankPhone" value={formData.bankPhone} onChange={handleChange}
                                    placeholder="Linked Phone Number"
                                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 outline-none transition-all text-sm font-medium text-neutral-800 font-bold"
                                />
                            </div>
                        </div>
                    </div>
                )}


                {/* Change Password Section */}
                <div className="pt-8 md:pt-10 border-t border-neutral-200 space-y-6">
                    <div className="flex items-center gap-3">
                          <i className="ri-lock-2-fill text-orange-600 text-xl" />
                          <h3 className="font-bold text-neutral-900 tracking-tight">Security & Auth</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                        <div>
                            <label className="block text-xs font-semibold text-neutral-600 tracking-wider mb-2">Current Password</label>
                            <div className="relative">
                                <input 
                                    type={showCurrentPassword ? "text" : "password"} 
                                    name="currentPassword" 
                                    value={formData.currentPassword || ''} 
                                    onChange={handleChange}
                                    placeholder="Enter current password"
                                    className="w-full px-4 py-2.5 pr-10 border border-neutral-200 rounded-lg focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 outline-none transition-all text-sm font-medium text-neutral-800"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600 cursor-pointer focus:outline-none"
                                >
                                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-neutral-600 tracking-wider mb-2">New Password (Optional)</label>
                            <div className="relative">
                                <input 
                                    type={showNewPassword ? "text" : "password"} 
                                    name="newPassword" 
                                    value={formData.newPassword || ''} 
                                    onChange={handleChange}
                                    placeholder="Enter new password (optional)"
                                    className="w-full px-4 py-2.5 pr-10 border border-neutral-200 rounded-lg focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 outline-none transition-all text-sm font-medium text-neutral-800"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600 cursor-pointer focus:outline-none"
                                >
                                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                    </div>
                    <p className="text-[10px] text-neutral-400 italic">
                        * Limit: 2 password updates per 24 hours.
                    </p>

                    {/* 2FA Toggle */}
                    {(!['member', 'student'].includes(role)) && (
                    <div className="pt-6 border-t border-neutral-200">
                        <label className="flex items-center justify-between p-4 bg-orange-50/40 border border-orange-200 rounded-xl cursor-pointer group hover:border-orange-500 transition-colors">
                            <div className="flex items-center gap-3">
                                <i className="ri-shield-check-line text-2xl text-orange-600" />
                                <div>
                                    <p className="text-sm font-semibold text-neutral-900 tracking-tight">2-Step Verification</p>
                                    <p className="text-[10px] text-neutral-500">Requires an email OTP code every time you login.</p>
                                </div>
                            </div>
                            <div className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={formData.isTwoStepEnabled}
                                    onChange={(e) => setFormData({ ...formData, isTwoStepEnabled: e.target.checked })}
                                    className="sr-only peer" 
                                    id="isTwoStepEnabledToggle"
                                />
                                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                            </div>
                        </label>
                    </div>
                    )}
                </div>

                <div className="pt-6 flex flex-col sm:flex-row justify-end gap-4">
                    <button 
                        type="button" 
                        onClick={() => navigate('/profile')}
                        className="py-2.5 px-8 border border-neutral-200 text-neutral-700 font-bold text-xs uppercase tracking-wider rounded-lg transition-colors hover:bg-neutral-50 cursor-pointer shadow-sm"
                    >
                        Discard
                    </button>
                    <button 
                        type="submit" 
                        disabled={isSaving}
                        className={`py-2.5 px-8 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm transition-all cursor-pointer ${isSaving ? 'bg-neutral-300 cursor-not-allowed shadow-none' : 'bg-orange-600 hover:bg-orange-700'}`}
                    >
                        {isSaving ? 'Saving…' : 'Update Profile'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditProfile;
