import { Router } from 'express';
import usersRouter  from './users';
import ordersRouter from './orders';

const router = Router();

router.use('/users',  usersRouter);
router.use('/orders', ordersRouter);

export default router;
