<?php

session_start();

$response = array(
	'session' => session_id(),
	'transactions' => array(),
	'selections' => array()
);

$m = new MongoClient();
$ve = $m->ve;
$transactions = $ve->transactions;
$selections = $ve->selections;

if ( isset( $_GET['clear'] ) ) {
	$transactions->remove();
	$selections->remove();
	exit();
}

$transactions->ensureIndex( array( 'historyPointer' => 1 ) );
$selections->ensureIndex( array( 'lastSeen' => 1 ) );

// New transactions
if ( isset( $_POST['transactions'] ) ) {
	$transactions->insert( array(
		'historyPointer' => (int) $_POST['historyPointer'],
		'documentId' => $_POST['documentId'],
		'userId' => $_POST['userId'],
		'transactions' => $_POST['transactions']
	) );
}

// New selection
if ( isset( $_POST['selection'] ) ) {
	$selections->update(
		array(
			'userId' => $_POST['userId'],
			'documentId' => $_POST['documentId']
		),
		array(
			'userId' => $_POST['userId'],
			'documentId' => $_POST['documentId'],
			'selection' => $_POST['selection'],
			'historyPointer' => (int) $_POST['historyPointer'],
			'lastSeen' => time()
		),
		array( 'upsert' => true )
	);
}

// Update last seen for this users
$selections->update(
	array(
		'userId' => $_POST['userId'],
		'documentId' => $_POST['documentId']
	),
	array(
		'$set' => array( 'lastSeen' => time() )
	)
);

// Fetch new transactions
$cursor = $transactions->find( array(
	'historyPointer' => array( '$gt' => (int) $_POST['historyPointer'] ),
	'documentId' => $_POST['documentId']
) );
while ( $cursor->hasNext() ) {
	$transaction = $cursor->getNext();
	if ( $transaction['userId'] !== $_POST['userId'] ) {
		array_push( $response['transactions'], $transaction );
	}
}

// Time out selections
$cursor = $selections->remove( array(
	'lastSeen' => array( '$lte' => time() - 10 )
) );

// Fetch all selections
$cursor = $selections->find( array( 'documentId' => $_POST['documentId'] ) );
while ( $cursor->hasNext() ) {
	$selection = $cursor->getNext();
	if ( $selection['userId'] !== $_POST['userId'] ) {
		$response['selections'][$selection['userId']] = $selection;
	}
}

echo json_encode( $response );