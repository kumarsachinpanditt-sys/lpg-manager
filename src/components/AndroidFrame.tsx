import React from 'react';

interface Props {
  children: React.ReactNode;
  isPhoneView: boolean;
  onToggleView: () => void;
}

export const AndroidFrame: React.FC<Props> = ({ children, isPhoneView }) => {
  if (!isPhoneView) {
    return <div className="w-full h-screen flex flex-col bg-slate-950 overflow-hidden">{children}</div>;
  }

  return (
    <div className="w-full h-screen bg-slate-950 flex items-center justify-center p-0 sm:p-4 overflow-hidden">
      <div className="w-full h-full sm:max-w-[420px] sm:max-h-[860px] sm:rounded-[40px] sm:border-[8px] sm:border-slate-800 bg-slate-950 flex flex-col overflow-hidden shadow-2xl relative">
        {/* Android Notch / Speaker */}
        <div className="hidden sm:flex justify-center items-center h-5 w-full bg-slate-900 shrink-0 z-30">
          <div className="w-16 h-3 bg-slate-950 rounded-full"></div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden relative">{children}</div>
      </div>
    </div>
  );
};
