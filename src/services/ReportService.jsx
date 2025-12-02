import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';



class ReportService {
  constructor() {
    this.doc = null;
    this.currentY = 0;
  }

  colors = {
    primary: '#2E7D32',
    secondary: '#1976D2',
    accent: '#FF9800',
    purple: '#7B1FA2',
    success: '#4CAF50',
    warning: '#FF9800',
    danger: '#F44336',
    dark: '#212529',
    light: '#F8F9FA'
  };

  initDocument() {
    this.doc = new jsPDF();
    this.currentY = 20;
  }

  addHeader(title, subtitle = '', filters = {}) {
    const pageWidth = this.doc.internal.pageSize.width;

    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(this.colors.primary);
    this.doc.text('SISTEMA DE VENTAS', pageWidth / 2, this.currentY, { align: 'center' });

    this.currentY += 10;

    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(this.colors.dark);
    this.doc.text(title, pageWidth / 2, this.currentY, { align: 'center' });

    this.currentY += 8;

    if (subtitle) {
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(this.colors.secondary);
      this.doc.text(subtitle, pageWidth / 2, this.currentY, { align: 'center' });
      this.currentY += 8;
    }

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(this.colors.dark);
    this.doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}`, 
                  pageWidth - 20, this.currentY, { align: 'right' });

    this.currentY += 10;
  }

  formatCurrency(amount) {
    return `CRC ${parseFloat(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  }

  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US');
  }

  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  addFooter() {
    const pageHeight = this.doc.internal.pageSize.height;
    const pageWidth = this.doc.internal.pageSize.width;

    this.doc.setDrawColor(this.colors.light);
    this.doc.setLineWidth(0.5);
    this.doc.line(20, pageHeight - 20, pageWidth - 20, pageHeight - 20);

    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(this.colors.secondary);
    this.doc.text('Sistema de Gestión de Ventas - Generado automáticamente', 
                  pageWidth / 2, pageHeight - 10, { align: 'center' });
  }

  generateWeeklyReportBySucursal(ventas) {
    this.initDocument();

    const semanas = {};
    ventas.forEach(venta => {
      const fecha = new Date(venta.fecha_venta);
      const dia = fecha.getDay();
      const diferencia = (dia >= 2) ? dia - 2 : dia + 5;
      const inicio = new Date(fecha);
      inicio.setDate(fecha.getDate() - diferencia);
      inicio.setHours(0, 0, 0, 0);

      const clave = inicio.toISOString().split('T')[0];
      if (!semanas[clave]) semanas[clave] = [];
      semanas[clave].push(venta);
    });

    const sortedSemanas = Object.entries(semanas).sort(
      ([a], [b]) => new Date(a) - new Date(b)
    );

    sortedSemanas.forEach(([fechaInicio, ventasSemana]) => {
      const inicio = new Date(fechaInicio);
      const fin = new Date(inicio);
      fin.setDate(inicio.getDate() + 6);

      this.doc.setFontSize(14);
      this.doc.setTextColor(this.colors.primary);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(`Semana del ${this.formatDate(inicio)} al ${this.formatDate(fin)}`, 20, this.currentY);
      this.currentY += 8;

      const sucursales = ventasSemana.reduce((acc, venta) => {
        const key = venta.sucursal_nombre;
        if (!acc[key]) acc[key] = [];
        acc[key].push(venta);
        return acc;
      }, {});

      Object.entries(sucursales).forEach(([sucursal, ventasSucursal]) => {
        this.doc.setFontSize(12);
        this.doc.setTextColor(this.colors.dark);
        this.doc.text(`Sucursal: ${sucursal}`, 20, this.currentY);
        this.currentY += 6;

        const tableData = ventasSucursal.map(v => [
          v.sucursal_tipo,
          this.formatDate(v.fecha_venta),
          this.formatCurrency(v.venta_efectivo),
          this.formatCurrency(v.venta_tarjeta),
          this.formatCurrency(v.venta_sinpe),
          this.formatCurrency(v.venta_total),
          this.capitalizeFirst(v.estado)
        ]);

        autoTable(this.doc, {
          head: [['Tipo', 'Fecha', 'Efectivo', 'Tarjeta', 'SINPE', 'Total', 'Estado']],
          body: tableData,
          startY: this.currentY,
          theme: 'grid',
          headStyles: {
            fillColor: [46, 125, 50],
            textColor: 255,
            fontSize: 9,
            fontStyle: 'bold'
          },
          bodyStyles: {
            fontSize: 8,
            textColor: [33, 37, 41]
          },
          styles: {
            overflow: 'linebreak',
            cellPadding: 2
          },
          columnStyles: {
            0: { cellWidth: 'wrap' },
            1: { cellWidth: 'wrap' },
            2: { halign: 'right' },
            3: { halign: 'right' },
            4: { halign: 'right' },
            5: { halign: 'right', fontStyle: 'bold' },
            6: { halign: 'center' }
          },
          margin: { left: 20, right: 20 }
        });

        this.currentY = this.doc.lastAutoTable.finalY + 10;
      });

      this.doc.setDrawColor(this.colors.light);
      this.doc.line(20, this.currentY, this.doc.internal.pageSize.width - 20, this.currentY);
      this.currentY += 10;
    });

    this.addFooter();
    return this.doc;
  }

  downloadPDF(filename = 'reporte.pdf') {
    if (this.doc) {
      this.doc.save(filename);
    }
  }

  getPDFBlob() {
    if (this.doc) {
      return this.doc.output('blob');
    }
    return null;
  }

  generateDailyReport(ventas, estadisticas, filters = {}) {
    this.initDocument();

    // Header
    this.addHeader('REPORTE DE VENTAS DIARIAS - AGRUPADO POR SUCURSAL', 'Detalle de ventas agrupadas por sucursal', filters);

    // Estadísticas (totales generales)
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(this.colors.dark);
    this.doc.text(`Resumen General`, 20, this.currentY);
    this.currentY += 10;

    const statsData = [
      ['Concepto', 'Monto'],
      ['Total Ventas', this.formatCurrency(estadisticas.total_ventas)],
      ['Efectivo', this.formatCurrency(estadisticas.total_efectivo)],
      ['Tarjeta', this.formatCurrency(estadisticas.total_tarjeta)],
      ['SINPE', this.formatCurrency(estadisticas.total_sinpe)]
    ];

    autoTable(this.doc, {
      head: [statsData[0]],
      body: statsData.slice(1),
      startY: this.currentY,
      theme: 'grid',
      headStyles: {
        fillColor: [46, 125, 50],
        textColor: 255,
        fontStyle: 'bold'
      },
      bodyStyles: {
        textColor: [33, 37, 41],
        fontSize: 9
      },
      styles: {
        overflow: 'linebreak',
        cellPadding: 2
      },
      margin: { left: 20, right: 20 }
    });

    this.currentY = this.doc.lastAutoTable.finalY + 15;

    // Verificar si hay ventas
    if (!ventas || ventas.length === 0) {
      this.doc.setFontSize(12);
      this.doc.setTextColor(this.colors.secondary);
      this.doc.text('No se encontraron registros para los filtros aplicados.', 20, this.currentY);
      return this.doc;
    }

    // Agrupar ventas por sucursal
    const ventasPorSucursal = ventas.reduce((acc, venta) => {
      const key = venta.sucursal_id;
      if (!acc[key]) {
        acc[key] = {
          sucursal_nombre: venta.sucursal_nombre,
          sucursal_tipo: venta.sucursal_tipo,
          sucursal_ubicacion: venta.sucursal_ubicacion,
          ventas: [],
          total_efectivo: 0,
          total_tarjeta: 0,
          total_sinpe: 0,
          total_ventas: 0
        };
      }
      acc[key].ventas.push(venta);
      acc[key].total_efectivo += parseFloat(venta.venta_efectivo) || 0;
      acc[key].total_tarjeta += parseFloat(venta.venta_tarjeta) || 0;
      acc[key].total_sinpe += parseFloat(venta.venta_sinpe) || 0;
      acc[key].total_ventas += parseFloat(venta.venta_total) || 0;
      return acc;
    }, {});

    // Procesar cada sucursal
    Object.values(ventasPorSucursal).forEach((grupo) => {
      // Header de sucursal
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(this.colors.primary);
      this.doc.text(`Sucursal: ${grupo.sucursal_nombre} (${grupo.sucursal_tipo})`, 20, this.currentY);
      this.currentY += 6;

      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(this.colors.secondary);
      this.doc.text(`Ubicación: ${grupo.sucursal_ubicacion}`, 20, this.currentY);
      this.currentY += 8;

      // Subtotales de la sucursal
      const subtotalesData = [
        ['Concepto', 'Monto'],
        ['Total Efectivo', this.formatCurrency(grupo.total_efectivo)],
        ['Total Tarjeta', this.formatCurrency(grupo.total_tarjeta)],
        ['Total SINPE', this.formatCurrency(grupo.total_sinpe)],
        ['TOTAL SUCURSAL', this.formatCurrency(grupo.total_ventas)]
      ];

      autoTable(this.doc, {
        head: [subtotalesData[0]],
        body: subtotalesData.slice(1),
        startY: this.currentY,
        theme: 'grid',
        headStyles: {
          fillColor: [123, 31, 162],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 9
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [33, 37, 41]
        },
        styles: {
          overflow: 'linebreak',
          cellPadding: 2
        },
        columnStyles: {
          1: { halign: 'right', fontStyle: 'bold' }
        },
        margin: { left: 20, right: 20 }
      });

      this.currentY = this.doc.lastAutoTable.finalY + 8;

      // Tabla de ventas individuales de la sucursal
      const tableData = grupo.ventas.map(v => [
        this.formatDate(v.fecha_venta),
        this.formatCurrency(v.venta_efectivo),
        this.formatCurrency(v.venta_tarjeta),
        this.formatCurrency(v.venta_sinpe),
        this.formatCurrency(v.venta_total),
        this.capitalizeFirst(v.estado)
      ]);

      autoTable(this.doc, {
        head: [['Fecha', 'Efectivo', 'Tarjeta', 'SINPE', 'Total', 'Estado']],
        body: tableData,
        startY: this.currentY,
        theme: 'striped',
        headStyles: {
          fillColor: [46, 125, 50],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 9
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [33, 37, 41]
        },
        styles: {
          overflow: 'linebreak',
          cellPadding: 2
        },
        columnStyles: {
          1: { halign: 'right' },
          2: { halign: 'right' },
          3: { halign: 'right' },
          4: { halign: 'right', fontStyle: 'bold' },
          5: { halign: 'center' }
        },
        margin: { left: 20, right: 20 },
        alternateRowStyles: {
          fillColor: [248, 249, 250]
        }
      });

      this.currentY = this.doc.lastAutoTable.finalY + 15;

      // Verificar si necesitamos nueva página
      if (this.currentY > this.doc.internal.pageSize.height - 30) {
        this.doc.addPage();
        this.currentY = 20;
      }
    });

    this.addFooter();
    return this.doc;
  }

generateInventoryReport(inventory, filters = {}, includeZeroStock = false) {
  this.initDocument();

  // Header
  const subtitle = includeZeroStock 
    ? 'Estado actual del inventario (incluyendo productos sin stock)' 
    : 'Estado actual del inventario';
  this.addHeader('REPORTE DE INVENTARIO', subtitle, filters);

  // Verify if there is inventory
  if (!inventory || inventory.length === 0) {
    this.doc.setFontSize(12);
    this.doc.setTextColor(this.colors.secondary);
    this.doc.text('No se encontraron registros de inventario.', 20, this.currentY);
    this.addFooter();
    return this.doc;
  }

  // Estadísticas adicionales
  const totalProductos = inventory.length;
  const productosConStock = inventory.filter(i => i.stock_actual > 0).length;
  const productosSinStock = inventory.filter(i => i.stock_actual === 0).length;
  const productosStockBajo = inventory.filter(i => i.stock_actual > 0 && i.stock_actual <= i.stock_minimo).length;

  // Resumen de estadísticas
  this.doc.setFontSize(12);
  this.doc.setFont('helvetica', 'bold');
  this.doc.setTextColor(this.colors.dark);
  this.doc.text('Resumen de Inventario', 20, this.currentY);
  this.currentY += 8;

  const statsData = [
    ['Concepto', 'Cantidad'],
    ['Total de Productos', totalProductos.toString()],
    ['Productos con Stock', productosConStock.toString()],
    ['Productos sin Stock', productosSinStock.toString()],
    ['Productos Stock Bajo', productosStockBajo.toString()]
  ];

  autoTable(this.doc, {
    head: [statsData[0]],
    body: statsData.slice(1),
    startY: this.currentY,
    theme: 'grid',
    headStyles: {
      fillColor: [46, 125, 50],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [33, 37, 41]
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { halign: 'center', fontStyle: 'bold' }
    },
    margin: { left: 20, right: 20 }
  });

  this.currentY = this.doc.lastAutoTable.finalY + 12;

  // Inventory table
  this.doc.setFontSize(14);
  this.doc.setFont('helvetica', 'bold');
  this.doc.setTextColor(this.colors.dark);
  this.doc.text('Detalle de Inventario', 20, this.currentY);
  this.currentY += 8;

  const tableData = inventory.map(i => {
    const stockActual = i.stock_actual === 0 ? '0 ⚠' : i.stock_actual.toString();
    return [
      i.nombre_producto,
      i.categoria,
      stockActual,
      i.stock_minimo,
      this.formatCurrency(i.precio_unitario),
      this.formatDate(i.fecha_ingreso),
      i.fecha_vencimiento ? this.formatDate(i.fecha_vencimiento) : 'N/A',
      this.capitalizeFirst(i.estado)
    ];
  });

  autoTable(this.doc, {
    head: [['Producto', 'Categoría', 'Stock Actual', 'Stock Mínimo', 'Precio Unitario', 'Fecha Ingreso', 'Fecha Venc.', 'Estado']],
    body: tableData,
    startY: this.currentY,
    theme: 'striped',
    headStyles: {
      fillColor: [46, 125, 50],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [33, 37, 41]
    },
    styles: {
      overflow: 'linebreak',
      cellPadding: 2
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 'auto' },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { cellWidth: 'wrap' },
      6: { cellWidth: 'wrap' },
      7: { halign: 'center' }
    },
    margin: { left: 20, right: 20 },
    alternateRowStyles: {
      fillColor: [248, 249, 250]
    },
    didParseCell: function(data) {
      // Destacar productos sin stock
      if (data.section === 'body' && data.column.index === 2) {
        const stockValue = inventory[data.row.index].stock_actual;
        if (stockValue === 0) {
          data.cell.styles.textColor = [244, 67, 54]; // Rojo
          data.cell.styles.fontStyle = 'bold';
        } else if (stockValue <= inventory[data.row.index].stock_minimo) {
          data.cell.styles.textColor = [255, 152, 0]; // Naranja
          data.cell.styles.fontStyle = 'bold';
        }
      }
      // Destacar estado
      if (data.section === 'body' && data.column.index === 7) {
        const estado = inventory[data.row.index].estado;
        if (estado === 'Agotado') {
          data.cell.styles.fillColor = [255, 235, 238];
          data.cell.styles.textColor = [244, 67, 54];
          data.cell.styles.fontStyle = 'bold';
        } else if (estado === 'Stock Bajo') {
          data.cell.styles.fillColor = [255, 243, 224];
          data.cell.styles.textColor = [255, 152, 0];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    }
  });

  this.addFooter();
  return this.doc;
}

  generateClientReport(clients, filters = {}, includeInactive = false) {
    this.initDocument();
  
    const subtitle = includeInactive 
      ? 'Listado completo de clientes (incluyendo inactivos)' 
      : 'Listado de clientes activos';
    this.addHeader('REPORTE DE CLIENTES', subtitle, filters);
  
    if (!clients || clients.length === 0) {
      this.doc.setFontSize(12);
      this.doc.setTextColor(this.colors.secondary);
      this.doc.text('No se encontraron registros de clientes.', 20, this.currentY);
      this.addFooter();
      return this.doc;
    }
  
    // Estadísticas
    const totalClientes = clients.length;
    const clientesActivos = clients.filter(c => c.estado === 'Activo').length;
    const clientesInactivos = clients.filter(c => c.estado === 'Inactivo').length;
  
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(this.colors.dark);
    this.doc.text('Resumen de Clientes', 20, this.currentY);
    this.currentY += 8;
  
    const statsData = [
      ['Concepto', 'Cantidad'],
      ['Total de Clientes', totalClientes.toString()],
      ['Clientes Activos', clientesActivos.toString()],
      ['Clientes Inactivos', clientesInactivos.toString()]
    ];
  
    autoTable(this.doc, {
      head: [statsData[0]],
      body: statsData.slice(1),
      startY: this.currentY,
      theme: 'grid',
      headStyles: {
        fillColor: [46, 125, 50],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [33, 37, 41]
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { halign: 'center', fontStyle: 'bold' }
      },
      margin: { left: 20, right: 20 }
    });
  
    this.currentY = this.doc.lastAutoTable.finalY + 12;
  
    // Tabla de clientes
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(this.colors.dark);
    this.doc.text('Detalle de Clientes', 20, this.currentY);
    this.currentY += 8;
  
    const tableData = clients.map(c => [
      c.nombre,
      c.empresa || 'N/A',
      c.telefono || 'N/A',
      c.email || 'N/A',
      c.ciudad || 'N/A',
      c.direccion || 'N/A',
      this.formatDate(c.fecha_registro),
      this.capitalizeFirst(c.estado)
    ]);
  
    autoTable(this.doc, {
      head: [['Nombre', 'Empresa', 'Teléfono', 'Email', 'Ciudad', 'Dirección', 'Registro', 'Estado']],
      body: tableData,
      startY: this.currentY,
      theme: 'striped',
      headStyles: {
        fillColor: [46, 125, 50],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [33, 37, 41]
      },
      styles: {
        overflow: 'linebreak',
        cellPadding: 2
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 'wrap' },
        4: { cellWidth: 'auto' },
        5: { cellWidth: 'wrap' },
        6: { cellWidth: 'wrap' },
        7: { halign: 'center' }
      },
      margin: { left: 20, right: 20 },
      alternateRowStyles: {
        fillColor: [248, 249, 250]
      },
      didParseCell: function(data) {
        if (data.section === 'body' && data.column.index === 7) {
          const estado = clients[data.row.index].estado;
          if (estado === 'Inactivo') {
            data.cell.styles.fillColor = [255, 235, 238];
            data.cell.styles.textColor = [244, 67, 54];
            data.cell.styles.fontStyle = 'bold';
          } else if (estado === 'Activo') {
            data.cell.styles.fillColor = [232, 245, 233];
            data.cell.styles.textColor = [46, 125, 50];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    });
  
    this.addFooter();
    return this.doc;
  }

  generateProductReport(products, filters = {}) {
    this.initDocument();

    // Header
    this.addHeader('REPORTE DE PRODUCTOS', 'Listado de productos registrados', filters);

    // Verify if there are products
    if (!products || products.length === 0) {
      this.doc.setFontSize(12);
      this.doc.setTextColor(this.colors.secondary);
      this.doc.text('No se encontraron registros de productos.', 20, this.currentY);
      this.addFooter();
      return this.doc;
    }

    // Products table
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(this.colors.dark);
    this.doc.text('Detalle de Productos', 20, this.currentY);
    this.currentY += 8;

    const tableData = products.map(p => [
      p.nombre,
      p.categoria,
      p.unidad_medida,
      p.descripcion,
      this.capitalizeFirst(p.estado),
      this.formatDate(p.fecha_registro)
    ]);

    autoTable(this.doc, {
      head: [['Nombre', 'Categoría', 'Unidad', 'Descripción', 'Estado', 'Fecha Registro']],
      body: tableData,
      startY: this.currentY,
      theme: 'striped',
      headStyles: {
        fillColor: [46, 125, 50],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [33, 37, 41]
      },
      styles: {
        overflow: 'linebreak',
        cellPadding: 2
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 'wrap' },
        4: { halign: 'center' },
        5: { cellWidth: 'wrap' }
      },
      margin: { left: 20, right: 20 },
      alternateRowStyles: {
        fillColor: [248, 249, 250]
      }
    });

    this.addFooter();
    return this.doc;
  }

  generateCuentasPorPagarReport(facturas, filters = {}) {
    this.initDocument();

    this.addHeader('REPORTE DE CUENTAS POR PAGAR', 'Listado de facturas de proveedores', filters);

    if (!facturas || facturas.length === 0) {
      this.doc.setFontSize(12);
      this.doc.setTextColor(this.colors.secondary);
      this.doc.text('No se encontraron registros de facturas.', 20, this.currentY);
      this.addFooter();
      return this.doc;
    }

    const facturasByProvider = facturas.reduce((acc, factura) => {
      const { nombre_proveedor } = factura;
      if (!acc[nombre_proveedor]) {
        acc[nombre_proveedor] = [];
      }
      acc[nombre_proveedor].push(factura);
      return acc;
    }, {});

    Object.entries(facturasByProvider).forEach(([proveedor, facturasProveedor]) => {
      this.doc.setFontSize(14);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(this.colors.dark);
      this.doc.text(`Proveedor: ${proveedor}`, 20, this.currentY);
      this.currentY += 8;

      const tableData = facturasProveedor.map(f => [
        f.numero_factura,
        this.formatCurrency(f.monto),
        this.formatCurrency(f.saldo),
        this.formatDate(f.fecha_emision)
      ]);

      autoTable(this.doc, {
        head: [['N° Factura', 'Monto', 'Saldo', 'Fecha Emisión']],
        body: tableData,
        startY: this.currentY,
        theme: 'striped',
        headStyles: {
          fillColor: [46, 125, 50],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 9
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [33, 37, 41]
        },
        styles: {
          overflow: 'linebreak',
          cellPadding: 2
        },
        columnStyles: {
          0: { cellWidth: 'auto' },
          1: { halign: 'right' },
          2: { halign: 'right' },
          3: { cellWidth: 'wrap' }
        },
        margin: { left: 20, right: 20 },
        alternateRowStyles: {
          fillColor: [248, 249, 250]
        }
      });

      this.currentY = this.doc.lastAutoTable.finalY + 5;

      const totalDeuda = facturasProveedor.reduce((acc, f) => acc + parseFloat(f.saldo), 0);

      autoTable(this.doc, {
        body: [['Total Owed', this.formatCurrency(totalDeuda)]],
        startY: this.currentY,
        theme: 'plain',
        didParseCell: function (data) {
            if (data.row.index === 0 && data.column.index === 0) {
                data.cell.styles.fontStyle = 'bold';
            }
        },
        styles: {
          halign: 'right'
        },
        margin: { left: 20, right: 20 }
      });

      this.currentY = this.doc.lastAutoTable.finalY + 10;
    });

    this.addFooter();
    return this.doc;
  }

  generateCuentasPorCobrarReport(facturas, filters = {}) {
    this.initDocument();

    this.addHeader('REPORTE DE CUENTAS POR COBRAR', 'Listado de facturas de clientes', filters);

    if (!facturas || facturas.length === 0) {
      this.doc.setFontSize(12);
      this.doc.setTextColor(this.colors.secondary);
      this.doc.text('No se encontraron registros de facturas.', 20, this.currentY);
      this.addFooter();
      return this.doc;
    }

    const facturasByClient = facturas.reduce((acc, factura) => {
      const { nombre_cliente } = factura;
      if (!acc[nombre_cliente]) {
        acc[nombre_cliente] = [];
      }
      acc[nombre_cliente].push(factura);
      return acc;
    }, {});

    Object.entries(facturasByClient).forEach(([cliente, facturasCliente]) => {
      this.doc.setFontSize(14);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(this.colors.dark);
      this.doc.text(`Cliente: ${cliente}`, 20, this.currentY);
      this.currentY += 8;

      const tableData = facturasCliente.map(f => [
        f.numero_factura,
        this.formatCurrency(f.monto),
        this.formatCurrency(f.saldo),
        this.formatDate(f.fecha_emision)
      ]);

      autoTable(this.doc, {
        head: [['N° Factura', 'Monto', 'Saldo', 'Fecha Emisión']],
        body: tableData,
        startY: this.currentY,
        theme: 'striped',
        headStyles: {
          fillColor: [46, 125, 50],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 9
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [33, 37, 41]
        },
        styles: {
          overflow: 'linebreak',
          cellPadding: 2
        },
        columnStyles: {
          0: { cellWidth: 'auto' },
          1: { halign: 'right' },
          2: { halign: 'right' },
          3: { cellWidth: 'wrap' }
        },
        margin: { left: 20, right: 20 },
        alternateRowStyles: {
          fillColor: [248, 249, 250]
        }
      });

      this.currentY = this.doc.lastAutoTable.finalY + 5;

      const totalDeuda = facturasCliente.reduce((acc, f) => acc + parseFloat(f.saldo), 0);

      autoTable(this.doc, {
        body: [['Total Adeudado', this.formatCurrency(totalDeuda)]],
        startY: this.currentY,
        theme: 'plain',
        didParseCell: function (data) {
            if (data.row.index === 0 && data.column.index === 0) {
                data.cell.styles.fontStyle = 'bold';
            }
        },
        styles: {
          halign: 'right'
        },
        margin: { left: 20, right: 20 }
      });

      this.currentY = this.doc.lastAutoTable.finalY + 10;
    });

    this.addFooter();
    return this.doc;
  }

  generateSupplierReport(suppliers, filters = {}) {
    this.initDocument();

    // Header
    this.addHeader('REPORTE DE PROVEEDORES', 'Listado de proveedores registrados', filters);

    // Verify if there are suppliers
    if (!suppliers || suppliers.length === 0) {
      this.doc.setFontSize(12);
      this.doc.setTextColor(this.colors.secondary);
      this.doc.text('No se encontraron registros de proveedores.', 20, this.currentY);
      this.addFooter();
      return this.doc;
    }

    // Suppliers table
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(this.colors.dark);
    this.doc.text('Detalle de Proveedores', 20, this.currentY);
    this.currentY += 8;

    const tableData = suppliers.map(s => [
      s.nombre,
      s.empresa,
      s.telefono,
      s.email,
      s.direccion,
      s.ciudad,
      s.tipo_proveedor,
      this.capitalizeFirst(s.estado)
    ]);

    autoTable(this.doc, {
      head: [['Nombre', 'Empresa', 'Teléfono', 'Email', 'Dirección', 'Ciudad', 'Tipo', 'Estado']],
      body: tableData,
      startY: this.currentY,
      theme: 'striped',
      headStyles: {
        fillColor: [46, 125, 50],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [33, 37, 41]
      },
      styles: {
        overflow: 'linebreak',
        cellPadding: 2
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 'wrap' },
        4: { cellWidth: 'wrap' },
        5: { cellWidth: 'auto' },
        6: { cellWidth: 'auto' },
        7: { halign: 'center' }
      },
      margin: { left: 20, right: 20 },
      alternateRowStyles: {
        fillColor: [248, 249, 250]
      }
    });

    this.addFooter();
    return this.doc;
  }

}

export default ReportService;
