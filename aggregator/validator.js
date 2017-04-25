'use strict';

const Validator = require('jsonschema').Validator;

Validator.prototype.customFormats.dateTime = (str) => {
  if(typeof str === 'undefined') return true;
  const dt = Date.parse(str);
  return !Number.isNaN(dt);
};

Validator.prototype.customFormats.yearMonth = (str) => {
  if(typeof str === 'undefined') return true;
  return /^[1-2][0-9]{3}-((1[0-2])|(0[1-9]))$/.test(str);
};

Validator.prototype.customFormats.gpa = (str) => {
  if(typeof str === 'undefined') return true;
  if(!/^[0-4]\.[0-9]{2}$/.test(str)) return false;
  const asNum = Number.parseFloat(str);
  return !Number.isNaN(asNum) && asNum >= 0 && asNum < 4.001;
};
 
const v = new Validator();

// Address, to be embedded on Person 
const collegeSummarySchema = {
  "type": "object",
  "properties": {
    "applicant_id": {"type": "string"},
    "college": {"type": "string"},
    "college_description": {"type": "string"},
    "start_month": {"type": "string", "format": "yearMonth"},
    "end_month": {"type": "string", "format": "yearMonth"},
    "college_gpa": {"type": "string", "format": "gpa"},
    "credit_hours_graded": {"type": "number", "minimum": 0, "maximum": 1000},
    "grade_points_earned": {"type": "number", "minimum": 0, "maximum": 1000},
    "date_time_verified": {"type": "string", "format": "dateTime"}
  },
  "additionalProperties": false
};

const requiredFields = {"required": ["applicant_id", "college", "college_description", "start_month", "end_month"]};

module.exports.validator = (obj) => v.validate(obj, Object.assign({}, collegeSummarySchema, requiredFields));
module.exports.validateKey = (obj) => v.validate(obj, collegeSummarySchema);
