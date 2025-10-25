import React, { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

const EventPlanner = () => {
  const [eventName, setEventName] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [outfit, setOutfit] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFindOutfit = async () => {
    if (!eventName.trim()) {
      setError('Please enter an event name');
      return;
    }

    setLoading(true);
    setError('');
    setOutfit(null);

    try {
      const response = await fetch('http://localhost:5001/api/outfit-for-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          eventName: eventName.trim(),
          eventDescription: eventDescription.trim()
        }),
      });

      if (!response.ok) {
        if (response.status === 404) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'No matching outfit found');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setOutfit(data.outfit);
    } catch (err) {
      setError(err.message || 'Failed to find outfit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-2">Event Planner</h2>
      <p className="text-gray-600 mb-6">
        Tell us about your event and we'll find you the perfect outfit!
      </p>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Event Name
          </label>
          <input
            type="text"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
            placeholder="e.g., Spring Formal, Football Game, Library Study Session"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Event Description
          </label>
          <textarea
            value={eventDescription}
            onChange={(e) => setEventDescription(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
            placeholder="e.g., It's an outdoor BBQ at the park, A fancy dinner and dance at the new hall, Casual study session in the library"
            rows={3}
          />
        </div>

        <button
          onClick={handleFindOutfit}
          disabled={loading}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Finding Outfit...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Find Me an Outfit
            </>
          )}
        </button>
      </div>

      {outfit && (
        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Your Perfect Outfit</h3>
            <div className="inline-block bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full font-semibold mb-4">
              Event: {eventName}
            </div>
            {eventDescription && (
              <p className="text-gray-600 text-sm mb-4 italic">
                "{eventDescription}"
              </p>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border-2 border-indigo-200">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Top</h4>
              <p className="text-gray-700 text-xl font-medium">{outfit.top}</p>
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border-2 border-indigo-200">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Pants</h4>
              <p className="text-gray-700 text-xl font-medium">{outfit.pants}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventPlanner;
