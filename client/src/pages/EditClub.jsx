import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';

const EditClub = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        clubName: '',
        category: '',
        clubGallery: '',
        description: '',
        clubLogo: '',
        facultyCoordinators: '',
        studentCoordinators: '',
        clubInstagram: '',
        clubLinkedin: '',
        clubX: '',
        clubWebsite: '',
        clubWhatsapp: ''
    });

    useEffect(() => {
        const fetchClub = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/clubs/${id}`);
                const club = res.data.club;
                setFormData({
                    clubName: club.clubName || '',
                    category: club.category || '',
                    description: club.description || '',
                    clubLogo: club.clubLogo || '',
                    clubGallery: club.clubGallery?.join(', ') || '',
                    facultyCoordinators: club.facultyCoordinators?.join(', ') || '',
                    studentCoordinators: club.studentCoordinators?.join(', ') || '',
                    clubInstagram: club.clubInstagram || '',
                    clubLinkedin: club.clubLinkedin || '',
                    clubX: club.clubX || '',
                    clubWebsite: club.clubWebsite || '',
                    clubWhatsapp: club.clubWhatsapp || ''
                });
            } catch (err) {
                showNotification('Failed to fetch club data', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchClub();
    }, [id]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const processedData = {
                ...formData,
                facultyCoordinators: formData.facultyCoordinators.split(',').map(s => s.trim()).filter(s => s !== ''),
                studentCoordinators: formData.studentCoordinators.split(',').map(s => s.trim()).filter(s => s !== ''),
                clubGallery: formData.clubGallery.split(',').map(s => s.trim()).filter(s => s !== '')
            };
            const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/clubs/${id}`, processedData);
            
            // Sync updated club data back to local user object if it's the current user
            const storedUser = JSON.parse(localStorage.getItem('user'));
            if (storedUser && storedUser._id === id) {
              const updatedUser = { ...storedUser, ...res.data.club };
              localStorage.setItem('user', JSON.stringify(updatedUser));
            }

            showNotification('Club information updated successfully', 'success');
            navigate(`/club/${id}`);
        } catch (err) {
            showNotification(err.response?.data?.message || 'Update failed', 'error');
        }
    };

    if (loading) return <div className="text-center py-20">Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto px-6 py-12">
            <h1 className="text-3xl font-black uppercase tracking-tight mb-8">Edit Club Information</h1>
            <form onSubmit={handleSubmit} className="bg-white border-2 border-black p-8 shadow-[10px_10px_0px_#000] space-y-8">
                
                {/* Basic Info Section */}
                <div className="space-y-6">
                    <h3 className="font-black uppercase tracking-widest text-xs border-b-2 border-neutral-100 pb-2 flex items-center gap-2">
                        <i className="ri-information-line text-orange-600" /> Basic Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1">Club Name</label>
                            <input 
                                type="text" 
                                name="clubName" 
                                value={formData.clubName} 
                                onChange={handleChange}
                                className="w-full p-3 border-2 border-black focus:bg-orange-50 outline-none font-bold"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1">Category</label>
                            <input 
                                type="text" 
                                name="category" 
                                value={formData.category} 
                                onChange={handleChange}
                                placeholder="e.g. Technical, Cultural, Sports"
                                className="w-full p-3 border-2 border-black focus:bg-orange-50 outline-none font-bold"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1">Club Description</label>
                        <textarea 
                            name="description" 
                            value={formData.description} 
                            onChange={handleChange}
                            rows="4"
                            className="w-full p-3 border-2 border-black focus:bg-orange-50 outline-none font-bold"
                        ></textarea>
                    </div>
                </div>

                {/* Media & Coordinators */}
                <div className="space-y-6">
                    <h3 className="font-black uppercase tracking-widest text-xs border-b-2 border-neutral-100 pb-2 flex items-center gap-2">
                        <i className="ri-image-line text-orange-600" /> Identity & Coordinators
                    </h3>
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1">Club Logo URL</label>
                        <input 
                            type="url" 
                            name="clubLogo" 
                            value={formData.clubLogo} 
                            onChange={handleChange}
                            placeholder="https://example.com/logo.png"
                            className="w-full p-3 border-2 border-black focus:bg-orange-50 outline-none font-mono text-sm"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1">Faculty Coordinators (Comma separated)</label>
                            <textarea 
                                name="facultyCoordinators" 
                                value={formData.facultyCoordinators} 
                                onChange={handleChange}
                                placeholder="Dr. XYZ, Dr. ABC"
                                className="w-full p-3 border-2 border-black focus:bg-orange-50 outline-none font-bold"
                            ></textarea>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1">Student Coordinators (Comma separated)</label>
                            <textarea 
                                name="studentCoordinators" 
                                value={formData.studentCoordinators} 
                                onChange={handleChange}
                                placeholder="John Doe, Jane Smith"
                                className="w-full p-3 border-2 border-black focus:bg-orange-50 outline-none font-bold"
                            ></textarea>
                        </div>
                    </div>
                </div>



                {/* Club Gallery */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1">Club Gallery (Comma separated)</label>
                            <textarea 
                                name="clubGallery" 
                                value={formData.clubGallery} 
                                onChange={handleChange}
                                placeholder="https://himanshu.me/image1.jpg, https://nikhim.me/img.jpg"
                                className="w-full p-3 border-2 border-black focus:bg-orange-50 outline-none font-bold"
                            ></textarea>
                        </div>
                        </div> 

                {/* Social Links */}
                <div className="space-y-6">
                    <h3 className="font-black uppercase tracking-widest text-xs border-b-2 border-neutral-100 pb-2 flex items-center gap-2">
                        <i className="ri-share-line text-orange-600" /> Club Social Links
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1">Club Instagram URL</label>
                            <input type="url" name="clubInstagram" value={formData.clubInstagram} onChange={handleChange} className="w-full p-3 border-2 border-black focus:bg-orange-50 outline-none font-bold" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1">Club LinkedIn URL</label>
                            <input type="url" name="clubLinkedin" value={formData.clubLinkedin} onChange={handleChange} className="w-full p-3 border-2 border-black focus:bg-orange-50 outline-none font-bold" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1">Club X (Twitter) URL</label>
                            <input type="url" name="clubX" value={formData.clubX} onChange={handleChange} className="w-full p-3 border-2 border-black focus:bg-orange-50 outline-none font-bold" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1">Club Website URL</label>
                            <input type="url" name="clubWebsite" value={formData.clubWebsite} onChange={handleChange} className="w-full p-3 border-2 border-black focus:bg-orange-50 outline-none font-bold" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1">Club WhatsApp Number</label>
                            <input type="text" name="clubWhatsapp" value={formData.clubWhatsapp} onChange={handleChange} className="w-full p-3 border-2 border-black focus:bg-orange-50 outline-none font-bold" />
                        </div>
                    </div>
                </div>




                <div className="pt-8 flex gap-4">
                    <button type="button" onClick={() => navigate(`/club/${id}`)} className="flex-1 py-4 border-2 border-black font-black uppercase tracking-widest hover:bg-neutral-100 transition shadow-[4px_4px_0px_#000]">Cancel</button>
                    <button type="submit" className="flex-1 py-4 bg-black text-white font-black uppercase tracking-widest hover:bg-orange-600 transition shadow-[4px_4px_0px_#ea580c]">Save Club Changes</button>
                </div>
            </form>
        </div>
    );
};

export default EditClub;
