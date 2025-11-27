const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function createAdmin() {
  const email = "admin@iqtisadiyyat.az";
  const password = "Admin123!";
  const name = "Admin";
  const surname = "User";

  // Şifrəni hash et
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    // Mövcud istifadəçini yoxla
    const existingUser = await prisma.users.findFirst({
      where: {
        email,
        deleted_at: null,
      },
    });

    if (existingUser) {
      // Mövcud istifadəçini admin edək
      await prisma.users.update({
        where: { id: existingUser.id },
        data: {
          role: 2, // Admin
          password: hashedPassword,
          status: true,
          updated_at: new Date(),
        },
      });
      console.log("✅ Mövcud istifadəçi admin edildi!");
    } else {
      // Yeni admin yarad
      await prisma.users.create({
        data: {
          name,
          surname,
          email,
          password: hashedPassword,
          role: 2, // Admin
          status: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
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
    await prisma.$disconnect();
  }
}

createAdmin();



