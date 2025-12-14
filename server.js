const express = require('express');
const cors = require('cors');
require('dotenv').config();

const productRoutes = require('./src/routes/products');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'API de Inventario - Microservicio REST',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      products: {
        list: 'GET /api/products',
        get: 'GET /api/products/:id',
        create: 'POST /api/products',
        updateStock: 'POST /api/products/:id/stock'
      }
    }
  });
});

app.use('/api/products', productRoutes);

app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'Endpoint no encontrado'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`

  API Inventario v1.0.0              
  ✓ Servidor: http://192.168.0.12:${PORT}  
  ✓ Base de datos: ${process.env.DB_HOST}:${process.env.DB_PORT}       

  `);
});