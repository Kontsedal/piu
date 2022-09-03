import { createListener } from './listener';
import request from 'supertest';

describe('listener', () => {
  it('should', async () => {
    const listener = createListener();
    const response = await request(listener.httpServer).get('/user').send();
    expect(response.statusCode).toBe(404);
    expect(response.body).toMatchObject({ message: 'Not found' });
  });
});
