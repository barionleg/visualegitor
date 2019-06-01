/*!
 * VisualEditor side by side demo
 *
 * @copyright 2011-2019 VisualEditor Team and others; see http://ve.mit-license.org
 */

( function () {
	/* eslint-disable no-jquery/no-global-selector */
	var $firstInstance = $( '.ve-instance' ).eq( 0 ),
		$secondInstance = $( '.ve-instance' ).eq( 1 );

	new ve.init.sa.Platform( ve.messagePaths ).getInitializedPromise()
		.fail( function () {
			$firstInstance.text( 'Sorry, this browser is not supported.' );
		} )
		.done( function () {
			var prism,
				firstTarget = new ve.init.sa.Target(),
				secondTarget = new ve.init.sa.Target();
			prism = new ve.ll.Prism( {
				lang: 'en',
				dir: 'ltr',
				html: '<p><b>Carbon dioxide</b> is a gas at <a href="#rtp">room temperature</a></p>'
			}, {
				lang: 'es',
				dir: 'ltr',
				html: '<p></p>'
			} );
			$firstInstance.append( firstTarget.$element );
			$secondInstance.append( secondTarget.$element );
			firstTarget.clearSurfaces();
			firstTarget.addSurface( prism.firstDoc );
			secondTarget.clearSurfaces();
			secondTarget.addSurface( prism.secondDoc );

		} );
}() );
