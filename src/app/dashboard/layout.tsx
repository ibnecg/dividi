import Sidebar from '@/components/dashboard/sidebar';
import { getUserOrganizationName } from './actions';
import { getPendingDonationsCount } from '@/app/dashboard/donations/actions';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [orgName, pendingCount] = await Promise.all([
    getUserOrganizationName(),
    getPendingDonationsCount(),
  ]);

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <Sidebar orgName={orgName} pendingDonationsCount={pendingCount} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
