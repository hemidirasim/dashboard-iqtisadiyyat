import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ["query", "error", "warn"],
});

async function main() {
  try {
    console.log("🔍 'deleted_by' column-unun mövcud olub olmadığını yoxlayıram...");
    
    // deleted_by column-unun mövcud olub olmadığını yoxla
    const result = await prisma.$queryRaw<Array<{ COLUMN_NAME: string }>>`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'posts' 
      AND COLUMN_NAME = 'deleted_by'
    `;

    if (result.length > 0) {
      console.log("✅ 'deleted_by' column artıq mövcuddur");
      return;
    }

    console.log("➕ 'deleted_by' column-u əlavə edirəm...");
    
    // Column-u əlavə et
    await prisma.$executeRawUnsafe(`
      ALTER TABLE \`posts\` ADD COLUMN \`deleted_by\` INT NULL AFTER \`deleted_at\`
    `);

    console.log("✅ 'deleted_by' column uğurla əlavə edildi");
  } catch (error: any) {
    console.error("❌ Xəta:", error.message);
    if (error.code === 'P1017') {
      console.error("⚠️  Database connection problemi. Zəhmət olmasa database-ə qoşulduğunuzu yoxlayın.");
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

