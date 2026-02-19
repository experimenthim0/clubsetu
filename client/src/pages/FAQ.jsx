import React from 'react';

const FAQ = () => {
  return (
    <div className="min-h-screen bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-black text-black tracking-tight uppercase mb-8 text-center">Frequently Asked Questions</h1>
        
        <div className="space-y-6">
          
          {/* Email Verification Issues */}
          <div className="bg-white border-2 border-black p-6 rounded-sm shadow-[4px_4px_0px_#000]">
            <h2 className="text-xl font-bold text-black mb-2 flex items-center gap-2">
              <i className="ri-mail-close-line text-orange-600"></i>
              I didn't receive the verification email.
            </h2>
            <p className="text-neutral-600 text-sm leading-relaxed">
              First, please check your <strong>Spam</strong> or <strong>Junk</strong> folder. Emails from ClubSetu sometimes land there. 
              If you still can't find it, ensure you entered your email correctly during registration. 
              Note that students must use their <strong>NITJ college email</strong> (ending in <code>@nitj.ac.in</code>).
            </p>
          </div>

          <div className="bg-white border-2 border-black p-6 rounded-sm shadow-[4px_4px_0px_#000]">
            <h2 className="text-xl font-bold text-black mb-2 flex items-center gap-2">
              <i className="ri-error-warning-line text-red-600"></i>
              "Connection Refused" or "Localhost" error when verifying email.
            </h2>
            <p className="text-neutral-600 text-sm leading-relaxed">
              If you click the verification link and see an error about <code>localhost</code> or <code>connection refused</code>, it means the link was generated incorrectly. 
              We have recently fixed this issue. Please try registering again or contact a club head to manually help you if the issue persists.
            </p>
          </div>

          {/* Event Issues */}
          <div className="bg-white border-2 border-black p-6 rounded-sm shadow-[4px_4px_0px_#000]">
            <h2 className="text-xl font-bold text-black mb-2 flex items-center gap-2">
              <i className="ri-calendar-event-line text-blue-600"></i>
              "Event Not Found" error.
            </h2>
            <p className="text-neutral-600 text-sm leading-relaxed">
              This error usually appears if:
              <ul className="list-disc ml-5 mt-2 space-y-1">
                <li>The event has been <strong>deleted</strong> by the club head.</li>
                <li>The event link is incorrect or broken.</li>
                <li>The event ID in the URL is invalid.</li>
              </ul>
              Please go back to the <a href="/events" className="text-orange-600 font-bold underline">Events Feed</a> to find the correct event.
            </p>
          </div>

          {/* Login Issues */}
           <div className="bg-white border-2 border-black p-6 rounded-sm shadow-[4px_4px_0px_#000]">
            <h2 className="text-xl font-bold text-black mb-2 flex items-center gap-2">
              <i className="ri-login-circle-line text-purple-600"></i>
              I cannot login to my account.
            </h2>
            <p className="text-neutral-600 text-sm leading-relaxed">
              Ensure you have verified your email address. You cannot log in until your email is verified. 
              Also, double-check that you are selecting the correct role (<strong>Student</strong> vs <strong>Club Head</strong>) on the login page.
            </p>
          </div>

           {/* Contact Support */}
           <div className="bg-orange-50 border-2 border-orange-200 p-6 rounded-sm">
            <h2 className="text-lg font-bold text-orange-800 mb-2">
              Still have questions?
            </h2>
            <p className="text-orange-700 text-sm leading-relaxed">
              Reach out to us at <a href="mailto:clubsetu@nikhim.me" className="font-bold underline">clubsetu@nikhim.me</a> or contact your respective Club Head.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default FAQ;
