'use strict';

const {validator, validateKey, validateFullKey} = require('./validator');

const logErrors = (errors) => console.log(errors.map(e => e.stack));

const testFn = (expected, ...objects) => {
  const obj = Object.assign({}, ...objects);
  const result = validator(obj);
  if(result.errors.length > 0) {
    logErrors(result.errors);
  }
  return result.valid === expected;
};

const testKeyFn = (expected, ...objects) => {
  const obj = Object.assign({}, ...objects);
  const result = validateKey(obj);
  if(result.errors.length > 0) {
    logErrors(result.errors);
  }
  return result.valid === expected;
};

const testFullKeyFn = (expected, ...objects) => {
  const obj = Object.assign({}, ...objects);
  const result = validateFullKey(obj);
  if(result.errors.length > 0) {
    logErrors(result.errors);
  }
  return result.valid === expected;
};

const baseProps = {
  applicant_id: '12345',
  college: 'UVU',
  college_description: 'Utah Valley University'
};

const monthPropsValid = {
  start_month: '2016-01',
  end_month: '2017-01'
};

const monthPropsInvalid = {
  start_month: '2016-00',
  end_month: '207-01'
};

const otherPropsValid = {
  college_gpa: '3.75',
  credit_hours_graded: 45,
  grade_points_earned: 95.5,
  date_time_verified: '2017-02-03T14:31:21.04Z'
};

const courseListPropsValid = {
  completed_course_list: [
    {
      year_term: '20101',
      department: 'English',
      course: '101',
      course_title: 'Intro to writing',
      grade: 'A',
      credits: 3,
      upper_or_lower_division: 'L',
      basic_or_elective: 'B',
      semester_or_quarter: 'S'
    }
  ]
};

const courseListPropsInvalid = {
  completed_course_list: [
    {
      year_term: '2010-1',
      department: 'English',
      course: '101',
      course_title: 'Intro to writing',
      grade: 'A',
      credits: '14',
      upper_or_lower_division: 'R',
      basic_or_elective: 'Q',
      semester_or_quarter: 'B'
    }
  ]
};

const courseListPropsIncomplete = {
  completed_course_list: [
    {
      department: 'English',
      course: '101',
    }
  ]
};

const validStartEndMonth = () => testFn(true, baseProps, monthPropsValid);

const invalidStartEndMonth = () => testFn(false, baseProps, monthPropsInvalid);

const validProps = () => testFn(true, baseProps, monthPropsValid, otherPropsValid);

const invalidVerifiedDate = () => testFn(false, baseProps, monthPropsValid, otherPropsValid, {date_time_verified: 'NotAValidDate'});

const invalidGpa = () => testFn(false, baseProps, monthPropsValid, otherPropsValid, {college_gpa: '5.0'});
const invalidGpa2 = () => testFn(false, baseProps, monthPropsValid, otherPropsValid, {college_gpa: '3.125'});
const invalidGpa3 = () => testFn(false, baseProps, monthPropsValid, otherPropsValid, {college_gpa: '4.25'});

const invalidHours = () => testFn(false, baseProps, monthPropsValid, otherPropsValid, {grade_points_earned: 'notANumber'});
const invalidHours2 = () => testFn(false, baseProps, monthPropsValid, otherPropsValid, {grade_points_earned: 9001});

const notEnoughProps = () => testFn(false, otherPropsValid);

const extraProps = () => testFn(false, baseProps, monthPropsValid, otherPropsValid, {updated_by_id: 'shouldNotBeSpecified'});

const validCourses = () => testFn(true, baseProps, monthPropsValid, courseListPropsValid);
const invalidCourses = () => testFn(false, baseProps, monthPropsValid, courseListPropsInvalid);
const incompleteCourses = () => testFn(false, baseProps, monthPropsValid, courseListPropsIncomplete);

const validPartialKey = () => testKeyFn(true, baseProps);
const validFullKey = () => testFullKeyFn(true, baseProps, monthPropsValid);
const invalidFullKey = () => testFullKeyFn(false, baseProps, monthPropsInvalid);
const validIdOnly = () => testKeyFn(true, {applicant_id: '12345'});
const incompleteFullKey = () => testFullKeyFn(false, {applicant_id: '12345'});

const runAllTests = () => {
  const allTestsPass = [
    validStartEndMonth,
    invalidStartEndMonth,
    validProps,
    invalidVerifiedDate,
    invalidGpa,
    invalidGpa2,
    invalidGpa3,
    invalidHours,
    invalidHours2,
    notEnoughProps,
    extraProps,
    validCourses,
    invalidCourses,
    incompleteCourses,
    validPartialKey,
    validFullKey,
    invalidFullKey,
    validIdOnly,
    incompleteFullKey,
  ].reduce( (allValid, test) => {
    const valid = test();
    console.log(test.name, '=>', valid ? 'PASS': 'FAIL');
    return allValid && valid;
  }, true);
  if(allTestsPass) {
    console.log("All tests Pass!");
  } else {
    console.error("Test failure!");
    process.exit(1);
  }
};

runAllTests();
