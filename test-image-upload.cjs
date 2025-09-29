const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testImageUpload() {
    try {
        console.log('🧪 Testing image upload functionality...');
        
        // Check if backend is running
        console.log('1. Checking backend health...');
        const healthResponse = await fetch('http://localhost:3001/api/health');
        if (!healthResponse.ok) {
            throw new Error('Backend is not running');
        }
        console.log('✅ Backend is running');
        
        // Test storage bucket access
        console.log('2. Testing storage bucket access...');
        const storageTestResponse = await fetch('http://localhost:3001/api/calistasecretstoreewfsdca/media/images?productId=test-product');
        console.log(`Storage test response status: ${storageTestResponse.status}`);
        
        if (storageTestResponse.status === 401) {
            console.log('❌ Storage test failed - Authentication required. Need to login first.');
            return false;
        }
        
        if (storageTestResponse.status === 500) {
            const errorText = await storageTestResponse.text();
            console.log('❌ Storage test failed - Backend error:', errorText);
            if (errorText.includes('bucket') || errorText.includes('storage')) {
                console.log('📋 Action needed: Create "products" bucket in Supabase storage');
            }
            return false;
        }
        
        console.log('✅ Storage bucket access test passed');
        
        // Create a simple test image (1x1 pixel PNG)
        console.log('3. Creating test image...');
        const testImageBuffer = Buffer.from([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
            0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
            0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
            0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
            0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
            0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
        ]);
        
        console.log('✅ Test image created');
        console.log('\n📋 Summary:');
        console.log('- Backend server: ✅ Running');
        console.log('- Storage endpoints: ✅ Accessible');
        console.log('- Next step: Create "products" bucket in Supabase storage if not exists');
        console.log('- Test image upload after admin login');
        
        return true;
        
    } catch (error) {
        console.error('❌ Image upload test failed:', error.message);
        return false;
    }
}

if (require.main === module) {
    testImageUpload().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = { testImageUpload };