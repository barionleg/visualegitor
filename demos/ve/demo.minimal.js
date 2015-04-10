/*!
 * VisualEditor minimal demo
 *
 * @copyright 2011-2015 VisualEditor Team and others; see http://ve.mit-license.org
 */

ve.init.platform.addMessagePath( 've/i18n/' );
ve.init.platform.addMessagePath( 've/lib/oojs-ui/i18n/' );

ve.init.platform.initialize().done( function () {
	var target = new ve.init.sa.Target();
	target.addSurface(
		ve.dm.converter.getModelFromDom(
			ve.createDocumentFromHtml( '<p><b>Hello,</b> <i>World!</i></p>' ),
			null,
			false,
			'en',
			'ltr'
		)
	);
	$( '.ve-instance' ).append( target.$element );

	$( '.convert' ).on( 'click', function () {
		$( '.html' ).val( target.getSurface().getHtml() );
	} );

} );
