import mysql from "mysql2/promise";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  let pool: mysql.Pool | null = null;

  try {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error("DATABASE_URL environment variable is not set");
    }

    // Parse DATABASE_URL: mysql://user:password@host:port/database
    const urlMatch = dbUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    if (!urlMatch) {
      throw new Error("Invalid DATABASE_URL format");
    }

    const [, user, password, host, port, database] = urlMatch;

    console.log(`🔌 Database-ə qoşulur: ${host}:${port}/${database}`);

    pool = mysql.createPool({
      host,
      port: parseInt(port),
      user,
      password,
      database,
      connectTimeout: 60000,
      waitForConnections: true,
      connectionLimit: 1,
    });

    const connection = await pool.getConnection();

    console.log("✅ Database-ə qoşuldu");

    try {
      // deleted_by column-unun mövcud olub olmadığını yoxla
      const [columns] = await connection.execute<mysql.RowDataPacket[]>(
        `SELECT COLUMN_NAME 
         FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = ? 
         AND TABLE_NAME = 'posts' 
         AND COLUMN_NAME = 'deleted_by'`,
        [database]
      );

      if (columns.length > 0) {
        console.log("✅ 'deleted_by' column artıq mövcuddur");
        connection.release();
        return;
      }

      console.log("➕ 'deleted_by' column-u əlavə edirəm...");
      console.log("⏳ Bu əməliyyat bir neçə dəqiqə çəkə bilər (table böyükdürsə)...");

      // SQL_MODE-u dəyişdir ki, invalid datetime dəyərləri problem yaratmasın
      await connection.execute(`SET SESSION sql_mode = 'ALLOW_INVALID_DATES'`);
      
      // Connection timeout-u artır
      await connection.execute(`SET SESSION wait_timeout = 600`);

      // Column-u əlavə et
      await connection.execute(
        `ALTER TABLE \`posts\` ADD COLUMN \`deleted_by\` INT NULL AFTER \`deleted_at\`
      `);
      
      console.log("✅ 'deleted_by' column uğurla əlavə edildi");
      connection.release();
    } catch (err: any) {
      connection.release();
      throw err;
    }

    console.log("✅ 'deleted_by' column uğurla əlavə edildi");
  } catch (error: any) {
    console.error("❌ Xəta:", error.message);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
      console.log("🔌 Connection pool bağlandı");
    }
  }
}

main();

