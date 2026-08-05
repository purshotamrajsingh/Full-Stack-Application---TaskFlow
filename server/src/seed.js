require('dotenv').config();
const connectDB = require('./config/db');
const User = require('./models/User');
const Project = require('./models/Project');
const Task = require('./models/Task');

async function seed() {
  await connectDB();
  console.log('Clearing existing data...');
  await Promise.all([User.deleteMany({}), Project.deleteMany({}), Task.deleteMany({})]);

  console.log('Creating users...');
  const admin = await User.create({
    name: 'Alex Admin',
    email: 'admin@taskflow.dev',
    password: 'Password123',
    role: 'admin',
  });
  const bob = await User.create({
    name: 'Bob Builder',
    email: 'bob@taskflow.dev',
    password: 'Password123',
    role: 'user',
  });
  const carol = await User.create({
    name: 'Carol Coder',
    email: 'carol@taskflow.dev',
    password: 'Password123',
    role: 'user',
  });

  console.log('Creating projects...');
  const website = await Project.create({
    name: 'Website Redesign',
    description: 'Revamp the marketing site with a new design system.',
    owner: admin._id,
    members: [bob._id, carol._id],
  });
  const mobile = await Project.create({
    name: 'Mobile App Launch',
    description: 'Ship v1 of the companion mobile app.',
    owner: bob._id,
    members: [carol._id],
  });

  console.log('Creating tasks...');
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  await Task.insertMany([
    {
      title: 'Design new landing page',
      description: 'Create hi-fi mockups in Figma for the homepage.',
      status: 'in_progress',
      priority: 'high',
      dueDate: new Date(now + 3 * day),
      project: website._id,
      assignee: carol._id,
      createdBy: admin._id,
    },
    {
      title: 'Set up CI/CD pipeline',
      description: 'Automate build and deploy via GitHub Actions.',
      status: 'todo',
      priority: 'medium',
      dueDate: new Date(now + 7 * day),
      project: website._id,
      assignee: bob._id,
      createdBy: admin._id,
    },
    {
      title: 'Fix navbar responsiveness bug',
      description: 'Navbar collapses incorrectly on tablet widths.',
      status: 'done',
      priority: 'low',
      dueDate: new Date(now - 2 * day),
      project: website._id,
      assignee: carol._id,
      createdBy: admin._id,
    },
    {
      title: 'Implement push notifications',
      description: 'Integrate FCM for iOS and Android.',
      status: 'todo',
      priority: 'high',
      dueDate: new Date(now - 1 * day),
      project: mobile._id,
      assignee: carol._id,
      createdBy: bob._id,
    },
    {
      title: 'Write onboarding flow tests',
      description: 'Cover the signup and first-run experience.',
      status: 'in_progress',
      priority: 'medium',
      dueDate: new Date(now + 5 * day),
      project: mobile._id,
      assignee: bob._id,
      createdBy: bob._id,
    },
  ]);

  console.log('Seed complete!');
  console.log('Login with: admin@taskflow.dev / Password123 (admin)');
  console.log('           bob@taskflow.dev / Password123 (user)');
  console.log('           carol@taskflow.dev / Password123 (user)');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
