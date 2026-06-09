import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '3306'),
  user:     process.env.DB_USER     || 'bitmoth',
  password: process.env.DB_PASSWORD || 'bitmoth',
  database: process.env.DB_NAME     || 'bitmoth',
  waitForConnections: true,
  connectionLimit: 10,
  timezone: '+00:00',
});

export async function initDb() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS bitmoth_cache (
      hash           VARCHAR(64)  PRIMARY KEY,
      schema_version INT          NOT NULL,
      race           INT          NOT NULL,
      title          VARCHAR(20)  NOT NULL,
      name           VARCHAR(30)  NOT NULL,
      flavor         VARCHAR(200) NOT NULL,
      hp             INT          NOT NULL,
      atk            INT          NOT NULL,
      def_stat       INT          NOT NULL,
      spd            INT          NOT NULL,
      generated_at   DATETIME     NOT NULL
    )
  `);
  console.log('✅ DB ready');
}

export async function getCached(hash) {
  const [rows] = await pool.execute('SELECT * FROM bitmoth_cache WHERE hash = ?', [hash]);
  return rows[0] ?? null;
}

export async function insertCache({ hash, schemaVersion, race, title, name, flavor, hp, atk, def, spd }) {
  await pool.execute(
    `INSERT INTO bitmoth_cache
       (hash, schema_version, race, title, name, flavor, hp, atk, def_stat, spd, generated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [hash, schemaVersion, race, title, name, flavor, hp, atk, def, spd]
  );
}

export async function getAll(limit = 50) {
  const [rows] = await pool.execute(
    'SELECT * FROM bitmoth_cache ORDER BY generated_at DESC LIMIT ?',
    [limit]
  );
  return rows;
}

export default pool;
