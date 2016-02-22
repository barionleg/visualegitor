/*!
 * VisualEditor LinkContextItem class.
 *
 * @copyright 2011-2018 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * Context item for a link.
 *
 * @class
 * @extends ve.ui.AnnotationContextItem
 *
 * @param {ve.ui.Context} context Context item is in
 * @param {ve.dm.Model} model Model item is related to
 * @param {Object} config Configuration options
 */
ve.ui.LinkContextItem = function VeUiLinkContextItem( context, model, config ) {
	// Parent constructor
	ve.ui.LinkContextItem.super.call( this, context, model, config );

	// Initialization
	this.$element.addClass( 've-ui-linkContextItem' );

	this.labelPreview = new OO.ui.LabelWidget();

	this.labelLayout = new OO.ui.HorizontalLayout( {
		items: [
			new OO.ui.IconWidget( { icon: 'quotes' } ),
			new OO.ui.LabelWidget( { label: OO.ui.deferMsg( 'visualeditor-linkcontext-label-label' ) } ),
			this.labelPreview,
			new OO.ui.ButtonWidget( {
				label: OO.ui.deferMsg( 'visualeditor-linkcontext-label-change' ),
				framed: false,
				flags: [ 'progressive' ]
			} ).connect( this, { click: 'onLabelButtonClick' } )
		]
	} );
};

/* Inheritance */

OO.inheritClass( ve.ui.LinkContextItem, ve.ui.AnnotationContextItem );

/* Static Properties */

ve.ui.LinkContextItem.static.name = 'link';

ve.ui.LinkContextItem.static.icon = 'link';

ve.ui.LinkContextItem.static.label = OO.ui.deferMsg( 'visualeditor-linkinspector-title' );

ve.ui.LinkContextItem.static.modelClasses = [ ve.dm.LinkAnnotation ];

ve.ui.LinkContextItem.static.embeddable = false;

ve.ui.LinkContextItem.static.commandName = 'link';

ve.ui.LinkContextItem.static.clearable = true;

/* Methods */

/**
 * @inheritdoc
 */
ve.ui.LinkContextItem.prototype.getDescription = function () {
	return this.model.getHref();
};

/**
 * @inheritdoc
 */
ve.ui.LinkContextItem.prototype.renderBody = function () {
	var htmlDoc = this.context.getSurface().getModel().getDocument().getHtmlDocument();
	this.$body.empty().append(
		$( '<a>' )
			.text( this.getDescription() )
			.attr( {
				href: ve.resolveUrl( this.model.getHref(), htmlDoc ),
				target: '_blank',
				rel: 'noopener'
			} ),
		this.labelLayout.$element
	);
	this.labelPreview.setLabel( this.context.getSurface().getView().activeLink.innerText.trim() || ve.msg( 'visualeditor-linkcontext-label-fallback' ) );
};

/**
 * Handle label-edit button click events.
 *
 * @localdoc Selects the contents of the link annotation
 *
 * @protected
 */
ve.ui.LinkContextItem.prototype.onLabelButtonClick = function () {
	// We need the DOM node associated with the focused link, and we have the
	// model. This is a difficult direction to travel. As such, we get the
	// focused node, which should be the link or the text node within the
	// link, and we get the closest a tag to it.
	var surface = this.context.getSurface().getView(),
		state = surface.getSelectionState( surface.selection.model.range );
	surface.selectNodeContents( $( state.focusNode ).closest( 'a' )[ 0 ] );
};

/* Registration */

ve.ui.contextItemFactory.register( ve.ui.LinkContextItem );
