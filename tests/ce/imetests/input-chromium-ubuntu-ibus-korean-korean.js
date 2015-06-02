/*!
 * VisualEditor IME test for Chromium on Ubuntu in Korean using iBus.
 *
 * @copyright 2011-2015 VisualEditor Team and others; see http://ve.mit-license.org
 */

ve.ce.imetests.push( [ 'input-chromium-ubuntu-ibus-korean-korean', [
	/*jshint quotmark:double */
	{ "imeIdentifier": "ibus Korean Korean", "userAgent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.22 (KHTML, like Gecko) Ubuntu Chromium/25.0.1364.160 Chrome/25.0.1364.160 Safari/537.22", "startDom": "x" },
	{ "seq": 0, "time": 8.732, "action": "sendEvent", "args": [ "keydown", { "keyCode": 229 } ] },
	{ "seq": 1, "time": 8.734, "action": "sendEvent", "args": [ "compositionstart", {} ] },
	{ "seq": 2, "time": 8.739, "action": "changeText", "args": [ "ㅎ" ] },
	{ "seq": 3, "time": 8.739, "action": "changeSel", "args": [ 0, 1 ] },
	{ "seq": 4, "time": 8.739, "action": "sendEvent", "args": [ "input", {} ] },
	{ "seq": 5, "time": 8.742, "action": "changeSel", "args": [ 1, 1 ] },
	{ "seq": 6, "time": 8.742, "action": "sendEvent", "args": [ "keyup", { "keyCode": 229 } ] },
	{ "seq": 7, "time": 8.75, "action": "endLoop", "args": [] },
	{ "seq": 8, "time": 9.02, "action": "sendEvent", "args": [ "keydown", { "keyCode": 229 } ] },
	{ "seq": 9, "time": 9.025, "action": "changeText", "args": [ "하" ] },
	{ "seq": 10, "time": 9.025, "action": "changeSel", "args": [ 0, 0 ] },
	{ "seq": 11, "time": 9.025, "action": "sendEvent", "args": [ "input", {} ] },
	{ "seq": 12, "time": 9.028, "action": "changeSel", "args": [ 1, 1 ] },
	{ "seq": 13, "time": 9.028, "action": "sendEvent", "args": [ "keyup", { "keyCode": 229 } ] },
	{ "seq": 14, "time": 9.036, "action": "endLoop", "args": [] },
	{ "seq": 15, "time": 9.198, "action": "sendEvent", "args": [ "keydown", { "keyCode": 229 } ] },
	{ "seq": 16, "time": 9.203, "action": "changeText", "args": [ "한" ] },
	{ "seq": 17, "time": 9.203, "action": "changeSel", "args": [ 0, 0 ] },
	{ "seq": 18, "time": 9.203, "action": "sendEvent", "args": [ "input", {} ] },
	{ "seq": 19, "time": 9.206, "action": "changeSel", "args": [ 1, 1 ] },
	{ "seq": 20, "time": 9.206, "action": "sendEvent", "args": [ "keyup", { "keyCode": 229 } ] },
	{ "seq": 21, "time": 9.216, "action": "endLoop", "args": [] },
	{ "seq": 22, "time": 9.431, "action": "sendEvent", "args": [ "keydown", { "keyCode": 229 } ] },
	{ "seq": 23, "time": 9.434, "action": "changeSel", "args": [ 0, 1 ] },
	{ "seq": 24, "time": 9.434, "action": "sendEvent", "args": [ "compositionend", {} ] },
	{ "seq": 25, "time": 9.439, "action": "changeSel", "args": [ 0, 0 ] },
	{ "seq": 26, "time": 9.439, "action": "sendEvent", "args": [ "input", {} ] },
	{ "seq": 27, "time": 9.443, "action": "changeSel", "args": [ 1, 1 ] },
	{ "seq": 28, "time": 9.443, "action": "sendEvent", "args": [ "keyup", { "keyCode": 229 } ] },
	{ "seq": 29, "time": 9.446, "action": "sendEvent", "args": [ "keydown", { "keyCode": 229 } ] },
	{ "seq": 30, "time": 9.448, "action": "sendEvent", "args": [ "compositionstart", {} ] },
	{ "seq": 31, "time": 9.453, "action": "changeText", "args": [ "한ㄱ" ] },
	{ "seq": 32, "time": 9.453, "action": "sendEvent", "args": [ "input", {} ] },
	{ "seq": 33, "time": 9.457, "action": "changeSel", "args": [ 2, 2 ] },
	{ "seq": 34, "time": 9.457, "action": "sendEvent", "args": [ "keyup", { "keyCode": 229 } ] },
	{ "seq": 35, "time": 9.468, "action": "endLoop", "args": [] },
	{ "seq": 36, "time": 9.575, "action": "sendEvent", "args": [ "keydown", { "keyCode": 229 } ] },
	{ "seq": 37, "time": 9.58, "action": "changeText", "args": [ "한그" ] },
	{ "seq": 38, "time": 9.58, "action": "changeSel", "args": [ 1, 1 ] },
	{ "seq": 39, "time": 9.58, "action": "sendEvent", "args": [ "input", {} ] },
	{ "seq": 40, "time": 9.587, "action": "changeSel", "args": [ 2, 2 ] },
	{ "seq": 41, "time": 9.587, "action": "sendEvent", "args": [ "keyup", { "keyCode": 229 } ] },
	{ "seq": 42, "time": 9.597, "action": "endLoop", "args": [] },
	{ "seq": 43, "time": 9.813, "action": "sendEvent", "args": [ "keydown", { "keyCode": 229 } ] },
	{ "seq": 44, "time": 9.819, "action": "changeText", "args": [ "한글" ] },
	{ "seq": 45, "time": 9.819, "action": "changeSel", "args": [ 1, 1 ] },
	{ "seq": 46, "time": 9.819, "action": "sendEvent", "args": [ "input", {} ] },
	{ "seq": 47, "time": 9.825, "action": "changeSel", "args": [ 2, 2 ] },
	{ "seq": 48, "time": 9.825, "action": "sendEvent", "args": [ "keyup", { "keyCode": 229 } ] },
	{ "seq": 49, "time": 9.837, "action": "endLoop", "args": [] },
	{ "seq": 50, "time": 10.037, "action": "sendEvent", "args": [ "keydown", { "keyCode": 229 } ] },
	{ "seq": 51, "time": 10.04, "action": "changeSel", "args": [ 1, 2 ] },
	{ "seq": 52, "time": 10.04, "action": "sendEvent", "args": [ "compositionend", {} ] },
	{ "seq": 53, "time": 10.046, "action": "changeSel", "args": [ 1, 1 ] },
	{ "seq": 54, "time": 10.046, "action": "sendEvent", "args": [ "input", {} ] },
	{ "seq": 55, "time": 10.052, "action": "changeSel", "args": [ 2, 2 ] },
	{ "seq": 56, "time": 10.052, "action": "sendEvent", "args": [ "keyup", { "keyCode": 229 } ] },
	{ "seq": 57, "time": 10.057, "action": "sendEvent", "args": [ "keydown", { "keyCode": 229 } ] },
	{ "seq": 58, "time": 10.06, "action": "sendEvent", "args": [ "keyup", { "keyCode": 229 } ] },
	{ "seq": 59, "time": 10.063, "action": "sendEvent", "args": [ "keydown", { "keyCode": 229 } ] },
	{ "seq": 60, "time": 10.067, "action": "changeText", "args": [ "한글&nbsp;" ] },
	{ "seq": 61, "time": 10.067, "action": "sendEvent", "args": [ "input", {} ] },
	{ "seq": 62, "time": 10.08, "action": "changeSel", "args": [ 3, 3 ] },
	{ "seq": 63, "time": 10.08, "action": "endLoop", "args": [] },
	{ "seq": 64, "time": 10.151, "action": "sendEvent", "args": [ "keyup", { "keyCode": 32 } ] },
	{ "seq": 65, "time": 10.16, "action": "endLoop", "args": [] },
	{ "seq": 66, "time": 10.334, "action": "sendEvent", "args": [ "keydown", { "keyCode": 229 } ] },
	{ "seq": 67, "time": 10.337, "action": "sendEvent", "args": [ "compositionstart", {} ] },
	{ "seq": 68, "time": 10.344, "action": "changeText", "args": [ "한글 ㅅ" ] },
	{ "seq": 69, "time": 10.344, "action": "changeSel", "args": [ 2, 2 ] },
	{ "seq": 70, "time": 10.344, "action": "sendEvent", "args": [ "input", {} ] },
	{ "seq": 71, "time": 10.353, "action": "changeSel", "args": [ 4, 4 ] },
	{ "seq": 72, "time": 10.353, "action": "sendEvent", "args": [ "keyup", { "keyCode": 229 } ] },
	{ "seq": 73, "time": 10.367, "action": "endLoop", "args": [] },
	{ "seq": 74, "time": 10.487, "action": "sendEvent", "args": [ "keydown", { "keyCode": 229 } ] },
	{ "seq": 75, "time": 10.494, "action": "changeText", "args": [ "한글 시" ] },
	{ "seq": 76, "time": 10.494, "action": "changeSel", "args": [ 3, 3 ] },
	{ "seq": 77, "time": 10.494, "action": "sendEvent", "args": [ "input", {} ] },
	{ "seq": 78, "time": 10.504, "action": "changeSel", "args": [ 4, 4 ] },
	{ "seq": 79, "time": 10.504, "action": "sendEvent", "args": [ "keyup", { "keyCode": 229 } ] },
	{ "seq": 80, "time": 10.517, "action": "endLoop", "args": [] },
	{ "seq": 81, "time": 10.745, "action": "sendEvent", "args": [ "keydown", { "keyCode": 229 } ] },
	{ "seq": 82, "time": 10.752, "action": "changeText", "args": [ "한글 싷" ] },
	{ "seq": 83, "time": 10.752, "action": "changeSel", "args": [ 3, 3 ] },
	{ "seq": 84, "time": 10.752, "action": "sendEvent", "args": [ "input", {} ] },
	{ "seq": 85, "time": 10.763, "action": "changeSel", "args": [ 4, 4 ] },
	{ "seq": 86, "time": 10.763, "action": "sendEvent", "args": [ "keyup", { "keyCode": 229 } ] },
	{ "seq": 87, "time": 10.777, "action": "endLoop", "args": [] },
	{ "seq": 88, "time": 10.899, "action": "sendEvent", "args": [ "keydown", { "keyCode": 229 } ] },
	{ "seq": 89, "time": 10.903, "action": "changeSel", "args": [ 3, 4 ] },
	{ "seq": 90, "time": 10.903, "action": "sendEvent", "args": [ "compositionend", {} ] },
	{ "seq": 91, "time": 10.912, "action": "changeText", "args": [ "한글 시" ] },
	{ "seq": 92, "time": 10.912, "action": "changeSel", "args": [ 3, 3 ] },
	{ "seq": 93, "time": 10.912, "action": "sendEvent", "args": [ "input", {} ] },
	{ "seq": 94, "time": 10.924, "action": "changeSel", "args": [ 4, 4 ] },
	{ "seq": 95, "time": 10.924, "action": "sendEvent", "args": [ "keyup", { "keyCode": 229 } ] },
	{ "seq": 96, "time": 10.931, "action": "sendEvent", "args": [ "keydown", { "keyCode": 229 } ] },
	{ "seq": 97, "time": 10.936, "action": "sendEvent", "args": [ "compositionstart", {} ] },
	{ "seq": 98, "time": 10.943, "action": "changeText", "args": [ "한글 시허" ] },
	{ "seq": 99, "time": 10.943, "action": "sendEvent", "args": [ "input", {} ] },
	{ "seq": 100, "time": 10.951, "action": "changeSel", "args": [ 5, 5 ] },
	{ "seq": 101, "time": 10.951, "action": "sendEvent", "args": [ "keyup", { "keyCode": 229 } ] },
	{ "seq": 102, "time": 10.967, "action": "endLoop", "args": [] },
	{ "seq": 103, "time": 11.141, "action": "sendEvent", "args": [ "keydown", { "keyCode": 229 } ] },
	{ "seq": 104, "time": 11.149, "action": "changeText", "args": [ "한글 시험" ] },
	{ "seq": 105, "time": 11.149, "action": "changeSel", "args": [ 4, 4 ] },
	{ "seq": 106, "time": 11.149, "action": "sendEvent", "args": [ "input", {} ] },
	{ "seq": 107, "time": 11.163, "action": "changeSel", "args": [ 5, 5 ] },
	{ "seq": 108, "time": 11.163, "action": "sendEvent", "args": [ "keyup", { "keyCode": 229 } ] },
	{ "seq": 109, "time": 11.178, "action": "endLoop", "args": [] },
	{ "seq": 110, "time": 11.385, "action": "sendEvent", "args": [ "keydown", { "keyCode": 229 } ] },
	{ "seq": 111, "time": 11.391, "action": "changeSel", "args": [ 4, 5 ] },
	{ "seq": 112, "time": 11.391, "action": "sendEvent", "args": [ "compositionend", {} ] },
	{ "seq": 113, "time": 11.401, "action": "changeSel", "args": [ 4, 4 ] },
	{ "seq": 114, "time": 11.401, "action": "sendEvent", "args": [ "input", {} ] },
	{ "seq": 115, "time": 11.41, "action": "changeSel", "args": [ 5, 5 ] },
	{ "seq": 116, "time": 11.41, "action": "sendEvent", "args": [ "keyup", { "keyCode": 229 } ] },
	{ "seq": 117, "time": 11.42, "action": "sendEvent", "args": [ "keydown", { "keyCode": 229 } ] },
	{ "seq": 118, "time": 11.425, "action": "sendEvent", "args": [ "keyup", { "keyCode": 229 } ] },
	{ "seq": 119, "time": 11.431, "action": "sendEvent", "args": [ "keydown", { "keyCode": 229 } ] },
	{ "seq": 120, "time": 11.436, "action": "changeText", "args": [ "한글 시험&nbsp;" ] },
	{ "seq": 121, "time": 11.436, "action": "sendEvent", "args": [ "input", {} ] },
	{ "seq": 122, "time": 11.454, "action": "changeSel", "args": [ 6, 6 ] },
	{ "seq": 123, "time": 11.454, "action": "endLoop", "args": [] },
	{ "seq": 124, "time": 11.5, "action": "sendEvent", "args": [ "keyup", { "keyCode": 32 } ] },
	{ "seq": 125, "time": 11.511, "action": "endLoop", "args": [] },
	{ "seq": 126, "time": 11.85, "action": "sendEvent", "args": [ "keydown", { "keyCode": 229 } ] },
	{ "seq": 127, "time": 11.856, "action": "sendEvent", "args": [ "compositionstart", {} ] },
	{ "seq": 128, "time": 11.861, "action": "changeText", "args": [ "한글 시험 ㅎ" ] },
	{ "seq": 129, "time": 11.861, "action": "changeSel", "args": [ 5, 5 ] },
	{ "seq": 130, "time": 11.861, "action": "sendEvent", "args": [ "input", {} ] },
	{ "seq": 131, "time": 11.876, "action": "changeSel", "args": [ 7, 7 ] },
	{ "seq": 132, "time": 11.876, "action": "sendEvent", "args": [ "keyup", { "keyCode": 229 } ] },
	{ "seq": 133, "time": 11.896, "action": "endLoop", "args": [] },
	{ "seq": 134, "time": 12.015, "action": "sendEvent", "args": [ "keydown", { "keyCode": 229 } ] },
	{ "seq": 135, "time": 12.022, "action": "changeText", "args": [ "한글 시험 하" ] },
	{ "seq": 136, "time": 12.022, "action": "changeSel", "args": [ 6, 6 ] },
	{ "seq": 137, "time": 12.022, "action": "sendEvent", "args": [ "input", {} ] },
	{ "seq": 138, "time": 12.037, "action": "changeSel", "args": [ 7, 7 ] },
	{ "seq": 139, "time": 12.037, "action": "sendEvent", "args": [ "keyup", { "keyCode": 229 } ] },
	{ "seq": 140, "time": 12.06, "action": "endLoop", "args": [] },
	{ "seq": 141, "time": 12.224, "action": "sendEvent", "args": [ "keydown", { "keyCode": 229 } ] },
	{ "seq": 142, "time": 12.233, "action": "changeText", "args": [ "한글 시험 합" ] },
	{ "seq": 143, "time": 12.233, "action": "changeSel", "args": [ 6, 6 ] },
	{ "seq": 144, "time": 12.233, "action": "sendEvent", "args": [ "input", {} ] },
	{ "seq": 145, "time": 12.249, "action": "changeSel", "args": [ 7, 7 ] },
	{ "seq": 146, "time": 12.249, "action": "sendEvent", "args": [ "keyup", { "keyCode": 229 } ] },
	{ "seq": 147, "time": 12.267, "action": "endLoop", "args": [] },
	{ "seq": 148, "time": 12.51, "action": "sendEvent", "args": [ "keydown", { "keyCode": 229 } ] },
	{ "seq": 149, "time": 12.517, "action": "changeSel", "args": [ 6, 7 ] },
	{ "seq": 150, "time": 12.517, "action": "sendEvent", "args": [ "compositionend", {} ] },
	{ "seq": 151, "time": 12.529, "action": "changeSel", "args": [ 6, 6 ] },
	{ "seq": 152, "time": 12.529, "action": "sendEvent", "args": [ "input", {} ] },
	{ "seq": 153, "time": 12.541, "action": "changeSel", "args": [ 7, 7 ] },
	{ "seq": 154, "time": 12.541, "action": "sendEvent", "args": [ "keyup", { "keyCode": 229 } ] },
	{ "seq": 155, "time": 12.553, "action": "sendEvent", "args": [ "keydown", { "keyCode": 229 } ] },
	{ "seq": 156, "time": 12.559, "action": "sendEvent", "args": [ "compositionstart", {} ] },
	{ "seq": 157, "time": 12.568, "action": "changeText", "args": [ "한글 시험 합ㄴ" ] },
	{ "seq": 158, "time": 12.568, "action": "sendEvent", "args": [ "input", {} ] },
	{ "seq": 159, "time": 12.58, "action": "changeSel", "args": [ 8, 8 ] },
	{ "seq": 160, "time": 12.58, "action": "sendEvent", "args": [ "keyup", { "keyCode": 229 } ] },
	{ "seq": 161, "time": 12.601, "action": "endLoop", "args": [] },
	{ "seq": 162, "time": 12.699, "action": "sendEvent", "args": [ "keydown", { "keyCode": 229 } ] },
	{ "seq": 163, "time": 12.709, "action": "changeText", "args": [ "한글 시험 합니" ] },
	{ "seq": 164, "time": 12.709, "action": "changeSel", "args": [ 7, 7 ] },
	{ "seq": 165, "time": 12.709, "action": "sendEvent", "args": [ "input", {} ] },
	{ "seq": 166, "time": 12.727, "action": "changeSel", "args": [ 8, 8 ] },
	{ "seq": 167, "time": 12.727, "action": "sendEvent", "args": [ "keyup", { "keyCode": 229 } ] },
	{ "seq": 168, "time": 12.746, "action": "endLoop", "args": [] },
	{ "seq": 169, "time": 12.907, "action": "sendEvent", "args": [ "keydown", { "keyCode": 229 } ] },
	{ "seq": 170, "time": 12.917, "action": "changeText", "args": [ "한글 시험 합닏" ] },
	{ "seq": 171, "time": 12.917, "action": "changeSel", "args": [ 7, 7 ] },
	{ "seq": 172, "time": 12.917, "action": "sendEvent", "args": [ "input", {} ] },
	{ "seq": 173, "time": 12.936, "action": "changeSel", "args": [ 8, 8 ] },
	{ "seq": 174, "time": 12.936, "action": "sendEvent", "args": [ "keyup", { "keyCode": 229 } ] },
	{ "seq": 175, "time": 12.955, "action": "endLoop", "args": [] },
	{ "seq": 176, "time": 13.035, "action": "sendEvent", "args": [ "keydown", { "keyCode": 229 } ] },
	{ "seq": 177, "time": 13.043, "action": "changeSel", "args": [ 7, 8 ] },
	{ "seq": 178, "time": 13.043, "action": "sendEvent", "args": [ "compositionend", {} ] },
	{ "seq": 179, "time": 13.058, "action": "changeText", "args": [ "한글 시험 합니" ] },
	{ "seq": 180, "time": 13.058, "action": "changeSel", "args": [ 7, 7 ] },
	{ "seq": 181, "time": 13.058, "action": "sendEvent", "args": [ "input", {} ] },
	{ "seq": 182, "time": 13.078, "action": "changeSel", "args": [ 8, 8 ] },
	{ "seq": 183, "time": 13.078, "action": "sendEvent", "args": [ "keyup", { "keyCode": 229 } ] },
	{ "seq": 184, "time": 13.091, "action": "sendEvent", "args": [ "keydown", { "keyCode": 229 } ] },
	{ "seq": 185, "time": 13.098, "action": "sendEvent", "args": [ "compositionstart", {} ] },
	{ "seq": 186, "time": 13.108, "action": "changeText", "args": [ "한글 시험 합니다" ] },
	{ "seq": 187, "time": 13.108, "action": "sendEvent", "args": [ "input", {} ] },
	{ "seq": 188, "time": 13.122, "action": "changeSel", "args": [ 9, 9 ] },
	{ "seq": 189, "time": 13.122, "action": "sendEvent", "args": [ "keyup", { "keyCode": 229 } ] },
	{ "seq": 190, "time": 13.143, "action": "endLoop", "args": [] }
] ] );
