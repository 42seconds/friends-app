export interface TicketTier{
    tier: string;
  price: number;
  available: boolean;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  tag: string;
  featured: boolean;
  status: 'draft' | 'published';
  image: string;
  lineup: string[];
  tickets: TicketTier[];
}

export type TicketStatus = 'pending_payment' | 'pending_verification' | 'confirmed' | 'rejected';

export interface PurchasedTicket {
  id: string;
  userId: string;
  eventId: string;
  tier: string;
  quantity: number;
  totalPrice: number;
  status: TicketStatus;
  proofOfPayment: string;
  qrCode: string;
  createdAt: string;
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  dob: string;
  role: string;
  createdAt: string;
}