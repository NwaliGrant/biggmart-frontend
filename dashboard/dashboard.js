/**
 * THE BIGGMART - ADMIN DASHBOARD
 * ✅ Production ready - uses live API
 */

// ======================= CONFIG =======================
const API_URL = 'https://biggmart-backend.onrender.com/api';
let isLoading = false;
let dataLoaded = false;
let currentToken = localStorage.getItem('adminToken');

// ======================= AUTH =======================
document.getElementById('loginForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    if (isLoading) return;
    isLoading = true;
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('loginError');
    
    try {
        const response = await fetch(API_URL + '/auth/login', {
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

document.getElementById('logoutBtn')?.addEventListener('click', function(e) {
    e.preventDefault();
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminName');
    window.location.href = 'index.html';
});

function checkAuth() {
    const token = localStorage.getItem('adminToken');
    if (!token && !window.location.pathname.includes('index.html')) {
        window.location.href = 'index.html';
    }
}

function getHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('adminToken')
    };
}

// ======================= PAGE DETECTION =======================
const currentPage = window.location.pathname.split('/').pop() || 'index.html';

// ======================= DASHBOARD =======================
if (currentPage === 'dashboard.html' && !dataLoaded) {
    loadDashboard();
}

async function loadDashboard() {
    if (dataLoaded || isLoading) return;
    isLoading = true;
    
    try {
        const statsResponse = await fetch(API_URL + '/stats');
        const statsData = await statsResponse.json();
        if (statsData.success) {
            document.getElementById('totalProducts').textContent = statsData.data.total_products || 0;
            document.getElementById('totalSoldOut').textContent = statsData.data.total_sold_out || 0;
            document.getElementById('totalCities').textContent = statsData.data.total_cities || 0;
            document.getElementById('totalCustomers').textContent = statsData.data.total_customers || 0;
        }
        
        const productsResponse = await fetch(API_URL + '/products');
        const productsData = await productsResponse.json();
        if (productsData.success) {
            const recent = productsData.data.slice(0, 5);
            const tbody = document.getElementById('recentProducts');
            if (recent.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 30px; color: #94a3b8;">No products found</td></tr>';
            } else {
                let html = '';
                for (let i = 0; i < recent.length; i++) {
                    const p = recent[i];
                    const statusClass = p.is_sold_out ? 'status-sold-out' : 'status-in-stock';
                    const statusText = p.is_sold_out ? 'Sold Out' : 'In Stock';
                    html += `<tr>
                        <td><strong>${p.name}</strong></td>
                        <td>${p.category}</td>
                        <td>${p.price}</td>
                        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    </tr>`;
                }
                tbody.innerHTML = html;
            }
        }
        
        document.getElementById('adminName').textContent = localStorage.getItem('adminName') || 'Admin';
        dataLoaded = true;
    } catch (error) {
        console.error('Error loading dashboard:', error);
    } finally {
        isLoading = false;
    }
}

// ======================= PRODUCTS =======================
if (currentPage === 'products.html') {
    loadProducts();
    
    document.getElementById('addProductBtn')?.addEventListener('click', function() {
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
            const url = id ? API_URL + '/products/' + id : API_URL + '/products';
            const method = id ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method: method,
                headers: { 'Authorization': 'Bearer ' + localStorage.getItem('adminToken') },
                body: formData
            });
            
            const data = await response.json();
            if (data.success) {
                Swal.fire('Success!', id ? 'Product updated successfully!' : 'Product added successfully!', 'success');
                document.getElementById('productModal').style.display = 'none';
                dataLoaded = false;
                loadProducts();
            } else {
                Swal.fire('Error!', data.message || 'Something went wrong', 'error');
            }
        } catch (error) {
            Swal.fire('Error!', 'Network error. Please try again.', 'error');
        } finally {
            isLoading = false;
        }
    });
}

async function loadProducts() {
    if (isLoading) return;
    isLoading = true;
    
    const tbody = document.getElementById('productsTableBody');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #94a3b8;"><i class="fas fa-spinner fa-spin"></i> Loading products...</td></tr>';
    
    try {
        const response = await fetch(API_URL + '/products');
        if (!response.ok) throw new Error('HTTP ' + response.status);
        
        const data = await response.json();
        
        if (data.success && data.data && data.data.length > 0) {
            let html = '';
            for (let i = 0; i < data.data.length; i++) {
                const p = data.data[i];
                const productId = p._id || p.id;
                const statusClass = p.is_sold_out ? 'status-sold-out' : 'status-in-stock';
                const statusText = p.is_sold_out ? 'Sold Out' : 'In Stock';
                const imgSrc = p.image_url || 'https://via.placeholder.com/50';
                html += `<tr>
                    <td><img src="${imgSrc}" alt="${p.name}" class="product-img-thumb"></td>
                    <td><strong>${p.name}</strong></td>
                    <td>${p.category}</td>
                    <td>${p.price}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="editProduct('${productId}')"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-danger" onclick="deleteProduct('${productId}')"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>`;
            }
            tbody.innerHTML = html;
        } else {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #94a3b8;">No products found</td></tr>';
        }
    } catch (error) {
        console.error('Error loading products:', error);
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 40px; color: #c62828;">❌ Failed to load products<br><small>${error.message}</small><br><button onclick="loadProducts()" style="margin-top:10px;padding:8px 20px;background:#1e4a76;color:white;border:none;border-radius:5px;cursor:pointer;"><i class="fas fa-sync"></i> Retry</button></td></tr>`;
    } finally {
        isLoading = false;
    }
}

// ======================= EDIT PRODUCT =======================
window.editProduct = async function(id) {
    if (!id || id === 'undefined') {
        Swal.fire('Error!', 'Product ID is missing. Please refresh and try again.', 'error');
        return;
    }
    if (isLoading) return;
    isLoading = true;
    
    try {
        const response = await fetch(API_URL + '/products/' + id);
        if (!response.ok) throw new Error('HTTP ' + response.status);
        
        const data = await response.json();
        if (data.success) {
            const p = data.data;
            const productId = p._id || p.id;
            document.getElementById('productModalTitle').textContent = 'Edit Product';
            document.getElementById('productId').value = productId || '';
            document.getElementById('productName').value = p.name || '';
            document.getElementById('productCategory').value = p.category || '';
            document.getElementById('productPrice').value = p.price ? p.price.toString().replace(/[₦,]/g, '') : '';
            document.getElementById('productDescription').value = p.description || '';
            document.getElementById('productStatus').value = p.is_sold_out ? 'true' : 'false';
            document.getElementById('currentImagePreview').innerHTML = p.image_url ? `<img src="${p.image_url}" style="max-width: 150px; border-radius: 8px;">` : 'No image';
            document.getElementById('productModal').style.display = 'flex';
        } else {
            Swal.fire('Error!', 'Failed to load product details', 'error');
        }
    } catch (error) {
        console.error('Edit error:', error);
        Swal.fire('Error!', 'Failed to load product details: ' + error.message, 'error');
    } finally {
        isLoading = false;
    }
};

// ======================= DELETE PRODUCT =======================
window.deleteProduct = async function(id) {
    if (!id || id === 'undefined') {
        Swal.fire('Error!', 'Product ID is missing. Please refresh and try again.', 'error');
        return;
    }
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
            const response = await fetch(API_URL + '/products/' + id, {
                method: 'DELETE',
                headers: getHeaders()
            });
            const data = await response.json();
            if (data.success) {
                Swal.fire('Deleted!', 'Product has been deleted.', 'success');
                dataLoaded = false;
                loadProducts();
            } else {
                Swal.fire('Error!', data.message || 'Failed to delete product', 'error');
            }
        } catch (error) {
            console.error('Delete error:', error);
            Swal.fire('Error!', 'Failed to delete product: ' + error.message, 'error');
        } finally {
            isLoading = false;
        }
    }
};

// ======================= HERO IMAGES =======================
if (currentPage === 'hero.html') {
    loadHeroImages();
    
    document.getElementById('addHeroBtn')?.addEventListener('click', function() {
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
        isLoading = true;
        
        const id = document.getElementById('heroId').value;
        const formData = new FormData();
        formData.append('title', document.getElementById('heroTitle').value);
        formData.append('subtitle', document.getElementById('heroSubtitle').value);
        
        const imageFile = document.getElementById('heroImage').files[0];
        if (imageFile) formData.append('image', imageFile);
        
        try {
            const url = id ? API_URL + '/hero/' + id : API_URL + '/hero';
            const method = id ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method: method,
                headers: { 'Authorization': 'Bearer ' + localStorage.getItem('adminToken') },
                body: formData
            });
            
            const data = await response.json();
            if (data.success) {
                Swal.fire('Success!', id ? 'Hero image updated!' : 'Hero image added!', 'success');
                document.getElementById('heroModal').style.display = 'none';
                dataLoaded = false;
                loadHeroImages();
            } else {
                Swal.fire('Error!', data.message || 'Something went wrong', 'error');
            }
        } catch (error) {
            Swal.fire('Error!', 'Network error. Please try again.', 'error');
        } finally {
            isLoading = false;
        }
    });
}

async function loadHeroImages() {
    if (isLoading) return;
    isLoading = true;
    
    try {
        const response = await fetch(API_URL + '/hero');
        const data = await response.json();
        const grid = document.getElementById('heroGrid');
        
        if (data.success && data.data && data.data.length > 0) {
            let html = '';
            for (let i = 0; i < data.data.length; i++) {
                const h = data.data[i];
                const heroId = h._id || h.id;
                html += `<div class="hero-card">
                    <img src="${h.image_url}" alt="${h.title || 'Hero image'}">
                    <div class="hero-card-info">
                        <h4>${h.title || 'Untitled'}</h4>
                        <p>${h.subtitle || ''}</p>
                    </div>
                    <div class="hero-card-actions">
                        <button class="btn btn-sm btn-primary" onclick="editHero('${heroId}')"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-danger" onclick="deleteHero('${heroId}')"><i class="fas fa-trash"></i></button>
                    </div>
                </div>`;
            }
            grid.innerHTML = html;
        } else {
            grid.innerHTML = '<div style="text-align: center; padding: 60px; color: #94a3b8; width: 100%;">No hero images yet</div>';
        }
    } catch (error) {
        console.error('Error loading hero images:', error);
    } finally {
        isLoading = false;
    }
}

window.editHero = async function(id) {
    if (isLoading) return;
    isLoading = true;
    
    try {
        const response = await fetch(API_URL + '/hero/' + id);
        const data = await response.json();
        if (data.success) {
            const h = data.data;
            document.getElementById('heroModalTitle').textContent = 'Edit Hero Image';
            document.getElementById('heroId').value = h._id || h.id;
            document.getElementById('heroTitle').value = h.title || '';
            document.getElementById('heroSubtitle').value = h.subtitle || '';
            document.getElementById('currentHeroPreview').innerHTML = `<img src="${h.image_url}" style="max-width: 150px; border-radius: 8px;">`;
            document.getElementById('heroModal').style.display = 'flex';
        }
    } catch (error) {
        Swal.fire('Error!', 'Failed to load hero details', 'error');
    } finally {
        isLoading = false;
    }
};

window.deleteHero = async function(id) {
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
            const response = await fetch(API_URL + '/hero/' + id, {
                method: 'DELETE',
                headers: getHeaders()
            });
            const data = await response.json();
            if (data.success) {
                Swal.fire('Deleted!', 'Hero image has been deleted.', 'success');
                dataLoaded = false;
                loadHeroImages();
            }
        } catch (error) {
            Swal.fire('Error!', 'Failed to delete hero image', 'error');
        } finally {
            isLoading = false;
        }
    }
};

// ======================= TESTIMONIALS =======================
if (currentPage === 'testimonials.html') {
    loadTestimonials();
    
    document.getElementById('addTestimonialBtn')?.addEventListener('click', function() {
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
        isLoading = true;
        
        const id = document.getElementById('testimonialId').value;
        const data = {
            customer_name: document.getElementById('testimonialName').value,
            location: document.getElementById('testimonialLocation').value,
            content: document.getElementById('testimonialContent').value,
            rating: parseInt(document.getElementById('testimonialRating').value)
        };
        
        try {
            const url = id ? API_URL + '/testimonials/' + id : API_URL + '/testimonials';
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
                loadTestimonials();
            } else {
                Swal.fire('Error!', result.message || 'Something went wrong', 'error');
            }
        } catch (error) {
            Swal.fire('Error!', 'Network error. Please try again.', 'error');
        } finally {
            isLoading = false;
        }
    });
}

async function loadTestimonials() {
    if (isLoading) return;
    isLoading = true;
    
    try {
        const response = await fetch(API_URL + '/testimonials');
        const data = await response.json();
        const tbody = document.getElementById('testimonialsTableBody');
        
        if (data.success && data.data && data.data.length > 0) {
            let html = '';
            for (let i = 0; i < data.data.length; i++) {
                const t = data.data[i];
                const testimonialId = t._id || t.id;
                const statusClass = t.is_published ? 'status-published' : 'status-unpublished';
                const statusText = t.is_published ? 'Published' : 'Unpublished';
                let stars = '';
                for (let s = 0; s < 5; s++) {
                    stars += s < t.rating ? '⭐' : '☆';
                }
                html += `<tr>
                    <td><strong>${t.customer_name}</strong></td>
                    <td>${t.content ? t.content.substring(0, 60) : ''}${t.content && t.content.length > 60 ? '...' : ''}</td>
                    <td>${stars}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="editTestimonial('${testimonialId}')"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-danger" onclick="deleteTestimonial('${testimonialId}')"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>`;
            }
            tbody.innerHTML = html;
        } else {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: #94a3b8;">No testimonials found</td></tr>';
        }
    } catch (error) {
        console.error('Error loading testimonials:', error);
    } finally {
        isLoading = false;
    }
}

window.editTestimonial = async function(id) {
    if (isLoading) return;
    isLoading = true;
    
    try {
        const response = await fetch(API_URL + '/testimonials/' + id);
        const data = await response.json();
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
        Swal.fire('Error!', 'Failed to load testimonial details', 'error');
    } finally {
        isLoading = false;
    }
};

window.deleteTestimonial = async function(id) {
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
            const response = await fetch(API_URL + '/testimonials/' + id, {
                method: 'DELETE',
                headers: getHeaders()
            });
            const data = await response.json();
            if (data.success) {
                Swal.fire('Deleted!', 'Testimonial has been deleted.', 'success');
                dataLoaded = false;
                loadTestimonials();
            }
        } catch (error) {
            Swal.fire('Error!', 'Failed to delete testimonial', 'error');
        } finally {
            isLoading = false;
        }
    }
};

// ======================= STATS =======================
if (currentPage === 'stats.html') {
    loadStats();
}

async function loadStats() {
    if (isLoading) return;
    isLoading = true;
    
    try {
        const response = await fetch(API_URL + '/stats');
        const data = await response.json();
        if (data.success) {
            document.getElementById('editCustomers').value = data.data.total_customers || 0;
            document.getElementById('editProducts').value = data.data.total_products || 0;
            document.getElementById('editCities').value = data.data.total_cities || 0;
            document.getElementById('editDelivery').value = data.data.on_time_delivery || 0;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    } finally {
        isLoading = false;
    }
}

async function updateStat(field, inputId) {
    const value = parseInt(document.getElementById(inputId).value);
    if (isNaN(value) || value < 0) {
        Swal.fire('Error!', 'Please enter a valid number', 'error');
        return;
    }
    
    try {
        const response = await fetch(API_URL + '/stats', {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ [field]: value })
        });
        const data = await response.json();
        if (data.success) {
            Swal.fire('Updated!', field.replace('_', ' ') + ' updated to ' + value, 'success');
        } else {
            Swal.fire('Error!', data.message || 'Something went wrong', 'error');
        }
    } catch (error) {
        Swal.fire('Error!', 'Network error. Please try again.', 'error');
    }
}

// ======================= SIDEBAR TOGGLE =======================
document.getElementById('menuToggle')?.addEventListener('click', function() {
    document.getElementById('sidebar').classList.toggle('open');
});

// ======================= MODAL CLOSE =======================
document.querySelectorAll('.modal').forEach(function(modal) {
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            this.style.display = 'none';
        }
    });
});

// ======================= SET ADMIN NAME =======================
const adminName = localStorage.getItem('adminName') || 'Admin';
document.querySelectorAll('#adminName').forEach(function(el) {
    el.textContent = adminName;
});

// ======================= CHECK AUTH =======================
checkAuth();

console.log('✅ Dashboard initialized successfully!');
console.log('📄 Current page:', currentPage);
