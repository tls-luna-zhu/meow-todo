import mongoose from 'mongoose';

declare global {
  // eslint-disable-next-line no-var
  var mongoose: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    conn: any | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    promise: Promise<any> | null;
  };
}

// This export is needed to make this a module
export {}; 