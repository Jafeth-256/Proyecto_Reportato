import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import "../styles/custom.css";
import CustomAlert from "../components/CustomAlert";
import { permisos } from "../permisos";
import API_BASE_URL from '../config/api';

const Usuario = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  const rolUsuario = localStorage.getItem("rol");
  const puedeCrear = permisos[rolUsuario]?.usuarios.includes("crear");
  const puedeEditar = permisos[rolUsuario]?.usuarios.includes("editar");
  const puedeEliminar = permisos[rolUsuario]?.usuarios.includes("eliminar");

  const [formData, setFormData] = useState({
    nombre: "",
    correo: "",
    rol: "Usuario",
    contrasena: "",
  });

  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
    showCopyButton: false,
    copyText: "",
  });

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/usuarios`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const data = await response.json();
      setUsuarios(data);
    } catch (error) {
      console.error("Error al obtener usuarios:", error);
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  };

  const safeStringFilter = (value, searchTerm) => {
    if (!value) return false;
    return value.toString().toLowerCase().includes(searchTerm.toLowerCase());
  };

  const filteredUsuarios = usuarios.filter((usuario) => {
    if (!searchTerm) return true;
    return (
      safeStringFilter(usuario.nombre, searchTerm) ||
      safeStringFilter(usuario.correo, searchTerm) ||
      safeStringFilter(usuario.rol, searchTerm)
    );
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsuarios = filteredUsuarios.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredUsuarios.length / itemsPerPage);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = editingUsuario ? "PUT" : "POST";
    const url = editingUsuario
    ? `${API_BASE_URL}/usuarios/${editingUsuario.id}`
    : `${API_BASE_URL}/usuarios`;

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        if (!editingUsuario && result.contrasenaTemp) {
          setAlertConfig({
            isOpen: true,
            title: "¡Usuario creado exitosamente!",
            message:
              "Se ha generado una contraseña temporal. Compártela con el usuario para que pueda acceder al sistema.",
            type: "password",
            showCopyButton: true,
            copyText: result.contrasenaTemp,
          });
        } else {
          setAlertConfig({
            isOpen: true,
            title: "¡Éxito!",
            message: "Usuario actualizado exitosamente",
            type: "success",
          });
        }

        await fetchUsuarios();
        resetForm();
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Error desconocido" }));
        setAlertConfig({
          isOpen: true,
          title: "Error",
          message: errorData.message,
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error al guardar usuario:", error);
      setAlertConfig({
        isOpen: true,
        title: "Error de conexión",
        message:
          "No se pudo conectar con el servidor. Por favor, intenta nuevamente.",
        type: "error",
      });
    }
  };

  const handleEdit = (usuario) => {
    setEditingUsuario(usuario);
    setFormData({
      nombre: usuario.nombre || "",
      correo: usuario.correo || "",
      rol: usuario.rol || "Usuario",
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Deseas eliminar este usuario?")) {
      try {
        const response = await fetch(`${API_BASE_URL}/usuarios/${id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          await fetchUsuarios();
        } else {
          console.error("Error al eliminar usuario:", response.statusText);
        }
      } catch (error) {
        console.error("Error al eliminar usuario:", error);
      }
    }
  };

  const resetForm = () => {
    setFormData({ nombre: "", correo: "", rol: "Usuario", contrasena: "" });
    setEditingUsuario(null);
    setShowModal(false);
  };

  const safeCount = (array, condition) => {
    return array.filter((item) => {
      if (!item.rol) return false;
      return condition(item.rol.toLowerCase());
    }).length;
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
                    <i className="fas fa-user-shield text-primary-purple me-2"></i>
                    Gestión de Usuarios
                  </h3>
                  <p className="text-muted mb-0">
                    Administra los usuarios del sistema
                  </p>
                </div>
                {puedeCrear && (
                  <button
                    className="btn btn-primary-purple"
                    onClick={() => setShowModal(true)}
                  >
                    <i className="fas fa-plus me-1"></i> Nuevo Usuario
                  </button>
                )}
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
                    placeholder="Buscar usuarios..."
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
                      <h5 className="fw-bold mb-0">{usuarios.length}</h5>
                      <small className="text-muted">Total Usuarios</small>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card border-0 shadow-sm">
                  <div className="card-body d-flex align-items-center">
                    <i className="fas fa-user-tie fa-2x text-primary-green me-3"></i>
                    <div>
                      <h5 className="fw-bold mb-0">
                        {safeCount(usuarios, (rol) => rol === "administrador")}
                      </h5>
                      <small className="text-muted">Administradores</small>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card border-0 shadow-sm">
                  <div className="card-body d-flex align-items-center">
                    <i className="fas fa-user fa-2x text-primary-orange me-3"></i>
                    <div>
                      <h5 className="fw-bold mb-0">
                        {safeCount(usuarios, (rol) => rol === "usuario")}
                      </h5>
                      <small className="text-muted">Usuarios</small>
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
                        <th>Nombre</th>
                        <th>Correo</th>
                        <th>Rol</th>
                        {(puedeEditar || puedeEliminar) && <th>Acciones</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {currentUsuarios.length > 0 ? (
                        currentUsuarios.map((usuario) => (
                          <tr key={usuario.id}>
                            <td>{usuario.nombre || "N/A"}</td>
                            <td>{usuario.correo || "N/A"}</td>
                            <td>
                              <span
                                className={`badge ${
                                  usuario.rol?.toLowerCase() === "administrador"
                                    ? "bg-primary"
                                    : usuario.rol?.toLowerCase() ===
                                      "organizador"
                                    ? "bg-success"
                                    : "bg-secondary"
                                }`}
                              >
                                {usuario.rol || "N/A"}
                              </span>
                            </td>
                            {(puedeEditar || puedeEliminar) && (
                              <td>
                                <div className="d-flex gap-2">
                                  {puedeEditar && (
                                    <button
                                      className="btn btn-sm btn-outline-secondary"
                                      onClick={() => handleEdit(usuario)}
                                      title="Editar"
                                    >
                                      <i className="fa-solid fa-pen"></i>
                                    </button>
                                  )}
                                  {puedeEliminar && (
                                    <button
                                      className="btn btn-sm btn-outline-danger"
                                      onClick={() => handleDelete(usuario.id)}
                                      title="Eliminar"
                                    >
                                      <i className="fas fa-trash"></i>
                                    </button>
                                  )}
                                </div>
                              </td>
                            )}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="text-center py-4">
                            <i className="fas fa-inbox fa-2x text-muted mb-2"></i>
                            <p className="text-muted mb-0">
                              {searchTerm
                                ? "No se encontraron usuarios"
                                : "No hay usuarios registrados"}
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
                    <li
                      className={`page-item ${
                        currentPage === 1 ? "disabled" : ""
                      }`}
                    >
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
                        className={`page-item ${
                          currentPage === index + 1 ? "active" : ""
                        }`}
                      >
                        <button
                          className="page-link"
                          onClick={() => paginate(index + 1)}
                        >
                          {index + 1}
                        </button>
                      </li>
                    ))}
                    <li
                      className={`page-item ${
                        currentPage === totalPages ? "disabled" : ""
                      }`}
                    >
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

            {showModal && (
              <div
                className="modal show d-block"
                style={{ background: "rgba(0,0,0,0.5)" }}
              >
                <div className="modal-dialog">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h5 className="modal-title">
                        {editingUsuario ? "Editar Usuario" : "Nuevo Usuario"}
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
                          <label className="form-label">Nombre *</label>
                          <input
                            type="text"
                            className="form-control"
                            name="nombre"
                            value={formData.nombre}
                            onChange={handleInputChange}
                            required
                            placeholder="Ingrese el nombre completo"
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Correo *</label>
                          <input
                            type="email"
                            className="form-control"
                            name="correo"
                            value={formData.correo}
                            onChange={handleInputChange}
                            required
                            placeholder="ejemplo@correo.com"
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Rol *</label>
                          <select
                            className="form-select"
                            name="rol"
                            value={formData.rol}
                            onChange={handleInputChange}
                            required
                          >
                            <option value="Administrador">Administrador</option>
                            <option value="Usuario">Usuario</option>
                          </select>
                        </div>
                        {editingUsuario && (
                          <div className="mb-3">
                            <label className="form-label">
                              Contraseña (si desea cambiarla)
                            </label>
                            <input
                              type="password"
                              className="form-control"
                              name="contrasena"
                              value={formData.contrasena}
                              onChange={handleInputChange}
                              placeholder="Nueva contraseña"
                            />
                          </div>
                        )}
                      </div>
                      <div className="modal-footer">
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={resetForm}
                        >
                          Cancelar
                        </button>
                        {puedeCrear && (
                          <button
                            type="submit"
                            className="btn btn-primary-purple"
                          >
                            <i
                              className={`fas ${
                                editingUsuario ? "fa-save" : "fa-plus"
                              } me-1`}
                            ></i>
                            {editingUsuario ? "Actualizar" : "Crear"}
                          </button>
                        )}
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <CustomAlert
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig({ ...alertConfig, isOpen: false })}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        showCopyButton={alertConfig.showCopyButton}
        copyText={alertConfig.copyText}
      />
    </div>
  );
};

export default Usuario;
