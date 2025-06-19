Dear Jonathan,

As you can see I have made this mini project to showcase some of my skills in Angular and Node with Apollo and GraphQL using PostgreSQL as the database.

<!-- Frontend -->

It's still far from perfect, especially the UI, but it uses some filtering, the date filters were a pain in the butt to make work, and the entity properties are not all there as I couldn't recall what else was in there I remember a whale but it gives you an idea this way as well I think.

I tried implementing PrimeNG as I remember you mentioned you're using that for the UI but I started the project using Angular 20 and PrimeNG is not compatible with this version yet, so I stuck with Bootstrap for simplicity.

I moved as much functionality as I could to the entity service, leaving the component for the presentation logic only. Tried commenting the code as much as it made sense to me.

I'm sure there's a better way of dynamic filtering with graphQL, but this is the first time I used it and I would love to learn more.

<!-- Backend -->

I tried to break up the backend into parts that made sense to me as you'll see I have the config db.js that is using the .env to get the credentials for the database, I have the resolvers and typeDefs in a separate folder and I have the entityService that takes care of the database queries.
