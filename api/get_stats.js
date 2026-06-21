import mysql from 'mysql2/promise';

export default async function handler(req, res) {
  // Hanya ijinkan metode GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

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

    // 1. Query Metadata Nasional
    const metadataQuery = `
      SELECT 
        COUNT(*) as total_national_projects,
        SUM(CASE WHEN skor_risiko > 0 THEN 1 ELSE 0 END) as total_national_anomalies,
        SUM(fraud_value) as total_national_fraud_value_rp,
        SUM(pagu) as total_national_pagu_rp,
        AVG(skor_risiko) as avg_national_risk
      FROM procurement_anomalies
    `;
    const [metadataRows] = await connection.execute(metadataQuery);
    const meta = metadataRows[0] || {};

    // Helper to calculate kategori_risiko based on average score
    const getKategori = (skor) => {
      if (skor < 35) return "Rendah";
      if (skor < 50) return "Sedang";
      if (skor < 75) return "Tinggi";
      return "Anomali Ekstrem";
    };

    // 2. Query Provinsi - Semua Instansi
    const queryAll = `
      SELECT 
        provinsi, 
        COUNT(*) as total_projects, 
        SUM(CASE WHEN skor_risiko > 0 THEN 1 ELSE 0 END) as total_anomalies, 
        SUM(fraud_value) as total_fraud_value_rp, 
        AVG(skor_risiko) as avg_skor_risiko
      FROM procurement_anomalies 
      GROUP BY provinsi
    `;
    const [rowsAll] = await connection.execute(queryAll);
    const formattedAll = rowsAll.map(r => ({
      provinsi: r.provinsi,
      total_projects: parseInt(r.total_projects, 10) || 0,
      total_anomalies: parseInt(r.total_anomalies, 10) || 0,
      total_fraud_value_rp: parseFloat(r.total_fraud_value_rp) || 0,
      avg_skor_risiko: parseFloat(r.avg_skor_risiko) || 0,
      kategori_risiko: getKategori(parseFloat(r.avg_skor_risiko) || 0)
    }));

    // 3. Query Provinsi - Hanya Pemda
    const queryPemda = `
      SELECT 
        provinsi, 
        COUNT(*) as total_projects, 
        SUM(CASE WHEN skor_risiko > 0 THEN 1 ELSE 0 END) as total_anomalies, 
        SUM(fraud_value) as total_fraud_value_rp, 
        AVG(skor_risiko) as avg_skor_risiko
      FROM procurement_anomalies 
      WHERE lembaga LIKE 'Provinsi %' OR lembaga LIKE 'Kab. %' OR lembaga LIKE 'Kota %'
      GROUP BY provinsi
    `;
    const [rowsPemda] = await connection.execute(queryPemda);
    const formattedPemda = rowsPemda.map(r => ({
      provinsi: r.provinsi,
      total_projects: parseInt(r.total_projects, 10) || 0,
      total_anomalies: parseInt(r.total_anomalies, 10) || 0,
      total_fraud_value_rp: parseFloat(r.total_fraud_value_rp) || 0,
      avg_skor_risiko: parseFloat(r.avg_skor_risiko) || 0,
      kategori_risiko: getKategori(parseFloat(r.avg_skor_risiko) || 0)
    }));

    // 4. Query Provinsi - Hanya Kementerian / Lembaga Pusat
    const queryKL = `
      SELECT 
        provinsi, 
        COUNT(*) as total_projects, 
        SUM(CASE WHEN skor_risiko > 0 THEN 1 ELSE 0 END) as total_anomalies, 
        SUM(fraud_value) as total_fraud_value_rp, 
        AVG(skor_risiko) as avg_skor_risiko
      FROM procurement_anomalies 
      WHERE NOT (lembaga LIKE 'Provinsi %' OR lembaga LIKE 'Kab. %' OR lembaga LIKE 'Kota %')
      GROUP BY provinsi
    `;
    const [rowsKL] = await connection.execute(queryKL);
    const formattedKL = rowsKL.map(r => ({
      provinsi: r.provinsi,
      total_projects: parseInt(r.total_projects, 10) || 0,
      total_anomalies: parseInt(r.total_anomalies, 10) || 0,
      total_fraud_value_rp: parseFloat(r.total_fraud_value_rp) || 0,
      avg_skor_risiko: parseFloat(r.avg_skor_risiko) || 0,
      kategori_risiko: getKategori(parseFloat(r.avg_skor_risiko) || 0)
    }));

    // Set Vercel Edge Cache-Control headers to cache results for 30 minutes
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=600');

    return res.status(200).json({
      metadata: {
        total_national_projects: parseInt(meta.total_national_projects, 10) || 0,
        total_national_anomalies: parseInt(meta.total_national_anomalies, 10) || 0,
        total_national_fraud_value_rp: parseFloat(meta.total_national_fraud_value_rp) || 0,
        total_national_pagu_rp: parseFloat(meta.total_national_pagu_rp) || 0,
        avg_national_risk: parseFloat(meta.avg_national_risk) || 0,
        generated_at: new Date().toISOString()
      },
      provinces: {
        semua: formattedAll,
        pemda: formattedPemda,
        kementerian: formattedKL
      }
    });

  } catch (error) {
    console.error('TiDB Stats Error:', error);
    return res.status(500).json({ error: 'Failed to connect to TiDB Serverless', details: error.message });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}
