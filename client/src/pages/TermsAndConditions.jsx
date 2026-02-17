import React from 'react';
import { Link } from 'react-router-dom';

const TermsAndConditions = () => {
    return (
        <div className="max-w-4xl mx-auto px-4 py-16">
            <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-neutral-500 hover:text-black uppercase tracking-widest mb-8">
                <i className="ri-arrow-left-line" /> Back to Home
            </Link>

            <div className="bg-white border-2 border-black rounded-sm shadow-[6px_6px_0px_#0D0D0D] p-8 md:p-12">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-black rounded-sm flex items-center justify-center">
                        <i className="ri-file-text-line text-white text-xl" />
                    </div>
                    <h1 className="text-3xl font-black text-black tracking-tight">Terms & Conditions</h1>
                </div>
                <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mb-8">Last updated: February 2026</p>

                <div className="space-y-8 text-sm text-neutral-700 leading-relaxed">
                    <section>
                        <h2 className="text-lg font-black text-black mb-3">1. Acceptance of Terms</h2>
                        <p>By accessing and using ClubSetu, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use the platform.</p>
                    </section>

                    <section>
                        <h2 className="text-lg font-black text-black mb-3">2. User Accounts</h2>
                        <ul className="list-disc pl-6 space-y-1.5">
                            <li>You must provide accurate and complete information during registration.</li>
                            <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
                            <li>You must not share your account with others or create multiple accounts.</li>
                            <li>ClubSetu reserves the right to suspend or terminate accounts that violate these terms.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-black text-black mb-3">3. Event Registration</h2>
                        <ul className="list-disc pl-6 space-y-1.5">
                            <li>Registering for an event is a commitment to attend. Please deregister in advance if you cannot attend.</li>
                            <li>Event organizers may set eligibility criteria (program, year) that must be met for registration.</li>
                            <li>Registration is on a first-come, first-served basis, subject to seat availability.</li>
                            <li>Waitlisted registrations are automatically promoted when seats become available.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-black text-black mb-3">4. Club Heads & Event Organizers</h2>
                        <ul className="list-disc pl-6 space-y-1.5">
                            <li>Club heads are responsible for the accuracy of event information they publish.</li>
                            <li>Club heads must not misuse participant data collected during registration.</li>
                            <li>Events must comply with institutional guidelines and policies.</li>
                            <li>ClubSetu reserves the right to remove events that violate community guidelines.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-black text-black mb-3">5. Prohibited Activities</h2>
                        <ul className="list-disc pl-6 space-y-1.5">
                            <li>Creating fake events or spam content.</li>
                            <li>Attempting to manipulate registration counts or payment systems.</li>
                            <li>Harassing other users or event organizers.</li>
                            <li>Using the platform for unauthorized commercial purposes.</li>
                            <li>Attempting to access other users' accounts or data.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-black text-black mb-3">6. Limitation of Liability</h2>
                        <p>ClubSetu is provided "as is" without warranties of any kind. We are not liable for any damages resulting from your use of the platform, including but not limited to event cancellations, payment disputes, or data loss.</p>
                    </section>

                    <section>
                        <h2 className="text-lg font-black text-black mb-3">7. Changes to Terms</h2>
                        <p>We may update these terms from time to time. Continued use of the platform after changes constitutes acceptance of the updated terms.</p>
                    </section>

                    <section>
                        <h2 className="text-lg font-black text-black mb-3">8. Contact</h2>
                        <p>For questions regarding these terms, contact us at <a href="mailto:contact.nikhim@gmail.com" className="text-orange-600 font-bold hover:underline">contact.nikhim@gmail.com</a>.</p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default TermsAndConditions;
