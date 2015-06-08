(function(window) {

"use strict";


/**
 * Polyfilling missing features from ES5 and selected features from ES6.
 * Some of these are implemented weakly and should be used with caution
 * (See Map, Set and WeakMap).
 * TODO: Remove Set, Map and WeakMap!
 * TODO: Object.is and friends
 */
(function polyfilla() {

	/**
	 * Extend one object with another.
	 * @param {object} what Native prototype
	 * @param {object} whit Extension methods
	 */
	function extend(what, whit) {
		Object.keys(whit).forEach(function(key) {
			var def = whit[key];
			if (what[key] === undefined) {
				if (def.get && def.set) {
					// TODO: look at element.dataset polyfill (iOS?)
				} else {
					what[key] = def;
				}
			}
		});
	}

	/**
	 * Patching `String.prototype`
	 */
	function strings() {
		extend(String.prototype, {
			trim: function() {
				return this.trimLeft().trimRight();
			},
			trimRight: function() {
				return this.replace(/\s+$/,'');
			},
			trimLeft: function() {
				return this.replace(/^\s*/, "");
			},
			repeat: function(n) {
				return new Array(n + 1).join(this);
			},
			startsWith: function(sub) {
				return this.indexOf(sub) === 0;
			},
			endsWith: function(sub) {
				sub = String(sub);
				var i = this.lastIndexOf(sub);
				return i >= 0 && i === this.length - sub.length;
			},
			contains: function() { // they changed it :/
				console.warn('String.prototype.contains is deprecated. You can use String.prototype.includes');
				return this.includes.apply(this, arguments);
			},
			includes: function() {
				return String.prototype.indexOf.apply(this, arguments) !== -1;
			},
			toArray: function() {
				return this.split("");
			}
		});
	}

	/**
	 * Patching arrays.
	 */
	function arrays() {
		extend(Array, {
			every: function every(array, fun, thisp) {
				var res = true,
					len = array.length >>> 0;
				for (var i = 0; i < len; i++) {
					if (array[i] !== undefined) {
						if (!fun.call(thisp, array[i], i, array)) {
							res = false;
							break;
						}
					}
				}
				return res;
			},
			forEach: function forEach(array, fun, thisp) {
				var len = array.length >>> 0;
				for (var i = 0; i < len; i++) {
					if (array[i] !== undefined) {
						fun.call(thisp, array[i], i, array);
					}
				}
			},
			map: function map(array, fun, thisp) {
				var m = [],
					len = array.length >>> 0;
				for (var i = 0; i < len; i++) {
					if (array[i] !== undefined) {
						m.push(fun.call(thisp, array[i], i, array));
					}
				}
				return m;
			},
			filter: function map(array, fun, thisp) {
				return Array.prototype.filter.call(array, fun, thisp);
			},
			isArray: function isArray(o) {
				return Object.prototype.toString.call(o) === "[object Array]";
			},
			concat: function(a1, a2) {
				function map(e) {
					return e;
				}
				return this.map(a1, map).concat(this.map(a2, map));
			}
		});
	}

	/**
	 * Patching `Function.prototype` (something about iOS)
	 */
	function functions() {
		extend(Function.prototype, {
			bind: function bind(oThis) {
				if (typeof this !== "function") {
					throw new TypeError("Function bind not callable");
				}
				var fSlice = Array.prototype.slice,
					aArgs = fSlice.call(arguments, 1),
					fToBind = this,
					Fnop = function() {},
					fBound = function() {
						return fToBind.apply(
							this instanceof Fnop ? this : oThis || window,
							aArgs.concat(fSlice.call(arguments))
						);
					};
				Fnop.prototype = this.prototype;
				fBound.prototype = new Fnop();
				return fBound;
			}
		});
	}

	/**
	 * TODO: investigate support for Object.getPrototypeOf(window)
	 */
	function globals() {
		extend(window, {
			console: {
				log: function() {},
				debug: function() {},
				warn: function() {},
				error: function() {}
			}
		});
	}

	/**
	 * Patching cheap DHTML effects with super-simplistic polyfills.
	 * TODO: use MessageChannel pending moz bug#677638
	 * @see http://www.nonblocking.io/2011/06/windownexttick.html
	 * @param [Window} win
	 */
	function effects() {
		extend(window, {
			requestAnimationFrame: (function() {
				var func =
					window.requestAnimationFrame ||
					window.webkitRequestAnimationFrame ||
					window.mozRequestAnimationFrame ||
					window.oRequestAnimationFrame ||
					window.msRequestAnimationFrame ||
					(function() {
						var lastTime = 0;
						return function(callback, element) {
							var currTime = new Date().getTime();
							var timeToCall = Math.max(0, 16 - (currTime - lastTime));
							var id = window.setTimeout(function() {
									callback(currTime + timeToCall);
								},
								timeToCall);
							lastTime = currTime + timeToCall;
							return id;
						};
					}());
				return func;
			})(),
			cancelAnimationFrame: (function() {
				return (
					window.cancelAnimationFrame ||
					window.webkitCancelAnimationFrame ||
					window.mozCancelAnimationFrame ||
					window.oCancelAnimationFrame ||
					window.msCancelAnimationFrame ||
					clearTimeout
				);
			}()),
			/*
			 * TODO: Internalize into gui.Tick
			 * TODO: Move to MessageChannel!!!
			 */
			setImmediate: (function() {
				var list = [],
					handle = 1;
				var name = "spiritual:emulated:setimmediate";
				window.addEventListener("message", function(e) {
					if (e.data === name && list.length) {
						list.shift().apply(window);
						e.stopPropagation();
					}
				}, false);
				return function emulated(func) {
					list.push(func);
					window.postMessage(name, "*");
					return handle++;
				};
			})()
		});
	}

	/**
	 * Alias methods plus IE and Safari mobile patches.
	 */
	function extras() {
		extend(console, {
			debug: console.log
		});
		extend(XMLHttpRequest.prototype, {
			overrideMimeType: function() {}
		});
		extend(XMLHttpRequest, {
			UNSENT: 0,
			OPENED: 1,
			HEADERS_RECEIVED: 2,
			LOADING: 3,
			DONE: 4
		});
	}

	/**
	 * Skip selected polyfills in worker context.
	 */
	(function fill(isWorker) {
		strings();
		arrays();
		functions();
		globals();
		extras();
		if (!isWorker) {
			effects();
		}
	}(false));

}());



/**
 * Create the primordial namespace.
 * @using {ts.gui.Namespace} Namespace
 */
window.gui = (function using(Namespace) {

	return new Namespace('gui', {
		
		/**
		 * Export as `gui.Namespace`.
		 * @type {constructor}
		 */
		Namespace: Namespace,

		/**
		 * TODO: Current version (should be injected during build process).
		 * @see https://www.npmjs.org/package/grunt-spiritual-build
		 * @type {string} (majorversion.minorversion.patchversion)
		 */
		version: '-1.0.0',

		/**
		 * Flag general debug mode.
		 * @type {boolean}
		 */
		debug: false,

		/**
		 * @TODO: This ain't up to date no more...
		 * @TODO: leave the URL alone a see if we can postMessage these things just in time...
		 * The {gui.IframeSpirit} will stamp this querystring parameter into any URL it loads.
		 * The value of the parameter matches the iframespirits '$contextid'. Value becomes the
		 * '$contextid' of the local 'gui' object (a {gui.Spiritual} instance). This establishes
		 * a relation between iframe and hosted document that can be used for xdomain stuff.
		 * @type {string}
		 */
		PARAM_CONTEXTID: 'gui-contextid',
		PARAM_XHOST: 'gui-xhost',

		/*
		 * Local broadcasts
		 */
		BROADCAST_TODOM: 'gui-broadcast-todom',
		BROADCAST_ONDOM: 'gui-broadcast-ondom',
		BROADCAST_TOLOAD: 'gui-broadcast-toload',
		BROADCAST_ONLOAD: 'gui-broadcast-onload',
		BROADCAST_TOUNLOAD: 'gui-broadcast-tounload',
		BROADCAST_ONUNLOAD: 'gui-broadcast-unload',
		BROADCAST_WILL_UNLOAD: 'gui-broadcast-will-unload', // deprecated

		/**
		 * Global broadcasts (TODO: stamp GLOBAL in there)
		 * TODO: harmonize some naming with action types
		 */
		BROADCAST_MOUSECLICK: 'gui-broadcast-mouseevent-click',
		BROADCAST_MOUSEMOVE: 'gui-broadcast-mouseevent-mousemove',
		BROADCAST_MOUSEDOWN: 'gui-broadcast-mouseevent-mousedown',
		BROADCAST_MOUSEUP: 'gui-broadcast-mouseevent-mouseup',
		BROADCAST_SCROLL: 'gui-broadcast-window-scroll',
		BROADCAST_RESIZE: 'gui-broadcast-window-resize',
		BROADCAST_RESIZE_END: 'gui-broadcast-window-resize-end',
		BROADCAST_POPSTATE: 'gui-broadcast-window-popstate',
		BROADCAST_HASHCHANGE: 'gui-broadcast-window-hashchange',
		BROADCAST_ORIENTATIONCHANGE: 'gui-broadcast-orientationchange',
		BROADCAST_TWEEN: 'gui-broadcast-tween',
		

		/** 
		 * Global actions
		 */
		ACTION_DOC_ONDOMCONTENT: 'gui-action-document-domcontent',
		ACTION_DOC_ONLOAD: 'gui-action-document-onload',
		ACTION_DOC_ONHASH: 'gui-action-document-onhash',
		ACTION_DOC_UNLOAD: 'gui-action-document-unload',

		/**
		 * Timeout in milliseconds before we decide that user is finished resizing the window.
		 */
		TIMEOUT_RESIZE_END: 250,

		/**
		 * Device orientation.
		 * TODO: Get this out of here, create gui.Device or something
		 */
		orientation: 0,
		ORIENTATION_PORTRAIT: 0,
		ORIENTATION_LANDSCAPE: 1,

		/**
		 * Uniquely identifies this instance of `gui` knowing 
		 * that other instances may exist in iframes.
		 * @type {String}
		 */
		$contextid: null,

		/**
		 * Usually the window object. Occasionally a web worker scope.
		 * TODO: Figure out if it's safe to deprecate this nowadays
		 * @type {GlobalScope}
		 */
		context: window,

		/**
		 * The {gui.Document} knows more about this whole browser environment.
		 * @type {gui.Document}
		 */
		document: null,

		/**
		 * Running inside an iframe?
		 * @type {boolean}
		 */
		hosted: false,

		/**
		 * Cross domain origin of containing iframe if:
		 *
		 * 1. We are loaded inside a {gui.IframeSpirit}
		 * 2. Containing document is on an external host
		 * @type {String} eg. `http://parenthost.com:8888`
		 */
		xhost: '*', // hardcoded for now!

		/**
		 * Flipped by the {gui.Guide}. TODO: Don't rely on that guy here!
		 * @type {boolean}
		 */
		initialized: false,

		/**
		 * Window is unloading?
		 * @type {boolean}
		 */
		unloading: false,

		/**
		 * Do something before the spirits get here. 
		 * if that's already too late, just do it now.
		 * @param @optional {function} action
		 * @param @optional {object} thisp
		 * @returns {boolean} True when ready already
		 */
		init: function(action, thisp) {
			var is = this.initialized;
			if (arguments.length) {
				if (is) {
					action.call(thisp);
				} else {
					this._initcallbacks = this._initcallbacks || [];
					this._initcallbacks.push(function() {
						if (gui.debug) {
							try {
								action.call(thisp);
							} catch (exception) {
								console.error(action.toString());
								throw exception;
							}
						} else {
							action.call(thisp);
						}
					});
				}
			}
			return is;
		},

		/**
		 * The `ready` method get's expanded in 
		 * core-spirits@wunderbyte.com (it runs 
		 * when spirits are all ready) but for 
		 * now we'll just alias it to `init`. 
		 * @param @optional {function} action
		 * @param @optional {object} thisp
		 * @returns {boolean} True when ready already
		 */
		ready: function(action, thisp) {
			return this.init(action, thisp);
		},

		/**
		 * Register module.
		 * @param {String} name
		 * @param {object} module
		 * @returns {gui.Module}
		 */
		module: function(name, module) {
			var Module;
			if (gui.Type.isString(name) && name.length) {
				Module = gui.Module.extend(name, module || {});
				module = gui.Module.$register(new Module(name));
				return module;
			} else {
				throw new Error("Module needs an identity token");
			}
		},

		/**
		 * Has module registered?
		 * @param {String} name Module name
		 * @returns {boolean}
		 */
		hasModule: function(name) {
			return gui.Module.$hasModule(name);
		},

		/**
		 * List registered namespaces.
		 * TODO: Move to {gui.Namespace}
		 * @returns {Array<string>}
		 */
		namespaces: function() {
			return Namespace.namespaces.map(function(ns) {
				return ns.$ns;
			});
		},

		/**
		 * TODO: Something about this.
		 * TODO: Move to {gui.Namespace}
		 */
		spacenames: function() {
			Namespace.namespaces.forEach(function(ns) {
				ns.spacename();
			});
		},

		/**
		 * Declare namespace. Optionally add members.
		 * @param {String} ns
		 * @param {Map<String,object>} members
		 * @returns {gui.Namespace}
		 */
		namespace: function(ns, members) {
			var no;
			if (gui.Type.isString(ns)) {
				no = gui.Object.lookup(ns);
				no = new gui.Namespace(ns);
				no = gui.Object.assert(ns, no);
			} else {
				throw new TypeError("Expected a namespace string");
			}
			return gui.Object.extend(no, members || {});
		},

		/**
		 * Broadcast something globally. Events will be wrapped in an EventSummary.
		 * @param {String} message gui.BROADCAST_MOUSECLICK or similar
		 * @param @optional {object} arg This could well be a MouseEvent
		 */
		broadcastGlobal: function(msg, arg) {
			if (gui.Type.isEvent(arg)) {
				arg = new gui.EventSummary(arg);
			}
			gui.Broadcast.dispatchGlobal(msg, arg);
		},


		// Private .................................................................

		/**
		 * @type {Array<function>}
		 */
		_initcallbacks: null,

		/**
		 * Invoked at parse time (so right now).
		 */
		_exist: function() {
			this.hosted = window !== parent;
			this.$contextid = 'key' + Math.random().toString().slice(2, 11);
			if (this.hosted) { // TODO: get rid of this stuff!
				this.xhost = "*";
			}
			return this;
		},

		// Privileged ..............................................................

		/**
		 * Initialize all the things that did 'gui.init(callback)' during boot.
		 * Called on 'DOMContentLoaded' by the {gui.Document}.
		 */
		$initialize: function() {
			this.spacenames(); // TODO: get this out of here
			this.initialized = true;
			var list = this._initcallbacks;
			if (list) {
				while (list.length) {
					list.shift()();
				}
				this._initcallbacks = null;
			}
		},

		/**
		 * Instigate shutdown procedure. This usually happens on `window.unload` but
		 * may have to be invoked manually in Chrome packaged apps (pending a fix for
		 * https://code.google.com/p/chromium/issues/detail?id=167824).
		 * Called by the {gui.Document} on 'window.unload'
		 * @see {gui.Document._onunload}
		 */
		$shutdown: function() {
			this.unloading = true;
		},
		
	})._exist();


}((function() { // ad hoc namespace mechanism ..................................

	/**
	 * When the first namespace `gui` has been instantiated, 
	 * this will become exposed publically as `gui.Namespace`.
	 * TODO: Let's remember to check for namespace collions!
	 * @param {string} ns
	 * @param @optional {object} members
	 */
	function Namespace(ns, members) {
		Namespace.namespaces.push(this);
		this.$ns = ns;
		if (members) {
			Object.keys(members).forEach(function(key) {
				Object.defineProperty(this, key,
					Object.getOwnPropertyDescriptor(members, key)
				);
			}, this);
		}
	}

	Namespace.namespaces = [];
	Namespace.prototype = {

		/**
		 * Namespace string.
		 * @type {String}
		 */
		$ns: null,

		/**
		 * Identification.
		 * @returns {String}
		 */
		toString: function() {
			return "[namespace " + this.$ns + "]";
		},

		/**
		 * Compute classnames for class-type members.
		 * @returns {gui.Namespace}
		 */
		spacename: function() {
			this._spacename(this, this.$ns);
			return this;
		},

		/**
		 * Name members recursively.
		 * @param {object|function} o
		 * @param {String} name
		 */
		_spacename: function(o, name) {
			gui.Object.each(o, function(key, value) {
				if (key !== "$superclass" && gui.Type.isConstructor(value)) {
					if (value.$classname === gui.Class.ANONYMOUS) {
						Object.defineProperty(value, '$classname', {
							value: name + "." + key,
							enumerable: true,
							writable: false
						});
						this._spacename(value, name + "." + key);
					}
				}
			}, this);
		}
	};

	return Namespace;

}())));



/**
 * Generating keys for unique key purposes.
 */
gui.KeyMaster = {

	/**
	 * Generate random key. Not simply incrementing a counter in order to celebrate the
	 * rare occasion that subjects might be uniquely identified across different domains.
	 * @returns {String}
	 */
	generateKey: function() {
		var ran = Math.random().toString();
		var key = 'key' + ran.slice(2, 11);
		if (this._keys[key]) {
			key = this.generateKey();
		} else {
			this._keys[key] = true;
		}
		return key;
	},

	/**
	 * Generate GUID. TODO: Verify integrity of this by mounting result in Java or something.
	 * @see http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
	 * @returns {String}
	 */
	generateGUID: function() {
		return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
			var r = Math.random() * 16 | 0,
				v = c === "x" ? r : (r & 0x3 | 0x8);
			return v.toString(16);
		}).toLowerCase();
	},

	/**
	 * String appears to be a generated key? We don't look it up in the key cache,
	 * so this method can be used to check a key that was generated in old session.
	 * @param {String} string
	 * @returns {boolean}
	 */
	isKey: function(string) {
		var hit = null,
			looks = false;
		if (gui.Type.isString(string)) {
			hit = this.extractKey(string);
			looks = hit && hit[0] === string;
		}
		return looks;
	},

	/**
	 * Extract (potential) key from string.
	 * TODO: Rename 'extractKeys' (multiple)
	 * @param {string} string
	 * @returns {Array<string>}
	 */
	extractKey: function(string) {
		return (/key\d{9}/).exec(string);
	},


	// Private ...................................................................

	/**
	 * Tracking generated keys to prevent doubles.
	 * @type {Map<String,boolean>}
	 */
	_keys: Object.create(null)
};



/**
 * Working with objects.
 */
gui.Object = {

	/**
	 * Object.create with default property descriptors.
	 * @see http://wiki.ecmascript.org/doku.php?id=strawman:define_properties_operator
	 * @param {object} proto
	 * @param {object} props
	 */
	create: function(proto, props) {
		var resolved = {};
		Object.keys(props).forEach(function(prop) {
			resolved[prop] = {
				value: props[prop],
				writable: true,
				enumerable: true,
				configurable: true
			};
		});
		return Object.create(proto, resolved);
	},

	/**
	 * Extend target with source properties *excluding* prototype stuff.
	 * Optional parameter 'loose' to skips properties already declared.
	 * TODO: bypass mixin?
	 * @param {object} target
	 * @param {object} source
	 * @param @optional {boolean} loose Skip properties already declared
	 * @returns {object}
	 */
	extend: function(target, source, loose) {
		var hiding = this._hiding;
		if (gui.Type.isObject(source)) {
			Object.keys(source).forEach(function(key) {
				if (!loose || !gui.Type.isDefined(target[key])) {
					var desc = Object.getOwnPropertyDescriptor(source, key);
					desc = hiding ? gui.Object._hide(desc) : desc;
					Object.defineProperty(target, key, desc);
				}
			}, this);
		} else {
			throw new TypeError("Expected object, got " + gui.Type.of(source));
		}
		return target;
	},

	/**
	 * Extend target with source properties,
	 * skipping everything already declared.
	 * @param {object} target
	 * @param {object} source
	 * @returns {object}
	 */
	extendmissing: function(target, source) {
		return this.extend(target, source, true);
	},

	/**
	 * Copy object.
	 * @returns {object}
	 */
	copy: function(source) {
		try {
			return this.extend({}, source);
		} catch (exception) {
			throw new TypeError("Could not object-copy " + gui.Type.of(source));
		}
	},

	/**
	 * Call function for each own key in object (exluding the prototype stuff)
	 * with key and value as arguments. Returns array of function call results.
	 * Function results that are `undefined` get's filtered out of this list.
	 * @param {object} object
	 * @param {function} func
	 * @param @optional {object} thisp
	 */
	each: function(object, func, thisp) {
		return Object.keys(object).map(function(key) {
			return func.call(thisp, key, object[key]);
		}).filter(function(result) {
			return result !== undefined;
		});
	},

	/**
	 * Call function for all properties in object (including prototype stuff)
	 * with key and value as arguments. Returns array of function call results.
	 * @param {object} object
	 * @param {function} func
	 * @param @optional {object} thisp
	 */
	all: function(object, func, thisp) {
		var res = [];
		for (var key in object) {
			res.push(func.call(thisp, key, object[key]));
		}
		return res.filter(function(result) {
			return result !== undefined;
		});
	},

	/**
	 * Create new object by passing all property
	 * names and values through a resolver call.
	 * Eliminate values that map to `undefined`.
	 * @param {object} source
	 * @param {function} domap
	 * @param @optional {object} thisp
	 * @returns {object}
	 */
	map: function(source, domap, thisp) {
		var result = {},
			mapping;
		this.each(source, function(key, value) {
			mapping = domap.call(thisp, key, value);
			if (mapping !== undefined) {
				result[key] = mapping;
			}
		});
		return result;
	},

	/**
	 * Lookup object for string of type "my.ns.Thing" in given context or this window.
	 * @param {String} opath Object path eg. "my.ns.Thing"
	 * @param @optional {Window} context
	 * @returns {object}
	 */
	lookup: function(opath, context) {
		var result, struct = context || self;
		if (gui.Type.isString(opath)) {
			if (!opath.includes(".")) {
				result = struct[opath];
			} else {
				var parts = opath.split(".");
				parts.every(function(part) {
					struct = struct[part];
					return gui.Type.isDefined(struct);
				});
				result = struct;
			}
		} else {
			throw new TypeError("Expected string, got " + gui.Type.of(opath));
		}
		return result;
	},

	/**
	 * Update property of object in given context based on string input.
	 * TODO: Rename "declare"
	 * @param {String} opath Object path eg. "my.ns.Thing.name"
	 * @param {object} value Property value eg. `"Johnson` or"` `[]`
	 * @param @optional {Window|object} context
	 * @returns {object}
	 */
	assert: function(opath, value, context) {
		var prop, struct = context || self;
		if (opath.includes(".")) {
			var parts = opath.split(".");
			prop = parts.pop();
			parts.forEach(function(part) {
				struct = struct[part] || (struct[part] = {});
			});
		} else {
			prop = opath;
		}
		if (struct) {
			struct[prop] = value;
		}
		return value;
	},

	/**
	 * List names of invocable methods *including* prototype stuff.
	 * @return {Array<String>}
	 */
	methods: function(object) {
		var name, value, desc, obj = object,
			result = [];
		for (name in object) {
			// make sure that we don't poke any getter type properties...
			while (!(desc = Object.getOwnPropertyDescriptor(obj, name))) {
				obj = Object.getPrototypeOf(obj);
			}
			if (typeof desc.value === 'function') {
				value = object[name];
				if (gui.Type.isMethod(value)) {
					result.push(name);
				}
			}
		}
		return result;
	},

	/**
	 * List names of invocable methods *excluding* prototype stuff.
	 * @return {Array<String>}
	 */
	ownmethods: function(object) {
		return Object.keys(object).filter(function(key) {
			return gui.Type.isMethod(object[key]);
		}).map(function(key) {
			return key;
		});
	},

	/**
	 * List names of non-method properties *including* prototype stuff.
	 * @return {Array<String>}
	 */
	nonmethods: function(object) {
		var result = [];
		for (var def in object) {
			if (!gui.Type.isFunction(object[def])) {
				result.push(def);
			}
		}
		return result;
	},

	/**
	 * Bind the "this" keyword for all public instance methods.
	 * Stuff descending from the prototype chain is ignored.
	 * TODO: does this belong here?
	 * @param {object} object
	 * @returns {object}
	 */
	bindall: function(object) {
		var methods = Array.prototype.slice.call(arguments).slice(1);
		if (!methods.length) {
			methods = gui.Object.ownmethods(object).filter(function(name) {
				return name[0] !== "_"; // exclude private methods
			});
		}
		methods.forEach(function(name) {
			object[name] = object[name].bind(object);
		});
		return object;
	},

	/**
	 * Sugar for creating non-enumerable function properties (methods).
	 * To be be used in combination with `gui.Object.extend` for effect.
	 * `mymethod : gui.Object.hidden ( function () {})'
	 * @param {function} method
	 * @return {function}
	 */
	hidden: function(method) {
		gui.Object._hiding = true;
		method.$hidden = true;
		return method;
	},


	// Private ...................................................................

	/**
	 * Hiding any methods from inspection?
	 * Otherwise economize a function call.
	 * @see {edb.Object#extend}
	 * @type {boolean}
	 */
	_hiding: false,

	/**
	 * Modify method descriptor to hide from inspection.
	 * Do note that the method may still be called upon.
	 * @param {object} desc
	 * @returns {object}
	 */
	_hide: function(desc) {
		if (desc.value && gui.Type.isFunction(desc.value)) {
			if (desc.value.$hidden && desc.configurable) {
				desc.enumerable = false;
			}
		}
		return desc;
	}
};



/**
 * Type checking studio. All checks are string based.
 */
gui.Type = {

	/**
	 * Get type of argument. Note that response may differ between user agents.
	 * @see  http://javascriptweblog.wordpress.com/2011/08/08/fixing-the-javascript-typeof-operator
	 * @param {object} o
	 * @returns {String}
	 */
	of: function(o) {
		var type = ({}).toString.call(o).match(this._typeexp)[1].toLowerCase();
		if (type === "domwindow" && String(typeof o) === "undefined") {
			type = "undefined"; // some kind of degenerate bug in Safari on iPad
		}
		return type;
	},

	/**
	 * Is object defined?
	 * TODO: unlimited arguments support
	 * @param {object} o
	 * @returns {boolean}
	 */
	isDefined: function(o) {
		return this.of(o) !== "undefined";
	},

	/**
	 * Is complex type?
	 * @param {object} o
	 * @returns {boolean}
	 */
	isComplex: function(o) {
		switch (this.of(o)) {
			case "undefined":
			case "boolean":
			case "number":
			case "string":
			case "null":
				return false;
		}
		return true;
	},

	/**
	 * Is Window object?
	 * @param {object} o
	 * @returns {boolean}
	 */
	isWindow: function(o) {
		return o && o.document && o.location && o.alert && o.setInterval;
	},

	/**
	 * Is Event object?
	 * @pram {object} o
	 * @returns {boolean}
	 */
	isEvent: function(o) {
		return this.of(o).endsWith("event") && this.isDefined(o.type);
	},

	/**
	 * Is DOM element?
	 * @param {object} o
	 * @returns {boolean}
	 */
	isElement: function(o) {
		return this.of(o).endsWith('element') && o.nodeType === Node.ELEMENT_NODE;
	},

	/**
	 * Is Document Fragment?
	 * @param {object} o
	 * @returns {boolean}
	 */
	isDocumentFragment: function(o) {
		return o && o.nodeName && o.nodeName === '#document-fragment';
	},

	/**
	 * Is Document?
	 * @param {object} o
	 * @returns {boolean}
	 */
	isDocument: function(o) {
		return o && o.nodeType === Node.DOCUMENT_NODE;
	},

	/**
	 * Is most likely a method?
	 * @param {object} o
	 * @return {boolean}
	 */
	isMethod: function(o) {
		return o && this.isFunction(o) && !this.isConstructor(o) &&
			!String(o).includes("[native code]"); // hotfix 'Array' and 'Object' ...
	},

	/**
	 * Is spirit instance?
	 * @returns {boolean}
	 */
	isSpirit: function(o) {
		return o && (o instanceof gui.Spirit);
	},

	/**
	 * Is function fit to be invoked via the "new" operator?
	 * We assume so if the prototype reveals any properties.
	 * @param {function} what
	 * @returns {boolean}
	 */
	isConstructor: function(what) {
		return this.isFunction(what) &&
			this.isObject(what.prototype) &&
			Object.keys(what.prototype).length;
	},

	/**
	 * Is {gui.Class} constructor?
	 */
	isGuiClass: function(what) {
		return this.isConstructor(what) && what.$classname;
	},

	/**
	 * Is constructor for a Spirit?
	 * TODO: Why can't isConstructor be used here?
	 * TODO: something more reliable than "summon".
	 * @param {function} what
	 * @returns {boolean}
	 */
	isSpiritConstructor: function(what) {
		return this.isFunction(what) && this.isFunction(what.summon); // lousy
	},

	/**
	 * Something appears to be something array-like?
	 * @param {object} what
	 * @returns {boolean}
	 */
	isArrayLike: function(what) {
		return '0' in what && !this.isArray(what);
	},

	/**
	 * Autocast string to an inferred type. "123" will
	 * return a number, "false" will return a boolean.
	 * @param {String} string
	 * @returns {object}
	 */
	cast: function(string) {
		var result = String(string);
		switch (result) {
			case "null":
				result = null;
				break;
			case "true":
			case "false":
				result = (result === "true");
				break;
			default:
				if (String(parseInt(result, 10)) === result) {
					result = parseInt(result, 10);
				} else if (String(parseFloat(result)) === result) {
					result = parseFloat(result);
				}
				break;
		}
		return result;
	},


	// Private ...................................................................

	/**
	 * Match "Array" in "[object Array]" and so on.
	 * @type {RegExp}
	 */
	_typeexp: /\s([a-zA-Z]+)/

};

/**
 * Generate methods for isArray, isFunction, isBoolean etc.
 * TODO: can we do an "isError" here?
 */
(function generatecode() {
	[ "array",
		"function",
		"object",
		"string",
		"number",
		"boolean",
		"null",
		"arguments",
		"file"
	].forEach(function(type) {
		this["is" + type[0].toUpperCase() + type.slice(1)] = function is(o) {
			return this.of(o) === type;
		};
	}, this);
}).call(gui.Type);

/**
 * Bind the "this" keyword for all methods.
 */
gui.Object.bindall(gui.Type);



/**
 * Working with arrays.
 */
gui.Array = {

	/**
	 * Takes a variable number of arguments and produces 
	 * an instance of Array containing those elements.
	 * http://wiki.ecmascript.org/doku.php?id=strawman:array_extras
	 * @returns {Array}
	 */
	of: (function() {
		var slice = Array.prototype.slice;
		return (Array.of) || function() {
			return slice.call(arguments);
		};
	}()),

	/**
	 * Converts a single argument that is an array-like
	 * object or list into a fresh array.
	 * https://gist.github.com/rwaldron/1074126
	 * @param {object} arg
	 * @returns {Array}
	 */
	from: (function() {
		return (Array.from) || function(arg) {
			var array = [];
			var object = Object(arg);
			var len = object.length >>> 0;
			var i = 0;
			while (i < len) {
				if (i in object) {
					array[i] = object[i];
				}
				i++;
			}
			return array;
		};
	})(),

	/**
	 * Resolve single argument into an array with one or more
	 * entries with special handling of single string argument:
	 *
	 * 1. Strings to be split at spaces into an array
	 * 3. Arrays are converted to a similar but fresh array
	 * 2. Array-like objects transformed into real arrays.
	 * 3. Other objects are pushed into a one entry array.
	 *
	 * @param {object} arg
	 * @returns {Array} Always return an array
	 */
	make: function(arg) {
		switch (gui.Type.of(arg)) {
			case "string":
				return arg.split(" ");
			case "array":
				return this.from(arg);
			default:
				if (gui.Type.isArrayLike(arg)) {
					return this.from(arg);
				} else {
					return [arg];
				}
		}
	},

	/**
	 * Remove array member(s) by index (given numbers) or reference (given other).
	 * @see http://ejohn.org/blog/javascript-array-remove/#comment-296114
	 * TODO: Special setup for handling strings????
	 * TODO: More corner case handling of types...
	 * @param {Array} array
	 * @param {number|object} from
	 * @param @optional {number|object} to
	 * @returns {number} new length
	 */
	remove: function(array, from, to) {
		var markers = gui.Array.from(arguments).slice(1);
		if (markers.some(isNaN)) {
			return this.remove.apply(this, [array].concat(
				markers.map(function toindex(m) {
					return isNaN(m) ? array.indexOf(m) : m;
				})
			));
		} else {
			array.splice(from, !to || 1 + to - from + (!(to < 0 ^ from >= 0) &&
				(to < 0 || -1) * array.length));
			return array.length;
		}
	}
};



/**
 * Function argument type checking studio.
 */
gui.Arguments = {

	/**
	 * Forgiving arguments matcher.
	 * Ignores action if no match.
	 */
	provided: function(/* ...types */) {
		var types = gui.Array.from(arguments);
		return function(action) {
			return function() {
				if (gui.Arguments._match(arguments, types)) {
					return action.apply(this, arguments);
				}
			};
		};
	},

	/**
	 * Revengeful arguments validator.
	 * Throws an exception if no match.
	 */
	confirmed: function(/* ...types */) {
		var types = gui.Array.from(arguments);
		return function(action) {
			return function() {
				if (gui.Arguments._validate(arguments, types)) {
					return action.apply(this, arguments);
				} else {
					gui.Arguments._abort(this);
				}
			};
		};
	},


	// Private ...................................................................

	/**
	 * Validating mode?
	 * @type {boolean}
	 */
	_validating: false,

	/**
	 * Error repporting.
	 * @type {Array<String>}
	 */
	_bugsummary: null,

	/**
	 * Use this to check the runtime signature of a function call:
	 * gui.Arguments.match ( arguments, "string", "number" );
	 * Note that some args may be omitted and still pass the test,
	 * eg. the example would pass if only a single string was given.
	 * Note that `gui.Type.of` may return different xbrowser results
	 * for certain exotic objects. Use the pipe char to compensate:
	 * gui.Arguments.match ( arguments, "window|domwindow" );
	 * @returns {boolean}
	 */
	_match: function(args, types) {
		return types.every(function(type, index) {
			return this._matches(type, args[index], index);
		}, this);
	},

	/**
	 * Strict type-checking facility to throw exceptions on failure.
	 * TODO: at some point, return true unless in developement mode.
	 * @returns {boolean}
	 */
	_validate: function(args, types) {
		this._validating = true;
		var is = this._match(args, types);
		this._validating = false;
		return is;
	},

	/**
	 * Extract expected type of (optional) argument.
	 * @param {string} xpect
	 * @param {boolean} optional
	 */
	_xtract: function(xpect, optional) {
		return optional ? xpect.slice(1, -1) : xpect;
	},

	/**
	 * Check if argument matches expected type.
	 * @param {string} xpect
	 * @param {object} arg
	 * @param {number} index
	 * @returns {boolean}
	 */
	_matches: function(xpect, arg, index) {
		var needs = !xpect.startsWith("(");
		var split = this._xtract(xpect, !needs).split("|");
		var input = gui.Type.of(arg);
		var match = (xpect === "*" ||
			(xpect === 'node' && arg && arg.nodeType) || 
			(xpect === 'constructor' && arg && gui.Type.isConstructor(arg)) || 
			(xpect === 'element' && arg && arg.nodeType === Node.ELEMENT_NODE) || 
			(xpect === 'spirit' && arg && arg.$instanceid && arg.element) || 
			(!needs && input === "undefined") ||
			(!needs && split.indexOf("*") > -1) ||
			split.indexOf(input) > -1);
		if (!match && this._validating) {
			if (input === "string") {
				arg = '"' + arg + '"';
			}
			this._bugsummary = [index, xpect, input, arg];
		}
		return match;
	},

	/**
	 * Throw exception.
	 * @TODO: Rig up to report offended methods name.
	 * @param {object} that
	 * @param {Array<String>} report
	 */
	_abort: function(that) {
		var summ = this._bugsummary;
		var name = that.constructor.$classname || String(that);
		console.error([
			"Spiritual GUI: Bad argument " + summ.shift(),
			"for " + name + ":", "Expected " + summ.shift() + ",",
			"got " + summ.shift() + ":", summ.shift()
		].join(" "));
	}
};



/**
 * Working with functions.
 */
gui.Function = {

	/**
	 * Create named function. This may not be the most optimized thing to compile.
	 * @see https://mail.mozilla.org/pipermail/es-discuss/2009-March/008954.html
	 * @see http://wiki.ecmascript.org/doku.php?id=strawman:name_property_of_functions
	 * @param @optional {String} name
	 * @param @optional {Array<String>} params
	 * @param @optional {String} body
	 * @param @optional {Window} context
	 * @returns {function}
	 */
	create: function(name, params, body, context) {
		var F = context ? context.Function : Function;
		name = this.safename(name);
		params = params ? params.join(",") : "";
		body = body || "";
		return new F(
			"return function " + name + " ( " + params + " ) {" + body + "}"
		)();
	},

	/**
	 * Decorate object method before.
	 * @param {object} target
	 * @param {String} name
	 * @param {function} decorator
	 * @returns {object}
	 */
	decorateBefore: gui.Arguments.confirmed("object|function", "string", "function")(
		function(target, name, decorator) {
			return this._decorate("before", target, name, decorator);
		}
	),

	/**
	 * Decorate object method after.
	 * @param {object} target
	 * @param {String} name
	 * @param {function} decorator
	 * @returns {object}
	 */
	decorateAfter: gui.Arguments.confirmed("object|function", "string", "function")(
		function(target, name, decorator) {
			return this._decorate("after", target, name, decorator);
		}
	),

	/**
	 * TODO: Decorate object method around.
	 * @param {object} target
	 * @param {String} name
	 * @param {function} decorator
	 * @returns {object}
	 */
	decorateAround: function() {
		throw new Error("TODO");
	},

	/**
	 * Strip namespaces from name to create valid function name.
	 * TODO: Return a safe name no matter what has been input.
	 * @param {String} name
	 * @return {String}
	 */
	safename: function(name) {
		if (name && name.includes(".")) {
			name = name.split(".").pop();
		}
		return name || "";
	},


	// Private ...................................................................

	/**
	 * Decorate object method
	 * @param {String} position
	 * @param {object|function} target
	 * @param {String} name
	 * @param {function} decorator
	 * @returns {object}
	 */
	_decorate: function(position, target, name, decorator) {
		target[name] = gui.Combo[position](decorator)(target[name]);
		return target;
	}
	
};



/**
 * This fellow allow us to create a newable constructor that can be "subclassed" via an extend method.
 * Instances of the "class" may use a special `_super` method to override members of the "superclass".
 * TODO: Evaluate static stuff first so that proto can declare vals as static props
 * TODO: Check if static stuff shadows recurring static (vice versa) and warn about it.
 * TODO: It's possible for a prototype to be a prototype, investigate this inception
 * TODO: Assign uppercase properties as constants
 */
gui.Class = {

	/**
	 * Create constructor. Use method `extend` on
	 * the constructor to subclass further.
	 * @param @optional {String} name
	 * @param {object} proto Base prototype
	 * @param {object} protos Prototype extensions
	 * @param {object} recurring Constructor and subconstructor extensions
	 * @param {object} statics Constructor extensions
	 * @returns {function}
	 */
	create: function() {
		var b = this._breakdown_base(arguments);
		var C = this._createclass(null, b.proto, b.name);
		gui.Object.extend(C.prototype, b.protos);
		gui.Object.extend(C, b.statics);
		gui.Property.extendall(b.protos, C.prototype);
		if (b.recurring) {
			gui.Object.each(b.recurring, function(key, val) {
				var desc = Object.getOwnPropertyDescriptor(C, key);
				if (!desc || desc.writable) {
					C[key] = C.$recurring[key] = val;
				}
			});
		}
		return C;
	},

	/**
	 * Get constructor by $classid.
	 * @param {string} classid
	 * @returns {constructor}
	 */
	get: function(classid) {
		return this._classes[classid] || null;
	},

	
	// Privileged ................................................................

	/**
	 * The `this` keyword around here points to the instance via `apply`.
	 * @param {object} instance
	 * @param {Arguments} arg
	 */
	$constructor: function() {
		var constructor = this.$onconstruct || this.onconstruct;
		var nonenumprop = gui.Property.nonenumerable;
		var returnvalue = this;
		Object.defineProperties(this, {
			"$instanceid": nonenumprop({
				value: gui.KeyMaster.generateKey()
			}),
			displayName: nonenumprop({
				value: this.constructor.displayName,
				writable: true
			})
		});
		if (gui.Type.isFunction(constructor)) {
			returnvalue = constructor.apply(this, arguments);
		}
		if(false) { // if stil an instance of gui.Class (but disabled for now)
			if(gui.Client && gui.Super) {
				gui.Super.$proxy(returnvalue || this);
			}
		}
		return returnvalue || this;
	},


	// Private ...................................................................

	/**
	 * Mapping $classid to constructors.
	 * @type {Map<string,constructor>}
	 */
	_classes: Object.create(null),

	/**
	 * Nameless name.
	 * @type {String}
	 */
	ANONYMOUS: "Anonymous",

	/**
	 * TODO: Memoize this!
	 * Self-executing function creates a string property _BODY
	 * which we can as constructor body for classes. The `$name`
	 * will be substituted for the class name. Note that if
	 * called without the `new` keyword, the function acts
	 * as a shortcut the the MyClass.extend method (against
	 * convention, which is to silently imply the `new` keyword).
	 * @type {String}
	 */
	_BODY: (function($name) {
		var body = $name.toString().trim();
		return body.slice(body.indexOf("{") + 1, -1);
	}(
		function $name() {
			if (this instanceof $name) {
				return gui.Class.$constructor.apply(this, arguments);
			} else {
				return $name.extend.apply($name, arguments);
			}
		}
	)),

	/**
	 * Breakdown arguments for base exemplar only (has one extra argument).
	 * TODO: Something in gui.Arguments instead.
	 * @see {gui.Class#breakdown}
	 * @param {Arguments} args
	 * @returns {object}
	 */
	_breakdown_base: function(args) {
		var named = gui.Type.isString(args[0]);
		return {
			name: named ? args[0] : null,
			proto: args[named ? 1 : 0] || Object.create(null),
			protos: args[named ? 2 : 1] || Object.create(null),
			recurring: args[named ? 3 : 2] || Object.create(null),
			statics: args[named ? 4 : 3] || Object.create(null)
		};
	},

	/**
	 * Break down class constructor arguments. We want to make the string (naming)
	 * argument optional, but we still want to keep is as first argument, so the
	 * other arguments must be identified by whether or not it's present.
	 * TODO: Something in gui.Arguments instead.
	 * @param {Arguments} args
	 * @returns {object}
	 */
	_breakdown_subs: function(args) {
		var named = gui.Type.isString(args[0]);
		return {
			name: named ? args[0] : null,
			protos: args[named ? 1 : 0] || Object.create(null),
			recurring: args[named ? 2 : 1] || Object.create(null),
			statics: args[named ? 3 : 2] || Object.create(null)
		};
	},

	/**
	 * TODO: comments here!
	 * @param {object} proto Prototype of superconstructor
	 * @param {String} name Constructor name (for debug).
	 * @returns {function}
	 */
	_createclass: function(SuperC, proto, name) {
		name = name || gui.Class.ANONYMOUS;
		// TODO: this in devmode if and when we might know the name beforehand
		// C = gui.Function.create ( name, null, this._namedbody ( name ));
		var C = function $Class() {
			if (this instanceof $Class) {
				return gui.Class.$constructor.apply(this, arguments);
			} else {
				return $Class.extend.apply($Class, arguments);
			}
		};
		C.$classid = gui.KeyMaster.generateKey();
		C.prototype = Object.create(proto || null);
		C.prototype.constructor = C;
		C = this._internals(C, SuperC);
		C = this._interface(C);
		C = this._classname(C, name);
		this._classes[C.$classid] = C;
		return C;
	},

	/**
	 * Create subclass for given class.
	 * @param {funciton} SuperC
	 * @param {Object} args
	 * @return {function}
	 */
	_createsubclass: function(SuperC, args) {
		args = this._breakdown_subs(args);
		return this._extendclass(
			SuperC,
			args.protos,
			args.recurring,
			args.statics,
			args.name
		);
	},

	/**
	 * Create subclass constructor.
	 * @param {object} SuperC super constructor
	 * @param {object} protos Prototype extensions
	 * @param {object} recurring Constructor and subconstructor extensions
	 * @param {object} statics Constructor extensions
	 * @param {String} generated display name (for development)
	 * @returns {function} Constructor
	 */
	_extendclass: function(SuperC, protos, recurring, statics, name) {
		var C = this._createclass(SuperC, SuperC.prototype, name);
		gui.Object.extend(C, statics);
		gui.Object.extend(C.$recurring, recurring);
		gui.Object.each(C.$recurring, function(key, val) {
			var desc = Object.getOwnPropertyDescriptor(C, key);
			if (!desc || desc.writable) {
				C[key] = val;
			}
		});
		gui.Property.extendall(protos, C.prototype);
		C = this._classname(C, name);
		return C;
	},

	/**
	 * Setup framework internal propeties.
	 * @param {function} C
	 * @param @optional {function} superclass
	 * @param @optional {Map<String,object>} recurring
	 * @returns {function}
	 */
	_internals: function(C, SuperC) {
		C.$super = null; // what's this?
		C.$subclasses = [];
		C.$superclass = SuperC || null;
		C.$recurring = SuperC ?
			gui.Object.copy(SuperC.$recurring) : Object.create(null);
		if (SuperC) {
			SuperC.$subclasses.push(C);
		}
		return C;
	},

	/**
	 * Setup standard static methods for extension, mixin and instance checking.
	 * @param {function} C
	 * @returns {function}
	 */
	_interface: function(C) {
		["extend", "mixin", "is"].forEach(function(method) {
			C[method] = this[method];
		}, this);
		return C;
	},

	/**
	 * Assign toString() return value to function constructor and instance object.
	 * TODO: validate unique name
	 * @param {constructor} C
	 * @param {String} name
	 * @returns {function}
	 */
	_classname: function(C, name) {
		/*
		 * At this point the $classname is a writable property, it will
		 * become non-writable after we call {gui.Namespace#spacenames}.
		 */
		C.$classname = name || gui.Class.ANONYMOUS;
		Object.defineProperty(C.prototype, '$classname', {
			enumerable: false,
			configurable: true,
			get: function() {
				return this.constructor.$classname;
			}
		});
		C.toString = function() {
			return "[function " + this.$classname + "]";
		};
		C.prototype.toString = function() {
			return "[object " + this.constructor.$classname + "]";
		};
		return C;
	},

	/**
	 * Compute constructor body for class of given name.
	 * @param  {[type]} name [description]
	 * @return {[type]}      [description]
	 */
	_namedbody: function(name) {
		return this._BODY.replace(
			new RegExp("\\$name", "gm"),
			gui.Function.safename(name)
		);
	}

	/**
	 * This might do something in the profiler. Not much luck with stack traces.
	 * @see http://www.alertdebugging.com/2009/04/29/building-a-better-javascript-profiler-with-webkit/
	 * @see https://code.google.com/p/chromium/issues/detail?id=17356
	 * @param {function} C
	 * @returns {function}
	 *
	_profiling : function ( C ) {
		var name = C.name || gui.Class.ANONYMOUS;
		[ C, C.prototype ].forEach ( function ( thing ) {
			gui.Object.each ( thing, function ( key, value ) {
				if ( gui.Type.isMethod ( value )) {
					this._displayname ( value, name + "." + key );
				}
			}, this );
		}, this );
		return C;
	},
	*/
};


// Class members ...............................................................

gui.Object.extend(gui.Class, {

	/**
	 * Create subclass. To be called on the class constructor: MyClass.extend()
	 * @param @optional {String} name
	 * @param {object} proto Base prototype
	 * @param {object} protos Prototype methods and properties
	 * @param {object} recurring Constructor and subconstructor extensions
	 * @param {object} statics Constructor extensions
	 * @returns {function} Constructor
	 */
	extend: function() { // protos, recurring, statics 
		return gui.Class._createsubclass(this, arguments);
	},

	/**
	 * Mixin something.
	 * @param {object} proto
	 * @param {object} recurring
	 * @param {object} statics
	 * @returns {function}
	 */
	mixin: function(proto, recurring, statics) {
		Array.forEach(arguments, function(mixins, i) {
			if (mixins) {
				gui.Object.each(mixins, function(name, value) {
					if (i === 0) {
						// TODO: something more elaborate (like defineProperty)
						this.prototype[name] = value;
					} else { // TODO: only at index 1 right?
						gui.Class.descendantsAndSelf(this, function(C) {
							C.$recurring[name] = value;
							C[name] = value;
						});
					}
				}, this);
			}
		}, this);
		return this;
	},

	/**
	 * Is instance of this?
	 * @param {object} object
	 * @returns {boolean}
	 */
	is: function(object) {
		return gui.Type.isObject(object) && (object instanceof this);
	},

	/**
	 * Deprecated API.
	 */
	isInstance: function() {
		console.error("Deprecated API is derecated");
	}

});


// Class navigation ............................................................

gui.Object.extend(gui.Class, {

	/**
	 * Return superclass. If action is provided, return an array of the results
	 * of executing the action for each subclass with the subclass as argument.
	 * @param {function} C constructor
	 * @param @optional {function} action
	 * @param @optional {object} thisp
	 * @returns {Array<gui.Class|object>}
	 */
	children: function(C, action, thisp) {
		var results = [];
		action = action || gui.Combo.identity;
		C.$subclasses.forEach(function(sub) {
			results.push(action.call(thisp, sub));
		}, thisp);
		return results;
	},

	/**
	 * Apply action recursively to all derived subclasses of given class.
	 * Returns an array of accumulated results. If no action is provided,
	 * returns array of descendant sublasses.
	 * @param {function} C constructor
	 * @param @optional {function} action
	 * @param @optional {object} thisp
	 * @param @internal {Array<gui.Class|object>} results
	 * @returns {Array<gui.Class|object>}
	 */
	descendants: function(C, action, thisp, results) {
		results = results || [];
		action = action || gui.Combo.identity;
		C.$subclasses.forEach(function(sub) {
			results.push(action.call(thisp, sub));
			gui.Class.descendants(sub, action, thisp, results);
		}, thisp);
		return results;
	},

	/**
	 * Return descendant classes and class itself. If action is provided, return 
	 * array of the results of executing the action for each descendant class 
	 * and class itself with the class as argument.
	 * @param {function} C constructor
	 * @param @optional {function} action
	 * @param @optional {object} thisp
	 * @returns {Array<gui.Class|object>}
	 */
	descendantsAndSelf: function(C, action, thisp) {
		var results = [];
		action = action || gui.Combo.identity;
		results.push(action.call(thisp, C));
		return this.descendants(C, action, thisp, results);
	},

	/**
	 * Return superclass. If action is provided, return the result
	 * of executing the action with the superclass as argument.
	 * @param {function} C constructor
	 * @param @optional {function} action
	 * @param @optional {object} thisp
	 * @returns {gui.Class|object}
	 */
	parent: function(C, action, thisp) {
		if (C && C.$superclass) {
			action = action || gui.Combo.identity;
			return action.call(thisp, C.$superclass);
		}
		return null;
	},

	/**
	 * Return ancestor classes. If action is provided, return array of the results
	 * of executing the action for each ancestor class with the class as argument.
	 * @param {function} C constructor
	 * @param @optional {function} action
	 * @param @optional {object} thisp
	 * @param @internal {<gui.Class|object>} results
	 * @returns {Array<gui.Class|object>}
	 */
	ancestors: function(C, action, thisp, results) {
		results = results || [];
		action = action || gui.Combo.identity;
		if (C.$superclass) {
			results.push(action.call(thisp, C.$superclass));
			gui.Class.ancestors(C.$superclass, action, thisp, results);
		}
		return results;
	},

	/**
	 * Return ancestor classes and class itself. If action is provided, return 
	 * array of the results of executing the action for each ancestor class and 
	 * class itself with the class as argument.
	 * @param {function} C constructor
	 * @param @optional {function} action Takes the class as argument
	 * @param @optional {object} thisp
	 * @returns {Array<gui.Class|object>}
	 */
	ancestorsAndSelf: function(C, action, thisp) {
		var results = [];
		action = action || gui.Combo.identity;
		results.push(action.call(thisp, C));
		return this.ancestors(C, action, thisp, results);
	},

	/**
	 * Return ancestor classes, descendant classes and class itself. If action is
	 * provided, return array of the results of executing the action for each
	 * related class and class itself with the class as argument.
	 * @param {constructor} C
	 * @param @optional {function} action Takes the class as argument
	 * @param @optional {object} thisp
	 * @returns {Array<<gui.Class|object>>}
	 */
	family: function(C, action, thisp) {
		var results = this.ancestorsAndSelf(C).concat(this.descendants(C));
		if (action) {
			results = results.map(function(C) {
				return action.call(thisp, C);
			});
		}
		return results;
	}

});



/**
 * Working with properties.
 */
gui.Property = {

	/**
	 * Clone properties from source to target.
	 * @param {object} source
	 * @param {object} target
	 * @returns {object}
	 */
	extendall: function(source, target) {
		Object.keys(source).forEach(function(key) {
			this.extend(source, target, key);
		}, this);
		return target;
	},

	/**
	 * Copy property from source to target. Main feature is that it
	 * will be setup to a property accessor (getter/setter) provided:
	 *
	 * 1) The property value is an object
	 * 2) It has (only) one or both properties "getter" and "setter"
	 * 3) These are both functions
	 */
	extend: function(source, target, key) {
		var desc = Object.getOwnPropertyDescriptor(source, key);
		desc = this._accessor(target, key, desc);
		Object.defineProperty(target, key, desc);
		return target;
	},

	/**
	 * Provide sugar for non-enumerable propety descriptors.
	 * Omit "writable" since accessors must not define that.
	 * @param {object} desc
	 * @returns {object}
	 */
	nonenumerable: function(desc) {
		return gui.Object.extendmissing({
			configurable: true,
			enumerable: false
		}, desc);
	},

	/**
	 * Create getter/setter for object assuming enumerable and configurable.
	 * @param {object} object The property owner
	 * @param {string} key The property name
	 * @param {object} def An object with methods "get" and/or "set"
	 * @returns {object}
	 */
	accessor: function(object, key, def) {
		if (this._isaccessor(def)) {
			return Object.defineProperty(object, key, {
				enumerable: true,
				configurable: true,
				get: def.getter || this._NOGETTER,
				set: def.setter || this._NOSETTER
			});
		} else {
			throw new TypeError("Expected getter and/or setter method");
		}
	},


	// Private ...................................................................

	/**
	 * Object is getter-setter definition?
	 * @param {object} obj
	 * @returns {boolean}
	 */
	_isaccessor: function(obj) {
		return Object.keys(obj).every(function(key) {
			var is = false;
			switch (key) {
				case "getter":
				case "setter":
					is = gui.Type.isFunction(obj[key]);
					break;
			}
			return is;
		});
	},

	/**
	 * Copy single property to function prototype.
	 * @param {object} proto
	 * @param {String} key
	 * @param {object} desc
	 * @returns {object}
	 */
	_accessor: function(proto, key, desc) {
		var val = desc.value;
		if (gui.Type.isObject(val)) {
			if (val.getter || val.setter) {
				if (this._isactive(val)) {
					desc = this._activeaccessor(proto, key, val);
				}
			}
		}
		return desc;
	},

	/**
	 * Object is getter-setter definition?
	 * @param {object} obj
	 * @returns {boolean}
	 */
	_isactive: function(obj) {
		return Object.keys(obj).every(function(key) {
			var is = false;
			switch (key) {
				case "getter":
				case "setter":
					is = gui.Type.isFunction(obj[key]);
					break;
			}
			return is;
		});
	},

	/**
	 * Compute property descriptor for getter-setter
	 * type definition and assign it to the prototype.
	 * @param {object} proto
	 * @param {String} key
	 * @param {object} def
	 * @returns {defect}
	 */
	_activeaccessor: function(proto, key, def) {
		var desc;
		["getter", "setter"].forEach(function(name, set) {
			while (proto && proto[key] && !gui.Type.isDefined(def[name])) {
				proto = Object.getPrototypeOf(proto);
				desc = Object.getOwnPropertyDescriptor(proto, key);
				if (desc) {
					def[name] = desc[set ? "set" : "get"];
				}
			}
		});
		return {
			enumerable: true,
			configurable: true,
			get: def.getter || this._NOGETTER,
			set: def.setter || this._NOSETTER
		};
	},

	/**
	 * Bad getter.
	 */
	_NOGETTER: function() {
		throw new Error("Getting a property that has only a setter");
	},

	/**
	 * Bad setter.
	 */
	_NOSETTER: function() {
		throw new Error("Setting a property that has only a getter");
	}
};

/**
 * Bind the "this" keyword for all public methods.
 */
gui.Object.bindall(gui.Property);



/**
 * Checks an object for required methods and properties.
 */
gui.Interface = {

	/**
	 * Check object interface. Throw exception on fail.
	 * @param {object} interfais
	 * @param {object} osbject
	 * @returns {boolean}
	 */
	validate: function(interfais, object) {
		var is = true;
		var expected = interfais.toString();
		var type = gui.Type.of(object);
		switch (type) {
			case "null":
			case "string":
			case "number":
			case "boolean":
			case "undefined":
				throw new Error("Expected " + expected + ", got " + type + ": " + object);
			default:
				try {
					var missing = null,
						t = null;
					is = Object.keys(interfais).every(function(name) {
						missing = name;
						t = gui.Type.of(interfais[name]);
						return gui.Type.of(object[name]) === t;
					});
					if (!is) {
						throw new Error("Expected " + expected + ". A required " + type + " \"" + missing + "\" is missing");
					}
				} catch (exception) {
					throw new Error("Expected " + expected);
				}
				break;
		}
		return is;
	}
};



/**
 * From Raganwalds "Method Combinators".
 * @see https://github.com/raganwald/method-combinators/blob/master/README-JS.md
 * @see https://github.com/raganwald/homoiconic/blob/master/2012/09/precondition-and-postcondition.md
 */
gui.Combo = {

	/**
	 * Decorate function before.
	 * @param {function} decoration
	 * @returns {function}
	 */
	before: function(decoration) {
		return function(base) {
			return function() {
				decoration.apply(this, arguments);
				return base.apply(this, arguments);
			};
		};
	},

	/**
	 * Decorate function after.
	 * @param {function} decoration
	 * @returns {function}
	 */
	after: function(decoration) {
		return function(base) {
			return function() {
				var result = base.apply(this, arguments);
				decoration.apply(this, arguments);
				return result;
			};
		};
	},

	/**
	 * Decorate function around.
	 * @param {function} decoration
	 * @returns {function}
	 */
	around: function(decoration) {
		var slice = [].slice;
		return function(base) {
			return function() {
				var argv, callback, result, that = this;
				argv = 1 <= arguments.length ? slice.call(arguments, 0) : [];
				result = void 0;
				callback = function() {
					return (result = base.apply(that, argv));
				};
				decoration.apply(this, [callback].concat(argv));
				return result;
			};
		};
	},

	/**
	 * Decorate function provided with support for an otherwise operation.
	 * @param {function} condition
	 */
	provided: function(condition) {
		return function(base, otherwise) {
			return function() {
				if (condition.apply(this, arguments)) {
					return base.apply(this, arguments);
				} else if (otherwise) {
					return otherwise.apply(this, arguments);
				}
			};
		};
	},

	/**
	 * Make function return `this` if otherwise it would return `undefined`.
	 * Variant of the `fluent` combinator which would always returns `this`.
	 * We use this extensively to ensure API consistancy, but we might remove 
	 * it for a theoretical performance gain once we have a huge test suite.
	 * @param {function} base
	 * @returns {function}
	 */
	chained: function(base) {
		return function() {
			var result = base.apply(this, arguments);
			return result === undefined ? this : result;
		};
	},

	/**
	 * Memoize return value for function that take zero or more 
	 * args, each of which must be amenable to JSON.stringify.
	 * @param {function} base
	 * @returns {function}
	 */
	memoized: function(base) {
		var memos;
		memos = {};
		return function() {
			var key;
			key = JSON.stringify(arguments);
			if (memos.hasOwnProperty(key)) {
				return memos[key];
			} else {
				return (memos[key] = base.apply(this, arguments));
			}
		};
	},

	/**
	 * Simply output the input. Wonder what it could be.
	 * @param {object} subject
	 * @return {object}
	 */
	identity: function(subject) {
		return subject;
	}

};



/**
 * Base constructor for all plugins.
 * TODO: "context" should be required in constructor (sandbox scenario)
 */
gui.Plugin = gui.Class.create(Object.prototype, {

	/**
	 * The {gui.Class} for whom the plugin is plugged into.
	 * @type {gui.Spirit|gui.Plugin|edb.Object|edb.Array}
	 */
	client: null,

	/**
	 * If client is a spirit, this property is it.
	 * TODO: Move to gui-spirits@wunderbyte.com
	 * @type {gui.Spirit}
	 */
	spirit: null,

	/**
	 * Plugins may be designed to work without an associated spirit.
	 * In that case, an external entity might need to define this.
	 * @type {Global} Typically identical to `window`
	 */
	context: null,

	/**
	 * Construct
	 */
	onconstruct: function() {},

	/**
	 * Destruct.
	 */
	ondestruct: function() {},

	/**
	 * Implements DOM2 EventListener (native event handling).
	 * We forwards the event to method 'onevent' IF that has
	 * been specified on the plugin.
	 * TODO: move to $protected area
	 * @param {Event} e
	 */
	handleEvent: function(e) {
		if (gui.Type.isFunction(this.onevent)) {
			this.onevent(e);
		}
	},


	// Privileged ................................................................

	/**
	 * Flag destructed status.
	 * TODO: Move this to {gui.Class}
	 */
	$destructed: false,

	/**
	 * Secret constructor. Called before `onconstruct`.
	 * @type {gui.Spirit|gui.Plugin|edb.Object|edb.Array}
	 */
	$onconstruct: function(client) {
		this.client = client;
		if(gui.hasModule('gui-spirits@wunderbyte.com')) {
			if(client instanceof gui.Spirit) {
				this.spirit = client || null;
				this.context = window; // otherwise web worker scenario, maybe deprecate
			}
		}
		this.onconstruct();
	},

	/**
	 * Secret destructor. Called after `ondestruct`.
	 */
	$ondestruct: function() {}


}, { // Xstatic ................................................................

	/**
	 * Construct only when requested?
	 * @type {boolean}
	 */
	lazy: true


}, { // Static .................................................................

	/**
	 * Lazy plugins are newed up only when needed. We'll create an
	 * accessor for the prefix that will instantiate the plugin and
	 * create a new accesor to return it. To detect if a plugin
	 * has been instantiated, check with {gui.LifePlugin#plugins}.
	 * That's a hashmap that maps plugin prefixes to a boolean status.
	 * @param {gui.Spirit} spirit
	 * @param {String} prefix
	 * @param {function} Plugin
	 */
	$prepare: function(spirit, prefix, Plugin) {
		Object.defineProperty(spirit, prefix, {
			enumerable: true,
			configurable: true,
			get: function() {
				var plugin = new Plugin(this);
				this.life.plugins[prefix] = true;
				gui.Plugin.$assign(spirit, prefix, plugin);
				return plugin;
			}
		});
	},

	/**
	 * Assign plugin to prefix in such a clever way
	 * that it cannot accidentally be overwritten.
	 * TODO: Importantly handle 'force' parameter when overriding a plugin!
	 * @param {gui.Spirit} spirit
	 * @param {String} prefix
	 * @param {gui.Plugin} plugin
	 */
	$assign: function(spirit, prefix, plugin) {
		Object.defineProperty(spirit, prefix, {
			enumerable: true,
			configurable: true,
			get: function() {
				return plugin;
			},
			set: function() {
				throw new Error(
					'The property name "' + prefix + '" is reserved for the ' +
					plugin.$classname + ' and cannot be redefined.' // note about 'force'!
				);
			}
		});
	}


});



/**
 * We used to keep a clientside `super` implementation around, but it 
 * was obscuring the stacktraces. The long term plan was to implement 
 * super methods using Proxys, but that also turned out to be complex 
 * if not impossible. So now we just use the respected `call` pattern. 
 * We have however rigged it up so that the Grunt build task will 
 * replace the old `this.super` syntax with the new pattern during 
 * some compile step. If you're not using the build tool, you would go 
 * about this super-businnes like outlined in this implementation...
 * @extends {gui.Plugin}
 * @using {gui.Plugin.prototype} suber
 */
gui.SuperPlugin = (function using(suber) {
	return gui.Plugin.extend({
		onconstruct: function() {
			suber.onconstruct.call(this);
			console.error([
				"Note that 'this.super' doesn't really exist. You can either:",
				"1) compile the script serverside using 'grunt-spiritual-build' or",
			  "2) use the pattern 'SuperClass.prototype.methodname.apply(this)'",
				"(the Grunt task basically just applies this pattern to the code)"
			].join('\n'));
		}
	});
}(gui.Plugin.prototype));



/**
 * Comment goes here.
 * @extends {gui.Plugin}
 */
gui.TrackerPlugin = gui.Plugin.extend({

	/**
	 * Construction time.
	 * @param {Spirit} spirit
	 */
	onconstruct: function() {
		gui.Plugin.prototype.onconstruct.call(this);
		this._trackedtypes = Object.create(null);
		if (this.spirit) {
			this._sig = gui.$contextid; // TODO: get rid of this
		}
	},

	/**
	 * Cleanup on destruction.
	 */
	ondestruct: function() {
		gui.Plugin.prototype.ondestruct.call(this);
		gui.Object.each(this._trackedtypes, function(type, list) {
			list.slice().forEach(function(checks) {
				this._cleanup(type, checks);
			}, this);
		}, this);
	},

	/**
	 * TODO: Toggle type(s).
	 * @param {object} arg
	 * @returns {gui.Tracker}
	 */
	toggle: function(arg, checks) {
		console.error("TODO: SpiritTracker#toggle");
	},

	/**
	 * Invokes `add` or `remove` according to first argument given.
	 * The remaining arguments are applied to the method we invoke.
	 * @param {boolean} on
	 * @returns {gui.Tracker}
	 */
	shift: function(on /*...rest */ ) {
		var rest = gui.Array.from(arguments).slice(1);
		if (on) {
			return this.add.apply(this, rest);
		} else {
			return this.remove.apply(this, rest);
		}
	},

	/**
	 * Shift globally. This may not be applicable to the plugin.
	 * @param {boolean} on
	 * @returns {gui.Tracker}
	 */
	shiftGlobal: function(on /*...rest */ ) {
		return this._globalize(function() {
			return this.shift.apply(arguments);
		});
	},

	/**
	 * Contains handlers for type(s)? Note that handlers might
	 * assert criterias other than type in order to be invoked.
	 * @param {object} arg
	 * @returns {boolean}
	 */
	contains: function(arg) {
		return gui.Array.make(arg).every(function(type) {
			return this._trackedtypes[type];
		}, this);
	},


	// Private .....................................................

	/**
	 * Global mode? This doesn't nescessarily makes
	 * sense for all {gui.Tracker} implementations.
	 * @type {boolean}
	 */
	_global: false,

	/**
	 * Bookkeeping types and handlers.
	 * @type {Map<String,Array<object>}
	 */
	_trackedtypes: null,

	/**
	 * @TODO: Get rid of it
	 * @type {String}
	 */
	_sig: null,

	/**
	 * Execute operation in global mode. Note that sometimes it's still
	 * needed to manually flip the '_global' flag back to 'false' in
	 * order to avoid the mode leaking the into repeated (nested) calls.
	 * @param {function} operation
	 * @returns {object}
	 */
	_globalize: function(operation) {
		this._global = true;
		var res = operation.call(this);
		this._global = false;
		return res;
	},

	/**
	 * Can add type of given checks?
	 * @param {String} type
	 * @param {Array<object>} checks
	 * @returns {boolean}
	 */
	_addchecks: function(type, checks) {
		var result = false;
		var list = this._trackedtypes[type];
		if (!list) {
			list = this._trackedtypes[type] = [];
			result = true;
		} else {
			result = !this._haschecks(list, checks);
		}
		if (result && checks) {
			list.push(checks);
		}
		return result;
	},

	/**
	 * Can remove type of given checks? If so, do it now.
	 * @param {String} type
	 * @param {Array<object>} checks
	 * @returns {boolean}
	 */
	_removechecks: function(type, checks) {
		var result = false;
		var list = this._trackedtypes[type];
		if (list) {
			var index = this._checksindex(list, checks);
			if (index > -1) {
				result = true;
				// TODO: this seems to not run when checks is none (undefined)!
				if (gui.Array.remove(list, index) === 0) {
					delete this._trackedtypes[type];
				}
			}
		}
		return result;
	},

	/**
	 * Has list for type AND given checks?
	 * @param {String} type
	 * @param {Array<object>} checks
	 */
	_containschecks: function(type, checks) {
		var result = false;
		var list = this._trackedtypes[type];
		if (list) {
			result = !checks || this._haschecks(list, checks);
		}
		return result;
	},

	/**
	 * Has checks indexed?
	 * @param {Array<Array<object>>} list
	 * @param {Array<object>} checks
	 * @returns {boolean}
	 */
	_haschecks: function(list, checks) {
		var result = !checks || false;
		if (!result) {
			list.every(function(a) {
				if (a.every(function(b, i) {
					return b === checks[i];
				})) {
					result = true;
				}
				return !result;
			});
		}
		return result;
	},

	/**
	 * All checks removed?
	 * @returns {boolean}
	 */
	_hashandlers: function() {
		return Object.keys(this._trackedtypes).length > 0;
	},

	/**
	 * Get index of checks.
	 * @param {Array<Array<object>>} list
	 * @param {Array<object>} checks
	 * @returns {number}
	 */
	_checksindex: function(list, checks) {
		var result = -1;
		list.every(function(a, index) {
			if (a.every(function(b, i) {
				return b === checks[i];
			})) {
				result = index;
			}
			return result === -1;
		});
		return result;
	},
	
	/**
	 * Isolated for subclass to overwrite.
	 * @param {String} type
	 * @param {Array<object>} checks
	 */
	_cleanup: function(type, checks) {
		if (this._removechecks(type, checks)) {
			// do cleanup here (perhaps overwrite all 
			// this to perform _removechecks elsewhere)
		}
	}

});



/**
 * Spirit action.
 * @using {gui.Arguments#confirmed} confirmed
 * @using {gui.Combo#chained} chained
 */
gui.Action = (function using(confirmed, chained) {

	if(gui.hosted) { // relay actions from parent frame.
		addEventListener('message', function(e) {
			if(e.source === parent) {
				gui.Action.$maybeDescendGlobal(e.data);
			}
		});
	}

	return gui.Class.create(Object.prototype, {

		/**
		 * From who or where the action was dispatched.
		 * @type {Node|gui.Spirit}
		 */
		target: null,

		/**
		 * Action type eg. "save-button-clicked".
		 * @type {String}
		 */
		type: null,

		/**
		 * Optional data of any type.
		 * This might be undefined.
		 * @type {object}
		 */
		data: null,

		/**
		 * Is travelling up or down? Matches "ascend" or "descend".
		 * @type {String}
		 */
		direction: null,

		/**
		 * Traverse iframe boundaries?
		 * @type {boolean}
		 */
		global: false,

		/**
		 * Is action consumed?
		 * TODO: rename 'consumed'
		 * @type {boolean}
		 */
		isConsumed: false,

		/**
		 * Is action cancelled?
		 * TODO: rename 'cancelled'
		 * @type {boolean}
		 */
		isCancelled: false,

		/**
		 * Spirit who (potentially) consumed the action.
		 * @type {gui.Spirit}
		 */
		consumer: null,

		/**
		 * Used when posting actions xdomain. Matches an iframespirit key.
		 * TODO: rename this to something else (now that action has $instanceid).
		 * @type {String}
		 */
		instanceid: null,

		/**
		 * Connstruct from JSON.
		 * @param {object} json
		 */
		onconstruct: function(json) {
			gui.Object.extend(this, json);
		},

		/**
		 * Block further ascend.
		 * @param @optional {gui.Spirit} consumer
		 */
		consume: function(consumer) {
			this.isConsumed = true;
			this.consumer = consumer;
		},

		/**
		 * Consume and cancel the event. Note that it is
		 * up to the dispatcher to honour cancellation.
		 * @param @optional {gui.Spirit} consumer
		 */
		cancel: function(consumer) {
			this.isCancelled = true;
			this.consume(consumer);
		}


	}, {}, { // Static ...........................................................


		DESCEND : 'descend',
		ASCEND : 'ascend',

		/**
		 * Action handler interface.
		 */
		IActionHandler: {
			onaction: function(a) {},
			toString: function() {
				return '[interface ActionHandler]';
			}
		},

		/**
		 * Don't use just yet! (pending WeakMaps)
		 * @param {string|Array<string>} type
		 * @param {object} handler Implements `onaction`
		 * @param @optional {String} sig
		 * @returns {constructor}
		 */
		add: confirmed('node', 'array|string', 'object|function')(
			chained(function(elm, type, handler) {
				this._listen(true, elm, type, handler, false);
			})),

		/**
		 * Don't use just yet! (pending WeakMaps)
		 * @param {string|Array<string>} type
		 * @param {object} handler
		 * @param @optional {String} sig
		 * @returns {constructor}
		 */
		remove: confirmed('node', 'array|string', 'object|function')(
			chained(function(node, type, handler) {
				this._listen(false, node, type, handler, false);
			})),

		/**
		 * Don't use just yet! (pending WeakMaps)
		 * @param {string|Array<string>} type
		 * @param {object} handler Implements `onaction`
		 * @returns {constructor}
		 */
		addGlobal: confirmed('node', 'array|string', 'object|function')(
			chained(function(node, type, handler) {
				this._listen(true, node, type, handler, true);
			})),

		/**
		 * Don't use just yet! (pending WeakMaps)
		 * @param {string|Array<string>} type
		 * @param {object} handler
		 * @returns {constructor}
		 */
		removeGlobal: confirmed('node', 'array|string', 'object|function')(
			chained(function(node, type, handler) {
				this._listen(false, node, type, handler, true);
			})),

		/**
		 *
		 */
		dispatch: function(target, type, data) {
			return this.ascend(target, type, data);
		},

		/**
		 *
		 */
		ascend: function(target, type, data) {
			return this._dispatch(target, type, data, gui.Action.ASCEND, false);
		},

		/**
		 *
		 */
		descend: function(target, type, data) {
			return this._dispatch(target, type, data, gui.Action.DESCEND, false);
		},

		/**
		 *
		 */
		dispatchGlobal: function(target, type, data) {
			return this.ascendGlobal(target, type, data);
		},

		/**
		 *
		 */
		ascendGlobal: function(target, type, data) {
			return this._dispatch(target, type, data, gui.Action.ASCEND, true);
		},

		/**
		 *
		 */
		descendGlobal: function(target, type, data) {
			return this._dispatch(target, type, data, gui.Action.DESCEND, true);
		},

		/**
		 * Encode action to be posted xdomain.
		 * @param {gui.Action} a
		 * @param @optional {String} key Associates dispatching document
		 *        to the hosting iframespirit (ascending action scenario)
		 * @returns {String}
		 */
		stringify: function(a, key) {
			var prefix = "spiritual-action:";
			return prefix + (function() {
				a.target = null;
				a.data = (function(d) {
						if (gui.Type.isComplex(d)) {
							if (gui.Type.isFunction(d.stringify)) {
								d = d.stringify();
							} else {
								try {
									JSON.stringify(d);
								} catch (jsonexception) {
									d = null;
								}
							}
						}
						return d;
					}(a.data));
					a.instanceid = key || null;
					return JSON.stringify(a);
				}());
		},

		/**
		 * Parse string to {gui.Action}.
		 * @param {string} msg
		 * @returns {gui.Action}
		 */
		parse: function(msg) {
			var prefix = "spiritual-action:";
			if (msg.startsWith(prefix)) {
				return new gui.Action(
					JSON.parse(msg.split(prefix)[1])
				);
			}
			return null;
		},


		// Privileged static .......................................................

		/**
		 * Parse postmessage from parent into descending action in this window?
		 * @param {string} postmessage
		 */
		$maybeDescendGlobal: function(postmessage) {
			var data = postmessage, action, root, handlers;
			if(gui.Type.isString(data) && data.startsWith("spiritual-action:")) {
				action = gui.Action.parse(data);
				if (action.direction === gui.Action.DESCEND) {
					// Hotfix for actions in nospirit scenario
					// TODO: rething this pending WeakMaps...
					if((handlers = this._globals[action.type])) {
						handlers.slice().forEach(function(handler) {
							handler.onaction(action);
						});
					}
					if(gui.hasModule('gui-spirits@wunderbyte.com')) {
						if ((root = gui.get('html'))) {
							root.action.$handleownaction = true;
							root.action.descendGlobal(
								action.type,
								action.data
							);
						}
					}
				}
			}
		},


		// Private static ..........................................................

		/**
		 *
		 */
		_globals: {},

		/**
		 *
		 */
		_locals: {},

		/**
		 * 
		 */
		_listen: function(add, node, type, handler, global) {
			if(node.nodeType === Node.DOCUMENT_NODE) {
				var map = global ? this._globals : this._locals;
				var handlers = map[type];
				var ok = gui.Action.IActionHandler;
				if (gui.Interface.validate(ok, handler)) {
					gui.Array.make(type).forEach(function(t) {
						if(add) {
							if(!handlers) {
								handlers = map[type] = [];
							}
							if(handlers.indexOf(handler) === -1) {
								handlers.push(handler);
							}
						} else if(handlers) {
							if(gui.Array.remove(handlers, handler) === 0) {
								delete map[type];
							}
						}
					});
				}
			} else { // elements support pending WeakMap
				throw new TypeError('Document node expected');
			}
		},

		/**
		 * Dispatch action. The dispatching spirit will not `onaction()` its own action.
		 * TODO: Measure performance against https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent
		 * TODO: Class-like thing to carry all these scoped methods...
		 * TODO: support custom `gui.Action` as an argument
		 * TODO: common ancestor class for action, broadcast etc?
		 * @param {gui.Spirit|Element} target
		 * @param {String} type
		 * @param @optional {object} data
		 * @param @optional {String} direction
		 * @param @optional {boolean} global
		 * @returns {gui.Action}
		 */
		_dispatch: function dispatch(target, type, data, direction, global) {

			// TODO: encapsulate this
			var action = new gui.Action({
				target: target,
				type: type,
				data: data,
				direction: direction || gui.Action.ASCEND,
				global: global || false
			});

			var crawler = new gui.Crawler(gui.CRAWLER_ACTION);
			crawler.global = action.global || false;
			crawler[action.direction](target, {
				/*
				 * Evaluate action for spirit.
				 * @param {gui.Spirit} spirit
				 */
				handleSpirit: function(spirit) {
					var directive = gui.Crawler.CONTINUE;
					if (spirit.action.contains(type)) {
						spirit.action.$onaction(action);
						if (action.isConsumed) {
							directive = gui.Crawler.STOP;
							action.consumer = spirit;
						}
					}
					return directive;
				},
				
				/*
				 * Teleport action across domains.
				 * @see {gui.IframeSpirit}
				 * @param {Window} win Remote window
				 * @param {String} uri target origin
				 * @param {String} key Spiritkey of xdomain IframeSpirit (who will relay the action)
				 */
				transcend: function(win, uri, key) {
					var msg = gui.Action.stringify(action, key);
					win.postMessage(msg, "*"); // uri
				}
			});
			return action;
		}

	});

}(gui.Arguments.confirmed, gui.Combo.chained));



/** 
 * Broadcast.
 * @using {gui.Arguments#confirmed}
 * @using {gui.Combo#chained}
 */
gui.Broadcast = (function using(confirmed, chained) {

	window.addEventListener('message', function(e) {
		if(gui.Type.isString(e.data)) {
			if(e.data.startsWith('spiritual-broadcast:')) {
				gui.Broadcast.$maybeBroadcastGlobal(e.data);
			}
		}
	});

	return gui.Class.create(Object.prototype, {

		/**
		 * Broadcast target.
		 * @type {gui.Spirit}
		 */
		target: null,

		/**
		 * Broadcast type.
		 * @type {String}
		 */
		type: null,

		/**
		 * Broadcast data.
		 * @type {object}
		 */
		data: null,

		/**
		 * Global broadcast?
		 * @type {boolean}
		 */
		global: false,

		/**
		 * Signature of dispatching context.
		 * Unimportant for global broadcasts.
		 * @type {String}
		 */
		$contextid: null,

		/**
		 * Experimental...
		 * TODO: Still used?
		 * @type {Array<String>}
		 */
		$contextids: null,

		/**
		 * Constructor.
		 * @param {Map<String,object>} defs
		 */
		$onconstruct: function(defs) {
			gui.Object.extend(this, defs);
			this.$contextids = this.$contextids || [];
		}


	}, {}, { // Static ...........................................................


		/**
		 * Broadcast handler interface.
		 */
		IBroadcastHandler: {
			onbroadcast: function(b) {},
			toString: function() {
				return '[interface BroadcastHandler]';
			}
		},

		/**
		 * @type {gui.Spirit}
		 */
		$target: null,

		/**
		 * TODO: Ths can be deprecated now(?)
		 * Tracking global handlers (mapping broadcast types to list of handlers).
		 * @type {Map<String,<Array<object>>}
		 */
		_globals: Object.create(null),

		/**
		 * TODO: Ths can be deprecated now!
		 * Tracking local handlers (mapping gui.$contextids
		 * to broadcast types to list of handlers).
		 * @type {Map<String,Map<String,Array<object>>>}
		 */
		_locals: Object.create(null),

		/**
		 * mapcribe handler to message.
		 * @param {object} message String or array of strings
		 * @param {object} handler Implements `onbroadcast`
		 * @param @optional {String} sig
		 * @returns {function}
		 */
		add: chained(function(message, handler, sig) {
			this._add(message, handler, sig || gui.$contextid);
		}),

		/**
		 * Unmapcribe handler from broadcast.
		 * @param {object} message String or array of strings
		 * @param {object} handler
		 * @param @optional {String} sig
		 * @returns {function}
		 */
		remove: chained(function(message, handler, sig) {
			this._remove(message, handler, sig || gui.$contextid);
		}),

		/**
		 * mapcribe handler to message globally.
		 * @param {object} message String or array of strings
		 * @param {object} handler Implements `onbroadcast`
		 * @returns {function}
		 */
		addGlobal: chained(function(message, handler) {
			this._add(message, handler);
		}),

		/**
		 * Unmapcribe handler from global broadcast.
		 * @param {object} message String or array of strings
		 * @param {object} handler
		 * @returns {function}
		 */
		removeGlobal: chained(function(message, handler) {
			this._remove(message, handler);
		}),

		/**
		 * Publish broadcast in specific window scope (defaults to this window)
		 * TODO: queue for incoming dispatch (finish current message first).
		 * @param {Spirit} target
		 * @param {String} type
		 * @param {object} data
		 * @param {String} contextid
		 * @returns {gui.Broadcast}
		 */
		dispatch: function(type, data) {
			if (gui.Type.isString(type)) {
				return this._dispatch({
					type: type,
					data: data,
					global: false
				});
			} else {
				console.error('The "target" argument (the first argument) of gui.Broadcast.dispatch is deprecated');
				this.dispatch(arguments[1], arguments[2]);
			}
		},

		/**
		 * Dispatch broadcast in global scope (all windows).
		 * TODO: queue for incoming dispatch (finish current first).
		 * TODO: Handle remote domain iframes ;)
		 * @param {Spirit} target
		 * @param {String} type
		 * @param {object} data
		 * @returns {gui.Broadcast}
		 */
		dispatchGlobal: function(type, data) {
			if (gui.Type.isString(type)) {
				return this._dispatch({
					type: type,
					data: data,
					global: true,
					$contextid: gui.$contextid
				});
			} else {
				console.error('The "target" argument (the first argument) of gui.Broadcast.dispatchGlobal is deprecated');
				return this.dispatchGlobal(arguments[1], arguments[2]);
			}
		},

		/**
		 * Encode broadcast to be posted xdomain.
		 * @param {gui.Broacast} b
		 * @returns {String}
		 */
		stringify: function(b) {
			var prefix = "spiritual-broadcast:";
			return prefix + (function() {
				b.target = null;
				b.data = (function(d) {
					if (gui.Type.isComplex(d)) {
						if (gui.Type.isFunction(d.stringify)) {
							d = d.stringify();
						} else {
							try {
								JSON.stringify(d); // @TODO: think mcfly - how come not d = JSON.stringify????
							} catch (jsonexception) {
								d = null;
							}
						}
					}
					return d;
				}(b.data));
				return JSON.stringify(b);
			}());
		},

		/**
		 * Decode broadcast posted from xdomain and return a broadcast-like object.
		 * @param {String} msg
		 * @returns {object}
		 */
		parse: function(msg) {
			var prefix = "spiritual-broadcast:";
			if (msg.startsWith(prefix)) {
				return JSON.parse(msg.split(prefix)[1]);
			}
		},


		// Privileged static .......................................................

		/**
		 * Parse postmessage into broadcast in this window? 
		 * Broadcasts propagate over-agressively, so perhaps 
		 * the broadcast has already bypassed this context.
		 * @param {string} postmessage
		 */
		$maybeBroadcastGlobal: function(postmessage) {
			var b = gui.Broadcast.parse(postmessage);
			if(b.$contextids.indexOf(gui.$contextid) === -1) {
				gui.Broadcast._dispatch(b);
			}
		},


		// Private .................................................................

		/**
		 * Subscribe handler to message(s).
		 * @param {Array<string>|string} type
		 * @param {object|function} handler Implements `onbroadcast`
		 * @param @optional {String} sig
		 */
		_add: confirmed("array|string", "object|function", "(string)")(
			function(type, handler, sig) {
				var interfais = gui.Broadcast.IBroadcastHandler;
				if (true || gui.Interface.validate(interfais, handler)) {
					if (gui.Type.isArray(type)) {
						type.forEach(function(t) {
							this._add(t, handler, sig);
						}, this);
					} else {
						var map;
						if (sig) {
							map = this._locals[sig];
							if (!map) {
								map = this._locals[sig] = Object.create(null);
							}
						} else {
							map = this._globals;
						}
						if (!map[type]) {
							map[type] = [];
						}
						var array = map[type];
						if (array.indexOf(handler) === -1) {
							array.push(handler);
						}
					}
				}
			}
		),

		/**
		 * Hello.
		 * @param {object} message String or array of strings
		 * @param {object} handler
		 * @param @optional {String} sig
		 */
		_remove: function(message, handler, sig) {
			var interfais = gui.Broadcast.IBroadcastHandler;
			if (true || gui.Interface.validate(interfais, handler)) {
				if (gui.Type.isArray(message)) {
					message.forEach(function(msg) {
						this._remove(msg, handler, sig);
					}, this);
				} else {
					var index, array = (function(locals, globals) {
						if (sig) {
							if (locals[sig]) {
								return locals[sig][message];
							}
						} else {
							return globals[message];
						}
					}(this._locals, this._globals));
					if (array) {
						index = array.indexOf(handler);
						if (index > -1) {
							gui.Array.remove(array, index);
						}
					}
				}
			}
		},

		/**
		 * Dispatch broadcast.
		 * @param {gui.Broadcast|Map<String,object>} b
		 */
		_dispatch: function(b) {
			var map = b.global ? this._globals : this._locals[gui.$contextid];
			if (gui.hasModule('gui-spirits@wunderbyte.com')) {
				if(!gui.spiritualized) {
					if(b.type !== gui.BROADCAST_WILL_SPIRITUALIZE) {
						// TODO: cache broadcast until spiritualized?
					}
				}
			}
			if (this.$target) {
				if (!b.global) {
					b.target = this.$target;
				}
				this.$target = null;
			}
			if (b instanceof gui.Broadcast === false) {
				b = new gui.Broadcast(b);
			}
			if (map) {
				var handlers = map[b.type];
				if (handlers) {
					handlers.slice().forEach(function(handler) {
						handler.onbroadcast(b);
					});
				}
			}
			if (b.global) {
				this._propagate(b);
			}
			return b;
		},

		/**
		 * Propagate broadcast xframe.
		 *
		 * 1. Propagate descending
		 * 2. Propagate ascending
		 * TODO: Don't post to universal domain "*"
		 * @param {gui.Broadcast} b
		 */
		_propagate: function(b) {
			var postmessage = (function stamp() {
				b.$contextids.push(gui.$contextid);
				return gui.Broadcast.stringify(b);
			}());
			this._propagateDown(postmessage);
			this._propagateUp(postmessage, b.type);
		},

		/**
		 * Propagate broadcast to sub documents.
		 * TODO: implement something similar to {gui.IframeSpirit._postbox} 
		 * but without expecting the bundle gui-spirits@wunderbyte.com 
		 * (it would in that case involve onload instead of onspiritualized)
		 * @param {string} postmessage
		 */
		_propagateDown: function(postmessage) {
			var iframes = document.querySelectorAll("iframe");
			Array.forEach(iframes, function(iframe) {
				iframe.contentWindow.postMessage(postmessage, '*');
			});
		},

		/**
		 * Propagate broadcast to parent document.
		 * @param {string} postmessage
		 */
		_propagateUp: function(postmessage) {
			if (window !== top) {
				parent.postMessage(postmessage, "*");
			}
		}

	});

}(gui.Arguments.confirmed, gui.Combo.chained));



/** 
 * Ticks are used for timed events.
 * TODO: Tick.push
 * @using {gui.Arguments#confirmed}
 */
(function using(confirmed) {

	/**
	 * @param {String} type
	 */
	gui.Tick = function(type) {
		this.type = type;
	};

	gui.Tick.prototype = {

		/**
		 * Tick type.
		 * @type {String}
		 */
		type: null,

		/**
		 * Identification.
		 * @returns {String}
		 */
		toString: function() {
			return "[object gui.Tick]";
		}
	};


	// Static ....................................................................

	gui.Object.extend(gui.Tick, {

		/**
		 * Identification.
		 * @returns {String}
		 */
		toString: function() {
			return "[function gui.Tick]";
		},

		/**
		 * Add handler for tick.
		 * TODO: Sig argument is deprecated...
		 * @param {object} type String or array of strings
		 * @param {object} handler
		 * @param @optional {boolean} one Remove handler after on tick of this type?
		 * @returns {function}
		 */
		add: confirmed("string|array", "object|function", "(string)")(
			function(type, handler, sig) {
				return this._add(type, handler, false, sig || gui.$contextid);
			}
		),

		/**
		 * Remove handler for tick.
		 * @param {object} type String or array of strings
		 * @param {object} handler
		 * @returns {function}
		 */
		remove: confirmed("string|array", "object|function", "(string)")(
			function(type, handler, sig) {
				return this._remove(type, handler, sig || gui.$contextid);
			}
		),

		/**
		 * Add auto-removing handler for tick.
		 * @param {object} type String or array of strings
		 * @param {object} handler
		 * @returns {function}
		 */
		one: confirmed("string|array", "object|function", "(string)")(
			function(type, handler, sig) {
				return this._add(type, handler, true, sig || gui.$contextid);
			}
		),

		/**
		 * Schedule action for next available execution stack.
		 * @TODO: deprecate setImmedate polyfix and do the fix here
		 * @param {function} action
		 * @param @optional {object} thisp
		 */
		next: function(action, thisp) {
			setImmediate(function() {
				action.call(thisp);
			});
		},

		/**
		 * Schedule action for next animation frame.
		 * @TODO: deprecate requestAnimationFrame polyfix and do the fix here
		 * @param {function} action
		 * @param @optional {object} thisp
		 * returns {number}
		 */
		nextFrame: function(action, thisp) {
			return requestAnimationFrame(function(timestamp) {
				action.call(thisp, timestamp);
			});
		},

		/**
		 * Cancel animation frame by index.
		 * @param {number} n
		 */
		cancelFrame: function(n) {
			cancelAnimationFrame(n);
		},

		/**
		 * Set a timeout.
		 * @param {function} action
		 * @param @optional {number} time Default to something like 4ms
		 * @param @optional {object} thisp
		 * returns {number}
		 */
		time: confirmed('function', '(number)', '(function|object)')(
			function(action, time, thisp) {
				return setTimeout(function() {
					action.call(thisp);
				}, time || 0);
			}
		),

		/**
		 * Cancel timeout by index.
		 * @param {number} n
		 */
		cancelTime: function(n) {
			clearTimeout(n);
		},

		/**
		 * Start repeated tick of given type.
		 * @param {string} type Tick type
		 * @param {ITickHandler} handler
		 * @param @optional {number} time Time in milliseconds
		 * @returns {function}
		 */
		start: confirmed("string", "(number)")(
			function(type, time) {
				var map = this._intervals;
				if (!map[type]) {
					var tick = new gui.Tick(type);
					map[type] = setInterval(function() {
						this._doit(tick);
					}.bind(this), time || 0);
				}
			}
		),

		/**
		 * Stop repeated tick of given type.
		 * @param {String} type Tick type
		 * @returns {function}
		 */
		stop: confirmed("string")(
			function(type) {
				var map = this._intervals;
				var id = map[type];
				if (id) {
					clearInterval(id);
					delete map[type];
				}
			}
		),

		/**
		 * Dispatch tick now or in specified time. Omit time to
		 * dispatch now. Zero resolves to next available thread.
		 * @param {String} type
		 * @param @optional {number} time
		 * @returns {gui.Tick}
		 */
		dispatch: function(type, time, sig) {
			return this._dispatch(type, time, sig || gui.$contextid);
		},
		

		// Private static ..........................................................

		/**
		 * Comment goes here.
		 */
		_intervals: Object.create(null),

		/**
		 * Return of the comment.
		 */
		_tempname: {
			types: Object.create(null),
			handlers: Object.create(null)
		},

		/**
		 * Hello.
		 */
		_add: function(type, handler, one, sig) {
			if (gui.Type.isArray(type)) {
				type.forEach(function(t) {
					this._add(t, handler, one, sig);
				}, this);
			} else {
				var list, index;
				var map = this._tempname;
				list = map.handlers[type];
				if (!list) {
					list = map.handlers[type] = [];
				}
				index = list.indexOf(handler);
				if (index < 0) {
					index = list.push(handler) - 1;
				}
				/*
				 * @TODO
				 * Adding a property to an array will
				 * make it slower in Firefox. Fit it!
				 */
				if (one) {
					list._one = list._one || Object.create(null);
					list._one[index] = true;
				}
			}
			return this;
		},

		/**
		 * Hello.
		 */
		_remove: function(type, handler, sig) {
			if (gui.Type.isArray(type)) {
				type.forEach(function(t) {
					this.remove(t, handler, sig);
				}, this);
			} else {
				var map = this._tempname;
				var list = map.handlers[type];
				if (list) {
					var index = list.indexOf(handler);
					if (gui.Array.remove(list, index) === 0) {
						delete map.handlers[type];
					}
				}
			}
			return this;
		},

		/**
		 * Dispatch tick sooner or later.
		 * @param {String} type
		 * @param @optional {number} time
		 * @param @optional {String} sig
		 */
		_dispatch: function(type, time, sig) {
			var map = this._tempname;
			var types = map.types;
			var tick = new gui.Tick(type);
			time = time || 0;
			if (!types[type]) { // !!!!!!!!!!!!!!!!!!!!!!!
				types[type] = true;
				var that = this,
					id = null;
				if (!time) {
					id = setImmediate(function() {
						delete types[type];
						that._doit(tick);
					});
				} else {
					id = setTimeout(function() {
						delete types[type];
						that._doit(tick);
					}, time);
				}
			}
			return tick;
		},

		/**
		 * Tick now.
		 * TODO: figure out how destructed spirits should 
		 * behave while we loop through handlers
		 * @param {gui.Tick} tick
		 */
		_doit: function(tick) {
			var list = this._tempname.handlers[tick.type];
			if (list) {
				list.slice().forEach(function(handler) {
					handler.ontick(tick);
				});
			}
		}

	});

}(gui.Arguments.confirmed));



/**
 * Document lifecycle manager.
 * TODO: Support custom implementation?
 */
gui.Document = (function() {

	/**
	 * Dispatch global action to hosting document (if any).
	 * This will most likely get picked up by the containing
	 * {gui.IframeSpirit} so that it knows what's going on.
	 * @param {string} type
	 * @param @optional {object} data
	 */
	function doaction(type, data) {
		if (gui.hosted) {
			gui.Action.ascendGlobal(document, type, data);
		}
	}

	/**
	 * Dispatch one or more (local) broadcasts.
	 */
	function dobrodcast( /* ...types*/ ) {
		gui.Array.make(arguments).forEach(function(type) {
			gui.Broadcast.dispatch(type);
		});
	}

	/*
	 * Create the class already.
	 */
	return gui.Class.create(Object.prototype, {

		/**
		 * Setup loads of event listeners.
		 */
		onconstruct: function() {
			var that = this,
				add = function(target, events, capture) {
					events.split(' ').forEach(function(type) {
						target.addEventListener(type, that, capture);
					});
				};
			add(document, 'DOMContentLoaded');
			add(document, 'click mousedown mouseup', true);
			add(window, 'load hashchange');
			if (!gui.hosted) {
				add(window, 'resize orientationchange');
			}
			if (!(window.chrome && chrome.app && chrome.runtime)) {
				add(window, 'unload');
			}
			
			/*
			if (document.readyState === "complete") { // TODO: IE cornercase?
				if (!this._loaded) {
					this._ondom();
					this._onload();
				}
			}
			*/
		},

		/**
		 * Handle event.
		 * @param {Event} e
		 */
		handleEvent: function(e) {
			switch (e.type) {
				case 'click':
				case 'mousedown':
				case 'mouseup':
					this._onmouseevent(e);
					break;
				case 'orientationchange':
					this._onrotate();
					break;
				case 'resize':
					this._onresize();
					break;
				case 'DOMContentLoaded':
					this._ondom();
					/*
					if (!gui.hasModule('gui-spirits@wunderbyte.com')) {
						(function cleanthisup() {
							gui._oninit();
							gui.$onready();
						}());
					}
					*/
					break;
				case 'load':
					this._onload();
					break;
				case 'unload':
					this._onunload();
					break;
				case 'hashchange':
					this._onhashchange();
					break;
			}
		},


		// Private .................................................................

		/**
		 * Window loaded?
		 * @type {boolean}
		 */
		_loaded: false,

		/**
		 * DOMContentLoaded?
		 * @type {boolean}
		 */
		_domloaded: true,

		/**
		 * Resize-end timeout id.
		 * @type {number}
		 */
		_timeout: -1,

		/**
		 * TODO: broadcast from here to trigger the {gui.Guide}
		 *
		 * 1. Name all namespace members (toString methods and such)
		 * 2. Resolve META tags that may configure namespaces properties
		 * 3. Dispatch `DOMContentLoaded` action to hosting document
		 * 4. Broadcast 'DOMContentLoaded' status in two discrete steps
		 */
		_ondom: function() {
			this._domloaded = true;
			gui.$initialize();
			this._configure(gui.namespaces());
			doaction(gui.ACTION_DOC_ONDOMCONTENT, location.href);
			dobrodcast(
				gui.BROADCAST_TODOM, // intercepted in gui.extensions.js (if bundled)
				gui.BROADCAST_ONDOM // hm.....
			);
		},

		/**
		 * Dispatch `load` event to hosting document.
		 */
		_onload: function() {
			this._loaded = true;
			dobrodcast(gui.BROADCAST_TOLOAD, gui.BROADCAST_ONLOAD);
			doaction(gui.ACTION_DOC_ONLOAD, location.href);
		},

		/**
		 * Dispatch `unload` event to hosting document.
		 * TODO: https://developer.mozilla.org/en-US/docs/Using_Firefox_1.5_caching
		 */
		_onunload: function() {
			this._unloaded = true;
			gui.$shutdown();
			dobrodcast(gui.BROADCAST_TOUNLOAD, gui.BROADCAST_ONUNLOAD);
			doaction(gui.ACTION_DOC_UNLOAD, location.href);
		},

		/**
		 * Dispatch `hashchange` status to hosting document.
		 */
		_onhashchange: function() {
			doaction(gui.ACTION_DOC_ONHASH, location.hash);
		},

		/**
		 * Dispatch global broadcasts on selected mouse events
		 * (close that menu when the user clicks that iframe).
		 * @param {Event} e
		 */
		_onmouseevent: function(e) {
			gui.broadcastGlobal(({
				"click": gui.BROADCAST_MOUSECLICK,
				"mousedown": gui.BROADCAST_MOUSEDOWN,
				"mouseup": gui.BROADCAST_MOUSEUP
			})[e.type], gui.$contextid);
		},

		/**
		 * Intensive resize procedures should subscribe
		 * to the resize-end message as broadcasted here.
		 * TODO: Don't broadcast global (and no gui.hosted)
		 */
		_onresize: function() {
			if (!gui.hosted) {
				clearTimeout(this._timeout);
				this._timeout = setTimeout(function() {
					gui.broadcastGlobal(gui.BROADCAST_RESIZE_END);
				}, gui.TIMEOUT_RESIZE_END);
			}
		},

		/**
		 * Device orientation changed.
		 * TODO: gui.Device of some sorts?
		 */
		_onrotate: function() {
			if (!gui.hosted) {
				gui.orientation = window.innerWidth > window.innerHeight ? 1 : 0;
				gui.broadcastGlobal(gui.BROADCAST_ORIENTATIONCHANGE, gui.orientation);
			}
		},

		/**
		 * Resolve metatags that appear to
		 * configure stuff in namespaces.
		 * @param {Array<string>} spaces
		 */
		_configure: function(spaces) {
			var prop, def, metas = document.querySelectorAll('meta[name]');
			Array.forEach(metas, function(meta) {
				prop = meta.getAttribute('name');
				spaces.forEach(function(ns) {
					if (prop.startsWith(ns + '.')) {
						def = gui.Object.lookup(prop);
						if (gui.Type.isDefined(def)) {
							gui.Object.assert(prop,
								gui.Type.cast(meta.getAttribute('content'))
							);
						} else {
							console.error('No definition for "' + prop + '"');
						}
					}
				});
			});
		}

	});

}());

/**
 * Here we go.
 */
gui.document = new gui.Document();

/*
var hack = gui.Client.isExplorer ? 'loading' : document.readyState;
switch (hack) {
	case "loading":
		document.addEventListener("DOMContentLoaded", this, false);
		window.addEventListener("load", this, false);
		break;
	case "interactive":
		this._ondom();
		window.addEventListener("load", this, false);
		break;
	case "complete":
		//this._ondom();
		break;
}
*/



/**
 * Module base. Unknown to many, new
 * modules will be a subclass of this.
 */
gui.Module = gui.Class.create(Object.prototype, {

	/**
	 * Called immediately. Other modules may not be parsed yet.
	 * TODO: Migrate to 'onrun' in the long run.
	 * @return {Window} context
	 */
	oncontextinitialize: function() {},

	/**
	 * Called immediately. Other modules may not be parsed yet.
	 * @type {function}
	 */
	onrun: function() {},

	/**
	 * Called on DOMContentLoaded.
	 * @type {function}
	 */
	ondom: function() {},

	/**
	 * Called on load.
	 * @type {function}
	 */
	onload: function() {},

	/**
	 * Called on unload.
	 * @type {function}
	 */
	onunload: function() {},


	// Privileged ................................................................

	/**
	 * Module identity token.
	 * @type {string}
	 */
	$modname: null,

	/**
	 * Secret constructor.
	 * @param {string} name
	 */
	$onconstruct: function(name) {
		this.$modname = name;
		this.toString = function() {
			return '[module ' + name + ']';
		};
	}


}, {}, { // Static .............................................................

	/**
	 * Register module, although please use 'gui.module()' to do so.
	 * TODO: deprecate oncontextinitialize!
	 * @param {gui.Module} module
	 * @returns {gui.Module}
	 */
	$register: function(module) {
		var name = module.$modname;
		if (!this.$hasModule(name)) {
			this._modules.push(module);
			if (gui.Type.isFunction(module.oncontextinitialize)) {
				module.oncontextinitialize(window);
			}
			if (gui.Type.isFunction(module.onrun)) {
				module.onrun();
			}
		} else {
			throw new Error(name + ' loaded twice?');
		}
		return module;
	},

	/**
	 * Module registered by name?
	 * @param {string} name
	 * @returns {boolean}
	 */
	$hasModule: function(name) {
		return this._modules.some(function(module) {
			return module.$modname === name;
		});
	},

	/**
	 * Collecting modules.
	 * @type {Array<gui.Module>}
	 */
	_modules: []

});

/**
 * Hookup modules to document lifecycle.
 * @param {Array<gui.Module>} modules
 */
(function hookup(modules) {
	gui.Object.each({
		'ondom': gui.BROADCAST_TODOM,
		'onload': gui.BROADCAST_TOLOAD,
		'onunload': gui.BROADCAST_TOUNLOAD
	}, function associate(action, broadcast) {
		gui.Broadcast.add(broadcast, {
			onbroadcast: function() {
				modules.forEach(function(module) {
					module[action]();
				});
			}
		});
	});
}(gui.Module._modules));



/**
 * Where spirits go to be garbage collected. Not for public
 * consumption: Please dispose of spirits via the {gui.Guide}. 
 * TODO: Don't assume that we are collecting spirits primarily
 * @see {gui.Guide#materialize}
 * @see {gui.Guide#materializeOne}
 * @see {gui.Guide#materializeSub}
 */
gui.Garbage = {

	/**
	 * To identify our exception in a try-catch scenario, look for
	 * this string in the *beginning* of the exception message
	 * since sometimes we might append additional information.
	 * @type {string}
	 */
	DENIAL: "Attempt to handle destructed object",

	/**
	 * Identification.
	 * @returns {string}
	 */
	toString: function() {
		return "[object gui.Garbage]";
	},

	/**
	 * Nukefication moved to next tick. This will minimize chaos,
	 * but does imply that for the duration of this tick, methods
	 * might be called on spirits that don't exist in the DOM and 
	 * this should technically not be possible :/
	 */
	ontick: function(t) {
		if (t.type === 'gui-tick-garbage-empty') {
			if (window.gui) { // hotfix IE window unloaded scenario (TODO: still?)
				this._nukemnow();
			}
		}
	},


	// Privileged ................................................................

	/**
	 * Schedule to nuke the spirit.
	 * TODO: Make this work for stuff that ain't exactly spirits
	 * @param {gui.Spirit} spirit
	 */
	$collect: function(spirit) {
		if (gui.unloading) {
			this.$nuke(spirit);
		} else {
			this._spirits.push(spirit);
			gui.Tick.dispatch('gui-tick-garbage-empty');
		}
	},

	/**
	 * Nuke that spirit.
	 *
	 * - Nuke lazy plugins so that we don't accidentally instantiate them
	 * - Destruct remaining plugins, saving the {gui.Life} plugin for last
	 * - Replace all properties with an accessor to throw an exception
	 *
	 * @param {gui.Spirit} spirit
	 */
	$nuke: function(spirit) {
		var prefixes = [],
			plugins = spirit.life.plugins;
		gui.Object.each(plugins, function(prefix, instantiated) {
			if (instantiated) {
				if (prefix !== "life") {
					prefixes.push(prefix);
				}
			} else {
				Object.defineProperty(spirit, prefix, {
					enumerable: true,
					configurable: true,
					get: function() {},
					set: function() {}
				});
			}
		});
		plugins = prefixes.map(function(key) {
			return spirit[key];
		}, this);
		if (!gui.unloading) {
			this.$nukeplugins(plugins, false);
			gui.Tick.next(function() { // TODO: organize this at some point...
				this.$nukeplugins(plugins, true);
				this.$nukeelement(spirit);
				this.$nukeallofit(spirit);
			}, this);
		}
	},

	/**
	 * Nuke plugins in three steps to minimize access violations.
	 * @param {gui.Spirit} spirit
	 * @param {Array<String>} prefixes
	 * @param {boolean} nuke
	 */
	$nukeplugins: function(plugins, nuke) {
		if (nuke) {
			plugins.forEach(function(plugin) {
				this.$nukeallofit(plugin);
			}, this);
		} else {
			plugins.map(function(plugin) {
				plugin.ondestruct();
				return plugin;
			}).forEach(function(plugin) {
				plugin.$ondestruct();
			});
		}
	},

	/**
	 * Unreference spirit associated element.
	 * Explorer may deny permission in frames.
	 * @TODO: Is IE exception still relevant?
	 */
	$nukeelement: function(spirit) {
		try {
			spirit.element.spirit = null;
		} catch (denied) {}
	},

	/**
	 * Replace own properties with an accessor to throw an exception.
	 * In 'gui.debug' mode we replace all props, not just own props,
	 * so that we may fail fast on attempt to handle destructed spirit.
	 * @TODO: keep track of non-enumerables and nuke those as well :/
	 * @param {object} thing
	 */
	$nukeallofit: function(thing) {
		var nativeprops = Object.prototype;
		if (!gui.unloading && !thing.$destructed) {
			thing.$destructed = true;
			for (var prop in thing) {
				if (thing.hasOwnProperty(prop) || gui.debug) {
					if (nativeprops[prop] === undefined) {
						if (prop !== '$destructed') {
							var desc = Object.getOwnPropertyDescriptor(thing, prop);
							if (!desc || desc.configurable) {
								if (gui.debug) {
									this._definePropertyItentified(thing, prop);
								} else {
									Object.defineProperty(thing, prop, this.DENIED);
								}
							}
						}
					}
				}
			}
		}
	},

	/**
	 * User to access property post destruction,
	 * report that the spirit was terminated.
	 */
	DENIED: {
		enumerable: true,
		configurable: true,
		get: function() {
			gui.Garbage.DENY();
		},
		set: function() {
			gui.Garbage.DENY();
		}
	},

	/**
	 * Obscure mechanism to include the whole stacktrace in the error message
	 * because some kind of Selenium WebDriver can't print stack traces...
	 * @see https://gist.github.com/jay3sh/1158940
	 * @param @optional {string} message
	 */
	DENY: function(message) {
		var stack, e = new Error(
			gui.Garbage.DENIAL + (message ? ": " + message : "")
		);
		if (!gui.Client.isExplorer && (stack = e.stack)) {
			if (gui.Client.isWebKit) {
				stack = stack.replace(/^[^\(]+?[\n$]/gm, "").
				replace(/^\s+at\s+/gm, "").
				replace(/^Object.<anonymous>\s*\(/gm, "{anonymous}()@").
				split("\n");
			} else {
				stack = stack.split("\n");
			}
			stack.shift();
			stack.shift(); // @TODO: shift one more now?
			console.warn(e.message + "\n" + stack);
		} else {
			console.warn(e.message);
		}
	},


	// Private ...................................................................

	/**
	 * Spirits scheduled for destruction.
	 * @type {Array<gui.Spirit>}
	 */
	_spirits: [],

	/**
	 * In debug mode, throw a more qualified "attempt to handle destructed spirit"
	 * @param {object} thing
	 * @param {string} prop
	 */
	_definePropertyItentified: function(thing, prop) {
		Object.defineProperty(thing, prop, {
			enumerable: true,
			configurable: true,
			get: function() {
				gui.Garbage.DENY(thing);
			},
			set: function() {
				gui.Garbage.DENY(thing);
			}
		});
	},

	/**
	 * Nuke spirits now.
	 */
	_nukemnow: function() {
		var spirit, spirits = this._spirits.slice();
		if (window.gui) { // hotfix IE window unloaded scenario...
			while ((spirit = spirits.shift())) {
				this.$nuke(spirit);
			}
			this._spirits = [];
		}
	}

};

gui.Tick.add('gui-tick-garbage-empty', gui.Garbage);



/**
 * Resolve an URL string relative to a document.
 * TODO: Read https://gist.github.com/jlong/2428561
 * @param {Document} doc TODO: Move to second arg!
 * @param {String} href
 */
gui.URL = function(doc, href) {
	if (doc && doc.nodeType === Node.DOCUMENT_NODE) {
		var val, link = gui.URL._createLink(doc, href);
		Object.keys(gui.URL.prototype).forEach(function(key) { // TODO: exclude toString somehow...
			if (gui.Type.isString((val = link[key]))) {
				if (key === "pathname" && !val.startsWith("/")) {
					val = "/" + val; // http://stackoverflow.com/questions/956233/javascript-pathname-ie-quirk
				}
				this[key] = val;
			}
		}, this);
		this.id = this.hash ? this.hash.substring(1) : null;
		this.external = this.href.split("#")[0] !== doc.URL.split("#")[0];
	} else {
		throw new TypeError("Document expected");
	}
};

gui.URL.prototype = {
	hash: null, // #test
	host: null, // www.example.com:80
	hostname: null, // www.example.com
	href: null, // http://www.example.com:80/search?q=devmo#test
	pathname: null, // search
	port: null, // 80
	protocol: null, // http:
	search: null, // ?q=devmo
	id: null, // test,
	external: false, // external relative to the *document*, not the server host!!! (rename "outbound" to clear this up?)
	toString: function() { // behave somewhat like window.location ....
		return this.href;
	}
};


// Statics ..............................................................................................

/**
 * Convert relative path to absolute path in context of base where base is a document or an absolute path.
 * @see http://stackoverflow.com/questions/14780350/convert-relative-path-to-absolute-using-javascript
 * @param {String|Document} base
 * @param {String} href
 * @returns {String}
 */
gui.URL.absolute = function(base, href) { // return /(^data:)|(^http[s]?:)|(^\/)/.test(inUrl);
	href = href || "";
	if (base.nodeType === Node.DOCUMENT_NODE) {
		return new gui.URL(base, href).href;
	} else if (typeof base === "string") {
		var stack = base.split("/");
		var parts = href.split("/");
		stack.pop(); // remove current filename (or empty string) (omit if "base" is the current folder without trailing slash)
		parts.forEach(function(part) {
			if (part !== ".") {
				if (part === "..") {
					stack.pop();
				} else {
					stack.push(part);
				}
			}
		});
		return stack.join("/");
	}
};

/**
 * Is URL external to document (as in external host)?
 * @param {String} url
 * @param {Document} doc
 * @returns {boolean}
 */
gui.URL.external = function(src, doc) {
	doc = doc || document;
	var url = new gui.URL(doc, src);
	return url.host !== doc.location.host || url.port !== doc.location.port;
};

/**
 * Extract querystring parameter value from URL.
 * @param {String} url
 * @param {String} name
 * @returns {String} String or null
 */
gui.URL.getParam = function(url, name) {
	name = name.replace(/(\[|\])/g, "\\$1");
	var results = new RegExp("[\\?&]" + name + "=([^&#]*)").exec(url);
	return results === null ? null : results[1];
};

/**
 * Add or remove (unencoded) querystring parameter from URL. If it
 * already exists, we'll replace it's (first ancountered) value.
 * TODO: Something simpler
 * @param {String} url
 * @param {String} name
 * @param {String} value Use null to remove
 * @returns {String} String
 */
gui.URL.setParam = function(url, name, value) {
	var params = [],
		cut, index = -1;
	var path = url.split("#")[0];
	var hash = url.split("#")[1];
	if (path.indexOf("?") > -1) {
		cut = path.split("?");
		path = cut[0];
		params = cut[1].split("&");
		params.every(function(param, i) {
			var x = param.split("=");
			if (x[0] === name) {
				index = i;
				if (value !== null) {
					x[1] = value;
					params[i] = x.join("=");
				}
			}
			return index < 0;
		});
	}
	if (value === null) {
		if (index > -1) {
			params.remove(index, index);
		}
	} else if (index < 0) {
		params[params.length] = [name, value].join("=");
	}
	params = params.length > 0 ? "?" + params.join("&") : "";
	return path + params + (hash ? "#" + hash : "");
};

/**
 * Format URL with hashmap key-values as querystring parameters.
 * @param {String} baseurl
 * param @optional {Map<String,String|number|boolean|Array>} params
 * @returns {String}
 */
gui.URL.parametrize = function(baseurl, params) {
	if (gui.Type.isObject(params)) {
		gui.Object.each(params, function(key, value) {
			baseurl += baseurl.includes("?") ? "&" : "?";
			switch (gui.Type.of(value)) {
				case "array":
					baseurl += value.map(function(member) {
						return key + "=" + String(member);
					}).join("&");
					break;
				default:
					baseurl += key + "=" + String(value);
					break;
			}
		});
	}
	return baseurl;
};

/**
 * @TODO: fix this
 * @param {Window} win
 * @returns {String}
 */
gui.URL.origin = function(win) {
	var loc = win.location;
	return loc.origin || loc.protocol + "//" + loc.host;
};

/**
 * @param {Document} doc
 * @param @optional {String} href
 */
gui.URL._createLink = function(doc, href) {
	var link = doc.createElement("a");
	link.href = href || "";
	if (gui.Client.isExplorer) { // IE9???
		var uri = gui.URL.parseUri(link.href);
		Object.keys(uri).forEach(function(key) {
			if (!link[key]) {
				link[key] = uri[key]; // this is wrong...
			}
		});
	}
	return link;
};

/**
 * Temp IE hotfix...
 * @see http://blog.stevenlevithan.com/archives/parseuri
 * TODO: https://github.com/websanova/js-url
 * TODO: https://github.com/allmarkedup/purl
 */
gui.URL.parseUri = function(str) {
	var o = gui.URL.parseOptions,
		m = o.parser[o.strictMode ? "strict" : "loose"].exec(str),
		uri = {},
		i = 14;
	while (i--) {
		uri[o.key[i]] = m[i] || "";
	}
	uri[o.q.name] = {};
	uri[o.key[12]].replace(o.q.parser, function($0, $1, $2) {
		if ($1) {
			uri[o.q.name][$1] = $2;
		}
	});
	return uri;
};

/**
 * Temp IE hotfix...
 * TODO: Now that it's not so temp anymore, at least figure out where it came from...
 */
gui.URL.parseOptions = {
	strictMode: true,
	key: ["source", "protocol", "authority", "userInfo", "user", "password", "host", "port", "relative", "path", "directory", "file", "query", "anchor"],
	q: {
		name: "queryKey",
		parser: /(?:^|&)([^&=]*)=?([^&]*)/g
	},
	parser: {
		strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
		loose: /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
	}
};



/**
 * Encapsulates a callback for future use.
 * TODO: mimic DOM Futures to some degree.
 * TODO: The future is here, deprecate this
 * @param @optional {function} callback
 * @param @optional {object} thisp
 */
gui.Then = function Then(callback, thisp) {
	if (callback) {
		this.then(callback, thisp);
	}
};

gui.Then.prototype = {

	/**
	 * Identification.
	 * @returns {String}
	 */
	toString: function() {
		return "[object gui.Then]";
	},

	/**
	 * Setup callback with optional this-pointer.
	 * @param {function} callback
	 * @param @optional {object} pointer
	 */
	then: function(callback, thisp) {
		this._callback = callback ? callback : null;
		this._pointer = thisp ? thisp : null;
		if (this._now) {
			this.now();
		}
	},

	/**
	 * Callback with optional this-pointer.
	 * @returns {object}
	 */
	now: function() {
		var c = this._callback;
		var p = this._pointer;
		if (c) {
			this.then(null, null);
			c.apply(p, arguments);
		} else {
			this._now = true;
		}
	},


	// Private ...................................................................

	/**
	 * Callback to execute.
	 * @type {function}
	 */
	_callback: null,

	/**
	 * "this" keyword in callback.
	 * @type {object}
	 */
	_pointer: null,

	/**
	 * Execute as soon as callback gets delivered?
	 * @type {boolean}
	 */
	_now: false

};



/**
 * Parsing markup strings to DOM nodes. You might think that this was called a 
 * DOMParser, but that's just plain wrong because it doesn't parse DOM elements.
 */
gui.HTMLParser = {

	/**
	 * Identification.
	 * @returns {String}
	 */
	toString: function() {
		return "[object gui.HTMLParser]";
	},

	/**
	 * Parse to element.
	 * @param {String} markup
	 * @param @optional {Document} targetdoc
	 * @returns {Node}
	 */
	parse: function(markup, targetdoc) {
		return this.parseAll(markup, targetdoc)[0] || null;
	},

	/**
	 * Parse to array of one or more elements.
	 * @param {String} markup
	 * @param @optional {Document} targetdoc
	 * @returns {Array<Element>}
	 */
	parseAll: function(markup, targetdoc) {
		return this.parseToNodes(markup, targetdoc).filter(function(node) {
			return node.nodeType === Node.ELEMENT_NODE;
		});
	},

	/**
	 * Parse to node.
	 * @param {String} markup
	 * @param @optional {Document} targetdoc
	 * @returns {Node}
	 */
	parseToNode: function(markup, targetdoc) {
		return this.parseToNodes(markup, targetdoc)[0] || null;
	},

	/**
	 * Parse to array of one or more nodes.
	 * @param {String} markup
	 * @param @optional {Document} targetdoc
	 * @returns {Array<Node>}
	 */
	parseToNodes: function(markup, targetdoc) {
		var elm, doc = this._document ||
			(this._document = document.implementation.createHTMLDocument(""));
		return gui.Guide.suspend(function() {
			doc.body.innerHTML = this._unsanitize(markup);
			elm = doc.querySelector("." + this._classname) || doc.body;
			return Array.map(elm.childNodes, function(node) {
				return (targetdoc || document).importNode(node, true);
			});
		}, this);
	},

	/**
	 * Parse to document. Bear in mind that the
	 * document.defaultView of this thing is null.
	 * @TODO: Use DOMParser for text/html supporters
	 * @param {String} markup
	 * @returns {HTMLDocument}
	 */
	parseToDocument: function(markup) {
		markup = markup || "";
		return gui.Guide.suspend(function() {
			var doc = document.implementation.createHTMLDocument("");
			if (markup.toLowerCase().includes("<!doctype")) {
				try {
					doc.documentElement.innerHTML = markup;
				} catch (ie9exception) {
					doc = new ActiveXObject("htmlfile");
					doc.open();
					doc.write(markup);
					doc.close();
				}
			} else {
				doc.body.innerHTML = markup;
			}
			return doc;
		});
	},


	// Private ...................................................................

	/**
	 * Classname for obscure wrapping containers.
	 * @type {String}
	 */
	_classname: "_gui-htmlparser",

	/**
	 * Match comments.
	 * @type {RegExp}
	 */
	_comments: /<!--[\s\S]*?-->/g,

	/**
	 * Match first tag.
	 * @type {RegExp}
	 */
	_firsttag: /^<([a-z]+)/i,

	/**
	 * Recycled for parseToNodes operations.
	 * TODO: Create on first demand
	 * @type {HTMLDocument}
	 */
	_document: null,

	/**
	 * Some elements must be created in obscure markup
	 * structures in order to be rendered correctly.
	 * @param {String} markup
	 * @returns {String}
	 */
	_unsanitize: function(markup) {
		var match, fix;
		markup = markup.trim().replace(this._comments, "");
		if ((match = markup.match(this._firsttag))) {
			if ((fix = this._unsanestructures[match[1]])) {
				markup = fix.
				replace("${class}", this._classname).
				replace("${markup}", markup);
			}
		}
		return markup;
	},

	/**
	 * Mapping tag names to miminum viable tag structure.
	 * @see https://github.com/petermichaux/arbutus
	 * TODO: "without the option in the next line, the
	 * parsed option will always be selected."
	 * @type {Map<String,String>}
	 */
	_unsanestructures: (function() {
		var map = {
			'td': '<table><tbody><tr class="${class}">${markup}</tr></tbody></table>',
			'tr': '<table><tbody class="${class}">${markup}</tbody></table>',
			'tbody': '<table class="${class}">${markup}</table>',
			'col': '<table><colgroup class="${class}">${markup}</colgroup></table>',
			'option': '<select class="${class}"><option>a</option>${markup}</select>'
		};
		map["th"] = map["td"]; // duplicate fixes.
		["thead", "tfoot", "caption", "colgroup"].forEach(function(tag) {
			map[tag] = map["tbody"];
		});
		return map;
	}())
};



/**
 * Provides convenient access to an events originating
 * window, document and spirit of the document element.
 * TODO: Fire this onmousemove only if has listeners!
 * @param {Event} e
 */
gui.EventSummary = function(e) {
	this._construct(e);
};

gui.EventSummary.prototype = {

	/**
	 * The event itself.
	 * @type {Event}
	 */
	event: null,

	/**
	 * Originating window.
	 * @type {Window}
	 */
	window: null,

	/**
	 * Originating document.
	 * @type {Document}
	 */
	document: null,

	/**
	 * Spirit of the root element (the HTML element) in originating document.
	 * @type {gui.DocumentSpirit}
	 */
	documentspirit: null,

	/**
	 * Identification.
	 * @returns {String}
	 */
	toString: function() {
		return "[object gui.EventSummary]";
	},


	// Private ...................................................................

	/**
	 * Breakdown event argument into more manegable properties
	 * (this method illustrates the need for en event summary).
	 * @param {Event} e
	 * @returns {object}
	 */
	_construct: function(e) {
		var win = null,
			doc = null,
			target = e.target,
			type = target.nodeType;
		if (gui.Type.isDefined(type)) {
			doc = (type === Node.DOCUMENT_NODE ? target : target.ownerDocument);
			win = doc.defaultView;
		} else {
			win = target;
			doc = win.document;
		}
		this.event = e;
		this.window = win;
		this.document = doc;
		this.documentspirit = doc.documentElement.spirit;
	}
};



/**
 * Crawling the DOM ascending or descending.
 * TODO: method `descendBelow` and 'ascendAbove' to skip start element
 * @using {gui.Type} type
 */
gui.Crawler = (function using(Type) {

	return gui.Class.create(Object.prototype, {

		/**
		 * Identifies the crawler.
		 * @type {String}
		 */
		type: null,

		/**
		 * Direction "ascending" or "descending".
		 * @type {String}
		 */
		direction: null,

		/**
		 * @type {Boolean}
		 */
		global: false,

		/**
		 * Identification.
		 * @returns {String}
		 */
		toString: function() {
			return "[object gui.Crawler]";
		},

		/**
		 * Constructor.
		 * @param {String} type
		 */
		onconstruct: function(type) {
			this.type = type || null;
		},

		/**
		 * Crawl DOM ascending.
		 * @param {Element|gui.Spirit} start
		 * @param {object} handler
		 */
		ascend: function(start, handler) {
			this._stopped = false;
			this.direction = gui.Crawler.ASCENDING;
			var supports = gui.hasModule('gui-spirits@wunderbyte.com');
			var isspirit = supports && start instanceof gui.Spirit;
			var win, elm = isspirit ? start.element : start;
			do {
				if (elm.nodeType === Node.DOCUMENT_NODE) {
					if (this.global) {
						win = elm.defaultView;
						if (win.gui.hosted) { // win.parent !== win
							/*
							 * @TODO: iframed document might have navigated elsewhere, stamp this in localstorage
							 * @TODO: sit down and wonder if localstorage is even available in sandboxed iframes...
							 */
							if (win.gui.xhost) {
								elm = null;
								if (Type.isFunction(handler.transcend)) {
									handler.transcend(win.parent, win.gui.xhost, win.gui.$contextid);
								}
							} else {
								elm = win.frameElement;
							}
						} else {
							elm = null;
						}
					} else {
						elm = null;
					}
				}
				if (elm) {
					var directive = this._handleElement(elm, handler);
					switch (directive) {
						case gui.Crawler.STOP:
							elm = null;
							break;
						default:
							elm = elm.parentNode;
							break;
					}
				}
			} while (elm);
		},

		/**
		 * Crawl DOM ascending, transcend into ancestor frames.
		 * @param {Element|gui.Spirit} start
		 * @param {object} handler
		 */
		ascendGlobal: function(start, handler) {
			this.global = true;
			this.ascend(start, handler);
			this.global = false;
		},

		/**
		 * Crawl DOM descending.
		 * @param {object} start Spirit or Element
		 * @param {object} handler
		 * @param @optional {object} arg @TODO: is this even supported?
		 */
		descend: function(start, handler, arg) {
			this._stopped = false;
			this.direction = gui.Crawler.DESCENDING;
			var elm = (start instanceof gui.Spirit) ? start.element : start;
			if (elm.nodeType === Node.DOCUMENT_NODE) {
				elm = elm.documentElement;
			}
			this._descend(elm, handler, arg, true);
		},

		/**
		 * Crawl DOM descending, transcend into iframes.
		 * @param {object} start Spirit or Element
		 * @param {object} handler
		 * @param @optional {object} arg @TODO: is this even supported?
		 */
		descendGlobal: function(start, handler, arg) {
			this.global = true;
			this.descend(start, handler, arg);
			this.global = false;
		},


		// Private ...................................................................

		/**
		 * Crawler was stopped?
		 * @type {boolean}
		 */
		_stopped: false,

		/**
		 * Iterate descending.
		 * @param {Element} elm
		 * @param {object} handler
		 * @param {boolean} start
		 */
		_descend: function(elm, handler, arg, start) {
			var win, next, spirit, directive = this._handleElement(elm, handler, arg);
			switch (directive) {
				case gui.Crawler.STOP:
					this._stopped = true;
					break;
				case gui.Crawler.CONTINUE:
				case gui.Crawler.SKIP_CHILDREN:
					if (directive !== gui.Crawler.SKIP_CHILDREN) {
						if (elm.childElementCount) {
							this._descend(elm.firstElementChild, handler, arg, false);
						} else if (this.global && elm.localName === "iframe") {
							/*
							 * TODO: Make iframe transcend work even without spirit support.
							 */
							if ((spirit = elm.spirit) && (spirit instanceof gui.IframeSpirit)) {
								win = elm.ownerDocument.defaultView;
								if (Type.isFunction(handler.transcend)) {
									handler.transcend(
										spirit.contentWindow, 
										spirit.xguest, 
										spirit.$instanceid
									);
								}
							}
						}
					}
					if(!this._stopped) {
						if (!start && (next = elm.nextElementSibling))  {
							this._descend(next, handler, arg, false);
						}
					}
					break;
			}
		},

		/**
		 * Handle element. Invoked by both ascending and descending crawler.
		 * @param {Element} element
		 * @param {object} handler
		 * @returns {number} directive
		 */
		_handleElement: function(element, handler, arg) {
			var hasspirit = gui.hasModule('gui-spirits@wunderbyte.com');
			var directive = gui.Crawler.CONTINUE;
			var spirit;
			if (handler) {
				if (Type.isFunction(handler.handleElement)) {
					directive = handler.handleElement(element, arg);
				}
				if(!directive && hasspirit) {
					if((spirit = gui.get(element))) {
						directive = spirit.oncrawler(this);
						if (!directive) {
							if (Type.isFunction(handler.handleSpirit)) {
								directive = this._handleSpirit(spirit, handler);
							}
						}
					}
				}
			}
			if (!directive) {
				directive = gui.Crawler.CONTINUE;
			}
			return directive;
		},

		/**
		 * Handle Spirit.
		 * @param {Spirit} spirit
		 * @param {object} handler
		 * @returns {number}
		 */
		_handleSpirit: function(spirit, handler) {
			return handler.handleSpirit(spirit);
		}


	}, {}, { // Static .............................................................

		ASCENDING: "ascending",
		DESCENDING: "descending",
		CONTINUE: 0,
		STOP: 1,
		SKIP: 2, // @TODO: support this
		SKIP_CHILDREN: 4

	});

}(gui.Type));



/**
 * Simplistic XMLHttpRequest wrapper.
 * @param @optional {String} url
 * @param @optional {Document} doc Resolve URL relative to given document location.
 */
gui.Request = function Request(url, doc) {
	this._headers = {
		"Accept": "application/json"
	};
	if (url) {
		this.url(url, doc);
	}
};

/**
 * @using {gui.Combo#chained}
 */
gui.Request.prototype = (function using(chained) {

	return {

		/**
		 * Set request address.
		 * @param {String} url
		 * @param @optional {Document} doc Resolve URL relative to this document
		 */
		url: chained(function(url, doc) {
			this._url = doc ? new gui.URL(doc, url).href : url;
		}),

		/**
		 * Convert to synchronous request.
		 */
		sync: chained(function() {
			this._async = false;
		}),

		/**
		 * Convert to asynchronous request.
		 */
		async: chained(function() {
			this._async = true;
		}),

		/**
		 * Expected response type. Sets the accept header and formats
		 * callback result accordingly (eg. as JSON object, XML document)
		 * @param {String} mimetype
		 * @returns {gui.Request}
		 */
		accept: chained(function(mimetype) {
			this._headers.Accept = mimetype;
		}),

		/**
		 * Expect JSON response.
		 * @returns {gui.Request}
		 */
		acceptJSON: chained(function() {
			this.accept("application/json");
		}),

		/**
		 * Expect XML response.
		 * @returns {gui.Request}
		 */
		acceptXML: chained(function() {
			this.accept("text/xml");
		}),

		/**
		 * Expect text response.
		 * @returns {gui.Request}
		 */
		acceptText: chained(function() {
			this.accept("text/plain");
		}),

		/**
		 * Format response to this type.
		 * @param {String} mimetype
		 * @returns {gui.Request}
		 */
		format: chained(function(mimetype) {
			this._format = mimetype;
		}),

		/**
		 * Override mimetype to fit accept.
		 * @returns {gui.Request}
		 */
		override: chained(function(doit) {
			this._override = doit || true;
		}),

		/**
		 * Append request headers.
		 * @param {Map<String,String>} headers
		 * @returns {gui.Request}
		 */
		headers: chained(function(headers) {
			if (gui.Type.isObject(headers)) {
				gui.Object.each(headers, function(name, value) {
					this._headers[name] = String(value);
				}, this);
			} else {
				throw new TypeError("Object expected");
			}
		}),


		// Private ...................................................................................

		/**
		 * @type {boolean}
		 */
		_async: true,

		/**
		 * @type {String}
		 */
		_url: null,

		/**
		 * Default request type. Defaults to JSON.
		 * @type {String}
		 */
		_format: "application/json",

		/**
		 * Override response mimetype?
		 * @type {String}
		 */
		_override: false,

		/**
		 * Request headers.
		 * @type {Map<String,String}
		 */
		_headers: null,

		/**
		 * Do the XMLHttpRequest.
		 * TODO: http://mathiasbynens.be/notes/xhr-responsetype-json
		 * @param {String} method
		 * @param {object} payload
		 * @param {function} callback
		 */
		_request: function(method, payload, callback) {
			var that = this,
				request = new XMLHttpRequest();
			var xtarget = gui.URL.external(this._url, document);
			if (xtarget && window.XDomainRequest) {
				request = new window.XDomainRequest(); // @TODO: test this thing!
			}
			request.onreadystatechange = function() {
				if (this.readyState === XMLHttpRequest.DONE) {
					var data = that._response(this.responseText);
					callback(this.status, data, this.responseText);
				}
			};
			if (this._override) {
				request.overrideMimeType(this._headers.Accept);
			}
			request.open(method.toUpperCase(), this._url, true);
			if (!xtarget) { // headers not used xdomain per spec
				gui.Object.each(this._headers, function(name, value) {
					request.setRequestHeader(name, value, false);
				});
			}
			request.send(payload);
		},

		/**
		 * Parse response to expected type.
		 * @param {String} text
		 * @returns {object}
		 */
		_response: function(text) {
			var result = text;
			try {
				switch (this._headers.Accept) {
					case "application/json":
						result = JSON.parse(text);
						break;
					case "text/xml":
						result = new DOMParser().parseFromString(text, "text/xml");
						break;
				}
			} catch (exception) {
				if (gui.debug) {
					console.error(
						this._headers.Accept + " dysfunction at " + this._url
					);
				}
			}
			return result;
		}
	};

}(gui.Combo.chained));

/**
 * Generating methods for GET PUT POST DELETE.
 * @param @optional {object} payload
 */
["get", "post", "put", "delete"].forEach(function(method) {
	gui.Request.prototype[method] = function(payload) {
		if (gui.Type.isFunction(payload)) {
			throw new Error("Deprecated: gui.Request returns a gui.Then");
		}
		var then = new gui.Then();
		payload = method === "get" ? null : payload;
		this._request(method, payload, function(status, data, text) {
			then.now(status, data, text);
		});
		return then;
	};
});



/**
 * Questionable browser identity and feature detection.
 * @TODO Load earlier by not using gui.Broadcast
 * @TODO Lazycompute properties when requested (not least scrollBarSize)
 */
gui.Client = (function() {

	var agent = navigator.userAgent.toLowerCase();

	/**
	 * Supports CSS feature?
	 * @param {String} feature
	 * @returns {boolean}
	 */
	function supports(feature) {
		var root = document.documentElement;
		var fixt = feature[0].toUpperCase() + feature.substring(1);
		return !["", "Webkit", "Moz", "O", "ms"].every(function(prefix) {
			return root.style[prefix ? prefix + fixt : feature] === undefined;
		});
	}

	function Client() {

		// user agent death match - this obviously needs some work
		this.isExplorer = agent.includes("msie") || agent.includes("trident");
		this.isExplorer9 = this.isExplorer && agent.includes("msie 9");
		this.isExplorer10 = this.isExplorer && agent.includes("msie 10");
		this.isExplorer11 = this.isExplorer && agent.includes("rv:11");
		this.isWebKit = agent.includes("webkit") || agent.includes("opera");
		this.isChrome = this.isWebKit && agent.includes("chrome");
		this.isSafari = this.isWebKit && !this.isChrome && agent.includes("safari");
		this.isBlink = agent.includes("blink");
		this.isGecko = !this.isExplorer && !this.isWebKit && !this.isOpera && agent.includes("gecko");
		this.isChromeApp = (window.chrome && window.chrome.app && window.chrome.app.runtime) ? true : false;

		/**
		 * Agent is one of "webkit" "firefox" "opera" "explorer"
		 * @type {String}
		 */
		this.agent = (function() {
			var agent = "explorer";
			if (this.isWebKit) {
				agent = "webkit";
			} else if (this.isGecko) {
				agent = "gecko";
			} else if (this.isOpera) {
				agent = "opera";
			}
			return agent;
		}).call(this);

		/**
		 * System is "linux" "osx" "ios" "windows" "windowsmobile" "haiku" or "amiga".
		 */
		this.system = (function(shortlist) {
			var os = null;
			shortlist.every(function(test) {
				if (agent.includes(test)) {
					if (test.match(/ipad|iphone/)) {
						os = "ios";
					} else {
						os = test.replace(/ /g, ""); // no spaces
					}
				}
				return os === null;
			});
			return os;
		}([
			"window mobile",
			"windows",
			"ipad",
			"iphone",
			"os x",
			"linux",
			"haiku",
			"amiga"
		]));

		/**
		 * Has touch support? Note that desktop Chrome has this.
		 * @TODO Investigate this in desktop IE10.
		 * @type {boolean}
		 */
		this.hasTouch = (window.ontouchstart !== undefined || this.isChrome);

		/**
		 * Has native pointer events? Seems to work best if we hardcode `false`.
		 * @TODO: feature detect somewhing
		 * @type {boolean}
		 */
		this.hasPointers = false; // ( this.isExplorer && !this.isExplorer9 );

		/**
		 * Supports file blob?
		 * @type {boolean}
		 */
		this.hasBlob = (window.Blob && (window.URL || window.webkitURL));

		/**
		 * Supports the History API?
		 * @type {boolean}
		 */
		this.hasHistory = (window.history && window.history.pushState) ? true : false;

		/**
		 * Is touch device? Not to be confused with {gui.Client#hasTouch}
		 * @type {boolean}
		 */
		this.isTouchDevice = (function(shortlist) {
			return shortlist.some(function(system) {
				return agent.includes(system);
			});
		}([
			"android",
			"webos",
			"iphone",
			"ipad",
			"ipod",
			"blackberry",
			"windows phone"
		]));

		/**
		 * Supports CSS transitions?
		 * @type {boolean}
		 */
		this.hasTransitions = supports("transition");

		/**
		 * Supports CSS transforms?
		 * @type {boolean}
		 */
		this.hasTransforms = supports("transform");

		/**
		 * Supports CSS animations?
		 * @type {boolean}
		 */
		this.hasAnimations = supports("animationName");

		/**
		 * Supports CSS 3D transform? (note https://bugzilla.mozilla.org/show_bug.cgi?id=677173)
		 * @type {boolean}
		 */
		this.has3D = supports("perspective");

		/**
		 * Supports flexible box module?
		 * @type {boolean}
		 */
		this.hasFlex = supports("flex");

		/**
		 * Has support for Proxy objects?
		 * http://wiki.ecmascript.org/doku.php?id=harmony:proxies
		 * @type {boolean}
		 */
		this.hasProxies = (window.Proxy && window.Proxy.create);

		/**
		 * Has Performance API?
		 * @type {boolean}
		 */
		this.hasPerformance = (window.performance && window.performance.now);

		/**
		 * Temp...
		 */
		Object.defineProperty(this, 'hasFlexBox', {
			get: function() {
				console.error('Depracated API is deprecated: hasFlexBox >> hasFlex');
			}
		});

		/**
		 * Supports requestAnimationFrame somewhat natively?
		 * @type {boolean}
		 */
		this.hasAnimationFrame = (function() {
			var win = window;
			return (
				win.requestAnimationFrame ||
				win.webkitRequestAnimationFrame ||
				win.mozRequestAnimationFrame ||
				win.msRequestAnimationFrame ||
				win.oRequestAnimationFrame
			) ? true : false;
		})();

		/**
		 * Supports HTMLTemplateElement?
		 * @type {boolean}
		 */
		this.hasTemplates = (function(template) {
			return 'content' in template ? true : false;
		}(document.createElement('template')));

		/**
		 * Supports HTML imports?
		 * @type {boolean}
		 */
		this.hasImports = (function(link) {
			return 'import' in link ? true : false;
		}(document.createElement('link')));

		/**
		 * Supports MutationObserver feature?
		 * @type {boolean}
		 */
		this.hasMutations = (function() {
			return !["", "WebKit", "Moz", "O", "Ms"].every(function(vendor) {
				return !gui.Type.isDefined(window[vendor + "MutationObserver"]);
			});
		})();

		/**
		 * Browsers disagree on the primary scrolling element.
		 * Is it document.body or document.documentElement?
		 * @see https://code.google.com/p/chromium/issues/detail?id=2891
		 * @type {HTMLElement}
		 */
		this.scrollRoot = null;

		/**
		 * Scrollbar default span in pixels.
		 * Note that this is zero on mobiles.
		 * @type {number}
		 */
		this.scrollBarSize = 0;

		/**
		 * Supports position fixed?
		 * @type {boolean}
		 */
		this.hasPositionFixed = false;
	}

	return new Client();

}());

/**
 * Mark `isMobile` as deprecated.
 */
Object.defineProperty(gui.Client, 'isMobile', {
	get: function() {
		console.error(
			'Deprecated API is deprecated: gui.Client.isMobile (use isTouchDevice)'
		);
	}
});

/**
 * TODO: Perhaps move this somewhere.
 */
document.addEventListener('DOMContentLoaded', function() {
	if (!gui.CSSPlugin) {
		return; // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	}
	var win = window,
		doc = document,
		html = doc.documentElement,
		body = doc.body,
		root = null;

	// make sure window is scrollable
	var temp = body.appendChild(
		gui.CSSPlugin.style(doc.createElement("div"), {
			position: "absolute",
			height: "10px",
			width: "10px",
			top: "100%"
		})
	);

	// what element will get scrolled?
	win.scrollBy(0, 10);
	root = html.scrollTop ? html : body;
	gui.Client.scrollRoot = root;

	// supports position fixed?
	gui.CSSPlugin.style(temp, {
		position: "fixed",
		top: "10px"
	});

	// restore scroll when finished
	var has = temp.getBoundingClientRect().top === 10;
	gui.Client.hasPositionFixed = has;
	body.removeChild(temp);
	win.scrollBy(0, -10);

	// compute scrollbar size
	var inner = gui.CSSPlugin.style(document.createElement("p"), {
		width: "100%",
		height: "200px"
	});
	var outer = gui.CSSPlugin.style(document.createElement("div"), {
		position: "absolute",
		top: "0",
		left: "0",
		visibility: "hidden",
		width: "200px",
		height: "150px",
		overflow: "hidden"
	});
	outer.appendChild(inner);
	html.appendChild(outer);
	var w1 = inner.offsetWidth;
	outer.style.overflow = "scroll";
	var w2 = inner.offsetWidth;
	if (w1 === w2) {
		w2 = outer.clientWidth;
	}
	html.removeChild(outer);
	gui.Client.scrollBarSize = w1 - w2;
	if (gui.Client.isExplorer) {
		gui.Client.scrollBarSize = 17; // sad hotfix for IE
	}
});



/**
 * Some kind of special map with strings keys and arrays values.
 * TODO: Refactor the various {gui.TrackerPlugin} implementations to use this.
 * @using {gui.Arguments#confirmed}
 * @using {gui.Array} GuiArray
 */
gui.MapList = (function using(confirmed, GuiArray) {

	function MapList(Fit) {
		this._map = Object.create(null);
		this._fit = Fit || null;
	}

	MapList.prototype = {

		/**
		 * Get list indexed by key.
		 * @param {string} key
		 * @returns {Array}
		 */
		get: function(key) {
			return this._map[key];
		},

		/**
		 * Set list by key (you would normally `push` entries instead, see below).
		 * @param {string} key
		 * @param {Array} val
		 */
		set: confirmed('string', 'array')(function(key, val) {
			return (this._map[key] = val);
		}),

		/**
		 * Has list indexed by key?
		 * @param {string} key
		 * @returns {boolean}
		 */
		has: function(key) {
			return this._map[key] !== undefined;
		},

		/**
		 * Delete list indexed by key.
		 * TODO: Support function arg for destructing members of the list?
		 * @param {string} key
		 */
		"delete": function(key) {
			this._map[key] = null;
			delete this._map[key];
		},

		/**
		 * Push entry to list indexed by key. 
		 * Don't push no double entries here.
		 * Creates the list on first push. 
		 * Return true if not already added.
		 * @param {string} key
		 * @param {object} val
		 * @returns {boolean} True if *not* already added
		 */
		add: confirmed('string')(function(key, val) {
			var list = this.get(key) || this.set(key, []);
			var puts = list.indexOf(val) === -1;
			if(puts) {
				if(this._fit && !(val instanceof this._fit)) {
					throw new TypeError(val + ' is not a ' + this._fit);
				}
				list.push(val);
			}
			return puts;
		}),

		/**
		 * Remove entry from list index by key. Deletes the list when empty.
		 * @param {string} key
		 * @param {object} val
		 */
		remove: confirmed('string')(function(key, val) {
			var length, list = this.get(key);
			if (list) {
				length = GuiArray.remove(list, val);
				if (length === 0) {
					this.delete(key);
				}
			}
		}),

		/**
		 * @param {function} callback
		 * @param @optional {object} thisp
		 */
		each: function(callback, thisp) {
			gui.Object.each(this._map, function(key, list) {
				callback.call(thisp, key, list);
			});
		},

		// Private .................................................................

		/**
		 * @type {Map<string,Array>}
		 */
		_map: null,

		/**
		 * @type {constructor}
		 */
		_fit: null

	};

	return MapList;

}(gui.Arguments.confirmed, gui.Array));



/**
 * Core module.
 */
gui.module("gui@wunderbyte.com");



/**
 * Extend `gui` to support spirits.
 */
gui = gui.Object.extend(gui, {

	/**
	 * Spirit management mode. Matches 'robot' or 'human' (or 'funny' perhaps).
	 * @type {String}
	 */
	mode: 'robot',

	/**
	 * Robot mode: Automatically spiritualize and
	 * materialize by overriding native DOM methods.
	 * @type {string}
	 */
	MODE_ROBOT: 'robot',

	/**
	 * Human mode: Spiritualize and materialize at own risk.
	 * @type {string}
	 */
	MODE_HUMAN: 'human',

	/**
	 * Funny mode: Spiritualize manually, materialize automatically.
	 * @type {string}
	 */
	MODE_FUNNY: 'funny',

	/**
	 * Automatically run on DOMContentLoaded?
	 * @TODO: rename this to something
	 * @type {boolean}
	 */
	autostart: true,

	// broadcasts
	BROADCAST_KICKSTART: 'gui-broadcast-kickstart',
	BROADCAST_WILL_SPIRITUALIZE: 'gui-broadcast-will-spiritualize',
	BROADCAST_DID_SPIRITUALIZE: 'gui-broadcast-did-spiritualize',
	
	// actions
	ACTION_DOC_ONSPIRITUALIZED: 'gui-action-document-spiritualized',

	// framework-internal stuff (most should eventually dollarprefix!)
	$ACTION_XFRAME_VISIBILITY: 'gui-action-xframe-visibility',

	// lifecycle events (all spirits)
	LIFE_CONSTRUCT: 'gui-life-construct',
	LIFE_CONFIGURE: 'gui-life-configure',
	LIFE_ENTER: 'gui-life-enter',
	LIFE_ATTACH: 'gui-life-attach',
	LIFE_READY: 'gui-life-ready',
	LIFE_DETACH: 'gui-life-detach',
	LIFE_EXIT: 'gui-life-exit',
	LIFE_ASYNC: 'gui-life-async',
	LIFE_DESTRUCT: 'gui-life-destruct',
	LIFE_VISIBLE: 'gui-life-visible',
	LIFE_INVISIBLE: 'gui-life-invisible',
	LIFE_RENDER: 'gui-life-render', // belongs to edb.module really...

	// ifecycle events (some spirits)
	LIFE_IFRAME_CONSTRUCT: 'gui-life-iframe-construct',
	LIFE_IFRAME_DOMCONTENT: 'gui-life-iframe-domcontent',
	LIFE_IFRAME_SPIRITUALIZED: 'gui-life-iframe-spiritualized',
	LIFE_IFRAME_ONLOAD: 'gui-life-iframe-onload',
	LIFE_IFRAME_ONHASH: 'gui-life-iframe-onhash',
	LIFE_IFRAME_UNLOAD: 'gui-life-iframe-unload',

	// tick types (timed events)
	$TICK_INSIDE: 'gui-tick-spirits-inside',
	$TICK_OUTSIDE: 'gui-tick-spirits-outside',

	// crawler identification strings
	CRAWLER_SPIRITUALIZE: 'gui-crawler-spiritualize',
	CRAWLER_MATERIALIZE: 'gui-crawler-materialize',
	CRAWLER_DETACH: 'gui-crawler-detach',
	CRAWLER_DISPOSE: 'gui-crawler-dispose', // TODO: what is this?
	CRAWLER_ACTION: 'gui-crawler-action',
	CRAWLER_VISIBLE: 'gui-crawler-visible', // TODO: move to plugin
	CRAWLER_INVISIBLE: 'gui-crawler-invisible', // TODO: move to plugin
	CRAWLER_REFLEX: 'gui-crawler-reflex',

	/** 
	 * CSS classnames
	 */
	CLASS_NOSPIRITS: 'gui-nospirits', // declare spirit-free zone (performance)
	CLASS_INVISIBLE: '_gui-invisible',
	CLASS_HIDDEN: '_gui-hidden',

	/**
	 * Flipped by the {gui.Guide} after initial spiritualization
	 * @type {boolean}
	 */
	spiritualized: false,

	/**
	 * Magic attributes to trigger spirit association and configuration.
	 * By default we support 'gui' but you may prefer to use 'data-gui'.
	 * @type {Array<string>}
	 */
	attributes: null,

	/**
	 * Possess element and descendants.
	 * TODO: Jump detached spirit if matching id (!)
	 * @param {Element} target
	 */
	spiritualize: function(target) {
		gui.Guide.$spiritualize(target || document);
	},

	/**
	 * Possess descendants.
	 * @param {Element|gui.Spirit} target
	 */
	spiritualizeSub: function(target) {
		gui.Guide.$spiritualizeSub(target || document);
	},

	/**
	 * Possess one element non-crawling.
	 * @param {Element|gui.Spirit} target
	 */
	spiritualizeOne: function(target) {
		gui.Guide.$spiritualizeOne(target || document);
	},

	/**
	 * Dispell spirits from element and descendants.
	 * @param {Element|gui.Spirit} target
	 * @param @optional {boolean} webkithack (not an official thing!)
	 */
	materialize: function(target, webkithack) {
		gui.Guide.$materialize(target || document, webkithack);
	},

	/**
	 * Dispell spirits for descendants.
	 * @param {Element|gui.Spirit} target
	 */
	materializeSub: function(target) {
		gui.Guide.$materializeSub(target || document);
	},

	/**
	 * Dispell one spirit non-crawling.
	 * @param {Element|gui.Spirit} target
	 */
	materializeOne: function(target) {
		gui.Guide.$materializeOne(target || document);
	},

	/**
	 * Don't materialize and spiritualize during given operation.
	 * @param {funtion} operation
	 */
	suspend: function(operation) {
		return gui.DOMObserver.suspend(function() {
			return gui.Guide.suspend(operation);
		});
	},

	/**
	 * Get spirit for fuzzy argument. 
	 * TODO: Delegate this to {gui.DOMPlugin}
	 * @param {String|Element} arg
	 * @returns {gui.Spirit}
	 */
	get: function(arg) {
		var spirit, element, doc = document;
		switch (gui.Type.of(arg)) {
			case 'string':
				if (gui.KeyMaster.isKey(arg)) {
					spirit = gui.Guide.$getSpiritById(arg); // TODO!!!!!!!!!!!!!!!!!!!!!!
				}
				if (!spirit) {
					try {
						element = doc.querySelector(arg) || doc.querySelector('#' + arg);
					} catch (badselector) {

					} finally {
						spirit = element ? element.spirit : null;
					}
				}
				break;
			case 'function':
				var sp, spirits = this._spirits.inside;
				if (gui.Type.isSpiritConstructor(arg)) {
					Object.keys(this._spirits.inside).some(function(key) {
						if (((sp = spirits[key]).constructor === arg)) {
							spirit = sp;
							return true;
						}
					});
				}
				break;
			default:
				if (gui.Type.isElement(arg)) {
					spirit = arg.spirit || null;
				} else {
					throw new TypeError('gui.get(' + arg + ')');
				}
				break;
		}
		return spirit || null;
	},

	/**
	 * @TODO
	 */
	getAll: function(arg) {
		console.error('TODO: gui.getAll');
	},

	/**
	 * Channel spirits to CSS selectors.
	 * TODO: explain args
	 */
	channel: function() {
		gui.Guide.$channel.apply(gui.Guide, arguments);
	},

	/**
	 * Has channels?
	 * TODO: rebrand as 'channelings'
	 * @returns {boolean}
	 */
	hasChannels: function() {
		return gui.Guide.$hasChannels();
	},

	/**
	 * Get channels (read only).
	 * TODO: rebrand as 'channelings'
	 * @type {Array<Array<String,function>>}
	 */
	getChannels: function() {
		return gui.Guide.$getChannels();
	},

	/**
	 * Do something when everything is spiritualized (synchronously after 
	 * DOMContentLoaded). Or if that's already too late, just do it now.
	 * TODO: support `onready` object handler
	 * @overwrites {gui#ready} A stub implementation
	 * @param @optional {function} action
	 * @param @optional {object} thisp
	 * @returns {boolean} True when ready already
	 */
	ready: function(action, thisp) {
		var is = this.spiritualized;
		if (arguments.length) {
			if (is) {
				action.call(thisp);
			} else {
				this._readycallbacks = this._readycallbacks || [];
				this._readycallbacks.push(function() {
					if (gui.debug) {
						try {
							action.call(thisp);
						} catch (exception) {
							console.error(action.toString());
							throw exception;
						}
					} else {
						action.call(thisp);
					}
				});
			}
		}
		return is;
	},


	// Private ...................................................................

	/**
	 * @type {Array<function>}
	 */
	_readycallbacks: null,

	/**
	 * Invoked at parse time (so right now). 
	 * @returns {gui.Namespace} myself
	 */
	_initspirits: function() {
		this.attributes = ['gui'];
		gui.Broadcast.add(gui.BROADCAST_TODOM, {
			onbroadcast: function() {
				gui.Guide.$startGuiding();
				gui._nowready();
			}
		});
		return this;
	},

	/**
	 * Initial spirits are ready. 
	 * Run accumulated callbacks.
	 */
	_nowready: function() {
		this.spiritualized = true;
		var list = this._readycallbacks;
		if (list) {
			while (list.length) {
				list.shift()();
			}
			this._readycallbacks = null;
		}
	}

}._initspirits());



/** 
 * ActionPlugin.
 * @extends {gui.TrackerPlugin}
 * TODO: 'one' and 'oneGlobal' methods
 * @using {gui.Arguments#confirmed}
 * @using {gui.Combo#chained}
 */
gui.ActionPlugin = (function using(confirmed, chained) {

	return gui.TrackerPlugin.extend({

		/**
		 * Free slot for spirit to define any single type of action to dispatch.
		 * @type {String}
		 */
		type: null,

		/**
		 * Free slot for spirit to define any single type of data to dispatch.
		 * @type {Object}
		 */
		data: null,

		/**
		 * Add one or more action handlers.
		 * @param {array|string} arg
		 * @param @optional {object|function} handler
		 * @returns {gui.ActionPlugin}
		 */
		add: confirmed("array|string", "(object|function)")(
			chained(function(arg, handler) {
				handler = handler ? handler : this.spirit;
				if (gui.Interface.validate(gui.Action.IActionHandler, handler)) {
					gui.Array.make(arg).forEach(function(type) {
						this._addchecks(type, [handler, this._global]);
					}, this);
				}
			})
		),

		/**
		 * Remove one or more action handlers.
		 * @param {object} arg
		 * @param @optional {object} handler
		 * @returns {gui.ActionPlugin}
		 */
		remove: confirmed("array|string", "(object|function)")(
			chained(function(arg, handler) {
				handler = handler ? handler : this.spirit;
				if (gui.Interface.validate(gui.Action.IActionHandler, handler)) {
					gui.Array.make(arg).forEach(function(type) {
						this._removechecks(type, [handler, this._global]);
					}, this);
				}
			})
		),

		/**
		 * Add global action handler(s).
		 * @param {object} arg
		 * @param @optional {object} handler
		 * @returns {gui.ActionPlugin}
		 */
		addGlobal: function(arg, handler) {
			return this._globalize(function() {
				return this.add(arg, handler);
			});
		},

		/**
		 * Remove global action handler(s).
		 * @param {object} arg
		 * @param @optional {object} handler
		 * @returns {gui.ActionPlugin}
		 */
		removeGlobal: function(arg, handler) {
			return this._globalize(function() {
				return this.remove(arg, handler);
			});
		},
		
		/**
		 * Dispatch type(s) ascending.
		 * TODO: This should probably just return the plugin and not 
		 *       the action since nobody's gonna suspect that anyways.
		 * @alias {gui.ActionPlugin#ascend}
		 * @param {string} type
		 * @param @optional {object} data
		 * @returns {gui.Action}
		 */
		dispatch: confirmed("string", "(*)")(function(type, data) {
			return gui.Action.dispatch(this.spirit, type, data);
		}),

		/**
		 * Dispatch type(s) ascending.
		 * @param {string} type
		 * @param @optional {object} data
		 * @returns {gui.Action}
		 */
		ascend: confirmed("string", "(*)")(function(type, data) {
			return gui.Action.ascend(this.spirit, type, data);
		}),

		/**
		 * Dispatch type(s) descending.
		 * @param {string} type
		 * @param @optional {object} data
		 * @returns {gui.Action}
		 */
		descend: confirmed("string", "(*)")(function(type, data) {
			return gui.Action.descend(this.spirit, type, data);
		}),

		/**
		 * Dispatch type(s) globally (ascending).
		 * @alias {gui.ActionPlugin#ascendGlobal}
		 * @param {string} type
		 * @param @optional {object} data
		 * @returns {gui.Action}
		 */
		dispatchGlobal: confirmed("string", "(*)")(function(type, data) {
			return gui.Action.dispatchGlobal(this.spirit, type, data);
		}),

		/**
		 * Dispatch type(s) globally ascending.
		 * @param {string} type
		 * @param @optional {object} data
		 * @returns {gui.Action}
		 */
		ascendGlobal: confirmed("string", "(*)")(function(type, data) {
			return gui.Action.ascendGlobal(this.spirit, type, data);
		}),

		/**
		 * Dispatch type(s) globally descending.
		 * @param {string} type
		 * @param @optional {object} data
		 * @returns {gui.Action}
		 */
		descendGlobal: confirmed("string", "(*)")(function(type, data) {
			return gui.Action.descendGlobal(this.spirit, type, data);
		}),


		// Private .................................................................

		/**
		 * Remove delegated handlers.
		 * @overwrites {gui.Tracker#_cleanup}
		 * @param {String} type
		 * @param {Array<object>} checks
		 */
		_cleanup: function(type, checks) {
			var handler = checks[0],
				global = checks[1];
			if (global) {
				this.removeGlobal(type, handler);
			} else {
				this.remove(type, handler);
			}
		},


		// Privileged ..............................................................

		/**
		 * Flip to a mode where the spirit will handle it's own action. Corner case 
		 * scenario: IframeSpirit watches an action while relaying the same action 
		 * from another document context.
		 * @type {boolean}
		 */
		$handleownaction: false,

		/**
		 * Handle action. If it matches listeners, the action will be
		 * delegated to the spirit. Called by crawler in `gui.Action`.
		 * @see {gui.Action#dispatch}
		 * @param {gui.Action} action
		 */
		$onaction: function(action) {
			var list = this._trackedtypes[action.type];
			if (list) {
				list.forEach(function(checks) {
					var handler = checks[0];
					var matches = checks[1] === action.global;
					var hacking = handler === this.spirit && this.$handleownaction;
					if (matches && (handler !== action.target || hacking)) {
						handler.onaction(action);
					}
				}, this);
			}
		}

	});

}(gui.Arguments.confirmed, gui.Combo.chained));



/**
 * Tracking broadcasts.
 * @extends {gui.TrackerPlugin}
 * @using {gui.Combo#chained}
 */
gui.BroadcastPlugin = (function using(chained, confirmed) {

	return gui.TrackerPlugin.extend({

		/**
		 * Add one or more broadcast handlers.
		 * @param {object} arg
		 * @param @optional {object} handler implements BroadcastListener (defaults to spirit)
		 * @returns {gui.BroadcastPlugin}
		 */
		add: confirmed("string|array")(
			chained(function(arg, handler) {
				handler = handler ? handler : this.spirit;
				var sig = this._global ? null : this._sig;
				gui.Array.make(arg).forEach(function(type) {
					if (this._addchecks(type, [handler, this._global])) {
						if (this._global) {
							gui.Broadcast.addGlobal(type, handler);
						} else {
							gui.Broadcast.add(type, handler, sig);
						}
					}
				}, this);
			})
		),

		/**
		 * Remove one or more broadcast handlers.
		 * @param {object} arg
		 * @param @optional {object} handler implements BroadcastListener (defaults to spirit)
		 * @returns {gui.BroadcastPlugin}
		 */
		remove: confirmed("string|array")(
			chained(function(arg, handler) {
				handler = handler ? handler : this.spirit;
				var sig = this._global ? null : this._sig;
				gui.Array.make(arg).forEach(function(type) {
					if (this._removechecks(type, [handler, this._global])) {
						if (this._global) {
							gui.Broadcast.removeGlobal(type, handler);
						} else {
							gui.Broadcast.remove(type, handler, sig);
						}
					}
				}, this);
			})
		),

		/**
		 * Dispatch type(s).
		 * @param {object} arg
		 * @param @optional {object} data
		 * @returns {gui.Broadcast}
		 */
		dispatch: confirmed("string|array")(
			function(arg, data) {
				var result = null;
				var global = this._global;
				var sig = global ? null : this._sig;
				this._global = false;
				gui.Array.make(arg).forEach(function(type) {
					gui.Broadcast.$target = this.spirit;
					if (global) {
						result = gui.Broadcast.dispatchGlobal(type, data);
					} else {
						result = gui.Broadcast.dispatch(type, data, sig);
					}
				}, this);
				return result;
			}
		),

		/**
		 * Add handlers for global broadcast(s).
		 * @param {object} arg
		 * @param @optional {object} handler implements BroadcastListener (defaults to spirit)
		 * @returns {gui.BroadcastPlugin}
		 */
		addGlobal: function(arg, handler) {
			return this._globalize(function() {
				return this.add(arg, handler);
			});
		},

		/**
		 * Add handlers for global broadcast(s).
		 * @param {object} arg
		 * @param @optional {object} handler implements BroadcastListener (defaults to spirit)
		 * @returns {gui.BroadcastPlugin}
		 */
		removeGlobal: function(arg, handler) {
			return this._globalize(function() {
				return this.remove(arg, handler);
			});
		},

		/**
		 * @param {boolean} on
		 * @param {object} arg
		 * @param @optional {object} handler implements BroadcastListener (defaults to spirit)
		 */
		shiftGlobal: function(on, arg, handler) {
			return this._globalize(function() {
				return this.shift(on, arg, handler);
			});
		},

		/**
		 * Dispatch type(s) globally.
		 * @param {object} arg
		 * @param @optional {object} data
		 * @returns {gui.Broadcast}
		 */
		dispatchGlobal: function(arg, data) {
			return this._globalize(function() {
				return this.dispatch(arg, data);
			});
		},
		

		// Private .................................................................

		/**
		 * Remove delegated handlers.
		 * @overwrites {gui.Tracker#_cleanup}
		 * @param {String} type
		 * @param {Array<object>} checks
		 */
		_cleanup: function(type, checks) {
			var handler = checks[0],
				global = checks[1];
			if (global) {
				gui.Broadcast.removeGlobal(type, handler);
			} else {
				gui.Broadcast.remove(type, handler, this._sig);
			}
		}

	});

}(gui.Combo.chained, gui.Arguments.confirmed));



/**
 * Tracking timed events.
 * TODO: Global timed events.
 * @extends {gui.TrackerPlugin}
 * @using {gui.Combo#chained}
 * @using {gui.Array} guiArray
 */
gui.TickPlugin = (function using(chained, guiArray) {

	return gui.TrackerPlugin.extend({

		/**
		 * Add one or more tick handlers.
		 * @param {object} arg
		 * @param @optional {object} handler
		 * @param @optional {boolean} one Remove handler after on tick of this type?
		 * @returns {gui.TickPlugin}
		 */
		add: chained(function(arg, handler, one) {
			handler = handler ? handler : this.spirit;
			if (gui.Interface.validate(gui.ITickHandler, handler)) {
				guiArray.make(arg).forEach(function(type) {
					if (this._addchecks(type, [handler, this._global])) {
						this._add(type, handler, false);
					}
				}, this);
			}
		}),

		/**
		 * Remove one or more tick handlers.
		 * @param {object} arg
		 * @param @optional {object} handler implements
		 *        ActionListener interface, defaults to spirit
		 * @returns {gui.TickPlugin}
		 */
		remove: chained(function(arg, handler) {
			handler = handler ? handler : this.spirit;
			if (gui.Interface.validate(gui.ITickHandler, handler)) {
				guiArray.make(arg).forEach(function(type) {
					if (this._removechecks(type, [handler, this._global])) {
						this._remove(type, handler);
					}
				}, this);
			}
		}),

		/**
		 * Add handler for single tick of given type(s).
		 * TODO: This on ALL trackers :)
		 * @param {object} arg
		 * @param @optional {object} handler
		 * @returns {gui.TickPlugin}
		 */
		one: chained(function(arg, handler) {
			this.add(arg, handler, true);
		}),

		/**
		 * Execute action in next available tick.
		 * TODO: Support cancellation
		 * @param {function} action
		 * @param @optional {object|function} thisp
		 * @returns {gui.TickPlugin}
		 */
		next: chained(function(action, thisp) {
			gui.Tick.next(action, thisp || this.spirit);
		}),

		/**
		 * Execute action in next animation frame.
		 * @param {function} action
		 * @param @optional {object|function} thisp
		 * @returns {gui.TickPlugin}
		 * @returns {number}
		 */
		nextFrame: function(action, thisp) {
			return gui.Tick.nextFrame(action, thisp || this.spirit);
		},

		/**
		 * Cancel scheduled animation frame.
		 * @param {number} n
		 * @returns {gui.TickPlugin}
		 */
		cancelFrame: chained(function(n) {
			gui.Tick.cancelFrame(n);
		}),

		/**
		 * Schedule timeout.
		 * @param {function} action
		 * @param {number} time
		 * @param @optional {object|function} thisp
		 * @returns {number}
		 */
		time: function(action, time, thisp) {
			return gui.Tick.time(action, time, thisp || this.spirit);
		},

		/**
		 * Cancel scheduled timeout.
		 * @param {number} n
		 */
		cancelTime: chained(function(n) {
			gui.Tick.cancelTime(n);
		}),

		/**
		 * Start tick of type.
		 * @param {string} type
		 */
		start: chained(function(type) {
			gui.Tick.start(type);
		}),

		/**
		 * Stop tick of type. This will stop the tick for all
		 * listeners, so perhaps you're looking for `remove`?
		 * @param {string} type
		 */
		stop: chained(function(type) {
			gui.Tick.stop(type);
		}),

		/**
		 * Dispatch tick after given time.
		 * @param {String} type
		 * @param {number} time Milliseconds (zero is setImmediate)
		 * @returns {gui.Tick}
		 */
		dispatch: function(type, time) {
			return this._dispatch(type, time || 0);
		},


		// Private .................................................................

		/**
		 * Global mode?
		 * @type {boolean}
		 */
		_global: false,

		/**
		 * Add handler.
		 * @param {String} type
		 * @param {object|function} handler
		 * @param {boolean} one
		 */
		_add: function(type, handler, one) {
			var sig = this.spirit.$contextid;
			if (one) {
				if (this._global) {
					gui.Tick.oneGlobal(type, handler);
				} else {
					gui.Tick.one(type, handler, sig);
				}
			} else {
				if (this._global) {
					gui.Tick.addGlobal(type, handler);
				} else {
					gui.Tick.add(type, handler, sig);
				}
			}
		},

		/**
		 * Remove handler.
		 * @param {String} type
		 * @param {object|function} handler
		 */
		_remove: function(type, handler) {
			var sig = this.spirit.$contextid;
			if (this._global) {
				gui.Tick.removeGlobal(type, handler);
			} else {
				gui.Tick.remove(type, handler, sig);
			}
		},

		/**
		 * Dispatch.
		 * @param {String} type
		 * @param @optional {number} time
		 */
		_dispatch: function(type, time) {
			var tick, sig = this.spirit.$contextid;
			if (this._global) {
				tick = gui.Tick.dispatchGlobal(type, time);
			} else {
				tick = gui.Tick.dispatch(type, time, sig);
			}
			return tick;
		},

		/**
		 * Remove delegated handlers.
		 * @overwrites {gui.Tracker#_cleanup}
		 * @param {String} type
		 * @param {Array<object>} checks
		 */
		_cleanup: function(type, checks) {
			var handler = checks[0];
			var bglobal = checks[1];
			if (this._remove(type, [handler])) {
				if (bglobal) {
					gui.Tick.removeGlobal(type, handler);
				} else {
					gui.Tick.remove(type, handler, this.$contextid);
				}
			}
		}
	});

}(gui.Combo.chained, gui.Array));



/**
 * Interface TickHandler.
 */
gui.ITickHandler = {

	/** 
	 * Identification.
	 * @returns {String}
	 */
	toString: function() {
		return "[object ITickHandler]";
	},

	/**
	 * Handle tick.
	 * @param {gui.Tick} tick
	 */
	ontick: function(tick) {}
};



/**
 * SpiritLife is a non-bubbling event type that covers the life cycle of a spirit.
 * @see {gui.LifePlugin}
 * @param {gui.Spirit} target
 * @param {String} type
 */
gui.Life = function Life(target, type) {
	this.target = target;
	this.type = type;
};

gui.Life.prototype = {

	/**
	 * @type {gui.Spirit}
	 */
	target: null,

	/**
	 * @type {String}
	 */
	type: null,

	/**
	 * Identification.
	 * @returns {String}
	 */
	toString: function() {
		return "[object gui.Life]";
	}
};



/**
 * Tracking spirit life cycle events.
 * TODO: Support optional data argument
 * @extends {gui.TrackerPlugin}
 */
gui.LifePlugin = gui.TrackerPlugin.extend({

	/**
	 * Spirit is constructed? This is almost certainly true by
	 * the time you address the spirit.
	 * @type {boolean}
	 */
	constructed: false,

	/**
	 * Spirit is configured?
	 * @type {boolean}
	 */
	configured: false,

	/**
	 * Is now or has ever been in page DOM?
	 * @type {boolean}
	 */
	entered: false,

	/**
	 * Is currently located in page DOM?
	 * False whenever detached is true.
	 * @TODO: make udefined on startup
	 * @type {boolean}
	 */
	attached: false,

	/**
	 * Is currently not located in page DOM? Note that this is initially
	 * true until the spirit has been discovered and registered as attached.
	 * @TODO: make udefined on startup
	 * @type {boolean}
	 */
	detached: true,

	/**
	 * Is ready? If so, it implies that all descendant spirits are also ready.
	 * @type {boolean}
	 */
	ready: false,

	/**
	 * Is after whatever happens roughly 4 milliseconds after 'ready'?
	 * @type {boolean}
	 */
	async: false,

	/**
	 * Spirit was in page DOM, but has now been removed (ie. it was
	 * detached and not re-attached in the same execution stack).
	 * This schedules the spirit for destruction.
	 * @type {boolean}
	 */
	exited: false,

	/**
	 * Is destructed? If true, don't try anything funny.
	 * @type {boolean}
	 */
	destructed: false,

	/**
	 * Is visible?
	 * @type {boolean}
	 */
	visible: undefined,

	/**
	 * Is rendered? Belongs to edb.module really...
	 * TODO: Move this to the edb module, really.
	 */
	rendered: false,

	/**
	 * Mapping plugin prefix to initialized status, 'false'
	 * is a lazy plugin that has not yet been constructed.
	 * @type {[type]}
	 */
	plugins: null,

	/**
	 * Construction time.
	 * @overrides {gui.Tracker#construct}
	 */
	onconstruct: function() {
		gui.TrackerPlugin.prototype.onconstruct.call(this);
		this._handlers = Object.create(null);
		this.plugins = Object.create(null);
	},

	/**
	 * Add one or more action handlers.
	 * @param {object} arg
	 * @param @optional {object} handler implements LifeListener 
	 * interface, defaults to this.spirit
	 * @returns {gui.Spirit}
	 */
	add: function(arg, handler) {
		handler = handler ? handler : this.spirit;
		gui.Array.make(arg).forEach(function(type) {
			if (this._addchecks(type, [handler])) {
				if (!this._handlers[type]) {
					this._handlers[type] = [];
				}
				this._handlers[type].push(handler);
			}
		}, this);
		return this.spirit;
	},

	/**
	 * Remove one or more action handlers.
	 * @param {object} arg
	 * @param @optional {object} handler implements LifeListener 
	 * interface, defaults to spirit
	 * @returns {gui.Spirit}
	 */
	remove: function(arg, handler) {
		handler = handler ? handler : this.spirit;
		gui.Array.make(arg).forEach(function(type) {
			if (this._removechecks(type, [handler])) {
				if (this._handlers[type]) { // weirdo Gecko condition...
					var index = this._handlers[type].indexOf(type);
					gui.Array.remove(this._handlers[type], index);
					if (this._handlers[type].length === 0) {
						delete this._handlers[type];
					}
				}
			}
		}, this);
		return this.spirit;
	},

	/**
	 * Dispatch type and cleanup handlers for 
	 * life cycle events that only occurs once.
	 * TODO: support optional data argument
	 * @param {String} type
	 */
	dispatch: function(type) {
		var list = this._handlers[type];
		if (list) {
			var life = new gui.Life(this.spirit, type);
			list.forEach(function(handler) {
				handler.onlife(life);
			});
			switch (type) {
				case gui.LIFE_CONSTRUCT:
				case gui.LIFE_CONFIGURE:
				case gui.LIFE_ENTER:
				case gui.LIFE_READY:
				case gui.LIFE_DETACH:
				case gui.LIFE_EXIT:
				case gui.LIFE_DESTRUCT:
					delete this._handlers[type];
					break;
			}
		}
	},

	/**
	 * TODO: move declaration to super or something (?)
	 * @type {Map<String,Array<object>}
	 */
	_handlers: null,

	/**
	 * Cleanup.
	 */
	_cleanup: function(type, checks) {
		var handler = checks[0];
		this.remove(type, handler);
	}

});



/**
 * Configures a spirit by attribute parsing.
 * TODO: Evaluate properties onconfigure; evaluate methods later.
 * @extends {gui.Plugin}
 */
gui.ConfigPlugin = gui.Plugin.extend({

	/**
	 * Invoked by the {gui.Spirit} once all plugins have been plugged in.
	 *
	 * - Simple properties (booleans etc) will run at {gui.Spirit#onconfigure}
	 * - Methods calls of any kind will be invoked at {gui.Spirit#onready}
	 *
	 * TODO: Simple props with no setter does nothing when updated now.
	 * Perhaps it would be possible to somehow configure those *first*?
	 * TODO: Figure out what the TODO above is supposed to mean
	 */
	configureall: function() {
		var atts = this.spirit.element.attributes;
		Array.forEach(atts, function(att) {
			this.configureone(att.name, att.value);
		}, this);
	},

	/**
	 * Evaluate method updates at {gui.Spirit#onready}.
	 * @param {gui.Life} l
	 */
	onlife: function(l) {
		var update;
		if(l.type === gui.LIFE_READY) {
			while ((update = this._onready.shift())) {
				update.action();
			}
		}
	},

	/**
	 * Setup configuration (if applicable) after an attribute update.
	 * This should probably only ever be invoked by the {gui.AttPlugin}.
	 * @param {string} name
	 * @param {string} value
	 */
	configureone: function(name, value) {
		var hit, gux = this.spirit.window.gui;
		var dot = gui.ConfigPlugin.SEPARATOR;
		gux.attributes.every(function(fix) {
			if ((hit = name.startsWith(fix + dot))) {
				this._evaluate(name, value, fix, dot);
			}
			return !hit;
		}, this);
	},


	// Private ...................................................................

	/**
	 * Collecting method-type updates during spirit initialization.
	 * @type {Array<function>}
	 */
	_onready: null,

	/**
	 * Evaluate single attribute in search for "gui." prefix.
	 * The string value will be autocast to an inferred type.
	 * "false" becomes a boolean while "23" becomes a number.
	 * @param {string} name
	 * @param {string} value
	 * @param {string} fix
	 * @param {string} dot
	 */
	_evaluate: function(name, value, fix, dot) {
		var struct = this.spirit,
			success = true,
			prop = null,
			cuts = null;
		name = prop = name.split(fix + dot)[1];
		if (name.indexOf(dot) > -1) {
			cuts = name.split(dot);
			cuts.forEach(function(cut, i) {
				if (gui.Type.isDefined(struct)) {
					if (i < cuts.length - 1) {
						struct = struct[cut];
					} else {
						prop = cut;
					}
				} else {
					success = false;
				}
			});
		}
		if (success && gui.Type.isDefined(struct[prop])) {
			this._schedule(struct, prop, this._revaluate(value));
		} else {
			console.error(
				"No definition for \"" + name +
				"\" in " + this.spirit.toString()
			);
		}
	},

	/**
	 * Schedule update. Simple properties (strings, booleans, numbers) will be
	 * updated during `onconfigure` while methods will be invoked at `onready`.
	 * @param {object} struct What to update
	 * @param {string} prop Property or method name
	 * @param {object} value Property value or method argument
	 */
	_schedule: function(struct, prop, value) {
		if (gui.Type.isFunction(struct[prop])) {
			if (this.spirit.life.ready) {
				struct[prop](value);
			} else {
				this.spirit.life.add(gui.LIFE_READY, this);
				if(this._onready) {
					var index = this._onready.reduce(function(x, o, i) {
						return o.struct === struct && o.prop === prop ? i : x;
					}, -1);
				} else {
					this._onready = [];
				}
				this._onready.push({
					struct: struct,
					prop: prop,
					action: function() {
						struct[prop](value);
					}
				});
			}
		} else {
			struct[prop] = value;
		}
	},

	/**
	 * Typecast the value.
	 * TODO: Move the EDB hack into EDBML module somehow.
	 * @param {object} value
	 * @returns {object}
	 */
	_revaluate: function(value) {
		if (gui.Type.isString(value)) {
			if (gui.hasModule('edbml@wunderbyte.com') && value.startsWith('edbml.$get')) {
				value = window.edbml.$get(gui.KeyMaster.extractKey(value)[0]);
			} else {
				value = gui.Type.cast(value);
				if (gui.Type.isString(value)) {
					value = this._jsonvaluate(value);
				}
			}
		}
		return value;
	},

	/**
	 * JSONArray or JSONObject scrambled with encodeURIComponent?
	 * If so, let's decode and parse this into an array or object.
	 * @param {string} value
	 * @returns {Array|Object>}
	 */
	_jsonvaluate: function(value) {
		if ([
			['%5B', '%5D'],
			['%7B', '%7D']
		].some(function isencoded(tokens) {
			return value.startsWith(tokens[0]) && value.endsWith(tokens[1]);
		})) {
			try {
				value = JSON.parse(decodeURIComponent(value));
			} catch (exception) {
				value = null;
				console.error(this + ': Bad JSON: ' + exception.message);
			}
		}
		return value;
	}


}, { // Static .................................................................

	/**
	 * Run on spirit startup (don't wait for implementation to require it).
	 * @type {boolean}
	 */
	lazy: false,

	/**
	 * Use dots to separate object-path style attributes. 
	 * Isolated so that you can overwrite it if you like.
	 * @type {string}
	 */
	SEPARATOR: '.'

});



/**
 * Attribute wrapper.
 * @param {String} name
 * @param {String} value
 */
gui.Att = function Att(name, value) {
	this.value = gui.Type.cast(value);
	this.name = this.type = name;
};

gui.Att.prototype = {

	/**
	 * Attribute name.
	 * @type {String}
	 */
	name: null,

	/**
	 * Alias 'name' to conform the API with events, broadcasts, actions etc.
	 * @type {String}
	 */
	type: null,

	/**
	 * Attribute value will be cast to an inferred type, eg. "false" becomes
	 * boolean and "23" becomes number. When handling an attribute, 'null'
	 * implies that the attribute WILL be deleted (it happens after 'onatt').
	 * TODO: look into deleting the attribute first
	 * @type {String|number|boolean|null}
	 */
	value: null
};



/**
 * Manipulate DOM attributes and observe attribute changes.
 * TODO: special support for 'disabled' (and friends)
 * @extends {gui.TrackerPlugin}
 * @using {gui.Arguments#confirmed}
 * @using {gui.Combo#chained}
 */
gui.AttPlugin = (function using(confirmed, chained) {

	return gui.TrackerPlugin.extend({

		/**
		 * Get single element attribute cast to an inferred type.
		 * @param {String} att
		 * @returns {String|number|boolean} Autoconverted
		 */
		get: function(name) {
			return gui.AttPlugin.get(this.spirit.element, name);
		},

		/**
		 * Set single element attribute (use null to remove).
		 * @param {String} name
		 * @param {String|number|boolean} value
		 * @returns {gui.AttPlugin}
		 */
		set: chained(function(name, value) {
			if (!this.$suspended) {
				gui.AttPlugin.set(this.spirit.element, name, value);
			}
		}),

		/**
		 * Element has attribute?
		 * @param {String|number|boolean} att
		 * @returns {boolean}
		 */
		has: function(name) {
			return gui.AttPlugin.has(this.spirit.element, name);
		},

		/**
		 * Remove element attribute.
		 * @TODO: Rename "remove" ???
		 * @param {String} att
		 * @returns {gui.AttPlugin}
		 */
		del: chained(function(name) {
			if (!this.$suspended) {
				gui.AttPlugin.del(this.spirit.element, name);
			}
		}),

		/**
		 * Collect attributes as an array (of DOMAttributes).
		 * @returns {Array<Attr>}
		 */
		all: function() {
			return gui.AttPlugin.all(this.spirit.element);
		},

		/**
		 * Set attribute or remove the attribute alltogether.
		 * @param {boolean} on
		 * @param {string} name
		 * @param {string|number|boolean} value
		 * @returns {gui.AttPlugin}
		 */
		shift: confirmed("boolean", "string")(
			chained(function(on, name, value) {
				if (on) {
					if (value !== undefined) {
						this.set(name, value);
					} else {
						throw new TypeError('Missing value for "' + name + '"');
					}
				} else {
					this.del(name);
				}
			})
		),

		/**
		 * Get all attributes as hashmap type object.
		 * Values are converted to an inferred type.
		 * @returns {Map<String,String>}
		 */
		getmap: function() {
			return gui.AttPlugin.getmap(this.spirit.element);
		},

		/**
		 * Invoke multiple attributes update via hashmap
		 * argument. Use null value to remove an attribute.
		 * @param {Map<String,String>}
		 */
		setmap: function(map) {
			gui.AttPlugin.setmap(this.spirit.element, map);
		},

		/**
		 * Add one or more attribute listeners.
		 * @param {array|string} arg
		 * @param @optional {object|function} handler
		 * @returns {gui.AttPlugin}
		 */
		add: confirmed("array|string", "(object|function)")(
			chained(function(arg, handler) {
				handler = handler ? handler : this.spirit;
				if (gui.Interface.validate(gui.IAttHandler, handler)) {
					gui.Array.make(arg).forEach(function(type) {
						this._addchecks(type, [handler]);
						this._onadd(type);
					}, this);
				}
			})
		),

		/**
		 * Remove one or more attribute listeners.
		 * @param {object} arg
		 * @param @optional {object} handler
		 * @returns {gui.AttPlugin}
		 */
		remove: confirmed("array|string", "(object|function)")(
			chained(function(arg, handler) {
				handler = handler ? handler : this.spirit;
				if (gui.Interface.validate(gui.IAttHandler, handler)) {
					gui.Array.make(arg).forEach(function(type) {
						this._removechecks(type, [handler]);
					}, this);
				}
			})
		),


		// Privileged ..............................................................

		/**
		 * Attribute updates disabled?
		 * @type {boolean}
		 */
		$suspended: false,

		/**
		 * Suspend attribute updates for the duration of the
		 * action. This to prevent endless attribute updates.
		 * @param {function} action
		 * @retruns {object}
		 */
		$suspend: function(action) {
			this.$suspended = true;
			var res = action();
			this.$suspended = false;
			return res;
		},

		/**
		 * Trigger potential handlers for attribute update.
		 * @param {String} name
		 * @param {String} value
		 */
		$onatt: function(name, value) {
			var list, att, handler, trigger;
			var triggers = !gui.attributes.every(function(prefix) {
				if ((trigger = name.startsWith(prefix))) {
					this.spirit.config.configureone(name, value);
				}
				return !trigger;
			}, this);
			if (!triggers && (list = this._trackedtypes[name])) {
				att = new gui.Att(name, value);
				list.forEach(function(checks) {
					handler = checks[0];
					handler.onatt(att);
				}, this);
			}
		},


		// Private .................................................................

		/**
		 * Resolve attribute listeners immediately when added.
		 * @param {String} name
		 */
		_onadd: function(name) {
			if (this.has(name)) {
				var value = this.get(name);
				if (name.startsWith(gui.ConfigPlugin.PREFIX)) {
					this.spirit.config.configureone(name, value);
				} else {
					this.$onatt(name, value);
				}
			}
		}

		
	}, {}, { // Static ...........................................................

		/**
		 * Get single element attribute cast to an inferred type.
		 * @param {Element} elm
		 * @param {String} att
		 * @returns {object} String, boolean or number
		 */
		get: function(elm, name) {
			return gui.Type.cast(elm.getAttribute(name));
		},

		/**
		 * Set single element attribute (use null to remove).
		 * @param {Element} elm
		 * @param {String} name
		 * @param {String} value
		 * @returns {function}
		 */
		set: chained(function(elm, name, value) {
			var spirit = elm.spirit;
			var change = false;
			// checkbox or radio?
			if (this._ischecked(elm, name)) {
				change = elm.checked !== value;
				elm.checked = String(value) === "false" ? false : value !== null;
				if (change) {
					spirit.att.$onatt(name, value);
				}
				// input value?
			} else if (this._isvalue(elm, name)) {
				change = elm.value !== String(value);
				if (change) {
					elm.value = String(value);
					spirit.att.$onatt(name, value);
				}
				// deleted?
			} else if (value === null) {
				this.del(elm, name);
				// added or changed
			} else {
				value = String(value);
				if (elm.getAttribute(name) !== value) {
					if (spirit) {
						spirit.att.$suspend(function() {
							elm.setAttribute(name, value);
						});
						spirit.att.$onatt(name, value);
					} else {
						elm.setAttribute(name, value);
					}
				}
			}
		}),

		_ischecked: function(elm, name) {
			return elm.type && elm.checked !== undefined && name === "checked";
		},

		_isvalue: function(elm, name) {
			return elm.value !== undefined && name === "value";
		},

		/**
		 * Element has attribute?
		 * @param {Element} elm
		 * @param {String} name
		 * @returns {boolean}
		 */
		has: function(elm, name) {
			return elm.hasAttribute(name);
		},

		/**
		 * Remove element attribute.
		 * @param {Element} elm
		 * @param {String} att
		 * @returns {function}
		 */
		del: chained(function(elm, name) {
			var spirit = elm.spirit;
			if (this._ischecked(elm, name)) {
				elm.checked = false;
			} else if (this._isvalue(elm, name)) {
				elm.value = ""; // or what?
			} else {
				if (spirit) {
					spirit.att.$suspend(function() {
						elm.removeAttribute(name);
					});
					if (!spirit.config.configureone(name, null)) {
						spirit.att.$onatt(name, null);
					}
				} else {
					elm.removeAttribute(name);
				}
			}
		}),

		/**
		 * Collect attributes as an array (of DOMAttributes).
		 * @param {Element} elm
		 * @returns {Array<Attr>}
		 */
		all: function(elm) {
			return gui.Array.from(elm.attributes);
		},

		/**
		 * Get all attributes as hashmap type object.
		 * Values are converted to an inferred type.
		 * @param {Element} elm
		 * @returns {Map<String,String>}
		 */
		getmap: function(elm) {
			var map = Object.create(null);
			this.all(elm).forEach(function(att) {
				map[att.name] = gui.Type.cast(att.value);
			});
			return map;
		},

		/**
		 * Invoke multiple attributes update via hashmap
		 * argument. Use null value to remove an attribute.
		 * @param {Element} elm
		 * @param {Map<String,String>}
		 * @returns {function}
		 */
		setmap: chained(function(elm, map) {
			gui.Object.each(map, function(name, value) {
				this.set(elm, name, value);
			}, this);
		})

	});

}(gui.Arguments.confirmed, gui.Combo.chained));



/**
 * Interface AttHandler.
 */
gui.IAttHandler = {

	/**
	 * Identification.
	 * @returns {String}
	 */
	toString: function() {
		return "[object IAttHandler]";
	},

	/**
	 * Handle attribute update.
	 * @param {gui.Action} action
	 */
	onatt: function(att) {}
};



/**
 * Spirit box object. Note that these are all properties, not methods.
 * @extends {gui.Plugin}
 * TODO: Support globalX, globalY, screenX, screenY
 */
gui.BoxPlugin = gui.Plugin.extend({

	width:   0, // width
	height:  0, // height
	localX:  0, // X relative to positioned ancestor
	localY:  0, // Y relative to positioned ancestor
	pageX:   0, // X relative to the full page (includes scrolling)
	pageY:   0, // Y telative to the full page (includes scrolling)	  
	clientX: 0, // X relative to the viewport (excludes scrolling)
	clientY: 0, // Y relative to the viewport (excludes scrolling)

	/**
	 * Returns local scrolling element (hotfixed)
	 * TODO: Fix this in gui.Client...
	 * @returns {Element}
	 */
	_scrollroot: function() {
		return (function(doc) {
			if (gui.Client.scrollRoot.localName === "html") {
				return doc.documentElement;
			} else {
				return doc.body;
			}
		}(this.spirit.document));
	}
});

Object.defineProperties(gui.BoxPlugin.prototype, {

	/**
	 * Width.
	 * @type {number}
	 */
	width: {
		get: function() {
			return this.spirit.element.offsetWidth;
		}
	},

	/**
	 * Height.
	 * @type {number}
	 */
	height: {
		get: function() {
			return this.spirit.element.offsetHeight;
		}
	},

	/**
	 * X relative to positioned ancestor.
	 * @type {number}
	 */
	localX: {
		get: function() {
			return this.spirit.element.offsetLeft;
		}
	},

	/**
	 * Y relative to positioned ancestor.
	 * @type {number}
	 */
	localY: {
		get: function() {
			return this.spirit.element.offsetTop;
		}
	},

	/**
	 * X relative to the full page (includes scrolling).
	 * TODO: IMPORTANT scrollroot must be local to context
	 * @type {number}
	 */
	pageX: {
		get: function() {
			return this.clientX + this._scrollroot().scrollLeft;
		}
	},

	/**
	 * Y relative to the full page (includes scrolling).
	 * TODO: IMPORTANT scrollroot must be local to context
	 * @type {number}
	 */
	pageY: {
		get: function() {
			return this.clientY + this._scrollroot().scrollTop;
		}
	},

	/**
	 * X relative to the viewport (excludes scrolling).
	 * @type {number}
	 */
	clientX: {
		get: function() {
			return this.spirit.element.getBoundingClientRect().left;
		}
	},

	/**
	 * Y relative to the viewport (excludes scrolling).
	 * @type {number}
	 */
	clientY: {
		get: function() {
			return this.spirit.element.getBoundingClientRect().top;
		}
	}
});



/**
 * Spirit styling studio.
 * @extends {gui.Plugin}
 * @using {gui.Combo#chained}
 * @using {gui.Arguments#confirmed}
 */
gui.CSSPlugin = (function using(chained, confirmed) {

	return gui.Plugin.extend({

		/**
		 * Add classname(s).
		 * @param {string|Array<string>} name
		 * @returns {gui.CSSPlugin}
		 */
		add: confirmed("string|array")(chained(function(name) {
			var elm = this.spirit.element;
			gui.Array.make(name).forEach(function(n) {
				gui.CSSPlugin.add(elm, n);
			});
		})),

		/**
		 * Remove classname(s).
		 * @param {String} name
		 * @returns {gui.CSSPlugin}
		 */
		remove: confirmed("string|array")(chained(function(name) {
			var elm = this.spirit.element;
			gui.Array.make(name).forEach(function(n) {
				gui.CSSPlugin.remove(elm, n);
			});
		})),

		/**
		 * Toggle classname(s).
		 * @param {String} name
		 * @returns {gui.CSSPlugin}
		 */
		toggle: confirmed("string|array")(chained(function(name) {
			var elm = this.spirit.element;
			gui.Array.make(name).forEach(function(n) {
				gui.CSSPlugin.toggle(elm, n);
			});
		})),

		/**
		 * Add or remove classname(s) according to first argument.
		 * @param {boolean|object} on
		 * @param {String} name
		 * @returns {gui.CSSPlugin}
		 */
		shift: confirmed("*", "string|array")(chained(function(on, name) {
			var elm = this.spirit.element;
			gui.Array.make(name).forEach(function(n) {
				gui.CSSPlugin.shift(elm, on, n);
			});
		})),

		/**
		 * Contains classname?
		 * @param {String} name
		 * @returns {boolean}
		 */
		contains: confirmed("string")(function(name) {
			return gui.CSSPlugin.contains(this.spirit.element, name);
		}),

		/**
		 * Set single element.style.
		 * @param {String} prop
		 * @param {String} val
		 * @returns {gui.CSSPlugin}
		 */
		set: chained(function(prop, val) {
			gui.CSSPlugin.set(this.spirit.element, prop, val);
		}),

		/**
		 * Set multiple styles via key value map.
		 * @param {Map<String,String>} map
		 * @returns {gui.CSSPlugin}
		 */
		style: chained(function(map) {
			gui.CSSPlugin.style(this.spirit.element, map);
		}),

		/**
		 * Get single element.style; see also compute method.
		 * @param {String} prop
		 * @returns {String}
		 */
		get: function(prop) {
			return gui.CSSPlugin.get(this.spirit.element, prop);
		},

		/**
		 * Compute runtime style.
		 * @param {String} prop
		 * @returns {String}
		 */
		compute: function(prop) {
			return gui.CSSPlugin.compute(this.spirit.element, prop);
		},

		/**
		 * Get or set (full) className.
		 * @param @optional {String} name
		 * @returns {String|gui.CSSPlugin}
		 */
		name: chained(function(name) {
			var result = this.spirit.element.className;
			if (name !== undefined) {
				this.spirit.element.className = name;
				result = this.spirit;
			}
			return result;
		}),

		/**
		 * Spirit element mathes selector?
		 * @TODO: move to gui.DOMPlugin!
		 * @param {String} selector
		 * @returns {boolean}
		 */
		matches: function(selector) {
			return gui.CSSPlugin.matches(this.spirit.element, selector);
		}


	}, {}, { // Static ......................................................................

		/**
		 * classList.add
		 * @param {Element} element
		 * @param {String} names
		 * @returns {function}
		 */
		add: chained(function(element, name) {
			if (gui.Type.isString(name)) {
				if (name.indexOf(" ") > -1) {
					name = name.split(" ");
				}
				if (gui.Type.isArray(name)) {
					name.forEach(function(n) {
						this.add(element, n);
					}, this);
				} else {
					if (this._supports) {
						element.classList.add(name);
					} else {
						var now = element.className.split(" ");
						if (now.indexOf(name) === -1) {
							now.push(name);
							element.className = now.join(" ");
						}
					}
				}
			}
		}),

		/**
		 * classList.remove
		 * @param {Element} element
		 * @param {String} name
		 * @returns {function}
		 */
		remove: chained(function(element, name) {
			if (gui.Type.isString(name)) {
				name = name || "";
				if (name.indexOf(" ") > -1) {
					name = name.split(" ");
				}
				if (gui.Type.isArray(name)) {
					name.forEach(function(n) {
						this.remove(element, n);
					}, this);
				} else {
					if (this._supports) {
						element.classList.remove(name);
					} else {
						var now = element.className.split(" ");
						var idx = now.indexOf(name);
						if (idx > -1) {
							gui.Array.remove(now, idx);
						}
						element.className = now.join(" ");
					}
				}
			}
		}),

		/**
		 * classList.toggle
		 * @param {Element} element
		 * @param {String} name
		 * @returns {function}
		 */
		toggle: chained(function(element, name) {
			if (gui.Type.isString(name)) {
				if (this._supports) {
					element.classList.toggle(name);
				} else {
					if (this.contains(element, name)) {
						this.remove(element, name);
					} else {
						this.add(element, name);
					}
				}
			}
		}),

		/**
		 * Add or remove classname according to second argument.
		 * @param {Element} element
		 * @param {truthy} on
		 * @param {String} name
		 * @returns {function}
		 */
		shift: chained(function(element, on, name) {
			if (!!on) { // coerce to boolean
				this.add(element, name);
			} else {
				this.remove(element, name);
			}
		}),

		/**
		 * classList.contains
		 * @param {Element} element
		 * @param {String} name
		 * @returns {boolean}
		 */
		contains: function(element, name) {
			if (this._supports) {
				return element.classList.contains(name);
			} else {
				var classnames = element.className.split(" ");
				return classnames.indexOf(name) > -1;
			}
		},

		/**
		 * Set single CSS property. Use style() for multiple properties.
		 * TODO: also automate shorthands such as "10px 20px 10px 20px"
		 * @param {Element}
		 * @param {String} prop
		 * @returns {function}
		 */
		set: chained(function(element, prop, value) {
			if (gui.Type.isNumber(value)) {
				value = (this._shorthands[prop] || "@").replace("@", value);
			}
			value = String(value);
			if (prop === "float") {
				prop = "cssFloat";
			} else {
				value = this._jsvalue(value);
				prop = this._jsproperty(prop);
			}
			element.style[prop] = value;
		}),

		/**
		 * TODO: Get element.style property; if this has been set.
		 * Not to be confused with compute() for computedStyle!!!
		 * @param {Element}
		 * @param {String} prop
		 * @returns {String}
		 */
		get: function(element, prop) {
			prop = this._jsproperty(prop);
			return this._jsvalue(element.style[prop]);
		},

		/**
		 * Set multiple element.style properties via hashmap. Note that
		 * this method returns the element (ie. it is not chainable).
		 * @param {Element|gui.Spirit} thing Spirit or element.
		 * @param {Map<String,String>} styles
		 * @returns {Element|gui.Spirit}
		 */
		style: function(thing, styles) {
			var element = thing instanceof gui.Spirit ? thing.element : thing;
			gui.Object.each(styles, function(prop, value) {
				this.set(element, prop, value);
			}, this);
			return thing;
		},

		/**
		 * Compute runtime style.
		 * @param {Element|gui.Spirit} thing
		 * @param {String} prop
		 * @returns {String}
		 */
		compute: function(thing, prop) {
			var element = thing instanceof gui.Spirit ? thing.element : thing;
			prop = this._standardcase(this._jsproperty(prop));
			return window.getComputedStyle(element, null).getPropertyValue(prop);
		},

		/**
		 * Node matches CSS selector?
		 * @param {Node} node
		 * @param {String} selector
		 * @returns {boolean}
		 */
		matches: function(node, selector) {
			var matches = false;
			try { // TODO: Something about trycatch not being JIT compatible?
				matches = node[this._matchmethod](selector);
			} catch (dysfunction) {
				console.error('Invalid selector: "' + selector + '"');
				throw dysfunction;
			}
			return matches;
		},


		// Private static ..........................................................

		/**
		 * Non-matching vendors removed after first run. First entry
		 * gets to stay since it represents the unprefixed property.
		 * @type {Array<String>}
		 */
		_vendors: ["", "-webkit-", "-moz-", "-ms-", "-o-"],

		/**
		 * _supports Element.classList?
		 * @type {boolean}
		 */
		_supports: document.documentElement.classList !== undefined,

		/**
		 * CamelCase string.
		 * @param {String} string
		 * @returns {String}
		 */
		_camelcase: function(string) {
			return string.replace(/-([a-z])/ig, function(all, letter) {
				return letter.toUpperCase();
			});
		},

		/**
		 * standard-css-notate CamelCased string.
		 * @param {String} string
		 * @returns {String}
		 */
		_standardcase: function(string) {
			return string.replace(/[A-Z]/g, function(all, letter) {
				return "-" + string.charAt(letter).toLowerCase();
			});
		},

		/**
		 * Normalize declaration property for use in element.style scenario.
		 * @param {String} prop
		 * @returns {String}
		 */
		_jsproperty: function(prop) {
			var vendors = this._vendors,
				fixt = prop;
			var element = document.documentElement;
			prop = String(prop);
			if (prop.startsWith("-beta-")) {
				vendors.every(function(vendor) {
					var test = this._camelcase(prop.replace("-beta-", vendor));
					if (element.style[test] !== undefined) {
						fixt = test;
						return false;
					}
					return true;
				}, this);
			} else {
				fixt = this._camelcase(fixt);
			}
			return fixt;
		},

		/**
		 * Normalize declaration value for use in element.style scenario.
		 * @param {String} value
		 * @returns {String}
		 */
		_jsvalue: function(value) {
			var vendors = this._vendors;
			var element = document.documentElement;
			value = String(value);
			if (value && value.includes("-beta-")) {
				var parts = [];
				value.split(", ").forEach(function(part) {
					if ((part = part.trim()).startsWith("-beta-")) {
						vendors.every(function(vendor) {
							var test = this._camelcase(part.replace("-beta-", vendor));
							if (element.style[test] !== undefined) {
								parts.push(part.replace("-beta-", vendor));
								return false;
							}
							return true;
						}, this);
					} else {
						parts.push(part);
					}
				}, this);
				value = parts.join(",");
			}
			return value;
		},

		/**
		 * Normalize declaration property for use in CSS text.
		 * @param {String} prop
		 * @returns {String}
		 */
		_cssproperty: function(prop) {
			return this._standardcase(this._jsproperty(prop));
		},

		/**
		 * Normalize declaration value for use in CSS text.
		 * @param {String} prop
		 * @returns {String}
		 */
		_cssvalue: function(value) {
			return this._standardcase(this._jsvalue(value));
		},

		/**
		 * Setter shorthands will autosuffix properties that require units
		 * in support of the syntax: this.css.width = 300 (no method call)
		 * TODO: add more properties
		 * TODO: getters as well as setters
		 * @type {Map<String,String>
		 */
		_shorthands: {
			top: "@px",
			right: "@px",
			bottom: "@px",
			left: "@px",
			width: "@px",
			height: "@px",
			maxWidth: "@px",
			maxHeight: "@px",
			minWidth: "@px",
			minHeight: "@px",
			textIndent: "@px",
			margin: "@px",
			marginTop: "@px",
			marginRight: "@px",
			marginBottom: "@px",
			marginLeft: "@px",
			padding: "@px",
			paddingTop: "@px",
			paddingRight: "@px",
			paddingBottom: "@px",
			paddingLeft: "@px",
			fontWeight: "@",
			opacity: "@",
			zIndex: "@",
			position: "@",
			display: "@",
			visibility: "@"
		},

		/**
		 * Lookup vendors "matchesSelector" method.
		 * @type {String}
		 */
		_matchmethod: (function() {
			var match = null,
				root = document.documentElement;
			[
				"mozMatchesSelector",
				"webkitMatchesSelector",
				"msMatchesSelector",
				"oMatchesSelector",
				"matchesSelector"
			].every(function(method) {
				if (gui.Type.isDefined(root[method])) {
					match = method;
				}
				return match === null;
			});
			return match;
		})()

	});

}(
	gui.Combo.chained,
	gui.Arguments.confirmed
));

/**
 * Generate shorthand getters/setters for top|left|width|height etc.
 */
(function shorthands() {
	function getset(prop) {
		Object.defineProperty(gui.CSSPlugin.prototype, prop, {
			enumerable: true,
			configurable: true,
			get: function get() {
				if (this.spirit) {
					return parseInt(this.get(prop), 10);
				}
			},
			set: function set(val) {
				this.set(prop, val);
			}
		});
	}
	var shorts = gui.CSSPlugin._shorthands;
	for (var prop in shorts) {
		if (shorts.hasOwnProperty(prop)) {
			getset(prop);
		}
	}
})();



/**
 * DOM query and manipulation.
 * @extends {gui.Plugin}
 * TODO: add `prependTo` method
 * @using {gui.Combo#chained}
 * @using {gui.Guide}
 * @using {gui.DOMObserver}
 */
gui.DOMPlugin = (function using(chained, guide, observer) {

	return gui.Plugin.extend({

		/**
		 * Set or get element id.
		 * @param @optional {String} id
		 * @returns {String|gui.DOMPlugin}
		 */
		id: chained(function(id) {
			if (id) {
				this.spirit.element.id = id;
			} else {
				return this.spirit.element.id || null;
			}
		}),

		/**
		 * Get or set element title (tooltip).
		 * @param @optional {String} title
		 * @returns {String|gui.DOMPlugin}
		 */
		title: chained(function(title) {
			var element = this.spirit.element;
			if (gui.Type.isDefined(title)) {
				element.title = title ? title : "";
			} else {
				return element.title;
			}
		}),

		/**
		 * Get or set element markup.
		 * @param @optional {String} html
		 * @param @optional {String} position
		 * @returns {String|gui.DOMPlugin}
		 */
		html: chained(function(html, position) {
			return gui.DOMPlugin.html(this.spirit.element, html, position);
		}),

		/**
		 * Get or set element outer markup.
		 * @param @optional {String} html
		 * @returns {String|gui.DOMPlugin}
		 */
		outerHtml: chained(function(html) {
			return gui.DOMPlugin.outerHtml(this.spirit.element, html);
		}),

		/**
		 * Get or set element textContent.
		 * @param @optional {String} text
		 * @returns {String|gui.DOMPlugin}
		 */
		text: chained(function(text) {
			return gui.DOMPlugin.text(this.spirit.element, text);
		}),

		/**
		 * Empty spirit subtree.
		 * @returns {gui.DOMPlugin}
		 */
		empty: chained(function() {
			this.html("");
		}),

		/**
		 * Hide spirit element and mark as invisible. 
		 * Adds the `._gui-hidden` classname.
		 * @returns {gui.DOMPlugin}
		 */
		hide: chained(function() {
			if (!this.spirit.css.contains(gui.CLASS_HIDDEN)) {
				this.spirit.css.add(gui.CLASS_HIDDEN);
				if (gui.hasModule("gui-layout@wunderbyte.com")) { // TODO: - fix
					if (this.spirit.visibility) { // some kind of Selenium corner case
						this.spirit.visibility.off();
					}
				}
			}
		}),

		/**
		 * Show spirit element and mark as visible. 
		 * Removes the `._gui-hidden` classname.
		 * @returns {gui.DOMPlugin}
		 */
		show: chained(function() {
			if (this.spirit.css.contains(gui.CLASS_HIDDEN)) {
				this.spirit.css.remove(gui.CLASS_HIDDEN);
				if (gui.hasModule("gui-layout@wunderbyte.com")) {
					if (this.spirit.visibility) { // some kind of Selenium corner case
						this.spirit.visibility.on();
					}
				}
			}
		}),

		/**
		 * Get spirit element tagname (identicased with HTML).
		 * @returns {String}
		 */
		tag: function() {
			return this.spirit.element.localName;
		},

		/**
		 * Is positioned in page DOM? Otherwise plausible
		 * createElement or documentFragment scenario.
		 * @returns {boolean}
		 */
		embedded: function() {
			return gui.DOMPlugin.embedded(this.spirit.element);
		},

		/**
		 * Removing this spirit from it's parent container. Note that this will
		 * schedule destruction of the spirit unless it gets reinserted somewhere.
		 * Also note that this method is called on the spirit, not on the parent.
		 * @returns {object} Returns the argument
		 */
		remove: function() {
			var parent = this.spirit.element.parentNode;
			parent.removeChild(this.spirit.element);
		},

		/**
		 * Clone spirit element.
		 * @return {Element}
		 */
		clone: function() {
			return this.spirit.element.cloneNode(true);
		},

		/**
		 * Get ordinal index of element.
		 * TODO: Support 'of-same-type' or something
		 * @returns {number}
		 */
		ordinal: function() {
			return gui.DOMPlugin.ordinal(this.spirit.element);
		},

		/**
		 * Compare the DOM position of this spirit against something else.
		 * @see http://www.w3.org/TR/DOM-Level-3-Core/core.html#Node3-compareDocumentPosition
		 * @param {Element|gui.Spirit} other
		 * @returns {number}
		 */
		compare: function(other) {
			return gui.DOMPlugin.compare(this.spirit.element, other);
		},

		/**
		 * Contains other node or spirit?
		 * @param {Node|gui.Spirit} other
		 * @returns {boolean}
		 */
		contains: function(other) {
			return gui.DOMPlugin.contains(this.spirit.element, other);
		},

		/**
		 * Contained by other node or spirit?
		 * @param {Node|gui.Spirit} other
		 * @returns {boolean}
		 */
		containedBy: function(other) {
			return gui.DOMPlugin.contains(other, this.spirit.element);
		},

		/**
		 * Parse HTML to DOM node.
		 * @param {string} html
		 * @returns {Node}
		 */
		parseToNode: function(html) {
			return gui.DOMPlugin.parseToNode(html);
		},

		/**
		 * Parse HTML to array of DOM node(s).
		 * @param {string} html
		 * @returns {Node}
		 */
		parseToNodes: function(html) {
			return gui.DOMPlugin.parseToNodes(html);
		}


	}, {}, { // Static ...........................................................

		/**
		 * Spiritual-aware innerHTML (WebKit first aid).
		 * @param {Element} elm
		 * @param @optional {String} html
		 * @param @optional {String} pos
		 */
		html: function(elm, html, pos) {
			if (gui.Type.isString(html)) {
				if (pos) {
					return elm.insertAdjacentHTML(pos, html);
				} else {
					if (gui.mode === gui.MODE_ROBOT) {
						gui.materializeSub(elm);
						gui.suspend(function() {
							elm.innerHTML = html;
						});
						gui.spiritualizeSub(elm);
					} else {
						elm.innerHTML = html;
					}
				}
			} else {
				return elm.innerHTML;
			}
		},

		/**
		 * Spiritual-aware outerHTML (WebKit first aid).
		 * TODO: deprecate and support "replace" value for position?
		 * TODO: can outerHTML carry multiple root-nodes?
		 * @param {Element} elm
		 * @param @optional {String} html
		 */
		outerHtml: function(elm, html) {
			if (gui.Type.isString(html)) {
				if (gui.mode === gui.MODE_ROBOT) {
					gui.materialize(elm);
					gui.suspend(function() {
						elm.outerHTML = html;
					});
					gui.spiritualize(elm);
				} else {
					elm.outerHTML = html;
				}
			} else {
				return elm.outerHTML;
			}
		},

		/**
		 * Spiritual-aware textContent (WebKit first aid).
		 * @param {Element} elm
		 * @param @optional {String} html
		 * @param @optional {String} position
		 */
		text: function(elm, text) {
			var guide = gui.Guide;
			if (gui.Type.isString(text)) {
				if (gui.mode === gui.MODE_ROBOT) {
					guide.materializeSub(elm);
					gui.suspend(function() {
						elm.textContent = text;
					});
				} else {
					elm.textContent = text;
				}
			} else {
				return elm.textContent;
			}
		},

		/**
		 * Get ordinal position of element within container.
		 * @param {Element} element
		 * @returns {number}
		 */
		ordinal: function(element) {
			var result = 0;
			var parent = element.parentNode;
			if (parent) {
				var node = parent.firstElementChild;
				while (node) {
					if (node === element) {
						break;
					} else {
						node = node.nextElementSibling;
						result++;
					}
				}
			}
			return result;
		},

		/**
		 * Compare document position of two nodes.
		 * @see http://mdn.io/compareDocumentPosition
		 * @param {Node|gui.Spirit} node1
		 * @param {Node|gui.Spirit} node2
		 * @returns {number}
		 */
		compare: function(node1, node2) {
			node1 = node1 instanceof gui.Spirit ? node1.element : node1;
			node2 = node2 instanceof gui.Spirit ? node2.element : node2;
			return node1.compareDocumentPosition(node2);
		},

		/**
		 * Node contains other node?
		 * @param {Node|gui.Spirit} node
		 * @param {Node|gui.Spirit} othernode
		 * @returns {boolean}
		 */
		contains: function(node, othernode) {
			var check = Node.DOCUMENT_POSITION_CONTAINS + Node.DOCUMENT_POSITION_PRECEDING;
			return this.compare(othernode, node) === check;
		},

		/**
		 * Other node is a following sibling to node?
		 * @param {Node|gui.Spirit} node
		 * @param {Node|gui.Spirit} othernode
		 * @returns {boolean}
		 */
		follows: function(node, othernode) {
			return this.compare(othernode, node) === Node.DOCUMENT_POSITION_FOLLOWING;
		},

		/**
		 * Other node is a preceding sibling to node?
		 * @param {Node|gui.Spirit} node
		 * @param {Node|gui.Spirit} othernode
		 * @returns {boolean}
		 */
		precedes: function(node, othernode) {
			return this.compare(othernode, node) === Node.DOCUMENT_POSITION_PRECEDING;
		},

		/**
		 * Is node positioned in page DOM?
		 * @param {Element|gui.Spirit} node
		 * @returns {boolean}
		 */
		embedded: function(node) {
			node = node instanceof gui.Spirit ? node.element : node;
			return this.contains(node.ownerDocument, node);
		},

		/**
		 * Remove from list all nodes that are contained by others.
		 * @param {Array<Element|gui.Spirit>} nodes
		 * @returns {Array<Element|gui.Spirit>}
		 */
		group: function(nodes) {
			var node, groups = [];

			function containedby(target, others) {
				return others.some(function(other) {
					return gui.DOMPlugin.contains(other, target);
				});
			}
			while ((node = nodes.pop())) {
				if (!containedby(node, nodes)) {
					groups.push(node);
				}
			}
			return groups;
		},

		/**
		 * Get first element that matches a selector.
		 * Optional type argument filters to spirit of type.
		 * @param {Node} node
		 * @param {String} selector
		 * @param @optional {function} type
		 * @returns {Element|gui.Spirit}
		 */
		q: function(node, selector, type) {
			var result = null;
			return this._qualify(node, selector)(function(node, selector) {
				if (type) {
					result = this.qall(node, selector, type)[0] || null;
				} else {
					try {
						result = node.querySelector(selector);
					} catch (exception) {
						console.error("Dysfunctional selector: " + selector);
						throw exception;
					}
				}
				return result;
			});
		},

		/**
		 * Get list of all elements that matches a selector.
		 * Optional type argument filters to spirits of type.
		 * Method always returns a (potentially empty) array.
		 * @param {Node} node
		 * @param {String} selector
		 * @param @optional {function} type
		 * @returns {Array<Element|gui.Spirit>}
		 */
		qall: function(node, selector, type) {
			var result = [];
			return this._qualify(node, selector)(function(node, selector) {
				result = gui.Array.from(node.querySelectorAll(selector));
				if (type) {
					result = result.filter(function(el) {
						return el.spirit && (el.spirit instanceof type);
					}).map(function(el) {
						return el.spirit;
					});
				}
				return result;
			});
		},

		/**
		 * Get first element in document that matches a selector.
		 * Optional type argument filters to spirit of type.
		 * @param {String} selector
		 * @param @optional {function} type
		 * @returns {Element|gui.Spirit}
		 */
		qdoc: function(selector, type) {
			return this.q(document, selector, type);
		},

		/**
		 * Get list of all elements in document that matches a selector.
		 * Optional type argument filters to spirits of type.
		 * Method always returns a (potentially empty) array.
		 * @param {String} selector
		 * @param @optional {function} type
		 * @returns {Array<Element|gui.Spirit>}
		 */
		qdocall: function(selector, type) {
			return this.qall(document, selector, type);
		},


		// Private static .........................................................

		/**
		 * Support direct children selection using proprietary 'this' keyword
		 * by temporarily assigning the element an ID and modifying the query.
		 * @param {Node} node
		 * @param {String} selector
		 * @param {function} action
		 * @returns {object}
		 */
		_qualify: function(node, selector, action) {
			var hadid = true,
				id, regexp = this._thiskeyword;
			if (node.nodeType === Node.ELEMENT_NODE) {
				if (regexp.test(selector)) {
					hadid = node.id;
					id = node.id = (node.id || gui.KeyMaster.generateKey());
					selector = selector.replace(regexp, "#" + id);
					node = node.ownerDocument;
				}
			}
			return function(action) {
				var res = action.call(gui.DOMPlugin, node, selector);
				if (!hadid) {
					node.id = "";
				}
				return res;
			};
		},

		/**
		 * Match custom 'this' keyword in CSS selector. You can start
		 * selector expressions with "this>*" to find immediate child
		 * TODO: skip 'this' and support simply ">*" and "+*" instead.
		 * @type {RegExp}
		 */
		_thiskeyword: /^this|,this/g

	});

}(
	gui.Combo.chained,
	gui.Guide,
	gui.DOMObserver
));

/**
 * Bind the "this" keyword for all static methods.
 */
gui.Object.bindall(gui.DOMPlugin);

/**
 * DOM query methods accept a CSS selector and an optional spirit constructor
 * as arguments. They return a spirit, an element or an array of either.
 */
gui.DOMPlugin.mixin(
	gui.Object.map({

		/**
		 * Get first descendant element matching selector. Optional type argument returns
		 * spirit for first element to be associated to spirit of this type. Note that
		 * this may not be the first element to match the selector. Also note that type
		 * performs slower than betting on <code>this.dom.q ( "tagname" ).spirit</code>
		 * @param {String} selector
		 * @param @optional {function} type Spirit constructor (eg. gui.Spirit)
		 * @returns {Element|gui.Spirit}
		 */
		q: function(selector, type) {
			return gui.DOMPlugin.q(this.spirit.element, selector, type);
		},

		/**
		 * Get list of all descendant elements that matches a selector. Optional type
		 * arguments returns instead all associated spirits to match the given type.
		 * @param {String} selector
		 * @param @optional {function} type Spirit constructor
		 * @returns {Array<Element|gui.Spirit>}
		 */
		qall: function(selector, type) {
			return gui.DOMPlugin.qall(this.spirit.element, selector, type);
		},

		/**
		 * Same as q, but scoped from the document root. Use wisely.
		 * @param {String} selector
		 * @param @optional {function} type Spirit constructor
		 * returns {Element|gui.Spirit}
		 */
		qdoc: function(selector, type) {
			return gui.DOMPlugin.qdoc(selector, type);
		},

		/**
		 * Same as qall, but scoped from the document root. Use wisely.
		 * @param {String} selector
		 * @param @optional {function} type Spirit constructor
		 * @returns {Array<Element|gui.Spirit>}
		 */
		qdocall: function(selector, type) {
			return gui.DOMPlugin.qdocall(selector, type);
		}

	}, function(name, base) {
		return function() {
			var selector = arguments[0],
				type = arguments[1];
			if (gui.Type.isString(selector)) {
				if (arguments.length === 1 || gui.Type.isFunction(type)) {
					return base.apply(this, arguments);
				} else {
					type = gui.Type.of(type);
					throw new TypeError("Unknown spirit for query: " + name + "(" + selector + "," + type + ")");
				}
			} else {
				throw new TypeError("Bad selector for query: " + name + "(" + selector + ")");
			}
		};
	})
);

/**
 * DOM navigation methods accept an optional spirit constructor as
 * argument. They return a spirit, an element or an array of either.
 */
gui.DOMPlugin.mixin(
	gui.Object.map({

		/**
		 * Next element or next spirit of given type.
		 * @param @optional {constructor} type Spirit constructor
		 * @returns {Element|gui.Spirit}
		 */
		next: function(type) {
			var result = null,
				spirit = null,
				el = this.spirit.element;
			if (type) {
				while ((el = el.nextElementSibling) !== null) {
					spirit = el.spirit;
					if (spirit !== null && spirit instanceof type) {
						result = spirit;
						break;
					}
				}
			} else {
				result = el.nextElementSibling;
			}
			return result;
		},

		/**
		 * Previous element or previous spirit of given type.
		 * @param @optional {constructor} type Spirit constructor
		 * @returns {Element|gui.Spirit}
		 */
		previous: function(type) {
			var result = null,
				spirit = null,
				el = this.spirit.element;
			if (type) {
				while ((el = el.previousElementSibling) !== null) {
					spirit = el.spirit;
					if (spirit !== null && spirit instanceof type) {
						result = spirit;
						break;
					}
				}
			} else {
				result = el.previousElementSibling;
			}
			return result;
		},

		/**
		 * First element or first spirit of type.
		 * @param @optional {constructor} type Spirit constructor
		 * @returns {Element|gui.Spirit}
		 */
		first: function(type) {
			var result = null,
				spirit = null,
				el = this.spirit.element.firstElementChild;
			if (type) {
				while (result === null && el !== null) {
					spirit = el.spirit;
					if (spirit !== null && spirit instanceof type) {
						result = spirit;
					}
					el = el.nextElementSibling;
				}
			} else {
				result = el;
			}
			return result;
		},

		/**
		 * Last element or last spirit of type.
		 * @param @optional {constructor} type Spirit constructor
		 * @returns {Element|gui.Spirit}
		 */
		last: function(type) {
			var result = null,
				spirit = null,
				el = this.spirit.element.lastElementChild;
			if (type) {
				while (result === null && el !== null) {
					spirit = el.spirit;
					if (spirit !== null && spirit instanceof type) {
						result = spirit;
					}
					el = el.previoustElementSibling;
				}
			} else {
				result = el;
			}
			return result;
		},

		/**
		 * Parent parent or parent spirit of type.
		 * @param @optional {constructor} type Spirit constructor
		 * @returns {Element|gui.Spirit}
		 */
		parent: function(type) {
			var result = this.spirit.element.parentNode;
			if (type) {
				var spirit = result.spirit;
				if (spirit && spirit instanceof type) {
					result = spirit;
				} else {
					result = null;
				}
			}
			return result;
		},

		/**
		 * Child element or child spirit of type.
		 * @param @optional {constructor} type Spirit constructor
		 * @returns {Element|gui.Spirit}
		 */
		child: function(type) {
			var result = this.spirit.element.firstElementChild;
			if (type) {
				result = this.children(type)[0] || null;
			}
			return result;
		},

		/**
		 * Children elements or children spirits of type.
		 * TODO: just use this.element.children :)
		 * @param @optional {constructor} type Spirit constructor
		 * @returns {Array<Element|gui.Spirit>}
		 */
		children: function(type) {
			var result = gui.Array.from(this.spirit.element.children);
			if (type) {
				result = result.filter(function(elm) {
					return elm.spirit && elm.spirit instanceof type;
				}).map(function(elm) {
					return elm.spirit;
				});
			}
			return result;
		},

		/**
		 * First ancestor element (parent!) or first ancestor spirit of type.
		 * @param @optional {constructor} type Spirit constructor
		 * @returns {Element|gui.Spirit}
		 */
		ancestor: function(type) {
			var result = this.parent();
			if (type) {
				result = null;
				new gui.Crawler().ascend(this.spirit.element, {
					handleSpirit: function(spirit) {
						if (spirit instanceof type) {
							result = spirit;
							return gui.Crawler.STOP;
						}
					}
				});
			}
			return result;
		},

		/**
		 * First ancestor elements or ancestor spirits of type.
		 * @param @optional {constructor} type Spirit constructor
		 * @returns {Array<Element|gui.Spirit>}
		 */
		ancestors: function(type) {
			var result = [];
			var crawler = new gui.Crawler();
			if (type) {
				crawler.ascend(this.element, {
					handleSpirit: function(spirit) {
						if (spirit instanceof type) {
							result.push(spirit);
						}
					}
				});
			} else {
				crawler.ascend(this.element, {
					handleElement: function(el) {
						result.push(el);
					}
				});
			}
			return result;
		},

		/**
		 * First descendant element (first child!) first descendant spirit of type.
		 * @param @optional {constructor} type Spirit constructor
		 * @returns {Element|gui.Spirit}
		 */
		descendant: function(type) {
			var result = this.child();
			var me = this.spirit.element;
			if (type) {
				new gui.Crawler().descend(me, {
					handleSpirit: function(spirit) {
						if (spirit instanceof type) {
							if (spirit.element !== me) {
								result = spirit;
								return gui.Crawler.STOP;
							}
						}
					}
				});
			}
			return result;
		},

		/**
		 * All descendant elements or all descendant spirits of type.
		 * @param @optional {constructor} type Spirit constructor
		 * @returns {Array<Element|gui.Spirit>}
		 */
		descendants: function(type) {
			var result = [];
			var me = this.spirit.element;
			new gui.Crawler().descend(me, {
				handleElement: function(element) {
					if (!type && element !== me) {
						result.push(element);
					}
				},
				handleSpirit: function(spirit) {
					if (type && spirit instanceof type) {
						if (spirit.element !== me) {
							result.push(spirit);
						}
					}
				}
			});
			return result;
		},

		/**
		 * Get following sibling elements or spirits of type.
		 * @param @optional {constructor} type Spirit constructor
		 * @returns {Array<element|gui.Spirit>}
		 */
		following: function(type) {
			var result = [],
				spirit, el = this.spirit.element;
			while ((el = el.nextElementSibling)) {
				if (type && (spirit = el.spirit)) {
					if (spirit instanceof type) {
						result.push(spirit);
					}
				} else {
					result.push(el);
				}
			}
			return result;
		},

		/**
		 * Get preceding sibling elements or spirits of type.
		 * @param @optional {constructor} type Spirit constructor
		 * @returns {Array<element|gui.Spirit>}
		 */
		preceding: function(type) {
			var result = [],
				spirit, el = this.spirit.element;
			while ((el = el.previousElementSibling)) {
				if (type && (spirit = el.spirit)) {
					if (spirit instanceof type) {
						result.push(spirit);
					}
				} else {
					result.push(el);
				}
			}
			return result;
		},

		/**
		 * Get sibling elements or spirits of type.
		 * @param @optional {constructor} type Spirit constructor
		 * @returns {Array<element|gui.Spirit>}
		 */
		siblings: function(type) {
			return this.preceding(type).concat(this.following(type));
		}

	}, function map(name, base) {
		return function(Type) {
			if (!gui.Type.isDefined(Type) || gui.Type.isFunction(Type)) {
				return base.apply(this, arguments);
			} else {
				throw new TypeError(
					"Unknown spirit for query: " + name +
					"(" + gui.Type.of(Type) + ")"
				);
			}
		};
	})
);

(function scoped() {

	/**
	 * Make sure that DOM created by spirits is always
	 * spiritualized disregarding current 'gui.mode'.
	 * In robot mode, we'll let the system handle it.
	 * @param {Element} el
	 */
	function maybespiritualize(elm) {
		if (gui.mode !== gui.MODE_ROBOT) {
			gui.spiritualize(elm);
		}
	}

	/**
	 * TODO: prependTo and friends...
	 */
	gui.DOMPlugin.mixin({

		/**
		 * Append spirit (element) to another spirit or element.
		 * @param {object} thing
		 * @returns {gui.DOMPlugin} or what?
		 */
		appendTo: function(thing) {
			var elm = this.spirit.element;
			if (gui.Type.isSpirit(thing)) {
				thing.dom.append(elm);
			} else if (gui.Type.isElement(thing)) {
				thing.appendChild(elm);
				maybespiritualize(thing);
			}
			return this; // or what?
		},

		/**
		 * Parse HTML to DOM node.
		 * @param {string} html
		 * @param @optional {Document} targetdoc
		 * @returns {Node}
		 */
		parseToNode: function(html, targetdoc) {
			return gui.HTMLParser.parseToNode(html, targetdoc);
		},

		/**
		 * Parse HTML to array of DOM node(s).
		 * @param {string} html
		 * @param @optional {Document} targetdoc
		 * @returns {Array<Node>}
		 */
		parseToNodes: function(html, targetdoc) {
			return gui.HTMLParser.parseToNodes(html, targetdoc);
		},
	});

}());


/**
 * DOM insertion methods accept one argument: one spirit OR one element OR an array of either or both.
 * The input argument is returned as given. This allows for the following one-liner to be constructed:
 * this.something = this.dom.append ( gui.SomeThingSpirit.summon ( this.document )); // imagine 15 more
 * TODO: Go for compliance with DOM4 method matches (something about textnoding string arguments)
 */

(function scoped() {

	/**
	 * Always spiritualize chain reactions.
	 * @param {Element} el
	 */
	function maybespiritualize(elm) {
		if (gui.mode !== gui.MODE_ROBOT) {
			gui.spiritualize(elm);
		}
	}

	gui.DOMPlugin.mixin(
		gui.Object.map({

			/**
			 * Append spirit OR element OR array of either.
			 * @param {object} things Complicated argument
			 * @returns {object} Returns the argument
			 */
			append: function(things) {
				var els = things,
					element = this.spirit.element;
				els.forEach(function(el) {
					element.appendChild(el);
					maybespiritualize(el);
				});
			},

			/**
			 * Prepend spirit OR element OR array of either.
			 * @param {object} things Complicated argument
			 * @returns {object} Returns the argument
			 */
			prepend: function(things) {
				var els = things,
					element = this.spirit.element,
					first = element.firstChild;
				els.reverse().forEach(function(el) {
					element.insertBefore(el, first);
					maybespiritualize(el);
				});
			},

			/**
			 * Insert spirit OR element OR array of either before this spirit.
			 * @param {object} things Complicated argument
			 * @returns {object} Returns the argument
			 */
			before: function(things) {
				var els = things,
					target = this.spirit.element,
					parent = target.parentNode;
				els.reverse().forEach(function(el) {
					parent.insertBefore(el, target);
					maybespiritualize(el);
				});
			},

			/**
			 * Insert spirit OR element OR array of either after this spirit.
			 * @param {object} things Complicated argument
			 * @returns {object} Returns the argument
			 */
			after: function(things) {
				var els = things,
					target = this.spirit.element,
					parent = target.parentNode;
				els.forEach(function(el) {
					parent.insertBefore(el, target.nextSibling);
					maybespiritualize(el);
				});
			},

			/**
			 * Replace the spirit with something else. This may nuke the spirit.
			 * Note that this method is called on the spirit, not on the parent.
			 * @param {object} things Complicated argument.
			 * @returns {object} Returns the argument
			 */
			replace: function(things) {
				this.after(things);
				this.remove();
			}

		}, function map(name, base) {

			/*
			 * 1. Convert arguments to array of one or more elements
			 * 2. Confirm array of elements (exception supressed pending IE9 issue)
			 * 3. Invoke the base
			 * 4. Return the input
			 * TODO: DocumentFragment and friends
			 * @param {String} name
			 * @param {function} base
			 */
			return function(things) {
				var elms = Array.map(gui.Array.make(things), function(thing) {
					return thing && thing instanceof gui.Spirit ? thing.element : thing;
				}).filter(function(thing) { // TODO: IE9 may sometimes for some reason throw an array in here :/ must investigate!!!
					return thing && gui.Type.isNumber(thing.nodeType); // first check added for FF which now may fail as well :/
				});
				if (elms.length) {
					base.call(this, elms);
				}
				return things;
			};
		})
	);
}());



/**
 * Tracking DOM events.
 * TODO Static interface for general consumption.
 * @extends {gui.TrackerPlugin}
 * @using {gui.Combo#chained} chained
 * @using {gui.Array} guiArray
 * @using {gui.DOMPlugin} DOMplugin
 * @using {gui.Interface} Interface
 * @uisng {gui.Type} Type
 */
gui.EventPlugin = (function using(chained, guiArray, DOMPlugin, Interface, Type) {

	return gui.TrackerPlugin.extend({

		/**
		 * Add one or more DOM event handlers.
		 * TODO: Don't assume spirit handler
		 * @param {object} arg String, array or whitespace-separated-string
		 * @param @optional {object} target Node, Window or XmlHttpRequest. Defaults to spirit element
		 * @param @optional {object} handler implements {gui.IEventHandler}, defaults to spirit
		 * @param @optional {boolean} capture Defaults to false
		 * @returns {gui.EventPlugin}
		 */
		add: chained(function(arg, target, handler, capture) {
			target = this._getelementtarget(target);
			if (target.nodeType || Type.isWindow(target)) {
				handler = handler ? handler : this.spirit;
				capture = capture ? capture : false;
				if (Interface.validate(gui.IEventHandler, handler)) {
					var checks = [target, handler, capture];
					this._breakdown(arg).forEach(function(type) {
						if (this._addchecks(type, checks)) {
							this._shiftEventListener(true, target, type, handler, capture);
						}
					}, this);
				}
			} else {
				throw new TypeError(
					'Invalid target: ' + target + ' (' + this.spirit.$classname + ')'
				);
			}
		}),

		/**
		 * Add one or more DOM event handlers.
		 * @param {object} arg String, array or whitespace-separated-string
		 * @param @optional {object} target Node, Window or XmlHttpRequest. Defaults to spirit element
		 * @param @optional {object} handler implements {gui.IEventHandler}, defaults to spirit
		 * @param @optional {boolean} capture Defaults to false
		 * @returns {gui.EventPlugin}
		 */
		remove: chained(function(arg, target, handler, capture) {
			target = this._getelementtarget(target);
			if (target.nodeType || Type.isWindow(target)) {
				handler = handler ? handler : this.spirit;
				capture = capture ? capture : false;
				if (Interface.validate(gui.IEventHandler, handler)) {
					var checks = [target, handler, capture];
					this._breakdown(arg).forEach(function(type) {
						if (this._removechecks(type, checks)) {
							this._shiftEventListener(false, target, type, handler, capture);
						}
					}, this);
				}
			} else {
				throw new TypeError(
					'Invalid target: ' + target + ' (' + this.spirit.$classname + ')'
				);
			}
		}),

		/**
		 * Toggle one or more DOM event handlers.
		 * @param {object} arg String, array or whitespace-separated-string
		 * @param @optional {object} target Node, Window or XmlHttpRequest. Defaults to spirit element
		 * @param @optional {object} handler implements EventListener interface, defaults to spirit
		 * @param @optional {boolean} capture Defaults to false
		 * @returns {gui.EventPlugin}
		 */
		toggle: chained(function(arg, target, handler, capture) {
			target = this._getelementtarget(target);
			handler = handler ? handler : this.spirit;
			capture = capture ? capture : false;
			if (target instanceof gui.Spirit) {
				target = target.element;
			}
			var checks = [target, handler, capture];
			guiArray.make(arg).forEach(function(type) {
				if (this._contains(type, checks)) {
					this.add(type, target, handler, capture);
				} else {
					this.remove(type, target, handler, capture);
				}
			}, this);
		}),

		/**
		 * Dispatch event.
		 * https://dvcs.w3.org/hg/domcore/raw-file/tip/Overview.html#customeventinit
		 * http://stackoverflow.com/questions/5342917/custom-events-in-ie-without-using-libraries
		 * @param {string} type
		 * @param @optional {Map} params TODO: If not supported in IE(?), deprecate???
		 * @returns {boolean} True if the event was cancelled (prevetDefaulted)
		 */
		dispatch: function(type, params) {
			var elm = this.spirit.element,
				evt = null;
			if (window.CustomEvent && !gui.Client.isExplorer) { // TODO: IE version???
				evt = new CustomEvent(type, params);
			} else {
				params = params || {
					bubbles: false,
					cancelable: false,
					detail: undefined
				};
				evt = document.createEvent('HTMLEvents');
				evt.initEvent(type, params.bubbles, params.cancelable);
			}
			evt.eventName = type;
			if (elm.dispatchEvent) {
				return elm.dispatchEvent(evt);
			} else if (elm[type]) {
				return elm[type]();
			} else if (elm['on' + type]) {
				return elm['on' + type]();
			}
		},

		/**
		 * TODO: Delete this if Safari supports natively (and otherwise not used)
		 * Handle special event.
		 * @param {Event} e
		 */
		handleEvent: function(e) {
			var related = e.relatedTarget;
			var element = this.spirit.element;
			var inorout = related && related !== element &&
				!DOMPlugin.contains(element, related);
			switch (e.type) {
				case 'mouseover':
					if (inorout && this._mouseenter) {
						this.spirit.onevent(
							this._getfakeevent(e, 'mouseenter')
						);
					}
					break;
				case 'mouseout':
					if (inorout && this._mouseleave) {
						this.spirit.onevent(
							this._getfakeevent(e, 'mouseleave')
						);
					}
					break;
			}
		},


		// Private .................................................................

		/**
		 * Tracking `mouseenter`?
		 * @type {boolean}
		 */
		_mouseenter: false,

		/**
		 * Tracking `mouseout`?
		 * @type {boolean}
		 */
		_mouseleave: false,

		/**
		 * Actual event registration has been isolated so that
		 * one may overwrite or overload this particular part.
		 * @param {boolean} add
		 * @param {Node} target
		 * @param {string} type
		 * @param {object} handler
		 * @param {boolean} capture
		 */
		_shiftEventListener: function(add, target, type, handler, capture) {
			var action = add ? 'addEventListener' : 'removeEventListener';
			target[action](type, handler, capture);
		},

		/**
		 * TODO: Delete this if Safari supports natively!
		 * Reform vendor specific event types to standard event types.
		 * TODO: Elaborate setup to support vendor events universally
		 * @param {boolean} add
		 * @param {string} type
		 * @param {IEventHandler} handler
		 */
		_enterleavetype: function(add, type, handler) {
			var spirit = this.spirit;
			if (handler === spirit) {
				switch (type) {
					case 'mouseenter':
						this._mouseenter = add;
						return 'mouseover';
					case 'mouseleave':
						this._mouseleave = add;
						return 'mouseout';
				}
			} else {
				throw new TypeError(type + ' not (yet) supported on ' + handler);
			}
		},

		/**
		 * Get element for target argument.
		 * @param {Element|gui.Spirit} target
		 * @returns {Element}
		 */
		_getelementtarget: function(target) {
			target = target ? target : this.spirit.element;
			return (target instanceof gui.Spirit ? target.element : target);
		},

		/**
		 * TODO: Delete this if Safari supports natively (and otherwise not used)
		 * Clone the DOM event into a JS 
		 * object, then change the type.
		 * @param {Event} realevent
		 * @param {string} newtype
		 * @returns {object}
		 */
		_getfakeevent: function(realevent, newtype) {
			var prop, fakeevent = Object.create(null);
			for(prop in realevent){
				fakeevent[prop] = realevent[prop];
				fakeevent.type = newtype;
			}
			return fakeevent;
		},

		/**
		 * Remove event listeners.
		 * @overwrites {gui.Tracker#_cleanup}
		 * @param {String} type
		 * @param {Array<object>} checks
		 */
		_cleanup: function(type, checks) {
			var target = checks[0];
			var handler = checks[1];
			var capture = checks[2];
			this.remove(type, target, handler, capture);
		},

		/**
		 * Manhandle 'transitionend' event.
		 * @param {Array<String>|String} arg
		 * @returns {Array<String>}
		 */
		_breakdown: function(arg) {
			return guiArray.make(arg).map(function(type) {
				return type === 'transitionend' ? this._transitionend() : type;
			}, this);
		},

		/**
		 * Compute vendor prefixed 'transitionend' event name.
		 * NOTE: Chrome is unprefixed now, Safarai is still left.
		 * NOTE: Some functionality regarding the transitionend 
		 *       event still resides in the "module.js" file!
		 * @TODO: Cache the result somehow...
		 * @returns {String}
		 */
		_transitionend: function() {
			var t, el = document.createElement('div');
			var transitions = {
				'transition': 'transitionend',
				'WebkitTransition': 'webkitTransitionEnd'
			};
			for (t in transitions) {
				if (el.style[t] !== undefined) {
					return transitions[t];
				}
			}
		}

	});

}(
	gui.Combo.chained,
	gui.Array,
	gui.DOMPlugin,
	gui.Interface,
	gui.Type
));



/**
 * Interface EventHandler.
 *
 */
gui.IEventHandler = {

	/**
	 * Identification.
	 * @returns {String}
	 */
	toString: function() {
		return "[object IEventHandler]";
	},

	/**
	 * Native DOM interface. We'll forward the event to the method `onevent`.
	 * @see http://www.w3.org/TR/DOM-Level-3-Events/#interface-EventListener
	 * @param {Event} e
	 */
	handleEvent: function(e) {},

	/**
	 * Conforms to other Spiritual event handlers.
	 * @param {Event} e
	 */
	onevent: function(e) {}
};



/**
 * Transformation time!
 * @TODO: transform more
 * @TODO: support non-px units
 */
gui.SpritePlugin = gui.Plugin.extend({

	/**
	 * X position.
	 * @type {number}
	 */
	x: {
		getter: function() {
			return this._pos.x;
		},
		setter: function(x) {
			this._pos.x = x;
			this._apply();
		}
	},

	/**
	 * Y position.
	 * @type {number}
	 */
	y: {
		getter: function() {
			return this._pos.y;
		},
		setter: function(y) {
			this._pos.y = y;
			this._apply();
		}
	},

	/**
	 * Z position.
	 * @type {number}
	 */
	z: {
		getter: function() {
			return this._pos.z;
		},
		setter: function(z) {
			this._pos.z = z;
			this._apply();
		}
	},

	/**
	 * Construction time.
	 */
	onconstruct: function() {
		gui.Plugin.prototype.onconstruct.call(this);
		this._pos = new gui.Position();
	},

	/**
	 * Reset transformations.
	 */
	reset: function() {
		if (true || gui.Client.has3D) {
			this.spirit.css.set("-beta-transform", "");
		} else {
			this.spirit.css.left = "";
			this.spirit.css.top = "";
		}
	},


	// Private ...............................................

	/**
	 * Position tracking.
	 * @type {gui.Position}
	 */
	_pos: null,

	/**
	 * Go ahead.
	 */
	_apply: function() {
		var pos = this._pos;
		var set = [pos.x, pos.y, pos.z].map(Math.round);
		if (true || gui.Client.has3D) {
			this.spirit.css.set("-beta-transform",
				"translate3d(" + set.join("px,") + "px)"
			);
		} else {
			this.spirit.css.left = set [0];
			this.spirit.css.top = set [1];
		}
	}

});



/**
 * Base constructor for all spirits.
 * TODO: Implement `dispose` method.
 */
gui.Spirit = gui.Class.create(Object.prototype, {

	/**
	 * Spirit element.
	 * @type {Element}
	 */
	element: null,

	/**
	 * Containing document (don't use).
	 * @deprecated
	 * @type {Document}
	 */
	document: document,

	/**
	 * Containing window (don't use).
	 * @deprecated
	 * @type {Window}
	 */
	window: window,

	/**
	 * Identification.
	 * @returns {String}
	 */
	toString: function() {
		return "[object gui.Spirit]";
	},

	/**
	 * Exorcise spirit from element. 
	 * TODO: This whole thing with 'dispose' for all {gui.Class} things
	 */
	exorcise: function() {
		if (!this.life.destructed) {
			gui.Spirit.$destruct(this); // API user should cleanup here
			gui.Spirit.$dispose(this); // everything is destroyed here
		}
	},


	// Sync lifecycle ............................................................

	/**
	 * You can safely overload or overwrite methods in the lifecycle section,
	 * but you should always leave it to the {gui.Guide} to invoke them. 
	 * Make sure to always call `this.super.method()` unless you really mean it.
	 */

	/**
	 * `onconstruct` gets called when the spirit is newed up. Spirit
	 * element may not be positioned in the document DOM at this point.
	 */
	onconstruct: function() {},

	/**
	 * `onconfigure` gets callend immediately after construction. This
	 * instructs the spirit to parse configuration attributes in markup.
	 * TODO: Rename to `onconfig`
	 * @see {gui.ConfigPlugin}
	 */
	onconfigure: function() {},

	/**
	 * `onenter` gets called when the spirit element is first 
	 * encounted in the page DOM. This is only called once in 
	 * the lifecycle of a spirit (unlike `attach`, see below).
	 */
	onenter: function() {},

	/**
	 * `onattach` gets called whenever
	 *
	 * 1. The spirit element is attached to the document DOM by some guy
	 * 2. The element is already in DOM when the page loads and the spirit 
	 *    gets injected by the framework
	 */
	onattach: function() {},

	/**
	 * `onready` gets called (only once) when all descendant spirits 
	 * are attached and ready. From a DOM tree perspective, this fires 
	 * in reverse order, innermost first.
	 */
	onready: function() {},

	/**
	 * Experimental and not even supported.
	 */
	oninit: function() {},

	/**
	 * `ondetach` gets callend whenever the spirit element is about to 
	 * be detached from the DOM tree. Unless the element is appended 
	 * somewhere else, this will schedule the spirit for destruction.
	 */
	ondetach: function() {},

	/**
	 * `onexit` gets called if the spirit element has been *manually* detached 
	 * and not re-attached in the same execution stack. Spirit is not positioned 
	 * in the document DOM at this point.
	 */
	onexit: function() {},

	/**
	 * Invoked when spirit is about to be destroyed. Code your last wishes here.
	 * Spirit element may not be positioned in the document DOM at this point.
	 * @TODO: This method currently is NOT CALLED during window.unload, in
	 * that case we skip directly to {gui.GreatSpirit}. Would be nice if the
	 * spirit could eg. save stuff to localstorage at this point...
	 */
	ondestruct: function() {},


	// Async lifecycle ...........................................................

	/**
	 * Invoked some milliseconds after `onattach` to give the browser a repaint 
	 * break. TODO: Should be evaluated after 'appendChild' to another position.
	 */
	onasync: function() {},


	// Handlers ..................................................................

	/**	
	 * Handle crawler (tell me more)
	 * @param {gui.Crawler} crawler
	 * @returns {number}
	 */
	oncrawler: function(crawler) {},


	// Layout ....................................................................

	/**
	 * Experimental.
	 *
	onflex: function() {},

	/**
	 * Experimental.
	 *
	reflex: function() {
		gui.Spirit.$reflex(this);	
	},
	*/


	// Privileged ................................................................

	/**
	 * Unique key for this spirit instance.
	 * @TODO: Uppercase to imply read-only.
	 * @type {String}
	 */
	$instanceid: null,

	/**
	 * Matches the property `$contextid` of the local `gui` object.
	 * TODO: rename this property
	 * TODO: perhapse deprecate?
	 * TODO: really just deprecate!
	 * @type {String}
	 */
	$contextid: null,

	/**
	 * Don't try anything funny.
	 * @type {boolean}
	 */
	$destructed: false,

	/**
	 * Secret constructor invoked before `onconstruct`.
	 * @param {Element} elm
	 */
	$onconstruct: function(elm) {
		this.$contextid = gui.$contextid;
		this.element = elm;
		this.document = document; // TODO: deprecate
		this.window = window; // TODO: deprecate
		gui.Spirit.$construct(this);
	},

	/**
	 * Secret destructor invvoked after `ondestruct`.
	 */
	$ondestruct: function() {},

	/**
	 * Plug in the plugins. Lazy plugins will be newed up when needed.
	 *
	 * - {gui.LifePlugin} first
	 * - {gui.ConfigPlugin} second
	 * - bonus plugins galore
	 *
	 * @TODO: To preserve order, refactor plugins stack from object to array
	 */
	$pluginplugins: function() {
		var Plugin, plugins = this.constructor.$plugins;
		this.life = new gui.LifePlugin(this);
		this.config = new gui.ConfigPlugin(this);
		Object.keys(plugins).filter(function(prefix) {
			return prefix !== "life" && prefix !== "config";
		}).sort().forEach(function(prefix) {
			Plugin = plugins[prefix];
			if ((this.life.plugins[prefix] = !Plugin.lazy)) {
				gui.Plugin.$assign(this, prefix, new Plugin(this));
			} else {
				gui.Plugin.$prepare(this, prefix, Plugin);
			}
		}, this);
	},

	/**
	 * In debug mode, stamp the spirit constructor name onto the spirit element.
	 * Square brackets indicate that the `gui` attribute was added by this method.
	 * @param {boolean} constructing
	 */
	$debug: function(constructing) {
		if (gui.debug) {
			var val, elm = this.element;
			var fix = gui.attributes[0]; // by default using `gui`
			if (constructing) {
				if (gui.attributes.every(function(f) {
					return !elm.hasAttribute(f);
				})) {
					val = "[" + this.constructor.$classname + "]";
					elm.setAttribute(fix, val);
				}
			} else {
				val = elm.getAttribute(fix);
				if (val && val.startsWith("[")) {
					elm.removeAttribute(fix);
				}
			}
		}
	}


}, { // Xstatic (copied onto subclass constructors) ............................

	/**
	 * Portal spirit into iframes via the `gui.portal` method?
	 * @see {ui#portal}
	 * @type {boolean}
	 */
	portals: true,

	/**
	 * Create DOM element and associate gui.Spirit instance.
	 * @param @optional {Document} doc
	 * @returns {gui.Spirit}
	 */
	summon: function(doc) {
		return this.possess((doc || document).createElement("div"));
	},

	/**
	 * Associate gui.Spirit instance to DOM element.
	 * @param {Element} element
	 * @returns {gui.Spirit}
	 */
	possess: function(element) {
		return gui.Guide.$possess(element, this);
	},

	/**
	 * Extend with plugins.
	 * @TODO: move all this to {gui.Class}
	 * @TODO: validate that user isn't declaring non-primitives on the prototype 
	 * @param {object} extension
	 * @param {object} recurring
	 * @param {object} statics
	 * @returns {gui.Spirit}
	 */
	extend: function() {
		var C = gui.Class.extend.apply(this, arguments);
		C.$plugins = gui.Object.copy(this.$plugins);
		return C;
	},

	/**
	 * Assign plugin to prefix, checking for naming collision. Prepared for
	 * a scenario where spirits may have been declared before plugins load.
	 * TODO: Stamp the plugin on the prototype instead, if at all possible.
	 * @param {String} prefix "att", "dom", "action", "event" etc
	 * @param {function} plugin Constructor for plugin
	 * @param @optional {boolean} override Disable collision detection
	 * @returns {ts.gui.Spirit}
	 */
	plugin: function(prefix, plugin, override) {
		var plugins = this.$plugins;
		var proto = this.prototype;
		if (!proto.hasOwnProperty(prefix) || proto.prefix === null || override) {
			if (!plugins[prefix] || override) {
				plugins[prefix] = plugin;
				proto.prefix = null;
				gui.Class.children(this, function(child) {
					child.plugin(prefix, plugin, override); // recursing to descendants
				});
			}
		} else {
			console.error("Plugin naming crash in " + this + ": " + prefix);
		}
		return this;
	},


	// Privileged ................................................................

	/**
	 * Mapping plugin prefix to plugin constructor.
	 * @type {Map<String,function>}
	 */
	$plugins: Object.create(null)


}, { // Static privileged ......................................................

	/**
	 * Spirit construct gets called by the secret constructor `$onconstruct`.
	 * @param {gui.Spirit} spirit
	 */
	$construct: function(spirit) {
		spirit.$pluginplugins();
		spirit.$debug(true);
		spirit.life.constructed = true;
		spirit.onconstruct();
		spirit.life.dispatch(gui.LIFE_CONSTRUCT);
	},

	/**
	 * Spirit configure.
	 * @param {gui.Spirit} spirit
	 */
	$configure: function(spirit) {
		spirit.config.configureall();
		spirit.life.configured = true;
		spirit.onconfigure();
		spirit.life.dispatch(gui.LIFE_CONFIGURE);
	},

	/**
	 * Spirit enter.
	 * @param {gui.Spirit} spirit
	 */
	$enter: function(spirit) {
		gui.Guide.$inside(spirit);
		spirit.life.entered = true;
		spirit.onenter();
		spirit.life.dispatch(gui.LIFE_ENTER);
	},

	/**
	 * Spirit attach.
	 * @param {gui.Spirit} spirit
	 */
	$attach: function(spirit) {
		gui.Guide.$inside(spirit);
		spirit.life.attached = true;
		spirit.onattach();
		spirit.life.dispatch(gui.LIFE_ATTACH);
	},

	/**
	 * Spirit ready.
	 * @param {gui.Spirit} spirit
	 */
	$ready: function(spirit) {
		spirit.life.ready = true;
		spirit.onready();
		spirit.life.dispatch(gui.LIFE_READY);
	},

	/**
	 * Spirit detach.
	 * @param {gui.Spirit} spirit
	 */
	$detach: function(spirit) {
		gui.Guide.$outside(spirit);
		spirit.life.detached = true;
		spirit.life.visible = false;
		spirit.life.dispatch(gui.LIFE_DETACH);
		spirit.life.dispatch(gui.LIFE_INVISIBLE);
		spirit.ondetach();
	},

	/**
	 * Spirit exit.
	 * @param {gui.Spirit} spirit
	 */
	$exit: function(spirit) {
		spirit.life.exited = true;
		spirit.life.dispatch(gui.LIFE_EXIT);
		spirit.onexit();
	},

	/**
	 * Spirit async.
	 * @TODO: This should be evaluated after `appendChild` to another position.
	 * @param {gui.Spirit} spirit
	 */
	$async: function(spirit) {
		spirit.life.async = true;
		spirit.onasync(); // TODO: life cycle stuff goes here
		spirit.life.dispatch(gui.LIFE_ASYNC);
	},

	/**
	 * Spirit destruct.
	 * @param {gui.Spirit} spirit
	 */
	$destruct: function(spirit) {
		spirit.$debug(false);
		spirit.life.destructed = true;
		spirit.life.dispatch(gui.LIFE_DESTRUCT);
		spirit.ondestruct();
	},

	/**
	 * Spirit dispose. This calls the secret destructor `$ondestruct`.
	 * @see {gui.Spirit#$ondestruct}
	 * @param {gui.Spirit} spirit
	 */
	$dispose: function(spirit) {
		spirit.$ondestruct();
		spirit.$destructed = true;
		gui.Guide.$forget(spirit);
		gui.Garbage.$collect(spirit);
	},

	/**
	 * TODO: Init that spirit (work in progress)
	 * TODO: wait and done methods to support this
	 * @param {gui.Spirit} spirit
	 */
	$oninit: function(spirit) {
		spirit.life.initialized = true;
		spirit.life.dispatch("life-initialized");
		spirit.oninit();
	},

	/**
	 * Reflex.
	 * @param {gui.Spirit} source
	 */
	$reflex: function(source) {
		new gui.Crawler(gui.CRAWLER_REFLEX).descend(source, {
			handleSpirit: function(spirit) {
				spirit.reflex();
			}
		})
	}

});



/**
 * Spirit of the HTML element.
 * @extends {gui.Spirit}
 */
gui.DocumentSpirit = gui.Spirit.extend({

	/**
	 * Get ready.
	 * TODO: think more about late loading (module loading) scenario
	 * TODO: let's go _waiting only if parent is a Spiritual document
	 */
	onready: function() {
		gui.Spirit.prototype.onready.call(this);
		if ((this.waiting = gui.hosted)) {
			this.action.addGlobal(gui.$ACTION_XFRAME_VISIBILITY);
		}
		this.action.dispatchGlobal(gui.ACTION_DOC_ONSPIRITUALIZED);
		this.broadcast.addGlobal(gui.BROADCAST_RESIZE_END);
	},

	/**
	 * Handle action.
	 * TODO: Completely remove this xframe visibility stuff!
	 * @param {gui.Action} a
	 */
	onaction: function(a) {
		gui.Spirit.prototype.onaction.call(this, a);
		this.action.$handleownaction = false;
		switch (a.type) {
			case gui.$ACTION_XFRAME_VISIBILITY:
				this._waiting = false;
				if (gui.hasModule("gui-layout@wunderbyte.com")) { // TODO: - fix
					if (a.data === true) {
						this.visibility.on();
					} else {
						this.visibility.off();
					}
				}
				a.consume();
				break;
		}
	},

	/**
	 * Handle broadcast.
	 * @param {gui.Broadcast} b
	 */
	onbroadcast: function(b) {
		gui.Spirit.prototype.onbroadcast.call(this, b);
		if(b.type === gui.BROADCAST_RESIZE_END) {
			//this.reflex();
		}
	},

	/**
	 * Don't crawl for visibility inside iframed documents until
	 * hosting {gui.IframeSpirit} has reported visibility status.
	 * @param {gui.Crawler} crawler
	 */
	oncrawler: function(crawler) {
		var dir = gui.Spirit.prototype.oncrawler.call(this, crawler);
		if (dir === gui.Crawler.CONTINUE) {
			switch (crawler.type) {
				case gui.CRAWLER_VISIBLE:
				case gui.CRAWLER_INVISIBLE:
					if (this._waiting) {
						dir = gui.Crawler.STOP;
					}
					break;
			}
		}
		return dir;
	},

	/**
	 * Relay visibility from ancestor frame (match iframe visibility).
	 */
	onvisible: function() {
		this.css.remove(gui.CLASS_INVISIBLE);
		gui.Spirit.prototype.onvisible.call(this);
	},

	/**
	 * Relay visibility from ancestor frame (match iframe visibility).
	 */
	oninvisible: function() {
		this.css.add(gui.CLASS_INVISIBLE);
		gui.Spirit.prototype.oninvisible.call(this);
	},


	// Private ...................................................................

	/**
	 * Flipped on window.onload
	 * @type {boolean}
	 */
	_loaded: false,

	/**
	 * Waiting for hosting {gui.IframeSpirit} to relay visibility status?
	 * @type {boolean}
	 */
	_waiting: false,
	
	/**
	 * Timeout before we broadcast window resize ended.
	 * This timeout cancels itself on each resize event.
	 * @type {number}
	 */
	_timeout: null

});



/**
 * Spirit of the iframe.
 * @extends {gui.Spirit}
 */
gui.IframeSpirit = gui.Spirit.extend({

	/**
	 * Flipped when the *hosted* document is loaded and spiritualized.
	 * @type {boolean}
	 */
	spiritualized: false,

	/**
	 * Fit height to contained document height (seamless style)?
	 * @type {boolean}
	 */
	fit: false,

	/**
	 * Cross domain origin of hosted document (if that's the case).
	 * @type {String} `http://iframehost.com:8888`
	 */
	xguest: null,

	/**
	 * Hosted window.
	 * @type {Window}
	 */
	contentWindow: {
		getter: function() {
			return this.element.contentWindow;
		}
	},

	/**
	 * Hosted document.
	 * @type {Document}
	 */
	contentDocument: {
		getter: function() {
			return this.element.contentDocument;
		}
	},

	/**
	 * URL details for hosted document.
	 * @type {gui.URL}
	 */
	contentLocation: null,

	/**
	 * Construction time.
	 */
	onconstruct: function() {
		gui.Spirit.prototype.onconstruct.call(this);
		this.event.add("message", window);
		this._postbox = [];
	},

	/**
	 * Stamp SRC on startup.
	 * Configure content document events in order of
	 * appearance and resolve current contentLocation.
	 */
	onenter: function() {
		gui.Spirit.prototype.onenter.call(this);
		this.event.add('load');
		this.action.addGlobal([ // in order of appearance
			gui.ACTION_DOC_ONDOMCONTENT,
			gui.ACTION_DOC_ONLOAD,
			gui.ACTION_DOC_ONHASH,
			gui.ACTION_DOC_ONSPIRITUALIZED,
			gui.ACTION_DOC_UNLOAD
		]);
		if (this.fit) {
			this.css.height = 0;
		}
		var src = this.element.src;
		if (src && src !== gui.IframeSpirit.SRC_DEFAULT) {
			if (!src.startsWith("blob:")) { // wrong...
				this._setupsrc(src);
			}
		}
	},


	/**
	 * Handle action.
	 * @param {gui.Action} a
	 */
	onaction: function(a) {
		gui.Spirit.prototype.onaction.call(this, a);
		this.action.$handleownaction = false;
		var base;
		switch (a.type) {
			case gui.ACTION_DOC_ONDOMCONTENT:
				this.contentLocation = new gui.URL(document, a.data);
				this.life.dispatch(gui.LIFE_IFRAME_DOMCONTENT);
				this.action.remove(a.type);
				a.consume();
				break;
			case gui.ACTION_DOC_ONLOAD:
				this.contentLocation = new gui.URL(document, a.data);
				this.life.dispatch(gui.LIFE_IFRAME_ONLOAD);
				this.action.remove(a.type);
				a.consume();
				break;
			case gui.ACTION_DOC_ONHASH:
				base = this.contentLocation.href.split("#")[0];
				this.contentLocation = new gui.URL(document, base + a.data);
				this.life.dispatch(gui.LIFE_IFRAME_ONHASH);
				a.consume();
				break;
			case gui.ACTION_DOC_ONSPIRITUALIZED:
				this._onspiritualized();
				this.life.dispatch(gui.LIFE_IFRAME_SPIRITUALIZED);
				this.action.remove(a.type);
				a.consume();
				break;
			case gui.ACTION_DOC_UNLOAD:
				this._onunload();
				this.life.dispatch(gui.LIFE_IFRAME_UNLOAD);
				this.action.add([
					gui.ACTION_DOC_ONCONSTRUCT,
					gui.ACTION_DOC_ONDOMCONTENT,
					gui.ACTION_DOC_ONLOAD,
					gui.ACTION_DOC_ONSPIRITUALIZED
				]);
				a.consume();
				break;
		}
	},

	/**
	 * Handle event.
	 * @param {Event} e
	 */
	onevent: function(e) {
		gui.Spirit.prototype.onevent.call(this, e);
		switch (e.type) {
			case 'message':
				this._onmessage(e.data, e.origin, e.source);
				break;
			case 'load':
				// now what?
				break;
		}
	},

	/**
	 * Status visible.
	 */
	onvisible: function() {
		gui.Spirit.prototype.onvisible.call(this);
		if (this.spiritualized) {
			this._visibility();
		}
	},

	/*
	 * Status invisible.
	 */
	oninvisible: function() {
		gui.Spirit.prototype.oninvisible.call(this);
		if (this.spiritualized) {
			this._visibility();
		}
	},

	/**
	 * Get and set the iframe source. Set in markup using <iframe gui.src="x"/>
	 * if you need to postpone iframe loading until the spirit gets initialized.
	 * @param @optional {String} src
	 * @returns @optional {String} src
	 */
	src: function(src) {
		if (src) {
			this._setupsrc(src);
			this.element.src = src;
		}
		return this.element.src;
	},

	/**
	 * Experimentally load some kind of blob.
	 * @param @optional {URL} url
	 * @param @optional {String} src
	 */
	url: function(url, src) {
		if (src) {
			this._setupsrc(src);
		}
		if (url) {
			this.element.src = url;
		}
		return this.contentLocation.href;
	},

	/**
	 * Post message to content window. This method assumes
	 * that we are messaging Spiritual components and will
	 * buffer the messages for bulk dispatch once Spiritual
	 * is known to run inside the iframe.
	 * @param {String} msg
	 */
	postMessage: function(msg) {
		if (this.spiritualized) {
			this.contentWindow.postMessage(msg, "*");
		} else {
			this._postbox.push(msg);
		}
	},


	// Private ...................................................................

	/**
	 * @param {String} src
	 */
	_setupsrc: function(src) {
		var doc = document;
		this.contentLocation = new gui.URL(doc, src);
		this.xguest = (function(secured) {
			if (secured) {
				return "*";
			} else if (gui.URL.external(src, doc)) {
				var url = new gui.URL(doc, src);
				return url.protocol + "//" + url.host;
			}
			return null;
		}(this._sandboxed()));
	},

	/**
	 * Hosted document spiritualized.
	 * Dispatching buffered messages.
	 */
	_onspiritualized: function() {
		this.spiritualized = true;
		while (this._postbox.length) {
			this.postMessage(this._postbox.shift());
		}
		this._visibility();
	},

	/**
	 * Hosted document changed size. Resize to fit?
	 * Dispatching an action to {gui.DocumentSpirit}
	 * @param {number} height
	 */
	_onfit: function(height) {
		if (this.fit) {
			this.css.height = height;
			this.action.dispatchGlobal(gui.ACTION_DOC_FIT);
		}
	},

	/**
	 * Hosted document unloading.
	 */
	_onunload: function() {
		this.spiritualized = false;
		if (this.fit) {
			this.css.height = 0;
		}
	},

	/**
	 * Handle posted message, scanning for ascending actions.
	 * Descending actions are handled by the documentspirit.
	 * TODO: Don't claim this as action target!
	 * @see {gui.DocumentSpirit._onmessage}
	 * @param {String} msg
	 */
	_onmessage: function(msg, origin, source) {
		if (source === this.contentWindow) {
			if (msg.startsWith("spiritual-action:")) {
				var a = gui.Action.parse(msg);
				if (a.direction === gui.Action.ASCEND) {
					this.action.$handleownaction = true;
					this.action.ascendGlobal(a.type, a.data);
				}
			}
		}
	},

	/**
	 * Iframe is sandboxed? Returns `true` even for "allow-same-origin" setting.
	 * @returns {boolean}
	 */
	_sandboxed: function() {
		var sandbox = this.element.sandbox;
		return sandbox && sandbox.length; // && !sandbox.includes ( "allow-same-origin" );
	},

	/**
	 * Teleport visibility crawler to hosted document.
	 * Action intercepted by the {gui.DocumentSpirit}.
	 */
	_visibility: function() {
		if (gui.hasModule("gui-layout@wunderbyte.com")) { // TODO: - fix
			if (gui.Type.isDefined(this.life.visible)) {
				this.action.descendGlobal(
					gui.$ACTION_XFRAME_VISIBILITY,
					this.life.visible
				);
			}
		}
	}


}, { // Recurring static .......................................................

	/**
	 * Summon spirit.
	 * TODO: why does spirit.src method fail strangely 
	 *       just now? using iframe.src instead...
	 * @param {Document} doc
	 * @param @optional {String} src
	 * @returns {gui.IframeSpirit}
	 */
	summon: function(doc, src) {
		var iframe = doc.createElement("iframe");
		var spirit = this.possess(iframe);
		spirit.css.add("gui-iframe");
		/*
		 * TODO: should be moved to src() method (but fails)!!!!!
		 */
		if (src) {
			if (gui.URL.external(src, doc)) {
				var url = new gui.URL(doc, src);
				spirit.xguest = url.protocol + "//" + url.host;
				//src = this.sign ( src, doc, spirit.$instanceid );
			}
		} else {
			src = this.SRC_DEFAULT;
		}
		iframe.src = src;
		return spirit;
	}


}, { // Static .................................................................

	/**
	 * Presumably harmless iframe source. The issue here is that "about:blank"
	 * may raise security concerns for some browsers when running HTTPS setup.
	 * @type {String}
	 */
	SRC_DEFAULT: "javascript:void(false);"

});



/**
 * Something that has position.
 * @param {number} x
 * @param {number} y
 * @param {number} z
 */
gui.Position = function(x, y, z) {
	this.x = x || 0;
	this.y = y || 0;
	this.z = z || 0;
};

gui.Position.prototype = {

	/**
	 * X position.
	 * @type {number}
	 */
	x: 0,

	/**
	 * Y position.
	 * @type {number}
	 */
	y: 0,

	/**
	 * Z position.
	 * @type {number}
	 */
	z: 0,

	/**
	 * Identification.
	 * @returns {String}
	 */
	toString: function() {
		return "[object gui.Position]";
	},

	/**
	 * Clone position.
	 * @returns {gui.Position}
	 */
	clone: function() {
		return new gui.Position(this.x, this.y, this.z);
	}
};


// Static ......................................................................

/**
 * Compare two positions.
 * @param {gui.Position} p1
 * @param {gui.Position} p2
 * @return {boolean}
 */
gui.Position.isEqual = function(p1, p2) {
	return (p1.x === p2.x) && (p1.y === p2.y);
};



/**
 * Something that has 2D width and height.
 * @param {number} w
 * @param {number} h
 */
gui.Dimension = function(w, h) {
	this.w = w || 0;
	this.h = h || 0;
};

gui.Dimension.prototype = {

	/**
	 * Width.
	 * @type {number}
	 */
	w: 0,

	/**
	 * Height.
	 * @type {number}
	 */
	h: 0,

	/**
	 * Identification.
	 * @returns {String}
	 */
	toString: function() {
		return "[object gui.Dimension]";
	}
};


// Static ......................................................................

/**
 * Compare two dimensions.
 * @param {gui.Dimension} dim1
 * @param {gui.Dimension} dim2
 * @return {boolean}
 */
gui.Dimension.isEqual = function(dim1, dim2) {
	return (dim1.w === dim2.w) && (dim1.h === dim2.h);
};



/**
 * Something that has 2D position and width and height.
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 */
gui.Geometry = function(x, y, w, h) {
	this.x = x || 0;
	this.y = y || 0;
	this.w = w || 0;
	this.h = h || 0;
};

gui.Geometry.prototype = {

	/**
	 * X position.
	 * @type {number}
	 */
	x: 0,

	/**
	 * Y position.
	 * @type {number}
	 */
	y: 0,

	/**
	 * Width.
	 * @type {number}
	 */
	w: 0,

	/**
	 * Height.
	 * @type {number}
	 */
	h: 0,

	/**
	 * Identification.
	 * @returns {String}
	 */
	toString: function() {
		return "[object gui.Geometry]";
	},

	/**
	 * Intersects another (2D) geometry?
	 * @param {gui.Geometry} geo
	 */
	hitTest: function(geo) {
		return gui.Geometry.hitTest(this, geo);
	}
};


// Static ......................................................................

/**
 * Compare two geometries.
 * @param {gui.Geometry} geo1
 * @param {gui.Geometry} geo2
 * @returns {boolean}
 */
gui.Geometry.isEqual = function(geo1, geo2) {
	return (
		(geo1.x === geo2.x) &&
		(geo1.y === geo2.y) &&
		(geo1.w === geo2.w) &&
		(geo1.h === geo2.h)
	);
};

/**
 * Hittest two geometries.
 * @param {gui.Geometry} geo1
 * @param {gui.Geometry} geo2
 * @returns {boolean}
 */
gui.Geometry.hitTest = function(geo1, geo2) {
	function x(g1, g2) {
		return g1.x >= g2.x && g1.x <= g2.x + g2.w;
	}

	function y(g1, g2) {
		return g1.y >= g2.y && g1.y <= g2.y + g2.h;
	}
	var hitx = x(geo1, geo2) || x(geo2, geo1);
	var hity = y(geo1, geo2) || y(geo2, geo1);
	return hitx && hity;
};



/**
 * Spiritualizing documents by overloading DOM methods.
 */
gui.DOMChanger = {

	/**
	 * Declare `spirit` as a fundamental property of things.
	 * @param {Window} win
	 */
	init: function() {
		var proto = Element.prototype;
		if (gui.Type.isDefined(proto.spirit)) {
			throw new Error("Spiritual loaded twice?");
		} else {
			proto.spirit = null; // defineProperty fails in iOS5
		}
	},

	/**
	 * Extend native DOM methods in given window scope. 
	 * Wonder what happens now with SVG in Explorer?
	 */
	change: function() {
		var Elm = gui.Client.isExplorer ? HTMLElement : Element;
		this._change(Elm.prototype, gui.DOMCombos);
	},


	// Private ...................................................................

	/**
	 * Overloading prototype methods and properties.
	 * @param {object} proto
	 * @param {Window} win
	 * @param {Map<String,function} combos
	 */
	_change: function(proto, combos) {
		var root = document.documentElement;
		gui.Object.each(combos, function(name, combo) {
			this._docombo(proto, name, combo, root);
		}, this);
	},

	/**
	 * Overload methods and setters (although not in WebKit).
	 * @see http://code.google.com/p/chromium/issues/detail?id=13175
	 * @param {object} proto
	 * @param {String} name
	 * @param {function} combo
	 * @param {Element} root
	 */
	_docombo: function(proto, name, combo, root) {
		if (this._ismethod(name)) {
			this._domethod(proto, name, combo);
		} else {
			if (gui.Client.isGecko) {
				this._dogeckoaccessor(proto, name, combo, root);
			} else if (gui.Client.isExplorer) {
				this._doieaccessor(proto, name, combo);
			} else {
				// WebKit/Safari/Blink relies on the {gui.DOMObserver}
			}
		}
	},

	/**
	 * Is method? (non-crashing Firefox version)
	 * @returns {boolean}
	 */
	_ismethod: function(name) {
		var is = false;
		switch (name) {
			case "appendChild":
			case "removeChild":
			case "insertBefore":
			case "replaceChild":
			case "setAttribute":
			case "removeAttribute":
			case "insertAdjecantHTML":
				is = true;
				break;
		}
		return is;
	},

	/**
	 * Overload DOM method (same for all browsers).
	 * @param {object} proto
	 * @param {String} name
	 * @param {function} combo
	 */
	_domethod: function(proto, name, combo) {
		var base = proto[name];
		proto[name] = combo(function() {
			return base.apply(this, arguments);
		});
	},

	/**
	 * Overload property setter for IE.
	 * TODO: Doesn't work for 'textContent' (should materialize spirits)
	 * @param {object} proto
	 * @param {String} name
	 * @param {function} combo
	 * @param {Element} root
	 */
	_doieaccessor: function(proto, name, combo) {
		var base = Object.getOwnPropertyDescriptor(proto, name);
		if(base) {
			Object.defineProperty(proto, name, {
				enumerable: true,
				configurable: true,
				get: function() {
					return base.get.call(this);
				},
				set: combo(function(value) {
					base.set.call(this, value);
				})
			});
		}
	},

	/**
	 * Overload property setter for Firefox.
	 * @param {object} proto
	 * @param {String} name
	 * @param {function} combo
	 * @param {Element} root
	 */
	_dogeckoaccessor: function(proto, name, combo, root) {
		var getter = root.__lookupGetter__(name);
		var setter = root.__lookupSetter__(name);
		if (getter) { // firefox 20 needs a getter for this to work
			proto.__defineGetter__(name, function() {
				return getter.apply(this, arguments);
			});
			proto.__defineSetter__(name, combo(function() {
				setter.apply(this, arguments);
			}));
		}
	}
};



/**
 * DOM decoration time.
 * TODO: Standard DOM exceptions (at our level) for missing arguments and so on.
 * TODO: insertAdjecantHTML
 * TODO: DOM4 methods
 * @using {gui.Combo.before} before
 * @using {gui.Combo.after} after
 * @using {gui.Combo.around} around
 * @using {gui.Combo.provided} provided
 */
gui.DOMCombos = (function using(
	before,
	after,
	around,
	provided,
	Type,
	DOMPlugin,
	DOMObserver,
	guiArray
	// gui.Guide - Can't be imported because of order
	// gui.spiritualize
	// gui.materialize
) {

	/**
	 * Is `this` embedded in document?
	 * @returns {boolean}
	 */
	var ifEmbedded = provided(function() {
		return DOMPlugin.embedded(this);
	});

	/**
	 * Element has spirit?
	 * @returns {boolean}
	 */
	var ifSpirit = provided(function() {
		var spirit = gui.get(this);
		return spirit && !spirit.$destructed;
	});

	/**
	 * Spiritualize node plus subtree.
	 * @param {Node} node
	 */
	var spiritualizeAfter = around(function(action, node) {
		var contents;
		if (Type.isDocumentFragment(node)) {
			contents = guiArray.from(node.childNodes);
		}
		action();
		if (Type.isDocumentFragment(node)) {
			for (var i = 0, len = contents.length; i < len; i++) {
				gui.spiritualize(contents[i]);
			}
		} else {
			gui.spiritualize(node); // TODO: Simply support NodeList and DocFrag here.
		}
	});

	/**
	 * Materialize old node plus subtree
	 * TODO: perhaps just detach oldnode instead???
	 * @param {Node} newnode
	 * @param {Node} oldnode
	 */
	var materializeOldBefore = before(function(newnode, oldnode) {
		gui.materialize(oldnode);
	});

	/**
	 * Detach node plus subtree.
	 * @param {Node} node
	 */
	var detachBefore = before(function(node) {
		gui.Guide.$detach(node); // TODO: not like this
	});

	/**
	 * Spirit-aware setattribute.
	 * @param {string} name
	 * @param {string} value
	 */
	var setAttBefore = before(function(name, value) {
		this.spirit.att.set(name, value);
	});

	/**
	 * Spirit-aware removeattribute.
	 * TODO: use the post combo?
	 * @param {string} name
	 */
	var delAttBefore = before(function(name) {
		this.spirit.att.del(name);
	});

	/**
	 * Disable DOM mutation observers while doing action.
	 * @param {function} action
	 */
	var suspending = around(function(action) {
		if (gui.DOMObserver.observes) {
			return gui.DOMObserver.suspend(function() {
				return action();
			});
		} else {
			return action();
		}
	});

	/**
	 * Materialize subtree of `this`.
	 */
	var materializeSubBefore = before(function() {
		gui.materializeSub(this);
	});

	/**
	 * Spiritualize subtree of `this`
	 */
	var spiritualizeSubAfter = after(function() {
		gui.spiritualizeSub(this);
	});

	/**
	 * Detach `this`.
	 */
	var parent = null; // TODO: unref this at some point
	var materializeThisBefore = before(function() {
		parent = this.parentNode;
		gui.materialize(this);
	});

	/**
	 * Attach parent.
	 */
	var spiritualizeParentAfter = after(function() {
		gui.spiritualize(parent);
	});

	/**
	 * Spiritualize adjecant.
	 * @param {string} position
	 *     beforebegin: Before the element itself
	 *     afterbegin: Just inside the element, before its first child
	 *     beforeend: Just inside the element, after its last child
	 *     afterend: After the element itself
	 * @param {string} html
	 */
	var spiritualizeAdjecantAfter = after(function(position, html) {
		switch (position) {
			case 'beforebegin':
				console.warn('TODO: Spiritualize previous siblings');
				break;
			case 'afterbegin':
				console.warn('TODO: Spiritualize first children');
				break;
			case 'beforeend':
				console.warn('TODO: Spiritualize last children');
				break;
			case 'afterend':
				console.warn('TODO: Spiritualize following children');
				break;
		}
	});

	/**
	 * Pretend nothing happened when running in managed mode.
	 * TODO: Simply mirror this prop with an internal boolean
	 */
	var ifEnabled = provided(function() {
		var win = this.ownerDocument.defaultView;
		if (win) {
			return win.gui.mode !== gui.MODE_HUMAN;
		} else {
			return false; // abstract HTMLDocument might adopt DOM combos
		}
	});

	/**
	 * Not in funny mode?
	 * TODO: deprecate this whole funny business
	 */
	var ifSerious = provided(function() {
		var win = this.ownerDocument.defaultView;
		if (win) {
			return win.gui.mode !== gui.MODE_FUNNY;
		} else {
			return false; // abstract HTMLDocument might adopt DOM combos (keep this!)
		}
	});

	/**
	 * Sugar for combo readability.
	 * @param {function} action
	 * @returns {function}
	 */
	var otherwise = function(action) {
		return action;
	};


	return { // Public ...........................................................

		appendChild: function(base) {
			return (
				ifEnabled(
					ifSerious(
						ifEmbedded(spiritualizeAfter(suspending(base)),
							otherwise(base)),
						otherwise(base)),
					otherwise(base))
			);
		},
		insertBefore: function(base) {
			return (
				ifEnabled(
					ifSerious(
						ifEmbedded(spiritualizeAfter(suspending(base)),
							otherwise(base)),
						otherwise(base)),
					otherwise(base))
			);
		},
		replaceChild: function(base) { // TODO: detach instead
			return (
				ifEnabled(
					ifEmbedded(materializeOldBefore(
							ifSerious(
								spiritualizeAfter(suspending(base)),
								otherwise(suspending(base)))),
						otherwise(base)),
					otherwise(base))
			);
		},
		insertAdjecantHTML: function(base) {
			return (
				ifEnabled(
					ifEmbedded(
						ifSerious(
							spiritualizeAdjecantAfter(suspending(base)),
							otherwise(suspending(base)))),
					otherwise(base)),
				otherwise(base)
			);
		},
		removeChild: function(base) {
			return (
				ifEnabled(
					ifEmbedded(detachBefore(suspending(base)), // detachBefore suspended for flex hotfix!
						otherwise(base)),
					otherwise(base))
			);
		},
		setAttribute: function(base) {
			return (
				ifEnabled(
					ifEmbedded(
						ifSpirit(setAttBefore(base),
							otherwise(base)),
						otherwise(base)),
					otherwise(base))
			);
		},
		removeAttribute: function(base) {
			return (
				ifEnabled(
					ifEmbedded(
						ifSpirit(delAttBefore(base),
							otherwise(base)),
						otherwise(base)),
					otherwise(base))
			);
		},


		// Disabled pending http://code.google.com/p/chromium/issues/detail?id=13175

		innerHTML: function(base) {
			return (
				ifEnabled(
					ifEmbedded(materializeSubBefore(spiritualizeSubAfter(suspending(base))),
						otherwise(base)),
					otherwise(base))
			);
		},
		outerHTML: function(base) {
			return (
				ifEnabled(
					ifEmbedded(materializeThisBefore(spiritualizeParentAfter(suspending(base))),
						otherwise(base)),
					otherwise(base))
			);
		},
		textContent: function(base) {
			return (
				ifEnabled(
					ifEmbedded(materializeSubBefore(suspending(base)),
						otherwise(base)),
					otherwise(base))
			);
		}
	};

}(
	gui.Combo.before,
	gui.Combo.after,
	gui.Combo.around,
	gui.Combo.provided,
	gui.Type,
	gui.DOMPlugin,
	gui.DOMObserver,
	gui.Array
));



/**
 * Monitor document for unsolicitated DOM changes and spiritualize
 * elements accordingly. This patches a missing feature in
 * WebKit/Safari/Blink that blocks us from overriding native
 * DOM getters and setters (eg. innerHTML). Importantly note that
 * spirits will be attached and detached *asynchronously* with this. 
 *
 * TODO: If this was forced synchronous via DOMPlugin methods, we
 * may be crawling the DOM twice - let's make sure we don't do that.
 * @see http://code.google.com/p/chromium/issues/detail?id=13175
 */
gui.DOMObserver = {

	/**
	 * Enabled?
	 * @type {boolean}
	 */
	observes: false,

	/**
	 * Start observing. Note that this runs in WebKit only.
	 * @see {gui.Guide#_spiritualizeinitially}
	 */
	observe: function() {
		if (gui.Client.hasMutations) {
			if (!this._observer) {
				var Observer = this._mutationobserver();
				var MeMyself = gui.DOMObserver;
				this._observer = new Observer(function(mutations) {
					mutations.forEach(function(mutation) {
						MeMyself._handleMutation(mutation);
					});
				});
			}
			this._connect(true);
			this.observes = true;
		} else {
			throw new Error('MutationObserver no such thing');
		}
	},

	/**
	 * Suspend mutation monitoring of document; enable
	 * monitoring again after executing provided function.
	 * @param {Node} node
	 * @param @optional {function} action
	 * @param @optional {object} thisp
	 * @returns {object} if action was defined, we might return something
	 */
	suspend: function(action, thisp) {
		var res;
		if (this.observes) {
			if (++this._suspend === 1) {
				this._connect(false);
			}
		}
		if (gui.Type.isFunction(action)) {
			res = action.call(thisp);
		}
		if (this.observes) {
			this.resume();
		}
		return res;
	},

	/**
	 * Resume monitoring of mutations in document.
	 * @param {Node} node
	 */
	resume: function() {
		if (this.observes) {
			if (--this._suspend === 0) {
				this._connect(true);
			}
		}
	},


	// Private ...................................................................

	/**
	 * Is suspended? Minimize what overhead there might
	 * be on connecting and disconnecting the observer.
	 * @type {number} Counting stuff that suspends...
	 */
	_suspend: 0,

	/**
	 * MutationObserver.
	 * @type {MutationObserver}
	 */
	_observer: null,

	/**
	 * Get MutationObserver.
	 * (IE11 has this now!)
	 * @returns {constructor}
	 */
	_mutationobserver: function() {
		return (
			window.MutationObserver ||
			window.WebKitMutationObserver ||
			window.MozMutationObserver
		);
	},

	/**
	 * Connect and disconnect observer.
	 * @param {boolean} connect
	 */
	_connect: function(connect) {
		var obs = this._observer;
		if (obs) {
			if (connect) {
				obs.observe(document, {
					childList: true,
					subtree: true
				});
			} else {
				obs.disconnect();
			}
		}
	},

	/**
	 * Handle mutations.
	 *
	 * 1. Matarialize deleted nodes
	 * 2. Spiritualize added nodes
	 * @param {MutationRecord} mutation
	 */
	_handleMutation: function(mutation) {
		var webkithack = true;
		Array.forEach(mutation.removedNodes, function(node) {
			if (node.nodeType === Node.ELEMENT_NODE) {
				gui.materialize(node, webkithack);
			}
		}, this);
		Array.forEach(mutation.addedNodes, function(node) {
			if (node.nodeType === Node.ELEMENT_NODE) {
				gui.spiritualize(node);
			}
		}, this);
	}

};



/**
 * Assist the spirit guide (at least until refactored).
 * @using {gui.Crawler} Crawler
 */
gui.Assistant = (function using(Crawler) {

	return {

		/**
		 * Associate element to new instance of Spirit.
		 * @param {Element} elm
		 * @param {constructor} Spirit
		 * @returns {Spirit}
		 */
		$possess: function(elm, Spirit) {
			if (elm.spirit) {
				throw new Error(
					"Cannot repossess element with spirit " +
					elm.spirit + " (exorcise first)"
				);
			} else if (!gui.debug || gui.Type.isSpiritConstructor(Spirit)) {
				elm.spirit = new Spirit(elm);
			} else {
				throw new Error(
					"Not a spirit constructor (" + gui.Type.of(Spirit) + ")"
				);
			}
			return elm.spirit;
		},

		/**
		 * If possible, construct and return spirit for element.
		 * TODO: what's this? http://code.google.com/p/chromium/issues/detail?id=20773
		 * TODO: what's this? http://forum.jquery.com/topic/elem-ownerdocument-defaultview-breaks-when-elem-iframe-document
		 * @param {Element} element
		 * @param {Array} channels
		 * @returns {Spirit} or null
		 */
		$maybepossess: function(elm, channels) {
			var hit;
			if (!elm.spirit) {
				if ((hit = this._maybepossess(elm, channels))) {
					this.$possess(elm, hit);
				}
			}
			return elm.spirit;
		},

		/**
		 * Compare elements to channels and instantiate new spirits.
		 * @param {Element} element
		 * @param {boolean} skip Skip the element?
		 * @param {boolean} one Skip the subtree?
		 * @param {Array} channels
		 * @returns {Array<gui.Spirit>} new spirits
		 */
		$detectspirits: function(element, skip, one, channels) {
			var spirit, spirits = []; // classname = gui.CLASS_NOSPIRITS
			var Assistant = this; 
			new Crawler(gui.CRAWLER_SPIRITUALIZE).descend(element, {
				handleElement: function(elm) {
					if (!skip || elm !== element) {
						spirit = elm.spirit;
						if (!spirit) {
							spirit = Assistant.$maybepossess(elm, channels);
						}
						if (spirit) {
							if (!spirit.life.attached) {
								spirits.push(spirit);
							}
						}
					}
					if (one) {
						// TODO: investigate why Crawler.STOP didn't quite work out alright
						return Crawler.SKIP_CHILDREN;
					} else if (!elm.childElementCount) {
						return Crawler.SKIP_CHILDREN;
					} else if(elm.hasAttribute('tempname')) {
						return Crawler.SKIP_CHILDREN;
					} else {
						// TODO: interface for this kind of stuff!
						switch (elm.localName) {
							case "pre":
							case "code":
								return Crawler.SKIP_CHILDREN;
						}
					}
					return Crawler.CONTINUE;
				}
			});
			return spirits;
		},



		// Private ...................................................................

		/**
		 * Get Spirit constructor for element.
		 *
		 * 1. Test for element `gui` attribute(s)
		 * 2. Test if element matches selectors
		 * @param {Element} element
		 * @returns {function} Spirit constructor
		 */
		_maybepossess: function(elm, channels) {
			var res = null;
			if (elm.nodeType === Node.ELEMENT_NODE) {
				if (gui.attributes.every(function(fix) {
					res = this._maybepossessinline(elm, fix);
					return res === null;
				}, this)) {
					if (channels) {
						channels.every(function(def) { // TODO!!!!!!!!!!!!!!!!!!
							var select = def[0];
							var spirit = def[1];
							if (gui.CSSPlugin.matches(elm, select)) {
								res = spirit;
							}
							return res === null;
						}, this);
					}
				}
			}
			return res;
		},

		/**
		 * Test for spirit assigned using HTML inline attribute.
		 * Special test for "[" accounts for {gui.Spirit#$debug}
		 * @param {Element} elm
		 * @param {Window} win
		 * @param {String} fix
		 * @returns {function} Spirit constructor
		 */
		_maybepossessinline: function(elm, fix) {
			var res = null;
			var att = elm.getAttribute(fix);
			if (gui.Type.isString(att) && !att.startsWith("[")) {
				if (att !== "") {
					res = gui.Object.lookup(att);
					if(!res) {
						console.error(att + " is not defined.");
					}
				} else {
					res = false; // strange return value implies no spirit for empty string
				}
			}
			return res;
		}
	};

}(gui.Crawler));



/**
 * The spirit guide crawls the document while channeling
 * spirits into DOM elements that matches CSS selectors. 
 * @using {gui.Assistant} Assistant
 * @using {gui.Type} Type
 * @using {gui.Array} Array
 * @using {gui.Broadcast} Broadcast
 * @using {gui.DOMPlugin} DOMPlugin
 * @using {gui.Tick} Tick
 * @using gui.Crawler} Crawler
 */
gui.Guide = (function using(
	Assistant,
	Type,
	guiArray,
	Broadcast,
	DOMPlugin,
	Spirit,
	Tick,
	Crawler) {

	/**
	 * Tracking spirits inside and outside the DOM. 
	 * Spirits not in the DOM are scheduled to die.
	 */
	var documentspirits = {
		incoming: [], // spirits just entered the DOM (some milliseconds ago)
		inside: Object.create(null), // spirits positioned in page DOM ("entered" and "attached")
		outside: Object.create(null) // spirits removed from page DOM (currently "detached")
	};

	return {

		/**
		 * Identification.
		 * @returns {String}
		 */
		toString: function() {
			return "[object gui.Guide]";
		},

		/**
		 * Suspend spiritualization and materialization during operation.
		 * @param {function} operation
		 * @param @optional {object} thisp
		 * @returns {object}
		 */
		suspend: function(operation, thisp) {
			this._suspended = true;
			var res = operation.call(thisp);
			this._suspended = false;
			return res;
		},


		// Privileged ..............................................................

		/**
		 * Release the spirits and proclaim the document spiritualized.
		 */
		$startGuiding: function() {
			this._startGuiding();
			Broadcast.dispatch(gui.BROADCAST_WILL_SPIRITUALIZE);
			this._spiritualizeinitially();
			Broadcast.dispatch(gui.BROADCAST_DID_SPIRITUALIZE);
		},

		/**
		 * Associate element to new spirit instance.
		 * Offloading this to assistant while we 
		 * figure out who should handle this stuff.
		 * @param {Element} elm
		 * @param {constructor} Spirit
		 * @returns {Spirit}
		 */
		$possess: function(elm, Spirit) {
			return Assistant.$possess(elm, Spirit);
		},

		/**
		 * Possess element and descendants.
		 * TODO: Jump any detached spirit if matching id (and `jump` is set to true)
		 * @param {Element} target
		 */
		$spiritualize: function(target) {
			target = Type.isSpirit(target) ? target.element : target;
			this._maybespiritualize(target, false, false);
		},

		/**
		 * Possess descendants.
		 * @param {Element|gui.Spirit} target
		 */
		$spiritualizeSub: function(target) {
			this._maybespiritualize(target, true, false);
		},

		/**
		 * Possess one element non-crawling.
		 * @param {Element|gui.Spirit} target
		 */
		$spiritualizeOne: function(target) {
			this._maybespiritualize(target, false, true);
		},

		/**
		 * Dispell spirits from element and descendants.
		 * @param {Element|gui.Spirit} target
		 * @param @optional {boolean} webkithack (not an official thing!)
		 */
		$materialize: function(target, webkithack) {
			this._maybematerialize(target, false, false, webkithack);
		},

		/**
		 * Dispell spirits for descendants.
		 * @param {Element|gui.Spirit} target
		 */
		$materializeSub: function(target) {
			this._maybematerialize(target, true, false);
		},

		/**
		 * Dispell one spirit non-crawling.
		 * @param {Element|gui.Spirit} target
		 */
		$materializeOne: function(target) {
			this._maybematerialize(target, false, true);
		},

		/**
		 * Invoke ondetach for element spirit and descendants spirits. 
		 * TODO: This sequence should probably be revisited at some point.
		 * @param {Element|gui.Spirit} target
		 */
		$detach: function(target) {
			this._maybedetach(target);
		},

		/**
		 * Stop tracking the spirit.
		 * TODO: Figure out if `null` is recommended for dereferencing nowadays.
		 * @param {gui.Spirit} spirit
		 */
		$forget: function(spirit) {
			var spirits = documentspirits;
			var key = spirit.$instanceid;
			delete spirits.inside[key];
			delete spirits.outside[key];
			this._stoptracking(spirit);
		},

		/**
		 * Channel spirits to CSS selectors.
		 */
		$channel: function() {
			switch (Type.of(arguments[0])) {
				case 'string':
					this._channelOne.apply(this, arguments);
					break;
				case 'array':
					this._channelAll.apply(this, arguments);
					break;
			}
		},

		/**
		 * Has channels?
		 * @returns {boolean}
		 */
		$hasChannels: function() {
			return this._channels && this._channels.length;
		},

		/**
		 * Get channels (read only).
		 * @type {Array<Array<String,function>>}
		 */
		$getChannels: function() {
			return this._channels.slice();
		},

		/**
		 * Log channels to console.
		 * TODO: create {gui.Developer}
		 */
		$debug: function() {
			console.log(this._channels.reduce(function(log, channel) {
				return log + '\n\n' + channel[0] + " : " + channel[1];
			}, location.href));
		},

		/**
		 * Register spirit inside the document.
		 * Evaluate new arrivals after 4 millisec.
		 * @param {gui.Spirit} spirit
		 */
		$inside: function(spirit) {
			var spirits = documentspirits;
			var key = spirit.$instanceid;
			if (!spirits.inside[key]) {
				if (spirits.outside[key]) {
					delete spirits.outside[key];
				}
				spirits.inside[key] = spirit;
				spirits.incoming.push(spirit);
				Tick.dispatch(gui.$TICK_INSIDE, 4);
			}
		},

		/**
		 * Register spirit outside document. This schedules the spirit
		 * for destruction unless reinserted somewhere else (and soon).
		 * @param {Spirit} spirit
		 */
		$outside: function(spirit) {
			var spirits = documentspirits;
			var key = spirit.$instanceid;
			if (!spirits.outside[key]) {
				if (spirits.inside[key]) {
					delete spirits.inside[key];
					this._stoptracking(spirit);
				}
				spirits.outside[key] = spirit;
				Tick.dispatch(gui.$TICK_OUTSIDE, 0);
			}
		},

		/**
		 * Invoked by {gui.Spiritual} some milliseconds after
		 * all spirits have been attached to the page DOM.
		 * @param {Array<gui.Spirit>} spirits
		 */
		$goasync: function(spirits) {
			spirits.forEach(function(spirit) {
				Spirit.$async(spirit);
			});

			/*
			 * Temp hack: DocumentSpirit inside *iframe* must
			 * wait for visibility status to relay elsehow...
			 * (this stuff must all move to the plugin)
			 * @see {gui.IframeSpirit}
			 */
			if (gui.hosted) {
				var docspirit = gui.get('html');
				if (docspirit.life.visible === undefined) {
					return;
				}
			}
			this._visibility(spirits);
		},

		/**
		 * Get spirit by `$instanceid`. 
		 * Please go via `gui.get(id)`.
		 * @param {string} key
		 * @returns {gui.Spirit}
		 */
		$getSpiritById: function(key) {
			return documentspirits.inside[key] || null;
		},


		// Private .................................................................
		
		/**
		 *
		 */
		_arrivals: Object.create(null),

	  /**
		 * Lisitng CSS selectors associated to Spirit constructors.
		 * Order is important: First spirit to match selector is it.
		 * @type {Array<Array<String,function>>}
		 */
		_channels: [],

		/**
		 * Some kind of temp fix.
		 * @type {Array<object>}
		 */
		_todochannels: null,

		/**
		 * Ignore DOM mutations?
		 * @type {boolean}
		 */
		_suspended: false,

		/**
		 * Setup to handle spirits entering and leaving the DOM. 
		 * Flush channelings that were bufffered during bootup.
		 */
		_startGuiding: function() {
			var ticks = [gui.$TICK_INSIDE, gui.$TICK_OUTSIDE];
			gui.Tick.add(ticks, {
				ontick: function(tick) {
					if(tick.type === ticks[0]) {
						gui.Guide._updateincoming();
					} else {
						gui.Guide._updateoutside();
					}
				}
			});
			if (this._todochannels) {
				this._channelAll(this._todochannels);
				this._todochannels = null;
			}
		},

		/**
		 * 1. Always spiritualize the HTML element {gui.DocumentSpirit}.
		 * 2. Robot mode: Overload native DOM methods
		 * 3. Robot mode: Monitor DOM for unhandled mutations (WebKit)
		 * 4. Robot mode: Spiritualize everything
		 * @param {Window} win
		 * @param {Document} doc
		 */
		_spiritualizeinitially: function() {
			var root = document.documentElement;
			gui.DOMChanger.init();
			this.$spiritualizeOne(root);
			if (gui.mode === gui.MODE_ROBOT) {
				gui.DOMChanger.change();
				if (gui.Client.isWebKit) {
					gui.DOMObserver.observe();
				}
				this.$spiritualizeSub(root);
			}
		},

		/**
		 * Continue with spiritualize/materialize of given node? The 'webkithack' 
		 * relates to the problem with WebKit/Blink/Safari where removed nodes 
		 * get detected asynchronously (and is therefore NOT embedded when we run).
		 * @param {Node} node
		 * @param @optional {boolean} webkithack (sometimes true on nodes removed)
		 * @returns {boolean}
		 */
		_handles: function(node, webkithack) {
			return node && !this._suspended &&
				(webkithack || DOMPlugin.embedded(node)) &&
				Type.isElement(node);
		},

		/**
		 * Collect non-destructed spirits from element and descendants.
		 * @param {Node} node
		 * @param @optional {boolean} skip Skip start element
		 * @returns {Array<gui.Spirit>}
		 */
		_collect: function(node, skip, id) {
			var list = [];
			new Crawler(id).descend(node, {
				handleSpirit: function(spirit) {
					if (skip && spirit.element === node) {
						// nothing
					} else if (!spirit.life.destructed) {
						list.push(spirit);
					}
				}
			});
			return list;
		},

		/**
		 * Spiritualize node perhaps.
		 * @param {Node|gui.Spirit} node
		 * @param {boolean} skip Skip the element?
		 * @param {boolean} one Skip the subtree?
		 */
		_maybespiritualize: function(node, skip, one) {
			node = Type.isSpirit(node) ? node.element : node;
			node = Type.isDocument(node) ? node.documentElement : node;
			if (this._handles(node)) {
				this._spiritualize(node, skip, one);
			}
		},

		/**
		 * Evaluate spirits for element and subtree.
		 *
		 * - Construct spirits in document order
		 * - Fire life cycle events except `ready` in document order
		 * - Fire `ready` in reverse document order (innermost first)
		 *
		 * @param {Element} element
		 * @param {boolean} skip Skip the element?
		 * @param {boolean} one Skip the subtree?
		 */
		_spiritualize: function(elm, skip, one) {
			var spirits, channels = this._channels;
			skip = false; // until DOM setters can finally replace Mutation Observers
			spirits = Assistant.$detectspirits(elm, skip, one, channels);
			this._sequence(spirits);
		},

		/**
		 * Call `onconfigure`, `onenter`, `onattach` and 'onreflex' in document
		 * order. Finally call `onready` in reverse document order (bottoms up).
		 * @param {Array<gui.Spirit>} spirits
		 */
		_sequence: (function generatefuntion() {
			function configure(spirit) {
				if (!spirit.life.configured) {
					Spirit.$configure(spirit);
				}
				return spirit;
			}
			function enter(spirit) {
				if (!spirit.life.entered) {
					Spirit.$enter(spirit);
				}
				return spirit;
			}
			function attach(spirit) {
				Spirit.$attach(spirit);
				return spirit;
			}
			/*
			function reflex(spirit) {
				Spirit.$reflex(spirit);
				return spirit;
			}
			*/
			function ready(spirit) {
				if (!spirit.life.ready) {
					Spirit.$ready(spirit);
				}
			}
			return function(spirits) {
				spirits.map(
					configure
				).map(
					enter
				).map(
					attach
				).reverse().forEach(
					ready
				);
			};
		}()),

		/**
		 * Destruct spirits from element and subtree. Using a two-phased destruction sequence
		 * to minimize the risk of plugins invoking already destructed plugins during destruct.
		 * @param {Node|gui.Spirit} node
		 * @param {boolean} skip Skip the element?
		 * @param {boolean} one Skip the subtree?
		 * @param {boolean} force
		 * @param @optional {boolean} webkithack (not an official thing)
		 */
		_maybematerialize: function(node, skip, one, force, webkithack) {
			node = Type.isSpirit(node) ? node.element : node;
			node = Type.isDocument(node) ? node.documentElement : node;
			if (force || this._handles(node, webkithack)) {
				node.setAttribute('gui-matarializing', 'true');
				this._materialize(node, skip, one);
				node.removeAttribute('gui-matarializing');
			}
		},

		/**
		 * Nuke spirits in reverse document order. This to allow an ascending {gui.Action} to escape
		 * from the subtree of a spirit that decides to remove itself from the DOM during destruction.
		 * TODO: 'one' appears to be unsupported here???
		 * @param {Element} element
		 * @param {boolean} skip Skip the element?
		 * @param {boolean} one Skip the subtree?
		 */
		_materialize: function(element, skip, one) {
			this._collect(element, skip, gui.CRAWLER_MATERIALIZE).reverse().filter(function(spirit) {
				if (spirit.life.attached && !spirit.life.destructed) {
					Spirit.$destruct(spirit);
					return true; // @TODO: handle 'one' arg!
				}
				return false;
			}).forEach(function(spirit) {
				Spirit.$dispose(spirit);
			});
		},

		/**
		 * @param {Element|gui.Spirit} element
		 */
		_maybedetach: function(element) {
			element = Type.isSpirit(element) ? element.element : element;
			if (this._handles(element)) {
				this._collect(element, false, gui.CRAWLER_DETACH).forEach(function(spirit) {
					Spirit.$detach(spirit);
				});
			}
		},

		/**
		 * Channel spirits to CSS selectors.
		 * @param {String} select CSS selector
		 * @param {function|String} klass Constructor or name
		 */
		_channelOne: function(select, klass) {
			var spirit;
			if (gui.initialized) {
				if (typeof klass === "string") {
					spirit = gui.Object.lookup(klass);
				} else {
					spirit = klass;
				}
				if (!gui.debug || Type.isSpiritConstructor(spirit)) {
					this._channels.unshift([select, spirit]);
				} else {
					console.error('Bad spirit for selector "' + select + '": ' + spirit);
				}
			} else { // wait for method ready to invoke.
				this._todochannels = this._todochannels || [];
				this._todochannels.push([select, klass]);
			}
		},

		/**
		 * TODO: the 'reverse()' should really not be done here, but in 
		 * the condition above, however, that screws it up, huge disaster 
		 * and something must be done about it !!!!!!!!!!!!!!!!!!!!!!!!!!
		 */
		_channelAll: function(channels) {
			if (gui.initialized) {
				channels.forEach(function(c) {
					this._channelOne(c[0], c[1]);
				}, this);
			} else {
				this._todochannels = this._todochannels || [];
				this._todochannels = this._todochannels.concat(channels.reverse());
			}
		},

		/**
		 * Some attempt to unreference the spirit.
		 * @param {gui.Spirit} spirit
		 */
		_stoptracking: function(spirit) {
			var incoming = documentspirits.incoming;
			if (incoming.length) {
				var i = incoming.indexOf(spirit);
				if (i > -1) {
					guiArray.remove(incoming, i);
				}
			}
		},

		/**
		 * Update incoming spirits.
		 */
		_updateincoming: function() {
			gui.Guide.$goasync(documentspirits.incoming);
			documentspirits.incoming = [];
		},

		/**
		 * Update spirits not in the DOM. 
		 */
		_updateoutside: function() {
			var outside = documentspirits.outside;
			var spirits = gui.Object.each(outside, function(key, spirit) {
				return spirit;
			});
			/*
			 * TODO: make sure that this happens onexit (but not here)
			spirits.forEach ( function ( spirit ) {
				Spirit.$exit ( spirit );
			});
			*/
			spirits.forEach(function(spirit) {
				Spirit.$destruct(spirit);
			});
			spirits.forEach(function(spirit) {
				Spirit.$dispose(spirit);
			});
			documentspirits.outside = Object.create(null);
		},


		// TODO: Externalize .......................................................

		/**
		 * Evaluate spirits visibility. TODO: Off to plugin somehow.
		 * @param {Array<gui.Spirit>}
		 */
		_visibility: function(spirits) {
			if (gui.hasModule("gui-layout@wunderbyte.com")) {
				DOMPlugin.group(spirits).forEach(function(spirit) {
					gui.VisibilityPlugin.$init(spirit);
				}, this);
			}
		}
	};

}(
	gui.Assistant,
	gui.Type,
	gui.Array,
	gui.Broadcast,
	gui.DOMPlugin,
	gui.Spirit,
	gui.Tick,
	gui.Crawler
));



/**
 * Support spirits.
 */
gui.Module.mixin ({

	/**
	 * Plugins for all spirits.
	 * @type {Map<String,gui.Plugin>}
	 *
	plugin: null,

	/**
	 * Mixins for all spirits.
	 * @type {Map<String,function>}
	 *
	mixin: null,

	/**
	 * Channeling spirits to CSS selectors.
	 * @type {Map<Array<Array<String,gui.Spirit>>}
	 *
	channel: null,
	*/

	/**
	 * Called before spirits kick in.
	 * @return {Window} context
	 */
	onbeforespiritualize: function() {},

	/**
	 * Called after spirits kicked in.
	 * @return {Window} context
	 */
	onafterspiritualize: function() {},

	
	// Privileged ................................................................

	/**
	 * Secret constructor.
	 *
	 * 1. Extend {gui.Spirit} with mixins
	 * 2. Channel spirits to CSS selectors
	 * 3. Assign plugins to all {gui.Spirit}
	 * @overwrites {gui.Module.$onconstruct}
	 */
	$onconstruct: function(name) {
		this.$modname = name;
		gui.Module.$init(this);
		this.toString = function() {
			return '[module ' + name + ']';
		};
	}


}, {}, { // Static .............................................................

	/**
	 * @param {gui.Module} module
	 */
	$init: function(module) {
		if (gui.Type.isObject(module.mixin)) {
			gui.Spirit.mixin(module.mixin);
		}
		if (gui.Type.isArray(module.channel)) {
			gui.channel(module.channel);
		}
		if (gui.Type.isObject(module.plugin)) {
			gui.Object.each(module.plugin, function(prefix, Plugin) {
				if (gui.Type.isDefined(Plugin)) {
					gui.Spirit.plugin(prefix, Plugin);
				} else { // TODO: move check into gui.Spirit.plugin
					console.error("Undefined plugin for prefix: " + prefix);
				}
			});
		}
	}

});

/**
 * @param {Array<gui.Module>} modules
 */
(function catchup(modules) {
	modules.forEach(gui.Module.$init);
}(gui.Module._modules));

/**
 * Hookup modules to spirits lifecycle. 
 * Broadcasts dispatched by {gui.Guide}.
 * @param {Array<gui.Module>} modules
 */
(function hookup(modules) {
	gui.Object.each({
		'onbeforespiritualize': gui.BROADCAST_WILL_SPIRITUALIZE,
		'onafterspiritualize': gui.BROADCAST_DID_SPIRITUALIZE
	}, function associate(action, broadcast) {
		gui.Broadcast.add(broadcast, {
			onbroadcast: function() {
				modules.forEach(function(module) {
					module[action]();
				});
			}
		});
	});
}(gui.Module._modules));




/**
 * Spirits module.
 */
gui.module('gui-spirits@wunderbyte.com', {

	/**
	 * Channel spirits for CSS selectors.
	 */
	channel: [
		['html', gui.DocumentSpirit],
		['.gui-iframe', gui.IframeSpirit],
		['.gui-spirit', gui.Spirit]
	],

	/**
	 * Assign plugins to property names.
	 */
	plugin: {
		'super': gui.SuperPlugin, // TODO: for all gui.Class things!
		'action': gui.ActionPlugin,
		'broadcast': gui.BroadcastPlugin,
		'tick': gui.TickPlugin,
		'att': gui.AttPlugin,
		'config': gui.ConfigPlugin,
		'box': gui.BoxPlugin,
		'css': gui.CSSPlugin,
		'dom': gui.DOMPlugin,
		'event': gui.EventPlugin,
		'life': gui.LifePlugin,
		'sprite': gui.SpritePlugin
	},

	/**
	 * Add methods to (all) spirits.
	 */
	mixin: {

		/**
		 * Handle action.
		 * @param {gui.Action} action
		 */
		onaction: function(action) {},

		/**
		 * Handle broadcast.
		 * @param {gui.Broadcast} broadcast
		 */
		onbroadcast: function(broadcast) {},

		/**
		 * Handle tick (timed event).
		 * @param {gui.Tick} tick
		 */
		ontick: function(tick) {},

		/**
		 * Handle attribute.
		 * @param {gui.Att} att
		 */
		onatt: function(att) {},

		/**
		 * Handle event.
		 * @param {Event} event
		 */
		onevent: function(event) {},

		/**
		 * Handle lifecycle event.
		 * @param {gui.Life} life
		 */
		onlife: function(life) {},

		/**
		 * Native DOM interface. We'll forward the event to the method `onevent`.
		 * @see http://www.w3.org/TR/DOM-Level-3-Events/#interface-EventListener
		 * TODO: Move this code into {gui.EventPlugin}
		 * @param {Event} e
		 */
		handleEvent: function(e) {
			if (e.type === 'webkitTransitionEnd') { // TODO: move to {gui.EventPlugin}
				e = {
					type: 'transitionend',
					target: e.target,
					propertyName: e.propertyName,
					elapsedTime: e.elapsedTime,
					pseudoElement: e.pseudoElement
				};
			}
			this.onevent(e);
		},

		// presumably some kind of hotfix for not conflicting 
		// callbacks with destructed spirits, but why here???
		$ondestruct: gui.Combo.before(function() {
			this.handleEvent = function() {};
		})(gui.Spirit.prototype.$ondestruct)
	}

});



}(self));


(function(window) {

"use strict";


/*
 * Namepace object.
 * @using {gui.Arguments.confirmed}
 */
window.edb = gui.namespace("edb", (function using(confirmed) {

	return {

		/**
		 * Current version (injected during build process).
		 * @see https://www.npmjs.org/package/grunt-spiritual-build
		 * @type {string} (majorversion.minorversion.patchversion)
		 */
		version: '-1.0.0',

		/**
		 * Logging some debug messages? This can be flipped via meta tag:
		 * `<meta name="edb.debug" content="true"/>`
		 * @type {boolean}
		 */
		debug: false,

		/**
		 * While true, any inspection of an {edb.Objects} or {edb.Arrays}
		 * will be be followed by a synchronous broadcast message (below).
		 * @type {object}
		 */
		$accessaware: false,

		/**
		 * Broadcasts.
		 */
		BROADCAST_ACCESS: "edb-broadcast-access",
		BROADCAST_CHANGE: "edb-broadcast-change",
		BROADCAST_OUTPUT: "edb-broadcast-output",
		BROADCAST_SCRIPT_INVOKE: "edb-broadcast-script-invoke",

		/**
		 * Ticks.
		 */
		TICK_SCRIPT_UPDATE: "edb-tick-script-update",
		TICK_COLLECT_INPUT: "edb-tick-collect-input",
		TICK_PUBLISH_CHANGES: "edb-tick-update-changes",

		/**
		 * @deprecated
		 */
		get: function() {
			console.error('Deprecated API is deprecated: edb.get()');
		}

	};

}(gui.Arguments.confirmed)));



/**
 * Conceptual superclass for {edb.Object} and {edb.Array}.
 * @using {gui.Combo#chained}
 */
edb.Type = (function using(chained) {

	return gui.Class.create(null, {

		/**
		 * Called after $onconstruct (by `gui.Class` convention).
		 */
		onconstruct: function() {},

		/**
		 * Called before $ondestruct. Cleanup the mess here.
		 */
		ondestruct: function() {},

		/**
		 * Output to context.
		 * @returns {edb.Type}
		 */
		output: chained(function() {
			edb.Output.$output(this);
		}),

		/**
		 * TODO: If this is even possible...
		 * TODO: In which case, also revokeGlobal
		 */
		outputGlobal: chained(function() {
			console.error('Not supported just yet: ' + this + '.outputGlobal()');
		}),

		/**
		 * Revoke output.
		 * TODO: Something similar on constructor (so static).
		 * TODO: Perhaps only on conctructor?
		 * @returns {edb.Type}
		 */
		revoke: chained(function() {
			edb.Output.$revoke(this);
		}),

		/**
		 * Garbage collect now, at least in theory.
		 * TODO: Synchronized types should allow time
		 * to sync this fact before they are destructed.
		 */
		dispose: chained(function() {
			edb.Type.$destruct(this);
		}),

		/**
		 * Serialize to abstract EDB tree. Unlike `toJSON`, this
		 * includes underscore and dollar prefixed properties.
		 * It also features the the object-properties of arrays.
		 * @param @optional {function} filter
		 * @param @optional {String|number} tabs
		 * @returns {String}
		 */
		serializeToString: function(filter, tabs) {
			return new edb.Serializer().serializeToString(this, filter, tabs);
		},


		// Privileged ................................................................

		/**
		 * Synchronization stuff ohoy. Matches the `$instanceid` of a `gui.Class`.
		 * @type {String}
		 */
		$originalid: null,

		/**
		 * Flag destructed so that we don't overkill.
		 * @type {boolean}
		 */
		$destructed: false,

		/**
		 * Called before `onconstruct`.
		 */
		$onconstruct: function() {},

		/**
		 * Called after `ondestruct`.
		 */
		$ondestruct: function() {
			// TODO: This functionality should be provided 
			// by the states module (eg. not in the core).
			if (this.constructor.storage) {
				this.persist();
			}
		}

	});

}(gui.Combo.chained));


// Static ......................................................................

edb.Type.mixin(null, null, {

	/**
	 * Something is an instance of {edb.Object} or {edb.Array}?
	 * @param {object} o
	 * @returns {boolean}
	 */
	is: function(o) {
		return edb.Object.is(o) || edb.Array.is(o);
	},

	/**
	 * Something is a Type constructor?
	 * @param {object} o
	 * @returns {boolean}
	 */
	isConstructor: function(o) {
		return gui.Type.isGuiClass(o) &&
			gui.Class.ancestorsAndSelf(o).some(function(C) {
				return C === edb.Object || C === edb.Array;
			});
	},

	/**
	 * Lookup edb.Type constructor for argument (if not already an edb.Type).
	 * TODO: Confirm that it is actually an edb.Type thing...
	 * @param {Window|WorkerGlobalScope} arg
	 * @param {function|string} arg
	 * @returns {function}
	 */
	lookup: function(context, arg) {
		var type = null;
		switch (gui.Type.of(arg)) {
			case "function":
				type = arg; // TODO: confirm
				break;
			case "string":
				type = gui.Object.lookup(arg, context);
				break;
			case "object":
				console.error(this + ": expected edb.Type constructor (not an object)");
				break;
		}
		if (!type) {
			throw new TypeError("The type \"" + arg + "\" does not exist");
		}
		return type;
	},

	/**
	 * @param {object} value
	 */
	cast: function fix(value) {
		if (gui.Type.isComplex(value) && !edb.Type.is(value)) {
			switch (gui.Type.of(value)) {
				case "object":
					return edb.Object.from(value);
				case "array":
					return edb.Array.from(value);
			}
		}
		return value;
	},

	/**
	 * Apply any future mixins to both {edb.Object} and {edb.Array}.
	 * @param {object} proto
	 * @param {object} recurring
	 * @param {object} statics
	 * @returns {edb.Type}
	 */
	mixin: function(protos, xstatics, statics) {
		[edb.Object, edb.Array].forEach(function(Type) {
			Type.mixin(protos, xstatics, statics);
		});
		return this;
	},


	// Privileged ................................................................

	/**
	 * TODO: Use {gui.MapList} !!!!!!!!!!!!!!!
	 * @param {edb.Object|edb.Array} type
	 * @param {edb.IChangeHandler} handler
	 * @returns {edb.Object|edb.Array}
	 */
	$observe: function(type, handler) {
		var id = type.$instanceid;
		var obs = this._observers;
		var handlers = obs[id] || (obs[id] = []);
		if (handlers.indexOf(handler) === -1) {
			handlers.push(handler);
		}
		return type;
	},

	/**
	 * @param {edb.Object|edb.Array} type
	 * @param {edb.IChangeHandler} handler
	 * @returns {edb.Object|edb.Array}
	 */
	$unobserve: function(type, handler) {
		var id = type.$instanceid;
		var obs = this._observers;
		var index, handlers = obs[id];
		if (handlers) {
			if ((index = handlers.indexOf(handler)) > -1) {
				if (gui.Array.remove(handlers, index) === 0) {
					delete obs[id];
				}
			}
		}
		return type;
	},

	/**
	 * Called by {edb.Output} when the output context shuts down
	 * (when the window unloads or the web worker is terminated).
	 */
	$destruct: function(type) {
		new edb.Crawler().crawl(type, {
			ontype: function(t) {
				if (!t.$destructed) {
					type.ondestruct();
					type.$ondestruct();
					type.$destructed = true;
					if (!gui.unloading) {
						gui.Garbage.$nukeallofit(type); // TODO: via `collect` when possible
					}
				}
			}
		});
	}

});


// Mixins ......................................................................

/**
 * Setup mixins for {edb.Object} and {edb.Array}.
 * @using {gui.Arguments.confirmed}
 */
(function using(confirmed) {

	var iomixins = { // input-output methods

		/**
		 * Instance of this Type has been output (in public context)?
		 * @returns {boolean}
		 */
		isOutput: function() {
			return edb.Output.$is(this);
		},

		/**
		 * @deprecated
		 */
		getOutput: function() {
			console.error('Deprecated API is deprecated: getOutput()');
		},

		/**
		 * @deprecated
		 */
		revokeOutput: function() {
			console.error('Deprecated API is deprecated: revokeOutput()');
		}

	};

	var spassermixins = {

		/**
		 * Create new instance from argument of fuzzy type.
		 * @param {String|object|Array|edb.Object|edb.Array} json
		 * @return {edb.Object|edb.Array}
		 */
		from: gui.Arguments.confirmed("(string|object|array|null)")(
			function(json) {
				var Type = this;
				if (json) {
					if (edb.Type.is(json)) {
						json = new edb.Serializer().serializeToString(json);
					}
					if (gui.Type.isString(json)) {
						if (json.includes("$object") || json.includes("$array")) {
							json = new edb.Parser().parseFromString(json, null);
						}
					}
				}
				return new Type(json);
			}
		),

		/**
		 * Create the `Type.output` object along with the Type.
		 * @overrides {gui.Class#extend}
		 */
		extend: function() {
			var C = gui.Class.extend.apply(this, arguments);
			C.output = new edb.Output(C); // TODO: make readonly!
			return C;
		}

	};

	/**
	 * Declare the fields on edb.Type.
	 */
	[iomixins, spassermixins].forEach(function(mixins) {
		gui.Object.each(mixins, function mixin(key, value) {
			edb.Type[key] = value;
		});
	});

	/**
	 * Create one-liner for mixin to subclass constructors recurring static fields.
	 * @returns {Map<String,String|function>}
	 */
	edb.Type.$staticmixins = function() {
		var mixins = {};
		[iomixins, spassermixins].forEach(function(set) {
			Object.keys(set).forEach(function(key) {
				mixins[key] = set [key];
			}, this);
		}, this);
		return mixins;
	};

}(gui.Arguments.confirmed));



/**
 * edb.Object
 * @extends {edb.Type} at least in principle.
 * @using {gui.Arguments#confirmed}
 * @using {gui.Combo#chained}
 */
edb.Object = (function using(confirmed, chained) {

	return gui.Class.create(Object.prototype, {

		/**
		 * Observe object.
		 * @param @optional {IChangeHandler} handler
		 * @returns {edb.Object}
		 */
		addObserver: confirmed('object|function')(chained(function(handler) {
			edb.Object.observe(this, handler);
		})),

		/**
		 * Unobserve object.
		 * @param @optional {IChangeHandler} handler
		 * @returns {edb.Object}
		 */
		removeObserver: confirmed('object|function')(chained(function(handler) {
			edb.Object.unobserve(this, handler);
		})),


		// Privileged ..............................................................

		/**
		 * Constructor.
		 * @overrides {edb.Type#onconstruct}
		 */
		$onconstruct: function(json) {
			edb.Type.prototype.$onconstruct.apply(this, arguments);
			switch (gui.Type.of(json)) {
				case "object":
				case "undefined":
				case "null":
					var proxy = gui.Object.copy(json || {});
					var types = edb.ObjectPopulator.populate(proxy, this);
					edb.ObjectProxy.approximate(proxy, this, types);
					break;
				default:
					throw new TypeError(
						"Unexpected edb.Object constructor argument of type " +
						gui.Type.of(json) + ": " + String(json)
					);
			}
			this.onconstruct();
			if (this.oninit) {
				console.error("Deprecated API is deprecated: " + this + ".oninit");
			}
		},

		/**
		 * Create clone of this object filtering out
		 * underscore and dollar prefixed properties.
		 * Recursively normalizing nested EDB types.
		 * TODO: WHITELIST stuff that *was* in JSON!
		 * TODO: Something about recursive structure...
		 * @returns {object}
		 */
		toJSON: function() {
			return gui.Object.map(this, function(key, value) {
				var c = key.charAt(0);
				if (c !== "$" && c !== "_") {
					if (edb.Type.is(value)) {
						return value.toJSON();
					}
					return value;
				}
			});
		}

	});

}(gui.Arguments.confirmed, gui.Combo.chained));

/**
 * Mixin static methods. Recurring static members mixed in from {edb.Type}.
 */
edb.Object.mixin(null, edb.Type.$staticmixins(), {

	/**
	 * Observe.
	 */
	observe: edb.Type.$observe,

	/**
	 * Unobserve.
	 */
	unobserve: edb.Type.$unobserve,

	/**
	 * Publishing change summaries async.
	 * TODO: clean this up...
	 * TODO: move to edb.Type (edb.Type.observe)
	 * @param {gui.Tick} tick
	 */
	ontick: function(tick) {
		var snapshot, changes, handlers, observers = this._observers;
		if (tick.type === edb.TICK_PUBLISH_CHANGES) {
			snapshot = gui.Object.copy(this._changes);
			this._changes = Object.create(null);
			gui.Object.each(snapshot, function(instanceid, propdef) {
				if ((handlers = observers[instanceid])) {
					changes = [];
					gui.Object.each(snapshot, function(id, props) {
						if (id === instanceid) {
							gui.Object.each(props, function(name, change) {
								changes.push(change);
							});
						}
					});
					handlers.forEach(function(handler) {
						handler.onchange(changes);
					});
				}
			});
		}
	},


	// Privileged static .........................................................

	/**
	 * Publish a notification on property accessors.
	 * This should be relevant during script render.
	 */
	$onaccess: function(object, name) {
		if (edb.$accessaware) {
			gui.Broadcast.dispatch(edb.BROADCAST_ACCESS, [
				object, name
			]);
		}
	},

	/**
	 * Register change summary for publication (in next tick).
	 * @param {edb.Object} object
	 * @param {String} name
	 * @param {object} oldval
	 * @param {object} newval
	 */
	$onchange: function(object, name, oldval, newval) {
		if(oldval !== newval) {
			var type = edb.ObjectChange.TYPE_UPDATE;
			var all = this._changes, id = object.$instanceid;
			var set = all[id] = all[id] || (all[id] = Object.create(null));
			set [name] = new edb.ObjectChange(object, name, type, oldval, newval);
			gui.Tick.dispatch(edb.TICK_PUBLISH_CHANGES);
		}
	},


	// Private static ............................................................

	/**
	 * Mapping instanceids to lists of observers.
	 * @type {Map<String,Array<edb.IChangeHandler>>}
	 */
	_observers: Object.create(null),

	/**
	 * Mapping instanceids to lists of changes.
	 * @type {Map<String,Array<edb.ObjectChange>>}
	 */
	_changes: Object.create(null),

});

/*
 * Mixin methods and properties common to both {edb.Object} and {edb.Array}
 */
(function setup() {
	gui.Tick.add(edb.TICK_PUBLISH_CHANGES, edb.Object);
	gui.Object.extendmissing(edb.Object.prototype, edb.Type.prototype);
}());



/**
 * @using {Array.prototype}
 * @using {gui.Combo#chained}
 */
(function using(proto, chained) {

	/**
	 * edb.Array
	 * @extends {edb.Type} (although not really)
	 */
	edb.Array = gui.Class.create(proto, {

		/**
		 * Push.
		 */
		push: function() {
			var idx = this.length;
			var add = convert(this, arguments);
			var res = proto.push.apply(this, add);
			if (observes(this)) {
				onchange(this, idx, null, add);
			}
			return res;
		},

		/**
		 * Pop.
		 */
		pop: function() {
			var idx = this.length - 1;
			var res = proto.pop.apply(this);
			if (observes(this) && idx >= 0) {
				onchange(this, idx, [res], null);
			}
			return res;
		},

		/**
		 * Shift.
		 */
		shift: function() {
			var res = proto.shift.apply(this);
			if (observes(this)) {
				onchange(this, 0, [res], null);
			}
			return res;
		},

		/**
		 * Unshift.
		 */
		unshift: function() {
			var add = convert(this, arguments);
			var res = proto.unshift.apply(this, add);
			if (observes(this)) {
				onchange(this, 0, null, add);
			}
			return res;
		},

		/**
		 * Splice.
		 */
		splice: function() {
			var arg = arguments;
			var idx = arg[0];
			var add = convert(this, [].slice.call(arg, 2));
			var fix = [idx, arg[1]].concat(add);
			var out = proto.splice.apply(this, fix);
			if (observes(this)) {
				onchange(this, idx, out, add);
			}
			return out;
		},

		/**
		 * Reverse.
		 */
		reverse: function() {
			if (observes(this)) {
				var out = this.toJSON();
				var add = proto.reverse.apply(out.slice());
				onchange(this, 0, out, add);
			}
			return proto.reverse.apply(this);
		},


		// Expandos ................................................................

		/**
		 * Just to illustrate that arrays may conveniently get their
		 * content assigned to some variable via the constructor arg.
		 * @param {Array<object>} members (edb.Types all newed up here)
		 */
		onconstruct: function(members) {},

		/**
		 * Observe array (both object properties and list mutations).
		 * @param @optional {IChangeHandler} handler
		 * @returns {edb.Array}
		 */
		addObserver: chained(function(handler) {
			edb.Object.observe(this, handler);
			edb.Array.observe(this, handler);
		}),

		/**
		 * Unobserve array.
		 * @param @optional {IChangeHandler} handler
		 * @returns {edb.Array}
		 */
		removeObserver: chained(function(handler) {
			edb.Object.unobserve(this, handler);
			edb.Array.unobserve(this, handler);
		}),

		/**
		 * The content type can be declared as:
		 *
		 * 1. An edb.Type constructor function (my.ns.MyType)
		 * 2. A filter function to accept JSON (for analysis)
		 *    and return an edb.Type constructor OR instance
		 * @type {function} Type constructor or filter function
		 */
		$of: null,

		/**
		 * Constructor.
		 * @overrides {edb.Type#onconstruct}
		 */
		$onconstruct: function() {
			var object, types;
			edb.Type.prototype.$onconstruct.apply(this, arguments);
			if (arguments.length) {
				object = arguments[0] ? arguments[0].$object || {} : {};
				types = edb.ObjectPopulator.populate(object, this);
				edb.ArrayPopulator.populate(this, arguments);
				edb.ObjectProxy.approximate(object, this, types);
			}
			this.onconstruct([].slice.call(this));
		},

		/**
		 * Get element at index. Use this in EDBML scripts instead of [length]
		 * notation, otherwise the template will not watch this array for changes!
		 * @param {number} index
		 * @returns {object}
		 */
		get: function(index) {
			if (edb.$accessaware) {
				edb.Array.$onaccess(this, index);
			}
			return this[index];
		},

		/**
		 * Get length. Use this in EDBML scripts instead of 'length',
		 * otherwise the template will not watch this array for changes!
		 * @returns {number}
		 */
		getLength: function(index) {
			if (edb.$accessaware) {
				edb.Array.$onaccess(this, index);
			}
			return this.length;
		},

		/*
		 * Stunt accessor for setting the `length`
		 * until proxies come to save us all.
		 * @type {number}
		 */
		setLength: function(length) {
			var out = [];
			while (this.length > length) {
				out.push(this.pop());
			}
			if (out.length) {
				onchange(this, this.length - 1, out);
			}
		},


		/**
		 * Create true array without expando properties, recursively 
		 * normalizing nested EDB types. Returns the type of array we 
		 * would typically transmit back to the server or something.
		 * @returns {Array}
		 */
		toJSON: function() {
			return Array.map(this, function(thing) {
				if (edb.Type.is(thing)) {
					return thing.toJSON();
				}
				return thing;
			});
		}

	});


	// Helpers ...................................................................

	/**
	 * Convert arguments.
	 * @param {edb.Array} array
	 * @param {Arguments} args
	 * @returns {Array}
	 */
	function convert(array, args) {
		return edb.ArrayPopulator.convert(array, args);
	}

	/**
	 * Shorthand.
	 * @param {edb.Array} array
	 * @param {number} index
	 * @param {Array} removed
	 * @param {Array} added
	 */
	function onchange(array, index, removed, added) {
		edb.Array.$onchange(array, index, removed, added);
	}

	/**
	 * Array is being observed?
	 * @param {edb.Array} array
	 * @returns {boolean}
	 */
	function observes(array) {
		var key = array.$instanceid;
		return edb.Array._observers[key] ? true : false;
	}

}(Array.prototype, gui.Combo.chained));


/**
 * Mixin static methods. Recurring static members mixed in from {edb.Type}.
 */
edb.Array.mixin(null, edb.Type.$staticmixins(), {

	/**
	 * Observe.
	 */
	observe: edb.Type.$observe,

	/**
	 * Unobserve.
	 */
	unobserve: edb.Type.$unobserve,

	/**
	 * Something is a subclass constructor of {edb.Array}?
	 * TODO: let's generalize this facility in {gui.Class}
	 */
	isConstructor: function(o) {
		return gui.Type.isConstructor(o) &&
			gui.Class.ancestorsAndSelf(o).indexOf(edb.Array) > -1;
	},

	/**
	 * Publishing change summaries async.
	 * @param {gui.Tick} tick
	 */
	ontick: function(tick) {
		var snapshot, handlers, observers = this._observers;
		if (tick.type === edb.TICK_PUBLISH_CHANGES) {
			snapshot = gui.Object.copy(this._changes);
			this._changes = Object.create(null);
			gui.Object.each(snapshot, function(instanceid, changes) {
				if ((handlers = observers[instanceid])) {
					handlers.forEach(function(handler) {
						handler.onchange(changes);
					});
				}
			});
		}
	},


	// Private static ............................................................

	/**
	 * Mapping instanceids to lists of observers.
	 * @type {Map<String,Array<edb.IChangeHandler>>}
	 */
	_observers: Object.create(null),

	/**
	 * Mapping instanceids to lists of changes.
	 * @type {Map<String,Array<edb.ArrayChange>>}
	 */
	_changes: Object.create(null),


	// Privileged static .........................................................

	/**
	 * TODO.
	 * @param {edb.Array} array
	 * @param {number} index
	 */
	$onaccess: function(array, index) {
		if (edb.$accessaware) {
			gui.Broadcast.dispatch(edb.BROADCAST_ACCESS, [array]);
		}
	},

	/**
	 * Register change summary for publication in next tick.
	 * TODO: http://stackoverflow.com/questions/11919065/sort-an-array-by-the-levenshtein-distance-with-best-performance-in-javascript
	 * @param {edb.Array} array
	 * @param {number} index
	 * @param {Array} removed
	 * @param {Array} added
	 */
	$onchange: function(array, index, removed, added) {
		var key = array.$instanceid;
		var all = this._changes;
		var set = all[key] || (all[key] = []);
		set.push(new edb.ArrayChange(array, index, removed, added));
		gui.Tick.dispatch(edb.TICK_PUBLISH_CHANGES);
	},

});


/*
 * Overloading array methods.
 * @using {edb.Array.prototype}
 */
(function using(proto) {

	/*
	 * Dispatch a getter broadcast before base function.
	 */
	var beforeaccess = gui.Combo.before(function() {
		if (edb.$accessaware) {
			edb.Array.$onaccess(this, -1);
		}
	});

	/**
	 * Decorate getter methods on prototype.
	 * @param {object} proto Prototype to decorate
	 * @param {Array<String>} methods List of method names
	 * @returns {object}
	 */
	function decorateAccess(proto, methods) {
		methods.forEach(function(method) {
			proto[method] = beforeaccess(proto[method]);
		});
	}

	/*
	 * Dispatch a broadcast whenever the list is inspected or traversed.
	 */
	decorateAccess(proto, [
		"filter",
		"forEach",
		"every",
		"map",
		"some",
		"indexOf",
		"lastIndexOf",
		"slice" // hm,
		// TODO: REDUCE!
	]);

}(edb.Array.prototype));

/*
 * Mixin methods and properties common
 * to both {edb.Object} and {edb.Array}
 */
(function setup() {
	gui.Tick.add(edb.TICK_PUBLISH_CHANGES, edb.Array);
	gui.Object.extendmissing(edb.Array.prototype, edb.Type.prototype);
}());



// BACKUP ......................................................................

/**
 * Dispatch a setter broadcast after base 
 * function by decorating setter methods on prototype.
 * @param {object} proto Prototype to decorate
 * @param {Array<String>} methods List of method names
 * @returns {object}
 *
var afterchange = gui.Combo.after ( function () {});
function decorateChange ( proto, methods ) {
	methods.forEach ( function ( method ) {
		proto [ method ] = afterchange ( proto [ method ]);
	});
}

// Dispatch a broadcast whenever the list changes content or structure.
decorateChange ( proto, [
	"push", // add
	"unshift", // add
	"splice", // add or remove
	"slice", // remove
	"pop", // remove
	"shift", // remove
	"reverse" // reversed (copies???????)
]);
*/



/**
 * Populates an {edb.Object} type.
 * @using {gui.Type#isDefined}
 * @using {gui.Type#isComplex},
 * @using {gui.Type#isFunction}
 * @using {gui.Type#isConstructor}
 */
edb.ObjectPopulator = (function using(isdefined, iscomplex, isfunction, isconstructor) {

	/**
	 * List non-private fields names from handler that are not
	 * mixed in from {edb.Type} and not inherited from native.
	 * @param {edb.Object} handler
	 * @returns {Array<String>}
	 */
	function definitions(handler) {
		var Type = edb.Object.is(handler) ? edb.Object : edb.Array;
		var Base = edb.Object.is(handler) ? Object : Array;
		var keys = [],
			classes = [edb.Type, Type, Base];
		gui.Object.all(handler, function(key) {
			if (isregular(key) && classes.every(function(o) {
				return o.prototype[key] === undefined;
			})) {
				keys.push(key);
			}
		});
		return keys;
	}

	/**
	 * TODO: Call this something else...
	 * @param {object} json
	 * @param {edb.Object|edb.Array} type
	 */
	function evalheaders(json, type) {
		var id = json.$originalid || json.$instanceid;
		delete json.$instanceid;
		delete json.$originalid;
		if (id) {
			Object.defineProperty(type, "$originalid", gui.Property.nonenumerable({
				value: id
			}));
		}
	}

	/**
	 * Fail me once.
	 * @param {String} name
	 * @param {String} key
	 */
	function faildefined(name, key) {
		throw new TypeError(
			name + " declares \"" + key + "\" as something undefined"
		);
	}

	/**
	 * Fail me twice.
	 * @param {String} name
	 * @param {String} key
	 */
	function failconstructor(name, key) {
		throw new TypeError(
			name + " \"" + key + "\" must resolve to a constructor"
		);
	}

	/**
	 * Object key is not a number and doesn't start with exotic character?
	 * @param {String|number} key
	 * @returns {boolean}
	 */
	function isregular(key) {
		return key.match(/^[a-z]/i);
	}

	/**
	 * Lookup property descriptor for key.
	 * @param {object} proto
	 * @param {string} key
	 * @returns {object}
	 */
	function lookupDescriptor(proto, key) {
		if (proto.hasOwnProperty(key)) {
			return Object.getOwnPropertyDescriptor(proto, key);
		} else if ((proto = Object.getPrototypeOf(proto))) {
			return lookupDescriptor(proto, key);
		} else {
			return null;
		}
	}


	return { // Public ...............................................................

		/**
		 * Populate object properties of type instance.
		 * @param {object} json
		 * @param {edb.Object|edb.Array} type
		 * @return {Map<String,edb.Object|edb.Array>} types
		 */
		populate: function(json, type) {
			var Def, def, val, desc, types = Object.create(null);
			var base = type.constructor.prototype;
			var name = type.constructor.$classname;
			var pure = [];
			evalheaders(json, type);
			definitions(type).forEach(function(key) {
				def = type[key];
				val = json[key];
				switch (def) {
					case Object:
						//	console.error('TODO: Support Object in edb.ObjectPopulator');
						type[key] = {};
						pure.push(key);
						break;
					case Array:
						if (val && Array.isArray(val)) {
							type[key] = val.slice();
						} else {
							type[key] = [];
						}
						pure.push(key);
						break;
					default:
						if (isdefined(val)) {
							if (isdefined(def)) {
								if (iscomplex(def)) {
									if (isfunction(def)) {
										if (!isconstructor(def)) {
											def = def(val);
										}
										if (isconstructor(def)) {
											if (val !== null) {
												Def = def;
												types[key] = Def.from(json[key]);
											}
										} else {
											failconstructor(name, key);
										}
									} else {
										types[key] = edb.Type.cast(isdefined(val) ? val : def);
									}
								}
							} else {
								faildefined(name, key);
							}
						} else {
							if (isregular(key) && edb.Type.isConstructor(def)) {
								/*
								 * TODO: cleanup something here
								 */
								if (edb.Array.isConstructor(def)) {
									json[key] = [];
								} else {
									json[key] = null; // TODO: stay null somehow...
								}
								Def = def;
								types[key] = Def.from(json[key]);
							} else {
								if ((desc = lookupDescriptor(base, key))) {
									Object.defineProperty(json, key, desc);
								}
							}
						}
						break;
				}
			});
			gui.Object.nonmethods(json).filter(function(key) {
				return pure.indexOf(key) === -1;
			}).forEach(function(key) {
				var def = json[key];
				if (isregular(key) && gui.Type.isComplex(def)) {
					if (!types[key]) {
						types[key] = edb.Type.cast(def);
					}
				}
			});
			return types;
		}
	};

})(
	gui.Type.isDefined,
	gui.Type.isComplex,
	gui.Type.isFunction,
	gui.Type.isConstructor
);



/**
 * Populate `edb.Array` instances in various tricky ways.
 */
edb.ArrayPopulator = (function() {

	/**
	 * Array was declared to contain lists (not objects)?
	 * @param {edb.Array} array
	 * @returns {boolean}
	 */
	function oflist(array) {
		return array.$of && array.$of.prototype.reverse;
	}

	/**
	 * Something is a list?
	 * @param {object} o
	 * @returns {boolean}
	 */
	function islist(o) {
		return Array.isArray(o) || edb.Array.is(o);
	}

	/**
	 * Used in function `guidedconvert`.
	 * @param {constructor} Type
	 * @param {object} o
	 * @returns {edb.Type}
	 */
	function constructas(Type, o) {
		if (!gui.debug || edb.Type.isConstructor(Type)) {
			if (edb.Type.is(o)) {
				if (Type.is(o)) {
					return o;
				} else {
					fail(Type, o);
				}
			} else {
				return new Type(o);
			}
		} else {
			fail('edb.Type', Type);
		}
	}

	/**
	 * Used in function `guidedconvert`.
	 * @param {function} filter
	 * @param {object|edb.Type} o
	 * @returns {edb.Type}
	 */
	function filterfrom(filter, o) {
		var t = filter(o);
		if (gui.Type.isConstructor(t)) {
			t = constructas(t, o);
		} else if (edb.Type.is(t) || t === null) {
			t = t;
		} else {
			fail(
				'edb.Type constructor or instance',
				gui.Type.of(t),
				'return null for nothing'
			);
		}
		return t;
	}

	/**
	 * Throw that TypeEror.
	 * @param {string|object} expected
	 * @param {string|object} received
	 * @param @optional {string} message
	 */
	function fail(expected, received, message) {
		throw new TypeError(
			'$of expected ' + expected + ', got ' + received +
			(message ? ' (' + message + ')' : '')
		);
	}

	/**
	 * Convert via constructor or via filter
	 * function which returns a constructor.
	 * @param {Array} args
	 * @param {edb.Array} array
	 * @returns {Array<edb.Type>}
	 */
	function guidedconvert(args, array) {
		return args.map(function(o) {
			if (o !== undefined) {
				if (gui.Type.isConstructor(array.$of)) {
					o = constructas(array.$of, o);
				} else {
					o = filterfrom(function(x) {
						return array.$of(x);
					}, o);
				}
			}
			return o;
		});
	}

	/**
	 * Objects and arrays automatically converts
	 * to instances of {edb.Object} and {edb.Array}
	 * @param {Array} args
	 * @returns {Array}
	 */
	function autoconvert(args) {
		return args.map(function(o) {
			if (!edb.Type.is(o)) {
				switch (gui.Type.of(o)) {
					case "object":
						return new edb.Object(o);
					case "array":
						return new edb.Array(o);
				}
			}
			return o;
		});
	}


	return { // Public ...........................................................

		/**
		 * Populate {edb.Array} from constructor arguments. This works like normal
		 * arrays, except for the scenario where 1) the content model of the array
		 * is NOT arrays (ie. not a dimensional array) and 2) the first argument IS
		 * an array OR an {edb.Array} in which case the first members of this list
		 * will populate into the array and the remaining arguments will be ignored.
		 * TODO: read something about http://www.2ality.com/2011/08/spreading.html
		 * @param {edb.Array}
		 * @param {Arguments} args
		 */
		populate: function(array, args) {
			var first = args[0];
			if (first) {
				if (!oflist(array) && islist(first)) {
					args = first;
				}
				Array.prototype.push.apply(array,
					this.convert(array, args)
				);
			}
		},

		/**
		 * Convert arguments.
		 * @param {edb.Array} array
		 * @param {Arguments|array} args
		 * @returns {Array}
		 */
		convert: function(array, args) {
			args = gui.Array.from(args);
			if (!gui.Type.isNull(array.$of)) {
				if (gui.Type.isFunction(array.$of)) {
					return guidedconvert(args, array);
				} else {
					var type = gui.Type.of(array.$of);
					throw new Error(array + ' cannot be $of ' + type);
				}
			} else {
				return autoconvert(args);
			}
		}

	};

}());



/**
 * Proxy all the things.
 */
edb.ObjectProxy = (function scoped() {

	/* 
	 * Don't trigger object accessors 
	 * while scanning them internally.
	 */
	var suspend = false;

	/**
	 * Create observable getter for key.
	 * @param {String} key
	 * @param {function} base
	 * @returns {function}
	 */
	function getter(key, base) {
		return function() {
			var result = base.apply(this);
			if (edb.$accessaware && !suspend) {
				edb.Object.$onaccess(this, key);
			}
			return result;
		};
	}

	/**
	 * Create observable setter for key.
	 * @param {String} key
	 * @param {function} base
	 * @returns {function}
	 */
	function setter(key, base) {
		return function(newval) {
			suspend = true;
			var oldval = this[key];
			base.apply(this, arguments);
			if ((newval = this[key]) !== oldval) { // TODO: somehow also check `target` for diff!
				edb.Object.$onchange(this, key, oldval, newval);
			}
			suspend = false;
		};
	}


	return { // Public ...........................................................

		/**
		 * Simplistic proxy mechanism to dispatch broadcasts on getters and setters.
		 * @param {object} target The object whose properties are being intercepted. 
		 * @param {edb.Object|edb.Array} handler The edb.Type instance that 
		 *        intercepts the properties
		 */
		approximate: function(target, handler, types) {

			/* 
			 * 1. Objects by default convert to edb.Object
			 * 2. Arrays by default convert to edb.Array
			 * 3. Simple properties get target accessors
			 *
			 * TODO: Setup now proxies array indexes,
			 * unsupport this or re-approximate on changes
			 *
			 * TODO: when resetting array, make sure that
			 * it becomes xx.MyArray (not plain edb.Array)
			 */
			gui.Object.nonmethods(target).forEach(function(key) {
				var desc = Object.getOwnPropertyDescriptor(target, key);
				if (desc.configurable) {
					Object.defineProperty(handler, key, {
						enumerable: desc.enumerable,
						configurable: desc.configurable,
						get: getter(key, function() {
							if (desc.get) {
								return desc.get.call(this);
							} else {
								return types[key] || target[key];
							}
						}),
						set: setter(key, function(value) {
							var Type, type;
							if (desc.set) {
								desc.set.call(this, value);
							} else {
								if ((type = types[key])) {
									if (edb.Type.is(value)) {
										types[key] = value;
									} else {
										Type = type.constructor; // TODO: filter function support!
										types[key] = Type.from(value);
									}
								} else { // TODO: Clean this up :/
									var oldval = target[key];
									Type = handler.constructor;
									var cast = Type.prototype[key];
									switch(cast) { // TODO: filter function support! 
										case Object:
										case Array:
											if(gui.Type.isNull(value) || gui.Type.isComplex(value)) {
												target[key] = value; // right?
												if(oldval !== value) {
													// not caught by the setter, let's refactor later
													edb.Object.$onchange(handler, key, oldval, value);	
												}								
											} else {
												throw new TypeError('Expected ' + cast);
											}
											break;
										default:
											target[key] = edb.Type.cast(value);
											break;
									}
								}
							}
						})
					});
				}
			});
			gui.Object.ownmethods(target).forEach(function(key) {
				handler[key] = target[key];
			});
		}
	};

}());



/**
 * Micro change summary.
 */
edb.Change = function() {};
edb.Change.prototype = {

	/**
	 * Type that changed.
	 * @type {edb.Object|edb.Array}
	 */
	object: null,

	/**
	 * Update type.
	 * @type {String}
	 */
	type: null
};



/**
 * edb.Object change summary.
 * @extends {edb.Change}
 * @param {edb.Object} object
 * @param {String} name
 * @param {String} type
 * @param {object} oldval
 * @param {object} newval
 */
edb.ObjectChange = function(object, name, type, oldval, newval) {
	this.object = object;
	this.name = name;
	this.type = type;
	this.oldValue = oldval;
	this.newValue = newval;
};

edb.ObjectChange.prototype = gui.Object.create(edb.Change.prototype, {
	name: null,
	oldValue: undefined,
	newValue: undefined
});

/**
 * We only support type "updated" until
 * native 'Object.observe' comes along.
 * @type {String}
 */
edb.ObjectChange.TYPE_UPDATE = "update";



/**
 * @see http://wiki.ecmascript.org/doku.php?id=harmony:observe#array.observe
 * @param {edb.Array} array
 */
edb.ArrayChange = function(array, index, removed, added) {
	this.type = edb.ArrayChange.TYPE_SPLICE; // hardcoded for now
	this.object = array;
	this.index = index;
	this.removed = removed || [];
	this.added = added || [];
};

edb.ArrayChange.prototype = gui.Object.create(edb.Change.prototype, {

	/**
	 * Index of change.
	 * @type {}
	 */
	index: -1,

	/**
	 * List removed members.
	 * TODO: What should happen to them?
	 * @type {Array}
	 */
	removed: null,

	/**
	 * List added members.
	 * @type {Array}
	 */
	added: null

});

/*
 * Update types. We'll stick to `splice` for now.
 */
edb.ArrayChange.TYPE_SPLICE = "splice";

/**
 * Given a `splice` change, compute the arguments required
 * to cause or reproduce the change using `array.splice()`.
 * @see http://mdn.io/splice
 */
edb.ArrayChange.toSpliceParams = function(change) {
	if (change.type === edb.ArrayChange.TYPE_SPLICE) {
		var idx = change.index;
		var out = change.removed.length;
		var add = change.added;
		return [idx, out].concat(add);
	} else {
		throw new TypeError();
	}
};



/**
 * Transmitting output to connected listeners.
 * @see {edb.Input} for related stuff
 * @using {gui.Combo.chained} chained
 */
edb.Output = (function using(chained) {

	return gui.Class.create({

		/**
		 * Get (latest) output of Type.
		 * @returns {edb.Type}
		 */
		get: function() {
			var input = edb.Output.$get(this._type);
			return input ? input.data : null;
		},

		/**
		 * Revoke output of Type.
		 * @param {object} listener
		 * @returns {edb.Output}
		 */
		revoke: chained(function() {
			edb.Output.$revoke(this._type);
		}),

		/**
		 * Add output listener.
		 * @param {object} listener
		 * @returns {edb.Output}
		 */
		connect: chained(function(handler) {
			edb.Input.$connect(this._type, handler);
		}),

		/**
		 * Remove output listener.
		 * @param {object} listener
		 * @returns {edb.Output}
		 */
		disconnect: chained(function(handler) {
			edb.Input.$disconnect(this._type, handler);
		}),

		
		// Private .................................................................

		/**
		 * The Type we're dealing with here.
		 * @type {constuctor}
		 */
		_type: null,


		// Privileged ..............................................................

		/**
		 * Remember the type.
		 * @param {constructor} Type
		 */
		$onconstruct: function(Type) {
			this._type = Type;
		},


		// Deprecated ..............................................................

		add: function() {
			return this.connect.apply(this, arguments);
		},

		remove: function() {
			return this.disconnect.apply(this, arguments);
		}


	}, {}, { // Static privileged ................................................

		/**
		 * Output Type instance.
		 * @returns {constructor}
		 */
		$output: chained(function(type) {
			var input = this._makeinput(type.constructor, type);
			gui.Broadcast.dispatch(edb.BROADCAST_OUTPUT, input);
			// TODO: if and how to nuke existing output?
		}),

		/**
		 * Revoke type from output. Any subscribers to input of this type
		 * will now recieve an {edb.Input} with `null` as the data value.
		 * @param {constructor|edb.Type} type Accept instance or constructor
		 * @returns {constructor} (this constructor, not that constructor)
		 */
		$revoke: chained(function(type) {
			var Type = edb.Type.is(type) ? type.constructor : type;
			var nullinput = this._makeinput(Type, null);
			gui.Broadcast.dispatch(edb.BROADCAST_OUTPUT, nullinput);
			delete this._map[Type.$classid];
			// TODO: edb.Type.$destruct(type); // think about this...
		}),

		/**
		 * Instance of given Type has been output in public context?
		 * @param {constructor} Type
		 * @returns {boolean}
		 */
		$is: function(Type) {
			if (Type) {
				if (this._map) {
					var classid = Type.$classid;
					var typeobj = this._map[classid];
					return typeobj ? true : false;
				}
				return false;
			} else {
				throw new TypeError('No such Type');
			}
		},

		/**
		 * Get output of given type. Note that this returns an {edb.Input}.
		 * @param {constructor} Type
		 * @returns {edb.Input}
		 */
		$get: function(Type) {
			if (Type) {
				if (this._map) {
					var classid = Type.$classid;
					var typeobj = this._map[classid];
					return typeobj ? new edb.Input(typeobj.constructor, typeobj) : null;
				} else {
					return null;
				}
			} else {
				throw new TypeError('No such Type');
			}
		},


		// Static private ..........................................................

		/**
		 * Mapping Type classname to Type instance.
		 * @type {Map<String,edb.Object|edb.Array>}
		 */
		_map: {},

		/**
		 * Configure Type instance for output.
		 * @param {function} Type constructor
		 * @param {edb.Object|edb.Array} type instance
		 * @returns {edb.Input}
		 */
		_makeinput: function(Type, type) {
			var classid = Type.$classid;
			this._map[classid] = type;
			return new edb.Input(Type, type);
		}

	});

}(gui.Combo.chained));



/**
 * Connecting listeners to output transmissions.
 * @see {edb.Output} for related stuff
 * @using {gui.Combo#chained} chained
 * @using {gui.Combo#memoized} memoized
 * @using {gui.Interface} Interface
 * @using {gui.Type} GuiType
 * @using {gui.Class} GuiType
 */
edb.Input = (function using(chained, memoized, Interface, GuiType, GuiClass) {

	/**
	 * Tracking input handlers (equivalent to "output listeners").
	 * @using {gui.MapList<string,Array<edb.Input.IInputHandler>>} handlers
	 */
	var handlers = new gui.MapList();

	return gui.Class.create({

		/**
		 * Input Type (function constructor)
		 * @type {function}
		 */
		type: null,

		/**
		 * Input instance (instance of this.Type)
		 * @type {object|edb.Type} data
		 */
		data: null,

		/**
		 * Mark as revoked.
		 * @type {boolean}
		 */
		revoked: false,

		/**
		 * Construction time again.
		 * @param {constructor} Type
	   * @param {edb.Object|edb.Array} type
		 */
		onconstruct: function(Type, type) {
			if (edb.Type.is(type) || type === null) {
				this.type = Type;
				this.data = type;
			} else {
				throw new TypeError(type + " is not a Type instance");
			}
		}


	}, {}, { // Static ...........................................................

		/**
		 * Input handler interface.
		 */
		IInputHandler: {
			oninput: function(i) {},
			toString: function() {
				return '[interface InputHandler]';
			}
		},


		// Privileged static .......................................................

		/**
		 * Add input handler for Type(s).
		 * @param {constructor|Array<constructor>} Types
		 * @param {IInputHandler} handler
		 */
		$connect: chained(function(Types, handler) {
			Types = this.$breakdown(Types);
			if(Interface.validate(this.IInputHandler, handler)) {
				if(Types.every(this._check)) {
					this._add(Types, handler);
				}
			}
		}),

		/**
		 * Remove input handler for Type(s).
		 * @param {constructor|Array<constructor>} Types
		 * @param {IInputHandler} handler
		 */
		$disconnect: chained(function(Types, handler) {
			Types = this.$breakdown(Types);
			if(Interface.validate(this.IInputHandler, handler)) {
				if(Types.every(this._check)) {
					this._remove(Types, handler);
				}
			}
			return Types;
		}),

		/**
		 * Breakdown complicated argument into an 
		 * array of one or more type constructors.
		 * @param {object} arg
		 * @returns {constructor|Array<constructor>|string|object}
		 */
		$breakdown: function(arg) {
			if (GuiType.isArray(arg)) {
				return this._breakarray(arg);
			} else {
				return this._breakother(arg);
			}
		},

		/**
		 * Handle output.
		 * @param {edb.Input} input
		 */
		$onoutput: function(input) {
			var Type, type = input.data;
			if (type === null) {
				// TODO: Figure out what to do with revoked output :/
			} else {
				handlers.each(function(classid, list) {
					Type = GuiClass.get(classid);
					if(type instanceof Type) {
						list.slice().forEach(function(handler) {
							handler.oninput(input);
						});
					}
				});
			}
		},

		/**
		 * Lookup identical or ancestor/descandant constructor. 
		 * This will come in handy for the {edb.InputPlugin}.
		 * @param {constructor} target type constructor
		 * @param {Array<constructor>} types type constructors
		 * @param {boolean} up Lookup ancestor?
		 * @returns {constructor} edb.Type class
		 */
		$bestmatch: function(target, types, up) {
			return this._bestmatch(target.$classid, types.map(function(type) {
				return type.$classid;
			}), up);
		},

		/**
		 * Rate all types.
		 * @param {function} t
		 * @param {Array<function>} types
		 * @param {boolean} up Rate ancestor?
		 * @param {function} action
		 */
		$rateall: function(target, types, up, action) {
			types.forEach(function(type) {
				action(type, this.$rateone(
					up ? target : type, up ? type : target
				));
			}, this);
		},

		/**
		 * Rate single type. This will come in handy for the {edb.InputPlugin}.
		 * @type {constructor} target
		 * @type {constructor} type
		 * @returns {number} The degree of ancestral separation (-1 for no relation)
		 */
		$rateone: function(target, type) {
			return this._rateone(target.$classid, type.$classid);
		},


		// Private static ..........................................................

		/**
		 * Breakdown array.
		 * @param {Array<function|string|object>}
		 * @returns {Array<constructor>}
		 */
		_breakarray: function(array) {
			return array.map(function(o) {
				switch (GuiType.of(o)) {
					case "function":
						return o;
					case "string":
						return gui.Object.lookup(o);
					case "object":
						console.error("Expected function. Got object.");
				}
			}, this);
		},

		/**
		 * Breakdown not array.
		 * @param {function|String|object} arg
		 * @returns {Array<constructor>}
		 */
		_breakother: function(arg) {
			switch (GuiType.of(arg)) {
				case "function":
					return [arg];
				case "string":
					return this._breakarray(arg.split(" "));
				case "object":
					console.error("Expected function. Got object.");
			}
		},

		/**
		 * Add input handler for types.
		 * @param {Array<constructor>} Types
		 * @param {IInputHandler} handler
		 */
		_add: function(Types, handler) {
			Types.filter(function(Type) {
				return handlers.add(Type.$classid, handler);
			}).forEach(function(Type) {
				GuiClass.descendantsAndSelf(Type, function(T) {
					if (T.isOutput()) {
						var input = edb.Output.$get(Type);
						handler.oninput(input);
					}
				}, this);
			}, this);
		},

		/**
		 * Remove input handler for types.
		 * @param {Array<constructor>} Types
		 * @param {IInputHandler} handler
		 */
		_remove: function(Types, handler) {
			Types.forEach(function(Type) {
				handlers.remove(Type.$classid, handler);
			});
		},

		/**
		 * At least confirm that the Type exists.
		 * @param {constructor} Type
		 * @returns {boolean}
		 */
		_check: function(Type) {
			if (!GuiType.isDefined(Type)) {
				throw new TypeError("Could not register input for undefined Type");
			}
			return true;
		},

		/**
		 * Get identical or ancestor/descandant constructor 
		 * by `$classid` and memoize the return value.
		 * @param {string} targetid
		 * @param {Array<string>} typeid
		 * @returns {constructor}
		 */
		_bestmatch: memoized(function(targetid, typeids, up) {
			var best = null,
				rating = Number.MAX_VALUE,
				target = gui.Class.get(targetid),
				types = typeids.map(function(id) {
					return gui.Class.get(id);
				});
			this.$rateall(target, types, up, function(type, rate) {
				if (rate > -1 && rate < rating) {
					rating = rate;
					best = type;
				}
			});
			return best;
		}),

		/**
		 * Rate the degree of separation between classes 
		 * by `$classid` and memoize the return value.
		 * @param {string} targetid
		 * @param {string} typeid
		 * @returns {number}
		 */
		_rateone: memoized(function(targetid, typeid) {
			var target = gui.Class.get(targetid);
			var type = gui.Class.get(typeid);
			var r = 0,
				rating = -1,
				parent = target;
			if (target === type) {
				rating = 0;
			} else {
				while ((parent = gui.Class.parent(parent))) {
					r++;
					if (parent === type) {
						parent = null;
						rating = r;
					}
				}
			}
			return rating;
		}),


		// Deprecated ..............................................................

		/**
		 * @deprecated
		 */
		add: function() {
			console.error('Deprecated API is deprecated: edb.Input.add()');
		},

		/**
		 * @deprecated
		 */
		remove: function() {
			console.error('Deprecated API is deprecated: edb.Input.remove()');
		},

		/**
		 * Add input handler for type(s).
		 * @param {constructor|Array<constructor>} Types
		 * @param {IInputHandler} handler
		 */
		$add: function() {
			console.warn('Deprecated API is deprecated: edb.Input.$add(). Use edb.Input.$connect()');
			return this.$connect.apply(this, arguments);
		},

		/**
		 * Add input handler for type(s).
		 * @param {constructor|Array<constructor>} Types
		 * @param {IInputHandler} handler
		 */
		$remove: function() {
			console.warn('Deprecated API is deprecated: edb.Input.$remove(). Use edb.Input.$disconnect()');
			return this.$disconnect.apply(this, arguments);
		}

	});

}(
	gui.Combo.chained,
	gui.Combo.memoized,
	gui.Interface,
	gui.Type,
	gui.Class)
);

/**
 * Monitor public output.
 */
(function setup() {
	gui.Broadcast.add(edb.BROADCAST_OUTPUT, {
		onbroadcast: function(b) {
			edb.Input.$onoutput(b.data);
		}
	});
}());



/**
 * Crawl structures descending.
 * TODO: Implement 'stop' directive
 */
edb.Crawler = (function() {

	function Crawler() {}
	Crawler.prototype = {

		/**
		 *
		 */
		crawl: function(type, handler) {
			if (edb.Type.is(type)) {
				handle(type, handler);
				crawl(type, handler);
			} else {
				throw new TypeError();
			}
		}
	};

	/**
	 * Note to self: This also crawls array members (via index keys).
	 */
	function crawl(type, handler) {
		gui.Object.each(type, istype).forEach(
			function(type) {
				handle(type, handler);
				crawl(type, handler);
			}
		);
	}

	function istype(key, value) {
		if (edb.Type.is(value)) {
			return value;
		}
	}

	function handle(type, handler) {
		if (handler.ontype) {
			handler.ontype(type);
		}
		if (handler.onarray) {
			if (edb.Array.is(type)) {
				handler.onarray(type);
			}
		}
		if (handler.onobject) {
			if (edb.Object.is(type)) {
				handler.onobject(type);
			}
		}
	}

	return Crawler;

}());



edb.Serializer = (function scoped() {

	function Serializer() {}
	Serializer.prototype = {

		/**
		 * Serialize type.
		 * @param {edb.Object|edb.Array} type
		 * @param @optional {function} filter
		 * @param @optional {String|number} tabs
		 * @returns {String}
		 */
		serializeToString: function(type, filter, tabs) {
			if (isType(type)) {
				return JSON.stringify(parse(type), filter, tabs);
			} else {
				throw new TypeError("Expected edb.Object|edb.Array");
			}
		}
	};

	/**
	 * Match array features leaking into objects.
	 * @type {RegExp}
	 */
	var INTRINSIC = /^length|^\d+/;

	/**
	 * Thing is a type?
	 * @param {object} thing
	 * @returns {boolean}
	 */
	function isType(thing) {
		return edb.Type.is(thing);
	}

	/**
	 * Thing is edb.Array?
	 * @param {object} thing
	 * @returns {boolean}
	 */
	function isArray(type) {
		return edb.Array.is(type);
	}

	/**
	 * Parse as object node or array node.
	 */
	function parse(type) {
		return isArray(type) ? asArray(type) : asObject(type);
	}

	/**
	 * Compute object node.
	 * @param {edb.Object|edb.Array} type
	 * @returns {object}
	 */
	function asObject(type) {
		var map = gui.Object.map(type, mapObject, type);
		return {
			$object: gui.Object.extend({
				$classname: type.$classname,
				$instanceid: type.$instanceid,
				$originalid: type.$originalid
			}, map)
		};
	}

	/**
	 * Compute array node.
	 * @param {edb.Object|edb.Array} type
	 * @returns {object}
	 */
	function asArray(type) {
		return gui.Object.extend(asObject(type), {
			$array: mapArray(type)
		});
	}

	/**
	 * Map the object properties of a type.
	 *
	 * - Skip private (underscore) fields.
	 * - Skip all array intrinsic properties.
	 * - Skip what looks like instance objects.
	 * - Skip getters and setters.
	 * @param {String} key
	 * @param {object} value
	 */
	function mapObject(key, value) {
		var c = key.charAt(0);
		if (c === "_" || c === "$") {
			return undefined;
		} else if (isArray(this) && key.match(INTRINSIC)) {
			return undefined;
		} else if (isType(value)) {
			return parse(value);
		} else if (gui.Type.isComplex(value)) {
			switch (value.constructor) {
				case Object:
				case Array:
					return value;
			}
			return undefined;
		} else {
			if (isType(this)) {
				var base = this.constructor.prototype;
				var desc = Object.getOwnPropertyDescriptor(base, key);
				if (desc && (desc.set || desc.get)) {
					return undefined;
				}
			}
			return value;
		}
	}

	/**
	 * Map array members.
	 * @param {edb.Array} type
	 */
	function mapArray(type) {
		return Array.map(type, function(thing) {
			return isType(thing) ? parse(thing) : thing;
		});
	}

	return Serializer;

}());



edb.Parser = (function() {

	function Parser() {}
	Parser.prototype = {

		/**
		 * @param {String} json
		 * @param @optional {function} type
		 * @returns {edb.Object|edb.Array}
		 */
		parseFromString: function(json, type) {
			try {
				json = JSON.parse(json);
			} catch (JSONException) {
				throw new TypeError('Bad JSON: ' + JSONException.message);
			} finally {
				if (isType(json)) {
					return parse(json, type);
				} else {
					throw new TypeError("Expected serialized edb.Object|edb.Array");
				}
			}
		}
	};

	/**
	 * @returns {edb.Object|edb.Array}
	 */
	function parse(json, type) {
		var Type, name;
		if (type === null) {
		} else if (type) {
			name = type.$classname || name;
			Type = name ? type : gui.Object.lookup(name);
		} else {
			name = json.$object.$classname;
			Type = gui.Object.lookup(name);
		}
		json = mapValue(json);
		if (type === null) {
			return json;
		} else if (Type) {
			return Type.from(json);
		} else {
			var error = new TypeError(name + " is not defined");
			if(name === gui.Class.ANONYMOUS) {
				console.error(
					'TODO: Spiritual should make sure ' +
					'that nothing is ever "' + name + '"\n' +
					JSON.stringify(json, null, 4)
				);
			}
			throw error;
		}
	}

	/**
	 * Is typed node?
	 * @param {object} json
	 * @returns {boolean}
	 */
	function isType(json) {
		return gui.Type.isComplex(json) && (json.$array || json.$object);
	}

	/**
	 * Parse node as typed instance.
	 * @param {object} type
	 * @return {object}
	 */
	function asObject(type) {
		return gui.Object.map(type.$object, mapObject);
	}

	/**
	 * Parse array node to a simple array.
	 * Stamp object properties onto array.
	 * @returns {Array}
	 */
	function asArray(type) {
		var members = type.$array.map(mapValue);
		members.$object = type.$object;
		return members;
	}

	/**
	 *
	 */
	function mapObject(key, value) {
		switch (key) {
			case '$classname': // TODO: think about this at some point...
				//case '$instanceid'
				//case '$originalid'
				return undefined;
			default:
				return mapValue(value);
		}

	}

	/**
	 * @returns {}
	 */
	function mapValue(value) {
		if (isType(value)) {
			return value.$array ? asArray(value) : asObject(value);
		}
		return value;
	}

	return Parser;

}());



/**
 * Tracking EDB input. Note that the {edb.ScriptPlugin} is using this
 * plugin, so don't assume the existence of `this.spirit` around here. 
 * (the ScriptPlugin residers over in the edbml module, if you wonder).
 * @extends {gui.TrackerPlugin}
 * @using {gui.Combo.chained} chained
 * @using {edb.Input} Input
 */
edb.InputPlugin = (function using(chained, Input) {

	return gui.TrackerPlugin.extend({

		/**
		 * True when one of each expected input type has been collected.
		 * @type {boolean}
		 */
		done: true,

		/**
		 * Construction time.
		 * @overrides {gui.Tracker#onconstruct}
		 */
		onconstruct: function() {
			gui.TrackerPlugin.prototype.onconstruct.call(this);
			this._watches = [];
			this._matches = [];
			this._needing = [];
		},

		/**
		 * Destruction time.
		 */
		ondestruct: function() {
			gui.TrackerPlugin.prototype.ondestruct.call(this);
			this.remove(this._watches);
		},

		/**
		 * Connect to output of one or more Types.
		 * @param {edb.Type|String|Array<edb.Type|String>} arg
		 * @param @optional {IInputHandler} handler Defaults to this.spirit
		 * @param @optional {boolean} required
		 * @returns {edb.InputPlugin}
		 */
		connect: chained(function(arg, handler, required) {
			var Types = Input.$breakdown(arg);
			if (Types.length) {
				this.done = this.done && required === false;
				Types.forEach(function(Type) {
					this._addchecks(Type.$classid, [handler || this.spirit]);
					this._watches.push(Type);
					if (required) {
						this._needing.push(Type);
					}
				}, this);
				Input.$connect(Types, this);
			}
		}),

		/**
		 * Disconnect from output of one or more Types.
		 * TODO: Cleanup more stuff?
		 * @param {edb.Type|String|Array<edb.Type|String>} arg
		 * @param @optional {IInputHandler} handler Defaults to this.spirit
		 * @returns {gui.edb.InputPlugin}
		 */
		disconnect: chained(function(arg, handler) {
			var Types = Input.$breakdown(arg);
			if (Types.length) {
				Types.forEach(function(Type) {
					this._removechecks(Type.$classid, [handler || this.spirit]);
					gui.Array.remove(this._watches, Type);
					gui.Array.remove(this._needing, Type);
				}, this);
				Input.$disconnect(Types, this);
				this.done = this._done();
			}
		}),

		/**
		 * TODO: this
		 */
		one: function() {
			console.error('Not supported just yet: ' + this + '.one()');
		},

		/**
		 * Get Type instance for latest input of Type (or closest match).
		 * TODO: Safeguard somewhat
		 * @param {constructor} Type
		 * @returns {object}
		 */
		get: function(Type) {
			var types = this._matches.map(function(input) {
				return input.data.constructor;
			});
			var best = Input.$bestmatch(Type, types, false);
			var input = best ? this._matches.filter(function(input) {
				return input.type === best;
			}).shift() : null;
			return input ? input.data : null;
		},

		/**
		 * @implements {Input.IInputHandler}
		 * @param {edb.Input} input
		 */
		oninput: function(input) {
			this.$oninput(input);
		},

		/**
		 * Collect matching input.
		 * @param {Input} input
		 */
		match: function(input) {
			var needstesting = !this._matches.length;
			if (needstesting || this._matches.every(function(match) {
				return match.$instanceid !== input.$instanceid;
			})) {
				return this._maybeinput(input);
			}
			return false;
		},


		// Deprecated ..............................................................

		/**
		 * @deprecated
		 */
		add: function() {
			console.warn('Deprecated API is deprecated: input.add(). Use input.connect()');
			return this.connect.apply(this, arguments);
		},


		/**
		 * @deprecated
		 */
		remove: function() {
			console.warn('Deprecated API is deprecated: input.remove(). Use input.disconnect()');
			return this.disconnect.apply(this, arguments);
		},


		// Privileged ..............................................................

		/**
		 * Evaluate input.
		 * @param {Input} input
		 */
		$oninput: function(input) {
			if(input) {
				if (input.data === null) {
					this._mayberevoke(input);
					return false;
				} else {
					return this.match(input);
				}
			} else { // debugging...
				throw new TypeError('Bad input: ' + input + ' ' + (this.spirit || ''));
			}
		},


		// Private .................................................................

		/**
		 * Expecting instances of these types (or best match).
		 * @type {Array<constructor>}
		 */
		_watches: null,

		/**
		 * Latest (best) matches, one of each expected type.
		 * @type {Array<Input>}
		 */
		_matches: null,

		/**
		 * Listing strictly `required` types (or best match).
		 * @type {Array<constructor>}
		 */
		_needing: null,

		/**
		 * If input matches registered type, update handlers.
		 * @param {Input} input
		 */
		_maybeinput: function(input) {
			var best = Input.$bestmatch(input.type, this._watches, true);
			if (best) {
				this._updatematch(input, best);
				this.done = this._done();
				this._updatehandlers(input);
				return true;
			}
			return false;
		},

		/**
		 * Evaluate revoked output.
		 * @param {Input} input
		 */
		_mayberevoke: function(input) {
			var matches = this._matches;
			var watches = this._watches;
			var best = Input.$bestmatch(input.type, watches, true);
			if (best) {
				var oldinput = matches.filter(function(input) {
					return input.type === best;
				})[0];
				var index = matches.indexOf(oldinput);
				matches.splice(index, 1);
				this.done = this._done();
				if (!this.done) {
					input.revoked = true;
					this._updatehandlers(input);
				}
			}
		},

		/**
		 * Register match for type (remove old match if any).
		 * @param {Input} newinput
		 * @param {constructor} bestmatch
		 */
		_updatematch: function(newinput, bestmatch) {
			var matches = this._matches,
				oldindex = -1,
				oldrating = -1,
				newrating = Input.$rateone(newinput.type, bestmatch);
			matches.forEach(function oldbestmatch(match, i) {
				oldrating = Input.$rateone(match.type, bestmatch);
				if (oldrating > -1 && oldrating <= newrating) {
					oldindex = i;
				}
			});
			if (oldindex > -1) {
				matches[oldindex] = newinput;
			} else {
				matches.push(newinput);
			}
		},

		/**
		 * Update input handlers.
		 * @param {Input} input
		 */
		_updatehandlers: function(input) {
			gui.Class.ancestorsAndSelf(input.type, function(Type) {
				var list = this._trackedtypes[Type.$classid];
				if (list) {
					list.forEach(function(checks) {
						var handler = checks[0];
						handler.oninput(input);
					});
				}
			}, this);
		},

		/**
		 * All required inputs has been aquired?
		 * @returns {boolean}
		 */
		_done: function() {
			var needs = this._needing;
			var haves = this._matches;
			return needs.every(function(Type) {
				return haves.some(function(input) {
					return (input.data instanceof Type);
				});
			});
		},

		/**
		 * Cleanup when destructed.
		 * @param {String} type
		 * @param {Array<object>} checks
		 */
		_cleanup: function(classid, checks) {
			if (this._removechecks(classid, checks)) {
				var Type = gui.Class.get(classid);
				Input.$remove(Type, this);
			}
		}

	});

}(gui.Combo.chained, edb.Input));



/*
 * Register module.
 */
gui.module("edb@wunderbyte.com", {

	/*
	 * Register plugins for all spirits 
	 * (if the GUI spirits are avilable).
	 */
	plugin: {
		input: edb.InputPlugin
	}

});



/**
 * Namepspace object.
 */
window.edbml = gui.namespace('edbml', {

	/**
	 * Automatically load EDBML scripts by naming convention?
	 * (ns.MySpirit would automatically load ns.MySpirit.edbml)
	 * @type {boolean}
	 */
	bootload: false,

	/**
	 * EDBML script declaration micro DSL.
	 * @param {String} id
	 */
	declare: function(id) {
		var configured;
		return {
			as: function($edbml) {
				configured = edbml.$runtimeconfigure($edbml);
				configured = gui.Object.assert(id, configured);
				configured.lock = function(out) {
					return function lockedout() {
						$edbml.$out = out;
						return configured.apply(this, arguments);
					};
				};
				return this;
			},
			withInstructions: function(pis) {
				configured.$instructions = pis;
			}
		};
	},

	/**
	 * Escape potentially unsafe string for use in HTML body context.
	 * @param {string} string
	 * @returns {string}
	 */
	safetext: function(string) {
		return edbml.Security.$safetext(string);
	},

	/**
	 * Escape potentially unsafe string for use in HTML attribute value.
	 * @param {string} string
	 * @returns {string}
	 */
	safeattr: function(string) {
		return edbml.Security.$safeattr(string);
	},


	// Privileged ................................................................

	/**
	 * Register action to execute later.
	 * @param {function} action
	 * @param {object} thisp
	 * @returns {function}
	 */
	$set: function(action, thisp) {
		return edbml._assign(action, thisp);
	},

	/**
	 * Get something from registered action.
	 * NOTE: {gui.ConfigPlugin} hardcoded `$edb.get`
	 * TODO: {gui.ConfigPlugin} should not hardcode
	 * @param {string} key
	 * @param @optional {string} sig
	 */
	$get: function(key) {
		return edbml._request(key);
	},

	/**
	 * Execute action with no return value.
	 * NOTE: {edb.FunctionUpdate} hardcoded `edb.$run`
	 * TODO: why was this split up in two steps? Sandboxing?
	 * @param {Event} e
	 * @param {string} key
	 * @param @optional {string} sig
	 */
	$run: function(e, key) {
		this._register(e);
		this._invoke(key);
	},

	/**
	 * Garbage collect function that isn't called by the
	 * GUI using whatever strategy they prefer nowadays.
	 */
	$revoke: function(key) {
		this._invokables[key] = null; // garbage one
		delete this._invokables[key]; // garbage two
	},

	/**
	 * Configure EDBML function for runtime use. Note
	 * that `this` refers to the spirit instance here.
	 * @see {ts.gui.ScriptPlugin#_runtimeconfigure}
	 * @param {function} $edbml The (compiled) function as served to the page
	 * @returns {function}
	 */
	$runtimeconfigure: (function scoped() {
		function setupbefore($edbml, spirit) {
			$edbml.$out = $edbml.$out || new edbml.Out();
			$edbml.$att = new edbml.Att();
			if (spirit) {
				$edbml.$input = function(Type) {
					return spirit.script.$input.get(Type);
				};
			}
		}
		function cleanupafter($edbml, spirit) {
			$edbml.$out = null;
			$edbml.$att = null;
			if (spirit) {
				$edbml.$input = null;
			}
		}
		return function($edbml) {
			return function configured($in) {
				setupbefore($edbml, this);
				var res = $edbml.apply(this, arguments);
				cleanupafter($edbml, this);
				return res;
			};
		};
	}()),


	// Private ...................................................................

	/**
	 * Tracking event details.
	 * @type {Map<String,object>}
	 */
	_latestevent: null,

	/**
	 * Mapping EDBML-internal functions to keys
	 * so that they may later be recalled to run.
	 * @type {Map<String,function>}
	 */
	_invokables: {},

	/**
	 * Map function to generated key and return the key.
	 * @param {function} func
	 * @param {object} thisp
	 * @returns {String}
	 */
	_assign: function(func, thisp) {
		var key = gui.KeyMaster.generateKey();
		this._invokables[key] = function(value, checked) {
			return func.apply(thisp, [gui.Type.cast(value), checked]);
		};
		return key;
	},

	/**
	 * TODO: Revoke invokable on spirit destruct (release memory)
	 * @param {string} key
	 * @param @optional {String} sig
	 * @param @optional {Map<String,object>} log
	 */
	_invoke: function(key, sig, log) {
		log = log || this._latestevent;
		if (sig) {
			this._invokeremote(key, sig, log);
		} else {
			this._invokelocal(key, log);
		}
	},

	/**
	 * This would relate to the sandbox (not in codebase currently).
	 * TODO: Target should only be spirits now, move to data arg...
	 */
	_invokeremote: function(key, sig, log) {
		gui.Broadcast.$target = this;
		gui.Broadcast.dispatchGlobal(edb.BROADCAST_SCRIPT_INVOKE, {
			key: key,
			sig: sig,
			log: log
		});
	},

	/*
	 * Invoke internal EDBML function in this window context.
	 * Timeout is a cosmetic stunt to unfreeze a pressed
	 * button in case the function takes a while to complete.
	 * One might think of more events that could be listed.
	 */
	_invokelocal: function(key, log) {
		var func = this._invokables[key];
		if (func) {
			if (log) {
				switch (log.type) {
					case 'click':
					case 'tap': // PolymerGestures hardcode alert
						gui.Tick.time(function() {
							func(log.value, log.checked);
						});
						break;
					default:
						func(log.value, log.checked);
						break;
				}
			} else {
				func();
			}
		} else {
			console.error("out of synch");
		}
	},

	/**
	 * Get invokable function by key.
	 * @param {string} key
	 * @returns {function}
	 */
	_request: function(key, sig) {
		var func;
		if (sig) { // TODO: this
			console.error("Not supported");
		} else {
			if ((func = this._invokables[key])) {
				return func();
			} else {
				console.error("out of synch");
			}
		}
	},

	/**
	 * Keep a log on the latest DOM event. Perhaps it's
	 * because events don't take to async implementation,
	 * though it's probably so we can send it to sandbox.
	 * @param {Event} e
	 */
	_register: function(e) {
		this._latestevent = e && e.target ? {
			type: e.type,
			value: e.target.value,
			checked: e.target.checked
		} : null;
	}

});



/**
 * Converts JS props to HTML attributes during EDBML rendering phase.
 * Any methods added to this prototype will become available in EDBML
 * scripts as `$att.mymethod()`
 * @param @optional Map<String,object> atts Default properties
 */
edbml.Att = function Att(atts) {
	if (atts) {
		gui.Object.extend(this, atts);
	}
};

edbml.Att.prototype = gui.Object.create(null, {

	/**
	 * Identification.
	 * @returns {String}
	 */
	toString: function() {
		return "[object edbml.Att]";
	},


	// Privileged ................................................................

	/**
	 * Resolve single key-value to HTML attribute declaration.
	 * @param {String} att
	 * @returns {String}
	 */
	$: function(att) {
		var val = this[att],
			html = "";
		switch (gui.Type.of(val)) {
			case "null":
			case "undefined":
				break;
			default:
				val = edbml.Att.$encode(this[att]);
				html += att + "=\"" + val + "\" ";
				break;
		}
		return html;
	},

	/**
	 * Resolve key-value, then delete it to prevent reuse.
	 * @param {String} att
	 */
	$pop: function(att) {
		var html = this.$(att);
		delete this[att];
		return html;
	},

	/**
	 * Resolve all key-values to HTML attribute declarations.
	 * @returns {String}
	 */
	$all: function() {
		var html = "";
		gui.Object.nonmethods(this).forEach(function(att) {
			html += this.$(att);
		}, this);
		return html;
	}

});


// Static privileged ...........................................................

/**
 * Stringify stuff to be used as HTML attribute values.
 * TODO: in "string", support simple/handcoded JSON object/array.
 * @param {object} data
 * @returns {String}
 */
edbml.Att.$encode = function(data) {
	var type = gui.Type.of(data);
	switch (type) {
		case "string":
			data = edbml.safeattr(data);
			break;
		case "number":
		case "boolean":
			data = String(data);
			break;
		case "object":
		case "array":
			try {
				data = encodeURIComponent(JSON.stringify(data));
			} catch (jsonex) {
				throw new Error("Could not create HTML attribute: " + jsonex);
			}
			break;
		case "date":
			throw new Error("TODO: edbml.Att.encode standard date format?");
		default:
			throw new Error("Could not create HTML attribute for " + type);
	}
	return data;
};



/**
 * Collects HTML output during EDBML rendering phase.
 * Any methods added to this prototype will become
 * available in EDBML scripts as: out.mymethod()
 */
edbml.Out = function Out() {};

edbml.Out.prototype = {

	/**
	 * HTML string (not well-formed while parsing).
	 * @type {String}
	 */
	html: "",

	/**
	 * Identification.
	 * @returns {String}
	 */
	toString: function() {
		return "[object edbml.Out]";
	},

	/**
	 * Get HTML result (output override scenario).
	 * @returns {String}
	 */
	write: function() {
		return this.html;
	}
};



/**
 * Year!
 */
edbml.Update = gui.Class.create(Object.prototype, {

	/**
	 * Matches hard|atts|insert|append|remove|function
	 * @type {String}
	 */
	type: null,

	/**
	 * Identifies associated element in one of two ways:
	 *
	 * 1) It's the id of an element. Or if no id:
	 * 2) It's the $instanceid of a {gui.Spirít}
	 * @see  {edbml.Update#element}
	 * @type {String}
	 */
	id: null,

	/**
	 * Tracking ancestor element IDs. We use this to regulate whether an
	 * update should be discarded because a hard replace has obsoleted it.
	 * @type {Map<String,boolean>}
	 */
	ids: null,

	/**
	 * Update context window.
	 * @type {Window}
	 */
	window: null,

	/**
	 * Update context document.
	 * @type {Document}
	 */
	document: null,

	/**
	 * Prepare debug summary.
	 */
	onconstruct: function() {
		this._summary = [];
	},

	/**
	 * The update method performs the actual update. Expect methods
	 * _beforeUpdate and _afterUpdate to be invoked at this point.
	 */
	update: function() {},

	/**
	 * Get element associated to this.id. Depending on update type,
	 * this element will be removed or added or updated and so on.
	 * The root element (the one whose spirit is assigned the script)
	 * may be indexed by "$instanceid" if no ID attribute is specified.
	 * @returns {Element}
	 */
	element: function() {
		var spirit, element = null;
		if (gui.KeyMaster.isKey(this.id)) {
			if ((spirit = gui.get(this.id))) {
				element = spirit.element;
			}
		}
		element = element || document.querySelector('#' + this.id);
		if (!element) {
			console.error("No element to match @id: " + this.id);
		}
		return element;
	},

	/**
	 * Clean stuff up for what it's worth.
	 */
	dispose: function() {
		this._summary = null;
	},


	// Private ...................................................................

	/**
	 * Tracking attribute changes for debugging.
	 * @type {Array<String>}
	 */
	_summary: null,

	/**
	 * When something changed, dispatch pre-update event.
	 * @param {Element} element
	 * @return {boolean}
	 */
	_beforeUpdate: function(element) {
		var event = "x-beforeupdate-" + this.type;
		return this._dispatch(element, event);
	},

	/**
	 * When something changed, dispatch post-update event.
	 * @param {Element} element
	 * @return {boolean}
	 */
	_afterUpdate: function(element) {
		var event = "x-afterupdate-" + this.type;
		return this._dispatch(element, event);
	},

	/**
	 * Dispatch bubbling DOM event for potential handlers to intercept the update.
	 * TODO: Investigate CustomEvent support in our browser stack...
	 * @param {Element} element
	 * @param {String} name
	 * @return {boolean} False if event was canceled
	 */
	_dispatch: function(element, name) {
		if(element) { // hotfix https://github.com/Tradeshift/Client-Runtime/issues/141
			var event = document.createEvent("UIEvents");
			event.initEvent(name, true, true);
			return element.dispatchEvent(event);
		} else {
			console.error('Occasional EDBML dysfunction just happened');
		}
	},

	/**
	 * Report update in debug mode.
	 * @param {String} report
	 */
	_report: function(report) {
		if (edbml.debug) {
			if (gui.KeyMaster.isKey(this.id)) {
				report = report.replace(this.id, "(anonymous)");
			}
			console.debug(report, this.element());
		}
	}


}, {}, { // Static .............................................................

	/**
	 * Default replace update. A section of the DOM tree is replaced.
	 * {@see ReplaceUpdate}
	 * @type {String}
	 */
	TYPE_HARD: "hard",

	/**
	 * Attribute update. The element must have an ID specified.
	 * {@see UpdateManager#hasSoftAttributes}
	 * {@see AttributesUpdate}
	 * @type {String}
	 */
	TYPE_ATTS: "atts",

	/**
	 * Insertion update: Inserts a child without replacing the parent. Child
	 * siblings must all be Elements and they must all have an ID specified.
	 * {@see SiblingUpdate}
	 * @type {String}
	 */
	TYPE_INSERT: "insert",

	/**
	 * {@see SiblingUpdate}
	 * @type {String}
	 */
	TYPE_APPEND: "append",

	/**
	 * Removal update: Removes a child without replacing the parent. Child
	 * siblings must all be Elements and they must all have an ID specified.
	 * {@see SiblingUpdate}
	 * @type {String}
	 */
	TYPE_REMOVE: "remove",

	/**
	 * EDB function update. Dereferencing functions bound to GUI
	 * events that are no longer associated to any DOM element.
	 * @type {String}
	 */
	TYPE_FUNCTION: "function"

});



/**
 * Update attributes. Except for the ID which
 * is required to be the same before and after.
 * @using {gui.CSSPlugin} CSSPlugin
 */
edbml.AttsUpdate = (function using(CSSPlugin) {

	return edbml.Update.extend({

		/**
		 * Update type.
		 * @type {String}
		 */
		type: edbml.Update.TYPE_ATTS,

		/**
		 * Setup update.
		 * @param {String} id
		 * @param {Element} xnew
		 * @param {Element} xold
		 * @returns {edbml.AttsUpdate}
		 */
		onconstruct: function(id, xnew, xold) {
			edbml.Update.prototype.onconstruct.call(this);
			this.id = id;
			this._xnew = xnew;
			this._xold = xold;
		},

		/**
		 * Update attributes.
		 */
		update: function() {
			edbml.Update.prototype.update.call(this);
			var element = this.element();
			// hotfix https://github.com/Tradeshift/Client-Runtime/issues/141
			if (element && this._beforeUpdate(element)) {
				this._update(element);
				this._afterUpdate(element);
				this._report();
			}
		},

		/**
		 * Better not keep a reference to any DOM element around here.
		 * @overrides {edbml.Update#dispose}
		 */
		dispose: function() {
			edbml.Update.prototype.dispose.call(this);
			delete this._xold;
			delete this._xnew;
		},


		// Private .................................................................

		/**
		 * (XML) element before update.
		 * @type {Element}
		 */
		_xold: null,

		/**
		 * (XML) element after update.
		 * @type {Element}
		 */
		_xnew: null,

		/**
		 * Actually update attributes.
		 * 1. Create and update attributes.
		 * 2. Remove attributes
		 * @param {HTMLElement} element
		 */
		_update: function(element) {
			Array.forEach(this._xnew.attributes, function(newatt) {
				var oldatt = this._xold.getAttribute(newatt.name);
				if (oldatt === null || oldatt !== newatt.value) {
					if(newatt.name === 'class') {
						this._classlist(element, this._xold, newatt.value);
					} else {
						this._set(element, newatt.name, newatt.value);
					}
					this._summary.push(
						"@" + newatt.name + "=\"" + newatt.value + "\"" +
						(element.id ? ' (#' + element.id + ')' : '')
					);
				}
			}, this);
			Array.forEach(this._xold.attributes, function(oldatt) {
				if (!this._xnew.hasAttribute(oldatt.name)) {
					if(oldatt.name === 'class') {
						this._classlist(element, this._xold, '');
					} else {
						this._del(element, oldatt.name, null);
					}
					this._summary.push(
						"removed @" + oldatt.name +
						(element.id ? ' (#' + element.id + ')' : '')
					);
				}
			}, this);
		},

		/**
		 * Set element attribute.
		 * @param {Element} element
		 * @param {String} name
		 * @param {String} value
		 * @return
		 */
		_set: function(element, name, value) {
			var spirit = element.spirit;
			if (spirit) {
				spirit.att.set(name, value);
			} else {
				element.setAttribute(name, value);
				switch (name) {
					case "checked":
						if (!element.checked) {
							element.checked = true;
						}
						break;
					case "value":
						if (element.value !== value) {
							element.value = String(value); // ?
						}
						break;
				}
			}
		},

		/**
		 * Set element attribute.
		 * @param {Element} element
		 * @param {String} name
		 * @param {String} value
		 * @return
		 */
		_del: function(element, name) {
			var spirit = element.spirit;
			if (spirit) {
				spirit.att.del(name);
			} else {
				switch (name) {
					case "checked":
						element.checked = false;
						break;
					default:
						element.removeAttribute(name);
						break;
				}
			}
		},

		/**
		 * Maintain the class attribute non-destructively 
		 * so that outside agencies may contribute to it.
		 * @param {Element} element The actual DOM
		 * @param {Element} xelement The virtual DOM
		 * @param {string} classname
		 */
		_classlist: function(element, xelement, classname) {
			var newnames = classname.split(' ');
			var oldnames = xelement.className.split(' ');
			oldnames.forEach(function(oldname) {
				if(oldname && newnames.indexOf(oldname) === -1) {
					CSSPlugin.remove(element, oldname);
				}
			});
			newnames.forEach(function(newname) {
				if(newname && oldnames.indexOf(newname) === -1) {
					CSSPlugin.add(element, newname);
				}
			});
		},

		/**
		 * Debug changes.
		 */
		_report: function() {
			var summary = this._summary.join(', ');
			var message = 'edbml.AttsUpdate "#' + this.id + '" ' + summary;
			edbml.Update.prototype._report.call(this, message);
		}

	});

}(gui.CSSPlugin));



/**
 * Hey.
 */
edbml.HardUpdate = edbml.Update.extend({

	/**
	 * Update type.
	 * @type {String}
	 */
	type: edbml.Update.TYPE_HARD,

	/**
	 * XML element.
	 * @type {Element}
	 */
	xelement: null,

	/**
	 * Setup update.
	 * @param {String} id
	 * @param {Element} xelement
	 */
	onconstruct: function(id, xelement) {
		edbml.Update.prototype.onconstruct.call(this);
		this.id = id;
		this.xelement = xelement;
	},

	/**
	 * Replace target subtree.
	 */
	update: function() {
		edbml.Update.prototype.update.call(this);
		var element = this.element();
		// hotfix https://github.com/Tradeshift/Client-Runtime/issues/141
		if (element && this._beforeUpdate(element)) {
			gui.DOMPlugin.html(element, this.xelement.innerHTML);
			this._afterUpdate(element);
			this._report();
		}
	},

	/**
	 * Clean up.
	 */
	dispose: function() {
		edbml.Update.prototype.dispose.call(this);
		delete this.xelement;
	},


	// Private ...................................................................

	/**
	 * Hello.
	 */
	_report: function() {
		var message = "edbml.HardUpdate #" + this.id;
		edbml.Update.prototype._report.call(this, message);
	}
});



/**
 * Soft update.
 * @extends {edbml.Update}
 */
edbml.SoftUpdate = edbml.Update.extend({

	/**
	 * XML element stuff (not used by edbml.RemoveUpdate).
	 * @type {Element}
	 */
	xelement: null,

	/**
	 * Update type defined by descendants.
	 * Matches insert|append|remove
	 * @type {String}
	 */
	type: null,

	/**
	 * Clean stuff up for what it's worth.
	 */
	dispose: function() {
		edbml.Update.prototype.dispose.call(this);
		delete this.xelement;
	},


	// Private ...................................................................

	/**
	 * TODO: make static, argument xelement
	 * Convert XML element to HTML element. Method document.importNode can not
	 * be used in Firefox, it will kill stuff such as the document.forms object.
	 * TODO: Support namespaces and what not
	 * @param {HTMLElement} element
	 */
	_import: function(parent) {
		var temp = document.createElement(parent.nodeName);
		temp.innerHTML = this.xelement.outerHTML;
		return temp.firstChild;
	}
});



/**
 * Insert.
 * @extends {edbml.SoftUpdate}
 */
edbml.InsertUpdate = edbml.SoftUpdate.extend({

	/**
	 * Update type.
	 * @type {String}
	 */
	type: edbml.Update.TYPE_INSERT,

	/**
	 * XML element.
	 * @type {Element}
	 */
	xelement: null,

	/**
	 * Setup update.
	 * @param {String} id Insert before this ID
	 * @param {Element} xelement
	 */
	onconstruct: function(id, xelement) {
		this.id = id;
		this.xelement = xelement;
	},

	/**
	 * Execute update.
	 */
	update: function() {
		var parent, child, sibling = this.element();
		if(sibling) {
			parent = sibling.parentNode;
			child = this._import(parent);
			if (this._beforeUpdate(parent)) {
				parent.insertBefore(child, sibling);
				this._afterUpdate(child);
				this._report();
			}
		}
	},


	// Private ...................................................................

	/**
	 * Report.
	 * TODO: Push to update manager.
	 */
	_report: function() {
		var message = "edbml.InsertUpdate #" + this.xelement.getAttribute("id");
		edbml.SoftUpdate.prototype._report.call(this, message);
	}
});



/**
 * Append.
 * @extends {edbml.SoftUpdate}
 */
edbml.AppendUpdate = edbml.SoftUpdate.extend({

	/**
	 * Update type.
	 * @type {String}
	 */
	type: edbml.Update.TYPE_APPEND,

	/**
	 * Setup update.
	 * @param {String} id
	 * @param {Element} xelement
	 */
	onconstruct: function(id, xelement) {
		this.id = id;
		this.xelement = xelement;
	},

	/**
	 * Execute update.
	 */
	update: function() {
		var child, parent = this.element();
		if(parent) {
			child = this._import(parent);
			if (this._beforeUpdate(parent)) {
				parent.appendChild(child);
				this._afterUpdate(child);
				this._report();
			}
		}
	},

	/**
	 * Report.
	 * TODO: Push to update manager.
	 */
	_report: function() {
		var message = "edbml.AppendUpdate #" + this.xelement.getAttribute("id");
		edbml.SoftUpdate.prototype._report.call(this, message);
	}
});



/**
 * Remove.
 * @extends {edbml.SoftUpdate}
 */
edbml.RemoveUpdate = edbml.SoftUpdate.extend({

	/**
	 * Update type.
	 * @type {String}
	 */
	type: edbml.Update.TYPE_REMOVE,

	/**
	 * Setup update.
	 * @param {String} id
	 */
	onconstruct: function(id) {
		this.id = id;
	},

	/**
	 * Execute update.
	 */
	update: function() {
		var parent, element = this.element();
		if(element) { // hotfix https://github.com/Tradeshift/Client-Runtime/issues/141
			parent = element.parentNode;
			if (this._beforeUpdate(element)) {
				parent.removeChild(element);
				this._afterUpdate(parent);
				this._report();
			}
		}
	},


	// Private ...................................................................

	/**
	 * Report.
	 * TODO: Push to update manager.
	 */
	_report: function() {
		var message = "edbml.RemoveUpdate #" + this.id;
		edbml.SoftUpdate.prototype._report.call(this, message);
	}
});



/**
 * Updating the functions it is.
 * TODO: revoke all functions from destructed spirit (unless window.unload)
 */
edbml.FunctionUpdate = edbml.Update.extend({

	/**
	 * Update type.
	 * @type {String}
	 */
	type: edbml.Update.TYPE_FUNCTION,

	/**
	 * Setup update.
	 * @param {String} id
	 * @param @optional {Map<String,String>} map
	 */
	onconstruct: function(id, map) {
		edbml.Update.prototype.onconstruct.call(this);
		this.id = id;
		this._map = map || null;
	},

	/**
	 * Do the update.
	 */
	update: function() {
		var count = 0,
			elm = this.element();
		if (this._map) {
			if ((count = edbml.FunctionUpdate._remap(elm, this._map))) {
				this._report("remapped " + count + " keys");
			}
		} else {
			if ((count = edbml.FunctionUpdate._revoke(elm))) {
				this._report("revoked " + count + " keys");
			}
		}
	},


	// Private ...................................................................

	/**
	 * Report the update.
	 * @param {String} report
	 */
	_report: function(report) {
		var message = "edbml.FunctionUpdate " + report + " (" + this.$instanceid + ")";
		edbml.Update.prototype._report.call(this, message);
	}


}, { // Static .................................................................

	/**
	 * @param {Element} element
	 */
	_revoke: function(element) {
		var att, count = 0,
			keys;
		this._getatts(element).forEach(function(x) {
			att = x[1];
			keys = gui.KeyMaster.extractKey(att.value);
			if (keys) {
				keys.forEach(function(key) {
					edbml.$revoke(key);
					count++;
				});
			}
		});
		return count;
	},

	/**
	 * @param {Element} element
	 * @param {Map<String,String>} map
	 */
	_remap: function(element, map) {
		var count = 0,
			oldkeys, newkey, newval;
		if (Object.keys(map).length) {
			this._getatts(element).forEach(function(x) {
				var elm = x[0];
				var att = x[1];
				if ((oldkeys = gui.KeyMaster.extractKey(att.value))) {
					oldkeys.forEach(function(oldkey) {
						if ((newkey = map[oldkey])) {
							newval = att.value.replace(oldkey, newkey);
							elm.setAttribute(att.name, newval);
							edbml.$revoke(oldkey);
							count++;
						}
					});
				}
			});
		}
		return count;
	},

	/**
	 * Collect attributes from DOM subtree that
	 * somewhat resemble EDBML poke statements.
	 * @returns {Array<Array<Node>>}
	 */
	_getatts: function(element) {
		var atts = [];
		new gui.Crawler('edbml-crawler-functionupdate').descend(element, {
			handleElement: function(elm) {
				if (elm !== element) {
					Array.forEach(elm.attributes, function(att) {
						if (att.value.includes("edbml.$run")) {
							atts.push([elm, att]);
						}
					});
					if (elm.spirit && elm.spirit.script.loaded) { // ... not our DOM tree
						return gui.Crawler.SKIP_CHILDREN;
					}
				}
			}
		});
		return atts;
	}

});



/**
 * We collect updates over-aggresively in an attempt to traverse
 * the DOM tree in one direction only. The fellow will helps us
 * reduce the collected updates to the minimum required subset.
 */
edbml.UpdateCollector = gui.Class.create(Object.prototype, {

	/**
	 * Setup.
	 */
	onconstruct: function() {
		this._updates = [];
		this._hardupdates = {};
	},

	/**
	 * Collect update candidate. All updates may not be evaluated, see below.
	 * @param {edbml.Update} update
	 * @param {Map<String,boolean>} ids Indexing ID of ancestor elements
	 * @returns {edbml.UpdateCollector}
	 */
	collect: function(update, ids) {
		this._updates.push(update);
		if (update.type === edbml.Update.TYPE_HARD) {
			this._hardupdates[update.id] = true;
		} else {
			update.ids = ids || {};
		}
		return this;
	},

	/**
	 * Will this element be hardupdated?
	 * @param {String} id Element ID
	 * @returns {boolean}
	 */
	hardupdates: function(id) {
		return this._hardupdates[id] ? true : false;
	},

	/**
	 * Apply action to all relevant updates. For example:
	 * An attribute update is not considered relevant if
	 * the parent is scheduled to perform a full replace
	 * of it's children.
	 * @param {function} action
	 */
	eachRelevant: function(action) {
		this._updates.filter(function(update) {
			return (
				update.type === edbml.Update.TYPE_HARD ||
				Object.keys(update.ids).every(function(id) {
					return !this._hardupdates[id];
				}, this)
			);
		}, this).forEach(function(update) {
			action(update);
		});
	},

	/**
	 * TODO: At some point, figure out what exactly to do here.
	 */
	dispose: function() {
		this._hardupdates = null;
		this._updates = null;
	},

	// Private ...................................................................

	/**
	 * Collecting updates.
	 * @type {Array<edbml.Update>}
	 */
	_updates: null,

	/**
	 * Tracking hard-updated element IDs.
	 * @type {Set<String>}
	 */
	_hardupdates: null

});



/**
 * Utilities for the {edbml.UpdateManager}.
 */
edbml.UpdateAssistant = {

	/**
	 * Parse markup to element.
	 * TODO: Use DOMParser versus "text/html" for browsers that support it?
	 * TODO: All sorts of edge cases for IE6 compatibility. Hooray for HTML5.
	 * TODO: Evaluate well-formedness in debug mode for XHTML documents.
	 * @param {String} markup
	 * @param {String} id
	 * @param {Element} element
	 * @returns {Element}
	 */
	parse: function(markup, id, element) { // gonna need to know the parent element type here...
		/*
		 * TODO: run this by the gui.HTMLParser for maximum backwards lameness with TABLE and friends
		 */
		element = document.createElement(element.localName);
		element.innerHTML = markup;
		element.id = id;
		// TODO: Plugin this!
		Array.forEach(element.querySelectorAll("option"), function(option) {
			switch (option.getAttribute("selected")) {
				case "true":
					option.setAttribute("selected", "selected");
					break;
				case "false":
					option.removeAttribute("selected");
					break;
			}
		});
		// TODO: Plugin this!
		var inputs = "input[type=checkbox],input[type=radio]";
		Array.forEach(element.querySelectorAll(inputs), function(option) {
			switch (option.getAttribute("checked")) {
				case "true":
					option.setAttribute("checked", "checked");
					break;
				case "false":
					option.removeAttribute("checked");
					break;
			}
		});
		return element;
	},

	/**
	 * Mapping element id to it's ordinal position.
	 * @returns {Map<String,number>}
	 */
	order: function(nodes) {
		var order = {};
		Array.forEach(nodes, function(node, index) {
			if (node.nodeType === Node.ELEMENT_NODE) {
				order[node.id] = index;
			}
		}, this);
		return order;
	},

	/**
	 * Convert an NodeList into an ID-to-element map.
	 * @param {NodeList} nodes
	 * @return {Map<String,Element>}
	 */
	index: function(nodes) {
		var result = Object.create(null);
		Array.forEach(nodes, function(node, index) {
			if (node.nodeType === Node.ELEMENT_NODE) {
				result[node.id] = node;
			}
		}, this);
		return result;
	}
};



/**
 * It's the update manager.
 * @using {edbml.HardUpdate} HardUpdate
 * @using {edbml.AttsUpdate} AttsUpdate
 * @using {edbml.InsertUpdate} InsertUpdate
 * @using {edbml.RemoveUpdate} RemoveUpdate
 * @using {edbml.AppendUpdate} AppendUpdate
 * @using {edbml.FunctionUpdate} FunctionUpdate
 */
edbml.UpdateManager = (function using(HardUpdate, AttsUpdate, InsertUpdate, RemoveUpdate, AppendUpdate, FunctionUpdate) {

	return gui.Class.create(Object.prototype, {

		/**
		 * @param {gui.Spirit} spirit
		 */
		onconstruct: function(spirit) {
			this._keyid = spirit.dom.id() || spirit.$instanceid;
			this._spirit = spirit;
		},

		/**
		 * Update.
		 * @param {String} html
		 */
		update: function(html) {
			if (!this._spirit.life.destructed) {
				this._updates = new edbml.UpdateCollector();
				this._functions = {};
				if (!this._olddom) {
					this._first(html);
				} else {
					this._next(html);
					this._updates.collect(
						new FunctionUpdate(this._keyid, this._functions)
					);
				}
				this._updates.eachRelevant(function(update) {
					update.update();
					update.dispose();
				});
				if (this._updates) { // huh? how can it be null?
					this._updates.dispose();
				}
				this._updates = null;
			}
		},


		// Private ...................................................................

		/**
		 * This can be one of two:
		 * 1) Spirit element ID (if element has ID).
		 * 2) Spirits $instanceid (if no element ID).
		 * @type {String}
		 */
		_keyid: null,

		/**
		 * Spirit document.
		 * @type {Document}
		 */
		_doc: null,

		/**
		 * Associated spirit.
		 * @type {gui.Spirit}
		 */
		_spirit: null,

		/**
		 * Current DOM subtree.
		 * @type {Document}
		 */
		_olddom: null,

		/**
		 * Incoming DOM subtree.
		 * @type {Document}
		 */
		_nedwdom: null,

		/**
		 * List of updates to apply.
		 * @type {[type]}
		 */
		_updates: null,

		/**
		 * Assistant utilities.
		 * @type {edbml.UpdateAssistant}
		 */
		_assistant: edbml.UpdateAssistant,

		/**
		 * First update (always a hard update).
		 * @param {String} html
		 */
		_first: function(html) {
			this._olddom = this._parse(html);
			this._updates.collect(
				new HardUpdate(this._keyid, this._olddom)
			);
		},

		/**
		 * Next update.
		 * @param {String} html
		 */
		_next: function(html) {
			this._newdom = this._parse(html);
			this._crawl(this._newdom, this._olddom, this._newdom, this._keyid, {});
			this._olddom = this._newdom;
		},

		/**
		 * Parse markup to element.
		 * @param {String} html
		 * @returns {Element}
		 */
		_parse: function(html) {
			return this._assistant.parse(html, this._keyid, this._spirit.element);
		},

		/**
		 * Crawl.
		 * @param {Element} newnode
		 * @param {Element} oldnode
		 * @param {Element} lastnode
		 * @param {String} id
		 * @param {Map<String,boolean>} ids
		 * @returns {boolean}
		 */
		_crawl: function(newchild, oldchild, lastnode, id, ids) {
			var result = true;
			while (newchild && oldchild && !this._updates.hardupdates(id)) {
				switch (newchild.nodeType) {
					case Node.TEXT_NODE:
						result = this._check(newchild, oldchild, lastnode, id, ids);
						break;
					case Node.ELEMENT_NODE:
						result = this._scan(newchild, oldchild, lastnode, id, ids);
						break;
				}
				newchild = newchild.nextSibling;
				oldchild = oldchild.nextSibling;
			}
			return result;
		},

		/**
		 * Scan elements.
		 * @param {Element} newnode
		 * @param {Element} oldnode
		 * @param {Element} lastnode
		 * @param {String} id
		 * @param {Map<String,boolean>} ids
		 * @returns {boolean}
		 */
		_scan: function(newnode, oldnode, lastnode, id, ids) {
			var result = true, oldid = oldnode.id;
			if ((result = this._check(newnode, oldnode, lastnode, id, ids))) {
				if (oldid) {
					ids = gui.Object.copy(ids);
					lastnode = newnode;
					ids[oldid] = true;
					id = oldid;
				}
				result = this._crawl(newnode.firstChild, oldnode.firstChild, lastnode, id, ids);
			}
			return result;
		},

		/**
		 * Hello.
		 * @param {Element} newnode
		 * @param {Element} oldnode
		 * @param {Element} lastnode
		 * @param {String} id
		 * @param {Map<String,boolean>} ids
		 * @returns {boolean}
		 */
		_check: function(newnode, oldnode, lastnode, id, ids) {
			var result = true;
			var isSoftUpdate = false;
			var isPluginUpdate = false; // TODO: plugins...
			if ((newnode && !oldnode) || (!newnode && oldnode)) {
				result = false;
			} else if ((result = newnode.nodeType === oldnode.nodeType)) {
				switch (oldnode.nodeType) {
					case Node.TEXT_NODE:
						if (newnode.data !== oldnode.data) {
							result = false;
						}
						break;
					case Node.ELEMENT_NODE:
						if ((result = this._familiar(newnode, oldnode))) {
							if ((result = this._checkatts(newnode, oldnode, ids))) {
								if (this._maybesoft(newnode, oldnode)) {
									if (this._confirmsoft(newnode, oldnode)) {
										this._updatesoft(newnode, oldnode, ids);
										isSoftUpdate = true; // prevents the replace update
									}
									result = false; // crawling continued in _updatesoft
								} else {
									if (oldnode.localName !== "textarea") { // TODO: better forms support!
										result = newnode.childNodes.length === oldnode.childNodes.length;
										if (!result && oldnode.id) {
											lastnode = newnode;
											id = oldnode.id;
										}
									}
								}
							}
						}
						break;
				}
			}
			if (!result && !isSoftUpdate && !isPluginUpdate) {
				this._updates.collect(new FunctionUpdate(id));
				this._updates.collect(new HardUpdate(id, lastnode));
			}
			return result;
		},

		/**
		 * Roughly estimate whether two elements could be identical.
		 * @param {Element} newnode
		 * @param {Element} oldnode
		 * @returns {boolean}
		 */
		_familiar: function(newnode, oldnode) {
			return ["namespaceURI", "localName"].every(function(prop) {
				return newnode[prop] === oldnode[prop];
			});
		},

		/**
		 * Same id trigges attribute synchronization;
		 * different id triggers hard update of ancestor.
		 * @param {Element} newnode
		 * @param {Element} oldnode
		 * @param {Map<String,boolean>} ids
		 * @returns {boolean} When false, replace "hard" and stop crawling.
		 */
		_checkatts: function(newnode, oldnode, ids) {
			var result = true;
			var update = null;
			if (this._attschanged(newnode.attributes, oldnode.attributes, ids)) {
				var newid = newnode.id;
				var oldid = oldnode.id;
				if (newid && newid === oldid) {
					update = new AttsUpdate(oldid, newnode, oldnode);
					this._updates.collect(update, ids);
				} else {
					result = false;
				}
			}
			return result;
		},

		/**
		 * Attributes changed? When an attribute update is triggered by an EDB poke,
		 * we verify that this was the *only* thing that changed and substitute the
		 * default update with a {FunctionUpdate}.
		 * @see {FunctionUpdate}
		 * @param {NodeList} newatts
		 * @param {NodeList} oldatts
		 * @param {?} ids
		 * @returns {boolean}
		 */
		_attschanged: function(newatts, oldatts, ids) {
			var changed = newatts.length !== oldatts.length;
			if (!changed) {
				changed = !Array.every(newatts, function ischanged(newatt) {
					var oldatt = oldatts.getNamedItem(newatt.name);
					return oldatt && (oldatt.value === newatt.value ||
						this._onlyedbmlchange(newatt.value, oldatt.value));
				}, this);
			}
			return changed;
		},

		/**
		 * Attribute change was an `edbml.$run` or `edbml.$get` statement?
		 * @param {string} newval
		 * @param {string} oldval
		 * @returns {boolean}
		 */
		_onlyedbmlchange: function(newval, oldval) {
			if ([newval, oldval].every(function(val) {
				return val.includes('edbml.$');
			})) {
				var newkey;
				var newkeys = gui.KeyMaster.extractKey(newval);
				var oldkeys = gui.KeyMaster.extractKey(oldval);
				if (newkeys && oldkeys) {
					oldkeys.forEach(function(oldkey, i) {
						newkey = newkeys[i];
						newval = newval.replace(newkey, '');
						oldval = oldval.replace(oldkey, '');
						this._functions[oldkey] = newkey;
					}, this);
					return newval === oldval;
				}
			}
			return false;
		},

		/**
		 * Are element children candidates for "soft" sibling updates?
		 * 1) Both parents must have the same ID
		 * 2) All children must have a specified ID
		 * 3) All children must be elements or whitespace-only textnodes
		 * @param {Element} newnode
		 * @param {Element} oldnode
		 * @return {boolean}
		 */
		_maybesoft: function(newnode, oldnode) {
			if (newnode && oldnode) {
				return newnode.id && newnode.id === oldnode.id &&
					this._maybesoft(newnode) &&
					this._maybesoft(oldnode);
			} else {
				return Array.every(newnode.childNodes, function(node) {
					var res = true;
					switch (node.nodeType) {
						case Node.TEXT_NODE:
							res = node.data.trim() === "";
							break;
						case Node.ELEMENT_NODE:
							res = node.id !== "";
							break;
					}
					return res;
				}, this);
			}
		},

		/**
		 * "soft" siblings can only be inserted and removed. This method verifies that
		 * elements retain their relative positioning before and after an update. Changing
		 * the ordinal position of elements is not supported since this might destruct UI
		 * state (moving eg. an iframe around using DOM methods would reload the iframe).
		 * TODO: Default support ordering and make it opt-out instead?
		 * @param {Element} newnode
		 * @param {Element} oldnode
		 * @returns {boolean}
		 */
		_confirmsoft: function(newnode, oldnode) {
			var res = true,
				prev = null;
			var oldorder = this._assistant.order(oldnode.childNodes);
			return Array.every(newnode.childNodes, function(node, index) {
				if (node.nodeType === Node.ELEMENT_NODE) {
					var id = node.id;
					if (oldorder.hasOwnProperty(id) && oldorder.hasOwnProperty(prev)) {
						res = oldorder[id] > oldorder[prev];
					}
					prev = id;
				}
				return res;
			}, this);
		},

		/**
		 * Update "soft" siblings by adding and removing elements.
		 * @param {Element} newnode
		 * @param {Element} oldnode
		 * @param {Map<String,boolean>} ids
		 * @return {boolean}
		 */
		_updatesoft: function(newnode, oldnode, ids) {
			var updates = [];
			var news = this._assistant.index(newnode.childNodes);
			var olds = this._assistant.index(oldnode.childNodes);
			
			// add elements?
			var child = newnode.lastElementChild,
				topid = oldnode.id,
				oldid = null,
				newid = null;
			while (child) {
				newid = child.id;
				if (!olds[newid]) {
					if (oldid) {
						updates.push(
							new InsertUpdate(oldid, child)
						);
					} else {
						updates.push(
							new AppendUpdate(topid, child)
						);
					}
				} else {
					oldid = newid;
				}
				child = child.previousElementSibling;
			}
			
			// remove elements?
			Object.keys(olds).forEach(function(id) {
				if (!news[id]) {
					updates.push(
						new RemoveUpdate(id)
					);
					updates.push(
						new FunctionUpdate(id)
					);
				} else { // note that crawling continues here...
					var n1 = news[id];
					var n2 = olds[id];
					this._scan(n1, n2, n1, id, ids);
				}
			}, this);

			// register updates
			updates.reverse().forEach(function(update) {
				this._updates.collect(update, ids);
			}, this);
		}

	});

}(
	edbml.HardUpdate,
	edbml.AttsUpdate,
	edbml.InsertUpdate,
	edbml.RemoveUpdate,
	edbml.AppendUpdate,
	edbml.FunctionUpdate
));



/**
 * The ScriptPlugin shall render the spirits HTML.
 * @extends {gui.Plugin}
 * @using {gui.Combo.chained}
 * @using {gui.Arguments.confirmed}
 */
edbml.ScriptPlugin = (function using(chained, confirmed) {

	return gui.Plugin.extend({

		/**
		 * Script has been loaded?
		 * @type {boolean}
		 */
		loaded: false,

		/**
		 * Script has been run? Flipped after first run.
		 * TODO: deprecate and use 'spirit.life.rendered'
		 * @type {boolean}
		 */
		ran: false,

		/**
		 * Log development stuff to console?
		 * @type {boolean}
		 */
		debug: false,

		/**
		 * Construction time.
		 */
		onconstruct: function() {
			gui.Plugin.prototype.onconstruct.call(this);
			this._oldfokkers = {};
			this._newfokkers = {};
		},

		/**
		 * Destruction time.
		 */
		ondestruct: function() {
			gui.Plugin.prototype.ondestruct.call(this);
			if (this.loaded) {
				gui.Tick.cancelFrame(this._frameindex);
				this.spirit.life.remove(gui.LIFE_ENTER, this);
				gui.Broadcast.remove(edb.BROADCAST_ACCESS, this);
				if (this.$input) { // TODO: interface for this (dispose)
					this.$input.ondestruct();
					this.$input.$ondestruct();
				}
			}
		},

		/**
		 * Load EDBML script.
		 * @param {function|String} script
		 * @returns {edb.ScriptPlugin}
		 */
		load: chained(confirmed("function|string")(function(script) {
			script = gui.Type.isFunction(script) ? script : gui.Object.lookup(script);
			if (script) {
				this.loaded = true;
				this._script = script;
				this._updater = new edbml.UpdateManager(this.spirit);
				this._process(script.$instructions);
				if (!this.$input) {
					this.run();
				}
			}
		})),

		/**
		 * Handle input.
		 * @param {edb.Input} input
		 */
		oninput: function(input) {
			if (this.loaded) {
				if (input.revoked) {
					this.write("");
				} else {
					if (!this.$input || this.$input.done) {
						this._schedule();
					}
				}
			} else {
				this._notloaded();
			}
		},

		/**
		 * Run script and write result to DOM (if needed).
		 */
		run: function( /* arguments */ ) {
			gui.Tick.cancelFrame(this._frameindex);
			if (this.loaded) {
				if (!this.$input || this.$input.done) {
					if (this.spirit.life.entered) {
						this.write(this._run.apply(this, arguments));
					} else {
						this.spirit.life.add(gui.LIFE_ENTER, this);
						this._arguments = arguments;
					}
				} else {
					this._notready();
				}
			} else {
				this._notloaded();
			}
		},

		/**
		 * Write the actual HTML to screen. You should probably only
		 * call this method if you are producing your own markup
		 * somehow, ie. not using EDBML templates out of the box.
		 * @param {String} html
		 */
		write: function(html) {
			var changed = this._html !== html;
			var focused = this._focusedfield();
			if (changed) {
				this._html = html;
				this._updater.update(html);
				if(focused) {
					this._restorefocus(focused);
				}
			}
			this._status(this.spirit);
			this.ran = true; // TODO: deprecate and use 'spirit.life.rendered'
		},

		/**
		 * Privately input types(s) using `this.script.input(type)`
		 * @param {edb.Type|Array<edb.Type>}
		 * @returns {edb.Type|Array<edb.Type>}
		 */
		input: function( /*arguments*/ ) {
			var types, input;
			if((input = this.$input)) {
				if (this.loaded) {
					types = gui.Array.make(arguments).map(function(type) {
						input.$oninput(
							new edb.Input(type.constructor, type)
						);
						return type;
					});
					return types.length > 1 ? types : types[0];
				} else {
					this._notloaded();
				}
			} else {
				this._noinputexpected();
			}
		},

		/**
		 * Privately revoke type(s). Accepts instances or constructors. Not tested!
		 */
		revoke: function( /*arguments*/ ) {
			gui.Array.make(arguments).forEach(function(type) {
				var Type = edb.Type.is(type) ? type.constructor : type;
				this.$input.$oninput(
					new edb.Input(Type, null)
				);
			}, this);
		},

		/**
		 * Handle broadcast.
		 * @param {gui.Broadcast} broadcast
		 */
		onbroadcast: function(b) {
			var keys = this._newfokkers;
			switch (b.type) {
				case edb.BROADCAST_ACCESS:
					var type = b.data[0];
					var name = b.data[1];
					var id = type.$instanceid;
					if (!keys[id]) {
						keys[id] = {
							object: type
						};
						if (name) {
							keys[id].properties = {};
						}
					}
					if (name) {
						keys[id].properties[name] = true;
					}
					break;
			}
		},

		/**
		 * Handle change.
		 * @param {Array<edb.Change>} changes
		 */
		onchange: function(changes) {
			if (changes.some(function(c) {
				var id = c.object.$instanceid,
					clas = c.object.$classname,
					name = c.name;
				if(edbml.$rendering && edbml.$rendering[id]) {
						console.error(
						'Don\'t update "' + name + '" of the ' + clas +  ' while ' +
						'rendering, it will cause the rendering to run in an endless loop. '
					);
				} else {
					var props = this._oldfokkers[id].properties;
					try {
						if (!name || props[name]) {
							return true;
						}
					} catch (todoexception) {
						//console.error(this._oldfokkers[id].toString(), name);
						// TODO: fix sceario with selectedIndex................
					}
					return false;
				}
			}, this)) {
				this._schedule();
			}
		},

		/**
		 * Handle life.
		 * @param {gui.Life} life
		 */
		onlife: function(l) {
			if (l.type === gui.LIFE_ENTER) {
				if (!this.spirit.life.rendered) { // spirit did a manual run?
					this.run.apply(this, this._arguments || []);
				}
				this.spirit.life.remove(l.type, this);
				this._arguments = null;
			}
		},


		// Privileged ..............................................................

		/**
		 * Hijacking the {edb.InputPlugin} which has been
		 * designed to work without an associated spirit. 
		 * Accessed by method {edbml#$runtimeconfigure}
		 * @type {edb.InputPlugin}
		 */
		$input: null,


		// Private .................................................................

		/**
		 * Script SRC.
		 * @type {String}
		 */
		_src: null,

		/**
		 * It's a function.
		 * @type {function}
		 */
		_script: null,

		/**
		 * Update manager.
		 * @type {edbml.UpdateManager}
		 */
		_updater: null,

		/**
		 * Tracking what arrays and objects (and what properties) to observe.
		 * @type {Map<String,boolean>}
		 */
		_oldfokkers: null,

		/**
		 * Cache arguments for postponed execution.
		 * @type {Arguments}
		 */
		_arguments: null,

		/**
		 * Snapshot latest HTML to avoid parsing duplicates.
		 * @type {String}
		 */
		_html: null,

		/**
		 * AnimationFrame index.
		 * @type {number}
		 */
		_frameindex: -1,

		/**
		 * Parse processing instructions. Add input listeners in
		 * batch to prevent prematurly getting a `this.$input.done`
		 * @param {Array<object>} pis
		 */
		_process: function(pis) {
			if (pis) {
				var optional = [];
				var required = [];
				if (pis.reduce(function(hasinput, pi) {
					var keys = Object.keys(pi);
					var name = keys[0];
					var atts = pi[name];
					if (name === "input") {
						var list = atts.required === false ? optional : required;
						list.push(gui.Object.lookup(atts.type));
						return true;
					}
					return hasinput;
				}, false)) {
					this.$input = new edb.InputPlugin();
					this.$input.connect(required, this, true);
					this.$input.connect(optional, this, false);
				}
			}
		},

		/**
		 * Start it.
		 */
		_start: function() {
			edbml.$rendering = this._oldfokkers || {};
			gui.Broadcast.add(edb.BROADCAST_ACCESS, this);
			edb.$accessaware = true;
			this._newfokkers = {};
		},

		/**
		 * Stop it.
		 */
		_stop: function() {
			var oldfokkers = this._oldfokkers,
				newfokkers = this._newfokkers;
				edbml.$rendering = null;
			gui.Broadcast.remove(edb.BROADCAST_ACCESS, this);
			edb.$accessaware = false;
			Object.keys(oldfokkers).forEach(function(id) {
				if (!newfokkers[id]) {
					oldfokkers[id].object.removeObserver(this);
					delete oldfokkers[id];
				}
			}, this);
			Object.keys(newfokkers).forEach(function(id) {
				var oldx = oldfokkers[id];
				var newx = newfokkers[id];
				if (oldx) {
					if (newx.properties) {
						oldx.properties = newx.properties;
					}
				} else {
					oldfokkers[id] = newfokkers[id];
					oldfokkers[id].object.addObserver(this);
					delete newfokkers[id];
				}
			}, this);
			this._newfokkers = null;
		},

		/**
		 * Schedule rendering.
		 */
		_schedule: function() {
			gui.Tick.cancelFrame(this._frameindex);
			var spirit = this.spirit;
			var input = this.$input;
			var runnow = function() {
				if (!spirit.life.destructed && (!input || input.done)) {
					this.run();
				}
			}.bind(this);
			if (spirit.life.entered) {
				if (spirit.life.rendered) {
					this._frameindex = gui.Tick.nextFrame(runnow);
				} else {
					runnow();
				}
			} else {
				spirit.life.add(gui.LIFE_ENTER, this);
			}
		},

		/**
		 * @param {gui.Spirit} spirit
		 */
		_status: function(spirit) {
			spirit.life.rendered = true;
			spirit.onrender({ // TODO: some kind of RenderSummary...
				first: !this.ran
			});
			spirit.life.dispatch(gui.LIFE_RENDER);
		},

		/**
		 * Run the script while monitoring edb.Type inspections.
		 * @returns {String}
		 */
		_run: function( /* arguments */ ) {
			this._start();
			var html = this._script.apply(this.spirit, arguments);
			this._stop();
			return html;
		},

		/**
		 * This seems to hotfix a scenario where the script has multiple
		 * (global) inputs defined and you then inject a private input.
		 * This action results in calling `run` immediately without
		 * waiting for the global inputs to be registered. When fixed,
		 * revert back to throwing an error (for manually running a
		 * waiting script).
		 */
		_notready: function() {
			var input = this.$input,
				type;
			(input._watches || []).forEach(function(Type) {
				if ((type = edb.get(Type))) {
					input.$oninput(
						new edb.Input(Type, type)
					);
				}
			}, this);
			/*
			if(gui.debug) {
				// Alert the user when manually running a script that is not ready.
				console.warn ( this.spirit + " can't run (waiting for input)" );
			}
			*/
		},

		/**
		 * Operation failed because no script was loaded.
		 */
		_notloaded: function() {
			console.error('Spiritual EDBML: No script loaded for ' + this.spirit);
		},

		/**
		 * No input expected. 
		 */
		_noinputexpected: function() {
			console.error('Spiritual EDBML: No input expected for ' + this.spirit);
		},

		/**
		 * Focus is inside the spirit? Compute a fitting  CSS selector so that we 
		 * may restore focus if and when the focused field gets replaced. This will 
		 * in given case nuke the undo stack, but you can't both forget to scope 
		 * your input fields (with an ID) and have a pleasent website, so please do.
		 * TODO: warning in debug mode when an ID is missing.
		 * @returns {string}
		 */
		_focusedfield: function() {
			var focused;
			try {
				focused = document.activeElement;
			} catch(ieException) { // Occasional IE failure
				focused = null;
			}
			if(focused && gui.DOMPlugin.contains(this.spirit.element, focused)) {
				return this._focusselector(focused);	
			}
			return null;
		},

		/**
		 * Compute selector for form field. We scope it to
		 * nearest element ID or fallback to document body.
		 * @param {Element} element
		 * @returns {string}
		 */
		_focusselector: function(elm) {
			var index = -1;
			var parts = [];
			function hasid(elm) {
				if (elm.id) {
					try {
						gui.DOMPlugin.q(elm.parentNode, elm.id);
						return true;
					} catch (malformedexception) {}
				}
				return false;
			}
			while (elm && elm.nodeType === Node.ELEMENT_NODE) {
				if (hasid(elm)) {
					parts.push("#" + elm.id);
					elm = null;
				} else {
					if (elm.localName === "body") {
						parts.push("body");
						elm = null;
					} else {
						index = gui.DOMPlugin.ordinal(elm) + 1;
						parts.push(">" + elm.localName + ":nth-child(" + index + ")");
						elm = elm.parentNode;
					}
				}
			}
			return parts.reverse().join("");
		},

		/**
		 * Refocus that form field.
		 * @param {string} selector
		 */
		_restorefocus: function(selector) {
			var texts = 'textarea, input:not([type=checkbox]):not([type=radio])';
			var field = gui.DOMPlugin.qdoc(selector);
			var focus;
			try {
				focus = document.activeElement;
			} catch(ieException) { // Occasional IE failure
				focus = null;
			}
			if(field && field !== focus) { // Occasional IE error
				field.focus();
				if (gui.CSSPlugin.matches(field, texts)) {
					field.setSelectionRange(
						field.value.length,
						field.value.length
					);
				}
			}
		}

	});

}(gui.Combo.chained, gui.Arguments.confirmed));



/**
 * Spirit of the SCRIPT tag that 
 * contains the (compiled) EDBML.
 */
edbml.ScriptSpirit = gui.Spirit.extend({

	/**
	 * Configured via inline HTML (so by Grunt).
	 * @type {string}
	 */
	scriptid: null,

	/**
	 * Load script into parent spirit. This spirit will
	 * automatically destruct when the script executes.
	 */
	onconfigure: function() {
		gui.Spirit.prototype.onconfigure.call(this);
		if (this.dom.embedded()) {
			var id, parent = this.dom.parent(gui.Spirit);
			if (parent && (id = this.scriptid)) {
				parent.script.load(gui.Object.lookup(id));
			}
		}
	}

});



/**
 * Central security service.
 * @using {HTMLDivElement} safeelm
 * @using {Map<string,string>} safemap
 * @using {RegExp} unsafexp
 */
edbml.Security = (function using(safeelm, safemap, unsafexp) {

	return {

		/**
		 * Escape potentially unsafe string for use in HTML element context.
		 * @param {string} string
		 * @returns {string}
		 */
		$safetext: function(string) {
			safeelm.firstChild.data = String(string);
			return safeelm.innerHTML;
		},

		/**
		 * Escape potentially unsafe string for use in HTML attribute context.
		 * TODO(jmo@): This is UNSAFE. We should look into more security stuff.
		 * @see https://www.owasp.org/index.php/XSS_%28Cross_Site_Scripting%29_Prevention_Cheat_Sheet#RULE_.232_-_Attribute_Escape_Before_Inserting_Untrusted_Data_into_HTML_Common_Attributes
		 * @param {string} string
		 * @returns {string}
		 */
		$safeattr: function(string) {
			return String(string).replace(unsafexp, function(c) {
				return safemap[c];
			});
		},
	};


}( // Using ....................................................................

	/*
	 * Creates an element for escaping 
	 * text that goes into HTML markup.
	 */
	(function safeelm() {
		var div = document.createElement('div');
		var txt = document.createTextNode('');
		div.appendChild(txt);
		return div;
	}()),

	/*
	 * Creates a basic (UNSAFE) map for escaping 
	 * text that goes into HTML attribute context. 
	 * We'll need to figure out something better...
	 */
	(function safemap() {
		return {
			'&': '&amp;',
			'<': '&lt;',
			'>': '&gt;',
			'"': '&quot;',
			"'": '&#39;'
		};
	}()),

	/*
	 * (UNSAFE) regular expression to figure out some basic 
	 * entities that should be escaped in HTML attributes.
	 */
	/[&<>'"]/g

));



/*
 * Register module.
 */
gui.module("edbml@wunderbyte.com", {

	/*
	 * Mixin properties and method.
	 */
	mixin: {

		/**
		 * TODO: support accessor and implement as property
		 * @param {String|function} script
		 */
		src: function(script) {
			if (gui.Type.isString(script)) {
				var func = gui.Object.lookup(script);
				if (func) {
					script = func;
				} else {
					throw new Error(this + ' could not locate "' + script + '"');
				}
			}
			if (gui.Type.isFunction(script)) {
				this.script.load(script);
			} else {
				throw new TypeError(this + " could not load script");
			}
		},

		/**
		 * Called whenever the EDBML script was evaluated.
		 * @param {TODOTHING} summary
		 */
		onrender: function(summary) {},

		/**
		 * Handle changes.
		 * @param {Array<edb.ObjectChange|edb.ArrayChange>}
		 */
		onchange: function(changes) {},

		/**
		 * Handle input.
		 * @param {edb.Input} input
		 */
		oninput: function(input) {},

		/**
		 * Handle directed input. Setup to require
		 * the input listener be to be added first.
		 * @see {edb.InputPlugin}
		 * TODO: when to destruct the type?
		 */
		$oninput: function(input) {
			this.script.input.match(input);
		}
	},

	/*
	 * Register plugins for all spirits.
	 */
	plugin: {
		script: edbml.ScriptPlugin
	},

	/*
	 * Channeling spirits to CSS selectors.
	 */
	channel: [
		[".gui-script", "edbml.ScriptSpirit"]
	],

	/**
	 * Setup environment.
	 */
	oncontextinitialize: function() {
		
		/*
		 * Automatically load spirit scripts by naming convention?
		 * ns.MySpirit would automatically load ns.MySpirit.edbml
		 */
		var edbmlscript, basespirit = gui.Spirit.prototype;
		gui.Function.decorateAfter(basespirit, 'onconfigure', function() {
			if (edbml.bootload && !this.script.loaded) {
				edbmlscript = gui.Object.lookup(this.$classname + '.edbml');
				if (gui.Type.isFunction(edbmlscript)) {
					this.script.load(edbmlscript);
				}
			}
		});

		/*
		 * Nasty hack to circumvent that we hardcode "event" into inline poke 
		 * events, this creates an undesired global variable, but fixes an 
		 * exception in the console, at least I think this was the problem.
		 */
		if (!window.event) {
			try {
				window.event = null;
			} catch (ieexception) {}
		}
	}

});



}(self));


(function(window) {

"use strict";


window.ghp = gui.namespace('ghp');



/**
 * Spirit of the link.
 */
ghp.LinkSpirit = gui.Spirit.extend({

	/**
	 * Get ready.
	 */
	onready: function() {
		gui.Spirit.prototype.onready.call(this);
		this.event.add('click');
	},

	/**
	 * Handle event.
	 * @param {Event} e
	 */
	onevent: function(e) {
		gui.Spirit.prototype.onevent.call(this, e);
		if(e.type === 'click') {
			if(this._doaction()) {
				this.action.dispatch('action-load', this.element.href);
				e.preventDefault();
			}
		}
	},


	// Private ...................................................................

	/**
	 * Dispatch action to instigate AJAX loading? 
	 * Fallback to regular loading in dated agent.
	 */
	_doaction: function() {
		return gui.Client.hasHistory && 
				!this.att.get('href').includes('//') && 
				!this._is('#') && !this._is('javascript:');

	},

	/**
	 * HREF starts with that prefix?
	 * @param {string} prefix
	 * @returns {boolean}
	 */
	_is: function(prefix) {
		return this.att.get('href').startsWith(prefix);
	}
});



/**
 * Spirit of the menu toggle button.
 */
ghp.ToggleSpirit = gui.Spirit.extend({
	
	/** 
	 * Injecting some HTML because we 
	 * don't have an icon font around.
	 */
	onconfigure: function() {
		gui.Spirit.prototype.onconfigure.call(this);
		this.script.load(ghp.ToggleSpirit.edbml);
		this.event.add('click');
	},

	/**
	 * Handle event.
	 * @param {Event} e
	 */
	onevent: function(e) {
		gui.Spirit.prototype.onevent.call(this, e);
		if(e.type === 'click') {
			this.action.dispatch('action-toggle');
		}
	},

});


/**
 * Spirit of the BODY element.
 * @using {gui.CSSPlugin}
 */
ghp.PageSpirit = (function using(CSSPlugin) {

	var menumodel;

	return gui.Spirit.extend({

		/**
		 * Get ready.
		 */
		onready: function() {
			gui.Spirit.prototype.onready.call(this);
			this.action.add('action-toggle');
			this.event.add('hashchange', window);
			if(gui.Client.hasHistory) {
				this.event.add('popstate', window);
				this.action.add('action-load');
			}
			this._zzzz();
			this._menu();
			this._done();
		},

		/**
		 * Handle action.
		 * @param {gui.Action} a
		 */
		onaction: function(a) {
			gui.Spirit.prototype.onaction.call(this, a);
			switch(a.type) {
				case 'action-load':
					var href = a.data;
					history.pushState(null, null, href);
					this._load(href);
					a.consume();
					break;
				case 'action-toggle':
					this._togglemenu();
					break;
			}
		},

		/**
		 * Handle event.
		 * @param {Event} e
		 */
		onevent: function(e) {
			gui.Spirit.prototype.onevent.call(this, e);
			switch(e.type) {
				case 'popstate':
					this._load(location.href);
					break;
				case 'hashchange':
					break;
				case 'click':
					if(this.css.contains('menuopen')) {
						var aside = this.dom.q('aside');
						if(!gui.DOMPlugin.contains(aside, e.target)) {
							this._togglemenu();
						}
					}
					break;
			}
		},


		// Private ...................................................................

		/**
		 * Fetch HTML document.
		 * @param {string} href
		 */
		_load: function(href) {
			var path = new gui.URL(document, href).pathname;
			new gui.Request(href).acceptText().get().then(function(status, html) {
				html = gui.HTMLParser.parseToDocument(html);
				this._main(html);
				if(this._xxxx(path)) {
					this._zzzz(html);
					this._menu();
				}
				this._loaded();
			}, this);
		},

		/**
		 * @param {string} path
		 */
		_xxxx: function(path) {
			var section, html = document.documentElement;
			if(path && (section = path.split('/')[1])) {
				if(section !== html.id) {
					html.id = section;
					this._yyyy(section);
					return true;
				}
			}
		},

		/**
		 * @param {string} path
		 */
		_yyyy: function(section) {
			var oldlink = this.dom.qdoc('header .selected');
			var newlink = this.dom.qdoc('header .spiritual-' + section);
			if(oldlink) {
				CSSPlugin.remove(oldlink, 'selected');
			}
			CSSPlugin.add(newlink, 'selected');
		},

		/**
		 * @param @optional {HTMLDocument} html
		 */
		_zzzz: function(html) {
			var nav = (html || document).querySelector('#subnav');
			menumodel = new ghp.MenuModel({
				items: gui.Array.from(nav.children).map(function item(li) {
					var link = li.firstElementChild;
					var menu = li.querySelector('nav');
					return {
						label: link.textContent,
						href: link.getAttribute('href'),
						items : menu ? gui.Array.from(menu.children).map(item) : undefined
					};
				})
			}).output();
		},

		/**
		 * Replace MAIN with new MAIN.
		 * @param {HTMLDocument} html
		 */
		_main: function(html) {
			document.title = html.querySelector('title').textContent;
			var root = document.querySelector('div');
			var main = document.importNode(html.querySelector('main'), true);
			root.replaceChild(main, document.querySelector('main'));
		},

		/**
		 * Finalize page injected.
		 */
		_loaded: function() {
			window.scrollTo(0,0);
			this._menu();
			this._done();
			if(this.css.contains('menuopen')) {
				this.tick.time(function() {
					this._togglemenu();
				}, 500);
			}
		},

		/**
		 * Update menu selection.
		 */
		_menu: function() {
			var page = location.pathname; // .split('/').slice(-1)[0];
			page = page.includes('.html') ? page : page + 'index.html';
			menumodel.select(page);
		},

		/**
		 * Do this after initial load 
		 * and after every AJAX load.
		 */
		_done: function() {
			this._jump();
		},

		/**
		 * Jump to anchor. We do this on a regular basis now 
		 * that Prism might have messed with scroll position.
		 * TODO: Prism is now serverside, this still needed?
		 */
		_jump: function() {
			var elm, hash = location.hash;
			if(hash && (elm = document.querySelector(hash))) {
				elm.scrollIntoView();
			}
		},

		_togglemenu: function() {
			this.css.toggle('menuopen');
			if(this.css.contains('menuopen')) {
				this.tick.time(function() {
					this.event.add('click');	
				});
			} else {
				this.event.remove('click');
			}
		}
	});

}(gui.CSSPlugin));


/**
 * Spirit of the navigation.
 */
ghp.NavSpirit = gui.Spirit.extend({

	/**
	 * This script watches a {ghp.MenuModel} that gets 
	 * outputted by the {ghp.PageSpirit} on page load.
	 */
	onconfigure: function() {
		gui.Spirit.prototype.onconfigure.call(this);
		this.script.load(ghp.NavSpirit.edbml);
	}

});



/**
 * Item model.
 */
ghp.ItemModel = edb.Object.extend({
	selected: false,
	open: false,
	label: null,
	href: null
});

// recursive structure going on
ghp.ItemModel.prototype.items = edb.Array({
	$of: ghp.ItemModel
});


/**
 * Menu model.
 */
ghp.MenuModel = edb.Object.extend({

	/**
	 * @type {edb.Array<ghp.ItemModel>}
	 */
	items: edb.Array({
		$of: ghp.ItemModel
	}),

	/**
	 * Update selection.
	 * @param {string} href
	 */
	select: function(href) {
		this.items.forEach(function(item) {
			item.selected = item.href === href;
			item.open = item.items.reduce(function(was, sub) {
				sub.selected = sub.href === href;
				return was || sub.selected;
			}, false) || (item.selected && item.items.length);
		});
	}
});



/**
 * The module is coming.
 */
gui.module("ghp@wunderbyte.com", {

	oncontextinitialize: function() {
		ghp.spacename(); // TODO: where to automate this?
		gui.debug = location.href.includes('localhost');
	},

	channel: [
		['body', ghp.PageSpirit],
		['a.menu-toggle', ghp.ToggleSpirit],
		['a[href]', ghp.LinkSpirit],
		['#subnav', ghp.NavSpirit]
	]
});



}(self));


// src/edbml/outline/ghp.NavSpirit.edbml
edbml.declare("ghp.NavSpirit.edbml").as(function $edbml(){
  'use strict';
  var out = $edbml.$out,
    $att = $edbml.$att,
    $txt = edbml.safetext,
    $val = edbml.safeattr,
    menu = $edbml.$input(ghp.MenuModel);
  menu.items.forEach(function doitem(item){
    out.html += '<li>';
    $att['id'] = item.$instanceid;
    $att['class'] = item.selected ? 'selected' : null;
    out.html += '<a ' + $att.$('id') + ' ' + $att.$('class') + ' href="' + $val(item.href) + '">' + $txt(item.label) + '</a>';
    if (item.open) {
      out.html += '<nav ' + $att.$('id') + '>';
      item.items.forEach(doitem);
      out.html += '</nav>';
    }
    out.html += '</li>';
  });
  return out.write();
}).withInstructions([{
    input : {
      name : "menu",
      type : "ghp.MenuModel"
    }
  }]);

// src/edbml/outline/ghp.ToggleSpirit.edbml
edbml.declare("ghp.ToggleSpirit.edbml").as(function $edbml(){
  'use strict';
  var out = $edbml.$out;
  out.html += '<span>\u2014</span>' +
              '<span>\u2014</span>' +
              '<span>\u2014</span>';
  return out.write();
});