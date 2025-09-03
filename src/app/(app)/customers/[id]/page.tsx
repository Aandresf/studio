import React from 'react';
import CustomerDetailClient from './CustomerDetailClient';

export default function Page({ params }: { params: { id: string } }) {
  return <CustomerDetailClient id={params.id} />;
}
// This page must be rendered dynamically to avoid bundling native sqlite3 into the frontend
export const dynamic = 'force-dynamic';

// Provide an empty generateStaticParams so exports that expect it won't fail,
// but with `dynamic = 'force-dynamic'` Next will not require pre-rendered params.
export async function generateStaticParams() {
  return [];
}
