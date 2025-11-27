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

// Cart elements
let cartIcon = document.querySelector('.fa-cart-shopping');
let cartSidebar = document.getElementById('cart-sidebar');
let cartOverlay = document.getElementById('cart-overlay');
let closeCartBtn = document.getElementById('close-cart');

// Toggle cart sidebar
function toggleCart() {
    cartSidebar.classList.toggle('active');
    cartOverlay.classList.toggle('active');
}

// Check if elements exist before adding event listeners
if (cartIcon && cartSidebar && cartOverlay && closeCartBtn) {
    cartIcon.addEventListener('click', toggleCart);
    closeCartBtn.addEventListener('click', toggleCart);
    cartOverlay.addEventListener('click', toggleCart);
} else {
    console.log('Some cart elements not found');
}

// Cart functionality
let cart = [];

// Add to cart from item container - WITH NULL CHECK
const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
if (addToCartButtons.length > 0) {
    addToCartButtons.forEach((button, index) => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            
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
}

// Add to cart function
function addToCart(product) {
    const existingProductIndex = cart.findIndex(item => 
        item.name === product.name && item.price === product.price
    );
    
    if (existingProductIndex !== -1) {
        cart[existingProductIndex].quantity += product.quantity;
    } else {
        cart.push({
            ...product,
            id: Date.now() + Math.random()
        });
    }
    
    updateCartDisplay();
    showCartNotification();
}

// Update cart display with price calculation
function updateCartDisplay() {
    const listCart = document.getElementById('listCart');
    const checkoutBtn = document.querySelector('.checkout-btn');
    const totalAmountElement = document.querySelector('.total-amount');
    
    // Check if cart elements exist
    if (!listCart || !checkoutBtn || !totalAmountElement) {
        console.warn('Cart display elements not found on this page');
        return;
    }
    
    // Clear current cart items
    listCart.innerHTML = '';
    
    if (cart.length === 0) {
        listCart.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Your cart is empty</p>';
        checkoutBtn.disabled = true;
        totalAmountElement.textContent = '₱0.00';
        updateCartBadge();
        return;
    }
    
    // Add each item to cart
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
    
    // Add event listeners for quantity controls
    addCartItemEventListeners();
}

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
            updateCartBadge();
        });
    });
    
    // Minus buttons
    document.querySelectorAll('.quantity .minus').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            if (cart[index].quantity > 1) {
                cart[index].quantity -= 1;
                updateCartDisplay();
                updateCartBadge();
            }
        });
    });
    
    // Remove buttons
    document.querySelectorAll('.remove').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            cart.splice(index, 1);
            updateCartDisplay();
            updateCartBadge();
        });
    });
}

// Update cart badge function
function updateCartBadge() {
    const cartIcon = document.querySelector('.fa-cart-shopping');
    if (!cartIcon) return;
    
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    
    let badge = cartIcon.querySelector('.cart-badge');
    if (!badge) {
        badge = document.createElement('span');
        badge.className = 'cart-badge';
        cartIcon.appendChild(badge);
    }
    
    if (totalItems > 0) {
        badge.textContent = totalItems > 99 ? '99+' : totalItems;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
    
    cartIcon.style.transform = 'scale(1.1)';
    setTimeout(() => {
        cartIcon.style.transform = 'scale(1)';
    }, 200);
}

// Show cart notification
function showCartNotification() {
    const cartIcon = document.querySelector('.fa-cart-shopping');
    if (!cartIcon) return;
    
    let badge = cartIcon.querySelector('.cart-badge');
    if (!badge) {
        badge = document.createElement('span');
        badge.className = 'cart-badge';
        cartIcon.appendChild(badge);
    }
    
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    badge.textContent = totalItems;
    
    cartIcon.style.transform = 'scale(1.2)';
    setTimeout(() => {
        cartIcon.style.transform = 'scale(1)';
    }, 300);

    updateCartBadge();
}

// Checkout functionality - WITH NULL CHECK
const checkoutBtn = document.querySelector('.checkout-btn');
if (checkoutBtn) {
    checkoutBtn.addEventListener('click', function() {
        if (cart.length === 0) return;
        
        const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
        const totalAmount = calculateTotalAmount();
        
        alert(`Proceeding to checkout with ${totalItems} items. Total: ${totalAmount}`);
    });
}

// MODAL - Wrapped in DOMContentLoaded
document.addEventListener("DOMContentLoaded", function () {
    // Initialize cart display
    updateCartDisplay();
    updateCartBadge();
    
    const productModal = document.getElementById('product-modal');
    const modalOverlay = document.getElementById('modal-overlay');
    const closeModal = document.querySelector('.close-modal');

    function openProductModal(container) {
        if (!productModal || !modalOverlay) {
            console.error('Modal elements not found');
            return;
        }

        const productId = container.dataset.productId;
        const productName = container.dataset.productName;
        const productPrice = container.dataset.productPrice;
        const productDescription = container.dataset.productDescription;
        const productImage = container.dataset.productImage;
        
        const modalImg = document.getElementById('modal-img');
        const modalName = document.getElementById('modal-name');
        const modalPrice = document.getElementById('modal-price');
        const modalDescription = document.getElementById('modal-description');

        if (modalImg) modalImg.src = productImage;
        if (modalName) modalName.textContent = productName;
        if (modalPrice) modalPrice.textContent = `₱${parseFloat(productPrice).toLocaleString()}`;
        if (modalDescription) modalDescription.textContent = productDescription;

        productModal.dataset.currentProductId = productId;
        productModal.classList.add('active');
        modalOverlay.classList.add('active');
        document.body.classList.add('modal-open');
        document.body.style.overflow = 'hidden';

        fetch('/api/save_browsing_history/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: `product_id=${productId}`
        })
        .then(response => response.json())
        .then(data => console.log("Browsing history saved:", data))
        .catch(error => console.error('Error saving browsing history:', error));
    }

    const itemContainers = document.querySelectorAll('.Item_container');
    if (itemContainers.length > 0) {
        itemContainers.forEach((container) => {
            container.addEventListener('click', function(e) {
                if (e.target.closest('.add-to-cart-btn')) {
                    e.stopPropagation();
                    return;
                }

                const qty = parseInt(container.dataset.productQuantity);
                if (qty === 0) return;

                openProductModal(container);
            });
        });
    }

    function closeProductModal() {
        if (!productModal || !modalOverlay) return;

        productModal.classList.remove('active');
        modalOverlay.classList.remove('active');
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';

        const quantityInput = document.getElementById('quantity');
        if (quantityInput) quantityInput.value = 1;
    }

    const minusBtn = document.querySelector('.quantity-btn.minus');
    const plusBtn = document.querySelector('.quantity-btn.plus');
    const quantityInput = document.getElementById('quantity');

    if (minusBtn && quantityInput) {
        minusBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const currentValue = parseInt(quantityInput.value);
            quantityInput.value = currentValue > 1 ? currentValue - 1 : 1;
        });
    }

    if (plusBtn && quantityInput) {
        plusBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const currentValue = parseInt(quantityInput.value);
            quantityInput.value = currentValue + 1;
        });
    }

    if (quantityInput) {
        quantityInput.addEventListener('input', function(e) {
            e.stopPropagation();
            this.value = this.value.replace(/[^0-9]/g, '');
            if (this.value === '' || parseInt(this.value) < 1) {
                this.value = 1;
            }
        });
    }

    if (productModal) {
        productModal.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }

    const quantitySelector = document.querySelector('.quantity-selector');
    if (quantitySelector) {
        quantitySelector.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }

    const addToCartModalBtn = document.querySelector('.add-to-cart-modal');
    if (addToCartModalBtn && quantityInput) {
        addToCartModalBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            
            const quantity = parseInt(quantityInput.value);
            const modalName = document.getElementById('modal-name');
            const modalPrice = document.getElementById('modal-price');
            const modalImg = document.getElementById('modal-img');
            
            if (quantity > 1000) {
                alert('Maximum order quantity is 1000 per transaction. Please contact us for bulk orders.');
                return;
            }

            if (modalName && modalPrice && modalImg) {
                addToCart({
                    id: Date.now(),
                    name: modalName.textContent,
                    price: modalPrice.textContent,
                    image: modalImg.src,
                    quantity: quantity
                });
            }
            
            closeProductModal();
        });
    }

    const buyNowBtn = document.querySelector('.buy-now');
    if (buyNowBtn && quantityInput) {
        buyNowBtn.addEventListener('click', function(e) {
            e.stopPropagation();

            const quantity = quantityInput.value;
            const modalName = document.getElementById('modal-name');
            const productName = modalName ? modalName.textContent : 'Product';

            alert(`Proceeding to checkout with ${quantity} ${productName}(s)...`);
            closeProductModal();
        });
    }

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && productModal && productModal.classList.contains('active')) {
            closeProductModal();
        }
    });

    if (closeModal) {
        closeModal.addEventListener('click', function(e) {
            e.stopPropagation();
            closeProductModal();
        });
    }
    
    if (modalOverlay) {
        modalOverlay.addEventListener('click', closeProductModal);
    }
});

// SEARCH - WITH NULL CHECKS
const searchInput = document.querySelector(".search-bar input");
const categoryButtons = document.querySelectorAll('[data-category]');
const allProductsLink = document.querySelector('.all-products-link');
const items = document.querySelectorAll('.Item_container');

let currentCategory = "all";

if (categoryButtons.length > 0) {
    categoryButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            currentCategory = btn.dataset.category;
        });
    });
}

if (allProductsLink) {
    allProductsLink.addEventListener("click", () => {
        currentCategory = "all";
    });
}

if (searchInput && items.length > 0) {
    searchInput.addEventListener("input", () => {
        const keyword = searchInput.value.toLowerCase().trim();

        items.forEach(item => {
            const nameElement = item.querySelector(".product-name");
            if (!nameElement) return;
            
            const name = nameElement.textContent.toLowerCase();
            const itemCategory = item.dataset.category;

            const allowed = currentCategory === "all" || itemCategory === currentCategory;

            if (!allowed) {
                item.style.display = "none";
                return;
            }

            if (keyword === "") {
                item.style.display = "flex";
                return;
            }

            item.style.display = name.includes(keyword) ? "flex" : "none";
        });
    });
}

// Profile info
function saveInfo(event) {
    event.preventDefault();

    const form = document.getElementById('accountForm');
    if (!form) return;
    
    const data = Object.fromEntries(new FormData(form).entries());

    if (!data.fullname || !data.email || !data.phone || !data.address) {
        alert('Please fill the required fields marked with *');
        return;
    }

    alert('Account information saved successfully.');
    form.submit();
}