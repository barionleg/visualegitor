/*!
 * VisualEditor Object freeze utilities.
 *
 * @copyright 2011-2018 VisualEditor Team and others; see http://ve.mit-license.org
 */

( function () {
	var freezeProxyHandler = {
		set: function ( obj, name ) {
			throw new Error( 'Object is frozen, can\'t set property: ' + name );
		}
	};

	/**
	 * Deep freeze an object, making it immutable
	 *
	 * @param {Object} object Object to freeze
	 * @param {boolean} [onlyProperties] Only freeze properties (or array items)
	 * @return {Object} The original object, now frozen
	 */
	ve.deepFreeze = function ( object, onlyProperties ) {
		var name, value;

		for ( name in object ) {
			if ( Object.prototype.hasOwnProperty.call( object, name ) ) {
				value = object[ name ];
				try {
					object[ name ] = value && typeof value === 'object' ? ve.deepFreeze( value ) : value;
				} catch ( e ) {
					// Object may have been frozen already
				}
			}
		}

		if ( !onlyProperties ) {
			if ( window.Proxy ) {
				object = new window.Proxy( object, freezeProxyHandler );
			}

			Object.freeze( object );
		}

		return object;
	};
}() );
