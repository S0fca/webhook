fetch('http://localhost:3000/order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        id: 'objednavka1',
        callbackUrl: 'http://localhost:3001/update'
    })
})
    .then(res => res.status)
    .then(status => console.log('Courier response:', status));
