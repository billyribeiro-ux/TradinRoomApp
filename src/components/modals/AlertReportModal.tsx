import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSearch } from '@fortawesome/free-solid-svg-icons';

interface AlertReportModalProps {
  alertId: string;
  onClose: () => void;
}

export function AlertReportModal({ alertId, onClose }: AlertReportModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gray-800 px-6 py-4 flex items-center justify-between border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">
            Alert Sent Report. AlertID: {alertId}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex gap-4">
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 font-medium"
            >
              <option>All</option>
              <option>Sent</option>
              <option>Failed</option>
            </select>
            <div className="flex-1 relative">
              <input 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Enter search term"
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900"
              />
              <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600">
                <FontAwesomeIcon icon={faSearch} />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center p-12">
          <p className="text-white text-xl">No Reports.</p>
        </div>

        {/* Footer */}
        <div className="bg-gray-800 px-6 py-4 flex items-center justify-end border-t border-gray-700">
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded text-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
