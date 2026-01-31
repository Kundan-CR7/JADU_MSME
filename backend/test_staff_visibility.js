const axios = require('axios');
const API_URL = 'http://localhost:3000';

async function testStaffVisibility() {
    try {
        console.log('1. Logging in as Admin...');
        // Assuming there is an admin seeded, or use one if known. 
        // If not, we might need to register one or use the one from previous context.
        // Let's try the default admin credentials if available, or just use the token logic if I can sign a token.
        // Since I can't easily sign a token without the secret, I'll rely on the existing auth service or login endpoint.
        // Let's assume the user has the default admin "admin@autokarya.com" / "admin123"

        let token;
        try {
            const login = await axios.post(`${API_URL}/auth/login`, {
                email: 'admin@autokarya.com',
                password: 'admin123'
            });
            token = login.data.token;
            console.log('   Login successful.');
        } catch (e) {
            console.log('   Login failed. Attempting to seed admin via controller directly? No, I cannot. Checking if I can register.');
            // Fallback: This script is running in node, I can't easily "register" if there is already an admin.
            // But the user said "staff member added... by admin". So admin exists.
            console.error('   Failed to login as default admin. You might need to check DB seed.');
            return;
        }

        console.log('\n2. Listing initial staff...');
        const initialList = await axios.get(`${API_URL}/staff`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`   Count: ${initialList.data.length}`);
        const initialIds = initialList.data.map(s => s.id);

        console.log('\n3. Creating new staff member...');
        const uniqueName = `TestStaff_${Date.now()}`;
        const newStaffPayload = {
            name: uniqueName,
            email: `${uniqueName}@test.com`,
            role: 'STAFF',
            password: 'password123',
            isAvailable: true
        };

        const createRes = await axios.post(`${API_URL}/staff`, newStaffPayload, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const newStaffId = createRes.data.id;
        console.log(`   Created Staff ID: ${newStaffId}`);

        console.log('\n4. Listing staff again to verify visibility...');
        const refreshedList = await axios.get(`${API_URL}/staff`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`   Count: ${refreshedList.data.length}`);

        const found = refreshedList.data.find(s => s.id === newStaffId);
        if (found) {
            console.log('   SUCCESS: New staff member is present in the list.');
        } else {
            console.error('   FAILURE: New staff member is NOT in the list.');
        }

        // Cleanup
        console.log('\n5. Cleaning up (Deleting test staff)...');
        await axios.delete(`${API_URL}/staff/${newStaffId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('   Cleaned up.');

    } catch (err) {
        console.error('An error occurred:', err.message);
        if (err.response) console.error('Response data:', err.response.data);
    }
}

testStaffVisibility();
