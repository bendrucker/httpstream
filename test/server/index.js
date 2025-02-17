var express = require('express')
var fs = require('fs')
var http = require('http')
var path = require('path')
var url = require('url')

var app = express()
var server = http.createServer(app)

// app.use(function (req, res, next) {
//   res.header('Access-Control-Allow-Origin', '*')

//   next()
// })

// Otherwise, use 'application/octet-stream'
var copiesMimeTypes = {
	'/basic.txt': 'text/plain'
}

var maxDelay = 5000 // ms

app.use(function (req, res, next) {
	var parsed = url.parse(req.url, true)

	if ('copies' in parsed.query) {
		var totalCopies = parseInt(parsed.query.copies, 10)
		function fail () {
			res.statusCode = 500
			res.end()
		}
		fs.readFile(path.join(__dirname, 'static', parsed.pathname), function (err, data) {
			if (err)
				return fail()

			var mimeType = copiesMimeTypes[parsed.pathname] || 'application/octet-stream'
			res.setHeader('Content-Type', mimeType)
			res.setHeader('Content-Length', data.length * totalCopies)
			var pieceDelay = maxDelay / totalCopies
			if (pieceDelay > 100)
				pieceDelay = 100

			function write (copies) {
				if (copies === 0) 
					return res.end()

				res.write(data, function (err) {
					if (err)
						return fail()
					setTimeout(write.bind(null, copies - 1), pieceDelay)
				})
			}
			write(totalCopies)
		})
		return
	}
	next()
})

app.use(express.static(path.join(__dirname, 'static')))

var port = parseInt(process.env.ZUUL_PORT) || 8199
console.log('server listening on port', port)
server.listen(port)
