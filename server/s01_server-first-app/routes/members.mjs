import express from 'express';
import memberResumeHandler from '../member-resume.mjs';

const router = express.Router();

router.get('/member-resume', memberResumeHandler);

export default router;