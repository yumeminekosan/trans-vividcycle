const fastify = require('fastify')({ logger: true });
const neo4j = require('neo4j-driver');

// Neo4j connection
const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(
    process.env.NEO4J_USER,
    process.env.NEO4J_PASSWORD
  )
);

// CORS
fastify.register(require('@fastify/cors'), {
  origin: true,
  credentials: true
});

// Health check
fastify.get('/api/health', async () => {
  return { status: 'ok', time: new Date().toISOString() };
});

// Persona API
fastify.post('/api/persona', async (request) => {
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

fastify.get('/api/persona/:id', async (request) => {
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

fastify.get('/api/personas', async () => {
  const session = driver.session();
  try {
    const result = await session.run('MATCH (p:Persona) RETURN p LIMIT 50');
    return result.records.map(r => r.get('p').properties);
  } finally {
    await session.close();
  }
});

// Relation API
fastify.post('/api/relation', async (request) => {
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
fastify.get('/api/graph/:personaId', async (request) => {
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

// Export for Vercel
module.exports = async (req, res) => {
  await fastify.ready();
  fastify.server.emit('request', req, res);
};
