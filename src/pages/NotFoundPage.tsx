import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Stamp, Button, ScribbleUnderline } from '../components/ui';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full max-w-xl mx-auto px-6 py-20 text-center space-y-6">
      <div className="flex flex-col items-center gap-3">
        <div className="w-20 h-20 rounded-full bg-[#EADFCB] border-[1.5px] border-[#14231C] shadow-[3px_3px_0_#14231C] flex items-center justify-center text-4xl">
          📭
        </div>
        <Stamp text="LOST PARCEL" subtext="WAYBILL 404" variant="tomato" size="lg" rotation={-4} />
      </div>

      <div className="space-y-2">
        <h1 className="font-fraunces text-3xl sm:text-4xl font-semibold text-[#14231C]">
          Lost in <span className="font-fraunces-italic font-normal">Transit</span>
        </h1>
        <div className="w-36 mx-auto text-[#E8502B]">
          <ScribbleUnderline />
        </div>
      </div>

      <p className="text-sm text-[#14231C]/75 font-sans leading-relaxed max-w-md mx-auto">
        This parcel has gone astray on the railway network. The requested folio was not logged in our central registry or has been returned to depot.
      </p>

      <div className="pt-2 flex justify-center gap-3">
        <Button variant="primary" size="md" onClick={() => navigate('/')}>
          Return to Storefront
        </Button>
        <Button variant="secondary" size="md" onClick={() => navigate('/shop')}>
          Browse 36 Wares
        </Button>
      </div>
    </div>
  );
};
