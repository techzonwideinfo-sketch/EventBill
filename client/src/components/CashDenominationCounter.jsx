import React from 'react';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
};

const CashDenominationCounter = ({ 
  denominationCounts, 
  onCountChange, 
  enteredAmount 
}) => {

  const denominations = [
    { label: '₹500', value: 500, key: '500' },
    { label: '₹200', value: 200, key: '200' },
    { label: '₹100', value: 100, key: '100' },
    { label: '₹50', value: 50, key: '50' },
    { label: '₹20', value: 20, key: '20' },
    { label: '₹10', value: 10, key: '10' },
    { label: 'Coins', value: 1, key: 'coins' }
  ];

  const handleIncrement = (key) => {
    const current = denominationCounts[key] || 0;
    onCountChange(key, current + 1);
  };

  const handleDecrement = (key) => {
    const current = denominationCounts[key] || 0;
    if (current > 0) {
      onCountChange(key, current - 1);
    }
  };

  const handleInputChange = (key, val) => {
    let parsed = parseInt(val, 10);
    if (isNaN(parsed) || parsed < 0) parsed = 0;
    onCountChange(key, parsed);
  };

  const countedCash = denominations.reduce((sum, denom) => {
    return sum + (denom.value * (denominationCounts[denom.key] || 0));
  }, 0);

  const difference = countedCash - (Number(enteredAmount) || 0);
  const isBalanced = countedCash === (Number(enteredAmount) || 0) && countedCash > 0;

  return (
    <div className="bg-white p-6 shadow-sm rounded-xl border border-gray-100 border-t-4 border-t-[#F2842F] h-full flex flex-col">
      <h3 className="font-bold text-[#30497D] text-lg border-b border-gray-100 pb-3 mb-4 flex items-center justify-between">
        <span>Cash Denomination</span>
        <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded">Reconciliation Tool</span>
      </h3>
      
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {denominations.map(denom => {
          const count = denominationCounts[denom.key] || 0;
          const subtotal = count * denom.value;
          return (
            <div key={denom.key} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-200">
              <div className="font-bold text-[#455B8A] w-16 text-lg">{denom.label}</div>
              
              <div className="flex items-center gap-2">
                <button 
                  type="button" 
                  onClick={() => handleDecrement(denom.key)}
                  className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-bold hover:bg-gray-200"
                >
                  -
                </button>
                <input 
                  type="number"
                  min="0"
                  value={count || ''}
                  onChange={(e) => handleInputChange(denom.key, e.target.value)}
                  placeholder="0"
                  className="w-14 text-center border-b-2 border-gray-200 focus:border-[#F2842F] outline-none font-bold text-[#253C6D] text-lg bg-transparent"
                />
                <button 
                  type="button" 
                  onClick={() => handleIncrement(denom.key)}
                  className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-bold hover:bg-gray-200"
                >
                  +
                </button>
              </div>

              <div className="w-24 text-right font-bold text-[#253C6D]">
                {subtotal > 0 ? formatCurrency(subtotal) : '-'}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mt-auto">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-500 font-semibold">Entered Cash</span>
          <span className="font-bold text-[#253C6D]">{formatCurrency(enteredAmount)}</span>
        </div>
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm text-gray-500 font-semibold">Counted Cash</span>
          <span className="font-bold text-[#253C6D]">{formatCurrency(countedCash)}</span>
        </div>
        
        <div className="pt-3 border-t border-gray-200">
          {difference === 0 ? (
            isBalanced ? (
              <div className="bg-green-100 text-green-700 px-3 py-2 rounded-lg font-bold flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Cash Balanced
              </div>
            ) : (
              <div className="text-gray-400 text-center text-sm font-semibold py-2">
                Enter denominations to balance
              </div>
            )
          ) : (
            <div className={`px-3 py-2 rounded-lg font-bold flex justify-between items-center ${difference > 0 ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
              <span>Difference</span>
              <span>{difference > 0 ? '+' : ''}{formatCurrency(difference)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CashDenominationCounter;
