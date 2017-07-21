const parseClasses = cls => {
  const {course_name} = cls
  const [department, course] = course_name.split(/ +/)
  return {
    year_term: cls.year_term,
    department,
    course,
    course_title: cls.course_description,
    grade: cls.grade,
    credits: cls.credit_hours
  }
}

const parseCollege = college => {
  return {
    college: college.college_code,
    college_description: college.college_name,
    start_month: college.start + '01',
    end_month: college.end + '12',
    college_gpa: college.gpa,
    credit_hours_graded: college.graded_hours,
    grade_points_earned: college.earned_hour,
    completed_course_list: college.tranClasses.map(parseClasses)
  }
}

module.exports = api => {
  const {response} = api.StdCourseWorkService
  const {byu_id, dataTransfer: collegeList} = response
  const byuId = byu_id.replace(/-/g, '')
  return collegeList.map(parseCollege).map(c => Object.assign({}, {applicant_id: byuId}, c))
}
