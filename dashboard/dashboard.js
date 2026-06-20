/**
 * THE BIGGMART - ADMIN DASHBOARD
 * ✅ Fixed: Image URLs, duplicate loads, all CRUD operations
 */

// ======================= CONFIGURATION =======================
const BACKEND_URL = 'https://biggmart-backend.onrender.com';
const API_URL = `${BACKEND_URL}/api`;

console.log(`🔗 Dashboard connected to: ${BACKEND_URL}`);

// ======================= ULTIMATE PROTECTION =======================
if (window._DASHBOARD_LOADED) {
    console.log('🚫 Dashboard already loaded!');
    throw new Error('Dashboard already loaded!');
}
window._DASHBOARD_LOADED = true;
console.log('✅ Dashboard loading...');

let isLoading = false;
let dataLoaded = false;

// ======================= PAGE DETECTION =======================
const currentPage = window.location.pathname.split('/').pop() || 'index.html';
console.log(`📄 Current page: ${currentPage}`);

// ======================= HELPER: Compress Image =======================
function compressImage(file, maxWidth = 800, maxHeight = 800, quality = 0.7) {
    return new Promise((resolve, reject) => {
        if (!file.type.startsWith('image/')) {
            resolve(file);
            return;
        }
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                if (height > maxHeight) {
                    width = (width * maxHeight) / height;
                    height = maxHeight;
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob((blob) => {
                    const compressedFile = new File([blob], file.name, {
                        type: 'image/jpeg',
                        lastModified: Date.now()
                    });
                    resolve(compressedFile);
                }, 'image/jpeg', quality);
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });
}

// ======================= HELPER: Build Image URL =======================
function buildImageUrl(imagePath) {
    if (!imagePath) return '';
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
    }
    const cleanPath = imagePath.replace(/^\/+/, '');
    return `${BACKEND_URL}/${cleanPath}`;
}

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
            console.error('Login error:', error);
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

// ======================= FETCH WITH ERROR HANDLING =======================
async function fetchAPI(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`❌ API Error ${endpoint}:`, error);
        throw error;
    }
}

// ======================= DASHBOARD =======================
if (currentPage === 'dashboard.html' && !dataLoaded) {
    console.log('📊 Loading dashboard...');
    loadDashboard();
}

async function loadDashboard() {
    if (dataLoaded || isLoading) return;
    console.log('🔄 Loading dashboard...');
    isLoading = true;
    
    try {
        const statsData = await fetchAPI('/stats');
        if (statsData.success) {
            document.getElementById('totalProducts').textContent = statsData.data.total_products || 0;
            document.getElementById('totalSoldOut').textContent = statsData.data.total_sold_out || 0;
            document.getElementById('totalCities').textContent = statsData.data.total_cities || 0;
            document.getElementById('totalCustomers').textContent = statsData.data.total_customers || 0;
        }
        
        const productsData = await fetchAPI('/products');
        if (productsData.success) {
            const recent = productsData.data.slice(0, 5);
            const tbody = document.getElementById('recentProducts');
            if (recent.length === 0) {
                tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 30px; color: #94a3b8;">No products found</td></tr>`;
            } else {
                tbody.innerHTML = recent.map(p => {
                    const pid = p._id || p.id;
                    return `
                        <tr>
                            <td><strong>${p.name}</strong></td>
                            <td>${p.category}</td>
                            <td>${p.price}</td>
                            <td><span class="status-badge ${p.is_sold_out ? 'status-sold-out' : 'status-in-stock'}">${p.is_sold_out ? 'Sold Out' : 'In Stock'}</span></td>
                        </tr>
                    `;
                }).join('');
            }
        }
        
        document.getElementById('adminName').textContent = localStorage.getItem('adminName') || 'Admin';
        dataLoaded = true;
        console.log('✅ Dashboard loaded successfully!');
    } catch (error) {
        console.error('❌ Dashboard error:', error);
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
    if (dataLoaded || isLoading) return;
    
    console.log('🔄 Loading products...');
    isLoading = true;
    
    try {
        const data = await fetchAPI('/products');
        const tbody = document.getElementById('productsTableBody');
        
        if (data.success && data.data && data.data.length > 0) {
            tbody.innerHTML = data.data.map(p => {
                const productId = p._id || p.id;
                let imageUrl = 'https://picsum.photos/seed/' + (productId || Math.random()) + '/50/50';
                if (p.image_url) {
                    imageUrl = buildImageUrl(p.image_url);
                }
                return `
                    <tr>
                        <td><img src="${imageUrl}" alt="${p.name}" class="product-img-thumb" onerror="this.src='https://picsum.photos/seed/${productId || Math.random()}/50/50'"></td>
                        <td><strong>${p.name}</strong></td>
                        <td>${p.category}</td>
                        <td>${p.price}</td>
                        <td><span class="status-badge ${p.is_sold_out ? 'status-sold-out' : 'status-in-stock'}">${p.is_sold_out ? 'Sold Out' : 'In Stock'}</span></td>
                        <td>
                            <button class="btn btn-sm btn-primary" onclick="editProduct('${productId}')"><i class="fas fa-edit"></i></button>
                            <button class="btn btn-sm btn-danger" onclick="deleteProduct('${productId}')"><i class="fas fa-trash"></i></button>
                        </td>
                    </tr>
                `;
            }).join('');
        } else {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 40px; color: #94a3b8;">No products found</td></tr>`;
        }
        
        dataLoaded = true;
        console.log('✅ Products loaded successfully!');
    } catch (error) {
        console.error('❌ Products error:', error);
    } finally {
        isLoading = false;
    }
}

// ======================= PRODUCT CRUD =======================
if (currentPage === 'products.html') {
    document.getElementById('addProductBtn')?.addEventListener('click', function() {
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
        
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        submitBtn.disabled = true;
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
        if (imageFile) {
            try {
                const compressed = await compressImage(imageFile, 300, 300, 0.7);
                formData.append('image', compressed);
            } catch (error) {
                formData.append('image', imageFile);
            }
        }
        
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
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

async function editProduct(id) {
    if (isLoading) return;
    if (!id || id === 'undefined' || id === 'null') {
        Swal.fire('Error!', 'Invalid product ID', 'error');
        return;
    }
    isLoading = true;
    
    try {
        const data = await fetchAPI(`/products/${id}`);
        if (data.success) {
            const p = data.data;
            document.getElementById('productModalTitle').textContent = 'Edit Product';
            document.getElementById('productId').value = p._id || p.id;
            document.getElementById('productName').value = p.name;
            document.getElementById('productCategory').value = p.category;
            document.getElementById('productPrice').value = String(p.price).replace(/[₦,]/g, '');
            document.getElementById('productDescription').value = p.description || '';
            document.getElementById('productStatus').value = p.is_sold_out ? 'true' : 'false';
            const previewImage = p.image_url ? buildImageUrl(p.image_url) : '';
            document.getElementById('currentImagePreview').innerHTML = previewImage ? `<img src="${previewImage}" style="max-width: 150px; border-radius: 8px;">` : '';
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
    if (!id || id === 'undefined' || id === 'null') {
        Swal.fire('Error!', 'Invalid product ID', 'error');
        return;
    }
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
    // ✅ STRICT CHECK - prevent multiple loads
    if (dataLoaded) {
        console.log('✅ Hero images already loaded, skipping...');
        return;
    }
    if (isLoading) {
        console.log('⏳ Hero images already loading...');
        return;
    }
    
    console.log('🔄 Loading hero images...');
    isLoading = true;
    
    try {
        const data = await fetchAPI('/hero');
        const grid = document.getElementById('heroGrid');
        
        if (data && data.success && data.data && data.data.length > 0) {
            grid.innerHTML = data.data.map(h => {
                const hid = h._id || h.id;
                const imageUrl = h.image_url ? buildImageUrl(h.image_url) : `https://picsum.photos/250/200?random=${Math.random()}`;
                return `
                    <div class="hero-card">
                        <img src="${imageUrl}" alt="${h.title || 'Hero image'}" 
                             onerror="this.src='https://picsum.photos/250/200?random=${Math.random()}'">
                        <div class="hero-card-info">
                            <h4>${h.title || 'Untitled'}</h4>
                            <p>${h.subtitle || ''}</p>
                        </div>
                        <div class="hero-card-actions">
                            <button class="btn btn-sm btn-primary" onclick="editHero('${hid}')"><i class="fas fa-edit"></i></button>
                            <button class="btn btn-sm btn-danger" onclick="deleteHero('${hid}')"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            grid.innerHTML = `
                <div style="text-align: center; padding: 60px; color: #94a3b8; width: 100%;">
                    <i class="fas fa-images" style="font-size: 3rem; margin-bottom: 15px; display: block;"></i>
                    <p>No hero images yet</p>
                    <p style="font-size: 0.9rem;">Click "Add Hero Image" to upload your first hero image.</p>
                </div>
            `;
        }
        
        dataLoaded = true;
        console.log('✅ Hero images loaded successfully!');
    } catch (error) {
        console.error('❌ Hero images error:', error);
        const grid = document.getElementById('heroGrid');
        if (grid) {
            grid.innerHTML = `
                <div style="text-align: center; padding: 60px; color: #94a3b8; width: 100%;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 15px; display: block; color: #f57c00;"></i>
                    <p>Could not load hero images</p>
                    <p style="font-size: 0.9rem;">Please make sure your backend is running.</p>
                    <button onclick="location.reload()" style="margin-top: 15px; padding: 8px 20px; background: #1e4a76; color: white; border: none; border-radius: 8px; cursor: pointer;">Retry</button>
                </div>
            `;
        }
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
        
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
        submitBtn.disabled = true;
        this.dataset.submitting = 'true';
        isLoading = true;
        
        const id = document.getElementById('heroId').value;
        const formData = new FormData();
        formData.append('title', document.getElementById('heroTitle').value);
        formData.append('subtitle', document.getElementById('heroSubtitle').value);
        
        const imageFile = document.getElementById('heroImage').files[0];
        if (imageFile) {
            try {
                const compressed = await compressImage(imageFile, 800, 800, 0.7);
                formData.append('image', compressed);
            } catch (error) {
                formData.append('image', imageFile);
            }
        }
        
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
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

async function editHero(id) {
    if (isLoading) return;
    if (!id || id === 'undefined' || id === 'null') {
        Swal.fire('Error!', 'Invalid hero ID', 'error');
        return;
    }
    isLoading = true;
    
    try {
        const data = await fetchAPI(`/hero/${id}`);
        if (data.success) {
            const h = data.data;
            document.getElementById('heroModalTitle').textContent = 'Edit Hero Image';
            document.getElementById('heroId').value = h._id || h.id;
            document.getElementById('heroTitle').value = h.title || '';
            document.getElementById('heroSubtitle').value = h.subtitle || '';
            const previewImage = h.image_url ? buildImageUrl(h.image_url) : '';
            document.getElementById('currentHeroPreview').innerHTML = previewImage ? `<img src="${previewImage}" style="max-width: 150px; border-radius: 8px;">` : '';
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
    if (!id || id === 'undefined' || id === 'null') {
        Swal.fire('Error!', 'Invalid hero ID', 'error');
        return;
    }
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
        const data = await fetchAPI('/testimonials');
        const tbody = document.getElementById('testimonialsTableBody');
        if (data.success && data.data && data.data.length > 0) {
            tbody.innerHTML = data.data.map(t => {
                const tid = t._id || t.id;
                return `
                    <tr>
                        <td><strong>${t.customer_name}</strong></td>
                        <td>${t.content.substring(0, 60)}${t.content.length > 60 ? '...' : ''}</td>
                        <td>${'⭐'.repeat(t.rating)}</td>
                        <td><span class="status-badge ${t.is_published ? 'status-published' : 'status-unpublished'}">${t.is_published ? 'Published' : 'Unpublished'}</span></td>
                        <td>
                            <button class="btn btn-sm btn-primary" onclick="editTestimonial('${tid}')"><i class="fas fa-edit"></i></button>
                            <button class="btn btn-sm btn-danger" onclick="deleteTestimonial('${tid}')"><i class="fas fa-trash"></i></button>
                        </td>
                    </tr>
                `;
            }).join('');
        } else {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 40px; color: #94a3b8;">No testimonials found</td></tr>`;
        }
        dataLoaded = true;
        console.log('✅ Testimonials loaded successfully!');
    } catch (error) {
        console.error('❌ Testimonials error:', error);
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
    if (!id || id === 'undefined' || id === 'null') {
        Swal.fire('Error!', 'Invalid testimonial ID', 'error');
        return;
    }
    isLoading = true;
    
    try {
        const data = await fetchAPI(`/testimonials/${id}`);
        if (data.success) {
            const t = data.data;
            document.getElementById('testimonialModalTitle').textContent = 'Edit Testimonial';
            document.getElementById('testimonialId').value = t._id || t.id;
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
    if (!id || id === 'undefined' || id === 'null') {
        Swal.fire('Error!', 'Invalid testimonial ID', 'error');
        return;
    }
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
        const data = await fetchAPI('/stats');
        if (data.success) {
            document.getElementById('editCustomers').value = data.data.total_customers || 0;
            document.getElementById('editProducts').value = data.data.total_products || 0;
            document.getElementById('editCities').value = data.data.total_cities || 0;
            document.getElementById('editDelivery').value = data.data.on_time_delivery || 0;
        }
        dataLoaded = true;
        console.log('✅ Stats loaded successfully!');
    } catch (error) {
        console.error('❌ Stats error:', error);
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

console.log(`✅ Dashboard initialized on ${currentPage}!`);
console.log(`📡 Backend: ${BACKEND_URL}`);
