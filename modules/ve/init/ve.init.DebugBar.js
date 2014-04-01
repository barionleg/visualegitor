/*!
 * VisualEditor DebugBar class.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

/*global alert */

/**
 * Debug bar
 *
 * @class
 *
 * @constructor
 * @param {Object} [config] Configuration options
 */
ve.init.DebugBar = function VeUiDebugBar() {

	this.$element = $( '<div>' ).addClass( 've-init-debugBar' );

	this.$commands = $( '<div>' ).addClass( 've-init-debugBar-commands' );
	this.$dumpLinmod = $( '<td>' ).addClass( 've-init-debugBar-dump-linmod' );
	this.$dumpView = $( '<td>' ).addClass( 've-init-debugBar-dump-view' );
	this.$dumpModel = $( '<td>' ).addClass( 've-init-debugBar-dump-model' );

	this.$dump =
		$( '<table class="ve-init-debugBar-dump">' ).append(
			$( '<thead><th>Linear model</th><th>View tree</th><th>Model tree</th></thead>' ),
			$( '<tbody>' ).append(
				$( '<tr>' ).append(
					this.$dumpLinmod, this.$dumpView, this.$dumpModel
				)
			)
		);

	// Widgets
	this.startTextInput = new OO.ui.TextInputWidget( { 'readOnly': true } );
	this.endTextInput = new OO.ui.TextInputWidget( { 'readOnly': true } );

	this.getRangeButton = new OO.ui.ButtonWidget( { 'label': 'Get range' } );
	this.getRangeChangeToggle = new OO.ui.ToggleButtonWidget( { 'label': 'Get range on change' } );
	this.logRangeButton = new OO.ui.ButtonWidget( { 'label': 'Log to console', 'disabled': true } );
	this.dumpModelButton = new OO.ui.ButtonWidget( { 'label': 'Dump model' } );
	this.dumpModelChangeToggle = new OO.ui.ToggleButtonWidget( { 'label': 'Dump model on change' } );
	this.validateButton = new OO.ui.ButtonWidget( { 'label': 'Validate view and model' } );

	var startLabel = new OO.ui.LabelWidget(
			{ 'label': 'Range', 'input': this.startTextInput }
		),
		endLabel = new OO.ui.LabelWidget(
			{ 'label': '-', 'input': this.endTextInput }
		);

	// Events
	this.getRangeButton.on( 'click', ve.bind( this.onGetRangeButtonClick, this ) );
	this.getRangeChangeToggle.on( 'click', ve.bind( this.onGetRangeChangeToggleClick, this ) );
	this.logRangeButton.on( 'click', ve.bind( this.onLogRangeButtonClick, this ) );
	this.dumpModelButton.on( 'click', ve.bind( this.onDumpModelButtonClick, this ) );
	this.dumpModelChangeToggle.on( 'click', ve.bind( this.onDumpModelChangeToggleClick, this ) );
	this.validateButton.on( 'click', ve.bind( this.onValidateButtonClick, this ) );

	this.$element.append(
		this.$commands.append(
			this.getRangeButton.$element,
			this.getRangeChangeToggle.$element,
			startLabel.$element,
			this.startTextInput.$element,
			endLabel.$element,
			this.endTextInput.$element,
			this.logRangeButton.$element,
			$( this.constructor.static.dividerTemplate ),
			this.dumpModelButton.$element,
			this.dumpModelChangeToggle.$element,
			this.validateButton.$element
		),
		this.$dump
	);

	this.target = null;
};

ve.init.DebugBar.static = {};

/**
 * Divider HTML template
 *
 * @type {string}
 */
ve.init.DebugBar.static.dividerTemplate = '<span class="ve-init-debugBar-commands-divider">&nbsp;</span>';

/**
 * Attach debug bar to a target
 *
 * @param {ve.init.Target} target Target
 */
ve.init.DebugBar.prototype.attachToTarget = function ( target ) {
	this.target = target;
	this.getRangeChangeToggle.emit( 'click' );
	this.dumpModelChangeToggle.emit( 'click' );
};

/**
 * Get target the debug bar is attached to
 *
 * @returns {ve.init.Target|null} Target
 */
ve.init.DebugBar.prototype.getTarget = function () {
	return this.target;
};

/**
 * Handle click events on the get range button
 *
 * @param {jQuery.Evenet} e Event
 */
ve.init.DebugBar.prototype.onGetRangeButtonClick = function () {
	var range = this.getTarget().surface.view.model.getSelection();
	this.startTextInput.setValue( range.start );
	this.endTextInput.setValue( range.end );
	this.logRangeButton.setDisabled( false );
};

/**
 * Handle click events on the get range toggle button
 *
 * @param {jQuery.Evenet} e Event
 */
ve.init.DebugBar.prototype.onGetRangeChangeToggleClick = function () {
	if ( this.getRangeChangeToggle.getValue() ) {
		this.getRangeButton.emit( 'click' );
		this.getTarget().surface.model.on( 'select', ve.bind( this.getRangeButton.emit, this.getRangeButton, 'click' ) );
	} else {
		this.getTarget().surface.model.off( 'select', ve.bind( this.getRangeButton.emit, this.getRangeButton, 'click' ) );
	}
};

/**
 * Handle click events on the log range button
 *
 * @param {jQuery.Evenet} e Event
 */
ve.init.DebugBar.prototype.onLogRangeButtonClick = function () {
	var start = this.startTextInput.getValue(),
		end = this.endTextInput.getValue();
	// TODO: Validate input
	ve.dir( this.getTarget().surface.view.documentView.model.data.slice( start, end ) );
};

/**
 * Handle click events on the dump model button
 *
 * @param {jQuery.Evenet} e Event
 */
ve.init.DebugBar.prototype.onDumpModelButtonClick = function () {
	/*jshint loopfunc:true */
	// linear model dump
	var i, $li, $label, element, text, annotations, getKids,
		target = this.getTarget(),
		$ol = $( '<ol start="0"></ol>' );

	for ( i = 0; i < target.surface.model.documentModel.data.getLength(); i++ ) {
		$li = $( '<li>' );
		$label = $( '<span>' );
		element = target.surface.model.documentModel.data.getData( i );
		if ( element.type ) {
			$label.addClass( 've-init-debugBar-dump-element' );
			text = element.type;
			annotations = element.annotations;
		} else if ( ve.isArray( element ) ){
			$label.addClass( 've-init-debugBar-dump-achar' );
			text = element[0];
			annotations = element[1];
		} else {
			$label.addClass( 've-init-debugBar-dump-char' );
			text = element;
			annotations = undefined;
		}
		$label.html( ( text.match( /\S/ ) ? text : '&nbsp;' ) + ' ' );
		if ( annotations ) {
			$label.append(
				$( '<span>' ).text(
					'[' + target.surface.model.documentModel.store.values( annotations ).map( function ( ann ) {
						return ann.name;
					} ).join( ', ' ) + ']'
				)
			);
		}

		$li.append( $label );
		$ol.append( $li );
	}
	this.$dumpLinmod.html( $ol );

	// tree dump
	getKids = function ( obj ) {
		var $li, i,
			$ol = $( '<ol start="0"></ol>' );
		for ( i = 0; i < obj.children.length; i++ ) {
			$li = $( '<li>' );
			$label = $( '<span>' ).addClass( 've-init-debugBar-dump-element' );
			if ( obj.children[i].length !== undefined ) {
				$li.append(
					$label
						.text( obj.children[i].type )
						.append(
							$( '<span>' ).text( ' (' + obj.children[i].length + ')' )
						)
				);
			} else {
				$li.append( $label.text( obj.children[i].type ) );
			}

			if ( obj.children[i].children ) {
				$li.append( getKids( obj.children[i] ) );
			}

			$ol.append( $li );
		}
		return $ol;
	};
	this.$dumpModel.html(
		getKids( target.surface.model.documentModel.getDocumentNode() )
	);
	this.$dumpView.html(
		getKids( target.surface.view.documentView.getDocumentNode() )
	);
	this.$dump.show();
};

/**
 * Handle click events on the dump model toggle button
 *
 * @param {jQuery.Evenet} e Event
 */
ve.init.DebugBar.prototype.onDumpModelChangeToggleClick = function () {
	if ( this.dumpModelChangeToggle.getValue() ) {
		this.dumpModelButton.emit( 'click' );
		this.getTarget().surface.model.on( 'documentUpdate', ve.bind( this.dumpModelButton.emit, this.dumpModelButton, 'click' ) );
	} else {
		this.getTarget().surface.model.off( 'documentUpdate', ve.bind( this.dumpModelButton.emit, this.dumpModelButton, 'click' ) );
	}
};

/**
 * Handle click events on the validate button
 *
 * @param {jQuery.Evenet} e Event
 */
ve.init.DebugBar.prototype.onValidateButtonClick = function () {
	var failed = false, target = this.getTarget();

	$( '.ve-ce-branchNode' ).each( function ( index, element ) {
		var nodeRange, textModel, textDom,
			$element = $( element ),
			view = $element.data( 'view' );
		if ( view.canContainContent() ) {
			nodeRange = view.model.getRange();
			textModel = target.surface.view.model.getDocument().getText( nodeRange );
			textDom = ve.ce.getDomText( view.$element[0] );
			if ( textModel !== textDom ) {
				failed = true;
				ve.log( 'Inconsistent data', {
					'textModel': textModel,
					'textDom': textDom,
					'element': element
				} );
			}
		}
	} );
	if ( failed ) {
		alert( 'Not valid - check JS console for details' );
	} else {
		alert( 'Valid' );
	}
};
