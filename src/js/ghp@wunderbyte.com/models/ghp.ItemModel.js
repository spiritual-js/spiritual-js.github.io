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