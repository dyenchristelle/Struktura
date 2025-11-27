// ===== HELPER: GET CSRF TOKEN =====
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

// ===== CART BADGE & CART MANAGEMENT =====
const cartBadge = document.getElementById('cart-badge');
let cart = JSON.parse(sessionStorage.getItem('cart')) || [];

function updateCartBadge() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    console.log("DEBUG: Updating cart badge, total items =", totalItems);
    if (cartBadge) {
        cartBadge.textContent = totalItems;
        cartBadge.style.display = totalItems > 0 ? 'inline-block' : 'none';
    }
}

function saveCart() {
    console.log("DEBUG: Saving cart to sessionStorage", cart);
    sessionStorage.setItem('cart', JSON.stringify(cart));
    updateCartBadge();
}

function addToCart(product) {
    console.log("DEBUG: Adding to cart:", product);
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
        existing.quantity += product.quantity;
        console.log("DEBUG: Updated quantity for product", existing);
    } else {
        cart.push(product);
        console.log("DEBUG: Added new product to cart", product);
    }
    saveCart();
    updateCartDisplay();
}

function removeFromCart(productId) {
    console.log("DEBUG: Removing product from cart:", productId);
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartDisplay();
}

function changeQuantity(productId, delta) {
    console.log("DEBUG: Changing quantity for", productId, "delta", delta);
    const item = cart.find(p => p.id === productId);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity < 1) item.quantity = 1;
    saveCart();
    updateCartDisplay();
}

function updateCartDisplay() {
    const cartContainer = document.getElementById('listCart');
    if (!cartContainer) return;

    console.log("DEBUG: Updating cart display with items:", cart);
    cartContainer.innerHTML = '';
    if (cart.length === 0) {
        cartContainer.innerHTML = '<p class="no-items">Your cart is empty.</p>';
        return;
    }

    cart.forEach(item => {
        const div = document.createElement('div');
        div.classList.add('cart-item');
        div.innerHTML = `
            <div class="item-image"><img src="${item.image}" alt="${item.name}"></div>
            <div class="item-details">
                <h3>${item.name}</h3>
                <p>₱${item.price.toLocaleString()}</p>
            </div>
            <div class="item-quantity">
                <button onclick="changeQuantity(${item.id}, -1)">-</button>
                <span>${item.quantity}</span>
                <button onclick="changeQuantity(${item.id}, 1)">+</button>
            </div>
            <div class="item-remove">
                <button onclick="removeFromCart(${item.id})">×</button>
            </div>
        `;
        cartContainer.appendChild(div);
    });
}

// ===== MODAL & PRODUCT PAGE ADD TO CART =====
document.addEventListener('DOMContentLoaded', function () {
    console.log("DEBUG: DOMContentLoaded - initializing cart and modal");

    const productModal = document.getElementById('product-modal');
    const modalOverlay = document.getElementById('modal-overlay');
    const closeModal = document.querySelector('.close-modal');
    const quantityInput = document.getElementById('quantity');

    function openProductModal(container) {
        const productId = container.dataset.productId;
        const productName = container.dataset.productName;
        const productPrice = container.dataset.productPrice;
        const productDescription = container.dataset.productDescription;
        const productImage = container.dataset.productImage;

        console.log("DEBUG: Opening modal for product", productName);

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

        // Optional: save browsing history
        fetch('/api/save_browsing_history/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: `product_id=${productId}`
        })
        .then(response => response.json())
        .then(data => console.log("DEBUG: Browsing history saved:", data))
        .catch(error => console.error('DEBUG: Error saving browsing history:', error));
    }

    function closeProductModal() {
        productModal.classList.remove('active');
        modalOverlay.classList.remove('active');
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        if (quantityInput) quantityInput.value = 1;
    }

    // Modal quantity buttons
    const minusBtn = document.querySelector('.quantity-btn.minus');
    const plusBtn = document.querySelector('.quantity-btn.plus');
    if (minusBtn && quantityInput) {
        minusBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            quantityInput.value = Math.max(1, parseInt(quantityInput.value) - 1);
        });
    }
    if (plusBtn && quantityInput) {
        plusBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            quantityInput.value = parseInt(quantityInput.value) + 1;
        });
    }

    // ===== OPEN MODAL ON PRODUCT CARD CLICK =====
    const productContainers = document.querySelectorAll('.Item_container');
    productContainers.forEach(container => {
        container.addEventListener('click', () => openProductModal(container));

        // Prevent modal opening when Add to Cart button clicked
        const addButton = container.querySelector('.add-to-cart-btn');
        if (addButton) {
            addButton.addEventListener('click', e => e.stopPropagation());
        }
    });

    // Product page Add to Cart buttons
    const addButtons = document.querySelectorAll('.add-to-cart-btn');
    addButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const container = btn.closest('.Item_container');
            const product_id = container.dataset.productId;
            const product_name = container.dataset.productName;
            const product_price = parseFloat(container.dataset.productPrice);
            const product_image = container.dataset.productImage;
            const quantity = 1;

            console.log("DEBUG: Product page Add to Cart clicked:", product_name);

            fetch('/add_to_cart/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: `product_id=${product_id}&quantity=${quantity}`
            })
            .then(response => response.json())
            .then(data => {
                console.log("DEBUG: Add to cart response:", data);
                if (data.status === 'success') {
                    addToCart({
                        id: parseInt(product_id),
                        name: product_name,
                        price: product_price,
                        image: product_image,
                        quantity: quantity
                    });
                }
            });
        });
    });

    // Modal Add to Cart
    const addToCartModalBtn = document.querySelector('.add-to-cart-modal');
    if (addToCartModalBtn && quantityInput) {
        addToCartModalBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const quantity = parseInt(quantityInput.value);
            const productId = parseInt(productModal.dataset.currentProductId);
            const modalName = document.getElementById('modal-name');
            const modalPrice = parseFloat(document.getElementById('modal-price').textContent.replace('₱', '').replace(',', ''));
            const modalImg = document.getElementById('modal-img').src;

            console.log("DEBUG: Modal Add to Cart clicked for", modalName.textContent);

            fetch('/add_to_cart/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: `product_id=${productId}&quantity=${quantity}`
            })
            .then(response => response.json())
            .then(data => {
                console.log("DEBUG: Modal add_to_cart response:", data);
                if (data.status === 'success') {
                    addToCart({
                        id: productId,
                        name: modalName.textContent,
                        price: modalPrice,
                        image: modalImg,
                        quantity: quantity
                    });
                }
            });

            closeProductModal();
        });
    }

    // Close modal buttons & overlay
    if (closeModal) closeModal.addEventListener('click', e => { e.stopPropagation(); closeProductModal(); });
    if (modalOverlay) modalOverlay.addEventListener('click', closeProductModal);
    document.addEventListener('keydown', e => { if(e.key==='Escape') closeProductModal(); });

    // Initialize cart display and badge
    updateCartBadge();
    updateCartDisplay();
});
