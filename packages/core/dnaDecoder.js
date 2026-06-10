export const DNA_SCHEMA_VERSION = 1;

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
