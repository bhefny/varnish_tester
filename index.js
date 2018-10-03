require('./live_tester')();

var locales = {
    'de': {'path': '', 'path2': ''},
    'en': {'path': 'en', 'path2': 'en/'},
    'fr': {'path': 'fr', 'path2': 'fr/'},
    'it': {'path': 'it', 'path2': 'it/'},
    'nl': {'path': 'nl', 'path2': 'nl/'}
};

url = 'https://www.rebelle.com';
// url = 'http://rebelle.dev';

const urlLast = () => url.substr(url.length - 3)

varnishTests();
startTesting();


function vclRedirectHttp(){
    addTest([sendUri('', true)],[receiveStatus(301), receiveLocation(buildRegex('^https'))]);
}

function vclPage500(){
    R.keys(locales).map(function(v){
        addTest([sendUri(locales[v]['path2'] + '500')],[receiveStatus(500)]);
    });
    // not anything ending with 500 gets rejected
    addTest([sendUri('gucci-taschen-10500')],[receiveStatus(200)]);
}

function vclRestrictPreview(){
    addTest([{uri: 'https://preview.rebelle.com'}],[receiveStatus(401)]);
}

function vclDetectLocale(){
    // GeoIP can not be tested

    R.without(['de'], R.keys(locales)).map(function(v){
        addTest([sendUri(''), sendLanguage(v)],[receiveStatus(302), receiveLocation(buildRegex(locales[v]['path'] + '$'))]);
        ['backend', 'api', 'categories', 'localization', 'favicon', 'orders', 'packaging', 'addresses', 'rupdate'].map(function(path){
            addTest([sendUri(path), sendLanguage(v)],[receiveStatus(301), receiveLocation(buildRegex(locales[v]['path'] + '\/' + path +'$'))]);
        });
    });

    // normal page should never trigger a redirect
    addTest([sendUri('contact'), sendLanguage('en')],[receiveStatus(200)]);

    R.keys(locales).map(function(v){
        addTest([sendUri(locales[v]['path']), sendLanguage(v)], [receiveStatus(200)]);
    });

    // /de should never work
    addTest([sendUri('de'), sendLanguage('de')],[receiveStatus(404)]);
}

function vclBackendSignIn(){
    R.keys(locales).map(function(v){
        addTest([sendUri(locales[v]['path2'] + 'backend'), sendLanguage(v)],[receiveStatus(302), receiveLocation(buildRegex(locales[v]['path'] + '\/users\/sign_in$'))]);
    });
}

function vclShopV2(){
    addTest([sendCookie('newshop=1')], [receiveStatus(302)]);
}

function vclLocaleCookie(){
    R.keys(locales).map(function(v){
        addTest([sendUri(locales[v]['path']), sendCookie('locale='+v)], [receiveStatus(200), receiveLanguage(v)]);
        R.without([v], R.keys(locales)).map(function(l){
            addTest([sendUri(locales[l]['path']), sendCookie('locale=' + v)], [receiveStatus(302), receiveLocation(buildRegex(locales[v]['path'] + '$'))]);
        });
    });

    // Any cookie prefix name works
    addTest([sendUri('en'), sendCookie('monkey-locale=it')], [receiveStatus(302), receiveLocation(buildRegex('\/it$'))]);

    // Wrong values (AR) default to EN
    addTest([sendUri('fr'), sendCookie('locale=ar')], [receiveStatus(302), receiveLocation(buildRegex('\/en$'))]);
    addTest([sendUri('en'), sendCookie('locale=ar')], [receiveStatus(200)]);
}

function vclForceLocale(){

}

function vclLocaleRedirects(){
    R.without(['de'], R.keys(locales)).map(function(v){
      addTest([sendUri(locales[v]['path']), sendCookie('locale=de')],[receiveStatus(302), receiveLocation(buildRegex(urlLast() + '$'))]);
      // force wins over cookie
      addTest([sendUri(locales[v]['path'] + '?force-locale=de'), sendCookie('locale='+v)],[receiveStatus(302), receiveLocation(buildRegex(urlLast() + '\?.*?=de$'))]);
    });

    ['fr', 'it', 'nl'].map(function(l){
        R.without([l], R.keys(locales)).map(function(v){
            addTest([sendUri(locales[v]['path']), sendCookie('locale='+l)],[receiveStatus(302), receiveLocation(buildRegex(l + '$'))]);
        });
    });

    R.without(['en'], R.keys(locales)).map(function(v){
        addTest([sendUri(locales[v]['path']), sendCookie('locale=ar')],[receiveStatus(302), receiveLocation(buildRegex('en$'))]);
    });
}

function varnishTests(){
    vclRedirectHttp();
    vclPage500();
    vclRestrictPreview(); //could flicker in the office
    vclDetectLocale();
    vclBackendSignIn();
    vclShopV2();
    vclLocaleCookie();
    vclForceLocale();
    vclLocaleRedirects();
}
