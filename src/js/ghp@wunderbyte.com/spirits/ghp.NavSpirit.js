/**
 * Spirit of the navigation.
 */
ghp.NavSpirit = gui.Spirit.extend({

	/**
	 * Parse the HTML sitemap into a model-friendly 
	 * JSON structure and inject the {ghp.MenuModel}.
	 */
	onenter: function() {
		this.super.onenter();
		this._menu = this.script.input(new ghp.MenuModel({
			items: this.dom.children().map(function item(li) {
				var link = li.firstElementChild;
				var menu = li.querySelector('nav');
				return {
					label: link.textContent,
					href: link.getAttribute('href'),
					items : menu ? gui.Array.make(menu.children).map(item) : undefined
				};
			})
		}));
	},

	/**
	 * Match selection to document location. Invoked by the {ghp.PageSpirit}.
	 * @param {string} href
	 */
	select: function(href) {
		this._menu.select(href);
	},


	// Private ...................................................................
	
	/**
	 * Menu model.
	 * @type {ghp.MenuModel}
	 */
	_menu: null

});
