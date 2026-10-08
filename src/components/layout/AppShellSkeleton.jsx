import BrandLogo from '../ui/BrandLogo';

// Shown while the session is checked on a hard reload: the app's frame (sidebar, header)
// is already in place and only the content area shimmers, so it doesn't feel like a full
// reload of a different app.
const Bar = ({ className }) => <div className={`rounded bg-gray-100 animate-pulse ${className}`} />;

const AppShellSkeleton = () => (
  <div className="flex h-screen bg-gray-50" role="status" aria-label="Loading">
    <aside className="hidden lg:flex w-60 flex-col bg-white border-r">
      <div className="h-14 px-4 border-b flex items-center"><BrandLogo className="w-32 h-auto" /></div>
      <div className="px-4 py-2.5 border-b space-y-1.5"><Bar className="h-2 w-16" /><Bar className="h-3 w-28" /></div>
      <div className="px-3 py-4 space-y-2.5">
        {Array.from({ length: 10 }, (_, i) => <Bar key={i} className="h-7 w-full" />)}
      </div>
    </aside>
    <div className="flex-1 flex flex-col min-w-0">
      <div className="h-14 bg-white border-b" />
      <main className="flex-1 p-4 sm:p-6 space-y-4">
        <Bar className="h-7 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }, (_, i) => <Bar key={i} className="h-24" />)}
        </div>
        <Bar className="h-64 w-full" />
      </main>
    </div>
  </div>
);

export default AppShellSkeleton;
