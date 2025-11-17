
import { GoogleGenAI, Type } from "@google/genai";
import type { FormState, KisiKisiItem, GeneratedSoal } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const kisiKisiSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      nomor_soal: { type: Type.INTEGER, description: "Nomor urut soal, dimulai dari 1." },
      indikator_soal: { type: Type.STRING, description: "Indikator soal yang mengukur pencapaian kompetensi." },
      bentuk_soal: { type: Type.STRING, description: "Bentuk soal: Pilihan Ganda, Essay, Isian Singkat, atau Benar/Salah." },
      tingkat_kesulitan: { type: Type.STRING, description: "Tingkat kesulitan: Mudah (C1-C2), Sedang (C3-C4), atau Sulit (C5-C6)." },
    },
    required: ["nomor_soal", "indikator_soal", "bentuk_soal", "tingkat_kesulitan"],
  },
};

const soalSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      nomor_soal: { type: Type.INTEGER, description: "Nomor urut soal, sesuai dengan kisi-kisi." },
      soal_text: { type: Type.STRING, description: "Teks pertanyaan soal." },
      options: {
        type: Type.ARRAY,
        description: "Array berisi 4 atau 5 string opsi jawaban (misal: 'A. ...', 'B. ...'). Hanya untuk 'Pilihan Ganda'.",
        items: { type: Type.STRING },
      },
      kunci_jawaban: { type: Type.STRING, description: "Kunci jawaban yang benar. Untuk Pilihan Ganda, sebutkan opsinya (misal: 'A. ...'). Untuk Essay, berikan jawaban singkat." },
    },
    required: ["nomor_soal", "soal_text", "kunci_jawaban"],
  },
};

export const generateKisiKisiItems = async (formData: FormState): Promise<Omit<KisiKisiItem, 'id'>[]> => {
  const { jenjang, kelas, mataPelajaran, semester, cp, atp, materi, bentukSoal, jumlahSoal } = formData;

  const bentukSoalInstruction = bentukSoal === 'Semua Jenis Soal'
    ? "Pastikan variasi bentuk soal (Pilihan Ganda, Essay, Isian Singkat, Benar/Salah) dan tingkat kesulitan merata."
    : `Semua butir soal HARUS memiliki bentuk soal "${bentukSoal}". Pastikan variasi tingkat kesulitan merata.`;

  const prompt = `Anda adalah seorang ahli perancang kurikulum dan soal evaluasi di Indonesia.
Berdasarkan informasi berikut, buatlah persis ${jumlahSoal} butir kisi-kisi soal ujian dalam format JSON yang sesuai dengan skema yang diberikan.
${bentukSoalInstruction}

Informasi:
- Jenjang Pendidikan: ${jenjang}
- Kelas: ${kelas}
- Mata Pelajaran: ${mataPelajaran}
- Semester: ${semester}
- Materi Pokok: ${materi}
- Capaian Pembelajaran (CP): ${cp}
- Alur Tujuan Pembelajaran (ATP): ${atp}
- Jumlah Soal Diminta: ${jumlahSoal}
- Bentuk Soal Diminta: ${bentukSoal}

Tugas:
Hasilkan sebuah array JSON berisi ${jumlahSoal} objek kisi-kisi soal. Setiap objek harus memiliki nomor_soal yang berurutan, indikator_soal yang spesifik, bentuk_soal, dan tingkat_kesulitan.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: kisiKisiSchema,
      },
    });

    const jsonText = response.text.trim();
    const generatedItems = JSON.parse(jsonText);

    return generatedItems.map((item: any) => ({
        ...item,
        materi,
        cp,
        atp,
    }));
  } catch (error) {
    console.error("Error generating kisi-kisi:", error);
    throw new Error("Gagal menghasilkan kisi-kisi dari AI. Silakan coba lagi.");
  }
};

export const generateQuestionsFromKisi = async (kisiKisiList: KisiKisiItem[]): Promise<GeneratedSoal[]> => {
    if (kisiKisiList.length === 0) return [];
    
    const kisiKisiContext = kisiKisiList.map(k => ({
        nomor_soal: k.nomor_soal,
        materi: k.materi,
        indikator_soal: k.indikator_soal,
        bentuk_soal: k.bentuk_soal,
        tingkat_kesulitan: k.tingkat_kesulitan,
    }));

    const prompt = `Anda adalah AI pembuat soal ujian yang ahli. Berdasarkan daftar kisi-kisi soal berikut, buatlah soal ujian lengkap dalam format JSON yang sesuai skema.
Untuk soal Pilihan Ganda, berikan 4 atau 5 opsi jawaban dan tentukan kunci jawabannya.
Untuk bentuk soal lain, berikan pertanyaan dan kunci jawaban yang sesuai.

Kisi-Kisi Konteks:
${JSON.stringify(kisiKisiContext, null, 2)}

Tugas:
Hasilkan sebuah array JSON berisi ${kisiKisiContext.length} objek soal. Setiap objek harus berisi nomor_soal, soal_text, kunci_jawaban, dan 'options' jika bentuknya Pilihan Ganda.
Pastikan setiap soal sesuai dengan materi, indikator, bentuk, dan tingkat kesulitan dari kisi-kisi yang diberikan.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: soalSchema,
            },
        });
        const jsonText = response.text.trim();
        const generatedSoals = JSON.parse(jsonText);

        return generatedSoals.map((soal: any) => {
            const correspondingKisi = kisiKisiList.find(k => k.nomor_soal === soal.nomor_soal);
            return {
                ...soal,
                materi: correspondingKisi?.materi || '',
                tingkat_kesulitan: correspondingKisi?.tingkat_kesulitan || '',
                bentuk_soal: correspondingKisi?.bentuk_soal || '',
            };
        });
    } catch (error) {
        console.error("Error generating questions:", error);
        throw new Error("Gagal menghasilkan soal dari AI. Silakan coba lagi.");
    }
};
