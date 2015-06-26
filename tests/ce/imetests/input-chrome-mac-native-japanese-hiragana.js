/*!
 * VisualEditor IME test for Chrome on Mac OS X in Hiragana Japanese using OS native IME.
 *
 * @copyright 2011-2015 VisualEditor Team and others; see http://ve.mit-license.org
 */

ve.ce.imetests.push( [ 'input-chrome-mac-native-japanese-hiragana', [
	/*jshint quotmark:double */
	{"imeIdentifier":"Mac 10.10 native Japanese Hiragana","userAgent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/43.0.2357.130 Safari/537.36","startDom":""},
	{"seq":0,"time":4.862,"action":"sendEvent","args":["keydown",{"keyCode":229}]},
	{"seq":1,"time":4.864,"action":"sendEvent","args":["compositionstart",{}]},
	{"seq":2,"time":4.865,"action":"changeText","args":["f"]},
	{"seq":3,"time":4.865,"action":"changeSel","args":[0,1]},
	{"seq":4,"time":4.865,"action":"sendEvent","args":["input",{}]},
	{"seq":5,"time":4.87,"action":"changeSel","args":[1,1]},
	{"seq":6,"time":4.87,"action":"endLoop","args":[]},
	{"seq":7,"time":4.914,"action":"sendEvent","args":["keydown",{"keyCode":229}]},
	{"seq":8,"time":4.916,"action":"changeText","args":["ふぇ"]},
	{"seq":9,"time":4.916,"action":"changeSel","args":[0,2]},
	{"seq":10,"time":4.916,"action":"sendEvent","args":["input",{}]},
	{"seq":11,"time":4.923,"action":"changeSel","args":[2,2]},
	{"seq":12,"time":4.923,"action":"endLoop","args":[]},
	{"seq":13,"time":4.947,"action":"sendEvent","args":["keyup",{"keyCode":70}]},
	{"seq":14,"time":4.953,"action":"endLoop","args":[]},
	{"seq":15,"time":4.987,"action":"sendEvent","args":["keyup",{"keyCode":69}]},
	{"seq":16,"time":4.993,"action":"endLoop","args":[]},
	{"seq":17,"time":5.369,"action":"sendEvent","args":["keydown",{"keyCode":229}]},
	{"seq":18,"time":5.374,"action":"changeText","args":["ふぇf"]},
	{"seq":19,"time":5.374,"action":"changeSel","args":[0,3]},
	{"seq":20,"time":5.374,"action":"sendEvent","args":["input",{}]},
	{"seq":21,"time":5.388,"action":"changeSel","args":[3,3]},
	{"seq":22,"time":5.388,"action":"endLoop","args":[]},
	{"seq":23,"time":5.436,"action":"sendEvent","args":["keyup",{"keyCode":70}]},
	{"seq":24,"time":5.444,"action":"endLoop","args":[]},
	{"seq":25,"time":5.453,"action":"sendEvent","args":["keydown",{"keyCode":229}]},
	{"seq":26,"time":5.46,"action":"changeText","args":["ふぇふぃ"]},
	{"seq":27,"time":5.46,"action":"changeSel","args":[0,4]},
	{"seq":28,"time":5.46,"action":"sendEvent","args":["input",{}]},
	{"seq":29,"time":5.483,"action":"changeSel","args":[4,4]},
	{"seq":30,"time":5.483,"action":"endLoop","args":[]},
	{"seq":31,"time":5.5,"action":"sendEvent","args":["keyup",{"keyCode":73}]},
	{"seq":32,"time":5.513,"action":"endLoop","args":[]},
	{"seq":33,"time":6.034,"action":"sendEvent","args":["keydown",{"keyCode":229}]},
	{"seq":34,"time":6.047,"action":"changeText","args":["ふぇふぃf"]},
	{"seq":35,"time":6.047,"action":"changeSel","args":[0,5]},
	{"seq":36,"time":6.047,"action":"sendEvent","args":["input",{}]},
	{"seq":37,"time":6.08,"action":"changeSel","args":[5,5]},
	{"seq":38,"time":6.08,"action":"endLoop","args":[]},
	{"seq":39,"time":6.106,"action":"sendEvent","args":["keyup",{"keyCode":70}]},
	{"seq":40,"time":6.121,"action":"endLoop","args":[]},
	{"seq":41,"time":6.136,"action":"sendEvent","args":["keydown",{"keyCode":229}]},
	{"seq":42,"time":6.152,"action":"changeText","args":["ふぇふぃふぉ"]},
	{"seq":43,"time":6.152,"action":"changeSel","args":[0,6]},
	{"seq":44,"time":6.152,"action":"sendEvent","args":["input",{}]},
	{"seq":45,"time":6.2,"action":"changeSel","args":[6,6]},
	{"seq":46,"time":6.2,"action":"sendEvent","args":["keyup",{"keyCode":79}]},
	{"seq":47,"time":6.233,"action":"endLoop","args":[]},
	{"seq":48,"time":6.256,"action":"endLoop","args":[]},
	{"seq":49,"time":6.593,"action":"sendEvent","args":["keydown",{"keyCode":229}]},
	{"seq":50,"time":6.614,"action":"changeText","args":["ふぇふぃふぉf"]},
	{"seq":51,"time":6.614,"action":"changeSel","args":[0,7]},
	{"seq":52,"time":6.614,"action":"sendEvent","args":["input",{}]},
	{"seq":53,"time":6.678,"action":"changeSel","args":[7,7]},
	{"seq":54,"time":6.678,"action":"sendEvent","args":["keyup",{"keyCode":70}]},
	{"seq":55,"time":6.722,"action":"endLoop","args":[]},
	{"seq":56,"time":6.746,"action":"sendEvent","args":["keydown",{"keyCode":229}]},
	{"seq":57,"time":6.77,"action":"endLoop","args":[]},
	{"seq":58,"time":6.798,"action":"changeText","args":["ふぇふぃふぉふ"]},
	{"seq":59,"time":6.798,"action":"changeSel","args":[0,7]},
	{"seq":60,"time":6.798,"action":"sendEvent","args":["input",{}]},
	{"seq":61,"time":6.875,"action":"changeSel","args":[7,7]},
	{"seq":62,"time":6.875,"action":"sendEvent","args":["keyup",{"keyCode":85}]},
	{"seq":63,"time":6.936,"action":"endLoop","args":[]},
	{"seq":64,"time":6.967,"action":"sendEvent","args":["keydown",{"keyCode":229}]},
	{"seq":65,"time":6.999,"action":"changeText","args":["ふぇふぃふぉふm"]},
	{"seq":66,"time":6.999,"action":"changeSel","args":[0,8]},
	{"seq":67,"time":6.999,"action":"sendEvent","args":["input",{}]},
	{"seq":68,"time":7.098,"action":"changeSel","args":[8,8]},
	{"seq":69,"time":7.098,"action":"sendEvent","args":["keyup",{"keyCode":77}]},
	{"seq":70,"time":7.172,"action":"endLoop","args":[]},
	{"seq":71,"time":7.21,"action":"endLoop","args":[]},
	{"seq":72,"time":7.616,"action":"sendEvent","args":["keydown",{"keyCode":229}]},
	{"seq":73,"time":7.656,"action":"changeText","args":["ふぇふぃふぉふも"]},
	{"seq":74,"time":7.656,"action":"changeSel","args":[0,8]},
	{"seq":75,"time":7.656,"action":"sendEvent","args":["input",{}]},
	{"seq":76,"time":7.775,"action":"changeSel","args":[8,8]},
	{"seq":77,"time":7.775,"action":"sendEvent","args":["keyup",{"keyCode":79}]},
	{"seq":78,"time":7.861,"action":"endLoop","args":[]},
	{"seq":79,"time":7.906,"action":"endLoop","args":[]},
	{"seq":80,"time":8.17,"action":"sendEvent","args":["keydown",{"keyCode":229}]},
	{"seq":81,"time":8.219,"action":"changeSel","args":[0,8]},
	{"seq":82,"time":8.219,"action":"sendEvent","args":["compositionend",{}]},
	{"seq":83,"time":8.318,"action":"changeSel","args":[8,8]},
	{"seq":84,"time":8.318,"action":"sendEvent","args":["input",{}]},
	{"seq":85,"time":8.426,"action":"sendEvent","args":["keyup",{"keyCode":13}]},
	{"seq":86,"time":8.477,"action":"endLoop","args":[]},
	{"seq":87,"time":8.536,"action":"endLoop","args":[]}
] ] );
