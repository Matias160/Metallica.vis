// Endpoints del catálogo y sus pistas musicales.
import { Router } from 'express';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';
import { 
  createArtist, 
  createPressing, 
  createTrack, 
  deleteTrack, 
  getTrack, 
  listArtists, 
  listPressings, 
  listTracks, 
  updateArtist, 
  updateTrack, 
  verifyArtist 
} from '../controllers/catalog.controller.js';

const router = Router();
router.use(requireAuth);

router.get('/artists', listArtists);
router.post('/artists', requireRole('artist', 'admin'), createArtist);
router.put('/artists/:id', requireRole('artist', 'admin'), updateArtist);
router.post('/artists/:id/verify', requireRole('admin'), verifyArtist);

router.get('/tracks', listTracks);
router.get('/tracks/:id', getTrack);
router.post('/tracks', requireRole('artist', 'admin'), createTrack);
router.put('/tracks/:id', requireRole('artist', 'admin'), updateTrack);
router.delete('/tracks/:id', requireRole('artist', 'admin'), deleteTrack);

router.get('/pressings', listPressings);
router.post('/pressings', requireRole('artist', 'admin'), createPressing);

export default router;
