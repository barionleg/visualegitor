/*!
 * VisualEditor UserInterface LinkAction class.
 *
 * @copyright 2011-2015 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * List action.
 *
 * @class
 * @extends ve.ui.Action
 * @constructor
 * @param {ve.ui.Surface} surface Surface to act on
 */
ve.ui.LinkAction = function VeUiLinkAction( surface ) {
	// Parent constructor
	ve.ui.Action.call( this, surface );
};

/* Inheritance */

OO.inheritClass( ve.ui.LinkAction, ve.ui.Action );

/* Static Properties */

ve.ui.LinkAction.static.name = 'link';

/**
 * RegExp matching an autolink + trailing space.
 * @property {RegExp}
 * @private
 */
ve.ui.LinkAction.static.autolinkRegExp = null; // Initialized below.

/**
 * List of allowed methods for the action.
 *
 * @static
 * @property
 */
ve.ui.LinkAction.static.methods = [ 'autolinkUrl' ];

/* Methods */

/**
 * Autolink the selection (which may have trailing whitespace).
 *
 * @method
 * @return {boolean} Action was executed
 */
ve.ui.LinkAction.prototype.autolinkUrl = function () {
	var range, rangeEnd, linktext,
		surfaceModel = this.surface.getModel(),
		documentModel = surfaceModel.getDocument(),
		selection = surfaceModel.getSelection();

	if ( !( selection instanceof ve.dm.LinearSelection ) ) {
		return false;
	}

	range = selection.getRange();
	rangeEnd = range.end;

	// Shrink range to eliminate trailing whitespace.
	linktext = documentModel.data.getText( true, range ).replace( /\s+$/, '' );
	range = range.truncate( linktext.length );

	// Make sure `undo` doesn't expose the selected linktext.
	surfaceModel.setLinearSelection( new ve.Range( rangeEnd, rangeEnd ) );

	// Annotate the (previous) range.
	surfaceModel.change(
		ve.dm.Transaction.newFromAnnotation(
			documentModel,
			range,
			'set',
			// XXX this should be a ve.dm.MWExternalLinkAnnotation in ve-mw
			// what's the best way to allow this?
			new ve.dm.LinkAnnotation( {
				type: 'link',
				attributes: {
					href: linktext
				}
			} )
		),
		surfaceModel.getSelection()
	);

	return true;
};

/* Registration */

ve.ui.actionFactory.register( ve.ui.LinkAction );

// Delayed initialization (wait until ve.init.platform exists)
ve.init.Platform.static.initializedPromise.then( function () {

	ve.ui.LinkAction.static.autolinkRegExp =
		new RegExp(
			'\\b' + ve.init.platform.getUnanchoredExternalLinkUrlProtocolsRegExp().source + '\\S+(\\s|\\n\\n)$'
		);

	ve.ui.sequenceRegistry.register(
		new ve.ui.Sequence( 'autolinkUrl', 'autolinkUrl', ve.ui.LinkAction.static.autolinkRegExp, 0, true )
	);
} );
