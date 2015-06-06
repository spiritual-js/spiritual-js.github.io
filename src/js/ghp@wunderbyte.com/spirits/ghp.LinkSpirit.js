/**
 * Spirit of the link.
 */
ghp.LinkSpirit = gui.Spirit.extend({

	/**
	 * Get ready.
	 */
	onready: function() {
		this.super.onready();
		this.event.add('click');
	},

	/**
	 * Handle event.
	 * @param {Event} e
	 */
	onevent: function(e) {
		this.super.onevent(e);
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
