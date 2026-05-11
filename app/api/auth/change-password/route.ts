import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization');
    if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' });

    const token = auth.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;

    const { current_password, new_password } = await req.json();

    if (!current_password || !new_password) {
      return NextResponse.json({ success: false, error: 'Please fill in all fields.' });
    }
    if (new_password.length < 6) {
      return NextResponse.json({ success: false, error: 'New password must be at least 6 characters.' });
    }

    // Get user
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.userId]);
    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'User not found.' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(current_password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ success: false, error: 'Current password is incorrect.' });
    }

    const new_hash = await bcrypt.hash(new_password, 12);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [new_hash, decoded.userId]);

    return NextResponse.json({ success: true, message: 'Password changed successfully!' });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: 'Something went wrong.' });
  }
}