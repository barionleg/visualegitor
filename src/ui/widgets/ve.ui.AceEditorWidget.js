/*!
 * VisualEditor UserInterface AceEditorWidget class.
 *
 * @copyright 2011-2016 VisualEditor Team and others; see http://ve.mit-license.org
 */

/* global ace */

/**
 * Text input widget which uses an Ace editor instance when available
 *
 * For the most part this can be treated just like a TextInputWidget with
 * a few extra considerations:
 *
 * - For performance it is recommended to destroy the editor when
 *   you are finished with it, using #teardown. If you need to use
 *   the widget again let the editor can be restored with #setup.
 * - After setting an initial value the undo stack can be reset
 *   using clearUndoStack so that you can't undo past the initial
 *   state.
 *
 * @class
 * @extends ve.ui.WhitespacePreservingTextInputWidget
 *
 * @constructor
 * @param {Object} [config] Configuration options
 * @cfg {string} [autocomplete='none'] Symbolic name of autocomplete
 * mode: 'none', 'basic' (requires the user to press Ctrl-Space) or
 * 'live' (shows a list of suggestions as the user types)
 * @cfg {Array} [autocompleteWordList=null] List of words to
 * autocomplete to
 */
ve.ui.AceEditorWidget = function VeUiAceEditorWidget( config ) {
	// Configuration
	config = config || {};

	this.autocomplete = config.autocomplete || 'none';
	this.autocompleteWordList = config.autocompleteWordList || null;

	this.$ace = $( '<div dir="ltr">' );
	this.editor = null;
	// Initialise to a rejected promise for the setValue call in the parent constructor
	this.loadingPromise = $.Deferred().reject().promise();
	this.styleHeight = null;

	// Parent constructor
	ve.ui.AceEditorWidget.super.call( this, config );

	// Clear the fake loading promise and setup properly
	this.loadingPromise = null;
	this.setup();

	this.$element
		.append( this.$ace )
		.addClass( 've-ui-aceEditorWidget' );
};

/* Inheritance */

OO.inheritClass( ve.ui.AceEditorWidget, ve.ui.WhitespacePreservingTextInputWidget );

/* Events */

/**
 * The editor has resized
 * @event resize
 */

/* Methods */

/**
 * Setup the Ace editor instance
 */
ve.ui.AceEditorWidget.prototype.setup = function () {
	if ( !this.loadingPromise ) {
		this.loadingPromise = mw.loader.getState( 'ext.codeEditor.ace' ) ?
			mw.loader.using( 'ext.codeEditor.ace' ) :
			$.Deferred().reject().promise();
		// Resolved promises will run synchronously, so ensure #setupEditor
		// runs after this.loadingPromise is stored.
		this.loadingPromise.done( this.setupEditor.bind( this ) );
	}
};

/**
 * Destroy the Ace editor instance
 */
ve.ui.AceEditorWidget.prototype.teardown = function () {
	var widget = this;
	this.loadingPromise.done( function () {
		widget.$input.removeClass( 'oo-ui-element-hidden' );
		widget.editor.destroy();
		widget.editor = null;
	} ).always( function () {
		widget.loadingPromise = null;
	} );
};

/**
 * Setup the Ace editor
 *
 * @fires resize
 */
ve.ui.AceEditorWidget.prototype.setupEditor = function () {
	var basePath = mw.config.get( 'wgExtensionAssetsPath', '' );
	if ( basePath.slice( 0, 2 ) === '//' ) {
		// ACE uses web workers, which have importScripts, which don't like relative links.
		basePath = window.location.protocol + basePath;
	}
	ace.config.set( 'basePath', basePath + '/CodeEditor/modules/ace' );

	this.$input.addClass( 'oo-ui-element-hidden' );
	this.editor = ace.edit( this.$ace[ 0 ] );
	this.setMinRows( this.minRows );
	this.editor.setOptions( {
		enableBasicAutocompletion: this.autocomplete !== 'none',
		enableLiveAutocompletion: this.autocomplete === 'live'
	} );
	this.editor.getSession().on( 'change', this.onEditorChange.bind( this ) );
	this.editor.renderer.on( 'resize', this.onEditorResize.bind( this ) );
	this.setEditorValue( this.getValue() );
	this.editor.resize();
};

/**
 * Set the autocomplete property
 *
 * @param {string} mode Symbolic name of autocomplete mode
 * @chainable
 * @return {VeUiAceEditorWidget}
 */
ve.ui.AceEditorWidget.prototype.setAutocomplete = function ( mode ) {
	var widget = this;
	this.autocomplete = mode;
	this.loadingPromise.done( function () {
		widget.editor.renderer.setOptions( {
			enableBasicAutocompletion: widget.autocomplete !== 'none',
			enableLiveAutocompletion: widget.autocomplete === 'live'
		} );
	} );
	return this;
};

/**
 * @inheritdoc
 */
ve.ui.AceEditorWidget.prototype.setValue = function ( value ) {
	// Always do something synchronously so that getValue can be used immediately.
	// setEditorValue is called once when the loadingPromise resolves in setupEditor.
	if ( this.loadingPromise.state() === 'resolved' ) {
		this.setEditorValue( value );
	} else {
		ve.ui.AceEditorWidget.super.prototype.setValue.call( this, value );
	}
	return this;
};

/**
 * Set the value of the Ace editor widget
 *
 * @param {string} value Value
 */
ve.ui.AceEditorWidget.prototype.setEditorValue = function ( value ) {
	var selectionState;
	if ( value !== this.editor.getValue() ) {
		selectionState = this.editor.session.selection.toJSON();
		this.editor.setValue( value );
		this.editor.session.selection.fromJSON( selectionState );
	}
};

/**
 * Set the minimum number of rows in the Ace editor widget
 *
 * @param {number} minRows The minimum number of rows
 */
ve.ui.AceEditorWidget.prototype.setMinRows = function ( minRows ) {
	var widget = this;
	this.minRows = minRows;
	this.loadingPromise.done( function () {
		widget.editor.setOptions( {
			minLines: widget.minRows || 3,
			maxLines: widget.autosize ? widget.maxRows : widget.minRows || 3
		} );
	} );
	// TODO: Implement minRows setter for OO.ui.TextInputWidget
	// and call it here in loadingPromise.fail
};

/**
 * @inheritdoc
 */
ve.ui.AceEditorWidget.prototype.getRange = function () {
	var selection, range, lines, start, end, isBackwards;

	function posToOffset( row, col ) {
		var r, offset = 0;

		for ( r = 0; r < row; r++ ) {
			offset += lines[ r ].length;
			offset++; // for the newline character
		}
		return offset + col;
	}

	if ( this.editor ) {
		lines = this.editor.getSession().getDocument().getAllLines();

		selection = this.editor.getSelection();
		isBackwards = selection.isBackwards();
		range = selection.getRange();
		start = posToOffset( range.start.row, range.start.column );
		end = posToOffset( range.end.row, range.end.column );

		return {
			from: isBackwards ? end : start,
			to: isBackwards ? start : end
		};
	} else {
		return ve.ui.AceEditorWidget.super.prototype.getRange.call( this );
	}
};

/**
 * @inheritdoc
 */
ve.ui.AceEditorWidget.prototype.selectRange = function ( from, to ) {
	var widget = this;
	this.focus();
	this.loadingPromise.done( function () {
		var fromOffset, toOffset, selection, range,
			doc = widget.editor.getSession().getDocument(),
			lines = doc.getAllLines();

		to = to || from;

		function offsetToPos( offset ) {
			var row = 0,
				col = 0,
				pos = 0;

			while ( row < lines.length && pos + lines[ row ].length < offset ) {
				pos += lines[ row ].length;
				pos++; // for the newline character
				row++;
			}
			col = offset - pos;
			return { row: row, column: col };
		}

		fromOffset = offsetToPos( from );
		toOffset = offsetToPos( to );

		selection = widget.editor.getSelection();
		range = selection.getRange();
		range.setStart( fromOffset.row, fromOffset.column );
		range.setEnd( toOffset.row, toOffset.column );
		selection.setSelectionRange( range );
	} ).fail( function () {
		ve.ui.AceEditorWidget.super.prototype.selectRange.call( widget, from, to );
	} );
	return this;
};

/**
 * Handle change events from the Ace editor
 */
ve.ui.AceEditorWidget.prototype.onEditorChange = function () {
	// Call setValue on the parent to keep the value property in sync with the editor
	ve.ui.AceEditorWidget.super.prototype.setValue.call( this, this.editor.getValue() );
};

/**
 * Handle resize events from the Ace editor
 *
 * @fires resize
 */
ve.ui.AceEditorWidget.prototype.onEditorResize = function () {
	// On the first setup the editor doesn't resize until the end of the cycle
	setTimeout( this.emit.bind( this, 'resize' ) );
};

/**
 * Clear the editor's undo stack
 *
 * @chainable
 * @return {VeUiAceEditorWidget}
 */
ve.ui.AceEditorWidget.prototype.clearUndoStack = function () {
	var widget = this;
	this.loadingPromise.done( function () {
		widget.editor.session.setUndoManager(
			new ace.UndoManager()
		);
	} );
	return this;
};

/**
 * Toggle the visibility of line numbers
 *
 * @param {boolean} visible Visible
 * @chainable
 * @return {VeUiAceEditorWidget}
 */
ve.ui.AceEditorWidget.prototype.toggleLineNumbers = function ( visible ) {
	var widget = this;
	this.loadingPromise.done( function () {
		widget.editor.renderer.setOption( 'showLineNumbers', visible );
	} );
	return this;
};

/**
 * Toggle the visibility of the print margin
 *
 * @param {boolean} visible Visible
 * @chainable
 * @return {VeUiAceEditorWidget}
 */
ve.ui.AceEditorWidget.prototype.togglePrintMargin = function ( visible ) {
	var widget = this;
	this.loadingPromise.done( function () {
		widget.editor.renderer.setShowPrintMargin( visible );
	} );
	return this;
};

/**
 * Set the language mode of the editor (programming language)
 *
 * @param {string} lang Language
 * @chainable
 * @return {VeUiAceEditorWidget}
 */
ve.ui.AceEditorWidget.prototype.setLanguage = function ( lang ) {
	var widget = this;
	this.loadingPromise.done( function () {
		ace.config.loadModule( 'ace/ext/modelist', function ( modelist ) {
			if ( !modelist || !modelist.modesByName[ lang ] ) {
				lang = 'text';
			}
			widget.editor.getSession().setMode( 'ace/mode/' + lang );
		} );
	} );
	return this;
};

/**
 * Focus the editor
 *
 * @chainable
 * @return {VeUiAceEditorWidget}
 */
ve.ui.AceEditorWidget.prototype.focus = function () {
	var widget = this;
	this.loadingPromise.done( function () {
		widget.editor.focus();
	} ).fail( function () {
		ve.ui.AceEditorWidget.super.prototype.focus.call( widget );
	} );
	return this;
};

/**
 * @inheritdoc
 * @param {boolean} force Force a resize call on Ace editor
 * @chainable
 * @return {VeUiAceEditorWidget}
 */
ve.ui.AceEditorWidget.prototype.adjustSize = function ( force ) {
	var widget = this;
	// If the editor has loaded, resize events are emitted from #onEditorResize
	// so do nothing here unless this is a user triggered resize, otherwise call the parent method.
	if ( force ) {
		this.loadingPromise.done( function () {
			widget.editor.resize();
		} );
	}
	this.loadingPromise.fail( function () {
		// Parent method
		ve.ui.AceEditorWidget.super.prototype.adjustSize.call( widget );
	} );
	return this;
};
