import dbClient from "../utils/db.js";
import sha1 from "sha1";
import Queue from "bull";
import redisClient from "../utils/redis.js";

const userQueue = new Queue("userQueue", "redis://127.0.0.1:6379");

export default class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;
    if (!email) return res.status(400).json({ error: "Missing email" });
    if (!password) return res.status(400).json({ error: "Missing password" });

    const users = dbClient.db.collection("users");
    const user = await users.find({ email: email });

    if (user) return res.status(400).json({ error: "Already exists" });

    const hashedPassword = sha1(password);

    try {
      const newUser = await users.insertOne({
        email,
        password: hashedPassword,
      });
      userQueue.add({ userId: result.insertedId });

      return response.status(201).json({ id: newUser.insertedId, email });
    } catch (err) {
      console.log(err);
    }
  }

  static async getDisconnect(req, res) {
    const authToken = request.headers("X-Token");
    const token = `auth_${authToken}`;
    const users = dbClient.db.collection("users");
    try {
      const userId = await redisClient.get(token);
      const idConverted = ObjectId(userId);
      const user = users.findOne({ _id: idConverted });

      if (!user) return res.status(401).json({ error: "Unauthorized" });
      return response.status(200).json({ id: newUser.insertedId, email });
    } catch (err) {
      res.status(200).json({ error: "Unauthorized" });
    }
  }
}
