/**
 * The module is coming.
 */
gui.module("ghp@wunderbyte.com", {

	oncontextinitialize: function() {
		ghp.spacename(); // TODO: where to automate this?
		gui.debug = location.href.contains('localhost');
	},

	channel: [
		['a[href]', ghp.LinkSpirit],
		['body', ghp.PageSpirit],
		['#nav', ghp.NavSpirit]
	]
});
