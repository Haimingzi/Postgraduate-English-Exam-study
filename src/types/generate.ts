export interface OptionDetail {
  word: string;
  meaning: string;
  phonetic: string;
  partOfSpeech?: string;
}

export interface WordAnnotation {
  word: string;
  meaning: string;
}

export type ClozeOptionsPerBlank = Record<number, [string, string, string, string]>;
export type ClozeOptionsDetailPerBlank = Record<number, [OptionDetail, OptionDetail, OptionDetail, OptionDetail]>;

export interface GenerateClozeSuccess {
  success: true;
  article: string;
  options: ClozeOptionsPerBlank;
  optionsDetail?: ClozeOptionsDetailPerBlank;
  annotations?: WordAnnotation[];
}

export interface GenerateClozeError {
  success: false;
  error: string;
}

export type GenerateClozeResult = GenerateClozeSuccess | GenerateClozeError;

export interface GenerateClozeJson {
  article: string;
  options: Record<string, [string, string, string, string]>;
  optionsDetail?: Record<string, [OptionDetail, OptionDetail, OptionDetail, OptionDetail]>;
  annotations?: WordAnnotation[];
}
