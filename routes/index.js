import { Router } from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';
import FilesController from '../controllers/FilesController';

const router = Router();
router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);
router.post('/users', UsersController.postNew);
router.get('/conect', AuthController.getConnect);
router.get('/disconnect', AuthController.getDisconnect);
router.get('/users', UsersController.getMe);
router.get('/files/:id', FilesController.postUpload);
router.get('/files', FilesController.postUpload);
router.put('/files/:id/publish', FilesController.putPublish);
router.put('/files/:id/publish', FilesController.putUnpublish);
router.get('/files/:id/data', FilesController.getFile);
