var Buffer = require('buffer').Buffer
var fs = require('fs');
var test = require('tape')
var UAParser = require('ua-parser-js')

var http = require('../..')

var browser = (new UAParser()).setUA(navigator.userAgent).getBrowser()
var browserName = browser.name
var browserVersion = browser.major
// Binary streaming doesn't work in IE10 or below or in Opera
var skipStreamingCheck = (browserName === 'Opera' ||
	(browserName === 'IE' && browserVersion <= 10))

// Binary data gets corrupted in IE8 or below
var skipVerification = (browserName === 'IE' && browserVersion <= 8)

var COPIES = 8
var MIN_PIECES = 2

var referenceOnce = fs.readFileSync(__dirname + '/../server/static/browserify.png');
var reference = new Buffer(referenceOnce.length * COPIES)
for(var i = 0; i < COPIES; i++) {
	referenceOnce.copy(reference, referenceOnce.length * i)
}

test('binary streaming', function (t) {
	http.get('/browserify.png?copies=' + COPIES, function (res) {
		var buffers = []
		res.on('end', function () {
			if (skipVerification)
				t.skip('binary data not preserved on IE <= 8')
			else
				t.ok(reference.equals(Buffer.concat(buffers)), 'contents match')

			if (skipStreamingCheck)
				t.skip('streaming not available on IE <= 8')
			else
				t.ok(buffers.length >= MIN_PIECES, 'received in multiple parts')
			t.end()
		})

		res.on('data', function (data) {
			buffers.push(data)
		})
	})
})