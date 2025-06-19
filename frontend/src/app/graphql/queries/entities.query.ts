import { gql } from 'apollo-angular';

export const GET_ENTITIES = gql`
  query GetEntities($filters: EntityFilters) {
    entities(filters: $filters) {
      id
      type
      date_of_birth
      eye_color
    }
  }
`;

export const ADD_ENTITY = gql`
  mutation AddEntity(
    $type: String!
    $date_of_birth: String!
    $eye_color: String!
  ) {
    addEntity(
      type: $type
      date_of_birth: $date_of_birth
      eye_color: $eye_color
    ) {
      id
      type
      date_of_birth
      eye_color
    }
  }
`;

export const UPDATE_ENTITY = gql`
  mutation UpdateEntity(
    $id: ID!
    $type: String!
    $date_of_birth: String!
    $eye_color: String!
  ) {
    updateEntity(
      id: $id
      type: $type
      date_of_birth: $date_of_birth
      eye_color: $eye_color
    ) {
      id
      type
      date_of_birth
      eye_color
    }
  }
`;

export const DELETE_ENTITY = gql`
  mutation DeleteEntity($id: ID!) {
    deleteEntity(id: $id) {
      success
      message
    }
  }
`;
