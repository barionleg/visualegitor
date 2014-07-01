/**
 * Modeless dialog for inspecting content.
 *
 * @class
 * @extends OO.ui.ProcessDialog
 *
 * @constructor
 * @param {Object} [config] Configuration options
 */
ve.ui.FragmentInspector = function OoUiInspector( manager, config ) {
	// Parent constructor
	ve.ui.FragmentInspector.super.call( this, manager, config );

	// Properties
	this.fragment = null;

	// Initialization
	this.$element.addClass( 've-ui-fragmentInspector' );
};

/* Inheritance */

OO.inheritClass( ve.ui.FragmentInspector, OO.ui.ProcessDialog );

/* Static Properties */

ve.ui.FragmentInspector.static.actions = [
	{
		'action': 'accept',
		'label': 'Done',
		'flags': 'primary'
	}
];

/* Methods */

/**
 * Handle form submit events.
 *
 * @method
 */
ve.ui.FragmentInspector.prototype.onFormSubmit = function () {
	this.close( { 'action': 'accept' } );
};

/**
 * Get the surface fragment the inspector is for.
 *
 * @returns {ve.dm.SurfaceFragment|null} Surface fragment the inspector is for, null if the
 *   inspector is closed
 */
ve.ui.FragmentInspector.prototype.getFragment = function () {
	return this.fragment;
};

/**
 * @inheritdoc
 */
ve.ui.FragmentInspector.prototype.initialize = function () {
	// Parent method
	ve.ui.FragmentInspector.super.prototype.initialize.call( this );

	// Properties
	this.container = new OO.ui.PanelLayout( {
		'$': this.$, 'scrollable': true, 'classes': [ 've-ui-fragmentInspector-container' ]
	} );
	this.form = new OO.ui.FormLayout( {
		'$': this.$, 'classes': [ 've-ui-fragmentInspector-form' ]
	} );

	// Events
	this.form.connect( this, { 'submit': 'onFormSubmit' } );

	// Initialization
	this.frame.$content.addClass( 've-ui-fragmentInspector-content' );
	this.container.$element.append( this.form.$element, this.$otherActions );
	this.$body.append( this.container.$element );
};

/**
 * @inheritdoc
 */
ve.ui.FragmentInspector.prototype.getSetupProcess = function ( data ) {
	data = data || {};
	return ve.ui.FragmentInspector.super.prototype.getSetupProcess.call( this, data )
		.first( function () {
			if ( !( data.fragment instanceof ve.dm.SurfaceFragment ) ) {
				throw new Error( 'Cannot open inspector: opening data must contain a fragment' );
			}
			this.fragment = data.fragment;
		}, this );
};

/**
 * @inheritdoc
 */
ve.ui.FragmentInspector.prototype.getTeardownProcess = function ( data ) {
	return ve.ui.FragmentDialog.super.prototype.getTeardownProcess.apply( this, data )
		.next( function () {
			this.fragment = null;
		}, this );
};

/**
 * @inheritdoc
 */
ve.ui.FragmentInspector.prototype.getReadyProcess = function ( data ) {
	return ve.ui.FragmentInspector.super.prototype.getReadyProcess.call( this, data )
		.first( function () {
			//return OO.ui.Process.static.delay( 200 );
		}, this );
};

/**
 * @inheritdoc
 */
ve.ui.FragmentInspector.prototype.getBodyHeight = function () {
	return this.form.$element.outerHeight() + this.$otherActions.height();
};

/**
 * Set the width of window to fit with contents.
 *
 * @param {number} [min=0] Min height
 * @param {number} [max] Max height (defaults to content's outer width)
 * @chainable
 */
ve.ui.FragmentInspector.prototype.setDimensions = function ( dim ) {
	// Parent method
	ve.ui.FragmentInspector.super.prototype.setDimensions.call( this, dim );
	this.frame.$element.css( 'height', this.$frame.height() );
};
