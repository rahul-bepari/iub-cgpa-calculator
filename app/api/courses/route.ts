import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import pool from '@/lib/db';

function getUserId(req: NextRequest): number | null {
  const auth = req.headers.get('authorization');
  if (!auth) return null;
  try {
    const token = auth.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    return decoded.userId;
  } catch { return null; }
}

// GET - fetch all courses for user
export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' });

  const result = await pool.query(
    'SELECT * FROM courses WHERE user_id = $1 ORDER BY semester, course_code',
    [userId]
  );
  return NextResponse.json({ success: true, courses: result.rows });
}

// POST - add new course or save transcript courses
export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' });

  const body = await req.json();

  // Bulk save from transcript
if (body.courses && Array.isArray(body.courses)) {
  await pool.query('DELETE FROM courses WHERE user_id = $1', [userId]);
  
  for (const c of body.courses) {
    await pool.query(
      `INSERT INTO courses
        (user_id, course_code, course_title, grade, credit, credit_earned, grade_point, semester, course_type)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [userId, c.course_code, c.course_title, c.grade, c.credit,
       c.credit_earned, c.grade_point, c.semester, c.course_type || 'regular']
    );
  }

  if (body.summary) {
    await pool.query(`DELETE FROM transcripts WHERE user_id = $1`, [userId]);
    await pool.query(
      `INSERT INTO transcripts (user_id, total_credits_attempted, total_credits_earned, total_grade_points, cgpa)
       VALUES ($1,$2,$3,$4,$5)`,
      [userId, body.summary.total_credits_attempted, body.summary.total_credits_earned,
       body.summary.total_grade_points, body.summary.cgpa]
    );
  }
  return NextResponse.json({ success: true, message: 'Transcript saved!' });
}

  // Add single new course
  const { course_code, course_title, grade, credit, semester } = body;
  const gradePoints: Record<string, number> = {
    'A': 4.00, 'A-': 3.70, 'B+': 3.30, 'B': 3.00, 'B-': 2.70,
    'C+': 2.30, 'C': 2.00, 'C-': 1.70, 'D+': 1.30, 'D': 1.00, 'F': 0.00,
  };
  const gp = (gradePoints[grade] || 0) * parseFloat(credit);
  const creditEarned = grade === 'F' ? 0 : parseFloat(credit);

  await pool.query(
    `INSERT INTO courses (user_id, course_code, course_title, grade, credit, credit_earned, grade_point, semester, course_type)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'new')`,
    [userId, course_code, course_title, grade, credit, creditEarned, gp, semester]
  );

  return NextResponse.json({ success: true, message: 'Course added!' });
}

// PUT - retake a course (update grade)
export async function PUT(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' });

  const { course_code, new_grade } = await req.json();
  const gradePoints: Record<string, number> = {
    'A': 4.00, 'A-': 3.70, 'B+': 3.30, 'B': 3.00, 'B-': 2.70,
    'C+': 2.30, 'C': 2.00, 'C-': 1.70, 'D+': 1.30, 'D': 1.00, 'F': 0.00,
  };

  // Get the course credit
  const courseRes = await pool.query(
    'SELECT credit FROM courses WHERE user_id = $1 AND course_code = $2 AND credit_earned > 0 LIMIT 1',
    [userId, course_code]
  );
  if (courseRes.rows.length === 0) {
    return NextResponse.json({ success: false, error: 'Course not found' });
  }

  const credit = parseFloat(courseRes.rows[0].credit);
  const newGP = (gradePoints[new_grade] || 0) * credit;

  await pool.query(
    `UPDATE courses SET grade = $1, grade_point = $2, credit_earned = $3, course_type = 'retake'
     WHERE user_id = $4 AND course_code = $5 AND credit_earned > 0`,
    [new_grade, newGP, credit, userId, course_code]
  );

  return NextResponse.json({ success: true, message: 'Grade updated!' });
}
// DELETE - remove a course
export async function DELETE(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' });

  const { course_code } = await req.json();
  
  await pool.query(
    'DELETE FROM courses WHERE user_id = $1 AND course_code = $2',
    [userId, course_code]
  );

  return NextResponse.json({ success: true, message: 'Course removed!' });
}