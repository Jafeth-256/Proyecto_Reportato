import { useState } from 'react';
import ReportService from '../services/ReportService';

const useReports = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  const generateDailyReport = async (ventas, estadisticas, filters = {}, sucursales = []) => {
    try {
      setIsGenerating(true);
      setError(null);

      const reportService = new ReportService();
      const processedFilters = {};

      // Handle date range filters
      if (filters.fechaInicio) {
        processedFilters.fechaInicio = new Date(filters.fechaInicio).toLocaleDateString('es-ES');
      }

      if (filters.fechaFin) {
        processedFilters.fechaFin = new Date(filters.fechaFin).toLocaleDateString('es-ES');
      }

      // Fallback for single date filter (for backward compatibility)
      if (filters.fecha && !filters.fechaInicio && !filters.fechaFin) {
        processedFilters.fecha = new Date(filters.fecha).toLocaleDateString('es-ES');
      }

      if (filters.sucursal) {
        const sucursal = sucursales.find(s => s.id == filters.sucursal);
        processedFilters.sucursal = sucursal ? `${sucursal.nombre} (${sucursal.tipo})` : 'Sucursal seleccionada';
      }

      const doc = reportService.generateDailyReport(ventas, estadisticas, processedFilters);
      const filename = `reporte_ventas_diarias_${new Date().toISOString().split('T')[0]}.pdf`;
      reportService.downloadPDF(filename);
      return { success: true, filename };
    } catch (err) {
      console.error('Error al generar reporte:', err);
      setError('Error al generar el reporte PDF');
      return { success: false, error: err.message };
    } finally {
      setIsGenerating(false);
    }
  };

  const generateWeeklyReport = async (weeklyData, estadisticas, filters = {}, sucursales = []) => {
    try {
      setIsGenerating(true);
      setError(null);

      const reportService = new ReportService();
      const processedFilters = {};

      if (filters.fecha) {
        processedFilters.fecha = new Date(filters.fecha).toLocaleDateString('es-ES');
      }

      if (filters.sucursal) {
        const sucursal = sucursales.find(s => s.id == filters.sucursal);
        processedFilters.sucursal = sucursal ? `${sucursal.nombre} (${sucursal.tipo})` : 'Sucursal seleccionada';
      }

      const doc = reportService.generateWeeklyReport(weeklyData, estadisticas, processedFilters);
      const filename = `reporte_ventas_semanales_${new Date().toISOString().split('T')[0]}.pdf`;
      reportService.downloadPDF(filename);
      return { success: true, filename };
    } catch (err) {
      console.error('Error al generar reporte:', err);
      setError('Error al generar el reporte PDF');
      return { success: false, error: err.message };
    } finally {
      setIsGenerating(false);
    }
  };

  const generateWeeklyReportBySucursal = async (ventas) => {
    try {
      setIsGenerating(true);
      setError(null);

      const reportService = new ReportService();
      const doc = reportService.generateWeeklyReportBySucursal(ventas);
      const filename = `reporte_semanal_por_sucursal_${new Date().toISOString().split('T')[0]}.pdf`;
      reportService.downloadPDF(filename);
      return { success: true, filename };
    } catch (err) {
      console.error('Error al generar reporte por sucursal:', err);
      setError('Error al generar el reporte PDF por sucursal');
      return { success: false, error: err.message };
    } finally {
      setIsGenerating(false);
    }
  };

  const generateComparativeReport = async (ventas, estadisticas, filters = {}) => {
    try {
      setIsGenerating(true);
      setError(null);

      const reportService = new ReportService();
      const doc = reportService.generateDailyReport(ventas, estadisticas, filters);
      const filename = `reporte_comparativo_${new Date().toISOString().split('T')[0]}.pdf`;
      reportService.downloadPDF(filename);
      return { success: true, filename };
    } catch (err) {
      console.error('Error al generar reporte:', err);
      setError('Error al generar el reporte PDF');
      return { success: false, error: err.message };
    } finally {
      setIsGenerating(false);
    }
  };

  const generateInventoryReport = async (inventory, filters = {}, includeZeroStock = false) => {
    try {
      setIsGenerating(true);
      setError(null);

      const reportService = new ReportService();

      // Filtrar productos según la opción de incluir productos sin stock
      const filteredInventory = includeZeroStock 
        ? inventory 
        : inventory.filter(item => item.stock_actual > 0);

      const doc = reportService.generateInventoryReport(filteredInventory, filters, includeZeroStock);
      const filename = `reporte_inventario_${new Date().toISOString().split('T')[0]}.pdf`;
      reportService.downloadPDF(filename);
      return { success: true, filename };
    } catch (err) {
      console.error('Error al generar reporte de inventario:', err);
      setError('Error al generar el reporte PDF de inventario');
      return { success: false, error: err.message };
    } finally {
      setIsGenerating(false);
    }
  };

  const generateProductReport = async (products, filters = {}) => {
    try {
      setIsGenerating(true);
      setError(null);

      const reportService = new ReportService();
      reportService.generateProductReport(products, filters);
      const filename = `reporte_productos_${new Date().toISOString().split('T')[0]}.pdf`;
      reportService.downloadPDF(filename);
      return { success: true, filename };
    } catch (err) {
      console.error('Error al generar reporte de productos:', err);
      setError('Error al generar el reporte PDF de productos');
      return { success: false, error: err.message };
    } finally {
      setIsGenerating(false);
    }
  };

  const generateSupplierReport = async (suppliers, filters = {}, includeInactive = false) => {
    try {
      setIsGenerating(true);
      setError(null);

      const reportService = new ReportService();
      reportService.generateSupplierReport(suppliers, filters, includeInactive);
      const filename = `reporte_proveedores_${new Date().toISOString().split('T')[0]}.pdf`;
      reportService.downloadPDF(filename);
      return { success: true, filename };
    } catch (err) {
      console.error('Error al generar reporte de proveedores:', err);
      setError('Error al generar el reporte PDF de proveedores');
      return { success: false, error: err.message };
    } finally {
      setIsGenerating(false);
    }
  };

  const generateCuentasPorPagarReport = async (facturas, filters = {}) => {
    try {
      setIsGenerating(true);
      setError(null);

      const reportService = new ReportService();
      reportService.generateCuentasPorPagarReport(facturas, filters);
      const filename = `reporte_cuentas_por_pagar_${new Date().toISOString().split('T')[0]}.pdf`;
      reportService.downloadPDF(filename);
      return { success: true, filename };
    } catch (err) {
      console.error('Error al generar reporte de cuentas por pagar:', err);
      setError('Error al generar el reporte PDF de cuentas por pagar');
      return { success: false, error: err.message };
    } finally {
      setIsGenerating(false);
    }
  };

  const generateCuentasPorCobrarReport = async (facturas, filters = {}) => {
    try {
      setIsGenerating(true);
      setError(null);

      const reportService = new ReportService();
      reportService.generateCuentasPorCobrarReport(facturas, filters);
      const filename = `reporte_cuentas_por_cobrar_${new Date().toISOString().split('T')[0]}.pdf`;
      reportService.downloadPDF(filename);
      return { success: true, filename };
    } catch (err) {
      console.error('Error al generar reporte de cuentas por cobrar:', err);
      setError('Error al generar el reporte PDF de cuentas por cobrar');
      return { success: false, error: err.message };
    } finally {
      setIsGenerating(false);
    }
  };
const generateClientReport = async (clients, filters = {}, includeInactive = false) => {
  try {
    setIsGenerating(true);
    setError(null);

    const reportService = new ReportService();
    const doc = reportService.generateClientReport(clients, filters, includeInactive);
    const filename = `reporte_clientes_${new Date().toISOString().split('T')[0]}.pdf`;
    reportService.downloadPDF(filename);
    return { success: true, filename };
  } catch (err) {
    console.error('Error al generar reporte de clientes:', err);
    setError('Error al generar el reporte PDF de clientes');
    return { success: false, error: err.message };
  } finally {
    setIsGenerating(false);
  }
};

const generatePurchaseReport = async (compras, filters = {}) => {
  try {
    setIsGenerating(true);
    setError(null);

    const reportService = new ReportService();
    reportService.generatePurchaseReport(compras, filters);
    const filename = `reporte_compras_${new Date().toISOString().split('T')[0]}.pdf`;
    reportService.downloadPDF(filename);
    return { success: true, filename };
  } catch (err) {
    console.error('Error al generar reporte de compras:', err);
    setError('Error al generar el reporte PDF de compras');
    return { success: false, error: err.message };
  } finally {
    setIsGenerating(false);
  }
};


  return {
    generateDailyReport,
    generateWeeklyReport,
    generateWeeklyReportBySucursal,
    generateInventoryReport,
    generateProductReport,
    generateSupplierReport,
    generateCuentasPorPagarReport,
    generateCuentasPorCobrarReport,
    generateComparativeReport,
    generateClientReport,
    generatePurchaseReport,
    isGenerating,
    error,
    clearError: () => setError(null)
  };
};

export default useReports;
