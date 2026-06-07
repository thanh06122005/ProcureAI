export interface Vendor {
  id: string;
  name: string;
  category: string;
  contact: string;
  email: string;
  location: string;
  rating: number;
  status: 'active' | 'inactive' | 'under-review';
  onTimeDelivery: number;
  qualityScore: number;
  costIndex: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  contractEnd: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendorId: string;
  vendorName: string;
  date: string;
  deliveryDate: string;
  total: number;
  status: 'draft' | 'submitted' | 'approved' | 'shipped' | 'delivered' | 'overdue' | 'cancelled';
  items: POItem[];
}

export interface POItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface VendorRating {
  vendorId: string;
  overall: number;
  quality: number;
  delivery: number;
  cost: number;
  responsiveness: number;
  reviews: RatingReview[];
}

export interface RatingReview {
  date: string;
  reviewer: string;
  score: number;
  comment: string;
}

export interface Delivery {
  poNumber: string;
  vendorName: string;
  origin: string;
  destination: string;
  eta: string;
  status: 'in-transit' | 'delivered' | 'delayed' | 'customs-hold';
  progress: number;
}

export interface RiskAlert {
  id: string;
  vendorId: string;
  vendorName: string;
  type: 'supply' | 'financial' | 'compliance' | 'geopolitical' | 'quality';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  date: string;
  resolved: boolean;
}

export type Page = 'dashboard' | 'vendors' | 'purchase-orders' | 'delivery' | 'scorecard' | 'ai-risk';
