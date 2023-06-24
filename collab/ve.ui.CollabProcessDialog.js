/**
 * CollabProcessDialog - Dialog for hosting or joining a collab session
 *
 * @param {Object} [config] Configuration options
 */
ve.ui.CollabProcessDialog = function VeUiCollabProcessDialog( config ) {
	ve.ui.CollabProcessDialog.super.call( this, config );
};

OO.inheritClass( ve.ui.CollabProcessDialog, OO.ui.ProcessDialog );

ve.ui.CollabProcessDialog.static.name = null;

ve.ui.CollabProcessDialog.static.title = OO.ui.deferMsg( 'visualeditor-collab-dialog-title' );

ve.ui.CollabProcessDialog.static.imageUri = 'data:image/gif;base64,R0lGODlh/QCQAMZZAOhXyOlhywCvieprzxG0kOltzut00SC4lz7BpT3Cpe2I2E/GrE7HrO2U2++e3W3PuvCo4XzTwMfM0MrO0v/LM5vd0MvP083R1c7S1tDU2NDU2tHV2dPX2/7VWP7XZdba3dba3vTQ7fTR7dnd4Pvdfd3f4tzg4tzg4+Di5eDi5vXb8PXb8d/j5d/j5vvilfvil/rjluPl6OLm6Pvlo+bn6ubo6ubo6/rnsProrvvor/bl89nv7Onq7dnw7Onr7enr7vrqvPrrvOzt8Ozu8PruyO/w8u/w8/nw1e/x8+j08/jv9+n08/Lz9fnz4fL09fX29/X2+Pr27fj5+vn6+/r7+/r8/Pz8/Pz9/f7+/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////yH5BAEKAH8ALAAAAAD9AJAAAAf+gFmCg4SFhoeIiYqLjI2Oj5CRkpOUlZaDWFZTUpydnp+goaKjpKWmp6ipqqusra6vpFNWWIVYm7C4ubq7vL2+v7G0g7fAxcbHyMnKoVPCV8vQ0dLT1KBWglTV2tvc3a1UgsTe4+Tl2uHm6errxejs7/Dxqe7y9fb19Pf6++X5/P8Ap/kLSLBguyziDCpcmGsgw4cQTzmMSLFip4kWMz7EqLFjQY4eQ/IDKbIkPoQmUwIkqbKlOZYuY3aDKbMmNZo2cy7DiQoKk59AgwodSrRoUSiljCpdyhRo0qZQo0plmoynqRQSsmrdyrWr169gJZgQVQRD2LNo0WJgEgoKh7T+cOPKTYvhxzGrpGrM3Zs2RiizfAN75RCqhODDiL1aQHowIS7DiRGDACUkcmK2nzJY3iy4hjG8o7By5jsCFJPRgUO9Rc0a7ZDPKHk9udAa7gTMn0bUhssi1JDdwLdquBubF5MRHJIrX868ufPnz0cUGWUDuvXr2JN/sDHKyIfs4MOLv/6hBePGOtN7A62+vS727uO7gi+//rzi9vP/oq+/Pyj+/gUoBYAC9kdggfkdiGB9Ci4YX4MOtgdhhOlNSGFODUZxgwscdujhhyCGKOKIJJZo4okopqgiEKNAQQMKMMYo44w01lijEMgoGEUHFPTo449ABinkkEQWaeSRSCb+qeSSPb7Q1gbBSYACcY7BggOTWGap5ZZcdnkEKHpFKYERsFX5CgldpqnmmmwqGQQouonpQ5m9zNDmnXjmyWUToMQgpgS47YefLh7oaeihiP4IgyirAdcbnb4QkcOklFZq6aWYZqrpppx26umnoIZKBClD2GDqqaimquqqq75G5YWwhmJhrDHNSmtLtt6aUq66lsRrryH9CmxHwg6bUbHGVoRsshEty+xGgz7rn7PSKkRttR9Fi4sKCgzg7bfghivuuOSWa+656H5rQAM6kAXCBfDGK++89NZr77345qtvvhwEKqiZrugQAAAEF2zwwQgnrPDCDDfsMMIGhMKEBX/+VoyWBUhAuosDD3fs8ccgN7wCKJBZbPJXJWisC8cht+zyywmHAOfJNHdVGnq8iADzzjx/XIASoPxW89AScIczLxAU0PPSTBtswMihtEAb0RZPIMOrv+ig9dZcd+3112CHLfbYZHNtihNop6322my37fbbcMctd9xVaYstg3bf/WDeekvId98V/g04hoIPXtO1ht+DeOInAcz44YU/rtLikr9DeeXrXI55OhD61FQpnk8l+uikA3WeKD2krvrqrLfu+uuwxy57EjlGnkoMFNPlbyclU43aWKHsgIAAxBdv/PHIJ6/88sw3LwADO6iciw9zYRBKmL63NiUoBzjv/ff+4IOPgPSP7bV7o9mjRtgnPYTv/vvwE0A+LKLJdTonIKTf2vqeLAH//wBk3gHm94qJyeUEvtEfa+wCigcE8IEQjAABC4gc7JRnFEz4zng2yMEOLucDrgpFBRJAwhKa8IQoTKEKV8jCFi6gAljbHOEcJ0OTaK6G47ghDmdiux1aRIc+PEcPg9isIRIRWjQ84g+NqERrMbGJ2UoiFCECxCkqo4pWrJ0UV8EDG3nxi2AMoxjHSMYymvGMaEwjCmKwu140CEoKjKMcD4OxCbYCe3PMox7Twr9/9SJOewykILtiR1b4aZCIFGQGCrmKJ2gmkZCU4wSmczRe+ECNmMykJjf+yclOktEG9/MFFrPISFI6cYumJMgoUynKJ7LSHqt85S5iKcuGuLKW8KAlLl+hy122ope+XAUwg3kfVBIzHsM8pikadBwPOvOZI2ijFJhwgmda85rYfA4IpPmeW5omd5HEQCilAJhIVswC3MSFgnoXSb98gnrmNFnKgLHOeGZle57Aoz2jdDM/8kJo8dzdE8C5z+AYzZ+8aMEEImk1UfhgagWtTUMryYu5WfSiGHXb2TLK0Y569KNwGycvkqlMUpC0pKI4KUr/482VckOlLr1IS2NaDUFUgQo4zalOd8rTnvr0p0ANqlCHStSiGvWoSE2qUpea1Es49alQjapUp0oF1aouIhAAOw==';

ve.ui.CollabProcessDialog.prototype.initialize = function () {
	ve.ui.CollabProcessDialog.super.prototype.initialize.apply( this, arguments );

	this.content = new OO.ui.PanelLayout( {
		padded: true,
		expanded: false
	} );
	this.button = new OO.ui.ButtonWidget( {
		label: this.label,
		icon: this.icon,
		title: this.title,
		flags: [ 'primary', 'progressive' ]
	} );
	this.button.$element[ 0 ].style.display = 'block';
	this.button.$element[ 0 ].firstElementChild.style.minWidth = '100%';

	this.content.$element.append(
		$( '<img>' ).prop( 'src', ve.ui.CollabProcessDialog.static.imageUri )
			.css( { display: 'block', margin: '2em auto' } ),
		$( '<p>' ).text( this.summary )
			.css( { 'font-weight': 'bold' } ),
		$( '<p>' ).text( OO.ui.msg( 'visualeditor-collab-dialog-sharing' ) ),
		$( '<p>' ).text( OO.ui.msg( 'visualeditor-collab-dialog-sessionend' ) ),
		$( '<p>' ).text( OO.ui.msg( 'visualeditor-collab-dialog-privacy' ) ),
		$( '<div>' ).append( this.button.$element )
	);
	this.$body.append( this.content.$element );
	this.button.on( 'click', this.close.bind( this, 'accept' ) );
};

ve.ui.CollabProcessDialog.prototype.getBodyHeight = function () {
	return this.content.$element.outerHeight( true );
};

/**
 * HostCollabProcessDialog - Dialog for hosting a new collab session
 *
 * @param {Object} [config] Configuration options
 */
ve.ui.HostCollabProcessDialog = function VeUiHostCollabProcessDialog( config ) {
	ve.ui.HostCollabProcessDialog.super.call( this, config );
	this.label = OO.ui.msg( 'visualeditor-collab-hostbutton-label' );
	this.icon = 'userAdd';
	this.title = 'Host';
	this.summary = OO.ui.msg( 'visualeditor-collab-dialog-summary-host' );
};

OO.inheritClass( ve.ui.HostCollabProcessDialog, ve.ui.CollabProcessDialog );

ve.ui.HostCollabProcessDialog.static.name = 'hostCollabDialog';

ve.ui.windowFactory.register( ve.ui.HostCollabProcessDialog );

/**
 * JoinCollabProcessDialog - Dialog for joining an existing collab session
 *
 * @param {Object} [config] Configuration options
 */
ve.ui.JoinCollabProcessDialog = function VeUiJoinCollabProcessDialog( config ) {
	ve.ui.JoinCollabProcessDialog.super.call( this, config );
	this.label = OO.ui.msg( 'visualeditor-collab-joinbutton-label' );
	this.icon = 'userGroup';
	this.title = 'Join';
	this.summary = OO.ui.msg( 'visualeditor-collab-dialog-summary-join' );
};

OO.inheritClass( ve.ui.JoinCollabProcessDialog, ve.ui.CollabProcessDialog );

ve.ui.JoinCollabProcessDialog.static.name = 'joinCollabDialog';

ve.ui.windowFactory.register( ve.ui.JoinCollabProcessDialog );
