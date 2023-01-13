const {
  GraphQLObjectType,
  GraphQLID,
  GraphQLString,
  GraphQLInt,
  GraphQLSchema,
  GraphQLList,
  GraphQLNonNull,
} = require("graphql");
const find = require("lodash/find");

const outerApiService = require("../services/outer-api");

const CompanyType = new GraphQLObjectType({
  name: "Company",
  fields: () => ({
    id: { type: GraphQLID },
    name: { type: GraphQLString },
    description: { type: GraphQLString },
    users: {
      type: new GraphQLList(UserType),
      resolve: async (parentValue, args) => {
        const { data: users } = await outerApiService.get(
          `/companies/${parentValue.id}/users`
        );
        return users;
      },
    },
  }),
});

const UserType = new GraphQLObjectType({
  name: "User",
  fields: () => ({
    id: { type: GraphQLID },
    firstName: { type: GraphQLString },
    age: { type: GraphQLInt },
    company: {
      type: CompanyType,
      resolve: async (parentValue, args) => {
        const { data: company } = await outerApiService.get(
          `/companies/${parentValue.companyId}`
        );
        return company;
      },
    },
  }),
});

const RootQueryType = new GraphQLObjectType({
  name: "RootQueryType",
  fields: {
    users: {
      type: new GraphQLList(UserType),
      resolve: async (parentValue, args) => {
        const { data: users } = await outerApiService.get("/users");
        return users;
      },
    },
    user: {
      type: UserType,
      args: { id: { type: GraphQLID } },
      resolve: async (parentValue, args) => {
        const { data: user } = await outerApiService.get(`/users/${args.id}`);
        return user;
      },
    },
    companies: {
      type: new GraphQLList(CompanyType),
      resolve: async (parentValue, args) => {
        const { data: companies } = await outerApiService.get("/companies");
        return companies;
      },
    },
    company: {
      type: CompanyType,
      args: { id: { type: GraphQLID } },
      resolve: async (parentValue, args) => {
        const { data: company } = await outerApiService.get(
          `/companies/${args.id}`
        );
        return company;
      },
    },
  },
});

const mutation = new GraphQLObjectType({
  name: "Mutation",
  fields: () => ({
    addUser: {
      type: UserType,
      args: {
        firstName: { type: new GraphQLNonNull(GraphQLString) },
        age: { type: new GraphQLNonNull(GraphQLInt) },
        companyId: { type: GraphQLID },
      },
      resolve: async (parentValue, { firstName, age, companyId }) => {
        const { data: createdUser } = await outerApiService.post("/users", {
          firstName,
          age,
          companyId,
        });
        return createdUser;
      },
    },
    deleteUser: {
      type: UserType,
      args: {
        id: { type: GraphQLID },
      },
      resolve: async (parentValue, { id }) => {
        return await outerApiService.delete(`/users/${id}`);
      },
    },
    updateUser: {
      type: UserType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
        firstName: { type: GraphQLString },
        age: { type: GraphQLInt },
        companyId: { type: GraphQLID },
      },
      resolve: async (parentValue, args) => {
        const { data: user } = await outerApiService.get(`/users/${args.id}`);
        if (!user) throw new Error(`Not found user with id is ${id}`);

        for (key of Object.keys(args)) {
          user[key] = args[key];
        }

        const { data: updatedUser } = await outerApiService.put(
          `/users/${args.id}`,
          user
        );
        return updatedUser;
      },
    },
  }),
});

module.exports = new GraphQLSchema({
  query: RootQueryType,
  mutation,
});
