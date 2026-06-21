import mysql from 'mysql2/promise';

export default async function handler(req, res) {
  // Hanya ijinkan metode GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { prov, lembaga, metode, search, limit = 100, page = 1 } = req.query;

  let connection;
  try {
    // Buat koneksi ke TiDB Serverless
    connection = await mysql.createConnection({
      host: 'gateway01.ap-southeast-1.prod.alicloud.tidbcloud.com',
      port: 4000,
      user: 'KnokxJmGN7Viird.root',
      password: 'O3GrrtV167xYXanO',
      database: 'test',
      ssl: {
        rejectUnauthorized: false
      }
    });

    // Mulai rakit query
    let baseQuery = `SELECT * FROM procurement_anomalies`;
    const conditions = [];
    const values = [];

    if (prov) {
      conditions.push('provinsi = ?');
      values.push(prov);
    }
    
    if (lembaga) {
      conditions.push('lembaga = ?');
      values.push(lembaga);
    }

    if (metode) {
      conditions.push('metode = ?');
      values.push(metode);
    }

    if (search) {
      // Pencarian gabungan pada lembaga, agenda, dan provinsi
      conditions.push('(lembaga LIKE ? OR agenda LIKE ? OR provinsi LIKE ?)');
      const likeSearch = `%${search}%`;
      values.push(likeSearch, likeSearch, likeSearch);
    }

    if (conditions.length > 0) {
      baseQuery += ` WHERE ` + conditions.join(' AND ');
    }

    // Urutkan berdasarkan skor_risiko tertinggi
    baseQuery += ` ORDER BY skor_risiko DESC`;

    // Count query to support real server-side pagination
    let countQuery = `SELECT COUNT(*) AS total FROM procurement_anomalies`;
    if (conditions.length > 0) {
      countQuery += ` WHERE ` + conditions.join(' AND ');
    }
    const [countResult] = await connection.execute(countQuery, values);
    const totalCount = countResult[0]?.total || 0;

    // Pagination
    const numLimit = parseInt(limit, 10) || 100;
    const numPage = parseInt(page, 10) || 1;
    const offset = (numPage - 1) * numLimit;
    
    baseQuery += ` LIMIT ${numLimit} OFFSET ${offset}`;

    const [rows] = await connection.execute(baseQuery, values);

    return res.status(200).json({ data: rows, total: totalCount });
  } catch (error) {
    console.error('TiDB Error:', error);
    return res.status(500).json({ error: 'Failed to connect to TiDB Serverless', details: error.message });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}
