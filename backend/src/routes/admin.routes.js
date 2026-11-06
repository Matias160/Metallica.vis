// Endpoints restringidos a la administración.
import { Router } from 'express';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';
import {
  deleteTrack,
  getStats,
  getUserPublicProfile,
  listUsers,
  toggleTrackFeatured,
  toggleUserLabelVerification,
  toggleUserStatus,
  updateUserRole
} from '../controllers/admin.controller.js';

const router = Router();
router.use(requireAuth);
router.use(requireRole('admin'));

router.get('/users', listUsers);
router.get('/users/:id/profile', getUserPublicProfile);
router.post('/users/:id/role', updateUserRole);
router.post('/users/:id/verify-label', toggleUserLabelVerification);
router.patch('/users/:id/status', toggleUserStatus);
router.patch('/tracks/:id/featured', toggleTrackFeatured);
router.delete('/tracks/:id', deleteTrack);
router.get('/stats', getStats);

export default router;
