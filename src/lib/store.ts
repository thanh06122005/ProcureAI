import type { Vendor, PurchaseOrder, VendorRating, Delivery, RiskAlert } from './types';

const VENDORS_KEY = 'vendors';
const PO_KEY = 'purchaseOrders';
const RATINGS_KEY = 'vendorRatings';
const DELIVERIES_KEY = 'deliveries';
const RISKS_KEY = 'riskAlerts';

export function getVendors(): Vendor[] {
  const raw = localStorage.getItem(VENDORS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function setVendors(vendors: Vendor[]) {
  localStorage.setItem(VENDORS_KEY, JSON.stringify(vendors));
}

export function getPurchaseOrders(): PurchaseOrder[] {
  const raw = localStorage.getItem(PO_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function setPurchaseOrders(pos: PurchaseOrder[]) {
  localStorage.setItem(PO_KEY, JSON.stringify(pos));
}

export function getVendorRatings(): VendorRating[] {
  const raw = localStorage.getItem(RATINGS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function setVendorRatings(ratings: VendorRating[]) {
  localStorage.setItem(RATINGS_KEY, JSON.stringify(ratings));
}

export function getDeliveries(): Delivery[] {
  const raw = localStorage.getItem(DELIVERIES_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function setDeliveries(deliveries: Delivery[]) {
  localStorage.setItem(DELIVERIES_KEY, JSON.stringify(deliveries));
}

export function getRiskAlerts(): RiskAlert[] {
  const raw = localStorage.getItem(RISKS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function setRiskAlerts(alerts: RiskAlert[]) {
  localStorage.setItem(RISKS_KEY, JSON.stringify(alerts));
}

export function seedData() {
  const vendors: Vendor[] = [
    {
      id: 'v1',
      name: 'Apex Materials Corp',
      category: 'Raw Materials',
      contact: 'James Chen',
      email: 'j.chen@apexmaterials.com',
      location: 'Shanghai, China',
      rating: 4.2,
      status: 'active',
      onTimeDelivery: 89,
      qualityScore: 92,
      costIndex: 78,
      riskLevel: 'medium',
      contractEnd: '2026-12-31',
    },
    {
      id: 'v2',
      name: 'NovaTech Electronics',
      category: 'Electronics',
      contact: 'Sarah Mitchell',
      email: 's.mitchell@novatech.io',
      location: 'San Jose, USA',
      rating: 4.7,
      status: 'active',
      onTimeDelivery: 95,
      qualityScore: 97,
      costIndex: 82,
      riskLevel: 'low',
      contractEnd: '2027-06-30',
    },
    {
      id: 'v3',
      name: 'GreenPack Solutions',
      category: 'Packaging',
      contact: 'Aiko Tanaka',
      email: 'a.tanaka@greenpack.jp',
      location: 'Osaka, Japan',
      rating: 3.8,
      status: 'active',
      onTimeDelivery: 82,
      qualityScore: 85,
      costIndex: 71,
      riskLevel: 'low',
      contractEnd: '2026-09-15',
    },
    {
      id: 'v4',
      name: 'Baltic Steel Ltd',
      category: 'Metals',
      contact: 'Viktor Petrov',
      email: 'v.petrov@balticsteel.eu',
      location: 'Riga, Latvia',
      rating: 3.1,
      status: 'under-review',
      onTimeDelivery: 64,
      qualityScore: 71,
      costIndex: 68,
      riskLevel: 'high',
      contractEnd: '2026-08-01',
    },
    {
      id: 'v5',
      name: 'Sunrise Logistics',
      category: 'Logistics',
      contact: 'Raj Patel',
      email: 'r.patel@sunriselog.in',
      location: 'Mumbai, India',
      rating: 3.5,
      status: 'active',
      onTimeDelivery: 76,
      qualityScore: 80,
      costIndex: 65,
      riskLevel: 'medium',
      contractEnd: '2027-03-31',
    },
  ];

  const purchaseOrders: PurchaseOrder[] = [
    {
      id: 'po1',
      poNumber: 'PO-2026-001',
      vendorId: 'v1',
      vendorName: 'Apex Materials Corp',
      date: '2026-01-15',
      deliveryDate: '2026-02-28',
      total: 48500,
      status: 'delivered',
      items: [
        { description: 'Aluminum sheets 2mm', quantity: 500, unitPrice: 45 },
        { description: 'Copper wire 14AWG', quantity: 2000, unitPrice: 13 },
      ],
    },
    {
      id: 'po2',
      poNumber: 'PO-2026-002',
      vendorId: 'v2',
      vendorName: 'NovaTech Electronics',
      date: '2026-02-10',
      deliveryDate: '2026-04-05',
      total: 127800,
      status: 'approved',
      items: [
        { description: 'PCB board type-A', quantity: 3000, unitPrice: 28 },
        { description: 'Microcontroller STM32', quantity: 1500, unitPrice: 29.2 },
      ],
    },
    {
      id: 'po3',
      poNumber: 'PO-2026-003',
      vendorId: 'v3',
      vendorName: 'GreenPack Solutions',
      date: '2026-03-01',
      deliveryDate: '2026-04-15',
      total: 23400,
      status: 'shipped',
      items: [
        { description: 'Corrugated boxes L', quantity: 5000, unitPrice: 2.8 },
        { description: 'Biodegradable peanuts', quantity: 2000, unitPrice: 4.7 },
      ],
    },
    {
      id: 'po4',
      poNumber: 'PO-2026-004',
      vendorId: 'v4',
      vendorName: 'Baltic Steel Ltd',
      date: '2026-03-20',
      deliveryDate: '2026-05-10',
      total: 312000,
      status: 'overdue',
      items: [
        { description: 'Stainless steel rods', quantity: 800, unitPrice: 285 },
        { description: 'Carbon steel plates', quantity: 400, unitPrice: 210 },
      ],
    },
    {
      id: 'po5',
      poNumber: 'PO-2026-005',
      vendorId: 'v5',
      vendorName: 'Sunrise Logistics',
      date: '2026-04-05',
      deliveryDate: '2026-06-01',
      total: 18750,
      status: 'submitted',
      items: [
        { description: 'Freight forwarding - SEA', quantity: 15, unitPrice: 1250 },
      ],
    },
  ];

  const ratings: VendorRating[] = [
    {
      vendorId: 'v1',
      overall: 4.2,
      quality: 4.5,
      delivery: 3.8,
      cost: 4.0,
      responsiveness: 4.3,
      reviews: [
        { date: '2026-03-15', reviewer: 'Procurement Team', score: 4, comment: 'Consistent quality, occasional delays in Q1.' },
        { date: '2026-01-20', reviewer: 'QA Dept', score: 5, comment: 'Material specs always meet tolerance requirements.' },
      ],
    },
    {
      vendorId: 'v2',
      overall: 4.7,
      quality: 4.9,
      delivery: 4.6,
      cost: 4.2,
      responsiveness: 4.8,
      reviews: [
        { date: '2026-04-01', reviewer: 'Engineering', score: 5, comment: 'Best-in-class component quality.' },
        { date: '2026-02-12', reviewer: 'Procurement Team', score: 4, comment: 'Slight premium pricing but worth it.' },
      ],
    },
    {
      vendorId: 'v3',
      overall: 3.8,
      quality: 4.0,
      delivery: 3.5,
      cost: 4.2,
      responsiveness: 3.6,
      reviews: [
        { date: '2026-03-20', reviewer: 'Warehouse Ops', score: 4, comment: 'Packaging quality is good, delivery can be slow.' },
      ],
    },
    {
      vendorId: 'v4',
      overall: 3.1,
      quality: 3.0,
      delivery: 2.5,
      cost: 3.8,
      responsiveness: 2.8,
      reviews: [
        { date: '2026-05-01', reviewer: 'Procurement Team', score: 2, comment: 'Repeated delays, quality issues on last batch.' },
        { date: '2026-03-10', reviewer: 'QA Dept', score: 3, comment: 'Tolerance deviations on 12% of rods.' },
      ],
    },
    {
      vendorId: 'v5',
      overall: 3.5,
      quality: 3.8,
      delivery: 3.2,
      cost: 3.5,
      responsiveness: 3.8,
      reviews: [
        { date: '2026-04-15', reviewer: 'Logistics Coord', score: 4, comment: 'Responsive team, but customs delays outside their control.' },
      ],
    },
  ];

  const deliveries: Delivery[] = [
    { poNumber: 'PO-2026-003', vendorName: 'GreenPack Solutions', origin: 'Osaka, Japan', destination: 'Los Angeles, USA', eta: '2026-04-12', status: 'in-transit', progress: 65 },
    { poNumber: 'PO-2026-004', vendorName: 'Baltic Steel Ltd', origin: 'Riga, Latvia', destination: 'Houston, USA', eta: '2026-05-10', status: 'delayed', progress: 30 },
    { poNumber: 'PO-2026-002', vendorName: 'NovaTech Electronics', origin: 'San Jose, USA', destination: 'Austin, USA', eta: '2026-04-05', status: 'delivered', progress: 100 },
    { poNumber: 'PO-2026-001', vendorName: 'Apex Materials Corp', origin: 'Shanghai, China', destination: 'Seattle, USA', eta: '2026-02-28', status: 'delivered', progress: 100 },
  ];

  const riskAlerts: RiskAlert[] = [
    { id: 'r1', vendorId: 'v4', vendorName: 'Baltic Steel Ltd', type: 'financial', severity: 'high', title: 'Credit rating downgrade', description: "Baltic Steel Ltd credit rating downgraded by Moody's from B1 to B2. Increased risk of payment defaults or supply disruption.", date: '2026-05-20', resolved: false },
    { id: 'r2', vendorId: 'v1', vendorName: 'Apex Materials Corp', type: 'geopolitical', severity: 'medium', title: 'New export tariffs announced', description: 'Proposed 15% tariff on aluminum exports from China may affect pricing on existing contracts.', date: '2026-05-18', resolved: false },
    { id: 'r3', vendorId: 'v4', vendorName: 'Baltic Steel Ltd', type: 'supply', severity: 'critical', title: 'Production facility shutdown', description: 'Primary smelting plant temporarily shut down due to regulatory compliance issues. Expected 3-4 week delay on all orders.', date: '2026-05-15', resolved: false },
    { id: 'r4', vendorId: 'v5', vendorName: 'Sunrise Logistics', type: 'compliance', severity: 'low', title: 'Certification renewal pending', description: 'ISO 9001 certification expires next quarter. Renewal process initiated but not yet completed.', date: '2026-05-10', resolved: false },
    { id: 'r5', vendorId: 'v2', vendorName: 'NovaTech Electronics', type: 'quality', severity: 'low', title: 'Minor component variance', description: '0.3% variance detected in last PCB batch. Within tolerance but flagged for monitoring.', date: '2026-04-28', resolved: true },
  ];

  setVendors(vendors);
  setPurchaseOrders(purchaseOrders);
  setVendorRatings(ratings);
  setDeliveries(deliveries);
  setRiskAlerts(riskAlerts);
}

export function initData() {
  try {
    const existing = localStorage.getItem(VENDORS_KEY);
    if (!existing) {
      seedData();
    }
  } catch (e) {
    console.error('Failed to initialize data:', e);
  }
}
