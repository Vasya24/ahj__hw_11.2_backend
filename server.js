const http = require('http');
const Koa = require('koa');
const koaBody = require('koa-body');
const Router = require('koa-router');
const faker = require('faker');
const uuid = require('uuid');
const router = new Router();
const app = new Koa();

app.use(koaBody({
    urlencoded: true,
    multipart: true,
    json: true,
    text: true,
}));

app.use(async (ctx, next) => {
    const origin = ctx.request.get('Origin');
    if (!origin) {
      return await next();
    }

    const headers = { 'Access-Control-Allow-Origin': '*', };

    if (ctx.request.method !== 'OPTIONS') {
      ctx.response.set({...headers});
      try {
        return await next();
      } catch (e) {
        e.headers = {...e.headers, ...headers};
        throw e;
      }
    }

    if (ctx.request.get('Access-Control-Request-Method')) {
      ctx.response.set({
        ...headers,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH',
      });

      if (ctx.request.get('Access-Control-Request-Headers')) {
        ctx.response.set('Access-Control-Allow-Headers', ctx.request.get('Access-Control-Request-Headers'));
      }

      ctx.response.status = 204;
    }
});

let posts = [];
const comments = [];

setInterval(() => {
  const postId = uuid.v4();
  const authorId = uuid.v4();
  const random = Math.floor(Math.random() * 10);
  posts.unshift({
    id: postId,
    author_id: authorId,
    title: faker.lorem.slug,
    author: faker.internet.userName(),
    avatar: faker.internet.avatar(),
    image: faker.image.imageUrl(),
    created: Date.now()
  });
  for (let i = 0; i <= random; i++) {
    comments.unshift({
      id: uuid.v4(),
      post_id: postId,
      author_id: authorId,
      author: faker.internet.userName(),
      avatar: faker.internet.avatar(),
      content: faker.lorem.sentence(),
      created: Date.now()
    });
  }
}, 10000);

router.get('/posts/latest', async (ctx, next) => {
  if (posts.length > 10) {
    posts = posts.slice(0, 10);
  }
  ctx.response.body = {
    "status": "ok",
    "data": JSON.stringify(posts)
  }
});

router.get('/posts/:id/comments/latest', async (ctx, next) => {
  let latestComments = comments.filter((el) => el.post_id === ctx.params.id);
  if (latestComments.length > 3) {
    latestComments = latestComments.slice(0, 3);
  }
  ctx.response.body = {
    "status": "ok",
    "data": JSON.stringify(latestComments)
  }
});

app.use(router.routes()).use(router.allowedMethods());
const server = http.createServer(app.callback());
const port = process.env.PORT || 7070;
server.listen(port);
