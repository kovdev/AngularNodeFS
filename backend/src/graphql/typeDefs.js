const { gql } = require('apollo-server');

const typeDefs = `
  type Entity {
  id: ID!
  type: String!
  date_of_birth: String!
  eye_color: String!
  created_at: String
  updated_at: String
  }

  input EntityFilters {
    types: [String!]
    eyeColors: [String!]
    dateFrom: String
    dateTo: String
  }

  type DeleteResult {
    success: Boolean!
    message: String!
  }

  type Query {
    entities(filters: EntityFilters): [Entity!]!
  }

  type Mutation {
    addEntity(type: String!, date_of_birth: String!, eye_color: String!): Entity!
    updateEntity(id: ID!, type: String!, date_of_birth: String!, eye_color: String!): Entity!
    deleteEntity(id: ID!): DeleteResult!
  }
`;

module.exports = typeDefs;
