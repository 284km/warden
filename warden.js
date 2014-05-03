// Generated by CoffeeScript 1.7.1
(function() {
  "use strict";
  var Warden, find,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  Warden = (function() {
    function Warden(opts) {
      this.match = __bind(this.match, this);
      this.navigate = __bind(this.navigate, this);
      this.findController = __bind(this.findController, this);
      this.context = __bind(this.context, this);
      this.get = __bind(this.get, this);
      this.trigger = __bind(this.trigger, this);
      var _ref;
      this.pushState = (_ref = opts != null ? opts.pushState : void 0) != null ? _ref : false;
      if (this.pushState === true) {
        throw 'Sorry, push state is not working yet';
      }
      this.events = {};
      this.params = [];
      this.state = null;
      this.version = '0.4.1';
      this.anchor = {
        defaultHash: window.location.hash,
        get: function() {
          if (window.location.hash) {
            return window.location.hash.split('#')[1];
          } else {
            return '';
          }
        },
        set: function(anchor) {
          window.location.hash = !anchor ? '' : anchor;
          return this;
        },
        clear: function() {
          return this.set(false);
        },
        reset: function() {
          return this.set(this.defaultHash);
        }
      };
      if (this.pushState) {
        debugger;
        if (typeof window.onpopstate === 'function') {
          this.on('popstate', window.onpopstate);
        }
        this.ready = true;
        window.onpopstate = (function(_this) {
          return function() {
            if (_this.ready) {
              _this.ready = false;
              console.log('popstate here');
              return _this.trigger('popstate');
            }
          };
        })(this);
      } else {
        if (typeof window.onhashchange === 'function') {
          this.on('hashchange', window.onhashchange);
        }
        window.addEventListener('hashchange', (function(_this) {
          return function() {
            return _this.trigger('hashchange');
          };
        })(this));
      }
      this.trigger('initialized');
    }

    Warden.prototype.trigger = function(event) {
      var fn, key, params, _ref;
      params = Array.prototype.slice.call(arguments, 1);
      if (this.events[event]) {
        _ref = this.events[event];
        for (key in _ref) {
          fn = _ref[key];
          fn.apply(null, params);
        }
      }
      return this;
    };

    Warden.prototype.get = function(route, handler) {
      var invoke, keys, regex;
      keys = [];
      regex = Warden.regexRoute(route, keys);
      invoke = (function(_this) {
        return function() {
          var event, key, match, req, val, _ref;
          match = _this.anchor.get().match(regex);
          if (match) {
            event = {
              route: route,
              value: _this.anchor.get(),
              handler: handler,
              params: _this.params,
              regex: match,
              propagateEvent: true,
              previousState: _this.state,
              preventDefault: function() {
                return this.propagateEvent = false;
              }
            };
            _this.trigger('match', event);
            if (!event.propagateEvent) {
              return _this;
            }
            _this.state = event;
            req = {
              params: {},
              keys: keys,
              matches: event.regex.slice(1)
            };
            _ref = req.matches;
            for (key in _ref) {
              val = _ref[key];
              req.params[key] = value ? decodeURIComponent(value) : void 0;
            }
            handler.call(_this, req, event);
          }
          return _this;
        };
      })(this);
      return invoke().on('initialized hashchange popstate', invoke);
    };

    Warden.prototype.on = function(event, handler) {
      var events, _i, _len;
      events = event.split(' ');
      for (_i = 0, _len = events.length; _i < _len; _i++) {
        event = events[_i];
        if (this.events[event]) {
          this.events[event].push(handler);
        } else {
          this.events[event] = [handler];
        }
      }
      return this;
    };

    Warden.prototype.context = function(context) {
      return (function(_this) {
        return function(value, callback) {
          var pattern, prefix;
          prefix = context.slice(-1) !== '/' ? context + '/' : context;
          pattern = prefix + value;
          return _this.get.call(_this, pattern, callback);
        };
      })(this);
    };

    Warden.regexRoute = function(path, keys, sensitive, strict) {
      if (path instanceof RegExp) {
        return path;
      }
      if (path instanceof Array) {
        path = '(' + path.join('|') + ')';
      }
      path = path.concat(strict ? '' : '/?').replace(/\/\(/g, '(?:/').replace(/\+/g, '__plus__').replace(/(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?/g, function(_, slash, format, key, capture, optional) {
        keys.push({
          name: key,
          optional: !!optional
        });
        slash = slash || '';
        return '' + (optional ? '' : slash) + '(?:' + (optional ? slash : '') + (format || '') + (capture || (format && '([^/.]+?)' && '([^/]+?)')) + ')' + (optional || '');
      }).replace(/([\/.])/g, '\\$1').replace(/__plus__/g, '(.+)').replace(/\*/g, '(.*)');
      return new RegExp('^' + path + '$', sensitive ? '' : 'i');
    };

    Warden.prototype.findController = function(controllerName) {
      return require("controllers/" + controllerName + "-controller");
    };

    Warden.navigate = function(path, pushState) {
      if (pushState == null) {
        pushState = false;
      }
      path = path.replace(/#|\//, '');
      if (pushState) {
        return history.pushState({}, "", '/' + path);
      } else {
        return location.href = '#' + path;
      }
    };

    Warden.prototype.navigate = function(path) {
      return Warden.navigate(path, this.pushState);
    };

    Warden.prototype.match = function(route, requirement) {
      var Controller, action, actionName, continueAnyway, controllerName, _ref;
      _ref = requirement.split('#'), controllerName = _ref[0], actionName = _ref[1];
      Controller = this.findController(controllerName);
      continueAnyway = function(maybePromise, next) {
        var _ref1;
        return (_ref1 = maybePromise != null ? typeof maybePromise.then === "function" ? maybePromise.then(next) : void 0 : void 0) != null ? _ref1 : next();
      };
      action = (function(_this) {
        return function(req) {
          var lastController, _ref1, _ref2;
          lastController = (_ref1 = _this.currentController) != null ? _ref1 : {};
          _this.currentController = new Controller({
            pushState: _this.pushState
          });
          _this.currentController.setLastUsings((_ref2 = lastController.usings) != null ? _ref2 : []);
          return continueAnyway(_this.currentController.beforeAction(req), function() {
            return continueAnyway(_this.currentController[actionName](req), function() {
              _this.currentController.fix();
              return continueAnyway(typeof lastController.dispose === "function" ? lastController.dispose() : void 0, function() {
                return continueAnyway(_this.currentController.afterAction(req), function() {
                  return _this.ready = true;
                });
              });
            });
          });
        };
      })(this);
      return this.get(route, action);
    };

    return Warden;

  })();

  find = function(list, fn) {
    var i, _i, _len;
    for (_i = 0, _len = list.length; _i < _len; _i++) {
      i = list[_i];
      if (fn(i)) {
        return i;
      }
    }
    return null;
  };

  Warden.Controller = (function() {
    function Controller(opts) {
      this.dispose = __bind(this.dispose, this);
      this.navigate = __bind(this.navigate, this);
      this.reuse = __bind(this.reuse, this);
      var _ref;
      this.pushState = (_ref = opts != null ? opts.pushState : void 0) != null ? _ref : false;
      this.fixed = false;
      this.lastUsings = [];
      this.usings = [];
    }

    Controller.prototype.setLastUsings = function(lastUsings) {
      this.lastUsings = lastUsings;
    };

    Controller.prototype.reuse = function(cls) {
      var used;
      if (this.fixed) {
        throw 'Post initialized reuse exception';
      }
      if (!cls.constructor) {
        throw 'not newable';
      }
      used = find(this.lastUsings, function(used) {
        return used.constructor === cls;
      });
      return this.usings.push(used != null ? used : new cls);
    };

    Controller.prototype.use = function(cls) {
      return this.usings.push(new cls);
    };

    Controller.prototype.navigate = function(path) {
      return Warden.navigate(path, this.pushState);
    };

    Controller.prototype.fix = function() {
      var alsoUsed, currentUsedList, used, _i, _len, _ref;
      currentUsedList = [];
      _ref = this.lastUsings;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        used = _ref[_i];
        alsoUsed = find(this.usings, (function(_this) {
          return function(using) {
            return using.constructor === used.constructor;
          };
        })(this));
        if (!alsoUsed) {
          used.dispose();
          this.lastUsings.splice(this.lastUsings.indexOf(used), 1);
        }
      }
      this.fixed = true;
      return delete this.lastUsings;
    };

    Controller.prototype.dispose = function() {
      return delete this.usings;
    };

    Controller.prototype.beforeAction = function(req) {};

    Controller.prototype.afterAction = function(req) {};

    return Controller;

  })();

  if ('function' === typeof window.define) {
    window.define(function(require) {
      return Warden;
    });
  } else if ('object' === typeof exports) {
    module.exports = Warden;
  } else {
    window.Warden = Warden;
  }

}).call(this);