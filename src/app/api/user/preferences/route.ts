import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { sortByDueDate, hideCompletedUser } = await request.json();

    const cookieStore = cookies();

    if (typeof sortByDueDate === 'boolean') {
      cookieStore.set('preference_sortByDueDate', String(sortByDueDate), {
        path: '/',
        // Not setting maxAge or expires makes it a session cookie
        // HttpOnly is true by default
        sameSite: 'lax',
      });
    }

    if (typeof hideCompletedUser === 'boolean') {
      cookieStore.set('preference_hideCompletedUser', String(hideCompletedUser), {
        path: '/',
        sameSite: 'lax',
      });
    }

    return NextResponse.json({ message: 'Preferences saved' }, { status: 200 });
  } catch (error) {
    console.error('Error saving preferences:', error);
    return NextResponse.json(
      { error: 'Failed to save preferences' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const cookieStore = cookies();
    const sortByDueDateCookie = cookieStore.get('preference_sortByDueDate')?.value;
    const hideCompletedUserCookie = cookieStore.get('preference_hideCompletedUser')?.value;

    // Default preferences if cookies are not set or invalid
    const sortByDueDate = sortByDueDateCookie ? sortByDueDateCookie === 'true' : true;
    const hideCompletedUser = hideCompletedUserCookie ? hideCompletedUserCookie === 'true' : false;

    return NextResponse.json({
      sortByDueDate,
      hideCompletedUser,
    });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}
