import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const handleError = (error: any, message: string) => {
  console.error(message, error);
  return NextResponse.json({ error: message }, { status: 500 });
};

export async function GET(request: NextRequest) {
  try {
    // Extract query parameters from the URL
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const employeeId = searchParams.get('employeeId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query = supabase.from('Attendance').select('*');

    if (employeeId) {
        const employeeNumber = Number(employeeId);
        if (isNaN(employeeNumber)) {
            return NextResponse.json(
            { error: 'Employee ID must be a valid number' },
            { status: 400 }
            );
        }
        query = query.eq('employeeNumber', employeeNumber);
    }
    else{
        query = query.eq('id', userId);
    }

    if (startDate) {
        query = query.gte('checkInTime', startDate);
    }

    if (endDate) {
        query = query.lte('checkInTime', endDate);
    }


    const { data: records, error: userError } = await query;

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }

    return NextResponse.json(records);

  } catch (error) {
    return handleError(error, 'Internal server error');
  }
};

export async function PUT(request: NextRequest) {
  try {
    const record = await request.json();
    const { id, ...fieldsToUpdate } = record;

    if (!id) {
      return NextResponse.json({ error: 'Record ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('Attendance')
      .update(fieldsToUpdate)
      .eq('id', id);

    if (error) {
      console.error(error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Record updated successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
