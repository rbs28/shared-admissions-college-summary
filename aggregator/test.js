'use strict'
const test = require('tape')

const {validator, validateKey, validateFullKey} = require('./validator')

// const logErrors = (errors) => console.log(errors.map(e => e.stack))

const buildObject = (...objects) => Object.assign({}, ...objects)

const baseProps = {
  applicant_id: '12345',
  college: 'UVU',
  college_description: 'Utah Valley University'
}

const monthPropsValid = {
  start_month: '2016-01',
  end_month: '2017-01'
}

const monthPropsInvalid = {
  start_month: '2016-00',
  end_month: '207-01'
}

const otherPropsValid = {
  college_gpa: '3.75',
  credit_hours_graded: 45,
  grade_points_earned: 95.5,
  date_time_verified: '2017-02-03T14:31:21.04Z'
}

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
}

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
}

const courseListPropsIncomplete = {
  completed_course_list: [
    {
      department: 'English',
      course: '101'
    }
  ]
}

test('Start and End Month', assert => {
  {
    const actual = validator(buildObject(baseProps, monthPropsValid)).valid
    const expected = true
    assert.equal(actual, expected, 'valid months validate true')
  }

  {
    const actual = validator(buildObject(baseProps, monthPropsInvalid)).errors.length
    const expected = 2
    assert.equal(actual, expected, '2 invalid months rejected')
  }

  assert.end()
})

test('Non key properties', assert => {
  {
    const actual = validator(buildObject(baseProps, monthPropsValid, otherPropsValid)).valid
    const expected = true
    assert.equal(actual, expected, 'valid properties')
  }

  {
    const obj = buildObject(baseProps, monthPropsValid, otherPropsValid, {date_time_verified: 'NotAValidDate'})
    const actual = validator(obj).errors.length
    const expected = 1
    assert.equal(actual, expected, 'invalid date_time_verified')
  }

  assert.test('GPA', assert => {
    {
      const obj = buildObject(baseProps, monthPropsValid, otherPropsValid, {college_gpa: '5.0'})
      const actual = validator(obj).errors.length
      const expected = 1
      assert.equal(actual, expected, 'Max gpa is 4.0')
    }
    {
      const obj = buildObject(baseProps, monthPropsValid, otherPropsValid, {college_gpa: '3.125'})
      const actual = validator(obj).errors.length
      const expected = 1
      assert.equal(actual, expected, 'gpa precision only to hundredths')
    }
    {
      const obj = buildObject(baseProps, monthPropsValid, otherPropsValid, {college_gpa: '4.25'})
      const actual = validator(obj).errors.length
      const expected = 1
      assert.equal(actual, expected, 'Max gpa is 4.0')
    }
    assert.end()
  })

  assert.test('Grade Points Earned', assert => {
    {
      const obj = buildObject(baseProps, monthPropsValid, otherPropsValid, {grade_points_earned: 'notANumber'})
      const actual = validator(obj).errors.length
      const expected = 1
      assert.equal(actual, expected, 'grade points earned is a number')
    }
    {
      const obj = buildObject(baseProps, monthPropsValid, otherPropsValid, {grade_points_earned: 9001})
      const actual = validator(obj).errors.length
      const expected = 1
      assert.equal(actual, expected, 'grade points earned is between 0 and 1000')
    }
    assert.end()
  })

  {
    const actual = validator(buildObject(otherPropsValid)).valid
    const expected = false
    assert.equal(actual, expected, 'reject if missing required properties')
  }

  {
    const obj = buildObject(baseProps, monthPropsValid, otherPropsValid, {updated_by_id: 'shouldNotBeSpecified'})
    const actual = validator(obj).valid
    const expected = false
    assert.equal(actual, expected, 'reject if an unrecognized property is found')
  }

  assert.end()
})

test('Course List', assert => {
  {
    const obj = buildObject(baseProps, monthPropsValid, courseListPropsValid)
    const actual = validator(obj).valid
    const expected = true
    assert.equal(actual, expected, 'valid course list accepted')
  }
  {
    const obj = buildObject(baseProps, monthPropsValid, courseListPropsInvalid)
    const actual = validator(obj).errors.length
    const expected = 5
    assert.equal(actual, expected, 'Reject invalid course list properties')
  }
  {
    const obj = buildObject(baseProps, monthPropsValid, courseListPropsIncomplete)
    const actual = validator(obj).valid
    const expected = false
    assert.equal(actual, expected, 'Reject if missing required course list properties')
  }

  assert.end()
})

test('Key validation', assert => {
  {
    const obj = buildObject(baseProps)
    const actual = validateKey(obj).errors.length
    const expected = 0
    assert.equal(actual, expected, 'partial key')
  }
  {
    const obj = buildObject(baseProps, monthPropsValid)
    const actual = validateFullKey(obj).errors.length
    const expected = 0
    assert.equal(actual, expected, 'full key')
  }
  {
    const obj = buildObject(baseProps, monthPropsInvalid)
    const actual = validateFullKey(obj).errors.length
    const expected = 2
    assert.equal(actual, expected, 'reject invalid full key')
  }
  {
    const obj = buildObject({applicant_id: '12345'})
    const actual = validateKey(obj).errors.length
    const expected = 0
    assert.equal(actual, expected, 'id only is valid partial key')
  }
  {
    const obj = buildObject({applicant_id: '12345'})
    const actual = validateFullKey(obj).valid
    const expected = false
    assert.equal(actual, expected, 'full key requires all properties')
  }
  assert.end()
})
