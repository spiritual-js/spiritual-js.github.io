/**
 * Spirit of the BODY element.
 */
ghp.PageSpirit = (function() {

	var menumodel;

	return gui.Spirit.extend({

		/**
		 * Get ready.
		 */
		onready: function() {
			this.super.onready();
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
			this.super.onaction(a);
			switch(a.type) {
				case 'action-load':
					var href = a.data;
					history.pushState(null, null, href);
					this._load(href);
					a.consume();
					break;
			}
		},

		/**
		 * Handle event.
		 * @param {Event} e
		 */
		onevent: function(e) {
			this.super.onevent(e);
			switch(e.type) {
				case 'popstate':
					this._load(location.href);
					break;
				case 'hashchange':
					break;
			}
		},


		// Private ...................................................................

		/**
		 * Fetch HTML document.
		 * @param {string} href
		 */
		_load: function(href) {
			var html, path = new gui.URL(document, href).pathname;
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
					return true;

				}
			}
		},

		/**
		 * @param @optional {HTMLDocument} html
		 */
		_zzzz: function(html) {
			var nav = (html || document).querySelector('#nav');
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
		}
		
	});

}());