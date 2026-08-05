const Task = require('../models/Task');
const Project = require('../models/Project');

// GET /api/tasks?search=&status=&priority=&project=&sortBy=&order=&page=&limit=
async function listTasks(req, res) {
  const {
    search,
    status,
    priority,
    project,
    assignee,
    sortBy = 'createdAt',
    order = 'desc',
    page = 1,
    limit = 20,
  } = req.query;

  const filter = {};

  // Non-admins only see tasks from projects they own or are members of
  if (req.user.role !== 'admin') {
    const projects = await Project.find({
      $or: [{ owner: req.user._id }, { members: req.user._id }],
    }).select('_id');
    filter.project = { $in: projects.map((p) => p._id) };
  }

  if (project) filter.project = project;
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (assignee) filter.assignee = assignee;
  if (search) filter.$text = { $search: search };

  const sortOrder = order === 'asc' ? 1 : -1;
  const skip = (Number(page) - 1) * Number(limit);

  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .populate('assignee', 'name email')
      .populate('project', 'name')
      .populate('createdBy', 'name email')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(Number(limit)),
    Task.countDocuments(filter),
  ]);

  res.json({ tasks, total, page: Number(page), pages: Math.ceil(total / Number(limit)) || 1 });
}

async function createTask(req, res) {
  const { title, description, status, priority, dueDate, project, assignee } = req.body;
  if (!title || !project) {
    return res.status(400).json({ message: 'Title and project are required' });
  }
  const task = await Task.create({
    title,
    description,
    status,
    priority,
    dueDate,
    project,
    assignee,
    createdBy: req.user._id,
  });
  res.status(201).json(task);
}

async function getTask(req, res) {
  const task = await Task.findById(req.params.id)
    .populate('assignee', 'name email')
    .populate('project', 'name')
    .populate('createdBy', 'name email');
  if (!task) return res.status(404).json({ message: 'Task not found' });
  res.json(task);
}

async function updateTask(req, res) {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ message: 'Task not found' });
  Object.assign(task, req.body);
  await task.save();
  res.json(task);
}

async function deleteTask(req, res) {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ message: 'Task not found' });
  await task.deleteOne();
  res.json({ message: 'Task deleted' });
}

// GET /api/tasks/dashboard/stats
async function dashboardStats(req, res) {
  const filter = {};
  if (req.user.role !== 'admin') {
    const projects = await Project.find({
      $or: [{ owner: req.user._id }, { members: req.user._id }],
    }).select('_id');
    filter.project = { $in: projects.map((p) => p._id) };
  }

  const [byStatus, byPriority, total, overdue] = await Promise.all([
    Task.aggregate([{ $match: filter }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Task.aggregate([{ $match: filter }, { $group: { _id: '$priority', count: { $sum: 1 } } }]),
    Task.countDocuments(filter),
    Task.countDocuments({ ...filter, dueDate: { $lt: new Date() }, status: { $ne: 'done' } }),
  ]);

  res.json({
    total,
    overdue,
    byStatus: byStatus.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
    byPriority: byPriority.reduce((acc, p) => ({ ...acc, [p._id]: p.count }), {}),
  });
}

module.exports = {
  listTasks,
  createTask,
  getTask,
  updateTask,
  deleteTask,
  dashboardStats,
};
