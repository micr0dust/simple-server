const http = require('http');
const url = require('url');
const querystring = require('querystring');
const display = require('./cards');

let state = 0;

let data = {
    "deck": null,
    "bid": null,
    "hand": null,
    "candidate": null,
    "bidding": null
};

/*
state
0: wait for deck from colab
1: wait for local receive
2: wait for bidding from local
3: wait for colab receive
4: wait for colab update and get candidate
5: end
*/

function display_card(cards){
    let html = '';
    for(let card of cards){
        html += `<img src="data:image/png;base64,${display['cards'][card]}" style="width: 24px;">`;
    }
    return html;
}

function display_card_text(cards){
    let html = '';
    for(let card of cards){
        html+=`${display['point'][card%13]}${display['suit'][parseInt(card/13)]}  `;
    }
    return html;
}

function display_bidding(bidding){
    let html = '';
    for(let i=0; i<bidding.length; i++){
        if(i) html += ', ';
        if(bidding[i]<0 || (bidding.length>1 && bidding[i]===bidding[i-1]))
            html += `PASS`;
        else html += `${display['bid'][bidding[i]]}`;
    }
    return html;
}

const server = http.createServer((req, res) => {
    let parsedUrl = url.parse(req.url);
    let parsedQuery = querystring.parse(parsedUrl.query);

    if (parsedQuery.reset) state=0;
    if (parsedQuery.end) state=5;

    console.log("state", state);

    if (parsedUrl.pathname === '/get_colab') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain');
        if(state==1){
            res.end(JSON.stringify(data));
            state = 2;
        }else if(state==2 && parsedQuery.bid){
            data['bid'] = parsedQuery.bid;
            console.log(data['bid']);
            res.end('Y');
            state = 3;
        }else if(state==5){
            res.end('E');
        }else{
            res.end('None');
        }
    }else if (parsedUrl.pathname === '/get_local') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain');

        if(state == 0 && parsedQuery.deck && parsedQuery.candidate && parsedQuery.bidding && parsedQuery.hand){
            data['deck'] = JSON.parse(parsedQuery.deck);
            data['candidate'] = JSON.parse(parsedQuery.candidate);
            data['bidding'] = JSON.parse(parsedQuery.bidding);
            data['hand'] = JSON.parse(parsedQuery.hand);
            res.end('Y');
            state = 1;
        }else if(state == 3){
            res.end(JSON.stringify(data));
            state = 4;
        }else if(state == 4 && parsedQuery.candidate && parsedQuery.bidding && parsedQuery.hand){
            data['candidate'] = JSON.parse(parsedQuery.candidate);
            data['bidding'] = JSON.parse(parsedQuery.bidding);
            data['hand'] = JSON.parse(parsedQuery.hand);
            res.end('Y');
            state = 1;
        }else if(state==5){
            res.end('E');
        }else{
            res.end('None');
        }
    }else if (parsedUrl.pathname === '/update'){
        local = !local;
        res.end('None');
    }else if (parsedUrl.pathname === '/'){
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html');
        res.end(`
            <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Bridge</title>
                </head>
                <body>
                    <h1>Colab Bridge server</h1>
                    <h2>P1: ${display_card_text(data['deck']?data['deck'].slice(0*13,1*13-1):[])}</h2>
                    <div></div>
                    <h2>P2: ${display_card_text(data['deck']?data['deck'].slice(1*13,2*13-1):[])}</h2>
                    <div></div>
                    <h2>P3: ${display_card_text(data['deck']?data['deck'].slice(2*13,3*13-1):[])}</h2>
                    <div></div>
                    <h2>P4: ${display_card_text(data['deck']?data['deck'].slice(3*13,4*13-1):[])}</h2>
                    <div></div>
                    <hr>
                    <h2>叫牌: ${display_bidding(data['bidding']||[])}</h2>
                    <hr>
                    <h2>目前輪到 P${data['bidding']?data['bidding'].length%4:0}：</h2>
                    <h2>手牌： ${display_card_text(data['hand']||[])}</h2>
                    <h2>模型叫牌：${display_bidding(data['candidate']||[])}</h2>
                    <h2>叫牌結果：${data['bid']||''}</h2>
                    <script>
                        setInterval(() => {
                            window.location.reload();
                        }, 5000);
                    </script>
                </body>
            </html>
        `);
    }else {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Not Found');
    }
});

server.listen(process.env.PORT || 3000, '0.0.0.0', () => {
    console.log('Server running at http://127.0.0.1:3000/');
});