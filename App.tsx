
import React, { useState, useCallback, useEffect } from 'react';
import { KELAS_OPTIONS } from './constants';
import { generateKisiKisiItems, generateQuestionsFromKisi } from './services/geminiService';
import type { FormState, KisiKisiItem, GeneratedSoal, HeaderState } from './types';

// SVG Icon Components
const ZapIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
);
const DocumentIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
);
const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
);
const PrintIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
);
const ArrowLeftIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
);


// Main App Component
export default function App() {
  const [formState, setFormState] = useState<FormState>({
    mataPelajaran: '', jenjang: '', kelas: '', semester: '', cp: '', atp: '', materi: '', bentukSoal: 'Semua Jenis Soal', jumlahSoal: 5,
  });
  const [headerState, setHeaderState] = useState<HeaderState>({
    headerText: 'PEMERINTAH KABUPATEN BANGGAI\nDINAS PENDIDIKAN DAN KEBUDAYAAN\nKECAMATAN LUWUK TIMUR',
    schoolName: '',
    className: '',
    timeAllocation: '',
    leftLogo: null,
    rightLogo: null,
  });
  const [kisiKisiList, setKisiKisiList] = useState<KisiKisiItem[]>([]);
  const [generatedSoals, setGeneratedSoals] = useState<GeneratedSoal[]>([]);
  const [currentView, setCurrentView] = useState<'kisi' | 'soal'>('kisi');
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value, type } = e.target;
    const isNumberInput = type === 'number';

    setFormState(prev => ({ 
        ...prev, 
        [id]: isNumberInput ? (value ? Number(value) : '') : value 
    }));
    
    if (id === 'jenjang') {
      setFormState(prev => ({ ...prev, kelas: '' }));
    }
  };
  
  const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { id, value } = e.target;
      setHeaderState(prev => ({ ...prev, [id]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, side: 'left' | 'right') => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              if (side === 'left') {
                  setHeaderState(prev => ({ ...prev, leftLogo: reader.result as string }));
              } else {
                  setHeaderState(prev => ({ ...prev, rightLogo: reader.result as string }));
              }
          };
          reader.readAsDataURL(file);
      }
  };

  const clearForm = () => {
    setFormState({ mataPelajaran: '', jenjang: '', kelas: '', semester: '', cp: '', atp: '', materi: '', bentukSoal: 'Semua Jenis Soal', jumlahSoal: 5 });
  };
  
  const handleGenerateAndCreateSoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.values(formState).some(v => v === '')) {
      return showNotification('Mohon lengkapi semua field pada form.', 'error');
    }
    setIsLoading(true);
    try {
      const newKisiKisi = await generateKisiKisiItems(formState);
      const fullKisiData = newKisiKisi.map((item, index) => ({
          ...item,
          id: `kisi-${Date.now()}-${index}`,
          materi: formState.materi,
          cp: formState.cp,
          atp: formState.atp,
      })) as KisiKisiItem[];
      setKisiKisiList(fullKisiData);
      
      const newSoals = await generateQuestionsFromKisi(fullKisiData);
      setGeneratedSoals(newSoals);
      
      setCurrentView('soal');
      showNotification(`Berhasil generate ${fullKisiData.length} kisi-kisi dan ${newSoals.length} soal!`, 'success');

    } catch (error) {
      showNotification(error instanceof Error ? error.message : 'Terjadi kesalahan tidak diketahui', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateSoalFromTable = async () => {
     if (kisiKisiList.length === 0) {
      return showNotification("Tidak ada kisi-kisi untuk generate soal!", "error");
    }
    setIsLoading(true);
    try {
      const newSoals = await generateQuestionsFromKisi(kisiKisiList);
      setGeneratedSoals(newSoals);
      setCurrentView('soal');
      showNotification(`Berhasil generate ${newSoals.length} soal!`, "success");
    } catch (error) {
       showNotification(error instanceof Error ? error.message : 'Terjadi kesalahan tidak diketahui', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteKisiItem = (id: string) => {
    setKisiKisiList(prev => prev.filter(item => item.id !== id));
  };
  
  const downloadPDF = (type: 'kisi' | 'soal') => {
    // @ts-ignore
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let yPos = 15;

    // Header (Kop Surat)
    if (headerState.leftLogo) doc.addImage(headerState.leftLogo, 'PNG', 15, yPos, 20, 20);
    if (headerState.rightLogo) doc.addImage(headerState.rightLogo, 'PNG', 175, yPos, 20, 20);
    doc.setFontSize(11);
    doc.text(headerState.headerText.toUpperCase(), 105, yPos + 5, { align: 'center', lineHeightFactor: 1.5 });
    yPos += 25;
    doc.setLineWidth(1);
    doc.line(15, yPos, 195, yPos);
    doc.setLineWidth(0.2);
    doc.line(15, yPos + 1, 195, yPos + 1);
    yPos += 10;

    // Exam Identity
    const identityData = [
      ['Nama Sekolah', ':', headerState.schoolName],
      ['Mata Pelajaran', ':', formState.mataPelajaran],
      ['Kelas / Semester', ':', `${headerState.className} / ${formState.semester}`],
      ['Waktu', ':', headerState.timeAllocation],
    ];
     // @ts-ignore
    doc.autoTable({
        body: identityData,
        startY: yPos,
        theme: 'plain',
        tableWidth: 'auto',
        styles: { fontSize: 10, cellPadding: 1 },
        columnStyles: { 1: { cellWidth: 5 }, 2: { cellWidth: 'auto' } }
    });
    // @ts-ignore
    yPos = doc.lastAutoTable.finalY + 5;

    if(type === 'kisi') {
        yPos += 5;
        const head = [['No', 'Materi', 'Indikator', 'Bentuk Soal', 'Tingkat']];
        const body = kisiKisiList.map(k => [
            k.nomor_soal,
            k.materi,
            k.indikator_soal,
            k.bentuk_soal,
            k.tingkat_kesulitan,
        ]);
        // @ts-ignore
        doc.autoTable({ startY: yPos, head, body, styles: { fontSize: 9 } });
    } else {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.text("Berikan tanda (X) pada jawaban yang menurut Anda benar.", 15, yPos);
        yPos += 10;

        doc.setFont('times', 'normal');
        doc.setFontSize(12);

        generatedSoals.forEach(s => {
            if (yPos > 260) { doc.addPage(); yPos = 20; }
            const questionNumber = `${s.nomor_soal}. `;
            
            doc.setFont('times', 'bold');
            const numberWidth = doc.getTextWidth(questionNumber);
            doc.text(questionNumber, 15, yPos);

            doc.setFont('times', 'normal');
            const questionText = s.soal_text;
            const lines = doc.splitTextToSize(questionText, 195 - 15 - numberWidth - 5);
            doc.text(lines, 15 + numberWidth, yPos);
            yPos += lines.length * 5.5;

            if(s.options && s.options.length > 0) {
                 yPos += 1;
                 s.options.forEach(opt => {
                     if (yPos > 270) { doc.addPage(); yPos = 20; }
                     const optLines = doc.splitTextToSize(opt, 170);
                     doc.text(optLines, 20, yPos);
                     yPos += optLines.length * 5.5;
                 });
            }
             yPos += 8;
        });
    }

    doc.save(`${type}-document.pdf`);
    showNotification('PDF berhasil diunduh!', 'success');
  };

  const downloadWord = (type: 'kisi' | 'soal') => {
      let content = `
        <div style="margin-bottom: 20px;">
          <table style="width: 100%; border: none;">
            <tr>
              <td style="width: 20%; text-align: left;">${headerState.leftLogo ? `<img src="${headerState.leftLogo}" width="75">` : ''}</td>
              <td style="width: 60%; text-align: center; font-size: 12pt; line-height: 1.5;">${headerState.headerText.replace(/\n/g, '<br>')}</td>
              <td style="width: 20%; text-align: right;">${headerState.rightLogo ? `<img src="${headerState.rightLogo}" width="75">` : ''}</td>
            </tr>
          </table>
          <hr style="border-top: 3px solid black; margin-top: 5px;">
        </div>
        <div style="margin-bottom: 20px;">
            <table style="font-size: 11pt;">
              <tr><td style="width: 150px;">Nama Sekolah</td><td>: ${headerState.schoolName}</td></tr>
              <tr><td>Mata Pelajaran</td><td>: ${formState.mataPelajaran}</td></tr>
              <tr><td>Kelas / Semester</td><td>: ${headerState.className} / ${formState.semester}</td></tr>
              <tr><td>Waktu</td><td>: ${headerState.timeAllocation}</td></tr>
            </table>
        </div>`;
      if (type === 'kisi') {
          content += `<table style="width:100%; border-collapse: collapse; font-size: 10pt;" border="1">
              <thead>
                  <tr><th>No</th><th>Materi</th><th>Indikator Soal</th><th>Bentuk Soal</th><th>Tingkat</th></tr>
              </thead>
              <tbody>
                  ${kisiKisiList.map(k => `
                      <tr>
                          <td style="padding: 4px;">${k.nomor_soal}</td>
                          <td style="padding: 4px;">${k.materi}</td>
                          <td style="padding: 4px;">${k.indikator_soal}</td>
                          <td style="padding: 4px;">${k.bentuk_soal}</td>
                          <td style="padding: 4px;">${k.tingkat_kesulitan}</td>
                      </tr>
                  `).join('')}
              </tbody>
          </table>`;
      } else {
           content += `<p style="font-size: 11pt; font-style: italic;">Berikan tanda (X) pada jawaban yang menurut Anda benar.</p>`;
           content += generatedSoals.map(s => `
            <div style="margin-bottom: 15px; font-size: 11pt;">
                <p style="margin: 0; display: flex;"><span style="width: 25px;">${s.nomor_soal}.</span><span>${s.soal_text}</span></p>
                ${s.options ? `
                    <div style="margin-left: 25px;">
                        ${s.options.map(o => `<p style="margin: 2px 0;">${o}</p>`).join('')}
                    </div>
                ` : ''}
            </div>
           `).join('');
      }
      const blob = new Blob(['<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>Export HTML to Word</title></head><body>' + content + '</body></html>'], {type: 'application/msword'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      document.body.appendChild(a);
      a.href = url;
      a.download = `${type}-document.doc`;
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showNotification('Dokumen Word berhasil diunduh!', 'success');
  };

  return (
    <main className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <header className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Generator Kisi-Kisi Soal</h1>
            <p className="text-gray-600 text-lg">Buat kisi-kisi dan soal dengan mudah, download hasilnya!</p>
        </header>

        {/* Loading Overlay */}
        {isLoading && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg flex items-center">
                    <svg className="animate-spin h-6 w-6 mr-3 text-blue-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Memproses dengan AI...</span>
                </div>
            </div>
        )}

        {/* Notification */}
        {notification && (
            <div className={`fixed top-5 right-5 p-4 rounded-lg text-white shadow-lg animate-fadeIn ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'} z-50`}>
                {notification.message}
            </div>
        )}
        
        {/* Conditional View Rendering */}
        {currentView === 'kisi' ? (
            <>
                {/* Header Customization Section */}
                <section className="card p-6 mb-8 no-print bg-white rounded-xl shadow-lg border border-gray-200">
                    <details>
                        <summary className="text-lg font-semibold text-gray-700 cursor-pointer">Pengaturan Kop Surat & Identitas Ujian</summary>
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label htmlFor="headerText" className="block text-sm font-medium text-gray-700 mb-1">Teks Kop Surat</label>
                                <textarea id="headerText" value={headerState.headerText} onChange={handleHeaderChange} rows={3} className="input-field w-full px-3 py-2 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"></textarea>
                            </div>
                            <div>
                                <label htmlFor="schoolName" className="block text-sm font-medium text-gray-700 mb-1">Nama Sekolah</label>
                                <input type="text" id="schoolName" value={headerState.schoolName} onChange={handleHeaderChange} className="input-field w-full px-3 py-2 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" placeholder="Contoh: SMP Negeri 1 Luwuk Timur" />
                            </div>
                            <div>
                                <label htmlFor="className" className="block text-sm font-medium text-gray-700 mb-1">Kelas (untuk Cetak)</label>
                                <input type="text" id="className" value={headerState.className} onChange={handleHeaderChange} className="input-field w-full px-3 py-2 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" placeholder="Contoh: X IPA 1" />
                            </div>
                             <div>
                                <label htmlFor="timeAllocation" className="block text-sm font-medium text-gray-700 mb-1">Alokasi Waktu</label>
                                <input type="text" id="timeAllocation" value={headerState.timeAllocation} onChange={handleHeaderChange} className="input-field w-full px-3 py-2 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" placeholder="Contoh: 90 Menit" />
                            </div>
                            <div className="flex items-center gap-4">
                                <div>
                                    <label htmlFor="leftLogo" className="block text-sm font-medium text-gray-700 mb-1">Logo Kiri</label>
                                    <input type="file" id="leftLogo" onChange={(e) => handleLogoUpload(e, 'left')} accept="image/*" className="text-sm" />
                                </div>
                                {headerState.leftLogo && <img src={headerState.leftLogo} alt="Logo Kiri" className="h-12 w-12 object-contain border p-1" />}
                            </div>
                             <div className="flex items-center gap-4">
                                 <div>
                                    <label htmlFor="rightLogo" className="block text-sm font-medium text-gray-700 mb-1">Logo Kanan</label>
                                    <input type="file" id="rightLogo" onChange={(e) => handleLogoUpload(e, 'right')} accept="image/*" className="text-sm" />
                                 </div>
                                {headerState.rightLogo && <img src={headerState.rightLogo} alt="Logo Kanan" className="h-12 w-12 object-contain border p-1" />}
                            </div>
                        </div>
                    </details>
                </section>
            
                {/* Form Input */}
                <section className="card p-6 mb-8 no-print bg-white rounded-xl shadow-lg border border-gray-200">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center"><ZapIcon className="w-6 h-6 mr-2 text-orange-500" /> Generator Kisi-Kisi dan Soal Otomatis</h2>
                    <form onSubmit={handleGenerateAndCreateSoal} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                         {/* Form Fields */}
                        <div><label htmlFor="mataPelajaran" className="block text-sm font-medium text-gray-700 mb-1">Mata Pelajaran</label><input type="text" id="mataPelajaran" value={formState.mataPelajaran} onChange={handleFormChange} className="input-field w-full px-3 py-2 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" placeholder="Contoh: Matematika" required /></div>
                        <div><label htmlFor="jenjang" className="block text-sm font-medium text-gray-700 mb-1">Jenjang Pendidikan</label><select id="jenjang" value={formState.jenjang} onChange={handleFormChange} className="input-field w-full px-3 py-2 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" required><option value="">Pilih Jenjang</option><option value="SD">SD</option><option value="SMP">SMP</option><option value="SMA">SMA</option></select></div>
                        <div><label htmlFor="kelas" className="block text-sm font-medium text-gray-700 mb-1">Kelas</label><select id="kelas" value={formState.kelas} onChange={handleFormChange} className="input-field w-full px-3 py-2 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" required disabled={!formState.jenjang}><option value="">Pilih Jenjang Dulu</option>{formState.jenjang && KELAS_OPTIONS[formState.jenjang].map(k => <option key={k} value={k}>{k}</option>)}</select></div>
                        <div><label htmlFor="semester" className="block text-sm font-medium text-gray-700 mb-1">Semester</label><select id="semester" value={formState.semester} onChange={handleFormChange} className="input-field w-full px-3 py-2 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" required><option value="">Pilih Semester</option><option value="Ganjil">Ganjil</option><option value="Genap">Genap</option></select></div>
                        <div><label htmlFor="jumlahSoal" className="block text-sm font-medium text-gray-700 mb-1">Jumlah Soal</label><input type="number" id="jumlahSoal" value={formState.jumlahSoal} onChange={handleFormChange} min="1" max="50" className="input-field w-full px-3 py-2 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" required /></div>
                        <div className="lg:col-span-2"><label htmlFor="materi" className="block text-sm font-medium text-gray-700 mb-1">Materi Pokok</label><input type="text" id="materi" value={formState.materi} onChange={handleFormChange} className="input-field w-full px-3 py-2 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" placeholder="Contoh: Aljabar Linear, Sejarah Kemerdekaan Indonesia" required /></div>
                        <div><label htmlFor="bentukSoal" className="block text-sm font-medium text-gray-700 mb-1">Bentuk Soal</label><select id="bentukSoal" value={formState.bentukSoal} onChange={handleFormChange} className="input-field w-full px-3 py-2 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" required><option value="Semua Jenis Soal">Semua Jenis Soal</option><option value="Pilihan Ganda">Pilihan Ganda</option><option value="Essay">Essay</option><option value="Isian Singkat">Isian Singkat</option><option value="Benar/Salah">Benar/Salah</option></select></div>
                        <div className="md:col-span-2 lg:col-span-3"><label htmlFor="cp" className="block text-sm font-medium text-gray-700 mb-1">Capaian Pembelajaran (CP)</label><textarea id="cp" value={formState.cp} onChange={handleFormChange} className="input-field w-full px-3 py-2 h-20 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" placeholder="Masukkan capaian pembelajaran..." required></textarea></div>
                        <div className="md:col-span-2 lg:col-span-3"><label htmlFor="atp" className="block text-sm font-medium text-gray-700 mb-1">Alur Tujuan Pembelajaran (ATP)</label><textarea id="atp" value={formState.atp} onChange={handleFormChange} className="input-field w-full px-3 py-2 h-20 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" placeholder="Masukkan alur tujuan pembelajaran..." required></textarea></div>
                        <div className="md:col-span-2 lg:col-span-3 flex gap-3 pt-4"><button type="submit" disabled={isLoading} className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8 py-3 rounded-lg font-bold text-lg flex items-center shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"> <ZapIcon className="w-6 h-6 mr-3"/> {isLoading ? 'Generating...' : 'Generate Kisi-Kisi & Soal'} </button><button type="button" onClick={clearForm} className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium">Bersihkan Form</button></div>
                    </form>
                </section>
                {/* Tabel Kisi-Kisi */}
                <section className="card p-6 mb-8 bg-white rounded-xl shadow-lg border border-gray-200">
                    <div className="flex justify-between items-center mb-6 no-print">
                        <h2 className="text-2xl font-semibold text-gray-800 flex items-center"><DocumentIcon className="w-6 h-6 mr-2 text-green-600" /> Kisi-Kisi Soal ({kisiKisiList.length} item)</h2>
                        <div className="flex gap-2">
                             <button onClick={handleGenerateSoalFromTable} className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium flex items-center text-sm"><ZapIcon className="w-5 h-5 mr-2" /> Generate Soal</button>
                             <button onClick={() => downloadPDF('kisi')} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center text-sm"><DownloadIcon className="w-5 h-5 mr-2" /> PDF</button>
                             <button onClick={() => downloadWord('kisi')} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center text-sm"><DocumentIcon className="w-5 h-5 mr-2" /> Word</button>
                             <button onClick={() => window.print()} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium flex items-center text-sm"><PrintIcon className="w-5 h-5 mr-2" /> Cetak</button>
                        </div>
                    </div>
                    {kisiKisiList.length === 0 ? (
                        <div className="text-center py-12 text-gray-500"><DocumentIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" /><p className="text-lg">Belum ada kisi-kisi soal</p><p className="text-sm">Gunakan form di atas untuk generate kisi-kisi dan soal</p></div>
                    ) : (
                        <div className="overflow-x-auto">
                             <table className="w-full border-collapse">
                                <thead><tr className="bg-gray-100"><th className="border p-2 text-left text-sm font-semibold">No</th><th className="border p-2 text-left text-sm font-semibold">Materi</th><th className="border p-2 text-left text-sm font-semibold">Indikator Soal</th><th className="border p-2 text-left text-sm font-semibold">Bentuk</th><th className="border p-2 text-left text-sm font-semibold">Tingkat</th><th className="border p-2 text-left text-sm font-semibold no-print">Aksi</th></tr></thead>
                                <tbody>{kisiKisiList.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="border p-2 text-sm text-center">{item.nomor_soal}</td>
                                        <td className="border p-2 text-sm">{item.materi}</td>
                                        <td className="border p-2 text-sm">{item.indikator_soal}</td>
                                        <td className="border p-2 text-sm">{item.bentuk_soal}</td>
                                        <td className="border p-2 text-sm">{item.tingkat_kesulitan}</td>
                                        <td className="border p-2 text-sm no-print"><button onClick={() => deleteKisiItem(item.id)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs">Hapus</button></td>
                                    </tr>))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </>
        ) : (
            /* Soal Section */
            <section className="card p-6 mb-8 bg-white rounded-xl shadow-lg border border-gray-200">
                <div className="flex justify-between items-center mb-6 no-print">
                    <h2 className="text-2xl font-semibold text-gray-800 flex items-center"><ZapIcon className="w-6 h-6 mr-2 text-orange-500" /> Soal yang Dihasilkan ({generatedSoals.length} soal)</h2>
                    <div className="flex gap-2">
                         <button onClick={() => downloadPDF('soal')} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center text-sm"><DownloadIcon className="w-5 h-5 mr-2" /> PDF</button>
                         <button onClick={() => downloadWord('soal')} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center text-sm"><DocumentIcon className="w-5 h-5 mr-2" /> Word</button>
                         <button onClick={() => setCurrentView('kisi')} className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium flex items-center text-sm"><ArrowLeftIcon className="w-5 h-5 mr-2" /> Kembali ke Kisi-Kisi</button>
                    </div>
                </div>
                <div className="space-y-6">
                    {generatedSoals.sort((a,b) => a.nomor_soal - b.nomor_soal).map(soal => (
                        <div key={soal.nomor_soal} className="bg-gray-50 p-4 rounded-lg border">
                             <div className="flex justify-between items-start mb-3"><div className="text-sm text-gray-600"><span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">{soal.bentuk_soal}</span><span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium ml-2">{soal.tingkat_kesulitan}</span></div></div>
                             <p className="mb-2"><strong>{soal.nomor_soal}.</strong> {soal.soal_text}</p>
                             {soal.options && <div className="ml-6 space-y-1">{soal.options.map((opt, i) => <p key={i}>{opt}</p>)}</div>}
                             <div className="mt-4 p-2 bg-yellow-100 rounded text-sm text-yellow-800"><strong>Kunci Jawaban:</strong> {soal.kunci_jawaban}</div>
                        </div>
                    ))}
                </div>
            </section>
        )}
    </main>
  );
}
