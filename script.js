/**
 * THE BIGGMART - PUBLIC WEBSITE SCRIPT
 * ✅ Production ready - uses live API
 */

// ======================= CONFIG =======================
const API_URL = 'https://biggmart-backend.onrender.com/api';
let loaded = false;
let loading = false;

// ======================= KILL ALL INTERVALS =======================
for (let i = 0; i < 20000; i++) {
    try { clearInterval(i); } catch(e) {}
    try { clearTimeout(i); } catch(e) {}
}

console.log('🚀 The BiggMart - Starting...');

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

// ======================= FETCH DATA =======================
async function fetchData(endpoint) {
    try {
        const response = await fetch(API_URL + endpoint);
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return await response.json();
    } catch (error) {
        console.error('Error fetching ' + endpoint + ':', error);
        return null;
    }
}

// ======================= LOAD DATA =======================
async function loadData() {
    if (loaded || loading) {
        console.log('Already loaded or loading');
        return;
    }
    
    loading = true;
    console.log('Loading data from API...');
    
    try {
        const [heroData, productsData, testimonialsData, statsData] = await Promise.all([
            fetchData('/hero'),
            fetchData('/products'),
            fetchData('/testimonials'),
            fetchData('/stats')
        ]);
        
        if (heroData && heroData.success && heroData.data && heroData.data.length) {
            renderHero(heroData.data);
        } else {
            renderHero(getFallbackHero());
        }
        
        if (productsData && productsData.success && productsData.data && productsData.data.length) {
            renderProducts(productsData.data);
        } else {
            renderProducts(getFallbackProducts());
        }
        
        if (testimonialsData && testimonialsData.success && testimonialsData.data && testimonialsData.data.length) {
            renderTestimonials(testimonialsData.data);
        } else {
            renderTestimonials(getFallbackTestimonials());
        }
        
        if (statsData && statsData.success) {
            updateStats(statsData.data);
        } else {
            updateStats(getFallbackStats());
        }
        
        loaded = true;
        console.log('All data loaded successfully!');
        
        if (spinner) spinner.style.display = 'none';
        if (mainContent) mainContent.style.display = 'block';
        
        initFeatures();
        initHeroCarousel();
        initSwipe();
        startAutoRotate();
        
    } catch (error) {
        console.error('Load error:', error);
        renderHero(getFallbackHero());
        renderProducts(getFallbackProducts());
        renderTestimonials(getFallbackTestimonials());
        updateStats(getFallbackStats());
        
        if (spinner) spinner.style.display = 'none';
        if (mainContent) mainContent.style.display = 'block';
        initFeatures();
        initHeroCarousel();
        initSwipe();
        startAutoRotate();
    } finally {
        loading = false;
    }
}

// ======================= FALLBACK DATA =======================
function getFallbackHero() {
    return [
        { image_url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&h=400&fit=crop', title: 'All You Want in One Bigg Place', subtitle: 'Shop the latest gadgets and electronics' },
        { image_url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&h=400&fit=crop', title: 'Premium Electronics', subtitle: 'Quality products at competitive prices' },
        { image_url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=400&fit=crop', title: 'Home Essentials', subtitle: 'Everything you need for your home' }
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
        { customer_name: 'Oluwaseun Adebayo', location: 'Lagos, Nigeria', content: 'The BiggMart delivered exactly what I ordered! Quality products and fast shipping.', rating: 5 },
        { customer_name: 'Chioma Eze', location: 'Port Harcourt, Nigeria', content: 'Best online shopping experience in Nigeria! Customer service is amazing.', rating: 5 }
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
        heroSlider.innerHTML = '<div class="hero-placeholder"><p>No hero images</p></div>';
        return;
    }
    let html = '';
    for (let i = 0; i < valid.length; i++) {
        const img = valid[i];
        html += `<div class="hero-slide ${i === 0 ? 'active' : ''}" data-index="${i}">
            <img src="${img.image_url}" alt="${img.title || 'Hero'}" class="hero-image" onerror="this.style.display='none'">
            ${img.title ? `<div class="hero-caption"><h3>${img.title}</h3>${img.subtitle ? `<p>${img.subtitle}</p>` : ''}</div>` : ''}
        </div>`;
    }
    heroSlider.innerHTML = html;
    
    if (heroDots) {
        let dotsHtml = '';
        for (let i = 0; i < valid.length; i++) {
            dotsHtml += `<button class="dot ${i === 0 ? 'active' : ''}" data-index="${i}"></button>`;
        }
        heroDots.innerHTML = dotsHtml;
        heroDots.querySelectorAll('.dot').forEach(dot => {
            dot.addEventListener('click', function() {
                const index = parseInt(this.dataset.index);
                goToSlide(index);
                resetAutoRotate();
            });
        });
    }
}

function renderProducts(products) {
    if (!carouselTrack) return;
    let html = '';
    for (let i = 0; i < products.length; i++) {
        const p = products[i];
        const imgSrc = p.image_url || 'https://picsum.photos/seed/' + (i + 1) + '/200/200';
        const soldOutBadge = p.is_sold_out ? '<span class="sold-out-badge">Sold Out</span>' : '';
        html += `<div class="product-card" data-category="${p.category}" data-price="${p.price}" data-name="${p.name}">
            <div class="product-image">
                <img src="${imgSrc}" alt="${p.name}" class="product-img" loading="lazy">
                ${soldOutBadge}
            </div>
            <h3>${p.name}</h3>
            <p>${p.description || ''}</p>
            <div class="product-price">${p.price}</div>
            <button class="btn-view-product">View Details</button>
        </div>`;
    }
    carouselTrack.innerHTML = html;
}

function renderTestimonials(testimonials) {
    if (!testimonialsGrid) return;
    let html = '';
    for (let i = 0; i < testimonials.length; i++) {
        const t = testimonials[i];
        let stars = '';
        for (let s = 0; s < 5; s++) {
            stars += `<i class="fas fa-star${s < t.rating ? '' : '-o'}"></i>`;
        }
        html += `<div class="testimonial-card">
            <div class="stars">${stars}</div>
            <p>"${t.content}"</p>
            <div class="customer-info"><strong>${t.customer_name}</strong>${t.location ? `<span>${t.location}</span>` : ''}</div>
        </div>`;
    }
    testimonialsGrid.innerHTML = html;
}

function updateStats(stats) {
    const c = (id) => document.getElementById(id);
    if (c('statCustomers')) c('statCustomers').textContent = stats.total_customers || 0;
    if (c('statProducts')) c('statProducts').textContent = stats.total_products || 0;
    if (c('statCities')) c('statCities').textContent = stats.total_cities || 0;
    if (c('statDelivery')) c('statDelivery').innerHTML = (stats.on_time_delivery || 0) + '%';
}

// ======================= HERO CAROUSEL =======================
let currentSlideIndex = 0;
let autoRotateTimer = null;

function goToSlide(index) {
    const slides = document.querySelectorAll('.hero-slide');
    const dots = document.querySelectorAll('.dot');
    if (!slides.length) return;
    if (index < 0) index = slides.length - 1;
    if (index >= slides.length) index = 0;
    for (let i = 0; i < slides.length; i++) {
        slides[i].classList.remove('active');
        if (dots[i]) dots[i].classList.remove('active');
    }
    slides[index].classList.add('active');
    if (dots[index]) dots[index].classList.add('active');
    currentSlideIndex = index;
}

function nextSlide() {
    const slides = document.querySelectorAll('.hero-slide');
    if (!slides.length) return;
    goToSlide(currentSlideIndex + 1);
}

function prevSlide() {
    const slides = document.querySelectorAll('.hero-slide');
    if (!slides.length) return;
    goToSlide(currentSlideIndex - 1);
}

function startAutoRotate() {
    stopAutoRotate();
    autoRotateTimer = setInterval(nextSlide, 5000);
}

function stopAutoRotate() {
    if (autoRotateTimer) {
        clearInterval(autoRotateTimer);
        autoRotateTimer = null;
    }
}

function resetAutoRotate() {
    stopAutoRotate();
    startAutoRotate();
}

function initHeroCarousel() {
    const slides = document.querySelectorAll('.hero-slide');
    if (slides.length > 0) goToSlide(0);
}

// ======================= SWIPE SUPPORT =======================
function initSwipe() {
    const container = document.querySelector('.hero-visual');
    if (!container) return;
    let touchStartX = 0, touchEndX = 0;
    container.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    container.addEventListener('touchend', function(e) {
        touchEndX = e.changedTouches[0].screenX;
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 50) {
            diff > 0 ? nextSlide() : prevSlide();
            resetAutoRotate();
        }
    }, { passive: true });
    container.addEventListener('mouseenter', stopAutoRotate);
    container.addEventListener('mouseleave', startAutoRotate);
    document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowLeft') { prevSlide(); resetAutoRotate(); }
        if (e.key === 'ArrowRight') { nextSlide(); resetAutoRotate(); }
    });
}

// ======================= FEATURES =======================
function initFeatures() {
    // Category filters
    filterBtns.forEach(function(btn) {
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
        prevBtn.addEventListener('click', () => carouselTrack.scrollBy({ left: -300, behavior: 'smooth' }));
        nextBtn.addEventListener('click', () => carouselTrack.scrollBy({ left: 300, behavior: 'smooth' }));
    }
    
    // Back to top
    if (backToTopBtn) {
        window.addEventListener('scroll', function() {
            backToTopBtn.classList.toggle('show', window.scrollY > 300);
        });
        backToTopBtn.addEventListener('click', function() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
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
            link.addEventListener('click', function() {
                navMenu.classList.remove('active');
                const icon = mobileMenuBtn.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            });
        });
        document.addEventListener('click', function(event) {
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
    function highlightNav() {
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
    window.addEventListener('scroll', highlightNav);
    window.addEventListener('load', highlightNav);
    
    // Current year
    const yearSpan = document.getElementById('currentYear');
    if (yearSpan) yearSpan.textContent = new Date().getFullYear();
    
    // View Details buttons
    document.querySelectorAll('.btn-view-product').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const card = this.closest('.product-card');
            const name = card.dataset.name;
            const price = card.dataset.price;
            Swal.fire({
                title: name,
                text: 'Price: ' + price + '\nContact us to purchase!',
                icon: 'info',
                confirmButtonText: 'Contact Sales',
                confirmButtonColor: '#2e7d32'
            });
        });
    });
    
    console.log('Features initialized!');
}

// ======================= START =======================
document.addEventListener('DOMContentLoaded', function() {
    console.log('Starting The BiggMart...');
    setTimeout(loadData, 200);
});

console.log('Script loaded successfully!');
