import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import '../styles/custom.css';
import useReports from '../hooks/useReports';
import API_BASE_URL from '../config/api';
import * as XLSX from 'xlsx';

const Productos = () => {
  const { generateProductReport, isGenerating } = useReports();
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingProducto, setEditingProducto] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [importingFile, setImportingFile] = useState(false);
  const [importPreview, setImportPreview] = useState([]);
  const [importErrors, setImportErrors] = useState([]);

  const [formData, setFormData] = useState({
    nombre: '',
    categoria: '',
    unidad_medida: 'kg',
    descripcion: '',
    estado: 'Activo'
  });

  // Cargar productos desde la API
  useEffect(() => {
    fetchProductos();
  }, []);

  const fetchProductos = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/productos`);
      if (response.ok) {
        const data = await response.json();
        setProductos(data);
      } else {
        console.error('Error al obtener productos');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar productos por búsqueda
  const filteredProductos = productos.filter(producto =>
    producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    producto.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
    producto.unidad_medida.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleGenerateReport = () => {
    generateProductReport(filteredProductos);
  };

  // Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProductos = filteredProductos.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProductos.length / itemsPerPage);

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
      const url = editingProducto 
      ? `${API_BASE_URL}/productos/${editingProducto.id}`
      : `${API_BASE_URL}/productos`;
      
      const method = editingProducto ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchProductos(); // Recargar la lista
        resetForm();
      } else {
        console.error('Error al guardar producto');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      categoria: '',
      unidad_medida: 'kg',
      descripcion: '',
      estado: 'Activo'
    });
    setEditingProducto(null);
    setShowModal(false);
  };

  const handleEdit = (producto) => {
    setEditingProducto(producto);
    setFormData({
      nombre: producto.nombre,
      categoria: producto.categoria,
      unidad_medida: producto.unidad_medida,
      descripcion: producto.descripcion || '',
      estado: producto.estado
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/productos/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          await fetchProductos(); // Recargar la lista
        } else {
          console.error('Error al eliminar producto');
        }
      } catch (error) {
        console.error('Error:', error);
      }
    }
  };

  const closeImportModal = () => {
    setShowImportModal(false);
    setImportPreview([]);
    setImportErrors([]);
    // Resetear el input para poder seleccionar el mismo archivo de nuevo
    const fileInput = document.getElementById('fileInput');
    if (fileInput) fileInput.value = '';
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImportingFile(true);
      setImportErrors([]);
      setImportPreview([]);
      const reader = new FileReader();

      reader.onload = async (event) => {
        try {
          const data = event.target?.result;
          const workbook = XLSX.read(data, { type: 'array' });
          const worksheet = workbook.Sheets['productos'];

          if (!worksheet) {
            setImportErrors(['No se encontró la hoja "productos" en el archivo Excel']);
            setShowImportModal(true);
            setImportingFile(false);
            return;
          }

          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          if (jsonData.length === 0) {
            setImportErrors(['El archivo no contiene datos']);
            setShowImportModal(true);
            setImportingFile(false);
            return;
          }

          // Validar duplicados con productos existentes
          const productosExistentes = productos.map(p => p.nombre.toLowerCase());
          const productosConDuplicados = [];
          const productosSinDuplicados = [];

          jsonData.forEach((producto) => {
            if (productosExistentes.includes(producto.nombre?.toLowerCase())) {
              productosConDuplicados.push(producto.nombre);
            } else {
              productosSinDuplicados.push(producto);
            }
          });

          if (productosConDuplicados.length > 0) {
            setImportErrors([`Se encontraron ${productosConDuplicados.length} producto(s) duplicado(s): ${productosConDuplicados.join(', ')}`]);
            setImportPreview(productosSinDuplicados);
          } else {
            setImportErrors([]);
            setImportPreview(jsonData);
          }
          setShowImportModal(true);
          setImportingFile(false);
        } catch (error) {
          console.error('Error al procesar archivo:', error);
          setImportErrors(['Error al procesar el archivo Excel. Asegúrate de que tiene el formato correcto']);
          setShowImportModal(true);
          setImportingFile(false);
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error:', error);
      setImportErrors(['Error al leer el archivo']);
      setShowImportModal(true);
      setImportingFile(false);
    }
  };

  const handleConfirmImport = async () => {
    try {
      setImportingFile(true);
      let productosInsertados = 0;
      let productosConError = 0;

      // Crear cada producto usando el mismo endpoint que el formulario
      for (const producto of importPreview) {
        try {
          const response = await fetch(`${API_BASE_URL}/productos`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              nombre: producto.nombre,
              categoria: producto.categoria,
              unidad_medida: producto.unidad_medida || 'kg',
              descripcion: producto.descripcion || '',
              estado: producto.estado || 'Activo'
            }),
          });

          if (response.ok) {
            productosInsertados++;
          } else {
            productosConError++;
          }
        } catch (error) {
          console.error('Error al insertar producto:', error);
          productosConError++;
        }
      }

      await fetchProductos();
      setShowImportModal(false);
      setImportPreview([]);
      alert(`Importación completada!\n- Productos insertados: ${productosInsertados}\n- Productos con error: ${productosConError}`);
    } catch (error) {
      console.error('Error:', error);
      setImportErrors(['Error al procesar la importación']);
    } finally {
      setImportingFile(false);
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
                      <i className="fas fa-boxes text-primary-purple me-2"></i>
                      Gestión de Productos
                    </h3>
                    <p className="text-muted mb-0">
                      Administra el catálogo de productos de tu verdulería
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
                    <label className="btn btn-outline-primary-blue m-0">
                      <i className="fas fa-file-import me-1"></i>
                      Importar Excel
                      <input
                        id="fileInput"
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileUpload}
                        disabled={importingFile}
                        style={{ display: 'none' }}
                      />
                    </label>
                    <button
                      className="btn btn-primary-purple"
                      onClick={() => setShowModal(true)}
                    >
                      <i className="fas fa-plus me-1"></i>
                      Nuevo Producto
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
                          <i className="fas fa-boxes text-primary-purple fs-4"></i>
                        </div>
                      </div>
                      <div className="flex-grow-1 ms-3">
                        <div className="fw-bold text-dark fs-4">{productos.length}</div>
                        <div className="text-muted small">Total Productos</div>
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
                          {productos.filter(p => p.estado === 'Activo').length}
                        </div>
                        <div className="text-muted small">Productos Activos</div>
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
                          <i className="fas fa-layer-group text-primary-orange fs-4"></i>
                        </div>
                      </div>
                      <div className="flex-grow-1 ms-3">
                        <div className="fw-bold text-dark fs-4">
                          {[...new Set(productos.map(p => p.categoria))].length}
                        </div>
                        <div className="text-muted small">Categorías</div>
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
                          {productos.filter(p => p.estado === 'Inactivo').length}
                        </div>
                        <div className="text-muted small">Productos Inactivos</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabla de productos */}
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-0 py-3">
                <div className="row align-items-center">
                  <div className="col-md-6">
                    <h5 className="card-title mb-0 fw-bold">Lista de Productos</h5>
                  </div>
                  <div className="col-md-6">
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0">
                        <i className="fas fa-search text-muted"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control border-start-0"
                        placeholder="Buscar producto..."
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
                        <th className="border-0 px-4 py-3">Categoría</th>
                        <th className="border-0 px-4 py-3">Unidad de Medida</th>
                        <th className="border-0 px-4 py-3">Registro</th>
                        <th className="border-0 px-4 py-3">Estado</th>
                        <th className="border-0 px-4 py-3">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentProductos.map((producto) => (
                        <tr key={producto.id}>
                          <td className="px-4 py-3">
                            <div>
                              <div className="fw-medium text-dark">{producto.nombre}</div>
                              <small className="text-muted">{producto.descripcion}</small>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="badge bg-light text-dark">
                              {producto.categoria}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-muted">{producto.unidad_medida}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="small text-muted">
                              {formatDate(producto.fecha_registro)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`badge ${
                              producto.estado === 'Activo' 
                                ? 'bg-success bg-opacity-20 text-success' 
                                : 'bg-danger bg-opacity-20 text-danger'
                            }`}>
                              {producto.estado}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="d-flex gap-2">
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => handleEdit(producto)}
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDelete(producto.id)}
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
                      Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, filteredProductos.length)} de {filteredProductos.length} productos
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

      {/* Modal para importar productos */}
      {showImportModal && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-file-import me-2"></i>
                  Vista Previa de Importación
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeImportModal}
                ></button>
              </div>
              <div className="modal-body">
                {importErrors.length > 0 && (
                  <div className="alert alert-danger mb-3">
                    <strong>Errores encontrados:</strong>
                    <ul className="mb-0 mt-2">
                      {importErrors.map((error, idx) => (
                        <li key={idx}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {importPreview.length > 0 && (
                  <>
                    <p className="text-muted mb-3">
                      Se encontraron <strong>{importPreview.length}</strong> productos para importar
                    </p>
                    <div className="table-responsive">
                      <table className="table table-sm table-hover">
                        <thead className="bg-light">
                          <tr>
                            <th>Nombre</th>
                            <th>Categoría</th>
                            <th>Unidad</th>
                            <th>Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importPreview.slice(0, 10).map((producto, idx) => (
                            <tr key={idx}>
                              <td>{producto.nombre}</td>
                              <td>{producto.categoria}</td>
                              <td>{producto.unidad_medida || 'kg'}</td>
                              <td>
                                <span className={`badge ${
                                  (producto.estado || 'Activo') === 'Activo'
                                    ? 'bg-success bg-opacity-20 text-success'
                                    : 'bg-danger bg-opacity-20 text-danger'
                                }`}>
                                  {producto.estado || 'Activo'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {importPreview.length > 10 && (
                      <p className="text-muted text-center mt-2">
                        y {importPreview.length - 10} productos más...
                      </p>
                    )}
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeImportModal}
                  disabled={importingFile}
                >
                  Cancelar
                </button>
                {importPreview.length > 0 && (
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={handleConfirmImport}
                    disabled={importingFile}
                  >
                    {importingFile ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                        Importando...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-check me-1"></i>
                        Confirmar Importación ({importPreview.length})
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para crear/editar producto */}
      {showModal && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingProducto ? 'Editar Producto' : 'Nuevo Producto'}
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
                      <label className="form-label">Nombre del Producto *</label>
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
                      <label className="form-label">Categoría *</label>
                      <select
                        className="form-select"
                        name="categoria"
                        value={formData.categoria}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Seleccionar categoría</option>
                        <option value="Frutas">Frutas</option>
                        <option value="Verduras">Verduras</option>
                        <option value="Tubérculos">Tubérculos</option>
                        <option value="Hierbas">Hierbas</option>
                        <option value="Legumbres">Legumbres</option>
                        <option value="Cereales">Cereales</option>
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Unidad de Medida</label>
                      <select
                        className="form-select"
                        name="unidad_medida"
                        value={formData.unidad_medida}
                        onChange={handleInputChange}
                      >
                        <option value="kg">Kilogramo (kg)</option>
                        <option value="g">Gramo (g)</option>
                        <option value="unidad">Unidad</option>
                        <option value="manojo">Manojo</option>
                        <option value="libra">Libra</option>
                        <option value="litro">Litro</option>
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
                    <div className="col-12 mb-3">
                      <label className="form-label">Descripción</label>
                      <textarea
                        className="form-control"
                        name="descripcion"
                        value={formData.descripcion}
                        onChange={handleInputChange}
                        rows="3"
                        placeholder="Descripción del producto..."
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
                    {editingProducto ? 'Actualizar' : 'Crear'} Producto
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

export default Productos;