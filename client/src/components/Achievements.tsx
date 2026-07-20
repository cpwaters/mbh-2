import { Award } from 'lucide-react';

export default function Achievements() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Award className="w-5 h-5 text-blue-600" />
        Achievements
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-yellow-50 rounded-lg">
          <div className="text-3xl mb-2">🏆</div>
          <div className="font-medium text-gray-900">Top Rated</div>
          <div className="text-xs text-gray-500">4.9+ Rating</div>
        </div>
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="text-3xl mb-2">⚡</div>
          <div className="font-medium text-gray-900">Speed Demon</div>
          <div className="text-xs text-gray-500">100+ Trips</div>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-3xl mb-2">✅</div>
          <div className="font-medium text-gray-900">Reliable</div>
          <div className="text-xs text-gray-500">98% On-Time</div>
        </div>
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <div className="text-3xl mb-2">🎯</div>
          <div className="font-medium text-gray-900">Long Hauler</div>
          <div className="text-xs text-gray-500">45K+ miles</div>
        </div>
      </div>
    </div>
  );
}
