import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
    return (
        <div className="max-w-4xl mx-auto px-4 py-16">
            <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-neutral-500 hover:text-black uppercase tracking-widest mb-8">
                <i className="ri-arrow-left-line" /> Back to Home
            </Link>

            <div className="bg-white border-2 border-black rounded-sm shadow-[6px_6px_0px_#0D0D0D] p-8 md:p-12">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-orange-600 rounded-sm flex items-center justify-center">
                        <i className="ri-shield-check-line text-white text-xl" />
                    </div>
                    <h1 className="text-3xl font-black text-black tracking-tight">Privacy Policy</h1>
                </div>
                <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mb-8">Last updated: February 2026</p>

                <div className="space-y-8 text-sm text-neutral-700 leading-relaxed">
                    <section>
                        <h2 className="text-lg font-black text-black mb-3">1. Introduction</h2>
                        <p>Welcome to ClubSetu. We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.</p>
                    </section>

                    <section>
                        <h2 className="text-lg font-black text-black mb-3">2. Information We Collect</h2>
                        <p className="mb-3">We collect information that you voluntarily provide to us when you register on the platform, including:</p>
                        <ul className="list-disc pl-6 space-y-1.5">
                            <li><strong>Personal Information:</strong> Name, email address, roll number, branch, year, and program.</li>
                            <li><strong>Profile Information:</strong> GitHub profile, LinkedIn profile, X (Twitter) profile, and portfolio URL.</li>
                            <li><strong>Event Registration Data:</strong> Responses to custom registration forms created by event organizers.</li>
                            <li><strong>Payment Information:</strong> Transaction IDs and payment status (actual payment processing is handled securely by Razorpay).</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-black text-black mb-3">3. How We Use Your Information</h2>
                        <ul className="list-disc pl-6 space-y-1.5">
                            <li>To facilitate event registration and management.</li>
                            <li>To process payments for paid events via Razorpay.</li>
                            <li>To allow club heads to manage their events and view participant information.</li>
                            <li>To communicate important updates about events you've registered for.</li>
                            <li>To improve our platform and user experience.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-black text-black mb-3">4. Information Sharing</h2>
                        <p className="mb-3">We share your information only in the following circumstances:</p>
                        <ul className="list-disc pl-6 space-y-1.5">
                            <li><strong>With Event Organizers:</strong> When you register for an event, the club head can view your registration details and form responses.</li>
                            <li><strong>Payment Processors:</strong> Payment data is shared with Razorpay for transaction processing.</li>
                            <li><strong>Legal Requirements:</strong> If required by law or to protect our rights.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-black text-black mb-3">5. Data Security</h2>
                        <p>We implement appropriate technical and organizational security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.</p>
                    </section>

                    <section>
                        <h2 className="text-lg font-black text-black mb-3">6. Your Rights</h2>
                        <ul className="list-disc pl-6 space-y-1.5">
                            <li>Access and update your personal information through your profile settings.</li>
                            <li>Request deletion of your account and associated data.</li>
                            <li>Opt out of non-essential communications.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-black text-black mb-3">7. Contact Us</h2>
                        <p>If you have questions about this Privacy Policy, please contact us at <a href="mailto:contact.nikhim@gmail.com" className="text-orange-600 font-bold hover:underline">contact.nikhim@gmail.com</a>.</p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
