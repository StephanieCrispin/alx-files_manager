import { v4 as uuidv4 } from 'uuid';
import { promises as fs } from 'fs';
import { ObjectID } from 'mongodb';
import Queue from 'bull';
import dbClient from '../utils/db';

const fileQueue = new Queue('fileQueue', 'redis://127.0.0.1:6379');

export default class FilesController {
  static async getShow(request, response) {
    const user = await FilesController.getUser(request);
    if (!user) {
      return response.status(401).json({ error: 'Unauthorized' });
    }
    const fileId = request.params.id;
    const files = dbClient.db.collection('files');
    const idObject = new ObjectID(fileId);
    const file = await files.findOne({ _id: idObject, userId: user._id });
    if (!file) {
      return response.status(404).json({ error: 'Not found' });
    }
    return response.status(200).json(file);
  }

  static async getIndex(req, res) {
    const user = await FilesController.getUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { parentId, page } = req.query;
    const pageNum = page || 0;
    const files = dbClient.db.collection('files');
    let query;
    if (!parentId) {
      query = { userId: user._id };
    } else {
      query = { userId: user._id, parentId: ObjectID(parentId) };
    }
    files
      .aggregate([
        { $match: query },
        { $sort: { _id: -1 } },
        {
          $facet: {
            metadata: [
              { $count: 'total' },
              { $addFields: { page: parseInt(pageNum, 10) } },
            ],
            data: [{ $skip: 20 * parseInt(pageNum, 10) }, { $limit: 20 }],
          },
        },
      ])
      .toArray((err, result) => {
        if (result) {
          const final = result[0].data.map((file) => {
            const tmpFile = {
              ...file,
              id: file._id,
            };
            delete tmpFile._id;
            delete tmpFile.localPath;
            return tmpFile;
          });
          // console.log(final);
          return req.status(200).json(final);
        }
        console.log('Error occured');
        return res.status(404).json({ error: 'Not found' });
      });
    return null;
  }

  static async postUpload(req, res) {
    const user = await FilesController.getUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
      const { name } = req.body;
      const { type } = req.body;
      const { parentId } = req.body;
      const { data } = req.body;
      const { isPublic } = req.body || false;
      if (!name) {
        return res.status(400).json({ error: 'Missing name' });
      }
      if (!type) {
        return res.status(400).json({ error: 'Missing type' });
      }
      if (type !== 'folder' && !data) {
        return res.status(400).json({ error: 'Missing data' });
      }

      const files = dbClient.db.collection('files');

      const idObject = ObjectID(parentId);

      const file = await files.findOne({ _id: idObject, userId: user._id });

      if (!file) {
        return res.status(400).json({ error: 'Parent not found' });
      }
      if (file.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }

      if (type === 'folder') {
        const result = await files.insertOne({
          userId: user._id,
          name,
          type,
          parentId: parentId || 0,
          isPublic,
        });

        res.status(201).json({
          id: result.insertedId,
          userId: user._id,
          name,
          type,
          isPublic,
          parentId: parentId || 0,
        });
      } else {
        const filePath = process.env.FOLDER_PATH || '/tmp/files_manager';
        const fileName = `${filePath}/${uuidv4()}`;
        const buff = Buffer.from(data, 'base64');
        try {
          await fs.mkdir(filePath);
        } catch (error) {
          // pass. Error raised when file already exists
        }
        await fs.writeFile(fileName, buff, 'utf-8');

        const newFile = await files.insertOne({
          userId: user._id,
          name,
          type,
          isPublic,
          parentId: parentId || 0,
          localPath: fileName,
        });
        res.status(201).json({
          id: newFile.insertedId,
          userId: user._id,
          name,
          type,
          isPublic,
          parentId: parentId || 0,
        });
        if (type === 'image') {
          fileQueue.add({
            userId: user._id,
            fileId: newFile.insertedId,
          });
        }
      }
    } catch (err) {
      res.status(200).json({ error: 'Unauthorized' });
    }
    return null;
  }

  static async putPublish(req, res) {
    const user = await FilesController.getUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { id } = req.params;
    const files = dbClient.db.collection('files');
    const idObject = new ObjectID(id);
    const newValue = { $set: { isPublic: true } };
    const options = { returnOriginal: false };
    files.findOneAndUpdate(
      { _id: idObject, userId: user._id },
      newValue,
      options,
      (err, file) => {
        if (!file.lastErrorObject.updatedExisting) {
          return res.status(404).json({ error: 'Not found' });
        }
        return res.status(200).json(file.value);
      },
    );
    return null;
  }

  static async putUnpublish(request, response) {
    const user = await FilesController.getUser(request);
    if (!user) {
      return response.status(401).json({ error: 'Unauthorized' });
    }
    const { id } = request.params;
    const files = dbClient.db.collection('files');
    const idObject = new ObjectID(id);
    const newValue = { $set: { isPublic: false } };
    const options = { returnOriginal: false };
    files.findOneAndUpdate(
      { _id: idObject, userId: user._id },
      newValue,
      options,
      (err, file) => {
        if (!file.lastErrorObject.updatedExisting) {
          return response.status(404).json({ error: 'Not found' });
        }
        return response.status(200).json(file.value);
      },
    );
    return null;
  }
}
