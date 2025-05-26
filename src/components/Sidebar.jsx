// Sidebar.jsx
import { Home, Layers, Activity, Wallet, Users, Settings, HelpCircle, X } from 'your-icon-library';

export function Sidebar({ sidebarOpen, toggleSidebar, router }) {
  return (
    <div className={`fixed top-0 left-0 h-full bg-gray-800 text-white transition-all duration-300 ease-in-out z-20 ${sidebarOpen ? 'w-64' : 'w-0'} overflow-hidden`}>
      <div className="p-4 flex justify-between items-center">
        <h2 className="text-xl font-bold">Menu</h2>
        <button onClick={toggleSidebar} className="p-1 hover:bg-gray-700 rounded">
          <X className="h-6 w-6" />
        </button>
      </div>
      <nav className="mt-8">
        <ul className="space-y-2">
          <li>
            <a href="/dashboard" className="flex items-center px-4 py-3 hover:bg-gray-700">
              <Home className="h-5 w-5 mr-3" />
              Dashboard
            </a>
          </li>
          <li>
            <a
              href="/batches"
              onClick={(e) => {
                e.preventDefault();
                router.push('/batches');
              }}
              className="flex items-center px-4 py-3 hover:bg-gray-700"
            >
              <Layers className="h-5 w-5 mr-3" />
              Batches
            </a>
          </li>
          <li>
            <a href="#" className="flex items-center px-4 py-3 hover:bg-gray-700">
              <Activity className="h-5 w-5 mr-3" />
              Analytics
            </a>
          </li>
          <li>
            <a href="#" className="flex items-center px-4 py-3 hover:bg-gray-700">
              <Wallet className="h-5 w-5 mr-3" />
              Token Wallet
            </a>
          </li>
          <li>
            <a href="#" className="flex items-center px-4 py-3 hover:bg-gray-700">
              <Users className="h-5 w-5 mr-3" />
              Profile
            </a>
          </li>
          <li>
            <a href="#" className="flex items-center px-4 py-3 hover:bg-gray-700">
              <Settings className="h-5 w-5 mr-3" />
              Settings
            </a>
          </li>
          <li>
            <a href="#" className="flex items-center px-4 py-3 hover:bg-gray-700">
              <HelpCircle className="h-5 w-5 mr-3" />
              Help
            </a>
          </li>
        </ul>
      </nav>
    </div>
  );
}
