import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'];

const CreateEvent = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        venue: '',
        startTime: '',
        endTime: '',
        totalSeats: '',
        entryFee: 0,
        imageUrl: '',
        requiredFields: [],
        customFields: [],
        registrationDeadline: '',
        createdBy: JSON.parse(localStorage.getItem('user'))?._id,
        allowedPrograms: ['BTECH', 'MTECH'],
        allowedYears: [],
    });
    const [isFree, setIsFree] = useState(true);
    const [isUnlimited, setIsUnlimited] = useState(false);
    const [allYears, setAllYears] = useState(true);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleProgramToggle = (prog) => {
        setFormData(prev => {
            const current = prev.allowedPrograms;
            if (current.includes(prog)) {
                if (current.length <= 1) return prev; // keep at least one
                return { ...prev, allowedPrograms: current.filter(p => p !== prog) };
            }
            return { ...prev, allowedPrograms: [...current, prog] };
        });
    };

    const handleYearToggle = (year) => {
        setFormData(prev => {
            const current = prev.allowedYears;
            if (current.includes(year)) {
                return { ...prev, allowedYears: current.filter(y => y !== year) };
            }
            return { ...prev, allowedYears: [...current, year] };
        });
    };

    // ── Custom Fields Handlers ──────────────────────────────────────────
    const addCustomField = () => {
        setFormData(prev => ({
            ...prev,
            customFields: [...prev.customFields, { label: '', type: 'text', required: false, options: [] }]
        }));
    };

    const removeCustomField = (index) => {
        setFormData(prev => ({
            ...prev,
            customFields: prev.customFields.filter((_, i) => i !== index)
        }));
    };

    const updateCustomField = (index, field, value) => {
        setFormData(prev => {
            const updated = [...prev.customFields];
            updated[index] = { ...updated[index], [field]: value };
            // Clear options if type is not select
            if (field === 'type' && value !== 'select') {
                updated[index].options = [];
            }
            return { ...prev, customFields: updated };
        });
    };

    const updateCustomFieldOption = (fieldIndex, optIndex, value) => {
        setFormData(prev => {
            const updated = [...prev.customFields];
            const opts = [...(updated[fieldIndex].options || [])];
            opts[optIndex] = value;
            updated[fieldIndex] = { ...updated[fieldIndex], options: opts };
            return { ...prev, customFields: updated };
        });
    };

    const addOptionToField = (fieldIndex) => {
        setFormData(prev => {
            const updated = [...prev.customFields];
            updated[fieldIndex] = { ...updated[fieldIndex], options: [...(updated[fieldIndex].options || []), ''] };
            return { ...prev, customFields: updated };
        });
    };

    const removeOptionFromField = (fieldIndex, optIndex) => {
        setFormData(prev => {
            const updated = [...prev.customFields];
            updated[fieldIndex] = { ...updated[fieldIndex], options: updated[fieldIndex].options.filter((_, i) => i !== optIndex) };
            return { ...prev, customFields: updated };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const start = new Date(formData.startTime);
        const end = new Date(formData.endTime);

        if (start >= end) {
            setError('End time must be after start time.');
            return;
        }

        if (formData.registrationDeadline && new Date(formData.registrationDeadline) > start) {
            setError('Registration deadline cannot be after event start time.');
            return;
        }

        const payload = {
            ...formData,
            totalSeats: isUnlimited ? 0 : Number(formData.totalSeats),
            allowedYears: allYears ? [] : formData.allowedYears,
        };

        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/events`, payload);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create event');
        }
    };

    const inputCls =
        'w-full px-4 py-3 border-2 border-neutral-200 rounded-sm focus:border-orange-600 focus:outline-none transition-colors';
    const labelCls =
        'block text-sm font-bold text-black mb-2';

    return (
        <div className="min-h-screen bg-neutral-50 py-12 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-black hover:text-orange-600 transition-colors mb-4"
                    >
                        <i className="ri-arrow-left-line" /> Back
                    </button>
                    <h1 className="text-4xl font-black text-black">Create New Event</h1>
                    <p className="text-neutral-600 mt-2">Fill in the details to publish a new event</p>
                </div>

                <form onSubmit={handleSubmit} className="bg-white border-2 border-black rounded-sm p-8 space-y-6 shadow-[8px_8px_0px_#0D0D0D]">
                    {error && (
                        <div className="flex items-center gap-2 bg-red-50 border-2 border-red-400 text-red-700 text-[13px] font-bold px-4 py-3 rounded-sm">
                            <i className="ri-error-warning-line text-lg" />
                            {error}
                        </div>
                    )}

                    {/* Event Title */}
                    <div>
                        <label className={labelCls}>Event Title <span className="text-orange-600">*</span></label>
                        <input type="text" name="title" required className={inputCls}
                            value={formData.title} onChange={handleChange} placeholder="Enter event title" />
                    </div>

                    {/* Description */}
                    <div>
                        <label className={labelCls}>Description</label>
                        <textarea name="description" rows="4" className={`${inputCls} resize-none`}
                            value={formData.description} onChange={handleChange} placeholder="Describe your event..." />
                    </div>

                    {/* Venue */}
                    <div>
                        <label className={labelCls}>Venue <span className="text-orange-600">*</span></label>
                        <select name="venue" required className={inputCls} value={formData.venue} onChange={handleChange}>
                            <option value="">Select Venue</option>
                            <option value="Student Activity Centre">Student Activity Centre</option>
                            <option value="IT Building - Lab 1">IT Building</option>
                            <option value="Central Lawn">Central Lawn</option>
                            <option value="Mega Ground">Mega Ground</option>
                            <option value="MBH Ground">MBH Ground</option>
                            <option value="OAT">OAT</option>
                            <option value="CSH">CSH</option>
                            <option value="VCH">VCH</option>
                            <option value="Others">Others</option>
                        </select>
                    </div>

                    {/* Start / End Time */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className={labelCls}>Start Time <span className="text-orange-600">*</span></label>
                            <input type="datetime-local" name="startTime" required className={inputCls}
                                value={formData.startTime} onChange={handleChange} />
                        </div>
                        <div>
                            <label className={labelCls}>End Time <span className="text-orange-600">*</span></label>
                            <input type="datetime-local" name="endTime" required className={inputCls}
                                value={formData.endTime} onChange={handleChange} />
                        </div>
                    </div>

                    {/* Registration Deadline */}
                    <div>
                        <label className={labelCls}>Registration Deadline</label>
                        <input type="datetime-local" name="registrationDeadline" className={inputCls}
                            value={formData.registrationDeadline} onChange={handleChange} />
                        <p className="text-xs text-neutral-500 mt-1">Optional: If left blank, registrations stay open until start time.</p>
                    </div>

                    {/* Total Seats */}
                    <div>
                        <label className={labelCls}>Total Seats <span className="text-orange-600">*</span></label>
                        <div className="flex items-center gap-4 mb-3">
                            <label className="inline-flex items-center cursor-pointer gap-2">
                                <input type="checkbox" className="w-4 h-4 text-orange-600 border-neutral-300 rounded focus:ring-orange-600"
                                    checked={isUnlimited} onChange={() => {
                                        setIsUnlimited(!isUnlimited);
                                        if (!isUnlimited) setFormData({ ...formData, totalSeats: '' });
                                    }} />
                                <span className="text-sm font-medium text-neutral-700">Unlimited Seats</span>
                            </label>
                        </div>
                        {!isUnlimited && (
                            <input type="number" name="totalSeats" required min="1" className={inputCls}
                                value={formData.totalSeats} onChange={handleChange} placeholder="Number of seats" />
                        )}
                    </div>

                    {/* Entry Fee */}
                    <div>
                        <label className={labelCls}>Entry Fee</label>
                        <div className="flex items-center gap-6 mb-3">
                            <label className="inline-flex items-center cursor-pointer">
                                <input type="radio" className="w-4 h-4 text-orange-600 border-neutral-300 focus:ring-orange-600"
                                    name="feeType" checked={isFree} onChange={() => { setIsFree(true); setFormData({ ...formData, entryFee: 0 }); }} />
                                <span className="ml-2 text-sm font-medium text-neutral-700">Free</span>
                            </label>
                            <label className="inline-flex items-center cursor-pointer">
                                <input type="radio" className="w-4 h-4 text-orange-600 border-neutral-300 focus:ring-orange-600"
                                    name="feeType" checked={!isFree} onChange={() => setIsFree(false)} />
                                <span className="ml-2 text-sm font-medium text-neutral-700">Paid</span>
                            </label>
                        </div>
                        {!isFree && (
                            <input type="number" name="entryFee" min="1" placeholder="Enter amount in ₹"
                                className={inputCls} value={formData.entryFee} onChange={handleChange} />
                        )}
                    </div>

                    {/* Allowed Programs */}
                    <div>
                        <label className={labelCls}>Allowed Programs</label>
                        <p className="text-xs text-neutral-500 mb-3">Select which programs can register for this event</p>
                        <div className="flex items-center gap-6">
                            {['BTECH', 'MTECH'].map(prog => (
                                <label key={prog} className="inline-flex items-center cursor-pointer gap-2">
                                    <input type="checkbox" className="w-4 h-4 text-orange-600 border-neutral-300 rounded focus:ring-orange-600"
                                        checked={formData.allowedPrograms.includes(prog)}
                                        onChange={() => handleProgramToggle(prog)} />
                                    <span className="text-sm font-medium text-neutral-700">{prog}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Allowed Years */}
                    <div>
                        <label className={labelCls}>Allowed Years</label>
                        <div className="flex items-center gap-4 mb-3">
                            <label className="inline-flex items-center cursor-pointer gap-2">
                                <input type="checkbox" className="w-4 h-4 text-orange-600 border-neutral-300 rounded focus:ring-orange-600"
                                    checked={allYears} onChange={() => {
                                        setAllYears(!allYears);
                                        if (!allYears) setFormData({ ...formData, allowedYears: [] });
                                    }} />
                                <span className="text-sm font-medium text-neutral-700">Allow All Years</span>
                            </label>
                        </div>
                        {!allYears && (
                            <div className="flex flex-wrap gap-3">
                                {YEARS.map(year => (
                                    <label key={year} className="inline-flex items-center cursor-pointer gap-2">
                                        <input type="checkbox" className="w-4 h-4 text-orange-600 border-neutral-300 rounded focus:ring-orange-600"
                                            checked={formData.allowedYears.includes(year)}
                                            onChange={() => handleYearToggle(year)} />
                                        <span className="text-sm font-medium text-neutral-700">{year}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Event Image URL */}
                    <div>
                        <label className={labelCls}>Event Image URL</label>
                        <input type="url" name="imageUrl" placeholder="https://example.com/event-image.jpg"
                            className={inputCls} value={formData.imageUrl} onChange={handleChange} />
                        <p className="text-xs text-neutral-500 mt-1">Optional: Enter a URL for the event banner image</p>
                    </div>

                    {/* Required Student Information */}
                    <div>
                        <label className={labelCls}>Required Student Information</label>
                        <p className="text-xs text-neutral-500 mb-3">Select which profile fields students must complete before registering</p>
                        <div className="space-y-2">
                            {[
                                { value: 'githubProfile', label: 'GitHub Profile' },
                                { value: 'linkedinProfile', label: 'LinkedIn Profile' },
                                { value: 'xProfile', label: 'X (Twitter) Profile' },
                                { value: 'portfolioUrl', label: 'Portfolio URL' }
                            ].map(field => (
                                <label key={field.value} className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" value={field.value}
                                        checked={formData.requiredFields.includes(field.value)}
                                        onChange={(e) => {
                                            const { checked } = e.target;
                                            setFormData(prev => ({
                                                ...prev,
                                                requiredFields: checked
                                                    ? [...prev.requiredFields, field.value]
                                                    : prev.requiredFields.filter(f => f !== field.value)
                                            }));
                                        }}
                                        className="w-4 h-4 text-orange-600 border-neutral-300 rounded focus:ring-orange-600" />
                                    <span className="text-sm text-neutral-700">{field.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Custom Registration Fields Builder */}
                    <div>
                        <label className={labelCls}>
                            Custom Registration Fields
                        </label>
                        <p className="text-xs text-neutral-500 mb-4">Add custom fields that students must fill during registration (like Google Forms)</p>

                        <div className="space-y-4">
                            {formData.customFields.map((cf, idx) => (
                                <div key={idx} className="border-2 border-neutral-200 rounded-sm p-4 relative bg-neutral-50">
                                    {/* Delete button */}
                                    <button
                                        type="button"
                                        onClick={() => removeCustomField(idx)}
                                        className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-sm transition-colors"
                                        title="Remove field"
                                    >
                                        <i className="ri-delete-bin-line text-lg" />
                                    </button>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pr-10">
                                        {/* Label */}
                                        <div>
                                            <label className="text-xs font-bold text-neutral-600 mb-1 block">Field Label <span className="text-orange-600">*</span></label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Team Name, GitHub Repo..."
                                                value={cf.label}
                                                onChange={(e) => updateCustomField(idx, 'label', e.target.value)}
                                                className={inputCls}
                                                required
                                            />
                                        </div>
                                        {/* Type */}
                                        <div>
                                            <label className="text-xs font-bold text-neutral-600 mb-1 block">Field Type</label>
                                            <select
                                                value={cf.type}
                                                onChange={(e) => updateCustomField(idx, 'type', e.target.value)}
                                                className={inputCls}
                                            >
                                                <option value="text">Text</option>
                                                <option value="url">Link / URL</option>
                                                <option value="textarea">Long Text</option>
                                                <option value="select">Dropdown</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Required toggle */}
                                    <label className="inline-flex items-center gap-2 mt-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={cf.required}
                                            onChange={(e) => updateCustomField(idx, 'required', e.target.checked)}
                                            className="w-4 h-4 text-orange-600 border-neutral-300 rounded focus:ring-orange-600"
                                        />
                                        <span className="text-sm text-neutral-600">Required</span>
                                    </label>

                                    {/* Dropdown Options */}
                                    {cf.type === 'select' && (
                                        <div className="mt-3 pl-4 border-l-2 border-orange-300">
                                            <p className="text-xs font-bold text-neutral-600 mb-2">Dropdown Options</p>
                                            {(cf.options || []).map((opt, optIdx) => (
                                                <div key={optIdx} className="flex items-center gap-2 mb-2">
                                                    <input
                                                        type="text"
                                                        placeholder={`Option ${optIdx + 1}`}
                                                        value={opt}
                                                        onChange={(e) => updateCustomFieldOption(idx, optIdx, e.target.value)}
                                                        className="flex-1 px-3 py-2 border-2 border-neutral-200 rounded-sm text-sm focus:border-orange-600 focus:outline-none transition-colors"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeOptionFromField(idx, optIdx)}
                                                        className="text-neutral-400 hover:text-red-500 transition-colors"
                                                    >
                                                        <i className="ri-close-line text-lg" />
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => addOptionToField(idx)}
                                                className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 mt-1"
                                            >
                                                <i className="ri-add-line" /> Add Option
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={addCustomField}
                            className="mt-4 w-full py-3 border-2 border-dashed border-neutral-300 rounded-sm text-sm font-bold text-neutral-500 hover:border-orange-600 hover:text-orange-600 transition-colors flex items-center justify-center gap-2"
                        >
                            <i className="ri-add-circle-line text-lg" /> Add Custom Field
                        </button>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 pt-6 border-t-2 border-neutral-100">
                        <button type="button" onClick={() => navigate(-1)}
                            className="flex-1 px-6 py-3 bg-white border-2 border-black text-black font-bold text-sm uppercase tracking-widest rounded-sm hover:bg-neutral-100 transition-colors">
                            Cancel
                        </button>
                        <button type="submit"
                            className="flex-1 px-6 py-3 bg-black border-2 border-black text-white font-bold text-sm uppercase tracking-widest rounded-sm hover:bg-orange-600 hover:border-orange-600 transition-colors">
                            Create Event
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateEvent;
