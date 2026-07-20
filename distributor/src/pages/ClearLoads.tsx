import { useState } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Trash2 } from 'lucide-react';

export default function ClearLoads() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [count, setCount] = useState(0);

  const handleClearLoads = async () => {
    if (!window.confirm('Are you sure you want to delete ALL loads? This cannot be undone!')) {
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const loadsRef = collection(db, 'loads');
      const snapshot = await getDocs(loadsRef);

      setCount(snapshot.size);
      setMessage(`Found ${snapshot.size} loads. Deleting...`);

      const deletePromises: Promise<void>[] = [];
      snapshot.forEach((document) => {
        deletePromises.push(deleteDoc(doc(db, 'loads', document.id)));
      });

      await Promise.all(deletePromises);
      setMessage(`Successfully deleted ${snapshot.size} loads!`);
    } catch (error) {
      console.error('Error deleting loads:', error);
      setMessage(`Error: ${error instanceof Error ? error.message : 'Failed to delete loads'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Clear All Loads</h1>
        <p className="text-gray-600">This will permanently delete all loads from the database</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="mb-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800 font-medium">⚠️ Warning</p>
            <p className="text-red-700 text-sm mt-1">
              This action will delete all loads from the database and cannot be undone.
            </p>
          </div>

          <button
            onClick={handleClearLoads}
            disabled={loading}
            className="w-full bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Trash2 className="w-5 h-5" />
            {loading ? 'Deleting...' : 'Delete All Loads'}
          </button>
        </div>

        {message && (
          <div className={`mt-4 p-4 rounded-lg ${
            message.includes('Error')
              ? 'bg-red-50 text-red-800'
              : message.includes('Successfully')
              ? 'bg-green-50 text-green-800'
              : 'bg-blue-50 text-blue-800'
          }`}>
            <p className="font-medium">{message}</p>
            {count > 0 && message.includes('Successfully') && (
              <p className="text-sm mt-1">{count} loads have been removed from the database</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
