
const http = require('http');

http.get('http://localhost:4000/api/categories?limit=1000', (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            const cat = json.categories.find(c => c.name.includes('ازياء النساء') || c.name.includes('Women'));
            if (cat) {
                console.log('Found:', cat);
                // Also find exact match if possible
                const exact = json.categories.find(c => c.name === 'ازياء النساء');
                if (exact) console.log('Exact Match:', exact);
            } else {
                console.log('Not found');
            }

            // List all parents to see structure
            const parents = json.categories.filter(c => !c.parentId);
            console.log('Top level categories:', parents.map(c => ({ name: c.name, slug: c.slug, id: c.id })));

        } catch (e) {
            console.error(e);
        }
    });
});
