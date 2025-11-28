import mysql from "mysql2/promise";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  let connection: mysql.Connection | null = null;

  try {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error("DATABASE_URL environment variable is not set");
    }

    const urlMatch = dbUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    if (!urlMatch) {
      throw new Error("Invalid DATABASE_URL format");
    }

    const [, user, password, host, port, database] = urlMatch;

    console.log(`🔌 Database-ə qoşulur: ${host}:${port}/${database}`);

    connection = await mysql.createConnection({
      host,
      port: parseInt(port),
      user,
      password,
      database,
      connectTimeout: 60000,
    });

    console.log("✅ Database-ə qoşuldu");

    // deleted_by column-unun mövcud olub olmadığını yoxla
    const [columns] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? 
       AND TABLE_NAME = 'posts' 
       AND COLUMN_NAME = 'deleted_by'`,
      [database]
    );

    if (columns.length > 0) {
      console.log("✅ 'deleted_by' column artıq mövcuddur:");
      console.log(columns[0]);
    } else {
      console.log("❌ 'deleted_by' column mövcud deyil");
      console.log("\n⚠️  Column-u əlavə etmək üçün aşağıdakı SQL-i manual olaraq işə salın:");
      console.log("\nALTER TABLE `posts` ADD COLUMN `deleted_by` INT NULL AFTER `deleted_at`;\n");
    }
  } catch (error: any) {
    console.error("❌ Xəta:", error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log("🔌 Connection bağlandı");
    }
  }
}

main();




