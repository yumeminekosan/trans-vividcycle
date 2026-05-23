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
  origin: true,
  credentials: true
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
  const { name, bio, pronouns, tags, avatar, links } = request.body;
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
         avatar: $avatar,
         links: $links,
         created_at: datetime()
       })
       CREATE (u)-[:OWNS]->(p)
       RETURN p`,
      { userId, name, bio, pronouns, tags: tags || [], avatar: avatar || '', links: links || [] }
    );
    return result.records[0].get('p').properties;
  } finally {
    await session.close();
  }
});

fastify.patch('/persona/:id', { preHandler: authenticate }, async (request, reply) => {
  const { name, bio, pronouns, tags, avatar, links } = request.body;
  const userId = request.user.userId;
  const personaId = request.params.id;
  
  const session = driver.session();
  try {
    // Check ownership
    const checkResult = await session.run(
      `MATCH (u:User {id: $userId})-[:OWNS]->(p:Persona {id: $personaId})
       RETURN p`,
      { userId, personaId }
    );
    if (checkResult.records.length === 0) {
      reply.code(403);
      return { error: 'You can only update your own personas' };
    }
    
    const result = await session.run(
      `MATCH (p:Persona {id: $personaId})
       SET p.name = COALESCE($name, p.name),
           p.bio = COALESCE($bio, p.bio),
           p.pronouns = COALESCE($pronouns, p.pronouns),
           p.tags = COALESCE($tags, p.tags),
           p.avatar = COALESCE($avatar, p.avatar),
           p.links = COALESCE($links, p.links),
           p.updated_at = datetime()
       RETURN p`,
      { personaId, name, bio, pronouns, tags, avatar, links }
    );
    return result.records[0].get('p').properties;
  } finally {
    await session.close();
  }
});

fastify.delete('/persona/:id', { preHandler: authenticate }, async (request, reply) => {
  const userId = request.user.userId;
  const personaId = request.params.id;
  
  const session = driver.session();
  try {
    // Check ownership
    const checkResult = await session.run(
      `MATCH (u:User {id: $userId})-[:OWNS]->(p:Persona {id: $personaId})
       RETURN p`,
      { userId, personaId }
    );
    if (checkResult.records.length === 0) {
      reply.code(403);
      return { error: 'You can only delete your own personas' };
    }
    
    // Delete relations first, then persona
    await session.run(
      `MATCH (p:Persona {id: $personaId})
       OPTIONAL MATCH (p)-[r:RELATION]-()
       DELETE r`,
      { personaId }
    );
    
    await session.run(
      `MATCH (p:Persona {id: $personaId})
       DELETE p`,
      { personaId }
    );
    
    return { status: 'deleted' };
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
fastify.post('/relation', { preHandler: authenticate }, async (request, reply) => {
  const { from, to, type, visibility, weight, description, bidirectional } = request.body;
  const userId = request.user.userId;
  
  const validTypes = [
    'friend', 'emotionally_safe_person', 'co_creator', 'mentor', 
    'former_partner', 'family', 'colleague', 'romantic_partner', 
    'acquaintance', 'custom'
  ];
  
  if (!validTypes.includes(type)) {
    reply.code(400);
    return { error: 'Invalid relation type' };
  }
  
  const session = driver.session();
  try {
    // Check if user owns the source persona
    const checkResult = await session.run(
      `MATCH (u:User {id: $userId})-[:OWNS]->(a:Persona {id: $from})
       RETURN a`,
      { userId, from }
    );
    if (checkResult.records.length === 0) {
      reply.code(403);
      return { error: 'You can only create relations from your own personas' };
    }
    
    // Check if relation already exists
    const existingResult = await session.run(
      `MATCH (a:Persona {id: $from})-[r:RELATION]->(b:Persona {id: $to})
       RETURN r`,
      { from, to }
    );
    if (existingResult.records.length > 0) {
      reply.code(409);
      return { error: 'Relation already exists' };
    }
    
    const result = await session.run(
      `MATCH (a:Persona {id: $from}), (b:Persona {id: $to})
       CREATE (a)-[r:RELATION {
         id: randomUUID(),
         type: $type,
         visibility: $visibility,
         weight: $weight,
         description: $description,
         bidirectional: $bidirectional,
         status: CASE WHEN $bidirectional THEN 'pending' ELSE 'active' END,
         created_at: datetime()
       }]->(b)
       RETURN r`,
      { from, to, type, visibility: visibility || 'private', weight: weight || 0.5, description: description || '', bidirectional: bidirectional || false }
    );
    return result.records[0].get('r').properties;
  } finally {
    await session.close();
  }
});

fastify.patch('/relation/:id/confirm', { preHandler: authenticate }, async (request, reply) => {
  const userId = request.user.userId;
  const relationId = request.params.id;
  
  const session = driver.session();
  try {
    // Check if user owns the target persona of a bidirectional relation
    const checkResult = await session.run(
      `MATCH (a:Persona)-[r:RELATION {id: $relationId}]->(b:Persona)
       MATCH (u:User {id: $userId})-[:OWNS]->(b)
       WHERE r.bidirectional = true AND r.status = 'pending'
       RETURN r`,
      { userId, relationId }
    );
    if (checkResult.records.length === 0) {
      reply.code(403);
      return { error: 'You can only confirm relations targeting your personas' };
    }
    
    const result = await session.run(
      `MATCH ()-[r:RELATION {id: $relationId}]->()
       SET r.status = 'active',
           r.confirmed_at = datetime()
       RETURN r`,
      { relationId }
    );
    return result.records[0].get('r').properties;
  } finally {
    await session.close();
  }
});

fastify.delete('/relation/:id', { preHandler: authenticate }, async (request, reply) => {
  const userId = request.user.userId;
  const relationId = request.params.id;
  
  const session = driver.session();
  try {
    // Check if user owns either persona in the relation
    const checkResult = await session.run(
      `MATCH (a:Persona)-[r:RELATION {id: $relationId}]->(b:Persona)
       MATCH (u:User {id: $userId})
       WHERE (u)-[:OWNS]->(a) OR (u)-[:OWNS]->(b)
       RETURN r`,
      { userId, relationId }
    );
    if (checkResult.records.length === 0) {
      reply.code(403);
      return { error: 'You can only delete relations involving your personas' };
    }
    
    await session.run(
      `MATCH ()-[r:RELATION {id: $relationId}]->()
       DELETE r`,
      { relationId }
    );
    return { status: 'deleted' };
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

// Recommendation API
fastify.get('/recommendation/:personaId', async (request) => {
  const session = driver.session();
  try {
    // Find common neighbors (friends of friends)
    const commonFriendsResult = await session.run(
      `MATCH (p:Persona {id: $id})-[:RELATION]-(friend)-[:RELATION]-(potential)
       WHERE p <> potential
       AND NOT (p)-[:RELATION]-(potential)
       RETURN potential, count(friend) as common_count
       ORDER BY common_count DESC
       LIMIT 10`,
      { id: request.params.personaId }
    );
    
    // Find by common tags
    const commonTagsResult = await session.run(
      `MATCH (p:Persona {id: $id}), (other:Persona)
       WHERE p <> other
       AND NOT (p)-[:RELATION]-(other)
       WITH p, other, 
            size([tag IN p.tags WHERE tag IN other.tags]) as common_tags
       WHERE common_tags > 0
       RETURN other, common_tags
       ORDER BY common_tags DESC
       LIMIT 10`,
      { id: request.params.personaId }
    );
    
    return {
      common_friends: commonFriendsResult.records.map(r => ({
        persona: r.get('potential').properties,
        common_count: r.get('common_count').toNumber()
      })),
      common_tags: commonTagsResult.records.map(r => ({
        persona: r.get('other').properties,
        common_tags: r.get('common_tags').toNumber()
      }))
    };
  } finally {
    await session.close();
  }
});

// Community API
fastify.post('/community', { preHandler: authenticate }, async (request) => {
  const { name, description, type } = request.body;
  const session = driver.session();
  try {
    const result = await session.run(
      `CREATE (c:Community {
        id: randomUUID(),
        name: $name,
        description: $description,
        type: $type,
        created_at: datetime()
      }) RETURN c`,
      { name, description, type: type || 'group' }
    );
    return result.records[0].get('c').properties;
  } finally {
    await session.close();
  }
});

fastify.get('/communities', async () => {
  const session = driver.session();
  try {
    const result = await session.run(
      'MATCH (c:Community) RETURN c LIMIT 50'
    );
    return result.records.map(r => r.get('c').properties);
  } finally {
    await session.close();
  }
});

fastify.post('/community/:id/join', { preHandler: authenticate }, async (request) => {
  const userId = request.user.userId;
  const session = driver.session();
  try {
    await session.run(
      `MATCH (u:User {id: $userId}), (c:Community {id: $communityId})
       CREATE (u)-[:MEMBER]->(c)`,
      { userId, communityId: request.params.id }
    );
    return { status: 'joined' };
  } finally {
    await session.close();
  }
});

// Graph discovery API
fastify.get('/discover', async (request) => {
  const { limit = 20 } = request.query;
  const session = driver.session();
  try {
    const result = await session.run(
      `MATCH (p:Persona)
       WHERE p.bio IS NOT NULL
       RETURN p
       LIMIT $limit`,
      { limit: parseInt(limit) }
    );
    return result.records.map(r => r.get('p').properties);
  } finally {
    await session.close();
  }
});

// Search API
fastify.get('/search', async (request) => {
  const { q, type = 'persona' } = request.query;
  const session = driver.session();
  try {
    if (type === 'persona') {
      const result = await session.run(
        `MATCH (p:Persona)
         WHERE p.name CONTAINS $q OR p.bio CONTAINS $q OR ANY(tag IN p.tags WHERE tag CONTAINS $q)
         RETURN p LIMIT 20`,
        { q }
      );
      return result.records.map(r => r.get('p').properties);
    } else if (type === 'community') {
      const result = await session.run(
        `MATCH (c:Community)
         WHERE c.name CONTAINS $q OR c.description CONTAINS $q
         RETURN c LIMIT 20`,
        { q }
      );
      return result.records.map(r => r.get('c').properties);
    }
  } finally {
    await session.close();
  }
});

// Feed API - discover new personas
fastify.get('/feed', async (request) => {
  const { limit = 10, offset = 0 } = request.query;
  const session = driver.session();
  try {
    const result = await session.run(
      `MATCH (p:Persona)
       WHERE p.bio IS NOT NULL AND size(p.tags) > 0
       RETURN p
       ORDER BY p.created_at DESC
       SKIP $offset LIMIT $limit`,
      { offset: parseInt(offset), limit: parseInt(limit) }
    );
    return result.records.map(r => r.get('p').properties);
  } finally {
    await session.close();
  }
});

// Stats API
fastify.get('/stats', async () => {
  const session = driver.session();
  try {
    const personaCount = await session.run('MATCH (p:Persona) RETURN count(p) as count');
    const relationCount = await session.run('MATCH ()-[r:RELATION]->() RETURN count(r) as count');
    const userCount = await session.run('MATCH (u:User) RETURN count(u) as count');
    const communityCount = await session.run('MATCH (c:Community) RETURN count(c) as count');
    
    return {
      personas: personaCount.records[0].get('count').toNumber(),
      relations: relationCount.records[0].get('count').toNumber(),
      users: userCount.records[0].get('count').toNumber(),
      communities: communityCount.records[0].get('count').toNumber()
    };
  } finally {
    await session.close();
  }
});

// Search API - public, privacy-respecting
fastify.get('/search', async (request) => {
  const { q, type = 'persona', tags, limit = 20, offset = 0 } = request.query;
  const session = driver.session();
  try {
    if (type === 'persona') {
      // Only show personas with public visibility or that have tags/bio
      const result = await session.run(
        `MATCH (p:Persona)
         WHERE (p.name CONTAINS $q OR p.bio CONTAINS $q OR ANY(tag IN p.tags WHERE tag CONTAINS $q))
         AND (p.visibility = 'public' OR p.visibility IS NULL OR size(p.tags) > 0)
         RETURN p
         ORDER BY p.created_at DESC
         SKIP $offset LIMIT $limit`,
        { q, offset: parseInt(offset), limit: parseInt(limit) }
      );
      return result.records.map(r => ({
        ...r.get('p').properties,
        // Only return safe fields
        id: r.get('p').properties.id,
        name: r.get('p').properties.name,
        bio: r.get('p').properties.bio,
        pronouns: r.get('p').properties.pronouns,
        tags: r.get('p').properties.tags,
        avatar: r.get('p').properties.avatar,
        links: r.get('p').properties.links
      }));
    } else if (type === 'community') {
      const result = await session.run(
        `MATCH (c:Community)
         WHERE c.name CONTAINS $q OR c.description CONTAINS $q
         RETURN c LIMIT $limit`,
        { q, limit: parseInt(limit) }
      );
      return result.records.map(r => r.get('c').properties);
    }
  } finally {
    await session.close();
  }
});

// Browse API - explore the network like Arknights archive
fastify.get('/browse', async (request) => {
  const { tag, relation_type, limit = 50, offset = 0 } = request.query;
  const session = driver.session();
  try {
    let query = `
      MATCH (p:Persona)
      WHERE (p.visibility = 'public' OR p.visibility IS NULL)
    `;
    
    if (tag) {
      query += ` AND ANY(t IN p.tags WHERE t = $tag)`;
    }
    
    query += `
      RETURN p
      ORDER BY p.created_at DESC
      SKIP $offset LIMIT $limit
    `;
    
    const result = await session.run(query, { tag, offset: parseInt(offset), limit: parseInt(limit) });
    
    // Get relations for these personas
    const personas = result.records.map(r => r.get('p').properties);
    const personaIds = personas.map(p => p.id);
    
    if (personaIds.length > 0) {
      const relResult = await session.run(
        `MATCH (a:Persona)-[r:RELATION]->(b:Persona)
         WHERE a.id IN $personaIds AND (r.visibility = 'public' OR r.visibility = 'mutual')
         RETURN a.id as from_id, b.id as to_id, r.type as type, r.weight as weight
         LIMIT 100`,
        { personaIds }
      );
      
      return {
        personas,
        relations: relResult.records.map(r => ({
          from: r.get('from_id'),
          to: r.get('to_id'),
          type: r.get('type'),
          weight: r.get('weight')
        }))
      };
    }
    
    return { personas, relations: [] };
  } finally {
    await session.close();
  }
});

// Public graph view - for browsing without login
fastify.get('/public-graph/:personaId', async (request) => {
  const { personaId } = request.params;
  const session = driver.session();
  try {
    const result = await session.run(
      `MATCH (center:Persona {id: $personaId})
       OPTIONAL MATCH (center)-[r:RELATION {visibility: 'public'}]-(connected:Persona)
       WHERE connected.visibility = 'public' OR connected.visibility IS NULL
       RETURN center, collect({
         persona: connected,
         relation: r,
         direction: CASE WHEN startNode(r) = center THEN 'outgoing' ELSE 'incoming' END
       }) as connections`,
      { personaId }
    );
    
    if (result.records.length === 0) {
      return { error: 'Persona not found' };
    }
    
    const center = result.records[0].get('center').properties;
    const connections = result.records[0].get('connections');
    
    const nodes = [{
      id: center.id,
      name: center.name,
      bio: center.bio,
      tags: center.tags,
      avatar: center.avatar,
      pronouns: center.pronouns
    }];
    
    const edges = [];
    
    for (const conn of connections) {
      if (!conn.persona) continue;
      const p = conn.persona.properties;
      const r = conn.relation.properties;
      
      nodes.push({
        id: p.id,
        name: p.name,
        bio: p.bio,
        tags: p.tags,
        avatar: p.avatar,
        pronouns: p.pronouns
      });
      
      edges.push({
        source: conn.direction === 'outgoing' ? center.id : p.id,
        target: conn.direction === 'outgoing' ? p.id : center.id,
        type: r.type,
        weight: r.weight
      });
    }
    
    return { nodes, edges };
  } finally {
    await session.close();
  }
});

// Tags API - for filtering
fastify.get('/tags', async () => {
  const session = driver.session();
  try {
    const result = await session.run(
      `MATCH (p:Persona)
       UNWIND p.tags as tag
       RETURN tag, count(*) as count
       ORDER BY count DESC
       LIMIT 50`
    );
    return result.records.map(r => ({
      tag: r.get('tag'),
      count: r.get('count').toNumber()
    }));
  } finally {
    await session.close();
  }
});

// Stats API
fastify.get('/stats', async () => {
  const session = driver.session();
  try {
    const personaCount = await session.run('MATCH (p:Persona) RETURN count(p) as count');
    const relationCount = await session.run('MATCH ()-[r:RELATION]->() RETURN count(r) as count');
    const userCount = await session.run('MATCH (u:User) RETURN count(u) as count');
    const communityCount = await session.run('MATCH (c:Community) RETURN count(c) as count');
    
    return {
      personas: personaCount.records[0].get('count').toNumber(),
      relations: relationCount.records[0].get('count').toNumber(),
      users: userCount.records[0].get('count').toNumber(),
      communities: communityCount.records[0].get('count').toNumber()
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
