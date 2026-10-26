import { Router } from 'express';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';
import { getStats, listUsers, toggleUserStatus, updateUserRole } from '../controllers/admin.controller.js';

const router = Router();
router.use(requireAuth);
router.use(requireRole('admin'));

router.get('/users', listUsers);
router.post('/users/:id/role', updateUserRole);
router.patch('/users/:id/status', toggleUserStatus);
router.get('/stats', getStats);

export default router;
