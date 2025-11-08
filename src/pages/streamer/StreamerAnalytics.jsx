import Sidebar from '../../components/Sidebar';

export default function StreamerAnalytics() {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <Sidebar />
      <main className="flex-1 p-8 ml-64">
        <header className="mb-6">
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-sm text-gray-400 mt-1">Overview of your streams' performance</p>
        </header>

        <section className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <p className="text-sm text-gray-400">Views (last 7 days)</p>
            <p className="text-2xl font-bold text-white mt-3">—</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <p className="text-sm text-gray-400">Avg Watch Time</p>
            <p className="text-2xl font-bold text-white mt-3">—</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <p className="text-sm text-gray-400">Revenue</p>
            <p className="text-2xl font-bold text-white mt-3">—</p>
          </div>
        </section>
      </main>
    </div>
  );
}
