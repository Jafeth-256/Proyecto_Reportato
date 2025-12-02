import React, { useState, useEffect, useMemo } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import '../styles/custom.css';
import useReports from '../hooks/useReports';
import API_BASE_URL from '../config/api';

const CuentasPorCobrar = () => {
  const { generateCuentasPorCobrarReport, isGenerating } = useReports();
  const [clientes, setClientes] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [abonos, setAbonos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAbonoModal, setShowAbonoModal] = useState(false);
  const [showHistorialModal, setShowHistorialModal] = useState(false);
  const [editingFactura, setEditingFactura] = useState(null);
  const [facturaParaAbono, setFacturaParaAbono] = useState(null);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [formErrors, setFormErrors] = useState({});
  const [abonoFormErrors, setAbonoFormErrors] = useState({});

  const [formData, setFormData] = useState({
    cliente_id: '',
    numero_factura: '',
    monto: '',
    fecha_emision: '',
    estado: 'pendiente',
    descripcion: '',
  });

  const [abonoFormData, setAbonoFormData] = useState({
    monto: '',
    fecha_abono: new Date().toISOString().split('T')[0],
    metodo_pago: 'efectivo',
    referencia: '',
  });

  // Obtener usuario logueado
  const usuarioLogueado = JSON.parse(localStorage.getItem("usuario") || '{}');

  useEffect(() => {
    fetchClientes();
    fetchFacturas();
  }, []);

  const fetchClientes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/clientes`);
      if (response.ok) {
        const data = await response.json();
        setClientes(data);
      } else {
        console.error('Error al obtener clientes');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchFacturas = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/facturas-clientes`);
      if (response.ok) {
        const data = await response.json();
        setFacturas(data);
      } else {
        console.error('Error al obtener facturas');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAbonos = async (facturaId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/abonos-clientes?factura_id=${facturaId}`);
      if (response.ok) {
        const data = await response.json();
        setAbonos(data);
      }
    } catch (error) {
      console.error('Error al obtener abonos:', error);
    }
  };
  
  // Filtrado simple por búsqueda
  const filteredFacturas = facturas.filter(factura => {
    return factura.nombre_cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      factura.numero_factura.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentFacturas = filteredFacturas.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredFacturas.length / itemsPerPage);

  // Validar formulario
  const validateForm = () => {
    const errors = {};
    if (!formData.cliente_id) errors.cliente_id = 'Cliente es requerido';
    if (!formData.numero_factura) errors.numero_factura = 'Número de factura es requerido';
    if (!formData.monto || parseFloat(formData.monto) <= 0) errors.monto = 'Monto debe ser mayor a 0';
    if (!formData.fecha_emision) errors.fecha_emision = 'Fecha de emisión es requerida';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateAbonoForm = () => {
    const errors = {};
    if (!abonoFormData.monto || parseFloat(abonoFormData.monto) <= 0) {
      errors.monto = 'Monto debe ser mayor a 0';
    }
    if (parseFloat(abonoFormData.monto) > parseFloat(facturaParaAbono?.saldo || 0)) {
      errors.monto = 'El abono no puede exceder el saldo adeudado';
    }
    if (!abonoFormData.fecha_abono) errors.fecha_abono = 'Fecha del abono es requerida';
    setAbonoFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleAbonoInputChange = (e) => {
    const { name, value } = e.target;
    setAbonoFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      alert('Por favor corrige los errores en el formulario');
      return;
    }

    try {
      const url = editingFactura
        ? `${API_BASE_URL}/facturas-clientes/${editingFactura.id}`
        : `${API_BASE_URL}/facturas-clientes`;

      const method = editingFactura ? 'PUT' : 'POST';

      const nuevoMonto = Number(formData.monto);

      // Si es edición, recalcular el saldo basado en el nuevo monto y abonos existentes
      let nuevoSaldo = nuevoMonto;
      if (editingFactura) {
        // Obtener los abonos existentes para esta factura
        try {
          const response_abonos = await fetch(`${API_BASE_URL}/abonos-clientes?factura_id=${editingFactura.id}`);
          if (response_abonos.ok) {
            const abonos_data = await response_abonos.json();
            const totalAbonos = abonos_data && Array.isArray(abonos_data)
              ? abonos_data.reduce((sum, abono) => sum + parseFloat(abono.monto || 0), 0)
              : 0;
            nuevoSaldo = nuevoMonto - totalAbonos;
          }
        } catch (err) {
          // Si hay error obteniendo abonos, solo usa el nuevo monto
          console.warn('Error obteniendo abonos:', err);
          nuevoSaldo = nuevoMonto;
        }
      }

      const body = {
        ...formData,
        monto: nuevoMonto,
        saldo: Math.max(0, nuevoSaldo), // No permitir saldo negativo
        usuario_registro: usuarioLogueado.nombre || 'Sistema',
        usuario_id: usuarioLogueado.id || null
      };

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        alert(editingFactura ? 'Factura actualizada exitosamente' : 'Factura registrada exitosamente');
        await fetchFacturas();
        resetForm();
      } else {
        const error = await response.json();
        alert(`Error: ${error.message || 'Error al guardar la factura'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar la factura. Por favor intenta nuevamente.');
    }
  };

  const handleAbonoSubmit = async (e) => {
    e.preventDefault();

    if (!validateAbonoForm()) {
      alert('Por favor corrige los errores en el formulario');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/abonos-clientes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          factura_id: facturaParaAbono.id,
          monto: Number(abonoFormData.monto),
          fecha_abono: abonoFormData.fecha_abono,
          metodo_pago: abonoFormData.metodo_pago,
          referencia: abonoFormData.referencia,
          usuario_registro: usuarioLogueado.nombre || 'Sistema',
          usuario_id: usuarioLogueado.id || null,
        }),
      });

      if (response.ok) {
        alert('Abono registrado exitosamente');
        await fetchFacturas();
        await fetchAbonos(facturaParaAbono.id);
        resetAbonoForm();
      } else {
        const error = await response.json();
        alert(`Error: ${error.message || 'Error al registrar abono'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al registrar abono. Por favor intenta nuevamente.');
    }
  };

  const resetForm = () => {
    setFormData({
      cliente_id: '',
      numero_factura: '',
      monto: '',
      fecha_emision: '',
      estado: 'pendiente',
      descripcion: '',
    });
    setEditingFactura(null);
    setShowModal(false);
    setFormErrors({});
  };

  const resetAbonoForm = () => {
    setAbonoFormData({
      monto: '',
      fecha_abono: new Date().toISOString().split('T')[0],
      metodo_pago: 'efectivo',
      referencia: '',
    });
    setFacturaParaAbono(null);
    setShowAbonoModal(false);
    setAbonoFormErrors({});
  };

  const handleEdit = (factura) => {
    setEditingFactura(factura);
    setFormData({
      cliente_id: factura.cliente_id,
      numero_factura: factura.numero_factura,
      monto: factura.monto,
      fecha_emision: new Date(factura.fecha_emision).toISOString().split('T')[0],
      estado: factura.estado || 'pendiente',
      descripcion: factura.descripcion || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta factura?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/facturas-clientes/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          await fetchFacturas();
        } else {
          console.error('Error al eliminar la factura');
        }
      } catch (error) {
        console.error('Error:', error);
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const formatCurrency = (value) => {
    const num = parseFloat(value) || 0;
    return `₡ ${num.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Calcular deuda total por cliente (solo saldos pendientes > 0)
  const totalDeudaPorCliente = useMemo(() => {
    return facturas.reduce((acc, factura) => {
      const saldo = parseFloat(factura.saldo) || 0;
      if (saldo > 0) { // Solo contar saldos pendientes
        const cliente = factura.nombre_cliente;
        acc[cliente] = (acc[cliente] || 0) + saldo;
      }
      return acc;
    }, {});
  }, [facturas]);

  // Calcular deuda total general
  const deudaTotalGeneral = useMemo(() => {
    return Object.values(totalDeudaPorCliente).reduce((sum, val) => sum + val, 0);
  }, [totalDeudaPorCliente]);

  // Calcular indicadores clave
  const indicadores = useMemo(() => {
    const total = facturas.length;
    const pagadas = facturas.filter(f => f.saldo === 0).length;
    const conDeuda = facturas.filter(f => f.saldo > 0).length;

    return { total, pagadas, conDeuda };
  }, [facturas]);

  if (loading) {
    return (
      <div className="app-layout bg-light">
        <Sidebar />
        <div className="main-content">
          <Header />
          <div className="content-area d-flex justify-content-center align-items-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout bg-light">
      <Sidebar />
      
      <div className="main-content">
        <Header />
        
        <div className="content-area">
          <div className="container-fluid p-4">
            <div className="row mb-4">
              <div className="col-12">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                  <div>
                    <h3 className="fw-bold text-dark mb-1">
                      <i className="fas fa-file-invoice-dollar text-primary-purple me-2"></i>
                      Cuentas por Cobrar
                    </h3>
                    <p className="text-muted mb-0">
                      Gestiona las facturas y deudas con tus clientes
                    </p>
                  </div>
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-outline-primary-green"
                      onClick={() => generateCuentasPorCobrarReport(filteredFacturas)}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                          Generando...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-download me-1"></i>
                          Exportar
                        </>
                      )}
                    </button>
                    <button 
                      className="btn btn-primary-purple"
                      onClick={() => setShowModal(true)}
                    >
                      <i className="fas fa-plus me-1"></i>
                      Registrar Factura
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-lg-8">
                <div className="card border-0 shadow-sm mb-4">
                  <div className="card-header bg-white border-0 py-3">
                    <div className="row align-items-center">
                      <div className="col-md-6">
                        <h5 className="card-title mb-0 fw-bold">Facturas Registradas</h5>
                      </div>
                      <div className="col-md-6">
                        <div className="input-group">
                          <span className="input-group-text bg-light border-end-0">
                            <i className="fas fa-search text-muted"></i>
                          </span>
                          <input
                            type="text"
                            className="form-control border-start-0"
                            placeholder="Buscar por cliente o factura..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="card-body p-0">
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0">
                        <thead className="bg-light">
                          <tr>
                            <th className="border-0 px-4 py-3">Cliente</th>
                            <th className="border-0 px-4 py-3">Factura #</th>
                            <th className="border-0 px-4 py-3">Monto</th>
                            <th className="border-0 px-4 py-3">Saldo</th>
                            {/* <th className="border-0 px-4 py-3">Historial</th> */}
                            <th className="border-0 px-4 py-3">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentFacturas.map((factura) => (
                            <tr key={factura.id}>
                              <td className="px-4 py-3">{factura.nombre_cliente}</td>
                              <td className="px-4 py-3">{factura.numero_factura}</td>
                              <td className="px-4 py-3">{formatCurrency(factura.monto)}</td>
                              <td className="px-4 py-3">{formatCurrency(factura.saldo)}</td>
                              {/* <td className="px-4 py-3">
                                <button
                                  className="btn btn-sm btn-outline-info"
                                  onClick={() => {
                                    setFacturaSeleccionada(factura);
                                    fetchAbonos(factura.id);
                                    setShowHistorialModal(true);
                                  }}
                                  title="Ver historial de abonos"
                                >
                                  <i className="fas fa-history"></i>
                                </button>
                              </td> */}
                              <td className="px-4 py-3">
                                <div className="d-flex gap-2">
                                  {factura.saldo > 0 && (
                                    <button
                                      className="btn btn-sm btn-outline-success"
                                      onClick={() => {
                                        setFacturaParaAbono(factura);
                                        setShowAbonoModal(true);
                                      }}
                                      title="Registrar abono"
                                    >
                                      <i className="fas fa-hand-holding-dollar"></i>
                                    </button>
                                  )}
                                  <button
                                    className="btn btn-sm btn-outline-warning"
                                    onClick={() => handleEdit(factura)}
                                    title="Editar"
                                  >
                                    <i className="fas fa-edit"></i>
                                  </button>
                                  <button
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => handleDelete(factura.id)}
                                    title="Eliminar"
                                  >
                                    <i className="fas fa-trash"></i>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {totalPages > 1 && (
                      <div className="d-flex justify-content-between align-items-center p-4">
                        <div className="text-muted small">
                          Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, filteredFacturas.length)} de {filteredFacturas.length} facturas
                        </div>
                        <nav>
                          <ul className="pagination pagination-sm mb-0">
                            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                              <button className="page-link" onClick={() => setCurrentPage(currentPage - 1)}>Anterior</button>
                            </li>
                            {[...Array(totalPages)].map((_, index) => (
                              <li key={index} className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}>
                                <button className="page-link" onClick={() => setCurrentPage(index + 1)}>{index + 1}</button>
                              </li>
                            ))}
                            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                              <button className="page-link" onClick={() => setCurrentPage(currentPage + 1)}>Siguiente</button>
                            </li>
                          </ul>
                        </nav>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="col-lg-4">
                <div className="card border-0 shadow-sm mb-4">
                  <div className="card-header bg-white border-0 py-3">
                    <h5 className="card-title mb-0 fw-bold">Deuda Total por Cliente</h5>
                  </div>
                  <div className="card-body">
                    {Object.entries(totalDeudaPorCliente).length > 0 ? (
                      Object.entries(totalDeudaPorCliente).map(([cliente, total]) => (
                        <div key={cliente} className="d-flex justify-content-between align-items-center mb-2 small">
                          <span className="text-dark">{cliente}</span>
                          <span className="fw-bold text-danger">{formatCurrency(total)}</span>
                        </div>
                      ))
                    ) : (
                      <div className="small text-muted text-center py-3">
                        No hay deudas pendientes
                      </div>
                    )}
                  </div>
                </div>
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-white border-0 py-3">
                    <h5 className="card-title mb-0 fw-bold">
                      <i className="fas fa-chart-bar me-2 text-primary-purple"></i>
                      Indicadores de Cartera
                    </h5>
                  </div>
                  <div className="card-body">
                    <div className="small text-muted mb-2">Deuda Total: <span className="text-danger fw-bold">{formatCurrency(deudaTotalGeneral)}</span></div>
                    <hr className="my-2"/>
                    <div className="small mb-2">
                      <span className="text-muted">Total:</span> <strong>{indicadores.total}</strong>
                      <span className="text-muted ms-3">Pagadas:</span> <strong>{indicadores.pagadas}</strong>
                      <span className="text-muted ms-3">Con Deuda:</span> <strong className="text-danger">{indicadores.conDeuda}</strong>
                    </div>
                    <hr className="my-2"/>
                    <button
                      className="btn btn-primary-purple w-100 btn-sm"
                      onClick={() => generateCuentasPorCobrarReport(filteredFacturas)}
                      disabled={isGenerating}
                    >
                      <i className={`fas ${isGenerating ? 'fa-spinner fa-spin' : 'fa-file-pdf'} me-1`}></i>
                      {isGenerating ? 'Generando...' : 'Descargar Reporte Completo'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold">
                  <i className={`fas ${editingFactura ? 'fa-edit' : 'fa-file-invoice'} me-2`}></i>
                  {editingFactura ? 'Editar Factura' : 'Registrar Nueva Factura'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={resetForm}
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold">Cliente *</label>
                      <select
                        className={`form-select ${formErrors.cliente_id ? 'is-invalid' : ''}`}
                        name="cliente_id"
                        value={formData.cliente_id}
                        onChange={handleInputChange}
                      >
                        <option value="">Seleccionar cliente</option>
                        {clientes.map(cliente => (
                          <option key={cliente.id} value={cliente.id}>
                            {cliente.nombre}
                          </option>
                        ))}
                      </select>
                      {formErrors.cliente_id && <div className="invalid-feedback d-block">{formErrors.cliente_id}</div>}
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold">Número de Factura *</label>
                      <input
                        type="text"
                        className={`form-control ${formErrors.numero_factura ? 'is-invalid' : ''}`}
                        name="numero_factura"
                        value={formData.numero_factura}
                        onChange={handleInputChange}
                        placeholder="Ej: FAC-001"
                      />
                      {formErrors.numero_factura && <div className="invalid-feedback d-block">{formErrors.numero_factura}</div>}
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold">Monto Total *</label>
                      <div className="input-group">
                        <span className="input-group-text">₡</span>
                        <input
                          type="number"
                          className={`form-control ${formErrors.monto ? 'is-invalid' : ''}`}
                          name="monto"
                          value={formData.monto}
                          onChange={handleInputChange}
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                        />
                      </div>
                      {formErrors.monto && <div className="invalid-feedback d-block">{formErrors.monto}</div>}
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold">Estado *</label>
                      <select
                        className="form-select"
                        name="estado"
                        value={formData.estado}
                        onChange={handleInputChange}
                      >
                        <option value="pendiente">Pendiente</option>
                        <option value="confirmada">Confirmada</option>
                        <option value="pagada">Pagada</option>
                      </select>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Fecha de Emisión *</label>
                    <input
                      type="date"
                      className={`form-control ${formErrors.fecha_emision ? 'is-invalid' : ''}`}
                      name="fecha_emision"
                      value={formData.fecha_emision}
                      onChange={handleInputChange}
                    />
                    {formErrors.fecha_emision && <div className="invalid-feedback d-block">{formErrors.fecha_emision}</div>}
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Descripción</label>
                    <textarea
                      className="form-control"
                      name="descripcion"
                      value={formData.descripcion}
                      onChange={handleInputChange}
                      rows="2"
                      placeholder="Detalle de la factura (opcional)"
                    ></textarea>
                  </div>
                  {!editingFactura && (
                    <div className="small text-muted border-top pt-3">
                      <strong>Registrado por:</strong> {usuarioLogueado.nombre || 'Sistema'}
                    </div>
                  )}
                </div>
                <div className="modal-footer border-top">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={resetForm}
                  >
                    <i className="fas fa-times me-1"></i>
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary-purple"
                  >
                    <i className={`fas ${editingFactura ? 'fa-save' : 'fa-plus'} me-1`}></i>
                    {editingFactura ? 'Actualizar' : 'Guardar'} Factura
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showAbonoModal && facturaParaAbono && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold">
                  <i className="fas fa-hand-holding-dollar me-2"></i>
                  Registrar Abono
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={resetAbonoForm}
                ></button>
              </div>
              <form onSubmit={handleAbonoSubmit}>
                <div className="modal-body">
                  <div className="row g-2 mb-3 small">
                    <div className="col-12">
                      <strong>Factura:</strong> {facturaParaAbono.numero_factura} | <strong>Cliente:</strong> {facturaParaAbono.nombre_cliente} | <strong>Saldo:</strong> <span className="text-danger fw-bold">₡ {Number(facturaParaAbono.saldo).toLocaleString('es-CR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Monto a Abonar *</label>
                    <div className="input-group">
                      <span className="input-group-text">₡</span>
                      <input
                        type="number"
                        className={`form-control ${abonoFormErrors.monto ? 'is-invalid' : ''}`}
                        name="monto"
                        value={abonoFormData.monto}
                        onChange={handleAbonoInputChange}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        max={facturaParaAbono.saldo}
                      />
                    </div>
                    {abonoFormErrors.monto && <div className="invalid-feedback d-block">{abonoFormErrors.monto}</div>}
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Fecha del Abono *</label>
                    <input
                      type="date"
                      className={`form-control ${abonoFormErrors.fecha_abono ? 'is-invalid' : ''}`}
                      name="fecha_abono"
                      value={abonoFormData.fecha_abono}
                      onChange={handleAbonoInputChange}
                    />
                    {abonoFormErrors.fecha_abono && <div className="invalid-feedback d-block">{abonoFormErrors.fecha_abono}</div>}
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Método de Pago *</label>
                    <select
                      className="form-select"
                      name="metodo_pago"
                      value={abonoFormData.metodo_pago}
                      onChange={handleAbonoInputChange}
                    >
                      <option value="efectivo">Efectivo</option>
                      <option value="cheque">Cheque</option>
                      <option value="tarjeta">Tarjeta de Crédito</option>
                      <option value="transferencia">Transferencia Bancaria</option>
                      <option value="sinpe">SINPE</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Referencia (Opcional)</label>
                    <input
                      type="text"
                      className="form-control"
                      name="referencia"
                      value={abonoFormData.referencia}
                      onChange={handleAbonoInputChange}
                      placeholder="Ej: Cheque #123456, Ref. transferencia"
                    />
                  </div>
                  <div className="small text-muted">
                    <strong>Registrado por:</strong> {usuarioLogueado.nombre || 'Sistema'}
                  </div>
                </div>
                <div className="modal-footer border-top">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={resetAbonoForm}
                  >
                    <i className="fas fa-times me-1"></i>
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                  >
                    <i className="fas fa-check me-1"></i>
                    Guardar Abono
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* {showHistorialModal && facturaSeleccionada && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold">
                  <i className="fas fa-history me-2"></i>
                  Historial de Abonos
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowHistorialModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="small text-muted border-bottom pb-2 mb-3">
                  <strong>Factura:</strong> {facturaSeleccionada.numero_factura} | <strong>Cliente:</strong> {facturaSeleccionada.nombre_cliente} | <strong>Monto:</strong> ₡ {Number(facturaSeleccionada.monto).toLocaleString('es-CR', { minimumFractionDigits: 2 })} | <strong>Saldo:</strong> <span className={facturaSeleccionada.saldo > 0 ? 'text-danger fw-bold' : 'text-success fw-bold'}>₡ {Number(facturaSeleccionada.saldo).toLocaleString('es-CR', { minimumFractionDigits: 2 })}</span>
                </div>

                {abonos && abonos.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-sm table-borderless small mb-2">
                      <thead className="border-bottom">
                        <tr>
                          <th className="py-1">Fecha</th>
                          <th className="py-1">Monto</th>
                          <th className="py-1">Método</th>
                          <th className="py-1">Referencia</th>
                          <th className="py-1">Registrado por</th>
                        </tr>
                      </thead>
                      <tbody className="border-bottom">
                        {abonos.map((abono, idx) => (
                          <tr key={idx}>
                            <td className="py-1">{formatDate(abono.fecha_abono)}</td>
                            <td className="py-1"><strong>₡ {Number(abono.monto).toLocaleString('es-CR', { minimumFractionDigits: 2 })}</strong></td>
                            <td className="py-1">{abono.metodo_pago || '-'}</td>
                            <td className="py-1">{abono.referencia || '-'}</td>
                            <td className="py-1">{abono.usuario_registro || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="small text-muted pt-2">
                      <strong>Total Abonado:</strong> ₡ {Number(abonos.reduce((sum, a) => sum + parseFloat(a.monto), 0)).toLocaleString('es-CR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                ) : (
                  <div className="small text-muted">
                    No hay abonos registrados para esta factura
                  </div>
                )}
              </div>
              <div className="modal-footer border-top">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowHistorialModal(false)}
                >
                  <i className="fas fa-times me-1"></i>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )} */}
    </div>
  );
};

export default CuentasPorCobrar;
