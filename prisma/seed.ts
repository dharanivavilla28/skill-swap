// SkillSwap Seed Script
// Populates 8+ realistic fictional student profiles, skills, swaps, ratings, and wallet ledger entries

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding SkillSwap Database ---');

  // Clean existing demo data if needed to ensure repeatable idempotency
  await prisma.notification.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.rating.deleteMany({});
  await prisma.creditTransaction.deleteMany({});
  await prisma.swap.deleteMany({});
  await prisma.userSkill.deleteMany({});
  await prisma.unmetSkillRequest.deleteMany({});
  await prisma.verificationRequest.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.skill.deleteMany({});

  const defaultPasswordHash = await bcrypt.hash('demopassword123', 10);

  // 1. Canonical Skills
  const skillsData = [
    { canonicalName: 'Python', category: 'TECHNOLOGY', description: 'Scripting, algorithms, automation, and data handling with Python' },
    { canonicalName: 'Web Development', category: 'TECHNOLOGY', description: 'HTML, CSS, JavaScript, React, and modern full-stack web basics' },
    { canonicalName: 'Java', category: 'TECHNOLOGY', description: 'Object-oriented programming, data structures, and AP/college CS coursework' },
    { canonicalName: 'Data Analysis', category: 'TECHNOLOGY', description: 'Pandas, data cleaning, exploratory data analysis, and metrics' },
    { canonicalName: 'Excel & Sheets', category: 'BUSINESS', description: 'Formulas, VLOOKUP, XLOOKUP, pivot tables, and financial modeling basics' },
    { canonicalName: 'Figma', category: 'DESIGN', description: 'Wireframing, prototyping, design systems, and component auto-layout' },
    { canonicalName: 'UI/UX Design', category: 'DESIGN', description: 'User personas, heuristic evaluations, user flows, and wireframing' },
    { canonicalName: 'Canva', category: 'DESIGN', description: 'Social media graphics, student organization posters, and presentations' },
    { canonicalName: 'Poster Design', category: 'DESIGN', description: 'Visual hierarchy, typography, and event promotion collateral' },
    { canonicalName: 'Public Speaking', category: 'CAREER', description: 'Overcoming presentation anxiety, speech structuring, and vocal delivery' },
    { canonicalName: 'Interview Preparation', category: 'CAREER', description: 'Behavioral interview questions (STAR method), mock technical screens, and confidence' },
    { canonicalName: 'Resume Review', category: 'CAREER', description: 'ATS-friendly formatting, action-driven bullet points, and portfolio feedback' },
    { canonicalName: 'Presentation Storytelling', category: 'BUSINESS', description: 'Slide decks that persuade: narrative arcs and clean visual slides' },
    { canonicalName: 'Video Editing', category: 'CREATIVE', description: 'Premiere Pro, DaVinci Resolve, short-form reels, and pacing' },
    { canonicalName: 'Photography', category: 'CREATIVE', description: 'Camera settings, composition, campus portraits, and Lightroom editing' },
  ];

  const createdSkills: Record<string, any> = {};
  for (const s of skillsData) {
    const skill = await prisma.skill.create({ data: s });
    createdSkills[s.canonicalName] = skill;
  }
  console.log(`Created ${Object.keys(createdSkills).length} canonical skills.`);

  // 2. Fictional Student Profiles
  // Profile 1: Alex Rivera (Default Demo Learner)
  const alexUser = await prisma.user.create({
    data: {
      email: 'demo@skillswap.edu',
      passwordHash: defaultPasswordHash,
      name: 'Alex Rivera',
      college: 'Metro State University',
      course: 'Undeclared / First Year',
      year: 'Freshman (Year 1)',
      bio: 'First-year student exploring computer science and product design. Passionate about Canva design and looking to learn Python and public speaking for student club pitches!',
      interests: 'Data projects, Hackathons, Graphic design, Student council',
      availabilityJson: JSON.stringify([
        { day: 'Saturday', time: 'Morning' },
        { day: 'Wednesday', time: 'Evening' },
        { day: 'Sunday', time: 'Afternoon' },
      ]),
      preferredFormat: 'BOTH',
      verificationStatus: 'VERIFIED',
      trustScore: 0.72,
      creditBalance: 5.0,
      totalCreditsEarned: 1.0,
      totalCreditsSpent: 1.0,
      avatarInitial: 'AR',
    },
  });

  // Profile 2: Sarah Chen (Experienced Python & Data Provider)
  const sarahUser = await prisma.user.create({
    data: {
      email: 'sarah.chen@skillswap.edu',
      passwordHash: defaultPasswordHash,
      name: 'Sarah Chen',
      college: 'Metro State University',
      course: 'Computer Science & Statistics',
      year: 'Junior (Year 3)',
      bio: 'CS junior and teaching assistant. Love helping beginners write their first Python scripts without feeling intimidated. Also want to improve my Figma UI skills for hackathons!',
      interests: 'Python, Machine learning, Hackathons, UI/UX, Badminton',
      availabilityJson: JSON.stringify([
        { day: 'Saturday', time: 'Morning' },
        { day: 'Tuesday', time: 'Evening' },
        { day: 'Thursday', time: 'Evening' },
      ]),
      preferredFormat: 'BOTH',
      verificationStatus: 'VERIFIED',
      trustScore: 0.94,
      creditBalance: 9.5,
      totalCreditsEarned: 6.0,
      totalCreditsSpent: 1.5,
      avatarInitial: 'SC',
    },
  });

  // Profile 3: Marcus Vance (Public Speaking & Interview Prep Mentor)
  const marcusUser = await prisma.user.create({
    data: {
      email: 'marcus.v@skillswap.edu',
      passwordHash: defaultPasswordHash,
      name: 'Marcus Vance',
      college: 'Metro State University',
      course: 'Communications & Business',
      year: 'Senior (Year 4)',
      bio: 'Debate society captain and incoming management consultant. Experienced in campus mock interviews and pitch competitions. Looking to learn Excel financial modeling.',
      interests: 'Public speaking, Case competitions, Excel, Networking, Coffee brewing',
      availabilityJson: JSON.stringify([
        { day: 'Wednesday', time: 'Evening' },
        { day: 'Friday', time: 'Afternoon' },
        { day: 'Saturday', time: 'Morning' },
      ]),
      preferredFormat: 'BOTH',
      verificationStatus: 'VERIFIED',
      trustScore: 0.91,
      creditBalance: 8.0,
      totalCreditsEarned: 5.0,
      totalCreditsSpent: 2.0,
      avatarInitial: 'MV',
    },
  });

  // Profile 4: Priya Patel (UI/UX and Figma Specialist)
  const priyaUser = await prisma.user.create({
    data: {
      email: 'priya.patel@skillswap.edu',
      passwordHash: defaultPasswordHash,
      name: 'Priya Patel',
      college: 'Metro State University',
      course: 'Human-Computer Interaction',
      year: 'Senior (Year 4)',
      bio: 'Design lead at university design collective. I teach wireframing, auto-layout in Figma, and design critique. Eager to pick up web development basics to build my portfolio site.',
      interests: 'Figma, Web development, Typography, Accessibility, Photography',
      availabilityJson: JSON.stringify([
        { day: 'Monday', time: 'Evening' },
        { day: 'Wednesday', time: 'Evening' },
        { day: 'Saturday', time: 'Afternoon' },
      ]),
      preferredFormat: 'ONLINE',
      verificationStatus: 'VERIFIED',
      trustScore: 0.88,
      creditBalance: 7.25,
      totalCreditsEarned: 4.25,
      totalCreditsSpent: 2.0,
      avatarInitial: 'PP',
    },
  });

  // Profile 5: David Kim (Web Development & Java Tutor)
  const davidUser = await prisma.user.create({
    data: {
      email: 'david.kim@skillswap.edu',
      passwordHash: defaultPasswordHash,
      name: 'David Kim',
      college: 'Metro State University',
      course: 'Software Engineering',
      year: 'Sophomore (Year 2)',
      bio: 'Full-stack builder. Built multiple campus club web apps using React and Next.js. Happy to mentor in Web Dev and Java fundamentals. Want to practice video editing for YouTube tutorials.',
      interests: 'Web dev, React, Open source, Video editing, Gaming',
      availabilityJson: JSON.stringify([
        { day: 'Tuesday', time: 'Afternoon' },
        { day: 'Thursday', time: 'Evening' },
        { day: 'Sunday', time: 'Morning' },
      ]),
      preferredFormat: 'BOTH',
      verificationStatus: 'VERIFIED',
      trustScore: 0.85,
      creditBalance: 6.5,
      totalCreditsEarned: 3.5,
      totalCreditsSpent: 2.0,
      avatarInitial: 'DK',
    },
  });

  // Profile 6: Elena Rostova (Creative Video Editor & Storyteller)
  const elenaUser = await prisma.user.create({
    data: {
      email: 'elena.r@skillswap.edu',
      passwordHash: defaultPasswordHash,
      name: 'Elena Rostova',
      college: 'Metro State University',
      course: 'Film & Media Studies',
      year: 'Junior (Year 3)',
      bio: 'Video editor for university media channel. Master of Premiere Pro, short reels, and sound mixing. Want to learn Resume Review and LinkedIn branding for summer internships.',
      interests: 'Video editing, Storytelling, Resume review, Sound design, Filmmaking',
      availabilityJson: JSON.stringify([
        { day: 'Monday', time: 'Afternoon' },
        { day: 'Thursday', time: 'Morning' },
        { day: 'Saturday', time: 'Evening' },
      ]),
      preferredFormat: 'ONLINE',
      verificationStatus: 'PENDING',
      trustScore: 0.76,
      creditBalance: 5.5,
      totalCreditsEarned: 2.0,
      totalCreditsSpent: 1.5,
      avatarInitial: 'ER',
    },
  });

  // Profile 7: Liam O\'Connor (Excel & Finance Practical Mentor)
  const liamUser = await prisma.user.create({
    data: {
      email: 'liam.oc@skillswap.edu',
      passwordHash: defaultPasswordHash,
      name: 'Liam O\'Connor',
      college: 'Metro State University',
      course: 'Economics & Finance',
      year: 'Sophomore (Year 2)',
      bio: 'Finance geek who believes Excel is the most powerful tool ever made. Can guide anyone through XLOOKUP, pivot tables, and clean budgeting spreadsheets. Looking to learn Python for quant modeling.',
      interests: 'Excel, Finance, Python, Stock markets, Cycling',
      availabilityJson: JSON.stringify([
        { day: 'Wednesday', time: 'Morning' },
        { day: 'Friday', time: 'Afternoon' },
        { day: 'Sunday', time: 'Evening' },
      ]),
      preferredFormat: 'BOTH',
      verificationStatus: 'UNVERIFIED',
      trustScore: 0.65,
      creditBalance: 4.5,
      totalCreditsEarned: 1.0,
      totalCreditsSpent: 1.5,
      avatarInitial: 'LO',
    },
  });

  // Profile 8: Maya Lin (New Student with Limited History)
  const mayaUser = await prisma.user.create({
    data: {
      email: 'maya.lin@skillswap.edu',
      passwordHash: defaultPasswordHash,
      name: 'Maya Lin',
      college: 'Metro State University',
      course: 'Mechanical Engineering',
      year: 'Freshman (Year 1)',
      bio: 'New to SkillSwap! Excited to learn CAD, Python scripting, and presentation skills. I make neat presentation decks on Canva and Canva posters for student events.',
      interests: 'Canva, 3D printing, Presentation storytelling, Robotics',
      availabilityJson: JSON.stringify([
        { day: 'Saturday', time: 'Morning' },
        { day: 'Sunday', time: 'Morning' },
      ]),
      preferredFormat: 'IN_PERSON',
      verificationStatus: 'UNVERIFIED',
      trustScore: 0.52,
      creditBalance: 5.0,
      totalCreditsEarned: 0.0,
      totalCreditsSpent: 0.0,
      avatarInitial: 'ML',
    },
  });

  console.log('Created 8 fictional student profiles.');

  // 3. UserSkills (Offered and Wanted)
  // Alex Rivera (Demo Learner)
  await prisma.userSkill.createMany({
    data: [
      { userId: alexUser.id, skillId: createdSkills['Canva'].id, type: 'OFFERED', proficiency: 'INTERMEDIATE', description: 'Can teach social media templates and club flyers' },
      { userId: alexUser.id, skillId: createdSkills['Presentation Storytelling'].id, type: 'OFFERED', proficiency: 'BEGINNER', description: 'Clean minimal slide layouts' },
      { userId: alexUser.id, skillId: createdSkills['Python'].id, type: 'WANTED', proficiency: 'BEGINNER', description: 'Wants to learn variables, loops, and basic automation' },
      { userId: alexUser.id, skillId: createdSkills['Public Speaking'].id, type: 'WANTED', proficiency: 'BEGINNER', description: 'Wants to overcome stage fright for club elections' },
    ],
  });

  // Sarah Chen
  await prisma.userSkill.createMany({
    data: [
      { userId: sarahUser.id, skillId: createdSkills['Python'].id, type: 'OFFERED', proficiency: 'ADVANCED', description: 'Beginner-friendly Python, debugging, functions, and pandas' },
      { userId: sarahUser.id, skillId: createdSkills['Data Analysis'].id, type: 'OFFERED', proficiency: 'ADVANCED', description: 'Cleaning messy data and making clear graphs' },
      { userId: sarahUser.id, skillId: createdSkills['Figma'].id, type: 'WANTED', proficiency: 'BEGINNER', description: 'Want to make cleaner UI prototypes' },
    ],
  });

  // Marcus Vance
  await prisma.userSkill.createMany({
    data: [
      { userId: marcusUser.id, skillId: createdSkills['Public Speaking'].id, type: 'OFFERED', proficiency: 'EXPERT', description: 'Voice pacing, body language, and speech outlines' },
      { userId: marcusUser.id, skillId: createdSkills['Interview Preparation'].id, type: 'OFFERED', proficiency: 'ADVANCED', description: 'STAR method mock behavioral interviews' },
      { userId: marcusUser.id, skillId: createdSkills['Excel & Sheets'].id, type: 'WANTED', proficiency: 'BEGINNER', description: 'Need to build financial models for business case' },
    ],
  });

  // Priya Patel
  await prisma.userSkill.createMany({
    data: [
      { userId: priyaUser.id, skillId: createdSkills['Figma'].id, type: 'OFFERED', proficiency: 'EXPERT', description: 'Components, responsive auto-layout, and interactive prototypes' },
      { userId: priyaUser.id, skillId: createdSkills['UI/UX Design'].id, type: 'OFFERED', proficiency: 'ADVANCED', description: 'Usability testing, user journeys, and clean design' },
      { userId: priyaUser.id, skillId: createdSkills['Web Development'].id, type: 'WANTED', proficiency: 'BEGINNER', description: 'Want to translate Figma components into React' },
    ],
  });

  // David Kim
  await prisma.userSkill.createMany({
    data: [
      { userId: davidUser.id, skillId: createdSkills['Web Development'].id, type: 'OFFERED', proficiency: 'ADVANCED', description: 'Modern JavaScript, React, Tailwind, and Git workflow' },
      { userId: davidUser.id, skillId: createdSkills['Java'].id, type: 'OFFERED', proficiency: 'ADVANCED', description: 'OOP, class hierarchies, and college lab prep' },
      { userId: davidUser.id, skillId: createdSkills['Video Editing'].id, type: 'WANTED', proficiency: 'BEGINNER', description: 'Short clips for tech devlogs' },
    ],
  });

  // Elena Rostova
  await prisma.userSkill.createMany({
    data: [
      { userId: elenaUser.id, skillId: createdSkills['Video Editing'].id, type: 'OFFERED', proficiency: 'ADVANCED', description: 'Cut transitions, color correction, and audio cleanup' },
      { userId: elenaUser.id, skillId: createdSkills['Resume Review'].id, type: 'WANTED', proficiency: 'BEGINNER', description: 'Prep resume for media studio applications' },
    ],
  });

  // Liam O'Connor
  await prisma.userSkill.createMany({
    data: [
      { userId: liamUser.id, skillId: createdSkills['Excel & Sheets'].id, type: 'OFFERED', proficiency: 'ADVANCED', description: 'VLOOKUP, INDEX/MATCH, XLOOKUP, and pivot charts' },
      { userId: liamUser.id, skillId: createdSkills['Python'].id, type: 'WANTED', proficiency: 'BEGINNER', description: 'Python for financial data analysis' },
    ],
  });

  // Maya Lin
  await prisma.userSkill.createMany({
    data: [
      { userId: mayaUser.id, skillId: createdSkills['Canva'].id, type: 'OFFERED', proficiency: 'INTERMEDIATE', description: 'Club posters and event invitations' },
      { userId: mayaUser.id, skillId: createdSkills['Python'].id, type: 'WANTED', proficiency: 'BEGINNER', description: 'Intro programming for engineering labs' },
    ],
  });

  // 4. Initial Wallet Grants & Completed Swaps to establish real historical ledger
  // Starting grants for all users
  const allUsers = [alexUser, sarahUser, marcusUser, priyaUser, davidUser, elenaUser, liamUser, mayaUser];
  for (const u of allUsers) {
    await prisma.creditTransaction.create({
      data: {
        userId: u.id,
        type: 'STARTING_GRANT',
        amount: 5.0,
        balanceAfter: 5.0,
        description: 'Initial campus onboarding credit allocation',
        idempotencyKey: `starting-grant-${u.id}`,
      },
    });
  }

  // Completed Swap 1: Alex Rivera learned Canva tips to Sarah Chen, and Sarah helped Alex with Python Intro
  const swap1 = await prisma.swap.create({
    data: {
      requesterId: alexUser.id,
      providerId: sarahUser.id,
      skillId: createdSkills['Python'].id,
      learningGoal: 'Setup Python environment and write first data script',
      sessionFormat: 'ONLINE',
      preferredTime: '2026-10-01T10:00:00.000Z',
      agreedTime: '2026-10-01T10:00:00.000Z',
      durationMinutes: 60,
      proposedCredits: 1.0,
      agreedCredits: 1.0,
      status: 'COMPLETED',
      requesterCompleted: true,
      providerCompleted: true,
      settlementState: 'SETTLED',
    },
  });

  // Ledger entries for Swap 1
  await prisma.creditTransaction.create({
    data: {
      userId: alexUser.id,
      swapId: swap1.id,
      type: 'SPENT',
      amount: -1.0,
      balanceAfter: 4.0,
      description: `Spent 1.0 credit for 60-minute Python session with Sarah Chen`,
      idempotencyKey: `swap-${swap1.id}-debit`,
    },
  });

  await prisma.creditTransaction.create({
    data: {
      userId: sarahUser.id,
      swapId: swap1.id,
      type: 'EARNED',
      amount: 1.0,
      balanceAfter: 6.0,
      description: `Earned 1.0 credit for teaching 60-minute Python session to Alex Rivera`,
      idempotencyKey: `swap-${swap1.id}-credit`,
    },
  });

  // Swap 1 Ratings
  await prisma.rating.create({
    data: {
      swapId: swap1.id,
      reviewerId: alexUser.id,
      recipientId: sarahUser.id,
      score: 5,
      reviewText: 'Sarah was super patient! She explained VS Code setup and loops clearly with great analogies.',
    },
  });

  await prisma.rating.create({
    data: {
      swapId: swap1.id,
      reviewerId: sarahUser.id,
      recipientId: alexUser.id,
      score: 5,
      reviewText: 'Alex came prepared with questions and picked up Python syntax quickly. Great peer learner!',
    },
  });

  // Completed Swap 2: Alex taught Canva to Elena
  const swap2 = await prisma.swap.create({
    data: {
      requesterId: elenaUser.id,
      providerId: alexUser.id,
      skillId: createdSkills['Canva'].id,
      learningGoal: 'Design poster templates for media club showcase',
      sessionFormat: 'ONLINE',
      preferredTime: '2026-10-04T15:00:00.000Z',
      agreedTime: '2026-10-04T15:00:00.000Z',
      durationMinutes: 60,
      proposedCredits: 1.0,
      agreedCredits: 1.0,
      status: 'COMPLETED',
      requesterCompleted: true,
      providerCompleted: true,
      settlementState: 'SETTLED',
    },
  });

  await prisma.creditTransaction.create({
    data: {
      userId: elenaUser.id,
      swapId: swap2.id,
      type: 'SPENT',
      amount: -1.0,
      balanceAfter: 4.0,
      description: `Spent 1.0 credit for Canva design session with Alex Rivera`,
      idempotencyKey: `swap-${swap2.id}-debit`,
    },
  });

  await prisma.creditTransaction.create({
    data: {
      userId: alexUser.id,
      swapId: swap2.id,
      type: 'EARNED',
      amount: 1.0,
      balanceAfter: 5.0,
      description: `Earned 1.0 credit for teaching Canva design to Elena Rostova`,
      idempotencyKey: `swap-${swap2.id}-credit`,
    },
  });

  await prisma.rating.create({
    data: {
      swapId: swap2.id,
      reviewerId: elenaUser.id,
      recipientId: alexUser.id,
      score: 5,
      reviewText: 'Alex showed me shortcuts in Canva I had never seen before. Very clear and friendly!',
    },
  });

  // Swap 3: Marcus taught Public Speaking to David (30-minute session = 0.5 credits)
  const swap3 = await prisma.swap.create({
    data: {
      requesterId: davidUser.id,
      providerId: marcusUser.id,
      skillId: createdSkills['Public Speaking'].id,
      learningGoal: 'Structure 3-minute pitch for student startup competition',
      sessionFormat: 'BOTH',
      preferredTime: '2026-10-06T18:00:00.000Z',
      agreedTime: '2026-10-06T18:00:00.000Z',
      durationMinutes: 30,
      proposedCredits: 0.5,
      agreedCredits: 0.5,
      status: 'COMPLETED',
      requesterCompleted: true,
      providerCompleted: true,
      settlementState: 'SETTLED',
    },
  });

  await prisma.creditTransaction.create({
    data: {
      userId: davidUser.id,
      swapId: swap3.id,
      type: 'SPENT',
      amount: -0.5,
      balanceAfter: 4.5,
      description: `Spent 0.5 credits for 30-min Public Speaking session with Marcus Vance`,
      idempotencyKey: `swap-${swap3.id}-debit`,
    },
  });

  await prisma.creditTransaction.create({
    data: {
      userId: marcusUser.id,
      swapId: swap3.id,
      type: 'EARNED',
      amount: 0.5,
      balanceAfter: 5.5,
      description: `Earned 0.5 credits for 30-min Public Speaking coaching to David Kim`,
      idempotencyKey: `swap-${swap3.id}-credit`,
    },
  });

  await prisma.rating.create({
    data: {
      swapId: swap3.id,
      reviewerId: davidUser.id,
      recipientId: marcusUser.id,
      score: 5,
      reviewText: 'Marcus transformed my messy pitch into a punchy 3-minute story. Incredible feedback!',
    },
  });

  // Active / Upcoming Swap: Alex Rivera requested Public Speaking from Marcus Vance (Pending or Scheduled)
  const upcomingSwap = await prisma.swap.create({
    data: {
      requesterId: alexUser.id,
      providerId: marcusUser.id,
      skillId: createdSkills['Public Speaking'].id,
      learningGoal: 'Practice introducing myself smoothly at campus networking night',
      sessionFormat: 'ONLINE',
      preferredTime: '2026-10-18T18:30:00.000Z',
      agreedTime: '2026-10-18T18:30:00.000Z',
      durationMinutes: 45,
      proposedCredits: 0.75,
      agreedCredits: 0.75,
      status: 'SCHEDULED',
      requesterCompleted: false,
      providerCompleted: false,
      settlementState: 'UNSETTLED',
    },
  });

  // Messages on upcomingSwap
  await prisma.message.createMany({
    data: [
      {
        swapId: upcomingSwap.id,
        senderId: alexUser.id,
        recipientId: marcusUser.id,
        content: 'Hi Marcus! Excited for our session next week. Should I prepare a 1-minute intro draft beforehand?',
        isRead: true,
      },
      {
        swapId: upcomingSwap.id,
        senderId: marcusUser.id,
        recipientId: alexUser.id,
        content: 'Hey Alex! Yes, bring 3 bullet points about your major, interests, and what you want to work on. We will polish it together!',
        isRead: false,
      },
    ],
  });

  // Notifications for Alex
  await prisma.notification.createMany({
    data: [
      {
        userId: alexUser.id,
        eventType: 'MATCH_FOUND',
        title: 'New High Compatibility Match',
        content: 'Sarah Chen offers Advanced Python and matches your Saturday Morning availability!',
        link: '/dashboard/matches',
        isRead: false,
      },
      {
        userId: alexUser.id,
        eventType: 'SESSION_SCHEDULED',
        title: 'Session Scheduled with Marcus Vance',
        content: 'Your 45-minute Public Speaking session has been agreed for Oct 18, 6:30 PM.',
        link: '/dashboard/sessions',
        isRead: false,
      },
      {
        userId: alexUser.id,
        eventType: 'CREDITS_EARNED',
        title: 'Credits Earned!',
        content: 'You earned 1.0 credit for your Canva session with Elena Rostova. Current balance: 5.00 credits.',
        link: '/dashboard/wallet',
        isRead: true,
      },
    ],
  });

  // Unmet skill request example
  await prisma.unmetSkillRequest.create({
    data: {
      userId: alexUser.id,
      skillName: 'Blender 3D Modeling',
      category: 'DESIGN',
      description: 'Looking to learn low-poly 3D asset creation for game dev projects',
      notifyOnMatch: true,
      status: 'ACTIVE',
    },
  });

  console.log('--- Database Seeding Complete ---');
  console.log('Demo Account: demo@skillswap.edu / demopassword123');
}

main()
  .catch((e) => {
    console.error('Seed script error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
