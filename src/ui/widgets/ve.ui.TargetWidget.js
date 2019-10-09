/*!
 * VisualEditor UserInterface TargetWidget class.
 *
 * @copyright 2011-2019 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * Creates an ve.ui.TargetWidget object.
 *
 * User must call #initialize after the widget has been attached
 * to the DOM, and also after the document is changed with #setDocument.
 *
 * @class
 * @abstract
 * @extends OO.ui.Widget
 *
 * @constructor
 * @param {Object} [config] Configuration options
 * @cfg {ve.dm.Document} [doc] Initial document model
 * @cfg {Object} [toolbarGroups] Target's toolbar groups config, defaults to the current target's.
 * @cfg {ve.ui.CommandRegistry} [commandRegistry] Command registry to use
 * @cfg {ve.ui.SequenceRegistry} [sequenceRegistry] Sequence registry to use
 * @cfg {ve.ui.DataTransferHandlerFactory} [dataTransferHandlerFactory] Data transfer handler factory to use
 * @cfg {ve.ui.Surface} [parentSurface] Parent surface to inherit registries/factories from, if not specified above
 * @cfg {string[]|null} [includeCommands] List of commands to include, null for all registered commands
 * @cfg {string[]} [excludeCommands] List of commands to exclude
 * @cfg {Object} [importRules] Import rules
 * @cfg {boolean} [multiline] Multi-line surface
 * @cfg {string} [placeholder] Placeholder text to display when the surface is empty
 * @cfg {boolean} [readOnly] Surface is read-only
 * @cfg {string} [inDialog] The name of the dialog this surface widget is in
 */
ve.ui.TargetWidget = function VeUiTargetWidget( config ) {
	var parentSurface;

	// Config initialization
	config = config || {};

	// Parent constructor
	ve.ui.TargetWidget.super.call( this, config );

	parentSurface = config.parentSurface || ( ve.init.target && ve.init.target.getSurface() );

	// Properties
	this.toolbarGroups = config.toolbarGroups || ( ve.init.target && ve.init.target.toolbarGroups );
	this.commandRegistry = config.commandRegistry || ( parentSurface && parentSurface.commandRegistry ) || ve.ui.commandRegistry;
	this.sequenceRegistry = config.sequenceRegistry || ( parentSurface && parentSurface.sequenceRegistry ) || ve.ui.sequenceRegistry;
	this.dataTransferHandlerFactory = config.dataTransferHandlerFactory || ( parentSurface && parentSurface.dataTransferHandlerFactory ) || ve.ui.dataTransferHandlerFactory;
	// TODO: Override document/targetTriggerListener
	this.includeCommands = config.includeCommands;
	this.excludeCommands = config.excludeCommands;
	this.multiline = config.multiline !== false;
	this.placeholder = config.placeholder;
	this.readOnly = config.readOnly;
	this.importRules = config.importRules;
	this.inDialog = config.inDialog;
	// TODO: Support source widgets
	this.mode = 'visual';

	this.target = this.createTarget();

	if ( config.doc ) {
		this.setDocument( config.doc );
	}

	// Initialization
	this.$element.addClass( 've-ui-targetWidget' )
		.append( this.target.$element );
};

/* Inheritance */

OO.inheritClass( ve.ui.TargetWidget, OO.ui.Widget );

/* Methods */

/**
 * The target's surface has been changed.
 *
 * @event change
 */

/**
 * A document has been attached to the target, and a toolbar and surface created.
 *
 * @event setup
 */

/**
 * Create the target for this widget to use
 *
 * @return {ve.init.Target} Target
 */
ve.ui.TargetWidget.prototype.createTarget = function () {
	return new ve.init.Target( {
		register: false,
		toolbarGroups: this.toolbarGroups,
		inTargetWidget: true,
		defaultMode: this.mode
	} );
};

/**
 * Set the document to edit
 *
 * @param {ve.dm.Document} doc Document
 */
ve.ui.TargetWidget.prototype.setDocument = function ( doc ) {
	var surface;
	// Destroy the previous surface
	this.clear();
	surface = this.target.addSurface( doc, {
		mode: this.mode,
		inTargetWidget: true,
		commandRegistry: this.commandRegistry,
		sequenceRegistry: this.sequenceRegistry,
		dataTransferHandlerFactory: this.dataTransferHandlerFactory,
		includeCommands: this.includeCommands,
		excludeCommands: this.excludeCommands,
		importRules: this.importRules,
		multiline: this.multiline,
		placeholder: this.placeholder,
		readOnly: this.readOnly,
		inDialog: this.inDialog
	} );
	this.target.setSurface( surface );

	// Events
	this.getSurface().getModel().connect( this, { history: 'onSurfaceModelHistory' } );
	this.getSurface().getView().connect( this, {
		focus: 'onFocusChange',
		blur: 'onFocusChange'
	} );

	this.emit( 'setup' );
};

/**
 * Handle history events from the surface model.
 *
 * @fires change
 */
ve.ui.TargetWidget.prototype.onSurfaceModelHistory = function () {
	// Rethrow this event so users don't have to re-bind to
	// surface model 'history' when the surface is changed in #setDocument
	this.emit( 'change' );
};

/**
 * Check if the surface has been modified.
 *
 * @return {boolean} The surface has been modified
 */
ve.ui.TargetWidget.prototype.hasBeenModified = function () {
	return !!this.getSurface() && this.getSurface().getModel().hasBeenModified();
};

/**
 * Set the read-only state of the widget
 *
 * @param {boolean} readOnly Make widget read-only
 */
ve.ui.TargetWidget.prototype.setReadOnly = function ( readOnly ) {
	this.readOnly = !!readOnly;
	this.getSurface().setReadOnly( this.readOnly );
	this.$element.toggleClass( 've-ui-targetWidget-readOnly', this.readOnly );
};

/**
 * Check if the widget is read-only
 *
 * @return {boolean}
 */
ve.ui.TargetWidget.prototype.isReadOnly = function () {
	return this.readOnly;
};

/**
 * Get surface.
 *
 * @return {ve.ui.Surface|null} Surface
 */
ve.ui.TargetWidget.prototype.getSurface = function () {
	return this.target.getSurface();
};

/**
 * Get toolbar.
 *
 * @return {OO.ui.Toolbar} Toolbar
 */
ve.ui.TargetWidget.prototype.getToolbar = function () {
	return this.target.getToolbar();
};

/**
 * Get content data.
 *
 * @return {ve.dm.ElementLinearData} Content data
 */
ve.ui.TargetWidget.prototype.getContent = function () {
	return this.getSurface().getModel().getDocument().getData();
};

/**
 * Initialize surface and toolbar.
 *
 * Widget must be attached to DOM before initializing.
 */
ve.ui.TargetWidget.prototype.initialize = function () {
};

/**
 * Destroy surface and toolbar.
 */
ve.ui.TargetWidget.prototype.clear = function () {
	this.target.clearSurfaces();
	// Clear toolbar?
};

/**
 * Handle focus and blur events
 */
ve.ui.TargetWidget.prototype.onFocusChange = function () {
	// Replacement for the :focus pseudo selector one would be able to
	// use on a regular input widget
	this.$element.toggleClass( 've-ui-targetWidget-focused', this.getSurface().getView().isFocused() );
};

/**
 * Focus the surface.
 */
ve.ui.TargetWidget.prototype.focus = function () {
	if ( this.getSurface() ) {
		this.getSurface().getView().focus();
	}
};
