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
const csrftoken = getCookie("csrftoken");

// ===== CART BADGE & CART MANAGEMENT =====
const cartBadge = document.getElementById('cart-badge');
let cart = JSON.parse(sessionStorage.getItem('cart')) || [];

function updateCartBadge() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const badge = document.getElementById('cart-badge');
    if (!badge) return;
    if (totalItems > 0) {
        badge.textContent = totalItems;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
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

        console.log("DEBUG: buyNowBtn.dataset.id SET TO =", productId);
        // const buyNowBtn = document.getElementById("buyNowBtn");
        // if (buyNowBtn) {
        //     buyNowBtn.dataset.id = productId;
        //     console.log("DEBUG: buyNowBtn.dataset.id SET TO =", productId);
        // }

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
                    alert("Added to cart!");
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
                    alert("Added to cart!");
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


    // ===== BUY NOW BUTTON IN MODAL
    const buyNowBtn = document.getElementById("buyNowBtn");

    if (buyNowBtn) {
        buyNowBtn.addEventListener("click", function () {
            const productId = document.getElementById("product-modal").dataset.currentProductId;
            const qty = parseInt(document.getElementById("quantity").value);

            console.log("DEBUG: Buy Now CLICKED:", { id: productId, quantity: qty });

            fetch("/buy-now/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": csrftoken,
                },
                body: JSON.stringify({ id: productId, quantity: qty }),
            })
            .then(res => res.json())
            .then(data => {
                console.log("DEBUG: Buy Now RESPONSE:", data);
                alert(data.message);
                if (data.status === "success") window.location.reload();
            });
        });
    }

});

// ===== CART QUANTITY HANDLING FOR CART PAGE =====
function changeCartQuantity(inputOrBtn, delta = 0) {
    // Get the input element
    let input;
    if (inputOrBtn.tagName === 'INPUT') {
        input = inputOrBtn;
    } else {
        input = inputOrBtn.closest('.item-quantity').querySelector('.quantity-input');
    }

    let currentQty = parseInt(input.value);
    if (!currentQty) currentQty = 1;

    currentQty += delta;
    if (currentQty < 1) currentQty = 1;

    input.value = currentQty;

    // Update subtotal
    updateCartItemSubtotal(input);
}

function updateCartItemSubtotal(input) {
    const cartItem = input.closest('.cart-item');
    const price = parseFloat(cartItem.dataset.productPrice);
    const qty = parseInt(input.value);
    const subtotalEl = cartItem.querySelector('.subtotal-price');

    const subtotal = price * qty;
    subtotalEl.textContent = '₱' + subtotal.toLocaleString();

    const cartId = cartItem.dataset.cartId;
    if (cartId) {
        const itemInCart = cart.find(i => i.id == cartId);
        if (itemInCart) {
            itemInCart.quantity = qty;
            updateCartBadge();  // updates the badge
        }
    }

    updateCartTotal();

    // Optionally, update DB via AJAX
    fetch('/update_cart_quantity/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: `cart_id=${cartId}&quantity=${qty}`
    })
    .then(res => res.json())
    .then(data => console.log('DEBUG: Cart quantity updated', data))
    .catch(err => console.error(err));
}

function updateCartTotal() {
    let total = 0;
    document.querySelectorAll('.cart-item').forEach(item => {
        const subtotalText = item.querySelector('.subtotal-price').textContent.replace(/₱|,/g, '');
        total += parseFloat(subtotalText);
    });

    const subtotalEl = document.getElementById('cart-subtotal');
    const totalEl = document.getElementById('cart-total');

    if (subtotalEl) subtotalEl.textContent = '₱' + total.toLocaleString();
    if (totalEl) totalEl.textContent = '₱' + total.toLocaleString();
}


// Bind cart quantity buttons & inputs
document.querySelectorAll('.cart-item .quantity-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const delta = btn.textContent === '+' ? 1 : -1;
        changeCartQuantity(btn, delta);
    });
});

document.querySelectorAll('.cart-item .quantity-input').forEach(input => {
    input.addEventListener('change', function() {
        changeCartQuantity(input, 0); 
    });
});



// cart summary
function updateCartSummary() {
    let subtotal = 0;
    document.querySelectorAll('.cart-item').forEach(item => {
        const price = parseFloat(item.dataset.productPrice);
        const quantity = parseInt(item.querySelector('.quantity-input').value);
        subtotal += price * quantity;
    });

    document.getElementById('cart-subtotal').textContent = '₱' + subtotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
    document.getElementById('cart-total').textContent = '₱' + subtotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
}

// Call this after quantity change
function updateSubtotal(input) {
    const cartItem = input.closest('.cart-item');
    const price = parseFloat(cartItem.dataset.productPrice);
    const quantity = parseInt(input.value);
    const subtotalPrice = price * quantity;

    cartItem.querySelector('.subtotal-price').textContent = '₱' + subtotalPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
    
    updateCartSummary();
}

// fetch 
document.addEventListener('DOMContentLoaded', async function () {
    const isLoggedIn = document.body.dataset.loggedIn === 'true';
    let cart = [];

    if (isLoggedIn) {
        // Fetch cart from DB for logged-in user
        try {
            const res = await fetch('/api/get_user_cart/');
            const data = await res.json();
            cart = data.cart_items;
        } catch (err) {
            console.error(err);
        }
    } else {
        cart = JSON.parse(sessionStorage.getItem('cart')) || [];
    }

    // Initialize badge and display
    updateCartBadge();
    updateCartDisplay();
});


// remove item in cart
function removeItem(btn) {
    const cartItem = btn.closest('.cart-item');
    const cartId = cartItem.dataset.cartId;

    console.log("DEBUG: Removing item:", cartId);

    fetch("/remove-from-cart/", {
        method: "POST",
        headers: {
            "X-CSRFToken": getCookie("csrftoken"),
        },
        body: new URLSearchParams({ cart_id: cartId })
    })
    .then(res => res.json())
    .then(data => {
        console.log("DEBUG: Remove response:", data);

        if (data.status === "success") {
            cartItem.remove();                 // remove from page
            updateCartSummary();               // refresh totals

            // If no items left, show "empty" message
            if (document.querySelectorAll('.cart-item').length === 0) {
                document.querySelector('.no-items').style.display = 'block';
            }
        } else {
            alert("Failed to remove item.");
        }
    });
}



// ==== CHECKOUT =============================================================
// in cart:
document.getElementById("checkoutBtn").addEventListener("click", function () {
    const loggedIn = document.body.dataset.loggedIn === "true"; // true if logged in
    if (!loggedIn) {
        alert("You must log in to checkout!");
        window.location.href = "/account/"; 
        return;
    }

    console.log("DEBUG: Checkout clicked");

    // Collect cart items from the page
    const cartItems = [];
    document.querySelectorAll(".cart-item").forEach(item => {
        cartItems.push({
            id: item.dataset.productId,
            quantity: parseInt(item.querySelector(".quantity-input").value)
        });
    });

    if (cartItems.length === 0) {
        alert("Your cart is empty!");
        return;
    }

    fetch("/checkout/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrftoken,
        },
        body: JSON.stringify({ items: cartItems }), // send the items properly
    })
    .then(res => res.json())
    .then(data => {
        console.log("DEBUG: Checkout response:", data);
        alert(data.message);

        if (data.status === "success") {
            window.location.reload();
        }
    });
});


// order summary =====
function calculateTotals() {
  const products = document.querySelectorAll(".product-box");
  let subtotal = 0;

  products.forEach(product => {
    const qty = Number(product.querySelector(".qty").innerText);
    const unitPrice = Number(product.querySelector(".unitPrice").innerText);
    subtotal += qty * unitPrice;
  });

  const shippingFee = Number(document.getElementById("shippingFee").innerText);

  document.getElementById("subtotal").innerText = subtotal;
  document.getElementById("total").innerText = subtotal + shippingFee;
}

calculateTotals();