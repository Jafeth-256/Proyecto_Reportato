import React, { useState, useEffect, useMemo } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import '../styles/custom.css';
import useReports from '../hooks/useReports';
import API_BASE_URL from '../config/api';

const CuentasPorPagar = () => {
  const { generateCuentasPorPagarReport, isGenerating } = useReports();
  const [proveedores, setProveedores] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAbonoModal, setShowAbonoModal] = useState(false);
  const [editingFactura, setEditingFactura] = useState(null);
  const [facturaParaAbono, setFacturaParaAbono] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  const [reportData, setReportData] = useState(null);
  const [reportProveedor, setReportProveedor] = useState('');
  const [reportWeek, setReportWeek] = useState('');

  const [formData, setFormData] = useState({
    proveedor_id: '',
    numero_factura: '',
    monto: '',
    fecha_emision: '',
  });

  const [abonoFormData, setAbonoFormData] = useState({
    monto: '',
    fecha_abono: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchProveedores();
    fetchFacturas();
  }, []);

  const fetchProveedores = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/proveedores`);
      if (response.ok) {
        const data = await response.json();
        setProveedores(data);
      } else {
        console.error('Error al obtener proveedores');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchFacturas = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/facturas-proveedores`);
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
  
  const filteredFacturas = facturas.filter(factura =>
    factura.nombre_proveedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    factura.numero_factura.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentFacturas = filteredFacturas.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredFacturas.length / itemsPerPage);

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
    
    try {
      const url = editingFactura 
      ? `${API_BASE_URL}/facturas-proveedores/${editingFactura.id}`
      : `${API_BASE_URL}/facturas-proveedores`;
      
      const method = editingFactura ? 'PUT' : 'POST';
      
      const body = {
        ...formData,
        monto: Number(formData.monto)
      };

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        await fetchFacturas();
        resetForm();
      } else {
        console.error('Error al guardar la factura');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleAbonoSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${API_BASE_URL}/abonos-proveedores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          factura_id: facturaParaAbono.id,
          monto: Number(abonoFormData.monto),
          fecha_abono: abonoFormData.fecha_abono,
        }),
      });

      if (response.ok) {
        await fetchFacturas();
        resetAbonoForm();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      proveedor_id: '',
      numero_factura: '',
      monto: '',
      fecha_emision: '',
    });
    setEditingFactura(null);
    setShowModal(false);
  };
  
  const resetAbonoForm = () => {
    setAbonoFormData({
      monto: '',
      fecha_abono: new Date().toISOString().split('T')[0],
    });
    setFacturaParaAbono(null);
    setShowAbonoModal(false);
  };

  const handleEdit = (factura) => {
    setEditingFactura(factura);
    setFormData({
      proveedor_id: factura.proveedor_id,
      numero_factura: factura.numero_factura,
      monto: factura.monto,
      fecha_emision: new Date(factura.fecha_emision).toISOString().split('T')[0],
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de que desea eliminar esta factura?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/facturas-proveedores/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          await fetchFacturas();
        } else {
          console.error('Error al eliminar factura');
        }
      } catch (error) {
        console.error('Error:', error);
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-CR');
  };
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  const totalDeudaPorProveedor = useMemo(() => {
    return facturas.reduce((acc, factura) => {
      const { nombre_proveedor, saldo } = factura;
      if (!acc[nombre_proveedor]) {
        acc[nombre_proveedor] = 0;
      }
      acc[nombre_proveedor] += parseFloat(saldo) || 0;
      return acc;
    }, {});
  }, [facturas]);
  
  const handleGenerateReport = async () => {
    if (!reportProveedor || !reportWeek) {
      alert('Por favor seleccione un proveedor y una semana.');
      return;
    }

    const [year, week] = reportWeek.split('-W');
    const a = new Date(year, 0, (1 + (week - 1) * 7));
    const b = new Date(year, 0, (1 + (week - 1) * 7));
    const day = a.getDay();
    const diff = a.getDate() - day + (day == 0 ? -6 : 2);
    const firstDay = new Date(a.setDate(diff));
    const lastDay = new Date(b.setDate(diff + 6));

    const fecha_inicio = firstDay.toISOString().split('T')[0];
    const fecha_fin = lastDay.toISOString().split('T')[0];

    try {
      const response = await fetch(`${API_BASE_URL}/reportes/deuda-proveedor-semanal?proveedor_id=${reportProveedor}&fecha_inicio=${fecha_inicio}&fecha_fin=${fecha_fin}`);
      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      } else {
        console.error('Error al generar reporte');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

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
                      Cuentas por Pagar
                    </h3>
                    <p className="text-muted mb-0">
                      Gestión de facturas y deudas con proveedores
                    </p>
                  </div>
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-outline-primary-green"
                      onClick={() => generateCuentasPorPagarReport(filteredFacturas)}
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
                            placeholder="Buscar por proveedor o factura..."
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
                            <th className="border-0 px-4 py-3">Proveedor</th>
                            <th className="border-0 px-4 py-3">Factura #</th>
                            <th className="border-0 px-4 py-3">Monto</th>
                            <th className="border-0 px-4 py-3">Saldo</th>
                            <th className="border-0 px-4 py-3">Fecha Emisión</th>
                            <th className="border-0 px-4 py-3">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentFacturas.map((factura) => (
                            <tr key={factura.id}>
                              <td className="px-4 py-3">{factura.nombre_proveedor}</td>
                              <td className="px-4 py-3">{factura.numero_factura}</td>
                              <td className="px-4 py-3">{formatCurrency(factura.monto)}</td>
                              <td className="px-4 py-3">{formatCurrency(factura.saldo)}</td>
                              <td className="px-4 py-3">{formatDate(factura.fecha_emision)}</td>
                              <td className="px-4 py-3">
                                <div className="d-flex gap-2">
                                  <button
                                    className="btn btn-sm btn-outline-success"
                                    onClick={() => {
                                      setFacturaParaAbono(factura);
                                      setShowAbonoModal(true);
                                    }}
                                    title="Registrar pago"
                                  >
                                    <i className="fas fa-hand-holding-dollar"></i>
                                  </button>
                                  <button
                                    className="btn btn-sm btn-outline-primary"
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
                    <h5 className="card-title mb-0 fw-bold">Deuda Total por Proveedor</h5>
                  </div>
                  <div className="card-body">
                    {Object.entries(totalDeudaPorProveedor).map(([proveedor, total]) => (
                      <div key={proveedor} className="d-flex justify-content-between align-items-center mb-2">
                        <span>{proveedor}</span>
                        <span className="fw-bold">{formatCurrency(total)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-white border-0 py-3">
                    <h5 className="card-title mb-0 fw-bold">Reporte Semanal</h5>
                  </div>
                  <div className="card-body">
                    <div className="mb-3">
                      <label className="form-label">Proveedor</label>
                      <select className="form-select" value={reportProveedor} onChange={(e) => setReportProveedor(e.target.value)}>
                        <option value="">Seleccionar proveedor</option>
                        {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Semana</label>
                      <input type="week" className="form-control" value={reportWeek} onChange={(e) => setReportWeek(e.target.value)} />
                    </div>
                    <button className="btn btn-primary-purple w-100" onClick={handleGenerateReport}>
                      Generar Reporte
                    </button>
                    {reportData && (
                      <div className="mt-4">
                        <h6>Reporte para {reportData.facturas[0]?.nombre_proveedor}</h6>
                        <ul className="list-group">
                          {reportData.facturas.map(factura => (
                            <li key={factura.numero_factura} className="list-group-item d-flex justify-content-between align-items-center">
                              {factura.numero_factura}
                              <span className="badge bg-primary rounded-pill">{formatCurrency(factura.monto)}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="d-flex justify-content-between align-items-center mt-3 fw-bold">
                          <span>Total Semanal</span>
                          <span>{formatCurrency(reportData.total || 0)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingFactura ? 'Editar Factura' : 'Registrar Factura'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={resetForm}
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Proveedor *</label>
                    <select
                      className="form-select"
                      name="proveedor_id"
                      value={formData.proveedor_id}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Seleccionar proveedor</option>
                      {proveedores.map(proveedor => (
                        <option key={proveedor.id} value={proveedor.id}>
                          {proveedor.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Número de Factura *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="numero_factura"
                      value={formData.numero_factura}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Monto (₡) *</label>
                    <input
                      type="number"
                      className="form-control"
                      name="monto"
                      value={formData.monto}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Fecha de Emisión *</label>
                    <input
                      type="date"
                      className="form-control"
                      name="fecha_emision"
                      value={formData.fecha_emision}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={resetForm}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary-purple"
                  >
                    {editingFactura ? 'Actualizar' : 'Guardar'} Factura
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showAbonoModal && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Registrar Pago</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={resetAbonoForm}
                ></button>
              </div>
              <form onSubmit={handleAbonoSubmit}>
                <div className="modal-body">
                  <div className="alert alert-info">
                    <strong>Factura:</strong> {facturaParaAbono?.numero_factura}<br/>
                    <strong>Proveedor:</strong> {facturaParaAbono?.nombre_proveedor}<br/>
                    <strong>Saldo Pendiente:</strong> {facturaParaAbono && formatCurrency(facturaParaAbono.saldo)}
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Monto a Pagar (₡) *</label>
                    <input
                      type="number"
                      className="form-control"
                      name="monto"
                      value={abonoFormData.monto}
                      onChange={handleAbonoInputChange}
                      min="0"
                      step="0.01"
                      max={facturaParaAbono?.saldo}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Fecha de Pago *</label>
                    <input
                      type="date"
                      className="form-control"
                      name="fecha_abono"
                      value={abonoFormData.fecha_abono}
                      onChange={handleAbonoInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={resetAbonoForm}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary-purple"
                  >
                    Guardar Pago
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CuentasPorPagar;