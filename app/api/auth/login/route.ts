import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { student_id, password } = await req.json();

    if (!student_id || !password) {
      return NextResponse.json({
        success: false,
        error: 'Please enter your Student ID and password.'
      });
    }

    const result = await pool.query(
      'SELECT * FROM users WHERE student_id = $1',
      [student_id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Student ID not found. Please register first.'
      });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return NextResponse.json({
        success: false,
        error: 'Incorrect password. Please try again.'
      });
    }

    const token = jwt.sign(
      { userId: user.id, studentId: user.student_id },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        student_id: user.student_id,
        name: user.name,
        department: user.department,
      }
    });

  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json({
      success: false,
      error: 'Login failed. Please try again.'
    });
  }
}