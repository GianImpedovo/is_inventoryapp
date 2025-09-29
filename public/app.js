/* public/app.js — Dashboard estilo cards (sin React) */
const API_BASE = '/api';

const state = {
  products: [],
  filtered: [],
  stats: { total_products: 0, total_items: 0, categories: 0, total_value: 0 },
  search: '',
  category: '',
  editing: null, // producto en edición o null
};

const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));
const fmtMoney = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(n || 0));

document.addEventListener('DOMContentLoaded', init);

async function init() {
  buildSkeleton();       // arma el layout
  bindEvents();          // listeners
  await loadProducts();  // trae productos
  await loadStats();     // trae stats o los calcula
  renderAll();           // pinta todo
}

/* ---------- UI skeleton ---------- */
function buildSkeleton() {
  const root = document.querySelector('.container') || document.body;
  root.innerHTML = `
    <header class="hdr">
      <div class="brand">
        <span class="logo">🏬</span>
        <h1>Inventory Manager</h1>
      </div>
      <button id="addBtn" class="btn btn-primary">+ Add Product</button>
    </header>

    <section id="stats" class="stats"></section>

    <section class="filters card">
      <div class="filter-grid">
        <div class="field">
          <label>Search</label>
          <div class="input-icon">
            <span>🔎</span>
            <input id="searchInput" type="text" placeholder="Search products..." />
          </div>
        </div>
        <div class="field">
          <label>Category</label>
          <select id="categorySelect">
            <option value="">All Categories</option>
          </select>
        </div>
      </div>
    </section>

    <section id="grid" class="grid"></section>
    <div id="empty" class="empty hidden">
      <div>📦 No products found</div>
    </div>

    <!-- Modal -->
    <div id="modal" class="modal hidden" aria-hidden="true">
      <div class="modal-backdrop"></div>
      <div class="modal-card">
        <h2 id="modalTitle">Add Product</h2>
        <form id="productForm" class="form">
          <div class="field">
            <label>Name</label>
            <input name="name" type="text" required />
          </div>
          <div class="field">
            <label>Category</label>
            <select name="category" required>
              <option value="">Select Category</option>
              <option>Electronics</option>
              <option>Furniture</option>
              <option>Food</option>
              <option>Office Supplies</option>
            </select>
          </div>
          <div class="two">
            <div class="field">
              <label>Quantity</label>
              <input name="quantity" type="number" min="0" value="0" required />
            </div>
            <div class="field">
              <label>Price</label>
              <input name="price" type="number" min="0" step="0.01" value="0" required />
            </div>
          </div>
          <div class="field">
            <label>Description</label>
            <textarea name="description" rows="3"></textarea>
          </div>
          <div class="row-actions">
            <button type="submit" class="btn btn-primary">Save</button>
            <button type="button" id="cancelBtn" class="btn">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

/* ---------- Data ---------- */
async function loadProducts() {
  const res = await fetch(`${API_BASE}/products`);
  state.products = await res.json();
  applyFilter();
  // llenar categorías en el select
  const cats = [...new Set(state.products.map(p => p.category).filter(Boolean))];
  const sel = $('#categorySelect');
  sel.innerHTML = `<option value="">All Categories</option>` +
    cats.map(c => `<option>${c}</option>`).join('');
}

async function loadStats() {
  try {
    const res = await fetch(`${API_BASE}/stats`);
    if (!res.ok) throw new Error('no stats');
    state.stats = await res.json();
  } catch {
    // fallback: calcula en el front
    const p = state.products;
    state.stats = {
      total_products: p.length,
      total_items: p.reduce((a, x) => a + Number(x.quantity || 0), 0),
      categories: new Set(p.map(x => x.category).filter(Boolean)).size,
      total_value: p.reduce((a, x) => a + Number(x.quantity || 0) * Number(x.price || 0), 0),
    };
  }
}

/* ---------- Rendering ---------- */
function renderAll() {
  renderStats();
  renderGrid();
}

function renderStats() {
  const s = state.stats;
  $('#stats').innerHTML = `
    <div class="stats-grid">
      ${statCard('📦', 'Products', s.total_products)}
      ${statCard('🧱', 'Total Items', s.total_items)}
      ${statCard('🏷️', 'Categories', s.categories)}
      ${statCard('💲', 'Total Value', fmtMoney(s.total_value))}
    </div>
  `;
}
const statCard = (icon, label, value) => `
  <div class="card stat">
    <div class="icon">${icon}</div>
    <div>
      <div class="label">${label}</div>
      <div class="value">${value ?? 0}</div>
    </div>
  </div>
`;

function renderGrid() {
  const grid = $('#grid');
  grid.innerHTML = state.filtered.map(cardHTML).join('');
  $('#empty').classList.toggle('hidden', state.filtered.length > 0);
}

function cardHTML(p) {
  const badgeClass =
    p.quantity > 10 ? 'badge green' : p.quantity > 0 ? 'badge yellow' : 'badge red';
  return `
    <article class="card product">
      <div class="top">
        <h3 class="title">${escapeHtml(p.name || '')}</h3>
        <div class="actions">
          <button class="icon-btn" data-edit="${p.id}" title="Edit">✏️</button>
          <button class="icon-btn" data-del="${p.id}" title="Delete">🗑️</button>
        </div>
      </div>
      <div class="subtitle">${escapeHtml(p.category || '')}</div>
      <p class="desc">${escapeHtml(p.description || '')}</p>
      <div class="bottom">
        <span class="price">${fmtMoney(p.price)}</span>
        <span class="${badgeClass}">Stock: ${Number(p.quantity || 0)}</span>
      </div>
    </article>
  `;
}

/* ---------- Filtering ---------- */
function applyFilter() {
  state.filtered = state.products.filter(p => {
    const name = (p.name || '').toLowerCase();
    const desc = (p.description || '').toLowerCase();
    const matchesSearch =
      !state.search || name.includes(state.search) || desc.includes(state.search);
    const matchesCat = !state.category || p.category === state.category;
    return matchesSearch && matchesCat;
  });
}

/* ---------- Events ---------- */
function bindEvents() {
  $('#searchInput').addEventListener('input', (e) => {
    state.search = e.target.value.trim().toLowerCase();
    applyFilter(); renderGrid();
  });
  $('#categorySelect').addEventListener('change', (e) => {
    state.category = e.target.value;
    applyFilter(); renderGrid();
  });

  $('#addBtn').addEventListener('click', () => openModal(null));
  $('#cancelBtn').addEventListener('click', closeModal);

  // submit de formulario (crear/editar)
  $('#productForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = {
      name: fd.get('name')?.trim(),
      category: fd.get('category') || null,
      quantity: Number(fd.get('quantity') || 0),
      price: Number(fd.get('price') || 0),
      description: fd.get('description')?.trim() || null,
    };
    const isEdit = !!state.editing;
    const url = isEdit ? `${API_BASE}/products/${state.editing.id}` : `${API_BASE}/products`;
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error('Save error', await res.text());
      return;
    }
    await loadProducts();
    await loadStats();
    renderAll();
    closeModal();
  });

  // delegación para Edit/Delete en la grilla
  $('#grid').addEventListener('click', async (e) => {
    const editId = e.target.closest('[data-edit]')?.dataset.edit;
    const delId = e.target.closest('[data-del]')?.dataset.del;
    if (editId) {
      const prod = state.products.find(p => String(p.id) === String(editId));
      openModal(prod);
    } else if (delId) {
      if (confirm('Are you sure you want to delete this product?')) {
        await fetch(`${API_BASE}/products/${delId}`, { method: 'DELETE' });
        await loadProducts();
        await loadStats();
        renderAll();
      }
    }
  });
}

/* ---------- Modal helpers ---------- */
function openModal(product) {
  state.editing = product;
  $('#modalTitle').textContent = product ? 'Edit Product' : 'Add Product';
  const form = $('#productForm');
  form.name.value = product?.name || '';
  form.category.value = product?.category || '';
  form.quantity.value = Number(product?.quantity ?? 0);
  form.price.value = Number(product?.price ?? 0);
  form.description.value = product?.description || '';
  $('#modal').classList.remove('hidden');
  $('#modal').setAttribute('aria-hidden', 'false');
}
function closeModal() {
  state.editing = null;
  $('#modal').classList.add('hidden');
  $('#modal').setAttribute('aria-hidden', 'true');
}

/* ---------- Utils ---------- */
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (m) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
}
