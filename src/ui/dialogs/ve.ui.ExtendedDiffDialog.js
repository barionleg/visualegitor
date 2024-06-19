/*!
 * VisualEditor ExtendedDiffDialog class.
 *
 * @copyright See AUTHORS.txt
 */

/**
 * Dialog for choosing a diff baseline and
 * displaying the associated diff.
 *
 * @class
 * @extends OO.ui.ProcessDialog
 *
 * @constructor
 * @param {Object} [config Configuration options]
 */

ve.ui.ExtendedDiffDialog = function VeUiExtendedDiffDialog( config ) {
	// Parent constructor
	ve.ui.ExtendedDiffDialog.super.call( this, config );
};

/* Inheritance */

OO.inheritClass( ve.ui.ExtendedDiffDialog, OO.ui.ProcessDialog );

/* Static properties */

ve.ui.ExtendedDiffDialog.static.name = 'extendeddiff';

ve.ui.ExtendedDiffDialog.static.size = 'full';

ve.ui.ExtendedDiffDialog.static.title = 'Changes';

ve.ui.ExtendedDiffDialog.static.actions = [
	{
		label: OO.ui.deferMsg( 'visualeditor-dialog-action-done' ),
		flags: [ 'safe', 'close' ]
	}
];

/* Methods */

/**
 * @inheritdoc
 */
ve.ui.ExtendedDiffDialog.prototype.initialize = function () {
	// Parent method
	ve.ui.ExtendedDiffDialog.super.prototype.initialize.apply( this, arguments );

	this.content = new OO.ui.PanelLayout( {
		padded: true,
		expanded: true
	} );

	this.radioButtons = new OO.ui.FieldsetLayout();
	this.content.$element.append( this.radioButtons.$element );

	this.diff = new OO.ui.Element();
	this.content.$element.append( this.diff.$element );

	this.$body.append( this.content.$element );
};

/**
 * @inheritdoc
 */
ve.ui.ExtendedDiffDialog.prototype.getSetupProcess = function ( data ) {
	return ve.ui.ExtendedDiffDialog.super.prototype.getSetupProcess
		.call( this, data )
		.next( () => {
			if ( !( data.sources instanceof Array ) ) {
				throw new Error( 'sources must be an array' );
			}
			if ( data.sources.length < 2 ) {
				throw new Error( 'It is meaningless to open a diff dialog with fewer than two options' );
			}

			// RadioSelectInputWidget uses hashes to look up data. That feels fragile,
			// so we hand the component a string to use instead.
			this.fetchers = new Map( data.sources.map( ( { source }, i ) => [ `${ i }`, source ] ) );
			// Document models for each side of the diff
			this.sides = new Map( [ [ 'oldDoc', null ], [ 'newDoc', null ] ] );

			this.left = new OO.ui.RadioSelectInputWidget( {
				options: data.sources.map( ( { title }, i ) => ( { data: `${ i }`, label: title } ) ),
				value: '0'
			} );

			this.right = new OO.ui.RadioSelectInputWidget( {
				options: data.sources.map( ( { title }, i ) => ( { data: `${ i }`, label: title } ) ),
				value: '1'
			} );

			this.radioButtons.addItems( [
				new OO.ui.FieldLayout( this.left, { label: 'left' } ),
				new OO.ui.FieldLayout( this.right, { label: 'right ' } )
			] );

			// Keep these matched with getTeardownProcess
			this.left.connect( this, { change: [ 'onChange', 'oldDoc' ] } );
			this.right.connect( this, { change: [ 'onChange', 'newDoc' ] } );

			/* The initial 'change' event which fires when setting the value
			 * occurs before we've had the opportunity to set up our event listeners.
			 * We'll set them off manually here. */
			this.left.emit( 'change', this.left.getValue() );
			this.right.emit( 'change', this.right.getValue() );
		} );
};

/**
 * @inheritdoc
 */
ve.ui.ExtendedDiffDialog.prototype.getTeardownProcess = function () {
	return ve.ui.ExtendedDiffDialog.super.prototype.getTeardownProcess
		.call( this )
		.next( () => {
			// Keep these matched with getSetupProcess
			this.left.disconnect( this, { change: 'onChange' } );
			this.right.disconnect( this, { change: 'onChange' } );
			this.radioButtons.clearItems();
			this.fetchers = undefined;
			this.diff.$element.empty();
			this.diffElement = undefined;
		} );
};

ve.ui.ExtendedDiffDialog.prototype.onChange = function ( side, index ) {
	if ( !this.sides.has( side ) ) {
		throw new Error( 'Invalid side in onChange' );
	}

	const fetcher = this.fetchers.get( index );
	this.sides.set( side, fetcher() );

	if ( this.sides.get( 'oldDoc' ) !== null && this.sides.get( 'newDoc' ) !== null ) {
		this.diffElement = new ve.ui.DiffElement( new ve.dm.VisualDiff( this.sides.get( 'oldDoc' ), this.sides.get( 'newDoc' ) ) );
		ve.targetLinksToNewWindow( this.diffElement.$document[ 0 ] );

		this.diff.$element.empty();

		this.diff.$element.append(
			this.diffElement.$element
		);
	}
};

/* Registration */
ve.ui.windowFactory.register( ve.ui.ExtendedDiffDialog );
