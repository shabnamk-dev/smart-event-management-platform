import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { getDatabase } from './database.js';
import { hashAttendanceToken, generateUserAttendanceToken } from '../utils/qr.js';

export async function seedDatabase(db = null) {
  const database = db || getDatabase();

  console.log('🌱 Seeding database with secure demo data...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // Clear existing demo tables in reverse order of dependencies
  database.exec(`
    DELETE FROM evaluations;
    DELETE FROM announcements;
    DELETE FROM submissions;
    DELETE FROM team_members;
    DELETE FROM teams;
    DELETE FROM users;
  `);

  // 1. SEED USERS
  const users = [
    {
      id: 'usr_alex_01',
      name: 'Alex Chen',
      email: 'alex@hackathon.dev',
      password_hash: passwordHash,
      role: 'participant',
      skills: JSON.stringify(['React', 'TypeScript', 'Node.js', 'TailwindCSS']),
      preferred_roles: JSON.stringify(['Frontend Developer', 'Fullstack Engineer']),
      interests: JSON.stringify(['AI/ML', 'Healthcare', 'FinTech']),
      bio: 'Fullstack builder passionate about applying AI to patient diagnostics.',
      raw_token: 'demo_token_alex_chen_high_entropy_secret_998127391',
      checked_in: 0,
      checked_in_at: null,
      is_demo: 1,
    },
    {
      id: 'usr_priya_02',
      name: 'Priya Sharma',
      email: 'priya@hackathon.dev',
      password_hash: passwordHash,
      role: 'participant',
      skills: JSON.stringify(['Python', 'PyTorch', 'FastAPI', 'Computer Vision']),
      preferred_roles: JSON.stringify(['ML Engineer', 'Backend Developer']),
      interests: JSON.stringify(['AI/ML', 'Healthcare']),
      bio: 'Deep learning researcher focused on medical image segmentation.',
      raw_token: 'demo_token_priya_sharma_high_entropy_secret_881729381',
      checked_in: 1,
      checked_in_at: new Date(Date.now() - 3600000).toISOString(),
      is_demo: 1,
    },
    {
      id: 'usr_marcus_03',
      name: 'Marcus Brody',
      email: 'marcus@hackathon.dev',
      password_hash: passwordHash,
      role: 'participant',
      skills: JSON.stringify(['UI/UX Design', 'Figma', 'Prototyping', 'Design Systems']),
      preferred_roles: JSON.stringify(['Product Designer', 'UI/UX Specialist']),
      interests: JSON.stringify(['Healthcare', 'EdTech', 'Social Good']),
      bio: 'Human-centered designer crafting accessible health interfaces.',
      raw_token: 'demo_token_marcus_brody_high_entropy_secret_772615482',
      checked_in: 1,
      checked_in_at: new Date(Date.now() - 7200000).toISOString(),
      is_demo: 1,
    },
    {
      id: 'usr_david_04',
      name: 'David Kim',
      email: 'david@hackathon.dev',
      password_hash: passwordHash,
      role: 'participant',
      skills: JSON.stringify(['Solidity', 'Rust', 'Web3', 'Smart Contracts']),
      preferred_roles: JSON.stringify(['Blockchain Developer']),
      interests: JSON.stringify(['Web3', 'FinTech', 'Security']),
      bio: 'Decentralized systems engineer building zero-knowledge protocols.',
      raw_token: 'demo_token_david_kim_high_entropy_secret_661524381',
      checked_in: 0,
      checked_in_at: null,
      is_demo: 1,
    },
    {
      id: 'usr_judge_elena',
      name: 'Dr. Elena Vance',
      email: 'dr.elena@hackathon.dev',
      password_hash: passwordHash,
      role: 'judge',
      skills: JSON.stringify(['AI Research', 'System Architecture']),
      preferred_roles: JSON.stringify(['Principal Judge']),
      interests: JSON.stringify(['AI/ML', 'HealthTech']),
      bio: 'Director of AI Innovation at TechHealth Labs. 15+ years judging hackathons.',
      raw_token: 'demo_token_judge_elena_secret_991823719',
      checked_in: 1,
      checked_in_at: new Date(Date.now() - 10800000).toISOString(),
      is_demo: 1,
    },
    {
      id: 'usr_judge_kenji',
      name: 'Kenji Sato',
      email: 'kenji.sato@hackathon.dev',
      password_hash: passwordHash,
      role: 'judge',
      skills: JSON.stringify(['Venture Capital', 'Cloud Architecture']),
      preferred_roles: JSON.stringify(['Technical Judge']),
      interests: JSON.stringify(['FinTech', 'Web3', 'SaaS']),
      bio: 'Partner at Horizon Ventures. Evaluating product viability & technical depth.',
      raw_token: 'demo_token_judge_kenji_secret_881928371',
      checked_in: 1,
      checked_in_at: new Date(Date.now() - 10800000).toISOString(),
      is_demo: 1,
    },
    {
      id: 'usr_organizer_sarah',
      name: 'Sarah Jenkins',
      email: 'sarah.admin@hackathon.dev',
      password_hash: passwordHash,
      role: 'organizer',
      skills: JSON.stringify(['Event Operations', 'Logistics', 'Community']),
      preferred_roles: JSON.stringify(['Lead Organizer']),
      interests: JSON.stringify(['Open Innovation', 'Hackathons']),
      bio: 'Lead organizer of AbhiyantriX PromptWars 2026.',
      raw_token: 'demo_token_organizer_sarah_secret_112938475',
      checked_in: 1,
      checked_in_at: new Date(Date.now() - 14400000).toISOString(),
      is_demo: 1,
    },
  ];

  const insertUser = database.prepare(`
    INSERT INTO users (
      id, name, email, password_hash, role, skills, preferred_roles,
      interests, bio, attendance_token_hash, checked_in, checked_in_at, is_demo
    ) VALUES (
      @id, @name, @email, @password_hash, @role, @skills, @preferred_roles,
      @interests, @bio, @attendance_token_hash, @checked_in, @checked_in_at, @is_demo
    )
  `);

  for (const user of users) {
    const rawToken = generateUserAttendanceToken(user.id);
    insertUser.run({
      ...user,
      attendance_token_hash: hashAttendanceToken(rawToken),
    });
  }

  // 2. SEED TEAMS & MEMBERS
  const insertTeam = database.prepare(`
    INSERT INTO teams (id, name, invite_code, lead_user_id, track)
    VALUES (@id, @name, @invite_code, @lead_user_id, @track)
  `);
  const insertMember = database.prepare(`
    INSERT INTO team_members (id, team_id, user_id)
    VALUES (@id, @team_id, @user_id)
  `);

  // Team 1: NeuralVision (Priya & Marcus)
  insertTeam.run({
    id: 'team_neuralvision_01',
    name: 'NeuralVision AI',
    invite_code: 'NV-9941',
    lead_user_id: 'usr_priya_02',
    track: 'AI/Healthcare',
  });
  insertMember.run({ id: 'tm_01', team_id: 'team_neuralvision_01', user_id: 'usr_priya_02' });
  insertMember.run({ id: 'tm_02', team_id: 'team_neuralvision_01', user_id: 'usr_marcus_03' });

  // 3. SEED PROJECT SUBMISSION
  const insertSubmission = database.prepare(`
    INSERT INTO submissions (id, team_id, title, tagline, description, demo_url, repo_url, track)
    VALUES (@id, @team_id, @title, @tagline, @description, @demo_url, @repo_url, @track)
  `);

  insertSubmission.run({
    id: 'sub_neuralvision_01',
    team_id: 'team_neuralvision_01',
    title: 'HealthAI Vision: Real-time Retinal Diagnostics',
    tagline: 'Automated clinical scan anomaly detection with accessible UX on the edge.',
    description: 'An AI-powered diagnostic web app that processes retinal fundus images in under 300ms using a quantized PyTorch model, highlighting micro-aneurysms for ophthalmologists.',
    demo_url: 'https://demo.healthai-vision.dev',
    repo_url: 'https://github.com/abhiyantrix/neuralvision-ai',
    track: 'AI/Healthcare',
  });

  // 4. SEED SAMPLE EVALUATION
  const insertEvaluation = database.prepare(`
    INSERT INTO evaluations (
      id, submission_id, judge_id, innovation_score, technical_score,
      impact_score, presentation_score, total_score, feedback
    ) VALUES (
      @id, @submission_id, @judge_id, @innovation_score, @technical_score,
      @impact_score, @presentation_score, @total_score, @feedback
    )
  `);

  // Dr. Elena Vance evaluates NeuralVision
  insertEvaluation.run({
    id: 'eval_01',
    submission_id: 'sub_neuralvision_01',
    judge_id: 'usr_judge_elena',
    innovation_score: 9.2,
    technical_score: 9.5,
    impact_score: 9.0,
    presentation_score: 8.8,
    total_score: 92.0, // (9.2*0.25 + 9.5*0.35 + 9.0*0.25 + 8.8*0.15) * 10
    feedback: 'Outstanding technical architecture and real-world medical utility. Edge quantization is impressive.',
  });

  // 5. SEED ANNOUNCEMENTS
  const insertAnnouncement = database.prepare(`
    INSERT INTO announcements (id, author_id, title, content, priority, created_at)
    VALUES (@id, @author_id, @title, @content, @priority, @created_at)
  `);

  insertAnnouncement.run({
    id: 'ann_01',
    author_id: 'usr_organizer_sarah',
    title: 'Welcome to PromptWars × AbhiyantriX 2026!',
    content: 'Registration and QR verification are now live. Make sure to visit the check-in desk to get your badge confirmed.',
    priority: 'important',
    created_at: new Date(Date.now() - 14400000).toISOString(),
  });

  insertAnnouncement.run({
    id: 'ann_02',
    author_id: 'usr_organizer_sarah',
    title: 'Team Formation & Mentorship Round Live',
    content: 'Use the Smart Match finder to discover complementary teammates. Project submissions open at 1:00 PM.',
    priority: 'normal',
    created_at: new Date(Date.now() - 7200000).toISOString(),
  });

  console.log('✅ Seed completed successfully! Demo accounts ready.');
}

// If executed directly from command line
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase().catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  });
}
