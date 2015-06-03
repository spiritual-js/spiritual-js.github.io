/**
 * Spirit of the navigation.
 */
ghp.NavSpirit = gui.Spirit.extend({

	/**
	 * This script watches a {ghp.MenuModel} that gets 
	 * outputted by the {ghp.PageSpirit} on page load.
	 */
	onconfigure: function() {
		this.super.onconfigure();
		this.script.load(ghp.NavSpirit.edbml);
	}

});
