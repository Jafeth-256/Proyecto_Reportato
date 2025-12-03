import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import '../styles/custom.css';
import API_BASE_URL from '../config/api';

const Sucursales = () => {
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'verdulería',
    ubicacion: '',
    estado: 'activa'
  });

  const [formErrors, setFormErrors] = useState({
    nombre: '',
    ubicacion: ''
  });

  const tiposDisponibles = [
    { value: 'verdulería', label: 'Verdulería' },
    { value: 'exportación', label: 'Exportación' },
    { value: 'feria', label: 'Feria' },
    { value: 'mayorista', label: 'Mayorista' }
  ];

  // Función para sanitizar texto y prevenir XSS
  const sanitizeInput = (input) => {
    if (typeof input !== 'string') return '';
    return input
      .trim()
      .replace(/[<>]/g, '') // Remover < y > para prevenir tags HTML
      .replace(/['"]/g, '') // Remover comillas
      .substring(0, 255); // Limitar longitud máxima
  };

  // Validación de nombre de sucursal
  const validateNombre = (nombre) => {
    const trimmed = nombre.trim();
    if (!trimmed) {
      return 'El nombre es requerido';
    }
    if (trimmed.length < 3) {
      return 'El nombre debe tener al menos 3 caracteres';
    }
    if (trimmed.length > 100) {
      return 'El nombre no puede exceder 100 caracteres';
    }
    // Validar que contenga al menos una letra
    if (!/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(trimmed)) {
      return 'El nombre debe contener al menos una letra';
    }
    // Validar caracteres permitidos (letras, números, espacios, guiones y #)
    if (!/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-#]+$/.test(trimmed)) {
      return 'El nombre solo puede contener letras, números, espacios, guiones y #';
    }
    return '';
  };

  // Validación de ubicación
  const validateUbicacion = (ubicacion) => {
    const trimmed = ubicacion.trim();
    if (!trimmed) {
      return 'La ubicación es requerida';
    }
    if (trimmed.length < 5) {
      return 'La ubicación debe tener al menos 5 caracteres';
    }
    if (trimmed.length > 255) {
      return 'La ubicación no puede exceder 255 caracteres';
    }
    // Validar que contenga al menos una letra
    if (!/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(trimmed)) {
      return 'La ubicación debe contener al menos una letra';
    }
    return '';
  };

  // Validar tipo permitido
  const validateTipo = (tipo) => {
    const tiposValidos = tiposDisponibles.map(t => t.value);
    return tiposValidos.includes(tipo);
  };

  // Validar estado permitido
  const validateEstado = (estado) => {
    return estado === 'activa' || estado === 'inactiva';
  };

  // Auto-ocultar mensajes después de 5 segundos
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Cargar sucursales desde la API
  useEffect(() => {
    fetchSucursales();
  }, []);

  const fetchSucursales = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`${API_BASE_URL}/sucursales`);
      if (response.ok) {
        const data = await response.json();
        setSucursales(data);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || 'Error al cargar las sucursales. Por favor, intenta nuevamente.');
      }
    } catch (error) {
      setError('Error de conexión. Verifica tu conexión a internet e intenta nuevamente.');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar sucursales por búsqueda
  const filteredSucursales = sucursales.filter(item =>
    item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.ubicacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.estado.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredSucursales.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSucursales.length / itemsPerPage);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Actualizar valor del formulario
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Validar en tiempo real y actualizar errores
    let errorMessage = '';
    if (name === 'nombre') {
      errorMessage = validateNombre(value);
    } else if (name === 'ubicacion') {
      errorMessage = validateUbicacion(value);
    }

    setFormErrors(prev => ({
      ...prev,
      [name]: errorMessage
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevenir doble submit
    if (isSubmitting) return;

    // Limpiar mensajes anteriores
    setError('');
    setSuccess('');

    // Validar todos los campos
    const nombreError = validateNombre(formData.nombre);
    const ubicacionError = validateUbicacion(formData.ubicacion);

    // Actualizar errores en el formulario
    setFormErrors({
      nombre: nombreError,
      ubicacion: ubicacionError
    });

    // Si hay errores, no enviar
    if (nombreError || ubicacionError) {
      setError('Por favor, corrige los errores en el formulario antes de continuar.');
      return;
    }

    // Validar tipo y estado
    if (!validateTipo(formData.tipo)) {
      setError('El tipo de sucursal seleccionado no es válido.');
      return;
    }

    if (!validateEstado(formData.estado)) {
      setError('El estado seleccionado no es válido.');
      return;
    }

    try {
      setIsSubmitting(true);

      // Sanitizar datos antes de enviar
      const sanitizedData = {
        nombre: sanitizeInput(formData.nombre),
        tipo: formData.tipo,
        ubicacion: sanitizeInput(formData.ubicacion),
        estado: formData.estado
      };

      const url = editingItem
        ? `${API_BASE_URL}/sucursales/${editingItem.id}`
        : `${API_BASE_URL}/sucursales`;

      const method = editingItem ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sanitizedData),
      });

      if (response.ok) {
        setSuccess(editingItem
          ? 'Sucursal actualizada exitosamente'
          : 'Sucursal creada exitosamente'
        );
        await fetchSucursales(); // Recargar la lista
        resetForm();
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || 'Error al guardar la sucursal. Por favor, intenta nuevamente.');
      }
    } catch (error) {
      setError('Error de conexión. Verifica tu conexión a internet e intenta nuevamente.');
      console.error('Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      tipo: 'verdulería',
      ubicacion: '',
      estado: 'activa'
    });
    setFormErrors({
      nombre: '',
      ubicacion: ''
    });
    setEditingItem(null);
    setShowModal(false);
    setError('');
    setSuccess('');
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      nombre: item.nombre,
      tipo: item.tipo,
      ubicacion: item.ubicacion,
      estado: item.estado
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!id || typeof id !== 'number') {
      setError('ID de sucursal inválido.');
      return;
    }

    if (window.confirm('¿Estás seguro de que deseas eliminar esta sucursal? Esta acción no se puede deshacer.')) {
      try {
        setError('');
        setSuccess('');

        const response = await fetch(`${API_BASE_URL}/sucursales/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setSuccess('Sucursal eliminada exitosamente');
          await fetchSucursales(); // Recargar la lista
        } else {
          const errorData = await response.json().catch(() => ({}));
          setError(errorData.message || 'Error al eliminar la sucursal. Por favor, intenta nuevamente.');
        }
      } catch (error) {
        setError('Error de conexión. Verifica tu conexión a internet e intenta nuevamente.');
        console.error('Error:', error);
      }
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    if (!id || typeof id !== 'number') {
      setError('ID de sucursal inválido.');
      return;
    }

    if (!validateEstado(currentStatus)) {
      setError('Estado actual inválido.');
      return;
    }

    const newStatus = currentStatus === 'activa' ? 'inactiva' : 'activa';

    try {
      setError('');
      setSuccess('');

      const response = await fetch(`${API_BASE_URL}/sucursales/${id}/estado`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estado: newStatus }),
      });

      if (response.ok) {
        setSuccess(`Sucursal ${newStatus === 'activa' ? 'activada' : 'desactivada'} exitosamente`);
        await fetchSucursales(); // Recargar la lista
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || 'Error al cambiar el estado de la sucursal. Por favor, intenta nuevamente.');
      }
    } catch (error) {
      setError('Error de conexión. Verifica tu conexión a internet e intenta nuevamente.');
      console.error('Error:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const getStatusBadgeClass = (estado) => {
    switch (estado) {
      case 'activa':
        return 'bg-success bg-opacity-20 text-success';
      case 'inactiva':
        return 'bg-danger bg-opacity-20 text-danger';
      default:
        return 'bg-secondary bg-opacity-20 text-secondary';
    }
  };

  const getTipoBadgeClass = (tipo) => {
    switch (tipo) {
      case 'verdulería':
        return 'bg-primary-green bg-opacity-20 text-primary-green';
      case 'exportación':
        return 'bg-primary-purple bg-opacity-20 text-primary-purple';
      case 'feria':
        return 'bg-primary-orange bg-opacity-20 text-primary-orange';
      case 'mayorista':
        return 'bg-primary-blue bg-opacity-20 text-primary-blue';
      default:
        return 'bg-secondary bg-opacity-20 text-secondary';
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
            {/* Alertas de éxito y error */}
            {error && (
              <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert">
                <i className="fas fa-exclamation-circle me-2"></i>
                {error}
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setError('')}
                  aria-label="Close"
                ></button>
              </div>
            )}

            {success && (
              <div className="alert alert-success alert-dismissible fade show mb-4" role="alert">
                <i className="fas fa-check-circle me-2"></i>
                {success}
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSuccess('')}
                  aria-label="Close"
                ></button>
              </div>
            )}

            {/* Header */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                  <div>
                    <h3 className="fw-bold text-dark mb-1">
                      <i className="fas fa-store text-primary-purple me-2"></i>
                      Gestión de Sucursales
                    </h3>
                    <p className="text-muted mb-0">
                      Administra tus puntos de venta y sucursales
                    </p>
                  </div>
                  <div className="d-flex gap-2">
                    <button 
                      className="btn btn-primary-purple"
                      onClick={() => setShowModal(true)}
                    >
                      <i className="fas fa-plus me-1"></i>
                      Nueva Sucursal
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
                          <i className="fas fa-store text-primary-purple fs-4"></i>
                        </div>
                      </div>
                      <div className="flex-grow-1 ms-3">
                        <div className="fw-bold text-dark fs-4">{sucursales.length}</div>
                        <div className="text-muted small">Total Sucursales</div>
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
                          {sucursales.filter(item => item.estado === 'activa').length}
                        </div>
                        <div className="text-muted small">Sucursales Activas</div>
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
                          <i className="fas fa-seedling text-primary-orange fs-4"></i>
                        </div>
                      </div>
                      <div className="flex-grow-1 ms-3">
                        <div className="fw-bold text-dark fs-4">
                          {sucursales.filter(item => item.tipo === 'verdulería').length}
                        </div>
                        <div className="text-muted small">Verdulerías</div>
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
                          <i className="fas fa-shipping-fast text-primary-blue fs-4"></i>
                        </div>
                      </div>
                      <div className="flex-grow-1 ms-3">
                        <div className="fw-bold text-dark fs-4">
                          {sucursales.filter(item => item.tipo === 'exportación').length}
                        </div>
                        <div className="text-muted small">Exportación</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabla de sucursales */}
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-0 py-3">
                <div className="row align-items-center">
                  <div className="col-md-6">
                    <h5 className="card-title mb-0 fw-bold">Lista de Sucursales</h5>
                  </div>
                  <div className="col-md-6">
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0">
                        <i className="fas fa-search text-muted"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control border-start-0"
                        placeholder="Buscar sucursales..."
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
                        <th className="border-0 px-4 py-3">Nombre</th>
                        <th className="border-0 px-4 py-3">Tipo</th>
                        <th className="border-0 px-4 py-3">Ubicación</th>
                        <th className="border-0 px-4 py-3">Estado</th>
                        <th className="border-0 px-4 py-3">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3">
                            <div className="fw-medium text-dark">{item.nombre}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`badge ${getTipoBadgeClass(item.tipo)}`}>
                              {item.tipo}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-muted">{item.ubicacion}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`badge ${getStatusBadgeClass(item.estado)}`}>
                              {item.estado}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="d-flex gap-2">
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => handleEdit(item)}
                                title="Editar"
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                              <button
                                className={`btn btn-sm ${item.estado === 'activa' ? 'btn-outline-warning' : 'btn-outline-success'}`}
                                onClick={() => handleToggleStatus(item.id, item.estado)}
                                title={item.estado === 'activa' ? 'Desactivar' : 'Activar'}
                              >
                                <i className={`fas ${item.estado === 'activa' ? 'fa-pause' : 'fa-play'}`}></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDelete(item.id)}
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

                {/* Paginación */}
                {totalPages > 1 && (
                  <div className="d-flex justify-content-between align-items-center p-4">
                    <div className="text-muted small">
                      Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, filteredSucursales.length)} de {filteredSucursales.length} registros
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

      {/* Modal para crear/editar sucursal */}
      {showModal && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingItem ? 'Editar Sucursal' : 'Nueva Sucursal'}
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
                      <label className="form-label">Nombre de la Sucursal *</label>
                      <input
                        type="text"
                        className={`form-control ${formErrors.nombre ? 'is-invalid' : ''}`}
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleInputChange}
                        placeholder="Ej: Verdulería Cartago"
                        required
                        maxLength="100"
                      />
                      {formErrors.nombre && (
                        <div className="invalid-feedback">
                          {formErrors.nombre}
                        </div>
                      )}
                      <div className="form-text">
                        Mínimo 3 caracteres, máximo 100. Solo letras, números, espacios, guiones y #.
                      </div>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Tipo de Sucursal *</label>
                      <select
                        className="form-select"
                        name="tipo"
                        value={formData.tipo}
                        onChange={handleInputChange}
                        required
                      >
                        {tiposDisponibles.map((tipo) => (
                          <option key={tipo.value} value={tipo.value}>
                            {tipo.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-12 mb-3">
                      <label className="form-label">Ubicación *</label>
                      <input
                        type="text"
                        className={`form-control ${formErrors.ubicacion ? 'is-invalid' : ''}`}
                        name="ubicacion"
                        value={formData.ubicacion}
                        onChange={handleInputChange}
                        placeholder="Ej: San Rafael de Cartago, Centro Comercial Plaza"
                        required
                        maxLength="255"
                      />
                      {formErrors.ubicacion && (
                        <div className="invalid-feedback">
                          {formErrors.ubicacion}
                        </div>
                      )}
                      <div className="form-text">
                        Mínimo 5 caracteres, máximo 255. Describe la ubicación completa de la sucursal.
                      </div>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Estado</label>
                      <select
                        className="form-select"
                        name="estado"
                        value={formData.estado}
                        onChange={handleInputChange}
                      >
                        <option value="activa">Activa</option>
                        <option value="inactiva">Inactiva</option>
                      </select>
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
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        {editingItem ? 'Actualizando...' : 'Creando...'}
                      </>
                    ) : (
                      <>{editingItem ? 'Actualizar' : 'Crear'} Sucursal</>
                    )}
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

export default Sucursales;