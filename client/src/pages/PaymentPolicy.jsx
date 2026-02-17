import React from 'react';
import { Link } from 'react-router-dom';

const PaymentPolicy = () => {
    return (
        <div className="max-w-4xl mx-auto px-4 py-16">
            <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-neutral-500 hover:text-black uppercase tracking-widest mb-8">
                <i className="ri-arrow-left-line" /> Back to Home
            </Link>

            <div className="bg-white border-2 border-black rounded-sm shadow-[6px_6px_0px_#0D0D0D] p-8 md:p-12">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-green-600 rounded-sm flex items-center justify-center">
                        <i className="ri-bank-card-line text-white text-xl" />
                    </div>
                    <h1 className="text-3xl font-black text-black tracking-tight">Payment Policy</h1>
                </div>
                <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mb-8">Last updated: February 2026</p>

                <div className="space-y-8 text-sm text-neutral-700 leading-relaxed">
                    <section>
                        <h2 className="text-lg font-black text-black mb-3">1. Payment Processing</h2>
                        <p>All payments on ClubSetu are processed securely through <strong>Razorpay</strong>, a PCI-DSS compliant payment gateway. ClubSetu does not store your card details or sensitive financial information directly.</p>
                    </section>

                    <section>
                        <h2 className="text-lg font-black text-black mb-3">2. Entry Fee & Pricing</h2>
                        <ul className="list-disc pl-6 space-y-1.5">
                            <li>Event organizers set the entry fee for their events. ClubSetu displays the fee transparently before registration.</li>
                            <li>All prices are displayed in Indian Rupees (INR).</li>
                            <li>The fee displayed at the time of registration is the final amount charged.</li>
                            <li>Free events do not require any payment.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-black text-black mb-3">3. Payment Confirmation</h2>
                        <ul className="list-disc pl-6 space-y-1.5">
                            <li>Registration is confirmed only after successful payment verification.</li>
                            <li>A confirmation notification will be displayed upon successful registration.</li>
                            <li>If payment fails, your registration will not be processed and no amount will be deducted.</li>
                            <li>In case of any discrepancy, please contact the support team immediately.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-black text-black mb-3">4. Refund Policy</h2>
                        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-sm p-4 mb-3">
                            <p className="text-yellow-800 font-bold text-sm"><i className="ri-information-line mr-1" /> Important</p>
                        </div>
                        <ul className="list-disc pl-6 space-y-1.5">
                            <li>Refunds for paid events are at the discretion of the event organizer.</li>
                            <li>If an event is cancelled by the organizer, full refunds will be processed within 7–10 working days.</li>
                            <li>Refund requests must be raised before the event start time.</li>
                            <li>To request a refund, contact the event organizer or email <a href="mailto:contact.nikhim@gmail.com" className="text-orange-600 font-bold hover:underline">contact.nikhim@gmail.com</a>.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-black text-black mb-3">5. Settlement to Event Organizers</h2>
                        <ul className="list-disc pl-6 space-y-1.5">
                            <li>Collected payments are settled to event organizers' linked bank accounts within 7 working days of event completion.</li>
                            <li>For settlement-related queries, organizers can contact <a href="mailto:contact.nikhim@gmail.com" className="text-orange-600 font-bold hover:underline">contact.nikhim@gmail.com</a>.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-black text-black mb-3">6. Failed Transactions</h2>
                        <p>If money is deducted but registration is not confirmed, the amount will be automatically refunded by Razorpay within 5–7 business days. If you do not receive the refund, contact us with your transaction details.</p>
                    </section>

                    <section>
                        <h2 className="text-lg font-black text-black mb-3">7. Contact</h2>
                        <p>For payment-related issues, email us at <a href="mailto:contact.nikhim@gmail.com" className="text-orange-600 font-bold hover:underline">contact.nikhim@gmail.com</a> with your registered email and transaction ID.</p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default PaymentPolicy;
