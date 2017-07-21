const data = require('./test.json')
const parse = require('./parser')
const parsedData = parse(data)
console.log(JSON.stringify(parsedData, null, 2))
