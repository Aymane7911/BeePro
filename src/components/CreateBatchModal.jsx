// CreateBatchModal.jsx
export function CreateBatchModal({
  show,
  onClose,
  batchNumber,
  setBatchNumber,
  batchName,
  setBatchName,
  createBatch,
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">Create New Batch</h3>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Batch Number
          </label>
          <input
            type="text"
            name="batchNumber"
            value={batchNumber || ''}
            onChange={(e) => setBatchNumber(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            placeholder="Enter batch number"
            autoFocus
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Batch Name
          </label>
          <input
            type="text"
            name="batchName"
            value={batchName || ''}
            onChange={(e) => setBatchName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            placeholder="Enter batch name"
          />
        </div>

        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={createBatch}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
