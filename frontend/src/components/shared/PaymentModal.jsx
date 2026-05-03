import React, { useState } from 'react';
import { CreditCardIcon, LockClosedIcon } from '@heroicons/react/24/outline';

export const PaymentModal = ({ isOpen, amount, onSuccess, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  if (!isOpen) return null;

  const handlePayment = (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate bank processing delay
    setTimeout(() => {
      setLoading(false);
      // Generate a mock transaction ID
      const mockTxnId = 'txn_' + Math.random().toString(36).substr(2, 9);
      onSuccess(mockTxnId);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-2 text-slate-800">
            <LockClosedIcon className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-lg">Secure Checkout</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-xl leading-none">&times;</button>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="text-center mb-6">
            <p className="text-slate-500 text-sm">Total Amount to Pay</p>
            <p className="text-3xl font-bold text-slate-800 mt-1">₹{amount.toFixed(2)}</p>
          </div>

          <form onSubmit={handlePayment} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Card Number</label>
              <div className="relative">
                <CreditCardIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="0000 0000 0000 0000"
                  className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-teal-500 focus:border-teal-500"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Expiry Date</label>
                <input
                  type="text"
                  required
                  placeholder="MM/YY"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-teal-500 focus:border-teal-500"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">CVV</label>
                <input
                  type="text"
                  required
                  placeholder="123"
                  maxLength="4"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-teal-500 focus:border-teal-500"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-md disabled:bg-slate-400"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  `Pay ₹${amount.toFixed(2)}`
                )}
              </button>
            </div>
          </form>
          
          <div className="mt-4 text-center">
            <p className="text-xs text-slate-400">This is a simulated payment gateway. Do not enter real credit card details.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
