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
