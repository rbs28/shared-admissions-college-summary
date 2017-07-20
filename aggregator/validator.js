'use strict'

const Validator = require('jsonschema').Validator

Validator.prototype.customFormats.dateTime = (str) => {
  if (typeof str === 'undefined') return true
  const dt = Date.parse(str)
  return !Number.isNaN(dt)
}

Validator.prototype.customFormats.yearMonth = (str) => {
  if (typeof str === 'undefined') return true
  return /^[1-2][0-9]{3}-((1[0-2])|(0[1-9]))$/.test(str)
}

Validator.prototype.customFormats.yearTerm = (str) => {
  if (typeof str === 'undefined') return true
  return /^[1-2][0-9]{3}[1345]$/.test(str)
}

Validator.prototype.customFormats.gpa = (str) => {
  if (typeof str === 'undefined') return true
  if (!/^[0-4]\.[0-9]{2}$/.test(str)) return false
  const asNum = Number.parseFloat(str)
  return !Number.isNaN(asNum) && asNum >= 0 && asNum < 4.001
}

const v = new Validator()

const courseSchema = {
  'id': '/CompletedCourse',
  'type': 'object',
  'properties': {
    'year_term': {'type': 'string', 'format': 'yearTerm'},
    'department': {'type': 'string'},
    'course': {'type': 'string'},
    'course_title': {'type': 'string'},
    'grade': {'type': 'string'},
    'credits': {'type': 'number', 'minimum': 0, 'maximum': 20},
    'is_repeat': {'type': 'boolean'},
    'basic_or_elective': {'type': 'string', 'pattern': /B|E/},
    'upper_or_lower_division': {'type': 'string', 'pattern': /U|L/},
    'semester_or_quarter': {'type': 'string', 'pattern': /S|Q/}
  },
  'required': ['year_term', 'department', 'course', 'course_title', 'grade', 'credits'],
  'additionalProperties': false
}

const collegeSummarySchema = {
  'type': 'object',
  'properties': {
    'applicant_id': {'type': 'string'},
    'college': {'type': 'string'},
    'college_description': {'type': 'string'},
    'start_month': {'type': 'string', 'format': 'yearMonth'},
    'end_month': {'type': 'string', 'format': 'yearMonth'},
    'college_gpa': {'type': 'string', 'format': 'gpa'},
    'credit_hours_graded': {'type': 'number', 'minimum': 0, 'maximum': 1000},
    'grade_points_earned': {'type': 'number', 'minimum': 0, 'maximum': 1000},
    'date_time_verified': {'type': 'string', 'format': 'dateTime'},
    'completed_course_list': {'type': 'array', 'items': { '$ref': '/CompletedCourse' }}
  },
  'additionalProperties': false
}

const requiredFields = {'required': ['applicant_id', 'college', 'college_description', 'start_month', 'end_month']}
const partialKey = {'required': ['applicant_id']}
const fullKey = {'required': ['applicant_id', 'college', 'start_month', 'end_month']}

v.addSchema(courseSchema, '/CompletedCourse')

module.exports.validator = (obj) => v.validate(obj, Object.assign({}, collegeSummarySchema, requiredFields))
module.exports.validateKey = (obj) => v.validate(obj, Object.assign({}, collegeSummarySchema, partialKey))
module.exports.validateFullKey = (obj) => v.validate(obj, Object.assign({}, collegeSummarySchema, fullKey))
