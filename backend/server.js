const fastify = require('fastify')({ logger: true });
const neo4j = require('neo4j-driver');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Neo4j connection
const driver = neo4j.driver(
  process.env.NEO4J_URI || 'bolt://localhost:7687',
  neo4j.auth.basic(
    process.env.NEO4J_USER || 'neo4j',
    process.env.NEO4J_PASSWORD || 'password'
  )
);

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'trans-vividcycle-secret-key';

// CORS
fastify.register(require('@fastify/cors'), {
  origin: true
});

// Auth middleware
const authenticate = async (request, reply) => {
  try {
    const token = request.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      throw new Error('No token provided');
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    request.user = decoded;
  } catch (err) {
    reply.code(401).send({ error: 'Unauthorized' });
  }
};

// Health check
fastify.get('/health', async () => {
  return { status: 'ok' };
});

// Auth API
fastify.post('/auth/register', async (request) => {
  const { username, password, email } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const session = driver.session();
  try {
    const result = await session.run(
      `CREATE (u:User {
        id: randomUUID(),
        username: $username,
        email: $email,
        password: $password,
        created_at: datetime()
      }) RETURN u`,
      { username, email, password: hashedPassword }
    );
    const user = result.records[0].get('u').properties;
    delete user.password;
    return user;
  } finally {
    await session.close();
  }
});

fastify.post('/auth/login', async (request, reply) => {
  const { username, password } = request.body;
  
  const session = driver.session();
  try {
    const result = await session.run(
      'MATCH (u:User {username: $username}) RETURN u',
      { username }
    );
    if (result.records.length === 0) {
      reply.code(401);
      return { error: 'Invalid credentials' };
    }
    
    const user = result.records[0].get('u').properties;
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      reply.code(401);
      return { error: 'Invalid credentials' };
    }
    
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    delete user.password;
    return { user, token };
  } finally {
    await session.close();
  }
});

// Persona API (protected)
fastify.post('/persona', { preHandler: authenticate }, async (request) => {
  const { name, bio, pronouns, tags } = request.body;
  const userId = request.user.userId;
  
  const session = driver.session();
  try {
    const result = await session.run(
      `MATCH (u:User {id: $userId})
       CREATE (p:Persona {
         id: randomUUID(),
         name: $name,
         bio: $bio,
         pronouns: $pronouns,
         tags: $tags,
         created_at: datetime()
       })
       CREATE (u)-[:OWNS]->(p)
       RETURN p`,
      { userId, name, bio, pronouns, tags: tags || [] }
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

fastify.get('/my/personas', { preHandler: authenticate }, async (request) => {
  const userId = request.user.userId;
  
  const session = driver.session();
  try {
    const result = await session.run(
      `MATCH (u:User {id: $userId})-[:OWNS]->(p:Persona)
       RETURN p`,
      { userId }
    );
    return result.records.map(r => r.get('p').properties);
  } finally {
    await session.close();
  }
});

// Relation API (protected)
fastify.post('/relation', { preHandler: authenticate }, async (request) => {
  const { from, to, type, visibility, weight, description } = request.body;
  const userId = request.user.userId;
  
  const session = driver.session();
  try {
    // Check if user owns the source persona
    const checkResult = await session.run(
      `MATCH (u:User {id: $userId})-[:OWNS]->(a:Persona {id: $from})
       RETURN a`,
      { userId, from }
    );
    if (checkResult.records.length === 0) {
      throw new Error('You can only create relations from your own personas');
    }
    
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
