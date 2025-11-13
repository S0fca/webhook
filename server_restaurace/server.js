const express = require('express');
const crypto = require('crypto');

const app = express();
const SHARED_SECRET = 'tajneheslo123';

const orders = {};
const processedEvents = new Set();

app.use(express.json({
    verify: (req, res, buf) => {
        req.rawBody = buf.toString('utf8');
    }
}));

// html
app.use(express.static('public'));

// updade stavu objednavky
app.post('/update', (req, res) => {
    const sigHeader = (req.get('X-Signature') || '').trim();
    const expectedSig = crypto.createHmac('sha256', SHARED_SECRET)
        .update(req.rawBody)
        .digest('hex');

    if (sigHeader !== expectedSig) {
        console.warn('Neplatný podpis.');
        return res.sendStatus(401);
    }

    const { id, status, event_id } = req.body;

    if (!event_id) {
        console.warn('Chybí event_id v notifikaci.');
    } else if (processedEvents.has(event_id)) {
        console.log(`Duplicitní event (${event_id})`);
        return res.sendStatus(200);
    } else {
        processedEvents.add(event_id);
    }

    orders[id] = status;
    console.log(`Aktualizace objednávky ${id}: ${status}`);
    res.sendStatus(200);
});

// pro html
app.get('/orders', (req, res) => {
    res.json(orders);
});

app.listen(3001, () => {
    console.log('Restaurant runs on http://localhost:3001');
});

// poslat objednavky kuryrovy
const callbackUrl = 'http://localhost:3001/update';
for (let i = 0; i < 4; i++) {
    const id = `Objednávka ${i}`;

    fetch('http://localhost:3000/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, callbackUrl })
    })
        .then(r => console.log(`Objednávka ${id}: status ${r.status}`))
        .catch(err => console.error(`Chyba u objednávky ${id}:`, err.message));
}


// app.post('/order', (req, res) => {
//     const { id } = req.body;
//
//     if (!id) return res.status(400).json({ error: "Chybí id objednávky" });
//
//     const callbackUrl = 'http://localhost:3001/update';
//
//     fetch('http://localhost:3000/order', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ id, callbackUrl })
//     })
//         .then(r => res.json({ status: r.status }))
//         .catch(err => res.status(500).json({ error: err.message }));
// });

// curl -X POST http://localhost:3001/order -H "Content-Type: application/json" -d "{\"id\":\"Objednavka1\"}"
