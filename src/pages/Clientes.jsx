import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import '../styles/custom.css';
import useReports from '../hooks/useReports';
import API_BASE_URL from '../config/api';

const Clientes = () => {
  const { generateClientReport, isGenerating } = useReports();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [includeInactive, setIncludeInactive] = useState(false);

  const [formData, setFormData] = useState({
    nombre: '',
    empresa: '',
    telefono: '',
    email: '',
    direccion: '',
    ciudad: '',
    estado: 'Activo',
  });

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/clientes`);
      if (response.ok) {
        const data = await response.json();
        setClientes(data);
      } else {
        console.error('Error al obtener clientes');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredClientes = clientes.filter(cliente =>
    cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cliente.empresa && cliente.empresa.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (cliente.ciudad && cliente.ciudad.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleGenerateReport = () => {
    setShowReportModal(true);
  };

  const handleConfirmReport = async () => {
    const clientesToReport = includeInactive 
      ? filteredClientes 
      : filteredClientes.filter(c => c.estado === 'Activo');
    
    await generateClientReport(clientesToReport, {}, includeInactive);
    setShowReportModal(false);
    setIncludeInactive(false);
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentClientes = filteredClientes.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredClientes.length / itemsPerPage);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = editingCliente 
      ? `${API_BASE_URL}/clientes/${editingCliente.id}`
      : `${API_BASE_URL}/clientes`;
      
      const method = editingCliente ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchClientes();
        resetForm();
      } else {
        console.error('Error al guardar cliente');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      empresa: '',
      telefono: '',
      email: '',
      direccion: '',
      ciudad: '',
      estado: 'Activo',
    });
    setEditingCliente(null);
    setShowModal(false);
  };

  const handleEdit = (cliente) => {
    setEditingCliente(cliente);
    setFormData({
      nombre: cliente.nombre,
      empresa: cliente.empresa || '',
      telefono: cliente.telefono || '',
      email: cliente.email || '',
      direccion: cliente.direccion || '',
      ciudad: cliente.ciudad || '',
      estado: cliente.estado,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este cliente?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/clientes/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          await fetchClientes();
        } else {
          console.error('Error al eliminar cliente');
        }
      } catch (error) {
        console.error('Error:', error);
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

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
              <div className="col-12 d-flex justify-content-between align-items-center">
                <div>
                  <h3 className="fw-bold text-dark mb-1">
                    <i className="fas fa-users text-primary-purple me-2"></i>
                    Gestión de Clientes
                  </h3>
                  <p className="text-muted mb-0">
                    Administra la información de tus clientes
                  </p>
                </div>
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-outline-primary-green"
                    onClick={handleGenerateReport}
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
                    Nuevo Cliente
                  </button>
                </div>
              </div>
            </div>

            <div className="row mb-4">
              <div className="col-md-6">
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="fas fa-search"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Buscar cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="row mb-4">
              <div className="col-md-4">
                <div className="card border-0 shadow-sm">
                  <div className="card-body d-flex align-items-center">
                    <i className="fas fa-users fa-2x text-primary-purple me-3"></i>
                    <div>
                      <h5 className="fw-bold mb-0">{clientes.length}</h5>
                      <small className="text-muted">Total Clientes</small>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card border-0 shadow-sm">
                  <div className="card-body d-flex align-items-center">
                    <i className="fas fa-check-circle fa-2x text-primary-green me-3"></i>
                    <div>
                      <h5 className="fw-bold mb-0">
                        {clientes.filter(cliente => cliente.estado === 'Activo').length}
                      </h5>
                      <small className="text-muted">Activos</small>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card border-0 shadow-sm">
                  <div className="card-body d-flex align-items-center">
                    <i className="fas fa-times-circle fa-2x text-primary-orange me-3"></i>
                    <div>
                      <h5 className="fw-bold mb-0">
                        {clientes.filter(cliente => cliente.estado === 'Inactivo').length}
                      </h5>
                      <small className="text-muted">Inactivos</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card shadow-sm border-0">
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th>Cliente</th>
                        <th>Contacto</th>
                        <th>Ubicación</th>
                        <th>Registro</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentClientes.length > 0 ? (
                        currentClientes.map((cliente) => (
                          <tr key={cliente.id}>
                            <td>
                              <div>
                                <div className="fw-medium text-dark">{cliente.nombre}</div>
                                <small className="text-muted">{cliente.empresa}</small>
                              </div>
                            </td>
                            <td>
                              <div>
                                <div className="small">{cliente.telefono}</div>
                                <div className="small text-muted">{cliente.email}</div>
                              </div>
                            </td>
                            <td>
                              <span className="text-muted">{cliente.ciudad}</span>
                            </td>
                            <td>
                              <span className="small text-muted">
                                {formatDate(cliente.fecha_registro)}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${
                                cliente.estado === 'Activo' 
                                  ? 'bg-success bg-opacity-20 text-success' 
                                  : 'bg-danger bg-opacity-20 text-danger'
                              }`}>
                                {cliente.estado}
                              </span>
                            </td>
                            <td>
                              <div className="d-flex gap-2">
                                <button
                                  className="btn btn-sm btn-outline-secondary"
                                  onClick={() => handleEdit(cliente)}
                                  title="Editar"
                                >
                                  <i className="fa-solid fa-pen"></i>
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => handleDelete(cliente.id)}
                                  title="Eliminar"
                                >
                                  <i className="fas fa-trash"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="text-center py-4">
                            <i className="fas fa-inbox fa-2x text-muted mb-2"></i>
                            <p className="text-muted mb-0">
                              {searchTerm
                                ? "No se encontraron clientes"
                                : "No hay clientes registrados"}
                            </p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="d-flex justify-content-center mt-4">
                <nav>
                  <ul className="pagination">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Anterior
                      </button>
                    </li>
                    {[...Array(totalPages)].map((_, index) => (
                      <li
                        key={index + 1}
                        className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}
                      >
                        <button
                          className="page-link"
                          onClick={() => paginate(index + 1)}
                        >
                          {index + 1}
                        </button>
                      </li>
                    ))}
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Siguiente
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            )}

            {/* Modal para crear/editar cliente */}
            {showModal && (
              <div
                className="modal show d-block"
                style={{ background: "rgba(0,0,0,0.5)" }}
              >
                <div className="modal-dialog modal-lg">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h5 className="modal-title">
                        {editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
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
                            <label className="form-label">Nombre del Cliente *</label>
                            <input
                              type="text"
                              className="form-control"
                              name="nombre"
                              value={formData.nombre}
                              onChange={handleInputChange}
                              required
                            />
                          </div>
                          <div className="col-md-6 mb-3">
                            <label className="form-label">Empresa</label>
                            <input
                              type="text"
                              className="form-control"
                              name="empresa"
                              value={formData.empresa}
                              onChange={handleInputChange}
                            />
                          </div>
                          <div className="col-md-6 mb-3">
                            <label className="form-label">Teléfono</label>
                            <input
                              type="tel"
                              className="form-control"
                              name="telefono"
                              value={formData.telefono}
                              onChange={handleInputChange}
                            />
                          </div>
                          <div className="col-md-6 mb-3">
                            <label className="form-label">Email</label>
                            <input
                              type="email"
                              className="form-control"
                              name="email"
                              value={formData.email}
                              onChange={handleInputChange}
                            />
                          </div>
                          <div className="col-md-6 mb-3">
                            <label className="form-label">Ciudad</label>
                            <input
                              type="text"
                              className="form-control"
                              name="ciudad"
                              value={formData.ciudad}
                              onChange={handleInputChange}
                            />
                          </div>
                          <div className="col-md-6 mb-3">
                            <label className="form-label">Estado</label>
                            <select
                              className="form-select"
                              name="estado"
                              value={formData.estado}
                              onChange={handleInputChange}
                            >
                              <option value="Activo">Activo</option>
                              <option value="Inactivo">Inactivo</option>
                            </select>
                          </div>
                          <div className="col-12 mb-3">
                            <label className="form-label">Dirección</label>
                            <textarea
                              className="form-control"
                              name="direccion"
                              value={formData.direccion}
                              onChange={handleInputChange}
                              rows="3"
                              placeholder="Dirección completa del cliente..."
                            />
                          </div>
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
                          <i
                            className={`fas ${
                              editingCliente ? "fa-save" : "fa-plus"
                            } me-1`}
                          ></i>
                          {editingCliente ? 'Actualizar' : 'Crear'} Cliente
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Modal para opciones de reporte */}
            {showReportModal && (
              <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <div className="modal-dialog modal-dialog-centered">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h5 className="modal-title">
                        <i className="fas fa-file-pdf text-danger me-2"></i>
                        Generar Reporte de Clientes
                      </h5>
                      <button
                        type="button"
                        className="btn-close"
                        onClick={() => {
                          setShowReportModal(false);
                          setIncludeInactive(false);
                        }}
                      ></button>
                    </div>
                    <div className="modal-body">
                      <p className="text-muted mb-3">
                        Seleccione las opciones para el reporte PDF:
                      </p>
                      
                      <div className="alert alert-info border-0 mb-3">
                        <i className="fas fa-info-circle me-2"></i>
                        <strong>Total de clientes a incluir:</strong>
                        <span className="ms-2 badge bg-primary">
                          {includeInactive 
                            ? filteredClientes.length 
                            : filteredClientes.filter(c => c.estado === 'Activo').length}
                        </span>
                      </div>

                      <div className="form-check form-switch mb-3">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="includeInactive"
                          checked={includeInactive}
                          onChange={(e) => setIncludeInactive(e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="includeInactive">
                          <strong>Incluir clientes inactivos</strong>
                          <br />
                          <small className="text-muted">
                            {includeInactive 
                              ? `Se incluirán ${filteredClientes.filter(c => c.estado === 'Inactivo').length} clientes inactivos`
                              : 'Solo se incluirán clientes activos en el reporte'}
                          </small>
                        </label>
                      </div>

                      {includeInactive && (
                        <div className="alert alert-warning border-0">
                          <i className="fas fa-exclamation-triangle me-2"></i>
                          <small>
                            Los clientes inactivos se destacarán en <strong className="text-danger">rojo</strong> en el reporte.
                          </small>
                        </div>
                      )}
                    </div>
                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                          setShowReportModal(false);
                          setIncludeInactive(false);
                        }}
                      >
                        <i className="fas fa-times me-1"></i>
                        Cancelar
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary-green"
                        onClick={handleConfirmReport}
                        disabled={isGenerating}
                      >
                        {isGenerating ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                            Generando...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-file-pdf me-1"></i>
                            Generar PDF
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Clientes;