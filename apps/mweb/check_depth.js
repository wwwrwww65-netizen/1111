import http from 'http';

http.get('http://localhost:4000/api/categories?limit=10000', (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            const cats = json.categories || [];

            // Build map
            const map = {};
            cats.forEach(c => map[c.id] = { ...c, children: [] });
            cats.forEach(c => {
                if (c.parentId && map[c.parentId]) {
                    map[c.parentId].children.push(c.id);
                }
            });

            // Find the reported category
            const targetId = '7a061c01-9b6e-472d-ab42-33e6cac52812';
            const target = map[targetId];

            if (!target) {
                console.log('Target category not found');
                return;
            }

            console.log(`Target: ${target.name} (${target.id})`);
            console.log(`Direct Children: ${target.children.length}`);

            // Check for grandchildren
            let grandChildrenCount = 0;
            target.children.forEach(childId => {
                const child = map[childId];
                if (child && child.children.length > 0) {
                    console.log(`  Child ${child.name} has ${child.children.length} children (Grandchildren of Target)`);
                    grandChildrenCount += child.children.length;
                }
            });

            console.log(`Total Grandchildren: ${grandChildrenCount}`);

        } catch (e) {
            console.error(e);
        }
    });
});
