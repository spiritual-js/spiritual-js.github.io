/**
 * Spirit of the menu toggle button.
 */
ghp.ToggleSpirit = gui.Spirit.extend({
	
	/** 
	 * Injecting some HTML because we 
	 * don't have an icon font around.
	 */
	onconfigure: function() {
		this.super.onconfigure();
		this.script.load(ghp.ToggleSpirit.edbml);
		this.event.add('click');
	},

	/**
	 * Handle event.
	 * @param {Event} e
	 */
	onevent: function(e) {
		this.super.onevent(e);
		if(e.type === 'click') {
			this.action.dispatch('action-toggle');
		}
	},

});