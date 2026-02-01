
import React, { useState, useEffect, useMemo } from 'react';
import { OrgSettings, ReceiptData, StorageState, SavedReceipt } from './types';
import { getStorageData, saveStorageData, generateReceiptNo } from './utils/storage';
import { exportAsImage, exportAsPDF } from './utils/export';
import ReceiptPreview from './components/ReceiptPreview';
import { jsPDF } from 'jspdf';

const App: React.FC = () => {
  const storage = getStorageData();
  const [settings, setSettings] = useState<OrgSettings>(storage.settings);
  const [lastReceiptNo, setLastReceiptNo] = useState<number>(storage.lastReceiptNumber);
  const [lastYear, setLastYear] = useState<number>(storage.lastYear);
  const [history, setHistory] = useState<SavedReceipt[]>(storage.history);
  
  const [activeTab, setActiveTab] = useState<'borang' | 'tetapan' | 'rekod'>('borang');
  
  const [receiptData, setReceiptData] = useState<ReceiptData>({
    receivedFrom: '',
    amount: 0,
    forPayment: '',
    date: new Date().toISOString().split('T')[0],
    receiptNo: '',
    treasurerName: '',
  });

  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const newNo = generateReceiptNo(lastReceiptNo, lastYear);
    setReceiptData(prev => ({ ...prev, receiptNo: newNo }));
    
    if (currentYear !== lastYear) {
      setLastYear(currentYear);
      setLastReceiptNo(0);
    }
  }, [lastReceiptNo, lastYear]);

  const handleSaveSettings = (newSettings: OrgSettings) => {
    setSettings(newSettings);
    saveStorageData({ settings: newSettings, lastReceiptNumber: lastReceiptNo, lastYear, history });
    alert('Tetapan berjaya disimpan!');
  };

  const handleFinalizeReceipt = () => {
    if (!receiptData.receivedFrom || receiptData.amount <= 0) {
      alert('Sila isi maklumat pembayar dan jumlah dengan betul.');
      return;
    }

    const match = receiptData.receiptNo.match(/\/(\d+)$/);
    const currentCount = match ? parseInt(match[1]) : lastReceiptNo + 1;
    
    const newRecord: SavedReceipt = {
      ...receiptData,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    };

    const newHistory = [newRecord, ...history];
    const newLastNo = Math.max(currentCount, lastReceiptNo);

    setHistory(newHistory);
    setLastReceiptNo(newLastNo);
    
    saveStorageData({
      settings,
      lastReceiptNumber: newLastNo,
      lastYear,
      history: newHistory
    });
    
    alert(`Rekod ${receiptData.receiptNo} telah disimpan dalam sejarah.`);
  };

  const handleDeleteRecord = (id: string) => {
    if (confirm('Adakah anda pasti mahu memadam rekod ini?')) {
      const newHistory = history.filter(r => r.id !== id);
      setHistory(newHistory);
      saveStorageData({ settings, lastReceiptNumber: lastReceiptNo, lastYear, history: newHistory });
    }
  };

  const handleDemoMode = () => {
    setReceiptData({
      receivedFrom: 'Ahmad bin Ali',
      amount: 150.00,
      forPayment: 'Yuran Tahunan BKGK 2026',
      date: new Date().toISOString().split('T')[0],
      receiptNo: receiptData.receiptNo,
      treasurerName: 'Aida Nordila Bt. Abdul Hadi',
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, key: 'logo' | 'stamp' | 'signature') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        setSettings(prev => ({ ...prev, [key]: readerEvent.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const exportCSV = () => {
    if (history.length === 0) return alert('Tiada rekod untuk dieksport.');
    
    const headers = ['No. Resit', 'Tarikh', 'Diterima Daripada', 'Amaun (RM)', 'Untuk Bayaran', 'Bendahari'];
    const rows = history.map(r => [
      r.receiptNo,
      r.date,
      r.receivedFrom,
      r.amount.toFixed(2),
      r.forPayment,
      r.treasurerName
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `REKOD_KUTIPAN_BKGK_${new Date().getFullYear()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportHistoryPDF = () => {
    if (history.length === 0) return alert('Tiada rekod untuk dieksport.');
    
    const pdf = new jsPDF();
    pdf.setFontSize(16);
    pdf.text(`RINGKASAN KUTIPAN - ${settings.orgName}`, 14, 20);
    pdf.setFontSize(10);
    pdf.text(settings.schoolName, 14, 28);
    pdf.text(`Dijana pada: ${new Date().toLocaleString()}`, 14, 34);

    let y = 45;
    pdf.setFont('helvetica', 'bold');
    pdf.text('No. Resit', 14, y);
    pdf.text('Tarikh', 45, y);
    pdf.text('Nama Pembayar', 75, y);
    pdf.text('Amaun (RM)', 150, y);
    pdf.line(14, y + 2, 195, y + 2);

    y += 10;
    pdf.setFont('helvetica', 'normal');
    let total = 0;

    history.forEach((r, i) => {
      if (y > 270) {
        pdf.addPage();
        y = 20;
      }
      pdf.text(r.receiptNo, 14, y);
      pdf.text(r.date, 45, y);
      pdf.text(r.receivedFrom.substring(0, 30), 75, y);
      pdf.text(r.amount.toFixed(2), 150, y);
      total += r.amount;
      y += 8;
    });

    pdf.line(14, y, 195, y);
    y += 8;
    pdf.setFont('helvetica', 'bold');
    pdf.text('JUMLAH KESELURUHAN', 75, y);
    pdf.text(total.toFixed(2), 150, y);

    pdf.save(`RINGKASAN_REKOD_BKGK.pdf`);
  };

  const totalAmount = useMemo(() => history.reduce((acc, curr) => acc + curr.amount, 0), [history]);

  const themeClass = settings.theme === 'blue' ? 'bg-blue-600' : settings.theme === 'red' ? 'bg-red-600' : 'bg-yellow-500';

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className={`p-2 rounded-lg ${themeClass} text-white`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="font-bold text-lg text-gray-900 leading-tight">Resit BKGK</h1>
              <p className="text-xs text-gray-500 font-medium tracking-wide">PENGURUSAN KEBAJIKAN</p>
            </div>
          </div>
          
          <div className="flex bg-gray-100 p-1 rounded-lg w-full sm:w-auto overflow-x-auto">
            <button 
              onClick={() => setActiveTab('borang')}
              className={`flex-1 sm:flex-none px-6 py-1.5 rounded-md text-sm font-semibold transition-all whitespace-nowrap ${activeTab === 'borang' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Borang
            </button>
            <button 
              onClick={() => setActiveTab('rekod')}
              className={`flex-1 sm:flex-none px-6 py-1.5 rounded-md text-sm font-semibold transition-all whitespace-nowrap ${activeTab === 'rekod' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Rekod ({history.length})
            </button>
            <button 
              onClick={() => setActiveTab('tetapan')}
              className={`flex-1 sm:flex-none px-6 py-1.5 rounded-md text-sm font-semibold transition-all whitespace-nowrap ${activeTab === 'tetapan' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Tetapan
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'borang' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Input Form */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-5">
                <div className="flex justify-between items-center border-b pb-4">
                  <h3 className="font-bold text-gray-800">Butiran Resit</h3>
                  <button onClick={handleDemoMode} className="text-xs font-bold text-blue-600 hover:text-blue-700 border border-blue-200 px-3 py-1 rounded-full bg-blue-50 transition-colors">
                    Contoh Data
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">No. Resit</label>
                    <input type="text" value={receiptData.receiptNo} onChange={(e) => setReceiptData({...receiptData, receiptNo: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none font-mono" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Nama Pembayar</label>
                    <input type="text" value={receiptData.receivedFrom} onChange={(e) => setReceiptData({...receiptData, receivedFrom: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Amaun (RM)</label>
                    <input type="number" step="0.01" value={receiptData.amount || ''} onChange={(e) => setReceiptData({...receiptData, amount: parseFloat(e.target.value) || 0})} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold text-lg text-blue-700" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Untuk Bayaran</label>
                    <textarea rows={2} value={receiptData.forPayment} onChange={(e) => setReceiptData({...receiptData, forPayment: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Tarikh</label>
                      <input type="date" value={receiptData.date} onChange={(e) => setReceiptData({...receiptData, date: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Status Cop</label>
                      <button onClick={() => setSettings({...settings, showPaidStamp: !settings.showPaidStamp})} className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${settings.showPaidStamp ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-gray-100 text-gray-400'}`}>
                        {settings.showPaidStamp ? 'LUNAS: ON' : 'LUNAS: OFF'}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Nama Bendahari</label>
                    <input type="text" value={receiptData.treasurerName} onChange={(e) => setReceiptData({...receiptData, treasurerName: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
                <div className="pt-4 space-y-3">
                  <button onClick={handleFinalizeReceipt} className={`w-full ${themeClass} text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2`}>
                    Simpan & Rekod
                  </button>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => exportAsPDF('receipt-content', `RESIT_${receiptData.receiptNo.replace(/\//g, '_')}`)} className="bg-gray-800 hover:bg-gray-900 text-white text-xs font-bold py-3 rounded-xl transition-all">
                      PDF (A4)
                    </button>
                    <button onClick={() => exportAsImage('receipt-content', `RESIT_${receiptData.receiptNo.replace(/\//g, '_')}`)} className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold py-3 rounded-xl transition-all">
                      IMEJ (PNG)
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Receipt Preview */}
            <div className="lg:col-span-8 overflow-hidden">
              <div className="flex items-center justify-between mb-4 bg-white px-6 py-3 rounded-xl border shadow-sm">
                <h2 className="font-bold text-gray-800">Pratonton Resit</h2>
                <span className="text-xs font-bold text-gray-400">300 DPI • A4 LANDSCAPE</span>
              </div>
              <div className="rounded-2xl shadow-xl overflow-hidden border border-gray-200 bg-gray-200 flex items-center justify-center p-4">
                <div className="transform scale-[0.35] sm:scale-[0.5] md:scale-[0.6] lg:scale-[0.65] xl:scale-[0.8] origin-center">
                  <ReceiptPreview settings={settings} data={receiptData} />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'rekod' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b pb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Sejarah Rekod Penerima Resit</h3>
                  <p className="text-sm text-gray-500">Jumlah Keseluruhan: <span className="font-bold text-blue-600">RM {totalAmount.toFixed(2)}</span></p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                  <button onClick={exportCSV} className="flex-1 md:flex-none px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-green-700">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    Eksport Sheet (.csv)
                  </button>
                  <button onClick={exportHistoryPDF} className="flex-1 md:flex-none px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-700">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                    Cetak Ringkasan PDF
                  </button>
                </div>
              </div>

              {history.length === 0 ? (
                <div className="py-20 text-center text-gray-400">
                  <p>Tiada rekod tersimpan lagi.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-widest">No. Resit</th>
                        <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-widest">Tarikh</th>
                        <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-widest">Penerima</th>
                        <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-widest">Amaun (RM)</th>
                        <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-widest">Tujuan</th>
                        <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Tindakan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {history.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-4 text-sm font-mono font-bold text-gray-700">{record.receiptNo}</td>
                          <td className="px-4 py-4 text-sm text-gray-600 whitespace-nowrap">{record.date}</td>
                          <td className="px-4 py-4 text-sm font-semibold text-gray-800">{record.receivedFrom}</td>
                          <td className="px-4 py-4 text-sm font-bold text-blue-700">{record.amount.toFixed(2)}</td>
                          <td className="px-4 py-4 text-sm text-gray-500">{record.forPayment}</td>
                          <td className="px-4 py-4 text-right">
                            <button onClick={() => handleDeleteRecord(record.id)} className="text-red-400 hover:text-red-600 transition-colors p-2">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'tetapan' && (
          <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border p-6 space-y-6">
            <h3 className="font-bold text-gray-800 border-b pb-4 text-xl">Konfigurasi Organisasi</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Tema Warna</label>
                <div className="flex gap-4">
                  {(['blue', 'red', 'yellow'] as const).map(t => (
                    <button key={t} onClick={() => setSettings({...settings, theme: t})} className={`w-12 h-12 rounded-full border-4 transition-all ${settings.theme === t ? 'border-gray-900 scale-110' : 'border-transparent'} ${t === 'blue' ? 'bg-blue-600' : t === 'red' ? 'bg-red-600' : 'bg-yellow-500'}`} />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Nama Sekolah</label>
                <input type="text" value={settings.schoolName} onChange={(e) => setSettings({...settings, schoolName: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Alamat Sekolah</label>
                <textarea rows={3} value={settings.schoolAddress} onChange={(e) => setSettings({...settings, schoolAddress: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Nama Kelab/Organisasi</label>
                <input type="text" value={settings.orgName} onChange={(e) => setSettings({...settings, orgName: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="border border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center gap-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase text-center">Logo Sekolah</span>
                  <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} className="text-[10px] w-full" />
                </div>
                <div className="border border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center gap-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase text-center">Cop Rasmi</span>
                  <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'stamp')} className="text-[10px] w-full" />
                </div>
                <div className="border border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center gap-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase text-center">Tandatangan</span>
                  <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'signature')} className="text-[10px] w-full" />
                </div>
              </div>
              <button onClick={() => handleSaveSettings(settings)} className={`w-full ${themeClass} text-white font-bold py-3 rounded-xl mt-4 shadow-lg`}>
                Simpan Tetapan
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
