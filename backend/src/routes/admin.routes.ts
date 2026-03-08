import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();

router.use(authenticate, authorize('ADMIN'));

// Dashboard
router.get('/dashboard', AdminController.getDashboard);

// Learner management
router.get('/learners', AdminController.getLearners);
router.get('/learners/:userId/analytics', AdminController.getLearnerAnalytics);

// Batch management
router.post('/batches', AdminController.createBatch);
router.get('/batches', AdminController.getBatches);
router.get('/batches/:batchId', AdminController.getBatchDetails);
router.get('/batches/:batchId/analytics', AdminController.getBatchParticipantsAnalytics);
router.post('/batches/:batchId/participants', AdminController.addParticipant);
router.delete('/batches/:batchId/participants/:userId', AdminController.removeParticipant);

// Weakness detection
router.get('/weakness/questions', AdminController.getWeaknessQuestions);

// Question upload
router.post('/questions/:certificationId/upload', AdminController.uploadQuestions);

export default router;
