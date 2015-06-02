/**
 * Spirit of the BODY element.
 */
ghp.PageSpirit = gui.Spirit.extend({

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
				//this._menu();
				break;
		}
	},


	// Private ...................................................................

	/**
	 * Fetch HTML document.
	 * @param {string} href
	 */
	_load: function(href) {
		new gui.Request(href).acceptText().get().then(function(status, html) {
			this._main(gui.HTMLParser.parseToDocument(html));
			this._loaded();
		}, this);
	},

	/**
	 * Replace MAIN with new MAIN.
	 * @param {HTMLDocument} html
	 */
	_main: function(html) {
		document.title = html.querySelector('title').textContent;
		var main = document.importNode(html.querySelector('main'), true);
		document.body.replaceChild(main, document.querySelector('main'));
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
		var page = location.pathname.split('/').slice(-1)[0];
		page = page.contains('.html') ? page : 'index.html';
		gui.get('#nav').select(page);
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
	 */
	_jump: function() {
		var elm, hash = location.hash;
		if(hash && (elm = document.querySelector(hash))) {
			elm.scrollIntoView();
		}
	}
	
});
