const Router = require('@koa/router');
const router = new Router();

// local health check
router.get('/check_urls', async (ctx, next) => {
    ctx.body = 'ok';
    ctx.status = 200;
    await next();
})

router.get('/provider', async (ctx, next) => {
    ctx.status = 200;
    ctx.body = 'hello world';
    await next();
});

module.exports = router;
