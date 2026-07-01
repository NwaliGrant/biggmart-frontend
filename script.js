/**
 * THE BIGGMART - COMPLETE WORKING SCRIPT
 * FIXED: Beautiful non-scrollable product modal (NO NAVIGATION ICONS)
 */

const BACKEND_URL = 'https://biggmart-backend.onrender.com';
const API_URL = `${BACKEND_URL}/api`;

// Kill all intervals
for (let i = 0; i < 20000; i++) {
    try { clearInterval(i); } catch(e) {}
    try { clearTimeout(i); } catch(e) {}
}

let loaded = false;
let loading = false;
let heroImages = [];
let currentHeroIndex = 0;
let autoRotateInterval = null;
let isHeroPaused = false;
let allProducts = [];

const spinner = document.getElementById('loadingSpinner');
const mainContent = document.getElementById('mainContent');
const heroSlider = document.getElementById('heroSlider');
const heroDots = document.getElementById('heroDots');
const carouselTrack = document.getElementById('carouselTrack');
const testimonialsGrid = document.getElementById('testimonialsGrid');
const filterBtns = document.querySelectorAll('.filter-btn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const backToTopBtn = document.getElementById('backToTopBtn');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const navMenu = document.getElementById('navMenu');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');

// ===== BUILD IMAGE URL =====
function buildImageUrl(imagePath) {
    if (!imagePath) return '';
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
    }
    const cleanPath = imagePath.replace(/^\/+/, '');
    return `${BACKEND_URL}/${cleanPath}`;
}

// ===== FETCH DATA =====
async function fetchData(endpoint) {
    try {
        const response = await fetch(`${API_URL}${endpoint}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(`Error fetching ${endpoint}:`, error.message);
        return null;
    }
}

// ===== FETCH PRODUCT BY ID =====
async function fetchProductById(productId) {
    try {
        // Show loading state
        showLoadingModal('Fetching product details...');
        
        const data = await fetchData(`/products/${productId}`);
        closeModal();
        
        if (data && data.success && data.data) {
            const existingIndex = allProducts.findIndex(p => {
                const pId = p._id || p.id;
                return pId === productId;
            });
            if (existingIndex === -1) {
                allProducts.push(data.data);
            } else {
                allProducts[existingIndex] = data.data;
            }
            showProductDetails(data.data);
        } else {
            showErrorModal('Product not found. It may have been deleted.');
        }
    } catch (error) {
        closeModal();
        console.error('❌ Fetch product error:', error.message);
        showErrorModal('Failed to load product details. Please try again.');
    }
}

// ===== MODAL CONTROLS =====
let currentModal = null;

function showLoadingModal(message) {
    closeModal();
    const overlay = document.createElement('div');
    overlay.id = 'customModalOverlay';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="modal-box modal-loading">
            <div class="modal-loading-spinner"></div>
            <p style="color: #475569; font-size: 0.95rem; margin-top: 16px;">${message || 'Loading...'}</p>
        </div>
    `;
    document.body.appendChild(overlay);
    currentModal = overlay;
    document.body.style.overflow = 'hidden';
}

function showErrorModal(message) {
    closeModal();
    const overlay = document.createElement('div');
    overlay.id = 'customModalOverlay';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="modal-box modal-error">
            <div class="modal-error-icon">⚠️</div>
            <h3 style="color: #c62828; margin-bottom: 8px;">Error</h3>
            <p style="color: #475569; font-size: 0.95rem;">${message || 'Something went wrong'}</p>
            <button class="modal-close-btn" onclick="closeModal()">Close</button>
        </div>
    `;
    document.body.appendChild(overlay);
    currentModal = overlay;
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    if (currentModal) {
        currentModal.remove();
        currentModal = null;
    }
    document.body.style.overflow = '';
}

// ===== SHOW PRODUCT DETAILS - NO NAVIGATION ICONS =====
function showProductDetails(product) {
    if (!product) {
        showErrorModal('Product not found');
        return;
    }
    
    closeModal();
    
    const productName = product.name || 'Product';
    const productPrice = product.price || '₦0';
    const productCategory = product.category || 'gadgets';
    const productDescription = product.description || 'No description available';
    
    // Get images - ONLY FIRST IMAGE
    let images = product.images || [];
    if (product.image_url && images.length === 0) {
        images = [product.image_url];
    }
    if (images.length === 0) {
        images = ['https://picsum.photos/400/300?random=1'];
    }
    
    // ONLY USE THE FIRST IMAGE
    const imageUrl = images[0];

    // Category display
    const categoryDisplay = {
        'gadgets': '📱 Gadget',
        'electronics': '🔌 Electronics',
        'home': '🏠 Home Essential',
        'used': '♻️ Used Item'
    }[productCategory] || '🛍️ Product';

    // WhatsApp message
    const waMessage = encodeURIComponent(
        `Hello BiggMart, I saw "${productName}" at the price of ${productPrice}. I am interested, please send your account details.`
    );
    const waLink = `https://wa.me/09025188180?text=${waMessage}`;

    // Create modal - NO NAVIGATION ICONS
    const overlay = document.createElement('div');
    overlay.id = 'customModalOverlay';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="modal-box product-modal">
            <button class="modal-close-btn-top" onclick="closeModal()">✕</button>
            
            <!-- Single Image (No Slider) -->
            <div class="modal-slider-container">
                <div class="modal-slider-track">
                    <div class="modal-slide active">
                        <img src="${imageUrl}" alt="${productName}" onerror="this.src='https://picsum.photos/400/300?random=1'">
                    </div>
                </div>
            </div>
            
            <!-- Product Info -->
            <div class="modal-product-info">
                <h2 class="modal-product-name">${productName}</h2>
                <span class="modal-product-category">${categoryDisplay}</span>
                <div class="modal-product-price">${productPrice}</div>
                <p class="modal-product-description">${productDescription}</p>
                
                <div class="modal-product-features">
                    <span><i class="fas fa-check-circle" style="color:#2e7d32;"></i> Free delivery</span>
                    <span><i class="fas fa-check-circle" style="color:#2e7d32;"></i> 1-year warranty</span>
                    <span><i class="fas fa-check-circle" style="color:#2e7d32;"></i> Secure payment</span>
                </div>
                
                <a href="${waLink}" target="_blank" class="modal-buy-btn">
                    <i class="fas fa-shopping-bag"></i> Buy Now - WhatsApp
                </a>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    currentModal = overlay;
    document.body.style.overflow = 'hidden';
}

// ===== HERO CAROUSEL =====
function goToHeroSlide(index) {
    const slides = document.querySelectorAll('.hero-slide');
    const dots = document.querySelectorAll('.dot');
    if (!slides.length) return;
    slides.forEach((slide, i) => slide.classList.toggle('active', i === index));
    dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
    currentHeroIndex = index;
}

function nextHeroSlide() {
    if (heroImages.length <= 1) return;
    const nextIndex = (currentHeroIndex + 1) % heroImages.length;
    goToHeroSlide(nextIndex);
}

function prevHeroSlide() {
    if (heroImages.length <= 1) return;
    const prevIndex = (currentHeroIndex - 1 + heroImages.length) % heroImages.length;
    goToHeroSlide(prevIndex);
}

function startAutoRotate() {
    if (autoRotateInterval) clearInterval(autoRotateInterval);
    if (heroImages.length > 1 && !isHeroPaused) {
        autoRotateInterval = setInterval(nextHeroSlide, 5000);
    }
}

function pauseAutoRotate() {
    isHeroPaused = true;
    if (autoRotateInterval) clearInterval(autoRotateInterval);
}

function resumeAutoRotate() {
    isHeroPaused = false;
    if (heroImages.length > 1) startAutoRotate();
}

function resetAutoRotate() {
    pauseAutoRotate();
    setTimeout(resumeAutoRotate, 200);
}

function initializeHeroCarousel() {
    if (heroImages.length <= 1) return;
    startAutoRotate();
    document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowLeft') { prevHeroSlide(); resetAutoRotate(); }
        else if (e.key === 'ArrowRight') { nextHeroSlide(); resetAutoRotate(); }
    });
    const heroContainer = document.querySelector('.hero-visual');
    if (heroContainer) {
        let touchStartX = 0, touchEndX = 0;
        heroContainer.addEventListener('touchstart', function(e) {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        heroContainer.addEventListener('touchend', function(e) {
            touchEndX = e.changedTouches[0].screenX;
            const diff = touchStartX - touchEndX;
            if (Math.abs(diff) > 50) {
                diff > 0 ? nextHeroSlide() : prevHeroSlide();
                resetAutoRotate();
            }
        }, { passive: true });
        let mouseDown = false, mouseStartX = 0;
        heroContainer.addEventListener('mousedown', function(e) {
            mouseDown = true;
            mouseStartX = e.screenX;
        });
        heroContainer.addEventListener('mouseup', function(e) {
            if (mouseDown) {
                mouseDown = false;
                const diff = mouseStartX - e.screenX;
                if (Math.abs(diff) > 50) {
                    diff > 0 ? nextHeroSlide() : prevHeroSlide();
                    resetAutoRotate();
                }
            }
        });
        heroContainer.addEventListener('mouseleave', function() { mouseDown = false; });
        heroContainer.addEventListener('mouseenter', pauseAutoRotate);
        heroContainer.addEventListener('mouseleave', resumeAutoRotate);
    }
    document.querySelectorAll('.dot').forEach(dot => {
        dot.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            goToHeroSlide(index);
            resetAutoRotate();
        });
    });
}

// ===== PRODUCT CAROUSEL =====
function initProductCarousel() {
    const track = document.getElementById('carouselTrack');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    if (!track) return;
    function isDesktop() { return window.innerWidth > 992; }
    function scrollCarousel(direction) {
        if (!track || !isDesktop()) return;
        const scrollAmount = 320;
        const currentScroll = track.scrollLeft;
        const targetScroll = direction === 'next' ? currentScroll + scrollAmount : currentScroll - scrollAmount;
        track.scrollTo({ left: targetScroll, behavior: 'smooth' });
    }
    if (prevBtn) prevBtn.addEventListener('click', function(e) { e.preventDefault(); scrollCarousel('prev'); });
    if (nextBtn) nextBtn.addEventListener('click', function(e) { e.preventDefault(); scrollCarousel('next'); });
    function updateButtons() {
        if (!prevBtn || !nextBtn) return;
        if (isDesktop()) { prevBtn.style.display = 'flex'; nextBtn.style.display = 'flex'; }
        else { prevBtn.style.display = 'none'; nextBtn.style.display = 'none'; }
    }
    window.addEventListener('resize', updateButtons);
    updateButtons();
    function updateButtonState() {
        if (!track || !isDesktop()) return;
        if (prevBtn) prevBtn.disabled = track.scrollLeft <= 0;
        if (nextBtn) nextBtn.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 10;
    }
    track.addEventListener('scroll', updateButtonState);
    updateButtonState();
    setTimeout(updateButtonState, 500);
}

// ===== SEARCH FUNCTION =====
function searchProducts(query) {
    if (!query || query.trim() === '') {
        document.querySelectorAll('.product-card').forEach(card => card.style.display = '');
        const noResults = document.querySelector('.no-results');
        if (noResults) noResults.remove();
        return;
    }
    const searchTerm = query.toLowerCase().trim();
    let found = false;
    document.querySelectorAll('.product-card').forEach(card => {
        const name = card.dataset.name?.toLowerCase() || '';
        const desc = card.querySelector('.product-description')?.textContent?.toLowerCase() || '';
        if (name.includes(searchTerm) || desc.includes(searchTerm)) {
            card.style.display = '';
            found = true;
        } else {
            card.style.display = 'none';
        }
    });
    const noResults = document.querySelector('.no-results');
    if (!found) {
        if (!noResults) {
            const msg = document.createElement('div');
            msg.className = 'no-results';
            msg.style.cssText = 'grid-column:1/-1;text-align:center;padding:40px;color:#94a3b8;font-size:0.95rem;';
            msg.innerHTML = '<i class="fas fa-search" style="font-size:2rem;display:block;margin-bottom:10px;"></i>No products found for "' + query + '"';
            const track = document.getElementById('carouselTrack');
            track.appendChild(msg);
        }
    } else {
        if (noResults) noResults.remove();
    }
    filterBtns.forEach(b => b.classList.remove('active'));
    document.querySelector('.filter-btn[data-category="all"]')?.classList.add('active');
}

// ===== HANDLE PRODUCT CLICK =====
function handleProductClick(productId) {
    if (!productId) {
        showErrorModal('Product not found. Please refresh and try again.');
        return;
    }
    
    let product = allProducts.find(p => {
        const pId = p._id || p.id;
        return pId === productId;
    });
    
    if (!product) {
        console.log('🔄 Product not in cache, fetching from server...');
        fetchProductById(productId);
        return;
    }
    
    showProductDetails(product);
}

// ===== RENDER PRODUCTS =====
function renderProducts(products) {
    if (!carouselTrack) return;
    allProducts = products;
    
    const validProducts = products.filter(p => p && (p.id || p._id));
    
    if (validProducts.length === 0) {
        carouselTrack.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:40px;color:#94a3b8;">
                <i class="fas fa-box-open" style="font-size:2rem;display:block;margin-bottom:10px;"></i>
                No products available
            </div>
        `;
        return;
    }
    
    carouselTrack.innerHTML = validProducts.map((p, index) => {
        const productId = p._id || p.id || 'product-' + index;
        let imageUrl = 'https://picsum.photos/seed/' + productId + '/200/200';
        if (p.image_url) {
            imageUrl = buildImageUrl(p.image_url);
        }
        const images = p.images || [p.image_url || imageUrl];
        let description = p.description || '';
        if (description.length > 70) description = description.substring(0, 70) + '...';
        const category = p.category || 'gadgets';
        const escapedName = (p.name || 'Product').replace(/'/g, "\\'").replace(/"/g, '&quot;');
        const escapedDescription = (p.description || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
        const price = p.price || '₦0';
        
        return `
            <div class="product-card" 
                 data-category="${category}" 
                 data-price="${price}" 
                 data-name="${escapedName}"
                 data-id="${productId}"
                 data-description="${escapedDescription}"
                 onclick="handleProductClick('${productId}')">
                <div class="product-image">
                    <img src="${imageUrl}" alt="${p.name || 'Product'}" class="product-img" loading="lazy" onerror="this.src='https://picsum.photos/200/200?random=${Math.random()}'">
                    ${p.is_sold_out ? '<span class="sold-out-badge">Sold Out</span>' : ''}
                </div>
                <h3>${p.name || 'Product'}</h3>
                <div class="product-description">${description}</div>
                <div class="product-price">${price}</div>
                <button class="btn-shop" onclick="event.stopPropagation(); handleProductClick('${productId}')">
                    <i class="fas fa-shopping-bag"></i> Shop
                </button>
            </div>
        `;
    }).join('');
}

// ===== LOAD DATA =====
async function loadRealData() {
    if (loaded || loading) return;
    loading = true;
    try {
        const [heroData, productsData, testimonialsData, statsData] = await Promise.all([
            fetchData('/hero'),
            fetchData('/products'),
            fetchData('/testimonials'),
            fetchData('/stats')
        ]);
        
        if (productsData?.success && productsData.data?.length) {
            allProducts = productsData.data.map(p => ({
                ...p,
                id: p._id || p.id || 'product-' + Math.random().toString(36).substr(2, 9)
            }));
            renderProducts(allProducts);
        } else {
            const fallback = getFallbackProducts();
            allProducts = fallback.map(p => ({
                ...p,
                id: p.id || 'product-' + Math.random().toString(36).substr(2, 9)
            }));
            renderProducts(allProducts);
        }
        
        if (heroData?.success && heroData.data?.length) {
            heroImages = heroData.data;
            renderHero(heroData.data);
        } else renderHero(getFallbackHero());
        
        if (testimonialsData?.success && testimonialsData.data?.length) {
            renderTestimonials(testimonialsData.data);
        } else renderTestimonials(getFallbackTestimonials());
        
        if (statsData?.success) updateStats(statsData.data);
        else updateStats(getFallbackStats());
        
        loaded = true;
        if (spinner) spinner.style.display = 'none';
        if (mainContent) mainContent.style.display = 'block';
        setTimeout(() => {
            initializeHeroCarousel();
            initProductCarousel();
            initFeatures();
            initializeContactButtons();
            initializeHeroButtons();
        }, 100);
    } catch (error) {
        console.error('Load error:', error.message);
        renderHero(getFallbackHero());
        renderProducts(getFallbackProducts());
        renderTestimonials(getFallbackTestimonials());
        updateStats(getFallbackStats());
        if (spinner) spinner.style.display = 'none';
        if (mainContent) mainContent.style.display = 'block';
        setTimeout(() => {
            initializeHeroCarousel();
            initProductCarousel();
            initFeatures();
            initializeContactButtons();
            initializeHeroButtons();
        }, 100);
    } finally { loading = false; }
}

// ===== FALLBACK DATA =====
function getFallbackHero() {
    return [
        { image_url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=500&h=500&fit=crop', title: 'All You Want in One Bigg Place', subtitle: 'Shop the latest gadgets and electronics' },
        { image_url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&h=500&fit=crop', title: 'Premium Electronics', subtitle: 'Quality products at competitive prices' },
        { image_url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&h=500&fit=crop', title: 'Home Essentials', subtitle: 'Everything you need for your home' }
    ];
}

function getFallbackProducts() {
    return [
        { 
            id: 'p1',
            name: 'iPhone 15 Pro', 
            category: 'gadgets', 
            price: '₦850,000', 
            description: 'Latest iPhone with 128GB storage, A17 Pro chip, titanium design. Available in multiple colors.', 
            is_sold_out: false, 
            image_url: 'https://images.unsplash.com/photo-1592899677977-9e10ca588f3e?w=200&h=200&fit=crop',
            images: [
                'https://images.unsplash.com/photo-1592899677977-9e10ca588f3e?w=400&h=300&fit=crop',
                'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=400&h=300&fit=crop',
                'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=400&h=300&fit=crop'
            ]
        },
        { 
            id: 'p2',
            name: 'MacBook Pro 16"', 
            category: 'gadgets', 
            price: '₦1,200,000', 
            description: 'M3 Pro chip, 18GB RAM, 512GB SSD, Liquid Retina XDR display. Perfect for professionals.', 
            is_sold_out: false, 
            image_url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=200&h=200&fit=crop',
            images: [
                'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=300&fit=crop',
                'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop'
            ]
        },
        { 
            id: 'p3',
            name: 'Samsung Galaxy S24', 
            category: 'gadgets', 
            price: '₦750,000', 
            description: 'Premium Android smartphone with 200MP camera, AI features, and all-day battery life.', 
            is_sold_out: false, 
            image_url: 'https://images.unsplash.com/photo-1610945264803-c22e62d2a7b4?w=200&h=200&fit=crop',
            images: [
                'https://images.unsplash.com/photo-1610945264803-c22e62d2a7b4?w=400&h=300&fit=crop',
                'https://images.unsplash.com/photo-1592899677977-9e10ca588f3e?w=400&h=300&fit=crop'
            ]
        },
        { 
            id: 'p4',
            name: 'Sony 55" 4K TV', 
            category: 'electronics', 
            price: '₦350,000', 
            description: '4K Smart TV with HDR, 120Hz refresh rate, Dolby Atmos sound, Google TV built-in.', 
            is_sold_out: false, 
            image_url: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=200&h=200&fit=crop',
            images: [
                'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=300&fit=crop',
                'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=400&h=300&fit=crop'
            ]
        },
        { 
            id: 'p5',
            name: 'Used iPhone 12', 
            category: 'used', 
            price: '₦350,000', 
            description: 'Pre-owned iPhone 12, good condition, 64GB storage, comes with charger and case.', 
            is_sold_out: false, 
            image_url: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=200&h=200&fit=crop',
            images: [
                'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=400&h=300&fit=crop',
                'https://images.unsplash.com/photo-1592899677977-9e10ca588f3e?w=400&h=300&fit=crop'
            ]
        },
        { 
            id: 'p6',
            name: 'Used Samsung Galaxy S21', 
            category: 'used', 
            price: '₦280,000', 
            description: 'Pre-owned Samsung Galaxy S21, 128GB, excellent condition, 1 year warranty included.', 
            is_sold_out: false, 
            image_url: 'https://images.unsplash.com/photo-1610945264803-c22e62d2a7b4?w=200&h=200&fit=crop',
            images: [
                'https://images.unsplash.com/photo-1610945264803-c22e62d2a7b4?w=400&h=300&fit=crop',
                'https://images.unsplash.com/photo-1592899677977-9e10ca588f3e?w=400&h=300&fit=crop'
            ]
        },
        { 
            id: 'p7',
            name: 'Intelligent Induction Lamp', 
            category: 'home', 
            price: '₦45,000', 
            description: 'Smart LED lamp with touch control, 3 brightness levels, USB charging port, and energy-saving design.', 
            is_sold_out: false, 
            image_url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=200&h=200&fit=crop',
            images: [
                'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&h=300&fit=crop',
                'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=400&h=300&fit=crop'
            ]
        },
        { 
            id: 'p8',
            name: 'iPhone 11', 
            category: 'used', 
            price: '₦250,000', 
            description: 'Pre-owned iPhone 11, 64GB storage, good condition, includes charger and protective case.', 
            is_sold_out: false, 
            image_url: 'https://images.unsplash.com/photo-1587061949409-02f2b4fe5b18?w=200&h=200&fit=crop',
            images: [
                'https://images.unsplash.com/photo-1587061949409-02f2b4fe5b18?w=400&h=300&fit=crop',
                'https://images.unsplash.com/photo-1592899677977-9e10ca588f3e?w=400&h=300&fit=crop'
            ]
        }
    ];
}

function getFallbackTestimonials() {
    return [
        { customer_name: 'Oluwaseun Adebayo', location: 'Lagos, Nigeria', content: 'The BiggMart delivered exactly what I ordered! Quality products and fast shipping. Highly recommended!', rating: 5 },
        { customer_name: 'Chioma Eze', location: 'Port Harcourt, Nigeria', content: 'Best online shopping experience in Nigeria! Customer service is amazing and responsive. Keep it up!', rating: 5 },
        { customer_name: 'Emmanuel Okafor', location: 'Abuja, Nigeria', content: 'Great variety of products at affordable prices. The delivery was prompt and packaging was excellent.', rating: 4 }
    ];
}

function getFallbackStats() {
    return { total_customers: 15000, total_products: 500, total_cities: 50, on_time_delivery: 98 };
}

// ===== RENDER FUNCTIONS =====
function renderHero(images) {
    if (!heroSlider) return;
    const valid = images.filter(img => img.image_url);
    if (!valid.length) {
        heroSlider.innerHTML = `<div class="hero-placeholder"><p>No hero images</p></div>`;
        return;
    }
    heroSlider.innerHTML = valid.map((img, i) => {
        const imageUrl = buildImageUrl(img.image_url);
        return `
            <div class="hero-slide ${i === 0 ? 'active' : ''}" data-index="${i}">
                <img src="${imageUrl}" alt="${img.title || 'Hero'}" class="hero-image" onerror="this.style.display='none'">
                ${img.title ? `<div class="hero-caption"><h3>${img.title}</h3>${img.subtitle ? `<p>${img.subtitle}</p>` : ''}</div>` : ''}
            </div>
        `;
    }).join('');
    if (heroDots) {
        heroDots.innerHTML = valid.map((_, i) => `<span class="dot ${i === 0 ? 'active' : ''}" data-index="${i}"></span>`).join('');
    }
}

function renderTestimonials(testimonials) {
    if (!testimonialsGrid) return;
    testimonialsGrid.innerHTML = testimonials.map(t => `
        <div class="testimonial-card">
            <div class="stars">${Array(5).fill().map((_, i) => `<i class="fas fa-star${i < t.rating ? '' : '-o'}"></i>`).join('')}</div>
            <p>"${t.content}"</p>
            <div class="customer-info"><strong>${t.customer_name}</strong>${t.location ? `<span>${t.location}</span>` : ''}</div>
        </div>
    `).join('');
}

function updateStats(stats) {
    const c = (id) => document.getElementById(id);
    if (c('statCustomers')) c('statCustomers').textContent = stats.total_customers || 0;
    if (c('statProducts')) c('statProducts').textContent = stats.total_products || 0;
    if (c('statCities')) c('statCities').textContent = stats.total_cities || 0;
    if (c('statDelivery')) c('statDelivery').innerHTML = `${stats.on_time_delivery || 0}%`;
}

// ===== CONTACT BUTTONS =====
function initializeContactButtons() {
    document.querySelectorAll('.contact-detail').forEach(detail => {
        detail.addEventListener('click', function() {
            const type = this.dataset.type;
            const valueEl = this.querySelector('.contact-value') || this.querySelector('span');
            const value = valueEl ? valueEl.textContent.replace(/[^0-9@a-zA-Z.]/g, '') : '';
            if (type === 'whatsapp') {
                const phone = value.replace(/\s/g, '');
                window.open(`https://wa.me/${phone}`, '_blank');
            } else if (type === 'phone') {
                const phone = value.split(',')[0].trim();
                window.location.href = `tel:${phone}`;
            } else if (type === 'email') {
                window.location.href = `mailto:${value}`;
            } else if (type === 'tiktok') {
                window.open(`https://www.tiktok.com/@biggmart.ww`, '_blank');
            } else if (type === 'instagram') {
                window.open(`https://www.instagram.com/the_biggmart`, '_blank');
            } else if (type === 'address') {
                window.open(`https://maps.google.com/?q=${encodeURIComponent(value)}`, '_blank');
            }
        });
    });
    document.querySelectorAll('.btn-wa').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            window.open('https://wa.me/09025188180', '_blank');
        });
    });
    document.querySelectorAll('.btn-call').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'tel:09036091718';
        });
    });
}

// ===== HERO BUTTONS =====
function initializeHeroButtons() {
    const heroContactBtn = document.querySelector('.hero .btn-primary.cta-contact-btn');
    if (heroContactBtn) {
        heroContactBtn.addEventListener('click', function(e) {
            e.preventDefault();
            document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
        });
    }
    const shopNowBtn = document.querySelector('.hero .btn-outline');
    if (shopNowBtn) {
        shopNowBtn.addEventListener('click', function(e) {
            e.preventDefault();
            document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
        });
    }
}

// ===== SEARCH =====
function initSearch() {
    let searchTimeout;
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => searchProducts(this.value), 300);
        });
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                clearTimeout(searchTimeout);
                searchProducts(this.value);
            }
        });
    }
    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            searchProducts(searchInput?.value || '');
        });
    }
}

// ===== FEATURES =====
function initFeatures() {
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const category = this.dataset.category;
            if (searchInput) searchInput.value = '';
            const noResults = document.querySelector('.no-results');
            if (noResults) noResults.remove();
            document.querySelectorAll('.product-card').forEach(card => {
                if (category === 'all' || card.dataset.category === category) {
                    card.style.display = '';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
    if (backToTopBtn) {
        window.addEventListener('scroll', () => {
            backToTopBtn.classList.toggle('show', window.scrollY > 300);
        });
        backToTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }
    if (mobileMenuBtn && navMenu) {
        mobileMenuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            navMenu.classList.toggle('active');
            const icon = this.querySelector('i');
            icon.classList.toggle('fa-bars');
            icon.classList.toggle('fa-times');
        });
        navMenu.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                const icon = mobileMenuBtn.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            });
        });
        document.addEventListener('click', (event) => {
            if (navMenu.classList.contains('active') && !navMenu.contains(event.target) && !mobileMenuBtn.contains(event.target)) {
                navMenu.classList.remove('active');
                const icon = mobileMenuBtn.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    }
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#' || targetId === '') return;
            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                const header = document.querySelector('.site-header');
                const headerHeight = header ? header.offsetHeight : 80;
                window.scrollTo({ top: target.getBoundingClientRect().top + window.pageYOffset - headerHeight, behavior: 'smooth' });
            }
        });
    });
    const sections = document.querySelectorAll('section[id]');
    const navItems = document.querySelectorAll('.nav-link');
    function highlight() {
        const scroll = window.scrollY + 150;
        let current = '';
        sections.forEach(section => {
            const top = section.offsetTop;
            const bottom = top + section.offsetHeight;
            if (scroll >= top && scroll < bottom) current = section.id;
        });
        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href') === '#' + current) item.classList.add('active');
        });
        if (scroll < 200) {
            navItems.forEach(item => {
                item.classList.remove('active');
                if (item.getAttribute('href') === '#hero') item.classList.add('active');
            });
        }
    }
    window.addEventListener('scroll', highlight);
    window.addEventListener('load', highlight);
    document.getElementById('currentYear').textContent = new Date().getFullYear();
    initSearch();
}

// ===== START =====
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(loadRealData, 200);
});

console.log('✅ The BiggMart script loaded successfully!');
console.log('📱 All features: Search, Product Modal (single image), Used Items, Double Column Mobile');
