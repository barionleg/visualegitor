/*!
 * VisualEditor UserInterface TableDialog class.
 *
 * @copyright 2011-2016 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * Dialog for listing all command keyboard shortcuts.
 *
 * @class
 * @extends OO.ui.ProcessDialog
 *
 * @constructor
 * @param {Object} [config] Configuration options
 */
ve.ui.TableDialog = function VeUiTableDialog( config ) {
	// Parent constructor
	ve.ui.TableDialog.super.call( this, config );
};

/* Inheritance */

OO.inheritClass( ve.ui.TableDialog, ve.ui.FragmentDialog );

/* Static Properties */

ve.ui.TableDialog.static.name = 'table';

ve.ui.TableDialog.static.size = 'medium';

ve.ui.TableDialog.static.title = OO.ui.deferMsg( 'visualeditor-toolbar-table' );

ve.ui.TableDialog.static.actions = [
	{
		action: 'done',
		label: OO.ui.deferMsg( 'visualeditor-dialog-action-done' ),
		flags: [ 'primary', 'progressive' ]
	}
];

/* Methods */

/**
 * @inheritdoc
 */
ve.ui.TableDialog.prototype.initialize = function () {
	var captionField, panel;

	// Parent method
	ve.ui.TableDialog.super.prototype.initialize.call( this );

	panel = new OO.ui.PanelLayout( {
		padded: true,
		expanded: false
	} );

	this.captionToggle = new OO.ui.ToggleSwitchWidget();
	captionField = new OO.ui.FieldLayout( this.captionToggle, {
		align: 'left',
		label: 'Caption'
	} );

	panel.$element.append( captionField.$element );

	this.$body.append( panel.$element );
};

/**
 * @inheritdoc
 */
ve.ui.TableDialog.prototype.getSetupProcess = function ( data ) {
	return ve.ui.TableDialog.super.prototype.getSetupProcess.call( this, data )
		.next( function () {
			var captionNode = this.getFragment().getSelection().getTableNode().getCaptionNode();
			this.hadCaption = !!captionNode;
			this.captionToggle.setValue( !!captionNode );
		}, this );
};

/**
 * @inheritdoc
 */
ve.ui.TableDialog.prototype.getActionProcess = function ( action ) {
	return ve.ui.TableDialog.super.prototype.getActionProcess.call( this, action )
		.next( function () {
			var fragment,
				surfaceModel = this.getFragment().getSurface(),
				selection = surfaceModel.getSelection(),
				captionNode = this.getFragment().getSelection().getTableNode().getCaptionNode();

			if ( action === 'done' ) {
				if ( this.hadCaption !== this.captionToggle.getValue() ) {
					if ( this.hadCaption ) {
						fragment = surfaceModel.getLinearFragment( captionNode.getOuterRange(), true );
						fragment.removeContent();
					} else {
						fragment = surfaceModel.getLinearFragment( new ve.Range( selection.tableRange.start + 1 ), true );

						fragment.insertContent( [
							{ type: 'tableCaption' },
							{ type: 'paragraph', internal: { generated: 'wrapper' } },
							{ type: '/paragraph' },
							{ type: '/tableCaption' }
						], false );

						this.fragment = fragment.collapseToStart().adjustLinearSelection( 2, 2 );
					}
				}
				this.close( { action: 'done' } );
			}
		}, this );
};

/* Registration */

ve.ui.windowFactory.register( ve.ui.TableDialog );
