/**
 * THE BIGGMART - ADMIN DASHBOARD
 * SIMPLIFIED: Single image only, no carousel
 * ✅ FIXED: Better error handling for 400 errors
 * ✅ FIXED: ID cleaning for all product operations
 * ✅ FIXED: Testimonial CRUD fully implemented
 * ✅ FIXED: Product form submit with better error logging
 */

// ======================= CONFIGURATION =======================
const BACKEND_URL = 'https://biggmart-backend.onrender.com';
const API_URL = `${BACKEND_URL}/api`;

console.log(`🔗 Dashboard connected to: ${BACKEND_URL}`);

// ======================= ULTIMATE PROTECTION =======================
if (window._DASHBOARD_LOADED) {
    console.log('🚫 Dashboard already loaded');
} else {
    window._DASHBOARD_LOADED = true;
}

let isLoading = false;
let dataLoaded = false;

// ======================= PAGE DETECTION =======================
const currentPage = window.location.pathname.split('/').pop() || 'index.html';
console.log(`📄 Current page: ${currentPage}`);

// ======================= HELPER: Clean Product ID =======================
function cleanProductId(id) {
    if (!id) return null;
    if (typeof id === 'string') {
        // Remove any trailing characters after colon, dot, or comma
        id = id.split(':')[0].split('.')[0].split(',')[0];
        // Remove any non-hex characters (for ObjectId)
        id = id.replace(/[^a-fA-F0-9]/g, '');
    }
    return id;
}

// ======================= HELPER: Compress Image =======================
function compressImage(file, maxWidth = 300, maxHeight = 300, quality = 0.7) {
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
                if (errorEl) {
                    errorEl.style.display = 'block';
                    errorEl.textContent = data.message || 'Invalid credentials';
                }
            }
        } catch (error) {
            if (errorEl) {
                errorEl.style.display = 'block';
                errorEl.textContent = 'Network error. Please try again.';
            }
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
    const token = localStorage.getItem('adminToken');
    if (!token) {
        throw new Error('No token found. Please login again.');
    }
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// ======================= FETCH WITH ERROR HANDLING =======================
async function fetchAPI(endpoint, options = {}) {
    try {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
        
        const token = localStorage.getItem('adminToken');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: headers
        });
        
        console.log(`📡 ${endpoint} - Status: ${response.status}`);
        
        if (!response.ok) {
            let errorMessage = `HTTP ${response.status}`;
            try {
                const errorData = await response.json();
                if (errorData.message) errorMessage = errorData.message;
            } catch (e) {
                errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            }
            throw new Error(errorMessage);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`❌ API Error ${endpoint}:`, error.message);
        throw error;
    }
}

// ======================= DASHBOARD =======================
if (currentPage === 'dashboard.html' && !dataLoaded) {
    loadDashboard();
}

async function loadDashboard() {
    if (dataLoaded || isLoading) return;
    isLoading = true;
    
    try {
        const statsData = await fetchAPI('/stats');
        if (statsData.success) {
            const el = (id) => document.getElementById(id);
            if (el('totalProducts')) el('totalProducts').textContent = statsData.data.total_products || 0;
            if (el('totalSoldOut')) el('totalSoldOut').textContent = statsData.data.total_sold_out || 0;
            if (el('totalCities')) el('totalCities').textContent = statsData.data.total_cities || 0;
            if (el('totalCustomers')) el('totalCustomers').textContent = statsData.data.total_customers || 0;
        }
        
        const productsData = await fetchAPI('/products');
        const tbody = document.getElementById('recentProducts');
        if (productsData.success && productsData.data && productsData.data.length > 0 && tbody) {
            const recent = productsData.data.slice(0, 5);
            tbody.innerHTML = recent.map(p => `
                <tr>
                    <td><strong>${p.name}</strong></td>
                    <td>${p.category}</td>
                    <td>${p.price}</td>
                    <td><span class="status-badge ${p.is_sold_out ? 'status-sold-out' : 'status-in-stock'}">${p.is_sold_out ? 'Sold Out' : 'In Stock'}</span></td>
                </tr>
            `).join('');
        } else if (tbody) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 30px; color: #94a3b8;">No products found</td></tr>`;
        }
        
        const adminNameEl = document.getElementById('adminName');
        if (adminNameEl) {
            adminNameEl.textContent = localStorage.getItem('adminName') || 'Admin';
        }
        
        dataLoaded = true;
        console.log('✅ Dashboard loaded successfully!');
    } catch (error) {
        console.error('❌ Dashboard error:', error.message);
        const tbody = document.getElementById('recentProducts');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 30px; color: #c62828;">
                <i class="fas fa-exclamation-circle" style="font-size: 1.5rem; display: block; margin-bottom: 8px;"></i>
                Failed to load data: ${error.message}
                <br><button onclick="location.reload()" style="margin-top: 10px; padding: 8px 20px; background: #1e4a76; color: white; border: none; border-radius: 8px; cursor: pointer;">Retry</button>
            </td></tr>`;
        }
    } finally {
        isLoading = false;
    }
}

// ======================= PRODUCTS =======================
if (currentPage === 'products.html' && !dataLoaded) {
    loadProducts();
}

async function loadProducts() {
    if (dataLoaded || isLoading) return;
    
    isLoading = true;
    
    try {
        const data = await fetchAPI('/products');
        const tbody = document.getElementById('productsTableBody');
        
        if (data.success && data.data && data.data.length > 0 && tbody) {
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
        } else if (tbody) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 40px; color: #94a3b8;">No products found</td></tr>`;
        }
        
        dataLoaded = true;
    } catch (error) {
        console.error('❌ Products error:', error.message);
        const tbody = document.getElementById('productsTableBody');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 40px; color: #c62828;">
                <i class="fas fa-exclamation-circle" style="font-size: 1.5rem; display: block; margin-bottom: 8px;"></i>
                Failed to load products: ${error.message}
                <br><button onclick="location.reload()" style="margin-top: 10px; padding: 8px 20px; background: #1e4a76; color: white; border: none; border-radius: 8px; cursor: pointer;">Retry</button>
            </td></tr>`;
        }
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
        
        const mainPreview = document.getElementById('currentImagePreview');
        if (mainPreview) mainPreview.innerHTML = '';
        
        document.getElementById('productModal').style.display = 'flex';
    });

    document.getElementById('closeModal')?.addEventListener('click', function() {
        document.getElementById('productModal').style.display = 'none';
    });

    document.getElementById('cancelModal')?.addEventListener('click', function() {
        document.getElementById('productModal').style.display = 'none';
    });

    // ===== PRODUCT FORM SUBMIT - FIXED =====
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
        formData.append('description', document.getElementById('productDescription').value || '');
        formData.append('is_sold_out', document.getElementById('productStatus').value);
        
        // SINGLE IMAGE ONLY
        const imageFile = document.getElementById('productImage').files[0];
        if (imageFile) {
            try {
                const compressed = await compressImage(imageFile, 800, 800, 0.7);
                formData.append('image', compressed);
            } catch (error) {
                formData.append('image', imageFile);
            }
        }
        
        try {
            const url = id ? `${API_URL}/products/${id}` : `${API_URL}/products`;
            const method = id ? 'PUT' : 'POST';
            
            const token = localStorage.getItem('adminToken');
            if (!token) {
                throw new Error('No token found. Please login again.');
            }
            
            console.log(`📤 Sending ${method} request to: ${url}`);
            
            const response = await fetch(url, {
                method: method,
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            
            console.log(`📡 Response status: ${response.status}`);
            
            let data;
            try {
                data = await response.json();
            } catch (e) {
                data = { success: false, message: 'Invalid response from server' };
            }
            
            if (data.success) {
                Swal.fire('Success!', id ? 'Product updated successfully!' : 'Product added successfully!', 'success');
                document.getElementById('productModal').style.display = 'none';
                dataLoaded = false;
                setTimeout(() => loadProducts(), 300);
            } else {
                const errorMsg = data.message || 'Something went wrong';
                console.error('❌ Server error:', errorMsg);
                Swal.fire('Error!', errorMsg, 'error');
            }
        } catch (error) {
            console.error('❌ Save error:', error.message);
            Swal.fire('Error!', 'Network error. Please try again.', 'error');
        } finally {
            isLoading = false;
            this.dataset.submitting = 'false';
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

// ===== EDIT PRODUCT - FULLY FIXED =====
async function editProduct(id) {
    if (isLoading) {
        console.log('⏳ Already loading, please wait...');
        return;
    }
    
    // ✅ FIX: Clean the ID
    id = cleanProductId(id);
    
    if (!id || id === 'undefined' || id === 'null' || id === '') {
        console.error('❌ Invalid product ID:', id);
        Swal.fire('Error!', 'Invalid product ID. Please refresh and try again.', 'error');
        return;
    }
    
    console.log(`✏️ Editing product with ID: ${id}`);
    isLoading = true;
    
    try {
        Swal.fire({
            title: 'Loading...',
            text: 'Fetching product details...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        const token = localStorage.getItem('adminToken');
        if (!token) {
            Swal.close();
            Swal.fire('Error!', 'You are not logged in. Please login again.', 'error');
            window.location.href = 'index.html';
            return;
        }
        
        const response = await fetch(`${API_URL}/products/${id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            let errorMessage = `Server error: ${response.status}`;
            try {
                const errorData = await response.json();
                if (errorData.message) errorMessage = errorData.message;
            } catch (e) {
                errorMessage = `Server error: ${response.status} - ${response.statusText}`;
            }
            throw new Error(errorMessage);
        }
        
        const data = await response.json();
        Swal.close();
        
        if (data.success && data.data) {
            const p = data.data;
            console.log('✅ Product data loaded:', p.name);
            
            document.getElementById('productModalTitle').textContent = 'Edit Product';
            document.getElementById('productId').value = p._id || p.id;
            document.getElementById('productName').value = p.name || '';
            document.getElementById('productCategory').value = p.category || 'gadgets';
            document.getElementById('productPrice').value = String(p.price || 0).replace(/[₦,]/g, '');
            document.getElementById('productDescription').value = p.description || '';
            document.getElementById('productStatus').value = p.is_sold_out ? 'true' : 'false';
            
            // Main image preview
            const mainPreview = document.getElementById('currentImagePreview');
            if (mainPreview) {
                let previewImage = '';
                if (p.image_url) {
                    previewImage = buildImageUrl(p.image_url);
                }
                mainPreview.innerHTML = previewImage ? `<img src="${previewImage}" style="max-width: 150px; border-radius: 8px; border: 2px solid #e2e8f0;">` : '<p style="color: #94a3b8; font-size: 0.85rem;">No image</p>';
            }
            
            document.getElementById('productModal').style.display = 'flex';
        } else {
            Swal.fire('Error!', data.message || 'Product not found. It may have been deleted.', 'error');
        }
    } catch (error) {
        Swal.close();
        console.error('❌ Edit error:', error.message);
        
        if (error.message.includes('401') || error.message.includes('403')) {
            Swal.fire('Session Expired!', 'Please login again.', 'error').then(() => {
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminName');
                window.location.href = 'index.html';
            });
        } else if (error.message.includes('404')) {
            Swal.fire('Not Found!', 'Product no longer exists. It may have been deleted.', 'error');
            dataLoaded = false;
            setTimeout(() => loadProducts(), 500);
        } else if (error.message.includes('400')) {
            Swal.fire('Invalid Request!', 'There was a problem with the product ID. Please refresh and try again.', 'error');
            dataLoaded = false;
            setTimeout(() => loadProducts(), 500);
        } else if (error.message.includes('500')) {
            Swal.fire('Server Error!', 'The server is having issues. Please try again later.', 'error');
        } else {
            Swal.fire('Error!', 'Failed to load product details: ' + error.message, 'error');
        }
    } finally {
        isLoading = false;
    }
}

// ===== DELETE PRODUCT =====
async function deleteProduct(id) {
    if (isLoading) return;
    
    // ✅ FIX: Clean the ID
    id = cleanProductId(id);
    
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
            const token = localStorage.getItem('adminToken');
            if (!token) {
                throw new Error('No token found');
            }
            
            const response = await fetch(`${API_URL}/products/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const data = await response.json();
            if (data.success) {
                Swal.fire('Deleted!', 'Product has been deleted.', 'success');
                dataLoaded = false;
                setTimeout(() => loadProducts(), 300);
            } else {
                Swal.fire('Error!', data.message || 'Failed to delete product', 'error');
            }
        } catch (error) {
            console.error('Delete error:', error.message);
            Swal.fire('Error!', 'Failed to delete product: ' + error.message, 'error');
        } finally {
            isLoading = false;
        }
    }
}

// ======================= HERO IMAGES =======================
if (currentPage === 'hero.html' && !dataLoaded) {
    loadHeroImages();
}

async function loadHeroImages() {
    if (dataLoaded || isLoading) return;
    
    isLoading = true;
    
    try {
        const data = await fetchAPI('/hero');
        const grid = document.getElementById('heroGrid');
        
        if (data && data.success && data.data && data.data.length > 0 && grid) {
            grid.innerHTML = data.data.map(h => {
                const hid = h._id || h.id;
                let imageUrl = h.image_url;
                if (imageUrl && !imageUrl.startsWith('http')) {
                    imageUrl = BACKEND_URL + imageUrl;
                }
                return `
                    <div class="hero-card">
                        <img src="${imageUrl || 'https://picsum.photos/250/200?random=' + Math.random()}" alt="${h.title || 'Hero image'}" onerror="this.src='https://picsum.photos/250/200?random=${Math.random()}'">
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
        } else if (grid) {
            grid.innerHTML = `<div style="text-align: center; padding: 60px; color: #94a3b8; width: 100%;">No hero images yet</div>`;
        }
        
        dataLoaded = true;
    } catch (error) {
        console.error('❌ Hero images error:', error.message);
        const grid = document.getElementById('heroGrid');
        if (grid) {
            grid.innerHTML = `<div style="text-align: center; padding: 60px; color: #c62828; width: 100%;">
                <i class="fas fa-exclamation-circle" style="font-size: 2rem; display: block; margin-bottom: 10px;"></i>
                Failed to load hero images: ${error.message}
            </div>`;
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
            const token = localStorage.getItem('adminToken');
            if (!token) {
                throw new Error('No token found');
            }
            
            const url = id ? `${API_URL}/hero/${id}` : `${API_URL}/hero`;
            const method = id ? 'PUT' : 'POST';
            const response = await fetch(url, {
                method: method,
                headers: { 'Authorization': `Bearer ${token}` },
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
            console.error('Hero save error:', error.message);
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
            let previewImage = '';
            if (h.image_url) {
                if (h.image_url.startsWith('http')) {
                    previewImage = h.image_url;
                } else {
                    previewImage = BACKEND_URL + h.image_url;
                }
            }
            document.getElementById('currentHeroPreview').innerHTML = previewImage ? `<img src="${previewImage}" style="max-width: 150px; border-radius: 8px;">` : '';
            document.getElementById('heroModal').style.display = 'flex';
        }
    } catch (error) {
        console.error('Edit hero error:', error.message);
        Swal.fire('Error!', 'Failed to load hero details: ' + error.message, 'error');
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
            const token = localStorage.getItem('adminToken');
            if (!token) {
                throw new Error('No token found');
            }
            
            const response = await fetch(`${API_URL}/hero/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                Swal.fire('Deleted!', 'Hero image has been deleted.', 'success');
                dataLoaded = false;
                setTimeout(() => loadHeroImages(), 300);
            } else {
                Swal.fire('Error!', data.message || 'Failed to delete hero image', 'error');
            }
        } catch (error) {
            console.error('Delete hero error:', error.message);
            Swal.fire('Error!', 'Failed to delete hero image: ' + error.message, 'error');
        } finally {
            isLoading = false;
        }
    }
}

// ======================= TESTIMONIALS =======================
if (currentPage === 'testimonials.html' && !dataLoaded) {
    loadTestimonials();
}

async function loadTestimonials() {
    if (dataLoaded || isLoading) return;
    isLoading = true;
    
    try {
        const data = await fetchAPI('/testimonials');
        const tbody = document.getElementById('testimonialsTableBody');
        if (data.success && data.data && data.data.length > 0 && tbody) {
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
        } else if (tbody) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 40px; color: #94a3b8;">No testimonials found</td></tr>`;
        }
        dataLoaded = true;
    } catch (error) {
        console.error('❌ Testimonials error:', error.message);
        const tbody = document.getElementById('testimonialsTableBody');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 40px; color: #c62828;">
                <i class="fas fa-exclamation-circle" style="font-size: 1.5rem; display: block; margin-bottom: 8px;"></i>
                Failed to load testimonials: ${error.message}
            </td></tr>`;
        }
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
        
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        submitBtn.disabled = true;
        this.dataset.submitting = 'true';
        isLoading = true;
        
        const id = document.getElementById('testimonialId').value;
        const data = {
            customer_name: document.getElementById('testimonialName').value,
            location: document.getElementById('testimonialLocation').value || '',
            content: document.getElementById('testimonialContent').value,
            rating: parseInt(document.getElementById('testimonialRating').value) || 5,
            is_published: true
        };
        
        try {
            const token = localStorage.getItem('adminToken');
            if (!token) {
                throw new Error('No token found');
            }
            
            const url = id ? `${API_URL}/testimonials/${id}` : `${API_URL}/testimonials`;
            const method = id ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
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
            console.error('Testimonial save error:', error.message);
            Swal.fire('Error!', 'Network error. Please try again.', 'error');
        } finally {
            isLoading = false;
            this.dataset.submitting = 'false';
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
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
            document.getElementById('testimonialName').value = t.customer_name || '';
            document.getElementById('testimonialLocation').value = t.location || '';
            document.getElementById('testimonialContent').value = t.content || '';
            document.getElementById('testimonialRating').value = t.rating || 5;
            document.getElementById('testimonialModal').style.display = 'flex';
        } else {
            Swal.fire('Error!', 'Testimonial not found', 'error');
        }
    } catch (error) {
        console.error('Edit testimonial error:', error.message);
        Swal.fire('Error!', 'Failed to load testimonial: ' + error.message, 'error');
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
            const token = localStorage.getItem('adminToken');
            if (!token) {
                throw new Error('No token found');
            }
            
            const response = await fetch(`${API_URL}/testimonials/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                Swal.fire('Deleted!', 'Testimonial has been deleted.', 'success');
                dataLoaded = false;
                setTimeout(() => loadTestimonials(), 300);
            } else {
                Swal.fire('Error!', data.message || 'Failed to delete testimonial', 'error');
            }
        } catch (error) {
            console.error('Delete testimonial error:', error.message);
            Swal.fire('Error!', 'Failed to delete testimonial: ' + error.message, 'error');
        } finally {
            isLoading = false;
        }
    }
}

// ======================= STATS =======================
if (currentPage === 'stats.html' && !dataLoaded) {
    loadStats();
}

async function loadStats() {
    if (dataLoaded || isLoading) return;
    isLoading = true;
    
    try {
        const data = await fetchAPI('/stats');
        if (data.success) {
            const el = (id) => document.getElementById(id);
            if (el('editCustomers')) el('editCustomers').value = data.data.total_customers || 0;
            if (el('editProducts')) el('editProducts').value = data.data.total_products || 0;
            if (el('editCities')) el('editCities').value = data.data.total_cities || 0;
            if (el('editDelivery')) el('editDelivery').value = data.data.on_time_delivery || 0;
        }
        dataLoaded = true;
    } catch (error) {
        console.error('❌ Stats error:', error.message);
        Swal.fire('Error!', 'Failed to load stats: ' + error.message, 'error');
    } finally {
        isLoading = false;
    }
}

async function updateStat(field, inputId) {
    if (isLoading) return;
    isLoading = true;
    const input = document.getElementById(inputId);
    if (!input) {
        isLoading = false;
        return;
    }
    const value = parseInt(input.value);
    if (isNaN(value) || value < 0) {
        Swal.fire('Error!', 'Please enter a valid number', 'error');
        isLoading = false;
        return;
    }
    try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            throw new Error('No token found');
        }
        
        const response = await fetch(`${API_URL}/stats`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
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
        console.error('Update stat error:', error.message);
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
const adminNameEl = document.getElementById('adminName');
if (adminNameEl) {
    adminNameEl.textContent = adminName;
}

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

// ======================= CLOSE MODALS ON ESC =======================
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }
});

console.log(`✅ Dashboard initialized on ${currentPage}!`);
console.log(`📡 Backend: ${BACKEND_URL}`);
