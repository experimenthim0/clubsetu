import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const clubs = [
  { name: "GDSC NITJ" },
  { name: "Team Daksh" },
  { name: "Robotics Club" },
  { name: "LADC Society" },
  { name: "Fine Arts" },
  { name: "R-Tists" },
];

const BRANCHES = ['CSE', 'IT', 'ME', 'CH', 'IPE', 'ICE', 'ECE', 'EE', 'BT', 'TT', 'CE'];
const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'];
const PROGRAMS = ['BTECH', 'MTECH'];

const RegisterClubHead = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    clubName: '',
    phone: '',
    collegeEmail: '',
    rollNo: '',
    branch: '',
    year: '',
    program: '',
    designation: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/register/club-head`, formData);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      localStorage.setItem('role', res.data.role);
      localStorage.setItem('token', res.data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    'w-full px-4 py-2.5 border-2 border-neutral-200 rounded-sm text-[14px] text-black font-medium outline-none focus:border-orange-600 transition-colors placeholder-neutral-300';
  const labelCls =
    'block text-[11px] font-bold uppercase tracking-widest text-neutral-500 mb-1.5';

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center py-12 px-4">

      {/* Header */}
      <div className="w-full max-w-lg mb-8">
        <div className="flex items-center gap-2 mb-3 text-orange-600">
          <span className="block w-6 h-0.5 bg-orange-600" />
          <span className="text-[11px] font-bold uppercase tracking-[0.15em]">Club Management</span>
        </div>
        <h1 className="font-black text-[clamp(28px,5vw,40px)] leading-[1.1] tracking-tight text-black">
          Club Head<br />
          <span className="text-orange-600">Registration</span>
        </h1>
        <p className="text-[14px] text-neutral-500 mt-2">Register your club account to create and manage campus events.</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-lg bg-white border-2 border-black rounded-sm shadow-[4px_4px_0px_#0D0D0D] p-8">

        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border-2 border-red-400 text-red-700 text-[13px] font-bold px-4 py-3 rounded-sm">
              <i className="ri-error-warning-line text-lg shrink-0" />
              {error}
            </div>
          )}

          {/* Name + Club in a row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="name" className={labelCls}>Full Name</label>
              <input id="name" name="name" type="text" required className={inputCls}
                placeholder="Enter full name" value={formData.name} onChange={handleChange} />
            </div>
            <div>
              <label htmlFor="clubName" className={labelCls}>Club Name</label>
              <select id="clubName" name="clubName" required className={inputCls}
                value={formData.clubName} onChange={handleChange}>
                <option value="">Select a Club</option>
                {clubs.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </div>
          </div>

          {/* Phone + Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="phone" className={labelCls}>Phone Number</label>
              <input id="phone" name="phone" type="text" required className={inputCls}
                placeholder="Enter phone number" value={formData.phone} onChange={handleChange} />
            </div>
            <div>
              <label htmlFor="collegeEmail" className={labelCls}>College Email</label>
              <input id="collegeEmail" name="collegeEmail" type="email" required className={inputCls}
                placeholder="email@nitj.ac.in" value={formData.collegeEmail} onChange={handleChange} />
            </div>
          </div>

          {/* Roll No + Designation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="rollNo" className={labelCls}>Roll Number</label>
              <input id="rollNo" name="rollNo" type="text" required className={inputCls}
                placeholder="Enter roll number" value={formData.rollNo} onChange={handleChange} />
            </div>
            <div>
              <label htmlFor="designation" className={labelCls}>Designation</label>
              <input id="designation" name="designation" type="text" required className={inputCls}
                placeholder="e.g. President, VP" value={formData.designation} onChange={handleChange} />
            </div>
          </div>

          {/* Program + Branch + Year */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="program" className={labelCls}>Program</label>
              <select id="program" name="program" required className={inputCls}
                value={formData.program} onChange={handleChange}>
                <option value="">Select</option>
                {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="branch" className={labelCls}>Branch</label>
              <select id="branch" name="branch" required className={inputCls}
                value={formData.branch} onChange={handleChange}>
                <option value="">Select</option>
                {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="year" className={labelCls}>Year</label>
              <select id="year" name="year" required className={inputCls}
                value={formData.year} onChange={handleChange}>
                <option value="">Select</option>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className={labelCls}>Password</label>
            <input id="password" name="password" type="password" required className={inputCls}
              placeholder="Create a password" value={formData.password} onChange={handleChange} />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-black text-white border-2 border-black text-[12px] font-bold uppercase tracking-widest rounded-sm hover:bg-orange-600 hover:border-orange-600 transition-all hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
          >
            {loading ? (
              <><i className="ri-loader-4-line animate-spin" /> Registering…</>
            ) : (
              <><i className="ri-shield-user-line text-sm" /> Register as Club Head</>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 pt-5 border-t-2 border-neutral-100 text-center">
          <p className="text-[13px] text-neutral-500">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-orange-600 hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterClubHead;
