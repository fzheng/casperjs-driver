var popups = new Array();

var gBrowser = {
  tabs : {},
  mCurrentTab : {}
};

var getBrowser = function() {
  return gBrowser;
};

var FC_Debugtestshoppinguuid = {
  L : function(msg) {
    console.log(msg);
  }
};

var RL_ClosedTabs = function(n) {
  // the array to store recently closed tabs
  var closedTabs = [];
  // how many closed tabs we would store in maximum
  // by default it is 20
  var maxNum = n || 20;
  // localStorage key
  var key = FCUtilMD5("recentlyClosedTabs");

  return {
    // adding a newly closed tab
    add : function(tab) {
      // do not add chrome protocol urls
      if (0 === tab.url.indexOf("chrome")) {
        return false;
      }
      if (!this.rm(tab)) {
        return false;
      }
      closedTabs.unshift({
        'title' : tab.title || "",
        'url' : tab.url,
        'favIconUrl' : tab.favIconUrl || ""
      });
      closedTabs = closedTabs.slice(0, maxNum);
      this.write(closedTabs);
      return true;
    },

    // removing a closed tab
    rm : function(tab) {
      // input argument tab must be valid with valid tab url
      if (!tab || !(tab.id >= 0) || !tab.url) {
        return false;
      }
      closedTabs = this.read();
      for ( var i = 0; i < closedTabs.length; ++i) {
        if (tab.url === closedTabs[i].url) {
          closedTabs.splice(i, 1);
        }
      }
      return true;
    },

    // return closed tab
    read : function() {
      var str = FC_IPlugin.obfs_readFromFile(key);
      var data = str ? JSON.parse(str) : [];
      return data;
    },

    write : function(data) {
      if ("undefined" !== typeof data) {
        return FC_IPlugin.obfs_writeToFile(key, JSON.stringify(data), true);
      }
      else {
        return "";
      }
    },

    clear : function() {
      FC_IPlugin.obfs_RemoveString(key);
      return true;
    }
  }
};

var rlClosedTabs;

if (undefined === localStorage['recently_closed_disabled'] || !(JSON.parse(localStorage['recently_closed_disabled']))) {
  rlClosedTabs = new RL_ClosedTabs();
}
else {
  if (rlClosedTabs && rlClosedTabs.clear) {
    rlClosedTabs.clear();
    rlClosedTabs = null;
  }
}

var authData = {
  username : "",
  sessionkey : "",
  sessionid : "",

  init : function() {
    if (localStorage.username || localStorage.sessionkey || localStorage.sessionid) {
      authData.username = localStorage.username;
      authData.sessionkey = localStorage.sessionkey;
      authData.sessionid = localStorage.sessionid;
    }
  },

  isLoginDone : function() {
    if (authData.username || authData.sessionkey || authData.sessionid) {
      return true;
    }

    return false;
  }
};

var compManager = {
  comp : [],

  init : function() {
    console.log("launch compManager init");

    // MANIFEST-2: replaced new Function by JSON.parse
    // TODO: assurance of JSON.parse in case the layout was corrupted
    // var json = new Function("return "+localStorage.layout);
    // var layout = json().toolbar;
    var layout = JSON.parse(localStorage.layout);
    var comp = [];

    // toggle
    // MANIFEST-2
    if (layout && layout.toolbar && layout.toolbar.toolbaritem instanceof Array) {
      comp = layout.toolbar.toolbaritem;
    }
    else {
      comp.push(layout.toolbar.toolbaritem);
    }

    for ( var i = 0; i < comp.length; i++) {
      this.addComp(comp[i]);
    }
  },

  addComp : function(comp) {
    var new_comp;
    // include
    if (typeof (comp.fctb_include) != "undefined") {
      // console.log('create include');
      // TODO
      var params = [];
      if (comp.fctb_include.template_param instanceof Array) {
        params = comp.fctb_include.template_param;
      }
      else {
        params.push(comp.fctb_include.template_param);
      }
      comp.fctb_include.template_param = params;

      new_comp = new FC_Include(comp.fctb_include);
      // TOOLBAR-2275
      if (undefined !== comp.cid && null !== comp.cid) {
        new_comp.cid = comp.cid;
      }
      else {
        new_comp.cid = "";
      }
      this.comp.push(new_comp);
      return new_comp;
    }
    // shopping
    if (typeof (comp.fctb_affiliate) != "undefined") {
      // console.log('create shopping');
      new_comp = new FC_Shopping(comp.fctb_affiliate.src, comp.fctb_affiliate.expire);
      new_comp.cid = (undefined !== comp.cid && null !== comp.cid) ? comp.cid : "shopping";
      FC_StateReporting.obfs_updStats("components", new_comp.cid, "properties", "enabled", null, ("true" === localStorage.shopping_disabled) ? 0 : 1);
      this.comp.push(new_comp);
      return new_comp;
    }
    // scripthost
    if (typeof (comp.fctb_scripthost) != "undefined") {
      // console.log('create scripthost');
      // TODO
      var code = [];
      if (comp.fctb_scripthost.code instanceof Array) {
        code = comp.fctb_scripthost.code;
      }
      else {
        code.push(comp.fctb_scripthost.code);
      }
      // MANIFEST-2 : if no name provided, use the cid
      new_comp = new FC_ScriptHost(code, comp.fctb_scripthost.name || comp.fctb_scripthost.cid);
      this.comp.push(new_comp);
      return new_comp;
    }

    if (typeof (comp.fctb_runcmd) != "undefined") {
      // console.log('create run_cmd: ' + comp.fctb_runcmd.cmd + " id = " +
      // comp.fctb_runcmd.event_id);
      new_comp = new FC_Runcmd(comp.fctb_runcmd);
      this.comp.push(new_comp);
      return new_comp;
    }

    if (typeof (comp.fctb_include_js) != "undefined") {
      new_comp = new FC_IncludeJS(comp.fctb_include_js);
      this.comp.push(new_comp);
      return new_comp;
    }
  },

  removeComp : function(comp) {
    for (i = 0; i < this.comp.length; ++i) {
      if (this.comp[i] === comp) {
        if (typeof (comp.Deinit) != "undefined") {
          comp.Deinit();
        }
        this.comp.splice(i, 1);
        break;
      }
    }
  },

  getComp : function(type) {
    var i = this.comp.length;
    var result = [];
    while (i--) {
      if (this.comp[i].type == type) {
        result.push(this.comp[i]);
      }
    }
    return result;
  },

  OnDOMContentLoaded : function(tab, details) {
    var i = this.comp.length;
    // MANIFEST 2 - Executing shopping compononent's OnDOMContentLoaded before
    // scripthost for variable dependencies and on top frame only.
    var shoppingComp = this.getComp("shopping");
    if (shoppingComp.length > 0 && details.frameId == 0) {
      shoppingComp[0].OnDOMContentLoaded(tab, details);
    }
    // MANIFEST 2 - Executing scripthost compononents' OnDOMContentLoaded
    while (i--) {
      if (this.comp[i] instanceof FC_ScriptHost) {
        this.comp[i].OnDOMContentLoaded(tab, details);
      }
    }
  },

  // MANIFEST 2 - Adding OnCompleted Event to component manager events to
  // execute scripthost components' OnCompleted Event
  OnCompleted : function(tab, details) {
    var i = this.comp.length;
    while (i--) {
      if (this.comp[i] instanceof FC_ScriptHost) {
        this.comp[i].OnCompleted(tab, details);
      }
    }
  },

  OnBeforeNavigate : function(details) {
    var i = this.comp.length;
    while (i--) {
      if (this.comp[i] instanceof FC_Shopping) {
        this.comp[i].OnBeforeNavigate(details);
      }
    }
  },

  OnBeforeRequest : function(details) {
    var i = this.comp.length;
    var result = {};
    while (i--) {
      if (this.comp[i] instanceof FC_Shopping && this.comp[i].OnBeforeRequest) {
        this.comp[i].OnBeforeRequest(details, result);
      }
    }
    return result;
  },

  OnBeforeRedirect : function(details) {
    var i = this.comp.length;
    var result = {};
    while (i--) {
      if (this.comp[i] instanceof FC_Shopping) {
        this.comp[i].OnBeforeRedirect(details, result);
      }
    }
    return result;
  },

  OnBeforeSendHeaders : function(details) {
    var i = this.comp.length;
    var result = {};
    while (i--) {
      if (this.comp[i] instanceof FC_Shopping) {
        this.comp[i].OnBeforeSendHeaders(details, result);
      }
    }
    return result;
  },

  OnCookiesChanged : function(changeInfo) {
    /*
     * var i = this.comp.length; while (i--) { if (this.comp[i] instanceof
     * FC_Shopping) { this.comp[i].OnCookiesChanged(changeInfo); } }
     */
  },

  OnTabSelected : function(url, tab) {
    var i = this.comp.length;
    while (i--) {
      if (this.comp[i] instanceof FC_Shopping) {
        this.comp[i].OnTabSelected(url, tab);
      }
    }
    // Prepare updated data
    var updatedData = FC_Toolbar.Init();
    updatedData.sessionUser = authData.username || "";
    updatedData.sessionKey = authData.sessionkey || "";
    updatedData.sessionId = authData.sessionid || "";

    // Send request to update inject's data(initData)
    chrome.tabs.sendMessage(tab.id, {
      component : "inject",
      cmd : "updateInitData",
      frameUrl : url,
      data : updatedData
    });
    // Send request to update scripthost's data (ToolbarControl)
    chrome.tabs.sendMessage(tab.id, {
      component : "scripthost",
      cmd : "UpdateToolbarControl",
      frameUrl : url,
      initData : updatedData
    });
  },

  /**
   * @method OnApiLogin
   */
  OnApiLogin: function() {
    try {
      if (!this.comp) {
        return;
      }
      for(var i=0; i < this.comp.length; ++i) {
        if (this.comp[i].OnApiLogin) {
          this.comp[i].OnApiLogin();
        }
      }
    }catch(e){
      console.log("OnApiLogin: ", e);
    }
  },

  /**
   * @method OnApiLogout
   */
  OnApiLogout: function() {
    try {
      if (!this.comp) {
        return;
      }
      for(var i=0; i < this.comp.length; ++i) {
        if (this.comp[i].OnApiLogout) {
          this.comp[i].OnApiLogout();
        }
      }
    }catch(e){
      console.log("OnApiLogout: ", e);
    }
  }
};

// after XSLTProcessor init
function launch() {
  if (!localStorage.firstInitComplete) {
    // init after installation
    firstLaunch();
  }
  else if (!localStorage.lastForceUpdate || (localStorage.lastForceUpdate < FC_Settings.forceUpdateBrowser)) {
    // init post update
    postUpdate();
  }
  else {
    // every browser launch init
    everyLaunch();
  }
  chrome.tabs.query({}, function(tabs) {
    for ( var k = 0; k < tabs.length; k++) {
      console.log("add tab " + tabs[k].id);
      liveTabs[tabs[k].id] = {
        'status' : true,
        'tabObj' : tabs[k]
      };
    }
  });
}

// every browser launch init
function everyLaunch() {
  console.log('everyLaunch');
  if (chrome.runtime.getManifest) {
    var manifestMain = chrome.runtime.getManifest();
    var toolbar_name = manifestMain.name;
    if (toolbar_name) {
      localStorage.toolbar_name = toolbar_name;
    }
    // store content security policy rules into background localStorage
    var cspRules;
    var cspManifestStr = manifestMain.content_security_policy;
    var re = new RegExp(/https:\/\/[^\s]*/gi);
    if(cspManifestStr){
      var cspArray = cspManifestStr.split(";");
      for(var i = 0; i < cspArray.length; ++i){
        if(0 === cspArray[i].indexOf("script-src")){
          cspRules = cspArray[i].match(re);
          break;
        }
      }
    }
    if (cspRules) {
      try {
        localStorage.cspRules = JSON.stringify(cspRules);
      } catch (e) {
        console.log(e);
      }
    }
  }
  authData.init();
  layoutLoad(function(loadResult) {
    if (localStorage.layout != undefined) {
      console.log(loadResult ? "layoutLoad: new layout loaded" : "layoutLoad: old layout, might be cached or layout error");
      compManager.init();
      setTimeout(function() {
        checkActiveShopping();
        initSandboxEvaluator();
      }, 1000);
      monitorState();
    }
  });
}

function postUpdate() {
  console.log('post update start');
  if (FC_Settings.forceUpdateBrowser <= parseInt(window.navigator.appVersion.match(/Chrome\/(\d+)\./)[1], 10)) {
    console.log('No extra update step required: current browser version is higher than force update version');
    localStorage.lastForceUpdate = FC_Settings.forceUpdateBrowser;
    everyLaunch();
  }
  else {
    chrome.cookies.get({
      url : "http://installdata.freecause.com",
      name : "lastForceUpdate"
    }, function(cookie) {
      if (cookie) {
        // if there is cookie name as lastForceUpdate, means the update fix exe
        // drops it
        localStorage.lastForceUpdate = cookie.value;
        chrome.cookies.remove({
          url : "http://installdata.freecause.com",
          name : "lastForceUpdate"
        });
        everyLaunch();
      }
      else {
        // there is no cookie name as lastForceUpdate, means the update fix exe
        // did not run
        chrome.tabs.query({
          url : 'chrome-extension://*/fc_newtab_update.html'
        }, function(tabs) {
          if (tabs.length > 0) {
            chrome.tabs.update(tabs[0].id, {
              highlighted : true
            }, function(tab) {
              console.log('finding an existing extension update page with tab id = ' + tab.id);
            });
          }
          else {
            chrome.tabs.create({
              url : chrome.extension.getURL('fc_newtab_update.html')
            }, function(tab) {
              console.log('create an extension update page with tab id = ' + tab.id);
            });
          }
          everyLaunch();
        });
      }
    });
  }
}

function monitorState() {
  if (FC_StateReporting)
    FC_StateReporting.Init();
}

// init after installation
function firstLaunch() {
  console.log('starting init');

  //Return a random string of hex digits separated into groups of
  //8, 4, 4, 4, and 12 with dashes ('-'). So, 32 random digits total,
  //but total length of the uuid is 36 characters.
  localStorage.uuid = (function () {
    // Return a string of hex digits (0-9a-f) of the given length
    this.randomHexString = function(length){
      var i, output = [];
      for (i = 0; i < length; i++) {
        output.push((function () {
          // Get a digit 0-9a-f returned as a string
          return parseInt(Math.random()*16).toString(16);
        })());
      }
      return output.join('');
    }
    var uuid = [];
    uuid.push(this.randomHexString(8));
    uuid.push(this.randomHexString(4));
    uuid.push(this.randomHexString(4));
    uuid.push(this.randomHexString(4));
    uuid.push(this.randomHexString(12));
    return uuid.join('-');
  })();

  localStorage.username = '';

  var rlo_parseOCICookies = function(cookieDomain, cookieConfig){
    localStorage.installer_cookie_domain = cookieDomain;
    if(localStorage.installer_cookie_domain.indexOf("http://") == -1){
      localStorage.installer_cookie_domain = "http://" + localStorage.installer_cookie_domain;
    }
    chrome.cookies.get({
      url: localStorage.installer_cookie_domain,
      name: cookieConfig.partnerId
    }, function(cookie){
      if(cookie){
        localStorage.partner_id = cookie.value;
        chrome.cookies.remove({
          url: localStorage.installer_cookie_domain,
          name: cookieConfig.partnerId
        });
      }
      chrome.cookies.get({
        url: localStorage.installer_cookie_domain,
        name: cookieConfig.enableShopping
      }, function(cookie){
        if(cookie){
          localStorage.shopping_disabled = ((cookie.value == "false" || cookie.value == "0") ? "true" : "false");
          chrome.cookies.remove({
            url: localStorage.installer_cookie_domain,
            name: cookieConfig.enableShopping
          });
        }
        chrome.cookies.get({
          url: localStorage.installer_cookie_domain,
          name: cookieConfig.newTab
        }, function(cookie){
          if(cookie){
            localStorage.default_newtab = ((cookie.value == "false" || cookie.value == "0") ? "true" : "false");
            chrome.cookies.remove({
              url: localStorage.installer_cookie_domain,
              name: cookieConfig.newTab
            });
          }
          chrome.cookies.remove({
            url: localStorage.installer_cookie_domain,
            name: "cookieDomain"
          });
          getUserId();
        });
      });
    });
  };

  chrome.cookies.get({
    url: "http://installdata.freecause.com",
    name: "cookieDomain"
  }, function(cookie){
    if(cookie){
      rlo_parseOCICookies(cookie.value, {
        partnerId: "partnerId",
        enableShopping: "enableShopping",
        newTab: "newTab"
      });
    } else if(FC_Settings && FC_Settings.ociCookieDomain && -1 === FC_Settings.ociCookieDomain.indexOf("<%") && FC_Settings.toolid){
      rlo_parseOCICookies(FC_Settings.ociCookieDomain, {
        partnerId: FC_Settings.toolid + "_partnerId",
        enableShopping: FC_Settings.toolid + "_shopping",
        newTab: FC_Settings.toolid + "_newtab"
      });
    } else {
      getUserId();
    }
  });
}

// ----
function firstUrl() {
  var url = FC_IPlugin.obfs_URLSubstitution(FC_Settings.urlFirstLaunch);
  if (url) {
    loadUrl({
      url : url,
      mode : true
    });
  }
};

// ----get userid
function getUserId() {
  var uid_req = new XMLHttpRequest();
  uid_req.open('GET', FC_IPlugin.obfs_URLSubstitution(FC_Settings.GetUserUrl), true);
  uid_req.onreadystatechange = function(aEvt) {
    try {
      if (uid_req.readyState == 4 && uid_req.status == 200) {
        // MANIFEST-2 : fixed parsing the userId's response
        // var obfs_func = new Function("return " + uid_req.responseText);
        // var local = obfs_func();
        var local = JSON.parse(uid_req.responseText.replace(new RegExp("'", "gmi"), '"'));
        if (local instanceof Array && local.length > 0) {
          var userid = local[0].userid;
          var userkey = local[1].key;
          if (userid) {
            localStorage.userid = userid;
            localStorage.userkey = userkey;
            /* DCA Code */
            if (typeof (FC_DCAInterface) != "undefined") {
              FC_DCAInterface.OnFirstLaunch();
            }
            if (FC_Settings.extraUpdateParams) {
              chrome.extension.setUpdateUrlData(FC_URLSubst.substitute(FC_Settings.extraUpdateParams));
            }
            // load layout
            everyLaunch();
            // firstInitComplete!
            localStorage.firstInitComplete = true;
            localStorage.lastForceUpdate = FC_Settings.forceUpdateBrowser;
            firstUrl();
            // clean browser tabs after install
            chrome.tabs.query({}, function(current_tabs) {
              var reg_pattern = RegExp(".+\\.crx(\\?.*|&.*)?$", "gi");
              for ( var i = 0; i < current_tabs.length; ++i) {
                var url = current_tabs[i].url;
                if (url && (reg_pattern.test(url) || url.indexOf("preinstall.html") > -1)) {
                  chrome.tabs.update(current_tabs[i].id, {
                    'url' : chrome.extension.getURL('fc_newtab.html')
                  });
                }
              }
            });
          }
        }
      }
    } catch (e) {
    }
  };
  uid_req.send(null);
};

// LoadLayoutDate
function layoutLoad(cb) {
  var old = (typeof (localStorage.LoadLayoutDate) == 'undefined') ? 0 : localStorage.LoadLayoutDate;
  var now = new Date();
  var interval = 24;
  if (old < 0 || ((now.getTime() - old) / 3600000 >= interval)) {
    console.log('layoutLoad');
    var req = new XMLHttpRequest();
    req.open('GET', FC_IPlugin.obfs_URLSubstitution(FC_Settings.ConfigFilePath), true);
    req.onreadystatechange = function(aEvt) {
      try {
        if (req.readyState == 4) {
          console.log('layout received from server');
          var str = req.responseText;
          var dom = (new DOMParser()).parseFromString(str.replace(/>[\s\t\n]+</g, "><"), "text/xml");
          // save layout
          var tempLayout = FC_XSLTProcessor.toJSON(dom).documentElement.innerText.trim();
          // check if new layout is good
          if (tempLayout.indexOf('{"toolbar":{"toolbarname":') == 0) {
            localStorage.layout = tempLayout;
            localStorage.LoadLayoutDate = now.getTime();
            cb(true);
          }
          else {
            console.log('new layout is bad keeping old one');
            localStorage.LoadLayoutDate = (now.getTime() - (interval - 1) * 3600000);
            cb(false);
          }
        }
      } catch (e) {
        console.log('loadLayout Exception:' + e);
        cb(false);
      }
    };
    req.send(null);
  }
  else {
    console.log('layoutLoad: too early to load layout');
    cb(false);
  }
}

// An adapter class for outgoing communicate to the current selected tab.
// Used for showing popups (i.e., shopping component).
var adapter = {
  // helper function used by the actual adaper
  sendMessage : function(data) {
    chrome.tabs.getSelected(null, function(tab) {
      chrome.tabs.sendMessage(tab.id, data);
    });
  },
  // show a Popup in the currently selected tab.
  showPopup : function(position, width, height, url, timeout) {
    var data = {
      position : position,
      width : width,
      height : height,
      url : url,
      timeout : timeout
    };
    this.sendMessage({
      showPopup : data
    });
  }
};

function onBgRequest(request, sender, sendResponse) {
  var i, response;
  if (request.authenticated) {
    if (request.authenticated.username || request.authenticated.sessionkey || request.authenticated.sessionid) {
      eventManager.queueEvent('ApiLoginChanged', {
        authData : request.authenticated
      });
      var username = request.authenticated.username ? request.authenticated.username : "";
      var sessionkey = request.authenticated.sessionkey ? request.authenticated.sessionkey : "";
      var sessionid = request.authenticated.sessionid ? request.authenticated.sessionid : "";
      authData.username = username;
      authData.sessionkey = sessionkey;
      authData.sessionid = sessionid;
      if (request.authenticated.persistent) {
        localStorage.username = request.authenticated.username;
        localStorage.sessionkey = request.authenticated.sessionkey;
        localStorage.sessionid = request.authenticated.sessionid;
        localStorage.session_type = "1";
      }
      else {
        localStorage.session_type = "0";
      }
      FC_IPlugin.OnApiLogin();
    }
    else {
      localStorage.username = '';
      localStorage.sessionkey = '';
      localStorage.sessionid = '';
      authData.username = '';
      authData.sessionkey = '';
      authData.sessionid = '';
      localStorage.session_type = "0";
      FC_IPlugin.OnApiLogout();
    }
    // CHROME-92
    var updatedData = FC_Toolbar.Init();
    updatedData.toolid = FC_Settings.toolid;
    updatedData.userid = localStorage.userid;
    updatedData.sessionUser = authData.username || "";
    updatedData.sessionKey = authData.sessionkey || "";
    updatedData.sessionId = authData.sessionid || "";
    updatedData.ver = localStorage.toolbar_name ? (localStorage.toolbar_name + " ") : "";
    updatedData.ver += FC_Settings.version;
    chrome.tabs.query({}, function(tabs) {
      for ( var i = 0; i < tabs.length; ++i) {
        if (tabs[i].url.indexOf('http') > -1) {
          chrome.tabs.sendMessage(tabs[i].id, {
            component : "scripthost",
            cmd : "ApiLoginChanged",
            frameUrl : tabs[i].url,
            initData : updatedData
          });
        }
      }
    });

    if (FC_Settings.extraUpdateParams) {
      chrome.extension.setUpdateUrlData(FC_URLSubst.substitute(FC_Settings.extraUpdateParams));
    }
    if (FC_Settings.EnablePartnerAuth) {
      var url = FC_IPlugin.obfs_URLSubstitution(FC_Settings.PartnerAuth);
      var httpReq = new XMLHttpRequest();
      httpReq.open("GET", url, true);
      httpReq.onreadystatechange = function() {
        if (httpReq.status == 200) {
          console.log("StateReport Response:" + httpReq.responseText);
        }
      };
      httpReq.send(null);
    }
    sendResponse({});
  }

  if (request.inject) {
    sendResponse({
      whitelisted_domains : FC_Settings.whitelisted_domains
    });
  }

  if (request.jsinclude) {
    var response = new Array();
    var hostname = (function(s) {
      var dummyDOM = document.createElement("a");
      dummyDOM.href = s;
      return dummyDOM.hostname;
    })(sender.url);
    // if cspRules empty, do not inject js into webpage
    if (hostname && compManager.comp) {
      for ( var i = 0; i < compManager.comp.length; ++i) {
        if (compManager.comp[i] instanceof FC_IncludeJS) {
          var domains = compManager.comp[i].domains;
          var scripts = compManager.comp[i].scripts;
          if (domains && scripts) {
            var domainMatch = false;
            for ( var j = 0 ; j < domains.length; ++j) {
              try {
                // jsinclude component's domains are Regex
                if ((new RegExp(domains[j])).test(hostname)) {
                  domainMatch = true;
                  break;
                }
              } catch (e) {
                console.log(e);
              }
            }
            if (domainMatch) {
              for ( var k = 0; k < scripts.length; ++k) {
                if (0 === response.filter(function(x) {return x.src === scripts[k]}).length) {
                  response.push({
                    id : FCUtilMD5(scripts[k]),
                    src : scripts[k]
                  });
                }
              }
            }
          }
        }
      }
    }
    sendResponse(response);
  }

  if (request.initToolbar) {
    response = {};
    response.toolid = FC_Settings.toolid;
    response.userid = localStorage.userid;
    response.sessionUser = authData.username || "";
    response.sessionKey = authData.sessionkey || "";
    response.sessionId = authData.sessionid || "";
    response.ver = localStorage.toolbar_name ? (localStorage.toolbar_name + " ") : "";
    response.ver += FC_Settings.version;
    response.toolbar_version = FC_Settings.version;
    for (i = 0; i < compManager.comp.length; i++) {
      if (compManager.comp[i].OnExposeOptInterface) {
        response[compManager.comp[i].type] = compManager.comp[i].OnExposeOptInterface();
      }
    }
    // url substitution
    response["subst"] = {};
    for (i = 0; i < FC_URLSubst.macroes.length; ++i) {
      response["subst"][FC_URLSubst.macroes[i].name] = FC_URLSubst.substitute(FC_URLSubst.macroes[i].name);
    }
    // data localstorage
    response["storage"] = {};
    for (i = 0; i < localStorage.length; i++) {
      if (localStorage.key(i)[0] == "@") {
        response["storage"][localStorage.key(i).substr(1)] = localStorage[localStorage.key(i)];
      }
    }
    for ( var tempVar in browserSessionVariables) {
      response["storage"][tempVar] = browserSessionVariables[tempVar];
    }
    sendResponse(response);
  }

  if (request.initOptions) {
    response = {};
    response.toolbar_version = FC_Settings.version;
    for (i = 0; i < compManager.comp.length; i++) {
      if (compManager.comp[i].OnExposeOptInterface) {
        response[compManager.comp[i].type] = compManager.comp[i].OnExposeOptInterface();
      }
    }
    sendResponse(response);
  }

  if (request.closePopup) {
    if (request.closePopup.id) {
      var bubbleId = request.closePopup.id;
      // UPROMISE-190
      // if md5 hash id, no need to track the bubble component
      // else, need to set close the bubble through that bubble component
      // instead of removing iframe directly
      if (false === /[0-9a-zA-Z]{32}/.test(bubbleId)) {
        for (i = 0; i < compManager.comp.length; i++) {
          if (compManager.comp[i].Element) {
            if (compManager.comp[i].Element.hasOwnProperty(bubbleId)) {
              compManager.comp[i].Element[bubbleId].FCTBCompObj.closeBubble(true);
              bubbleId = null;
              break;
            }
          }
        }
      }
      if (bubbleId) {
        chrome.tabs.getSelected(null, function(tab) {
          chrome.tabs.sendMessage(tab.id, {
            cmd : "closeBubble",
            id : bubbleId
          });
        });
      }
    }
    else {
      chrome.tabs.getSelected(null, function(tab) {
        chrome.tabs.sendMessage(tab.id, {
          cmd : "closeBubble",
          url : request.closePopup.url
        });
      });
    }
    sendResponse({});
  }

  if (request.closeTab) {
    chrome.tabs.remove(sender.tab.id);
    sendResponse({});
  }

  if (request.urlCmd) {
    var processCmd = function(cmd) {
      var detailsUrl = request.urlCmd.url;
      var index = detailsUrl.indexOf(cmd);
      var tailIndex = index + cmd.length;
      if (index > -1 && (tailIndex === detailsUrl.length || "#" === detailsUrl.charAt(tailIndex))) {
        return detailsUrl.replace(cmd, "");
      }
      return "";
    };
    var url;
    if (0 !== (url = processCmd("#mainwindow")).length) {
      loadUrl({
        url : url,
        mode : false
      });
    }
    else if (0 !== (url = processCmd("#close")).length) {
      chrome.tabs.getSelected(null, function(tab) {
        chrome.tabs.sendMessage(tab.id, {
          cmd : "closeBubble",
          url : url
        });
      });
    }
    for (i = 0; i < compManager.comp.length; i++) {
      if (compManager.comp[i].onUrlCmd) {
        compManager.comp[i].onUrlCmd(request.urlCmd.url);
      }
    }
    sendResponse({});
  }

  if (request.getFrameIdForUrl) {
    chrome.tabs.getSelected(null, function(tab) {
      chrome.webNavigation.getAllFrames({
        tabId : tab.id
      }, function(detArr) {
        for ( var i = 0; i < detArr.length; i++) {
          if (detArr[i].url == request.getFrameIdForUrl.url) {
            sendResponse({
              id : detArr[i].frameId
            });
            return true;
          }
        }
        sendResponse({
          id : null
        });
      });
    });
  }

  if (request.customSize) {
    chrome.tabs.getSelected(null, function(tab) {
      chrome.tabs.sendMessage(tab.id, {
        cmd : "customSize",
        url : request.customSize.url,
        size : request.customSize.size
      });
    });
    sendResponse({});
  }

  if (request.component == "toolbar") {
    var responseObj = {
      component : "syncStorage",
      initToolbar : true
    };
    switch (request.cmd) {
      case "SetVariable":
        if (request.temp) {
          browserSessionVariables[request.name] = request.val;
        }
        else {
          FC_IPlugin.obfs_writeToFile("@" + request.name, request.val, false);
        }
        sendResponse(JSON.stringify(responseObj));
        break;
      case "RemoveString":
        delete browserSessionVariables[request.name];
        FC_IPlugin.obfs_RemoveString("@" + request.name);
        sendResponse(JSON.stringify(responseObj));
        break;
    }
  }

  if (request.component && request.cmd) {
    if (request.component === "notifications") {
      // called from setCustomXML of inject.js
      if (request.cmd === "updateBadge") {
        if (typeof (pendingNotificationSettings) !== "undefined") {
          pendingNotificationSettings.badgeText = request.label;
          if (request.label === "" && chrome.app.getDetails().browser_action) {
            chrome.browserAction.setBadgeText({
              text : request.label,
              tabId : sender.tab.id
            });
          }
          sendResponse({
            result : true
          });
        }
        else {
          sendResponse({
            result : false,
            error : new Error("pendingNotificationSettings object not set")
          });
        }
      }
      // called from notif.js try to send a message to content_script.js of active tab to update notifications iframe
      else if (request.cmd === "showNotifications") {
        try {
          adapter.sendMessage({
            component : "notifications",
            cmd : "update-iframe",
            width : request.width,
            height : request.height,
            location : request.location
          });
        } catch (e) {
          sendResponse({
            result : false,
            error : e
          });
        }
      }
      // called from notif.js set a flag on variable pendingNotifcationSettings from ribbon_items.js
      else if (request.cmd === "showPendingNotificationsAlert") {
        if (typeof (pendingNotificationSettings) !== "undefined" && chrome.app.getDetails().browser_action) {
          if (pendingNotificationSettings.badgeColor) {
            try {
              chrome.browserAction.setBadgeBackgroundColor({
                color : pendingNotificationSettings.badgeColor
              });
            } catch (e) {
              sendResponse({
                result : false,
                error : e
              });
              return true;
            }
          }
          chrome.browserAction.setBadgeText({
            text : pendingNotificationSettings.badgeText,
            tabId : sender.tab.id
          });
          sendResponse({
            result : true
          });
        }
        else {
          sendResponse({
            result : false,
            error : new Error("There is no Pending Notification Settings or Browser Action")
          });
        }
      }
      // called from the popup html file try to display pending notifications by sending a message to notif.js in iframe
      else if (request.cmd === "displayPendingClick") {
        try {
          adapter.sendMessage({
            component : "notifications",
            cmd : "display-pending"
          });
        } catch (e) {
          sendResponse({
            result : false,
            error : e
          });
        }
      }
    }
  }

  // chrome newtab page onDOMContentLoaded event
  if (request.onDOMContentLoaded && request.details && request.document) {
    if (request.details.hasOwnProperty("tabId")) {
      getTabById(request.details.tabId).domStatus = true;
      chrome.tabs.get(request.details.tabId, function(tab) {
        if (tab) {
          setCurrentTab(tab, {
            "document" : request.document
          });
          FC_IPlugin.onDOMContentLoaded(tab, request.details);
        }
      });
    }
  }
  return true;
}

// Attach the handler for incoming requests from the content script
chrome.runtime.onMessage.addListener(onBgRequest);

chrome.runtime.onMessageExternal.addListener(function(request, sender, sendResponse) {
  console.log("onRequestExternal");
  if (request.freeecause_toolbar_with_shopping) {
    sendResponse({
      fc : true
    });
  }
  else {
    sendResponse({});
  }
  return true;
});

chrome.management.onInstalled.addListener(function(info) {
  console.log("onInstalled: " + info.id + " -- " + info.name);
  setTimeout(function() {
    chrome.runtime.sendMessage(info.id, {
      freeecause_toolbar_with_shopping : true
    }, function(response) {
      console.log("response");
      if (response && response.fc) {
        localStorage.shopping_disabled = true;
        localStorage.shopping_ext_id = info.id;
      }
    });
  }, 2000);
});

chrome.management.onUninstalled.addListener(function(id) {
  console.log("onUninstalled: " + id);
  selectActiveShopping();
});

var extensionsList;
var activeShoppingExt;

function selectActiveShopping() {
  extensionsList = {};
  chrome.management.getAll(function(ext) {
    for ( var i = 0; i < ext.length; i++) {
      if (ext[i].isApp || !ext[i].enabled) {
        continue;
      }
      if (ext[i].id == chrome.i18n.getMessage('@@extension_id')) {
        extensionsList[ext[i].id] = true;
        continue;
      }
      var ext_id = ext[i].id;
      console.log("send to " + ext_id);
      extensionsList[ext_id] = false;
      chrome.runtime.sendMessage(ext_id, {
        freeecause_toolbar_with_shopping : true
      }, function(response) {
        if (response && response.fc) {
          console.log("fc ext " + ext_id);
          extensionsList[ext_id] = true;
        }
      });
    }
  });

  setTimeout(function() {
    var list = [];
    for ( var id in extensionsList) {
      if (extensionsList[id]) {
        list.push(id);
      }
    }
    list.sort();
    console.log("ext list " + list[0] + " == " + chrome.i18n.getMessage('@@extension_id'));
    if (list[0] == chrome.i18n.getMessage('@@extension_id')) {
      localStorage.shopping_disabled = false;
      localStorage.shopping_ext_id = list[0];
    }
  }, 3000);
}

// TODO: shopping disable priority
function checkActiveShopping() {
  if (!localStorage.shopping_disabled)
    return;
  if (!localStorage.shopping_ext_id || localStorage.shopping_ext_id == "") {
    selectActiveShopping();
    return;
  }
  var extId = localStorage.shopping_ext_id;
  activeShoppingExt = false;

  chrome.runtime.sendMessage(extId, {
    freeecause_toolbar_with_shopping : true
  }, function(response) {
    if (response && response.fc) {

      activeShoppingExt = true;
    }
  });
  setTimeout(function() {
    if (!activeShoppingExt) {
      selectActiveShopping();
    }
  }, 2000);
}

chrome.webRequest.onBeforeRequest.addListener(function(details) {
  if (details.url.indexOf("#") == -1) {
    return;
  }
  var cancel = false;
  var processCmd = function(cmd) {
    // good format: --> to return
    // 1) http://example.com/#mainwindow --> http://example.com/
    // 2) http://example.com/#elm/dosomething#mainwindow --> http://example.com/#elm/dosomething
    // 3) http://example.com/#mainwindow#cmd2#cmd3 --> http://example.com/#cmd2#cmd3
    // bad format:
    // 4) http://example.com/#mainwindowcmd --> unrecognized command
    // 5) http://example.com/#mainwindow/extrabucks --> unaccepted command place
    var detailsUrl = details.url;
    var index = detailsUrl.indexOf(cmd);
    var tailIndex = index + cmd.length;
    if (index > -1 && (tailIndex === detailsUrl.length || "#" === detailsUrl.charAt(tailIndex))) {
      return detailsUrl.replace(cmd, "");
    }
    return "";
  };
  var url;
  if (0 !== (url = processCmd("#mainwindow")).length) {
    loadUrl({
      url : url,
      mode : false
    });
  }
  else if (processCmd("#close")) {
    chrome.tabs.getSelected(null, function(tab) {
      chrome.tabs.sendMessage(tab.id, {
        cmd : "closeBubble",
        frameId : details.frameId
      });
    });
  }
  for (i = 0; i < compManager.comp.length; i++) {
    if (compManager.comp[i].onUrlCmd) {
      if (compManager.comp[i].onUrlCmd(details.url)) {
        cancel = true;
      }
    }
  }
  return {
    cancel : cancel
  };
}, {
  urls : [ "<all_urls>" ]
}, [ "blocking" ]);


chrome.webRequest.onBeforeRequest.addListener(function(details) {
  return FC_IPlugin.onBeforeRequest(details);
}, {
  urls : [ "<all_urls>" ]
}, [ "blocking" ]);


chrome.webRequest.onBeforeRedirect.addListener(function(details) {
  return FC_IPlugin.onBeforeRedirect(details);
}, {
  urls : [ "<all_urls>" ],
  types : [ "main_frame" ]
});


chrome.webRequest.onBeforeSendHeaders.addListener(function(details) {
  return FC_IPlugin.onBeforeSendHeaders(details);
}, {
  urls : [ "<all_urls>" ]
}, [ "requestHeaders", "blocking" ]);


function setCurrentTab(tab, pageData) {
  try {
    var cur_tab = gBrowser.tabs[tab.id];
    if (!cur_tab) {
      cur_tab = {
        id : tab.id
      };
      gBrowser.tabs[tab.id] = cur_tab;
    }
    if (pageData) {
      cur_tab.pageData = pageData;
      window._content = pageData;
    }
    else {
      window._content = cur_tab.pageData;
    }
    gBrowser.mCurrentTab = cur_tab;
  } catch (e) {
    FC_Debugtestshoppinguuid.L("setCurrentTab:" + e);
  }
}

function getTabByObj(tab) {
  try {
    var cur_tab = gBrowser.tabs[tab.id];
    if (!cur_tab) {
      cur_tab = {
        id : tab.id
      };
      gBrowser.tabs[tab.id] = cur_tab;
    }
    return cur_tab;
  } catch (e) {
    FC_Debugtestshoppinguuid.L("getTabByObj:" + e);
  }
}

function getTabById(tabId) {
  try {
    var cur_tab = gBrowser.tabs[tabId];
    if (!cur_tab) {
      cur_tab = {
        id : tabId
      };
      gBrowser.tabs[tabId] = cur_tab;
    }
    return cur_tab;
  } catch (e) {
    FC_Debugtestshoppinguuid.L("getTabById:" + e);
  }
}

chrome.tabs.onActivated.addListener(function(activeInfo) {
  if (activeInfo && activeInfo.tabId >= 0) {
    var tabId = activeInfo.tabId;
    chrome.tabs.get(tabId, function(tab) {
      try {
        console.log("tab selected: " + tab.url + " tab id = " + tabId);
        gBrowser.currentUrl = tab.url;
        if (getTabById(tab.id).pageData) {
          setCurrentTab(tab);
          FC_IPlugin.onTabSelected(tab.url, tab);
        }
        else {
          chrome.tabs.sendMessage(tab.id, {
            type : "get",
            data : "document"
          }, function(response) {
            if (response && response.value) {
              setCurrentTab(tab, {
                "document" : response.value
              });
            }
            else {
              setCurrentTab(tab, {
                "document" : {
                  location : {
                    host : "",
                    href : "about:blank"
                  },
                  referrer : "",
                  url : "about:blank"
                }
              });
            }
            FC_IPlugin.onTabSelected(tab.url, tab);
          });
        }
      } catch (e) {
      }
    });
  }
});

var liveTabs = {};

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (tab.active) {
    console.log("tabs.onUpdated url = " + tab.url);
    gBrowser.currentUrl = tab.url;

  }
  if (changeInfo && "complete" == changeInfo.status) {
    // chrome prerendering would change tab id and tab url
    // so updating liveTabs in case of any updating or newly adding
    liveTabs[tabId] = {
      'status' : true,
      'tabObj' : tab
    }
  }
});

chrome.tabs.onCreated.addListener(function(tab) {
  console.log("tab created: " + tab.id);
  liveTabs[tab.id] = {
    'status' : true,
    'tabObj' : tab
  };
});

chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
  console.log("tab deleted: " + tabId);
  if (tabId >= 0 && liveTabs[tabId]) {
    liveTabs[tabId].status = false;
    if (rlClosedTabs) {
      rlClosedTabs.add(liveTabs[tabId].tabObj);
    }
    delete liveTabs[tabId];
  }
});

chrome.webNavigation.onBeforeNavigate.addListener(function(details) {
  if (!details || details.frameId != 0) {
    return;
  }
  if (details.tabId >= 0) {
    getTabById(details.tabId).pageData = false;
    getTabById(details.tabId).domStatus = false;
    FC_IPlugin.onBeforeNavigate(details);
  }
  else {
    console.log("chrome webNavigation onBeforeNavigate listener return invalid tabId tab = ", details);
    return;
  }
});

chrome.webNavigation.onDOMContentLoaded.addListener(function(details) {
  if (!details || details.frameId != 0) {
    return;
  }
  // console.log("onDOMContentLoaded url = " + details.url);
  getTabById(details.tabId).domStatus = true;
  if (details.tabId >= 0) {
    chrome.tabs.get(details.tabId, function(tab) {
      if (tab) {
        chrome.tabs.sendMessage(tab.id, {
          type : "get",
          data : "document"
        }, function(response) {
          // console.log("URL from content script: " + response.value.url);
          if (tab.active && response) {
            setCurrentTab(tab, {
              "document" : response.value
            });
          }
          FC_IPlugin.onDOMContentLoaded(tab, details);
        });
      }
    });
  }
  else {
    console.log("chrome webNavigation onDOMContentLoaded listener return invalid tabId tab = ", details);
    return;
  }
});

// MANIFEST 2 - Adding onCompleted event to background that will trigger plugin
// components' onCompleted event
chrome.webNavigation.onCompleted.addListener(function(details) {
  if (details && details.tabId >= 0) {
    chrome.tabs.get(details.tabId, function(tab) {
      if (tab) {
        FC_IPlugin.onCompleted(tab, details);
      }
    });
  }
  else {
    console.log("chrome webNavigation onCompleted listener return invalid tabId tab = ", details);
    return;
  }
});

function loadUrl(request) {
  var p = new Object();
  p.url = request.url;
  if (request.mode == true) {
    chrome.tabs.create(p);
  }
  else if (request.mode == false) {
    var tabId = (request.tabId) ? request.tabId : null;
    if (tabId == null) {
      //not tabId passed, use the current tab
      chrome.tabs.getSelected(null, function(tab) {
        chrome.tabs.update(tab.id, p);
      });
    }
    else
      chrome.tabs.update(tabId, p);
  }
}
