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

// Optional: GET handler if direct client-side cookie reading is not preferred
// For this task, getServerSideProps will read cookies directly.
// export async function GET() {
//   const cookieStore = cookies();
//   const sortByDueDate = cookieStore.get('preference_sortByDueDate')?.value;
//   const hideCompletedUser = cookieStore.get('preference_hideCompletedUser')?.value;

//   return NextResponse.json({
//     sortByDueDate: sortByDueDate ? sortByDueDate === 'true' : undefined,
//     hideCompletedUser: hideCompletedUser ? hideCompletedUser === 'true' : undefined,
//   });
// }
