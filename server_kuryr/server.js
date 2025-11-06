const express = require('express');
const app = express();
app.use(express.json());

// Endpoint pro přijetí nové objednávky
app.post('/order', (req, res) => {
const order = req.body;
console.log('Přijata objednávka:', order);
res.sendStatus(202);  // odpověď 202 Accepted – objednávka převzata k dalšímu zpracování
});

app.listen(3000, () => {
    console.log('Courier runs on http://localhost:3000');
});