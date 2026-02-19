// Enhanced cart functionality
let cart = JSON.parse(localStorage.getItem('cart')) || [];

function updateCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
  if (document.getElementById('cart-items')) {
    displayCart();
  }
}

function updateCartCount() {
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartBadge = document.getElementById('cart-count');
  if (cartBadge) {
    cartBadge.textContent = cartCount;
    cartBadge.style.display = cartCount > 0 ? 'inline-block' : 'none';
  }
}

function addToCart(id, name, price, customization = null, image = null) {
  const item = cart.find(item => item.id === id && JSON.stringify(item.customization) === JSON.stringify(customization));
  if (item) {
    item.quantity++;
  } else {
    // Get image from DOM if not provided
    if (!image) {
      const productCard = document.querySelector(`.product-card [data-id="${id}"]`)?.closest('.product-card');
      image = productCard?.querySelector('img')?.src || 'https://via.placeholder.com/300x200';
    }
    
    cart.push({ 
      id, 
      name, 
      price: parseFloat(price), 
      quantity: 1, 
      customization,
      image
    });
  }
  updateCart();
  showNotification(`${name} added to cart!`, 'success');
}

function addCustomizedToCart(id, name, price, customization) {
  addToCart(id, name, price, customization);
}

function removeFromCart(index) {
  const item = cart[index];
  cart.splice(index, 1);
  updateCart();
  showNotification(`${item.name} removed from cart`, 'info');
}

function updateQuantity(index, newQuantity) {
  if (newQuantity <= 0) {
    removeFromCart(index);
    return;
  }
  cart[index].quantity = parseInt(newQuantity);
  updateCart();
}

function clearCart() {
  if (confirm('Are you sure you want to clear your cart?')) {
    cart = [];
    updateCart();
    showNotification('Cart cleared', 'info');
  }
}

function calculateTotals() {
  let subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  let tax = subtotal * 0.08; // 8% tax
  let shipping = subtotal > 50 ? 0 : 9.99; // Free shipping over $50
  let total = subtotal + tax + shipping;
  
  return { subtotal, tax, shipping, total };
}

function displayCart() {
  const cartItems = document.getElementById('cart-items');
  const cartEmpty = document.getElementById('cart-empty');
  const cartContent = document.getElementById('cart-content');
  
  if (cart.length === 0) {
    cartEmpty.style.display = 'block';
    cartContent.style.display = 'none';
    return;
  }
  
  cartEmpty.style.display = 'none';
  cartContent.style.display = 'grid';
  
  cartItems.innerHTML = '';
  
  cart.forEach((item, index) => {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'cart-item';
    itemDiv.innerHTML = `
      <img src="${item.image}" alt="${item.name}" class="cart-item-image">
      <div class="cart-item-details">
        <div class="cart-item-title">${item.name}</div>
        <div class="cart-item-price">$${item.price.toFixed(2)} each</div>
        ${item.customization ? `<div class="cart-item-customization">${formatCustomization(item.customization)}</div>` : ''}
        <div class="quantity-controls">
          <button class="quantity-btn" onclick="updateQuantity(${index}, ${item.quantity - 1})">-</button>
          <input type="number" class="quantity-input" value="${item.quantity}" min="1" onchange="updateQuantity(${index}, this.value)">
          <button class="quantity-btn" onclick="updateQuantity(${index}, ${item.quantity + 1})">+</button>
        </div>
      </div>
      <div style="margin-left: auto; text-align: right;">
        <div style="font-weight: bold; color: #4A4A4A; margin-bottom: 0.5rem;">$${(item.price * item.quantity).toFixed(2)}</div>
        <button class="remove-btn" onclick="removeFromCart(${index})">Remove</button>
      </div>
    `;
    cartItems.appendChild(itemDiv);
  });
  
  updateTotals();
}

function formatCustomization(customization) {
  let details = [];
  if (customization.text) details.push(`Text: "${customization.text}"`);
  if (customization.font) details.push(`Font: ${customization.font}`);
  if (customization.message) details.push(`Message: "${customization.message}"`);
  if (customization.giftWrap) details.push('Gift Wrapped');
  if (customization.expressDelivery) details.push('Express Delivery');
  if (customization.color) details.push(`Color: ${customization.color}`);
  return details.join(' • ');
}

function updateTotals() {
  const totals = calculateTotals();
  
  document.getElementById('subtotal').textContent = `$${totals.subtotal.toFixed(2)}`;
  document.getElementById('tax').textContent = `$${totals.tax.toFixed(2)}`;
  document.getElementById('shipping').textContent = totals.shipping === 0 ? 'FREE' : `$${totals.shipping.toFixed(2)}`;
  document.getElementById('total').innerHTML = `<strong>$${totals.total.toFixed(2)}</strong>`;
}

function proceedToCheckout() {
  if (cart.length === 0) {
    showNotification('Your cart is empty!', 'warning');
    return;
  }
  
  // Check if user is logged in
  const isLoggedIn = document.querySelector('nav a[href="/logout"]') !== null;
  
  if (!isLoggedIn) {
    showNotification('Please login to proceed with checkout', 'info');
    setTimeout(() => {
      window.location.href = '/login';
    }, 2000);
    return;
  }
  
  // Proceed to checkout (you can implement this further)
  showNotification('Redirecting to checkout...', 'success');
  setTimeout(() => {
    // For now, just show a message. You can implement actual checkout logic
    alert('Checkout functionality will be implemented soon! Total: $' + calculateTotals().total.toFixed(2));
  }, 1000);
}

function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <i class="fas ${getNotificationIcon(type)}"></i>
    ${message}
  `;
  
  // Add to page
  document.body.appendChild(notification);
  
  // Show notification
  setTimeout(() => notification.classList.add('show'), 100);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => document.body.removeChild(notification), 300);
  }, 3000);
}

function getNotificationIcon(type) {
  switch(type) {
    case 'success': return 'fa-check-circle';
    case 'error': return 'fa-exclamation-circle';
    case 'warning': return 'fa-exclamation-triangle';
    case 'info': return 'fa-info-circle';
    default: return 'fa-info-circle';
  }
}

// Wishlist functionality
let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];

function toggleWishlist(id, name, price) {
  const index = wishlist.findIndex(item => item.id === id);
  if (index > -1) {
    wishlist.splice(index, 1);
    showNotification(`${name} removed from wishlist`, 'info');
  } else {
    // Get the product image from the product card
    const productCard = document.querySelector(`.product-card [data-id="${id}"]`)?.closest('.product-card');
    const image = productCard?.querySelector('img')?.src || 'https://via.placeholder.com/300x200';
    wishlist.push({ id, name, price, image });
    showNotification(`${name} added to wishlist!`, 'success');
  }
  updateWishlist();
}

function updateWishlist() {
  localStorage.setItem('wishlist', JSON.stringify(wishlist));
  // Update wishlist buttons
  document.querySelectorAll('.wishlist-btn').forEach(btn => {
    const id = btn.dataset.id;
    const isInWishlist = wishlist.some(item => item.id === id);
    btn.classList.toggle('active', isInWishlist);
    btn.innerHTML = isInWishlist ? '❤️' : '🤍';
  });
}

// Product filtering
function filterProducts(category) {
  const products = document.querySelectorAll('.product-card');
  products.forEach(product => {
    if (category === 'all' || product.dataset.category === category) {
      product.style.display = 'block';
    } else {
      product.style.display = 'none';
    }
  });
}

// Search functionality
function searchProducts(query) {
  const products = document.querySelectorAll('.product-card');
  const searchTerm = query.toLowerCase();
  
  products.forEach(product => {
    const title = product.querySelector('h3').textContent.toLowerCase();
    const description = product.querySelector('p').textContent.toLowerCase();
    
    if (title.includes(searchTerm) || description.includes(searchTerm)) {
      product.style.display = 'block';
    } else {
      product.style.display = 'none';
    }
  });
}

// Sort products
function sortProducts(criteria) {
  const container = document.querySelector('.products-grid');
  const products = Array.from(document.querySelectorAll('.product-card'));
  
  products.sort((a, b) => {
    switch(criteria) {
      case 'price-low':
        return parseFloat(a.querySelector('.price').textContent.replace('$', '')) - 
               parseFloat(b.querySelector('.price').textContent.replace('$', ''));
      case 'price-high':
        return parseFloat(b.querySelector('.price').textContent.replace('$', '')) - 
               parseFloat(a.querySelector('.price').textContent.replace('$', ''));
      case 'name':
        return a.querySelector('h3').textContent.localeCompare(b.querySelector('h3').textContent);
      default:
        return 0;
    }
  });
  
  // Re-append sorted products
  products.forEach(product => container.appendChild(product));
}

// Product quick view
function showQuickView(productId) {
  // This would show a modal with product details
  // For now, just redirect to product page or show alert
  showNotification('Quick view feature coming soon!', 'info');
}

// Initialize additional features
document.addEventListener('DOMContentLoaded', () => {
  // Initialize cart count
  updateCartCount();
  
  // Initialize wishlist
  updateWishlist();
  
  // Add to cart buttons
  document.querySelectorAll('.add-to-cart').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.dataset.id;
      const card = e.target.closest('.product-card');
      const name = card.querySelector('h3').textContent;
      const price = parseFloat(card.querySelector('.price').textContent.replace('$', ''));
      const image = card.querySelector('img').src;
      
      // Add to cart with image
      const item = cart.find(item => item.id === id && !item.customization);
      if (item) {
        item.quantity++;
      } else {
        cart.push({
          id,
          name,
          price,
          quantity: 1,
          customization: null,
          image
        });
      }
      updateCart();
      showNotification(`${name} added to cart!`, 'success');
    });
  });
  
  // Wishlist buttons
  document.querySelectorAll('.wishlist-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.dataset.id;
      const card = e.target.closest('.product-card');
      const name = card.querySelector('h3').textContent;
      const price = parseFloat(card.querySelector('.price').textContent.replace('$', ''));
      toggleWishlist(id, name, price);
    });
  });
  
  // Search functionality
  const searchInput = document.getElementById('product-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchProducts(e.target.value);
    });
  }
  
  // Filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      filterProducts(e.target.dataset.category);
    });
  });
  
  // Sort dropdown
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      sortProducts(e.target.value);
    });
  }
  
  // Display cart if on cart page
  if (document.getElementById('cart-items')) {
    displayCart();
  }
  
  // Add Font Awesome for icons (if not already loaded)
  if (!document.querySelector('link[href*="font-awesome"]')) {
    const fontAwesome = document.createElement('link');
    fontAwesome.rel = 'stylesheet';
    fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
    document.head.appendChild(fontAwesome);
  }
});


// Register form validation
document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.querySelector('form[action="/register"]');
  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      const password = document.querySelector('input[name="password"]').value;
      const confirmPassword = document.querySelector('input[name="confirmPassword"]').value;
      if (password !== confirmPassword) {
        e.preventDefault();
        alert('Passwords do not match!');
        return false;
      }
      if (password.length < 6) {
        e.preventDefault();
        alert('Password must be at least 6 characters long!');
        return false;
      }
    });
  }
});

// Customization Modal
let currentProduct = null;
let basePrice = 0;

document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('customization-modal');
  const closeBtn = document.querySelector('.close');
  const customizeBtns = document.querySelectorAll('.customize-btn');
  const customText = document.getElementById('custom-text');
  const fontSelect = document.getElementById('font-select');
  const customPhoto = document.getElementById('custom-photo');
  const colorBtns = document.querySelectorAll('.color-btn');
  const customMessage = document.getElementById('custom-message');
  const giftWrap = document.getElementById('gift-wrap');
  const expressDelivery = document.getElementById('express-delivery');
  const totalPrice = document.getElementById('total-price');
  const addToCartBtn = document.getElementById('add-customized-to-cart');

  // Open modal
  customizeBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const productId = e.target.dataset.id;
      // Find product data (you might want to pass this from server)
      const productCard = e.target.closest('.product-card');
      const img = productCard.querySelector('img').src;
      const name = productCard.querySelector('h3').textContent;
      const priceText = productCard.querySelector('.price').textContent;
      basePrice = parseFloat(priceText.replace('$', ''));
      
      currentProduct = { id: productId, name, img, basePrice };
      
      document.getElementById('preview-image').src = img;
      document.getElementById('preview-text').textContent = '';
      totalPrice.textContent = basePrice;
      
      modal.style.display = 'block';
    });
  });

  // Close modal
  closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });

  // Update preview text
  customText.addEventListener('input', updatePreview);
  fontSelect.addEventListener('change', updatePreview);

  function updatePreview() {
    const text = customText.value;
    const font = fontSelect.value;
    const previewText = document.getElementById('preview-text');
    previewText.textContent = text;
    previewText.style.fontFamily = font;
  }

  // Color selection
  colorBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const color = e.target.dataset.color;
      document.getElementById('preview-image').style.border = `5px solid ${color}`;
    });
  });

  // Update total price
  function updateTotalPrice() {
    let total = basePrice;
    if (giftWrap.checked) total += 5;
    if (expressDelivery.checked) total += 10;
    totalPrice.textContent = total.toFixed(2);
  }

  giftWrap.addEventListener('change', updateTotalPrice);
  expressDelivery.addEventListener('change', updateTotalPrice);

  // Add customized item to cart
  addToCartBtn.addEventListener('click', () => {
    const customization = {
      text: customText.value,
      font: fontSelect.value,
      message: customMessage.value,
      giftWrap: giftWrap.checked,
      expressDelivery: expressDelivery.checked,
      color: document.querySelector('.color-btn.active')?.dataset.color || '#F8C8DC'
    };
    
    // Add to cart with customization
    addCustomizedToCart(currentProduct.id, currentProduct.name, parseFloat(totalPrice.textContent), customization);
    modal.style.display = 'none';
    alert('Customized item added to cart!');
  });
});

function addCustomizedToCart(id, name, price, customization) {
  const item = cart.find(item => item.id === id && JSON.stringify(item.customization) === JSON.stringify(customization));
  if (item) {
    item.quantity++;
  } else {
    cart.push({ id, name, price, quantity: 1, customization });
  }
  updateCart();
}