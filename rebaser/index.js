$( function () {
	var documentNameInput = new OO.ui.TextInputWidget( {
			placeholder: 'Document name'
		} ),
		submitButton = new OO.ui.ButtonWidget( {
			label: 'Create/edit'
		} ),
		documentNameField = new OO.ui.ActionFieldLayout( documentNameInput, submitButton, {
			align: 'top'
		} );

	function onSubmit() {
		var docName = documentNameInput.getValue().replace( / /g, '_' );
		window.location.href = '/doc/edit/' + encodeURIComponent( docName );
	}

	submitButton.on( 'click', onSubmit );
	documentNameInput.on( 'enter', onSubmit );

	$( '.ve-demo-index' ).append( documentNameField.$element );

	documentNameInput.focus();

} );
