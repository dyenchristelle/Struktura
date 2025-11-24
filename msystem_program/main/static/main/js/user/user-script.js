function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}


// Dapat ito sa script.js file
let cartIcon = document.querySelector('.fa-cart-shopping'); // Bagong selector
let cartSidebar = document.getElementById('cart-sidebar');
let cartOverlay = document.getElementById('cart-overlay');
let closeCartBtn = document.getElementById('close-cart');

// Toggle cart sidebar
function toggleCart() {
    cartSidebar.classList.toggle('active');
    cartOverlay.classList.toggle('active');
}

// I-check kung exist ang elements bago mag-add ng event listeners
if (cartIcon && cartSidebar && cartOverlay && closeCartBtn) {
    cartIcon.addEventListener('click', toggleCart);
    closeCartBtn.addEventListener('click', toggleCart);
    cartOverlay.addEventListener('click', toggleCart);
} else {
    console.log('Some cart elements not found');
}


//ADD TO CART FUNTION
// Cart functionality
let cart = [];

// Add to cart from item container
document.querySelectorAll('.add-to-cart-btn').forEach((button, index) => {
    button.addEventListener('click', function(e) {
        e.stopPropagation(); // Prevent opening modal
        
        const itemContainer = this.closest('.Item_container');
        const productImg = itemContainer.querySelector('.product-img').src;
        const productName = itemContainer.querySelector('.product-name').textContent;
        const productPrice = itemContainer.querySelector('.product-price').textContent;
        
        addToCart({
            id: index + 1,
            name: productName,
            price: productPrice,
            image: productImg,
            quantity: 1
        });
    });
});

// Add to cart from modal
document.querySelector('.add-to-cart-modal').addEventListener('click', function(e) {
    e.stopPropagation();
    const quantity = parseInt(document.getElementById('quantity').value);
    const productName = document.getElementById('modal-name').textContent;
    const productPrice = document.getElementById('modal-price').textContent;
    const productImg = document.getElementById('modal-img').src;
    
    addToCart({
        id: Date.now(), // Unique ID
        name: productName,
        price: productPrice,
        image: productImg,
        quantity: quantity
    });
    
    closeProductModal();
});

// Add to cart function - FIXED
function addToCart(product) {
    // Check if product already exists in cart
    const existingProductIndex = cart.findIndex(item => 
        item.name === product.name && item.price === product.price
    );
    
    if (existingProductIndex !== -1) {
        // If product exists, update quantity
        cart[existingProductIndex].quantity += product.quantity;
    } else {
        // If new product, add as new item with unique ID
        cart.push({
            ...product,
            id: Date.now() + Math.random() // More unique ID
        });
    }
    
    updateCartDisplay();
    showCartNotification();
}

// Update cart display with price calculation
// Update cart display with price calculation
// Update cart display with price calculation
function updateCartDisplay() {
    const listCart = document.getElementById('listCart');
    const checkoutBtn = document.querySelector('.checkout-btn'); // Ito ang nasa cart-footer
    const totalAmountElement = document.querySelector('.total-amount');
    
    // Clear current cart items ONLY
    listCart.innerHTML = '';
    
    if (cart.length === 0) {
        listCart.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Your cart is empty</p>';
        checkoutBtn.disabled = true;
        totalAmountElement.textContent = '₱0.00';
        updateCartBadge();
        return;
    }
    
    // Add each item to cart as separate items
    cart.forEach((item, index) => {
        const itemPrice = parseFloat(item.price.replace('₱', '').replace(',', ''));
        const totalPrice = itemPrice * item.quantity;
        
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-items';
        cartItem.innerHTML = `
            <div class="image">
                <img src="${item.image}" alt="${item.name}">
            </div>
            <div class="name">${item.name}</div>
            <div class="totalPrice">₱${totalPrice.toLocaleString('en-PH', {minimumFractionDigits: 2})}</div>
            <div class="quantity">
                <span class="minus" data-index="${index}">-</span>
                <span>${item.quantity}</span>
                <span class="plus" data-index="${index}">+</span>
            </div>
            <div class="remove" data-index="${index}">🗑️</div>
        `;
        listCart.appendChild(cartItem);
    });
    
    // Update total amount
    const totalAmount = calculateTotalAmount();
    totalAmountElement.textContent = totalAmount;
    
    // Enable checkout button
    checkoutBtn.disabled = false;
    
    // Add event listeners for quantity controls and remove buttons
    addCartItemEventListeners();
}

document.addEventListener('DOMContentLoaded', function() {
    updateCartDisplay();
    updateCartBadge(); // Initialize badge on page load
});

// Calculate total amount for all items
function calculateTotalAmount() {
    const total = cart.reduce((total, item) => {
        const price = parseFloat(item.price.replace('₱', '').replace(',', ''));
        return total + (price * item.quantity);
    }, 0);
    
    return total.toLocaleString('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2
    });
}

// Add event listeners to cart items
function addCartItemEventListeners() {
    // Plus buttons
    document.querySelectorAll('.quantity .plus').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            cart[index].quantity += 1;
            updateCartDisplay();
            updateCartBadge(); // Update badge when quantity changes
        });
    });
    
    // Minus buttons
    document.querySelectorAll('.quantity .minus').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            if (cart[index].quantity > 1) {
                cart[index].quantity -= 1;
                updateCartDisplay();
                updateCartBadge(); // Update badge when quantity changes
            }
        });
    });
    
    // Remove buttons
    document.querySelectorAll('.remove').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            cart.splice(index, 1);
            updateCartDisplay();
            updateCartBadge(); // Update badge when item is removed
        });
    });
}

// Update cart badge function
function updateCartBadge() {
    const cartIcon = document.querySelector('.fa-cart-shopping');
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    
    // Add or update badge
    let badge = cartIcon.querySelector('.cart-badge');
    if (!badge) {
        badge = document.createElement('span');
        badge.className = 'cart-badge';
        cartIcon.appendChild(badge);
    }
    
    // Update badge content
    if (totalItems > 0) {
        badge.textContent = totalItems > 99 ? '99+' : totalItems;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none'; // Hide badge when cart is empty
    }
    
    // Show animation
    cartIcon.style.transform = 'scale(1.1)';
    setTimeout(() => {
        cartIcon.style.transform = 'scale(1)';
    }, 200);
}






// Show cart notification
function showCartNotification() {

    const cartIcon = document.querySelector('.fa-cart-shopping');
    

    // Add notification badge
    let badge = cartIcon.querySelector('.cart-badge');
    if (!badge) {
        badge = document.createElement('span');
        badge.className = 'cart-badge';
        cartIcon.appendChild(badge);
    }
    
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    badge.textContent = totalItems;
    
    // Show animation
    cartIcon.style.transform = 'scale(1.2)';
    setTimeout(() => {
        cartIcon.style.transform = 'scale(1)';
    }, 300);

        updateCartBadge();
}

// Checkout functionality
document.querySelector('.checkout-btn').addEventListener('click', function() {
    if (cart.length === 0) return;
    
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    const totalAmount = calculateTotalAmount();
    
    alert(`Proceeding to checkout with ${totalItems} items. Total: ${totalAmount}`);
    // Here you can redirect to checkout page or show checkout form
});

// Calculate total amount
function calculateTotalAmount() {
    return cart.reduce((total, item) => {
        const price = parseFloat(item.price.replace('₱', '').replace(',', ''));
        return total + (price * item.quantity);
    }, 0).toLocaleString('en-PH', {
        style: 'currency',
        currency: 'PHP'
    });
}

// Initialize cart
updateCartDisplay();






// MODAL

// Dynamic Product Modal Functionality
const productModal = document.getElementById('product-modal');
const modalOverlay = document.getElementById('modal-overlay');
const closeModal = document.querySelector('.close-modal');

// Get product data from the clicked item container
function openProductModal(container) {
    // Get data from data attributes (for description and image fallback)
    const productId = container.dataset.productId;
    const productName = container.dataset.productName;
    const productPrice = container.dataset.productPrice;
    const productDescription = container.dataset.productDescription;
    const productImage = container.dataset.productImage;
    
    // Set modal content
    document.getElementById('modal-img').src = productImage;
    document.getElementById('modal-name').textContent = productName;
    document.getElementById('modal-price').textContent = `₱${parseFloat(productPrice).toLocaleString()}`;
    document.getElementById('modal-description').textContent = productDescription;

    // Store product ID for cart actions
    productModal.dataset.currentProductId = productId;

    productModal.classList.add('active');
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    // --- Send product to Django for browsing history ---
    fetch('/api/save_browsing_history/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-CSRFToken': getCookie('csrftoken') // Make sure you have a getCookie function
        },
        body: `product_id=${productId}`
    })
    .then(response => response.json())
    .then(data => {
        console.log("Browsing history saved:", data);
    });
}

// Open modal when item container is clicked
document.querySelectorAll('.Item_container').forEach((container) => {
    container.addEventListener('click', function(e) {
        // Don't open modal if Add to Cart button was clicked
        if (!e.target.classList.contains('add-to-cart-btn')) {
            openProductModal(container);
        }
    });
});

// CLOSE PRODUCT MODAL
function closeProductModal() {
    productModal.classList.remove('active');
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';

    // Reset quantity to 1
    document.getElementById('quantity').value = 1;
}

// Quantity controls - Unlimited with event propagation fix
document.querySelector('.quantity-btn.minus').addEventListener('click', function(e) {
    e.stopPropagation();
    const quantityInput = document.getElementById('quantity');
    const currentValue = parseInt(quantityInput.value);
    quantityInput.value = currentValue > 1 ? currentValue - 1 : 1;
});

document.querySelector('.quantity-btn.plus').addEventListener('click', function(e) {
    e.stopPropagation();
    const quantityInput = document.getElementById('quantity');
    const currentValue = parseInt(quantityInput.value);
    quantityInput.value = currentValue + 1;
});

// Allow any positive number
document.getElementById('quantity').addEventListener('input', function(e) {
    e.stopPropagation();
    this.value = this.value.replace(/[^0-9]/g, '');
    if (this.value === '' || parseInt(this.value) < 1) {
        this.value = 1;
    }
});

// Prevent modal from closing when clicking inside quantity controls
document.querySelector('.quantity-selector').addEventListener('click', function(e) {
    e.stopPropagation();
});

// Add to cart from modal
document.querySelector('.add-to-cart-modal').addEventListener('click', function(e) {
    e.stopPropagation();
    const quantity = document.getElementById('quantity').value;
    const productName = document.getElementById('modal-name').textContent;

    if (parseInt(quantity) > 1000) {
        alert('Maximum order quantity is 1000 per transaction. Please contact us for bulk orders.');
        return;
    }

    alert(`Added ${quantity} ${productName}(s) to cart!`);
    closeProductModal();
});

// Buy now from modal
document.querySelector('.buy-now').addEventListener('click', function(e) {
    e.stopPropagation();
    const quantity = document.getElementById('quantity').value;
    const productName = document.getElementById('modal-name').textContent;

    alert(`Proceeding to checkout with ${quantity} ${productName}(s)...`);
    closeProductModal();
});

// Close modal with ESC key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeProductModal();
    }
});

// Event listeners for modal
closeModal.addEventListener('click', closeProductModal);
modalOverlay.addEventListener('click', closeProductModal);

// Helper function for CSRF token
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}








//SEARCH
const searchInput = document.querySelector(".search-bar input");

// Tracks the current shown category ("all" or specific)
let currentCategory = "all";

// Update category whenever you click a category button
categoryButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        currentCategory = btn.dataset.category;
    });
});

// When clicking ALL PRODUCTS
allProductsLink.addEventListener("click", () => {
    currentCategory = "all";
});

// SEARCH LOGIC
searchInput.addEventListener("input", () => {
    const keyword = searchInput.value.toLowerCase().trim();

    items.forEach(item => {
        const name = item.querySelector(".product-name").textContent.toLowerCase();
        const itemCategory = item.dataset.category;

        // check if item belongs to current category or all
        const allowed =
            currentCategory === "all" || itemCategory === currentCategory;

        if (!allowed) {
            item.style.display = "none";
            return;
        }

        // if search box is empty -> show everything under current category
        if (keyword === "") {
            item.style.display = "flex";
            return;
        }

        // filtering by name
        item.style.display = name.includes(keyword) ? "flex" : "none";
    });
});



// profile info
function saveInfo(event) {
  event.preventDefault(); // prevent form submit first

  const form = document.getElementById('accountForm');
  const data = Object.fromEntries(new FormData(form).entries());

  if (!data.fullname || !data.email || !data.phone || !data.address) {
    alert('Please fill the required fields marked with *');
    return; // stop here
  }

  alert('Account information saved successfully.');

  form.submit(); // now submit the form to Django
}


// logout
function logout(){
    if (confirm("Are you sure you want to log out?")) {
        window.location.href = "/logout/?next=home_user"; 
    }
}


// ==== recently viewed ===
// Recently Viewed Sidebar Toggle Functions
function openRecentlyViewedSidebar() {
    document.getElementById('recently-viewed-sidebar').classList.add('open');
    const overlay = document.getElementById('recently-viewed-overlay');
    if (overlay) {
        overlay.classList.add('show');
    }
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

function closeRecentlyViewedSidebar() {
    document.getElementById('recently-viewed-sidebar').classList.remove('open');
    const overlay = document.getElementById('recently-viewed-overlay');
    if (overlay) {
        overlay.classList.remove('show');
    }
    document.body.style.overflow = ''; // Restore scrolling
}

// Event listeners for sidebar
const recentlyViewedIcon = document.getElementById('recently-viewed-icon');
const closeRecentlyViewedBtn = document.getElementById('close-recently-viewed');
const recentlyViewedOverlay = document.getElementById('recently-viewed-overlay');

if (recentlyViewedIcon) {
    recentlyViewedIcon.addEventListener('click', openRecentlyViewedSidebar);
}

if (closeRecentlyViewedBtn) {
    closeRecentlyViewedBtn.addEventListener('click', closeRecentlyViewedSidebar);
}

if (recentlyViewedOverlay) {
    recentlyViewedOverlay.addEventListener('click', closeRecentlyViewedSidebar);
}

// Close with ESC key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const sidebar = document.getElementById('recently-viewed-sidebar');
        if (sidebar && sidebar.classList.contains('open')) {
            closeRecentlyViewedSidebar();
        }
    }
});