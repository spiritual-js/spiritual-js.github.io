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
			console.log(href, item.href);
			item.selected = item.href === href;
			item.open = item.items.reduce(function(was, sub) {
				sub.selected = sub.href === href;
				return was || sub.selected;
			}, false) || (item.selected && item.items.length);
		});
	}
});
