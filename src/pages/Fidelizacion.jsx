import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import '../styles/custom.css';
import API_BASE_URL from '../config/api';

const Fidelizacion = () => {
  const [fidelizacion, setFidelizacion] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingFidelizacion, setEditingFidelizacion] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    cliente: '' ,
    fechaRegistro: '',
    categoria: '' 
  });

  // Cargar usuarios_fideliacion desde la API
    useEffect(() => {
      fetchFidelizacion();
    }, []);
  
    const fetchFidelizacion = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/fidelizacion`);
        if (response.ok) {
          const data = await response.json();
          setFidelizacion(data);
        } else {
          console.error('Error al obtener los usuarios');
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

  // Filtrar fidelizacion por búsqueda
  const filteredFidelizacion = fidelizacion.filter(fidelizacion =>
    fidelizacion.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fidelizacion.categoria.includes(searchTerm)
  );

  // Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentFidelizacion = filteredFidelizacion.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredFidelizacion.length / itemsPerPage);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

 const handleSubmit = async (e) => {
    e.preventDefault();

    const dataToSend = {
        ...formData,
        fecha_Afiliacion: formData.fechaRegistro,
    };
    delete dataToSend.fechaRegistro;


  try {
      const url = editingFidelizacion 
      ? `${API_BASE_URL}/fidelizacion/${editingFidelizacion.id}`
      : `${API_BASE_URL}/fidelizacion`;
      
      const method = editingFidelizacion ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        await fetchFidelizacion(); // Recargar la lista
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
      cliente: '' ,
      fechaRegistro: '',
      categoria: '' 
    });
    setEditingFidelizacion(null);
    setShowModal(false);
  };

  const handleEdit = (fidelizacion) => {
    setEditingFidelizacion(fidelizacion);
    setFormData({
      id: fidelizacion.id,
      cliente: fidelizacion.cliente,
      fechaRegistro: new Date(fidelizacion.fecha_afiliacion).toISOString().split('T')[0],
      categoria: fidelizacion.categoria
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/fidelizacion/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          await fetchFidelizacion(); // Recargar la lista
        } else {
          console.error('Error al eliminar usuario');
        }
      } catch (error) {
        console.error('Error:', error);
      }
    }
  };

  const handleChangeStatus = async (id, newStatus) => {
    const itemToUpdate = fidelizacion.find(item => item.id === id);
    if (!itemToUpdate) return;

    const updatedItem = { ...itemToUpdate, categoria: newStatus };

    try {
      const response = await fetch(`${API_BASE_URL}/fidelizacion/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedItem),
      });

      if (response.ok) {
        await fetchFidelizacion();
      } else {
        console.error('Error al cambiar la categoria');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

//Verificar la informacion que esta trayendo de BD 

 const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatDateForInput = (dateString) => {
    return new Date(dateString).toISOString().split('T')[0];
  };

  const getStatusBadgeClass = (categoria) => {
    switch (categoria.toLowerCase()) {
    case 'bronce':
      return 'bg-brown text-white'; 
    case 'plata':
      return 'bg-secondary text-white';
    case 'oro':
      return 'bg-warning text-dark';
    case 'diamante':
      return 'bg-info text-white';
    default:
      return 'bg-light text-dark';
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
            {/* Header */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                  <div>
                    <h3 className="fw-bold text-dark mb-1">
                      <i className="fas fa-star-half-stroke text-primary-purple me-2"></i>
                      Gestión de Usuarios de afiliados
                    </h3>
                    <p className="text-muted mb-0">
                      Administra la información de los Usuarios
                    </p>
                  </div>
                  <div className="d-flex gap-2">
                    <button className="btn btn-outline-primary-green">
                      <i className="fas fa-download me-1"></i>
                      Exportar
                    </button>
                    <button 
                      className="btn btn-primary-purple"
                      onClick={() => setShowModal(true)}
                    >
                      <i className="fas fa-plus me-1"></i>
                      Nuevo Usuario
                    </button>
                  </div>
                </div>
              </div>
            </div>

             {/* Tabla de usuarios afiliados */}
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-0 py-3">
                <div className="row align-items-center">
                  <div className="col-md-6">
                    <h5 className="card-title mb-0 fw-bold">Lista de Usuarios Afiliados</h5>
                  </div>
                  <div className="col-md-6">
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0">
                        <i className="fas fa-search text-muted"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control border-start-0"
                        placeholder="Buscar usuario o categoria..."
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
                        <th className="border-0 px-4 py-3">Fecha de Registro</th>
                        <th className="border-0 px-4 py-3">Categoria</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentFidelizacion.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3">
                            <div>
                              <div className="fw-medium text-dark">{item.cliente}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="small text-muted">
                              {formatDate(item.fecha_afiliacion)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="dropdown">
                                <span 
                                  className={`badge ${getStatusBadgeClass(item.categoria)} dropdown-toggle`}
                                  style={{ cursor: 'pointer' }}
                                  data-bs-toggle="dropdown"
                                >
                                  {item.categoria}
                                </span>
                                <ul className="dropdown-menu">
                                  <li>
                                    <button 
                                      className="dropdown-item" 
                                      onClick={() => handleChangeStatus(item.id, 'bronce')}
                                    >
                                      Bronce
                                    </button>
                                  </li>
                                  <li>
                                    <button 
                                      className="dropdown-item" 
                                      onClick={() => handleChangeStatus(item.id, 'plata')}
                                    >
                                      Plata
                                    </button>
                                  </li>
                                  <li>
                                    <button 
                                      className="dropdown-item" 
                                      onClick={() => handleChangeStatus(item.id, 'oro')}
                                    >
                                      Oro
                                    </button>
                                  </li>
                                  <li>
                                    <button 
                                      className="dropdown-item" 
                                      onClick={() => handleChangeStatus(item.id, 'diamante')}
                                    >
                                      Diamante
                                    </button>
                                  </li>
                                </ul>
                              </div>
                          </td> 
                          <td className="px-4 py-3">
                            <div className="d-flex gap-2">
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => handleEdit(item)}
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDelete(item.id)}
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
                      Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, filteredFidelizacion.length)} de {filteredFidelizacion.length} fidelizacion
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

      {/* Modal para crear/editar fidelizacion */}
      {showModal && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingFidelizacion ? 'Editar afiliado' : 'Nuevo Usuario Afiliado'}
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
                      <label className="form-label">Nombre del Usuario a Afiliar *</label>
                      <input
                        type="text"
                        className="form-control"
                        name="cliente"
                        value={formData.cliente}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="col-12 mb-3">
                      <label className="form-label">Fecha de Afiliacion</label>
                      <input
                        type="date"
                        className="form-control"
                        name="fechaRegistro"
                        value={formData.fechaRegistro}
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
                        onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                        required
                      >
                        <option value="">Seleccione una categoría</option>
                        <option value="bronce">Bronce</option>
                        <option value="plata">Plata</option>
                        <option value="oro">Oro</option>
                        <option value="diamante">Diamante</option>
                      </select>
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
                    {editingFidelizacion ? 'Actualizar' : 'Crear'} Fidelizacion
                  </button>
                </div>
                </div>
              </form>
           </div>
          </div>
          </div>
      )}
    </div>
  );
};

export default Fidelizacion;