/*!
 * VisualEditor UserInterface Find class.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * UserInterface context.
 *
 * @class
 * @extends OO.ui.Dialog
 *
 * @constructor
 * @param {ve.ui.Surface} surface
 * @param {Object} [config] Configuration options
 */
ve.ui.FindAndReplace = function VeUiFind( config ) {
	// Parent constructor
	ve.ui.FindAndReplace.super.call( this, config );

	// Properties
	this.surface = null;

	// Pre-initialization
	// This class needs to exist before setup to constrain the height
	// of the dialog when it first loads.
	this.$element.addClass( 've-ui-findAndReplace' );
};

/* Inheritance */

OO.inheritClass( ve.ui.FindAndReplace, OO.ui.Dialog );

ve.ui.FindAndReplace.static.name = 'findAndReplace';

ve.ui.FindAndReplace.static.title = OO.ui.deferMsg( 'visualeditor-find-title' );

ve.ui.FindAndReplace.static.size = 'wide';

/* Methods */

/**
 * @inheritdoc
 */
ve.ui.FindAndReplace.prototype.initialize = function () {
	// Parent method
	ve.ui.FindAndReplace.super.prototype.initialize.call( this );

	this.fragments = [];
	this.replacing = false;
	this.focusedIndex = 0;
	this.findText = new OO.ui.TextInputWidget( {
		$: this.$,
		classes: ['ve-ui-findAndReplace-cell', 've-ui-findAndReplace-findText'],
		placeholder: 'Find'
	} );
	this.matchCaseToggle = new OO.ui.ToggleSwitchWidget( { $: this.$ } );
	this.focusedIndexLabel = new OO.ui.LabelWidget( {
		$: this.$,
		classes: ['ve-ui-findAndReplace-focusedIndexLabel']
	} );
	this.previousButton = new OO.ui.ButtonWidget( {
		$: this.$,
		icon: 'previous'
	} );
	this.nextButton = new OO.ui.ButtonWidget( {
		$: this.$,
		icon: 'next'
	} );
	this.replaceText = new OO.ui.TextInputWidget( {
		$: this.$,
		classes: ['ve-ui-findAndReplace-cell'],
		placeholder: 'Replace'
	} );
	this.replaceButton = new OO.ui.ButtonWidget( {
		$: this.$,
		classes: ['ve-ui-findAndReplace-cell'],
		label: 'Replace'
	} );
	this.replaceAllButton = new OO.ui.ButtonWidget( {
		$: this.$,
		classes: ['ve-ui-findAndReplace-cell'],
		label: 'Replace all'
	} );

	var checkboxField = new OO.ui.FieldLayout(
			this.matchCaseToggle,
			{
				$: this.$,
				classes: ['ve-ui-findAndReplace-cell'],
				align: 'inline',
				label: 'Match case'
			}
		),
		navigateGroup = new OO.ui.ButtonGroupWidget( {
			$: this.$,
			classes: ['ve-ui-findAndReplace-cell'],
			items: [
				this.previousButton,
				this.nextButton
			]
		} ),
		$findRow = this.$( '<div>' ).addClass( 've-ui-findAndReplace-row' ),
		$replaceRow = this.$( '<div>' ).addClass( 've-ui-findAndReplace-row' );

	// Events
	this.updateFragmentsDebounced = ve.debounce( this.updateFragments.bind( this ) );
	this.positionResultsDebounced = ve.debounce( this.positionResults.bind( this ) );
	this.findText.connect( this, { change: 'onFindChange' } );
	this.matchCaseToggle.connect( this, { change: 'onFindChange' } );
	this.nextButton.connect( this, { click: 'onNextButtonClick' } );
	this.previousButton.connect( this, { click: 'onPreviousButtonClick' } );
	this.replaceButton.connect( this, { click: 'onReplaceButtonClick' } );
	this.replaceAllButton.connect( this, { click: 'onReplaceAllButtonClick' } );

	// Initialization
	this.findText.$input.attr( 'tabIndex', 1 );
	this.replaceText.$input.attr( 'tabIndex', 2 );
	this.$content.addClass( 've-ui-findAndReplace-content' );
	this.$body
		.append(
			$findRow.append(
				this.findText.$element.append(
					this.focusedIndexLabel.$element
				),
				navigateGroup.$element,
				checkboxField.$element
			),
			$replaceRow.append(
				this.replaceText.$element,
				this.replaceButton.$element,
				this.replaceAllButton.$element
			)
		);
};

/**
 * @inheritdoc
 */
ve.ui.FindAndReplace.prototype.getSetupProcess = function ( data ) {
	data = data || {};
	return ve.ui.FindAndReplace.super.prototype.getSetupProcess.call( this, data )
		.first( function () {
			this.surface = data.surface;
			this.surface.getModel().connect( this, { documentUpdate: this.updateFragmentsDebounced } );
			this.surface.getView().connect( this, { position: this.positionResultsDebounced } );

			var text = data.fragment.getText();
			if ( text ) {
				this.findText.setValue( text );
			} else {
				this.updateFragments();
			}
		}, this );
};

/**
 * @inheritdoc
 */
ve.ui.FindAndReplace.prototype.getReadyProcess = function ( data ) {
	return ve.ui.FindAndReplace.super.prototype.getReadyProcess.call( this, data )
		.next( function () {
			this.findText.focus().select();
		}, this );
};

/**
 * @inheritdoc
 */
ve.ui.FindAndReplace.prototype.getTeardownProcess = function ( data ) {
	return ve.ui.FindAndReplace.super.prototype.getTeardownProcess.call( this, data )
		.next( function () {
			var surfaceView = this.surface.getView();
			this.surface.getModel().disconnect( this );
			surfaceView.disconnect( this );
			surfaceView.$findResults.empty();
			surfaceView.focus();
			this.fragment = [];
			this.surface = null;
		}, this );
};

/**
 * Handle change events to the find inputs (text or match case)
 */
ve.ui.FindAndReplace.prototype.onFindChange = function () {
	this.updateFragments();
	this.positionResults();
	this.highlightFocused( true );
};

/**
 * Update search result fragments
 */
ve.ui.FindAndReplace.prototype.updateFragments = function () {
	var i, l, findLen,
		endOffset = 0,
		surfaceModel = this.surface.getModel(),
		documentModel = surfaceModel.getDocument(),
		offsets = [],
		matchCase = this.matchCaseToggle.getValue(),
		find = this.findText.getValue();

	this.fragments = [];
	if ( find ) {
		offsets = documentModel.findText( find, matchCase );
		findLen = find.length;
		for ( i = 0, l = offsets.length; i < l; i++ ) {
			if ( offsets[i] < endOffset ) {
				// Avoid overlapping results
				continue;
			}
			endOffset = offsets[i] + findLen;
			this.fragments.push( surfaceModel.getLinearFragment( new ve.Range( offsets[i], endOffset ), true, true ) );
		}
	}
	this.focusedIndex = Math.min( this.focusedIndex, this.fragments.length );
	this.nextButton.setDisabled( !this.fragments.length );
	this.previousButton.setDisabled( !this.fragments.length );
	this.replaceButton.setDisabled( !this.fragments.length );
	this.replaceAllButton.setDisabled( !this.fragments.length );
};

/**
 * Position results markers
 */
ve.ui.FindAndReplace.prototype.positionResults = function () {
	if ( this.replacing ) {
		return;
	}

	var i, l, j, rects, $result, top,
		surfaceView = this.surface.getView();

	surfaceView.$findResults.empty();
	for ( i = 0, l = this.fragments.length; i < l; i++ ) {
		rects = this.surface.getView().getSelectionRects( this.fragments[i].getSelection() );
		$result = $( '<div>' ).addClass( 've-ce-surface-findResult' );
		top = Infinity;
		for ( j in rects ) {
			top = Math.min( top, rects[j].top );
			$result.append( $( '<div>' ).css( rects[j] ) );
		}
		$result.data( 'top', top );
		surfaceView.$findResults.append( $result );
	}
	this.highlightFocused();
};

/**
 * Highlight the focused result marker
 *
 * @param {boolean} scrollIntoView Scroll the marker into view
 */
ve.ui.FindAndReplace.prototype.highlightFocused = function ( scrollIntoView ) {
	var windowScrollTop, windowScrollHeight, offset,
		surfaceView = this.surface.getView(),
		$result = surfaceView.$findResults.children().eq( this.focusedIndex );

	surfaceView.$findResults.find( '.ve-ce-surface-findResult-focused' ).removeClass( 've-ce-surface-findResult-focused' );
	$result.addClass( 've-ce-surface-findResult-focused' );

	if ( this.fragments.length ) {
		this.focusedIndexLabel.setLabel( ve.msg( 'visualeditor-find-results', this.focusedIndex + 1, this.fragments.length ) );
	} else {
		this.focusedIndexLabel.setLabel( '' );
	}

	if ( scrollIntoView ) {
		offset = $result.data( 'top' ) + surfaceView.$element.offset().top;
		windowScrollTop = surfaceView.$window.scrollTop();
		windowScrollHeight = surfaceView.$window.height();
		if ( offset < windowScrollTop || offset > windowScrollTop + windowScrollHeight ) {
			surfaceView.$( 'body, html' ).animate( { scrollTop: offset - ( windowScrollHeight / 2  ) }, 'fast' );
		}
	}
};

/**
 * Handle click events on the next button
 */
ve.ui.FindAndReplace.prototype.onNextButtonClick = function () {
	this.focusedIndex = ( this.focusedIndex + 1 ) % this.fragments.length;
	this.highlightFocused( true );
};

/**
 * Handle click events on the previous button
 */
ve.ui.FindAndReplace.prototype.onPreviousButtonClick = function () {
	this.focusedIndex = ( this.focusedIndex + this.fragments.length - 1 ) % this.fragments.length;
	this.highlightFocused( true );
};

/**
 * Handle click events on the replace button
 */
ve.ui.FindAndReplace.prototype.onReplaceButtonClick = function () {
	var end, replace = this.replaceText.getValue();

	if ( !this.fragments.length ) {
		return;
	}

	this.fragments[this.focusedIndex].insertContent( replace, true );

	// Find the next fragment after this one ends. Ensures that if we replace
	// 'foo' with 'foofoo' we don't select the just-inserted text.
	end = this.fragments[this.focusedIndex].getSelection().getRange().end;
	// updateFragmentsDebounced is triggered by insertContent, but call it immediately
	// so we can find the next fragment to select.
	this.updateFragments();
	if ( !this.fragments.length ) {
		this.focusedIndex = 0;
		return;
	}
	while ( this.fragments[this.focusedIndex] && this.fragments[this.focusedIndex].getSelection().getRange().end <= end ) {
		this.focusedIndex++;
	}
	// We may have iterated off the end
	this.focusedIndex = this.focusedIndex % this.fragments.length;
};

/**
 * Handle click events on the previous all button
 */
ve.ui.FindAndReplace.prototype.onReplaceAllButtonClick = function () {
	var i, l,
		replace = this.replaceText.getValue();

	for ( i = 0, l = this.fragments.length; i < l; i++ ) {
		this.fragments[i].insertContent( replace, true );
	}
};

/**
 * @inheritdoc
 */
ve.ui.FindAndReplace.prototype.getBodyHeight = function () {
	return Math.ceil( this.$body[0].scrollHeight );
};

/* Registration */

ve.ui.windowFactory.register( ve.ui.FindAndReplace );
