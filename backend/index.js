const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Scalabrianos API is running' });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  
  // Mock login logic
  if (email && password) {
    res.json({
      success: true,
      user: {
        id: 1,
        name: 'Admin Scalabriano',
        email: email,
        role: 'admin'
      },
      token: 'mock-jwt-token'
    });
  } else {
    res.status(400).json({ success: false, message: 'Invalid credentials' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
