'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export interface ZoneData {
  id: string;
  name: string;
  occupancy: number;
  capacity: number;
  density: number;
}

export interface QueueData {
  id: string;
  name: string;
  type: string;
  length: number;
  waitTime: number;
  status: string;
}

export interface SensorData {
  id: string;
  name: string;
  type: string;
  value: number;
  unit: string;
  status: string;
  battery: number;
}

export interface VenueUpdate {
  timestamp: string;
  simulationTime: number;
  totalAttendees: number;
  maxCapacity: number;
  crowdDensity: number;
  zones: ZoneData[];
  queues: QueueData[];
  sensors: SensorData[];
}

export interface AlertData {
  _id: string;
  title: string;
  message: string;
  type: string;
  severity: string;
  zone: string;
  isActive: boolean;
  createdAt: string;
}

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [venueData, setVenueData] = useState<VenueUpdate | null>(null);
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    const socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      setConnectionError(null);
      console.log('🔌 Connected to SVES backend');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('🔌 Disconnected from SVES backend');
    });

    socket.on('connect_error', (err) => {
      setConnectionError(`Connection failed: ${err.message}`);
      setIsConnected(false);
    });

    socket.on('venue-update', (data: VenueUpdate) => {
      setVenueData(data);
    });

    socket.on('new-alert', (alert: AlertData) => {
      setAlerts(prev => [alert, ...prev].slice(0, 50));
    });

    socket.on('emergency-alert', (data: any) => {
      setAlerts(prev => [{
        _id: `emergency_${Date.now()}`,
        title: '🚨 EMERGENCY',
        message: data.message || 'Emergency alert triggered',
        type: 'emergency',
        severity: 'critical',
        zone: data.zone || 'Unknown',
        isActive: true,
        createdAt: data.timestamp
      }, ...prev].slice(0, 50));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const emit = useCallback((event: string, data: any) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data);
    }
  }, []);

  return { isConnected, venueData, alerts, connectionError, emit, socket: socketRef.current };
}

export async function fetchAPI(endpoint: string, options?: RequestInit) {
  const url = `${BACKEND_URL}/api${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    return await res.json();
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    return null;
  }
}
