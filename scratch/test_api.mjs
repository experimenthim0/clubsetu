
import axios from 'axios';

const test = async () => {
    try {
        const res = await axios.get('http://localhost:5001/api/admin/clubs-list');
        console.log(JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.error(e.message);
    }
};
test();
