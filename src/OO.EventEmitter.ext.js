/*!
 * VisualEditor extensions to OO.EventEmitter class.
 *
 * @copyright 2011-2019 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * Emit an event, swallowing exceptions in listeners.
 *
 * This differs from plain OO.EventEmitter#emit in that exceptions thrown in
 * listeners do not propagate out of this function and back to the caller.
 *
 * All listeners for the event will be called synchronously, in an
 * unspecified order. If any listeners throw an exception, this won't
 * disrupt the calls to the remaining listeners; however, the exception
 * won't be raised until the next tick.
 *
 * Listeners should avoid mutating the emitting object, as this is something
 * of an anti-pattern which can easily result in hard-to-understand code
 * with hidden side-effects and dependencies.
 *
 * @param {string} event Type of event
 * @param {...Mixed} args First in a list of variadic arguments
 *  passed to event handler (optional)
 * @return {boolean} Whether the event was handled by at least one listener
 */
OO.EventEmitter.prototype.emit = function ( event ) {
	var args = [],
		i, len, binding, bindings, method;

	if ( Object.prototype.hasOwnProperty.call( this.bindings, event ) ) {
		// Slicing ensures that we don't get tripped up by event
		// handlers that add/remove bindings
		bindings = this.bindings[ event ].slice();
		for ( i = 1, len = arguments.length; i < len; i++ ) {
			args.push( arguments[ i ] );
		}
		for ( i = 0, len = bindings.length; i < len; i++ ) {
			binding = bindings[ i ];
			if ( typeof binding.method === 'string' ) {
				// Lookup method by name (late binding)
				method = binding.context[ binding.method ];
			} else {
				method = binding.method;
			}
			if ( binding.once ) {
				// Must unbind before calling method to avoid
				// any nested triggers.
				this.off( event, method );
			}
			try {
				method.apply(
					binding.context,
					binding.args ? binding.args.concat( args ) : args
				);
			} catch ( e ) {
				// If one listener has an unhandled error, don't have it take down everything.
				setTimeout( function () {
					// Don't silently swallow the error, to avoid a debugging nightmare.
					throw e;
				} );
			}

		}
		return true;
	}
	return false;
};
