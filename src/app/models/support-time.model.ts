export interface SupportTimeRecord {
  id: string;
  userId: string;
  userName: string;
  startDate: string;      // ISO date
  endDate: string;        // ISO date
  startTime: string;      // HH:mm
  endTime: string;        // HH:mm
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectReason?: string;
}
