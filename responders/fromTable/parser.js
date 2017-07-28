const _ = require('lodash')

const parseClasses = cls => {
  return {
    year_term: cls.year_term,
    department: cls.dept_name,
    course: cls.catalog_number,
    course_title: cls.course_description,
    grade: cls.grade,
    credits: cls.credit_hours
  }
}

const parseCollege = college => {
  const startMonth = college.attended_from.replace(/(\d{2})\/(\d{4})/, '$2-$1')
  const endMonth = college.attended_to.replace(/(\d{2})\/(\d{4})/, '$2-$1')
  return {
    college: college.college_code,
    college_description: college.college_name_long,
    start_month: startMonth,
    end_month: endMonth,
    college_gpa: college.gpa,
    credit_hours_graded: college.graded_credits,
    grade_points_earned: college.earned_credits,
    completed_course_list: college.classes.map(parseClasses)
  }
}

module.exports = api => {
  const response = _.get(api, 'StdTransferWorkService.response', false)
  if (!response) {
    return []
  }
  const byuId = _.get(response, 'byu_id', '').replace(/-/g, '')
  const collegeList = _.get(response, 'college_list', [])
  return collegeList.map(parseCollege).map(c => Object.assign({}, {applicant_id: byuId}, c))
}
