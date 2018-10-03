var request = require('request');
var tape = require('tape');
var faucet = require('faucet');

// force faucet
tape.createStream()
.pipe(faucet())
.pipe(process.stdout);

module.exports = function (opts) {
    // variables
    this.allTests = []
    this.R = require('ramda');

    this.addTest        = (s, r) => (allTests.push({send: optionsSend.apply(null, s), receive: optionsReceive.apply(null, r)}))
    this.buildRegex     = (s) => (RegExp(s,"i"))
    this.startTesting   = () => (allTests.map(startTape))

    // more options for sending
    this.sendMethod     = (m) => ({method: m || 'GET'})
    this.sendTimeout    = (t) => ({timeout: t || 8000})
    this.sendUri        = (u, noSsl) => ({uri: urlBuiler(u, noSsl)})
    this.sendRedirect   = (v) => ({followRedirect: (v || false)})
    this.sendCookie     = (c) => ({headers: {Cookie: c}})
    this.sendLanguage   = (l) => ({headers: {'Accept-Language': l || 'de'}})
    this.sendAgent      = (a) => ({headers: {'User-Agent': a}})
    // more options for receiving
    this.receiveStatus  = (s) => ({status: s})
    this.receiveLocation= (l) => ({location: l})
    this.receiveLanguage= (l) => ({language: l})

    // private functions
    var agents = {
        iphone: "Mozilla/5.0 (iPhone; CPU iPhone OS 9_2 like Mac OS X) AppleWebKit/601.1 (KHTML, like Gecko) CriOS/47.0.2526.70 Mobile/13C71 Safari/601.1.46",
        botMobile: "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.96 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        bot: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    }

    const urlAsHttp     = (url) => (R.replace(/^http(s)?:(.*?)\/?$/, 'http:$2/', url))
    const urlAsHttps    = (url) => (R.replace(/^http(s)?:(.*?)\/?$/, 'https:$2/', url))
    const sliceArgs     = (args) => ([].slice.call(args))
    const urlBuiler     = (u, noSsl) => ((noSsl ? urlAsHttp(url) : urlAsHttps(url)) + (u || ''))
    const optionsDefault= () => (R.reduce(mergeDeepAll, {}, [sendMethod(), sendTimeout(), sendUri(), sendRedirect()]))
    const optionsReceive = (...args) => R.reduce(mergeDeepAll, {}, sliceArgs(args))
    const optionsSend = (...args) => R.reduce(mergeDeepAll, optionsDefault(), sliceArgs(args))
    const optionsResponse = (c, u, l) => (optionsReceive(receiveStatus(c), receiveLocation(u), receiveLanguage(l)))
    const parseResponse = (r) => (optionsResponse(r.statusCode, r.headers.location,r.headers['content-language']))

    const startTape = (oneTest) => tape('timing test', function (t) { triggerRequest(t, oneTest) })
    const triggerRequest = (t, oneTest) => (request(oneTest.send, function (e, r, b) {compareResponse(t, oneTest, e, r, b)}))

    const mergeDeepAll = function(acc, value){
        if ('headers' in value){
            acc.headers = mergeDeepAll(acc.headers, value.headers)
        }
        return R.merge(acc, value)
    }

    const compareResponse = (t, oneTest, e, r, b) => {
        t.comment('__SND__' + JSON.stringify(oneTest.send))
        t.comment('__RCV__' + JSON.stringify(oneTest.receive))
        if (null == e){
            response = parseResponse(r)
            t.comment('__RSP__' + JSON.stringify(response))
            // t.comment('__DMP__' + JSON.stringify(r))
            if (null != oneTest.receive.status){
                t.equal(oneTest.receive.status, response.status);
            }
            if (null != oneTest.receive.language){
                t.equal(oneTest.receive.language, response.language);
            }
            if (null != oneTest.receive.location){
                t.equal(R.test(oneTest.receive.location, response.location), true);
            }
        }
        else{
            t.fail(e);
        }
        t.end();
    }
}
