const fastify = require('fastify')({ logger: true });
const neo4j = require('neo4j-driver');

// Neo4j connection
const driver = neo4j.driver(
  process.env.NEO4J_URI || 'bolt://localhost:7687',
  neo4j.auth.basic(
    process.env.NEO4J_USER || 'neo4j',
    process.env.NEO4J_PASSWORD || 'password'
  )
);

// CORS
fastify.register(require('@fastify/cors'), {
  origin: true
});

// Health check
fastify.get('/health', async () => {
  return { status: 'ok' };
});

// Persona API
fastify.post('/persona', async (request, reply) => {
  const { name, bio, pronouns, tags } = request.body;
  const session = driver.session();
  try {
    const result = await session.run(
      `CREATE (p:Persona {
        id: randomUUID(),
        name: $name,
        bio: $bio,
        pronouns: $pronouns,
        tags: $tags,
        created_at: datetime()
      }) RETURN p`,
      { name, bio, pronouns, tags: tags || [] }
    );
    return result.records[0].get('p').properties;
  } finally {
    await session.close();
  }
});

fastify.get('/persona/:id', async (request) => {
  const session = driver.session();
  try {
    const result = await session.run(
      'MATCH (p:Persona {id: $id}) RETURN p',
      { id: request.params.id }
    );
    if (result.records.length === 0) {
      throw new Error('Persona not found');
    }
    return result.records[0].get('p').properties;
  } finally {
    await session.close();
  }
});

// Relation API
fastify.post('/relation', async (request) => {
  const { from, to, type, visibility, weight, description } = request.body;
  const session = driver.session();
  try {
    const result = await session.run(
      `MATCH (a:Persona {id: $from}), (b:Persona {id: $to})
       CREATE (a)-[r:RELATION {
         id: randomUUID(),
         type: $type,
         visibility: $visibility,
         weight: $weight,
         description: $description,
         created_at: datetime()
       }]->(b)
       RETURN r`,
      { from, to, type, visibility: visibility || 'private', weight: weight || 0.5, description: description || '' }
    );
    return result.records[0].get('r').properties;
  } finally {
    await session.close();
  }
});

// Graph API
fastify.get('/graph/:personaId', async (request) => {
  const session = driver.session();
  try {
    const result = await session.run(
      `MATCH (p:Persona {id: $id})-[r:RELATION]-(q:Persona)
       RETURN p, r, q`,
      { id: request.params.personaId }
    );
    const nodes = new Map();
    const edges = [];
    result.records.forEach(record => {
      const p = record.get('p').properties;
      const q = record.get('q').properties;
      const r = record.get('r').properties;
      nodes.set(p.id, p);
      nodes.set(q.id, q);
      edges.push({ ...r, from: p.id, to: q.id });
    });
    return {
      nodes: Array.from(nodes.values()),
      edges
    };
  } finally {
    await session.close();
  }
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log('Server running on http://localhost:3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
