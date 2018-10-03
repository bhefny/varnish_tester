var request = require('request');
var colors = require('colors');
var DEBUG = false;
var urlHttp = 'http://www.rebelle.com';
var urlHttps = 'https://www.rebelle.com';
var agents = {
  iphone: "Mozilla/5.0 (iPhone; CPU iPhone OS 9_2 like Mac OS X) AppleWebKit/601.1 (KHTML, like Gecko) CriOS/47.0.2526.70 Mobile/13C71 Safari/601.1.46",
  botMobile: "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.96 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
  bot: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
}
var urlBible = [
  { Tx: {u: '', ssl: false},
    Rx: {status: 301, location: /^https/i}},
  { Tx: {u: '', follow: true, ssl: false},
    Rx: {status: 200}},
  { Tx: {u: '', cookie: 'newshop=1'},
    Rx: {status: 302}},
  { Tx: {u: '', language: 'de'},
    Rx: {status: 200}},
  { Tx: {u: '', language: 'en'},
    Rx: {status: 302, location: /\/en$/i}},
  { Tx: {u: '', language: 'fr'},
    Rx: {status: 302, location: /\/fr$/i}},
  { Tx: {u: '', language: 'it'},
    Rx: {status: 302, location: /\/it$/i}},
  { Tx: {u: '', language: 'nl'},
    Rx: {status: 302, location: /\/nl$/i}},
  { Tx: {u: 'de', language: 'de'},
    Rx: {status: 404}},
  { Tx: {u: 'en', language: 'en'},
    Rx: {status: 200}},
  { Tx: {u: 'fr', language: 'fr'},
    Rx: {status: 200}},
  { Tx: {u: 'it', language: 'it'},
    Rx: {status: 200}},
  { Tx: {u: 'nl', language: 'nl'},
    Rx: {status: 200}},
  // unknown languages
  { Tx: {u: '', language: 'ar'},
    Rx: {status: 302, location: /\/en$/i}},
  { Tx: {u: 'en', language: 'ar'},
    Rx: {status: 200, language: 'en'}},

  { Tx: {u: 'backend', language: 'de'},
    Rx: {status: 302, location: /.*\/sign_in$/i}},
  { Tx: {u: 'backend', language: 'en'},
    Rx: {status: 301, location: /.*\/en\/.*backend$/i}},
  { Tx: {u: 'backend', language: 'ar'},
    Rx: {status: 301, location: /.*\/en\/.*backend$/i}},

  { Tx: {u: 'en/backend', language: 'de'},
    Rx: {status: 302, location: /.*\/sign_in$/i}},
  { Tx: {u: 'en/backend', language: 'en'},
    Rx: {status: 302, location: /.*\/en\/.*sign_in$/i}},
  { Tx: {u: 'en/backend', language: 'ar'},
    Rx: {status: 302, location: /.*\/en\/.*sign_in$/i}},

    // forcing locale cookie
  { Tx: {u: '', cookie: 'locale=de'},
    Rx: {status: 200, language: 'de'}},
  { Tx: {u: 'en', cookie: 'locale=de'},
    Rx: {status: 302, location: /rebelle\.com$/i}},

  { Tx: {u: 'en', cookie: 'locale=en'},
    Rx: {status: 200, language: 'en'}},
  { Tx: {u: '', cookie: 'locale=en'},
    Rx: {status: 302, location: /.*en$/i}},

  { Tx: {u: 'fr', cookie: 'locale=fr'},
    Rx: {status: 200, language: 'fr'}},
  { Tx: {u: '', cookie: 'locale=fr'},
    Rx: {status: 302, location: /.*fr$/i}},

  { Tx: {u: 'it', cookie: 'locale=it'},
    Rx: {status: 200, language: 'it'}},
  { Tx: {u: '', cookie: 'locale=it'},
    Rx: {status: 302, location: /.*it$/i}},

  { Tx: {u: 'nl', cookie: 'locale=nl'},
    Rx: {status: 200, language: 'nl'}},
  { Tx: {u: '', cookie: 'locale=nl'},
    Rx: {status: 302, location: /.*nl$/i}},

  { Tx: {u: 'nl', cookie: 'locale=ar'},
    Rx: {status: 302, location: /.*en$/i}},

  { Tx: {u: 'nl', cookie: 'locale=fr', locale: 'de'},
    Rx: {status: 302, location: /.*fr$/i}},

  { Tx: {u: 'nl?force-locale=it', cookie: 'locale=fr', locale: 'de'},
    Rx: {status: 302, location: /.*\.com\/it.*/i}},
    // German loop
  { Tx: {u: 'en/cart', cookie: 'locale=de', locale: 'de'},
    Rx: {status: 302, location: /.*\.com\/cart.*/i}},
    // Other country loop
  { Tx: {u: 'it/cart', cookie: 'locale=fr', locale: 'fr'},
    Rx: {status: 302, location: /.*\.com\/fr\/cart.*/i}},
    // English loop
  { Tx: {u: 'it/cart', cookie: 'locale=ar', locale: 'ar'},
    Rx: {status: 302, location: /.*\.com\/en\/cart.*/i}},

  // { Tx: {u: '', agent: agents.bot},
  //   Rx: {status: 302, location: /.*\.com\/en\/cart.*/i}},


];

function buildUrl(s, ssl){
  s = (typeof s !== 'undefined') ?  s : '';
  ssl = (typeof ssl !== 'undefined') ?  ssl : true;
  return (ssl ? urlHttps : urlHttp) + '/' + s
}

function finalPrint(i, result){
  switch(result){
    case 1: // success
      s = '\u2714'.green
      break;
    case -1: // timeout
      s = '\u231B'.blue
      break;
    default: // fail
      s = '\u274C'.red
  }
  console.log('[',
              s.bold,
              ']...................',
              String("   " + i).slice(-3)+')',
              ('/'+urlBible[i].Tx.u).yellow,
              ('(' + JSON.stringify(urlBible[i].Tx) + ')').grey
   );
}

function varnish(item, i){
  switch(item.Tx){ // Should eventually handle multiple methods GET/POST/PUT
    case '':
      break;
    default:
      methodGet(i)
  }
}

function parseResponse(i, error, response, body){
  var Rx = urlBible[i].Rx
  var succeeded = response ? true : false // dont check if there is no response

  if (succeeded && 'location' in Rx){
    succeeded = Rx.location.test(response.headers.location)
  }
  if (succeeded && 'status' in Rx){
    succeeded = Rx.status == response.statusCode
  }
  if (succeeded && 'language' in Rx){
    succeeded = Rx.language == response.headers['content-language']
  }
  if (response && DEBUG){
    console.log('<<<<<<<<<<<<<<<<<<<<<<<', Rx.location)
    console.log(response.headers)
    console.log('statusCode:', response && response.statusCode);
  }

  finalPrint(i, response ? (succeeded? 1 : 0) : -1);
}

function methodGet(i){
  var Tx = urlBible[i].Tx
  var headers = {}
  var options = {
    method: 'GET'
    , uri: buildUrl(Tx.u, Tx.ssl)
    , timeout: 8000
    , followRedirect: false // default we should not follow redirect to receive 301 and 302
  }

  if ("follow" in Tx && Tx.follow){
    options['followRedirect'] = true
  }
  if ("cookie" in Tx){
    headers['Cookie'] = Tx.cookie
  }
  if ("agent" in Tx){
    headers['User-Agent'] = Tx.agent
  }
  if ("language" in Tx){
    headers['Accept-Language'] = Tx.language
  }
  options['headers'] = headers

  if (DEBUG){
    console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>', i, options)
  }
  request(
    options
  , function (error, response, body) {
      parseResponse(i, error, response, body)
    }
  )
}

// Lets start

if (process.argv[2]){
  DEBUG = true;
  varnish(urlBible[process.argv[2]], process.argv[2]);
}
else{
  urlBible.map(varnish);
}
