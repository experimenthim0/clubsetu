import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, AlertTriangle, UserX, Info, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const LostFoundGuide = () => {
    const navigate = useNavigate();
    const { isDark } = useTheme();

    const sections = [
        {
            title: "General Guidelines",
            icon: <Info className="w-6 h-6 text-blue-500" />,
            content: [
                "Only post items that were lost or found within the campus premises.",
                "Ensure titles are clear and descriptive (e.g., 'Blue Water Bottle' instead of just 'Lost').",
                "Be honest and accurate in your descriptions.",
                "Avoid posting duplicate entries for the same item."
            ]
        },
        {
            title: "Safety & Privacy",
            icon: <ShieldCheck className="w-6 h-6 text-green-500" />,
            content: [
                "Never share sensitive personal information like bank details or home addresses.",
                "Arrange item handovers in well-lit, public areas on campus.",
                "If you are a student, consider meeting at the security desk or student center.",
                "Verify the ownership of the item by asking for specific details not mentioned in the post."
            ]
        },
        {
            title: "Moderation & Blocking",
            icon: <UserX className="w-6 h-6 text-red-500" />,
            content: [
                "Fraudulent posts will be immediately flagged and removed.",
                "Users attempting to scam others will face a permanent ban from the Lost & Found portal.",
                "Providing false contact information is grounds for a temporary suspension.",
                "Repeated violations of guidelines will lead to a total account block on CampusNode."
            ]
        },
        {
            title: "Prohibited Actions",
            icon: <AlertTriangle className="w-6 h-6 text-orange-500" />,
            content: [
                "Posting illegal or restricted items.",
                "Using the platform for promotional or commercial purposes.",
                "Harassing or spamming users who have posted items.",
                "Impersonating authorities or other students."
            ]
        }
    ];

    return (
        <div className={`min-h-screen ${isDark ? 'bg-[#0a0a0a] text-white' : 'bg-[#FDFCFB] text-gray-900'} transition-colors duration-300 pb-20`}>
            {/* Header */}
            <div className={`${isDark ? 'bg-neutral-900' : 'bg-white'} border-b ${isDark ? 'border-neutral-800' : 'border-gray-100'} top-0 z-50`}>
                <div className="max-w-4xl mx-auto px-6 h-16 flex items-center gap-4">
                    <button 
                        onClick={() => navigate(-1)}
                        className={`p-2 rounded-full ${isDark ? 'hover:bg-neutral-800' : 'hover:bg-gray-100'} transition-colors`}
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-xl font-black tracking-tight">L&F Community Guide</h1>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-12">
                {/* Hero */}
                <div className="text-center mb-16">
                    <div className="inline-flex p-3 rounded-2xl bg-orange-500/10 text-orange-500 mb-6">
                        <ShieldCheck className="w-10 h-10" />
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">Trust & Safety</h2>
                    <p className={`text-lg ${isDark ? 'text-neutral-400' : 'text-gray-500'} max-w-2xl mx-auto`}>
                        CampusNode Lost & Found is built on student trust. Help us keep the community safe and helpful by following these essential guidelines.
                    </p>
                </div>

                {/* Sections */}
                <div className="grid gap-8">
                    {sections.map((section, idx) => (
                        <div 
                            key={idx} 
                            className={`${isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-white border-gray-100'} border rounded-3xl p-8 shadow-sm`}
                        >
                            <div className="flex items-center gap-4 mb-6">
                                <div className={`p-3 rounded-xl ${isDark ? 'bg-neutral-800' : 'bg-gray-50'}`}>
                                    {section.icon}
                                </div>
                                <h3 className="text-2xl font-black tracking-tight">{section.title}</h3>
                            </div>
                            <ul className="space-y-4">
                                {section.content.map((item, i) => (
                                    <li key={i} className="flex gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                                        <span className={isDark ? 'text-neutral-300' : 'text-gray-600'}>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Disclaimer */}
                <div className={`mt-16 p-8 rounded-3xl ${isDark ? 'bg-red-900/10 border-red-900/20' : 'bg-red-50 border-red-100'} border text-center`}>
                    <p className={`text-sm font-medium ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                        <strong>Disclaimer:</strong> CampusNode acts only as a platform for communication. We are not responsible for any transactions, lost items, or interactions between users. Please exercise caution at all times.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LostFoundGuide;
