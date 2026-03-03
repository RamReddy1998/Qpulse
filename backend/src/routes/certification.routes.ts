import { Router } from 'express';
import { CertificationController } from '../controllers/certification.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.get('/', authenticate, CertificationController.getAll);
router.get('/counts', authenticate, CertificationController.getQuestionCounts);
router.get('/:id', authenticate, CertificationController.getById);

export default router;
