
const API_BASE = '/api';

async function fetchProducts() {
  const res = await fetch(`${API_BASE}/products`);
  const data = await res.json();
  renderTable(data);
}

function renderTable(items) {
  const tbody = document.querySelector('#products-table tbody');
  tbody.innerHTML = '';
  for (const p of items) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.id}</td>
      <td><input value="${p.name ?? ''}" data-id="${p.id}" data-field="name"/></td>
      <td><input value="${p.category ?? ''}" data-id="${p.id}" data-field="category"/></td>
      <td><input type="number" value="${p.quantity ?? 0}" data-id="${p.id}" data-field="quantity"/></td>
      <td><input type="number" step="0.01" value="${p.price ?? 0}" data-id="${p.id}" data-field="price"/></td>
      <td><input value="${p.description ?? ''}" data-id="${p.id}" data-field="description"/></td>
      <td>
        <button class="save" data-id="${p.id}">Guardar</button>
        <button class="delete" data-id="${p.id}">Eliminar</button>
      </td>
    `;
    tbody.appendChild(tr);
  }
}

document.addEventListener('click', async (e) => {
  if (e.target.classList.contains('delete')) {
    const id = e.target.dataset.id;
    await fetch(`${API_BASE}/products/${id}`, { method: 'DELETE' });
    await fetchProducts();
  }
  if (e.target.classList.contains('save')) {
    const id = e.target.dataset.id;
    const row = e.target.closest('tr');
    const payload = {};
    row.querySelectorAll('input').forEach(inp => {
      if (inp.dataset.id === id) payload[inp.dataset.field] = inp.type === 'number' ? Number(inp.value) : inp.value;
    });
    await fetch(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    await fetchProducts();
  }
});

document.querySelector('#product-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    name: document.querySelector('#name').value,
    category: document.querySelector('#category').value,
    quantity: Number(document.querySelector('#quantity').value || 0),
    price: Number(document.querySelector('#price').value || 0),
    description: document.querySelector('#description').value
  };
  const res = await fetch(`${API_BASE}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (res.ok) {
    document.querySelector('#status').textContent = 'Producto agregado';
    e.target.reset();
    await fetchProducts();
  } else {
    const err = await res.json();
    document.querySelector('#status').textContent = err.error || 'Error';
  }
});

fetchProducts();
