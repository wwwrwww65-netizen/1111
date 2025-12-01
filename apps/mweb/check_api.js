import http from 'http';

const url = 'http://localhost:4000/api/products?categoryIds=7a061c01-9b6e-472d-ab42-33e6cac52812&limit=1000';

http.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log('Status:', res.statusCode);
            console.log('Items count:', json.items ? json.items.length : 0);
            if (json.items && json.items.length > 0) {
                console.log('First item:', json.items[0].name);
            } else {
                console.log('Response:', JSON.stringify(json, null, 2));
            }
        } catch (e) {
            console.error('Error parsing JSON:', e);
            console.log('Raw data:', data);
        }
    });
}).on('error', (err) => {
    console.error('Error:', err.message);
});
