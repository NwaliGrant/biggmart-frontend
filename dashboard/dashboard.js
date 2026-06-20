/**
 * THE BIGGMART - ADMIN DASHBOARD
 * ✅ Connected to deployed backend
 */

// ======================= CONFIGURATION =======================
// 👇 CHANGE THIS TO YOUR BACKEND URL
const BACKEND_URL = 'http://biggmart-backend.onrender.com';
const API_URL = `${BACKEND_URL}/api`;

console.log(`🔗 Dashboard connected to: ${BACKEND_URL}`);

// ======================= ULTIMATE PROTECTION =======================
if (window._DASHBOARD_LOADED) {
    console.log('🚫 Dashboard already loaded! Skipping...');
    throw new Error('Dashboard already loaded!');
}
window._DASHBOARD_LOADED = true;
console.log('✅ Dashboard loading for the first time...');

let isLoading = false;
let dataLoaded = false;
let buttonClickCount = 0;
const MAX_BUTTON_CLICKS = 1;

// ======================= PAGE DETECTION =======================
const currentPage = window.location.pathname.split('/').pop() || 'index.html';
console.log(`📄 Current page: ${currentPage}`);

// ======================= AUTH =======================
if (currentPage === 'index.html' || currentPage === '') {
    console.log('🔐 Login page detected');
    document.getElementById('loginForm')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        if (isLoading) return;
        isLoading = true;
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorEl = document.getElementById('loginError');
        
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                localStorage.setItem('adminToken', data.token);
                localStorage.setItem('adminName', data.user.full_name || 'Admin');
                window.location.href = 'dashboard.html';
            } else {
                errorEl.style.display = 'block';
                errorEl.textContent = data.message || 'Invalid credentials';
            }
        } catch (error) {
            errorEl.style.display = 'block';
            errorEl.textContent = 'Network error. Please try again.';
        } finally {
            isLoading = false;
        }
    });
}

// ======================= LOGOUT =======================
document.getElementById('logoutBtn')?.addEventListener('click', function(e) {
    e.preventDefault();
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminName');
    window.location.href = 'index.html';
});

// ======================= CHECK AUTH =======================
function checkAuth() {
    const token = localStorage.getItem('adminToken');
    if (currentPage === 'index.html' || currentPage === '') {
        return;
    }
    if (!token) {
        window.location.href = 'index.html';
    }
}

function getHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
    };
}

// ======================= DASHBOARD =======================
if (currentPage === 'dashboard.html' && !dataLoaded) {
    console.log('📊 Loading dashboard...');
    loadDashboard();
}

async function loadDashboard() {
    if (dataLoaded || isLoading) {
        console.log('⏭️ Dashboard already loaded or loading...');
        return;
    }
    
    console.log('🔄 Loading dashboard...');
    isLoading = true;
    
    try {
        const statsResponse = await fetch(`${API_URL}/stats`);
        const statsData = await statsResponse.json();
        if (statsData.success) {
            document.getElementById('totalProducts').textContent = statsData.data.total_products || 0;
            document.getElementById('totalSoldOut').textContent = statsData.data.total_sold_out || 0;
            document.getElementById('totalCities').textContent = statsData.data.total_cities || 0;
            document.getElementById('totalCustomers').textContent = statsData.data.total_customers || 0;
        }
        
        const productsResponse = await fetch(`${API_URL}/products`);
        const productsData = await productsResponse.json();
        if (productsData.success) {
            const recent = productsData.data.slice(0, 5);
            const tbody = document.getElementById('recentProducts');
            if (recent.length === 0) {
                tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 30px; color: #94a3b8;">No products found</td></tr>`;
            } else {
                tbody.innerHTML = recent.map(p => `
                    <tr>
                        <td><strong>${p.name}</strong></td>
                        <td>${p.category}</td>
                        <td>${p.price}</td>
                        <td><span class="status-badge ${p.is_sold_out ? 'status-sold-out' : 'status-in-stock'}">${p.is_sold_out ? 'Sold Out' : 'In Stock'}</span></td>
                    </tr>
                `).join('');
            }
        }
        
        document.getElementById('adminName').textContent = localStorage.getItem('adminName') || 'Admin';
        dataLoaded = true;
        console.log('✅ Dashboard loaded successfully!');
        
    } catch (error) {
        console.error('❌ Error loading dashboard:', error);
        alert('Error loading dashboard. Make sure backend is running.');
    } finally {
        isLoading = false;
    }
}

// ======================= PRODUCTS =======================
if (currentPage === 'products.html' && !dataLoaded) {
    console.log('📦 Loading products...');
    loadProducts();
}

async function loadProducts() {
    if (dataLoaded || isLoading) {
        console.log('⏭️ Products already loaded or loading...');
        return;
    }
    
    console.log('🔄 Loading products...');
    isLoading = true;
    
    try {
        const response = await fetch(`${API_URL}/products`);
        const data = await response.json();
        const tbody = document.getElementById('productsTableBody');
        
        if (data.success && data.data.length > 0) {
            tbody.innerHTML = data.data.map(p => `
                <tr>
                    <td><img src="${p.image_url ? BACKEND_URL + p.image_url : 'https://via.placeholder.com/50'}" alt="${p.name}" class="product-img-thumb" onerror="this.src='https://via.placeholder.com/50'"></td>
                    <td><strong>${p.name}</strong></td>
                    <td>${p.category}</td>
                    <td>${p.price}</td>
                    <td><span class="status-badge ${p.is_sold_out ? 'status-sold-out' : 'status-in-stock'}">${p.is_sold_out ? 'Sold Out' : 'In Stock'}</span></td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="editProduct('${p.id}')"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-danger" onclick="deleteProduct('${p.id}')"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 40px; color: #94a3b8;">No products found</td></tr>`;
        }
        
        dataLoaded = true;
        console.log('✅ Products loaded successfully!');
    } catch (error) {
        console.error('❌ Error loading products:', error);
        alert('Error loading products. Make sure backend is running.');
    } finally {
        isLoading = false;
    }
}

// ======================= PRODUCT CRUD =======================
if (currentPage === 'products.html') {
    document.getElementById('addProductBtn')?.addEventListener('click', function(e) {
        if (this.disabled) return;
        this.disabled = true;
        setTimeout(() => { this.disabled = false; }, 500);
        
        document.getElementById('productModalTitle').textContent = 'Add New Product';
        document.getElementById('productId').value = '';
        document.getElementById('productForm').reset();
        document.getElementById('currentImagePreview').innerHTML = '';
        document.getElementById('productModal').style.display = 'flex';
    });

    document.getElementById('closeModal')?.addEventListener('click', function() {
        document.getElementById('productModal').style.display = 'none';
    });

    document.getElementById('cancelModal')?.addEventListener('click', function() {
        document.getElementById('productModal').style.display = 'none';
    });

    document.getElementById('productForm')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (isLoading) return;
        if (this.dataset.submitting === 'true') return;
        this.dataset.submitting = 'true';
        isLoading = true;
        
        const id = document.getElementById('productId').value;
        const formData = new FormData();
        formData.append('name', document.getElementById('productName').value);
        formData.append('category', document.getElementById('productCategory').value);
        formData.append('price', document.getElementById('productPrice').value);
        formData.append('description', document.getElementById('productDescription').value);
        formData.append('is_sold_out', document.getElementById('productStatus').value);
        
        const imageFile = document.getElementById('productImage').files[0];
        if (imageFile) formData.append('image', imageFile);
        
        try {
            const url = id ? `${API_URL}/products/${id}` : `${API_URL}/products`;
            const method = id ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method: method,
                headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` },
                body: formData
            });
            
            const data = await response.json();
            if (data.success) {
                Swal.fire('Success!', id ? 'Product updated successfully!' : 'Product added successfully!', 'success');
                document.getElementById('productModal').style.display = 'none';
                dataLoaded = false;
                setTimeout(() => loadProducts(), 300);
            } else {
                Swal.fire('Error!', data.message || 'Something went wrong', 'error');
            }
        } catch (error) {
            console.error('Save error:', error);
            Swal.fire('Error!', 'Network error. Please try again.', 'error');
        } finally {
            isLoading = false;
            this.dataset.submitting = 'false';
        }
    });
}

async function editProduct(id) {
    if (isLoading) return;
    isLoading = true;
    
    try {
        const response = await fetch(`${API_URL}/products/${id}`);
        const data = await response.json();
        if (data.success) {
            const p = data.data;
            document.getElementById('productModalTitle').textContent = 'Edit Product';
            document.getElementById('productId').value = p.id;
            document.getElementById('productName').value = p.name;
            document.getElementById('productCategory').value = p.category;
            document.getElementById('productPrice').value = p.price.replace(/[₦,]/g, '');
            document.getElementById('productDescription').value = p.description || '';
            document.getElementById('productStatus').value = p.is_sold_out ? 'true' : 'false';
            document.getElementById('currentImagePreview').innerHTML = p.image_url ? `<img src="${BACKEND_URL}${p.image_url}" style="max-width: 150px; border-radius: 8px;">` : '';
            document.getElementById('productModal').style.display = 'flex';
        }
    } catch (error) {
        console.error('Edit error:', error);
        Swal.fire('Error!', 'Failed to load product details', 'error');
    } finally {
        isLoading = false;
    }
}

async function deleteProduct(id) {
    if (isLoading) return;
    
    const result = await Swal.fire({
        title: 'Delete Product?',
        text: 'This action cannot be undone!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#c62828',
        confirmButtonText: 'Yes, delete'
    });
    
    if (result.isConfirmed) {
        isLoading = true;
        try {
            const response = await fetch(`${API_URL}/products/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            const data = await response.json();
            if (data.success) {
                Swal.fire('Deleted!', 'Product has been deleted.', 'success');
                dataLoaded = false;
                setTimeout(() => loadProducts(), 300);
            }
        } catch (error) {
            console.error('Delete error:', error);
            Swal.fire('Error!', 'Failed to delete product', 'error');
        } finally {
            isLoading = false;
        }
    }
}

// ======================= HERO IMAGES =======================
if (currentPage === 'hero.html' && !dataLoaded) {
    console.log('🖼️ Loading hero images...');
    loadHeroImages();
}

async function loadHeroImages() {
    if (dataLoaded || isLoading) return;
    
    console.log('🔄 Loading hero images...');
    isLoading = true;
    
    try {
        const response = await fetch(`${API_URL}/hero`);
        const data = await response.json();
        const grid = document.getElementById('heroGrid');
        
        if (data.success && data.data.length > 0) {
            grid.innerHTML = data.data.map(h => `
                <div class="hero-card">
                    <img src="${h.image_url.startsWith('http') ? h.image_url : BACKEND_URL + h.image_url}" alt="${h.title || 'Hero image'}" onerror="this.src='https://via.placeholder.com/250x200?text=No+Image'">
                    <div class="hero-card-info">
                        <h4>${h.title || 'Untitled'}</h4>
                        <p>${h.subtitle || ''}</p>
                    </div>
                    <div class="hero-card-actions">
                        <button class="btn btn-sm btn-primary" onclick="editHero('${h.id}')"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-danger" onclick="deleteHero('${h.id}')"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `).join('');
        } else {
            grid.innerHTML = `<div style="text-align: center; padding: 60px; color: #94a3b8; width: 100%;">No hero images yet</div>`;
        }
        
        dataLoaded = true;
        console.log('✅ Hero images loaded successfully!');
    } catch (error) {
        console.error('❌ Error loading hero images:', error);
    } finally {
        isLoading = false;
    }
}

// ======================= HERO CRUD =======================
if (currentPage === 'hero.html') {
    document.getElementById('addHeroBtn')?.addEventListener('click', function() {
        if (this.disabled) return;
        this.disabled = true;
        setTimeout(() => { this.disabled = false; }, 500);
        
        document.getElementById('heroModalTitle').textContent = 'Add Hero Image';
        document.getElementById('heroId').value = '';
        document.getElementById('heroForm').reset();
        document.getElementById('currentHeroPreview').innerHTML = '';
        document.getElementById('heroModal').style.display = 'flex';
    });

    document.getElementById('closeHeroModal')?.addEventListener('click', function() {
        document.getElementById('heroModal').style.display = 'none';
    });

    document.getElementById('cancelHeroModal')?.addEventListener('click', function() {
        document.getElementById('heroModal').style.display = 'none';
    });

    document.getElementById('heroForm')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        if (isLoading) return;
        if (this.dataset.submitting === 'true') return;
        this.dataset.submitting = 'true';
        isLoading = true;
        
        const id = document.getElementById('heroId').value;
        const formData = new FormData();
        formData.append('title', document.getElementById('heroTitle').value);
        formData.append('subtitle', document.getElementById('heroSubtitle').value);
        
        const imageFile = document.getElementById('heroImage').files[0];
        if (imageFile) formData.append('image', imageFile);
        
        try {
            const url = id ? `${API_URL}/hero/${id}` : `${API_URL}/hero`;
            const method = id ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method: method,
                headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` },
                body: formData
            });
            
            const data = await response.json();
            if (data.success) {
                Swal.fire('Success!', id ? 'Hero image updated!' : 'Hero image added!', 'success');
                document.getElementById('heroModal').style.display = 'none';
                dataLoaded = false;
                setTimeout(() => loadHeroImages(), 300);
            } else {
                Swal.fire('Error!', data.message || 'Something went wrong', 'error');
            }
        } catch (error) {
            console.error('Hero save error:', error);
            Swal.fire('Error!', 'Network error. Please try again.', 'error');
        } finally {
            isLoading = false;
            this.dataset.submitting = 'false';
        }
    });
}

async function editHero(id) {
    if (isLoading) return;
    isLoading = true;
    
    try {
        const response = await fetch(`${API_URL}/hero/${id}`);
        const data = await response.json();
        if (data.success) {
            const h = data.data;
            document.getElementById('heroModalTitle').textContent = 'Edit Hero Image';
            document.getElementById('heroId').value = h.id;
            document.getElementById('heroTitle').value = h.title || '';
            document.getElementById('heroSubtitle').value = h.subtitle || '';
            document.getElementById('currentHeroPreview').innerHTML = `<img src="${BACKEND_URL}${h.image_url}" style="max-width: 150px; border-radius: 8px;">`;
            document.getElementById('heroModal').style.display = 'flex';
        }
    } catch (error) {
        console.error('Edit hero error:', error);
        Swal.fire('Error!', 'Failed to load hero details', 'error');
    } finally {
        isLoading = false;
    }
}

async function deleteHero(id) {
    if (isLoading) return;
    
    const result = await Swal.fire({
        title: 'Delete Hero Image?',
        text: 'This action cannot be undone!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#c62828',
        confirmButtonText: 'Yes, delete'
    });
    
    if (result.isConfirmed) {
        isLoading = true;
        try {
            const response = await fetch(`${API_URL}/hero/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            const data = await response.json();
            if (data.success) {
                Swal.fire('Deleted!', 'Hero image has been deleted.', 'success');
                dataLoaded = false;
                setTimeout(() => loadHeroImages(), 300);
            }
        } catch (error) {
            console.error('Delete hero error:', error);
            Swal.fire('Error!', 'Failed to delete hero image', 'error');
        } finally {
            isLoading = false;
        }
    }
}

// ======================= TESTIMONIALS =======================
if (currentPage === 'testimonials.html' && !dataLoaded) {
    console.log('⭐ Loading testimonials...');
    loadTestimonials();
}

async function loadTestimonials() {
    if (dataLoaded || isLoading) return;
    
    console.log('🔄 Loading testimonials...');
    isLoading = true;
    
    try {
        const response = await fetch(`${API_URL}/testimonials`);
        const data = await response.json();
        const tbody = document.getElementById('testimonialsTableBody');
        
        if (data.success && data.data.length > 0) {
            tbody.innerHTML = data.data.map(t => `
                <tr>
                    <td><strong>${t.customer_name}</strong></td>
                    <td>${t.content.substring(0, 60)}${t.content.length > 60 ? '...' : ''}</td>
                    <td>${'⭐'.repeat(t.rating)}</td>
                    <td><span class="status-badge ${t.is_published ? 'status-published' : 'status-unpublished'}">${t.is_published ? 'Published' : 'Unpublished'}</span></td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="editTestimonial('${t.id}')"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-danger" onclick="deleteTestimonial('${t.id}')"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 40px; color: #94a3b8;">No testimonials found</td></tr>`;
        }
        
        dataLoaded = true;
        console.log('✅ Testimonials loaded successfully!');
    } catch (error) {
        console.error('❌ Error loading testimonials:', error);
    } finally {
        isLoading = false;
    }
}

// ======================= TESTIMONIAL CRUD =======================
if (currentPage === 'testimonials.html') {
    document.getElementById('addTestimonialBtn')?.addEventListener('click', function() {
        if (this.disabled) return;
        this.disabled = true;
        setTimeout(() => { this.disabled = false; }, 500);
        
        document.getElementById('testimonialModalTitle').textContent = 'Add Testimonial';
        document.getElementById('testimonialId').value = '';
        document.getElementById('testimonialForm').reset();
        document.getElementById('testimonialModal').style.display = 'flex';
    });

    document.getElementById('closeTestimonialModal')?.addEventListener('click', function() {
        document.getElementById('testimonialModal').style.display = 'none';
    });

    document.getElementById('cancelTestimonialModal')?.addEventListener('click', function() {
        document.getElementById('testimonialModal').style.display = 'none';
    });

    document.getElementById('testimonialForm')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        if (isLoading) return;
        if (this.dataset.submitting === 'true') return;
        this.dataset.submitting = 'true';
        isLoading = true;
        
        const id = document.getElementById('testimonialId').value;
        const data = {
            customer_name: document.getElementById('testimonialName').value,
            location: document.getElementById('testimonialLocation').value,
            content: document.getElementById('testimonialContent').value,
            rating: parseInt(document.getElementById('testimonialRating').value)
        };
        
        try {
            const url = id ? `${API_URL}/testimonials/${id}` : `${API_URL}/testimonials`;
            const method = id ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method: method,
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            if (result.success) {
                Swal.fire('Success!', id ? 'Testimonial updated!' : 'Testimonial added!', 'success');
                document.getElementById('testimonialModal').style.display = 'none';
                dataLoaded = false;
                setTimeout(() => loadTestimonials(), 300);
            } else {
                Swal.fire('Error!', result.message || 'Something went wrong', 'error');
            }
        } catch (error) {
            console.error('Testimonial save error:', error);
            Swal.fire('Error!', 'Network error. Please try again.', 'error');
        } finally {
            isLoading = false;
            this.dataset.submitting = 'false';
        }
    });
}

async function editTestimonial(id) {
    if (isLoading) return;
    isLoading = true;
    
    try {
        const response = await fetch(`${API_URL}/testimonials/${id}`);
        const data = await response.json();
        if (data.success) {
            const t = data.data;
            document.getElementById('testimonialModalTitle').textContent = 'Edit Testimonial';
            document.getElementById('testimonialId').value = t.id;
            document.getElementById('testimonialName').value = t.customer_name;
            document.getElementById('testimonialLocation').value = t.location || '';
            document.getElementById('testimonialContent').value = t.content;
            document.getElementById('testimonialRating').value = t.rating;
            document.getElementById('testimonialModal').style.display = 'flex';
        }
    } catch (error) {
        console.error('Edit testimonial error:', error);
        Swal.fire('Error!', 'Failed to load testimonial details', 'error');
    } finally {
        isLoading = false;
    }
}

async function deleteTestimonial(id) {
    if (isLoading) return;
    
    const result = await Swal.fire({
        title: 'Delete Testimonial?',
        text: 'This action cannot be undone!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#c62828',
        confirmButtonText: 'Yes, delete'
    });
    
    if (result.isConfirmed) {
        isLoading = true;
        try {
            const response = await fetch(`${API_URL}/testimonials/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            const data = await response.json();
            if (data.success) {
                Swal.fire('Deleted!', 'Testimonial has been deleted.', 'success');
                dataLoaded = false;
                setTimeout(() => loadTestimonials(), 300);
            }
        } catch (error) {
            console.error('Delete testimonial error:', error);
            Swal.fire('Error!', 'Failed to delete testimonial', 'error');
        } finally {
            isLoading = false;
        }
    }
}

// ======================= STATS =======================
if (currentPage === 'stats.html' && !dataLoaded) {
    console.log('📊 Loading stats...');
    loadStats();
}

async function loadStats() {
    if (dataLoaded || isLoading) return;
    
    console.log('🔄 Loading stats...');
    isLoading = true;
    
    try {
        const response = await fetch(`${API_URL}/stats`);
        const data = await response.json();
        if (data.success) {
            document.getElementById('editCustomers').value = data.data.total_customers || 0;
            document.getElementById('editProducts').value = data.data.total_products || 0;
            document.getElementById('editCities').value = data.data.total_cities || 0;
            document.getElementById('editDelivery').value = data.data.on_time_delivery || 0;
        }
        
        dataLoaded = true;
        console.log('✅ Stats loaded successfully!');
    } catch (error) {
        console.error('❌ Error loading stats:', error);
    } finally {
        isLoading = false;
    }
}

async function updateStat(field, inputId) {
    if (isLoading) return;
    isLoading = true;
    
    const value = parseInt(document.getElementById(inputId).value);
    if (isNaN(value) || value < 0) {
        Swal.fire('Error!', 'Please enter a valid number', 'error');
        isLoading = false;
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/stats`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ [field]: value })
        });
        const data = await response.json();
        if (data.success) {
            Swal.fire('Updated!', `${field.replace('_', ' ')} updated to ${value}`, 'success');
            dataLoaded = false;
            setTimeout(() => loadStats(), 300);
        } else {
            Swal.fire('Error!', data.message || 'Something went wrong', 'error');
        }
    } catch (error) {
        console.error('Update stat error:', error);
        Swal.fire('Error!', 'Network error. Please try again.', 'error');
    } finally {
        isLoading = false;
    }
}

// ======================= SIDEBAR TOGGLE =======================
document.getElementById('menuToggle')?.addEventListener('click', function() {
    document.getElementById('sidebar').classList.toggle('open');
});

// ======================= MODAL CLOSE =======================
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            this.style.display = 'none';
        }
    });
});

// ======================= SET ADMIN NAME =======================
const adminName = localStorage.getItem('adminName') || 'Admin';
document.querySelectorAll('#adminName').forEach(el => {
    el.textContent = adminName;
});

// ======================= CHECK AUTH =======================
checkAuth();

// ======================= SEARCH =======================
document.getElementById('searchProducts')?.addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase();
    const rows = document.querySelectorAll('#productsTableBody tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
});

console.log(`✅ Dashboard initialized successfully on ${currentPage}!`);
console.log(`📡 Backend: ${BACKEND_URL}`);
