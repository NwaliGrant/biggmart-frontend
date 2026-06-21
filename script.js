/**
 * THE BIGGMART - PRODUCTION VERSION WITH CAROUSEL & WHATSAPP INTEGRATION
 * ✅ Connected to deployed backend with HTTPS
 * ✅ Hero carousel working (swipe + auto-rotate)
 * ✅ WhatsApp integration for "Shop" button
 * ✅ Contact section with clickable details
 * ✅ Card descriptions properly contained
 */

// ======================= CONFIG =======================
const BACKEND_URL = 'https://biggmart-backend.onrender.com';
const API_URL = `${BACKEND_URL}/api`;

// ======================= KILL ALL INTERVALS =======================
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

// ======================= DOM ELEMENTS =======================
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

// ======================= BUILD IMAGE URL =======================
function buildImageUrl(imagePath) {
    if (!imagePath) return '';
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
    }
    const cleanPath = imagePath.replace(/^\/+/, '');
    return `${BACKEND_URL}/${cleanPath}`;
}

// ======================= FETCH DATA =======================
async function fetchData(endpoint) {
    try {
        const response = await fetch(`${API_URL}${endpoint}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(`❌ Error fetching ${endpoint}:`, error.message);
        return null;
    }
}

// ======================= HERO CAROUSEL FUNCTIONS =======================
function goToHeroSlide(index) {
    const slides = document.querySelectorAll('.hero-slide');
    const dots = document.querySelectorAll('.dot');
    if (!slides.length) return;
    
    slides.forEach((slide, i) => {
        slide.classList.toggle('active', i === index);
    });
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });
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
    if (autoRotateInterval) {
        clearInterval(autoRotateInterval);
        autoRotateInterval = null;
    }
    if (heroImages.length > 1 && !isHeroPaused) {
        autoRotateInterval = setInterval(nextHeroSlide, 5000);
    }
}

function pauseAutoRotate() {
    isHeroPaused = true;
    if (autoRotateInterval) {
        clearInterval(autoRotateInterval);
        autoRotateInterval = null;
    }
}

function resumeAutoRotate() {
    isHeroPaused = false;
    if (heroImages.length > 1) {
        startAutoRotate();
    }
}

function resetAutoRotate() {
    pauseAutoRotate();
    setTimeout(resumeAutoRotate, 200);
}

function initializeHeroCarousel() {
    if (heroImages.length <= 1) return;
    
    startAutoRotate();
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowLeft') {
            prevHeroSlide();
            resetAutoRotate();
        } else if (e.key === 'ArrowRight') {
            nextHeroSlide();
            resetAutoRotate();
        }
    });
    
    const heroContainer = document.querySelector('.hero-visual');
    if (heroContainer) {
        let touchStartX = 0;
        let touchEndX = 0;
        
        heroContainer.addEventListener('touchstart', function(e) {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        
        heroContainer.addEventListener('touchend', function(e) {
            touchEndX = e.changedTouches[0].screenX;
            const diff = touchStartX - touchEndX;
            if (Math.abs(diff) > 50) {
                if (diff > 0) {
                    nextHeroSlide();
                } else {
                    prevHeroSlide();
                }
                resetAutoRotate();
            }
        }, { passive: true });
        
        let mouseDown = false;
        let mouseStartX = 0;
        
        heroContainer.addEventListener('mousedown', function(e) {
            mouseDown = true;
            mouseStartX = e.screenX;
        });
        
        heroContainer.addEventListener('mouseup', function(e) {
            if (mouseDown) {
                mouseDown = false;
                const diff = mouseStartX - e.screenX;
                if (Math.abs(diff) > 50) {
                    if (diff > 0) {
                        nextHeroSlide();
                    } else {
                        prevHeroSlide();
                    }
                    resetAutoRotate();
                }
            }
        });
        
        heroContainer.addEventListener('mouseleave', function() {
            mouseDown = false;
        });
        
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

// ======================= LOAD DATA =======================
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
        
        if (heroData?.success && heroData.data && heroData.data.length > 0) {
            heroImages = heroData.data;
            renderHero(heroData.data);
        } else {
            renderHero(getFallbackHero());
        }
        
        if (productsData?.success && productsData.data && productsData.data.length > 0) {
            renderProducts(productsData.data);
        } else {
            renderProducts(getFallbackProducts());
        }
        
        if (testimonialsData?.success && testimonialsData.data && testimonialsData.data.length > 0) {
            renderTestimonials(testimonialsData.data);
        } else {
            renderTestimonials(getFallbackTestimonials());
        }
        
        if (statsData?.success) {
            updateStats(statsData.data);
        } else {
            updateStats(getFallbackStats());
        }
        
        loaded = true;
        
        if (spinner) spinner.style.display = 'none';
        if (mainContent) mainContent.style.display = 'block';
        
        setTimeout(() => {
            initializeHeroCarousel();
            initFeatures();
            initializeContactButtons();
            initializeHeroButtons();
        }, 100);
        
    } catch (error) {
        console.error('❌ Load error:', error.message);
        renderHero(getFallbackHero());
        renderProducts(getFallbackProducts());
        renderTestimonials(getFallbackTestimonials());
        updateStats(getFallbackStats());
        
        if (spinner) spinner.style.display = 'none';
        if (mainContent) mainContent.style.display = 'block';
        
        setTimeout(() => {
            initializeHeroCarousel();
            initFeatures();
            initializeContactButtons();
            initializeHeroButtons();
        }, 100);
    } finally {
        loading = false;
    }
}

// ======================= FALLBACK DATA =======================
function getFallbackHero() {
    return [
        { image_url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=500&h=500&fit=crop', title: 'All You Want in One Bigg Place', subtitle: 'Shop the latest gadgets and electronics' },
        { image_url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&h=500&fit=crop', title: 'Premium Electronics', subtitle: 'Quality products at competitive prices' },
        { image_url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&h=500&fit=crop', title: 'Home Essentials', subtitle: 'Everything you need for your home' }
    ];
}

function getFallbackProducts() {
    return [
        { name: 'iPhone 15 Pro', category: 'gadgets', price: '₦850,000', description: 'Latest iPhone with 128GB storage', is_sold_out: false, image_url: 'https://images.unsplash.com/photo-1592899677977-9e10ca588f3e?w=200&h=200&fit=crop' },
        { name: 'MacBook Pro 16"', category: 'gadgets', price: '₦1,200,000', description: 'M3 Pro chip, 18GB RAM', is_sold_out: false, image_url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=200&h=200&fit=crop' },
        { name: 'Samsung Galaxy S24', category: 'gadgets', price: '₦750,000', description: 'Premium Android smartphone', is_sold_out: false, image_url: 'https://images.unsplash.com/photo-1592899677977-9e10ca588f3e?w=200&h=200&fit=crop' }
    ];
}

function getFallbackTestimonials() {
    return [
        { customer_name: 'Oluwaseun Adebayo', location: 'Lagos, Nigeria', content: 'Great service!', rating: 5 },
        { customer_name: 'Chioma Eze', location: 'Port Harcourt, Nigeria', content: 'Best online shopping experience!', rating: 5 }
    ];
}

function getFallbackStats() {
    return { total_customers: 15000, total_products: 500, total_cities: 50, on_time_delivery: 98 };
}

// ======================= RENDER FUNCTIONS =======================
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

function renderProducts(products) {
    if (!carouselTrack) return;
    
    carouselTrack.innerHTML = products.map((p, index) => {
        const imageUrl = p.image_url ? buildImageUrl(p.image_url) : `https://picsum.photos/seed/${p.id || index}/200/200`;
        const waMessage = encodeURIComponent(
            `Hello BiggMart, I saw "${p.name}" at the price of ${p.price}. I am interested, please send your account details.`
        );
        const waLink = `https://wa.me/09025188180?text=${waMessage}`;
        
        // Truncate description if too long
        let description = p.description || '';
        if (description.length > 60) {
            description = description.substring(0, 60) + '...';
        }
        
        return `
            <div class="product-card" data-category="${p.category}" data-price="${p.price}" data-name="${p.name}">
                <div class="product-image">
                    <img src="${imageUrl}" alt="${p.name}" class="product-img" loading="lazy" onerror="this.src='https://picsum.photos/200/200?random=${Math.random()}'">
                    ${p.is_sold_out ? '<span class="sold-out-badge">Sold Out</span>' : ''}
                </div>
                <h3>${p.name}</h3>
                <div class="product-description">${description}</div>
                <div class="product-price">${p.price}</div>
                <a href="${p.is_sold_out ? '#' : waLink}" target="_blank" class="btn-shop ${p.is_sold_out ? 'btn-disabled' : ''}" data-name="${p.name}" data-price="${p.price}">
                    ${p.is_sold_out ? 'Sold Out' : '<i class="fas fa-shopping-bag"></i> Shop'}
                </a>
            </div>
        `;
    }).join('');

    document.querySelectorAll('.btn-shop').forEach(btn => {
        if (btn.classList.contains('btn-disabled')) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                Swal.fire({
                    title: 'Sold Out',
                    text: 'This product is currently sold out. Please check back later!',
                    icon: 'info',
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#2e7d32'
                });
            });
        } else {
            btn.addEventListener('click', function(e) {
                const name = this.dataset.name;
                const price = this.dataset.price;
                const message = encodeURIComponent(
                    `Hello BiggMart, I saw "${name}" at the price of ${price}. I am interested, please send your account details.`
                );
                const waLink = `https://wa.me/09025188180?text=${message}`;
                window.open(waLink, '_blank');
                e.preventDefault();
                e.stopPropagation();
            });
        }
    });
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

// ======================= CONTACT BUTTONS =======================
function initializeContactButtons() {
    // Contact details click handlers
    document.querySelectorAll('.contact-detail').forEach(detail => {
        detail.addEventListener('click', function(e) {
            const type = this.dataset.type;
            const value = this.querySelector('.contact-value')?.textContent || '';
            
            if (type === 'whatsapp') {
                const phone = value.replace(/\s/g, '');
                window.open(`https://wa.me/${phone}`, '_blank');
            } else if (type === 'phone') {
                const numbers = value.split(',');
                const phone = numbers[0].trim();
                window.location.href = `tel:${phone}`;
            } else if (type === 'email') {
                window.location.href = `mailto:${value}`;
            } else if (type === 'tiktok') {
                const handle = value.replace('@', '');
                window.open(`https://www.tiktok.com/@${handle}`, '_blank');
            } else if (type === 'instagram') {
                const handle = value.replace('@', '');
                window.open(`https://www.instagram.com/${handle}`, '_blank');
            } else if (type === 'address') {
                window.open(`https://maps.google.com/?q=${encodeURIComponent(value)}`, '_blank');
            }
        });
    });

    // WhatsApp button - direct link
    const whatsappBtns = document.querySelectorAll('.btn-wa');
    whatsappBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            const phone = '09025188180';
            const message = 'Hello BiggMart, I am interested in your products. Please send me more information.';
            const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
            window.open(url, '_blank');
            e.preventDefault();
        });
    });

    // Call button - direct call
    const callBtns = document.querySelectorAll('.btn-call');
    callBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            const phone = '09036091718';
            window.location.href = `tel:${phone}`;
            e.preventDefault();
        });
    });
}

// ======================= HERO BUTTONS =======================
function initializeHeroButtons() {
    // Hero "Contact Us" button - smooth scroll to contact
    const heroContactBtn = document.querySelector('.hero .btn-primary.cta-contact-btn');
    if (heroContactBtn) {
        heroContactBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const contactSection = document.getElementById('contact');
            if (contactSection) {
                const header = document.querySelector('.site-header');
                const headerHeight = header ? header.offsetHeight : 80;
                const elementPosition = contactSection.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerHeight;
                window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
            }
        });
    }
    
    // Hero "Shop Now" button - smooth scroll to products
    const shopNowBtn = document.querySelector('.hero .btn-outline');
    if (shopNowBtn) {
        shopNowBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const productsSection = document.getElementById('products');
            if (productsSection) {
                const header = document.querySelector('.site-header');
                const headerHeight = header ? header.offsetHeight : 80;
                const elementPosition = productsSection.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerHeight;
                window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
            }
        });
    }
}

// ======================= FEATURES =======================
function initFeatures() {
    // Category filters
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const category = this.dataset.category;
            document.querySelectorAll('.product-card').forEach(card => {
                card.style.display = (category === 'all' || card.dataset.category === category) ? '' : 'none';
            });
        });
    });

    // Carousel navigation
    if (prevBtn && nextBtn && carouselTrack) {
        const scroll = 300;
        prevBtn.addEventListener('click', () => carouselTrack.scrollBy({ left: -scroll, behavior: 'smooth' }));
        nextBtn.addEventListener('click', () => carouselTrack.scrollBy({ left: scroll, behavior: 'smooth' }));
    }

    // Back to top
    if (backToTopBtn) {
        window.addEventListener('scroll', () => {
            backToTopBtn.classList.toggle('show', window.scrollY > 300);
        });
        backToTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }

    // Mobile menu
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

    // Smooth scrolling
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

    // Active nav highlight
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

    // Current year
    document.getElementById('currentYear').textContent = new Date().getFullYear();
}

// ======================= START =======================
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(loadRealData, 200);
});
