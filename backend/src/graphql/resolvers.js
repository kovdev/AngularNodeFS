const entityService = require('../services/entityService');

const resolvers = {
  Query: {
    entities: (_, { filters }) => entityService.getAllEntities(filters),
  },
  Mutation: {
    addEntity: (_, { type, date_of_birth, eye_color }) =>
      entityService.addEntity(type, date_of_birth, eye_color),
    updateEntity: (_, { id, type, date_of_birth, eye_color }) =>
      entityService.updateEntity(id, type, date_of_birth, eye_color),
    deleteEntity: async (_, { id }) => {
      const deletedEntity = await entityService.deleteEntity(id);
      const success = !!deletedEntity; // Convert to boolean
      return {
        success,
        message: success ? 'Entity deleted successfully.' : 'Entity not found.',
      };
    },
  },
};

module.exports = resolvers;
