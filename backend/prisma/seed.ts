import { PrismaClient, Role } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

interface SeedQuestion {
  'Sno.': number;
  Question: string;
  Option_A: string;
  Option_B: string;
  Option_C: string;
  Option_D: string;
  Answers: string;
  Topics: string;
  certification_name: string;
}

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Create default admin and learner users
  const adminPassword = await bcrypt.hash('admin123', 12);
  const learnerPassword = await bcrypt.hash('learner123', 12);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: adminPassword,
      role: Role.ADMIN,
    },
  });
  console.log(`✅ Admin user created: ${admin.username}`);

  const learner = await prisma.user.upsert({
    where: { username: 'learner1' },
    update: {},
    create: {
      username: 'learner1',
      passwordHash: learnerPassword,
      role: Role.LEARNER,
    },
  });
  console.log(`✅ Learner user created: ${learner.username}`);

  const learner2 = await prisma.user.upsert({
    where: { username: 'learner2' },
    update: {},
    create: {
      username: 'learner2',
      passwordHash: learnerPassword,
      role: Role.LEARNER,
    },
  });
  console.log(`✅ Learner user created: ${learner2.username}`);

  // 2. Load certifications JSON
  const seedDataPath = path.resolve(__dirname, 'seed-data/certifications.json');
  if (!fs.existsSync(seedDataPath)) {
    console.error('❌ Seed data file not found at:', seedDataPath);
    console.log('Please place certifications.json in prisma/seed-data/');
    return;
  }

  const rawData = fs.readFileSync(seedDataPath, 'utf-8');
  const questions: SeedQuestion[] = JSON.parse(rawData);
  console.log(`📚 Loaded ${questions.length} questions from seed data`);

  // 3. Extract unique certifications
  const certNames = new Set<string>();
  for (const q of questions) {
    const name = q.certification_name?.trim();
    if (name) certNames.add(name);
  }

  const certMap = new Map<string, string>();

  for (const name of certNames) {
    const cert = await prisma.certification.upsert({
      where: { name },
      update: {},
      create: {
        name,
        description: `Certification exam preparation for ${name}`,
      },
    });
    certMap.set(name, cert.id);
    console.log(`✅ Certification: ${name} (${cert.id})`);
  }

  // 4. Seed questions
  let seededCount = 0;
  let skippedCount = 0;

  for (const q of questions) {
    const certName = q.certification_name?.trim();
    if (!certName || !certMap.has(certName)) {
      skippedCount++;
      continue;
    }

    const certId = certMap.get(certName)!;
    const questionText = q.Question?.trim();
    if (!questionText) {
      skippedCount++;
      continue;
    }

    const options = {
      A: (q.Option_A || '').trim(),
      B: (q.Option_B || '').trim(),
      C: (q.Option_C || '').trim(),
      D: (q.Option_D || '').trim(),
    };

    const correctAnswer = (q.Answers || '').trim().toUpperCase();
    const topic = (q.Topics || '').trim();

    // Determine difficulty based on question length and options
    let difficulty = 'medium';
    if (questionText.length > 500) difficulty = 'hard';
    else if (questionText.length < 200) difficulty = 'easy';

    try {
      await prisma.question.create({
        data: {
          certificationId: certId,
          questionText,
          options,
          correctAnswer,
          difficulty,
          topic,
        },
      });
      seededCount++;
    } catch (error) {
      skippedCount++;
    }
  }

  console.log(`\n📊 Seed Summary:`);
  console.log(`   Questions seeded: ${seededCount}`);
  console.log(`   Questions skipped: ${skippedCount}`);
  console.log(`   Certifications: ${certMap.size}`);
  console.log(`   Users: 3 (admin, learner1, learner2)`);
  console.log('\n🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
