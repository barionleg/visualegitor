/*!
 * VisualEditor Content Editable Range State class
 *
 * @copyright 2011-2020 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * ContentEditable range state (a snapshot of CE selection/content state)
 *
 * @class
 *
 * @constructor
 * @param {ve.ce.RangeState|null} old Previous range state
 * @param {ve.ce.BranchNode} root Surface root
 * @param {boolean} selectionOnly The caller promises the content has not changed from old
 */
ve.ce.RangeState = function VeCeRangeState( old, root, selectionOnly ) {
	/**
	 * @property {boolean} branchNodeChanged Whether the CE branch node changed
	 */
	this.branchNodeChanged = false;

	/**
	 * @property {boolean} selectionChanged Whether the DOM range changed
	 */
	this.selectionChanged = false;

	/**
	 * @property {boolean} contentChanged Whether the content changed
	 *
	 * This is only set to true if both the old and new states have the
	 * same current branch node, whose content has changed
	 */
	this.contentChanged = false;

	/**
	 * @property {ve.Range|null} veRange The current selection range
	 */
	this.veRange = null;

	/**
	 * @property {ve.ce.BranchNode|null} node The current branch node
	 */
	this.node = null;

	/**
	 * @property {boolean|null} focusIsAfterAnnotationBoundary Focus lies after annotation tag
	 */
	this.focusIsAfterAnnotationBoundary = null;

	/**
	 * Saved selection for future comparisons. (But it is not properly frozen, because the
	 * nodes are live and mutable, and therefore the offsets may come to point to places that
	 * are misleadingly different from when the selection was saved).
	 *
	 * @property {ve.SelectionState} misleadingSelection Saved selection (but with live nodes)
	 */
	this.misleadingSelection = null;

	this.saveState( old, root, selectionOnly );
};

/* Inheritance */

OO.initClass( ve.ce.RangeState );

/* Methods */

/**
 * Saves a snapshot of the current range state
 *
 * @param {ve.ce.RangeState|null} old Previous range state
 * @param {ve.ce.BranchNode} root Surface root
 * @param {boolean} selectionOnly The caller promises the content has not changed from old
 */
ve.ce.RangeState.prototype.saveState = function ( old, root, selectionOnly ) {
	var oldSelection = old ? old.misleadingSelection : ve.SelectionState.static.newNullSelection(),
		nativeSelection = root.getElementDocument().getSelection();

	var selection;
	if (
		nativeSelection.rangeCount &&
		OO.ui.contains( root.$element[ 0 ], nativeSelection.focusNode, true )
	) {
		// Freeze selection out of live object.
		selection = new ve.SelectionState( nativeSelection );
	} else {
		// Use a blank selection if the selection is outside the document
		selection = ve.SelectionState.static.newNullSelection();
	}

	// Get new range information
	if ( selection.equalsSelection( oldSelection ) ) {
		// No change; use old values for speed
		this.selectionChanged = false;
		this.veRange = old && old.veRange;
	} else {
		this.selectionChanged = true;
		this.veRange = ve.ce.veRangeFromSelection( selection );
	}

	var focusNodeChanged = oldSelection.focusNode !== selection.focusNode;

	if ( !focusNodeChanged ) {
		this.node = old && old.node;
	} else {
		var $node = $( selection.focusNode ).closest( '.ve-ce-branchNode' );
		if ( $node.length === 0 ) {
			this.node = null;
		} else {
			this.node = $node.data( 'view' );
			// Check this node belongs to our document
			if ( this.node && this.node.root !== root.root ) {
				this.node = null;
				this.veRange = null;
			}
		}
	}

	this.branchNodeChanged = ( old && old.node ) !== this.node;

	// Only set contentChanged if we're still in the same branch node
	this.contentChanged = !!(
		!selectionOnly &&
		!this.branchNodeChanged &&
		this.node &&
		this.node.canContainContent() &&
		!ve.ce.ContentBranchNode.static.cloneForComparison(
			this.node.$element[ 0 ]
		).isEqualNode( this.node.lastRenderedContents )
	);

	if ( old && !this.selectionChanged && !this.contentChanged ) {
		this.focusIsAfterAnnotationBoundary = old.focusIsAfterAnnotationBoundary;
	} else {
		// Will be null if there is no selection
		this.focusIsAfterAnnotationBoundary = selection.focusNode &&
			ve.ce.isAfterAnnotationBoundary(
				selection.focusNode,
				selection.focusOffset
			);
	}

	// Save selection for future comparisons. (But it is not properly frozen, because the nodes
	// are live and mutable, and therefore the offsets may come to point to places that are
	// misleadingly different from when the selection was saved).
	this.misleadingSelection = selection;
};
