export const gradeToPoint: Record<string, number> = {
  'A': 4.00, 'A-': 3.70, 'B+': 3.30, 'B': 3.00, 'B-': 2.70,
  'C+': 2.30, 'C': 2.00, 'C-': 1.70, 'D+': 1.30, 'D': 1.00, 'F': 0.00,
};

// Get base course code without L suffix
export function getBaseCode(code: string): string {
  return code.endsWith('L') ? code.slice(0, -1) : code;
}

// Check if a course has a paired lab or theory
export function findPairedCourse(courses: any[], courseCode: string): any | null {
  const base = getBaseCode(courseCode);
  const isLab = courseCode.endsWith('L');
  
  if (isLab) {
    // This is a lab, find the theory
    return courses.find(c => c.course_code === base && Number(c.credit_earned) > 0) || null;
  } else {
    // This is theory, find the lab
    return courses.find(c => c.course_code === courseCode + 'L' && Number(c.credit_earned) > 0) || null;
  }
}

// Get course pair (theory + lab) for a given code
export function getCoursePair(courses: any[], courseCode: string): any[] {
  const base = getBaseCode(courseCode);
  const theory = courses.find(c => c.course_code === base && Number(c.credit_earned) > 0);
  const lab = courses.find(c => c.course_code === base + 'L' && Number(c.credit_earned) > 0);
  
  const result = [];
  if (theory) result.push(theory);
  if (lab) result.push(lab);
  return result;
}