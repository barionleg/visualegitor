/*!
 * VisualEditor UserInterface Find class.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * UserInterface context.
 *
 * @class
 * @abstract
 * @extends OO.ui.Element
 *
 * @constructor
 * @param {ve.ui.Surface} surface
 * @param {Object} [config] Configuration options
 */
ve.ui.Find = function VeUiFind( surface, config ) {
	// Parent constructor
	OO.ui.Element.call( this, config );

	// Properties
	this.surface = surface;
	this.fragments = [];
	this.replacing = false;
	this.focusedIndex = 0;
//	this.visible = false;
	this.findText = new OO.ui.TextInputWidget( {
		$: this.$,
		placeholder: 'Find'
	} );
	this.matchCaseToggle = new OO.ui.ToggleSwitchWidget( { $: this.$ } );
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
		placeholder: 'Replace'
	} );
	this.replaceButton = new OO.ui.ButtonWidget( {
		$: this.$,
		label: 'Replace'
	} );
	this.replaceAllButton = new OO.ui.ButtonWidget( {
		$: this.$,
		label: 'Replace all'
	} );

	var checkboxField = new OO.ui.FieldLayout(
			this.matchCaseToggle,
			{
				align: 'inline',
				label: 'Match case'
			}
		),
		navigateGroup = new OO.ui.ButtonGroupWidget( {
			$: this.$,
			items: [
				this.previousButton,
				this.nextButton
			]
		} );

	// Events
	this.updateFragmentsDebounced = ve.debounce( this.updateFragments.bind( this ) );
	this.positionResultsDebounced = ve.debounce( this.positionResults.bind( this ) );
	this.findText.connect( this, { change: 'onFindChange' } );
	this.matchCaseToggle.connect( this, { change: 'onFindChange' } );
	this.nextButton.connect( this, { click: 'onNextButtonClick' } );
	this.previousButton.connect( this, { click: 'onPreviousButtonClick' } );
	this.replaceButton.connect( this, { click: 'onReplaceButtonClick' } );
	this.replaceAllButton.connect( this, { click: 'onReplaceAllButtonClick' } );
	this.surface.getModel().connect( this, { documentUpdate: this.updateFragmentsDebounced } );
	this.surface.getView().connect( this, { position: this.positionResultsDebounced } );

	// Initialization
	this.$element
		.addClass( 've-ui-find' )
		.append(
			this.findText.$element,
			checkboxField.$element,
			navigateGroup.$element,
			this.replaceText.$element,
			this.replaceButton.$element,
			this.replaceAllButton.$element
		);
};

/* Inheritance */

OO.inheritClass( ve.ui.Find, OO.ui.Element );

/* Methods */

/**
 * Handle change events to the find inputs (text or match case)
 */
ve.ui.Find.prototype.onFindChange = function () {
	this.updateFragments();
	this.positionResults();
};

/**
 * Update search result fragments
 */
ve.ui.Find.prototype.updateFragments = function () {
	var i, l, findLen,
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
			this.fragments.push( surfaceModel.getLinearFragment( new ve.Range( offsets[i], offsets[i] + findLen ), true ) );
		}
	}
	this.focusedIndex = Math.min( this.focusedIndex, this.fragments.length );
};

/**
 * Position results markers
 */
ve.ui.Find.prototype.positionResults = function () {
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
 */
ve.ui.Find.prototype.highlightFocused = function () {
	var windowScrollTop, windowScrollHeight, offset,
		surfaceView = this.surface.getView(),
		$result = surfaceView.$findResults.children().eq( this.focusedIndex );

	surfaceView.$findResults.find( '.ve-ce-surface-findResult-focused' ).removeClass( 've-ce-surface-findResult-focused' );
	$result.addClass( 've-ce-surface-findResult-focused' );

	offset = $result.data( 'top' ) + surfaceView.$element.offset().top;
	windowScrollTop = surfaceView.$window.scrollTop();
	windowScrollHeight = surfaceView.$window.height();
	if ( offset < windowScrollTop || offset > windowScrollTop + windowScrollHeight ) {
		this.$( 'body, html' ).animate( { scrollTop: offset - ( windowScrollHeight / 2  ) }, 'fast' );
	}
};

/**
 * Handle click events on the next button
 */
ve.ui.Find.prototype.onNextButtonClick = function () {
	this.focusedIndex = ( this.focusedIndex + 1 ) % this.fragments.length;
	this.highlightFocused();
};

/**
 * Handle click events on the previous button
 */
ve.ui.Find.prototype.onPreviousButtonClick = function () {
	this.focusedIndex = ( this.focusedIndex + this.fragments.length - 1 ) % this.fragments.length;
	this.highlightFocused();
};

/**
 * Handle click events on the replace button
 */
ve.ui.Find.prototype.onReplaceButtonClick = function () {
	var end, replace = this.replaceText.getValue();

	if ( !this.fragments.length ) {
		return;
	}

	this.fragments[this.focusedIndex].insertContent( replace, true );

	// Find the next fragment after this one ends. Ensures that if we replace
	// 'foo' with 'foofoo' we don't select the just-inserted text.
	end = this.fragments[this.focusedIndex].getSelection().getRange().end;
	this.updateFragments();
	this.focusedIndex = 0;
	while ( this.fragments[this.focusedIndex] && this.fragments[this.focusedIndex].getSelection().getRange().end <= end ) {
		this.focusedIndex++;
	}
	this.focusedIndex = this.focusedIndex % this.fragments.length;
};

/**
 * Handle click events on the previous all button
 */
ve.ui.Find.prototype.onReplaceAllButtonClick = function () {
	var i, l,
		replace = this.replaceText.getValue();

	for ( i = 0, l = this.fragments.length; i < l; i++ ) {
		this.fragments[i].insertContent( replace, true );
	}
};
