/*!
 * VisualEditor UserInterface SequenceRegistry class.
 *
 * @copyright 2011-2017 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * Sequence registry.
 *
 * @class
 * @extends OO.Registry
 * @constructor
 */
ve.ui.SequenceRegistry = function VeUiSequenceRegistry() {
	// Parent constructor
	ve.ui.SequenceRegistry.super.call( this );
};

/* Inheritance */

OO.inheritClass( ve.ui.SequenceRegistry, OO.Registry );

/**
 * Register a sequence with the factory.
 *
 * @method
 * @param {ve.ui.Sequence} sequence Sequence object
 * @throws {Error} If sequence is not an instance of ve.ui.Sequence
 */
ve.ui.SequenceRegistry.prototype.register = function ( sequence ) {
	// Validate arguments
	if ( !( sequence instanceof ve.ui.Sequence ) ) {
		throw new Error(
			'sequence must be an instance of ve.ui.Sequence, cannot be a ' + typeof sequence
		);
	}

	ve.ui.SequenceRegistry.super.prototype.register.call( this, sequence.getName(), sequence );
};

/**
 * Find sequence matches a given offset in the data
 *
 * @param {ve.dm.ElementLinearData} data Linear data
 * @param {number} offset Offset
 * @param {string|undefined} mode 'paste' or undefined
 * @return {{sequence:ve.ui.Sequence,range:ve.Range}[]}
 *   Array of matching sequences, and the corresponding range of the match
 *   for each.
 */
ve.ui.SequenceRegistry.prototype.findMatching = function ( data, offset, mode ) {
	var textStart, plaintext, name, range, sequence,
		state = 0,
		sequences = [];

	// To avoid blowup when matching RegExp sequences, we're going to grab
	// all the plaintext to the left (until the nearest node) *once* and pass
	// it to each sequence matcher.  We're also going to hard-limit that
	// plaintext to 256 characters to ensure we don't run into O(N^2)
	// slowdown when inserting N characters of plain text.

	// First skip over open elements, then close elements, to ensure that
	// pressing enter after a (possibly nested) list item or inside a
	// paragraph works properly.  Typing "foo\n" inside a paragraph creates
	// "foo</p><p>" in the content model, and typing "foo\n" inside a list
	// creates "foo</p></li><li><p>" -- we want to give the matcher a
	// chance to match "foo\n+" in these cases.
	for ( textStart = offset - 1; textStart >= 0 && ( offset - textStart ) <= 256; textStart-- ) {
		if ( state === 0 && !data.isOpenElementData( textStart ) ) {
			state++;
		}
		if ( state === 1 && !data.isCloseElementData( textStart ) ) {
			state++;
		}
		if ( state === 2 && data.isElementData( textStart ) ) {
			break;
		}
	}
	plaintext = data.getText( true, new ve.Range( textStart + 1, offset ) );
	// Now search through the registry.
	for ( name in this.registry ) {
		sequence = this.registry[ name ];
		if ( mode === 'paste' && !sequence.checkOnPaste ) {
			continue;
		}
		range = sequence.match( data, offset, plaintext );
		if ( range !== null ) {
			sequences.push( {
				sequence: sequence,
				range: range
			} );
		}
	}
	return sequences;
};

/* Initialization */

ve.ui.sequenceRegistry = new ve.ui.SequenceRegistry();

/* Registrations */

ve.ui.sequenceRegistry.register(
	new ve.ui.Sequence( 'bulletStar', 'bulletWrapOnce', [ { type: 'paragraph' }, '*', ' ' ], 2 )
);
ve.ui.sequenceRegistry.register(
	new ve.ui.Sequence( 'numberDot', 'numberWrapOnce', [ { type: 'paragraph' }, '1', '.', ' ' ], 3 )
);
