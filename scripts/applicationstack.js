const exec = require('child_process').exec;
const fs = require('fs');

const here=process.cwd();

//You can optionally specify update-stack from the command line
const awsCommand = process.argv[2] || "create-stack";

const homedir = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;

const config=JSON.parse(fs.readFileSync(`${homedir}/.college-summary-config.json`, 'UTF-8'));

const parms = [
  {
    ParameterKey: 'ConfigStackName',
    ParameterValue: 'SharedAdmissionsCollegeSummaryConfigStack'
  },
  {
    ParameterKey: 'SummaryTableName',
    ParameterValue: config.summaryTableName
  },
  {
    ParameterKey: 'CacheTableName',
    ParameterValue: config.cacheTableName
  }
];

function puts(error, stdout, stderr) {
  if(error) {
    console.log(stderr);
    process.exit(1);
  }
  console.log(stdout);
}

function buildCommand(config, parms) {
  const parts = [
    `aws cloudformation ${awsCommand}`,
    '--stack-name',
    'SharedAdmissionsCollegeSummaryApplicationStack',
    '--template-body',
    `file://${here}/application-cf.yaml`,
    '--capabilities',
    'CAPABILITY_IAM',
    '--parameters'
  ];
  const parameters = parms.map( p => `ParameterKey=${p.ParameterKey},ParameterValue=${p.ParameterValue}` );
  return parts.concat(parameters).join(' ');
}

const command = buildCommand(config, parms);

console.log(command);

exec(command, puts);

