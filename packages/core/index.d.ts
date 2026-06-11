export declare const DNA_SCHEMA_VERSION: number;

export declare const RACES: string[];

export interface DnaResult {
  schemaVersion: number;
  primaryColor: string;
  secondaryColor: string;
  raceId: number;
  variantId: number;
  eyeId: number;
  decoId: number;
  entropyHex: string;
}

export declare function decodeDna(hash: string): DnaResult;

export interface EggSprite {
  shellColor: string;
  markColor: string;
  glowColor: string;
  frame: number[][];
}

export declare const EGG_SPRITES: EggSprite[];
