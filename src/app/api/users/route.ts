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
    const employeeId = searchParams.get('employeeId');
    const role = searchParams.get('role');
    const workLocationsParam = searchParams.get('workLocations');

    // Convert workLocations from comma-separated string to array
    const workLocations = workLocationsParam ? workLocationsParam.split(',') : [];

    let query = supabase.from('User').select('*');

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

    if (role) {
      query = query.eq('role', role);
    }

    if (workLocations.length > 0) {
      query = query.overlaps('workLocationId', workLocations);
    }

    const { data: users, error: userError } = await query;

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }

    return NextResponse.json(users);

  } catch (error) {
    return handleError(error, 'Internal server error');
  }
}


export async function PUT(request: NextRequest) {
  try {
    const user = await request.json();

    const { id, ...fieldsToUpdate } = user;

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('User')
      .update(fieldsToUpdate)
      .eq('id', id);

    if (error) {
      console.log(error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'User updated successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
