// Header.jsx
import { Menu, Wallet, PlusCircle, Package } from 'your-icon-library';

export function Header({
  toggleSidebar,
  data,
  setShowBuyTokensModal,
  setShowBatchModal,
  router,
  lastUpdated,
  logoutHandler,
}) {
  return (
    <header className="bg-white p-4 rounded-lg shadow text-black">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <button
            onClick={toggleSidebar}
            className="mr-4 p-1 rounded hover:bg-gray-100 md:mr-6"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex items-center">
            <div className="mr-3 bg-yellow-500 p-2 rounded">
              {/* Honey icon SVG */}
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM6 14C5.45 14 5 13.55 5 13C5 12.45 5.45 12 6 12C6.55 12 7 12.45 7 13C7 13.55 6.55 14 6 14ZM9 9C8.45 9 8 8.55 8 8C8 7.45 8.45 7 9 7C9.55 7 10 7.45 10 8C10 8.55 9.55 9 9 9ZM15 9C14.45 9 14 8.55 14 8C14 7.45 14.45 7 15 7C15.55 7 16 7.45 16 8C16 8.55 15.55 9 15 9ZM18 14C17.45 14 17 13.55 17 13C17 12.45 17.45 12 18 12C18.55 12 19 12.45 19 13C19 13.55 18.55 14 18 14Z"
                  fill="white"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">HoneyCertify</h1>
          </div>
        </div>
        <div className="flex items-center">
          <div className="mr-4 bg-gray-100 p-3 rounded-lg flex items-center">
            <Wallet className="h-5 w-5 text-yellow-600 mr-2" />
            <div>
              <p className="text-sm text-gray-500">Token Balance</p>
              <p className="text-lg font-bold">
                {data.tokenStats.remainingTokens} / {data.tokenStats.totalTokens}
              </p>
            </div>
            <button
              onClick={() => setShowBuyTokensModal(true)}
              className="ml-3 p-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 flex items-center"
            >
              <PlusCircle className="h-4 w-4 mr-1" />
              Buy
            </button>
          </div>
          <button
            onClick={() => setShowBatchModal(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 mr-3"
          >
            <Package className="w-4 h-4 mr-2" />
            Create Batch
          </button>
          <button
            onClick={() => router.push('/premium')}
            className="flex items-center px-4 py-2 bg-yellow-400 text-white rounded hover:bg-yellow-700 mr-3"
          >
            <Package className="w-4 h-4 mr-2" />
            Premium
          </button>
          <button
            onClick={logoutHandler}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 mr-3"
          >
            <Package className="w-4 h-4 mr-2" />
            Logout
          </button>
        </div>
      </div>
      <p className="text-gray-500 text-sm mt-1">Last updated: {lastUpdated}</p>
    </header>
  );
}
