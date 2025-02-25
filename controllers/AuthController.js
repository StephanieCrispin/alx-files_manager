import sha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

export default class AuthController {
  static async getConnect(req, res) {
    const authData = req.headers('Authorization');
    let userEmail = authData.split[1];
    const buff = Buffer.from(userEmail, 'base64');
    userEmail = buff.toString('ascii');
    const data = userEmail.split(':');
    if (data.length !== 2) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const unhashedPassword = sha1(data[1]);
    const users = dbClient.db.collection('users');
    try {
      const user = users.findOne({
        email: data[0],
        password: unhashedPassword,
      });
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      const token = uuidv4();
      const key = `auth_${token}`;
      await redisClient.set(key, user._id.toString(), 60 * 60 * 24);
      res.status(200).json({ token });
    } catch (err) {
      res.status(200).json({ error: 'Unauthorized' });
    }
    return null;
  }

  static async getDisconnect(req, res) {
    const authToken = req.headers('X-Token');
    const token = `auth_${authToken}`;

    try {
      const user = await redisClient.get(token);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      await redisClient.del(token);
      res.status(204).json({});
    } catch (err) {
      res.status(200).json({ error: 'Unauthorized' });
    }
    return null;
  }
}
