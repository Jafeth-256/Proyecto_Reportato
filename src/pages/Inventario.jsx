import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import '../styles/custom.css';
import useReports from '../hooks/useReports';
import API_BASE_URL from '../config/api';

const Inventario = () => {
  const [inventario, setInventario] = useState([]);
  const { generateInventoryReport, isGenerating } = useReports();
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showSalidaModal, setShowSalidaModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedItemForSalida, setSelectedItemForSalida] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [includeZeroStock, setIncludeZeroStock] = useState(false);

  const [formData, setFormData] = useState({
    producto_id: '',
    stock_actual: '',
    stock_minimo: '',
    precio_unitario: '',
    fecha_ingreso: '',
    fecha_vencimiento: '',
    estado: 'Disponible'
  });

  const [salidaFormData, setSalidaFormData] = useState({
    cantidad: '',
    motivo: '',
    fecha_salida: new Date().toISOString().split('T')[0]
  });

  // Cargar inventario y productos desde la API
  useEffect(() => {
    fetchInventario();
    fetchProductos();
  }, []);

  const fetchInventario = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/inventario`);
      if (response.ok) {
        const data = await response.json();
        setInventario(data);
      } else {
        console.error('Error al obtener inventario');
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

  // Filtrar inventario por búsqueda
  const filteredInventario = inventario.filter(item =>
    item.nombre_producto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.estado.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleGenerateReport = () => {
    setShowReportModal(true);
  };

  const handleConfirmReport = async () => {
    await generateInventoryReport(filteredInventario, {}, includeZeroStock);
    setShowReportModal(false);
    setIncludeZeroStock(false);
  };

  // Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredInventario.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredInventario.length / itemsPerPage);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSalidaInputChange = (e) => {
    const { name, value } = e.target;
    setSalidaFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar mensaje de error cuando el usuario cambia la cantidad
    if (name === 'cantidad') {
      setErrorMessage('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = editingItem
      ? `${API_BASE_URL}/inventario/${editingItem.id}`
      : `${API_BASE_URL}/inventario`;

      const method = editingItem ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchInventario(); // Recargar la lista
        setSuccessMessage(editingItem ? 'Inventario actualizado exitosamente' : 'Inventario creado exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
        resetForm();
      } else {
        console.error('Error al guardar registro de inventario');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleRegistrarSalida = (item) => {
    setSelectedItemForSalida(item);
    setSalidaFormData({
      cantidad: '',
      motivo: '',
      fecha_salida: new Date().toISOString().split('T')[0]
    });
    setErrorMessage('');
    setShowSalidaModal(true);
  };

  const handleSalidaSubmit = async (e) => {
    e.preventDefault();
    
    const cantidadSalida = parseFloat(salidaFormData.cantidad);
    const stockActual = selectedItemForSalida.stock_actual;

    // Validar que la cantidad no sea negativa o cero
    if (cantidadSalida <= 0) {
      setErrorMessage('La cantidad debe ser mayor a 0');
      return;
    }

    // Validar que haya stock suficiente
    if (cantidadSalida > stockActual) {
      setErrorMessage(`Stock insuficiente. Stock disponible: ${stockActual} unidades. Solicitado: ${cantidadSalida} unidades.`);
      return;
    }

    try {
      // Calcular nuevo stock
      const nuevoStock = stockActual - cantidadSalida;
      
      // Determinar nuevo estado basado en el stock restante
      let nuevoEstado = 'Disponible';
      if (nuevoStock === 0) {
        nuevoEstado = 'Agotado';
      } else if (nuevoStock <= selectedItemForSalida.stock_minimo) {
        nuevoEstado = 'Stock Bajo';
      }

      // Actualizar el inventario
      const response = await fetch(`${API_BASE_URL}/inventario/${selectedItemForSalida.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          producto_id: selectedItemForSalida.producto_id,
          stock_actual: nuevoStock,
          stock_minimo: selectedItemForSalida.stock_minimo,
          precio_unitario: selectedItemForSalida.precio_unitario,
          fecha_ingreso: formatDateForInput(selectedItemForSalida.fecha_ingreso),
          fecha_vencimiento: selectedItemForSalida.fecha_vencimiento ? formatDateForInput(selectedItemForSalida.fecha_vencimiento) : null,
          estado: nuevoEstado
        }),
      });

      if (response.ok) {
        await fetchInventario(); // Recargar la lista
        setSuccessMessage(`Salida registrada exitosamente. Nuevo stock: ${nuevoStock} unidades`);
        setTimeout(() => setSuccessMessage(''), 5000);
        resetSalidaForm();
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.message || 'Error al registrar la salida');
      }
    } catch (error) {
      console.error('Error:', error);
      setErrorMessage('Error al procesar la salida de inventario');
    }
  };

  const resetForm = () => {
    setFormData({
      producto_id: '',
      stock_actual: '',
      stock_minimo: '',
      precio_unitario: '',
      fecha_ingreso: '',
      fecha_vencimiento: '',
      estado: 'Disponible'
    });
    setEditingItem(null);
    setShowModal(false);
  };

  const resetSalidaForm = () => {
    setSalidaFormData({
      cantidad: '',
      motivo: '',
      fecha_salida: new Date().toISOString().split('T')[0]
    });
    setSelectedItemForSalida(null);
    setShowSalidaModal(false);
    setErrorMessage('');
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      producto_id: item.producto_id,
      stock_actual: item.stock_actual,
      stock_minimo: item.stock_minimo,
      precio_unitario: item.precio_unitario,
      fecha_ingreso: formatDateForInput(item.fecha_ingreso),
      fecha_vencimiento: item.fecha_vencimiento ? formatDateForInput(item.fecha_vencimiento) : '',
      estado: item.estado
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este registro de inventario?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/inventario/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          await fetchInventario(); // Recargar la lista
          setSuccessMessage('Registro eliminado exitosamente');
          setTimeout(() => setSuccessMessage(''), 3000);
        } else {
          console.error('Error al eliminar registro de inventario');
        }
      } catch (error) {
        console.error('Error:', error);
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const formatDateForInput = (dateString) => {
    return new Date(dateString).toISOString().split('T')[0];
  };

  const getProductoNombre = (producto_id) => {
    const producto = productos.find(p => p.id === parseInt(producto_id));
    return producto ? producto.nombre : '';
  };

  const getStockStatus = (stock_actual, stock_minimo) => {
    if (stock_actual === 0) return 'Agotado';
    if (stock_actual <= stock_minimo) return 'Stock Bajo';
    return 'Disponible';
  };

  const getStockBadgeClass = (estado) => {
    switch (estado) {
      case 'Disponible':
        return 'bg-success bg-opacity-20 text-success';
      case 'Stock Bajo':
        return 'bg-warning bg-opacity-20 text-warning';
      case 'Agotado':
        return 'bg-danger bg-opacity-20 text-danger';
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
            {/* Mensajes de éxito y error */}
            {successMessage && (
              <div className="alert alert-success alert-dismissible fade show" role="alert">
                <i className="fas fa-check-circle me-2"></i>
                {successMessage}
                <button type="button" className="btn-close" onClick={() => setSuccessMessage('')}></button>
              </div>
            )}

            {/* Header */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                  <div>
                    <h3 className="fw-bold text-dark mb-1">
                      <i className="fas fa-warehouse text-primary-purple me-2"></i>
                      Gestión de Inventario
                    </h3>
                    <p className="text-muted mb-0">
                      Controla el stock y precios de tus productos
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
                      Nuevo Inventario
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
                          <i className="fas fa-warehouse text-primary-purple fs-4"></i>
                        </div>
                      </div>
                      <div className="flex-grow-1 ms-3">
                        <div className="fw-bold text-dark fs-4">{inventario.length}</div>
                        <div className="text-muted small">Total Productos en Stock</div>
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
                          {inventario.filter(item => item.estado === 'Disponible').length}
                        </div>
                        <div className="text-muted small">Productos Disponibles</div>
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
                          <i className="fas fa-exclamation-triangle text-primary-orange fs-4"></i>
                        </div>
                      </div>
                      <div className="flex-grow-1 ms-3">
                        <div className="fw-bold text-dark fs-4">
                          {inventario.filter(item => getStockStatus(item.stock_actual, item.stock_minimo) === 'Stock Bajo').length}
                        </div>
                        <div className="text-muted small">Stock Bajo</div>
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
                          <i className="fas fa-times-circle text-primary-blue fs-4"></i>
                        </div>
                      </div>
                      <div className="flex-grow-1 ms-3">
                        <div className="fw-bold text-dark fs-4">
                          {inventario.filter(item => getStockStatus(item.stock_actual, item.stock_minimo) === 'Agotado').length}
                        </div>
                        <div className="text-muted small">Productos Agotados</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabla de inventario */}
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-0 py-3">
                <div className="row align-items-center">
                  <div className="col-md-6">
                    <h5 className="card-title mb-0 fw-bold">Inventario de Productos</h5>
                  </div>
                  <div className="col-md-6">
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0">
                        <i className="fas fa-search text-muted"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control border-start-0"
                        placeholder="Buscar en inventario..."
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
                        <th className="border-0 px-4 py-3">Producto</th>
                        <th className="border-0 px-4 py-3">Stock Actual</th>
                        <th className="border-0 px-4 py-3">Stock Mínimo</th>
                        <th className="border-0 px-4 py-3">Precio Unitario</th>
                        <th className="border-0 px-4 py-3">Fecha Ingreso</th>
                        <th className="border-0 px-4 py-3">Estado</th>
                        <th className="border-0 px-4 py-3">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3">
                            <div>
                              <div className="fw-medium text-dark">{item.nombre_producto}</div>
                              <small className="text-muted">
                                {item.categoria} - {item.unidad_medida}
                              </small>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="fw-bold">{item.stock_actual}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-muted">{item.stock_minimo}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="fw-medium">₡{parseFloat(item.precio_unitario).toFixed(2)}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="small text-muted">
                              {formatDate(item.fecha_ingreso)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`badge ${getStockBadgeClass(getStockStatus(item.stock_actual, item.stock_minimo))}`}>
                              {item.estado}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="d-flex gap-2">
                              <button
                                className="btn btn-sm btn-outline-warning"
                                onClick={() => handleRegistrarSalida(item)}
                                title="Registrar Salida"
                                disabled={item.stock_actual === 0}
                              >
                                <i className="fas fa-arrow-down"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => handleEdit(item)}
                                title="Editar"
                              >
                                <i className="fas fa-edit"></i>
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
                      Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, filteredInventario.length)} de {filteredInventario.length} registros
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

      {/* Modal para crear/editar inventario */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingItem ? 'Editar Inventario' : 'Nuevo Inventario'}
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
                      <label className="form-label">Producto *</label>
                      <select
                        className="form-select"
                        name="producto_id"
                        value={formData.producto_id}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Seleccionar producto</option>
                        {productos.map((producto) => (
                          <option key={producto.id} value={producto.id}>
                            {producto.nombre} - {producto.categoria}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Stock Actual *</label>
                      <input
                        type="number"
                        className="form-control"
                        name="stock_actual"
                        value={formData.stock_actual}
                        onChange={handleInputChange}
                        min="0"
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Stock Mínimo *</label>
                      <input
                        type="number"
                        className="form-control"
                        name="stock_minimo"
                        value={formData.stock_minimo}
                        onChange={handleInputChange}
                        min="0"
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Precio Unitario (₡) *</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        name="precio_unitario"
                        value={formData.precio_unitario}
                        onChange={handleInputChange}
                        min="0"
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Fecha de Ingreso *</label>
                      <input
                        type="date"
                        className="form-control"
                        name="fecha_ingreso"
                        value={formData.fecha_ingreso}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Fecha de Vencimiento</label>
                      <input
                        type="date"
                        className="form-control"
                        name="fecha_vencimiento"
                        value={formData.fecha_vencimiento}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-12 mb-3">
                      <label className="form-label">Estado</label>
                      <select
                        className="form-select"
                        name="estado"
                        value={formData.estado}
                        onChange={handleInputChange}
                      >
                        <option value="Disponible">Disponible</option>
                        <option value="Stock Bajo">Stock Bajo</option>
                        <option value="Agotado">Agotado</option>
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
                  >
                    {editingItem ? 'Actualizar' : 'Crear'} Inventario
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal para registrar salida de inventario */}
      {showSalidaModal && selectedItemForSalida && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-warning bg-opacity-10">
                <h5 className="modal-title">
                  <i className="fas fa-arrow-down text-warning me-2"></i>
                  Registrar Salida de Inventario
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={resetSalidaForm}
                ></button>
              </div>
              <form onSubmit={handleSalidaSubmit}>
                <div className="modal-body">
                  {/* Información del producto */}
                  <div className="alert alert-info border-0 mb-4">
                    <div className="row">
                      <div className="col-md-6">
                        <strong>Producto:</strong> {selectedItemForSalida.nombre_producto}
                        <br />
                        <strong>Categoría:</strong> {selectedItemForSalida.categoria}
                      </div>
                      <div className="col-md-6">
                        <strong>Stock Disponible:</strong> 
                        <span className="badge bg-primary ms-2 fs-6">
                          {selectedItemForSalida.stock_actual} {selectedItemForSalida.unidad_medida}
                        </span>
                        <br />
                        <strong>Stock Mínimo:</strong> {selectedItemForSalida.stock_minimo}
                      </div>
                    </div>
                  </div>

                  {/* Mensaje de error */}
                  {errorMessage && (
                    <div className="alert alert-danger border-0" role="alert">
                      <i className="fas fa-exclamation-circle me-2"></i>
                      {errorMessage}
                    </div>
                  )}

                  {/* Formulario de salida */}
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">
                        Cantidad a Retirar *
                        <i className="fas fa-info-circle text-muted ms-1" 
                           title={`Stock disponible: ${selectedItemForSalida.stock_actual}`}>
                        </i>
                      </label>
                      <input
                        type="number"
                        className={`form-control ${errorMessage ? 'is-invalid' : ''}`}
                        name="cantidad"
                        value={salidaFormData.cantidad}
                        onChange={handleSalidaInputChange}
                        min="0.01"
                        step="0.01"
                        max={selectedItemForSalida.stock_actual}
                        placeholder="Ej: 5"
                        required
                        autoFocus
                      />
                      <div className="form-text">
                        Máximo disponible: {selectedItemForSalida.stock_actual} {selectedItemForSalida.unidad_medida}
                      </div>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">Fecha de Salida *</label>
                      <input
                        type="date"
                        className="form-control"
                        name="fecha_salida"
                        value={salidaFormData.fecha_salida}
                        onChange={handleSalidaInputChange}
                        required
                      />
                    </div>

                    <div className="col-12 mb-3">
                      <label className="form-label fw-bold">Motivo de la Salida</label>
                      <textarea
                        className="form-control"
                        name="motivo"
                        value={salidaFormData.motivo}
                        onChange={handleSalidaInputChange}
                        rows="3"
                        placeholder="Ej: Venta, Daño, Devolución, etc."
                      ></textarea>
                    </div>

                    {/* Previsualización del stock resultante */}
                    {salidaFormData.cantidad && !errorMessage && (
                      <div className="col-12">
                        <div className="alert alert-success border-0">
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <strong>Stock después de la salida:</strong>
                            </div>
                            <div>
                              <span className="badge bg-success fs-6">
                                {selectedItemForSalida.stock_actual - parseFloat(salidaFormData.cantidad)} {selectedItemForSalida.unidad_medida}
                              </span>
                            </div>
                          </div>
                          {(selectedItemForSalida.stock_actual - parseFloat(salidaFormData.cantidad)) <= selectedItemForSalida.stock_minimo && (
                            <div className="mt-2">
                              <i className="fas fa-exclamation-triangle text-warning me-2"></i>
                              <small className="text-warning">
                                El stock quedará por debajo del mínimo recomendado
                              </small>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={resetSalidaForm}
                  >
                    <i className="fas fa-times me-1"></i>
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-warning"
                    disabled={!!errorMessage}
                  >
                    <i className="fas fa-check me-1"></i>
                    Registrar Salida
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
                  Generar Reporte de Inventario
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowReportModal(false);
                    setIncludeZeroStock(false);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <p className="text-muted mb-3">
                  Seleccione las opciones para el reporte PDF:
                </p>
                
                <div className="alert alert-info border-0 mb-3">
                  <i className="fas fa-info-circle me-2"></i>
                  <strong>Total de productos a incluir:</strong>
                  <span className="ms-2 badge bg-primary">
                    {includeZeroStock 
                      ? filteredInventario.length 
                      : filteredInventario.filter(i => i.stock_actual > 0).length}
                  </span>
                </div>

                <div className="form-check form-switch mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="includeZeroStock"
                    checked={includeZeroStock}
                    onChange={(e) => setIncludeZeroStock(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="includeZeroStock">
                    <strong>Incluir productos sin stock (stock = 0)</strong>
                    <br />
                    <small className="text-muted">
                      {includeZeroStock 
                        ? `Se incluirán ${filteredInventario.filter(i => i.stock_actual === 0).length} productos sin stock`
                        : 'Los productos agotados no se incluirán en el reporte'}
                    </small>
                  </label>
                </div>

                {includeZeroStock && (
                  <div className="alert alert-warning border-0">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    <small>
                      Los productos sin stock se destacarán en <strong className="text-danger">rojo</strong> en el reporte.
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
                    setIncludeZeroStock(false);
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
  );
};

export default Inventario;