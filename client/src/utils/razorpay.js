export const loadRazorpay = () => {
    return new Promise((resolve) => {
        // If script already exists and is loaded, resolve immediately
        if (window.Razorpay) {
            resolve(true);
            return;
        }

        // Check if script element already exists but not yet loaded
        const existingScript = document.getElementById('razorpay-checkout-js');
        if (existingScript) {
            existingScript.onload = () => resolve(true);
            existingScript.onerror = () => resolve(false);
            return;
        }

        const script = document.createElement('script');
        script.id = 'razorpay-checkout-js';
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};
