/*!
 * VisualEditor UserInterface TableDialog class.
 *
 * @copyright 2011-2020 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * Dialog for table properties.
 *
 * @class
 * @extends ve.ui.FragmentDialog
 *
 * @constructor
 * @param {Object} [config] Configuration options
 */
ve.ui.TableDialog = function VeUiTableDialog( config ) {
	// Parent constructor
	ve.ui.TableDialog.super.call( this, config );

	this.$element.addClass( 've-ui-tableDialog' );
};

/* Inheritance */

OO.inheritClass( ve.ui.TableDialog, ve.ui.FragmentDialog );

/* Static Properties */

ve.ui.TableDialog.static.name = 'table';

ve.ui.TableDialog.static.size = 'medium';

ve.ui.TableDialog.static.title = OO.ui.deferMsg( 'visualeditor-dialog-table-title' );

/* Methods */

/**
 * @inheritdoc
 */
ve.ui.TableDialog.prototype.initialize = function () {
	var container,
		dialog = this;
	// Parent method
	ve.ui.TableDialog.super.prototype.initialize.call( this );

	this.initialValues = null;

	this.panel = new OO.ui.PanelLayout( {
		padded: true,
		expanded: false,
		classes: [ 've-ui-tableDialog-panel' ]
	} );

	this.contents = new Vue( {
		el: document.createElement( 'div' ),
		template: `<div class="oo-ui-layout oo-ui-labelElement oo-ui-fieldLayout oo-ui-fieldLayout-align-left">
			<div class="oo-ui-fieldLayout-body">
				<span class="oo-ui-fieldLayout-header"><label class="oo-ui-labelElement-label">{{ label }}</label></span>
				<div class="oo-ui-fieldLayout-field">
					<input :disabled="isReadOnly" type="checkbox" v-model="captionEnabled" v-on:change="onChange">
				</div>
			</div>
		</div>`,
		data: {
			captionEnabled: false,
			isReadOnly: false,
			label: ve.msg( 'visualeditor-dialog-table-caption' )
		},
		methods: {
			onChange: function() {
				dialog.updateActions();
			}
		}
	} );
	this.panel.$element.append( this.contents.$el );

	this.$body.append( this.panel.$element );
};

/**
 * Update the 'done' action according to whether there are changes
 */
ve.ui.TableDialog.prototype.updateActions = function () {
	this.actions.setAbilities( { done: !ve.compare( this.getValues(), this.initialValues ) } );
};

/**
 * Get object describing current form values.
 *
 * To be compared against this.initialValues
 *
 * @return {Object} Current form values
 */
ve.ui.TableDialog.prototype.getValues = function () {
	return {
		caption: this.contents.captionEnabled
	};
};

/**
 * @inheritdoc
 */
ve.ui.TableDialog.prototype.getSetupProcess = function ( data ) {
	return ve.ui.TableDialog.super.prototype.getSetupProcess.call( this, data )
		.next( function () {
			var isReadOnly = this.isReadOnly();
			this.initialValues = {
				caption: !!this.getFragment().getSelection().getTableNode(
					this.getFragment().getDocument()
				).getCaptionNode()
			};
			this.contents.captionEnabled = this.initialValues.caption;
			this.contents.isReadOnly = isReadOnly;
			this.closingFragment = null;
			this.updateActions();
		}, this );
};

/**
 * @inheritdoc
 */
ve.ui.TableDialog.prototype.getActionProcess = function ( action ) {
	return ve.ui.TableDialog.super.prototype.getActionProcess.call( this, action )
		.next( function () {
			var fragment, surfaceModel, selection, captionNode;

			if ( action === 'done' ) {
				surfaceModel = this.getFragment().getSurface();
				selection = surfaceModel.getSelection();
				captionNode = this.getFragment().getSelection().getTableNode(
					this.getFragment().getDocument()
				).getCaptionNode();
				if ( this.contents.captionEnabled !== this.initialValues.caption ) {
					if ( this.initialValues.caption ) {
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
						// Don't change this.fragment immediately, wait until teardown process, as child
						// dialogs my want access to the original fragment
						this.closingFragment = fragment.collapseToStart().adjustLinearSelection( 2, 2 );
					}
				}
				this.close( { action: 'done' } );
			}
		}, this );
};

/**
 * @inheritdoc
 */
ve.ui.TableDialog.prototype.getTeardownProcess = function ( action ) {
	return ve.ui.TableDialog.super.prototype.getTeardownProcess.call( this, action )
		.first( function () {
			this.fragment = this.closingFragment || this.fragment;
		}, this );
};

/* Registration */

ve.ui.windowFactory.register( ve.ui.TableDialog );
