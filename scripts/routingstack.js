const exec = require('child_process').exec;
const fs = require('fs');
const AWS = require('aws-sdk');
const async = require('async');

AWS.config.update({region: 'us-west-2'});

const CF = new AWS.CloudFormation();
const EB = new AWS.ElasticBeanstalk();

const here=process.cwd();

//You can optionally specify update-stack from the command line
const awsCommand = process.argv[2] || "create-stack";

const homedir = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;

const config=JSON.parse(fs.readFileSync(`${homedir}/.college-summary-config.json`, 'UTF-8'));

const getCNAME = function(cb) {
  const descRes = function(next) {
    const parms = {
      StackName: 'SharedAdmissionsCollegeSummaryAggregatorStack',
      LogicalResourceId: 'AggregatorEnvironment'
    };
    CF.describeStackResource(parms, next);
  };

  const parsePhysId = function(data, next) {
    next(null, data.StackResourceDetail.PhysicalResourceId);
  };

  const descEnv = function(envId, next) {
    const parms = {
      EnvironmentNames: [
        envId
      ]
    };
    EB.describeEnvironments(parms, next);
  };

  const parseCname = function(data, next) {
    next(null, data.Environments.map(e => e.CNAME).find(i => !!i));
  };

  async.waterfall([
    descRes,
    parsePhysId,
    descEnv,
    parseCname
  ], (err, data) => {
    if(err) {
      console.error('Error getting cname!', err, err.stack);
      process.exit(1);
    }

    const parms = [
      {
        ParameterKey: 'AggregatorStackName',
        ParameterValue: 'SharedAdmissionsCollegeSummaryAggregatorStack'
      },
      {
        ParameterKey: 'AggregatorCNAME',
        ParameterValue: data
      }
    ];

    cb(parms);
  });

};

function puts(error, stdout, stderr) {
  if(error) {
    console.error(stderr);
    process.exit(1);
  }
  console.log(stdout);
}

function buildCommand(config, parms) {
  const parts = [
    `aws cloudformation ${awsCommand}`,
    '--stack-name',
    'SharedAdmissionsCollegeSummaryRoutingStack',
    '--template-body',
    `file://${here}/routing-cf.yaml`,
    '--capabilities',
    'CAPABILITY_IAM',
    '--parameters'
  ];
  const parameters = parms.map( p => `ParameterKey=${p.ParameterKey},ParameterValue=${p.ParameterValue}` );
  return parts.concat(parameters).join(' ');
}

getCNAME( (parms) => {
  const command = buildCommand(config, parms);

  console.log(command);

  exec(command, puts);

});
