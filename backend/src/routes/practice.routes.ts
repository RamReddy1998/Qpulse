import { Router } from 'express';
import { PracticeController } from '../controllers/practice.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();

router.use(authenticate, authorize('LEARNER'));

router.get('/questions/:certificationId', PracticeController.getQuestions);
router.post('/submit', PracticeController.submitAnswer);
router.get('/explanation/:questionId', PracticeController.getExplanation);
router.get('/topics/:certificationId', PracticeController.getTopics);

export default router;
