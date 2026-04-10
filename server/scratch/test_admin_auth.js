
import axios from 'axios';

const ADMIN_EMAIL = 'nikhil@admin.ac.in';
const ADMIN_PASS = 'nikhil@him0148';
const BASE_URL = 'http://localhost:5001/api';

async function testAdmin() {
    try {
        console.log('--- Testing Admin Login ---');
        const loginRes = await axios.post(`${BASE_URL}/admin/login`, {
            email: ADMIN_EMAIL,
            password: ADMIN_PASS
        });
        
        console.log('Login Success!');
        const token = loginRes.data.token;
        console.log('Token:', token);

        console.log('\n--- Testing Dashboard Stats ---');
        const statsRes = await axios.get(`${BASE_URL}/admin/dashboard-stats`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Stats Response:', statsRes.status, statsRes.data);

    } catch (err) {
        console.error('Error:', err.response?.status, err.response?.data || err.message);
    }
}

testAdmin();
