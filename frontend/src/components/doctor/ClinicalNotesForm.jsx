import React, { useState } from 'react';
import { appointmentService } from '../../services/appointmentService';

export const ClinicalNotesForm = ({ consultationId, patientEmail, onComplete, onCancel }) => {
  const [notes, setNotes] = useState('');
  const [prescription, setPrescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Follow-up state
  const [scheduleFollowUp, setScheduleFollowUp] = useState(false);
  const [followUpDays, setFollowUpDays] = useState(7);
  const [followUpMessage, setFollowUpMessage] = useState('Please schedule a follow-up appointment to review your progress.');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Save Clinical Notes
      await appointmentService.addClinicalNotes(consultationId, notes, prescription);

      // 2. Schedule Follow-up if requested
      if (scheduleFollowUp && patientEmail) {
        await appointmentService.scheduleFollowUp(
          patientEmail,
          followUpMessage,
          'FOLLOW_UP_REMINDER',
          followUpDays
        );
      }

      onComplete();
    } catch (err) {
      setError('Failed to save clinical notes or schedule follow-up.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <h3 className="text-xl font-bold text-slate-800 mb-4">Clinical Notes & E-Prescription</h3>
      
      {error && <div className="mb-4 text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Doctor's Notes (Official)</label>
          <textarea
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
            rows="4"
            placeholder="Enter clinical observations, confirm or override AI predictions..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">E-Prescription</label>
          <textarea
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-mono text-sm"
            rows="3"
            placeholder="Rx: Medication Name - Dosage - Frequency"
            value={prescription}
            onChange={(e) => setPrescription(e.target.value)}
          />
        </div>

        <div className="pt-4 border-t border-slate-100">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              className="w-5 h-5 text-teal-600 border-slate-300 rounded focus:ring-teal-500"
              checked={scheduleFollowUp}
              onChange={(e) => setScheduleFollowUp(e.target.checked)}
            />
            <span className="text-slate-800 font-medium">Schedule Auto Follow-up Reminder</span>
          </label>

          {scheduleFollowUp && (
            <div className="mt-4 space-y-4 pl-8 border-l-2 border-teal-100">
              <div>
                <label className="block text-sm text-slate-600 mb-1">Days until reminder</label>
                <input
                  type="number"
                  min="1"
                  className="w-32 px-3 py-1.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 outline-none"
                  value={followUpDays}
                  onChange={(e) => setFollowUpDays(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Message to Patient</label>
                <input
                  type="text"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 outline-none text-sm"
                  value={followUpMessage}
                  onChange={(e) => setFollowUpMessage(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-teal-600 text-white hover:bg-teal-700 rounded-lg font-medium shadow-md transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Finalize & Save'}
          </button>
        </div>
      </form>
    </div>
  );
};
