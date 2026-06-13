import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const LostAndFound = () => {
  const [items, setItems] = useState([]);
  const [myItems, setMyItems] = useState([]);
  const [activeTab, setActiveTab] = useState('browse');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'Lost',
    image_url: '',
    image_public_id: '',
    whatsapp: ''
  });
  const [selectedContact, setSelectedContact] = useState(null);
  
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const role = localStorage.getItem('role');

  useEffect(() => {
    if (!user) return;
    fetchItems();
    if (user) fetchMyItems();
  }, [activeTab]);

  const fetchItems = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/lost-found`, { withCredentials: true });
      setItems(res.data);
    } catch (err) {
      toast.error('Failed to load items');
    }
  };

  const fetchMyItems = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/lost-found/my-posts`, { withCredentials: true });
      setMyItems(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return toast.error('Please login to post');
    setLoading(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/lost-found`, formData, { withCredentials: true });
      toast.success('Post created successfully!');
      setShowModal(false);
      setFormData({ title: '', description: '', type: 'Lost', image_url: '', image_public_id: '', whatsapp: '' });
      fetchItems();
      fetchMyItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id) => {
    try {
      await axios.patch(`${import.meta.env.VITE_API_URL}/api/lost-found/${id}/reunite`, {}, { withCredentials: true });
      toast.success('Item marked as Reunited');
      fetchItems();
      fetchMyItems();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleClaim = async (item) => {
    if (!window.confirm('Are you sure this item belongs to you or you found it? False claims can lead to account restriction.')) return;
    
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/lost-found/${item.id}/claim`, {}, { withCredentials: true });
      setSelectedContact({ ...item, contact_info: res.data.contact });
      toast.success('Claim initiated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to claim item');
    }
  };

  const handleReportLiar = async (itemId, liarId) => {
    if (!window.confirm('Report this user for false claiming? They will be restricted.')) return;
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/lost-found/${itemId}/report-liar`, { liarId }, { withCredentials: true });
      toast.success('User reported and restricted.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to report');
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error('File size exceeds 5MB limit.');
    setUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('image', file);
    try {
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/lost-found/upload`, formDataUpload, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData(prev => ({ ...prev, image_url: data.secure_url, image_public_id: data.public_id }));
      toast.success('Image uploaded!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Login Gate
  if (!user) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 bg-[#FDFCFB] dark:bg-[#0a0a0a]">
        <div className="bg-white dark:bg-[#1a1a1a] p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-neutral-800 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-orange-500 dark:text-orange-400">
            <i className="ri-lock-2-line text-2xl"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Login Required</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">You must be logged in to access the CampusNode Lost & Found community.</p>
          <button 
            onClick={() => navigate('/login')}
            className="w-full py-3 bg-black dark:bg-orange-600 text-white rounded-xl text-sm font-semibold hover:bg-orange-500 dark:hover:bg-orange-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB] dark:bg-[#0a0a0a] myfont pb-20">
      <Toaster position="top-right" />

      {/* Hero Section */}
      <div className="bg-white text-black py-16 px-6 relative overflow-hidden">
        <div className="max-w-[1200px] mx-auto relative z-10 text-center">
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-4">
            Lost <span className="text-orange-500">&</span> Found
          </h1>
          <p className="text-gray-400 text-sm font-medium text-center max-w-xl mx-auto leading-relaxed">
            A community space to help reunite lost belongings with their owners within the CampusNode network.
          </p>
        </div>
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 mt-10">

        {/* Actions Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-500 dark:border-neutral-800 pb-6 gap-4">
          <div className="flex bg-gray-100 dark:bg-neutral-900 p-1 rounded-lg gap-1">
            <button
              onClick={() => setActiveTab('browse')}
              className={`px-5 py-2 text-sm font-semibold rounded-md cursor-pointer transition-all  ${activeTab === 'browse' ? 'bg-black dark:bg-orange-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'} `}
            >
              Browse All
            </button>
            {user && (
              <button
                onClick={() => setActiveTab('my-items')}
                className={`px-5 py-2 text-sm font-semibold rounded-md cursor-pointer transition-all ${activeTab === 'my-items' ? 'bg-black dark:bg-orange-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}
              >
                My Posts
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Link 
              to="/lost-found/guide"
              className="p-2.5  text-gray-500 dark:text-neutral-400 rounded-full  hover:text-orange-500 transition-all group"
              title="View Community Guidelines"
            >
              <i className="ri-information-line text-lg" />
            </Link>
            {user && (
              <button
                onClick={() => setShowModal(true)}
                className="px-6 py-2.5 bg-orange-500 text-white rounded-full text-sm font-semibold hover:bg-orange-600 transition-colors shadow-sm cursor-pointer"
              >
                + Post an Item
              </button>
            )}
          </div>
        </div>

        {/* Cards Grid */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(activeTab === 'browse' ? items : myItems).map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-[#1a1a1a] border-2 border-gray-300 dark:border-neutral-800 rounded-2xl overflow-hidden hover:-translate-y-0.5 transition-transform duration-200 group flex flex-col"
            >
              {/* Image */}
              <div className="aspect-video bg-gray-50 relative overflow-hidden">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-200">
                    <i className="ri-image-line text-4xl" />
                  </div>
                )}

                {/* Type badge */}
                <span className={`absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${item.type === 'LOST' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'}`}>
                  {item.type}
                </span>

                {/* Resolved overlay */}
                {item.status === 'REUNITED' && (
                  <div className="absolute inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-[2px] flex items-center justify-center z-10">
                    <span className="px-5 py-1.5 bg-black dark:bg-orange-600 text-white rounded-full text-xs font-semibold -rotate-6">Reunited ✓</span>
                  </div>
                )}
              </div>

              {/* Body */}
              <div className="p-5 flex flex-col flex-1">
                <h3 className="text-base font-bold text-gray-900 dark:text-white leading-snug line-clamp-1 mb-1">{item.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed line-clamp-2 mb-4 flex-1">{item.description}</p>

                <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 mb-4">
                  <i className="ri-calendar-line" />
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  <span className="mx-1">·</span>
                  <i className="ri-user-line" />
                  <span>{activeTab === 'browse' ? (item.user?.name || 'Someone') : 'You'}</span>
                </div>

                <div className="flex gap-2">
                  {activeTab === 'my-items' && item.status === 'ACTIVE' && (
                    <button
                      onClick={() => handleResolve(item.id)}
                      className="flex-1 py-2 bg-black dark:bg-orange-600 text-white rounded-lg text-xs font-semibold hover:bg-gray-800 dark:hover:bg-orange-700 transition-colors"
                    >
                      Mark as Reunited
                    </button>
                  )}
                  {activeTab === 'browse' && user && item.userId !== user.id && item.status === 'ACTIVE' && (
                    <button
                      onClick={() => handleClaim(item)}
                      className="flex-1 py-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/50 rounded-lg text-xs font-semibold hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
                    >
                      {item.type === 'LOST' ? "I found this" : "It's Mine"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {(activeTab === 'browse' ? items : myItems).length === 0 && (
          <div className="py-24 text-center">
            <i className="ri-search-line text-5xl text-gray-200 dark:text-neutral-800 mb-4 block" />
            <h3 className="text-xl font-semibold text-gray-300 dark:text-neutral-700">No items found</h3>
          </div>
        )}
      </div>

      {/* Post Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-neutral-800 w-full max-w-lg p-8 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors text-gray-600 dark:text-gray-400"
            >
              <i className="ri-close-line" />
            </button>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Post an Item</h2>
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">Help the community find what's been lost or claimed.</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Item Title</label>
                <input
                  type="text" name="title" value={formData.title} onChange={handleChange}
                  className="w-full border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-lg p-3 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-300 dark:placeholder-neutral-700 focus:border-orange-400 focus:outline-none transition-colors"
                  placeholder="e.g. Blue water bottle at Library" required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Type</label>
                <select
                  name="type" value={formData.type} onChange={handleChange}
                  className="w-full border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-lg p-3 text-sm text-gray-800 dark:text-gray-200 focus:border-orange-400 focus:outline-none transition-colors"
                >
                  <option value="Lost">Lost</option>
                  <option value="Found">Found</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Description</label>
                <textarea
                  name="description" value={formData.description} onChange={handleChange}
                  className="w-full border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-lg p-3 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-300 dark:placeholder-neutral-700 focus:border-orange-400 focus:outline-none transition-colors h-24 resize-none"
                  placeholder="Where, when, and any unique marks…" required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">WhatsApp Number <span className="font-normal text-gray-300 dark:text-neutral-700">(optional)</span></label>
                <input
                  type="text" name="whatsapp" value={formData.whatsapp} onChange={handleChange}
                  className="w-full border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-lg p-3 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-300 dark:placeholder-neutral-700 focus:border-orange-400 focus:outline-none transition-colors"
                  placeholder="e.g. 9876543210"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Item Image <span className="font-normal text-gray-300 dark:text-neutral-700">(max 5 MB)</span></label>
                <input type="file" id="file-input" accept="image/*" onChange={handleFileChange} className="hidden" />
                <label
                  htmlFor="file-input"
                  className={`flex items-center justify-center gap-2 border border-dashed border-gray-300 dark:border-neutral-800 rounded-lg p-4 text-sm font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <i className={uploading ? 'ri-loader-4-line animate-spin' : 'ri-upload-2-line'} />
                  {uploading ? 'Uploading…' : formData.image_url ? 'Change image' : 'Select image'}
                </label>

                {formData.image_url && (
                  <div className="relative mt-3 rounded-lg overflow-hidden border border-gray-200 dark:border-neutral-800 h-36">
                    <img src={formData.image_url} alt="Preview" className="w-full h-full object-contain" />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                      className="absolute top-2 right-2 bg-black/60 text-white w-7 h-7 rounded-full flex items-center justify-center hover:bg-black transition-colors"
                    >
                      <i className="ri-close-line text-sm" />
                    </button>
                  </div>
                )}
              </div>

              <button
                type="submit" disabled={loading || uploading}
                className="w-full py-3 bg-black dark:bg-orange-600 text-white rounded-xl text-sm font-semibold hover:bg-orange-500 dark:hover:bg-orange-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Publishing…' : 'Publish Post'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {selectedContact && selectedContact.contact_info && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-neutral-800 w-full max-w-sm p-7 relative">
            <button
              onClick={() => setSelectedContact(null)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors text-gray-600 dark:text-gray-400"
            >
              <i className="ri-close-line" />
            </button>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-5">Contact Details</h2>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500 font-medium mb-0.5">Posted by</p>
                <p className="text-base font-bold text-gray-800 dark:text-gray-200">{selectedContact.contact_info.name}</p>
              </div>

              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500 font-medium mb-0.5">Email</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 break-all">{selectedContact.contact_info.email}</p>
              </div>

              {selectedContact.contact_info.whatsapp ? (
                <div className="pt-3 space-y-2">
                  <div className="flex gap-2">
                    <a
                      href={`https://wa.me/91${selectedContact.contact_info.whatsapp}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white p-2.5 rounded-lg text-sm font-semibold hover:bg-green-600 transition-colors"
                    >
                      <i className="ri-whatsapp-line" /> Message
                    </a>
                    <a
                      href={`tel:+91${selectedContact.contact_info.whatsapp}`}
                      className="flex-1 flex items-center justify-center gap-2 bg-orange-500 text-white p-2.5 rounded-lg text-sm font-semibold hover:bg-orange-600 transition-colors"
                    >
                      <i className="ri-phone-line" /> Call
                    </a>
                  </div>
                  <p className="text-center text-xs text-gray-400 dark:text-gray-500">+91 {selectedContact.contact_info.whatsapp}</p>
                </div>
              ) : (
                <p className="text-xs text-gray-400 dark:text-gray-500 italic pt-2 border-t border-gray-100 dark:border-neutral-800">No phone number provided — reach out via email.</p>
              )}

              <button
                onClick={() => setSelectedContact(null)}
                className="w-full mt-2 py-2.5 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-semibold hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LostAndFound;
