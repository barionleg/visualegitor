<?php

require 'vendor/autoload.php';

session_start();

$response = array(
	'session' => session_id(),
	'transactions' => array(),
	'selections' => array()
);

$m = new MongoDB\Client();
$ve = $m->ve;
$transactions = $ve->transactions;
$selections = $ve->selections;

if ( isset( $_GET['clear'] ) ) {
	$transactions->remove();
	$selections->remove();
	exit();
}

$transactions->createIndex( array( 'historyPointer' => 1 ) );
$selections->createIndex( array( 'lastSeen' => 1 ) );

// New transactions
if ( isset( $_POST['transactions'] ) ) {
	$transactions->insertOne( array(
		'historyPointer' => (int) $_POST['historyPointer'],
		'documentId' => $_POST['documentId'],
		'userId' => $_POST['userId'],
		'transactions' => $_POST['transactions']
	) );
}

// New selection
if ( isset( $_POST['selection'] ) ) {
	$selections->replaceOne(
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
$selections->updateOne(
	array(
		'userId' => $_POST['userId'],
		'documentId' => $_POST['documentId']
	),
	array(
		'$set' => array( 'lastSeen' => time() )
	),
	array(
		'upsert' => true
	)
);

// Fetch new transactions
$cursor = $transactions->find( array(
	'historyPointer' => array( '$gt' => (int) $_POST['historyPointer'] ),
	'documentId' => $_POST['documentId']
) );
$it = new \IteratorIterator($cursor);
$it->rewind();
while ( $transaction = $it->current() ) {
	if ( $transaction['userId'] !== $_POST['userId'] ) {
		array_push( $response['transactions'], $transaction );
	}
	$it->next();
}

// Time out selections
$cursor = $selections->deleteMany( array(
	'lastSeen' => array( '$lte' => time() - 10 )
) );

// Fetch all selections
$cursor = $selections->find( array( 'documentId' => $_POST['documentId'] ) );
$it = new \IteratorIterator($cursor);
$it->rewind();
while ( $selection = $it->current() ) {
	if ( $selection['userId'] !== $_POST['userId'] ) {
		$response['selections'][$selection['userId']] = $selection;
	}
	$it->next();
}

echo json_encode( $response );
