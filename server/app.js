import * as dotenv from "dotenv";
dotenv.config();

import express from "express";
import http from "http";
import cors from "cors";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";

import typeDefs from "./schema/schema.js";
import resolvers from "./resolver/resolver.js";
import mongoDataMethods from "./data/db.js";

const PORT = 4000;
const app = express();
const httpServer = http.createServer(app);

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL, {});
  } catch (error) {
    console.log(error.message);
    process.exit(1);
  }
};

await connectDB();

const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});

await apolloServer.start();

app.use(cors());
app.use(bodyParser.json());
app.use(
  "/graphql",
  expressMiddleware(apolloServer, {
    context: () => ({ mongoDataMethods }),
  })
);

httpServer.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
