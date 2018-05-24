/*!
 * VisualEditor TableOptionWidget class.
 *
 * @copyright 2011-2018 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * Context item for a table line (row or column) toolset.
 *
 * @class
 * @abstract
 * @extends OO.ui.MenuOptionWidget
 *
 * @param {ve.ui.Context} context Context item is in
 * @param {ve.dm.Model} model Model the item is related to
 * @param {Function} tool Tool class the item is based on
 * @param {Object} config Configuration options
 */
ve.ui.TableOptionWidget = function VeUiTableOptionWidget( surfaceModel, action, mode, side, config ) {
	var icon, actionName, modeName, sideName;
	this.action = action;
	this.mode = mode;
	this.side = side;
	this.surfaceModel = surfaceModel;

	if ( action === 'delete' ) {
		icon = 'trash';
	} else {
		actionName = { insert: 'Add', move: 'Move' }[ action ];
		modeName = { row: 'Row', col: 'Column' }[ mode ];
		sideName = { before: 'Before', after: 'After' }[ side ];
		icon = 'table' + actionName + modeName + sideName;
	}

	// Parent constructor
	ve.ui.TableOptionWidget.super.call( this, ve.extendObject( { icon: icon }, config ) );

	this.update();

	// Initialization
	this.$element.addClass( 've-ui-tableOptionWidget' );
};

/* Inheritance */

OO.inheritClass( ve.ui.TableOptionWidget, OO.ui.MenuOptionWidget );

/* Static Properties */

ve.ui.TableOptionWidget.static.name = 'tableLine';

/* Methods */

ve.ui.TableOptionWidget.prototype.action = function () {
	var command = this.getCommand();

	if ( command ) {
		command.execute( this.context.getSurface() );
		this.emit( 'command' );
	}
};

ve.ui.TableOptionWidget.prototype.update = function () {
	var label, count, selection;
	if ( this.action === 'delete' ) {
		selection = this.surfaceModel.getSelection();

		if ( !( selection instanceof ve.dm.TableSelection ) ) {
			count = 0;
		} else if ( this.mode === 'row' ) {
			count = selection.getRowCount();
		} else {
			count = selection.getColCount();
		}

		// Messages used here:
		// * visualeditor-table-delete-col
		// * visualeditor-table-delete-row
		label = ve.msg( 'visualeditor-table-delete-' + this.mode, count );
	} else {
		label = ve.msg( 'visualeditor-table-' + this.action + '-' + this.mode + '-' + this.side );
	}
	this.setLabel( label );
};

/* Specific tools */

( function () {

	var className,
		modes = [ 'row', 'col' ],
		sides = [ 'before', 'after' ],
		modeNames = { row: 'Row', col: 'Column' },
		sideNames = { before: 'Before', after: 'After' };

	modes.forEach( function ( mode ) {
		var modeName = modeNames[ mode ];

		sides.forEach( function ( side ) {
			var sideName = sideNames[ side ];

			// Classes created here:
			// * ve.ui.InsertColumnBeforeOption
			// * ve.ui.InsertColumnAfterOption
			// * ve.ui.InsertRowBeforeOption
			// * ve.ui.InsertRowAfterOption
			className = 'Insert' + modeName + sideName + 'Option';
			ve.ui[ className ] = function VeUiInsertRowOrColumnOption() {
				ve.ui.TableOptionWidget.apply( this, arguments );
			};
			OO.inheritClass( ve.ui[ className ], ve.ui.TableOptionWidget );
			ve.ui[ className ].static.name = 'insert' + modeName + sideName;
			ve.ui[ className ].static.group = 'table-' + mode;
			ve.ui[ className ].static.icon = 'tableAdd' + modeName + sideName;
			// Messages used here:
			// * visualeditor-table-insert-col-before
			// * visualeditor-table-insert-col-after
			// * visualeditor-table-insert-row-before
			// * visualeditor-table-insert-row-after
			ve.ui[ className ].static.label =
				OO.ui.deferMsg( 'visualeditor-table-insert-' + mode + '-' + side );
			ve.ui[ className ].static.commandName = 'insert' + modeName + sideName;
			// ve.ui.contextItemFactory.register( ve.ui[ className ] );

			// Classes created here:
			// * ve.ui.MoveColumnBeforeOption
			// * ve.ui.MoveColumnAfterOption
			// * ve.ui.MoveRowBeforeOption
			// * ve.ui.MoveRowAfterOption
			className = 'Move' + modeName + sideName + 'Option';
			ve.ui[ className ] = function VeUiMoveRowOrColumnOption() {
				ve.ui.TableOptionWidget.apply( this, arguments );
			};
			OO.inheritClass( ve.ui[ className ], ve.ui.TableOptionWidget );
			ve.ui[ className ].static.name = 'move' + modeName + sideName;
			ve.ui[ className ].static.group = 'table-' + mode;
			ve.ui[ className ].static.icon = 'tableMove' + modeName + sideName;
			// Messages used here:
			// * visualeditor-table-move-col-before
			// * visualeditor-table-move-col-after
			// * visualeditor-table-move-row-before
			// * visualeditor-table-move-row-after
			ve.ui[ className ].static.label =
				OO.ui.deferMsg( 'visualeditor-table-move-' + mode + '-' + side );
			ve.ui[ className ].static.commandName = 'move' + modeName + sideName;
			ve.ui[ className ].prototype.setup = function () {
				var selection, matrix;

				// Parent method
				ve.ui.TableOptionWidget.prototype.setup.call( this );

				selection = this.context.getSurface().getModel().getSelection();

				if ( !( selection instanceof ve.dm.TableSelection ) ) {
					this.actionButton.setDisabled( true );
					return;
				}

				if ( side === 'before' ) {
					this.actionButton.setDisabled(
						( mode === 'row' && selection.startRow === 0 ) ||
						( mode === 'col' && selection.startCol === 0 )
					);
				} else {
					matrix = selection.getTableNode().getMatrix();
					this.actionButton.setDisabled(
						( mode === 'row' && selection.endRow === matrix.getRowCount() - 1 ) ||
						( mode === 'col' && selection.endCol === matrix.getMaxColCount() - 1 )
					);
				}
			};
			// ve.ui.contextItemFactory.register( ve.ui[ className ] );
		} );

		// Classes created here:
		// * ve.ui.DeleteColumnOption
		// * ve.ui.DeleteRowOption
		className = 'Delete' + modeName + 'Option';
		ve.ui[ className ] = function VeUiDeleteRowOrColumnOption() {
			ve.ui.TableOptionWidget.apply( this, arguments );

			this.actionButton.setFlags( { destructive: true } );
		};
		OO.inheritClass( ve.ui[ className ], ve.ui.TableOptionWidget );
		ve.ui[ className ].static.name = 'delete' + modeName;
		ve.ui[ className ].static.group = 'table-' + mode;
		ve.ui[ className ].static.icon = 'trash';
		ve.ui[ className ].static.commandName = 'delete' + modeName;
		ve.ui[ className ].prototype.getLabel = function () {
			var count,
				selection = this.context.getSurface().getModel().getSelection();

			if ( !( selection instanceof ve.dm.TableSelection ) ) {
				count = 0;
			} else if ( mode === 'row' ) {
				count = selection.getRowCount();
			} else {
				count = selection.getColCount();
			}

			// Messages used here:
			// * visualeditor-table-delete-col
			// * visualeditor-table-delete-row
			return ve.msg( 'visualeditor-table-delete-' + mode, count );
		};
		//ve.ui.contextItemFactory.register( ve.ui[ className ] );

	} );

}() );
