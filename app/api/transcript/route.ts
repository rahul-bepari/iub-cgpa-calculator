import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

function parseIUBTranscript(text: string) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const courses: any[] = [];
  let currentSemester = '';
  const semesters: string[] = [];

  const nameMatch = text.match(/Name:\s*([^\n]+)/);
  const idMatch = text.match(/ID:\s*(\d+)/);
  const majorMatch = text.match(/Major\(s\):\s*([^\n]+)/);
  const cgpaMatch = text.match(/Cumulative GPA\s*:\s*([\d.]+)/);
  const totalEarnedMatch = text.match(/Total Credits Earned\s*:\s*([\d.]+)/);
  const totalAttemptedMatch = text.match(/Total Credits Attempted\s*:\s*([\d.]+)/);
  const totalGPMatch = text.match(/Total Grade Point\s*:\s*([\d.]+)/);

  const semesterPattern = /^(SPRING|SUMMER[\s\d]*|AUTUMN)\s+\d{4}$/i;
  const gradePattern = /^(A-?|B[+-]?|C[+-]?|D[+-]?|F|W|I)$/;
  const typePattern = /^(T|R)$/;

  for (const line of lines) {
    if (semesterPattern.test(line)) {
      currentSemester = line.trim();
      if (!semesters.includes(currentSemester)) semesters.push(currentSemester);
      continue;
    }

    const parts = line.split(/\s+/);
    if (parts.length < 6) continue;
    if (!/^[A-Z]{2,6}\d{3}L?$/.test(parts[0])) continue;

    const nums: number[] = [];
    for (let j = parts.length - 1; j >= 0 && nums.length < 4; j--) {
      if (/^\d+\.?\d*$/.test(parts[j])) {
        nums.unshift(parseFloat(parts[j]));
      } else break;
    }
    if (nums.length < 4) continue;

    const numStartIdx = parts.length - nums.length;
    const gradeIdx = numStartIdx - 1;
    const grade = parts[gradeIdx] || '';

    if (!gradePattern.test(grade) && grade !== 'W') continue;

    let courseType = 'regular';
    let titleEnd = gradeIdx;
    if (gradeIdx > 1 && typePattern.test(parts[gradeIdx - 1])) {
      courseType = parts[gradeIdx - 1] === 'R' ? 'retake' : 'transfer';
      titleEnd = gradeIdx - 1;
    }

    const title = parts.slice(1, titleEnd).join(' ');
    if (!title || !currentSemester) continue;

    courses.push({
      course_code: parts[0],
      course_title: title,
      course_type: courseType,
      grade,
      credit: nums[0],
      credit_earned: nums[1],
      grade_point: nums[3],
      semester: currentSemester,
    });
  }

  return {
    student_name: nameMatch?.[1]?.trim() || '',
    student_id: idMatch?.[1]?.trim() || '',
    major: majorMatch?.[1]?.trim() || '',
    cgpa: parseFloat(cgpaMatch?.[1] || '0'),
    total_credits_earned: parseFloat(totalEarnedMatch?.[1] || '0'),
    total_credits_attempted: parseFloat(totalAttemptedMatch?.[1] || '0'),
    total_grade_points: parseFloat(totalGPMatch?.[1] || '0'),
    semesters,
    courses,
  };
}

export async function POST(req: NextRequest) {
  let tmpPath = '';
  try {
    const formData = await req.formData();
    const file = formData.get('transcript') as File;
    if (!file) return NextResponse.json({ success: false, error: 'No file uploaded' });

    const buffer = Buffer.from(await file.arrayBuffer());

    // Save to temp file
    tmpPath = join(tmpdir(), `transcript_${Date.now()}.pdf`);
    await writeFile(tmpPath, buffer);

    // Use pdf2json
    const PDFParser = (await import('pdf2json')).default;
    
    const text = await new Promise<string>((resolve, reject) => {
      const parser = new PDFParser(null, true);
      
      parser.on('pdfParser_dataReady', (data: any) => {
        try {
          const pages = data?.Pages || [];
          let fullText = '';
          for (const page of pages) {
            const texts = page?.Texts || [];
            let lineMap: Record<number, string[]> = {};
            for (const t of texts) {
              const y = Math.round(t.y * 10);
              const str = decodeURIComponent(t.R?.[0]?.T || '');
              if (!lineMap[y]) lineMap[y] = [];
              lineMap[y].push(str);
            }
            const sortedYs = Object.keys(lineMap).map(Number).sort((a, b) => a - b);
            for (const y of sortedYs) {
              fullText += lineMap[y].join(' ') + '\n';
            }
          }
          resolve(fullText);
        } catch (e) {
          reject(e);
        }
      });

      parser.on('pdfParser_dataError', (err: any) => {
        reject(new Error(err?.parserError || 'PDF parse failed'));
      });

      parser.loadPDF(tmpPath);
    });

    const parsed = parseIUBTranscript(text);

    if (parsed.courses.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No courses found. Please upload your official IUB transcript PDF.',
      });
    }

    return NextResponse.json({ success: true, ...parsed });

  } catch (err: any) {
    console.error('Transcript error:', err);
    return NextResponse.json({ success: false, error: 'Failed to read PDF: ' + err.message });
  } finally {
    if (tmpPath) {
      try { await unlink(tmpPath); } catch {}
    }
  }
}