export type Role = 'ADMIN' | 'MANAGER' | 'SPECIALIST' | 'HEAD';
export type TicketStatus = 'NEW' | 'IN_PROGRESS' | 'PENDING' | 'RESOLVED' | 'CLOSED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface User { id: number; name: string; email: string; role: Role; isActive: boolean; createdAt: string; }
export interface Client { id: number; name: string; email?: string; phone?: string; company?: string; inn?: string; notes?: string; createdAt: string; _count?: { tickets: number }; }
export interface Comment { id: number; text: string; isInternal: boolean; createdAt: string; author: { id: number; name: string }; }
export interface Ticket {
  id: number; title: string; description: string; status: TicketStatus; priority: Priority; category: string;
  slaDeadline?: string; resolvedAt?: string; createdAt: string; updatedAt: string;
  client: { id: number; name: string; company?: string };
  assignee?: { id: number; name: string; email: string };
  creator: { id: number; name: string };
  comments: Comment[];
}
export interface Category { id: number; name: string; slaHours: number; }
export interface AuditLog { id: number; action: string; details?: string; createdAt: string; user?: { name: string }; }
