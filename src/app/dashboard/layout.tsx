import Sidebar from '@/components/dashboard/sidebar';
import { getUserOrganizationName } from './actions';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const orgName = await getUserOrganizationName();

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <Sidebar orgName={orgName} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
