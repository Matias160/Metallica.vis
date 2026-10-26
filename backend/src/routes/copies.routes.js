import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { claimCopy, dubCopy, getCollection, getCopy, getLineage, playCopy, removeCopy } from '../controllers/copies.controller.js';

const router = Router();
router.use(requireAuth);
router.get('/collection', getCollection);
router.post('/copies/claim', claimCopy);
router.get('/copies/:id', getCopy);
router.delete('/copies/:id', removeCopy);
router.post('/copies/:id/play', playCopy);
router.post('/copies/:id/dub', dubCopy);
router.get('/copies/:id/lineage', getLineage);

export default router;
