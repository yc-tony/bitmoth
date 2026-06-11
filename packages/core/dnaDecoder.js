export const DNA_SCHEMA_VERSION = 1;

// D&D 風格種族 enum，index 對應 raceId (0–8)
export const RACES = [
  '龍族',   // 0 Dragon
  '妖精族', // 1 Fey
  '惡魔族', // 2 Fiend
  '野獸族', // 3 Beast
  '水族',   // 4 Aquatic
  '鳥族',   // 5 Avian
  '元素族', // 6 Elemental
  '構裝族', // 7 Construct
  '亡靈族', // 8 Undead
];

export function decodeDna(hash) {
  return {
    schemaVersion: DNA_SCHEMA_VERSION,
    primaryColor:   '#' + hash.slice(0, 6),
    secondaryColor: '#' + hash.slice(6, 12),
    raceId:    parseInt(hash.slice(12, 14), 16) % 9,
    variantId: parseInt(hash.slice(14, 16), 16) % 4,
    eyeId:     parseInt(hash.slice(16, 18), 16) % 6,
    decoId:    parseInt(hash.slice(18, 20), 16) % 4,
    entropyHex: hash.slice(20),
  };
}
