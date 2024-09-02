const Router = require('@koa/router');
const router = new Router();
const {
    axios,
    setAxiosSource,
} = require('../../src/axios');

// local health check
router.get('/check_urls', async (ctx, next) => {
    ctx.body = 'ok';
    ctx.status = 200;
    await next();
})

// **** use axios ****
// local /http -> remote my-test-producer/provider ()
router.get('/http', async (ctx, next) => {
    try {
      const response = await axios.get('http://my-test-producer.com/provider?query=hello');
      ctx.body = response.data;
      console.log(response.data);
    } catch (err) {
      console.error(err.message);
      ctx.status = err.response.status;
      ctx.body = err.response.data;
    }
    await next();
});

module.exports = router;
