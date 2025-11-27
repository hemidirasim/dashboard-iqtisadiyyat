// Sadə admin yaratma scripti
// Bu scripti çalışdırmaq üçün: node scripts/create-admin-simple.js

const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");

async function createAdmin() {
  const email = "admin@iqtisadiyyat.az";
  const password = "Admin123!";
  const name = "Admin";
  const surname = "User";

  // Database connection
  const connection = await mysql.createConnection({
    host: "68.183.173.136",
    port: 3306,
    user: "iqtisd_1",
    password: "QCXqVwK8VZgcAD5W",
    database: "iqtisd_db1",
  });

  try {
    // Şifrəni hash et
    const hashedPassword = await bcrypt.hash(password, 10);

    // Mövcud istifadəçini yoxla
    const [existingUsers] = await connection.execute(
      "SELECT id FROM users WHERE email = ? AND deleted_at IS NULL",
      [email]
    );

    if (existingUsers.length > 0) {
      // Mövcud istifadəçini admin edək
      await connection.execute(
        "UPDATE users SET role = ?, password = ?, status = 1, updated_at = NOW() WHERE id = ?",
        [2, hashedPassword, existingUsers[0].id]
      );
      console.log("✅ Mövcud istifadəçi admin edildi!");
    } else {
      // Yeni admin yarad
      await connection.execute(
        "INSERT INTO users (name, surname, email, password, role, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())",
        [name, surname, email, hashedPassword, 2, 1]
      );
      console.log("✅ Yeni admin hesabı yaradıldı!");
    }

    console.log("\n📋 Login məlumatları:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Parol: ${password}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n⚠️  Xahiş edirik, giriş etdikdən sonra parolu dəyişdirin!");
  } catch (error) {
    console.error("❌ Xəta:", error);
  } finally {
    await connection.end();
  }
}

createAdmin();



