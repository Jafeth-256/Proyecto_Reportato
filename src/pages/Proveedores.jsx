import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import '../styles/custom.css';
import useReports from '../hooks/useReports';
import API_BASE_URL from '../config/api';

const Proveedores = () => {
  const { generateSupplierReport, isGenerating } = useReports();
  const [proveedores, setProveedores] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProveedor, setEditingProveedor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  const [formData, setFormData] = useState({
    nombre: '',
    empresa: '',
    telefono: '',
    email: '',
    direccion: '',
    ciudad: '',
    tipo_proveedor: 'Mayorista',
    estado: 'Activo',
    producto_id: ''
  });

  // Cargar proveedores y productos desde la API
  useEffect(() => {
    fetchProveedores();
    fetchProductos();
  }, []);

  const fetchProveedores = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/proveedores`);
      if (response.ok) {
        const data = await response.json();
        setProveedores(data);
      } else {
        console.error('Error al obtener proveedores');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductos = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/productos/activos`);
      if (response.ok) {
        const data = await response.json();
        setProductos(data);
      } else {
        console.error('Error al obtener productos');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Filtrar proveedores por búsqueda
  const filteredProveedores = proveedores.filter(proveedor =>
    proveedor.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (proveedor.empresa && proveedor.empresa.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (proveedor.ciudad && proveedor.ciudad.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (proveedor.nombre_producto && proveedor.nombre_producto.toLowerCase().includes(searchTerm.toLowerCase())) ||
    proveedor.tipo_proveedor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleGenerateReport = () => {
    generateSupplierReport(filteredProveedores);
  };

  // Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProveedores = filteredProveedores.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProveedores.length / itemsPerPage);

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
      const url = editingProveedor 
      ? `${API_BASE_URL}/proveedores/${editingProveedor.id}`
      : `${API_BASE_URL}/proveedores`;
      
      const method = editingProveedor ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchProveedores(); // Recargar la lista
        resetForm();
      } else {
        console.error('Error al guardar proveedor');
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
      tipo_proveedor: 'Mayorista',
      estado: 'Activo',
      producto_id: ''
    });
    setEditingProveedor(null);
    setShowModal(false);
  };

  const handleEdit = (proveedor) => {
    setEditingProveedor(proveedor);
    setFormData({
      nombre: proveedor.nombre,
      empresa: proveedor.empresa || '',
      telefono: proveedor.telefono || '',
      email: proveedor.email || '',
      direccion: proveedor.direccion || '',
      ciudad: proveedor.ciudad || '',
      tipo_proveedor: proveedor.tipo_proveedor,
      estado: proveedor.estado,
      producto_id: proveedor.producto_id || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este proveedor?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/proveedores/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          await fetchProveedores(); // Recargar la lista
        } else {
          console.error('Error al eliminar proveedor');
        }
      } catch (error) {
        console.error('Error:', error);
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES');
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
            {/* Header */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                  <div>
                    <h3 className="fw-bold text-dark mb-1">
                      <i className="fas fa-truck text-primary-purple me-2"></i>
                      Gestión de Proveedores
                    </h3>
                    <p className="text-muted mb-0">
                      Administra la información de tus proveedores
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
                      Nuevo Proveedor
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Estadísticas */}
            <div className="row mb-4">
              <div className="col-xl-3 col-md-6 mb-3">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body">
                    <div className="d-flex align-items-center">
                      <div className="flex-shrink-0">
                        <div className="avatar bg-primary-purple bg-opacity-20 rounded-circle p-3">
                          <i className="fas fa-truck text-primary-purple fs-4"></i>
                        </div>
                      </div>
                      <div className="flex-grow-1 ms-3">
                        <div className="fw-bold text-dark fs-4">{proveedores.length}</div>
                        <div className="text-muted small">Total Proveedores</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-md-6 mb-3">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body">
                    <div className="d-flex align-items-center">
                      <div className="flex-shrink-0">
                        <div className="avatar bg-primary-green bg-opacity-20 rounded-circle p-3">
                          <i className="fas fa-check-circle text-primary-green fs-4"></i>
                        </div>
                      </div>
                      <div className="flex-grow-1 ms-3">
                        <div className="fw-bold text-dark fs-4">
                          {proveedores.filter(p => p.estado === 'Activo').length}
                        </div>
                        <div className="text-muted small">Proveedores Activos</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-md-6 mb-3">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body">
                    <div className="d-flex align-items-center">
                      <div className="flex-shrink-0">
                        <div className="avatar bg-primary-orange bg-opacity-20 rounded-circle p-3">
                          <i className="fas fa-industry text-primary-orange fs-4"></i>
                        </div>
                      </div>
                      <div className="flex-grow-1 ms-3">
                        <div className="fw-bold text-dark fs-4">
                          {proveedores.filter(p => p.tipo_proveedor === 'Mayorista').length}
                        </div>
                        <div className="text-muted small">Mayoristas</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-md-6 mb-3">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body">
                    <div className="d-flex align-items-center">
                      <div className="flex-shrink-0">
                        <div className="avatar bg-primary-blue bg-opacity-20 rounded-circle p-3">
                          <i className="fas fa-pause-circle text-primary-blue fs-4"></i>
                        </div>
                      </div>
                      <div className="flex-grow-1 ms-3">
                        <div className="fw-bold text-dark fs-4">
                          {proveedores.filter(p => p.estado === 'Inactivo').length}
                        </div>
                        <div className="text-muted small">Proveedores Inactivos</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabla de proveedores */}
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-0 py-3">
                <div className="row align-items-center">
                  <div className="col-md-6">
                    <h5 className="card-title mb-0 fw-bold">Lista de Proveedores</h5>
                  </div>
                  <div className="col-md-6">
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0">
                        <i className="fas fa-search text-muted"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control border-start-0"
                        placeholder="Buscar proveedor..."
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
                        <th className="border-0 px-4 py-3">Contacto</th>
                        <th className="border-0 px-4 py-3">Producto Principal</th>
                        <th className="border-0 px-4 py-3">Tipo</th>
                        <th className="border-0 px-4 py-3">Ubicación</th>
                        <th className="border-0 px-4 py-3">Registro</th>
                        <th className="border-0 px-4 py-3">Estado</th>
                        <th className="border-0 px-4 py-3">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentProveedores.map((proveedor) => (
                        <tr key={proveedor.id}>
                          <td className="px-4 py-3">
                            <div>
                              <div className="fw-medium text-dark">{proveedor.nombre}</div>
                              <small className="text-muted">{proveedor.empresa}</small>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <div className="small">{proveedor.telefono}</div>
                              <div className="small text-muted">{proveedor.email}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-muted">{proveedor.nombre_producto || 'N/A'}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="badge bg-light text-dark">
                              {proveedor.tipo_proveedor}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-muted">{proveedor.ciudad}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="small text-muted">
                              {formatDate(proveedor.fecha_registro)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`badge ${
                              proveedor.estado === 'Activo' 
                                ? 'bg-success bg-opacity-20 text-success' 
                                : 'bg-danger bg-opacity-20 text-danger'
                            }`}>
                              {proveedor.estado}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="d-flex gap-2">
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => handleEdit(proveedor)}
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDelete(proveedor.id)}
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

                {/* Paginación */}
                {totalPages > 1 && (
                  <div className="d-flex justify-content-between align-items-center p-4">
                    <div className="text-muted small">
                      Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, filteredProveedores.length)} de {filteredProveedores.length} proveedores
                    </div>
                    <nav>
                      <ul className="pagination pagination-sm mb-0">
                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                          <button
                            className="page-link"
                            onClick={() => setCurrentPage(currentPage - 1)}
                            disabled={currentPage === 1}
                          >
                            Anterior
                          </button>
                        </li>
                        {[...Array(totalPages)].map((_, index) => (
                          <li key={index} className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}>
                            <button
                              className="page-link"
                              onClick={() => setCurrentPage(index + 1)}
                            >
                              {index + 1}
                            </button>
                          </li>
                        ))}
                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                          <button
                            className="page-link"
                            onClick={() => setCurrentPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                          >
                            Siguiente
                          </button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para crear/editar proveedor */}
      {showModal && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingProveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}
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
                      <label className="form-label">Nombre del Proveedor *</label>
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
                      <label className="form-label">Tipo de Proveedor</label>
                      <select
                        className="form-select"
                        name="tipo_proveedor"
                        value={formData.tipo_proveedor}
                        onChange={handleInputChange}
                      >
                        <option value="Mayorista">Mayorista</option>
                        <option value="Minorista">Minorista</option>
                        <option value="Productor">Productor</option>
                        <option value="Distribuidor">Distribuidor</option>
                      </select>
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
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Producto Principal</label>
                      <select
                        className="form-select"
                        name="producto_id"
                        value={formData.producto_id}
                        onChange={handleInputChange}
                      >
                        <option value="">Seleccionar producto</option>
                        {productos.map(producto => (
                          <option key={producto.id} value={producto.id}>
                            {producto.nombre}
                          </option>
                        ))}
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
                        placeholder="Dirección completa del proveedor..."
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
                    {editingProveedor ? 'Actualizar' : 'Crear'} Proveedor
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

export default Proveedores;