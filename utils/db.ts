import mongoose from "mongoose";

import envConfig from "../config/env";

const env = envConfig.getAll();

export default mongoose.connect(env.mongodb_URI!, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
});
