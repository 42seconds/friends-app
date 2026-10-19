export interface TicketTier {
  tier: string;
  price: number; // face value, excl. fees + VAT
  available: boolean;
  description?: string;
}

// Lineup entries can be plain names or timed slots.
export type LineupEntry = string | { time?: string; name: string; note?: string };

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  address?: string;
  tag: string;
  featured: boolean;
  status: 'draft' | 'published';
  image: string;
  lineup: LineupEntry[];
  tickets: TicketTier[];
  soldOut?: boolean;
  capacity?: number;
  gallery?: string[];
}

export type TicketStatus = 'pending_payment' | 'pending_verification' | 'confirmed' | 'rejected' | 'expired' | 'cancelled';

export interface TicketTransfer {
  toName: string;
  toPhone: string;
  sentAt: string;
  status: 'pending' | 'accepted' | 'cancelled';
}

export interface TicketRejection {
  reason: string;
  message: string;
  keepHeld: boolean;
  at: string;
}

export interface PurchasedTicket {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  eventId: string;
  eventTitle?: string;
  eventDate?: string;
  eventTime?: string;
  eventLocation?: string;
  eventImage?: string;
  tag?: string;
  tier: string;
  price?: number;
  quantity: number;
  subtotal?: number;
  serviceFee?: number;
  vat?: number;
  discount?: number;
  promoCode?: string;
  totalPrice: number;
  status: TicketStatus;
  proofOfPayment: string;
  proofUploadedAt?: string;
  qrCode: string;
  createdAt: string;
  holdExpiresAt?: string;
  validatedAt?: string;
  rejection?: TicketRejection;
  checkedIn?: boolean;
  checkedInAt?: string;
  checkedInDoor?: string;
  checkedInBy?: string;
  staffNote?: string;
  transfer?: TicketTransfer;
  releasedToWaitlist?: boolean;
  refundRequested?: boolean;
}

export interface RefundBank {
  holder: string;
  bank: string;
  accountType: 'cheque' | 'savings';
  accountNumber: string;
  branchCode: string;
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  dob?: string;
  role: string;
  createdAt: string;
  interests?: string[];
  refundBank?: RefundBank;
}
