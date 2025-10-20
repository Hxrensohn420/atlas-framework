const express = require('express');
const app = express();

app.use(express.json());

// Proxy endpoints for Axiom
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'axiom-proxy' });
});

app.listen(3003, () => {
  console.log('Axiom Proxy running on port 3003');
});
