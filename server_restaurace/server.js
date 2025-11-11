const express = require('express');
const crypto = require('crypto');

const bodyParser = require('body-parser');

const app = express();
const SHARED_SECRET = 'tajneheslo123';

const orders = {};
const processedEvents = new Set();

app.use(bodyParser.json({
    verify: (req, res, buf) => {
        req.rawBody = buf.toString('utf8');
    }
}));

app.use(express.static('public'));

app.post('/update', (req, res) => {
    const sigHeader = (req.get('X-Signature') || '').trim();
    const expectedSig = crypto.createHmac('sha256', SHARED_SECRET)
        .update(req.rawBody)
        .digest('hex');

    if (sigHeader !== expectedSig) {
        console.warn('Neplatný podpis webhooku! Očekáváno:', expectedSig, 'Doručeno:', sigHeader);
        return res.sendStatus(401);
    }

    const { id, status, event_id } = req.body;

    if (!event_id) {
        console.warn('Chybí event_id v notifikaci, zpracovávám bez kontroly duplicit.');
    } else if (processedEvents.has(event_id)) {
        console.log(`Duplicitní událost (${event_id}) ignorována.`);
        return res.sendStatus(200);
    } else {
        processedEvents.add(event_id);
    }

    orders[id] = status;
    console.log(`Aktualizace objednávky ${id}: ${status}`);
    res.sendStatus(200);
});

app.get('/orders', (req, res) => {
    res.json(orders);
});

app.post('/order', (req, res) => {
    const { id } = req.body;
    const callbackUrl = 'http://localhost:3001/update';

    fetch('http://localhost:3000/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, callbackUrl })
    })
        .then(r => res.json({ status: r.status }))
        .catch(err => res.status(500).json({ error: err.message }));
});

app.listen(3001, () => {
    console.log('Restaurant runs on http://localhost:3001');
});
