import { MongoClient } from "mongodb";

const HOST = process.env.DB_HOST || "localhost";
const PORT = process.env.DB_PORT || 27017;
const DB_DATABASE = process.env.DB_DATABASE || "files_manager";

const url = `mongodb://${HOST}/${PORT}`;

class DBCliet {
  constructor() {
    this.client = new MongoClient(url, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    });

    this.client
      .connect()
      .then(() => (this.db = this.client.db(`${DB_DATABASE}`)))
      .catch((err) => console.log(err));
  }

  isAlive() {
    return this.client.isConnected();
  }

  async nbUsers() {
    const users = this.db.collection("users");
    const totalDocuments = await users.countDocuments();
    return totalDocuments;
  }

  async nbFiles() {
    const files = this.db.collection("files");
    const totalFiles = await files.countDocuments();
    return totalFiles;
  }
}

const dbClient = new DBCliet();
module.exports = dbClient;
