import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import '../styles/custom.css';
import API_BASE_URL from '../config/api';
import * as XLSX from 'xlsx';

const Compras = () => {
    const [compras, setCompras] = useState([]);
    const [productos, setProductos] = useState([]);
    const [proveedores, setProveedores] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [usuario, setUsuario] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [editingCompra, setEditingCompra] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5);
    const [loading, setLoading] = useState(true);
    const [inventario, setInventario] = useState([]);
    const [importingFile, setImportingFile] = useState(false);
    const [importPreview, setImportPreview] = useState([]);
    const [importErrors, setImportErrors] = useState([]);
        
    const [formData, setFormData] = useState({
        proveedor: '',
        fecha: '',
        producto: '',
        precio: '',
        cantidad: '',
        total: ''
    });

    useEffect(() => {
        fetchCompras();
        fetchProductos();
        fetchProveedores();
        fetchUsuarios();
        fetchUsuario();
        cargarInventario();
    }, []);

    // Función para obtener lista de usuarios
    const fetchUsuarios = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/usuarios`);
            if (response.ok) {
                const data = await response.json();
                setUsuarios(data);
            }
        } catch (error) {
            console.error('Error al obtener usuarios:', error);
        }
    };

    // Función para cargar inventario al iniciar
    const cargarInventario = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/inventario`);
            if (response.ok) {
                const data = await response.json();
                setInventario(data);
            }
        } catch (error) {
            console.error('Error al cargar inventario:', error);
        }
    };

    // Función para obtener el usuario actual automáticamente
    const fetchUsuario = async () => {
        try {
            // Opción 1: Desde localStorage/sessionStorage
            const usuarioLocal = localStorage.getItem('usuario');
            if (usuarioLocal) {
                const userData = JSON.parse(usuarioLocal);
                setUsuario(userData);
                console.log('Usuario desde localStorage:', userData);
                return;
            }

            // Opción 2: Desde una API de sesión
            try {
                const response = await fetch(`${API_BASE_URL}/auth/me`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                
                if (response.ok) {
                    const userData = await response.json();
                    setUsuario(userData);
                    console.log('Usuario desde API:', userData);
                    return;
                }
            } catch (apiError) {
                console.log('API no disponible, usando usuario por defecto');
            }

            // Opción 3: Usuario por defecto
            const defaultUser = { id: 1, nombre: 'Usuario Admin' };
            setUsuario(defaultUser);
            console.log('Usuario por defecto:', defaultUser);
            
        } catch (error) {
            console.error('Error al obtener usuario:', error);
            // Usuario por defecto en caso de error
            const defaultUser = { id: 1, nombre: 'Usuario Admin' };
            setUsuario(defaultUser);
        }
    };
      
    const fetchCompras = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/compras`);
            if (response.ok) {
                const data = await response.json();
                setCompras(data);
            } else {
                console.error('Error al obtener las compras');
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

    const getProveedorNombre = (proveedor_id) => {
        const proveedor = proveedores.find(p => p.id === parseInt(proveedor_id));
        return proveedor ? proveedor.nombre : '';
    };

    const getProductoNombre = (producto_id) => {
        const producto = productos.find(p => p.id === parseInt(producto_id));
        return producto ? producto.nombre : '';
    };

    const getUsuarioNombre = (usuario_id) => {
        const usr = usuarios.find(u => u.id === parseInt(usuario_id));
        return usr ? usr.nombre : '';
    };

    // Filtrar compras por búsqueda
    const filteredCompras = compras.filter(compra =>
        getProveedorNombre(compra.proveedor_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
        getProductoNombre(compra.producto_id).toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Paginación
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentCompras = filteredCompras.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredCompras.length / itemsPerPage);

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        const updatedData = {
            ...formData,
            [name]: value
        };

        // Calcular el total automáticamente
        const cantidad = parseFloat(name === "cantidad" ? value : updatedData.cantidad);
        const precio = parseFloat(name === "precio" ? value : updatedData.precio);

        if (!isNaN(cantidad) && !isNaN(precio)) {
            updatedData.total = (cantidad * precio).toFixed(2);
        } else {
            updatedData.total = '';
        }

        setFormData(updatedData);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!usuario || !usuario.id) {
            alert('Error: Usuario no disponible. Por favor recarga la página.');
            console.error('Usuario no disponible:', usuario);
            return;
        }

        // Validar que todos los campos estén completos
        if (!formData.proveedor || !formData.fecha || !formData.producto ||
            !formData.precio || !formData.cantidad) {
            alert('Por favor completa todos los campos obligatorios.');
            return;
        }

        try {
            // Estructura de datos que coincide con lo que espera el backend
            const submitData = {
                usuario: parseInt(usuario.id),        // El backend espera 'usuario'
                usuario_nombre: usuario.nombre,       // Guardar el nombre también
                proveedor: parseInt(formData.proveedor),  // El backend espera 'proveedor'
                fecha: formData.fecha,               // El backend espera 'fecha'
                producto: parseInt(formData.producto),    // El backend espera 'producto'
                precio: parseFloat(formData.precio),     // El backend espera 'precio'
                cantidad: parseFloat(formData.cantidad), // El backend espera 'cantidad'
                total: parseFloat(formData.total)        // El backend espera 'total'
            };

            console.log('Datos a enviar:', submitData);

            const url = editingCompra
            ? `${API_BASE_URL}/compras/${editingCompra.id}`
            : `${API_BASE_URL}/compras`;

            const method = editingCompra ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(submitData),
            });

            if (response.ok) {
                console.log('Compra guardada exitosamente');

                // Actualizar el inventario automáticamente
                await actualizarInventario(submitData);

                await fetchCompras();
                resetForm();
            } else {
                const errorData = await response.json();
                console.error('Error del servidor:', errorData);
                alert(`Error al guardar compra: ${errorData.message || 'Error interno del servidor'}`);
            }
        } catch (error) {
            console.error('Error de red:', error);
            alert('Error de conexión. Por favor intenta nuevamente.');
        }
    };

    // Nueva función para actualizar o crear inventario
    const actualizarInventario = async (compraData) => {
        try {
            const productoId = compraData.producto;
            const cantidad = compraData.cantidad;
            const precioUnitario = compraData.precio;

            // Obtener inventario fresco desde la API
            const inventarioResponse = await fetch(`${API_BASE_URL}/inventario`);
            let inventarioFresco = [];
            if (inventarioResponse.ok) {
                inventarioFresco = await inventarioResponse.json();
            }

            // Buscar si ya existe el producto en el inventario
            const inventarioExistente = inventarioFresco.find(item =>
                item.producto_id == productoId || parseInt(item.producto_id) === parseInt(productoId)
            );

            if (inventarioExistente) {
                // Si existe, sumar la cantidad
                const nuevoStock = parseInt(inventarioExistente.stock_actual) + parseInt(cantidad);

                const updateData = {
                    stock_actual: nuevoStock,
                    precio_unitario: precioUnitario,
                    fecha_ingreso: inventarioExistente.fecha_ingreso
                };

                await fetch(
                    `${API_BASE_URL}/inventario/${inventarioExistente.id}`,
                    {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(updateData),
                    }
                );
            } else {
                // Si no existe, crear un nuevo registro de inventario
                const nuevoInventario = {
                    producto_id: productoId,
                    stock_actual: cantidad,
                    stock_minimo: 10,
                    precio_unitario: precioUnitario,
                    fecha_ingreso: new Date().toISOString().split('T')[0],
                    fecha_vencimiento: '',
                    estado: 'Disponible'
                };

                await fetch(
                    `${API_BASE_URL}/inventario`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(nuevoInventario),
                    }
                );
            }

            // Recargar el inventario para mantener sincronizado
            await fetchInventario();
        } catch (error) {
            console.error('Error al actualizar inventario:', error);
        }
    };

    // Nueva función para obtener el inventario
    const fetchInventario = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/inventario`);
            if (response.ok) {
                const data = await response.json();
                // Actualizar el estado con los datos del inventario
                setInventario(data);
                return data;
            }
        } catch (error) {
            console.error('Error al obtener inventario:', error);
        }
    };

    const resetForm = () => {
        setFormData({
            proveedor: '',
            fecha: '',
            producto: '',
            precio: '',
            cantidad: '',
            total: ''
        });
        setEditingCompra(null);
        setShowModal(false);
    };

    const handleEdit = (item) => {
        setEditingCompra(item);
        setFormData({
            proveedor: item.proveedor_id.toString(),
            fecha: new Date(item.fecha_realizada).toISOString().split('T')[0],
            producto: item.producto_id.toString(),
            precio: item.precio_unitario.toString(),
            cantidad: item.cantidad_producto.toString(),
            total: item.total.toString()
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar esta compra?')) {
            try {
                const response = await fetch(`${API_BASE_URL}/compras/${id}`, {
                    method: 'DELETE',
                });

                if (response.ok) {
                    await fetchCompras();
                } else {
                    console.error('Error al eliminar la compra');
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
        const fileInput = document.getElementById('fileInputCompras');
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
                    const worksheet = workbook.Sheets['compras'];

                    if (!worksheet) {
                        setImportErrors(['No se encontró la hoja "compras" en el archivo Excel']);
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

                    setImportErrors([]);
                    setImportPreview(jsonData);
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
            let comprasInsertadas = 0;
            let comprasConError = 0;

            for (const compra of importPreview) {
                try {
                    const response = await fetch(`${API_BASE_URL}/compras`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            usuario: usuario?.id || 1,
                            usuario_nombre: usuario?.nombre || 'Admin',
                            proveedor: compra.proveedor,
                            fecha: compra.fecha,
                            producto: compra.producto,
                            precio: parseFloat(compra.precio) || 0,
                            cantidad: parseFloat(compra.cantidad) || 0,
                            total: parseFloat(compra.total) || 0
                        }),
                    });

                    if (response.ok) {
                        comprasInsertadas++;
                        // Actualizar inventario también
                        await actualizarInventario({
                            producto: compra.producto,
                            cantidad: parseFloat(compra.cantidad) || 0,
                            precio: parseFloat(compra.precio) || 0
                        });
                    } else {
                        comprasConError++;
                    }
                } catch (error) {
                    console.error('Error al insertar compra:', error);
                    comprasConError++;
                }
            }

            await fetchCompras();
            setShowImportModal(false);
            setImportPreview([]);
            alert(`Importación completada!\n- Compras insertadas: ${comprasInsertadas}\n- Compras con error: ${comprasConError}`);
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

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-CR', {
            style: 'currency',
            currency: 'CRC'
        }).format(amount);
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
                                            <i className="fas fa-shopping-cart text-primary-purple me-2"></i>
                                            Gestión de Compras
                                        </h3>
                                        <p className="text-muted mb-0">
                                            Administra las compras a proveedores
                                        </p>
                                        {usuario && (
                                            <small className="text-primary">
                                                Usuario activo: {usuario.nombre}
                                            </small>
                                        )}
                                    </div>
                                    <div className="d-flex gap-2">
                                        <label className="btn btn-outline-primary-blue m-0">
                                            <i className="fas fa-file-import me-1"></i>
                                            Importar Excel
                                            <input
                                                id="fileInputCompras"
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
                                            Nueva Compra
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
                                                    <i className="fas fa-shopping-cart text-primary-purple fs-4"></i>
                                                </div>
                                            </div>
                                            <div className="flex-grow-1 ms-3">
                                                <div className="fw-bold text-dark fs-4">{compras.length}</div>
                                                <div className="text-muted small">Total Compras</div>
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
                                                    <i className="fas fa-truck text-primary-green fs-4"></i>
                                                </div>
                                            </div>
                                            <div className="flex-grow-1 ms-3">
                                                <div className="fw-bold text-dark fs-4">{proveedores.length}</div>
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
                                                    <i className="fas fa-box text-primary-orange fs-4"></i>
                                                </div>
                                            </div>
                                            <div className="flex-grow-1 ms-3">
                                                <div className="fw-bold text-dark fs-4">{productos.length}</div>
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
                                                <div className="avatar bg-primary-blue bg-opacity-20 rounded-circle p-3">
                                                    <i className="fas fa-dollar-sign text-primary-blue fs-4"></i>
                                                </div>
                                            </div>
                                            <div className="flex-grow-1 ms-3">
                                                <div className="fw-bold text-dark fs-4">
                                                    {formatCurrency(compras.reduce((sum, compra) => sum + parseFloat(compra.total || 0), 0))}
                                                </div>
                                                <div className="text-muted small">Total Invertido</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tabla de Compras */}
                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-white border-0 py-3">
                                <div className="row align-items-center">
                                    <div className="col-md-6">
                                        <h5 className="card-title mb-0 fw-bold">Lista de Compras</h5>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="input-group">
                                            <span className="input-group-text bg-light border-end-0">
                                                <i className="fas fa-search text-muted"></i>
                                            </span>
                                            <input
                                                type="text"
                                                className="form-control border-start-0"
                                                placeholder="Buscar por proveedor o producto..."
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
                                                <th className="border-0 px-4 py-3">Usuario</th>
                                                <th className="border-0 px-4 py-3">Proveedor</th>
                                                <th className="border-0 px-4 py-3">Producto</th>
                                                <th className="border-0 px-4 py-3">Precio Unitario</th>
                                                <th className="border-0 px-4 py-3">Cantidad</th>
                                                <th className="border-0 px-4 py-3">Total</th>
                                                <th className="border-0 px-4 py-3">Fecha</th>
                                                <th className="border-0 px-4 py-3">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentCompras.map((item) => (
                                                <tr key={item.id}>
                                                    <td className="px-4 py-3">
                                                        <div className="fw-medium text-dark">{item.usuario_nombre || getUsuarioNombre(item.usuario) || 'Usuario'}</div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="text-muted">{getProveedorNombre(item.proveedor_id)}</span>
                                                    </td> 
                                                    <td className="px-4 py-3">
                                                        <span className="text-muted">{getProductoNombre(item.producto_id)}</span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="fw-medium">{formatCurrency(item.precio_unitario)}</span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="fw-medium text-dark">{item.cantidad_producto}</span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="fw-bold text-success">{formatCurrency(item.total)}</span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="small text-muted">{formatDate(item.fecha_realizada)}</span>
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
                                            Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, filteredCompras.length)} de {filteredCompras.length} compras
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

            {/* Modal para crear/editar Compra */}
            {showModal && (
                <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {editingCompra ? 'Editar Compra' : 'Nueva Compra'}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={resetForm}
                                ></button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    {usuario && (
                                        <div className="alert alert-info">
                                            <i className="fas fa-user me-2"></i>
                                            <strong>Usuario:</strong> {usuario.nombre}
                                        </div>
                                    )}
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Proveedor *</label>
                                            <select
                                                className="form-select"
                                                name="proveedor"
                                                value={formData.proveedor}
                                                onChange={handleInputChange}
                                                required
                                            >
                                                <option value="">Seleccione un proveedor</option>
                                                {proveedores.map(proveedor => (
                                                    <option key={proveedor.id} value={proveedor.id}>
                                                        {proveedor.nombre}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Fecha de la compra *</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                name="fecha"
                                                value={formData.fecha}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Producto *</label>
                                            <select
                                                className="form-select"
                                                name="producto"
                                                value={formData.producto}
                                                onChange={handleInputChange}
                                                required
                                            >
                                                <option value="">Seleccione un producto</option>
                                                {productos.map(producto => (
                                                    <option key={producto.id} value={producto.id}>
                                                        {producto.nombre}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Cantidad *</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="form-control"
                                                name="cantidad"
                                                value={formData.cantidad}
                                                onChange={handleInputChange}
                                                placeholder="Ej: 100"
                                                required
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Precio unitario *</label>
                                            <div className="input-group">
                                                <span className="input-group-text">₡</span>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    className="form-control"
                                                    name="precio"
                                                    value={formData.precio}
                                                    onChange={handleInputChange}
                                                    placeholder="0.00"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Total</label>
                                            <div className="input-group">
                                                <span className="input-group-text">₡</span>
                                                <input
                                                    type="text"
                                                    className="form-control bg-light"
                                                    value={formData.total}
                                                    readOnly
                                                />
                                            </div>
                                            <small className="text-muted">Se calcula automáticamente</small>
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
                                        {editingCompra ? 'Actualizar' : 'Crear'} Compra
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para importar compras */}
            {showImportModal && (
                <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    <i className="fas fa-file-import me-2"></i>
                                    Vista Previa de Importación de Compras
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
                                            Se encontraron <strong>{importPreview.length}</strong> compras para importar
                                        </p>
                                        <div className="table-responsive">
                                            <table className="table table-sm table-hover">
                                                <thead className="bg-light">
                                                    <tr>
                                                        <th>Proveedor ID</th>
                                                        <th>Producto ID</th>
                                                        <th>Fecha</th>
                                                        <th>Precio</th>
                                                        <th>Cantidad</th>
                                                        <th>Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {importPreview.slice(0, 10).map((compra, idx) => (
                                                        <tr key={idx}>
                                                            <td>{compra.proveedor}</td>
                                                            <td>{compra.producto}</td>
                                                            <td>{compra.fecha}</td>
                                                            <td>{formatCurrency(compra.precio || 0)}</td>
                                                            <td>{compra.cantidad}</td>
                                                            <td>{formatCurrency(compra.total || 0)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        {importPreview.length > 10 && (
                                            <p className="text-muted text-center mt-2">
                                                y {importPreview.length - 10} compras más...
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
        </div>
    );
};

export default Compras;