const pool = require('../config/database');

exports.getAllProducts = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, c.name as category_name 
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.created_at DESC
    `);
    
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: 'Error del servidor' });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT p.*, c.name as category_name 
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Producto no encontrado' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: 'Error del servidor' });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { name, description, category_id, price, stock, sku } = req.body;
    
    if (!name || !category_id || !price) {
      return res.status(400).json({ 
        success: false, 
        error: 'Campos requeridos: name, category_id, price' 
      });
    }
    
    const result = await pool.query(`
      INSERT INTO products (name, description, category_id, price, stock, sku)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [name, description, category_id, price, stock || 0, sku]);
    
    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: 'Error del servidor' });
  }
};

exports.updateStock = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const { movement_type, quantity, notes } = req.body;
    
    if (!movement_type || !quantity) {
      return res.status(400).json({ 
        success: false, 
        error: 'Campos requeridos: movement_type (IN/OUT), quantity' 
      });
    }
    
    await client.query('BEGIN');
    
    await client.query(`
      INSERT INTO stock_movements (product_id, movement_type, quantity, notes)
      VALUES ($1, $2, $3, $4)
    `, [id, movement_type, quantity, notes || '']);
    
    const delta = movement_type === 'IN' ? quantity : -quantity;
    const result = await client.query(`
      UPDATE products 
      SET stock = stock + $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [delta, id]);
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      message: 'Stock actualizado',
      data: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error:', error);
    res.status(500).json({ success: false, error: 'Error del servidor' });
  } finally {
    client.release();
  }
};