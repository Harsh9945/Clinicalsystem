import React, { useState } from 'react';

export const VitalsModal = ({ isOpen, onSubmit, onSkip }) => {
  const [vitals, setVitals] = useState({ height: '', weight: '', age: '' });

  if (!isOpen) return null;

  const handleChange = (e) => {
    setVitals({ ...vitals, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(vitals);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-fade-in-up">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Vitals Intake</h2>
        <p className="text-slate-600 mb-6">
          Before chatting with the AI, please provide some basic vitals to help tailor your diet plan and recommendations.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Age</label>
            <input
              type="number"
              name="age"
              value={vitals.age}
              onChange={handleChange}
              placeholder="e.g., 34"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Height (cm)</label>
            <input
              type="number"
              name="height"
              value={vitals.height}
              onChange={handleChange}
              placeholder="e.g., 175"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Weight (kg)</label>
            <input
              type="number"
              name="weight"
              value={vitals.weight}
              onChange={handleChange}
              placeholder="e.g., 70"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onSkip}
              className="flex-1 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
            >
              Skip
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium shadow-md transition-colors"
            >
              Start Chat
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
