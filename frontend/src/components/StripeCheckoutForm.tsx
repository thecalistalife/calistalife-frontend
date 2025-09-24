import React, { useState } from 'react';

interface SimplePaymentFormProps {
  onSuccess: () => void;
  onError: (error: string) => void;
  totalAmount: number;
}

export default function SimplePaymentForm({ onSuccess, onError, totalAmount }: SimplePaymentFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!cardNumber || !expiry || !cvc || !name) {
      onError('Please fill in all payment fields');
      return;
    }

    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      if (cardNumber === '4242424242424242') {
        onSuccess();
      } else {
        onError('Invalid card number. Use 4242424242424242 for testing.');
      }
      setIsProcessing(false);
    }, 2000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center py-4 bg-yellow-50 border border-yellow-200 rounded mb-4">
        <p className="text-sm text-yellow-800">
          <strong>Demo Mode:</strong> Use card number <code>4242424242424242</code> for testing
        </p>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
        <input
          type="text"
          placeholder="4242 4242 4242 4242"
          className="w-full p-3 border rounded"
          value={cardNumber}
          onChange={(e) => setCardNumber(e.target.value.replace(/\s/g, ''))}
          maxLength={16}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Expiry</label>
          <input
            type="text"
            placeholder="MM/YY"
            className="w-full p-3 border rounded"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
            maxLength={5}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">CVC</label>
          <input
            type="text"
            placeholder="123"
            className="w-full p-3 border rounded"
            value={cvc}
            onChange={(e) => setCvc(e.target.value)}
            maxLength={3}
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name on Card</label>
        <input
          type="text"
          placeholder="John Doe"
          className="w-full p-3 border rounded"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      
      <button
        type="submit"
        disabled={isProcessing}
        className="w-full px-8 py-3 bg-black text-white font-medium rounded hover:bg-red-500 transition-colors disabled:opacity-50"
      >
        {isProcessing ? 'Processing Payment...' : `Pay $${(totalAmount / 100).toFixed(2)}`}
      </button>
    </form>
  );
}
