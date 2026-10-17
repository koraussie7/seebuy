'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function ErrorPage({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('App error:', error);
    }, [error]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
            <h1 className="text-4xl font-extrabold text-gray-900">문제가 발생했습니다</h1>
            <p className="mt-4 text-gray-600 text-sm">
                {error.message || '일시적인 오류입니다. 다시 시도해 주세요.'}
            </p>
            <div className="mt-6 flex gap-3">
                <button
                    onClick={reset}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md text-sm font-medium transition-colors"
                >
                    다시 시도
                </button>
                <Link
                    href="/dashboard"
                    className="bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 px-6 py-2 rounded-md text-sm font-medium transition-colors"
                >
                    대시보드로
                </Link>
            </div>
        </div>
    );
}
