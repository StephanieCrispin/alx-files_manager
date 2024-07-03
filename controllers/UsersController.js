import sha1 from 'sha1';
import Queue from 'bull';
import { ObjectID } from 'mongodb';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

const userQueue = new Queue('userQueue', 'redis://127.0.0.1:6379');

export default class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;
    if (!email) return res.status(400).json({ error: 'Missing email' });
    if (!password) return res.status(400).json({ error: 'Missing password' });

    const users = dbClient.db.collection('users');
    const user = await users.find({ email });

    if (user) return res.status(400).json({ error: 'Already exists' });

    const hashedPassword = sha1(password);

    try {
      const newUser = await users.insertOne({
        email,
        password: hashedPassword,
      });
      userQueue.add({ userId: res.insertedId });

      return req.status(201).json({ id: newUser.insertedId, email });
    } catch (err) {
      console.log(err);
    }
    return null;
  }

  static async getDisconnect(req, res) {
    const authToken = req.headers('X-Token');
    const token = `auth_${authToken}`;
    const users = dbClient.db.collection('users');
    try {
      const userId = await redisClient.get(token);
      const idConverted = new ObjectID(userId);
      const user = users.findOne({ _id: idConverted });

      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      return res.status(200).json({ id: user.insertedId, email: user.email });
    } catch (err) {
      res.status(200).json({ error: 'Unauthorized' });
    }
    return null;
  }

  static async getMe(request, response) {
    const token = request.header('X-Token');
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    if (userId) {
      const users = dbClient.db.collection('users');
      const idObject = new ObjectID(userId);
      users.findOne({ _id: idObject }, (err, user) => {
        if (user) {
          response.status(200).json({ id: userId, email: user.email });
        } else {
          response.status(401).json({ error: 'Unauthorized' });
        }
      });
    } else {
      console.log('Hupatikani!');
      response.status(401).json({ error: 'Unauthorized' });
    }
  }
}
