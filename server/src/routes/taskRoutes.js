const express = require('express');
const {
  listTasks,
  createTask,
  getTask,
  updateTask,
  deleteTask,
  dashboardStats,
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.get('/dashboard/stats', dashboardStats);
router.route('/').get(listTasks).post(createTask);
router.route('/:id').get(getTask).put(updateTask).delete(deleteTask);

module.exports = router;
