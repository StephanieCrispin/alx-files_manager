import { Router } from "express";
import AppController from "../controllers/AppController.js";
import UsersController from "../controllers/UsersController.js";
import AuthController from "../controllers/AuthController.js";

const router = Router();
router.get("/status", AppController.getStatus);
router.get("/stats", AppController.getStats);
router.post("/users", UsersController.postNew);
router.get("/conect", AuthController.getConnect);
router.get("/disconnect", AuthController.getDisconect);
router.get("/users", UsersController.getMe);
