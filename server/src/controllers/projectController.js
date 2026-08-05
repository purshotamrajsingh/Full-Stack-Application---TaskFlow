const Project = require('../models/Project');

async function listProjects(req, res) {
  const isAdmin = req.user.role === 'admin';
  const filter = isAdmin
    ? {}
    : { $or: [{ owner: req.user._id }, { members: req.user._id }] };
  const projects = await Project.find(filter)
    .populate('owner', 'name email')
    .populate('members', 'name email')
    .sort({ createdAt: -1 });
  res.json(projects);
}

async function createProject(req, res) {
  const { name, description, members } = req.body;
  if (!name) return res.status(400).json({ message: 'Project name is required' });
  const project = await Project.create({
    name,
    description,
    owner: req.user._id,
    members: members || [],
  });
  res.status(201).json(project);
}

async function getProject(req, res) {
  const project = await Project.findById(req.params.id)
    .populate('owner', 'name email')
    .populate('members', 'name email');
  if (!project) return res.status(404).json({ message: 'Project not found' });
  res.json(project);
}

async function updateProject(req, res) {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ message: 'Project not found' });
  if (req.user.role !== 'admin' && String(project.owner) !== String(req.user._id)) {
    return res.status(403).json({ message: 'Only the owner or an admin can update this project' });
  }
  Object.assign(project, req.body);
  await project.save();
  res.json(project);
}

async function deleteProject(req, res) {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ message: 'Project not found' });
  if (req.user.role !== 'admin' && String(project.owner) !== String(req.user._id)) {
    return res.status(403).json({ message: 'Only the owner or an admin can delete this project' });
  }
  await project.deleteOne();
  res.json({ message: 'Project deleted' });
}

module.exports = { listProjects, createProject, getProject, updateProject, deleteProject };
