/*!
 * VisualEditor DataModel ResourceQueue tests.
 *
 * @copyright 2011-2015 VisualEditor Team and others; see http://ve.mit-license.org
 */

QUnit.module( 've.dm.ResourceQueue' );

var providers = [],
	responseDelay = 1000,
	itemCounter = 0,
	queue = new ve.dm.ResourceQueue( {
		threshhold: 2
	} ),
	FullResourceProvider = function VeDmFullResourceProvider( config ) {
		this.timer = null;
		// Inheritance
		ve.dm.ResourceProvider.call( this, '', config );
	},
	EmptyResourceProvider = function VeDmEmptyResourceProvider( config ) {
		this.timer = null;
		// Inheritance
		ve.dm.ResourceProvider.call( this, '', config );
	},
	SingleResultResourceProvider = function VeDmSingleResultResourceProvider( config ) {
		this.timer = null;
		// Inheritance
		ve.dm.ResourceProvider.call( this, '', config );
	};

OO.inheritClass( FullResourceProvider, ve.dm.ResourceProvider );
OO.inheritClass( EmptyResourceProvider, ve.dm.ResourceProvider );
OO.inheritClass( SingleResultResourceProvider, ve.dm.ResourceProvider );

FullResourceProvider.prototype.getResults = function ( config ) {
	var i, howMany,
		result = [],
		deferred = $.Deferred();

	config = config || {};
	howMany = config.howMany || 5;

	for ( i = itemCounter; i < itemCounter + howMany; i++ ) {
		result.push( 'result ' + ( i + 1 ) );
	}
	itemCounter = i;

	this.timer = setTimeout(
		function () {
			// Always resolve with some values
			deferred.resolve( result );
		},
		// One second
		responseDelay );

	return deferred.promise( { abort: clearTimeout( this.timer ) } );
};

EmptyResourceProvider.prototype.getResults = function () {
	var me = this,
		deferred = $.Deferred();

	this.timer = setTimeout(
		function () {
			me.toggleDepleted( true );
			// Always resolve with empty value
			deferred.resolve( [] );
		},
		// One second
		responseDelay );

	return deferred.promise( { abort: clearTimeout( this.timer ) } );
};

SingleResultResourceProvider.prototype.getResults = function ( config ) {
	var howMany,
		me = this,
		deferred = $.Deferred();

	config = config || {};
	howMany = config.howMany || 5;
	this.timer = setTimeout(
		function () {
			me.toggleDepleted( howMany > 1 );
			// Always resolve with one value
			deferred.resolve( [ 'one result (' + ( itemCounter++ + 1 ) + ')' ] );
		},
		// One second
		responseDelay );

	return deferred.promise( { abort: clearTimeout( this.timer ) } );
};

// Add providers to queue
providers = [
	new FullResourceProvider(),
	new EmptyResourceProvider(),
	new SingleResultResourceProvider()
];
queue.setProviders( providers );

/* Tests */

QUnit.test( 'Query providers', function ( assert ) {
	var done = assert.async();

	assert.expect( 7 );

	queue.setQuery( 'test 1' );

	queue.get( 10 )
		.then( function ( data ) {
			// Check that we received all requested results
			assert.equal( data.length, 10, 'Results received.' );
			// We've asked for 10 items + 2 threshhold from all providers.
			// Provider 1 returned 12 results
			// Provider 2 returned 0 results
			// Provider 3 returned 1 results
			// Overall 13 results. 10 were retrieved. 3 left in queue.
			assert.equal( queue.getQueueSize(), 3, 'Remaining queue size.' );

			// Check if sources are depleted
			assert.ok( !providers[ 0 ].isDepleted(), 'Full provider not depleted.' );
			assert.ok( providers[ 1 ].isDepleted(), 'Empty provider is depleted.' );
			assert.ok( providers[ 2 ].isDepleted(), 'Single result provider is depleted.' );

			// Ask for more results
			queue.get( 10 )
				.then( function ( data ) {
					// This time, only provider 1 was queried, because the other
					// two were marked as depleted.
					// * We asked for 10 items
					// * There are currently 3 items in the queue
					// * The queue queried provider #1 for 12 items
					// * The queue returned 10 results as requested
					// * 5 results are now left in the queue.
					assert.equal( data.length, 10, 'Results received.' );
					assert.equal( queue.getQueueSize(), 5, 'Remaining queue size.' );

					// Finish the async test
					done();
				} );
		} );
} );
