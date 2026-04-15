'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSocket, fetchAPI, VenueUpdate, ZoneData, QueueData, SensorData, AlertData } from '@/lib/socket';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar, Legend
} from 'recharts';
import {
  Users, Activity, Clock, AlertTriangle, MapPin, Gauge, Thermometer,
  Volume2, Wind, Eye, Radio, BellRing, Shield, Navigation,
  TrendingUp, TrendingDown, Wifi, WifiOff, ChevronRight,
  LayoutDashboard, Map, ListOrdered, Cpu, BarChart3, Bell, Settings, Menu, X,
  Zap, Target, Timer, ArrowUpRight, ArrowDownRight, Waves, Droplets
} from 'lucide-react';

// Sidebar navigation items
const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'heatmap', label: 'Venue Map', icon: Map },
  { id: 'queues', label: 'Queues', icon: ListOrdered },
  { id: 'sensors', label: 'IoT Sensors', icon: Cpu },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'alerts', label: 'Alerts', icon: Bell },
];

export default function DashboardPage() {
  const { isConnected, venueData, alerts, connectionError } = useSocket();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [selectedZone, setSelectedZone] = useState<ZoneData | null>(null);
  const [historicalData, setHistoricalData] = useState<VenueUpdate[]>([]);
  
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loginEmail, setLoginEmail] = useState('admin@sves.io');
  const [loginPassword, setLoginPassword] = useState('admin123');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);
    
    try {
      const response = await fetchAPI('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      
      if (response && response.token) {
        setIsAuthenticated(true);
        setUser(response.user);
        // Store token if needed for other API calls
        localStorage.setItem('sves_token', response.token);
      } else {
        setLoginError('Invalid credentials. Please try again.');
      }
    } catch (err) {
      setLoginError('Server connection failed. Using demo mode.');
      // Auto-fallback for demo purposes
      setTimeout(() => {
        setIsAuthenticated(true);
        setUser({ name: 'Admin User', role: 'admin' });
      }, 1000);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Track historical data for charts
  useEffect(() => {
    if (venueData) {
      setHistoricalData(prev => [...prev.slice(-30), venueData]);
    }
  }, [venueData]);

  // Fetch analytics
  useEffect(() => {
    const fetchAnalytics = async () => {
      const data = await fetchAPI('/analytics/dashboard');
      if (data) setAnalyticsData(data);
    };
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 10000);
    return () => clearInterval(interval);
  }, []);

  // Chart data derived from real-time updates
  const attendanceHistory = useMemo(() => {
    return historicalData.map((d, i) => ({
      time: new Date(d.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      attendees: d.totalAttendees,
      density: d.crowdDensity,
    }));
  }, [historicalData]);

  const zoneDensityData = useMemo(() => {
    if (!venueData) return [];
    return venueData.zones
      .filter(z => z.capacity > 1000)
      .sort((a, b) => b.density - a.density)
      .map(z => ({
        name: z.name.length > 12 ? z.name.substring(0, 12) + '…' : z.name,
        density: z.density,
        occupancy: z.occupancy,
        fill: z.density > 80 ? '#f43f5e' : z.density > 60 ? '#f59e0b' : z.density > 30 ? '#3b82f6' : '#10b981'
      }));
  }, [venueData]);

  const queueData = useMemo(() => {
    if (!venueData) return [];
    return venueData.queues.map(q => ({
      name: q.name.length > 15 ? q.name.substring(0, 15) + '…' : q.name,
      waitTime: q.waitTime,
      length: q.length,
      fill: q.status === 'full' ? '#f43f5e' : q.status === 'busy' ? '#f59e0b' : '#10b981'
    }));
  }, [venueData]);

  const sensorTypeData = useMemo(() => {
    if (!venueData) return [];
    const types: Record<string, { count: number; avgValue: number; unit: string }> = {};
    venueData.sensors.forEach(s => {
      if (!types[s.type]) types[s.type] = { count: 0, avgValue: 0, unit: s.unit };
      types[s.type].count++;
      types[s.type].avgValue += s.value;
    });
    return Object.entries(types).map(([type, data]) => ({
      type: type.replace('_', ' '),
      avgValue: Math.round(data.avgValue / data.count * 10) / 10,
      count: data.count,
      unit: data.unit,
    }));
  }, [venueData]);

  const COLORS = ['#6366f1', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#ec4899'];

  if (!isAuthenticated) {
    return (
      <LoginView
        onLogin={handleLogin}
        email={loginEmail}
        setEmail={setLoginEmail}
        password={loginPassword}
        setPassword={setLoginPassword}
        isLoading={isLoggingIn}
        error={loginError}
      />
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Skip to Content for A11y */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:p-4 focus:bg-indigo-600 focus:text-white">
        Skip to main content
      </a>
      {/* Sidebar */}
      <aside
        className={`fixed lg:relative z-50 h-full transition-all duration-300 ease-in-out flex flex-col ${
          sidebarOpen ? 'w-64' : 'w-0 lg:w-20'
        }`}
        style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-color)' }}
        role="navigation"
        aria-label="Sidebar Navigation"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 p-5 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--gradient-primary)' }}>
            <Zap className="w-5 h-5 text-white" />
          </div>
          {sidebarOpen && (
            <div>
              <h1 className="text-lg font-bold gradient-text">SVES</h1>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Venue Command Center</p>
            </div>
          )}
        </div>

        {/* Nav Links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`sidebar-link w-full text-left ${activeTab === item.id ? 'active' : ''}`}
              aria-label={`Go to ${item.label}`}
              aria-current={activeTab === item.id ? 'page' : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
              {item.id === 'alerts' && alerts.filter(a => a.isActive).length > 0 && sidebarOpen && (
                <span className="ml-auto badge badge-danger text-xs">{alerts.filter(a => a.isActive).length}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Connection Status */}
        <div className="p-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <div className="pulse-dot" style={{ background: '#10b981', color: '#10b981' }} />
                {sidebarOpen && <span className="text-xs" style={{ color: '#10b981' }}>Live Connected</span>}
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4" style={{ color: '#f43f5e' }} />
                {sidebarOpen && <span className="text-xs" style={{ color: '#f43f5e' }}>Disconnected</span>}
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main id="main-content" className="flex-1 overflow-y-auto" role="main">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 flex items-center justify-between px-6 py-4" style={{ background: 'rgba(10, 14, 26, 0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border-color)' }}>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)} 
              className="p-2 rounded-lg hover:bg-white/5"
              aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div>
              <h2 className="text-xl font-bold">{navItems.find(n => n.id === activeTab)?.label}</h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {venueData ? `Sim Time: ${Math.floor(venueData.simulationTime / 60)}h ${venueData.simulationTime % 60}m` : 'Connecting...'} • MetLife Stadium
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {venueData && (
              <div className="hidden md:flex items-center gap-6">
                <div className="text-right">
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Attendees</p>
                  <p className="text-lg font-bold" style={{ color: 'var(--accent-cyan)' }}>{venueData.totalAttendees.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Capacity</p>
                  <p className="text-lg font-bold" style={{ color: venueData.crowdDensity > 85 ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>{venueData.crowdDensity}%</p>
                </div>
              </div>
            )}
            <button className="relative p-2 rounded-lg hover:bg-white/5" onClick={() => setActiveTab('alerts')}>
              <BellRing className="w-5 h-5" />
              {alerts.filter(a => a.isActive).length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center" style={{ background: 'var(--accent-rose)', color: 'white' }}>
                  {alerts.filter(a => a.isActive).length}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">
          {activeTab === 'dashboard' && (
            <DashboardView
              venueData={venueData}
              analyticsData={analyticsData}
              attendanceHistory={attendanceHistory}
              zoneDensityData={zoneDensityData}
              queueData={queueData}
              alerts={alerts}
              COLORS={COLORS}
            />
          )}
          {activeTab === 'heatmap' && (
            <HeatmapView venueData={venueData} selectedZone={selectedZone} setSelectedZone={setSelectedZone} />
          )}
          {activeTab === 'queues' && (
            <QueuesView venueData={venueData} queueData={queueData} />
          )}
          {activeTab === 'sensors' && (
            <SensorsView venueData={venueData} sensorTypeData={sensorTypeData} />
          )}
          {activeTab === 'analytics' && (
            <AnalyticsView
              venueData={venueData}
              analyticsData={analyticsData}
              attendanceHistory={attendanceHistory}
              zoneDensityData={zoneDensityData}
              COLORS={COLORS}
            />
          )}
          {activeTab === 'alerts' && (
            <AlertsView alerts={alerts} />
          )}
        </div>
      </main>

      {/* Zone Detail Modal */}
      {selectedZone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setSelectedZone(null)}>
          <div className="glass-card p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold">{selectedZone.name}</h3>
              <button onClick={() => setSelectedZone(null)} className="p-1 rounded hover:bg-white/10"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="stat-card">
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Occupancy</p>
                <p className="text-2xl font-bold">{selectedZone.occupancy.toLocaleString()}</p>
              </div>
              <div className="stat-card">
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Capacity</p>
                <p className="text-2xl font-bold">{selectedZone.capacity.toLocaleString()}</p>
              </div>
              <div className="stat-card col-span-2">
                <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Density</p>
                <div className="w-full rounded-full h-4 overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${selectedZone.density}%`,
                      background: selectedZone.density > 80 ? 'var(--gradient-danger)' : selectedZone.density > 50 ? 'var(--gradient-warning)' : 'var(--gradient-success)'
                    }}
                  />
                </div>
                <p className="text-right text-sm font-bold mt-1">{selectedZone.density}%</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   DASHBOARD VIEW
   ============================================================ */
function DashboardView({ venueData, analyticsData, attendanceHistory, zoneDensityData, queueData, alerts, COLORS }: any) {
  if (!venueData) {
    return (
      <div className="flex flex-col items-center justify-center h-96 animate-fadeIn">
        <div className="w-16 h-16 rounded-full border-4 border-t-transparent animate-spin mb-4" style={{ borderColor: 'var(--accent-indigo)', borderTopColor: 'transparent' }} />
        <p className="text-lg font-semibold" style={{ color: 'var(--text-secondary)' }}>Connecting to venue systems...</p>
        <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>Make sure the backend server is running on port 5000</p>
      </div>
    );
  }

  const statsCards = [
    { label: 'Total Attendees', value: venueData.totalAttendees.toLocaleString(), icon: Users, color: '#6366f1', trend: venueData.crowdDensity > 50 ? '+' : '', subtitle: `of ${venueData.maxCapacity.toLocaleString()} capacity` },
    { label: 'Crowd Density', value: `${venueData.crowdDensity}%`, icon: Gauge, color: venueData.crowdDensity > 80 ? '#f43f5e' : venueData.crowdDensity > 50 ? '#f59e0b' : '#10b981', subtitle: venueData.crowdDensity > 80 ? 'Critical' : venueData.crowdDensity > 50 ? 'Moderate' : 'Normal' },
    { label: 'Avg Wait Time', value: `${analyticsData?.averageDwellTime || 0} min`, icon: Clock, color: '#06b6d4', subtitle: 'Across all queues' },
    { label: 'Active Alerts', value: alerts.filter((a: AlertData) => a.isActive).length, icon: AlertTriangle, color: '#f59e0b', subtitle: `${alerts.length} total alerts` },
    { label: 'Active Zones', value: venueData.zones.filter((z: ZoneData) => z.occupancy > 0).length, icon: MapPin, color: '#8b5cf6', subtitle: `of ${venueData.zones.length} zones` },
    { label: 'IoT Sensors', value: venueData.sensors.filter((s: SensorData) => s.status === 'online').length, icon: Radio, color: '#10b981', subtitle: `${venueData.sensors.length} deployed` },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statsCards.map((stat, i) => (
          <div key={i} className="stat-card" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-xl" style={{ background: `${stat.color}20` }}>
                <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
              </div>
            </div>
            <p className="text-2xl font-bold mb-1">{stat.value}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
            <p className="text-xs mt-1" style={{ color: stat.color }}>{stat.subtitle}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trend */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2"><TrendingUp className="w-4 h-4" style={{ color: 'var(--accent-cyan)' }} /> Live Attendance</h3>
            <span className="badge badge-info">Real-time</span>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={attendanceHistory}>
              <defs>
                <linearGradient id="gradAttendance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
              <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} />
              <Tooltip contentStyle={{ background: '#1a1f35', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px', color: '#f1f5f9' }} />
              <Area type="monotone" dataKey="attendees" stroke="#6366f1" strokeWidth={2} fill="url(#gradAttendance)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Zone Density */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2"><Target className="w-4 h-4" style={{ color: 'var(--accent-amber)' }} /> Zone Density</h3>
            <span className="badge badge-warning">Live</span>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={zoneDensityData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
              <XAxis type="number" domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} width={100} axisLine={false} />
              <Tooltip contentStyle={{ background: '#1a1f35', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px', color: '#f1f5f9' }} />
              <Bar dataKey="density" radius={[0, 6, 6, 0]} barSize={16}>
                {zoneDensityData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Queue + Alerts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Queue Wait Times */}
        <div className="glass-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2"><Timer className="w-4 h-4" style={{ color: 'var(--accent-emerald)' }} /> Queue Wait Times</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={queueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} angle={-20} textAnchor="end" height={60} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} label={{ value: 'Minutes', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#1a1f35', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px', color: '#f1f5f9' }} />
              <Bar dataKey="waitTime" radius={[6, 6, 0, 0]} barSize={28}>
                {queueData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Alerts */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2"><BellRing className="w-4 h-4" style={{ color: 'var(--accent-rose)' }} /> Recent Alerts</h3>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{alerts.length} total</span>
          </div>
          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {alerts?.slice(0, 8).map((alert: AlertData, i: number) => (
              <div key={alert?._id || `alert-${i}`} className="alert-item" style={{
                borderLeftColor: alert?.severity === 'critical' ? '#f43f5e' : alert?.severity === 'high' ? '#f97316' : alert?.severity === 'medium' ? '#f59e0b' : '#3b82f6'
              }}>
                <p className="text-xs font-semibold truncate">{alert?.title}</p>
                <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{alert?.message}</p>
              </div>
            ))}
            {alerts.length === 0 && (
              <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>No alerts yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   HEATMAP VIEW - Interactive Venue Map
   ============================================================ */
function HeatmapView({ venueData, selectedZone, setSelectedZone }: any) {
  if (!venueData) return <LoadingSpinner />;

  // Venue layout coordinates (percentage-based)
  const venueZones = [
    { id: 'z1', name: 'North Gate', x: 35, y: 2, w: 30, h: 8, type: 'entrance' },
    { id: 'z2', name: 'South Gate', x: 35, y: 90, w: 30, h: 8, type: 'entrance' },
    { id: 'z3', name: 'East Gate', x: 90, y: 40, w: 8, h: 20, type: 'entrance' },
    { id: 'z4', name: 'West Gate', x: 2, y: 40, w: 8, h: 20, type: 'entrance' },
    { id: 'z5', name: 'Section A', x: 15, y: 15, w: 30, h: 30, type: 'seating' },
    { id: 'z6', name: 'Section B', x: 55, y: 15, w: 30, h: 30, type: 'seating' },
    { id: 'z7', name: 'Section C', x: 15, y: 55, w: 30, h: 30, type: 'seating' },
    { id: 'z8', name: 'Section D', x: 55, y: 55, w: 30, h: 30, type: 'seating' },
    { id: 'z9', name: 'VIP', x: 38, y: 38, w: 24, h: 24, type: 'vip' },
    { id: 'z10', name: 'Food N', x: 12, y: 5, w: 18, h: 8, type: 'concession' },
    { id: 'z11', name: 'Food S', x: 70, y: 87, w: 18, h: 8, type: 'concession' },
    { id: 'z12', name: 'WC W', x: 3, y: 25, w: 8, h: 12, type: 'restroom' },
    { id: 'z13', name: 'WC E', x: 89, y: 63, w: 8, h: 12, type: 'restroom' },
    { id: 'z14', name: 'Shop', x: 70, y: 5, w: 18, h: 8, type: 'merchandise' },
  ];

  const getZoneColor = (density: number) => {
    if (density > 80) return { bg: 'rgba(244, 63, 94, 0.5)', border: '#f43f5e', text: '#fda4af' };
    if (density > 60) return { bg: 'rgba(249, 115, 22, 0.4)', border: '#f97316', text: '#fdba74' };
    if (density > 40) return { bg: 'rgba(245, 158, 11, 0.35)', border: '#f59e0b', text: '#fde68a' };
    if (density > 20) return { bg: 'rgba(59, 130, 246, 0.3)', border: '#3b82f6', text: '#93c5fd' };
    return { bg: 'rgba(16, 185, 129, 0.25)', border: '#10b981', text: '#6ee7b7' };
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Legend */}
      <div className="glass-card p-4 flex flex-wrap items-center gap-6">
        <h3 className="font-semibold">Density Legend:</h3>
        {[
          { label: '0-20%', color: '#10b981' },
          { label: '20-40%', color: '#3b82f6' },
          { label: '40-60%', color: '#f59e0b' },
          { label: '60-80%', color: '#f97316' },
          { label: '80-100%', color: '#f43f5e' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ background: item.color }} />
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Venue Map */}
      <div className="glass-card p-6">
        <div className="relative w-full" style={{ paddingBottom: '70%', background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.05) 0%, transparent 70%)', borderRadius: '16px', border: '2px solid var(--border-color)' }}>
          {/* Field/Pitch in center */}
          <div className="absolute" style={{ left: '40%', top: '42%', width: '20%', height: '16%', background: 'rgba(16, 185, 129, 0.1)', border: '2px dashed rgba(16, 185, 129, 0.3)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="text-xs font-bold" style={{ color: 'rgba(16, 185, 129, 0.5)' }}>⚽ FIELD</span>
          </div>

          {/* Zones */}
          {venueZones.map(zone => {
            const liveData = venueData.zones.find((z: ZoneData) => z.id === zone.id);
            const density = liveData ? liveData.density : 0;
            const colors = getZoneColor(density);

            return (
              <div
                key={zone.id}
                className="venue-zone"
                onClick={() => liveData && setSelectedZone(liveData)}
                style={{
                  left: `${zone.x}%`,
                  top: `${zone.y}%`,
                  width: `${zone.w}%`,
                  height: `${zone.h}%`,
                  background: colors.bg,
                  borderColor: colors.border,
                  color: colors.text,
                }}
              >
                <div className="text-center">
                  <div className="font-bold" style={{ fontSize: '0.6rem' }}>{zone.name}</div>
                  <div style={{ fontSize: '0.55rem' }}>{density}%</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Zone Details Table */}
      <div className="glass-card p-5">
        <h3 className="font-semibold mb-4">Zone Status</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs" style={{ color: 'var(--text-muted)' }}>
                <th className="text-left pb-3 px-3">Zone</th>
                <th className="text-right pb-3 px-3">Occupancy</th>
                <th className="text-right pb-3 px-3">Capacity</th>
                <th className="text-right pb-3 px-3">Density</th>
                <th className="text-right pb-3 px-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {venueData.zones.map((zone: ZoneData, i: number) => (
                <tr key={zone.id} className="border-t cursor-pointer hover:bg-white/5" style={{ borderColor: 'var(--border-color)' }} onClick={() => setSelectedZone(zone)}>
                  <td className="py-3 px-3 text-sm font-medium">{zone.name}</td>
                  <td className="py-3 px-3 text-sm text-right">{zone.occupancy.toLocaleString()}</td>
                  <td className="py-3 px-3 text-sm text-right" style={{ color: 'var(--text-muted)' }}>{zone.capacity.toLocaleString()}</td>
                  <td className="py-3 px-3 text-sm text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
                        <div className="h-full rounded-full" style={{
                          width: `${zone.density}%`,
                          background: zone.density > 80 ? '#f43f5e' : zone.density > 50 ? '#f59e0b' : '#10b981'
                        }} />
                      </div>
                      <span className="w-10 text-right">{zone.density}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className={`badge ${zone.density > 80 ? 'badge-danger' : zone.density > 50 ? 'badge-warning' : 'badge-success'}`}>
                      {zone.density > 80 ? 'Critical' : zone.density > 50 ? 'Busy' : 'Normal'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   QUEUES VIEW
   ============================================================ */
function QueuesView({ venueData, queueData }: any) {
  if (!venueData) return <LoadingSpinner />;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Queue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {venueData.queues.map((queue: QueueData) => {
          const statusColor = queue.status === 'full' ? '#f43f5e' : queue.status === 'busy' ? '#f59e0b' : '#10b981';
          const statusIcon = queue.status === 'full' ? AlertTriangle : queue.status === 'busy' ? Clock : Activity;
          const Icon = statusIcon;

          return (
            <div key={queue.id} className="stat-card">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-sm">{queue.name}</p>
                  <span className={`badge ${queue.status === 'full' ? 'badge-danger' : queue.status === 'busy' ? 'badge-warning' : 'badge-success'} mt-1`}>
                    {queue.status.toUpperCase()}
                  </span>
                </div>
                <div className="p-2 rounded-xl" style={{ background: `${statusColor}20` }}>
                  <Icon className="w-5 h-5" style={{ color: statusColor }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Wait Time</p>
                  <p className="text-xl font-bold" style={{ color: statusColor }}>{queue.waitTime} min</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Queue Length</p>
                  <p className="text-xl font-bold">{queue.length}</p>
                </div>
              </div>
              <div className="mt-3">
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
                  <div className="h-full rounded-full transition-all duration-500" style={{
                    width: `${Math.min(100, (queue.length / 80) * 100)}%`,
                    background: statusColor
                  }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Queue Wait Times Chart */}
      <div className="glass-card p-5">
        <h3 className="font-semibold mb-4 flex items-center gap-2"><Timer className="w-4 h-4" style={{ color: 'var(--accent-cyan)' }} /> Wait Time Comparison</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={queueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} angle={-15} textAnchor="end" height={60} />
            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} />
            <Tooltip contentStyle={{ background: '#1a1f35', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px', color: '#f1f5f9' }} />
            <Bar dataKey="waitTime" name="Wait (min)" radius={[8, 8, 0, 0]} barSize={32}>
              {queueData.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ============================================================
   SENSORS VIEW
   ============================================================ */
function SensorsView({ venueData, sensorTypeData }: any) {
  if (!venueData) return <LoadingSpinner />;

  const getSensorIcon = (type: string) => {
    switch (type) {
      case 'temperature': return Thermometer;
      case 'humidity': return Droplets;
      case 'noise': return Volume2;
      case 'occupancy': return Users;
      case 'air_quality': return Wind;
      case 'motion': return Activity;
      case 'camera': return Eye;
      default: return Radio;
    }
  };

  const getSensorColor = (type: string) => {
    switch (type) {
      case 'temperature': return '#f43f5e';
      case 'humidity': return '#3b82f6';
      case 'noise': return '#f59e0b';
      case 'occupancy': return '#8b5cf6';
      case 'air_quality': return '#10b981';
      case 'motion': return '#06b6d4';
      case 'camera': return '#ec4899';
      default: return '#6366f1';
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Sensor Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {venueData.sensors.map((sensor: SensorData) => {
          const Icon = getSensorIcon(sensor.type);
          const color = getSensorColor(sensor.type);

          return (
            <div key={sensor.id} className="stat-card">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl" style={{ background: `${color}20` }}>
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{sensor.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{sensor.type.replace('_', ' ')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: sensor.status === 'online' ? '#10b981' : '#f43f5e' }} />
                  <span className="text-xs" style={{ color: sensor.status === 'online' ? '#10b981' : '#f43f5e' }}>{sensor.status}</span>
                </div>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold" style={{ color }}>{sensor.value}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{sensor.unit}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Battery</p>
                  <div className="flex items-center gap-1">
                    <div className="w-12 h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
                      <div className="h-full rounded-full" style={{
                        width: `${sensor.battery}%`,
                        background: sensor.battery > 50 ? '#10b981' : sensor.battery > 20 ? '#f59e0b' : '#f43f5e'
                      }} />
                    </div>
                    <span className="text-xs">{Math.round(sensor.battery)}%</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sensor Summary */}
      <div className="glass-card p-5">
        <h3 className="font-semibold mb-4">Sensor Network Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {sensorTypeData.map((st: any, i: number) => (
            <div key={i} className="p-4 rounded-xl" style={{ background: 'var(--bg-card)' }}>
              <p className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>{st.type}</p>
              <p className="text-2xl font-bold mt-1">{st.avgValue}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{st.unit} avg • {st.count} sensors</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   ANALYTICS VIEW
   ============================================================ */
function AnalyticsView({ venueData, analyticsData, attendanceHistory, zoneDensityData, COLORS }: any) {
  if (!venueData) return <LoadingSpinner />;

  const pieData = venueData.zones
    .filter((z: ZoneData) => z.occupancy > 100)
    .slice(0, 8)
    .map((z: ZoneData) => ({ name: z.name, value: z.occupancy }));

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Peak Attendance</p>
          <p className="text-3xl font-bold gradient-text">{analyticsData?.peakAttendance?.toLocaleString() || venueData.totalAttendees.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Revenue Estimate</p>
          <p className="text-3xl font-bold" style={{ color: 'var(--accent-emerald)' }}>${((analyticsData?.revenueEstimate || 0) / 1000).toFixed(0)}K</p>
        </div>
        <div className="stat-card">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Satisfaction Score</p>
          <p className="text-3xl font-bold" style={{ color: 'var(--accent-amber)' }}>{analyticsData?.satisfactionScore?.toFixed(1) || '4.2'} ⭐</p>
        </div>
        <div className="stat-card">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Crowd Direction</p>
          <p className="text-3xl font-bold" style={{ color: 'var(--accent-cyan)' }}>{analyticsData?.predictions?.crowdDirection || 'Inbound'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Over Time */}
        <div className="glass-card p-5">
          <h3 className="font-semibold mb-4">Attendance & Density Trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={attendanceHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
              <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} />
              <YAxis yAxisId="left" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} />
              <Tooltip contentStyle={{ background: '#1a1f35', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px', color: '#f1f5f9' }} />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="attendees" stroke="#6366f1" strokeWidth={2} dot={false} name="Attendees" />
              <Line yAxisId="right" type="monotone" dataKey="density" stroke="#f59e0b" strokeWidth={2} dot={false} name="Density %" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Zone Distribution Pie */}
        <div className="glass-card p-5">
          <h3 className="font-semibold mb-4">Crowd Distribution by Zone</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} innerRadius={50} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}>
                {pieData.map((_: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#1a1f35', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px', color: '#f1f5f9' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Predictions */}
      {analyticsData?.predictions && (
        <div className="glass-card p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><Zap className="w-4 h-4" style={{ color: 'var(--accent-indigo)' }} /> AI Predictions</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl" style={{ background: 'var(--bg-card)' }}>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Next Hour Attendance</p>
              <p className="text-xl font-bold mt-1">{analyticsData.predictions.nextHourAttendance?.toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-xl" style={{ background: 'var(--bg-card)' }}>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Peak Status</p>
              <p className="text-xl font-bold mt-1">{analyticsData.predictions.peakTime}</p>
            </div>
            <div className="p-4 rounded-xl" style={{ background: 'var(--bg-card)' }}>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Crowd Direction</p>
              <p className="text-xl font-bold mt-1">{analyticsData.predictions.crowdDirection}</p>
            </div>
            <div className="p-4 rounded-xl" style={{ background: 'var(--bg-card)' }}>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Time Remaining</p>
              <p className="text-xl font-bold mt-1">{analyticsData.predictions.exitEstimate}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   ALERTS VIEW
   ============================================================ */
function AlertsView({ alerts }: { alerts: AlertData[] }) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#f43f5e';
      case 'high': return '#f97316';
      case 'medium': return '#f59e0b';
      default: return '#3b82f6';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'emergency': return Shield;
      case 'crowd': return Users;
      case 'weather': return Thermometer;
      case 'security': return Shield;
      default: return AlertTriangle;
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="glass-card p-4 flex items-center justify-between">
        <h3 className="font-semibold">All Alerts ({alerts.length})</h3>
        <div className="flex gap-2">
          <span className="badge badge-danger">{alerts.filter(a => a.severity === 'critical').length} Critical</span>
          <span className="badge badge-warning">{alerts.filter(a => a.severity === 'high' || a.severity === 'medium').length} Warning</span>
          <span className="badge badge-info">{alerts.filter(a => a.severity === 'low').length} Info</span>
        </div>
      </div>

      <div className="space-y-3">
        {alerts.map((alert, i) => {
          const Icon = getTypeIcon(alert.type);
          const color = getSeverityColor(alert.severity);

          return (
            <div key={alert._id || i} className="glass-card p-4 flex items-start gap-4" style={{ borderLeft: `3px solid ${color}` }}>
              <div className="p-2 rounded-xl flex-shrink-0" style={{ background: `${color}20` }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-sm">{alert.title}</p>
                  <span className={`badge flex-shrink-0 ${alert.severity === 'critical' ? 'badge-danger' : alert.severity === 'high' ? 'badge-warning' : 'badge-info'}`}>
                    {alert.severity}
                  </span>
                </div>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{alert.message}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>📍 {alert.zone}</span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>🕐 {new Date(alert.createdAt).toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          );
        })}

        {alerts.length === 0 && (
          <div className="glass-card p-12 text-center">
            <Bell className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
            <p className="text-lg font-semibold" style={{ color: 'var(--text-secondary)' }}>No alerts</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>All systems operational</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   LOADING SPINNER
   ============================================================ */
function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center h-96 animate-fadeIn">
      <div className="w-16 h-16 rounded-full border-4 border-t-transparent animate-spin mb-4" style={{ borderColor: 'var(--accent-indigo)', borderTopColor: 'transparent' }} />
      <p className="text-lg font-semibold" style={{ color: 'var(--text-secondary)' }}>Loading venue data...</p>
      <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>Ensure backend is running on port 5000</p>
    </div>
  );
}

/* ============================================================
   LOGIN VIEW
   ============================================================ */
function LoginView({ 
  onLogin, email, setEmail, password, setPassword, isLoading, error 
}: { 
  onLogin: (e: React.FormEvent) => void,
  email: string,
  setEmail: (v: string) => void,
  password: string,
  setPassword: (v: string) => void,
  isLoading: boolean,
  error: string | null
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg-primary)' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="w-full max-w-md animate-fadeIn">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-indigo-500/20">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text">SVES Command</h1>
          <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>Secure Venue Management System</p>
        </div>

        <div className="glass-card p-8 relative overflow-hidden backdrop-blur-3xl">
          <form onSubmit={onLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                Administrator Email
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/20 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-white"
                  placeholder="admin@sves.io"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                Security Access Key
              </label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/20 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-white"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex gap-2 items-center font-medium">
                <AlertTriangle className="w-4 h-4" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Establish Connection
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 flex items-center gap-1.5 uppercase font-medium tracking-widest">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              Global Ready
            </span>
            <span className="text-[10px] text-slate-500 uppercase font-medium tracking-tighter hover:text-indigo-400 cursor-pointer transition-colors">
              Request Access
            </span>
          </div>
        </div>
        
        <p className="text-center mt-8 text-[10px] uppercase tracking-[0.2em] font-bold text-slate-600">
          Smart Venue Experience System v1.0.4
        </p>
      </div>
    </div>
  );
}
