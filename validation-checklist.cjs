const https = require('https');
const http = require('http');

// Simple HTTP client for testing
function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const isHttps = url.startsWith('https');
        const client = isHttps ? https : http;
        
        const req = client.request(url, {
            method: options.method || 'GET',
            headers: options.headers || {},
            ...options
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({ status: res.statusCode, data: jsonData, headers: res.headers });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data, headers: res.headers });
                }
            });
        });
        
        req.on('error', (err) => reject(err));
        
        if (options.body) {
            req.write(options.body);
        }
        
        req.end();
    });
}

async function runValidationChecklist() {
    console.log('🚀 Starting CalistaLife.com Validation Checklist...\n');
    
    const results = {
        backend: { status: '❌', details: [] },
        frontend: { status: '❌', details: [] },
        database: { status: '❌', details: [] },
        admin: { status: '❌', details: [] },
        public: { status: '❌', details: [] },
        integrations: { status: '❌', details: [] }
    };
    
    // 1. Backend Health Check
    console.log('1. 🏥 Backend Health Check');
    try {
        const health = await makeRequest('http://localhost:3001/api/health');
        if (health.status === 200 && health.data.success) {
            results.backend.status = '✅';
            results.backend.details.push('Health endpoint responding');
            console.log('   ✅ Backend server is running on port 3001');
        } else {
            results.backend.details.push('Health endpoint failed');
            console.log('   ❌ Backend health check failed');
        }
    } catch (error) {
        results.backend.details.push(`Connection error: ${error.message}`);
        console.log('   ❌ Backend server not accessible');
    }
    
    // 2. Public API Endpoints
    console.log('\n2. 🌐 Public API Endpoints');
    try {
        const products = await makeRequest('http://localhost:3001/api/products');
        if (products.status === 200) {
            results.public.status = '✅';
            results.public.details.push(`Products endpoint: ${products.data.length || 0} products`);
            console.log(`   ✅ Products API: ${products.data.length || 0} products found`);
        } else {
            results.public.details.push('Products endpoint failed');
            console.log('   ❌ Products API failed');
        }
        
        const filters = await makeRequest('http://localhost:3001/api/products/filters');
        if (filters.status === 200) {
            const data = filters.data.data || {};
            const categoryCount = (data.categories || []).length;
            results.public.details.push(`Filters endpoint: ${categoryCount} categories available`);
            console.log(`   ✅ Filters API: ${categoryCount} categories found`);
        } else {
            results.public.details.push('Filters endpoint failed');
            console.log('   ❌ Filters API failed');
        }
        
        const collections = await makeRequest('http://localhost:3001/api/products/collections');
        if (collections.status === 200) {
            const collectionCount = (collections.data.data || []).length;
            results.public.details.push(`Collections endpoint: ${collectionCount} collections`);
            console.log(`   ✅ Collections API: ${collectionCount} collections found`);
        } else {
            results.public.details.push('Collections endpoint failed');
            console.log('   ❌ Collections API failed');
        }
    } catch (error) {
        results.public.details.push(`API error: ${error.message}`);
        console.log('   ❌ Public API endpoints not accessible');
    }
    
    // 3. Admin Endpoints (Protected)
    console.log('\n3. 🔐 Admin Endpoints');
    try {
        const adminRoot = await makeRequest('http://localhost:3001/api/calistasecretstoreewfsdca/');
        if (adminRoot.status === 404 && adminRoot.data.message === 'Not found') {
            results.admin.details.push('Root admin path properly protected');
            console.log('   ✅ Admin root path properly returns 404');
        }
        
        const adminSession = await makeRequest('http://localhost:3001/api/calistasecretstoreewfsdca/auth/session');
        if (adminSession.status === 401) {
            results.admin.status = '✅';
            results.admin.details.push('Session endpoint requires authentication');
            console.log('   ✅ Admin session endpoint requires authentication');
        }
    } catch (error) {
        results.admin.details.push(`Admin endpoint error: ${error.message}`);
        console.log('   ❌ Admin endpoints not accessible');
    }
    
    // 4. Frontend Availability (if running)
    console.log('\n4. 🎨 Frontend Availability');
    try {
        const frontend = await makeRequest('http://localhost:5174/');
        if (frontend.status === 200) {
            results.frontend.status = '✅';
            results.frontend.details.push('Frontend server responding');
            console.log('   ✅ Frontend server is running on port 5174');
        } else {
            results.frontend.details.push('Frontend not responding');
            console.log('   ❓ Frontend server not running (expected if not started)');
        }
    } catch (error) {
        results.frontend.details.push('Frontend not running');
        console.log('   ❓ Frontend server not running (start with: npm --prefix ./frontend run dev)');
    }
    
    // 5. Marketing/Email Integration
    console.log('\n5. 📧 Marketing Integration');
    try {
        const newsletter = await makeRequest('http://localhost:3001/api/marketing/newsletter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'test@example.com', source: 'validation-test' })
        });
        
        if (newsletter.status === 200 || newsletter.status === 201) {
            results.integrations.status = '✅';
            results.integrations.details.push('Newsletter signup endpoint working');
            console.log('   ✅ Newsletter signup endpoint responding');
        } else {
            results.integrations.details.push(`Newsletter endpoint returned ${newsletter.status}`);
            console.log(`   ❓ Newsletter endpoint returned ${newsletter.status}`);
        }
    } catch (error) {
        results.integrations.details.push(`Newsletter error: ${error.message}`);
        console.log('   ❌ Newsletter endpoint error');
    }
    
    // Summary
    console.log('\n📋 Validation Summary:');
    console.log('='.repeat(50));
    
    Object.entries(results).forEach(([category, result]) => {
        console.log(`${category.toUpperCase().padEnd(15)} ${result.status}`);
        result.details.forEach(detail => {
            console.log(`${' '.repeat(17)}• ${detail}`);
        });
    });
    
    console.log('\n🎯 Next Steps:');
    
    if (results.backend.status === '❌') {
        console.log('1. Start backend server: npm --prefix ./backend run dev');
    }
    
    if (results.frontend.status === '❌') {
        console.log('2. Start frontend server: npm --prefix ./frontend run dev');
    }
    
    console.log('3. Test admin login at: http://localhost:5174/calistasecretstoreewfsdca/enter');
    console.log('4. Create Supabase storage bucket named "products" for image uploads');
    console.log('5. Test end-to-end shopping flow from product selection to checkout');
    
    const overallSuccess = Object.values(results).filter(r => r.status === '✅').length;
    const totalChecks = Object.keys(results).length;
    
    console.log(`\n📊 Overall Status: ${overallSuccess}/${totalChecks} checks passed`);
    
    return overallSuccess === totalChecks;
}

if (require.main === module) {
    runValidationChecklist().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('Validation failed:', error);
        process.exit(1);
    });
}

module.exports = { runValidationChecklist };