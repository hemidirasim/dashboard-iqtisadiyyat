import mysql from "mysql2/promise";
import * as dotenv from "dotenv";

dotenv.config();

async function checkConstraint() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    // posts table-ın CREATE TABLE statement-ını al
    const [rows] = await connection.execute("SHOW CREATE TABLE posts");
    const createTable = (rows as any[])[0]?.["Create Table"];
    
    console.log("CREATE TABLE statement:");
    console.log(createTable);
    
    // Constraint-ləri tap
    const constraintMatch = createTable.match(/CONSTRAINT\s+`posts_chk_1`\s+CHECK\s+\(([^)]+)\)/i);
    if (constraintMatch) {
      console.log("\nposts_chk_1 constraint:");
      console.log(constraintMatch[1]);
    } else {
      console.log("\nposts_chk_1 constraint tapılmadı");
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await connection.end();
  }
}

checkConstraint();



