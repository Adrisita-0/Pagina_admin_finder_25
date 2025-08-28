// reservas.js — Gestión de Reservas (SweetAlert2 + delegación de eventos)

// ------------------------- Helpers -------------------------
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const fmt = s => (s ?? '').toString().trim();

const parseESDate = (ddmmyyyy) => {
  const [d, m, y] = (ddmmyyyy || '').split('/').map(n => parseInt(n, 10));
  if (!d || !m || !y) return null;
  return new Date(y, m - 1, d);
};
const toESDate = (date) => {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
};
const randomId = () => `#${Math.floor(100000 + Math.random() * 899999)}`;

const STATUS_CLASS = {
  'Confirmada': 'available',
  'Pendiente':  'cleaning',
  'Cancelada':  'occupied'
};

function ensureSwal() {
  if (typeof window.Swal === 'undefined') {
    alert('Falta SweetAlert2. Agrega <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script> antes de reservas.js');
    console.warn('[Reservas] SweetAlert2 no está cargado');
    return false;
  }
  return true;
}

// ------------------------- Estado -------------------------
let RESERVAS = [];
let FILTRO_TEXTO = '';
let FILTRO_ESTADO = '';
let FILTRO_FECHA  = '';

// ------------------------- Bootstrap inicial (HTML -> memoria) -------------------------
function bootstrapFromTable() {
  RESERVAS = [];
  $$('.data-table tbody tr').forEach(tr => {
    const tds = $$('td', tr);
    const id = fmt(tds[0]?.textContent);
    const userCell = tds[1];
    const avatar = $('img', userCell)?.getAttribute('src') || 'img/default-user.png';
    const huesped = fmt(userCell?.textContent);
    const habitacion = fmt(tds[2]?.textContent);
    const entrada = fmt(tds[3]?.textContent);
    const salida  = fmt(tds[4]?.textContent);
    const estado  = fmt(tds[5]?.textContent);
    RESERVAS.push({ id, huesped, avatar, habitacion, entrada, salida, estado });
  });
}

// ------------------------- Render -------------------------
function renderTable(data) {
  const tbody = $('.data-table tbody');
  tbody.innerHTML = '';
  data.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r.id}</td>
      <td class="user-info">
        <img src="${r.avatar || 'img/default-user.png'}" alt="Guest" class="user-avatar-small">
        ${r.huesped}
      </td>
      <td>${r.habitacion}</td>
      <td>${r.entrada}</td>
      <td>${r.salida}</td>
      <td><span class="status-badge ${STATUS_CLASS[r.estado] || 'available'}">${r.estado}</span></td>
      <td>
        <button class="btn-action btn-info" title="Ver detalles"><i class="fas fa-info-circle"></i></button>
        <button class="btn-action edit" title="Editar"><i class="fas fa-edit"></i></button>
        <button class="btn-action delete" title="Eliminar"><i class="fas fa-trash-alt"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ------------------------- Filtros -------------------------
function filtrar() {
  let data = [...RESERVAS];

  const q = FILTRO_TEXTO.toLowerCase();
  if (q) data = data.filter(r => r.id.toLowerCase().includes(q) || r.huesped.toLowerCase().includes(q));

  if (FILTRO_ESTADO) data = data.filter(r => r.estado.toLowerCase() === FILTRO_ESTADO);

  if (FILTRO_FECHA) {
    const target = new Date(FILTRO_FECHA);
    data = data.filter(r => {
      const d = parseESDate(r.entrada);
      return d && d.toDateString() === target.toDateString();
    });
  }

  renderTable(data);
}

// ------------------------- Modales (SweetAlert2) -------------------------
function nuevaReserva() {
  if (!ensureSwal()) return;
  Swal.fire({
    title: 'Nueva Reserva',
    width: 500,
    html: `
      <div style="display:flex;flex-direction:column;gap:12px;text-align:left">
        <label><b>Huésped</b>
          <input id="r-huesped" class="swal2-input" placeholder="Nombre completo" style="width:100%">
        </label>
        <label><b>Habitación</b>
          <input id="r-habitacion" class="swal2-input" placeholder="101 (Doble)" style="width:100%">
        </label>
        <label><b>Estado</b>
          <select id="r-estado" class="swal2-input" style="width:100%;height:45px">
            <option>Confirmada</option>
            <option>Pendiente</option>
            <option>Cancelada</option>
          </select>
        </label>
        <label><b>Fecha entrada</b>
          <input id="r-entrada" type="date" class="swal2-input" style="width:100%">
        </label>
        <label><b>Fecha salida</b>
          <input id="r-salida" type="date" class="swal2-input" style="width:100%">
        </label>
      </div>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'Guardar',
    cancelButtonText: 'Cancelar',
    preConfirm: () => {
      const huesped = fmt($('#r-huesped').value);
      const habitacion = fmt($('#r-habitacion').value);
      const estado = fmt($('#r-estado').value) || 'Pendiente';
      const entradaISO = $('#r-entrada').value;
      const salidaISO  = $('#r-salida').value;

      if (!huesped || !habitacion || !entradaISO || !salidaISO) {
        Swal.showValidationMessage('Completa todos los campos obligatorios.');
        return false;
      }
      return {
        huesped,
        avatar: 'img/default-user.png', // Avatar fijo
        habitacion,
        estado,
        entrada: toESDate(new Date(entradaISO)),
        salida:  toESDate(new Date(salidaISO))
      };
    }
  }).then(res => {
    if (!res.isConfirmed || !res.value) return;
    const id = randomId();
    RESERVAS.unshift({ id, ...res.value });
    filtrar();
    Swal.fire({ icon: 'success', title: 'Reserva creada', timer: 1500, showConfirmButton: false });
  });
}

function verInfo(r) {
  if (!ensureSwal()) return;
  Swal.fire({
    title: 'Detalle de la Reserva',
    html: `
      <div style="display:flex;gap:14px;align-items:center;justify-content:flex-start">
        <img src="${r.avatar || 'img/default-user.png'}" alt="avatar" style="width:56px;height:56px;border-radius:50%;object-fit:cover">
        <div style="text-align:left">
          <div><b>Huésped:</b> ${r.huesped}</div>
          <div><b>ID Reserva:</b> ${r.id}</div>
          <div><b>Habitación:</b> ${r.habitacion}</div>
          <div><b>Entrada:</b> ${r.entrada}</div>
          <div><b>Salida:</b> ${r.salida}</div>
          <div><b>Estado:</b> ${r.estado}</div>
        </div>
      </div>
    `,
    confirmButtonText: 'Cerrar'
  });
}

function editarReserva(r) {
  if (!ensureSwal()) return;
  Swal.fire({
    title: `Editar ${r.id}`,
    width: 500,
    html: `
      <div style="display:flex;flex-direction:column;gap:12px;text-align:left">
        <label><b>Huésped</b>
          <input id="e-huesped" class="swal2-input" style="width:100%" value="${r.huesped}">
        </label>
        <label><b>Habitación</b>
          <input id="e-habitacion" class="swal2-input" style="width:100%" value="${r.habitacion}">
        </label>
        <label><b>Estado</b>
          <select id="e-estado" class="swal2-input" style="width:100%;height:45px">
            <option ${r.estado==='Confirmada'?'selected':''}>Confirmada</option>
            <option ${r.estado==='Pendiente'?'selected':''}>Pendiente</option>
            <option ${r.estado==='Cancelada'?'selected':''}>Cancelada</option>
          </select>
        </label>
        <label><b>Fecha entrada</b>
          <input id="e-entrada" type="date" class="swal2-input" style="width:100%" 
                 value="${(() => { const d = parseESDate(r.entrada); return d ? d.toISOString().slice(0,10) : '' })()}">
        </label>
        <label><b>Fecha salida</b>
          <input id="e-salida" type="date" class="swal2-input" style="width:100%" 
                 value="${(() => { const d = parseESDate(r.salida);  return d ? d.toISOString().slice(0,10) : '' })()}">
        </label>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Guardar cambios',
    cancelButtonText: 'Cancelar',
    preConfirm: () => {
      const huesped = fmt($('#e-huesped').value);
      const habitacion = fmt($('#e-habitacion').value);
      const estado = fmt($('#e-estado').value) || 'Pendiente';
      const entradaISO = $('#e-entrada').value;
      const salidaISO  = $('#e-salida').value;

      if (!huesped || !habitacion || !entradaISO || !salidaISO) {
        Swal.showValidationMessage('Completa todos los campos obligatorios.');
        return false;
      }
      return {
        huesped,
        avatar: 'img/default-user.png',
        habitacion,
        estado,
        entrada: toESDate(new Date(entradaISO)),
        salida:  toESDate(new Date(salidaISO))
      };
    }
  }).then(res => {
    if (!res.isConfirmed || !res.value) return;
    const idx = RESERVAS.findIndex(x => x.id === r.id);
    if (idx >= 0) {
      RESERVAS[idx] = { id: r.id, ...res.value };
      filtrar();
      Swal.fire({ icon: 'success', title: 'Reserva actualizada', timer: 1400, showConfirmButton: false });
    }
  });
}

function eliminarReserva(r) {
  if (!ensureSwal()) return;
  Swal.fire({
    icon: 'warning',
    title: `Eliminar ${r.id}`,
    text: `Esta acción no se puede deshacer. ¿Eliminar la reserva de ${r.huesped}?`,
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  }).then(res => {
    if (!res.isConfirmed) return;
    RESERVAS = RESERVAS.filter(x => x.id !== r.id);
    filtrar();
    Swal.fire({ icon: 'success', title: 'Reserva eliminada', timer: 1200, showConfirmButton: false });
  });
}

// ------------------------- Export CSV -------------------------
function exportCSV() {
  const rows = [['ID Reserva','Huésped','Habitación','Fecha Entrada','Fecha Salida','Estado']];
  const tbody = $('.data-table tbody');
  $$('tr', tbody).forEach(tr => {
    const tds = $$('td', tr);
    rows.push([
      fmt(tds[0]?.textContent),
      fmt(tds[1]?.textContent),
      fmt(tds[2]?.textContent),
      fmt(tds[3]?.textContent),
      fmt(tds[4]?.textContent),
      fmt(tds[5]?.textContent),
    ]);
  });
  const csv = rows.map(r => r.map(v => `"${(v||'').replaceAll('"','""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: `reservas_${new Date().toISOString().slice(0,10)}.csv` });
  document.body.appendChild(a); a.click(); URL.revokeObjectURL(url); a.remove();
}

// ------------------------- Delegación de eventos -------------------------
document.addEventListener('click', (e) => {
  // Nueva reserva (soporta #btnNuevaReserva o .back-button)
  const addBtn = e.target.closest('#btnNuevaReserva, .back-button');
  if (addBtn) {
    e.preventDefault();
    if (addBtn.tagName === 'BUTTON') addBtn.type = 'button';
    nuevaReserva();
    return;
  }

  // Botones de acciones en la tabla
  const infoBtn = e.target.closest('.btn-action.btn-info');
  const editBtn = e.target.closest('.btn-action.edit');
  const delBtn  = e.target.closest('.btn-action.delete');

  if (infoBtn || editBtn || delBtn) {
    const tr = e.target.closest('tr');
    const tds = $$('td', tr);
    const id = fmt(tds[0]?.textContent);
    const r = RESERVAS.find(x => x.id === id);
    if (!r) return;

    if (infoBtn) return verInfo(r);
    if (editBtn) return editarReserva(r);
    if (delBtn)  return eliminarReserva(r);
  }

  // Exportar
  const exportBtn = e.target.closest('.btn-export');
  if (exportBtn) {
    e.preventDefault();
    exportCSV();
  }
});

// Inputs (búsqueda y filtros)
document.addEventListener('input', (e) => {
  if (e.target.matches('.search-input')) {
    FILTRO_TEXTO = e.target.value;
    filtrar();
  }
});
document.addEventListener('change', (e) => {
  if (e.target.matches('.filter-select')) {
    FILTRO_ESTADO = (e.target.value || '').toLowerCase();
    filtrar();
  }
  if (e.target.matches('.date-filter')) {
    FILTRO_FECHA = e.target.value;
    filtrar();
  }
});

// ------------------------- Inicio -------------------------
document.addEventListener('DOMContentLoaded', () => {
  bootstrapFromTable();
  filtrar();
});
