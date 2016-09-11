/*!
 * VisualEditor rebaser demo
 *
 * @copyright 2011-2016 VisualEditor Team and others; see http://ve.mit-license.org
 */

new ve.init.sa.Platform( ve.messagePaths ).initialize().done( function () {
    var $toolbar = $( '.ve-demo-targetToolbar' ),
		$editor = $( '.ve-demo-editor' ),
		target = new ve.demo.target();

    $editor.append( target.$element );
    target.addSurface( ve.dm.converter.getModelFromDom( ve.createDocumentFromHtml( '' ) ) );
} );
