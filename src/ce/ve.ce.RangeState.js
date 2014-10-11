/*!
 * VisualEditor Content Editable Range State class
 *
 * @copyright 2011-2014 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * ContentEditable range state (a snapshot of CE selection/content state)
 *
 * @class
 * selectionChanged {boolean} Whether the DOM range changed
 * @property contentChanged {boolean} Whether the content changed
 * @property leftBlockSlug {boolean} Whether the range left a block slug
 * @property enteredBlockSlug {boolean} Whether the range entered a block slug
 * @property veRange {ve.Range} The current selection range
 * @property node {ve.ce.BranchNode|null} The current branch node
 * @property $slugWrapper {jQuery|null} The current slug wrapper
 * @property text {string} Plain text of current node
 * @property hash {string} DOM hash of current node
 */

 /**
 * @constructor
 * @param {ve.ce.RangeState|null} old Previous range state
 * @param {ve.ce.DocumentNode} docNode The current document node
 * @param {boolean} selectionOnly The caller promises the content has not changed from old
 */
ve.ce.RangeState = function VeCeRangeState( old, docNode, selectionOnly ) {
	var sel;

	// freeze selection out of live object
	sel = ( function ( selection ) {
		return {
			focusNode: selection.focusNode,
			focusOffset: selection.focusOffset,
			anchorNode: selection.anchorNode,
			anchorOffset: selection.anchorOffset
		};
	} ( docNode.getElementDocument().getSelection() ) );

	this.saveState( old, sel, docNode, selectionOnly );

	// Bind the selection into instance method calls, so it is not left lying around.
	this.isSelectionChanged = this.constructor.static.isSelectionChanged.bind( null, sel );
	this.isAnchorNodeChanged = this.constructor.static.isAnchorNodeChanged.bind( null, sel );
};

/* Inheritance */

OO.initClass( ve.ce.RangeState );

/* Methods */

/**
 * Saves a snapshot of the current range state
 * @method
 * @param {ve.ce.RangeState|null} old Previous range state
 * @param {Object} selection Current selection object
 * @param {ve.ce.DocumentNode} docNode The current document node
 * @param {boolean} selectionOnly The caller promises the content has not changed from old
 */
ve.ce.RangeState.prototype.saveState = function ( old, selection, docNode, selectionOnly ) {
	var $nodeOrSlug, isAnchorNodeChanged;

	ve.log( 'saveState 1' );

	// Get new range information
	if ( old && !old.isSelectionChanged( selection ) ) {
		ve.log( 'saveState 2' );
		// No change; use old values for speed
		this.selectionChanged = false;
		this.veRange = old.veRange;
		this.$slugWrapper = old.$slugWrapper;
		this.leftBlockSlug = false;
		this.enteredBlockSlug = false;
	} else {
		ve.log( 'saveState 3' );
		this.selectionChanged = true;
		try {
			this.veRange = new ve.Range(
				ve.ce.getOffset( selection.anchorNode, selection.anchorOffset ),
				ve.ce.getOffset( selection.focusNode, selection.focusOffset )
			);
			ve.log( 'saveState 4' );
		} catch ( e ) {
			ve.log( 'saveState 5' );
			this.veRange = null;
		}
	}

	ve.log( 'saveState 6' );
	isAnchorNodeChanged = !old || old.isAnchorNodeChanged( selection );

	if ( !isAnchorNodeChanged ) {
		ve.log( 'saveState 7' );
		this.node = old.node;
		this.$slugWrapper = old.$slugWrapper;
		if ( selectionOnly ) {
			this.text = old.text;
			this.hash = old.hash;
		}
	} else {
		ve.log( 'saveState 8' );
		$nodeOrSlug = $( selection.anchorNode ).closest(
			'.ve-ce-branchNode, .ve-ce-branchNode-blockSlugWrapper'
		);
		if ( $nodeOrSlug.length === 0 ) {
			ve.log( 'saveState 9' );
			this.node = null;
			this.$slugWrapper = null;
		} else if ( $nodeOrSlug.hasClass( 've-ce-branchNode-blockSlugWrapper' ) ) {
			ve.log( 'saveState 10' );
			this.node = null;
			this.$slugWrapper = $nodeOrSlug;
		} else {
			ve.log( 'saveState 11' );
			this.node = $nodeOrSlug.data( 'view' );
			this.$slugWrapper = null;
			// Check this node belongs to our document
			if ( this.node && this.node.root !== docNode ) {
				this.node = null;
				this.veRange = null;
			}
		}
		ve.log( 'saveState 12' );
	}

	ve.log( 'saveState 13' );
	// Compute text/hash, for change comparison
	if ( selectionOnly && !isAnchorNodeChanged ) {
		this.text = old.text;
		this.hash = old.hash;
	} else if ( this.node === null ) {
		this.text = null;
		this.hash = null;
	} else {
		this.text = ve.ce.getDomText( this.node.$element[0] );
		this.hash = ve.ce.getDomHash( this.node.$element[0] );
	}
	ve.log( 'saveState 14' );

	this.leftBlockSlug = (
		old &&
		old.$slugWrapper &&
		!old.$slugWrapper.is( this.$slugWrapper )
	);
	this.enteredBlockSlug = (
		old &&
		this.$slugWrapper &&
		this.$slugWrapper.length > 0 &&
		!this.$slugWrapper.is( old.$slugWrapper )
	);

	// Only set contentChanged if we're still in the same branch node/block slug
	this.contentChanged = (
		!selectionOnly &&
		old &&
		old.node === this.node && (
			old.hash === null ||
			old.text === null ||
			old.hash !== this.hash ||
			old.text !== this.text
		)
	);
};

/* Static methods */

/**
 * Compare two selection objects for changes.
 *
 * The meaning of "changes" is slightly misleading, because the offsets were taken
 * at two different instants, between which content outside of the selection may
 * have changed. This can in theory cause false negatives (unnoticed changes).
 *
 * @param {Object} oldSelection prior selection
 * @param {Object} newSelection current selection
 * @returns {boolean} Whether there is a change
 */
ve.ce.RangeState.static.isSelectionChanged = function ( oldSelection, newSelection ) {
	return (
		oldSelection.focusNode !== newSelection.focusNode ||
		oldSelection.focusOffset !== newSelection.focusOffset ||
		oldSelection.anchorNode !== newSelection.anchorNode ||
		oldSelection.anchorOffset !== newSelection.anchorOffset
	);
};

/**
 * Compare two selection objects for a change of anchor node
 * @param {Object} oldSelection prior selection
 * @param {Object} newSelection current selection
 * @returns {boolean} Whether the anchor node has changed
 */
ve.ce.RangeState.static.isAnchorNodeChanged = function ( oldSelection, newSelection ) {
	return oldSelection.anchorNode !== newSelection.anchorNode;
};
