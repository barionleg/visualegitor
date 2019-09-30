/*!
 * VisualEditor UserInterface CompletionWidget class.
 *
 * @copyright 2011-2019 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * Widget that visually displays width and height inputs.
 * This widget is for presentation-only, no calculation is done.
 *
 * @class
 * @extends OO.ui.Widget
 *
 * @constructor
 * @param {ve.ui.Surface} surface Surface to complete into
 * @param {Object} [config] Configuration options
 * @cfg {Object} [defaults] Default dimensions
 * @cfg {Object} [validate] Validation pattern passed to TextInputWidgets
 * @cfg {boolean} [readOnly=false] Prevent changes to the value of the widget.
 */
ve.ui.CompletionWidget = function VeUiCompletionWidget( surface, config ) {
	var $doc = surface.getView().getDocument().getDocumentNode().$element;

	this.surface = surface;
	this.surfaceModel = surface.getModel();

	// Configuration
	config = config || {
		anchor: false
	};

	// Parent constructor
	ve.ui.CompletionWidget.super.call( this, config );

	this.$tabIndexed = this.$element;

	this.menu = new OO.ui.MenuSelectWidget( {
		widget: this,
		$input: $doc,
		width: 'auto'
	} );

	// Events
	this.menu.connect( this, { choose: 'onMenuChoose' } );

	// Setup
	this.$element.addClass( 've-ui-completionWidget' )
		.append(
			this.menu.$element
		);
};

/* Inheritance */

OO.inheritClass( ve.ui.CompletionWidget, OO.ui.Widget );

ve.ui.CompletionWidget.prototype.show = function ( items, callback, trim ) {
	this.suggestions = items.map( function ( suggestion ) {
		return new OO.ui.MenuOptionWidget( { data: suggestion, label: suggestion } );
	} );
	this.trim = trim;
	this.callback = callback;
	this.initialOffset = this.getCursorContext().offset;
	this.update();

	this.surfaceModel.connect( this, { select: 'onModelSelect' } );
};

ve.ui.CompletionWidget.prototype.hide = function () {
	this.menu.toggle( false );
	this.surfaceModel.disconnect( this );
};

ve.ui.CompletionWidget.prototype.update = function () {
	var boundingRect = this.surface.getView().getSelection().getSelectionBoundingRect(),
		direction = this.surface.getDir(),
		style = {
			top: boundingRect.bottom
		},
		context = this.getCursorContext();

	if ( direction === 'rtl' ) {
		style.right = boundingRect.right;
	} else {
		style.left = boundingRect.left;
	}
	this.$element.css( style );

	this.menu
		.clearItems()
		.addItems( this.getSuggestionsForWord( context.word ) );
	if ( this.menu.getItems().length ) {
		this.menu.highlightItem( this.menu.getItems()[ 0 ] );
	}
	this.menu.toggle( true );
};

ve.ui.CompletionWidget.prototype.onMenuChoose = function ( item ) {
	var suggestion = item.getData(),
		fragment = this.surfaceModel.getFragment().expandLinearSelection( 'word' )
			.adjustLinearSelection( -this.trim, 0 )
			.insertContent( suggestion, true );

	if ( this.callback ) {
		fragment = this.callback( suggestion, fragment );
	}
	fragment.collapseToEnd().select();

	this.hide();
};

ve.ui.CompletionWidget.prototype.onModelSelect = function () {
	var context = this.getCursorContext();
	if ( context.atWordbreak || context.offset === this.initialOffset ) {
		this.update();
	} else {
		this.hide();
	}
};

ve.ui.CompletionWidget.prototype.getSuggestionsForWord = function ( partial ) {
	partial = partial.toLowerCase();
	return this.suggestions.filter( function ( item ) {
		var word = item.getData().toLowerCase();
		return word.slice( 0, partial.length ) === partial && word !== partial;
	} );
};

ve.ui.CompletionWidget.prototype.getCursorContext = function () {
	var data, offset, wordRange;

	data = this.surfaceModel.getDocument().data;
	offset = this.surfaceModel.getSelection().getRange();
	if ( !offset.isCollapsed() ) {
		return {};
	}
	offset = offset.end;
	wordRange = data.getWordRange( offset );
	if ( wordRange.start === offset ) {
		return {
			word: offset ? data.getText( false, data.getWordRange( offset - 1 ) ) : '',
			offset: offset
		};
	}
	if ( wordRange.end === offset ) {
		return {
			word: data.getText( false, wordRange ),
			atWordbreak: true,
			offset: offset
		};
	}
	return {};
};
