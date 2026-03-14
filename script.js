const defaultOwners = [
    { username: 'chetan', password: '9423' },
    { username: 'owner2', password: '1234' },
    { username: 'owner3', password: '1234' }
];

const defaultProducts = [
    { id: 1, name: 'Rice', price: 60, stock: 50, image: 'https://via.placeholder.com/100?text=Rice '},
    { id: 2, name: 'Sugar', price: 40, stock: 40, image: 'https://via.placeholder.com/100?text=Sugar' },
    { id: 3, name: 'Milk', price: 60, stock: 20, image: 'https://via.placeholder.com/100?text=Milk' },
    { id: 4, name: 'Tea', price: 120, stock: 15, image: 'https://via.placeholder.com/100?text=Tea' },
    { id: 5, name: 'Cooking Oil', price: 150, stock: 10, image: 'https://via.placeholder.com/100?text=Oil' },
    { id: 6, name: 'Biscuits', price: 20, stock: 100, image: 'https://via.placeholder.com/100?text=Biscuits' }
];

let owners = JSON.parse(localStorage.getItem('groceryOwners'));

if (!owners) {
    owners = defaultOwners;
    localStorage.setItem('groceryOwners', JSON.stringify(owners));
}

let products = JSON.parse(localStorage.getItem('groceryProducts')) || defaultProducts;
let salesHistory = JSON.parse(localStorage.getItem('grocerySales')) || [];

function saveData() {
    localStorage.setItem('groceryOwners', JSON.stringify(owners));
    localStorage.setItem('groceryProducts', JSON.stringify(products));
    localStorage.setItem('grocerySales', JSON.stringify(salesHistory));
}

function login() {
    const userIn = document.getElementById('username');
    const passIn = document.getElementById('password');
    const errorMsg = document.getElementById('login-error');

    if (!userIn || !passIn) return;

    const foundOwner = owners.find(o => o.username === userIn.value && o.password === passIn.value);

    if (foundOwner) {
        sessionStorage.setItem('currentUser', foundOwner.username);
        errorMsg.textContent = '';
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('dashboard-section').classList.remove('hidden');
        initDashboard();
    } else {
        errorMsg.textContent = 'Invalid Username or Password';
    }
}

function logout() {
    sessionStorage.removeItem('currentUser');
    location.reload();
}

let currentUser = '';
let cart = [];
let currentBillData = null;

function initDashboard() {
    currentUser = sessionStorage.getItem('currentUser');
    if(currentUser) {
        document.getElementById('current-owner-display').textContent = `Welcome, ${currentUser}`;
    }
    
    renderProducts();
    renderCart();
    updateSalesSummary();
    document.getElementById('total-products').textContent = products.length;
}


function addNewProduct() {
    const nameInput = document.getElementById('new-prod-name');
    const priceInput = document.getElementById('new-prod-price');
    const stockInput = document.getElementById('new-prod-stock');
    const imgInput = document.getElementById('new-prod-img');

    const name = nameInput.value;
    const price = parseFloat(priceInput.value);
    const stock = parseInt(stockInput.value);
    
    let image = 'https://via.placeholder.com/100?text=Product';
    if (imgInput.files && imgInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            image = e.target.result;
            saveProductToDB(name, price, stock, image);
        };
        reader.readAsDataURL(imgInput.files[0]);
    } else {
        saveProductToDB(name, price, stock, image);
    }
}

function saveProductToDB(name, price, stock, image) {
    if (name && price && stock) {
        const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
        products.push({ id: newId, name, price, stock, image });
        saveData();
        renderProducts();
        updateSalesSummary();
        alert('Product Added Successfully!');
        
        document.getElementById('new-prod-name').value = '';
        document.getElementById('new-prod-price').value = '';
        document.getElementById('new-prod-stock').value = '';
        document.getElementById('new-prod-img').value = '';
    } else {
        alert('Please fill in all product details.');
    }
}

function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        products = products.filter(p => p.id !== id);
        saveData();
        renderProducts();
        updateSalesSummary();
    }
}

function updateStock(id) {
    const newStock = prompt('Enter new stock quantity:');
    if (newStock !== null && !isNaN(newStock)) {
        const product = products.find(p => p.id === id);
        if (product) {
            product.stock = parseInt(newStock);
            saveData();
            renderProducts();
            updateSalesSummary();
        }
    }
}

function renderProducts() {
    const container = document.getElementById('products-container');
    if (!container) return;
    
    container.innerHTML = '';

    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <img src="${product.image}" alt="${product.name}">
            <h4>${product.name}</h4>
            <p class="price">₹${product.price}</p>
            <p class="stock">Stock: ${product.stock}</p>
            <div class="product-actions">
                <button class="btn-sm btn-add-cart" onclick="addToCart(${product.id})">Add</button>
                <button class="btn-sm btn-edit" onclick="updateStock(${product.id})"><i class="fas fa-edit"></i></button>
                <button class="btn-sm btn-delete" onclick="deleteProduct(${product.id})"><i class="fas fa-trash"></i></button>
            </div>
        `;
        container.appendChild(card);
    });
}


function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    
    if (!product) return;

    if (product.stock <= 0) {
        alert('Out of Stock!');
        return;
    }

    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        if (existingItem.qty < product.stock) {
            existingItem.qty++;
        } else {
            alert('Cannot add more, stock limit reached.');
        }
    } else {
        cart.push({ ...product, qty: 1 });
    }
    renderCart();
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    renderCart();
}

function updateCartQty(productId, change) {
    const item = cart.find(i => i.id === productId);
    const product = products.find(p => p.id === productId);

    if (item && product) {
        const newQty = item.qty + change;
        if (newQty > 0 && newQty <= product.stock) {
            item.qty = newQty;
        } else if (newQty > product.stock) {
            alert('Stock limit reached');
        }
    }
    renderCart();
}

function renderCart() {
    const tbody = document.getElementById('cart-body');
    if (!tbody) return;

    tbody.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Cart is empty</td></tr>';
    } else {
        cart.forEach(item => {
            const itemTotal = item.price * item.qty;
            total += itemTotal;
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.name}</td>
                <td>₹${item.price}</td>
                <td>
                    <button onclick="updateCartQty(${item.id}, -1)" style="padding:2px 5px;">-</button>
                    <input type="number" value="${item.qty}" class="qty-input" onchange="updateCartQty(${item.id}, this.value - ${item.qty})">
                    <button onclick="updateCartQty(${item.id}, 1)" style="padding:2px 5px;">+</button>
                </td>
                <td>₹${itemTotal}</td>
                <td><button class="remove-btn" onclick="removeFromCart(${item.id})"><i class="fas fa-trash"></i></button></td>
            `;
            tbody.appendChild(row);
        });
    }

    document.getElementById('grand-total').textContent = total;
    return total;
}



function generateBill() {
    if (cart.length === 0) {
        alert('Cart is empty!');
        return;
    }

    const customerName = document.getElementById('customer-name').value || 'Walk-in Customer';
    const customerPhone = document.getElementById('customer-phone').value || 'Not Provided';

    const total = renderCart();
    const date = new Date();
    
    currentBillData = {
        id: Date.now(),
        date: date.toLocaleString(),
        dateOnly: date.toDateString(),
        customerName: customerName,
        customerPhone: customerPhone,
        items: [...cart],
        total: total,
        owner: currentUser
    };

    salesHistory.push(currentBillData);
    saveData();

    cart.forEach(cartItem => {
        const product = products.find(p => p.id === cartItem.id);
        if (product) {
            product.stock -= cartItem.qty;
        }
    });
    saveData();
    renderProducts();


    document.getElementById('bill-actions').classList.remove('hidden');
    

    updateSalesSummary();
    

    cart = [];
    renderCart();
    
 
    document.getElementById('customer-name').value = '';
    document.getElementById('customer-phone').value = '';
    
    alert('Bill Generated Successfully!');
}

function updateSalesSummary() {
    const today = new Date().toDateString();
    
    const todaySales = salesHistory.filter(sale => sale.dateOnly === today);
    
    const totalRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);
    const totalBills = todaySales.length;

    document.getElementById('total-revenue').textContent = totalRevenue;
    document.getElementById('total-bills-count').textContent = totalBills;
}

    
    currentBillData.items.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.name}</td>
            <td>₹${item.price}</td>
            <td>${item.qty}</td>
            <td>₹${item.price * item.qty}</td>
        `;
        pdfBody.appendChild(row);
    });

function shareWhatsApp() {
    if (!currentBillData) {
        alert('No bill to share! Please generate bill first.');
        return;
    }

    const customerName = currentBillData.customerName;
    const customerPhone = currentBillData.customerPhone;
    
    let message = `*Shri Revansiddheshwar Grocery Store*\n`;
    message += `Date: ${currentBillData.date}\n`;
    message += `Customer: ${customerName}\n`;
    message += `Phone: ${customerPhone}\n\n`;
    message += `*Items:*\n`;
    
    currentBillData.items.forEach(item => {
        message += `${item.name} x ${item.qty} = ₹${item.price * item.qty}\n`;
    });
    
    message += `\n*Total: ₹${currentBillData.total}*`;
    
    const encodedMessage = encodeURIComponent(message);
    
    if (customerPhone && customerPhone.length > 5) {
        window.location.href=`https://wa.me/91${customerPhone.replace(/\D/g, '')}?text=${encodedMessage}`, '_blank';
    } else {
        window.location.href=`https://wa.me/?text=${encodedMessage}`, '_blank';
    }
}

function shareSMS() {
    if (!currentBillData) {
        alert('No bill to share! Please generate bill first.');
        return;
    }

    const customerName = currentBillData.customerName;
    const customerPhone = currentBillData.customerPhone;

    let message = `Shri Revansiddheshwar Grocery Store\n`;
    message += `Customer: ${customerName}\n`;
    message += `Date: ${currentBillData.date}\n\n`;
    message += `Items:\n`;

    currentBillData.items.forEach(item => {
        message += `${item.name} - Qty: ${item.quantity} - ₹${item.price}\n`;
    });

    message += `\nTotal Amount: ₹${currentBillData.total}`;

    const encodedMessage = encodeURIComponent(message);

    if (customerPhone && customerPhone.length > 5) {
        window.open(`sms:+91${customerPhone.replace(/\D/g, '')}?body=${encodedMessage}`, '_blank');
    } else {
        window.open(`sms:?body=${encodedMessage}`, '_blank');
    }
}
window.onload = function() {
    if (sessionStorage.getItem('currentUser')) {
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('dashboard-section').classList.remove('hidden');
        initDashboard();
    }
};
function addProduct() {

    const name = document.getElementById("productName").value;
    const price = document.getElementById("productPrice").value;
    const file = document.getElementById("productImage").files[0];

    const reader = new FileReader();

    reader.onload = function(e){

        const image = e.target.result;

        const product = {
            name: name,
            price: price,
            image: image
        };

        let products = JSON.parse(localStorage.getItem("products")) || [];

        products.push(product);

        localStorage.setItem("products", JSON.stringify(products));

        loadProducts();
    };

    reader.readAsDataURL(file);
}
function loadProducts(){

    const products = JSON.parse(localStorage.getItem("products")) || [];

    const container = document.getElementById("productContainer");

    container.innerHTML = "";

    products.forEach(p => {

        const div = document.createElement("div");

        div.innerHTML = `
            <img src="${p.image}" width="120">
            <h3>${p.name}</h3>
            <p>₹${p.price}</p>
        `;

        container.appendChild(div);

    });

}
