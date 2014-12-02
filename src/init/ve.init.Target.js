/*!
 * VisualEditor Initialization Target class.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * Generic Initialization target.
 *
 * @class
 * @abstract
 * @mixins OO.EventEmitter
 * @mixins ve.TriggerListener
 *
 * @constructor
 * @param {jQuery} $container Container to render target into, must be attached to the DOM
 * @param {Object} toolbarConfig Configuration options for the toolbar
 * @throws {Error} Container must be attached to the DOM
 */
ve.init.Target = function VeInitTarget( $container, toolbarConfig ) {
	if ( !$.contains( $container[0].ownerDocument, $container[0] ) ) {
		throw new Error( 'Container must be attached to the DOM' );
	}

	// Mixin constructors
	OO.EventEmitter.call( this );
	ve.TriggerListener.call( this, this.constructor.static.targetCommands );

	// Properties
	this.$element = $container;
	this.elementDocument = this.$element[0].ownerDocument;
	this.surfaces = [];
	this.surface = null;
	this.toolbarConfig = toolbarConfig;

	// Initialization
	this.$element.addClass( 've-init-target' );

	if ( ve.init.platform.constructor.static.isInternetExplorer() ) {
		this.$element.addClass( 've-init-target-ie' );
	}

	// Events
	$( this.elementDocument ).on( 'keydown', this.onDocumentKeyDown.bind( this ) );

	// Register
	ve.init.target = this;
};

/**
 * Destroy the target
 */
ve.init.Target.prototype.destroy = function () {
	while ( this.surfaces.length ) {
		this.surfaces.pop().destroy();
	}
	if ( this.toolbar ) {
		this.toolbar.destroy();
		this.toolbar = null;
	}
	if ( this.$element ) {
		this.$element.remove();
		this.$element = null;
	}
	ve.init.target = null;
};

/* Events */

/**
 * Fired when the #surface is ready.
 *
 * By default the surface's document is not focused. If the target wants
 * the browsers' focus to be in the surface (ready for typing and cursoring)
 * call `surface.getView().focus()` in a handler for this event.
 *
 * @event surfaceReady
 */

/* Inheritance */

OO.mixinClass( ve.init.Target, OO.EventEmitter );

OO.mixinClass( ve.init.Target, ve.TriggerListener );

/* Static Properties */

ve.init.Target.static.toolbarGroups = [
	// History
	{
		header: OO.ui.deferMsg( 'visualeditor-toolbar-history' ),
		include: [ 'undo', 'redo' ]
	},
	// Format
	{
		header: OO.ui.deferMsg( 'visualeditor-toolbar-paragraph-format' ),
		type: 'menu',
		indicator: 'down',
		title: OO.ui.deferMsg( 'visualeditor-toolbar-format-tooltip' ),
		include: [ { group: 'format' } ],
		promote: [ 'paragraph' ],
		demote: [ 'preformatted', 'blockquote' ]
	},
	// Basic style
	{
		header: OO.ui.deferMsg( 'visualeditor-toolbar-text-style' ),
		title: OO.ui.deferMsg( 'visualeditor-toolbar-style-tooltip' ),
		include: [ 'bold', 'italic' ]
	},
	// Style
	{
		header: OO.ui.deferMsg( 'visualeditor-toolbar-text-style' ),
		type: 'list',
		indicator: 'down',
		icon: 'text-style',
		title: OO.ui.deferMsg( 'visualeditor-toolbar-style-tooltip' ),
		include: [ { group: 'textStyle' }, 'language', 'clear' ],
		demote: [ 'strikethrough', 'code', 'underline', 'language', 'clear' ]
	},
	// Link
	{
		header: OO.ui.deferMsg( 'visualeditor-linkinspector-title' ),
		include: [ 'link' ]
	},
	// Structure
	{
		header: OO.ui.deferMsg( 'visualeditor-toolbar-structure' ),
		type: 'list',
		icon: 'bullet-list',
		indicator: 'down',
		include: [ { group: 'structure' } ],
		demote: [ 'outdent', 'indent' ]
	},
	// Insert
	{
		header: OO.ui.deferMsg( 'visualeditor-toolbar-insert' ),
		type: 'list',
		icon: 'insert',
		label: '',
		title: OO.ui.deferMsg( 'visualeditor-toolbar-insert' ),
		indicator: 'down',
		include: '*',
		demote: [ 'specialcharacter' ]
	},
	// Table
	{
		header: OO.ui.deferMsg( 'visualeditor-toolbar-table' ),
		type: 'list',
		icon: 'table-insert',
		indicator: 'down',
		include: [ { group: 'table' } ],
		demote: [ 'deleteTable' ]
	}
];

ve.init.Target.static.targetCommands = ['commandHelp'];

ve.init.Target.static.excludeCommands = [];

/**
 * Surface import rules
 *
 * One set for external (non-VE) paste sources and one for all paste sources.
 *
 * @see ve.dm.ElementLinearData#sanitize
 * @type {Object}
 */
ve.init.Target.static.importRules = {
	external: {
		blacklist: [
			// Annotations
			// TODO: allow spans
			'textStyle/span',
			// Nodes
			'alienInline', 'alienBlock', 'comment'
		]
	},
	all: null
};

/* Methods */

/**
 * Handle key down events on the document
 *
 * @param {jQuery.Event} e Key down event
 */
ve.init.Target.prototype.onDocumentKeyDown = function ( e ) {
	var command, trigger = new ve.ui.Trigger( e );
	if ( trigger.isComplete() ) {
		command = this.getCommandByTrigger( trigger.toString() );
		if ( command && command.execute( this.getSurface() ) ) {
			e.preventDefault();
		}
	}
};

/**
 * Create a surface.
 *
 * @method
 * @param {ve.dm.Document} dmDoc Document model
 * @param {Object} [config] Configuration options
 * @returns {ve.ui.Surface}
 */
ve.init.Target.prototype.createSurface = function ( dmDoc, config ) {
	config = ve.extendObject( {
		excludeCommands: OO.simpleArrayUnion(
			this.constructor.static.excludeCommands,
			this.constructor.static.targetCommands
		),
		importRules: this.constructor.static.importRules
	}, config );
	return new ve.ui.DesktopSurface( dmDoc, config );
};

/**
 * Add a surface to the target
 *
 * @param {ve.dm.Document} dmDoc Document model
 * @param {Object} [config] Configuration options
 * @returns {ve.ui.Surface}
 */
ve.init.Target.prototype.addSurface = function ( dmDoc, config ) {
	var surface = this.createSurface( dmDoc, config );
	this.surfaces.push( surface );
	surface.getView().connect( this, { focus: this.onSurfaceViewFocus.bind( this, surface ) } );
	return surface;
};

/**
 * Handle focus events from a surface's view
 *
 * @param {ve.ui.Surface} surface Surface firing the event
 */
ve.init.Target.prototype.onSurfaceViewFocus = function ( surface ) {
	this.setSurface( surface );
};

/**
 * Set the target's active surface
 *
 * @param {ve.ui.Surface} surface Surface
 */
ve.init.Target.prototype.setSurface = function ( surface ) {
	if ( surface !== this.surface ) {
		this.surface = surface;
		this.setupToolbar( surface );
	}
};

/**
 * Get the target's active surface
 *
 * @return {ve.ui.Surface} Surface
 */
ve.init.Target.prototype.getSurface = function () {
	return this.surface;
};

/**
 * Get the target's toolbar
 *
 * @return {ve.ui.TargetToolbar} Toolbar
 */
ve.init.Target.prototype.getToolbar = function () {
	if ( !this.toolbar ) {
		this.toolbar = new ve.ui.TargetToolbar( this, this.toolbarConfig );
	}
	return this.toolbar;
};

/**
 * Set up the toolbar, attaching it to a surface.
 *
 * @param {ve.ui.Surface} surface Surface
 */
ve.init.Target.prototype.setupToolbar = function ( surface ) {
	this.getToolbar().setup( this.constructor.static.toolbarGroups, surface );
	this.getToolbar().$element.insertBefore( surface.$element );
};
