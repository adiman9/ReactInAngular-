import {SvgImageDir} from "./src/directives/svg-image-dir.js";
import {InlineReplaceDir} from "./src/directives/inline-replace-dir.js";

import {UiendSvc} from "./src/services/uiend-svc.js";
import {SvgCacheSvc} from "./src/services/svg-cache-svc.js";
import {UrlsSvc} from "./src/services/urls-svc.js";
import {AuthSvc} from "./src/services/auth-svc.js";

import {HomeCtrl} from "./src/controllers/home-ctrl.js";

import {ReactApp} from './src/directives/react-app.js';

var _ = window._;
var $ = window.$;

// --------------------------------------------------------------------------
// Angular app setup
// --------------------------------------------------------------------------

//
// Important: It is necessary to export this in order to get the minification
// process to work correctly. In minification, a new file main.js is
// generated which does `import {app} from "./app.js"` and pre-populates
// the app's template cache.
// See the `prod` target in gulpfile.js
//
export var app = window.app = window.angular.module("App", []);

// --------------------------------------------------------------------------
// Routing table
// --------------------------------------------------------------------------

app.config(function($routeProvider, $locationProvider, $httpProvider) {
  $locationProvider.html5Mode(true);
  $httpProvider.useApplyAsync(true);
  $routeProvider.when("/", {
    templateUrl: "src/dom/home.html",
    controller: "Home"
  });
  $routeProvider.otherwise({
    templateUrl: "src/dom/not-found.html",
    controller: "NotFound"
  });
});

// --------------------------------------------------------------------------
// Directives
// --------------------------------------------------------------------------

app.directive('svgImage', SvgImageDir);
app.directive('inlineReplace', InlineReplaceDir);
app.directive('reactApp', ReactApp);

// --------------------------------------------------------------------------
// Services
// --------------------------------------------------------------------------

app.service("uiend_svc", UiendSvc);
app.service('svg_cache_svc', SvgCacheSvc);
app.service("urls_svc", UrlsSvc);
app.service("auth_svc", AuthSvc);

// core svc that abstracts uses of $timeout, $apply, $applyAsync
// Only use $timeout when there is an actual need for delayed computation.
// If it's just to get angular to do a digest, call `monitor_svc.digest()`
// instead.
app.factory("monitor_svc", function($rootScope) {
  return {
    digest: $rootScope.$applyAsync.bind($rootScope)
  };
});

// --------------------------------------------------------------------------
// Controllers
// --------------------------------------------------------------------------

// 404 Controller
app.controller("NotFound", function NotFoundCtrl() {});
app.controller("Home", HomeCtrl);

// --------------------------------------------------------------------------
// Start the app.
// --------------------------------------------------------------------------

app.run(() => console.log('Headspin starting.'));
window.angular.element(document).ready(() => {
  window.angular.bootstrap(document, ["ngRoute", "App"]);
});
