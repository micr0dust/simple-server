const http = require('http');
const url = require('url');
const querystring = require('querystring');

let colab = null, local = null;

const server = http.createServer((req, res) => {
    let parsedUrl = url.parse(req.url);
    let parsedQuery = querystring.parse(parsedUrl.query);

    if (parsedQuery.colab) colab = parsedQuery.colab;
    if (parsedQuery.local) local = parsedQuery.local;

    if (parsedUrl.pathname === '/get_colab') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain');
        if (!colab)
            res.end('None');
        else{
            res.end(colab);
            colab = null;
        }
    } else if (parsedUrl.pathname === '/get_local') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain');
        if (!local)
            res.end('None');
        else{
            res.end(local);
            local = null;
        }
    }else {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Not Found');
    }
});

server.listen(process.env.PORT || 3000, '0.0.0.0', () => {
    console.log('Server running at http://127.0.0.1:3000/');
});