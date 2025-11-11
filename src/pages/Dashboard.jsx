import React, { useState, useEffect } from 'react';
import StatsCards from '../components/StatsCards';
import SalesByBranchChart from '../components/SalesByBranchChart';
import SalesByDayChart from '../components/SalesByDayChart';
import PaymentMethodChart from '../components/PaymentMethodChart';
import StockChart from '../components/StockChart';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const Dashboard = () => {
  const [branches, setBranches] = useState([]);
  const [stats, setStats] = useState([]);
  const [salesByBranch, setSalesByBranch] = useState([]);
  const [salesByDay, setSalesByDay] = useState([]);
  const [paymentMethodData, setPaymentMethodData] = useState({});
  const [stockData, setStockData] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState('month');

  useEffect(() => {
    // Fetch branches
    fetch(`${API_BASE_URL}/sucursales/activas`)
      .then(res => res.json())
      .then(data => setBranches(data))
      .catch(err => console.error("Error fetching branches:", err));

    // Fetch stock data
    fetch(`${API_BASE_URL}/inventario`)
      .then(res => res.json())
      .then(data => setStockData(data))
      .catch(err => console.error("Error fetching stock:", err));
  }, []);

  useEffect(() => {
    const today = new Date();
    let startDate, endDate = today.toISOString().split('T')[0];

    if (selectedDateRange === 'day') {
      startDate = endDate;
    } else if (selectedDateRange === 'week') {
      const lastWeek = new Date(today.setDate(today.getDate() - 7));
      startDate = lastWeek.toISOString().split('T')[0];
    } else if (selectedDateRange === 'month') {
      const lastMonth = new Date(today.setMonth(today.getMonth() - 1));
      startDate = lastMonth.toISOString().split('T')[0];
    }

    let statsUrl = `${API_BASE_URL}/ventas-diarias/estadisticas?fecha_inicio=${startDate}&fecha_fin=${endDate}`;
    if (selectedBranch) {
      statsUrl += `&sucursal_id=${selectedBranch}`;
    }
    
    fetch(statsUrl)
      .then(res => res.json())
      .then(data => {
        setPaymentMethodData(data);
        const formattedStats = [
          {
            title: 'Ventas Totales',
            value: `₡${(data.total_ventas || 0).toLocaleString('es-CR')}`,
            icon: 'fas fa-dollar-sign',
            color: 'primary-orange'
          },
          {
            title: 'Sucursales Activas',
            value: data.sucursales_activas || 0,
            icon: 'fas fa-store',
            color: 'primary-blue'
          },
          {
            title: 'Total Registros',
            value: data.total_registros || 0,
            icon: 'fas fa-file-alt',
            color: 'secondary-gray'
          }
        ];
        setStats(formattedStats);
      })
      .catch(err => console.error("Error fetching stats:", err));

    let salesByBranchUrl = `${API_BASE_URL}/ventas-diarias/resumen?fecha_inicio=${startDate}&fecha_fin=${endDate}`;
    if (selectedBranch) {
        salesByBranchUrl += `&sucursal_id=${selectedBranch}`;
    }

    fetch(salesByBranchUrl)
        .then(res => res.json())
        .then(data => setSalesByBranch(data))
        .catch(err => console.error("Error fetching sales by branch:", err));

    let salesByDayUrl = `${API_BASE_URL}/ventas-diarias?fecha_inicio=${startDate}&fecha_fin=${endDate}`;
    if (selectedBranch) {
        salesByDayUrl += `&sucursal_id=${selectedBranch}`;
    }

    fetch(salesByDayUrl)
        .then(res => res.json())
        .then(data => {
            const formattedData = data.map(d => ({...d, fecha_venta: new Date(d.fecha_venta).toLocaleDateString('es-ES')}));
            setSalesByDay(formattedData);
        })
        .catch(err => console.error("Error fetching sales by day:", err));

  }, [selectedDateRange, selectedBranch]);

  return (
    <div>
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h3 className="fw-bold text-dark mb-1">Dashboard</h3>
              <p className="text-muted mb-0">
                <i className="fas fa-calendar-alt me-1"></i>
                {new Date().toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-md-4">
          <select className="form-select" value={selectedDateRange} onChange={e => setSelectedDateRange(e.target.value)}>
            <option value="day">Hoy</option>
            <option value="week">Esta Semana</option>
            <option value="month">Este Mes</option>
          </select>
        </div>
        <div className="col-md-4">
          <select className="form-select" value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)}>
            <option value="">Todas las Sucursales</option>
            {branches.map(branch => (
              <option key={branch.id} value={branch.id}>{branch.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="fade-in-up">
        <StatsCards stats={stats} />
      </div>

      <div className="row g-4 mt-1">
        <div className="col-md-8 fade-in-up" style={{animationDelay: '0.2s'}}>
          <SalesByDayChart data={salesByDay} />
        </div>
        <div className="col-md-4 fade-in-up" style={{animationDelay: '0.3s'}}>
          <PaymentMethodChart data={paymentMethodData} />
        </div>
      </div>
      
      <div className="row g-4 mt-1">
        <div className="col-md-6 fade-in-up" style={{animationDelay: '0.4s'}}>
          <SalesByBranchChart data={salesByBranch} />
        </div>
        <div className="col-md-6 fade-in-up" style={{animationDelay: '0.5s'}}>
          <StockChart data={stockData} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;