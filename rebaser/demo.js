/*!
 * VisualEditor rebaser demo
 *
 * @copyright 2011-2016 VisualEditor Team and others; see http://ve.mit-license.org
 */

new ve.init.sa.Platform( ve.messagePaths ).initialize().done( function () {
	var
		$editor = $( '.ve-demo-editor' ),
		// $toolbar = $( '.ve-demo-targetToolbar' ),
		target = new ve.demo.target();

	$editor.append( target.$element );
	target.addSurface( ve.dm.converter.getModelFromDom( ve.createDocumentFromHtml( '' ) ) );
} );
