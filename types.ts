
export interface KisiKisiItem {
  id: string;
  nomor_soal: number;
  materi: string;
  cp: string;
  atp: string;
  indikator_soal: string;
  bentuk_soal: 'Pilihan Ganda' | 'Essay' | 'Isian Singkat' | 'Benar/Salah';
  tingkat_kesulitan: 'Mudah' | 'Sedang' | 'Sulit';
}

export interface GeneratedSoal {
  nomor_soal: number;
  soal_text: string;
  options?: string[];
  kunci_jawaban: string;
  bentuk_soal: string;
  tingkat_kesulitan: string;
  materi: string;
}

export interface FormState {
  mataPelajaran: string;
  jenjang: 'SD' | 'SMP' | 'SMA' | '';
  kelas: string;
  semester: 'Ganjil' | 'Genap' | '';
  cp: string;
  atp: string;
  materi: string;
  bentukSoal: 'Semua Jenis Soal' | 'Pilihan Ganda' | 'Essay' | 'Isian Singkat' | 'Benar/Salah' | '';
  jumlahSoal: number | '';
}

export interface HeaderState {
  headerText: string;
  schoolName: string;
  className: string;
  timeAllocation: string;
  leftLogo: string | null;
  rightLogo: string | null;
}
