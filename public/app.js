const API_URL = 'http://192.168.0.12:3000/api';

// Cargar productos al iniciar
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
});

// Cargar todos los productos
async function loadProducts() {
    try {
        const response = await fetch(`${API_URL}/products`);
        const data = await response.json();
        
        if (data.success) {
            displayProducts(data.data);
            updateStats(data.data);
        } else {
            showError('Error al cargar productos');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('No se pudo conectar con el servidor');
    }
}

// Mostrar productos en la tabla
function displayProducts(products) {
    const tbody = document.getElementById('productsBody');
    
    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="loading">No hay productos registrados</td></tr>';
        return;
    }
    
    tbody.innerHTML = products.map(product => `
        <tr>
            <td>${product.id}</td>
            <td><code>${product.sku || 'N/A'}</code></td>
            <td><strong>${product.name}</strong></td>
            <td>${product.category_name || 'Sin categoría'}</td>
            <td>Bs. ${parseFloat(product.price).toFixed(2)}</td>
            <td class="${getStockClass(product.stock)}">${product.stock}</td>
            <td>
                <button class="btn btn-success" onclick="openStockModal(${product.id}, '${product.name}')">
                    📊 Stock
                </button>
            </td>
        </tr>
    `).join('');
}

// Clase CSS según nivel de stock
function getStockClass(stock) {
    if (stock === 0) return 'stock-low';
    if (stock < 10) return 'stock-medium';
    return 'stock-high';
}

// Actualizar estadísticas
function updateStats(products) {
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, p) => sum + parseInt(p.stock), 0);
    const totalValue = products.reduce((sum, p) => sum + (parseFloat(p.price) * parseInt(p.stock)), 0);
    
    document.getElementById('totalProducts').textContent = totalProducts;
    document.getElementById('totalStock').textContent = totalStock;
    document.getElementById('totalValue').textContent = `Bs. ${totalValue.toFixed(2)}`;
}

// Mostrar formulario de agregar producto
function showAddProductForm() {
    document.getElementById('addProductForm').style.display = 'block';
}

// Ocultar formulario
function hideAddProductForm() {
    document.getElementById('addProductForm').style.display = 'none';
    document.getElementById('addProductForm').querySelector('form').reset();
}

// Crear nuevo producto
async function createProduct(event) {
    event.preventDefault();
    
    const productData = {
        name: document.getElementById('productName').value,
        sku: document.getElementById('productSku').value,
        description: document.getElementById('productDesc').value,
        category_id: parseInt(document.getElementById('productCategory').value),
        price: parseFloat(document.getElementById('productPrice').value),
        stock: parseInt(document.getElementById('productStock').value)
    };
    
    try {
        const response = await fetch(`${API_URL}/products`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(productData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('✅ Producto creado exitosamente');
            hideAddProductForm();
            loadProducts();
        } else {
            alert('❌ Error: ' + data.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ No se pudo crear el producto');
    }
}

// Abrir modal de stock
function openStockModal(productId, productName) {
    document.getElementById('stockProductId').value = productId;
    document.getElementById('stockProductName').textContent = `Producto: ${productName}`;
    document.getElementById('stockModal').style.display = 'flex';
}

// Cerrar modal de stock
function closeStockModal() {
    document.getElementById('stockModal').style.display = 'none';
    document.getElementById('stockQuantity').value = '';
    document.getElementById('stockNotes').value = '';
}

// Actualizar stock
async function updateStock() {
    const productId = document.getElementById('stockProductId').value;
    const movementType = document.getElementById('movementType').value;
    const quantity = parseInt(document.getElementById('stockQuantity').value);
    const notes = document.getElementById('stockNotes').value;
    
    if (!quantity || quantity < 1) {
        alert('❌ La cantidad debe ser mayor a 0');
        return;
    }
    
    const stockData = {
        movement_type: movementType,
        quantity: quantity,
        notes: notes
    };
    
    try {
        const response = await fetch(`${API_URL}/products/${productId}/stock`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(stockData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('✅ Stock actualizado correctamente');
            closeStockModal();
            loadProducts();
        } else {
            alert('❌ Error: ' + data.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ No se pudo actualizar el stock');
    }
}

// Mostrar errores
function showError(message) {
    const tbody = document.getElementById('productsBody');
    tbody.innerHTML = `<tr><td colspan="7" class="loading" style="color: #f56565;">${message}</td></tr>`;
}