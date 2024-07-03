import dbClient from '../utils/db';
import redisClient from '../utils/redis';

export default class AppController {
  static async getStatus(req, res) {
    res
      .status(200)
      .json({ redis: redisClient.isAlive(), db: dbClient.isAlive() });
  }

  static async getStats(req, res) {
    const users = await dbClient.getUsers();
    const files = await dbClient.getStats();

    res.status(200).json({ users, files });
  }
}
