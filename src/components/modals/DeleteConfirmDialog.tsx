import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

interface DeleteConfirmDialogProps {
  authorName: string;
  alertText: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmDialog({ authorName, alertText, onConfirm, onCancel }: DeleteConfirmDialogProps) {
  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
      onClick={onCancel}
    >
      <div 
        className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button 
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl"
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>

        {/* Content */}
        <div className="p-8 text-white">
          <p className="text-xl leading-relaxed">
            Are you sure you want to delete this alert by <span className="font-bold">{authorName}</span>. text:
          </p>
          <p className="text-xl mt-2">
            {alertText}
          </p>
        </div>

        {/* Footer */}
        <div className="bg-gray-900 px-8 py-4 flex items-center justify-end gap-4 rounded-b-lg">
          <button 
            onClick={onCancel}
            className="px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded text-lg"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded text-lg"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
