import sha1 from "sha1";
import dbClient from "../utils/db.js";
import { v4 as uuidv4 } from "uuid";
import redisClient from "../utils/redis.js";

export default class AuthController {
  static async getConnect(req, res) {
    const authData = request.headers("Authorization");
    let userEmail = authData.split[1];
    const buff = Buffer.from(userEmail, "base64");
    userEmail = buff.toString("ascii");
    const data = userEmail.split(":");
    if (data.length !== 2) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const unhashedPassword = sha1(data[1]);
    const users = dbClient.db.collection("users");
    try {
      const user = users.findOne({
        email: data[0],
        password: unhashedPassword,
      });
      if (!user) return res.status(401).json({ error: "Unauthorized" });

      const token = uuidv4();
      const key = `auth_${token}`;
      await redisClient.set(key, user._id.toString(), 60 * 60 * 24);
      res.status(200).json({ token });
    } catch (err) {
      res.status(200).json({ error: "Unauthorized" });
    }
  }

  static async getDisconnect(req, res) {
    const authToken = request.headers("X-Token");
    const token = `auth_${authToken}`;

    try {
      const user = await redisClient.get(token);
      if (!user) return res.status(401).json({ error: "Unauthorized" });
      await redisClient.del(token);
      res.status(204).json({});
    } catch (err) {
      res.status(200).json({ error: "Unauthorized" });
    }
  }
  
  static async getDisconnect(req, res) {
    const authToken = request.headers("X-Token");
    const token = `auth_${authToken}`;

    try {
      const user = await redisClient.get(token);
      if (!user) return res.status(401).json({ error: "Unauthorized" });
      await redisClient.del(token);
      res.status(204).json({});
    } catch (err) {
      res.status(200).json({ error: "Unauthorized" });
    }
  }
}
