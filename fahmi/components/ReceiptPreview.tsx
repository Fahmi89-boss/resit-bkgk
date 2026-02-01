
import React from 'react';
import { OrgSettings, ReceiptData } from '../types';

interface Props {
  settings: OrgSettings;
  data: ReceiptData;
}

const ReceiptPreview: React.FC<Props> = ({ settings, data }) => {
  const themeColors = {
    blue: {
      primary: 'bg-blue-600',
      text: 'text-blue-700',
      border: 'border-blue-600',
      light: 'bg-blue-50',
      accent: '#2563eb'
    },
    red: {
      primary: 'bg-red-600',
      text: 'text-red-700',
      border: 'border-red-600',
      light: 'bg-red-50',
      accent: '#dc2626'
    },
    yellow: {
      primary: 'bg-yellow-500',
      text: 'text-yellow-700',
      border: 'border-yellow-500',
      light: 'bg-yellow-50',
      accent: '#eab308'
    }
  };

  const theme = themeColors[settings.theme];

  return (
    <div className="overflow-auto bg-gray-200 p-8 flex justify-center">
      <div id="receipt-content" className="receipt-container relative bg-white border border-gray-100 font-serif">
        
        {/* Layered Geometric Header */}
        <div className={`absolute top-0 right-0 w-full h-40 overflow-hidden pointer-events-none`}>
          <div className={`absolute top-0 right-0 w-3/4 h-full ${theme.primary} -skew-x-12 transform translate-x-20 opacity-90`}></div>
          <div className={`absolute top-0 right-0 w-1/2 h-full ${theme.primary} -skew-x-12 transform translate-x-40 opacity-50`}></div>
          <div className={`absolute top-10 right-0 w-1/3 h-20 bg-black -skew-x-12 transform translate-x-10 opacity-10`}></div>
        </div>

        {/* Header Text Area */}
        <div className="relative z-10 p-10 flex justify-between items-start">
          <div className="flex gap-6 items-center">
            {settings.logo ? (
              <img src={settings.logo} alt="Logo" className="w-24 h-24 object-contain" />
            ) : (
              <div className="w-24 h-24 bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300 rounded text-gray-400 text-xs text-center p-2">
                Logo Sekolah
              </div>
            )}
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-1">{settings.schoolName}</h1>
              <p className="text-sm text-gray-600 uppercase max-w-md">{settings.schoolAddress}</p>
            </div>
          </div>

          <div className="text-right flex flex-col items-end">
            <h2 className="text-5xl font-black text-white italic mb-4 drop-shadow-md">RESIT RASMI</h2>
            <div className="bg-white/90 backdrop-blur-sm px-4 py-2 border-r-4 border-black shadow-lg">
              <span className="text-xs font-bold text-gray-500 block">NO. RESIT</span>
              <span className={`text-xl font-mono font-bold ${theme.text}`}>{data.receiptNo}</span>
            </div>
          </div>
        </div>

        {/* Org Ribbon */}
        <div className="relative z-10 px-10 -mt-2">
          <div className={`${theme.primary} text-white inline-block px-6 py-2 rounded-sm shadow-md font-bold uppercase tracking-widest text-sm mb-4`}>
            {settings.orgName}
          </div>
          <div className={`w-full h-1 ${theme.primary} opacity-30`}></div>
        </div>

        {/* Watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.05] pointer-events-none">
          {settings.logo ? (
             <img src={settings.logo} alt="Watermark" className="w-[400px] grayscale" />
          ) : (
            <div className="text-8xl font-black text-gray-400 rotate-12">{settings.orgName}</div>
          )}
        </div>

        {/* Main Body */}
        <div className="relative z-10 px-12 py-10 grid grid-cols-1 gap-8">
          <div className="grid grid-cols-[180px_1fr] gap-4 items-center">
             <span className="text-gray-500 font-bold uppercase text-xs tracking-wider">Diterima Daripada</span>
             <div className="border-b border-gray-300 pb-1 text-xl font-medium text-gray-800">{data.receivedFrom || '................................................................'}</div>
          </div>

          <div className="grid grid-cols-[180px_1fr] gap-4 items-center">
             <span className="text-gray-500 font-bold uppercase text-xs tracking-wider">Untuk Bayaran</span>
             <div className="border-b border-gray-300 pb-1 text-lg text-gray-800 italic">{data.forPayment || '................................................................'}</div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className={`${theme.light} px-8 py-5 border-l-8 ${theme.border} inline-flex items-center gap-6 shadow-sm`}>
               <span className={`text-2xl font-black ${theme.text}`}>JUMLAH RM</span>
               <span className={`text-4xl font-mono font-bold tracking-tighter ${theme.text}`}>
                 {data.amount.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
               </span>
               <span className="text-gray-500 font-bold italic ml-2">Sahaja</span>
            </div>
            
            <div className="text-right">
              <span className="text-gray-400 text-xs block font-bold mb-1">TARIKH</span>
              <span className="text-xl font-bold text-gray-800">{new Date(data.date).toLocaleDateString('ms-MY', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
        </div>

        {/* Footer Area: Signature & Stamps */}
        <div className="absolute bottom-12 left-12 right-12 flex justify-between items-end">
          {/* Lunas Stamp */}
          <div className="relative">
            {settings.showPaidStamp && (
              <div className="border-4 border-red-500 text-red-500 font-black text-4xl px-4 py-1 rounded-xl rotate-[-15deg] opacity-80 uppercase tracking-tighter shadow-sm flex flex-col items-center">
                <span>PAID</span>
                <span className="text-xs -mt-1">LUNAS</span>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center text-center">
             <div className="h-20 flex flex-col justify-end items-center mb-2">
                {settings.signature ? (
                  <img src={settings.signature} alt="Sign" className="max-h-16" />
                ) : (
                  <div className="italic text-gray-400 font-serif">Tandatangan Bendahari</div>
                )}
                <div className="w-64 border-b-2 border-black mt-2"></div>
             </div>
             <p className="font-bold text-gray-800 uppercase">{data.treasurerName || 'BENDAHARI BKGK'}</p>
             <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Bendahari {settings.orgName}</p>
             <p className="text-[10px] text-gray-400 mt-1">{settings.schoolName}</p>
          </div>

          {/* Official Stamp */}
          <div className="w-32 h-32 relative">
             {settings.stamp ? (
               <img src={settings.stamp} alt="Stamp" className="w-full h-full object-contain opacity-80" />
             ) : (
               <div className="w-full h-full border-2 border-dotted border-gray-200 rounded-full flex items-center justify-center text-[10px] text-gray-300">COP RASMI</div>
             )}
          </div>
        </div>

        {/* Bottom Footer Info */}
        <div className={`absolute bottom-0 w-full ${theme.primary} h-8 flex items-center justify-between px-10 text-[10px] text-white/80 font-bold uppercase tracking-widest`}>
          <span>Sesi {new Date().getFullYear()} / {new Date().getFullYear() + 1}</span>
          <span>Resit dijana secara sistem oleh aplikasi BKGK</span>
          <div className="flex items-center gap-2">
            <span className="bg-white text-black px-2 py-0.5 rounded text-[8px]">ORIGINAL</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ReceiptPreview;
