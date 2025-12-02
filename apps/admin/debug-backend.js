(async () => {
  try {
    console.log('Fetching from http://localhost:4000/api/admin/shipping/rates...');
    const res = await fetch('http://localhost:4000/api/admin/shipping/rates');
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Body:', text);
  } catch (e) {
    console.error('Error:', e);
  }
})();
