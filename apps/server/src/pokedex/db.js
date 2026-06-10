import pool from '../db/index.js';

export async function initPokedex() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS pokedex (
      hash           CHAR(64)     PRIMARY KEY,
      schema_version TINYINT      NOT NULL DEFAULT 1,
      race_id        TINYINT      NOT NULL,
      title          VARCHAR(20)  NOT NULL,
      name           VARCHAR(50)  NOT NULL,
      flavor         VARCHAR(200) NOT NULL,
      hp             SMALLINT     NOT NULL,
      atk            TINYINT      NOT NULL,
      def_stat       TINYINT      NOT NULL,
      spd            TINYINT      NOT NULL,
      image_base64   MEDIUMTEXT,
      discovered_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

export async function pokedexLookup(hash) {
  const [rows] = await pool.execute(
    'SELECT * FROM pokedex WHERE hash = ?',
    [hash]
  );
  return rows[0] ?? null;
}

export async function pokedexRegister({ hash, schemaVersion, raceId, title, name, flavor, hp, atk, def, spd, imageBase64 }) {
  await pool.execute(
    `INSERT IGNORE INTO pokedex
       (hash, schema_version, race_id, title, name, flavor, hp, atk, def_stat, spd, image_base64)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [hash, schemaVersion ?? 1, raceId, title, name, flavor, hp, atk, def, spd, imageBase64 ?? null]
  );
  return pokedexLookup(hash);
}

export async function pokedexList(limit = 50) {
  const [rows] = await pool.execute(
    'SELECT hash, schema_version, race_id, title, name, flavor, hp, atk, def_stat, spd, discovered_at FROM pokedex ORDER BY discovered_at DESC LIMIT ?',
    [limit]
  );
  return rows;
}
