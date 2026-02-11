export type ClozeOptionsPerBlank = Record<number, [string, string, string, string]>;

export interface GenerateClozeSuccess {
  success: true;
  article: string;
  options: ClozeOptionsPerBlank;
}

export interface GenerateClozeError {
  success: false;
  error: string;
}

export type GenerateClozeResult = GenerateClozeSuccess | GenerateClozeError;

export interface GenerateClozeJson {
  article: string;
  options: Record<string, [string, string, string, string]>;
}
