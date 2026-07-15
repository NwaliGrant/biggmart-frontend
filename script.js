/**
 * THE BIGGMART - COMPLETE WORKING SCRIPT
 * FIXED: WhatsApp links for iOS (with country code 234)
 * FIXED: Product modal - removed features section
 * ADDED: Services section
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

// ===== PRODUCT CAROUSEL VARIABLES =====
let currentProductIndex = 0;
let isProductPaused = false;
let productsPerView = 4;

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

// ===== WHATSAPP HELPER - COMPLETE FIX FOR iOS =====
function getWhatsAppLink(phoneNumber, message) {
    // Remove any non-digit characters from phone number
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    // Ensure country code is present (Nigeria = 234)
    let formattedPhone = cleanPhone;
    if (!formattedPhone.startsWith('234')) {
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '234' + formattedPhone.substring(1);
        } else {
            formattedPhone = '234' + formattedPhone;
        }
    }
    
    // Encode the message
    const encodedMessage = encodeURIComponent(message || '');
    
    // Use wa.me format which works better on iOS
    return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
}

// ===== OPEN WHATSAPP - iOS COMPATIBLE =====
function openWhatsApp(phoneNumber, message) {
    const link = getWhatsAppLink(phoneNumber, message);
    
    // Detect iOS
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    
    if (isIOS) {
        // For iOS, try to open with a slight delay and fallback
        const win = window.open(link, '_blank');
        if (!win || win.closed || typeof win.closed === 'undefined') {
            // If popup blocked, try direct navigation
            setTimeout(() => {
                window.location.href = link;
            }, 300);
        }
    } else {
        // For Android and others
        window.open(link, '_blank');
    }
}

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

// ===== SHOW PRODUCT DETAILS - UPDATED WHATSAPP =====
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
    
    let images = product.images || [];
    if (product.image_url && images.length === 0) {
        images = [product.image_url];
    }
    if (images.length === 0) {
        images = ['https://picsum.photos/400/300?random=1'];
    }
    
    images = images.map(img => {
        if (img.startsWith('http://') || img.startsWith('https://')) {
            return img;
        }
        return buildImageUrl(img);
    });

    const categoryDisplay = {
        'gadgets': '📱 Gadget',
        'electronics': '🔌 Electronics',
        'home': '🏠 Home Essential',
        'used': '♻️ Used Item'
    }[productCategory] || '🛍️ Product';

    const waMessage = `Hello BiggMart, I saw "${productName}" at the price of ${productPrice}. I am interested, please send your account details.`;

    let slidesHtml = images.map((img, idx) => `
        <div class="modal-slide ${idx === 0 ? 'active' : ''}" data-index="${idx}">
            <img src="${img}" alt="${productName} - Image ${idx + 1}" onerror="this.src='https://picsum.photos/400/300?random=${idx}'">
        </div>
    `).join('');

    let dotsHtml = images.map((_, idx) => `
        <span class="modal-dot ${idx === 0 ? 'active' : ''}" data-index="${idx}"></span>
    `).join('');

    const overlay = document.createElement('div');
    overlay.id = 'customModalOverlay';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="modal-box product-modal">
            <button class="modal-close-btn-top" onclick="closeModal()">✕</button>
            
            <div class="modal-slider-container" id="modalSliderContainer">
                <button class="modal-slider-nav prev" id="modalPrevBtn" aria-label="Previous image">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <button class="modal-slider-nav next" id="modalNextBtn" aria-label="Next image">
                    <i class="fas fa-chevron-right"></i>
                </button>
                <div class="modal-slider-track" id="modalSliderTrack">
                    ${slidesHtml}
                </div>
            </div>
            
            <div class="modal-dots-container" id="modalDotsContainer">
                ${dotsHtml}
            </div>
            
            <div class="modal-product-info">
                <h2 class="modal-product-name">${productName}</h2>
                <span class="modal-product-category">${categoryDisplay}</span>
                <div class="modal-product-price">${productPrice}</div>
                <p class="modal-product-description">${productDescription}</p>
                
                <button class="modal-buy-btn" id="productWhatsAppBtn">
                    <i class="fas fa-shopping-bag"></i> Buy Now - WhatsApp
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    currentModal = overlay;
    document.body.style.overflow = 'hidden';
    
    setTimeout(() => {
        initModalSlider(images.length);
        
        const waBtn = document.getElementById('productWhatsAppBtn');
        if (waBtn) {
            waBtn.addEventListener('click', function(e) {
                e.preventDefault();
                openWhatsApp('09025188180', waMessage);
            });
        }
    }, 50);
}

// ===== MODAL SLIDER CONTROLS =====
let modalCurrentIndex = 0;
let modalImagesCount = 0;

function initModalSlider(imageCount) {
    modalImagesCount = imageCount;
    modalCurrentIndex = 0;
    
    const track = document.getElementById('modalSliderTrack');
    const prevBtn = document.getElementById('modalPrevBtn');
    const nextBtn = document.getElementById('modalNextBtn');
    const dots = document.querySelectorAll('.modal-dot');
    const container = document.getElementById('modalSliderContainer');
    const overlay = document.getElementById('customModalOverlay');
    
    if (!track) return;
    
    function updateModalSlider(index) {
        const slides = track.querySelectorAll('.modal-slide');
        if (!slides.length) return;
        
        slides.forEach((slide, i) => {
            slide.classList.toggle('active', i === index);
        });
        
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
        
        modalCurrentIndex = index;
    }
    
    function goToModalSlide(index) {
        if (modalImagesCount <= 1) {
            updateModalSlider(0);
            return;
        }
        if (index < 0) index = modalImagesCount - 1;
        if (index >= modalImagesCount) index = 0;
        updateModalSlider(index);
    }
    
    function nextModalSlide() {
        if (modalImagesCount <= 1) {
            const btn = document.getElementById('modalNextBtn');
            if (btn) {
                btn.style.transform = 'scale(0.8)';
                setTimeout(() => { btn.style.transform = ''; }, 200);
            }
            return;
        }
        goToModalSlide(modalCurrentIndex + 1);
    }
    
    function prevModalSlide() {
        if (modalImagesCount <= 1) {
            const btn = document.getElementById('modalPrevBtn');
            if (btn) {
                btn.style.transform = 'scale(0.8)';
                setTimeout(() => { btn.style.transform = ''; }, 200);
            }
            return;
        }
        goToModalSlide(modalCurrentIndex - 1);
    }
    
    if (prevBtn) {
        prevBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            prevModalSlide();
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            nextModalSlide();
        });
    }
    
    if (modalImagesCount <= 1) {
        if (prevBtn) {
            prevBtn.style.opacity = '0.4';
            prevBtn.style.cursor = 'default';
        }
        if (nextBtn) {
            nextBtn.style.opacity = '0.4';
            nextBtn.style.cursor = 'default';
        }
        const container = document.getElementById('modalSliderContainer');
        if (container) {
            const badge = document.createElement('div');
            badge.style.cssText = `
                position: absolute;
                bottom: 12px;
                right: 12px;
                background: rgba(0,0,0,0.6);
                color: white;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 0.7rem;
                font-weight: 600;
                z-index: 5;
                backdrop-filter: blur(4px);
            `;
            badge.textContent = '1 / 1';
            container.appendChild(badge);
        }
    } else {
        const container = document.getElementById('modalSliderContainer');
        if (container) {
            const counter = document.createElement('div');
            counter.style.cssText = `
                position: absolute;
                bottom: 12px;
                right: 12px;
                background: rgba(0,0,0,0.6);
                color: white;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 0.7rem;
                font-weight: 600;
                z-index: 5;
                backdrop-filter: blur(4px);
            `;
            counter.id = 'modalImageCounter';
            counter.textContent = `1 / ${modalImagesCount}`;
            container.appendChild(counter);
            
            const originalUpdate = updateModalSlider;
            updateModalSlider = function(index) {
                originalUpdate(index);
                const counterEl = document.getElementById('modalImageCounter');
                if (counterEl) {
                    counterEl.textContent = `${index + 1} / ${modalImagesCount}`;
                }
            };
            window._updateModalSlider = updateModalSlider;
        }
    }
    
    dots.forEach((dot, i) => {
        dot.addEventListener('click', function(e) {
            e.stopPropagation();
            if (modalImagesCount > 1) {
                goToModalSlide(i);
            }
        });
    });
    
    const keyHandler = function(e) {
        if (!document.getElementById('customModalOverlay')) {
            document.removeEventListener('keydown', keyHandler);
            return;
        }
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            prevModalSlide();
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            nextModalSlide();
        }
    };
    document.addEventListener('keydown', keyHandler);
    
    const cleanupKeyHandler = function() {
        document.removeEventListener('keydown', keyHandler);
    };
    
    const closeBtn = document.querySelector('.modal-close-btn-top');
    if (closeBtn) {
        closeBtn.addEventListener('click', cleanupKeyHandler);
    }
    
    if (overlay) {
        overlay.addEventListener('click', function(e) {
            if (e.target === this) {
                cleanupKeyHandler();
            }
        });
    }
    
    if (container) {
        let touchStartX = 0;
        let touchEndX = 0;
        let isSwiping = false;
        
        container.addEventListener('touchstart', function(e) {
            touchStartX = e.changedTouches[0].screenX;
            isSwiping = true;
        }, { passive: true });
        
        container.addEventListener('touchmove', function(e) {
            if (!isSwiping) return;
            e.preventDefault();
        }, { passive: false });
        
        container.addEventListener('touchend', function(e) {
            if (!isSwiping) return;
            isSwiping = false;
            touchEndX = e.changedTouches[0].screenX;
            const diff = touchStartX - touchEndX;
            if (Math.abs(diff) > 30) {
                if (diff > 0) {
                    nextModalSlide();
                } else {
                    prevModalSlide();
                }
            }
        }, { passive: true });
        
        let isDragging = false;
        let startX = 0;
        let currentX = 0;
        
        container.addEventListener('mousedown', function(e) {
            if (e.target.closest('.modal-slider-nav') || e.target.closest('.modal-close-btn-top')) return;
            isDragging = true;
            startX = e.screenX;
            container.style.cursor = 'grabbing';
        });
        
        document.addEventListener('mousemove', function(e) {
            if (!isDragging) return;
            currentX = e.screenX;
        });
        
        document.addEventListener('mouseup', function(e) {
            if (!isDragging) return;
            isDragging = false;
            container.style.cursor = '';
            const diff = startX - currentX;
            if (Math.abs(diff) > 30) {
                if (diff > 0) {
                    nextModalSlide();
                } else {
                    prevModalSlide();
                }
            }
            startX = 0;
            currentX = 0;
        });
    }
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

// ============================================================
// ===== PRODUCT CAROUSEL - NO AUTO-SLIDE =====
// ============================================================

function getProductsPerView() {
    if (window.innerWidth < 480) return 1;
    if (window.innerWidth < 768) return 2;
    if (window.innerWidth < 992) return 2;
    return 4;
}

function goToProductSlide(index) {
    const track = document.getElementById('carouselTrack');
    if (!track) return;
    
    const cards = track.querySelectorAll('.product-card');
    if (!cards.length) return;
    
    const totalProducts = cards.length;
    const perView = getProductsPerView();
    const maxIndex = Math.max(0, totalProducts - perView);
    
    if (index < 0) index = 0;
    if (index > maxIndex) index = maxIndex;
    
    currentProductIndex = index;
    
    const cardWidth = cards[0]?.offsetWidth || 260;
    const gap = 24;
    const scrollAmount = index * (cardWidth + gap);
    
    track.scrollTo({
        left: scrollAmount,
        behavior: 'smooth'
    });
    
    updateProductDots();
}

function nextProductSlide() {
    const totalProducts = document.querySelectorAll('.product-card').length;
    const perView = getProductsPerView();
    const maxIndex = Math.max(0, totalProducts - perView);
    
    if (currentProductIndex < maxIndex) {
        goToProductSlide(currentProductIndex + 1);
    } else {
        goToProductSlide(0);
    }
}

function prevProductSlide() {
    const totalProducts = document.querySelectorAll('.product-card').length;
    const perView = getProductsPerView();
    const maxIndex = Math.max(0, totalProducts - perView);
    
    if (currentProductIndex > 0) {
        goToProductSlide(currentProductIndex - 1);
    } else {
        goToProductSlide(maxIndex);
    }
}

function updateProductDots() {
    const dotsContainer = document.getElementById('productDots');
    if (!dotsContainer) return;
    
    const totalProducts = document.querySelectorAll('.product-card').length;
    const perView = getProductsPerView();
    const dotCount = Math.max(1, Math.ceil(totalProducts / perView));
    
    dotsContainer.innerHTML = '';
    for (let i = 0; i < dotCount; i++) {
        const dot = document.createElement('span');
        dot.className = 'product-dot' + (i === currentProductIndex ? ' active' : '');
        dot.dataset.index = i;
        dot.addEventListener('click', function() {
            goToProductSlide(i);
        });
        dotsContainer.appendChild(dot);
    }
}

function initProductCarousel() {
    const track = document.getElementById('carouselTrack');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (!track) return;
    
    let dotsContainer = document.getElementById('productDots');
    if (!dotsContainer) {
        dotsContainer = document.createElement('div');
        dotsContainer.id = 'productDots';
        dotsContainer.className = 'product-dots';
        const container = track.closest('.carousel-container');
        if (container) {
            container.appendChild(dotsContainer);
        }
    }
    
    if (prevBtn) {
        prevBtn.addEventListener('click', function(e) {
            e.preventDefault();
            prevProductSlide();
        });
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', function(e) {
            e.preventDefault();
            nextProductSlide();
        });
    }
    
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            updateProductDots();
            const perView = getProductsPerView();
            const totalProducts = document.querySelectorAll('.product-card').length;
            const maxIndex = Math.max(0, totalProducts - perView);
            if (currentProductIndex > maxIndex) {
                goToProductSlide(maxIndex);
            }
            updateButtonsVisibility();
        }, 300);
    });
    
    let touchStartX = 0;
    let touchEndX = 0;
    track.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    track.addEventListener('touchend', function(e) {
        touchEndX = e.changedTouches[0].screenX;
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 50) {
            if (diff > 0) {
                nextProductSlide();
            } else {
                prevProductSlide();
            }
        }
    }, { passive: true });
    
    track.addEventListener('scroll', function() {
        const cards = track.querySelectorAll('.product-card');
        if (!cards.length) return;
        const cardWidth = cards[0]?.offsetWidth || 260;
        const gap = 24;
        const scrollPos = track.scrollLeft;
        const index = Math.round(scrollPos / (cardWidth + gap));
        if (index !== currentProductIndex) {
            currentProductIndex = index;
            updateProductDots();
        }
    });
    
    function updateButtonsVisibility() {
        const isDesktop = window.innerWidth > 992;
        if (prevBtn) prevBtn.style.display = isDesktop ? 'flex' : 'none';
        if (nextBtn) nextBtn.style.display = isDesktop ? 'flex' : 'none';
    }
    
    setTimeout(() => {
        updateProductDots();
        updateButtonsVisibility();
    }, 300);
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
    
    setTimeout(() => {
        initProductCarousel();
    }, 100);
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
            <div class="customer-info"><strong>${t.customer_name}</strong>${t.location ? `<span>, ${t.location}</span>` : ''}</div>
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

// ===== CONTACT BUTTONS - UPDATED =====
function initializeContactButtons() {
    document.querySelectorAll('.contact-detail').forEach(detail => {
        detail.addEventListener('click', function() {
            const type = this.dataset.type;
            const valueEl = this.querySelector('.contact-value') || this.querySelector('span');
            const value = valueEl ? valueEl.textContent.replace(/[^0-9@a-zA-Z.]/g, '') : '';
            if (type === 'whatsapp') {
                const phone = value.replace(/\s/g, '');
                openWhatsApp(phone, 'Hello BiggMart, I would like to make an inquiry.');
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
            openWhatsApp('09025188180', 'Hello BiggMart, I would like to make an inquiry.');
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
console.log('📱 All features: Search, Product Carousel, Product Modal with ALWAYS VISIBLE arrows & dots, Swipe support');
console.log('📱 WhatsApp fixed for iOS with country code 234');
