// Layaway types for Bagclue

export interface Layaway {
  id: string;
  user_id: string | null;
  product_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  
  // Montos
  total_amount: number | null;
  amount_paid: number | null;
  amount_remaining: number | null;
  first_payment_amount: number | null;
  
  // Plan
  plan_type: 'cash' | '4_weekly_payments' | '8_weekly_payments' | '18_weekly_payments' | null;
  total_payments: number | null;
  payments_completed: number | null;
  payments_remaining: number | null;
  
  // Fechas
  plan_start_date: string | null;
  plan_end_date: string | null;
  next_payment_due_date: string | null;
  next_payment_amount: number | null;
  last_payment_at: string | null;
  
  // Estado
  status: LayawayStatus | null;
  policy_version: number | null;
  
  // Timestamps
  created_at: string;
  updated_at: string | null;
  
  // Joined data (opcional)
  product?: {
    title: string;
    image_url: string | null;
    slug: string;
  } | null;
  payments?: LayawayPayment[];
}

export interface LayawayPayment {
  id: string;
  layaway_id: string;
  payment_number: number;
  amount_due: number;
  amount_paid: number | null;
  due_date: string;
  paid_at: string | null;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'forfeited' | 'failed';
  payment_type: 'first' | 'installment' | 'final' | 'extra' | null;
  created_at: string;
  updated_at: string;
}

export type LayawayStatus =
  | 'pending'
  | 'active'
  | 'completed'
  | 'expired'
  | 'cancelled'
  | 'pending_first_payment'
  | 'overdue'
  | 'forfeited'
  | 'cancelled_for_non_payment'
  | 'cancelled_manual'
  | 'forfeiture_pending';

// Helper para formatear plan
export function formatPlanType(planType: string | null): string {
  if (!planType) return 'N/A';
  
  const planMap: Record<string, string> = {
    'cash': 'Pago de contado',
    '4_weekly_payments': '4 pagos semanales',
    '8_weekly_payments': '8 pagos semanales',
    '18_weekly_payments': '18 pagos semanales'
  };
  
  return planMap[planType] || planType;
}

// Helper para formatear estado
export function formatLayawayStatus(status: LayawayStatus | null): {
  label: string;
  color: string;
  icon: string;
} {
  if (!status) return { label: 'Desconocido', color: 'gray', icon: '❓' };
  
  const statusMap: Record<LayawayStatus, { label: string; color: string; icon: string }> = {
    'pending': { label: 'Pendiente', color: 'yellow', icon: '⏳' },
    'active': { label: 'Activo', color: 'green', icon: '🟢' },
    'completed': { label: 'Completado', color: 'green', icon: '✅' },
    'expired': { label: 'Expirado', color: 'red', icon: '⏱️' },
    'cancelled': { label: 'Cancelado', color: 'gray', icon: '❌' },
    'pending_first_payment': { label: 'Pendiente pago inicial', color: 'yellow', icon: '⏳' },
    'overdue': { label: 'Vencido', color: 'red', icon: '⚠️' },
    'forfeited': { label: 'Confiscado', color: 'red', icon: '🚫' },
    'cancelled_for_non_payment': { label: 'Cancelado por impago', color: 'red', icon: '❌' },
    'cancelled_manual': { label: 'Cancelado', color: 'gray', icon: '❌' },
    'forfeiture_pending': { label: 'Confiscación pendiente', color: 'orange', icon: '⚠️' }
  };
  
  return statusMap[status] || { label: status, color: 'gray', icon: '❓' };
}

// Helper para formatear estado de pago
export function formatPaymentStatus(status: string): {
  label: string;
  color: string;
  icon: string;
} {
  const statusMap: Record<string, { label: string; color: string; icon: string }> = {
    'pending': { label: 'Pendiente', color: 'yellow', icon: '⏳' },
    'paid': { label: 'Pagado', color: 'green', icon: '✅' },
    'overdue': { label: 'Vencido', color: 'red', icon: '⚠️' },
    'cancelled': { label: 'Cancelado', color: 'gray', icon: '❌' },
    'forfeited': { label: 'Confiscado', color: 'red', icon: '🚫' },
    'failed': { label: 'Fallido', color: 'red', icon: '❌' }
  };
  
  return statusMap[status] || { label: status, color: 'gray', icon: '❓' };
}
