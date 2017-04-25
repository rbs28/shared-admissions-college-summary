#!/usr/bin/env node

// Reads JSON from stdin and writes equivalent
// nicely-formatted JSON to stdout.

var stdin = process.stdin,
    stdout = process.stdout,
    inputChunks = [];

function formatData(data) {
  var result = {};
  data.StackResources.forEach(i => {
    result[i.LogicalResourceId] = {
      arn: i.PhysicalResourceId
    };
  });
  return result;
}

stdin.setEncoding('utf8');

stdin.on('readable', () => {
    const chunk = stdin.read();
    if(chunk !== null) {
      inputChunks.push(chunk);
    }
});

stdin.on('end', () => {
    var inputJSON = inputChunks.join(),
        parsedData = JSON.parse(inputJSON),
        outputJSON = JSON.stringify(formatData(parsedData), null, '    ');
    stdout.write(outputJSON);
    stdout.write('\n');
});

