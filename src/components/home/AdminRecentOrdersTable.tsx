import React from 'react';
import { cn } from '@/lib/utils';

export type RecentOrder = {
  id: string;
  customer: string;
  total: string;
  status: 'pending' | 'paid' | 'failed' | 'processing';
  createdAt: string;
};

const statusCopy: Record<RecentOrder['status'], string> = {
  pending: 'بانتظار الدفع',
  paid: 'مدفوع',
  failed: 'فشل الدفع',
  processing: 'قيد المعالجة',
};

const statusColor: Record<RecentOrder['status'], string> = {
  pending: 'var(--warning)',
  paid: 'var(--success)',
  failed: 'var(--danger)',
  processing: 'var(--accent)',
};

export interface AdminRecentOrdersTableProps {
  orders: RecentOrder[];
  className?: string;
}

export const AdminRecentOrdersTable: React.FC<AdminRecentOrdersTableProps> = ({ orders, className }) => {
  return (
    <section
      className={cn(
        'rounded-[var(--radius-l)] border border-border bg-card/88 shadow-md backdrop-blur-xl',
        className
      )}
      aria-label="أحدث الطلبات"
      data-component="admin-recent-orders"
    >
      <header className="flex items-center justify-between border-b border-border px-[var(--spacing-lg)] py-[var(--spacing-md)]">
        <div>
          <h2 className="text-sm font-semibold text-foreground">آخر 5 طلبات</h2>
          <p className="text-xs text-muted-foreground">متابعة الحالات الحرجة فوراً</p>
        </div>
        <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
          {orders.length} طلبات
        </span>
      </header>
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-2 px-[var(--spacing-lg)] py-[var(--spacing-md)] text-right">
          <thead className="text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th scope="col" className="px-[var(--spacing-sm)] py-[var(--spacing-xs)] font-medium">
                رقم الطلب
              </th>
              <th scope="col" className="px-[var(--spacing-sm)] py-[var(--spacing-xs)] font-medium">
                العميل
              </th>
              <th scope="col" className="px-[var(--spacing-sm)] py-[var(--spacing-xs)] font-medium">
                الإجمالي
              </th>
              <th scope="col" className="px-[var(--spacing-sm)] py-[var(--spacing-xs)] font-medium">
                الحالة
              </th>
              <th scope="col" className="px-[var(--spacing-sm)] py-[var(--spacing-xs)] font-medium">
                التاريخ
              </th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr
                key={order.id}
                className="rounded-[var(--radius-m)] border border-border bg-muted text-sm text-foreground shadow-sm transition-colors hover:bg-card"
              >
                <td className="px-[var(--spacing-sm)] py-[var(--spacing-sm)] font-mono text-xs">#{order.id}</td>
                <td className="px-[var(--spacing-sm)] py-[var(--spacing-sm)] font-medium">{order.customer}</td>
                <td className="px-[var(--spacing-sm)] py-[var(--spacing-sm)] text-accent">{order.total}</td>
                <td className="px-[var(--spacing-sm)] py-[var(--spacing-sm)]">
                  <span
                    className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-medium"
                    style={{ color: statusColor[order.status] }}
                  >
                    <span className="relative flex h-2 w-2">
                      <span
                        className="absolute inset-0 rounded-full opacity-50"
                        style={{ backgroundColor: statusColor[order.status] }}
                      />
                      <span
                        className="relative inline-flex h-2 w-2 rounded-full"
                        style={{ backgroundColor: statusColor[order.status] }}
                      />
                    </span>
                    {statusCopy[order.status]}
                  </span>
                </td>
                <td className="px-[var(--spacing-sm)] py-[var(--spacing-sm)] text-muted-foreground">{order.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default AdminRecentOrdersTable;
