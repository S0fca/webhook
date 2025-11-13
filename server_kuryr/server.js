const express = require('express');
const app = express();
app.use(express.json());
const crypto = require('crypto');


const SHARED_SECRET = 'tajneheslo123';
function sendWebhook(order, status) {
    const body = JSON.stringify({
        id: order.id,
        status,
        event_id: crypto.randomUUID(), // unikátní ID události
    });

    const sig = crypto.createHmac('sha256', SHARED_SECRET)
        .update(body, 'utf8')
        .digest('hex');

    fetch(order.callbackUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Signature': sig,
        },
        body,
    })
        .then(res => console.log(`Webhook ${order.id} (${status}) → ${res.status}`))
        .catch(err => console.error('Webhook error:', err));
}

app.post('/order', (req, res) => {
    const order = req.body;
    console.log(`Přijata objednávka: ${order.id}`);
    res.sendStatus(202);

    setTimeout(() => {
        console.log(`${order.id}: Restaurace připravuje`);
        sendWebhook(order, 'Restaurace připravuje');


        setTimeout(() => {
            console.log(`${order.id}: Rozváží se`);
            sendWebhook(order, 'Rozváží se');

            setTimeout(() => {
                console.log(`${order.id}: Doručeno`);
                sendWebhook(order, 'Doručeno');
            }, 5000);

        }, 5000);
    }, 5000);
});


//res.sendStatus(202);


app.listen(3000, () => {
    console.log('Courier runs on http://localhost:3000');
});