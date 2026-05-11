import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { student_id, name, email, department, password } = await req.json();

    if (!student_id || !name || !password || !department) {
      return NextResponse.json({
        success: false,
        error: 'Please fill in all required fields.'
      });
    }

    // Check if student ID already exists
    const existing = await pool.query(
      'SELECT id FROM users WHERE student_id = $1',
      [student_id]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'This Student ID is already registered.'
      });
    }

    const password_hash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO users (student_id, name, email, department, password_hash)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, student_id, name, department`,
      [student_id, name, email || '', department, password_hash]
    );

    return NextResponse.json({
      success: true,
      user: result.rows[0],
      message: 'Account created successfully!'
    });

  } catch (err: any) {
    console.error('Register error:', err);
    return NextResponse.json({
      success: false,
      error: 'Registration failed. Please try again.'
    });
  }
}