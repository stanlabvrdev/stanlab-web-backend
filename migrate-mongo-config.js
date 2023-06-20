const  Env = require("./dist/config/env").default;
const env = Env.getAll()

const config = {
  mongodb: {
    url: env.mongodb_URI,

    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
  migrationsDir: "migrations",
  // The mongodb collection where the applied changes are stored. Only edit this when really necessary.
  changelogCollectionName: "changelog",
  // The file extension to create migrations and search for in migration dir
  migrationFileExtension: ".ts",
  useFileHash: false,
  moduleSystem: "commonjs",
};

module.exports = config;
