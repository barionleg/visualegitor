/*!
 * VisualEditor DataModel ResourceQueue tests.
 *
 * @copyright 2011-2015 VisualEditor Team and others; see http://ve.mit-license.org
 */

QUnit.module( 've.dm.APIResultsQueue' );

var providers = [],
	// One second
	responseDelay = 1000,
	itemCounter = 0,
	queue = new ve.dm.APIResultsQueue( {
		threshhold: 2
	} ),
	FullResourceProvider = function VeDmFullResourceProvider( config ) {
		this.timer = null;
		// Inheritance
		ve.dm.APIResultsProvider.call( this, '', config );
	},
	EmptyResourceProvider = function VeDmEmptyResourceProvider( config ) {
		this.timer = null;
		// Inheritance
		ve.dm.APIResultsProvider.call( this, '', config );
	},
	SingleResultResourceProvider = function VeDmSingleResultResourceProvider( config ) {
		this.timer = null;
		// Inheritance
		ve.dm.APIResultsProvider.call( this, '', config );
	};

OO.inheritClass( FullResourceProvider, ve.dm.APIResultsProvider );
OO.inheritClass( EmptyResourceProvider, ve.dm.APIResultsProvider );
OO.inheritClass( SingleResultResourceProvider, ve.dm.APIResultsProvider );

FullResourceProvider.prototype.getResults = function ( config ) {
	var i, howMany, timer,
		result = [],
		deferred = $.Deferred();

	config = config || {};
	howMany = config.howMany || 5;

	for ( i = itemCounter; i < itemCounter + howMany; i++ ) {
		result.push( 'result ' + ( i + 1 ) );
	}
	itemCounter = i;

	timer = setTimeout(
		function () {
			// Always resolve with some values
			deferred.resolve( result );
		},
		responseDelay );

	return deferred.promise( { abort: function () { clearTimeout( timer ); } } );
};

EmptyResourceProvider.prototype.getResults = function () {
	var me = this,
		deferred = $.Deferred(),
		timer = setTimeout(
			function () {
				me.toggleDepleted( true );
				// Always resolve with empty value
				deferred.resolve( [] );
			},
			responseDelay );

	return deferred.promise( { abort: function () { clearTimeout( timer ); } } );
};

SingleResultResourceProvider.prototype.getResults = function ( config ) {
	var howMany, timer,
		me = this,
		deferred = $.Deferred();

	config = config || {};
	howMany = config.howMany || 5;

	timer = setTimeout(
		function () {
			me.toggleDepleted( howMany > 1 );
			// Always resolve with one value
			deferred.resolve( [ 'one result (' + ( itemCounter++ + 1 ) + ')' ] );
		},
		responseDelay );

	return deferred.promise( { abort: function () { clearTimeout( timer ); } } );
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

	assert.expect( 15 );

	queue.setQuery( 'Query 1' );

	queue.get( 10 )
		.then( function ( data ) {
			// Check that we received all requested results
			assert.equal( data.length, 10, 'Query 1: Results received.' );
			// We've asked for 10 items + 2 threshhold from all providers.
			// Provider 1 returned 12 results
			// Provider 2 returned 0 results
			// Provider 3 returned 1 results
			// Overall 13 results. 10 were retrieved. 3 left in queue.
			assert.equal( queue.getQueueSize(), 3, 'Query 1: Remaining queue size.' );

			// Check if sources are depleted
			assert.ok( !providers[ 0 ].isDepleted(), 'Query 1: Full provider not depleted.' );
			assert.ok( providers[ 1 ].isDepleted(), 'Query 1: Empty provider is depleted.' );
			assert.ok( providers[ 2 ].isDepleted(), 'Query 1: Single result provider is depleted.' );

			// Ask for more results
			queue.get( 10 )
				.then( function ( data1 ) {
					// This time, only provider 1 was queried, because the other
					// two were marked as depleted.
					// * We asked for 10 items
					// * There are currently 3 items in the queue
					// * The queue queried provider #1 for 12 items
					// * The queue returned 10 results as requested
					// * 5 results are now left in the queue.
					assert.equal( data1.length, 10, 'Query 1: Second set of results received.' );
					assert.equal( queue.getQueueSize(), 5, 'Query 1: Remaining queue size.' );

					// Change the query
					queue.setQuery( 'Query 2' );
					// Check if sources are depleted
					assert.ok( !providers[ 0 ].isDepleted(), 'Query 2: Full provider not depleted.' );
					assert.ok( !providers[ 1 ].isDepleted(), 'Query 2: Empty provider not depleted.' );
					assert.ok( !providers[ 2 ].isDepleted(), 'Query 2: Single result provider not depleted.' );

					queue.get( 10 )
						.then( function ( data2 ) {
							// This should be the same as the very first result
							assert.equal( data2.length, 10, 'Query 2: Results received.' );
							assert.equal( queue.getQueueSize(), 3, 'Query 2: Remaining queue size.' );
							// Check if sources are depleted
							assert.ok( !providers[ 0 ].isDepleted(), 'Query 2: Full provider not depleted.' );
							assert.ok( providers[ 1 ].isDepleted(), 'Query 2: Empty provider is not depleted.' );
							assert.ok( providers[ 2 ].isDepleted(), 'Query 2: Single result provider is not depleted.' );

							// Finish the async test
							done();
						} );

				} );
		} );
} );
