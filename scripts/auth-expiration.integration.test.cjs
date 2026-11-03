const path = require('node:path');
const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
const { test } = require('node:test');
process.env.MAX_SESSIONS_PER_USER = '10';
const authRoot = path.resolve(process.env.AUTH_SERVICE_PATH || path.join(__dirname, '../../auth-service'));
require(path.join(authRoot, 'node_modules/ts-node')).register({
  transpileOnly: true, skipProject: true,
  compilerOptions: { module: 'CommonJS', experimentalDecorators: true, emitDecoratorMetadata: true },
});
const { JwtService } = require(path.join(authRoot, 'node_modules/@nestjs/jwt'));
const { Types } = require(path.join(authRoot, 'node_modules/mongoose'));
const { AuthService } = require(path.join(authRoot, 'src/auth/auth.service.ts'));
const { AuthController } = require(path.join(authRoot, 'src/auth/auth.controller.ts'));

test('actual auth controller renews an expired access token and rejects an expired refresh session', async () => {
  const rows = [];
  const matches = (row, filter) => (!filter.refreshTokenHash || row.refreshTokenHash === filter.refreshTokenHash)
    && (!filter.userId || row.userId.toString() === filter.userId.toString())
    && (!filter.revokedAt || !row.revokedAt)
    && (!filter.expiresAt || row.expiresAt > filter.expiresAt.$gt);
  const model = {
    async create(data) { const row = { ...data, _id: new Types.ObjectId() }; rows.push(row); return row; },
    find(filter) { return { sort() { return { exec: async () => rows.filter(row => matches(row, filter)) }; } }; },
    findOne(filter) { return { exec: async () => rows.find(row => matches(row, filter)) || null }; },
    updateOne(filter, update) { return { exec: async () => { const row=rows.find(row=>matches(row,filter)); if(row) Object.assign(row,update.$set); } }; },
  };
  const userId = new Types.ObjectId();
  const user = { _id: userId, pseudo: 'Test', email: 'test@example.com', roles: ['user'], status: 'active' };
  const jwt = new JwtService({ secret: randomBytes(32).toString('hex'), signOptions: { algorithm: 'HS256', expiresIn: '1s' } });
  const service = new AuthService({ getUserById: async () => user, isUserActive: () => true }, jwt, model);
  const controller = new AuthController(service);
  const refresh = service.createRefreshToken();
  await service.createRefreshSession({ userId, refreshTokenHash: service.hashRefreshToken(refresh) });
  const lifetime = rows[0].expiresAt.getTime() - Date.now();
  assert.ok(lifetime > 30 * 86400000 - 5000 && lifetime <= 30 * 86400000);
  const access = service.signAccessToken({ sub: userId.toString(), roles: ['user'] });
  jwt.verify(access);
  await new Promise(resolve => setTimeout(resolve, 1200));
  assert.throws(() => jwt.verify(access), { name: 'TokenExpiredError' });
  let cookieOptions;
  const req = { headers: { cookie: 'refreshToken=' + refresh }, get: () => 'isolated-test' };
  const result = await controller.refresh(req, { cookie: (_name, _value, options) => { cookieOptions = options; } });
  jwt.verify(result.accessToken);
  assert.ok(rows[0].revokedAt);
  assert.equal(cookieOptions.httpOnly, true);
  assert.equal(cookieOptions.path, '/auth');
  await assert.rejects(() => controller.refresh(req, { cookie() {} }), error => error.getStatus() === 401);
  const expired = service.createRefreshToken();
  await service.createRefreshSession({ userId, refreshTokenHash: service.hashRefreshToken(expired) });
  rows[rows.length - 1].expiresAt = new Date(Date.now() - 1);
  await assert.rejects(() => controller.refresh({ ...req, headers: { cookie: 'refreshToken=' + expired } }, { cookie() {} }), error => error.getStatus() === 401);
});


