'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, X, Loader2 } from 'lucide-react';
import { approveDonationAction, rejectDonationAction } from '@/app/dashboard/donations/actions';

export function DonationReviewActions({ donationId }: { donationId: string }) {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const handleApprove = async () => {
    setIsApproving(true);
    const result = await approveDonationAction(donationId);
    setIsApproving(false);

    if (result?.error) {
      alert(`Erro ao aprovar: ${result.error}`);
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    const result = await rejectDonationAction(donationId);
    setIsRejecting(false);

    if (result?.error) {
      alert(`Erro ao reprovar: ${result.error}`);
    }
  };

  const isLoading = isApproving || isRejecting;

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        className="text-destructive hover:text-destructive hover:bg-destructive/10"
        onClick={handleReject}
        disabled={isLoading}
      >
        {isRejecting ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <X className="w-4 h-4 mr-1.5" />}
        Reprovar
      </Button>
      <Button
        size="sm"
        className="bg-green-600 hover:bg-green-700 text-white"
        onClick={handleApprove}
        disabled={isLoading}
      >
        {isApproving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Check className="w-4 h-4 mr-1.5" />}
        Aprovar
      </Button>
    </div>
  );
}
