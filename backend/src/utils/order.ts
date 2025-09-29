export type OrderStatus =
  | 'confirmed'
  | 'processing'
  | 'packed'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  confirmed: 'Confirmed',
  processing: 'Processing',
  packed: 'Packed',
  shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export function generateOrderNumber(prefix = 'CL'): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const seq = Math.floor(Math.random() * 1_000_000).toString().padStart(6, '0');
  return `${prefix}${yyyy}${seq}`;
}

export function statusEmailSubject(status: OrderStatus, orderNumber: string): string {
  switch (status) {
    case 'confirmed':
      return `Order Confirmed - Your CalistaLife Order #${orderNumber}`;
    case 'processing':
      return `We're preparing your order #${orderNumber}`;
    case 'shipped':
      return `Your CalistaLife order #${orderNumber} has shipped!`;
    case 'out_for_delivery':
      return `Your order #${orderNumber} is out for delivery today`;
    case 'delivered':
      return `Your CalistaLife order #${orderNumber} has been delivered`;
    case 'packed':
      return `Your order #${orderNumber} is packed`;
    case 'cancelled':
      return `Your order #${orderNumber} has been cancelled`;
    default:
      return `Update for order #${orderNumber}`;
  }
}