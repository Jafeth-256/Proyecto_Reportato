import React, { useState, useEffect, useCallback } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import '../styles/custom.css';
import useReports from '../hooks/useReports';
import API_BASE_URL from '../config/api';
import * as XLSX from 'xlsx';

const VentasDiarias = () => {
  const [ventas, setVentas] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);
  const [filtroFechaInicio, setFiltroFechaInicio] = useState('');
  const [filtroFechaFin, setFiltroFechaFin] = useState('');
  const [filtroSucursal, setFiltroSucursal] = useState('');
  const [importingFile, setImportingFile] = useState(false);
  const [importPreview, setImportPreview] = useState([]);
  const [importErrors, setImportErrors] = useState([]);
  const { generateDailyReport, isGenerating, error, clearError } = useReports();


  const [formData, setFormData] = useState({
    sucursal_id: '',
    fecha_venta: new Date().toISOString().split('T')[0],
    venta_efectivo: '',
    venta_tarjeta: '',
    venta_sinpe: '',
    observaciones: '',
    estado: 'pendiente'
  });

  const fetchVentas = useCallback(async () => {
    try {
      setLoading(true);
      let url = `${API_BASE_URL}/ventas-diarias`;
      const params = new URLSearchParams();

      if (filtroFechaInicio) {
        params.append('fecha_inicio', filtroFechaInicio);
      }
      if (filtroFechaFin) {
        // Agregar 1 día para incluir todo el día final (fecha_fin <= fecha_venta)
        const fechaFin = new Date(filtroFechaFin);
        fechaFin.setDate(fechaFin.getDate() + 1);
        const fechaFinAjustada = fechaFin.toISOString().split('T')[0];
        params.append('fecha_fin', fechaFinAjustada);
      }
      if (filtroSucursal) {
        params.append('sucursal_id', filtroSucursal);
      }

      if (params.toString()) {
        url += '?' + params.toString();
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setVentas(data);
      } else {
        console.error('Error al obtener ventas');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [filtroFechaInicio, filtroFechaFin, filtroSucursal]);

  const fetchSucursales = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/sucursales/activas`);
      if (response.ok) {
        const data = await response.json();
        setSucursales(data);
      } else {
        console.error('Error al obtener sucursales');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchEstadisticas = useCallback(async () => {
    try {
      let url = `${API_BASE_URL}/ventas-diarias/estadisticas`;
      const params = new URLSearchParams();

      if (filtroFechaInicio) {
        params.append('fecha_inicio', filtroFechaInicio);
      }
      if (filtroFechaFin) {
        // Agregar 1 día para incluir todo el día final (fecha_fin <= fecha_venta)
        const fechaFin = new Date(filtroFechaFin);
        fechaFin.setDate(fechaFin.getDate() + 1);
        const fechaFinAjustada = fechaFin.toISOString().split('T')[0];
        params.append('fecha_fin', fechaFinAjustada);
      }

      if (params.toString()) {
        url += '?' + params.toString();
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setEstadisticas(data);
      }
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
    }
  }, [filtroFechaInicio, filtroFechaFin]);

  // Cargar datos desde la API
  useEffect(() => {
    fetchVentas();
    fetchSucursales();
    fetchEstadisticas();
  }, [fetchVentas, fetchEstadisticas]);


  const handleGenerateReport = async () => {
    const filters = {
      fechaInicio: filtroFechaInicio,
      fechaFin: filtroFechaFin,
      sucursal: filtroSucursal
    };

    const result = await generateDailyReport(ventas, estadisticas, filters, sucursales);

    if (result.success) {
      console.log('Reporte generado exitosamente:', result.filename);
    } else {
      console.error('Error al generar reporte:', result.error);
    }
  };

  // Filtrar ventas por búsqueda
  const filteredVentas = ventas.filter(item =>
    item.sucursal_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sucursal_tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.estado.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.observaciones?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Agrupar ventas por sucursal
  const groupedVentas = filteredVentas.reduce((acc, venta) => {
    const sucursalId = venta.sucursal_id;
    if (!acc[sucursalId]) {
      acc[sucursalId] = {
        sucursal_id: venta.sucursal_id,
        sucursal_nombre: venta.sucursal_nombre,
        sucursal_tipo: venta.sucursal_tipo,
        sucursal_ubicacion: venta.sucursal_ubicacion,
        ventas: [],
        total_efectivo: 0,
        total_tarjeta: 0,
        total_sinpe: 0,
        total_ventas: 0,
        cantidad_registros: 0
      };
    }
    acc[sucursalId].ventas.push(venta);
    acc[sucursalId].total_efectivo += parseFloat(venta.venta_efectivo) || 0;
    acc[sucursalId].total_tarjeta += parseFloat(venta.venta_tarjeta) || 0;
    acc[sucursalId].total_sinpe += parseFloat(venta.venta_sinpe) || 0;
    acc[sucursalId].total_ventas += parseFloat(venta.venta_total) || 0;
    acc[sucursalId].cantidad_registros += 1;
    return acc;
  }, {});

  // Convertir a array y ordenar por sucursal_nombre
  const groupedVentasArray = Object.values(groupedVentas).sort((a, b) =>
    a.sucursal_nombre.localeCompare(b.sucursal_nombre)
  );

  // Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = groupedVentasArray.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(groupedVentasArray.length / itemsPerPage);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar campos completos
    if (!formData.sucursal_id || !formData.sucursal_id.trim()) {
      alert('Por favor selecciona una sucursal');
      return;
    }

    if (!formData.fecha_venta || !formData.fecha_venta.trim()) {
      alert('Por favor selecciona una fecha de venta');
      return;
    }

    // Validar que al menos uno de los montos esté completo
    const efectivo = parseFloat(formData.venta_efectivo) || 0;
    const tarjeta = parseFloat(formData.venta_tarjeta) || 0;
    const sinpe = parseFloat(formData.venta_sinpe) || 0;

    if (efectivo === 0 && tarjeta === 0 && sinpe === 0) {
      alert('Por favor ingresa al menos un monto de venta (Efectivo, Tarjeta o SINPE)');
      return;
    }

    if (!formData.estado || !formData.estado.trim()) {
      alert('Por favor selecciona un estado para la venta');
      return;
    }

    try {
      const url = editingItem
        ? `${API_BASE_URL}/ventas-diarias/${editingItem.id}`
        : `${API_BASE_URL}/ventas-diarias`;

      const method = editingItem ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchVentas();
        await fetchEstadisticas();
        resetForm();
        // Mostrar mensaje de éxito
        alert(editingItem ? 'Venta actualizada exitosamente' : 'Venta registrada exitosamente');
      } else {
        const error = await response.json();
        alert(error.message || 'Error al guardar venta');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar venta. Por favor intenta nuevamente.');
    }
  };

  const resetForm = () => {
    setFormData({
      sucursal_id: '',
      fecha_venta: new Date().toISOString().split('T')[0],
      venta_efectivo: '',
      venta_tarjeta: '',
      venta_sinpe: '',
      observaciones: '',
      estado: 'pendiente'
    });
    setEditingItem(null);
    setShowModal(false);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      sucursal_id: String(item.sucursal_id), // Convertir a string para que coincida con el select
      fecha_venta: item.fecha_venta, // La fecha se cargará correctamente
      venta_efectivo: item.venta_efectivo || '',
      venta_tarjeta: item.venta_tarjeta || '',
      venta_sinpe: item.venta_sinpe || '',
      observaciones: item.observaciones || '',
      estado: item.estado
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este registro de venta?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/ventas-diarias/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          await fetchVentas();
          await fetchEstadisticas();
        } else {
          console.error('Error al eliminar venta');
        }
      } catch (error) {
        console.error('Error:', error);
      }
    }
  };

  const handleChangeStatus = async (id, newStatus) => {
    try {
      const response = await fetch(`${API_BASE_URL}/ventas-diarias/${id}/estado`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estado: newStatus }),
      });

      if (response.ok) {
        await fetchVentas();
        await fetchEstadisticas();
      } else {
        console.error('Error al cambiar estado');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const closeImportModal = () => {
    setShowImportModal(false);
    setImportPreview([]);
    setImportErrors([]);
    const fileInput = document.getElementById('fileInputVentas');
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
          const worksheet = workbook.Sheets['ventas'];

          if (!worksheet) {
            setImportErrors(['No se encontró la hoja "ventas" en el archivo Excel']);
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
      let ventasInsertadas = 0;
      let ventasConError = 0;

      for (const venta of importPreview) {
        try {
          const response = await fetch(`${API_BASE_URL}/ventas-diarias`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sucursal_id: venta.sucursal_id,
              fecha_venta: venta.fecha_venta,
              venta_efectivo: venta.venta_efectivo || 0,
              venta_tarjeta: venta.venta_tarjeta || 0,
              venta_sinpe: venta.venta_sinpe || 0,
              observaciones: venta.observaciones || '',
              estado: venta.estado || 'pendiente'
            }),
          });

          if (response.ok) {
            ventasInsertadas++;
          } else {
            ventasConError++;
          }
        } catch (error) {
          console.error('Error al insertar venta:', error);
          ventasConError++;
        }
      }

      await fetchVentas();
      await fetchEstadisticas();
      setShowImportModal(false);
      setImportPreview([]);
      alert(`Importación completada!\n- Ventas insertadas: ${ventasInsertadas}\n- Ventas con error: ${ventasConError}`);
    } catch (error) {
      console.error('Error:', error);
      setImportErrors(['Error al procesar la importación']);
    } finally {
      setImportingFile(false);
    }
  };

  const formatCurrency = (amount) => {
    return `₡${parseFloat(amount || 0).toLocaleString('es-CR', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const getStatusBadgeClass = (estado) => {
    switch (estado) {
      case 'pendiente':
        return 'bg-warning bg-opacity-20 text-warning';
      case 'confirmada':
        return 'bg-success bg-opacity-20 text-success';
      case 'cerrada':
        return 'bg-primary bg-opacity-20 text-primary';
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
            {/* Header */}
            <div className="row mb-4">
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
                      Exportar PDF
                    </>
                  )}
                </button>

                <label className="btn btn-outline-primary-blue m-0">
                  <i className="fas fa-file-import me-1"></i>
                  Importar Excel
                  <input
                    id="fileInputVentas"
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
                  Registrar Venta
                </button>
              </div>
            </div>


            {/* Estadísticas */}
            {estadisticas && (
              <div className="row mb-4">
                <div className="col-xl-3 col-md-6 mb-3">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body">
                      <div className="d-flex align-items-center">
                        <div className="flex-shrink-0">
                          <div className="avatar bg-primary-purple bg-opacity-20 rounded-circle p-3">
                            <i className="fas fa-chart-line text-primary-purple fs-4"></i>
                          </div>
                        </div>
                        <div className="flex-grow-1 ms-3">
                          <div className="fw-bold text-dark fs-4">
                            {formatCurrency(estadisticas.total_ventas)}
                          </div>
                          <div className="text-muted small">Total Ventas</div>
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
                            <i className="fas fa-money-bill text-primary-green fs-4"></i>
                          </div>
                        </div>
                        <div className="flex-grow-1 ms-3">
                          <div className="fw-bold text-dark fs-4">
                            {formatCurrency(estadisticas.total_efectivo)}
                          </div>
                          <div className="text-muted small">Efectivo</div>
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
                            <i className="fas fa-credit-card text-primary-orange fs-4"></i>
                          </div>
                        </div>
                        <div className="flex-grow-1 ms-3">
                          <div className="fw-bold text-dark fs-4">
                            {formatCurrency(estadisticas.total_tarjeta)}
                          </div>
                          <div className="text-muted small">Tarjetas</div>
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
                            <i className="fas fa-mobile-alt text-primary-blue fs-4"></i>
                          </div>
                        </div>
                        <div className="flex-grow-1 ms-3">
                          <div className="fw-bold text-dark fs-4">
                            {formatCurrency(estadisticas.total_sinpe)}
                          </div>
                          <div className="text-muted small">SINPE</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="row mb-3">
                <div className="col-12">
                  <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    {error}
                    <button
                      type="button"
                      className="btn-close"
                      onClick={clearError}
                      aria-label="Close"
                    ></button>
                  </div>
                </div>
              </div>
            )}

            {/* Filtros */}
            {(
              <div className="card border-0 shadow-sm mb-4">
                <div className="card-body">
                  <div className="row align-items-end">
                    <div className="col-md-2 mb-3">
                      <label className="form-label small fw-medium">Desde</label>
                      <input
                        type="date"
                        className="form-control"
                        value={filtroFechaInicio}
                        onChange={(e) => setFiltroFechaInicio(e.target.value)}
                      />
                    </div>
                    <div className="col-md-2 mb-3">
                      <label className="form-label small fw-medium">Hasta</label>
                      <input
                        type="date"
                        className="form-control"
                        value={filtroFechaFin}
                        onChange={(e) => setFiltroFechaFin(e.target.value)}
                      />
                    </div>
                    <div className="col-md-2 mb-3">
                      <label className="form-label small fw-medium">Sucursal</label>
                      <select
                        className="form-select"
                        value={filtroSucursal}
                        onChange={(e) => setFiltroSucursal(e.target.value)}
                      >
                        <option value="">Todas</option>
                        {sucursales.map((sucursal) => (
                          <option key={sucursal.id} value={sucursal.id}>
                            {sucursal.nombre} - {sucursal.tipo}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label small fw-medium">Buscar</label>
                      <div className="input-group">
                        <span className="input-group-text bg-light border-end-0">
                          <i className="fas fa-search text-muted"></i>
                        </span>
                        <input
                          type="text"
                          className="form-control border-start-0"
                          placeholder="Buscar en ventas..." value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-md-2 mb-3">
                      <label className="form-label small fw-medium text-white">.</label>
                      <button
                        className="btn btn-outline-secondary w-100"
                        onClick={() => {
                          setFiltroFechaInicio('');
                          setFiltroFechaFin('');
                          setFiltroSucursal('');
                          setSearchTerm('');
                        }}
                      >
                        <i className="fas fa-times me-1"></i>
                        Limpiar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tabla de ventas agrupadas por sucursal */}
            {(
              <>
                {currentItems.length > 0 ? (
                  currentItems.map((sucursalGroup) => (
                    <div key={sucursalGroup.sucursal_id} className="card border-0 shadow-sm mb-4">
                      {/* Header de sucursal con totales */}
                      <div className="card-header bg-light border-0">
                        <div className="row align-items-center">
                          <div className="col-md-4">
                            <h6 className="mb-1 fw-bold text-dark">
                              {sucursalGroup.sucursal_nombre}
                            </h6>
                            <div className="small">
                              <span className={`badge ${getTipoBadgeClass(sucursalGroup.sucursal_tipo)} me-2`}>
                                {sucursalGroup.sucursal_tipo}
                              </span>
                              <span className="text-muted">{sucursalGroup.sucursal_ubicacion}</span>
                            </div>
                          </div>
                          <div className="col-md-8">
                            <div className="row text-center">
                              <div className="col-md-3">
                                <small className="text-muted d-block">Efectivo</small>
                                <strong className="text-primary-green">{formatCurrency(sucursalGroup.total_efectivo)}</strong>
                              </div>
                              <div className="col-md-3">
                                <small className="text-muted d-block">Tarjeta</small>
                                <strong className="text-primary-orange">{formatCurrency(sucursalGroup.total_tarjeta)}</strong>
                              </div>
                              <div className="col-md-3">
                                <small className="text-muted d-block">SINPE</small>
                                <strong className="text-primary-blue">{formatCurrency(sucursalGroup.total_sinpe)}</strong>
                              </div>
                              <div className="col-md-3">
                                <small className="text-muted d-block">Total ({sucursalGroup.cantidad_registros})</small>
                                <strong className="text-primary-purple">{formatCurrency(sucursalGroup.total_ventas)}</strong>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Tabla de ventas individuales */}
                      <div className="card-body p-0">
                        <div className="table-responsive">
                          <table className="table table-hover mb-0">
                            <thead className="bg-light">
                              <tr>
                                <th className="border-0 fw-medium text-muted small px-4 py-3">Fecha</th>
                                <th className="border-0 fw-medium text-muted small py-3">Efectivo</th>
                                <th className="border-0 fw-medium text-muted small py-3">Tarjeta</th>
                                <th className="border-0 fw-medium text-muted small py-3">SINPE</th>
                                <th className="border-0 fw-medium text-muted small py-3">Total</th>
                                <th className="border-0 fw-medium text-muted small py-3">Estado</th>
                                <th className="border-0 fw-medium text-muted small py-3">Acciones</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sucursalGroup.ventas.map((venta) => (
                                <tr key={venta.id}>
                                  <td className="px-4 py-3">
                                    <div className="text-dark">{formatDate(venta.fecha_venta)}</div>
                                  </td>
                                  <td className="py-3">
                                    <div className="text-dark fw-medium">{formatCurrency(venta.venta_efectivo)}</div>
                                  </td>
                                  <td className="py-3">
                                    <div className="text-dark fw-medium">{formatCurrency(venta.venta_tarjeta)}</div>
                                  </td>
                                  <td className="py-3">
                                    <div className="text-dark fw-medium">{formatCurrency(venta.venta_sinpe)}</div>
                                  </td>
                                  <td className="py-3">
                                    <div className="text-dark fw-bold">{formatCurrency(venta.venta_total)}</div>
                                  </td>
                                  <td className="py-3">
                                    <div className="dropdown">
                                      <span
                                        className={`badge ${getStatusBadgeClass(venta.estado)} dropdown-toggle`}
                                        style={{ cursor: 'pointer' }}
                                        data-bs-toggle="dropdown"
                                      >
                                        {venta.estado}
                                      </span>
                                      <ul className="dropdown-menu">
                                        <li>
                                          <button
                                            className="dropdown-item"
                                            onClick={() => handleChangeStatus(venta.id, 'pendiente')}
                                          >
                                            Pendiente
                                          </button>
                                        </li>
                                        <li>
                                          <button
                                            className="dropdown-item"
                                            onClick={() => handleChangeStatus(venta.id, 'confirmada')}
                                          >
                                            Confirmada
                                          </button>
                                        </li>
                                        <li>
                                          <button
                                            className="dropdown-item"
                                            onClick={() => handleChangeStatus(venta.id, 'cerrada')}
                                          >
                                            Cerrada
                                          </button>
                                        </li>
                                      </ul>
                                    </div>
                                  </td>
                                  <td className="py-3">
                                    <div className="d-flex gap-2">
                                      <button
                                        className="btn btn-sm btn-outline-primary"
                                        onClick={() => handleEdit(venta)}
                                        title="Editar"
                                      >
                                        <i className="fas fa-edit"></i>
                                      </button>
                                      <button
                                        className="btn btn-sm btn-outline-danger"
                                        onClick={() => handleDelete(venta.id)}
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
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="card border-0 shadow-sm">
                    <div className="card-body text-center py-5">
                      <div className="text-muted">
                        <i className="fas fa-inbox fa-3x mb-3 text-muted opacity-50"></i>
                        <div>No se encontraron registros de ventas</div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-between align-items-center mt-4">
                <div className="text-muted small">
                  Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, groupedVentasArray.length)} de {groupedVentasArray.length} sucursales
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
                      <li key={index + 1} className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}>
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

      {/* Modal para importar ventas */}
      {showImportModal && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-file-import me-2"></i>
                  Vista Previa de Importación de Ventas
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
                      Se encontraron <strong>{importPreview.length}</strong> ventas para importar
                    </p>
                    <div className="table-responsive">
                      <table className="table table-sm table-hover">
                        <thead className="bg-light">
                          <tr>
                            <th>Sucursal ID</th>
                            <th>Fecha</th>
                            <th>Efectivo</th>
                            <th>Tarjeta</th>
                            <th>SINPE</th>
                            <th>Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importPreview.slice(0, 10).map((venta, idx) => (
                            <tr key={idx}>
                              <td>{venta.sucursal_id}</td>
                              <td>{venta.fecha_venta}</td>
                              <td>{formatCurrency(venta.venta_efectivo || 0)}</td>
                              <td>{formatCurrency(venta.venta_tarjeta || 0)}</td>
                              <td>{formatCurrency(venta.venta_sinpe || 0)}</td>
                              <td>
                                <span className={`badge ${
                                  (venta.estado || 'pendiente') === 'pendiente'
                                    ? 'bg-warning bg-opacity-20 text-warning'
                                    : (venta.estado || 'pendiente') === 'confirmada'
                                    ? 'bg-success bg-opacity-20 text-success'
                                    : 'bg-primary bg-opacity-20 text-primary'
                                }`}>
                                  {venta.estado || 'pendiente'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {importPreview.length > 10 && (
                      <p className="text-muted text-center mt-2">
                        y {importPreview.length - 10} ventas más...
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

      {/* Modal para crear/editar */}
      {showModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingItem ? 'Editar Venta Diaria' : 'Registrar Venta Diaria'}
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
                      <label className="form-label">Sucursal *</label>
                      <select
                        className="form-select"
                        name="sucursal_id"
                        value={formData.sucursal_id}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Seleccionar sucursal</option>
                        {sucursales.map((sucursal) => (
                          <option key={sucursal.id} value={sucursal.id}>
                            {sucursal.nombre} - {sucursal.tipo}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Fecha de Venta *</label>
                      <input
                        type="date"
                        className="form-control"
                        name="fecha_venta"
                        value={formData.fecha_venta}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Venta en Efectivo</label>
                      <div className="input-group">
                        <span className="input-group-text">₡</span>
                        <input
                          type="number"
                          className="form-control"
                          name="venta_efectivo"
                          value={formData.venta_efectivo}
                          onChange={handleInputChange}
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Venta con Tarjeta</label>
                      <div className="input-group">
                        <span className="input-group-text">₡</span>
                        <input
                          type="number"
                          className="form-control"
                          name="venta_tarjeta"
                          value={formData.venta_tarjeta}
                          onChange={handleInputChange}
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Venta SINPE</label>
                      <div className="input-group">
                        <span className="input-group-text">₡</span>
                        <input
                          type="number"
                          className="form-control"
                          name="venta_sinpe"
                          value={formData.venta_sinpe}
                          onChange={handleInputChange}
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Estado</label>
                      <select
                        className="form-select"
                        name="estado"
                        value={formData.estado}
                        onChange={handleInputChange}
                      >
                        <option value="pendiente">Pendiente</option>
                        <option value="confirmada">Confirmada</option>
                        <option value="cerrada">Cerrada</option>
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Total</label>
                      <div className="input-group">
                        <span className="input-group-text">₡</span>
                        <input
                          type="text"
                          className="form-control bg-light"
                          value={formatCurrency(
                            (parseFloat(formData.venta_efectivo) || 0) +
                            (parseFloat(formData.venta_tarjeta) || 0) +
                            (parseFloat(formData.venta_sinpe) || 0)
                          )}
                          readOnly
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Observaciones</label>
                    <textarea
                      className="form-control"
                      name="observaciones"
                      value={formData.observaciones}
                      onChange={handleInputChange}
                      rows="3"
                      placeholder="Observaciones adicionales..."
                    ></textarea>
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
                    {editingItem ? 'Actualizar' : 'Registrar'}
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

export default VentasDiarias;